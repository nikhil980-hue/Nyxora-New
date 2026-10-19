const ACTIVATION_PATTERNS = [
  /^nyxora\s+powerup$/i,
];

const DEACTIVATION_PATTERNS = [
  /^nyxora\s+powerof$/i,
];

export const JARVIS_SUGGESTIONS = [
  "Open Chrome",
  "Search Google for Python tutorials",
  "Open my Downloads folder",
  "Show my system status",
  "What is on my screen?",
];

export function normalizeJarvisCommand(value = "") {
  return String(value || "")
    .trim()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");
}

export function isJarvisActivationCommand(value = "") {
  const text = normalizeJarvisCommand(value);

  return ACTIVATION_PATTERNS.some((pattern) =>
    pattern.test(text)
  );
}

export function isJarvisDeactivationCommand(value = "") {
  const text = normalizeJarvisCommand(value);

  return DEACTIVATION_PATTERNS.some((pattern) =>
    pattern.test(text)
  );
}

export function stripJarvisWakePrefix(value = "") {
  return normalizeJarvisCommand(value)
    .replace(
      /^nyxora\s+powerup[\s,:-]*/i,
      ""
    )
    .trim();
}

export function getJarvisSuggestions(value = "") {
  const text = normalizeJarvisCommand(value).toLowerCase();

  if (
    /\b(browser|chrome|google|website|search|youtube)\b/.test(
      text
    )
  ) {
    return [
      "Search Google for AI news",
      "Open YouTube",
      "Go to GitHub",
    ];
  }

  if (
    /\b(file|folder|download|document|pdf)\b/.test(
      text
    )
  ) {
    return [
      "Open my Downloads folder",
      "Find my latest PDF",
      "List files in Downloads",
    ];
  }

  if (
    /\b(screen|desktop|computer|window)\b/.test(
      text
    )
  ) {
    return [
      "What is on my screen?",
      "Show my system status",
      "Open Chrome",
    ];
  }

  return JARVIS_SUGGESTIONS;
}