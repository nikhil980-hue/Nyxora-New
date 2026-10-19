import { executeNyxoraWebResearch } from "./webResearchService.js";
import { executeCode } from "./codeExecutionService.js";
import { getMemory, saveMemory } from "./memoryService.js";
import { moveMouse, clickMouse, typeText, pressKey, hotkey } from "./computerControlService.js";
import { navigateBrowser, clickBrowser, typeBrowser, pressBrowser, browserSnapshot } from "./browserControlService.js";
import { openApplication } from "./applicationControlService.js";
import { listFiles, readFile, writeFile, createDirectory, deletePath, openFolder } from "./fileSystemControlService.js";
import { getSystemStatus, openUrl, powerAction } from "./osControlService.js";
import { observeDesktop, verifyAction } from "./observationVerificationService.js";
import { getJarvisMemory, rememberJarvisEvent, rememberJarvisFact } from "./jarvisMemoryService.js";
import { buildJarvisCommandContext } from "./jarvisCommandService.js";

const DEFAULT_MAX_STEPS = 12;
const NYXORA_AGENT_ARCHITECTURE_VERSION = "36.0.0";
const ARCHITECTURE_PHASES = [
  "listen",
  "understand",
  "think",
  "plan",
  "act",
  "observe",
  "verify",
  "recover",
  "remember",
  "speak",
];

const architectureState = {
  architectureVersion: NYXORA_AGENT_ARCHITECTURE_VERSION,
  phase: "listen",
  status: "idle",
  completedAt: null,
  phases: Object.fromEntries(
    ARCHITECTURE_PHASES.map((phase) => [
      phase,
      {
        status: "pending",
        updatedAt: null,
      },
    ])
  ),
};

function getNyxoraAgentArchitecture() {
  return {
    version: NYXORA_AGENT_ARCHITECTURE_VERSION,
    phase: architectureState.phase,
    status: architectureState.status,
    completedAt: architectureState.completedAt,
    phases: Object.fromEntries(
      Object.entries(architectureState.phases || {}).map(
        ([key, value]) => [key, { ...value }]
      )
    ),
  };
}
function transitionAgentArchitecturePhase(architectureState, phase, status) {
  if (!architectureState || !ARCHITECTURE_PHASES.includes(phase)) {
    return;
  }

  const now = new Date().toISOString();
  const normalizedStatus = String(status || "").toLowerCase();

  architectureState.phase = phase;
  architectureState.status = normalizedStatus || "active";

  if (!architectureState.phases) {
    architectureState.phases = {};
  }

  if (!architectureState.phases[phase]) {
    architectureState.phases[phase] = {
      status: "pending",
      updatedAt: null,
    };
  }

  architectureState.phases[phase] = {
    ...architectureState.phases[phase],
    status: normalizedStatus || "active",
    updatedAt: now,
  };

  if (normalizedStatus === "completed") {
    architectureState.completedAt = now;
  } else if (normalizedStatus === "active") {
    architectureState.completedAt = null;
  }
}

const MAX_AGENT_STEPS = 24;
const DEFAULT_STEP_TIMEOUT_MS = 12000;
const DEFAULT_MAX_PARALLEL_STEPS = 4;
const MAX_PARALLEL_STEPS = 8;
const MAX_CONTEXT_CHARS = 28000;
const MAX_RESULT_CHARS = 9000;
const DEFAULT_MAX_RETRIES = 2;
const MAX_RETRIES = 2;
const DEFAULT_AGENT_BUDGET_MS = 45000;
const MAX_AGENT_BUDGET_MS = 120000;
const DEFAULT_SYNTHESIS_TIMEOUT_MS = 12000;
const DEFAULT_EVIDENCE_AUDIT_TIMEOUT_MS = 7000;
const MAX_EVIDENCE_AUDIT_TIMEOUT_MS = 10000;
const EVIDENCE_AUDIT_MAX_OUTPUT_CHARS = 9000;
const EVIDENCE_AUDIT_MIN_CONFIDENCE = 0.65;
const MAX_EVIDENCE_ITEMS = 80;
const DEFAULT_CONTRADICTION_TIMEOUT_MS = 7000;
const MAX_CONTRADICTION_TIMEOUT_MS = 10000;
const CONTRADICTION_MAX_OUTPUT_CHARS = 10000;
const CONTRADICTION_MIN_CONFIDENCE = 0.70;
const MAX_CONTRADICTION_PAIRS = 12;

// ======================================================
// STEPS 25-30 — ADVANCED AGENT INTELLIGENCE
// ======================================================

const DEFAULT_CONFIDENCE_THRESHOLD = 0.72;
const MIN_CONFIDENCE_FOR_DIRECT_ANSWER = 0.55;
const DEFAULT_LONG_HORIZON_CHECKPOINT_INTERVAL = 3;
const DEFAULT_MAX_COLLABORATIVE_AGENTS = 2;
const MAX_COLLABORATIVE_AGENTS = 3;
const DEFAULT_COLLABORATION_TIMEOUT_MS = 6000;
const MAX_COLLABORATION_TIMEOUT_MS = 9000;
const MAX_AGENT_MEMORY_ITEMS = 12;
const MAX_AGENT_MEMORY_CHARS = 6000;
const DEFAULT_MAX_ESTIMATED_TOKENS = 18000;
const DEFAULT_MAX_ESTIMATED_COST_UNITS = 18000;
const TOOL_RELIABILITY_FLOOR = 0.45;
const TOOL_RELIABILITY_CEILING = 0.98;

const TOOL_PROFILES = {
  web_research: {
    signals: ["research", "latest", "current", "source", "sources", "news", "search", "verify", "compare"],
    baseUtility: 0.72,
  },
  calculator: {
    signals: ["calculate", "compute", "arithmetic", "percentage", "sum", "difference", "multiply", "divide", "equation"],
    baseUtility: 0.78,
  },
  code_execution: {
    signals: ["code", "script", "program", "debug", "execute", "test", "implement", "calculate with code"],
    baseUtility: 0.76,
  },
  file_understanding: {
    signals: ["file", "document", "pdf", "docx", "spreadsheet", "excel", "ppt", "presentation", "uploaded"],
    baseUtility: 0.78,
  },
  vision: {
    signals: ["image", "photo", "picture", "screenshot", "diagram", "visual", "scan", "handwriting"],
    baseUtility: 0.76,
  },
  workspace: {
    signals: ["workspace", "student", "class", "document", "project", "workspace context"],
    baseUtility: 0.68,
  },
  memory: {
    signals: ["remember", "previously", "last time", "my preference", "my goal", "what did i say"],
    baseUtility: 0.70,
  },
  computer_control: {
    signals: ["click", "mouse", "cursor", "type", "keyboard", "press key", "hotkey", "move mouse"],
    baseUtility: 0.90,
  },
  browser_control: {
    signals: ["browser", "website", "web page", "navigate", "open website", "search google", "click link"],
    baseUtility: 0.90,
  },
  application_control: {
    signals: ["open app", "launch", "start application", "open chrome", "open notepad", "open calculator"],
    baseUtility: 0.88,
  },
  filesystem_control: {
    signals: ["file", "folder", "directory", "read file", "write file", "delete file", "list files"],
    baseUtility: 0.86,
  },
  os_control: {
    signals: ["shutdown", "restart", "sleep", "system status", "open url"],
    baseUtility: 0.86,
  },
  screen_observation: {
    signals: ["screen", "screenshot", "what is on my screen", "look at my screen", "inspect screen"],
    baseUtility: 0.88,
  },
  action_verification: {
    signals: ["verify", "check whether", "confirm it worked", "did it work", "verify action"],
    baseUtility: 0.74,
  },
};

function clean(value, max = MAX_RESULT_CHARS) {
  return String(value ?? "").trim().slice(0, max);
}

function controlGate(name) {
  const enabled = String(process.env[name] || "false").toLowerCase() === "true";
  return enabled ? null : `Control capability is disabled. Set ${name}=true in the backend environment.`;
}

function hasAny(text, signals) {
  const value = String(text || "").toLowerCase();
  return signals.some((signal) => value.includes(signal));
}

const AGENT_TOOLS = new Set([
  "web_research",
  "calculator",
  "code_execution",
  "file_understanding",
  "vision",
  "workspace",
  "memory",
  "computer_control",
  "browser_control",
  "application_control",
  "filesystem_control",
  "os_control",
  "screen_observation",
  "action_verification",
]);

const PLANNER_MAX_OUTPUT_CHARS = 12000;
const DEFAULT_PLANNER_TIMEOUT_MS = 9000;
const MAX_PLANNER_TIMEOUT_MS = 15000;
const DEFAULT_MAX_PLAN_REVISIONS = 1;
const MAX_PLAN_REVISIONS = 2;
const REFLECTION_MAX_OUTPUT_CHARS = 9000;
const DEFAULT_REFLECTION_TIMEOUT_MS = 8000;
const MAX_REFLECTION_TIMEOUT_MS = 12000;
const REFLECTION_MIN_CONFIDENCE = 0.65;


function clamp01(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? Math.max(0, Math.min(1, numeric))
    : fallback;
}

function normalizeAgentMemory(memory) {
  const source = memory?.preferences?.__nyxoraAgent;
  if (!source || typeof source !== "object") {
    return {
      toolReliability: {},
      taskPatterns: [],
      successfulStrategies: [],
      checkpoints: [],
    };
  }

  return {
    toolReliability:
      source.toolReliability && typeof source.toolReliability === "object"
        ? source.toolReliability
        : {},
    taskPatterns: Array.isArray(source.taskPatterns)
      ? source.taskPatterns.slice(-MAX_AGENT_MEMORY_ITEMS)
      : [],
    successfulStrategies: Array.isArray(source.successfulStrategies)
      ? source.successfulStrategies.slice(-MAX_AGENT_MEMORY_ITEMS)
      : [],
    checkpoints: Array.isArray(source.checkpoints)
      ? source.checkpoints.slice(-MAX_AGENT_MEMORY_ITEMS)
      : [],
  };
}

function toolReliability(memory, tool) {
  const learned = Number(memory?.toolReliability?.[tool]);
  return Number.isFinite(learned)
    ? Math.max(TOOL_RELIABILITY_FLOOR, Math.min(TOOL_RELIABILITY_CEILING, learned))
    : 0.72;
}

function scoreAgentTool(tool, prompt, taskAnalysis = {}, memory = {}) {
  const profile = TOOL_PROFILES[tool];
  if (!profile) return 0;

  const text = String(prompt || "").toLowerCase();
  const signalHits = profile.signals.filter((signal) => text.includes(signal)).length;
  const selected = Array.isArray(taskAnalysis?.selectedTools)
    ? taskAnalysis.selectedTools.includes(tool)
    : false;

  const capabilityBoost =
    tool === "vision" && taskAnalysis?.needsVision ? 0.24 :
    tool === "web_research" && taskAnalysis?.needsCompetition ? 0.16 :
    tool === "code_execution" && taskAnalysis?.task === "coding" ? 0.22 :
    tool === "file_understanding" && taskAnalysis?.needsDocument ? 0.18 :
    0;

  return (
    profile.baseUtility +
    Math.min(0.22, signalHits * 0.07) +
    (selected ? 0.12 : 0) +
    capabilityBoost +
    (toolReliability(memory, tool) - 0.72) * 0.35
  );
}

function getJarvisAllowedTools({ prompt, taskAnalysis = {} }) {
  const selected = new Set(
    Array.isArray(taskAnalysis?.selectedTools)
      ? taskAnalysis.selectedTools.filter((tool) => AGENT_TOOLS.has(tool))
      : []
  );

  const controlTools = new Set([
    "computer_control",
    "browser_control",
    "application_control",
    "filesystem_control",
    "os_control",
    "screen_observation",
  ]);

  const selectedControls = [...selected].filter((tool) =>
    controlTools.has(tool)
  );

  const task = String(taskAnalysis?.task || "").toLowerCase();
  const text = String(prompt || "").toLowerCase();

  /*
   * JARVIS commands are open-world, but the command understanding layer is
   * still the capability boundary. The agent may plan with the capabilities
   * that understanding selected; it may not broaden a request into every
   * available control tool.
   *
   * For a single, clearly classified control task, keep only that primary
   * capability. Verification is always retained because operational actions
   * must be observed/verified before synthesis.
   */
  if (task === "browser_control") {
    const tools = new Set(["browser_control"]);

    /*
     * Preserve application_control only when the user explicitly asks for
     * an application launch/start in addition to a browser action. A plain
     * "open Google" / "bring up YouTube" request is a browser operation.
     */
    const explicitApplicationLaunch =
      /\b(?:open|launch|start|run|bring up)\b[\s\S]{0,80}\b(?:app|application|program|software)\b/i.test(text) ||
      /\b(?:open|launch|start|run|bring up)\s+(?:chrome|edge|firefox|brave|opera)\b/i.test(text) ||
      /\b(?:open|launch|start|run|bring up)\b[\s\S]{0,80}\b(?:and then|then)\b[\s\S]{0,80}\b(?:go|navigate|visit|search)\b/i.test(text);

    if (selected.has("application_control") && explicitApplicationLaunch) {
      tools.add("application_control");
    }

    tools.add("action_verification");
    return [...tools];
  }

  if (task === "application_control") {
    const tools = new Set(["application_control"]);

    /*
     * If the understanding layer also extracted an explicit web target,
     * retain browser control only when the request contains a second,
     * browser-specific action. This prevents "Open Google" from becoming
     * an application launch while still allowing "open Chrome and go to
     * Google".
     */
    const hasSecondBrowserAction =
      /\b(?:and then|then|after that|afterwards)\b[\s\S]{0,100}\b(?:go|navigate|visit|search|browse)\b/i.test(text);

    if (selected.has("browser_control") && hasSecondBrowserAction) {
      tools.add("browser_control");
    }

    tools.add("action_verification");
    return [...tools];
  }

  if (task === "computer_control") {
    return ["computer_control", "action_verification"];
  }

  if (task === "filesystem_control") {
    return ["filesystem_control", "action_verification"];
  }

  if (task === "os_control") {
    return ["os_control", "action_verification"];
  }

  if (task === "screen_observation") {
    return ["screen_observation", "action_verification"];
  }

  /*
   * agent_control is deliberately open-ended. Even here, use only control
   * capabilities already selected by the command understanding layer.
   */
  if (task === "agent_control") {
    const tools = new Set(selectedControls);

    if (selected.has("action_verification") || tools.size) {
      tools.add("action_verification");
    }

    return [...tools];
  }

  return [...selected];
}

