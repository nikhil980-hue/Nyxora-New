const CONTROL_TOOLS = [
  "computer_control",
  "browser_control",
  "application_control",
  "filesystem_control",
  "os_control",
  "screen_observation",
  "action_verification",
];

const DESTRUCTIVE_ACTIONS = [
  "delete",
  "remove",
  "erase",
  "destroy",
  "wipe",
  "clear",
  "overwrite",
  "replace",
  "shutdown",
  "shut down",
  "restart",
  "reboot",
  "power off",
  "turn off",
  "format",
  "uninstall",
  "terminate",
  "kill",
];

const CONFIRMATION_SIGNALS = [
  "confirm",
  "confirmed",
  "yes do it",
  "yes, do it",
  "yes do that",
  "yes, do that",
  "go ahead",
  "proceed",
  "do it",
  "execute it",
  "perform it",
  "continue",
  "approved",
];

const ACTION_VERBS = [
  "open",
  "launch",
  "start",
  "run",
  "close",
  "quit",
  "exit",
  "bring",
  "show",
  "take",
  "go",
  "navigate",
  "visit",
  "browse",
  "search",
  "find",
  "look",
  "check",
  "inspect",
  "read",
  "write",
  "create",
  "make",
  "move",
  "copy",
  "rename",
  "delete",
  "remove",
  "download",
  "upload",
  "save",
  "send",
  "click",
  "press",
  "type",
  "enter",
  "paste",
  "select",
  "scroll",
  "drag",
  "drop",
  "move",
  "use",
  "connect",
  "disconnect",
  "play",
  "pause",
  "stop",
  "switch",
  "change",
  "turn",
  "enable",
  "disable",
  "lock",
  "unlock",
  "shutdown",
  "restart",
  "reboot",
];

const BROWSER_INTENTS = [
  "website",
  "web page",
  "webpage",
  "web site",
  "browser",
  "internet",
  "online",
  "url",
  "link",
  "search the web",
  "search online",
  "search google",
  "google search",
  "browse",
  "navigate",
  "visit",
  "web",
];

const FILESYSTEM_INTENTS = [
  "file",
  "files",
  "folder",
  "directory",
  "document",
  "documents",
  "pdf",
  "spreadsheet",
  "excel",
  "presentation",
  "ppt",
  "pptx",
  "word document",
  "downloaded",
  "downloads",
  "desktop file",
  "my files",
  "this file",
  "that file",
  "the file",
];

const COMPUTER_INTENTS = [
  "mouse",
  "cursor",
  "click",
  "double click",
  "right click",
  "type",
  "typing",
  "keyboard",
  "press",
  "key",
  "hotkey",
  "shortcut",
  "scroll",
  "drag",
  "drop",
  "select",
  "paste",
  "copy",
  "screen",
  "window",
];

const SCREEN_INTENTS = [
  "screen",
  "desktop",
  "screenshot",
  "what do you see",
  "what is on my screen",
  "what's on my screen",
  "look at my screen",
  "look at the screen",
  "inspect my screen",
  "see my screen",
  "read my screen",
  "check my screen",
  "what is showing",
  "what's showing",
];

const OS_INTENTS = [
  "shutdown",
  "shut down",
  "restart computer",
  "restart pc",
  "restart my computer",
  "reboot",
  "sleep computer",
  "sleep mode",
  "power off",
  "turn off computer",
  "system status",
  "system information",
  "cpu",
  "memory usage",
  "ram usage",
  "disk usage",
];

function clean(value, max = 1200) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text, values) {
  const source = normalize(text);

  return values.some((value) => {
    const signal = normalize(value);

    if (!signal) {
      return false;
    }

    return source.includes(signal);
  });
}

