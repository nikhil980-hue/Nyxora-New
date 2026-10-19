const MAX_ITEMS = Math.max(8, Math.min(40, Number(process.env.NYXORA_LEARNING_MAX_ITEMS || 24)));
const MAX_CHARS = Math.max(4000, Math.min(24000, Number(process.env.NYXORA_LEARNING_MAX_CHARS || 12000)));

function clean(value, max = 1000) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function clamp01(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
}

function normalize(source = {}) {
  const value = source && typeof source === 'object' ? source : {};
  return {
    version: Number(value.version || 1),
    toolReliability: value.toolReliability && typeof value.toolReliability === 'object' ? value.toolReliability : {},
    taskPatterns: Array.isArray(value.taskPatterns) ? value.taskPatterns.slice(-MAX_ITEMS) : [],
    successfulStrategies: Array.isArray(value.successfulStrategies) ? value.successfulStrategies.slice(-MAX_ITEMS) : [],
    checkpoints: Array.isArray(value.checkpoints) ? value.checkpoints.slice(-MAX_ITEMS) : [],
    strategyScores: value.strategyScores && typeof value.strategyScores === 'object' ? value.strategyScores : {},
    failurePatterns: Array.isArray(value.failurePatterns) ? value.failurePatterns.slice(-MAX_ITEMS) : [],
    modelOutcomes: Array.isArray(value.modelOutcomes) ? value.modelOutcomes.slice(-MAX_ITEMS) : [],
    lastLearnedAt: value.lastLearnedAt || null,
  };
}

function signature(taskAnalysis, prompt) {
  return clean(`${taskAnalysis?.task || 'unknown'}|${String(prompt || '').toLowerCase().slice(0, 240)}`, 320);
}

export function findReusableStrategy(memory, taskAnalysis = {}, prompt = '') {
  const source = normalize(memory);
  const sig = signature(taskAnalysis, prompt);
  const candidates = [...source.successfulStrategies, ...source.taskPatterns];
  if (!candidates.length) return null;

  let best = null;
  let bestScore = 0;
  for (const item of candidates) {
    const text = clean(item?.signature || item?.task || '', 320).toLowerCase();
    if (!text) continue;
    const task = clean(taskAnalysis?.task || '', 100).toLowerCase();
    const exactTask = task && text.includes(task) ? 0.35 : 0;
    const words = sig.toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length > 3);
    const overlap = words.length ? words.filter((word) => text.includes(word)).length / words.length : 0;
    const confidence = clamp01(item?.confidence, 0);
    const score = exactTask + overlap * 0.45 + confidence * 0.20;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best && bestScore >= 0.38 ? { ...best, matchScore: Number(bestScore.toFixed(3)) } : null;
}

export function learnFromAgentRun({ memory, prompt, taskAnalysis, results = [], confidence = {}, resourceLedger = {} }) {
  const source = normalize(memory);
  const now = new Date().toISOString();
  const tools = [...new Set(results.map((r) => r?.tool).filter(Boolean))];
  const successfulTools = [...new Set(results.filter((r) => r?.success).map((r) => r.tool).filter(Boolean))];
  const failedTools = [...new Set(results.filter((r) => !r?.success).map((r) => r.tool).filter(Boolean))];
  const overall = clamp01(confidence?.overall, 0);
  const sig = signature(taskAnalysis, prompt);

  const failureKey = failedTools.join(',') || 'none';
  const failurePatterns = failedTools.length
    ? [...source.failurePatterns, { task: clean(taskAnalysis?.task || 'unknown', 100), tools: failedTools, key: failureKey, at: now }]
    : source.failurePatterns;

  const strategyScores = { ...source.strategyScores };
  if (successfulTools.length && overall >= 0.60) {
    const previous = Number(strategyScores[sig] || 0.5);
    strategyScores[sig] = Number((previous * 0.70 + overall * 0.30).toFixed(3));
  }

  const next = {
    ...source,
    version: Math.max(2, source.version),
    taskPatterns: [...source.taskPatterns, {
      signature: sig,
      tools,
      successfulTools,
      failedTools,
      confidence: Number(overall.toFixed(3)),
      estimatedTokens: Number(resourceLedger?.estimatedTokens || 0),
      estimatedCostUnits: Number(resourceLedger?.estimatedCostUnits || 0),
      at: now,
    }].slice(-MAX_ITEMS),
    successfulStrategies: overall >= 0.70 && successfulTools.length
      ? [...source.successfulStrategies, { task: clean(taskAnalysis?.task || 'unknown', 100), signature: sig, tools: successfulTools, confidence: Number(overall.toFixed(3)), at: now }].slice(-MAX_ITEMS)
      : source.successfulStrategies,
    failurePatterns: failurePatterns.slice(-MAX_ITEMS),
    modelOutcomes: source.modelOutcomes.slice(-MAX_ITEMS),
    strategyScores,
    lastLearnedAt: now,
  };

  return JSON.parse(JSON.stringify(next)).toString().length > MAX_CHARS
    ? {
        ...next,
        taskPatterns: next.taskPatterns.slice(-Math.floor(MAX_ITEMS * 0.7)),
        failurePatterns: next.failurePatterns.slice(-Math.floor(MAX_ITEMS * 0.7)),
      }
    : next;
}

export function addModelOutcome(memory, outcome = {}) {
  const source = normalize(memory);
  return {
    ...source,
    modelOutcomes: [...source.modelOutcomes, {
      provider: clean(outcome.provider, 80),
      model: clean(outcome.model, 120),
      task: clean(outcome.task, 80),
      success: Boolean(outcome.success),
      latencyMs: Math.max(0, Number(outcome.latencyMs || 0)),
      at: new Date().toISOString(),
    }].slice(-MAX_ITEMS),
    lastLearnedAt: new Date().toISOString(),
  };
}
