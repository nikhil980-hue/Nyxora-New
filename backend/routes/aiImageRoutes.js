import express from "express";

const router = express.Router();

const POLLINATIONS_BASE_URL = "https://gen.pollinations.ai";
const POLLINATIONS_IMAGE_URL = `${POLLINATIONS_BASE_URL}/image`;
const POLLINATIONS_EDIT_URL = `${POLLINATIONS_BASE_URL}/v1/images/edits`;
const POLLINATIONS_UPLOAD_URL = "https://media.pollinations.ai/upload";

// These remain the normal text-to-image fallback models.
const IMAGE_MODELS = [
  "flux",
  "zimage",
  "qwen-image",
  "seedream5",
  "nanobanana-2-lite",
];

// These models are used first when actual image references are supplied.
// Pollinations documents image-input support per model, so the route
// keeps reference-capable fallbacks separate from the normal text models.
const REFERENCE_IMAGE_MODELS = [
  "black-forest-labs/flux.2-klein-4b",
  "bytedance/seedream-4.0",
  "black-forest-labs/flux.1-kontext-pro",
];

const MAX_PROMPT_LENGTH = 12000;
const MAX_REFERENCE_IMAGES = 5;
const MAX_REFERENCE_DATA_LENGTH = 12 * 1024 * 1024;

const ALLOWED_REFERENCE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const ALLOWED_SIZES = new Set([
  "512x512",
  "768x768",
  "1024x1024",
  "1152x768",
  "768x1152",
  "1536x1024",
  "1024x1536",
]);

function normalizePrompt(prompt) {
  return String(prompt ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PROMPT_LENGTH);
}

function normalizeSize(size) {
  const value = String(size ?? "1024x1024").trim();
  return ALLOWED_SIZES.has(value) ? value : "1024x1024";
}

function getModels(requestedModel, hasReferences = false) {
  const model = String(requestedModel ?? "").trim();

  const fallbackModels = hasReferences
    ? REFERENCE_IMAGE_MODELS
    : IMAGE_MODELS;

  if (!model) {
    return fallbackModels;
  }

  return [
    model,
    ...fallbackModels.filter((item) => item !== model),
  ];
}

function parseDimensions(size) {
  const [width, height] = size.split("x").map(Number);

  return {
    width: Number.isFinite(width) ? width : 1024,
    height: Number.isFinite(height) ? height : 1024,
  };
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value));

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function normalizeReferenceImage(reference) {
  if (typeof reference === "string") {
    return {
      data: reference,
      mimeType: "",
      name: "reference-image",
    };
  }

  if (!reference || typeof reference !== "object") {
    return null;
  }

  const data =
    reference.data ??
    reference.image ??
    reference.url ??
    "";

  return {
    data: String(data),
    mimeType: String(
      reference.mimeType ??
      reference.type ??
      ""
    ).toLowerCase(),
    name:
      String(
        reference.name ??
        "reference-image"
      ).trim() ||
      "reference-image",
  };
}

function normalizeReferences(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .slice(0, MAX_REFERENCE_IMAGES)
    .map(normalizeReferenceImage)
    .filter(Boolean);
}

function extractDataUrl(data) {
  const value = String(data ?? "").trim();

  const match = value.match(
    /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i
  );

  if (!match) {
    return null;
  }

  const mimeType =
    String(match[1]).toLowerCase();

  if (
    !ALLOWED_REFERENCE_MIME_TYPES.has(
      mimeType
    )
  ) {
    return null;
  }

  const base64 = String(
    match[2] || ""
  ).replace(/\s+/g, "");

  if (!base64) {
    return null;
  }

  return {
    mimeType,
    base64,
  };
}

function decodeBase64Reference(reference) {
  const parsed =
    extractDataUrl(reference.data);

  if (!parsed) {
    throw new Error(
      `Invalid reference image "${reference.name}". Expected a PNG, JPEG, JPG, or WebP data URL.`
    );
  }

  if (
    parsed.base64.length >
    MAX_REFERENCE_DATA_LENGTH
  ) {
    throw new Error(
      `Reference image "${reference.name}" is too large.`
    );
  }

  const buffer =
    Buffer.from(
      parsed.base64,
      "base64"
    );

  if (!buffer.length) {
    throw new Error(
      `Reference image "${reference.name}" is empty.`
    );
  }

  return {
    buffer,
    mimeType:
      parsed.mimeType === "image/jpg"
        ? "image/jpeg"
        : parsed.mimeType,
    filename:
      reference.name ||
      "reference-image",
  };
}

