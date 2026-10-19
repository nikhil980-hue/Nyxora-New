import { spawn, execFile } from "node:child_process";
import process from "node:process";

const WINDOWS_FALLBACK_APPS = new Map([
  ["notepad", "notepad.exe"],
  ["calculator", "calc.exe"],
  ["paint", "mspaint.exe"],
  ["explorer", "explorer.exe"],
  ["file explorer", "explorer.exe"],
  ["cmd", "cmd.exe"],
  ["powershell", "powershell.exe"],
  ["chrome", "chrome.exe"],
  ["google chrome", "chrome.exe"],
  ["edge", "msedge.exe"],
  ["microsoft edge", "msedge.exe"],
]);

const MAC_FALLBACK_APPS = new Map([
  ["calculator", "Calculator"],
  ["notes", "Notes"],
  ["textedit", "TextEdit"],
  ["finder", "Finder"],
  ["chrome", "Google Chrome"],
  ["google chrome", "Google Chrome"],
  ["edge", "Microsoft Edge"],
]);

const LINUX_FALLBACK_APPS = new Map([
  ["calculator", "gnome-calculator"],
  ["files", "nautilus"],
  ["file manager", "nautilus"],
  ["terminal", "x-terminal-emulator"],
  ["chrome", "google-chrome"],
  ["google chrome", "google-chrome"],
  ["edge", "microsoft-edge"],
  ["microsoft edge", "microsoft-edge"],
]);

