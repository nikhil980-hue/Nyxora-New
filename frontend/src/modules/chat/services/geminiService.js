let controller = null;

// ======================================================
// API BASE URL
//
// Desktop:
//   localhost -> localhost:5000
//
// Phone/tablet on same Wi-Fi:
//   automatically uses the laptop's IP address
//
// Production:
//   VITE_API_URL can be provided in .env
// ======================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:5000"
      : `http://${window.location.hostname}:5000`
  );


// ======================================================
// FILE TO BASE64
// ======================================================

async function fileToBase64(
  file
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const reader =
        new FileReader();


      reader.onload = () => {

        try {

          const result =
            reader.result;


          if (
            typeof result !==
            "string"
          ) {

            reject(
              new Error(
                "Unable to read attachment."
              )
            );

            return;

          }


          const commaIndex =
            result.indexOf(",");


          if (
            commaIndex === -1
          ) {

            reject(
              new Error(
                "Invalid attachment data."
              )
            );

            return;

          }


          const base64 =
            result.slice(
              commaIndex + 1
            );


          resolve(base64);

        } catch (error) {

          reject(error);

        }

      };


      reader.onerror = () => {

        reject(
          reader.error ||
          new Error(
            "Unable to read attachment."
          )
        );

      };


      reader.readAsDataURL(
        file
      );

    }
  );

}


// ======================================================
// GET FILE MIME TYPE
// ======================================================

function getMimeType(
  file
) {

  if (!file) {

    return "";

  }

  if (file.type) {

    return file.type;

  }

  const name =
    String(
      file.name || ""
    ).toLowerCase();


  if (
    name.endsWith(".pdf")
  ) {

    return "application/pdf";

  }


  if (
    name.endsWith(".png")
  ) {

    return "image/png";

  }


  if (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  ) {

    return "image/jpeg";

  }


  if (
    name.endsWith(".webp")
  ) {

    return "image/webp";

  }


  return (
    "application/octet-stream"
  );

}


// ======================================================
// CHECK SUPPORTED AI ATTACHMENT
//
// The backend owns document parsing and multimodal routing.
// Keep the original file available for every supported
// document type instead of limiting the frontend transport
// to PDF/image only.
//
// The backend Document Intelligence service can then decide
// whether the file needs text extraction, visual inspection,
// or both.
// ======================================================

const DIRECT_DOCUMENT_EXTENSIONS =
  new Set([
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "csv",
    "tsv",
    "ppt",
    "pptx",
    "odt",
    "ods",
    "odp",
    "rtf",
    "md",
    "txt",
    "html",
    "htm",
    "xml",
    "json",
    "yaml",
    "yml",
    "log",
    "env",
    "ini",
    "conf",
    "zip",
  ]);

function isSupportedAIAttachment(
  mimeType,
  extension = ""
) {

  const normalizedMimeType =
    String(
      mimeType || ""
    )
      .trim()
      .toLowerCase();

  const normalizedExtension =
    String(
      extension || ""
    )
      .trim()
      .toLowerCase();

  return (
    normalizedMimeType.startsWith(
      "image/"
    ) ||
    normalizedMimeType.startsWith(
      "text/"
    ) ||
    normalizedMimeType.startsWith(
      "application/"
    ) ||
    DIRECT_DOCUMENT_EXTENSIONS.has(
      normalizedExtension
    )
  );

}


// ======================================================
// BUILD ATTACHMENT
// ======================================================

async function buildAttachment(
  file
) {

  if (!file) {

    return null;

  }

  const mimeType =
    getMimeType(file);

  const extension =
    String(
      file.name || ""
    )
      .toLowerCase()
      .match(/\.([a-z0-9]+)$/i)?.[1] ||
    "";

  if (
    !isSupportedAIAttachment(
      mimeType,
      extension
    )
  ) {

    console.warn(
      "[Nyxora Attachments] Unsupported file skipped:",
      file.name || "Attachment",
      mimeType
    );

    return null;

  }


  const data =
    await fileToBase64(
      file
    );


  return {

    data,

    mimeType,

    name:
      file.name ||
      "Attachment",

    size:
      Number(
        file.size || 0
      ),

  };

}


// ======================================================
// GENERATE RESPONSE
// ======================================================

