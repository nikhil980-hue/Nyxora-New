import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const ROOT = path.resolve(process.env.NYXORA_CONTROL_ROOT || os.homedir());
const MAX_READ = 200000;

function resolveSafe(input) {
  const candidate = path.resolve(ROOT, String(input || "."));

  if (
    candidate !== ROOT &&
    !candidate.startsWith(`${ROOT}${path.sep}`)
  ) {
    throw new Error("Path is outside Nyxora's allowed control root.");
  }

  return candidate;
}

export function getControlRoot() {
  return ROOT;
}

export async function listFiles({ path: relativePath = "." } = {}) {
  const target = resolveSafe(relativePath);

  const entries = await fs.readdir(target, {
    withFileTypes: true,
  });

  return {
    success: true,
    path: path.relative(ROOT, target) || ".",
    entries: entries.slice(0, 500).map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? "directory" : "file",
    })),
  };
}

export async function readFile({ path: relativePath }) {
  const target = resolveSafe(relativePath);
  const stat = await fs.stat(target);

  if (!stat.isFile()) {
    return {
      success: false,
      error: "Target is not a file.",
    };
  }

  if (stat.size > MAX_READ) {
    return {
      success: false,
      error: `File is too large to read directly (${stat.size} bytes).`,
    };
  }

  return {
    success: true,
    path: path.relative(ROOT, target),
    content: await fs.readFile(target, "utf8"),
  };
}

export async function writeFile({
  path: relativePath,
  content = "",
  confirm = false,
}) {
  if (!confirm) {
    return {
      success: false,
      requiresConfirmation: true,
      error: "Writing a local file requires explicit confirmation.",
    };
  }

  const target = resolveSafe(relativePath);

  await fs.mkdir(path.dirname(target), {
    recursive: true,
  });

  await fs.writeFile(
    target,
    String(content),
    "utf8"
  );

  return {
    success: true,
    path: path.relative(ROOT, target),
    bytes: Buffer.byteLength(String(content)),
  };
}

export async function createDirectory({
  path: relativePath,
  confirm = false,
}) {
  if (!confirm) {
    return {
      success: false,
      requiresConfirmation: true,
      error: "Creating a local directory requires explicit confirmation.",
    };
  }

  const target = resolveSafe(relativePath);

  await fs.mkdir(target, {
    recursive: true,
  });

  return {
    success: true,
    path: path.relative(ROOT, target),
  };
}

export async function deletePath({
  path: relativePath,
  confirm = false,
}) {
  if (!confirm) {
    return {
      success: false,
      requiresConfirmation: true,
      error: "Deleting local files requires explicit confirmation.",
    };
  }

  const target = resolveSafe(relativePath);

  if (target === ROOT) {
    return {
      success: false,
      error: "The Nyxora control root cannot be deleted.",
    };
  }

  await fs.rm(target, {
    recursive: true,
    force: false,
  });

  return {
    success: true,
    path: path.relative(ROOT, target),
  };
}

/**
 * Open a local folder in the operating system's file manager.
 *
 * This action is non-destructive and does not require confirmation.
 */
export async function openFolder({
  path: relativePath = ".",
} = {}) {
  const target = resolveSafe(relativePath);

  const stat = await fs.stat(target);

  if (!stat.isDirectory()) {
    return {
      success: false,
      error: "Target is not a directory.",
      path: path.relative(ROOT, target),
    };
  }

  const platform = process.platform;

  await new Promise((resolve, reject) => {
    let command;
    let args;

    if (platform === "win32") {
      command = "explorer.exe";
      args = [target];
    } else if (platform === "darwin") {
      command = "open";
      args = [target];
    } else {
      command = "xdg-open";
      args = [target];
    }

    const child = spawn(command, args, {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    });

    child.once("error", reject);

    // The file manager process is intentionally detached.
    child.unref();

    resolve();
  });

  return {
    success: true,
    path: path.relative(ROOT, target) || ".",
    openedPath: target,
    platform,
  };
}