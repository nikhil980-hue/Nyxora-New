const MAX_EVENTS = Math.max(100, Number(process.env.NYXORA_OBSERVABILITY_MAX_EVENTS || 2000));
const events = [];
const counters = new Map();

function increment(key, amount = 1) { counters.set(key, (counters.get(key) || 0) + amount); }

export function recordAgentEvent(event = {}) {
  const normalized = {
    type: String(event.type || 'agent_event').slice(0, 80),
    userId: String(event.userId || '').slice(0, 128),
    task: String(event.task || '').slice(0, 100),
    tool: String(event.tool || '').slice(0, 80),
    success: event.success == null ? null : Boolean(event.success),
    durationMs: Math.max(0, Number(event.durationMs || 0)),
    confidence: Number.isFinite(Number(event.confidence)) ? Math.max(0, Math.min(1, Number(event.confidence))) : null,
    errorCategory: String(event.errorCategory || '').slice(0, 80),
    at: new Date().toISOString(),
  };
  events.push(normalized);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  increment(`events.${normalized.type}`);
  if (normalized.success === true) increment('outcomes.success');
  if (normalized.success === false) increment('outcomes.failure');
  if (normalized.tool) increment(`tools.${normalized.tool}`);
  return normalized;
}

export function getAgentObservabilitySnapshot() {
  const durations = events.map((e) => e.durationMs).filter((n) => n > 0);
  const successes = events.filter((e) => e.success === true).length;
  const failures = events.filter((e) => e.success === false).length;
  return {
    generatedAt: new Date().toISOString(),
    eventCount: events.length,
    counters: Object.fromEntries(counters),
    successRate: successes + failures ? Number((successes / (successes + failures)).toFixed(4)) : null,
    averageDurationMs: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
    recentEvents: events.slice(-50),
  };
}

export function clearAgentObservability() { events.length = 0; counters.clear(); }
