import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

/**
 * Nyxora AI - Universal Document Intelligence
 *
 * Normalizes uploaded files and extracts structure/text before AI reasoning.
 * Visual documents remain available for multimodal models; textual documents
 * can be routed through the normal dynamic cloud gateway.
 *
 * Optional backend dependencies:
 *   mammoth - DOCX extraction
 *   xlsx    - XLS/XLSX extraction
 *   jszip   - PPTX/ODT/ODS/ODP container extraction
 *   pdf-parse - PDF text extraction
 *
 * If an optional parser is unavailable, the service returns a precise
 * capability status instead of fabricating document content.
 */

const MAX_FILE_BYTES = Math.max(
  256 * 1024,
  Number(process.env.NYXORA_DOCUMENT_MAX_BYTES || 25 * 1024 * 1024)
);

const MAX_TEXT_CHARS = Math.max(
  4000,
  Number(process.env.NYXORA_DOCUMENT_MAX_TEXT_CHARS || 50000)
);

const MAX_SHEET_ROWS = Math.max(
  20,
  Number(process.env.NYXORA_DOCUMENT_MAX_SHEET_ROWS || 300)
);

const MAX_SHEET_COLUMNS = Math.max(
  10,
  Number(process.env.NYXORA_DOCUMENT_MAX_SHEET_COLUMNS || 80)
);

const MAX_SLIDES = Math.max(
  5,
  Number(process.env.NYXORA_DOCUMENT_MAX_SLIDES || 150)
);

const execFileAsync = promisify(execFile);

const MAX_PDF_VISUAL_PAGES = Math.max(
  1,
  Math.min(10, Number(process.env.NYXORA_DOCUMENT_MAX_PDF_VISUAL_PAGES || 8))
);

const PDF_RENDER_DPI = Math.max(
  72,
  Math.min(180, Number(process.env.NYXORA_DOCUMENT_PDF_RENDER_DPI || 120))
);

const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/tab-separated-values",
  "text/html",
  "text/xml",
  "application/xml",
  "application/json",
  "application/javascript",
  "text/javascript",
  "application/typescript",
  "text/css",
  "text/sql",
  "application/x-yaml",
  "text/yaml",
]);

const CODE_EXTENSIONS = new Set([
  "js", "jsx", "ts", "tsx", "mjs", "cjs",
  "py", "java", "c", "cc", "cpp", "h", "hpp",
  "cs", "go", "rs", "php", "rb", "swift",
  "kt", "kts", "dart", "sql", "sh", "bash",
  "zsh", "ps1", "css", "scss", "html", "htm",
  "xml", "json", "yaml", "yml", "toml", "ini",
  "conf", "env", "log", "md", "txt",
]);

const VISUAL_MIME_PREFIXES = ["image/", "video/", "audio/"];

const MIME_BY_EXTENSION = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
  rtf: "application/rtf",
  md: "text/markdown",
  txt: "text/plain",
  html: "text/html",
  htm: "text/html",
  xml: "application/xml",
  json: "application/json",
  yaml: "application/x-yaml",
  yml: "application/x-yaml",
};

function clean(value, max = 5000) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function getExtension(name = "") {
  const value = String(name || "").trim().toLowerCase();
  const match = value.match(/\.([a-z0-9]+)$/i);
  return match ? match[1] : "";
}

function normalizeData(data) {
  const value = String(data || "").trim();
  const match = value.match(/^data:([^;,]+)?(?:;[^,]*)?,(.*)$/s);
  if (match) {
    return {
      mimeType: String(match[1] || "").trim().toLowerCase(),
      base64: match[2] || "",
    };
  }
  return { mimeType: "", base64: value };
}

