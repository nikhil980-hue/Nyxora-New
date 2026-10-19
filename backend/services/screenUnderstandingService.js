import { streamNyxoraModel } from "./modelGateway.js";
import { screenshotBrowser } from "./browserControlService.js";

function normalizeImage(image) {
  if (!image || typeof image !== "object") return null;
  const data = String(image.data || "").trim();
  const mimeType = String(image.mimeType || "image/png").trim();
  if (!data || !mimeType.startsWith("image/")) return null;
  return { data, mimeType };
}

export async function analyzeScreenImage({ image, prompt = "Describe the current screen, identify the active application/page, important visible controls, and the most relevant next action." } = {}) {
  const normalized = normalizeImage(image);
  if (!normalized) return { success: false, error: "A base64 screen image is required." };
  let output = "";
  for await (const delta of streamNyxoraModel({
    messages: [{ role: "user", content: String(prompt) }],
    prompt: String(prompt),
    mode: "normal",
    attachments: [normalized],
  })) {
    output += String(delta || "");
    if (output.length >= 12000) break;
  }
  return { success: Boolean(output.trim()), output: output.trim(), mimeType: normalized.mimeType };
}

export async function captureAndAnalyzeBrowserScreen({ prompt } = {}) {
  const screenshot = await screenshotBrowser({ fullPage: false });
  if (!screenshot.success) return screenshot;
  return analyzeScreenImage({ image: { data: screenshot.data, mimeType: screenshot.mimeType }, prompt });
}