async function uploadReferenceImage(
  reference,
  apiKey
) {
  const dataUrl =
    String(reference.data ?? "").trim();

  if (isHttpUrl(dataUrl)) {
    return dataUrl;
  }

  const decoded =
    decodeBase64Reference(
      reference
    );

  const form =
    new FormData();

  const blob =
    new Blob(
      [
        decoded.buffer,
      ],
      {
        type:
          decoded.mimeType,
      }
    );

  form.append(
    "file",
    blob,
    decoded.filename
  );

  const response =
    await fetch(
      POLLINATIONS_UPLOAD_URL,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
        },
        body: form,
      }
    );

  if (!response.ok) {
    let detail =
      `Pollinations media upload returned HTTP ${response.status}.`;

    try {
      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        const body =
          await response.json();

        const message =
          body?.error?.message ||
          body?.message ||
          body?.error;

        if (message) {
          detail +=
            ` ${String(message)}`;
        }
      } else {
        const text =
          await response.text();

        if (text) {
          detail +=
            ` ${text.slice(0, 500)}`;
        }
      }
    } catch {
      // Keep the HTTP error when the provider response is not parseable.
    }

    throw new Error(detail);
  }

  const linkHeader =
    response.headers.get("link") ||
    response.headers.get("Link") ||
    "";

  const linkMatch =
    linkHeader.match(
      /<([^>]+)>;\s*rel="?enclosure"?/i
    );

  if (linkMatch?.[1]) {
    return linkMatch[1];
  }

  let body = null;

  try {
    body =
      await response.json();
  } catch {
    // Some media responses may rely on the Link header.
  }

  const url =
    body?.url ||
    body?.image?.url ||
    body?.data?.url ||
    body?.data?.[0]?.url;

  if (
    url &&
    isHttpUrl(url)
  ) {
    return url;
  }

  throw new Error(
    "Pollinations uploaded the reference image but did not return a usable media URL."
  );
}

async function resolveReferenceUrls(
  references,
  apiKey
) {
  const urls = [];

  for (
    const reference of references
  ) {
    if (
      !reference?.data
    ) {
      continue;
    }

    const url =
      await uploadReferenceImage(
        reference,
        apiKey
      );

    if (isHttpUrl(url)) {
      urls.push(url);
    }
  }

  return urls;
}

function buildImageUrl({
  prompt,
  model,
  size,
  seed,
  enhance,
  referenceUrls = [],
}) {
  const encodedPrompt =
    encodeURIComponent(
      prompt
    );

  const url =
    new URL(
      `${POLLINATIONS_IMAGE_URL}/${encodedPrompt}`
    );

  const {
    width,
    height,
  } =
    parseDimensions(size);

  url.searchParams.set(
    "model",
    model
  );

  url.searchParams.set(
    "width",
    String(width)
  );

  url.searchParams.set(
    "height",
    String(height)
  );

  url.searchParams.set(
    "nologo",
    "true"
  );

  url.searchParams.set(
    "safe",
    "true"
  );

  if (
    enhance === true
  ) {
    url.searchParams.set(
      "enhance",
      "true"
    );
  }

  if (
    seed !== undefined &&
    seed !== null &&
    String(seed).trim() !== ""
  ) {
    url.searchParams.set(
      "seed",
      String(seed).trim()
    );
  }

  if (
    referenceUrls.length > 0
  ) {
    url.searchParams.set(
      "image",
      referenceUrls.join("|")
    );
  }

  return url;
}

async function readImageResponse(
  response
) {
  if (!response.ok) {
    let detail =
      `Pollinations returned HTTP ${response.status}.`;

    try {
      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        const body =
          await response.json();

        const message =
          body?.error?.message ||
          body?.message ||
          body?.error;

        if (message) {
          detail +=
            ` ${String(message)}`;
        }
      } else {
        const text =
          await response.text();

        if (text) {
          detail +=
            ` ${text.slice(0, 500)}`;
        }
      }
    } catch {
      // Keep the HTTP error when the provider response is not parseable.
    }

    throw new Error(detail);
  }

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    const body =
      await response.json();

    const data =
      body?.data?.[0] ||
      body?.data ||
      body;

    if (
      data?.url &&
      isHttpUrl(data.url)
    ) {
      return {
        image:
          data.url,
        imageUrl:
          data.url,
        contentType:
          data.media_type ||
          "image/jpeg",
      };
    }

    if (
      data?.b64_json
    ) {
      const mimeType =
        data.media_type ||
        "image/jpeg";

      return {
        image:
          `data:${mimeType};base64,${data.b64_json}`,
        imageUrl: "",
        contentType:
          mimeType,
      };
    }

    throw new Error(
      "Pollinations returned JSON without an image."
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  if (
    !arrayBuffer.byteLength
  ) {
    throw new Error(
      "Pollinations returned an empty image response."
    );
  }

  const mimeType =
    contentType ||
    "image/jpeg";

  const base64 =
    Buffer.from(
      arrayBuffer
    ).toString(
      "base64"
    );

  return {
    image:
      `data:${mimeType};base64,${base64}`,
    imageUrl: "",
    contentType:
      mimeType,
  };
}

async function generateWithPollinations({
  prompt,
  model,
  size,
  seed,
  enhance,
  referenceUrls = [],
}) {
  const apiKey =
    String(
      process.env.POLLINATIONS_API_KEY ??
      ""
    ).trim();

  if (!apiKey) {
    throw new Error(
      "POLLINATIONS_API_KEY is not configured. Add your Pollinations secret key to the backend .env file."
    );
  }

  const url =
    buildImageUrl({
      prompt,
      model,
      size,
      seed,
      enhance,
      referenceUrls,
    });

  const response =
    await fetch(
      url,
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          Accept:
            "image/*,application/json",
        },
      }
    );

  const result =
    await readImageResponse(
      response
    );

  return {
    provider:
      "pollinations",
    model,
    image:
      result.image,
    imageUrl:
      result.imageUrl,
  };
}

