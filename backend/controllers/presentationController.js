/**
 * Nyxora AI - Presentation Controller
 *
 * Presentation generation uses the Nyxora Model Gateway only.
 * No presentation-specific provider/model is hard-coded here.
 */

import { streamNyxoraModel } from "../services/modelGateway.js";


function normalizeString(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim();
}


function buildPresentationGatewayPrompt({
  prompt,
  topic,
  subject,
  className,
  slideCount,
  theme,
  customPrompt,
  presentationMode,
}) {
  const parts = [];

  if (prompt) {
    parts.push(prompt);
  }

  parts.push(
    "\nNYXORA PRESENTATION GENERATION CONTRACT:\n" +
      "Return ONLY one valid JSON object. Do not use Markdown fences, explanations, commentary, or text before/after the JSON.\n" +
      "The JSON must contain: title, description, slides.\n" +
      "slides must be an array of structured slide objects suitable for Nyxora's presentation builder.\n" +
      "Preserve the requested slide count as closely as possible.\n" +
      "Every slide must communicate one main idea.\n" +
      "Use the requested presentation mode to control content depth.\n" +
      "Do not invent citations, references, statistics, or factual claims when the prompt does not support them."
  );

  if (topic) parts.push(`Topic: ${topic}`);
  if (subject) parts.push(`Subject: ${subject}`);
  if (className) parts.push(`Class/Level: ${className}`);
  if (slideCount) parts.push(`Requested slide count: ${slideCount}`);
  if (theme) parts.push(`Theme: ${theme}`);
  if (presentationMode) parts.push(`Presentation mode: ${presentationMode}`);
  if (customPrompt) parts.push(`Additional user instructions: ${customPrompt}`);

  return parts.join("\n\n");
}


function extractDeltaText(delta) {
  if (delta === null || delta === undefined) {
    return "";
  }

  if (typeof delta === "string") {
    return delta;
  }

  if (typeof delta === "object") {
    if (typeof delta.text === "string") return delta.text;
    if (typeof delta.content === "string") return delta.content;
    if (typeof delta.delta === "string") return delta.delta;
    if (typeof delta.response === "string") return delta.response;
  }

  return String(delta);
}


export async function generatePresentation(req, res) {
  const {
    prompt = "",
    topic = "",
    subject = "",
    className = "",
    slideCount = null,
    theme = "nyxoraPremium",
    customPrompt = "",
    presentationMode = "concise",
    mode = "reasoning",
  } = req.body || {};

  const normalizedPrompt = normalizeString(prompt);

  if (!normalizedPrompt) {
    return res.status(400).json({
      error: "Presentation prompt is required.",
    });
  }

  const normalizedPresentationMode =
    String(presentationMode).toLowerCase() === "detailed"
      ? "detailed"
      : "concise";

  const gatewayPrompt = buildPresentationGatewayPrompt({
    prompt: normalizedPrompt,
    topic: normalizeString(topic),
    subject: normalizeString(subject),
    className: normalizeString(className),
    slideCount,
    theme: normalizeString(theme, "nyxoraPremium"),
    customPrompt: normalizeString(customPrompt),
    presentationMode: normalizedPresentationMode,
  });

  try {
    let result = "";

    for await (const delta of streamNyxoraModel({
      prompt: gatewayPrompt,
      messages: [
        {
          role: "user",
          content: gatewayPrompt,
        },
      ],
      mode: normalizeString(mode, "reasoning") || "reasoning",
    })) {
      result += extractDeltaText(delta);
    }

    result = result.trim();

    if (!result) {
      throw new Error("Nyxora Model Gateway returned an empty presentation response.");
    }

    return res.status(200).json({
      presentation: result,
    });
  } catch (error) {
    console.error(
      "[Nyxora Presentation] Model Gateway failed:",
      error?.message || error
    );

    return res.status(502).json({
      error:
        error?.message ||
        "Presentation generation failed through the Nyxora Model Gateway.",
    });
  }
}

export default {
  generatePresentation,
};