function selectAgentTools({ prompt, taskAnalysis = {}, memory = {} }) {
  if (taskAnalysis?.isJarvisCommand) {
    return getJarvisAllowedTools({
      prompt,
      taskAnalysis,
    });
  }

  const selected = new Set(
    Array.isArray(taskAnalysis?.selectedTools)
      ? taskAnalysis.selectedTools.filter((tool) => AGENT_TOOLS.has(tool))
      : []
  );

  for (const tool of AGENT_TOOLS) {
    const score = scoreAgentTool(tool, prompt, taskAnalysis, memory);
    if (score >= 0.82) selected.add(tool);
  }

  return [...selected].sort(
    (a, b) =>
      scoreAgentTool(b, prompt, taskAnalysis, memory) -
      scoreAgentTool(a, prompt, taskAnalysis, memory)
  );
}

function buildToolSelectionContext({ prompt, taskAnalysis, memory }) {
  const ranked = [...AGENT_TOOLS]
    .map((tool) => ({
      tool,
      score: scoreAgentTool(tool, prompt, taskAnalysis, memory),
      reliability: toolReliability(memory, tool),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked
    .map(
      (item, index) =>
        `${index + 1}. ${item.tool} | utility=${item.score.toFixed(2)} | learnedReliability=${item.reliability.toFixed(2)}`
    )
    .join("\n");
}

function estimateTokensFromText(value) {
  return Math.max(0, Math.ceil(String(value || "").length / 4));
}

function buildResourceLedger({ prompt, messages = [], results = [], trace = [] }) {
  const inputChars =
    String(prompt || "").length +
    messages.reduce((sum, item) => sum + String(item?.content || "").length, 0);
  const outputChars = results.reduce(
    (sum, result) => sum + String(result?.output || "").length,
    0
  );
  const estimatedTokens = estimateTokensFromText(inputChars + outputChars);
  const toolCalls = results.length;
  const failures = results.filter((result) => !result?.success).length;

  return {
    estimatedTokens,
    estimatedCostUnits: estimatedTokens + toolCalls * 120 + failures * 80,
    toolCalls,
    failures,
    traceEntries: trace.length,
  };
}

function buildJarvisResponseGuidance(jarvisCommand = null) {
  if (!jarvisCommand) return "";

  const commandType = String(
    jarvisCommand?.type ||
      jarvisCommand?.intent ||
      jarvisCommand?.task ||
      "command"
  ).trim();

  return [
    "NYXORA JARVIS RESPONSE MODE",
    "You are responding as JARVIS in an active voice-first command session.",
    `COMMAND TYPE: ${commandType || "command"}`,
    "Give the user a direct, concise completion result.",
    "For completed actions, briefly confirm what was done and mention the relevant result.",
    "For failed actions, clearly say what failed and the next useful step.",
    "Do not expose internal tool names, orchestration phases, planner traces, confidence ledgers, or implementation details.",
    "Do not repeat the user's full command unless clarification is necessary.",
    "Keep the spoken response natural and easy to understand.",
  ].join("\n");
}

function buildConfidenceContext(confidence = {}) {
  if (!confidence || !confidence.overall) return "";

  const lines = [
    "NYXORA AGENT CONFIDENCE",
    `OVERALL CONFIDENCE: ${Number(confidence.overall).toFixed(2)}`,
    `LEVEL: ${confidence.level || "unknown"}`,
    `EVIDENCE COVERAGE: ${Number(confidence.evidenceCoverage || 0).toFixed(2)}`,
    `EXECUTION RELIABILITY: ${Number(confidence.executionReliability || 0).toFixed(2)}`,
    `CONTRADICTION RISK: ${Number(confidence.contradictionRisk || 0).toFixed(2)}`,
  ];

  if (Array.isArray(confidence.weakAreas) && confidence.weakAreas.length) {
    lines.push(`WEAK AREAS:\n${confidence.weakAreas.map((item) => `- ${item}`).join("\n")}`);
  }

  lines.push(
    "Do not present low-confidence or unresolved facts as certain.",
    "When confidence is limited, qualify the affected claim instead of inventing certainty."
  );

  return lines.join("\n");
}

function calculateAgentConfidence({ results = [], contradictionResolution = {}, evidenceAudit = null }) {
  const successful = results.filter((result) => validateAgentResult(result).valid);
  const evidence = buildEvidenceLedger(results);
  const evidenceCoverage = results.length
    ? successful.length / results.length
    : 0.5;

  const executionReliability = successful.length
    ? successful.reduce((sum, result) => {
        const items = Array.isArray(result.evidence) ? result.evidence : [];
        const local = items.length
          ? Math.max(...items.map(evidenceStrength))
          : 0.62;
        return sum + local;
      }, 0) / successful.length
    : 0.35;

  const unresolved = Array.isArray(contradictionResolution?.contradictions)
    ? contradictionResolution.contradictions.filter(
        (item) => item.resolution !== "resolved"
      ).length
    : 0;
  const contradictionCount = Array.isArray(contradictionResolution?.contradictions)
    ? contradictionResolution.contradictions.length
    : 0;
  const contradictionRisk = contradictionCount
    ? unresolved / contradictionCount
    : 0;

  const auditConfidence =
    evidenceAudit && Number.isFinite(Number(evidenceAudit.confidence))
      ? clamp01(evidenceAudit.confidence, 0.7)
      : 0.75;

  const overall = clamp01(
    evidenceCoverage * 0.28 +
      executionReliability * 0.32 +
      (1 - contradictionRisk) * 0.20 +
      auditConfidence * 0.20,
    0.5
  );

  const weakAreas = [];
  if (evidenceCoverage < 0.75) weakAreas.push("Some planned steps did not produce verified results.");
  if (executionReliability < 0.7) weakAreas.push("Some evidence has limited execution or provenance strength.");
  if (contradictionRisk > 0.2) weakAreas.push("Some evidence conflicts remain unresolved.");
  if (evidence.length === 0) weakAreas.push("No tool-derived evidence was available.");

  const level =
    overall >= 0.85 ? "high" :
    overall >= 0.70 ? "moderate" :
    overall >= MIN_CONFIDENCE_FOR_DIRECT_ANSWER ? "limited" :
    "low";

  return {
    overall,
    level,
    evidenceCoverage,
    executionReliability,
    contradictionRisk,
    weakAreas,
  };
}

function buildCheckpoint({ plan, completed, results, confidence, resourceLedger }) {
  return {
    at: new Date().toISOString(),
    completed: [...completed].slice(-MAX_AGENT_MEMORY_ITEMS),
    remaining: plan
      .filter((step) => step.tool !== "model_synthesis" && !completed.has(step.id))
      .map((step) => step.id)
      .slice(0, MAX_AGENT_MEMORY_ITEMS),
    confidence: Number(confidence?.overall || 0),
    resource: {
      estimatedTokens: resourceLedger?.estimatedTokens || 0,
      estimatedCostUnits: resourceLedger?.estimatedCostUnits || 0,
    },
    resultCount: results.length,
  };
}

function buildAgentMemorySnapshot({
  existingMemory,
  prompt,
  taskAnalysis,
  results,
  confidence,
  checkpoint,
}) {
  const memory = normalizeAgentMemory(existingMemory);
  const successfulTools = results
    .filter((result) => result?.success)
    .map((result) => result.tool)
    .filter(Boolean);

  const updatedReliability = { ...memory.toolReliability };
  for (const tool of new Set(results.map((result) => result?.tool).filter(Boolean))) {
    const previous = toolReliability(memory, tool);
    const success = results
      .filter((result) => result?.tool === tool)
      .reduce((sum, result) => sum + (result?.success ? 1 : 0), 0);
    const total = results.filter((result) => result?.tool === tool).length;
    if (total) {
      const observed = success / total;
      updatedReliability[tool] = Number(
        (previous * 0.75 + observed * 0.25).toFixed(3)
      );
    }
  }

  const taskSignature = clean(
    `${taskAnalysis?.task || "unknown"} | ${String(prompt || "").slice(0, 220)}`,
    320
  );

  return {
    toolReliability: updatedReliability,
    taskPatterns: [
      ...memory.taskPatterns,
      {
        signature: taskSignature,
        tools: [...new Set(successfulTools)],
        confidence: Number(confidence?.overall || 0),
        at: new Date().toISOString(),
      },
    ].slice(-MAX_AGENT_MEMORY_ITEMS),
    successfulStrategies: [
      ...memory.successfulStrategies,
      {
        task: clean(taskAnalysis?.task || "unknown", 100),
        tools: [...new Set(successfulTools)],
        confidence: Number(confidence?.overall || 0),
        at: new Date().toISOString(),
      },
    ].slice(-MAX_AGENT_MEMORY_ITEMS),
    checkpoints: [
      ...memory.checkpoints,
      checkpoint,
    ].slice(-MAX_AGENT_MEMORY_ITEMS),
  };
}

async function loadPersistentAgentMemory(userId) {
  if (!userId) return null;
  try {
    return await getMemory(userId);
  } catch (error) {
    console.warn(`[Nyxora Agent Memory] LOAD FAILED -> ${error?.message || error}`);
    return null;
  }
}

async function savePersistentAgentMemory(userId, memorySnapshot) {
  if (!userId || !memorySnapshot) return;
  try {
    await saveMemory(userId, {
      preferences: {
        __nyxoraAgent: memorySnapshot,
      },
    });
  } catch (error) {
    console.warn(`[Nyxora Agent Memory] SAVE FAILED -> ${error?.message || error}`);
  }
}

async function requestCollaborativeAgents({
  prompt,
  messages,
  taskAnalysis,
  plan,
  results,
  modelResponder,
  resourceLedger,
  budgetRemainingMs,
}) {
  if (typeof modelResponder !== "function") return [];
  const complexity = Number(taskAnalysis?.complexityScore || 0);
  const needsCollaboration =
    complexity >= 60 ||
    taskAnalysis?.needsCompetition === true ||
    (Array.isArray(taskAnalysis?.selectedTools) && taskAnalysis.selectedTools.length >= 3);

  if (!needsCollaboration || budgetRemainingMs < 7000) return [];

  const count = Math.max(
    1,
    Math.min(
      MAX_COLLABORATIVE_AGENTS,
      Number(process.env.NYXORA_AGENT_COLLABORATORS || DEFAULT_MAX_COLLABORATIVE_AGENTS)
    )
  );

  const roles = [
    {
      id: "primary_reasoner",
      instruction: "Independently solve the request and identify the strongest supported conclusion.",
    },
    {
      id: "critical_reviewer",
      instruction: "Independently inspect the available results, identify gaps or risks, and propose corrections.",
    },
    {
      id: "alternative_strategist",
      instruction: "Try a different approach and identify useful alternatives, edge cases, or missing steps.",
    },
  ].slice(0, count);

  const sharedContext = [
    "NYXORA COLLABORATIVE AGENT TASK",
    `USER REQUEST:\n${clean(prompt, 9000)}`,
    `TASK TYPE: ${clean(taskAnalysis?.task || "unknown", 100)}`,
    `PLAN:\n${plan.filter((step) => step.tool !== "model_synthesis").map((step) => `${step.id}: ${step.tool} — ${step.reason}`).join("\n")}`,
    `CURRENT RESULTS:\n${buildToolContext(results) || "none"}`,
    "Return a concise recommendation for the final synthesis model.",
  ].join("\n\n");

  const timeoutMs = Math.max(
    4000,
    Math.min(
      MAX_COLLABORATION_TIMEOUT_MS,
      Number(process.env.NYXORA_AGENT_COLLABORATION_TIMEOUT_MS || DEFAULT_COLLABORATION_TIMEOUT_MS)
    )
  );

  const outputs = await Promise.all(
    roles.map(async (role) => {
      try {
        let text = "";
        for await (const delta of modelResponder({
          messages: [
            { role: "system", content: `${sharedContext}\n\nROLE:\n${role.instruction}` },
            ...messages.slice(-4),
            { role: "user", content: "Return the role recommendation now." },
          ],
          prompt: `COLLABORATIVE AGENT: ${role.id}`,
          task: "reasoning",
          timeoutOverrideMs: timeoutMs,
          attachments: [],
        })) {
          text += String(delta || "");
          if (text.length >= 7000) break;
        }

        return {
          role: role.id,
          success: Boolean(text.trim()),
          output: clean(text, 6500),
          error: text.trim() ? "" : "Collaborative agent returned no usable output.",
        };
      } catch (error) {
        return {
          role: role.id,
          success: false,
          output: "",
          error: clean(error?.message || error, 1600),
        };
      }
    })
  );

  return outputs.filter(Boolean);
}

function buildDeterministicPlan({ prompt, taskAnalysis }) {
  const text = String(prompt || "").toLowerCase();
  const intelligentTools = selectAgentTools({
    prompt,
    taskAnalysis,
    memory: taskAnalysis?.agentMemory || {},
  });
  const selected = new Set(intelligentTools);
  const plan = [];

  const needsWeb = selected.has("web_research");
  const needsCode = selected.has("code_execution");
  const needsCalculator = selected.has("calculator");
  const needsFile = selected.has("file_understanding");
  const needsVision = selected.has("vision");
  const needsWorkspace = selected.has("workspace");
  const needsMemory = selected.has("memory");

  if (needsWeb) {
    plan.push({
      id: "web_research",
      tool: "web_research",
      dependsOn: [],
      reason: "Collect current information and source-backed evidence.",
    });
  }

  if (needsCalculator) {
    plan.push({
      id: "calculator",
      tool: "calculator",
      dependsOn: [],
      reason: "Perform deterministic arithmetic before synthesis.",
    });
  }

  if (needsCode) {
    const researchDependency = needsWeb && hasAny(text, [
      "based on the research",
      "using the research",
      "using those results",
      "from the research",
      "after researching",
      "after the research",
    ]);

    plan.push({
      id: "code_execution",
      tool: "code_execution",
      dependsOn: researchDependency ? ["web_research"] : [],
      reason: "Execute or verify reproducible code when code is supplied.",
    });
  }

  if (needsFile) {
    plan.push({
      id: "file_understanding",
      tool: "file_understanding",
      dependsOn: [],
      reason: "Use uploaded-file context supplied to the request.",
    });
  }

  if (needsVision) {
    plan.push({
      id: "vision",
      tool: "vision",
      dependsOn: [],
      reason: "Use visual context supplied to the request.",
    });
  }

  const needsComputer = selected.has("computer_control");
  const needsBrowser = selected.has("browser_control");
  const needsApplication = selected.has("application_control");
  const needsFilesystem = selected.has("filesystem_control");
  const needsOs = selected.has("os_control");
  const needsScreen = selected.has("screen_observation");
  const needsVerification =
    selected.has("action_verification") ||
    needsComputer ||
    needsBrowser ||
    needsApplication ||
    needsFilesystem ||
    needsOs;

  if (needsComputer) {
    plan.push({
      id: "computer_control",
      tool: "computer_control",
      dependsOn: [],
      reason: "Control the local mouse and keyboard for the requested desktop action.",
    });
  }

  if (needsBrowser) {
    plan.push({
      id: "browser_control",
      tool: "browser_control",
      dependsOn: [],
      reason: "Navigate and interact with the browser for the requested web action.",
    });
  }

  if (needsApplication) {
    plan.push({
      id: "application_control",
      tool: "application_control",
      dependsOn: [],
      reason: "Open the requested application from Nyxora's safe application allowlist.",
    });
  }

  if (needsFilesystem) {
    plan.push({
      id: "filesystem_control",
      tool: "filesystem_control",
      dependsOn: [],
      reason: "Inspect or modify files inside Nyxora's allowed local control root.",
    });
  }

  if (needsOs) {
    plan.push({
      id: "os_control",
      tool: "os_control",
      dependsOn: [],
      reason: "Perform the requested allowlisted operating-system action.",
    });
  }

  if (needsScreen) {
    plan.push({
      id: "screen_observation",
      tool: "screen_observation",
      dependsOn: [],
      reason: "Observe the current desktop state before deciding or reporting the next action.",
    });
  }

  if (needsVerification) {
    plan.push({
      id: "action_verification",
      tool: "action_verification",
      dependsOn: plan.filter((step) => step.tool !== "model_synthesis").map((step) => step.id),
      reason: "Verify that the requested action produced the expected observable result.",
    });
  }

  if (needsWorkspace) {
    plan.push({
      id: "workspace",
      tool: "workspace",
      dependsOn: [],
      reason: "Use workspace context supplied by Nyxora.",
    });
  }

  if (needsMemory) {
    plan.push({
      id: "memory",
      tool: "memory",
      dependsOn: [],
      reason: "Use memory context supplied by the chat layer.",
    });
  }

  return plan;
}

function addSynthesisStep(plan) {
  const operationalSteps = Array.isArray(plan)
    ? plan.filter((step) => step?.tool !== "model_synthesis")
    : [];

  return [
    ...operationalSteps,
    {
      id: "verify_and_synthesize",
      tool: "model_synthesis",
      dependsOn: operationalSteps.map((step) => step.id),
      reason: "Verify tool results and produce one coherent answer.",
    },
  ];
}

function buildPlan({ prompt, taskAnalysis }) {
  return addSynthesisStep(
    buildDeterministicPlan({
      prompt,
      taskAnalysis,
    })
  );
}

function extractJsonObject(text) {
  const source = String(text || "").trim();

  if (!source) return null;

  const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] || source).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    // Continue with a bounded object scan for models that add one short
    // sentence before/after an otherwise valid JSON response.
  }

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace <= firstBrace) return null;

  try {
    return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
}