export async function generateResponse(

  prompt,

  onChunk,

  file = null,

  files = [],

  history = [],

  userId = null,

  memory = null,

  memoryMessage = null,

  mode = null

) {

  // ====================================================
  // ABORT PREVIOUS REQUEST IF NECESSARY
  // ====================================================

  if (controller) {

    controller.abort();

  }


  controller =
    new AbortController();


  try {

    // ==================================================
    // PREPARE GENERIC ATTACHMENT
    //
    // Supported directly:
    // - image/*
    // - application/pdf
    //
    // PDF is sent as the ORIGINAL document so Gemini can
    // inspect visual content that pdf.js text extraction
    // cannot see.
    // ==================================================

const attachmentFiles =
  Array.isArray(
    files
  ) &&
  files.length > 0

    ? files

    : file
      ? [
          file
        ]

      : [];


const attachments =
  (
    await Promise.all(
      attachmentFiles.map(
        (
          selectedFile
        ) =>
          buildAttachment(
            selectedFile
          )
      )
    )
  ).filter(
    Boolean
  );


const attachment =
  attachments[0] ||
  null;


    // ==================================================
    // DOCUMENT REQUEST CONTRACT
    //
    // Every uploaded file is transported once through the
    // generic `attachments` array. The backend owns the
    // document-intelligence decision:
    //
    // PDF/DOCX/XLSX/PPTX/etc.
    //        -> Document Intelligence
    //        -> document model pool
    //        -> Gemini only as fallback
    //
    // Do NOT duplicate image bytes in a second legacy field.
    // This prevents large PDF/image requests from being sent
    // twice over the network.
    // ==================================================

    const hasAttachments =
      attachments.length > 0;

    console.log(
      "[Nyxora Attachments] REQUEST ->",
      {
        count:
          attachments.length,
        files:
          attachments.map(
            (item) => ({
              name:
                item.name,
              mimeType:
                item.mimeType,
              size:
                item.size,
            })
          ),
        documentAnalysis:
          hasAttachments,
      }
    );


    // ==================================================
    // SEND REQUEST
    // ==================================================

    const response =
      await fetch(

        `${API_BASE_URL}/api/chat`,

        {

          method:
            "POST",


          headers: {

            "Content-Type":
              "application/json",

          },


          body:
            JSON.stringify({

              // Full internal prompt used
              // for AI generation.
              message:
                prompt,


              // Clean original user message
              // used by backend memory.
              memoryMessage:
                memoryMessage ??
                prompt,


              // New generic attachment.
              //
              // Images:
              // {
              //   data,
              //   mimeType: "image/...",
              //   name
              // }
              //
              // PDFs:
              // {
              //   data,
              //   mimeType: "application/pdf",
              //   name
              // }
              attachment,

              attachments,

              // Explicitly tell the backend that this request
              // contains uploaded document/media data. The
              // backend remains responsible for deciding the
              // correct document routing task.
              documentAnalysis:
                hasAttachments,

              history,

              userId,

              memory,

              mode,

            }),


          signal:
            controller.signal,

        }

      );


    // ==================================================
    // HANDLE HTTP ERROR
    // ==================================================

    if (!response.ok) {

      let errorMessage =
        "Failed to connect to AI server.";


      try {

        const errorText =
          await response.text();


        if (errorText) {

          // Backend may return JSON.

          try {

            const parsed =
              JSON.parse(
                errorText
              );


            errorMessage =
              parsed.reply ||
              parsed.message ||
              errorText;

          } catch {

            errorMessage =
              errorText;

          }

        }

      } catch {

        // Keep default message.

      }


      throw new Error(
        errorMessage
      );

    }


    // ==================================================
    // STREAM VALIDATION
    // ==================================================

    if (!response.body) {

      throw new Error(
        "Streaming is not supported."
      );

    }


    const reader =
      response.body.getReader();


    const decoder =
      new TextDecoder();


    let fullResponse =
      "";


    // ==================================================
    // READ STREAM
    // ==================================================

    while (true) {

      const {
        done,
        value,
      } =
        await reader.read();


      if (done) {

        break;

      }


      const chunk =
        decoder.decode(

          value,

          {
            stream: true,
          }

        );


      fullResponse +=
        chunk;


      if (onChunk) {

        onChunk(
          fullResponse
        );

      }

    }


    // ==================================================
    // FLUSH DECODER
    // ==================================================

    const remaining =
      decoder.decode();


    if (remaining) {

      fullResponse +=
        remaining;


      if (onChunk) {

        onChunk(
          fullResponse
        );

      }

    }


    return fullResponse;

  } catch (error) {

    // ==================================================
    // STOP GENERATION
    // ==================================================

    if (
      error?.name ===
      "AbortError"
    ) {

      console.log(
        "⏹️ AI generation stopped."
      );


      return "";

    }


    throw error;

  } finally {

    controller =
      null;

  }

}


// ======================================================
// STOP GENERATION
// ======================================================

export function stopGeneration() {

  if (controller) {

    controller.abort();

    controller =
      null;

  }

}