function decodeBase64(data) {
  const normalized = normalizeData(data);
  const raw = normalized.base64.replace(/\s+/g, "");
  if (!raw || !/^[A-Za-z0-9+/=_-]+$/.test(raw)) {
    throw new Error("Attachment data is not valid base64.");
  }

  const buffer = Buffer.from(
    raw.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  );

  if (!buffer.length) {
    throw new Error("Attachment decoded to an empty file.");
  }

  if (buffer.length > MAX_FILE_BYTES) {
    throw new Error(
      `Attachment exceeds the ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB document limit.`
    );
  }

  return {
    buffer,
    dataMimeType: normalized.mimeType,
  };
}

function isVisualMime(mimeType = "") {
  const value = String(mimeType || "").toLowerCase();
  return VISUAL_MIME_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function normalizeAttachment(attachment) {
  if (!attachment || typeof attachment !== "object") return null;

  const name = clean(attachment.name || "Attachment", 240);
  const rawMime = clean(attachment.mimeType || "", 180).toLowerCase();
  const extension = getExtension(name);
  const mimeType = rawMime || MIME_BY_EXTENSION[extension] || "";

  if (!attachment.data || !mimeType) return null;

  return {
    name,
    mimeType,
    extension,
    data: String(attachment.data).trim(),
  };
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && char === delimiter) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.some((value) => String(value).trim() !== "")) rows.push(row);
      row = [];
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => String(value).trim() !== "")) rows.push(row);

  return rows;
}

function rowsToMarkdown(rows, maxRows = MAX_SHEET_ROWS) {
  const limited = rows
    .slice(0, maxRows)
    .map((row) =>
      row
        .slice(0, MAX_SHEET_COLUMNS)
        .map((value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " "))
    );

  if (!limited.length) return "";

  const width = Math.max(...limited.map((row) => row.length));
  const normalized = limited.map((row) => [
    ...row,
    ...Array(Math.max(0, width - row.length)).fill(""),
  ]);

  const header = normalized[0];
  const separator = Array(width).fill("---");

  return [
    `| ${header.join(" | ")} |`,
    `| ${separator.join(" | ")} |`,
    ...normalized.slice(1).map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

async function optionalImport(packageName) {
  try {
    return await import(packageName);
  } catch {
    return null;
  }
}

async function parseDocx(buffer) {
  const mod = await optionalImport("mammoth");
  if (!mod) {
    return {
      available: false,
      error: "DOCX parser 'mammoth' is not installed.",
    };
  }

  const mammoth = mod.default || mod;
  const result = await mammoth.extractRawText({ buffer });
  return {
    available: true,
    text: clean(result?.value || "", MAX_TEXT_CHARS),
    messages: Array.isArray(result?.messages)
      ? result.messages.slice(0, 20)
      : [],
    visualAttachments: await extractEmbeddedVisualAttachments(buffer, "docx"),
  };
}

async function parseSpreadsheet(buffer, extension) {
  const mod = await optionalImport("xlsx");
  if (!mod) {
    return {
      available: false,
      error: "Spreadsheet parser 'xlsx' is not installed.",
    };
  }

  const XLSX = mod.default || mod;
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellFormula: true,
    cellText: true,
  });

  const sheets = [];
  let combined = "";

  for (const sheetName of workbook.SheetNames || []) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });

    const markdown = rowsToMarkdown(rows);
    const range = sheet["!ref"] || "";
    const block = [
      `SHEET: ${sheetName}`,
      `RANGE: ${range}`,
      markdown || "(empty sheet)",
    ].join("\n");

    sheets.push({
      name: sheetName,
      range,
      rows: Math.min(rows.length, MAX_SHEET_ROWS),
      columns: rows.reduce((max, row) => Math.max(max, row.length), 0),
      markdown: clean(markdown, 30000),
    });

    combined += `${block}\n\n`;
  }

  return {
    available: true,
    format: extension || "spreadsheet",
    sheets,
    text: clean(combined, MAX_TEXT_CHARS),
    visualAttachments: await extractEmbeddedVisualAttachments(buffer, extension),
  };
}

