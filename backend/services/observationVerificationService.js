import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { screenshotBrowser, browserSnapshot } from "./browserControlService.js";

function hash(data) { return crypto.createHash("sha256").update(data).digest("hex"); }

export async function observeDesktop() {
  try {
    const { default: screenshot } = await import("screenshot-desktop");
    const buffer = await screenshot({ format: "png" });
    return { success: true, type: "desktop", mimeType: "image/png", data: buffer.toString("base64"), hash: hash(buffer) };
  } catch (error) {
    return { success: false, type: "desktop", error: error?.message || String(error) };
  }
}

export async function observeBrowser() {
  return browserSnapshot();
}

export async function verifyFile({ absolutePath, expectedExists = true }) {
  try {
    const stat = await fs.stat(path.resolve(absolutePath));
    return { success: expectedExists === true, exists: true, isFile: stat.isFile(), size: stat.size, modifiedAt: stat.mtime.toISOString() };
  } catch {
    return { success: expectedExists === false, exists: false };
  }
}

export async function verifyBrowser({ urlContains = "", textContains = "" }) {
  const snapshot = await browserSnapshot();
  if (!snapshot.success) return snapshot;
  const urlOk = !urlContains || snapshot.url.includes(String(urlContains));
  const textOk = !textContains || snapshot.text.toLowerCase().includes(String(textContains).toLowerCase());
  return { ...snapshot, verified: urlOk && textOk, checks: { urlOk, textOk } };
}

export async function verifyAction({ action, expected = {} } = {}) {
  const type = String(action || expected.type || "").toLowerCase();
  if (type === "browser" || expected.browser) return verifyBrowser(expected.browser || expected);
  if (type === "file" || expected.file) return verifyFile(expected.file || expected);
  const desktop = await observeDesktop();
  return { success: desktop.success, verified: desktop.success, observation: desktop.success ? { hash: desktop.hash } : null, error: desktop.error || "" };
}

export { screenshotBrowser };