function hasActionVerb(text) {
  const value = normalize(text);

  return ACTION_VERBS.some((verb) => {
    const pattern = new RegExp(
      `\\b${escapeRegExp(verb)}\\b`,
      "i"
    );

    return pattern.test(value);
  });
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isQuestionOrInformationRequest(text) {
  const value = normalize(text);

  if (
    /^(what|who|why|when|where|how|which|can you explain|tell me about|define|meaning of)\b/i.test(
      value
    )
  ) {
    return true;
  }

  return false;
}

function isConfirmation(text) {
  return hasAny(text, CONFIRMATION_SIGNALS);
}

function requiresConfirmation(text) {
  return hasAny(text, DESTRUCTIVE_ACTIONS);
}

function extractUrl(text) {
  const match = String(text || "").match(
    /https?:\/\/[^\s<>"']+/i
  );

  if (!match) {
    return null;
  }

  return match[0].replace(/[),.;!?]+$/, "");
}

function extractDomain(text) {
  const value = String(text || "");

  const match = value.match(
    /\b(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?\b/i
  );

  return match
    ? match[0].replace(/[),.;!?]+$/, "")
    : null;
}

function extractAction(text) {
  const value = normalize(text);

  const actionPatterns = [
    {
      action: "open",
      pattern:
        /\b(?:open|launch|start|bring up|get|show|pull up)\b/i,
    },
    {
      action: "close",
      pattern:
        /\b(?:close|quit|exit|shut)\b/i,
    },
    {
      action: "search",
      pattern:
        /\b(?:search|look up|find|google|look for)\b/i,
    },
    {
      action: "navigate",
      pattern:
        /\b(?:go|navigate|visit|take me|bring me)\b/i,
    },
    {
      action: "click",
      pattern:
        /\b(?:click|press|select|tap)\b/i,
    },
    {
      action: "type",
      pattern:
        /\b(?:type|write|enter|paste)\b/i,
    },
    {
      action: "read",
      pattern:
        /\b(?:read|open and read|inspect|check)\b/i,
    },
    {
      action: "create",
      pattern:
        /\b(?:create|make|generate|build)\b/i,
    },
    {
      action: "delete",
      pattern:
        /\b(?:delete|remove|erase|destroy|wipe)\b/i,
    },
    {
      action: "move",
      pattern:
        /\b(?:move|drag)\b/i,
    },
    {
      action: "copy",
      pattern:
        /\b(?:copy|duplicate)\b/i,
    },
    {
      action: "download",
      pattern:
        /\b(?:download|save)\b/i,
    },
    {
      action: "upload",
      pattern:
        /\b(?:upload|attach)\b/i,
    },
    {
      action: "play",
      pattern:
        /\b(?:play|resume)\b/i,
    },
    {
      action: "pause",
      pattern:
        /\b(?:pause)\b/i,
    },
    {
      action: "stop",
      pattern:
        /\b(?:stop)\b/i,
    },
    {
      action: "restart",
      pattern:
        /\b(?:restart|reboot)\b/i,
    },
    {
      action: "shutdown",
      pattern:
        /\b(?:shutdown|shut down|power off|turn off)\b/i,
    },
  ];

  for (const item of actionPatterns) {
    if (item.pattern.test(value)) {
      return item.action;
    }
  }

  return null;
}

function extractTarget(text) {
  const value = clean(text, 4000);

  const patterns = [
    /\b(?:open|launch|start|run|close|quit|exit|bring up|get|show|pull up)\s+(?:the\s+)?(.+?)(?:\s+(?:for me|please|pls|now))?$/i,

    /\b(?:go to|navigate to|visit|take me to|bring me to)\s+(?:the\s+)?(.+?)(?:\s+(?:for me|please|pls|now))?$/i,

    /\b(?:search for|look for|look up|find)\s+(.+?)(?:\s+(?:for me|please|pls|now))?$/i,

    /\b(?:click|press|select|tap)\s+(?:on\s+)?(.+?)(?:\s+(?:for me|please|pls|now))?$/i,

    /\b(?:type|write|enter|paste)\s+(.+?)(?:\s+(?:into|in|on)\s+.+)?$/i,

    /\b(?:read|inspect|check)\s+(?:the\s+)?(.+?)(?:\s+(?:for me|please|pls|now))?$/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (match?.[1]) {
      return clean(
        match[1]
          .replace(/^["']|["']$/g, "")
          .trim(),
        1000
      );
    }
  }

  return null;
}

function extractSearchQuery(text) {
  const value = clean(text, 4000);

  const patterns = [
    /\bsearch\s+(?:google|the web|online)?\s*(?:for)?\s+(.+)/i,

    /\blook\s+(?:up|for)\s+(.+)/i,

    /\bfind\s+(.+)/i,

    /\bgoogle\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (match?.[1]) {
      return clean(
        match[1]
          .replace(/[.!?]+$/, "")
          .trim(),
        500
      );
    }
  }

  return null;
}

function extractBrowserUrl(text) {
  const direct = extractUrl(text);

  if (direct) {
    return direct;
  }

  const domain = extractDomain(text);

  if (domain) {
    return `https://${domain}`;
  }

  const value = normalize(text);

  /*
   * Common human expressions for web destinations.
   * This is intentionally small.
   *
   * Unknown websites are handled through the generic
   * domain extraction above or by the agent/browser layer.
   */

  const knownWebsites = [
    {
      pattern: /\b(?:google|google\.com)\b/i,
      url: "https://www.google.com",
    },
    {
      pattern: /\b(?:youtube|youtube\.com)\b/i,
      url: "https://www.youtube.com",
    },
    {
      pattern: /\b(?:gmail|gmail\.com)\b/i,
      url: "https://mail.google.com",
    },
    {
      pattern: /\b(?:github|github\.com)\b/i,
      url: "https://github.com",
    },
    {
      pattern: /\b(?:facebook|facebook\.com)\b/i,
      url: "https://www.facebook.com",
    },
    {
      pattern: /\b(?:instagram|instagram\.com)\b/i,
      url: "https://www.instagram.com",
    },
    {
      pattern: /\b(?:linkedin|linkedin\.com)\b/i,
      url: "https://www.linkedin.com",
    },
    {
      pattern: /\b(?:reddit|reddit\.com)\b/i,
      url: "https://www.reddit.com",
    },
    {
      pattern: /\b(?:x|twitter|x\.com|twitter\.com)\b/i,
      url: "https://x.com",
    },
  ];

  for (const website of knownWebsites) {
    if (website.pattern.test(value)) {
      return website.url;
    }
  }

  return null;
}

function detectBrowserIntent(text) {
  const value = normalize(text);

  if (extractUrl(value) || extractDomain(value)) {
    return true;
  }

  if (hasAny(value, BROWSER_INTENTS)) {
    return true;
  }

  /*
   * Human-style navigation requests.
   *
   * Example:
   * "take me to wikipedia"
   * "bring up google"
   * "can you open youtube"
   *
   * We don't need to know the website name beforehand.
   */
  if (
    /\b(?:go|take me|bring me|navigate|visit)\b[\s\S]{0,80}\b(?:to|on)\b/i.test(
      value
    )
  ) {
    return true;
  }

  if (
    /\b(?:open|bring up|pull up|show)\b[\s\S]{0,80}\b(?:website|web|page|site)\b/i.test(
      value
    )
  ) {
    return true;
  }

  return false;
}

function detectFilesystemIntent(text) {
  const value = normalize(text);

  if (hasAny(value, FILESYSTEM_INTENTS)) {
    return true;
  }

  if (
    /\b(?:open|find|locate|look for|search for|read|create|make|delete|remove|move|copy|rename)\b[\s\S]{0,100}\b(?:file|folder|document)\b/i.test(
      value
    )
  ) {
    return true;
  }

  return false;
}

function detectComputerIntent(text) {
  return hasAny(text, COMPUTER_INTENTS);
}

function detectScreenIntent(text) {
  return hasAny(text, SCREEN_INTENTS);
}

function detectOsIntent(text) {
  return hasAny(text, OS_INTENTS);
}

function looksLikeApplicationAction(text) {
  const value = normalize(text);

  /*
   * Application actions are deliberately target-agnostic.
   *
   * We do NOT maintain a list of applications.
   *
   * "Open Spotify"
   * "Launch Blender"
   * "Start VS Code"
   * "Bring up some random application"
   *
   * can all reach the application-control layer.
   */

  return /\b(?:open|launch|start|run|close|quit|exit|bring up|show)\b/i.test(
    value
  );
}

function inferTask(text) {
  const value = normalize(text);

  if (detectOsIntent(value)) {
    return "os_control";
  }

  if (detectScreenIntent(value)) {
    return "screen_observation";
  }

  if (detectComputerIntent(value)) {
    return "computer_control";
  }

  if (detectFilesystemIntent(value)) {
    return "filesystem_control";
  }

  if (detectBrowserIntent(value)) {
    return "browser_control";
  }

  /*
   * Unknown application names are NOT rejected.
   *
   * If the user clearly asks to open/launch/start/run something,
   * application control becomes a candidate.
   */
  if (looksLikeApplicationAction(value)) {
    return "application_control";
  }

  return "general";
}

function isActionRequest(text) {
  const value = normalize(text);

  if (!value) {
    return false;
  }

  if (isQuestionOrInformationRequest(value) && !hasActionVerb(value)) {
    return false;
  }

  if (hasActionVerb(value)) {
    return true;
  }

  /*
   * Natural imperative language can omit obvious command verbs.
   *
   * Examples:
   * "I'd like Spotify open."
   * "I need this PDF on screen."
   * "I want the browser on YouTube."
   */
  if (
    /\b(?:i want|i need|i'd like|please|can you|could you|would you|help me)\b[\s\S]{0,120}\b(?:open|closed|ready|available|on screen|in front of me)\b/i.test(
      value
    )
  ) {
    return true;
  }

  return false;
}

function buildSelectedTools(task, text) {
  const selected = new Set();

  /*
   * Always preserve the strongest semantic candidate.
   */
  if (task === "browser_control") {
    selected.add("browser_control");
  }

  if (task === "application_control") {
    selected.add("application_control");
  }

  if (task === "filesystem_control") {
    selected.add("filesystem_control");
  }

  if (task === "computer_control") {
    selected.add("computer_control");
  }

  if (task === "os_control") {
    selected.add("os_control");
  }

  if (task === "screen_observation") {
    selected.add("screen_observation");
  }

  /*
   * Ambiguous natural-language requests should remain flexible.
   *
   * Example:
   * "Open Spotify"
   *
   * The command layer does not need to know whether Spotify is
   * an installed application, a web app, or a browser destination.
   *
   * The agent can reason about the target and choose the actual
   * execution path.
   */
  if (
    task === "application_control" &&
    !extractUrl(text) &&
    !extractDomain(text)
  ) {
    selected.add("browser_control");
  }

  /*
   * Verification belongs to every physical/computer action.
   */
  if (selected.size > 0) {
    selected.add("action_verification");
  }

  return [...selected];
}

function calculateComplexity(task, text) {
  const value = normalize(text);

  let score = 0;

  if (task !== "general") {
    score += 40;
  }

  if (value.length > 80) {
    score += 10;
  }

  if (
    /\b(?:and then|then|after that|afterwards|next|also|finally)\b/i.test(
      value
    )
  ) {
    score += 20;
  }

  if (
    /\b(?:click|type|press|search|open|find|read|inspect|verify|check)\b/gi.test(
      value
    )
  ) {
    score += 10;
  }

  if (
    value.includes(" and ") ||
    value.includes(", then ")
  ) {
    score += 10;
  }

  return Math.min(100, score || 0);
}

function extractFilePath(text) {
  const value = String(text || "");

  const explicitPath = value.match(
    /(?:file|path)\s+(?:at\s+)?["']?([^"'\n]+?)["']?(?:\s+(?:with|containing|content)\s+|$)/i
  );

  if (explicitPath?.[1]) {
    return clean(explicitPath[1], 1000);
  }

  /*
   * Do not attempt to invent a filename.
   *
   * If the user says:
   * "find my biology notes"
   *
   * the semantic target is handled by the filesystem agent,
   * not by a brittle filename regex.
   */
  return null;
}

function extractApplication(text) {
  const value = clean(text, 4000);

  /*
   * No APP_NAMES list.
   *
   * We only extract the natural-language target.
   */
  const match = value.match(
    /\b(?:open|launch|start|run|close|quit|exit|bring up|show)\s+(?:the\s+)?(.+?)(?:\s+(?:for me|please|pls|now))?$/i
  );

  if (!match?.[1]) {
    return null;
  }

  const target = clean(
    match[1]
      .replace(/[.!?]+$/, "")
      .trim(),
    500
  );

  if (!target) {
    return null;
  }

  /*
   * If it clearly looks like a URL/domain, it belongs to browser control.
   */
  if (extractUrl(target) || extractDomain(target)) {
    return null;
  }

  return target;
}

export function analyzeJarvisCommand(prompt = "", options = {}) {
  const text = clean(prompt, 4000);
  const forceJarvis = Boolean(options?.forceJarvis);

  const task = inferTask(text);

  const actionRequest = isActionRequest(text);

  /*
   * A request can be an action even when our lightweight semantic
   * classifier cannot identify the exact tool yet.
   *
   * This is the critical difference from the old implementation:
   *
   * OLD:
   * unknown phrase -> general -> never reaches JARVIS
   *
   * NEW:
   * action request -> JARVIS -> agent reasons about the request
   */
  const isJarvisCommand =
    forceJarvis ||
    actionRequest ||
    task !== "general";

  const confirmationProvided = isConfirmation(text);

  const destructive = requiresConfirmation(text);

  const browserUrl = extractBrowserUrl(text);

  const browserSearch = extractSearchQuery(text);

  const application =
    task === "application_control"
      ? extractApplication(text)
      : null;

  const filePath = extractFilePath(text);

  const target = extractTarget(text);

  let effectiveTask = task;

  /*
   * If the command is clearly actionable but the lightweight
   * semantic layer cannot confidently classify it, keep it as
   * an agent-controlled action rather than treating it as ordinary
   * conversation.
   */
  if (isJarvisCommand && effectiveTask === "general") {
    effectiveTask = "agent_control";
  }

  let selectedTools = buildSelectedTools(
    effectiveTask,
    text
  );

  /*
   * Unknown action:
   *
   * Give the agent the complete control capability set.
   * The agent's planner decides which actual tool is appropriate.
   *
   * This is what allows:
   *
   * "Open that thing I downloaded."
   * "Launch the editor."
   * "Get that website open."
   * "Do what I just asked on the screen."
   *
   * without hardcoding every possible noun.
   */
  if (
    isJarvisCommand &&
    effectiveTask === "agent_control"
  ) {
    selectedTools = [...CONTROL_TOOLS];
  }

  /*
   * Complex multi-step requests may require several capabilities.
   */
  if (isJarvisCommand) {
    if (detectBrowserIntent(text)) {
      selectedTools.push("browser_control");
    }

    if (detectFilesystemIntent(text)) {
      selectedTools.push("filesystem_control");
    }

    if (detectComputerIntent(text)) {
      selectedTools.push("computer_control");
    }

    if (detectScreenIntent(text)) {
      selectedTools.push("screen_observation");
    }

    if (detectOsIntent(text)) {
      selectedTools.push("os_control");
    }

    if (looksLikeApplicationAction(text)) {
      selectedTools.push("application_control");
    }

    selectedTools.push("action_verification");
  }

  selectedTools = [
    ...new Set(
      selectedTools.filter((tool) =>
        CONTROL_TOOLS.includes(tool)
      )
    ),
  ];

  const complexityScore = calculateComplexity(
    effectiveTask,
    text
  );

  const confidence =
    effectiveTask === "general"
      ? 0.35
      : effectiveTask === "agent_control"
        ? 0.72
        : 0.9;

  return {
    isJarvisCommand,

    jarvisMode: forceJarvis,

    task: effectiveTask,

    selectedTools,

    complexityScore,

    confidence,

    needsReasoning: isJarvisCommand,

    requiresConfirmation:
      destructive && !confirmationProvided,

    confirmationProvided,

    browserUrl,

    browserSearch,

    application,

    filePath,

    target,

    action: extractAction(text),

    rawPrompt: text,

    /*
     * Metadata for the agent planner.
     *
     * These fields intentionally describe the request rather
     * than forcing the request into a fixed vocabulary.
     */
    semanticUnderstanding: {
      openWorld: true,
      actionRequest,
      targetKnown: Boolean(target),
      target: target || null,
      targetMayBeUnknown: !target,
      allowAgentPlanning: true,
      allowCapabilityDiscovery: true,
    },
  };
}

export function buildJarvisCommandContext(command = {}) {
  const semantic = command.semanticUnderstanding || {};

  return [
    "NYXORA JARVIS COMMAND CONTEXT",

    `JARVIS MODE: ${Boolean(command.jarvisMode)}`,

    `TASK: ${clean(command.task || "general", 100)}`,

    `ACTION: ${clean(command.action || "unknown", 100)}`,

    `TARGET: ${clean(
      command.target ||
        semantic.target ||
        "not explicitly identified",
      1000
    )}`,

    `CONFIRMATION REQUIRED: ${Boolean(
      command.requiresConfirmation
    )}`,

    `CONFIRMATION PROVIDED: ${Boolean(
      command.confirmationProvided
    )}`,

    `OPEN-WORLD UNDERSTANDING: ${Boolean(
      semantic.openWorld
    )}`,

    `ALLOW AGENT PLANNING: ${Boolean(
      semantic.allowAgentPlanning
    )}`,

    command.browserUrl
      ? `BROWSER URL: ${command.browserUrl}`
      : "",

    command.browserSearch
      ? `BROWSER SEARCH: ${command.browserSearch}`
      : "",

    command.application
      ? `APPLICATION TARGET: ${command.application}`
      : "",

    command.filePath
      ? `FILE PATH: ${command.filePath}`
      : "",

    "",

    "Interpret the user's request by meaning, not by exact sentence matching.",

    "Do not require the application, website, file, folder, or target name to exist in a predefined list.",

    "Unknown application names are valid targets.",

    "Unknown file names are valid targets.",

    "Unknown websites and URLs are valid targets.",

    "Use the available tools to discover, resolve, observe, and verify the target.",

    "If the target is ambiguous, use context, observation, filesystem discovery, browser discovery, or other appropriate tools before failing.",

    "Do not invent a target when it cannot be established from the request or available context.",

    "Do not claim an action succeeded unless the corresponding tool result and verification support that conclusion.",

    "For destructive actions, do not execute unless confirmation was explicitly provided.",
  ]
    .filter(Boolean)
    .join("\n");
}