function normalizeApplicationName(value) {
  return String(value ?? "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function validateApplicationName(name) {
  const value = normalizeApplicationName(name);

  if (!value) {
    return {
      valid: false,
      error: "Application name is required.",
    };
  }

  if (value.length > 180) {
    return {
      valid: false,
      error: "Application name is too long.",
    };
  }

  /*
   * The application name is data, not a shell command.
   * Reject shell-control characters before it reaches any OS launcher.
   */
  if (/[;&|`$<>]/.test(value)) {
    return {
      valid: false,
      error: "Application name contains unsupported control characters.",
    };
  }

  return {
    valid: true,
    value,
  };
}

function spawnDetached(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    });

    child.once("error", reject);
    child.unref();
    resolve();
  });
}

function execFileAsync(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        windowsHide: true,
        timeout: 8000,
        maxBuffer: 1024 * 1024,
        ...options,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            Object.assign(error, {
              stdout: String(stdout || ""),
              stderr: String(stderr || ""),
            })
          );
          return;
        }

        resolve({
          stdout: String(stdout || ""),
          stderr: String(stderr || ""),
        });
      }
    );
  });
}

function escapePowerShellLiteral(value) {
  return String(value).replace(/'/g, "''");
}

async function resolveWindowsStartApp(name) {
  const query = escapePowerShellLiteral(name);

  const script = [
    "$ErrorActionPreference = 'Stop';",
    `$needle = '${query}';`,
    "$app = Get-StartApps |",
    "Where-Object { $_.Name -like ('*' + $needle + '*') } |",
    "Select-Object -First 1;",
    "if ($null -ne $app) {",
    "  Write-Output ($app.Name + '||' + $app.AppID);",
    "}",
  ].join(" ");

  try {
    const result = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { timeout: 9000 }
    );

    const line = result.stdout
      .split(/\r?\n/)
      .map((item) => item.trim())
      .find(Boolean);

    if (!line) {
      return null;
    }

    const separator = line.indexOf("||");

    if (separator === -1) {
      return null;
    }

    const displayName = line.slice(0, separator).trim();
    const appId = line.slice(separator + 2).trim();

    if (!appId) {
      return null;
    }

    return {
      displayName,
      appId,
    };
  } catch {
    return null;
  }
}

async function tryOpenWindowsStartApp(name) {
  const resolved = await resolveWindowsStartApp(name);

  if (!resolved) {
    return null;
  }

  await spawnDetached("explorer.exe", [
    `shell:AppsFolder\\${resolved.appId}`,
  ]);

  return {
    success: true,
    action: "open_application",
    application: name,
    resolvedApplication: resolved.displayName,
    resolution: "windows_start_apps",
  };
}

function isDomainOrUrl(value) {
  return /^(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/.*)?$/i.test(
    value
  );
}

function toSafeWebSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildWebFallbackUrl(name) {
  const value = toSafeWebSlug(name);

  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (isDomainOrUrl(value)) {
    return `https://${value}`;
  }

  /*
   * Open-world fallback:
   *
   * If the requested target is not installed as a desktop application,
   * treat a simple application/site name as a web destination.
   *
   * This intentionally does not maintain a Google/Spotify/YouTube/etc.
   * website allowlist.
   *
   * Examples:
   *   google   -> https://www.google.com
   *   spotify  -> https://www.spotify.com
   *   wikipedia -> https://www.wikipedia.org
   *
   * If the guessed .com destination is unavailable, the verification
   * layer can report the failed navigation instead of claiming success.
   */
  if (/^[a-z0-9][a-z0-9.-]{0,80}$/i.test(value)) {
    return `https://www.${value}.com`;
  }

  return null;
}

async function openWindowsApplication(name) {
  const normalized = normalizeApplicationName(name);

  /*
   * First resolve the actual installed application dynamically.
   * This removes the old "safe application allowlist" limitation.
   */
  const startAppResult = await tryOpenWindowsStartApp(normalized);

  if (startAppResult) {
    return startAppResult;
  }

  /*
   * Keep a tiny compatibility fallback for classic executables that may
   * not appear in Start Apps.
   */
  const fallbackTarget = WINDOWS_FALLBACK_APPS.get(normalized);

  if (fallbackTarget) {
    await spawnDetached(fallbackTarget);

    return {
      success: true,
      action: "open_application",
      application: normalized,
      resolvedApplication: fallbackTarget,
      resolution: "windows_compatibility_fallback",
    };
  }

  /*
   * Open-world web fallback. This is deliberately after installed-app
   * resolution, so "Open Spotify" launches the installed Spotify app when
   * available, while "Open Google" can still reach Google without Google
   * being hardcoded as an application.
   */
  const webUrl = buildWebFallbackUrl(normalized);

  if (webUrl) {
    await spawnDetached("explorer.exe", [webUrl]);

    return {
      success: true,
      action: "open_web_fallback",
      application: normalized,
      url: webUrl,
      resolution: "web_destination_fallback",
    };
  }

  return {
    success: false,
    error: `Nyxora could not resolve the requested target: ${normalized}`,
  };
}

async function openMacApplication(name) {
  const normalized = normalizeApplicationName(name);

  const fallbackTarget = MAC_FALLBACK_APPS.get(normalized);

  if (fallbackTarget) {
    await spawnDetached("open", ["-a", fallbackTarget]);

    return {
      success: true,
      action: "open_application",
      application: normalized,
      resolvedApplication: fallbackTarget,
      resolution: "mac_compatibility_fallback",
    };
  }

  /*
   * macOS Spotlight/open can resolve installed applications without a
   * hardcoded application-name list.
   */
  try {
    await spawnDetached("open", ["-a", name]);

    return {
      success: true,
      action: "open_application",
      application: normalized,
      resolvedApplication: name,
      resolution: "mac_dynamic_application_resolution",
    };
  } catch {
    const webUrl = buildWebFallbackUrl(normalized);

    if (webUrl) {
      await spawnDetached("open", [webUrl]);

      return {
        success: true,
        action: "open_web_fallback",
        application: normalized,
        url: webUrl,
        resolution: "web_destination_fallback",
      };
    }

    return {
      success: false,
      error: `Nyxora could not resolve the requested target: ${normalized}`,
    };
  }
}

async function openLinuxApplication(name) {
  const normalized = normalizeApplicationName(name);

  const fallbackTarget = LINUX_FALLBACK_APPS.get(normalized);

  if (fallbackTarget) {
    await spawnDetached(fallbackTarget);

    return {
      success: true,
      action: "open_application",
      application: normalized,
      resolvedApplication: fallbackTarget,
      resolution: "linux_compatibility_fallback",
    };
  }

  /*
   * xdg-open delegates to the desktop environment and can resolve
   * registered applications/files/URLs without a hardcoded application
   * vocabulary.
   */
  try {
    await spawnDetached("xdg-open", [name]);

    return {
      success: true,
      action: "open_application",
      application: normalized,
      resolvedApplication: name,
      resolution: "linux_desktop_resolution",
    };
  } catch {
    const webUrl = buildWebFallbackUrl(normalized);

    if (webUrl) {
      await spawnDetached("xdg-open", [webUrl]);

      return {
        success: true,
        action: "open_web_fallback",
        application: normalized,
        url: webUrl,
        resolution: "web_destination_fallback",
      };
    }

    return {
      success: false,
      error: `Nyxora could not resolve the requested target: ${normalized}`,
    };
  }
}

export async function openApplication({ name }) {
  const validation = validateApplicationName(name);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  const application = validation.value;

  try {
    if (process.platform === "win32") {
      return await openWindowsApplication(application);
    }

    if (process.platform === "darwin") {
      return await openMacApplication(application);
    }

    return await openLinuxApplication(application);
  } catch (error) {
    return {
      success: false,
      error: `Failed to open "${application}": ${error?.message || error}`,
    };
  }
}
