import {
  generateAIResponseStream,
} from "../services/aiService.js";

import {
  saveMemory,
  getMemory,
} from "../services/memoryService.js";

import {
  extractMemory,
} from "../services/memoryExtractor.js";
import { runNyxoraAgent } from "../services/agentOrchestrator.js";
import { analyzeJarvisCommand } from "../services/jarvisCommandService.js";
import { streamNyxoraModel } from "../services/modelGateway.js";


// ======================================================
// CONFIG
// ======================================================

const MAX_RECENT_MESSAGES = 8;


// ======================================================
// NORMALIZE RECENT MESSAGE
// ======================================================

function normalizeRecentMessage(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .replace(
      /\s+/g,
      " "
    )
    .toLowerCase();

}


// ======================================================
// CHECK LONG-TERM MEMORY CANDIDATE
//
// Avoid calling a cloud LLM for ordinary questions.
// Only messages that contain a reasonable signal of a
// durable personal fact, preference, instruction, or
// explicit memory request are sent to extractMemory().
// ======================================================

function shouldConsiderForLongTermMemory(
  message
) {

  const text = String(
    message ||
    ""
  )
    .trim()
    .toLowerCase();

  if (!text) {
    return false;
  }

  const explicitMemorySignals = [
    "remember that",
    "remember this",
    "don't forget",
    "do not forget",
    "keep this in mind",
    "save this",
    "store this",
    "from now on",
    "going forward",
  ];

  if (
    explicitMemorySignals.some(
      (signal) =>
        text.includes(signal)
    )
  ) {

    return true;

  }


  const personalMemorySignals = [
    /\bmy\s+(name|course|college|school|university|team|role|job|work|skills?|hobbies?|interests?|preferences?|favorite|favourite|goals?|projects?)\b/i,

    /\bi\s+(am|\'m|study|work|live|like|love|prefer|hate|dislike|enjoy|use|have|own)\b/i,

    /\bi\s+(always|usually|often|never)\b/i,

    /\bcall me\b/i,
  ];


  return personalMemorySignals.some(
    (signal) =>
      signal.test(text)
  );

}


// ======================================================
// BUILD RECENT MESSAGES
// ======================================================

function buildRecentMessages(
  existingMessages = [],
  userMessage,
  aiResponse
) {

  const safeExisting =
    Array.isArray(
      existingMessages
    )
      ? existingMessages.filter(
          (entry) =>
            entry &&
            typeof entry ===
              "object"
        )
      : [];


  const cleanUserMessage =
    String(
      userMessage || ""
    ).trim();


  const cleanAIResponse =
    String(
      aiResponse || ""
    ).trim();


  const newEntry = {

    user:
      cleanUserMessage,

    ai:
      cleanAIResponse,

  };


  // ====================================================
  // DUPLICATE PROTECTION
  // ====================================================

  if (
    safeExisting.length > 0
  ) {

    const lastIndex =
      safeExisting.length - 1;


    const lastEntry =
      safeExisting[
        lastIndex
      ];


    const previousUserMessage =
      normalizeRecentMessage(
        lastEntry.user
      );


    const currentUserMessage =
      normalizeRecentMessage(
        cleanUserMessage
      );


    if (
      previousUserMessage &&
      currentUserMessage &&
      previousUserMessage ===
        currentUserMessage
    ) {

      const updatedMessages = [
        ...safeExisting,
      ];


      updatedMessages[
        lastIndex
      ] = {

        ...lastEntry,

        user:
          cleanUserMessage,

        ai:
          cleanAIResponse,

      };


      console.log(
        "♻️ Recent Context duplicate replaced instead of appended."
      );


      return updatedMessages.slice(
        -MAX_RECENT_MESSAGES
      );

    }

  }


  // ====================================================
  // NORMAL NEW CONVERSATION TURN
  // ====================================================

  const updatedMessages = [

    ...safeExisting,

    newEntry,

  ];


  return updatedMessages.slice(
    -MAX_RECENT_MESSAGES
  );

}


// ======================================================
// VALIDATE ATTACHMENT
// ======================================================

function normalizeAttachment(
  attachment
) {

  if (
    !attachment ||
    typeof attachment !==
      "object"
  ) {

    return null;

  }


  const data =
    typeof attachment.data ===
      "string"

      ? attachment.data.trim()

      : "";


  const mimeType =
    typeof attachment.mimeType ===
      "string"

      ? attachment.mimeType.trim()

      : "";


  const name =
    typeof attachment.name ===
      "string"

      ? attachment.name.trim()

      : "Attachment";


  if (
    !data ||
    !mimeType
  ) {

    return null;

  }


  // ====================================================
  // CURRENT DIRECT AI ATTACHMENT SUPPORT
  //
  // DOCX/TXT/MD are already converted into text by the
  // frontend and therefore do not need inlineData here.
  // ====================================================

  const supported =
    mimeType.startsWith(
      "image/"
    ) ||
    mimeType ===
      "application/pdf";


  if (!supported) {

    console.warn(
      "⚠️ Unsupported direct AI attachment:",
      mimeType
    );


    return null;

  }


  return {

    data,

    mimeType,

    name,

  };

}


// ======================================================
// NORMALIZE LEGACY IMAGE
// ======================================================

function normalizeLegacyImage(
  image
) {

  if (
    !image ||
    typeof image !==
      "object"
  ) {

    return null;

  }


  const data =
    typeof image.data ===
      "string"

      ? image.data.trim()

      : "";


  const mimeType =
    typeof image.mimeType ===
      "string"

      ? image.mimeType.trim()

      : "";


  if (
    !data ||
    !mimeType ||
    !mimeType.startsWith(
      "image/"
    )
  ) {

    return null;

  }


  return {

    data,

    mimeType,

    name:
      "Image",

  };

}


// ======================================================
// CHAT WITH NYXORA AI
// ======================================================

export async function chatWithAI(
  req,
  res
) {

  try {

    const {
      message,

      memoryMessage,

      attachment,

      // New multiple attachment support.
      attachments,

      // Keep legacy image support while the frontend
      // migration is completed.
      image,

      history,

      userId,

      mode,

      jarvisMode = false,

    } = req.body;


    // ==================================================
    // CLEAN MEMORY MESSAGE
    // ==================================================

    const cleanMemoryMessage =
      typeof memoryMessage ===
        "string" &&
      memoryMessage.trim()

        ? memoryMessage.trim()

        : typeof message ===
            "string"

          ? message.trim()

          : "";


    // ==================================================
    // PREPARE ATTACHMENT
    //
    // Prefer the new generic attachment.
    // Fall back to the old image field if necessary.
    // ==================================================

    const safeAttachments =
      Array.isArray(
        attachments
      )

        ? attachments
            .map(
              (
                item
              ) =>
                normalizeAttachment(
                  item
                )
            )
            .filter(
              Boolean
            )

        : [];


    const safeAttachment =
      safeAttachments[0] ||
      normalizeAttachment(
        attachment
      ) ||
      normalizeLegacyImage(
        image
      );


    // ==================================================
    // VALIDATION
    // ==================================================

    const hasMessage =
      typeof message ===
        "string" &&
      message.trim() !== "";


    if (
      !hasMessage &&
      safeAttachments.length === 0 &&
      !safeAttachment
    ) {

      return res
        .status(400)
        .json({

          reply:
            "Message or attachment is required.",

        });

    }


    // ==================================================
    // LOG REQUEST
    // ==================================================

    console.log(
      "👤 Memory User ID:",
      userId ||
        "No user ID"
    );


    console.log(
      "💬 Clean memory message:",
      cleanMemoryMessage ||
        "[No text]"
    );


    if (safeAttachment) {

      console.log(
        "📎 AI attachment:",
        safeAttachment.name,
        safeAttachment.mimeType
      );

    }


    if (
      safeAttachments.length > 0
    ) {

      console.log(
        "📎 AI attachments:",
        safeAttachments.length
      );

    }


    // ==================================================
    // STEP 1 — LOAD CURRENT MEMORY
    // ==================================================

    let userMemory =
      null;


    if (userId) {

      try {

        userMemory =
          await getMemory(
            userId
          );


        console.log(
          "🧠 Current memory loaded:",
          userMemory
        );

      } catch (error) {

        console.error(
          "⚠️ Failed to load current memory:",
          error
        );


        userMemory =
          null;

      }

    }


    // ==================================================
    // STEPS 48-53 — JARVIS COMMAND EXECUTION
    // ==================================================

    const jarvisCommand = analyzeJarvisCommand(
      cleanMemoryMessage,
      { forceJarvis: Boolean(jarvisMode) }
    );

    if (jarvisCommand.isJarvisCommand) {
      const authenticatedUserId = req.nyxoraUser?.uid || null;
      const localRequest =
        req.ip === "127.0.0.1" ||
        req.ip === "::1" ||
        String(req.hostname || "").toLowerCase() === "localhost";
      const jarvisEnabled = String(process.env.NYXORA_JARVIS_ENABLED || "true").toLowerCase() === "true";

      if (!jarvisEnabled) {
        return res.status(403).json({
          success: false,
          reply: "Nyxora JARVIS control is disabled. Set NYXORA_JARVIS_ENABLED=true on the local Nyxora machine.",
        });
      }

      if (!authenticatedUserId && !localRequest) {
        return res.status(401).json({
          success: false,
          reply: "JARVIS computer control requires an authenticated local request.",
        });
      }

      console.log(
        `[Nyxora JARVIS] COMMAND -> task=${jarvisCommand.task} | tools=${jarvisCommand.selectedTools.join(",") || "none"} | confirmation=${jarvisCommand.confirmationProvided}`
      );

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");

      const agentMessages = Array.isArray(history)
        ? history.slice(-10).map((item) => ({
            role: item?.role === "assistant" ? "assistant" : "user",
            content: String(item?.content || item?.message || ""),
          })).filter((item) => item.content.trim())
        : [];

      const modelResponder = async function* ({ messages: agentMessagesInput = [], prompt: agentPrompt = "", attachments = [], mode: agentMode = null, task = "reasoning", timeoutOverrideMs } = {}) {
        try {
          for await (const delta of streamNyxoraModel({
            messages: agentMessagesInput,
            prompt: agentPrompt,
            mode: agentMode,
            attachments: Array.isArray(attachments) ? attachments : [],
            timeoutOverrideMs,
          })) {
            yield delta;
          }
          return;
        } catch (gatewayError) {
          console.warn(`[Nyxora JARVIS] Model Gateway fallback -> ${gatewayError?.message || gatewayError}`);
        }

        for await (const delta of generateAIResponseStream(
          agentPrompt || cleanMemoryMessage,
          null,
          [],
          agentMessagesInput,
          userMemory,
          agentMode
        )) {
          yield delta;
        }
      };

      try {
        let jarvisResponse = "";

        for await (const chunk of runNyxoraAgent({
          messages: agentMessages,
          prompt: cleanMemoryMessage,
          mode,
          taskAnalysis: jarvisCommand,
          modelResponder,
          userId: authenticatedUserId || userId || null,
          agentMemory: userMemory,
          jarvisCommand,
        })) {
          jarvisResponse += String(chunk || "");
          res.write(String(chunk || ""));
        }

        res.end();

        if (userId && cleanMemoryMessage && jarvisResponse.trim()) {
          try {
            const latestMemory = await getMemory(userId);
            const recentMessages = buildRecentMessages(
              latestMemory?.recentMessages || [],
              cleanMemoryMessage,
              jarvisResponse.trim()
            );
            await saveMemory(userId, { recentMessages });
          } catch (memoryError) {
            console.warn("⚠️ Failed to save JARVIS recent context:", memoryError?.message || memoryError);
          }
        }

        return;
      } catch (agentError) {
        console.error("❌ Nyxora JARVIS Error:", agentError);
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            reply: "Nyxora could not safely complete that computer task.",
          });
        }
        try { res.end(); } catch {}
        return;
      }
    }

    // ==================================================
    // STEP 2 — EXTRACT LONG-TERM MEMORY (BACKGROUND)
    //
    // IMPORTANT:
    // Only messages that look like possible durable
    // personal information are sent to the cloud
    // memory extractor.
    //
    // Ordinary questions such as:
    // "What is the capital of Japan?"
    // do NOT trigger Gemini memory extraction.
    //
    // IMPORTANT PERFORMANCE CHANGE:
    // Memory extraction is intentionally NOT awaited here.
    // Gemini memory extraction can take several seconds or
    // hit 429/503 responses. It must never block Nyxora
    // from starting the main AI response stream.
    // ==================================================

    if (
      userId &&
      cleanMemoryMessage &&
      shouldConsiderForLongTermMemory(
        cleanMemoryMessage
      )
    ) {

      const memoryUserId =
        userId;


      const memoryMessage =
        cleanMemoryMessage;


      // Snapshot the memory used for this extraction so
      // later requests cannot mutate the context underneath it.
      const memorySnapshot =
        userMemory
          ? JSON.parse(
              JSON.stringify(
                userMemory
              )
            )
          : null;


      void (async () => {

        try {

          console.log(
            "🧠 Background memory extraction started."
          );


          const extractedMemory =
            await extractMemory(
              memoryMessage,
              memorySnapshot
            );


          if (
            extractedMemory &&
            Object.keys(
              extractedMemory
            ).length > 0
          ) {

            await saveMemory(
              memoryUserId,
              extractedMemory
            );


            console.log(
              "✅ Smart memory changes saved in background."
            );

          } else {

            console.log(
              "🧠 No long-term memory update required."
            );

          }

        } catch (error) {

          console.error(
            "⚠️ Background memory processing failed:",
            error?.message || error
          );


          // Memory failure must never prevent
          // the AI response.

        }

      })();

    }


    // ==================================================
    // STEP 3 — STREAM AI RESPONSE
    // ==================================================

    let fullResponse =
      "";


    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );


    res.setHeader(
      "Transfer-Encoding",
      "chunked"
    );


    res.setHeader(
      "Cache-Control",
      "no-cache"
    );


    for await (
      const chunk of
        generateAIResponseStream(

          message ||
            "Analyze the attached file.",

          safeAttachment,

          safeAttachments,

          Array.isArray(history)
            ? history
            : [],

          userMemory,

          mode

        )
    ) {

      fullResponse +=
        chunk;


      res.write(
        chunk
      );

    }


    // ==================================================
    // STEP 4 — FINISH RESPONSE
    // ==================================================

    res.end();


    console.log(
      "✅ Nyxora response completed."
    );


    console.log(
      "📦 Response length:",
      fullResponse.length
    );


    // ==================================================
    // STEP 5 — SAVE RECENT CONTEXT
    //
    // IMPORTANT:
    // Only cleanMemoryMessage is stored as the user side
    // of Recent Context.
    //
    // PDF Base64 and extracted PDF text are NOT stored
    // here.
    // ==================================================

    if (
      userId &&
      cleanMemoryMessage &&
      fullResponse.trim()
    ) {

      try {

        const latestMemory =
          await getMemory(
            userId
          );


        const recentMessages =
          buildRecentMessages(

            latestMemory
              ?.recentMessages ||
              [],

            cleanMemoryMessage,

            fullResponse.trim()

          );


        await saveMemory(

          userId,

          {
            recentMessages,
          }

        );


        console.log(
          "💬 Recent conversation saved."
        );


        console.log(
          "💬 Recent message count:",
          recentMessages.length
        );

      } catch (error) {

        console.error(
          "⚠️ Failed to save recent conversation:",
          error
        );

      }

    }


  } catch (error) {

    console.error(
      "❌ Chat Controller Error:",
      error
    );


    if (
      !res.headersSent
    ) {

      return res
        .status(500)
        .json({

          reply:
            "❌ Something went wrong.",

        });

    }


    try {

      res.end();

    } catch {

      // Ignore stream closing error.

    }

  }

}