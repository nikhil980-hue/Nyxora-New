import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_MS = 10000;
const MAX_CODE_CHARS = 50000;
const MAX_TESTS = 20;
const MAX_OUTPUT_CHARS = 100000;

const BLOCKED_PATTERNS = [
  /\bchild_process\b/i,
  /\bworker_threads\b/i,
  /\bcluster\b/i,
  /\bvm\b/i,
  /\bmodule\b/i,
  /\brequire\s*\(/i,
  /\bimport\s+/i,
  /\bprocess\b/i,
  /\bglobalThis\b/i,
  /\bglobal\b/i,
  /\bfetch\s*\(/i,
  /\bWebSocket\b/i,
  /\bnet\b/i,
  /\bhttp\b/i,
  /\bhttps\b/i,
  /\bdgram\b/i,
  /\bfs\b/i,
  /\bfs\/promises\b/i,
  /\beval\s*\(/i,
  /\bFunction\s*\(/i,
  /\bexecSync\b/i,
  /\bspawnSync\b/i,
  /\bexecFileSync\b/i,
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function cleanText(value, max = MAX_CODE_CHARS) {
  return String(value ?? "").slice(0, max);
}

function validateJavaScript(code) {
  const source = cleanText(code);

  if (!source.trim()) {
    throw new Error("Code is required.");
  }

  if (source.length > MAX_CODE_CHARS) {
    throw new Error(`Code exceeds the ${MAX_CODE_CHARS} character limit.`);
  }

  const blocked = BLOCKED_PATTERNS.find((pattern) => pattern.test(source));

  if (blocked) {
    const error = new Error(
      "This execution sandbox blocks filesystem, network, process, module, and child-process access."
    );
    error.code = "UNSAFE_CODE";
    throw error;
  }

  return source;
}

function normalizeTests(tests) {
  if (tests == null) return [];

  if (!Array.isArray(tests)) {
    throw new Error("tests must be an array.");
  }

  if (tests.length > MAX_TESTS) {
    throw new Error(`A maximum of ${MAX_TESTS} tests is allowed.`);
  }

  return tests.map((test, index) => {
    if (typeof test === "string") {
      return {
        name: `Test ${index + 1}`,
        code: validateJavaScript(test),
      };
    }

    if (!test || typeof test !== "object") {
      throw new Error(`Invalid test at index ${index}.`);
    }

    return {
      name: cleanText(test.name || `Test ${index + 1}`, 200),
      code: validateJavaScript(test.code),
    };
  });
}

function buildSource(code, tests) {
  const testBlock = tests.length
    ? `\n\n// NYXORA TESTS\n${tests
        .map(
          (test, index) =>
            `console.log("[TEST ${index + 1}] " + ${JSON.stringify(test.name)});\n${test.code}`
        )
        .join("\n\n")}`
    : "";

  return `${code}${testBlock}\n`;
}

function createSafeEnvironment() {
  return {
    PATH: process.env.PATH || "",
    NODE_ENV: "nyxora-code-sandbox",
  };
}

async function cleanupDirectory(directory) {
  if (!directory) return;

  try {
    await fs.rm(directory, {
      recursive: true,
      force: true,
    });
  } catch {
    // Best-effort cleanup.
  }
}

function runNodeFile({ filePath, cwd, timeoutMs }) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const child = spawn(
      process.execPath,
      [
        "--no-warnings",
        "--max-old-space-size=64",
        filePath,
      ],
      {
        cwd,
        env: createSafeEnvironment(),
        stdio: ["ignore", "pipe", "pipe"],
        detached: process.platform !== "win32",
        windowsHide: true,
      }
    );

    const appendOutput = (target, chunk) => {
      const text = chunk.toString("utf8");
      if (target === "stdout") {
        stdout = (stdout + text).slice(0, MAX_OUTPUT_CHARS);
      } else {
        stderr = (stderr + text).slice(0, MAX_OUTPUT_CHARS);
      }
    };

    child.stdout.on("data", (chunk) => appendOutput("stdout", chunk));
    child.stderr.on("data", (chunk) => appendOutput("stderr", chunk));

    const killChild = () => {
      if (!child.pid) return;

      try {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
            windowsHide: true,
            stdio: "ignore",
          });
        } else {
          process.kill(-child.pid, "SIGKILL");
        }
      } catch {
        try {
          child.kill("SIGKILL");
        } catch {
          // Already exited.
        }
      }
    };

    const timer = setTimeout(() => {
      timedOut = true;
      killChild();
    }, timeoutMs);

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        ...result,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr,
      });
    };

    child.on("error", (error) => {
      finish({
        ok: false,
        timedOut: false,
        exitCode: null,
        signal: null,
        error: error.message,
      });
    });

    child.on("close", (exitCode, signal) => {
      if (timedOut) {
        finish({
          ok: false,
          timedOut: true,
          exitCode,
          signal,
          error: `Execution timed out after ${timeoutMs} ms.`,
        });
        return;
      }

      finish({
        ok: exitCode === 0,
        timedOut: false,
        exitCode,
        signal,
        error: exitCode === 0 ? null : stderr.trim() || `Process exited with code ${exitCode}.`,
      });
    });
  });
}

export async function executeJavaScript({
  code,
  tests = [],
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const safeCode = validateJavaScript(code);
  const safeTests = normalizeTests(tests);
  const safeTimeout = clamp(
    Number(timeoutMs) || DEFAULT_TIMEOUT_MS,
    500,
    MAX_TIMEOUT_MS
  );

  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "nyxora-code-")
  );

  const filePath = path.join(
    directory,
    `${crypto.randomUUID()}.mjs`
  );

  try {
    await fs.writeFile(
      filePath,
      buildSource(safeCode, safeTests),
      {
        encoding: "utf8",
        flag: "wx",
      }
    );

    const result = await runNodeFile({
      filePath,
      cwd: directory,
      timeoutMs: safeTimeout,
    });

    return {
      success: result.ok,
      language: "javascript",
      executed: true,
      timedOut: result.timedOut,
      durationMs: result.durationMs,
      exitCode: result.exitCode,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error,
      tests: safeTests.map((test, index) => ({
        index: index + 1,
        name: test.name,
      })),
    };
  } finally {
    await cleanupDirectory(directory);
  }
}

export async function executeCode({
  language = "javascript",
  code,
  tests = [],
  timeoutMs,
} = {}) {
  const normalizedLanguage = String(language || "javascript")
    .trim()
    .toLowerCase();

  if (["javascript", "js", "node", "nodejs"].includes(normalizedLanguage)) {
    return executeJavaScript({
      code,
      tests,
      timeoutMs,
    });
  }

  const error = new Error(
    "Nyxora's first execution sandbox supports JavaScript/Node.js only."
  );
  error.code = "UNSUPPORTED_LANGUAGE";
  throw error;
}
