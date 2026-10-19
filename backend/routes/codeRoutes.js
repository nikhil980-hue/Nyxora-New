import express from "express";
import { executeCode } from "../services/codeExecutionService.js";
import { executeWithSelfCorrection } from "../services/codeRepairService.js";

const router = express.Router();

const EXECUTION_ENABLED =
  String(process.env.NYXORA_CODE_EXECUTION_ENABLED || "false")
    .trim()
    .toLowerCase() === "true";

const MAX_REQUEST_CODE_CHARS = 50000;
const MAX_TESTS = 20;

function validateRequestBody(req, res) {
  const { code, tests = [] } = req.body || {};

  if (typeof code !== "string" || !code.trim()) {
    res.status(400).json({
      success: false,
      code: "CODE_REQUIRED",
      message: "code is required.",
    });
    return false;
  }

  if (code.length > MAX_REQUEST_CODE_CHARS) {
    res.status(413).json({
      success: false,
      code: "CODE_TOO_LARGE",
      message: `Code exceeds the ${MAX_REQUEST_CODE_CHARS} character limit.`,
    });
    return false;
  }

  if (!Array.isArray(tests) || tests.length > MAX_TESTS) {
    res.status(400).json({
      success: false,
      code: "INVALID_TESTS",
      message: `tests must be an array with at most ${MAX_TESTS} items.`,
    });
    return false;
  }

  return true;
}

router.post("/execute", async (req, res) => {
  if (!EXECUTION_ENABLED) {
    return res.status(503).json({
      success: false,
      code: "CODE_EXECUTION_DISABLED",
      message:
        "Nyxora code execution is disabled. Set NYXORA_CODE_EXECUTION_ENABLED=true to enable the guarded sandbox.",
    });
  }

  if (!validateRequestBody(req, res)) return;

  try {
    const {
      language = "javascript",
      code,
      tests = [],
      timeoutMs,
    } = req.body;

    const result = await executeCode({
      language,
      code,
      tests,
      timeoutMs,
    });

    return res.status(200).json({
      success: result.success,
      result,
    });
  } catch (error) {
    const status =
      error?.code === "UNSUPPORTED_LANGUAGE" ||
      error?.code === "UNSAFE_CODE"
        ? 400
        : 500;

    console.error(
      "[Nyxora Code Execution] Failed:",
      error?.message || error
    );

    return res.status(status).json({
      success: false,
      code: error?.code || "CODE_EXECUTION_ERROR",
      message: error?.message || "Code execution failed.",
    });
  }
});

router.post("/repair", async (req, res) => {
  if (!EXECUTION_ENABLED) {
    return res.status(503).json({
      success: false,
      code: "CODE_EXECUTION_DISABLED",
      message:
        "Nyxora code execution is disabled. Set NYXORA_CODE_EXECUTION_ENABLED=true to enable self-correction.",
    });
  }

  if (!validateRequestBody(req, res)) return;

  try {
    const {
      code,
      tests = [],
      timeoutMs,
      maxAttempts = 2,
    } = req.body;

    const result = await executeWithSelfCorrection({
      code,
      tests,
      timeoutMs,
      maxAttempts,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "[Nyxora Code Repair] Failed:",
      error?.message || error
    );

    return res.status(500).json({
      success: false,
      code: error?.code || "CODE_REPAIR_ERROR",
      message: error?.message || "Code repair failed.",
    });
  }
});

export default router;