function decodeXmlEntities(value) {
  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return "";
      }
    })
    .replace(/&#(\d+);/g, (_, num) => {
      try {
        return String.fromCodePoint(Number(num));
      } catch {
        return "";
      }
    })
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractXmlText(xml) {
  return decodeXmlEntities(
    String(xml || "")
      .replace(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi, " $1 ")
      .replace(/<text:p[^>]*>([\s\S]*?)<\/text:p>/gi, " $1 ")
      .replace(/<text:h[^>]*>([\s\S]*?)<\/text:h>/gi, " $1 ")
      .replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi, " $1 ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

async function parseZipXmlDocument(buffer, extension) {
  const mod = await optionalImport("jszip");
  if (!mod) {
    return {
      available: false,
      error: "ZIP/XML document parser 'jszip' is not installed.",
    };
  }

  const JSZip = mod.default || mod;
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files || {});
  const relevant = names.filter((name) =>
    /\.(xml|rels)$/i.test(name)
  );

  let combined = "";
  const sections = [];

  for (const name of relevant.slice(0, 500)) {
    const entry = zip.files[name];
    if (!entry || entry.dir) continue;

    const xml = await entry.async("string");
    const text = extractXmlText(xml);

    if (!text) continue;

    const block = `FILE: ${name}\n${text}`;
    sections.push({ name, text: clean(text, 10000) });
    combined += `${block}\n\n`;

    if (combined.length >= MAX_TEXT_CHARS) break;
  }

  return {
    available: true,
    format: extension,
    entries: names.slice(0, 500),
    sections,
    text: clean(combined, MAX_TEXT_CHARS),
  };
}

async function extractEmbeddedVisualAttachments(buffer, extension) {
  const mod = await optionalImport("jszip");
  if (!mod) return [];

  const JSZip = mod.default || mod;
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files || {});

  const prefixesByFormat = {
    pptx: ["ppt/media/"],
    docx: ["word/media/"],
    xlsx: ["xl/media/"],
    xls: ["xl/media/"],
    odt: ["Pictures/", "pictures/", "Thumbnails/"],
    ods: ["Pictures/", "pictures/", "Thumbnails/"],
    odp: ["Pictures/", "pictures/", "Thumbnails/"],
  };

  const prefixes = prefixesByFormat[extension] || [
    "Pictures/",
    "pictures/",
    "Thumbnails/",
  ];

  const mimeByExtension = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    bmp: "image/bmp",
    tif: "image/tiff",
    tiff: "image/tiff",
  };

  const maxImages = Math.max(
    1,
    Math.min(10, Number(process.env.NYXORA_DOCUMENT_MAX_EMBEDDED_IMAGES || 8))
  );
  const maxImageBytes = Math.max(
    64 * 1024,
    Number(process.env.NYXORA_DOCUMENT_MAX_EMBEDDED_IMAGE_BYTES || 4 * 1024 * 1024)
  );

  const output = [];

  for (const name of names) {
    if (output.length >= maxImages) break;
    if (!prefixes.some((prefix) => name.startsWith(prefix))) continue;

    const extensionName = getExtension(name);
    const mimeType = mimeByExtension[extensionName];
    const entry = zip.files[name];
    if (!entry || entry.dir || !mimeType) continue;

    const bufferValue = await entry.async("nodebuffer");
    if (!bufferValue.length || bufferValue.length > maxImageBytes) continue;

    output.push({
      name: `${extension.toUpperCase()} embedded visual: ${path.basename(name)}`,
      mimeType,
      data: bufferValue.toString("base64"),
      source: name,
    });
  }

  return output;
}

