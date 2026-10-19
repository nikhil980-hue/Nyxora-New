import { executeCode } from "./codeExecutionService.js";
import { streamNyxoraModel } from "./modelGateway.js";

const MAX_REPAIR_ATTEMPTS = 2;
const MAX_CODE_CHARS = 50000;
const MAX_ERROR_CHARS = 12000;

function extractCode(text) {
  const source = String(text || "").trim();

  const fenced = source.match(/```(?:javascript|js|node|nodejs)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  return source
    .replace(/^javascript\s*/i, "")
    .trim();
}

async function collectModelText(messages, prompt) {
  let text = "";

  for await (const delta of streamNyxoraModel({
    messages,
    prompt,
    mode: "coding",
  })) {
    text += String(delta || "");
    if (text.length >= 70000) break;
  }

  return text.slice(0, 70000);
}

function buildRepairPrompt({ code, error, tests, attempt }) {
  const testText = Array.isArray(tests) && tests.length
    ? tests
        .map((test, index) => {
          const name = typeof test === "string" ? `Test ${index + 1}` : test?.name || `Test ${index + 1}`;
          const testCode = typeof test === "string" ? test : test?.code || "";
          return `TEST ${index + 1} (${name}):\n${testCode}`;
        })
        .join("\n\n")
    : "No explicit tests were supplied.";

  return [
    "You are Nyxora's code repair engine.",
    "Repair the JavaScript program using the execution error below.",
    "Return ONLY the complete corrected JavaScript source code.",
    "Do not use markdown fences. Do not explain the fix.",
    "Do not add imports, network access, filesystem access, child processes, eval, Function, process, or dynamic module loading.",
    `Repair attempt: ${attempt}`,
    "",
    "CURRENT CODE:",
    code,
    "",
    "EXECUTION ERROR:",
    error,
    "",
    "TESTS:",
    testText,
  ].join("\n");
}

export async function executeWithSelfCorrection({
  code,
  tests = [],
  timeoutMs,
  maxAttempts = MAX_REPAIR_ATTEMPTS,
} = {}) {
  if (typeof code !== "string" || !code.trim()) {
    throw new Error("Code is required.");
  }

  if (code.length > MAX_CODE_CHARS) {
    throw new Error(`Code exceeds the ${MAX_CODE_CHARS} character limit.`);
  }

  const attempts = Math.min(
    Math.max(Number(maxAttempts) || MAX_REPAIR_ATTEMPTS, 1),
    MAX_REPAIR_ATTEMPTS
  );

  let currentCode = code;
  const history = [];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = await executeCode({
      language: "javascript",
      code: currentCode,
      tests,
      timeoutMs,
    });

    history.push({
      attempt,
      success: result.success,
      durationMs: result.durationMs,
      error: result.error,
      stderr: result.stderr,
    });

    if (result.success) {
      return {
        success: true,
        repaired: attempt > 1,
        attempts: attempt,
        code: currentCode,
        result,
        history,
      };
    }

    if (attempt >= attempts) break;

    const errorText = [result.error, result.stderr]
      .filter(Boolean)
      .join("\n")
      .slice(0, MAX_ERROR_CHARS);

    const prompt = buildRepairPrompt({
      code: currentCode,
      error: errorText || "The program failed without a readable error.",
      tests,
      attempt,
    });

    const repairedText = await collectModelText(
      [
        {
          role: "system",
          content:
            "Return only corrected JavaScript source. Never return markdown, commentary, imports, network calls, filesystem access, process access, or child-process code.",
        },
      ],
      prompt
    );

    const repairedCode = extractCode(repairedText);

    if (!repairedCode || repairedCode === currentCode.trim()) {
      break;
    }

    currentCode = repairedCode.slice(0, MAX_CODE_CHARS);
  }

  return {
    success: false,
    repaired: history.length > 1,
    attempts: history.length,
    code: currentCode,
    result: history.length
      ? await executeCode({
          language: "javascript",
          code: currentCode,
          tests,
          timeoutMs,
        })
      : null,
    history,
  };
}
