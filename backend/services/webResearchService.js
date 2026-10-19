/**
 * Nyxora AI — Web Research Service
 * Tavily → Gemini Google Search fallback.
 */

import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const TAVILY_API_KEY = String(process.env.TAVILY_API_KEY || "").trim();

const GEMINI_API_KEYS = Array.from(
  { length: 15 },
  (_, index) => String(process.env[`GEMINI_API_KEY_${index + 1}`] || "").trim()
).filter(Boolean);

const TAVILY_ENDPOINT = String(
  process.env.TAVILY_API_BASE_URL || "https://api.tavily.com/search"
).replace(/\/$/, "");

const GEMINI_MODEL = String(
  process.env.NYXORA_WEB_GEMINI_MODEL || "gemini-3.5-flash"
).trim();

const MAX_RESULTS = Math.max(
  1,
  Math.min(10, Number(process.env.NYXORA_WEB_SEARCH_MAX_RESULTS || 5))
);

const SEARCH_TIMEOUT_MS = Math.max(
  3000,
  Number(process.env.NYXORA_WEB_SEARCH_TIMEOUT_MS || 9000)
);

const SEARCH_ORDER = String(
  process.env.NYXORA_WEB_SEARCH_ORDER || "tavily,gemini"
)
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function createTimeoutSignal(timeoutMs = SEARCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeTavilyResult(result, index) {
  return {
    rank: index + 1,
    title: cleanText(result?.title),
    url: String(result?.url || "").trim(),
    snippet: cleanText(result?.content || result?.snippet || result?.raw_content),
    score: typeof result?.score === "number" ? result.score : null,
    source: "tavily",
  };
}

function normalizeGeminiGroundingChunk(chunk, index) {
  const web = chunk?.web || {};
  const url = String(web?.uri || web?.url || "").trim();
  const title = cleanText(web?.title || web?.name || "");

  if (!url && !title) return null;

  return {
    rank: index + 1,
    title,
    url,
    snippet: "",
    score: null,
    source: "gemini",
  };
}

function deduplicateResults(results) {
  const seen = new Set();
  const output = [];

  for (const result of results || []) {
    const url = String(result?.url || "").trim();
    if (!url) continue;

    const key = url.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    output.push({ ...result, rank: output.length + 1 });
  }

  return output.slice(0, MAX_RESULTS);
}

function buildResearchContext(query, results) {
  const lines = [`WEB RESEARCH QUERY: ${query}`, "", "WEB SOURCES:"];

  for (const result of results) {
    lines.push(`[${result.rank}] ${result.title || "Untitled source"}`);
    if (result.url) lines.push(`URL: ${result.url}`);
    if (result.snippet) lines.push(`Summary: ${result.snippet}`);
    lines.push("");
  }

  return lines.join("\n").trim();
}

async function searchTavily(query) {
  if (!TAVILY_API_KEY) {
    throw new Error("Tavily is not configured because TAVILY_API_KEY is missing.");
  }

  const timeout = createTimeoutSignal();

  try {
    const response = await fetch(TAVILY_ENDPOINT, {
      method: "POST",
      signal: timeout.signal,
      headers: {
        Authorization: `Bearer ${TAVILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        topic: "general",
        max_results: MAX_RESULTS,
        include_answer: false,
        include_raw_content: false,
        include_images: false,
      }),
    });

    const text = await response.text();
    let data = null;

    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(
        `Tavily returned HTTP ${response.status}: ${text.slice(0, 500)}`
      );
      error.status = response.status;
      throw error;
    }

    const results = Array.isArray(data?.results)
      ? data.results.map(normalizeTavilyResult).filter((result) => result.url)
      : [];

    if (!results.length) {
      throw new Error("Tavily returned no usable search results.");
    }

    return {
      provider: "tavily",
      query,
      results: deduplicateResults(results),
      answer: typeof data?.answer === "string" ? cleanText(data.answer) : "",
    };
  } finally {
    timeout.clear();
  }
}

function extractGeminiGroundingResults(response) {
  const groundingMetadata = response?.candidates?.[0]?.groundingMetadata;
  if (!groundingMetadata) return [];

  const chunks = Array.isArray(groundingMetadata.groundingChunks)
    ? groundingMetadata.groundingChunks
    : [];

  return chunks.map(normalizeGeminiGroundingChunk).filter(Boolean);
}

async function searchGemini(query) {
  if (!GEMINI_API_KEYS.length) {
    throw new Error(
      "Gemini web research is unavailable because no Gemini API keys are configured."
    );
  }

  let lastError = null;

  for (const apiKey of GEMINI_API_KEYS) {
    try {
      const client = new GoogleGenAI({ apiKey });

      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "Research the following question using current web information.",
                  "",
                  query,
                  "",
                  "Return a concise factual research summary.",
                  "Use Google Search grounding.",
                ].join("\n"),
              },
            ],
          },
        ],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = cleanText(response?.text || "");
      const results = extractGeminiGroundingResults(response);

      if (!text && !results.length) {
        throw new Error("Gemini web research returned no usable information.");
      }

      return {
        provider: "gemini",
        query,
        results: deduplicateResults(results),
        answer: text,
      };
    } catch (error) {
      lastError = error;
      console.warn(
        `[Nyxora Web Research] Gemini key failed: ${error?.message || error}`
      );
    }
  }

  throw lastError || new Error("All Gemini web-research keys failed.");
}

function isProviderConfigured(provider) {
  if (provider === "tavily") return Boolean(TAVILY_API_KEY);
  if (provider === "gemini") return GEMINI_API_KEYS.length > 0;
  return false;
}

async function searchWithProvider(provider, query) {
  switch (provider) {
    case "tavily":
      return searchTavily(query);
    case "gemini":
      return searchGemini(query);
    default:
      throw new Error(`Unsupported web research provider: ${provider}`);
  }
}

export async function researchWeb(query, options = {}) {
  const cleanQuery = cleanText(query);

  if (!cleanQuery) {
    throw new Error("Web research requires a non-empty query.");
  }

  const requestedOrder = Array.isArray(options.providerOrder)
    ? options.providerOrder
        .map((provider) => String(provider || "").trim().toLowerCase())
        .filter(Boolean)
    : SEARCH_ORDER;

  const providers = [...new Set(requestedOrder)];
  const attempts = [];

  for (const provider of providers) {
    if (!isProviderConfigured(provider)) {
      attempts.push({
        provider,
        success: false,
        skipped: true,
        reason: "Provider is not configured.",
      });
      console.log(`[Nyxora Web Research] SKIP -> ${provider} | not configured`);
      continue;
    }

    const startedAt = Date.now();

    try {
      console.log(`[Nyxora Web Research] TRY -> ${provider} | ${cleanQuery}`);
      const result = await searchWithProvider(provider, cleanQuery);
      const latencyMs = Date.now() - startedAt;
      const usableResults = Array.isArray(result?.results) ? result.results : [];

      if (!result?.answer && usableResults.length === 0) {
        throw new Error(`${provider} returned no usable research data.`);
      }

      const finalResult = {
        success: true,
        provider,
        query: cleanQuery,
        answer: cleanText(result.answer),
        results: usableResults,
        context: buildResearchContext(cleanQuery, usableResults),
        latencyMs,
        attempts: [
          ...attempts,
          { provider, success: true, latencyMs },
        ],
      };

      console.log(
        `[Nyxora Web Research] SUCCESS -> ${provider} | ${latencyMs} ms | sources=${usableResults.length}`
      );

      return finalResult;
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      attempts.push({
        provider,
        success: false,
        latencyMs,
        error: error?.message || String(error),
      });

      console.warn(
        `[Nyxora Web Research] FAILED -> ${provider} | ${latencyMs} ms | ${error?.message || error}`
      );
    }
  }

  const error = new Error("All configured web research providers failed.");
  error.code = "WEB_RESEARCH_PROVIDERS_FAILED";
  error.attempts = attempts;
  throw error;
}

// Compatibility export required by modelGateway.js.
export async function executeNyxoraWebResearch(query, options = {}) {
  return researchWeb(query, options);
}

export function getWebResearchStatus() {
  return {
    enabled: Boolean(TAVILY_API_KEY) || GEMINI_API_KEYS.length > 0,
    providers: {
      tavily: {
        configured: Boolean(TAVILY_API_KEY),
      },
      gemini: {
        configured: GEMINI_API_KEYS.length > 0,
        model: GEMINI_MODEL,
        keyCount: GEMINI_API_KEYS.length,
      },
      brave: {
        configured: false,
        enabled: false,
        reason:
          "Brave is intentionally disabled because it requires paid setup for the current configuration.",
      },
    },
    order: SEARCH_ORDER,
    maxResults: MAX_RESULTS,
    timeoutMs: SEARCH_TIMEOUT_MS,
  };
}