async function parsePptx(buffer) {
  const result = await parseZipXmlDocument(buffer, "pptx");
  if (!result.available) return result;

  const slides = result.sections
    .filter((section) => /^ppt\/slides\/slide\d+\.xml$/i.test(section.name))
    .sort((a, b) => {
      const ai = Number(a.name.match(/slide(\d+)/i)?.[1] || 0);
      const bi = Number(b.name.match(/slide(\d+)/i)?.[1] || 0);
      return ai - bi;
    })
    .slice(0, MAX_SLIDES)
    .map((section, index) => ({
      slide: index + 1,
      name: section.name,
      text: section.text,
    }));

  return {
    ...result,
    slides,
    visualAttachments: await extractEmbeddedVisualAttachments(buffer, "pptx"),
    text: clean(
      slides.map((slide) => `SLIDE ${slide.slide}\n${slide.text}`).join("\n\n"),
      MAX_TEXT_CHARS
    ),
  };
}

async function runPdfCommand(command, args, options = {}) {
  try {
    const result = await execFileAsync(command, args, {
      windowsHide: true,
      maxBuffer: Math.max(2 * 1024 * 1024, MAX_TEXT_CHARS * 4),
      ...options,
    });

    return {
      available: true,
      stdout: String(result?.stdout || ""),
      stderr: String(result?.stderr || ""),
    };
  } catch (error) {
    return {
      available: false,
      error,
    };
  }
}