async function editWithPollinations({
  prompt,
  model,
  size,
  references,
}) {
  const apiKey =
    String(
      process.env.POLLINATIONS_API_KEY ??
      ""
    ).trim();

  if (!apiKey) {
    throw new Error(
      "POLLINATIONS_API_KEY is not configured. Add your Pollinations secret key to the backend .env file."
    );
  }

  const referenceUrls =
    await resolveReferenceUrls(
      references,
      apiKey
    );

  if (
    referenceUrls.length === 0
  ) {
    throw new Error(
      "At least one usable reference image is required for image editing."
    );
  }

  const response =
    await fetch(
      POLLINATIONS_EDIT_URL,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
          Accept:
            "application/json",
        },
        body: JSON.stringify({
          prompt,
          model,
          size,
          image:
            referenceUrls.length === 1
              ? referenceUrls[0]
              : referenceUrls,
          n: 1,
          response_format:
            "url",
          safe: true,
        }),
      }
    );

  const result =
    await readImageResponse(
      response
    );

  return {
    provider:
      "pollinations",
    model,
    image:
      result.image,
    imageUrl:
      result.imageUrl,
    referenceUrls,
  };
}

async function generateImage({
  prompt,
  model,
  size,
  seed,
  enhance,
  references = [],
  edit = false,
}) {
  const apiKey =
    String(
      process.env.POLLINATIONS_API_KEY ??
      ""
    ).trim();

  if (!apiKey) {
    throw new Error(
      "POLLINATIONS_API_KEY is not configured. Add your Pollinations secret key to the backend .env file."
    );
  }

  const hasReferences =
    references.length > 0;

  const models =
    getModels(
      model,
      hasReferences
    );

  let lastError =
    null;

  let referenceUrls =
    [];

  if (
    hasReferences &&
    !edit
  ) {
    referenceUrls =
      await resolveReferenceUrls(
        references,
        apiKey
      );
  }

  for (
    const currentModel of models
  ) {
    try {
      console.log(
        "[Nyxora AI Image] Trying model:",
        currentModel,
        hasReferences
          ? "(with references)"
          : ""
      );

      let result;

      if (
        edit &&
        hasReferences
      ) {
        result =
          await editWithPollinations({
            prompt,
            model:
              currentModel,
            size,
            references,
          });
      } else {
        result =
          await generateWithPollinations({
            prompt,
            model:
              currentModel,
            size,
            seed,
            enhance,
            referenceUrls,
          });
      }

      console.log(
        "[Nyxora AI Image] Generation successful with:",
        currentModel
      );

      return {
        ...result,
        referenceUrls:
          result.referenceUrls ||
          referenceUrls,
      };
    } catch (error) {
      lastError =
        error;

      console.warn(
        `[Nyxora AI Image] ${currentModel} failed:`,
        error?.message ||
          error
      );
    }
  }

  throw (
    lastError ||
    new Error(
      "All configured image models failed."
    )
  );
}

// POST /api/ai-image
router.post(
  "/",
  async (req, res) => {
    try {
      const prompt =
        normalizePrompt(
          req.body?.prompt
        );

      const size =
        normalizeSize(
          req.body?.size
        );

      const model =
        String(
          req.body?.model ??
          ""
        ).trim() ||
        undefined;

      const enhance =
        req.body?.enhance ===
        true;

      const seed =
        req.body?.seed;

      const edit =
        req.body?.edit ===
        true;

      const references =
        normalizeReferences(
          req.body?.references ??
          req.body?.referenceImages ??
          []
        );

      if (!prompt) {
        return res.status(400).json({
          success: false,
          message:
            "Image prompt required.",
        });
      }

      if (
        references.length >
        MAX_REFERENCE_IMAGES
      ) {
        return res.status(400).json({
          success: false,
          message:
            `A maximum of ${MAX_REFERENCE_IMAGES} reference images is supported.`,
        });
      }

      if (
        edit &&
        references.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Editing requires at least one reference image.",
        });
      }

      const result =
        await generateImage({
          prompt,
          model,
          size,
          seed,
          enhance,
          references,
          edit,
        });

      return res.json({
        success: true,
        provider:
          result.provider,
        model:
          result.model,
        image:
          result.image,
        imageUrl:
          result.imageUrl ||
          "",
        prompt,
        size,
        edit,
        hasReferences:
          references.length > 0,
      });
    } catch (error) {
      console.error(
        "[Nyxora AI Image] Generation failed:",
        error?.message ||
          error
      );

      const message =
        String(
          error?.message ||
          "Image generation failed."
        );

      const status =
        message.includes(
          "POLLINATIONS_API_KEY"
        )
          ? 500
          : 502;

      return res.status(status).json({
        success: false,
        message,
      });
    }
  }
);

export default router;