function normalizePlannedSteps(
  candidate,
  maxSteps,
  allowedTools = null,
  options = {}
) {
  const rawSteps = Array.isArray(candidate)
    ? candidate
    : Array.isArray(candidate?.steps)
      ? candidate.steps
      : [];

  const steps = [];
  const ids = new Set();
  const allowed = allowedTools
    ? new Set(
        [...allowedTools].filter((tool) => AGENT_TOOLS.has(tool))
      )
    : null;

  const maxOperationalSteps = Math.max(
    1,
    Math.min(
      maxSteps - 1,
      Number(options.maxOperationalSteps || maxSteps - 1)
    )
  );

  const jarvisCommand = Boolean(options.jarvisCommand);

  for (const raw of rawSteps) {
    if (steps.length >= maxOperationalSteps) break;

    const tool = String(raw?.tool || "").trim().toLowerCase();

    if (!AGENT_TOOLS.has(tool)) continue;

    /*
     * Hard capability boundary:
     * a model-generated JARVIS plan may never introduce a tool that the
     * command-understanding layer did not select.
     */
    if (allowed && !allowed.has(tool)) {
      console.warn(
        `[Nyxora Agent Planner] TOOL REJECTED -> ${tool} is outside the allowed capability boundary.`
      );
      continue;
    }

    if (ids.has(String(raw?.id || ""))) {
      continue;
    }

    const id = String(raw?.id || `${tool}_${steps.length + 1}`)
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 80);

    if (!id || ids.has(id)) continue;

    const dependsOn = Array.isArray(raw?.dependsOn)
      ? raw.dependsOn
          .map((value) => String(value || "").trim())
          .filter((value) => value && value !== id)
          .filter((value, index, values) => values.indexOf(value) === index)
      : [];

    const unresolvedDependencies = dependsOn.filter(
      (dependency) => !ids.has(dependency)
    );

    // A planner may only reference steps already declared. This keeps the
    // graph deterministic and prevents hidden forward references.
    if (unresolvedDependencies.length) continue;

    const reason = clean(
      raw?.reason ||
        `Execute ${tool} as part of the adaptive agent plan.`,
      700
    );

    /*
     * Prevent accidental repeated identical actions. Repeating a tool is
     * still allowed when the model describes a genuinely different step.
     */
    const duplicateAction = steps.some(
      (step) =>
        step.tool === tool &&
        normalizePlannerReason(step.reason) ===
          normalizePlannerReason(reason)
    );

    if (duplicateAction) continue;

    steps.push({
      id,
      tool,
      dependsOn,
      reason,
    });

    ids.add(id);
  }

  if (jarvisCommand && !steps.length) {
    return [];
  }

  return steps;
}

