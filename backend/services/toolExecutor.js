/**
 * Nyxora AI - Deterministic Tool Executor
 *
 * Tools here must be deterministic and side-effect free unless explicitly
 * implemented with a dedicated safety layer.
 */

const TOKEN_PATTERN = /\s*(?:(\d+(?:\.\d+)?)|([()+\-*/^×÷]))/gy;

function tokenizeExpression(expression) {
  const tokens = [];
  let index = 0;

  while (index < expression.length) {
    TOKEN_PATTERN.lastIndex = index;
    const match = TOKEN_PATTERN.exec(expression);

    if (!match || match.index !== index) {
      throw new Error("Unsupported calculator expression.");
    }

    index = TOKEN_PATTERN.lastIndex;
    if (match[1] !== undefined) {
      tokens.push({ type: "number", value: Number(match[1]) });
    } else {
      tokens.push({ type: "operator", value: match[2] });
    }
  }

  return tokens;
}

function normalizeExpression(expression) {
  return String(expression || "")
    .replace(/[,$]/g, "")
    .replace(/\b(?:calculate|compute|solve|evaluate|find|what is)\b/gi, "")
    .replace(/\b(?:the|answer|result|of)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseExpression(expression) {
  const tokens = tokenizeExpression(expression);
  let position = 0;

  const peek = () => tokens[position];
  const consume = () => tokens[position++];

  function parsePrimary() {
    const token = peek();

    if (!token) {
      throw new Error("Incomplete calculator expression.");
    }

    if (token.type === "operator" && (token.value === "+" || token.value === "-")) {
      consume();
      const value = parsePrimary();
      return token.value === "-" ? -value : value;
    }

    if (token.type === "number") {
      consume();
      return token.value;
    }

    if (token.value === "(") {
      consume();
      const value = parseAdditive();
      if (peek()?.value !== ")") {
        throw new Error("Unclosed calculator parenthesis.");
      }
      consume();
      return value;
    }

    throw new Error("Invalid calculator expression.");
  }

  function parsePower() {
    let value = parsePrimary();
    if (peek()?.value === "^") {
      consume();
      value = value ** parsePower();
    }
    return value;
  }

  function parseMultiplicative() {
    let value = parsePower();

    while (peek()?.type === "operator" && ["*", "/", "×", "÷"].includes(peek().value)) {
      const operator = consume().value;
      const right = parsePower();

      if ((operator === "/" || operator === "÷") && right === 0) {
        throw new Error("Division by zero is not allowed.");
      }

      value = operator === "*" || operator === "×" ? value * right : value / right;
    }

    return value;
  }

  function parseAdditive() {
    let value = parseMultiplicative();

    while (peek()?.type === "operator" && ["+", "-"].includes(peek().value)) {
      const operator = consume().value;
      const right = parseMultiplicative();
      value = operator === "+" ? value + right : value - right;
    }

    return value;
  }

  const result = parseAdditive();

  if (position !== tokens.length) {
    throw new Error("Unsupported calculator expression.");
  }

  if (!Number.isFinite(result)) {
    throw new Error("Calculator result is not finite.");
  }

  return result;
}

function extractExpression(text) {
  const value = String(text || "").trim();

  const explicitMatch = value.match(
    /(?:calculate|compute|solve|evaluate|find|what is)\s+(.+?)(?:\?|$)/i
  );

  if (explicitMatch?.[1]) {
    return explicitMatch[1].trim();
  }

  const operationMatch = value.match(
    /[-+]?\d[\d,.]*(?:\s*[+\-*/×÷^]\s*[-+]?\d[\d,.]*)+(?:\s*=)?/
  );

  return operationMatch?.[0]?.replace(/=\s*$/, "").trim() || null;
}

function formatNumber(value) {
  if (Number.isInteger(value)) return String(value);
  return Number(value.toPrecision(12)).toString();
}

export function executeNyxoraCalculator(text = "") {
  const rawExpression = extractExpression(text);
  if (!rawExpression) {
    return null;
  }

  const expression = normalizeExpression(rawExpression);

  if (!expression || expression.length > 200) {
    return null;
  }

  if (!/^[0-9.()+\-*/^×÷\s]+$/.test(expression)) {
    return null;
  }

  try {
    const result = parseExpression(expression);
    return {
      tool: "calculator",
      expression,
      result,
      text: formatNumber(result),
    };
  } catch {
    return null;
  }
}
