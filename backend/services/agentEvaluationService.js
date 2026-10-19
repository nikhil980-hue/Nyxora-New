function clamp01(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
}

export function evaluateAgentRun({ prompt = '', answer = '', results = [], trace = [], confidence = {}, resourceLedger = {} } = {}) {
  const usable = results.filter((r) => r?.success).length;
  const failed = results.filter((r) => !r?.success).length;
  const verification = answer.trim().length > 0 ? 1 : 0;
  const execution = results.length ? usable / results.length : 0;
  const reliability = trace.length ? trace.filter((t) => t.success).length / trace.length : execution;
  const grounding = results.length ? results.filter((r) => Array.isArray(r?.evidence) && r.evidence.length).length / results.length : 0;
  const confidenceScore = clamp01(confidence?.overall);
  const overall = Number((verification * 0.20 + execution * 0.25 + reliability * 0.20 + grounding * 0.20 + confidenceScore * 0.15).toFixed(4));
  return {
    version: 1,
    prompt: String(prompt).slice(0, 500),
    overall,
    dimensions: { answerPresent: verification, execution, reliability, grounding, confidence: confidenceScore },
    counts: { results: results.length, successful: usable, failed, traceEntries: trace.length },
    resourceUsage: {
      estimatedTokens: Number(resourceLedger?.estimatedTokens || 0),
      estimatedCostUnits: Number(resourceLedger?.estimatedCostUnits || 0),
    },
    passed: overall >= Number(process.env.NYXORA_AGENT_EVAL_PASS_SCORE || 0.70),
  };
}

export function runEvaluationSuite() {
  const fixtures = [
    { name: 'verified_answer', input: { prompt: 'calculate 2+2', answer: '4', results: [{ success: true, evidence: [{ id: 'e1' }] }], trace: [{ success: true }], confidence: { overall: 0.95 } } },
    { name: 'failed_tool', expectedPass: false, input: { prompt: 'test', answer: 'The tool failed.', results: [{ success: false }], trace: [{ success: false }], confidence: { overall: 0.35 } } },
    { name: 'empty_answer', expectedPass: false, input: { prompt: 'test', answer: '', results: [], trace: [], confidence: { overall: 0 } } },
  ];
  return fixtures.map((fixture) => { const evaluation = evaluateAgentRun(fixture.input); return { name: fixture.name, expectedPass: fixture.expectedPass !== false, evaluation, fixturePassed: evaluation.passed === (fixture.expectedPass !== false) }; });
}
