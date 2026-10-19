import { runEvaluationSuite } from "../services/agentEvaluationService.js";

const results = runEvaluationSuite();
const passed = results.filter((item) => item.fixturePassed).length;

console.log(JSON.stringify({
  success: passed === results.length,
  passed,
  total: results.length,
  results,
}, null, 2));

if (passed !== results.length) process.exitCode = 1;
