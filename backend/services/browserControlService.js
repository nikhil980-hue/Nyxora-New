import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

let browser = null;
let context = null;

const stateDir = path.join(os.homedir(), ".nyxora", "browser");

async function ensureBrowser() {
  if (context) return context;
  const { chromium } = await import("playwright");
  await fs.mkdir(stateDir, { recursive: true });
  browser = await chromium.launch({ headless: false });
  context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.newPage();
  return context;
}

async function page() {
  const ctx = await ensureBrowser();
  const pages = ctx.pages();
  return pages[0] || ctx.newPage();
}

function clean(value, max = 4000) { return String(value ?? "").trim().slice(0, max); }
function validUrl(value) {
  try { const url = new URL(String(value)); return ["http:", "https:"].includes(url.protocol) ? url.toString() : null; } catch { return null; }
}

export async function navigateBrowser({ url }) {
  const target = validUrl(url);
  if (!target) return { success: false, error: "Only valid http/https URLs are allowed." };
  const p = await page();
  await p.goto(target, { waitUntil: "domcontentloaded", timeout: 30000 });
  return { success: true, url: p.url(), title: clean(await p.title(), 500) };
}

export async function browserSnapshot() {
  const p = await page();
  return { success: true, url: p.url(), title: clean(await p.title(), 500), text: clean(await p.locator("body").innerText().catch(() => ""), 12000) };
}

export async function clickBrowser({ selector, text }) {
  const p = await page();
  if (selector) await p.locator(String(selector)).first().click({ timeout: 15000 });
  else if (text) await p.getByText(String(text), { exact: false }).first().click({ timeout: 15000 });
  else return { success: false, error: "Provide selector or text to click." };
  return { success: true, url: p.url(), title: clean(await p.title(), 500) };
}

export async function typeBrowser({ selector, text, clear = true }) {
  const p = await page();
  if (!selector) return { success: false, error: "A selector is required for browser typing." };
  const locator = p.locator(String(selector)).first();
  if (clear) await locator.fill("");
  await locator.fill(String(text ?? ""));
  return { success: true, selector: String(selector), characters: String(text ?? "").length };
}

export async function pressBrowser({ key }) {
  const p = await page();
  await p.keyboard.press(String(key));
  return { success: true, key: String(key) };
}

export async function screenshotBrowser({ fullPage = false } = {}) {
  const p = await page();
  const buffer = await p.screenshot({ fullPage: Boolean(fullPage), type: "png" });
  return { success: true, mimeType: "image/png", data: buffer.toString("base64"), url: p.url(), title: clean(await p.title(), 500) };
}

export async function closeBrowser() {
  if (browser) await browser.close().catch(() => {});
  browser = null; context = null;
  return { success: true };
}
