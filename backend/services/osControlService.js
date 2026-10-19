import os from "node:os";
import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { openApplication } from "./applicationControlService.js";

const execFileAsync = promisify(execFile);

export async function getSystemStatus() {
  return {
    success: true,
    platform: process.platform,
    release: os.release(),
    hostname: os.hostname(),
    uptimeSeconds: os.uptime(),
    cpuCount: os.cpus().length,
    memory: { total: os.totalmem(), free: os.freemem() },
    loadAverage: os.loadavg(),
  };
}

export async function openUrl({ url }) {
  const target = String(url ?? "").trim();
  let parsed;
  try { parsed = new URL(target); } catch { return { success: false, error: "Invalid URL." }; }
  if (!["http:", "https:"].includes(parsed.protocol)) return { success: false, error: "Only http/https URLs are allowed." };

  if (process.platform === "win32") await execFileAsync("cmd.exe", ["/c", "start", "", target]);
  else if (process.platform === "darwin") await execFileAsync("open", [target]);
  else await execFileAsync("xdg-open", [target]);
  return { success: true, url: target };
}

export async function openApp({ name }) { return openApplication({ name }); }

export async function powerAction({ action, confirm = false }) {
  const value = String(action ?? "").toLowerCase();
  if (!["shutdown", "restart", "sleep"].includes(value)) return { success: false, error: "Unsupported power action." };
  if (!confirm) return { success: false, requiresConfirmation: true, error: `${value} requires explicit confirmation.` };

  if (process.platform === "win32") {
    if (value === "shutdown") await execFileAsync("shutdown", ["/s", "/t", "0"]);
    if (value === "restart") await execFileAsync("shutdown", ["/r", "/t", "0"]);
    if (value === "sleep") await execFileAsync("rundll32.exe", ["powrprof.dll,SetSuspendState", "0,1,0"]);
  } else if (process.platform === "darwin") {
    if (value === "shutdown") await execFileAsync("osascript", ["-e", "tell app \"System Events\" to shut down"]);
    if (value === "restart") await execFileAsync("osascript", ["-e", "tell app \"System Events\" to restart"]);
    if (value === "sleep") await execFileAsync("pmset", ["sleepnow"]);
  } else {
    const cmd = value === "sleep" ? "systemctl" : "systemctl";
    const arg = value === "restart" ? "reboot" : value === "shutdown" ? "poweroff" : "suspend";
    await execFileAsync(cmd, [arg]);
  }
  return { success: true, action: value };
}