function normalizePlannerReason(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function plannerNeedsModel(taskAnalysis = {}) {
  const complexity = Number(taskAnalysis?.complexityScore || 0);
  const confidence = Number(taskAnalysis?.confidence || 1);
  const selectedTools = Array.isArray(taskAnalysis?.selectedTools)
    ? taskAnalysis.selectedTools.filter((tool) => AGENT_TOOLS.has(tool))
    : [];

  const jarvis = Boolean(taskAnalysis?.isJarvisCommand);
  const allowedTools = jarvis
    ? getJarvisAllowedTools({
        prompt: taskAnalysis?.rawPrompt || "",
        taskAnalysis,
      })
    : selectedTools;

  const operationalCount = allowedTools.filter(
    (tool) => tool !== "action_verification"
  ).length;

  /*
   * A simple JARVIS command does not need an LLM planning pass. Its
   * deterministic plan is already the safest and smallest plan.
   */
  if (
    jarvis &&
    operationalCount <= 1 &&
    complexity < 45 &&
    confidence >= 0.8
  ) {
    return false;
  }

  return (
    selectedTools.length > 1 ||
    complexity >= 45 ||
    confidence < 0.8 ||
    taskAnalysis?.needsReasoning === true ||
    taskAnalysis?.needsCompetition === true
  );
}

function buildPlannerMessages({
  messages,
  prompt,
  taskAnalysis,
  documentContext,
  hasVisualAttachments,
}) {
  const selectedTools = selectAgentTools({
    prompt,
    taskAnalysis,
    memory: taskAnalysis?.agentMemory || {},
  });

  const isJarvisCommand = Boolean(taskAnalysis?.isJarvisCommand);

  const plannerContext = [
    "NYXORA ADAPTIVE AGENT PLANNER",
    "Decompose the user request into the smallest useful sequence of tool steps.",
    "Choose only tools that are actually necessary.",
    "Independent steps should have no dependencies so they can run in parallel.",
    "A step may depend only on an earlier step.",
    "Do not create synthesis/model steps; the runtime adds final verification and synthesis.",
    "Do not invent tools.",
    isJarvisCommand
      ? "HARD RULE: For JARVIS commands, you may use ONLY the SELECTED TOOLS listed below. Never introduce another tool."
      : "",
    isJarvisCommand
      ? "HARD RULE: Do not broaden a simple request into unrelated computer, filesystem, OS, screen, application, or browser actions."
      : "",
    isJarvisCommand
      ? "HARD RULE: A single-action request should normally contain exactly one operational step, followed by runtime verification."
      : "",
    isJarvisCommand
      ? "HARD RULE: Repeat a tool only when each repetition performs a distinct user-requested sub-action."
      : "",
    "",
    `USER REQUEST:\n${clean(prompt, 10000)}`,
    "",
    `TASK TYPE: ${clean(taskAnalysis?.task || "unknown", 100)}`,
    `COMPLEXITY: ${clean(taskAnalysis?.complexity || "unknown", 100)}`,
    `COMPLEXITY SCORE: ${Number(taskAnalysis?.complexityScore || 0)}`,
    `CONFIDENCE: ${Number(taskAnalysis?.confidence || 0)}`,
    `SELECTED TOOLS: ${selectedTools.join(", ") || "none"}`,
    `INTELLIGENT TOOL RANKING:\n${buildToolSelectionContext({
      prompt,
      taskAnalysis,
      memory: taskAnalysis?.agentMemory || {},
    })}`,
    `VISUAL ATTACHMENTS: ${Boolean(hasVisualAttachments)}`,
    `DOCUMENT CONTEXT AVAILABLE: ${Boolean(String(documentContext || "").trim())}`,
    "",
    "AVAILABLE TOOLS:",
    ...(isJarvisCommand
      ? selectedTools.map((tool) => `- ${tool}`)
      : [
          "web_research - current web/source-backed research",
          "calculator - deterministic arithmetic",
          "code_execution - execute or verify JavaScript",
          "file_understanding - use structured uploaded-document context",
          "vision - inspect visual attachment context",
          "workspace - use workspace context",
          "memory - use supplied memory context",
          "computer_control - control local mouse and keyboard",
          "browser_control - navigate and interact with a browser",
          "application_control - open allowlisted local applications",
          "filesystem_control - safely inspect or modify allowed local files",
          "os_control - perform allowlisted OS actions",
          "screen_observation - observe the local desktop",
          "action_verification - verify an action after execution",
        ]),
    "",
    "RETURN ONLY JSON:",
    '{"steps":[{"id":"step_id","tool":"tool_name","dependsOn":[],"reason":"short reason"}]}',
    "",
    "Do not include markdown fences or explanatory text.",
  ].join("\n");

  return [
    {
      role: "system",
      content: plannerContext,
    },
    ...messages.slice(-8),
    {
      role: "user",
      content: "Create the adaptive execution plan now.",
    },
  ];
}

async function requestAdaptivePlan({
  messages,
  prompt,
  taskAnalysis,
  documentContext,
  hasVisualAttachments,
  modelResponder,
  maxSteps,
}) {
  if (typeof modelResponder !== "function") return null;
  if (!plannerNeedsModel(taskAnalysis)) return null;

  const timeoutMs = Math.max(
    4000,
    Math.min(
      MAX_PLANNER_TIMEOUT_MS,
      Number(
        process.env.NYXORA_AGENT_PLANNER_TIMEOUT_MS ||
          DEFAULT_PLANNER_TIMEOUT_MS
      )
    )
  );

  try {
    let plannerText = "";

    for await (const delta of modelResponder({
      messages: buildPlannerMessages({
        messages,
        prompt,
        taskAnalysis,
        documentContext,
        hasVisualAttachments,
      }),
      prompt: "PLAN MULTI-STEP AGENT WORKFLOW",
      task: "reasoning",
      timeoutOverrideMs: timeoutMs,
      attachments: [],
    })) {
      plannerText += String(delta || "");

      if (plannerText.length >= PLANNER_MAX_OUTPUT_CHARS) {
        break;
      }
    }

    const parsed = extractJsonObject(plannerText);
    const selectedTools = selectAgentTools({
      prompt,
      taskAnalysis,
      memory: taskAnalysis?.agentMemory || {},
    });

    const allowedTools = taskAnalysis?.isJarvisCommand
      ? new Set(selectedTools)
      : null;

    const normalized = normalizePlannedSteps(
      parsed,
      maxSteps,
      allowedTools,
      {
        jarvisCommand: Boolean(taskAnalysis?.isJarvisCommand),
        maxOperationalSteps:
          taskAnalysis?.isJarvisCommand &&
          selectedTools.filter((tool) => tool !== "action_verification").length <= 1
            ? 1
            : maxSteps - 1,
      }
    );

    if (!normalized.length) {
      console.warn("[Nyxora Agent Planner] MODEL PLAN INVALID -> deterministic fallback");
      return null;
    }

    const candidatePlan = addSynthesisStep(normalized);
    const validation = validateAgentPlan(candidatePlan, maxSteps);

    if (!validation.valid) {
      console.warn(
        `[Nyxora Agent Planner] MODEL PLAN REJECTED -> ${validation.reason}`
      );
      return null;
    }

    console.log(
      `[Nyxora Agent Planner] MODEL PLAN ACCEPTED -> ${normalized
        .map((step) => step.tool)
        .join(",")}`
    );

    return candidatePlan;
  } catch (error) {
    console.warn(
      `[Nyxora Agent Planner] MODEL PLAN FAILED -> ${error?.message || error}`
    );
    return null;
  }
}


function buildReflectionMessages({
  messages,
  prompt,
  taskAnalysis,
  plan,
  results,
  completed,
}) {
  const failed = results.filter((result) => !validateAgentResult(result).valid);
  const successful = results.filter((result) => validateAgentResult(result).valid);

  const pending = plan.filter(
    (step) =>
      step.tool !== "model_synthesis" &&
      !completed.has(step.id)
  );

  const planText = plan
    .filter((step) => step.tool !== "model_synthesis")
    .map(
      (step) =>
        `${step.id} | tool=${step.tool} | status=${
          completed.has(step.id) ? "completed" : "pending"
        } | dependsOn=${step.dependsOn.join(",") || "none"} | reason=${step.reason}`
    )
    .join("\n");

  return [
    "NYXORA AGENT SELF-REFLECTION",
    "Evaluate the workflow after the latest execution wave.",
    "Decide whether the current plan is still sufficient.",
    "Do not repeat a step that already produced a verified result.",
    "If a result failed, is unusable, or conflicts with the user's goal, propose a minimal recovery step using an available tool.",
    "Recovery steps must solve the identified issue rather than merely repeat the same failed action.",
    "Prefer independent recovery steps. They may use context from the completed results supplied below.",
    "Do not create model_synthesis steps.",
    "Do not invent tools.",
    "",
    `USER REQUEST:\n${clean(prompt, 9000)}`,
    `TASK TYPE: ${clean(taskAnalysis?.task || "unknown", 100)}`,
    "",
    "CURRENT PLAN:",
    planText || "none",
    "",
    `VERIFIED RESULTS (${successful.length}):`,
    buildToolContext(successful),
    "",
    `FAILED OR WEAK RESULTS (${failed.length}):`,
    buildToolContext(failed),
    "",
    `PENDING STEPS (${pending.length}):`,
    pending.map((step) => `${step.id}: ${step.tool} — ${step.reason}`).join("\n") || "none",
    "",
    "RETURN ONLY JSON:",
    '{"decision":"continue|revise","confidence":0.0,"summary":"short assessment","recoverySteps":[{"id":"recovery_id","tool":"tool_name","dependsOn":[],"reason":"short reason"}]}',
    "",
    "Use decision=continue when the remaining plan can complete the request without changing it.",
    "Use decision=revise only when a concrete recovery or replacement step is needed.",
    "confidence must be between 0 and 1.",
  ].join("\n");
}

async function requestAgentReflection({
  messages,
  prompt,
  taskAnalysis,
  plan,
  results,
  completed,
  modelResponder,
  maxSteps,
}) {
  if (typeof modelResponder !== "function") return null;

  const timeoutMs = Math.max(
    4000,
    Math.min(
      MAX_REFLECTION_TIMEOUT_MS,
      Number(
        process.env.NYXORA_AGENT_REFLECTION_TIMEOUT_MS ||
          DEFAULT_REFLECTION_TIMEOUT_MS
      )
    )
  );

  try {
    let reflectionText = "";

    for await (const delta of modelResponder({
      messages: [
        {
          role: "system",
          content: buildReflectionMessages({
            messages,
            prompt,
            taskAnalysis,
            plan,
            results,
            completed,
          }),
        },
        ...messages.slice(-6),
        {
          role: "user",
          content: "Reflect on the completed agent wave and return the JSON decision now.",
        },
      ],
      prompt: "REFLECT ON AGENT RESULTS AND REVISE PLAN IF NEEDED",
      task: "reasoning",
      timeoutOverrideMs: timeoutMs,
      attachments: [],
    })) {
      reflectionText += String(delta || "");
      if (reflectionText.length >= REFLECTION_MAX_OUTPUT_CHARS) break;
    }

    const parsed = extractJsonObject(reflectionText);

    if (!parsed || !["continue", "revise"].includes(String(parsed.decision || "").toLowerCase())) {
      console.warn("[Nyxora Agent Reflection] INVALID -> continue with current plan");
      return null;
    }

    const confidence = Number(parsed.confidence);
    const normalizedConfidence = Number.isFinite(confidence)
      ? Math.max(0, Math.min(1, confidence))
      : 0;

    const decision = String(parsed.decision).toLowerCase();

    const recoverySteps = normalizePlannedSteps(
      {
        steps: Array.isArray(parsed.recoverySteps) ? parsed.recoverySteps : [],
      },
      maxSteps
    );

    return {
      decision,
      confidence: normalizedConfidence,
      summary: clean(parsed.summary || "", 1200),
      recoverySteps,
    };
  } catch (error) {
    console.warn(
      `[Nyxora Agent Reflection] FAILED -> ${error?.message || error}`
    );
    return null;
  }
}

function hasFailedAgentResults(results = []) {
  return results.some((result) => !validateAgentResult(result).valid);
}

function buildReflectionContext(results = []) {
  const failed = results.filter(
    (result) => !validateAgentResult(result).valid
  );

  if (!failed.length) return "";

  return [
    "NYXORA REFLECTION / RECOVERY CONTEXT",
    "Previous agent steps were evaluated and one or more results were not verified.",
    "Use this context to recover the user's request. Do not claim failed actions succeeded.",
    "",
    buildToolContext(failed),
  ].join("\n");
}

function isStepBlockedByFailedDependency(step, failedStepIds) {
  if (!step?.dependsOn?.length) return false;
  return step.dependsOn.some((dependency) => failedStepIds.has(dependency));
}

function applyPlanRevision({
  plan,
  completed,
  results,
  reflection,
  maxSteps,
  taskAnalysis = {},
  prompt = "",
}) {
  if (!reflection || reflection.decision !== "revise") return plan;

  if (reflection.confidence < REFLECTION_MIN_CONFIDENCE) {
    console.log(
      `[Nyxora Agent Reflection] LOW CONFIDENCE -> keeping current plan | confidence=${reflection.confidence}`
    );
    return plan;
  }

  const failedStepIds = new Set(
    results
      .filter((result) => !validateAgentResult(result).valid)
      .map((result) => result.stepId)
      .filter(Boolean)
  );

  const synthesis = plan.find((step) => step.tool === "model_synthesis");
  const operational = plan.filter((step) => step.tool !== "model_synthesis");

  const kept = operational.filter((step) => {
    if (completed.has(step.id)) return true;
    return !isStepBlockedByFailedDependency(step, failedStepIds);
  });

  const existingIds = new Set(kept.map((step) => step.id));
  const recoverySteps = [];

  const allowedTools = taskAnalysis?.isJarvisCommand
    ? new Set(
        selectAgentTools({
          prompt,
          taskAnalysis,
          memory: taskAnalysis?.agentMemory || {},
        })
      )
    : null;

  for (const step of reflection.recoverySteps || []) {
    if (kept.length + recoverySteps.length >= Math.max(1, maxSteps - 1)) break;

    const id = String(step.id || "").trim();
    const tool = String(step.tool || "").trim().toLowerCase();

    if (!id || existingIds.has(id)) continue;

    if (allowedTools && !allowedTools.has(tool)) {
      console.warn(
        `[Nyxora Agent Reflection] TOOL REJECTED -> ${tool} is outside the allowed capability boundary.`
      );
      continue;
    }

    const safeDependencies = Array.isArray(step.dependsOn)
      ? step.dependsOn
          .map((value) => String(value || "").trim())
          .filter(
            (value) =>
              value &&
              value !== id &&
              existingIds.has(value) &&
              completed.has(value)
          )
      : [];

    recoverySteps.push({
      ...step,
      id,
      tool,
      dependsOn: [...new Set(safeDependencies)],
      reason: clean(
        step.reason || "Recover an unverified agent result.",
        700
      ),
    });

    existingIds.add(id);
  }

  const revisedOperational = [...kept, ...recoverySteps];

  if (!revisedOperational.length) return plan;

  const revisedPlan = addSynthesisStep(revisedOperational);

  const validation = validateAgentPlan(revisedPlan, maxSteps);

  if (!validation.valid) {
    console.warn(
      `[Nyxora Agent Reflection] REVISION REJECTED -> ${validation.reason}`
    );
    return plan;
  }

  console.log(
    `[Nyxora Agent Reflection] PLAN REVISED -> removedBlocked=${operational.length - kept.length} | recovery=${recoverySteps.map((step) => step.tool).join(",") || "none"} | summary=${reflection.summary || "n/a"}`
  );

  return revisedPlan;
}

function buildAdaptiveFallbackPlan({
  prompt,
  taskAnalysis,
  maxSteps,
}) {
  return buildPlan({
    prompt,
    taskAnalysis,
  }).slice(0, maxSteps);
}

function safeEvaluateCalculator(expression) {
  const value = String(expression || "").trim();
  if (!value || value.length > 180) return null;

  // Deliberately conservative: only numeric arithmetic characters/operators.
  if (!/^[0-9+\-*/().,%\s×÷^]+$/.test(value)) return null;

  try {
    const normalized = value
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/\^/g, "**")
      .replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");

    if (/\*\*/.test(normalized) && /\*\*\s*\*/.test(normalized)) return null;
    const result = Function(`"use strict"; return (${normalized});`)();
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function extractCalculationExpression(prompt) {
  const raw = String(prompt || "");
  const direct = raw.match(/(?:calculate|compute|evaluate|solve|what is)\s*[:=]?\s*([0-9][0-9+\-*/().,%\s×÷^]*)/i);
  if (direct?.[1]) return direct[1].trim();
  const operation = raw.match(/\b(\d+(?:\.\d+)?\s*[+\-*/×÷^]\s*\d+(?:\.\d+)?(?:\s*[+\-*/×÷^]\s*\d+(?:\.\d+)?)*)(?:\b|\s|$)/);
  return operation?.[1]?.trim() || null;
}

function stableEvidenceId(stepId, type, locator, content) {
  const seed = `${stepId || "step"}|${type || "evidence"}|${locator || ""}|${content || ""}`;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36);
}

function normalizeEvidenceItem({
  result,
  stepId,
  type,
  source,
  locator,
  content,
  quality = 0.75,
  metadata = {},
}) {
  const evidenceId = `E${String(stepId || "step").replace(/[^a-zA-Z0-9_-]/g, "_")}_${type || "evidence"}_${stableEvidenceId(stepId, type, locator, content)}`;
  return {
    id: evidenceId,
    stepId: stepId || null,
    tool: result?.tool || null,
    type: type || "context",
    source: source || "agent_tool",
    locator: clean(locator || "", 500),
    content: clean(content || "", 5000),
    quality: Math.max(0, Math.min(1, Number(quality) || 0)),
    metadata,
  };
}

function buildEvidenceLedger(results = []) {
  const ledger = [];

  for (const result of results) {
    if (!result || !result.success) continue;
    const stepId = result.stepId || result.tool || "step";

    if (result.tool === "web_research") {
      const researchItems = Array.isArray(result.raw?.results)
        ? result.raw.results
        : [];

      if (researchItems.length) {
        researchItems.slice(0, 20).forEach((item, index) => {
          ledger.push(
            normalizeEvidenceItem({
              result,
              stepId,
              type: "web_source",
              source: item?.source || result.raw?.provider || "web_research",
              locator: item?.url || `rank:${item?.rank ?? index + 1}`,
              content: `${item?.title || "Source"}\n${item?.snippet || ""}`,
              quality: Number.isFinite(Number(item?.score))
                ? Math.max(0.45, Math.min(1, Number(item.score)))
                : 0.72,
              metadata: {
                rank: item?.rank ?? index + 1,
                title: clean(item?.title || "", 300),
                url: clean(item?.url || "", 1000),
              },
            })
          );
        });
      } else if (result.raw?.answer) {
        ledger.push(
          normalizeEvidenceItem({
            result,
            stepId,
            type: "web_answer",
            source: result.raw?.provider || "web_research",
            content: result.raw.answer,
            quality: 0.65,
            metadata: { query: clean(result.raw?.query || "", 500) },
          })
        );
      }
      continue;
    }

    if (result.tool === "calculator") {
      ledger.push(
        normalizeEvidenceItem({
          result,
          stepId,
          type: "deterministic_calculation",
          source: "nyxora_calculator",
          locator: result.output,
          content: result.output,
          quality: 1,
        })
      );
      continue;
    }

    if (result.tool === "code_execution") {
      const execution = result.raw || {};
      ledger.push(
        normalizeEvidenceItem({
          result,
          stepId,
          type: "code_execution",
          source: "nyxora_sandbox",
          locator: execution?.exitCode != null
            ? `exitCode:${execution.exitCode}`
            : "sandbox",
          content: [
            result.output ? `stdout:\n${result.output}` : "",
            execution?.stderr ? `stderr:\n${execution.stderr}` : "",
            execution?.error ? `error:\n${execution.error}` : "",
          ].filter(Boolean).join("\n"),
          quality: execution?.success ? 1 : 0.35,
          metadata: {
            language: execution?.language || "javascript",
            durationMs: execution?.durationMs ?? null,
            exitCode: execution?.exitCode ?? null,
            tests: execution?.tests || null,
          },
        })
      );
      continue;
    }

    if (result.tool === "file_understanding") {
      const context = String(result.output || "");
      const names = [...context.matchAll(/(?:^|\n)DOCUMENT:\s*([^\n]+)/g)]
        .map((match) => match[1].trim())
        .filter(Boolean);

      if (names.length) {
        names.slice(0, 20).forEach((name) => {
          ledger.push(
            normalizeEvidenceItem({
              result,
              stepId,
              type: "document",
              source: "uploaded_document",
              locator: name,
              content: context,
              quality: 0.9,
              metadata: { fileName: name },
            })
          );
        });
      } else {
        ledger.push(
          normalizeEvidenceItem({
            result,
            stepId,
            type: "document_context",
            source: "uploaded_document",
            content: context,
            quality: 0.82,
          })
        );
      }
      continue;
    }

    if (result.tool === "vision") {
      ledger.push(
        normalizeEvidenceItem({
          result,
          stepId,
          type: "visual_context",
          source: "uploaded_visual",
          locator: result.raw?.name || "visual_attachment",
          content: result.output,
          quality: result.output && !String(result.output).includes("delegated") ? 0.85 : 0.65,
          metadata: {
            hasVisualAttachment: true,
          },
        })
      );
      continue;
    }

    if (result.tool === "memory" || result.tool === "workspace") {
      ledger.push(
        normalizeEvidenceItem({
          result,
          stepId,
          type: `${result.tool}_context`,
          source: result.tool,
          content: result.output,
          quality: 0.7,
        })
      );
    }
  }

  return ledger.slice(0, MAX_EVIDENCE_ITEMS);
}

function buildEvidenceContext(results = []) {
  const ledger = buildEvidenceLedger(results);
  if (!ledger.length) {
    return {
      ledger,
      text: "EVIDENCE LEDGER: No external or tool-derived evidence was produced. Use ordinary reasoning only and do not fabricate sources.",
    };
  }

  const blocks = ledger.map((item) => [
    `EVIDENCE ID: ${item.id}`,
    `STEP: ${item.stepId}`,
    `TYPE: ${item.type}`,
    `SOURCE: ${item.source}`,
    item.locator ? `LOCATOR: ${item.locator}` : "",
    `QUALITY: ${item.quality.toFixed(2)}`,
    item.content ? `CONTENT:\n${item.content}` : "",
  ].filter(Boolean).join("\n"));

  return {
    ledger,
    text: clean(
      [
        "NYXORA EVIDENCE LEDGER",
        "Evidence below is the only tool-derived factual grounding available to the agent.",
        "Do not treat an evidence item as proof beyond what its content supports.",
        "Do not invent missing URLs, document locations, execution results, or source claims.",
        "",
        blocks.join("\n\n--------------------\n\n"),
      ].join("\n"),
      MAX_CONTEXT_CHARS + 16000
    ),
  };
}

function evidenceStrength(item = {}) {
  const quality = Number(item?.quality);
  const type = String(item?.type || "");
  const source = String(item?.source || "");
  let score = Number.isFinite(quality) ? quality : 0.5;
  if (type === "deterministic_calculation" || type === "code_execution") score += 0.10;
  if (type === "web_source" && item?.metadata?.url) score += 0.03;
  if (source === "uploaded_document") score += 0.04;
  return Math.max(0, Math.min(1, score));
}

function buildContradictionResolutionMessages({ prompt, results }) {
  const evidence = buildEvidenceContext(results);
  const ledger = evidence.ledger;
  if (!ledger.length) return null;
  const candidatePairs = [];
  for (let index = 0; index < ledger.length; index += 1) {
    for (let other = index + 1; other < ledger.length; other += 1) {
      const a = ledger[index];
      const b = ledger[other];
      if (a.stepId === b.stepId && a.type === b.type) continue;
      candidatePairs.push({
        a: { id: a.id, type: a.type, source: a.source, locator: a.locator, content: a.content, quality: a.quality },
        b: { id: b.id, type: b.type, source: b.source, locator: b.locator, content: b.content, quality: b.quality },
      });
      if (candidatePairs.length >= MAX_CONTRADICTION_PAIRS) break;
    }
    if (candidatePairs.length >= MAX_CONTRADICTION_PAIRS) break;
  }
  return [
    "NYXORA ADVANCED CONTRADICTION RESOLUTION",
    "Compare only claims that materially concern the same fact, value, calculation, execution outcome, document fact, or current external information.",
    "Do not manufacture a contradiction merely because two evidence items discuss different facts.",
    "First determine whether the evidence actually conflicts.",
    "Resolve a conflict only when provenance, directness, determinism, freshness, or specificity provides a defensible basis.",
    "Deterministic calculations and successful execution outputs can outrank vague narrative descriptions when they address the same fact.",
    "For web evidence, consider source directness, source metadata, freshness when available, and whether the source actually supports the claim.",
    "For uploaded documents, prefer directly extracted document evidence over model paraphrases.",
    "If the conflict cannot be resolved from available evidence, mark it unresolved. Never invent a missing fact.",
    "Return only JSON.",
    "",
    `USER REQUEST:\n${clean(prompt, 9000)}`,
    "",
    "EVIDENCE ITEMS:",
    ...candidatePairs.map((pair, index) => [
      `PAIR ${index + 1}`,
      `A: ${JSON.stringify(pair.a)}`,
      `B: ${JSON.stringify(pair.b)}`,
    ].join("\n")),
    "",
    '{"contradictions":[{"evidenceIds":["E...","E..."],"conflict":"short description","resolution":"resolved|unresolved","preferredEvidenceIds":["E..."],"reason":"evidence-based reason","confidence":0.0}],"summary":"short assessment"}',
    "Only include genuine contradictions.",
    "preferredEvidenceIds must be empty when resolution=unresolved.",
    "confidence must be between 0 and 1.",
  ].join("\n");
}

async function requestContradictionResolution({ prompt, results, modelResponder }) {
  const evidence = buildEvidenceContext(results);
  if (!evidence.ledger.length || typeof modelResponder !== "function") return { contradictions: [], summary: "", unavailable: true };
  const timeoutMs = Math.max(4000, Math.min(MAX_CONTRADICTION_TIMEOUT_MS, Number(process.env.NYXORA_AGENT_CONTRADICTION_TIMEOUT_MS || DEFAULT_CONTRADICTION_TIMEOUT_MS)));
  try {
    const messages = buildContradictionResolutionMessages({ prompt, results });
    if (!messages) return { contradictions: [], summary: "", unavailable: true };
    let text = "";
    for await (const delta of modelResponder({
      messages: [
        { role: "system", content: messages },
        { role: "user", content: "Resolve the evidence conflicts now and return the JSON result." },
      ],
      prompt: "RESOLVE CONFLICTING AGENT EVIDENCE",
      task: "reasoning",
      timeoutOverrideMs: timeoutMs,
      attachments: [],
    })) {
      text += String(delta || "");
      if (text.length >= CONTRADICTION_MAX_OUTPUT_CHARS) break;
    }
    const parsed = extractJsonObject(text);
    if (!parsed || !Array.isArray(parsed.contradictions)) return { contradictions: [], summary: "", unavailable: true };
    const validIds = new Set(evidence.ledger.map((item) => item.id));
    const contradictions = parsed.contradictions.slice(0, 8).map((item) => {
      const evidenceIds = Array.isArray(item?.evidenceIds) ? item.evidenceIds.filter((id) => validIds.has(id)) : [];
      const preferredEvidenceIds = Array.isArray(item?.preferredEvidenceIds) ? item.preferredEvidenceIds.filter((id) => validIds.has(id)) : [];
      const resolution = String(item?.resolution || "").toLowerCase() === "resolved" ? "resolved" : "unresolved";
      const confidence = Math.max(0, Math.min(1, Number(item?.confidence) || 0));
      const preferred = preferredEvidenceIds.map((id) => evidence.ledger.find((entry) => entry.id === id)).filter(Boolean);
      const strongestPreferred = preferred.length ? Math.max(...preferred.map(evidenceStrength)) : 0;
      const defensibleResolution = resolution === "resolved" && confidence >= CONTRADICTION_MIN_CONFIDENCE && evidenceIds.length >= 2 && preferredEvidenceIds.length > 0 && strongestPreferred >= 0.60;
      return {
        evidenceIds,
        conflict: clean(item?.conflict || "", 1200),
        resolution: defensibleResolution ? "resolved" : "unresolved",
        preferredEvidenceIds: defensibleResolution ? preferredEvidenceIds : [],
        reason: clean(item?.reason || (defensibleResolution ? "Preferred evidence has sufficient provenance and support." : "Available evidence does not justify a definitive resolution."), 1600),
        confidence,
      };
    }).filter((item) => item.evidenceIds.length >= 2 && item.conflict);
    return { contradictions, summary: clean(parsed.summary || "", 1600), unavailable: false };
  } catch (error) {
    console.warn(`[Nyxora Contradiction] RESOLUTION FAILED -> ${error?.message || error}`);
    return { contradictions: [], summary: "", unavailable: true };
  }
}

function buildContradictionContext(resolution = {}) {
  const contradictions = Array.isArray(resolution?.contradictions) ? resolution.contradictions : [];
  if (!contradictions.length) return "";
  const blocks = contradictions.map((item, index) => {
    const status = item.resolution === "resolved" ? "RESOLVED" : "UNRESOLVED";
    return [
      `CONTRADICTION ${index + 1}: ${status}`,
      `CONFLICT: ${item.conflict}`,
      `EVIDENCE IDS: ${item.evidenceIds.join(", ")}`,
      item.preferredEvidenceIds?.length ? `PREFERRED EVIDENCE: ${item.preferredEvidenceIds.join(", ")}` : "PREFERRED EVIDENCE: none",
      `REASON: ${item.reason}`,
      `CONFIDENCE: ${item.confidence.toFixed(2)}`,
    ].join("\n");
  });
  return [
    "NYXORA CONTRADICTION RESOLUTION",
    resolution.summary ? `SUMMARY: ${resolution.summary}` : "",
    ...blocks,
    "",
    "For RESOLVED conflicts, use only the preferred evidence for the disputed fact.",
    "For UNRESOLVED conflicts, explicitly preserve the uncertainty instead of selecting a fact without support.",
  ].filter(Boolean).join("\n\n");
}

function buildEvidenceAuditMessages({ prompt, answer, results }) {
  const evidence = buildEvidenceContext(results);
  return [
    "NYXORA EVIDENCE & GROUNDING AUDIT",
    "Audit only factual claims that depend on tool results, uploaded documents, web research, calculations, or code execution.",
    "Do not require external evidence for ordinary reasoning, explanations, transformations, or clearly stated uncertainty.",
    "A claim is supported only when the evidence content actually entails or directly supports it.",
    "Flag fabricated sources, unsupported document facts, unsupported execution outcomes, and claims that contradict tool results.",
    "If the answer is grounded enough, return accept.",
    "",
    `USER REQUEST:\n${clean(prompt, 9000)}`,
    "",
    `DRAFT ANSWER:\n${clean(answer, 12000)}`,
    "",
    evidence.text,
    "",
    "RETURN ONLY JSON:",
    '{"decision":"accept|revise","confidence":0.0,"unsupportedClaims":[{"claim":"...","reason":"...","evidenceIds":[]}],"contradictions":["..."],"missingEvidence":["..."],"summary":"short assessment"}',
    "confidence must be between 0 and 1.",
  ].join("\n");
}

async function requestEvidenceAudit({ prompt, answer, results, modelResponder }) {
  const evidence = buildEvidenceContext(results);
  if (!evidence.ledger.length || typeof modelResponder !== "function") {
    return { decision: "accept", confidence: 1, unavailable: true, unsupportedClaims: [], contradictions: [], missingEvidence: [] };
  }

  const timeoutMs = Math.max(
    4000,
    Math.min(
      MAX_EVIDENCE_AUDIT_TIMEOUT_MS,
      Number(process.env.NYXORA_AGENT_EVIDENCE_AUDIT_TIMEOUT_MS || DEFAULT_EVIDENCE_AUDIT_TIMEOUT_MS)
    )
  );

  try {
    let text = "";
    for await (const delta of modelResponder({
      messages: [
        { role: "system", content: buildEvidenceAuditMessages({ prompt, answer, results }) },
        { role: "user", content: "Audit the draft answer against the evidence ledger and return the JSON decision." },
      ],
      prompt: "AUDIT FINAL ANSWER FOR EVIDENCE AND GROUNDING",
      task: "reasoning",
      timeoutOverrideMs: timeoutMs,
      attachments: [],
    })) {
      text += String(delta || "");
      if (text.length >= EVIDENCE_AUDIT_MAX_OUTPUT_CHARS) break;
    }

    const parsed = extractJsonObject(text);
    if (!parsed || !["accept", "revise"].includes(String(parsed.decision || "").toLowerCase())) {
      return { decision: "accept", confidence: 0.5, unavailable: true, unsupportedClaims: [], contradictions: [], missingEvidence: [] };
    }

    return {
      decision: String(parsed.decision).toLowerCase(),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      unsupportedClaims: Array.isArray(parsed.unsupportedClaims) ? parsed.unsupportedClaims.slice(0, 8) : [],
      contradictions: Array.isArray(parsed.contradictions) ? parsed.contradictions.slice(0, 8) : [],
      missingEvidence: Array.isArray(parsed.missingEvidence) ? parsed.missingEvidence.slice(0, 8) : [],
      summary: clean(parsed.summary || "", 1200),
    };
  } catch (error) {
    console.warn(`[Nyxora Evidence] AUDIT FAILED -> ${error?.message || error}`);
    return { decision: "accept", confidence: 0.5, unavailable: true, unsupportedClaims: [], contradictions: [], missingEvidence: [] };
  }
}

function buildToolContext(results) {
  const blocks = results.map((result) => {
    const status = result.success ? "SUCCESS" : "FAILED";
    return [
      `TOOL: ${result.tool}`,
      `STATUS: ${status}`,
      result.reason ? `REASON: ${clean(result.reason, 500)}` : "",
      result.output ? `RESULT:\n${clean(result.output)}` : "",
      result.error ? `ERROR:\n${clean(result.error, 3000)}` : "",
      Array.isArray(result.evidence) && result.evidence.length
        ? `EVIDENCE IDS: ${result.evidence.map((item) => item.id).join(", ")}`
        : "",
    ].filter(Boolean).join("\n");
  });

  return clean(blocks.join("\n\n====================\n\n"), MAX_CONTEXT_CHARS);
}

function buildSynthesisMessages(
  messages,
  prompt,
  plan,
  results,
  evidenceRevisionContext = "",
  contradictionContext = "",
  confidenceContext = "",
  collaborationContext = "",
  jarvisCommand = null
) {
  const planText = plan
    .map((step, index) => `${index + 1}. ${step.tool} — ${step.reason}`)
    .join("\n");

  const context = [
    "NYXORA AGENT EXECUTION CONTEXT",
    "You are synthesizing the final answer after a multi-step agent workflow.",
    "Use verified tool results as evidence. Do not claim an action succeeded when its result is FAILED.",
    "Ground factual claims in the evidence ledger when applicable.",
    "For web-derived claims, preserve source titles and URLs from the evidence ledger when useful to the user.",
    "If a requested tool was unavailable, state that limitation clearly.",
    "Do not invent web sources, file contents, workspace changes, or execution results.",
    "Be concise unless the user requested detail.",
    "",
    `USER REQUEST:\n${clean(prompt, 12000)}`,
    "",
    `EXECUTION PLAN:\n${planText}`,
    "",
    `TOOL RESULTS:\n${buildToolContext(results)}`,
    `\n${buildEvidenceContext(results).text}`,
    contradictionContext ? `\nCONTRADICTION RESOLUTION:\n${contradictionContext}` : "",
    confidenceContext ? `\nCONFIDENCE ASSESSMENT:\n${confidenceContext}` : "",
    collaborationContext ? `\nCOLLABORATIVE AGENT INSIGHTS:\n${collaborationContext}` : "",
    evidenceRevisionContext ? `\nEVIDENCE REVISION REQUIREMENTS:\n${evidenceRevisionContext}` : "",
    jarvisCommand ? `\nJARVIS RESPONSE GUIDANCE:\n${buildJarvisResponseGuidance(jarvisCommand)}` : "",
  ].filter(Boolean).join("\n");

  return [
    {
      role: "system",
      content: context,
    },
    ...messages,
    {
      role: "user",
      content: "Verify the workflow results and provide the final answer to the user. Do not expose internal routing or orchestration details unless useful.",
    },
  ];
}

async function runStep(step, { prompt, messages, results, options, dependencyResults = [] }) {
  const dependencyContext = dependencyResults.length
    ? `\n\nDEPENDENCY RESULTS:\n${buildToolContext(dependencyResults)}`
    : "";
  const reflectionContext = String(options?.reflectionContext || "").trim();
  const jarvisContext = options?.jarvisCommand
    ? `\n\n${buildJarvisCommandContext(options.jarvisCommand)}\n\n${buildJarvisResponseGuidance(options.jarvisCommand)}`
    : "";
  const effectivePrompt = `${prompt}${dependencyContext}${jarvisContext}${
    reflectionContext ? `\n\n${reflectionContext}` : ""
  }`;
  if (step.tool === "web_research") {
    const research = await executeNyxoraWebResearch(effectivePrompt, {
      maxResults: Number(process.env.NYXORA_AGENT_WEB_MAX_RESULTS || 6),
      timeoutMs: Number(process.env.NYXORA_AGENT_WEB_TIMEOUT_MS || 8000),
    });

    return {
      tool: step.tool,
      success: Boolean(research),
      output: research?.answer || research?.results?.map((item) => `${item.title || "Source"}: ${item.url || ""}\n${item.snippet || ""}`).join("\n\n") || "",
      reason: step.reason,
      raw: research,
    };
  }

  if (step.tool === "calculator") {
    const expression = extractCalculationExpression(effectivePrompt);
    const value = safeEvaluateCalculator(expression);
    return {
      tool: step.tool,
      success: value !== null,
      output: value === null ? "" : `${expression} = ${value}`,
      error: value === null ? "No safe arithmetic expression could be extracted." : "",
      reason: step.reason,
    };
  }

  if (step.tool === "code_execution") {
    let code = extractJavaScript(effectivePrompt);

    // Agent workflows may explicitly ask Nyxora to write and test code.
    // In that case, generate the smallest executable artifact first, then
    // send it through the deterministic execution sandbox.
    if (!code && options?.modelResponder && /\b(?:write|generate|create|implement|build)\b[\s\S]*\b(?:code|script|function|program)\b/i.test(effectivePrompt)) {
      let generated = "";
      for await (const delta of options.modelResponder({
        messages: [
          {
            role: "system",
            content: "Generate only executable JavaScript for the user's requested task. Put the complete code in one fenced javascript block. Do not include explanations outside the code block.",
          },
          ...messages,
          { role: "user", content: effectivePrompt },
        ],
        prompt: "GENERATE EXECUTABLE JAVASCRIPT FOR AGENT TESTING",
        task: "coding",
      })) {
        generated += delta;
      }
      code = extractJavaScript(generated);
    }

    if (!code) {
      return {
        tool: step.tool,
        success: false,
        output: "",
        error: "No executable JavaScript was supplied or generated for this agent step.",
        reason: step.reason,
      };
    }

    const maxAttempts = Math.max(1, Math.min(3, Number(process.env.NYXORA_AGENT_CODE_MAX_ATTEMPTS || 3)));
    const attempts = [];
    let currentCode = code;
    let finalExecution = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const execution = await executeCode({ language: "javascript", code: currentCode });
      finalExecution = execution;
      attempts.push({
        attempt,
        code: currentCode,
        success: Boolean(execution?.success),
        stdout: execution?.stdout || "",
        stderr: execution?.stderr || "",
        error: execution?.error || "",
      });

      if (execution?.success) break;

      if (attempt >= maxAttempts || !options?.modelResponder) break;

      let repairText = "";
      for await (const delta of options.modelResponder({
        messages: [
          {
            role: "system",
            content: "You are Nyxora's code repair agent. Return only corrected executable JavaScript inside one fenced javascript block. Preserve the user's intent, fix the reported failure, and do not add explanations.",
          },
          {
            role: "user",
            content: `Original request:\n${clean(effectivePrompt, 6000)}\n\nFailed code:\n${currentCode}\n\nExecution error:\n${clean(execution?.error || execution?.stderr || "Unknown execution failure", 4000)}`,
          },
        ],
        prompt: "REPAIR EXECUTABLE JAVASCRIPT AFTER FAILED AGENT TEST",
        task: "coding",
      })) {
        repairText += delta;
      }

      const repaired = extractJavaScript(repairText);
      if (!repaired) break;
      currentCode = repaired;
    }

    return {
      tool: step.tool,
      success: Boolean(finalExecution?.success),
      output: finalExecution?.stdout || "",
      error: finalExecution?.success ? "" : (finalExecution?.error || finalExecution?.stderr || ""),
      reason: step.reason,
      raw: finalExecution,
      attempts,
    };
  }

  if (step.tool === "computer_control") {
    const gateError = controlGate("NYXORA_COMPUTER_CONTROL_ENABLED");
    if (gateError) return { tool: step.tool, success: false, output: "", error: gateError, reason: step.reason };
    const command = options?.jarvisCommand || {};
    const value = effectivePrompt.toLowerCase();
    if (command.requiresConfirmation) {
      return { tool: step.tool, success: false, output: "", error: "This desktop action requires explicit confirmation before execution.", reason: step.reason, requiresConfirmation: true };
    }
    if (/hotkey|shortcut/.test(value)) {
      const match = effectivePrompt.match(/(?:hotkey|shortcut)\s+(.+)/i);
      return { ...await hotkey({ keys: match?.[1] || [] }), tool: step.tool, reason: step.reason };
    }
    if (/press (?:the )?([a-z0-9_ -]+)/i.test(effectivePrompt)) {
      const match = effectivePrompt.match(/press (?:the )?([a-z0-9_ -]+)/i);
      return { ...await pressKey({ key: match?.[1]?.trim() }), tool: step.tool, reason: step.reason };
    }
    if (/type (?:the text |text )?["']?([\s\S]+?)["']?$/i.test(effectivePrompt)) {
      const match = effectivePrompt.match(/type (?:the text |text )?["']?([\s\S]+?)["']?$/i);
      if (match?.[1]) return { ...await typeText({ text: match[1].trim() }), tool: step.tool, reason: step.reason };
    }
    if (/move (?:the )?(?:mouse|cursor)/i.test(effectivePrompt)) {
      const match = effectivePrompt.match(/(-?\d+)\s*[, ]\s*(-?\d+)/);
      return { ...await moveMouse({ x: Number(match?.[1] || 0), y: Number(match?.[2] || 0) }), tool: step.tool, reason: step.reason };
    }
    if (/click/i.test(effectivePrompt)) return { ...await clickMouse({ button: /right click/i.test(value) ? "right" : "left", clicks: /double click/i.test(value) ? 2 : 1 }), tool: step.tool, reason: step.reason };
    return { tool: step.tool, success: false, output: "", error: "Could not safely determine the requested mouse or keyboard action.", reason: step.reason };
  }

  if (step.tool === "browser_control") {
    const gateError = controlGate("NYXORA_BROWSER_CONTROL_ENABLED");
    if (gateError) return { tool: step.tool, success: false, output: "", error: gateError, reason: step.reason };
    const command = options?.jarvisCommand || {};
    if (command.requiresConfirmation && /(?:submit|send|purchase|buy|delete|remove|post|publish)/i.test(effectivePrompt)) {
      return { tool: step.tool, success: false, output: "", error: "This browser action requires explicit confirmation before execution.", reason: step.reason, requiresConfirmation: true };
    }
    if (command.browserSearch) {
      const url = `https://www.google.com/search?q=${encodeURIComponent(command.browserSearch)}`;
      const result = await navigateBrowser({ url });
      return { ...result, tool: step.tool, output: result.success ? `Opened browser search for: ${command.browserSearch}` : "", reason: step.reason, raw: result };
    }
    if (command.browserUrl) {
      const result = await navigateBrowser({ url: command.browserUrl });
      return { ...result, tool: step.tool, output: result.success ? `Opened ${result.url}` : "", reason: step.reason, raw: result };
    }
    if (/click/i.test(effectivePrompt)) {
      const match = effectivePrompt.match(/click (?:on )?["']?([^"']+)["']?/i);
      const result = await clickBrowser({ text: match?.[1]?.trim() });
      return { ...result, tool: step.tool, output: result.success ? `Clicked ${match?.[1] || "the requested element"}.` : "", reason: step.reason, raw: result };
    }
    if (/type/i.test(effectivePrompt)) {
      const selectorMatch = effectivePrompt.match(/selector\s+["']([^"']+)["']/i);
      const textMatch = effectivePrompt.match(/type(?: the text)?[ :]?["']([\s\S]+)["']/i);
      const result = await typeBrowser({ selector: selectorMatch?.[1], text: textMatch?.[1] || "" });
      return { ...result, tool: step.tool, output: result.success ? "Browser text entered." : "", reason: step.reason, raw: result };
    }
    const snapshot = await browserSnapshot();
    return { ...snapshot, tool: step.tool, output: snapshot.success ? snapshot.text : "", reason: step.reason, raw: snapshot };
  }

  if (step.tool === "application_control") {
    const gateError = controlGate("NYXORA_COMPUTER_CONTROL_ENABLED");
    if (gateError) return { tool: step.tool, success: false, output: "", error: gateError, reason: step.reason };
    const command = options?.jarvisCommand || {};
    const result = await openApplication({ name: command.application });
    return { ...result, tool: step.tool, output: result.success ? `Opened ${command.application}.` : "", reason: step.reason, raw: result };
  }

  if (step.tool === "filesystem_control") {
    const gateError = controlGate("NYXORA_FILESYSTEM_CONTROL_ENABLED");
    if (gateError) return { tool: step.tool, success: false, output: "", error: gateError, reason: step.reason };
    const command = options?.jarvisCommand || {};
    const value = effectivePrompt.toLowerCase();
    const target =
      command.filePath ||
      (/\bdownloads?\b/i.test(value) ? "Downloads" : ".");

    if (/\b(?:open|launch|show|bring up|go to)\b[\s\S]{0,80}\b(?:folder|directory)?\s*(?:downloads?|this folder|that folder)\b/i.test(value) ||
        /\bopen\s+(?:the\s+)?downloads?\b/i.test(value)) {
      const result = await openFolder({ path: target });
      return {
        ...result,
        tool: step.tool,
        output: result.success
          ? `Opened ${result.path === "." ? "the folder" : result.path} in File Explorer.`
          : "",
        reason: step.reason,
        raw: result,
      };
    }

    if (/delete|remove|erase/i.test(value)) {
      const result = await deletePath({ path: target, confirm: Boolean(command.confirmationProvided) });
      return { ...result, tool: step.tool, output: result.success ? `Deleted ${target}.` : "", reason: step.reason, raw: result };
    }
    if (/write|create file|overwrite/i.test(value)) {
      const contentMatch = effectivePrompt.match(/(?:content|containing|with)\s+["']([\s\S]*?)["'](?:\s|$)/i);
      const result = await writeFile({ path: target, content: contentMatch?.[1] || "", confirm: Boolean(command.confirmationProvided) });
      return { ...result, tool: step.tool, output: result.success ? `Wrote ${target}.` : "", reason: step.reason, raw: result };
    }
    if (/create (?:a )?(?:folder|directory)|make (?:a )?(?:folder|directory)/i.test(value)) {
      const result = await createDirectory({ path: target, confirm: Boolean(command.confirmationProvided) });
      return { ...result, tool: step.tool, output: result.success ? `Created ${target}.` : "", reason: step.reason, raw: result };
    }
    if (/read file/i.test(value)) {
      const result = await readFile({ path: target });
      return { ...result, tool: step.tool, output: result.success ? result.content : "", reason: step.reason, raw: result };
    }
    const result = await listFiles({ path: target });
    return { ...result, tool: step.tool, output: result.success ? result.entries.map((item) => `${item.type}: ${item.name}`).join("\n") : "", reason: step.reason, raw: result };
  }

  if (step.tool === "os_control") {
    const gateError = controlGate("NYXORA_COMPUTER_CONTROL_ENABLED");
    if (gateError) return { tool: step.tool, success: false, output: "", error: gateError, reason: step.reason };
    const command = options?.jarvisCommand || {};
    const value = effectivePrompt.toLowerCase();
    if (/shutdown|shut down|restart|reboot|sleep|power off/i.test(value)) {
      const action = /shutdown|shut down|power off/.test(value) ? "shutdown" : /restart|reboot/.test(value) ? "restart" : "sleep";
      const result = await powerAction({ action, confirm: Boolean(command.confirmationProvided) });
      return { ...result, tool: step.tool, output: result.success ? `${action} command accepted.` : "", reason: step.reason, raw: result };
    }
    if (command.browserUrl || /open url/i.test(value)) {
      const result = await openUrl({ url: command.browserUrl });
      return { ...result, tool: step.tool, output: result.success ? `Opened ${result.url}.` : "", reason: step.reason, raw: result };
    }
    const result = await getSystemStatus();
    return { ...result, tool: step.tool, output: result.success ? `Platform: ${result.platform}; uptime: ${result.uptimeSeconds}s; CPU: ${result.cpuCount}; free memory: ${result.memory.free}.` : "", reason: step.reason, raw: result };
  }

  if (step.tool === "screen_observation") {
    const gateError = controlGate("NYXORA_COMPUTER_CONTROL_ENABLED");
    if (gateError) return { tool: step.tool, success: false, output: "", error: gateError, reason: step.reason };
    const result = await observeDesktop();
    return { ...result, tool: step.tool, output: result.success ? "Desktop screenshot captured for observation." : "", reason: step.reason, raw: result };
  }

  if (step.tool === "action_verification") {
    const latestDependency = dependencyResults.filter(Boolean).at(-1);
    const verificationGate = latestDependency?.tool === "browser_control"
      ? "NYXORA_BROWSER_CONTROL_ENABLED"
      : latestDependency?.tool === "filesystem_control"
        ? "NYXORA_FILESYSTEM_CONTROL_ENABLED"
        : "NYXORA_COMPUTER_CONTROL_ENABLED";
    const gateError = controlGate(verificationGate);
    if (gateError) return { tool: step.tool, success: false, output: "", error: gateError, reason: step.reason };
    const failedDependency = dependencyResults.find((item) => !validateAgentResult(item).valid);
    if (failedDependency) {
      return {
        tool: step.tool,
        success: false,
        output: "",
        error: `Cannot verify an action whose dependency failed: ${failedDependency.tool}.`,
        reason: step.reason,
      };
    }

    const dependency = dependencyResults.filter((item) => item?.success).at(-1);
    const result = await verifyAction({ action: dependency?.tool || "desktop" });
    return { ...result, tool: step.tool, output: result.success ? "Action verification completed." : "", reason: step.reason, raw: result };
  }

  // Document/visual/workspace/memory context may be supplied by the chat
  // layer. For documents, prefer the structured extraction result instead
  // of pretending an external action occurred.
  if (step.tool === "file_understanding") {
    const context = clean(options?.documentContext || "", MAX_RESULT_CHARS);
    return {
      tool: step.tool,
      success: Boolean(context),
      output: context,
      error: context ? "" : "No structured document context was supplied.",
      reason: step.reason,
    };
  }

  if (step.tool === "vision") {
    const context = clean(options?.documentContext || "", MAX_RESULT_CHARS);
    return {
      tool: step.tool,
      success: Boolean(context) || Boolean(options?.hasVisualAttachments),
      output: context || "Visual attachment delegated to multimodal model.",
      error: context || options?.hasVisualAttachments
        ? ""
        : "No visual attachment context was supplied.",
      reason: step.reason,
    };
  }

  if (["workspace", "memory"].includes(step.tool)) {
    return {
      tool: step.tool,
      success: true,
      output: "Context delegated to the final synthesis model.",
      reason: step.reason,
    };
  }

  return {
    tool: step.tool,
    success: false,
    output: "",
    error: `Unsupported agent tool: ${step.tool}`,
    reason: step.reason,
  };
}

function extractJavaScript(text) {
  const fenced = [...String(text || "").matchAll(/```(?:javascript|js|node|nodejs)?\s*\n([\s\S]*?)```/gi)];
  if (fenced.length) return fenced[0][1].trim();

  const inline = String(text || "").match(/(?:^|\n)\s*((?:const|let|var)\s+[\s\S]{1,500})$/i);
  return inline?.[1]?.trim() || null;
}


function validateAgentPlan(plan, maxSteps = 10) {
  if (!Array.isArray(plan) || plan.length === 0) {
    return { valid: false, reason: "Agent plan is empty." };
  }

  if (plan.length > maxSteps) {
    return {
      valid: false,
      reason: `Agent plan exceeds the ${maxSteps}-step limit.`,
    };
  }

  const ids = new Set();
  const byId = new Map();

  for (const step of plan) {
    if (!step?.id || !step?.tool || ids.has(step.id)) {
      return {
        valid: false,
        reason: "Agent plan contains a missing or duplicate step identifier.",
      };
    }

    ids.add(step.id);
    byId.set(step.id, step);

    if (!Array.isArray(step.dependsOn)) {
      return {
        valid: false,
        reason: `Agent step ${step.id} has invalid dependencies.`,
      };
    }

    for (const dependency of step.dependsOn) {
      if (dependency === step.id || !byId.has(dependency) && !plan.some((item) => item.id === dependency)) {
        return {
          valid: false,
          reason: `Agent step ${step.id} references an invalid dependency.`,
        };
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();

  const visit = (id) => {
    if (visiting.has(id)) return false;
    if (visited.has(id)) return true;

    const step = byId.get(id);
    visiting.add(id);

    for (const dependency of step.dependsOn) {
      if (!visit(dependency)) return false;
    }

    visiting.delete(id);
    visited.add(id);
    return true;
  };

  for (const step of plan) {
    if (!visit(step.id)) {
      return {
        valid: false,
        reason: "Agent plan contains a dependency cycle.",
      };
    }
  }

  const synthesis = plan.find((step) => step.tool === "model_synthesis");
  if (!synthesis || synthesis !== plan[plan.length - 1]) {
    return {
      valid: false,
      reason: "Agent plan must end with model synthesis.",
    };
  }

  return { valid: true, reason: "" };
}

function validateAgentResult(result) {
  if (!result || typeof result !== "object") {
    return { valid: false, reason: "Tool returned no structured result." };
  }

  if (!result.tool) {
    return { valid: false, reason: "Tool result is missing its tool identifier." };
  }

  if (!result.success) {
    return {
      valid: false,
      reason: result.error || "Tool execution failed.",
    };
  }

  if (
    ["calculator", "web_research", "code_execution"].includes(result.tool) &&
    !String(result.output || "").trim()
  ) {
    return {
      valid: false,
      reason: "Tool reported success but returned no usable output.",
    };
  }

  return { valid: true, reason: "" };
}

function summarizeAgentFailure(step, result, attempt) {
  return {
    tool: step.tool,
    success: false,
    output: "",
    error: clean(
      result?.error ||
        `Agent step ${step.tool} failed validation on attempt ${attempt}.`,
      3000
    ),
    reason: step.reason,
    recoveryAttempt: attempt,
  };
}

function dependencyFailure(step, dependencyResults) {
  const failed = dependencyResults.find(
    (result) => !validateAgentResult(result).valid
  );

  if (!failed) return null;

  return {
    tool: step.tool,
    success: false,
    output: "",
    error: `Dependency ${failed.tool} did not produce a verified result.`,
    reason: step.reason,
    dependencyFailure: failed.tool,
  };
}

function createStepSignature(step, dependencyResults = []) {
  return [
    step.id,
    step.tool,
    dependencyResults
      .map((result) => `${result.tool}:${Boolean(result.success)}`)
      .join(","),
  ].join("|");
}

function buildAgentTraceEntry({
  step,
  status,
  attempt,
  startedAt,
  result = null,
  error = null,
}) {
  return {
    stepId: step?.id || null,
    tool: step?.tool || null,
    status,
    attempt,
    durationMs: Math.max(0, Date.now() - startedAt),
    success: Boolean(result?.success),
    error: clean(error?.message || result?.error || "", 1000),
  };
}

function verifyFinalAnswer(answer, results) {
  const text = String(answer || "").trim();

  if (!text) {
    return {
      valid: false,
      reason: "Final synthesis returned no usable answer.",
    };
  }

  const failedTools = results
    .filter((result) => !validateAgentResult(result).valid)
    .map((result) => result.tool);

  for (const tool of failedTools) {
    const escapedTool = String(tool).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const successClaim = new RegExp(
      `\\b${escapedTool}\\b[^.\\n]{0,100}\\b(?:succeeded|successful|completed successfully|verified successfully)\\b`,
      "i"
    );

    if (successClaim.test(text)) {
      return {
        valid: false,
        reason: `Final answer incorrectly claims ${tool} succeeded.`,
      };
    }
  }

  return { valid: true, reason: "" };
}

function readySteps(plan, completed) {
  return plan.filter((step) =>
    !completed.has(step.id) &&
    step.dependsOn.every((dependency) => completed.has(dependency))
  );
}


export async function* runNyxoraAgent({
  messages = [],
  prompt = "",
  mode = null,
  taskAnalysis = {},
  documentContext = "",
  hasVisualAttachments = false,
  visualAttachments = [],
  modelResponder,
  userId = null,
  agentMemory = null,
  jarvisCommand = null,
}) {
  const startedAt = Date.now();

  transitionAgentArchitecturePhase(architectureState, "listen", "active");
  transitionAgentArchitecturePhase(architectureState, "listen", "completed");
  transitionAgentArchitecturePhase(architectureState, "understand", "active");

  const effectiveUserId = userId || taskAnalysis?.userId || null;
  const persistentMemory =
    agentMemory || (await loadPersistentAgentMemory(effectiveUserId));
  const effectiveAgentMemory = normalizeAgentMemory(persistentMemory);

  const enrichedTaskAnalysis = {
    ...taskAnalysis,
    agentMemory: effectiveAgentMemory,
    jarvisCommand,
  };

  transitionAgentArchitecturePhase(architectureState, "understand", "completed");
  transitionAgentArchitecturePhase(architectureState, "think", "active");

  const maxSteps = Math.max(
    2,
    Math.min(
      MAX_AGENT_STEPS,
      Number(process.env.NYXORA_AGENT_MAX_STEPS || DEFAULT_MAX_STEPS)
    )
  );

  const maxRetries = Math.max(
    0,
    Math.min(
      MAX_RETRIES,
      Number(process.env.NYXORA_AGENT_STEP_RETRIES || DEFAULT_MAX_RETRIES)
    )
  );

  const budgetMs = Math.max(
    10000,
    Math.min(
      MAX_AGENT_BUDGET_MS,
      Number(process.env.NYXORA_AGENT_BUDGET_MS || DEFAULT_AGENT_BUDGET_MS)
    )
  );

  const stepTimeoutMs = Math.max(
    1000,
    Number(
      process.env.NYXORA_AGENT_STEP_TIMEOUT_MS || DEFAULT_STEP_TIMEOUT_MS
    )
  );

  const maxParallelSteps = Math.max(
    1,
    Math.min(
      MAX_PARALLEL_STEPS,
      Number(
        process.env.NYXORA_AGENT_MAX_PARALLEL_STEPS ||
          DEFAULT_MAX_PARALLEL_STEPS
      )
    )
  );

  const deterministicPlan = buildAdaptiveFallbackPlan({
    prompt,
    taskAnalysis: enrichedTaskAnalysis,
    maxSteps,
  });

  transitionAgentArchitecturePhase(architectureState, "think", "completed");
  transitionAgentArchitecturePhase(architectureState, "plan", "active");

  const adaptivePlan = await requestAdaptivePlan({
    messages,
    prompt,
    taskAnalysis: enrichedTaskAnalysis,
    documentContext,
    hasVisualAttachments,
    modelResponder,
    maxSteps,
  });

  let plan = (adaptivePlan || deterministicPlan).slice(0, maxSteps);
  const planValidation = validateAgentPlan(plan, maxSteps);

  if (!planValidation.valid) {
    throw new Error(`Nyxora agent plan rejected: ${planValidation.reason}`);
  }

  transitionAgentArchitecturePhase(architectureState, "plan", "completed");
  transitionAgentArchitecturePhase(architectureState, "act", "active");

  const maxPlanRevisions = Math.max(
    0,
    Math.min(
      MAX_PLAN_REVISIONS,
      Number(
        process.env.NYXORA_AGENT_MAX_PLAN_REVISIONS ||
          DEFAULT_MAX_PLAN_REVISIONS
      )
    )
  );

  let planRevisionCount = 0;
  let reflectionContext = "";

  const completed = new Set();
  const results = [];
  const resultByStep = new Map();
  const executionSignatures = new Set();
  const trace = [];
  let resourceLedger = buildResourceLedger({
    prompt,
    messages,
    results,
    trace,
  });
  let lastConfidence = null;
  let collaborationContext = "";
  let checkpointCount = 0;

  const budgetExceeded = () => Date.now() - startedAt >= budgetMs;

  console.log(
    `[Nyxora Agent] START -> steps=${plan.length} | parallel=${maxParallelSteps} | retries=${maxRetries} | budget=${budgetMs} ms | tools=${plan
      .map((step) => step.tool)
      .join(",")}`
  );

  console.log(
    `[Nyxora Agent] PLAN -> ${plan
      .map(
        (step, index) =>
          `${index + 1}:${step.tool}${
            step.dependsOn.length
              ? `[after:${step.dependsOn.join("+")}]`
              : ""
          }`
      )
      .join(" | ")}`
  );

  while (true) {
    if (budgetExceeded()) {
      throw new Error("Nyxora agent budget exceeded before workflow completion.");
    }

    const ready = readySteps(plan, completed).filter(
      (step) => step.tool !== "model_synthesis"
    );

    if (!ready.length) break;

    // Execute every currently-ready independent step in parallel, bounded by
    // the configured concurrency limit. Dependency steps are intentionally
    // excluded until their prerequisites have completed.
    const dynamicParallelLimit =
      resourceLedger.estimatedCostUnits > DEFAULT_MAX_ESTIMATED_COST_UNITS * 0.8
        ? Math.max(1, Math.floor(maxParallelSteps / 2))
        : maxParallelSteps;
    const batch = ready.slice(0, dynamicParallelLimit);
    const waveStartedAt = Date.now();

    console.log(
      `[Nyxora Agent] PARALLEL WAVE -> size=${batch.length} | tools=${batch
        .map((step) => step.tool)
        .join(",")}`
    );

    const batchResults = await Promise.all(
      batch.map(async (step) => {
        const dependencyResults = step.dependsOn
          .map((id) => resultByStep.get(id))
          .filter(Boolean);

        const dependencyError = dependencyFailure(step, dependencyResults);

        if (dependencyError) {
          trace.push(
            buildAgentTraceEntry({
              step,
              status: "dependency_blocked",
              attempt: 0,
              startedAt,
              result: dependencyError,
              error: new Error(dependencyError.error),
            })
          );
          return dependencyError;
        }

        const signature = createStepSignature(step, dependencyResults);

        if (executionSignatures.has(signature)) {
          const loopGuard = summarizeAgentFailure(
            step,
            { error: "Repeated identical agent step blocked by loop protection." },
            0
          );

          trace.push(
            buildAgentTraceEntry({
              step,
              status: "loop_blocked",
              attempt: 0,
              startedAt,
              result: loopGuard,
              error: new Error(loopGuard.error),
            })
          );

          return loopGuard;
        }

        executionSignatures.add(signature);

        let lastResult = null;

        for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
          if (budgetExceeded()) {
            lastResult = summarizeAgentFailure(
              step,
              { error: "Agent budget exceeded." },
              attempt
            );

            trace.push(
              buildAgentTraceEntry({
                step,
                status: "budget_exceeded",
                attempt,
                startedAt,
                result: lastResult,
                error: new Error(lastResult.error),
              })
            );
            break;
          }

          const stepStarted = Date.now();

          try {
            console.log(
              `[Nyxora Agent] STEP TRY -> ${step.tool} | attempt=${attempt}/${maxRetries + 1}`
            );

            const timeoutMs = Math.min(
              stepTimeoutMs,
              Math.max(1000, budgetMs - (Date.now() - startedAt))
            );

            let timer = null;

            const timeoutPromise = new Promise((_, reject) => {
              timer = setTimeout(
                () => reject(new Error("Agent step timeout")),
                timeoutMs
              );
            });

            let result;

            try {
              result = await Promise.race([
                runStep(step, {
                  prompt,
                  messages,
                  results,
                  dependencyResults,
                  options: {
                    modelResponder,
                    documentContext,
                    hasVisualAttachments,
                    visualAttachments,
                    reflectionContext,
                    agentMemory: effectiveAgentMemory,
                    jarvisCommand,
                  },
                }),
                timeoutPromise,
              ]);
            } finally {
              if (timer) clearTimeout(timer);
            }

            const stepEvidence = buildEvidenceLedger([{ ...result, stepId: step.id }]);
            result = {
              ...result,
              stepId: step.id,
              evidence: stepEvidence,
            };

            const validation = validateAgentResult(result);

            if (validation.valid) {
              trace.push(
                buildAgentTraceEntry({
                  step,
                  status: "success",
                  attempt,
                  startedAt: stepStarted,
                  result,
                })
              );

              console.log(
                `[Nyxora Agent] STEP -> ${step.tool} | success=true | attempt=${attempt} | ${Date.now() - stepStarted} ms`
              );

              return {
                ...result,
                attempts: attempt,
              };
            }

            lastResult = summarizeAgentFailure(
              step,
              { error: validation.reason },
              attempt
            );

            trace.push(
              buildAgentTraceEntry({
                step,
                status: "validation_failed",
                attempt,
                startedAt: stepStarted,
                result: lastResult,
                error: new Error(validation.reason),
              })
            );

            console.warn(
              `[Nyxora Agent] STEP VALIDATION FAILED -> ${step.tool} | ${validation.reason}`
            );
          } catch (error) {
            lastResult = summarizeAgentFailure(step, error, attempt);

            trace.push(
              buildAgentTraceEntry({
                step,
                status: "failed",
                attempt,
                startedAt: stepStarted,
                result: lastResult,
                error,
              })
            );

            console.warn(
              `[Nyxora Agent] STEP FAILED -> ${step.tool} | attempt=${attempt} | ${error?.message || error}`
            );
          }

          if (attempt <= maxRetries) {
            console.log(
              `[Nyxora Agent] STEP RECOVERY -> ${step.tool} | retrying`
            );
          }
        }

        console.log(
          `[Nyxora Agent] STEP FINAL -> ${step.tool} | success=false`
        );

        return lastResult;
      })
    );

    batch.forEach((step, index) => {
      completed.add(step.id);
      const result = {
        ...(batchResults[index] || {}),
        stepId: step.id,
      };
      resultByStep.set(step.id, result);
      results.push(result);
    });

    resourceLedger = buildResourceLedger({
      prompt,
      messages,
      results,
      trace,
    });

    checkpointCount += 1;
    if (checkpointCount % Math.max(
      1,
      Number(
        process.env.NYXORA_AGENT_CHECKPOINT_INTERVAL ||
          DEFAULT_LONG_HORIZON_CHECKPOINT_INTERVAL
      )
    ) === 0) {
      const checkpoint = buildCheckpoint({
        plan,
        completed,
        results,
        confidence: lastConfidence,
        resourceLedger,
      });
      trace.push({
        stepId: `checkpoint_${checkpointCount}`,
        tool: "agent_checkpoint",
        status: "saved",
        attempt: checkpointCount,
        durationMs: 0,
        success: true,
        error: "",
      });
    }

    console.log(
      `[Nyxora Agent] PARALLEL WAVE COMPLETE -> size=${batch.length} | duration=${
        Date.now() - waveStartedAt
      } ms | successful=${batchResults.filter((result) => result?.success).length} | failed=${
        batchResults.filter((result) => !result?.success).length
      } | estimatedTokens=${resourceLedger.estimatedTokens}`
    );

    const remainingOperationalSteps = plan.filter(
      (step) => step.tool !== "model_synthesis" && !completed.has(step.id)
    );

    if (
      remainingOperationalSteps.length &&
      planRevisionCount < maxPlanRevisions &&
      hasFailedAgentResults(batchResults)
    ) {
      transitionAgentArchitecturePhase(architectureState, "recover", "active");

      const reflection = await requestAgentReflection({
        messages,
        prompt,
        taskAnalysis: enrichedTaskAnalysis,
        plan,
        results,
        completed,
        modelResponder,
        maxSteps,
      });

      if (reflection?.decision === "revise") {
        const revisedPlan = applyPlanRevision({
          plan,
          completed,
          results,
          reflection,
          maxSteps,
          taskAnalysis: enrichedTaskAnalysis,
          prompt,
        });

        if (revisedPlan !== plan) {
          plan = revisedPlan;
          planRevisionCount += 1;
          reflectionContext = buildReflectionContext(results);

          trace.push({
            stepId: "agent_reflection",
            tool: "agent_reflection",
            status: "plan_revised",
            attempt: planRevisionCount,
            durationMs: 0,
            success: true,
            error: "",
          });

          console.log(
            `[Nyxora Agent] REFLECTION -> revision=${planRevisionCount}/${maxPlanRevisions} | confidence=${reflection.confidence}`
          );
        }
      } else if (reflection?.decision === "continue") {
        trace.push({
          stepId: "agent_reflection",
          tool: "agent_reflection",
          status: "plan_verified",
          attempt: planRevisionCount,
          durationMs: 0,
          success: true,
          error: "",
        });
      }
    }

    transitionAgentArchitecturePhase(architectureState, "recover", "completed");
    transitionAgentArchitecturePhase(architectureState, "verify", "active");
  }

  const synthesisStep = plan.find(
    (step) => step.tool === "model_synthesis"
  );

  if (!synthesisStep || !modelResponder) {
    throw new Error("Nyxora agent synthesis is unavailable.");
  }

  const failedResults = results.filter(
    (result) => !validateAgentResult(result).valid
  );

  let evidenceRevisionContext = "";

  transitionAgentArchitecturePhase(architectureState, "act", "completed");
  transitionAgentArchitecturePhase(architectureState, "observe", "active");

  const contradictionResolution = await requestContradictionResolution({
    prompt,
    results,
    modelResponder,
  });

  const contradictionContext = buildContradictionContext(contradictionResolution);

  transitionAgentArchitecturePhase(architectureState, "observe", "completed");
  transitionAgentArchitecturePhase(architectureState, "verify", "active");

  const initialConfidence = calculateAgentConfidence({
    results,
    contradictionResolution,
  });
  lastConfidence = initialConfidence;

  if (resourceLedger.estimatedCostUnits < DEFAULT_MAX_ESTIMATED_COST_UNITS * 0.85) {
    const collaborators = await requestCollaborativeAgents({
      prompt,
      messages,
      taskAnalysis: enrichedTaskAnalysis,
      plan,
      results,
      modelResponder,
      resourceLedger,
      budgetRemainingMs: Math.max(0, budgetMs - (Date.now() - startedAt)),
    });

    if (collaborators.length) {
      collaborationContext = collaborators
        .map((item) =>
          [
            `ROLE: ${item.role}`,
            `STATUS: ${item.success ? "SUCCESS" : "FAILED"}`,
            item.output ? `RECOMMENDATION:\n${item.output}` : `ERROR: ${item.error}`,
          ].join("\n")
        )
        .join("\n\n--------------------\n\n");

      collaborators.forEach((item) => {
        trace.push({
          stepId: `collaboration_${item.role}`,
          tool: "agent_collaboration",
          status: item.success ? "completed" : "failed",
          attempt: 1,
          durationMs: 0,
          success: item.success,
          error: item.error || "",
        });
      });
    }
  }

  if (contradictionResolution?.contradictions?.length) {
    trace.push({
      stepId: "contradiction_resolution",
      tool: "contradiction_resolution",
      status: "completed",
      attempt: 1,
      durationMs: 0,
      success: true,
      error: "",
    });
    console.log(
      `[Nyxora Contradiction] RESOLVED=${contradictionResolution.contradictions.filter((item) => item.resolution === "resolved").length} | UNRESOLVED=${contradictionResolution.contradictions.filter((item) => item.resolution === "unresolved").length}`
    );
  }

  let synthesisMessages = buildSynthesisMessages(
    messages,
    prompt,
    plan,
    results,
    evidenceRevisionContext,
    contradictionContext,
    buildConfidenceContext(lastConfidence),
    collaborationContext,
    jarvisCommand
  );

  console.log(
    `[Nyxora Agent] VERIFY -> completed=${results.length} | failed=${failedResults.length} | chars=${synthesisMessages.reduce(
      (sum, item) => sum + String(item.content || "").length,
      0
    )}`
  );

  let synthesisError = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    if (budgetExceeded()) {
      synthesisError = new Error(
        "Nyxora agent budget exceeded during synthesis."
      );
      break;
    }

    try {
      console.log(
        `[Nyxora Agent] SYNTHESIS TRY -> attempt=${attempt}/${maxRetries + 1}`
      );

      let answer = "";

      for await (const delta of modelResponder({
        messages: synthesisMessages,
        prompt: "SYNTHESIZE VERIFIED AGENT RESULTS",
        task: taskAnalysis?.task === "coding" ? "coding" : "reasoning",
        mode,
        timeoutOverrideMs: Math.min(
          DEFAULT_SYNTHESIS_TIMEOUT_MS,
          Math.max(6000, budgetMs - (Date.now() - startedAt))
        ),
        attachments: visualAttachments,
      })) {
        answer += String(delta || "");
      }

      const finalVerification = verifyFinalAnswer(answer, results);
      let evidenceAudit = { decision: "accept", confidence: 1 };

      if (finalVerification.valid) {
        evidenceAudit = await requestEvidenceAudit({
          prompt,
          answer,
          results,
          modelResponder,
        });
      }

      lastConfidence = calculateAgentConfidence({
        results,
        contradictionResolution,
        evidenceAudit,
      });

      if (!finalVerification.valid) {
        synthesisError = new Error(finalVerification.reason);

        trace.push({
          stepId: synthesisStep.id,
          tool: synthesisStep.tool,
          status: "final_verification_failed",
          attempt,
          durationMs: 0,
          success: false,
          error: finalVerification.reason,
        });

        console.warn(
          `[Nyxora Agent] FINAL VERIFY FAILED -> ${finalVerification.reason}`
        );
      } else if (
        evidenceAudit.decision === "revise" &&
        evidenceAudit.confidence >= EVIDENCE_AUDIT_MIN_CONFIDENCE
      ) {
        if (attempt > maxRetries) {
          synthesisError = new Error("Final answer failed evidence grounding audit after all synthesis attempts.");
          trace.push({
            stepId: synthesisStep.id,
            tool: synthesisStep.tool,
            status: "evidence_audit_failed",
            attempt,
            durationMs: 0,
            success: false,
            error: synthesisError.message,
          });
          console.warn(
            `[Nyxora Agent] EVIDENCE AUDIT FAILED -> confidence=${evidenceAudit.confidence}`
          );
          continue;
        }

        const unsupported = Array.isArray(evidenceAudit.unsupportedClaims)
          ? evidenceAudit.unsupportedClaims
              .map((item) => `${item?.claim || "Unspecified claim"}: ${item?.reason || "unsupported by available evidence"}`)
              .join("\n")
          : "";
        const contradictions = Array.isArray(evidenceAudit.contradictions)
          ? evidenceAudit.contradictions.join("\n")
          : "";
        const missing = Array.isArray(evidenceAudit.missingEvidence)
          ? evidenceAudit.missingEvidence.join("\n")
          : "";

        evidenceRevisionContext = [
          evidenceAudit.summary ? `AUDIT SUMMARY: ${evidenceAudit.summary}` : "",
          unsupported ? `UNSUPPORTED CLAIMS:\n${unsupported}` : "",
          contradictions ? `CONTRADICTIONS:\n${contradictions}` : "",
          missing ? `MISSING EVIDENCE:\n${missing}` : "",
          "Rewrite the answer so every tool-dependent factual claim is supported by the evidence ledger or explicitly qualified as uncertain.",
          "Do not invent replacement sources or evidence.",
        ].filter(Boolean).join("\n\n");

        synthesisMessages = buildSynthesisMessages(
          messages,
          prompt,
          plan,
          results,
          evidenceRevisionContext,
          contradictionContext,
          buildConfidenceContext(lastConfidence),
          collaborationContext,
          jarvisCommand
        );

        synthesisError = new Error("Final answer failed evidence grounding audit and requires revision.");
        trace.push({
          stepId: synthesisStep.id,
          tool: synthesisStep.tool,
          status: "evidence_audit_revision",
          attempt,
          durationMs: 0,
          success: false,
          error: synthesisError.message,
        });

        console.warn(
          `[Nyxora Agent] EVIDENCE AUDIT REVISE -> confidence=${evidenceAudit.confidence}`
        );
      } else {
        trace.push({
          stepId: synthesisStep.id,
          tool: synthesisStep.tool,
          status: "verified",
          attempt,
          durationMs: 0,
          success: true,
          error: "",
        });

        resourceLedger = buildResourceLedger({
          prompt,
          messages,
          results,
          trace,
        });

        const finalCheckpoint = buildCheckpoint({
          plan,
          completed,
          results,
          confidence: lastConfidence,
          resourceLedger,
        });

        transitionAgentArchitecturePhase(architectureState, "verify", "completed");
        transitionAgentArchitecturePhase(architectureState, "remember", "active");

        if (effectiveUserId) {
          const updatedMemory = buildAgentMemorySnapshot({
            existingMemory: persistentMemory,
            prompt,
            taskAnalysis: enrichedTaskAnalysis,
            results,
            confidence: lastConfidence,
            checkpoint: finalCheckpoint,
          });

          await savePersistentAgentMemory(effectiveUserId, updatedMemory);
        }

        console.log(
          `[Nyxora Agent] COMPLETE -> ${Date.now() - startedAt} ms | failedSteps=${failedResults.length} | confidence=${Number(lastConfidence?.overall || 0).toFixed(2)} | estimatedTokens=${resourceLedger.estimatedTokens} | trace=${trace.length}`
        );

        transitionAgentArchitecturePhase(architectureState, "remember", "completed");
        transitionAgentArchitecturePhase(architectureState, "speak", "active");

        architectureState.completedAt = new Date().toISOString();

        trace.push({
          stepId: "architecture_lifecycle",
          tool: "final_agent_architecture",
          status: "completed",
          attempt: 1,
          durationMs: Date.now() - startedAt,
          success: true,
          error: "",
          architectureVersion: architectureState.architectureVersion,
          phase: architectureState.phase,
        });

        transitionAgentArchitecturePhase(architectureState, "speak", "completed");

        // The trace stays server-side so the user receives the same clean
        // response format without internal orchestration noise.
        yield answer.trim();
        return;
      }
    } catch (error) {
      synthesisError = error;

      trace.push({
        stepId: synthesisStep.id,
        tool: synthesisStep.tool,
        status: "failed",
        attempt,
        durationMs: 0,
        success: false,
        error: clean(error?.message || error, 1000),
      });

      console.warn(
        `[Nyxora Agent] SYNTHESIS FAILED -> attempt=${attempt} | ${error?.message || error}`
      );
    }
  }

  console.warn(
    `[Nyxora Agent] TRACE -> ${JSON.stringify({
      durationMs: Date.now() - startedAt,
      completedSteps: results.length,
      failedSteps: failedResults.length,
      entries: trace.length,
    })}`
  );

  throw (
    synthesisError ||
    new Error("Nyxora agent synthesis returned no verified usable response.")
  );
}


/**
 * Public architecture introspection for health and observability layers.
 * This exposes static capability metadata only; no secrets, prompts,
 * user memory, or execution traces are returned.
 */
export {
  getNyxoraAgentArchitecture,
  NYXORA_AGENT_ARCHITECTURE_VERSION,
};