async function extractPdfTextWithCli(buffer) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "nyxora-pdf-"));
  const inputPath = path.join(tempDir, "document.pdf");

  try {
    await fs.writeFile(inputPath, buffer);
    const result = await runPdfCommand("pdftotext", ["-layout", inputPath, "-"]);

    if (!result.available) return null;

    return clean(result.stdout, MAX_TEXT_CHARS);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function getPdfPageCountWithCli(inputPath) {
  const result = await runPdfCommand("pdfinfo", [inputPath]);
  if (!result.available) return 0;

  const match = result.stdout.match(/(?:^|\n)Pages:\s*(\d+)/i);
  return match ? Number(match[1]) || 0 : 0;
}

async function renderPdfVisualsWithCli(buffer) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "nyxora-pdf-render-"));
  const inputPath = path.join(tempDir, "document.pdf");
  const outputPrefix = path.join(tempDir, "page");

  try {
    await fs.writeFile(inputPath, buffer);

    const pageCount = await getPdfPageCountWithCli(inputPath);
    const endPage = Math.min(
      MAX_PDF_VISUAL_PAGES,
      Math.max(1, pageCount || MAX_PDF_VISUAL_PAGES)
    );

    const render = await runPdfCommand("pdftoppm", [
      "-png",
      "-r",
      String(PDF_RENDER_DPI),
      "-f",
      "1",
      "-l",
      String(endPage),
      inputPath,
      outputPrefix,
    ]);

    if (!render.available) return [];

    const files = (await fs.readdir(tempDir))
      .filter((name) => /^page-\d+\.png$/i.test(name))
      .sort((a, b) => {
        const ai = Number(a.match(/(\d+)/)?.[1] || 0);
        const bi = Number(b.match(/(\d+)/)?.[1] || 0);
        return ai - bi;
      })
      .slice(0, MAX_PDF_VISUAL_PAGES);

    const output = [];

    for (const fileName of files) {
      const fileBuffer = await fs.readFile(path.join(tempDir, fileName));
      if (!fileBuffer.length) continue;

      output.push({
        name: `PDF page visual: ${fileName}`,
        mimeType: "image/png",
        data: fileBuffer.toString("base64"),
        source: fileName,
      });
    }

    return output;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function normalizePdfParseResult(result = {}) {
  const rawText = String(result?.text || "");
  const rawPages = Array.isArray(result?.pages) ? result.pages : [];

  const pages = rawPages.length
    ? rawPages
        .map((page, index) => ({
          page: Number(page?.pageNumber || page?.page || index + 1),
          text: clean(page?.text || page?.content || "", 12000),
        }))
        .filter((page) => page.text)
    : rawText
        .split(/\f/g)
        .map((page) => clean(page, 12000))
        .filter(Boolean)
        .map((page, index) => ({
          page: index + 1,
          text: page,
        }));

  const text = clean(
    pages.length
      ? pages.map((page) => `PAGE ${page.page}\n${page.text}`).join("\n\n")
      : rawText,
    MAX_TEXT_CHARS
  );

  return {
    available: true,
    pages,
    pageCount: Number(
      result?.numpages ||
        result?.numPages ||
        result?.totalPages ||
        pages.length ||
        0
    ),
    text,
  };
}

async function parsePdf(buffer) {
  const mod = await optionalImport("pdf-parse");

  let text = "";
  let pages = [];
  let parser = "";
  let pageCount = 0;

  if (mod) {
    // pdf-parse legacy: module/default is directly callable.
    const legacyCandidates = [mod, mod.default].filter(
      (candidate) => typeof candidate === "function"
    );

    for (const parserCandidate of legacyCandidates) {
      try {
        const result = await parserCandidate(buffer);
        if (result && typeof result === "object") {
          const normalized = await normalizePdfParseResult(result);
          if (normalized.text) {
            text = normalized.text;
            pages = normalized.pages || [];
            pageCount = normalized.pageCount || pages.length;
            parser = "pdf-parse";
            break;
          }
        }
      } catch (error) {
        console.warn(
          `[Nyxora Documents] pdf-parse legacy API failed -> ${error?.message || error}`
        );
      }
    }

    // pdf-parse newer releases expose PDFParse as a class.
    if (!text) {
      const PDFParse =
        mod.PDFParse ||
        mod.default?.PDFParse ||
        mod.default?.default?.PDFParse;

      if (typeof PDFParse === "function") {
        try {
          const parserInstance = new PDFParse({ data: buffer });
          try {
            const result = await parserInstance.getText();
            const normalized = await normalizePdfParseResult(result || {});

            if (normalized.text) {
              text = normalized.text;
              pages = normalized.pages || [];
              pageCount = normalized.pageCount || pages.length;
              parser = "pdf-parse";
            }
          } finally {
            if (typeof parserInstance.destroy === "function") {
              await parserInstance.destroy();
            }
          }
        } catch (error) {
          console.warn(
            `[Nyxora Documents] pdf-parse class API failed -> ${error?.message || error}`
          );
        }
      }
    }
  }

  // Optional system fallback. This is useful when pdf-parse is missing or
  // when a PDF uses features unsupported by the installed npm parser.
  if (!text) {
    const cliText = await extractPdfTextWithCli(buffer);

    if (cliText) {
      text = cliText;
      pages = cliText
        .split(/\f/g)
        .map((page) => clean(page, 12000))
        .filter(Boolean)
        .map((page, index) => ({ page: index + 1, text: page }));
      pageCount = pages.length;
      parser = "pdftotext";
    }
  }

  // IMPORTANT:
  // Render PDF pages even when text extraction succeeds. A PDF can contain
  // photographs, scans, handwriting, diagrams, tables, or other visual
  // information that a text parser cannot represent. These rendered pages
  // are passed to the multimodal document model pool so Gemini is not required
  // for ordinary PDF visual understanding.
  const visualAttachments = await renderPdfVisualsWithCli(buffer);

  if (visualAttachments.length) {
    parser = parser || "pdftoppm";
  }

  const hasText = Boolean(text);
  const hasVisuals = visualAttachments.length > 0;

  return {
    available: hasText || hasVisuals,
    parser: parser || (hasVisuals ? "pdftoppm" : "multimodal"),
    pages,
    pageCount,
    text,
    visualAttachments,
    error:
      !hasText && hasVisuals
        ? "PDF has no usable text layer; rendered pages are available for multimodal inspection."
        : !hasText && !hasVisuals
          ? "No PDF text parser or PDF renderer is available. Install pdf-parse or Poppler (pdftotext/pdftoppm) for non-Gemini document routing."
          : "",
  };
}


async function parseText(buffer, attachment) {
  let text = buffer.toString("utf8");

  if (attachment.mimeType === "text/html") {
    text = stripHtml(text);
  }

  if (
    attachment.mimeType === "application/json" ||
    attachment.extension === "json"
  ) {
    try {
      text = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      // Keep original text and let the model report malformed JSON if asked.
    }
  }

  if (
    attachment.mimeType === "text/csv" ||
    attachment.extension === "csv"
  ) {
    const rows = parseDelimited(text, ",");
    return {
      text: clean(rowsToMarkdown(rows), MAX_TEXT_CHARS),
      table: {
        rows: rows.length,
        columns: rows.reduce((max, row) => Math.max(max, row.length), 0),
      },
    };
  }

  if (
    attachment.mimeType === "text/tab-separated-values" ||
    attachment.extension === "tsv"
  ) {
    const rows = parseDelimited(text, "\t");
    return {
      text: clean(rowsToMarkdown(rows), MAX_TEXT_CHARS),
      table: {
        rows: rows.length,
        columns: rows.reduce((max, row) => Math.max(max, row.length), 0),
      },
    };
  }

  return { text: clean(text, MAX_TEXT_CHARS) };
}

async function analyzeAttachment(attachment) {
  const normalized = normalizeAttachment(attachment);
  if (!normalized) {
    return {
      success: false,
      error: "Invalid attachment: name, MIME type, and data are required.",
    };
  }

  try {
    const { buffer, dataMimeType } = decodeBase64(normalized.data);
    const mimeType =
      normalized.mimeType || dataMimeType || MIME_BY_EXTENSION[normalized.extension] || "";

    const result = {
      name: normalized.name,
      mimeType,
      extension: normalized.extension,
      sizeBytes: buffer.length,
      visual: isVisualMime(mimeType),
      parser: "native",
      extracted: false,
      text: "",
      sections: [],
      tables: [],
      visualAttachments: [],
      metadata: {},
      warnings: [],
    };

    if (result.visual) {
      result.parser = "multimodal";
      result.extracted = false;
      result.warnings.push("Visual media should be inspected by a multimodal model.");
      return { success: true, document: result };
    }

    if (mimeType === "application/pdf" || normalized.extension === "pdf") {
      const parsed = await parsePdf(buffer);

      result.parser = parsed.parser || "multimodal";
      result.extracted = Boolean(parsed.text);
      result.text = parsed.text || "";
      result.metadata.pageCount = parsed.pageCount || 0;
      result.sections = parsed.pages || [];
      result.visualAttachments = parsed.visualAttachments || [];

      if (result.visualAttachments.length) {
        result.visual = true;
        result.metadata.renderedVisualCount = result.visualAttachments.length;
        result.warnings.push(
          "PDF pages were rendered as images so non-Gemini multimodal models can inspect visual content."
        );
      }

      if (parsed.error) {
        result.warnings.push(parsed.error);
      }

      if (result.extracted) {
        result.warnings.push(
          "PDF text was extracted locally; visual-only/scanned content still requires multimodal inspection."
        );
      }

      return { success: true, document: result };
    }

    if (
      mimeType.includes("wordprocessingml.document") ||
      normalized.extension === "docx"
    ) {
      const parsed = await parseDocx(buffer);
      if (!parsed.available) {
        result.warnings.push(parsed.error);
        return { success: true, document: result };
      }

      result.parser = "mammoth";
      result.extracted = Boolean(parsed.text);
      result.text = parsed.text;
      result.metadata.parserMessages = parsed.messages;
      result.visualAttachments = parsed.visualAttachments || [];
      result.metadata.embeddedVisualCount = result.visualAttachments.length;
      if (result.visualAttachments.length) {
        result.visual = true;
        result.warnings.push(
          "DOCX text is extracted; embedded images/charts are preserved for multimodal inspection."
        );
      }
      return { success: true, document: result };
    }

    if (
      normalized.extension === "xlsx" ||
      normalized.extension === "xls" ||
      mimeType.includes("spreadsheetml") ||
      mimeType === "application/vnd.ms-excel"
    ) {
      const parsed = await parseSpreadsheet(buffer, normalized.extension);
      if (!parsed.available) {
        result.warnings.push(parsed.error);
        return { success: true, document: result };
      }

      result.parser = "xlsx";
      result.extracted = Boolean(parsed.text);
      result.text = parsed.text;
      result.metadata.sheets = parsed.sheets;
      result.tables = parsed.sheets;
      result.visualAttachments = parsed.visualAttachments || [];
      result.metadata.embeddedVisualCount = result.visualAttachments.length;
      if (result.visualAttachments.length) {
        result.visual = true;
        result.warnings.push(
          "Spreadsheet cell data is extracted; embedded charts/images are preserved for multimodal inspection."
        );
      }
      return { success: true, document: result };
    }

    if (
      normalized.extension === "pptx" ||
      mimeType.includes("presentationml")
    ) {
      const parsed = await parsePptx(buffer);
      if (!parsed.available) {
        result.warnings.push(parsed.error);
        return { success: true, document: result };
      }

      result.parser = "jszip+xml";
      result.extracted = Boolean(parsed.text);
      result.text = parsed.text;
      result.sections = parsed.slides;
      result.metadata.slideCount = parsed.slides.length;
      result.visualAttachments = parsed.visualAttachments || [];
      result.metadata.embeddedVisualCount = result.visualAttachments.length;
      result.visual = true;
      result.warnings.push(
        "Slide text is extracted; charts, images, SmartArt, and visual layout should still be inspected by a multimodal model."
      );
      return { success: true, document: result };
    }

    if (
      ["odt", "ods", "odp"].includes(normalized.extension) ||
      mimeType.includes("opendocument")
    ) {
      const parsed = await parseZipXmlDocument(buffer, normalized.extension);
      if (!parsed.available) {
        result.warnings.push(parsed.error);
        return { success: true, document: result };
      }

      result.parser = "jszip+xml";
      result.extracted = Boolean(parsed.text);
      result.text = parsed.text;
      result.sections = parsed.sections;
      if (normalized.extension === "odp") {
        result.visualAttachments = await extractEmbeddedVisualAttachments(
          buffer,
          "odp"
        );
        result.metadata.embeddedVisualCount = result.visualAttachments.length;
      }
      result.visual = normalized.extension === "odp";
      return { success: true, document: result };
    }

    if (
      TEXT_MIME_TYPES.has(mimeType) ||
      CODE_EXTENSIONS.has(normalized.extension) ||
      ["rtf", "ini", "conf", "log", "env"].includes(normalized.extension)
    ) {
      const parsed = await parseText(buffer, normalized);
      result.parser = "utf8";
      result.extracted = Boolean(parsed.text);
      result.text = parsed.text;
      if (parsed.table) result.tables.push(parsed.table);
      return { success: true, document: result };
    }

    if (
      normalized.extension === "doc" ||
      normalized.extension === "ppt"
    ) {
      result.warnings.push(
        `Legacy .${normalized.extension} binary format needs a dedicated office parser; it was not decoded to avoid fabricating content.`
      );
      return { success: true, document: result };
    }

    if (normalized.extension === "zip") {
      const parsed = await parseZipXmlDocument(buffer, "zip");
      if (!parsed.available) {
        result.warnings.push(parsed.error);
        return { success: true, document: result };
      }
      result.parser = "jszip";
      result.metadata.entries = parsed.entries;
      result.text = clean(
        parsed.sections
          .map((section) => `${section.name}\n${section.text}`)
          .join("\n\n"),
        MAX_TEXT_CHARS
      );
      result.extracted = Boolean(result.text);
      return { success: true, document: result };
    }

    result.warnings.push(
      `No safe native parser is registered for MIME type ${mimeType || "unknown"} / extension .${normalized.extension || "unknown"}.`
    );
    return { success: true, document: result };
  } catch (error) {
    return {
      success: false,
      name: normalized.name,
      error: clean(error?.message || error, 3000),
    };
  }
}

function buildDocumentContext(documents) {
  const usable = documents
    .filter((entry) => entry?.success && entry.document)
    .map((entry) => entry.document);

  if (!usable.length) return "";

  const blocks = usable.map((doc) => {
    const header = [
      `DOCUMENT: ${doc.name}`,
      `TYPE: ${doc.mimeType || "unknown"}${doc.extension ? ` (.${doc.extension})` : ""}`,
      `PARSER: ${doc.parser}`,
      `SIZE_BYTES: ${doc.sizeBytes}`,
      doc.metadata?.pageCount ? `PAGES: ${doc.metadata.pageCount}` : "",
      doc.metadata?.slideCount ? `SLIDES: ${doc.metadata.slideCount}` : "",
      doc.metadata?.embeddedVisualCount
        ? `EMBEDDED_VISUALS: ${doc.metadata.embeddedVisualCount}`
        : "",
      doc.warnings?.length
        ? `NOTES:\n- ${doc.warnings.join("\n- ")}`
        : "",
    ].filter(Boolean).join("\n");

    const body = doc.text
      ? `EXTRACTED CONTENT:\n${doc.text}`
      : "EXTRACTED CONTENT: [none; use the visual attachment path when available]";

    return `${header}\n\n${body}`;
  });

  return clean(
    [
      "NYXORA UNIVERSAL DOCUMENT CONTEXT",
      "Use this extracted content as evidence about the uploaded documents.",
      "Do not invent missing pages, cells, slides, images, charts, or text.",
      "",
      blocks.join("\n\n====================\n\n"),
    ].join("\n"),
    MAX_TEXT_CHARS + 12000
  );
}

export async function analyzeNyxoraDocuments(attachments = []) {
  const safe = Array.isArray(attachments)
    ? attachments.map(normalizeAttachment).filter(Boolean)
    : [];

  const documents = await Promise.all(
    safe.map((attachment) => analyzeAttachment(attachment))
  );

  const context = buildDocumentContext(documents);
  const visualAttachments = documents
    .filter((entry) => entry?.success && entry?.document)
    .flatMap((entry) => entry.document.visualAttachments || [])
    .slice(0, 10);

  return {
    success: documents.every((entry) => entry.success),
    documents,
    context,
    visualAttachments,
    hasVisual: documents.some(
      (entry) => entry?.document?.visual
    ),
    hasExtractedText: documents.some(
      (entry) => Boolean(entry?.document?.text)
    ),
    count: documents.length,
  };
}

export async function executeNyxoraDocumentUnderstanding(
  attachments = [],
  options = {}
) {
  const result = await analyzeNyxoraDocuments(attachments);

  if (options.log !== false) {
    console.log(
      `[Nyxora Documents] ANALYZE -> files=${result.count} | extracted=${result.hasExtractedText} | visual=${result.hasVisual}`
    );
  }

  return result;
}

export function getNyxoraDocumentSupport() {
  return {
    maxFileBytes: MAX_FILE_BYTES,
    maxTextChars: MAX_TEXT_CHARS,
    formats: {
      text: [...TEXT_MIME_TYPES],
      code: [...CODE_EXTENSIONS],
      office: ["docx", "xlsx", "xls", "pptx"],
      openDocument: ["odt", "ods", "odp"],
      pdf: ["pdf"],
      visual: ["image/*", "video/*", "audio/*"],
      archives: ["zip"],
    },
    optionalParsers: {
      docx: "mammoth",
      spreadsheet: "xlsx",
      pptxOpenDocument: "jszip",
      pdf: "pdf-parse",
    },
  };
}
