const circuits = new Map();
const FAILURE_THRESHOLD = Math.max(2, Number(process.env.NYXORA_RELIABILITY_FAILURE_THRESHOLD || 4));
const COOLDOWN_MS = Math.max(5000, Number(process.env.NYXORA_RELIABILITY_COOLDOWN_MS || 20000));

function stateFor(key) {
  if (!circuits.has(key)) circuits.set(key, { failures: 0, openedAt: 0, successes: 0 });
  return circuits.get(key);
}

export function classifyAgentFailure(error) {
  const message = String(error?.message || error || '').toLowerCase();
  if (/timeout|timed out|deadline/.test(message)) return 'timeout';
  if (/429|rate.?limit|quota/.test(message)) return 'rate_limit';
  if (/401|403|unauthori|forbidden/.test(message)) return 'authorization';
  if (/network|fetch|socket|econn|enotfound|connection/.test(message)) return 'network';
  if (/unsafe|security|blocked/.test(message)) return 'security';
  return 'execution';
}

export function canAttemptReliably(key) {
  const state = stateFor(key);
  if (!state.openedAt) return true;
  if (Date.now() - state.openedAt >= COOLDOWN_MS) {
    state.openedAt = 0;
    state.failures = 0;
    return true;
  }
  return false;
}

export function recordReliability(key, success) {
  const state = stateFor(key);
  if (success) {
    state.successes += 1;
    state.failures = Math.max(0, state.failures - 1);
    if (state.failures < FAILURE_THRESHOLD) state.openedAt = 0;
  } else {
    state.failures += 1;
    if (state.failures >= FAILURE_THRESHOLD) state.openedAt = Date.now();
  }
  return { ...state };
}

export function reliabilityDelay(attempt, category = 'execution') {
  const multiplier = category === 'rate_limit' ? 3 : category === 'network' ? 2 : 1;
  return Math.min(4000, 150 * (2 ** Math.max(0, attempt - 1)) * multiplier);
}

export async function waitForReliability(attempt, category) {
  const delay = reliabilityDelay(attempt, category);
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  return delay;
}

export function getReliabilitySnapshot() {
  return [...circuits.entries()].map(([key, value]) => ({ key, ...value, open: Boolean(value.openedAt && Date.now() - value.openedAt < COOLDOWN_MS) }));
}
