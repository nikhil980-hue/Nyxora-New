import os from "node:os";

let nut = null;

async function loadNut() {
  if (nut) return nut;
  try {
    nut = await import("@nut-tree-fork/nut-js");
    return nut;
  } catch (error) {
    throw new Error(`Desktop control dependency is unavailable: ${error?.message || error}`);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function safeText(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

export async function getPointerPosition() {
  const api = await loadNut();
  const position = await api.mouse.getPosition();
  return { success: true, x: position.x, y: position.y };
}

export async function moveMouse({ x, y, durationMs = 120 } = {}) {
  const api = await loadNut();
  const screen = await api.screen.size();
  const target = {
    x: clamp(x, 0, screen.width - 1),
    y: clamp(y, 0, screen.height - 1),
  };
  api.mouse.config.mouseSpeed = Math.max(1, Math.round(1000 / Math.max(1, Number(durationMs))));
  await api.mouse.setPosition(target);
  return { success: true, action: "move_mouse", position: target, screen };
}

export async function clickMouse({ button = "left", clicks = 1 } = {}) {
  const api = await loadNut();
  const normalized = String(button).toLowerCase();
  const mouseButton = normalized === "right" ? api.Button.RIGHT : api.Button.LEFT;
  const count = clamp(clicks, 1, 3);
  await api.mouse.click(mouseButton, count);
  return { success: true, action: "click_mouse", button: normalized, clicks: count };
}

export async function typeText({ text = "", intervalMs = 0 } = {}) {
  const api = await loadNut();
  const value = safeText(text, 5000);
  if (!value) return { success: false, error: "No text supplied." };
  await api.keyboard.type(value);
  if (Number(intervalMs) > 0) await new Promise((resolve) => setTimeout(resolve, Number(intervalMs)));
  return { success: true, action: "type_text", characters: value.length };
}

export async function pressKey({ key }) {
  const api = await loadNut();
  const value = safeText(key, 40).toLowerCase();
  const keyMap = api.Key || {};
  const mapped = keyMap[value.toUpperCase()] || keyMap[value] || null;
  if (!mapped) return { success: false, error: `Unsupported keyboard key: ${value}` };
  await api.keyboard.pressKey(mapped);
  return { success: true, action: "press_key", key: value };
}

export async function hotkey({ keys = [] } = {}) {
  const api = await loadNut();
  const list = Array.isArray(keys) ? keys : String(keys).split(/[+,\s]+/);
  const mapped = list.map((key) => api.Key?.[String(key).trim().toUpperCase()]).filter(Boolean);
  if (!mapped.length || mapped.length !== list.filter(Boolean).length) {
    return { success: false, error: "One or more hotkey keys are unsupported." };
  }
  await api.keyboard.pressKey(...mapped);
  return { success: true, action: "hotkey", keys: list.filter(Boolean) };
}

export async function getDesktopEnvironment() {
  return {
    success: true,
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
    release: os.release(),
    user: os.userInfo().username,
    home: os.homedir(),
    cpus: os.cpus().length,
    memory: { total: os.totalmem(), free: os.freemem() },
  };
}
