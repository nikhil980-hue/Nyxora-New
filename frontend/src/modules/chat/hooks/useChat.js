import {
  useRef,
  useState,
} from "react";

import {
  auth,
} from "../../../firebase/firebase";

import {
  getMemory,
} from "../../../services/memoryService";

import {
  saveMessages,
  updateChatTitle,
} from "../services/chatHistoryService";

import {
  stopGeneration,
} from "../services/geminiService";

import {
  streamResponse,
} from "./useStreaming";

import {
  extractPdfText,
  PDF_ERROR_CODES,
} from "../utils/extractPdfText";

import {
  extractDocxText,
} from "../utils/extractDocxText";

import {
  buildPdfInstruction,
  hasGeneratePdfCommand,
  isPdfRequest,
} from "../utils/pdfIntent";


// ======================================================
// CONFIG
// ======================================================

const MAX_CHAT_TITLE_LENGTH =
  40;

const MAX_WORKSPACE_DOCUMENTS =
  8;

const MAX_WORKSPACE_DOCUMENT_CONTENT =
  2500;

const MAX_WORKSPACE_RESULTS =
  20;


// ======================================================
// PDF GENERATOR MODE
// ======================================================

const PDF_GENERATOR_MODE =
  "pdf";


const PDF_GENERATOR_WARNING = `
## PDF Generator Mode

This mode is dedicated to creating PDF documents.

To generate a PDF, include **generate pdf** in your request.

Example:

**generate pdf notes on photosynthesis for Class 8**

You can also include details such as subject, chapter, class, marks, difficulty, language, or document type.
`.trim();

// ======================================================
// TEST GENERATOR MODE
// ======================================================

const TEST_GENERATOR_MODE =
  "test";

const TEST_GENERATOR_WARNING = `
## Test Generator Mode

⚠️ You're asking Nyxora to create a test/question paper.

Please switch to **Test Generator** mode first, then send your request again.

Test Generator mode is designed for:
- Question papers
- MCQ tests
- Chapter tests
- Unit tests
- Practice tests
- Class tests
- Examinations
- Mark-based question papers
`.trim();

// ======================================================
// ASSISTANT MODES
// ======================================================

const assistantModePrompts = {

  normal: `
You are Nyxora AI, a helpful general-purpose AI assistant.

Respond naturally and directly to the user's request.
Be clear, accurate, and useful.
Do not force an educational format unless the user asks for it.
`,

  pdf: `
You are Nyxora AI operating in dedicated PDF Generator mode.

Your only purpose in this mode is to create PDF-ready documents.

The user should describe the PDF they want.

If the user's message is a valid PDF generation request:
- generate the requested document
- produce complete, structured content
- follow the Nyxora PDF document formatting rules
- use Workspace context when relevant

If the user sends a normal conversational message that is not asking you to create or modify a PDF, do not answer it normally.

Instead respond exactly:

⚠️ PDF Generator mode only creates PDF documents. Include the words "generate PDF" in your request.

Example:
"Generate PDF notes for Class 8 Science on Photosynthesis."

Do not behave like the Normal Assistant in this mode.
`,

  teacher: `
You are Nyxora AI operating as a Teacher Assistant.

Your job is to help teachers with:
- lesson planning
- classroom explanations
- teaching strategies
- worksheets
- examples
- revision material
- student activities
- chapter planning

Give teacher-friendly, practical and well-structured responses.

Use available Workspace class or student context when relevant.

If important information is genuinely missing,
ask a concise clarification.
`,


test: `
You are Nyxora AI operating as a professional Test Generator.

Create a complete, academically correct, student-friendly test.

GENERAL TEST RULES:

- Mention the title.
- Mention class, subject and topic/chapter when known.
- Follow the requested total marks and time.
- Use appropriate difficulty.
- Use clear student-facing language.
- Keep question numbering continuous across all sections.
- Return normal plain text.
- Do not wrap the complete test in JSON.
- Do not put the complete test inside a code block.

==================================================
SECTION A — MULTIPLE CHOICE QUESTIONS
==================================================

MANDATORY:

- Section A MUST exist in every generated test.
- Section A MUST contain EXACTLY 4 MCQs.
- Every MCQ MUST carry EXACTLY 1 mark.
- Section A total MUST be exactly 4 marks.
- Every MCQ MUST have exactly 4 options.

MCQ OPTIONS MUST USE:

A. Option A
B. Option B
C. Option C
D. Option D

The four MCQs MUST appear before Section B.

Example:

SECTION A — MULTIPLE CHOICE QUESTIONS
4 × 1 = 4 MARKS

1. [1 Mark] Question text?
A. Option A
B. Option B
C. Option C
D. Option D

2. [1 Mark] Question text?
A. Option A
B. Option B
C. Option C
D. Option D

3. [1 Mark] Question text?
A. Option A
B. Option B
C. Option C
D. Option D

4. [1 Mark] Question text?
A. Option A
B. Option B
C. Option C
D. Option D

NEVER assign 2, 3, 4 or 5 marks to an MCQ.

==================================================
SECTION B — SHORT ANSWER QUESTIONS
==================================================

MANDATORY:

- Section B should be used after Section A.
- Every Section B question MUST carry EXACTLY 2 marks.
- Use short-answer, direct-answer, definition,
  formula, calculation or brief-explanation questions.

Example:

SECTION B — SHORT ANSWER QUESTIONS
3 × 2 = 6 MARKS

5. [2 Marks] Question text?

6. [2 Marks] Question text?

7. [2 Marks] Question text?

==================================================
SECTION C — LONG ANSWER QUESTIONS
==================================================

MANDATORY:

- Section C should be used after Section B.
- Every Section C question MUST carry EXACTLY 5 marks.
- Use detailed, multi-step, reasoning, proof,
  application or long-calculation questions.

Example:

SECTION C — LONG ANSWER QUESTIONS
2 × 5 = 10 MARKS

8. [5 Marks] Question text?

9. [5 Marks] Question text?

==================================================
ALL TOTAL MARKS
==================================================

The requested TOTAL MARKS can be ANY value.

Do NOT assume the test is always 20 marks.

Always calculate the section distribution from
the user's requested total.

Fixed values:

Section A:
4 MCQs × 1 mark = 4 marks.

Section B:
Each question = 2 marks.

Section C:
Each question = 5 marks.

The number of questions must change according to
the requested total, NOT the fixed mark value.

Examples:

10 MARKS:
Section A = 4
Section B = 6
Total = 10

20 MARKS:
Section A = 4
Section B = 6
Section C = 10
Total = 20

25 MARKS:
Section A = 4
Section B = 6
Section C = 15
Total = 25

30 MARKS:
Section A = 4
Section B = 6
Section C = 20
Total = 30

40 MARKS:
Section A = 4
Section B = 6
Section C = 30
Total = 40

50 MARKS:
Section A = 4
Section B = 6
Section C = 40
Total = 50

For ANY other total:

1. Keep Section A fixed at 4 marks.
2. Keep Section B questions fixed at 2 marks each.
3. Keep Section C questions fixed at 5 marks each.
4. Adjust the NUMBER of questions.
5. The final total MUST equal the requested total exactly.

NEVER change:
- MCQ value from 1 mark.
- Section B value from 2 marks.
- Section C value from 5 marks.

If an exact total cannot be represented using
Sections A, B and C alone, add another suitable
section rather than changing the fixed marks of A, B or C.

==================================================
QUESTION NUMBERING
==================================================

Number questions continuously across sections.

Section A:
1, 2, 3, 4

Section B:
5, 6, 7...

Section C:
8, 9...

Use:

1. Question text
2. Question text

Do NOT use:

Q1.
Q2.
Question 1:
1)
2)

The question number and question text MUST be on
the same line.

==================================================
ANSWER KEY
==================================================

If answers are requested:

- Put the Answer Key ONLY after all test questions.
- Use the same question numbers.
- Do not create new numbering for solution steps.

For MCQs:

SECTION A — ANSWERS

1. B
2. C
3. A
4. D

For subjective questions:

5. Answer:
   explanation...

Solution steps MUST NOT use:

1.
2.
3.

or:

1)
2)
3)

Use bullets, dashes, equations or plain paragraphs instead.

==================================================
FINAL TEST VALIDATION
==================================================

Before returning the test, verify:

- The user's TOTAL MARKS was identified correctly.
- Section A exists.
- Section A contains exactly 4 MCQs.
- Every MCQ is exactly 1 mark.
- Every MCQ has exactly 4 options.
- Section B questions are exactly 2 marks each.
- Section C questions are exactly 5 marks each.
- Sections appear in A → B → C order when applicable.
- Question numbering is continuous.
- Total marks equal the user's requested total exactly.
- No solution steps are numbered.
- No question is empty.
- No answers are included unless requested.
`,



  homework: `
You are Nyxora AI operating as a Homework Creator.

Create clear, age-appropriate and useful homework for students.

When appropriate:
- mention subject and topic
- organize questions clearly
- balance practice and understanding
- include different types of questions
- match the student's class level
- avoid unnecessary answers unless requested
- use proper mathematical notation for mathematics

Use available Workspace class and student context when relevant.
`,


  report: `
You are Nyxora AI operating as a Student Report Analyzer.

Your job is to analyze student academic information such as:
- test scores
- attendance
- homework performance
- subject performance
- strengths
- weaknesses
- improvement trends

When data is available:
1. Summarize overall performance.
2. Identify strengths.
3. Identify areas needing improvement.
4. Highlight meaningful patterns.
5. Suggest practical next steps.

Use Workspace student information, test results and related documents
when they are supplied.

Never invent student data.
Clearly state when there is not enough information.
`,


  doubt: `
You are Nyxora AI operating as a student Doubt Solver.

Your goal is to help the student understand the concept,
not merely give the final answer.

When solving a doubt:
- explain in simple language
- adapt to the student level when known
- break difficult ideas into steps
- show calculations clearly when needed
- give examples when helpful
- avoid unnecessary complexity

Use Workspace class/student context when relevant.

If the question is ambiguous, ask a concise clarification.
`,


  pdf: `
You are Nyxora AI operating in dedicated PDF Generator Mode.

Your only purpose in this mode is to create professional,
structured, PDF-ready documents.

Do not behave like a general conversational assistant.

When a valid PDF generation command is received:
- follow the user's document requirements carefully
- use available Workspace context when relevant
- create complete PDF-ready content
- preserve correct academic and mathematical notation
- follow the professional PDF document instructions supplied below

Return only useful document content.
`,

};


// ======================================================
// CLEAN VALUE
// ======================================================

function cleanValue(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(
    value
  ).trim();

}



// ======================================================
// NOTES IMAGE REQUEST DETECTION
// ======================================================

function isNotesImageRequest(
  text = ""
) {

  const value =
    String(text || "")
      .trim();

  if (!value) {
    return false;
  }

  const asksForImage =
    /\b(image|images|picture|pictures|photo|photos|visual|visuals|figure|figures|illustration|illustrations|photograph|photographs)\b/i.test(
      value
    ) ||

    /(?:चित्र|तस्वीर|फोटो|इमेज|चित्रण|दृश्य|विजुअल|फिगर)/u.test(
      value
    );

  if (!asksForImage) {
    return false;
  }

  const isNotesRequest =
    /\bnotes?\b/i.test(
      value
    ) ||

    /नोट्स/u.test(
      value
    ) ||

    /\bgenerate\s+pdf\b.*\bnotes?\b/i.test(
      value
    ) ||

    /\bpdf\b.*\bnotes?\b/i.test(
      value
    ) ||

    /\bnotes?\b.*\bpdf\b/i.test(
      value
    );

  return isNotesRequest;
}
// ======================================================
// CHAT TITLE
// ======================================================

function buildChatTitle(
  text,
  file
) {

  const cleanText =
    cleanValue(
      text
    )
      .replace(
        /\s+/g,
        " "
      );


  let title =
    cleanText ||
    file?.name ||
    "New Chat";


  if (
    title.length >
    MAX_CHAT_TITLE_LENGTH
  ) {

    title =
      `${title
        .slice(
          0,
          MAX_CHAT_TITLE_LENGTH
        )
        .trim()}…`;

  }


  return title;

}

function getThinkingMessages(
  userMessage,
  file = null
) {
  const value =
    cleanValue(userMessage).toLowerCase();

  if (file) {
    return [
      "Reading your file...",
      "Analyzing the uploaded content...",
      "Understanding your request...",
      "Preparing the response...",
    ];
  }

  if (
    /\b(test|quiz|question paper|worksheet|exam)\b/i.test(
      value
    )
  ) {
    return [
      "Understanding your requirements...",
      "Planning the questions...",
      "Balancing the difficulty...",
      "Preparing the test...",
    ];
  }

  if (
    /\b(explain|meaning|what is|how does|why does|define)\b/i.test(
      value
    )
  ) {
    return [
      "Understanding your question...",
      "Analyzing the concept...",
      "Breaking it down...",
      "Preparing a clear explanation...",
    ];
  }

  if (
    /\b(math|calculate|solve|equation|formula|find)\b/i.test(
      value
    )
  ) {
    return [
      "Understanding the problem...",
      "Analyzing the given information...",
      "Working through the solution...",
      "Preparing the answer...",
    ];
  }

  if (
    /\b(notes|summary|summarize|revision)\b/i.test(
      value
    )
  ) {
    return [
      "Understanding the topic...",
      "Organizing the key points...",
      "Structuring the information...",
      "Preparing your notes...",
    ];
  }

  if (
    /\b(report|performance|marks|attendance|student)\b/i.test(
      value
    )
  ) {
    return [
      "Reviewing the information...",
      "Analyzing the available data...",
      "Identifying important patterns...",
      "Preparing the analysis...",
    ];
  }

  return [
    "Thinking...",
    "Analyzing your request...",
    "Working on it...",
    "Preparing the answer...",
  ];
}

// ======================================================
// FILE METADATA
// ======================================================

function buildFileMetadata(
  file
) {

  if (!file) {

    return null;

  }


  return {

    name:
      file.name ||
      "Attachment",

    type:
      file.type ||
      "application/octet-stream",

    size:
      Number(
        file.size || 0
      ),

  };

}


// ======================================================
// WORKSPACE CONTEXT
// ======================================================

function buildWorkspaceContextPrompt(
  workspaceContext
) {

  if (
    !workspaceContext
  ) {

    return "";

  }


  const selectedClass =
    workspaceContext.class;

  const selectedStudent =
    workspaceContext.student;


  const documents =
    Array.isArray(
      workspaceContext.documents
    )

      ? workspaceContext.documents
        .slice(
          0,
          MAX_WORKSPACE_DOCUMENTS
        )

      : [];


  const results =
    Array.isArray(
      workspaceContext.results
    )

      ? workspaceContext.results
        .slice(
          0,
          MAX_WORKSPACE_RESULTS
        )

      : [];


  if (
    !selectedClass &&
    !selectedStudent &&
    documents.length === 0 &&
    results.length === 0
  ) {

    return "";

  }


  const lines = [

    "WORKSPACE CONTEXT:",
    "",
    "The following information comes from the user's Nyxora Workspace.",
    "Use it only when relevant to the user's request.",
    "Do not invent missing Workspace information.",

  ];


  if (
    selectedClass
  ) {

    lines.push(
      "",
      "SELECTED CLASS:",
      `Name: ${cleanValue(selectedClass.name) || "Not provided"}`,
      `Grade: ${cleanValue(selectedClass.grade) || "Not provided"}`,
      `Subject: ${cleanValue(selectedClass.subject) || "Not provided"}`,
      `Board: ${cleanValue(selectedClass.board) || "Not provided"}`,
      `Description: ${cleanValue(selectedClass.description) || "Not provided"}`
    );

  }


  if (
    selectedStudent
  ) {

    lines.push(
      "",
      "SELECTED STUDENT:",
      `Name: ${cleanValue(selectedStudent.name) || "Not provided"}`,
      `Roll Number: ${cleanValue(selectedStudent.rollNumber) || "Not provided"}`,
      `Parent Name: ${cleanValue(selectedStudent.parentName) || "Not provided"}`,
      `Performance: ${cleanValue(selectedStudent.performance) || "Not provided"}`,
      `Notes: ${cleanValue(selectedStudent.notes) || "Not provided"}`
    );

  }


  if (
    documents.length > 0
  ) {

    lines.push(
      "",
      "RELATED WORKSPACE DOCUMENTS:"
    );


    documents.forEach(
      (
        document,
        index
      ) => {

        const documentContent =
          cleanValue(
            document.content
          )
            .slice(
              0,
              MAX_WORKSPACE_DOCUMENT_CONTENT
            );


        lines.push(
          "",
          `Document ${index + 1}:`,
          `Title: ${cleanValue(document.title) || "Untitled"}`,
          `Type: ${cleanValue(document.type) || "Document"}`,
          `Subject: ${cleanValue(document.subject) || "Not provided"}`,
          `Chapter: ${cleanValue(document.chapter) || "Not provided"}`,
          `Content: ${documentContent || "No content available"}`
        );

      }
    );

  }


  if (
    results.length > 0
  ) {

    lines.push(
      "",
      "STUDENT TEST RESULTS:"
    );


    results.forEach(
      (
        result,
        index
      ) => {

        const marksObtained =
          Number(
            result.marksObtained
          );


        const totalMarks =
          Number(
            result.totalMarks
          );


        const percentage =
          Number.isFinite(
            marksObtained
          ) &&
            Number.isFinite(
              totalMarks
            ) &&
            totalMarks > 0

            ? Math.round(
              (
                marksObtained /
                totalMarks
              ) *
              100
            )

            : null;


        lines.push(
          "",
          `Result ${index + 1}:`,
          `Test: ${cleanValue(result.title) || "Untitled"}`,
          `Subject: ${cleanValue(result.subject) || "Not provided"}`,
          `Chapter: ${cleanValue(result.chapter) || "Not provided"}`,
          `Marks: ${cleanValue(result.marksObtained)} / ${cleanValue(result.totalMarks)}`,
          `Percentage: ${percentage !== null ? `${percentage}%` : "Not available"}`,
          `Test Date: ${cleanValue(result.testDate) || "Not provided"}`,
          `Remarks: ${cleanValue(result.remarks) || "None"}`
        );

      }
    );

  }


  return lines.join(
    "\n"
  );

}

// ======================================================
// CHAT HOOK
// ======================================================

export default function useChat({
  activeChatId,
  chats,
  setChats,

  selectedMode = "normal",

  workspaceContext = null,
}) {

  const [
    isThinking,
    setIsThinking,
  ] = useState(false);

  const [
    thinkingText,
    setThinkingText,
  ] = useState("");

  const attachmentCacheRef =
    useRef(
      new Map()
    );

  const thinkingTimerRef =
    useRef(null);

  const startThinking = (
    userMessage,
    file = null
  ) => {
    const messages =
      getThinkingMessages(
        userMessage,
        file
      );

    if (
      thinkingTimerRef.current
    ) {
      window.clearInterval(
        thinkingTimerRef.current
      );
    }

    let index = 0;

    setThinkingText(
      messages[0]
    );

    setIsThinking(true);

    thinkingTimerRef.current =
      window.setInterval(() => {
        index =
          (index + 1) %
          messages.length;

        setThinkingText(
          messages[index]
        );
      }, 1400);
  };

  const stopThinking = () => {
    if (
      thinkingTimerRef.current
    ) {
      window.clearInterval(
        thinkingTimerRef.current
      );

      thinkingTimerRef.current =
        null;
    }

    setThinkingText("");
  };

  const [
    attachmentError,
    setAttachmentError,
  ] = useState("");


  // ====================================================
  // CLEAR ATTACHMENT ERROR
  // ====================================================

  const clearAttachmentError =
    () => {

      setAttachmentError("");

    };


  // ====================================================
  // PDF GENERATOR MODE CHECK
  // ====================================================

  const isPdfGeneratorMode =
    selectedMode ===
    PDF_GENERATOR_MODE;

    // ====================================================
// TEST REQUEST DETECTION
// ====================================================

const isTestRequest =
  (text = "") => {

    const value =
      String(text || "")
        .trim()
        .toLowerCase();

    if (!value) {
      return false;
    }

    const hasTestIntent =
      /\b(create|make|generate|prepare|design|set|write|draft|give|build)\b/i
        .test(value);

    const hasTestContent =
      /\b(test|question paper|question-paper|exam|examination|assessment|mcq test|practice test|unit test|chapter test)\b/i
        .test(value);

    return (
      hasTestIntent &&
      hasTestContent
    );
  };


  // ====================================================
  // FILE EXTRACTION
  // ====================================================

  const extractFileContent =
    async (
      file
    ) => {

      if (!file) {

        return "";

      }


      if (
        file.type ===
        "application/pdf" ||
        file.name
          ?.toLowerCase()
          .endsWith(".pdf")
      ) {

        return await extractPdfText(
          file
        );

      }


      if (
        file.name
          ?.toLowerCase()
          .endsWith(".docx")
      ) {

        return await extractDocxText(
          file
        );

      }


      if (
        file.type ===
        "text/plain" ||
        file.name
          ?.toLowerCase()
          .endsWith(".txt") ||
        file.name
          ?.toLowerCase()
          .endsWith(".md")
      ) {

        return await file.text();

      }


      return "";

    };


  // ====================================================
  // ATTACHMENT ERROR
  // ====================================================

  const handleAttachmentError =
    (
      error
    ) => {

      console.error(
        "File extraction error:",
        error
      );


      if (
        error?.code ===
        PDF_ERROR_CODES
          .PASSWORD_PROTECTED
      ) {

        setAttachmentError(
          error.message ||
          "⚠️ This PDF is password-protected. Please remove the password and upload it again."
        );


        return false;

      }


      if (
        error?.code ===
        PDF_ERROR_CODES
          .INVALID_PDF
      ) {

        setAttachmentError(
          error.message ||
          "This PDF appears to be invalid or corrupted. Please try another file."
        );


        return false;

      }


      setAttachmentError(
        error?.message ||
        "Nyxora couldn't read this attachment. Please try another file."
      );


      return false;

    };


  // ====================================================
  // FILE PROMPT
  // ====================================================

  const buildPromptWithFile =
    async (
      text,
      file
    ) => {

      let userPrompt =
        cleanValue(
          text
        );


      if (
        file &&
        !file.type?.startsWith(
          "image/"
        )
      ) {

        const extractedText =
          await extractFileContent(
            file
          );


        if (
          extractedText
        ) {

          userPrompt += `


ATTACHED FILE TEXT CONTENT:

${extractedText}`;

        }

      }


      return userPrompt;

    };

  // ======================================================
  // MULTIPLE ATTACHMENT PROMPT
  // ======================================================

  const buildPromptWithFiles =
    async (
      text,
      selectedFiles = []
    ) => {

      let userPrompt =
        cleanValue(
          text
        );


      const documentFiles =
        selectedFiles.filter(
          (
            selectedFile
          ) =>
            selectedFile &&
            !selectedFile.type
              ?.startsWith(
                "image/"
              )
        );


      for (
        let index = 0;
        index <
        documentFiles.length;
        index++
      ) {

        const selectedFile =
          documentFiles[index];


        const extractedText =
          await extractFileContent(
            selectedFile
          );


        if (
          extractedText
        ) {

          userPrompt += `

ATTACHED FILE ${index + 1} TEXT CONTENT:
FILE NAME: ${selectedFile.name ||
            "Attachment"
            }

${extractedText}`;

        }

      }


      return userPrompt;

    };


  // ====================================================
  // FINAL MODE PROMPT
  // ====================================================

  const buildModePrompt =
    (
      userPrompt,
      pdfRequested = false
    ) => {

      const modeInstruction =
        assistantModePrompts[
        selectedMode
        ] ||
        assistantModePrompts.normal;

      const workspacePrompt =
        buildWorkspaceContextPrompt(
          workspaceContext
        );

      const pdfInstruction =
        pdfRequested
          ? buildPdfInstruction()
          : "";

      const diagramOutputEnforcement = `
==================================================
UNIVERSAL DIAGRAM OUTPUT CONTRACT
==================================================

This diagram system applies to EVERY Nyxora AI mode.

It applies to:

- normal chat
- test generation
- homework
- doubt solving
- notes
- PDF generation
- reports
- explanations
- worksheets
- study material
- any future AI mode

A diagram MUST be generated whenever:

1. The user explicitly asks for a diagram, figure,
   graph, illustration, labelled figure, construction,
   visual representation or similar visual.

OR

2. The requested content genuinely requires a visual
   representation for mathematical or educational
   understanding.

If a diagram is NOT requested and is NOT genuinely
useful, do not create one.

==================================================
NEVER CREATE TEXT DIAGRAMS
==================================================

NEVER generate ASCII or text-based diagrams.

NEVER use:

- slash/backslash drawings
- vertical-bar drawings
- underscore drawings
- repeated hyphens
- repeated spaces for positioning
- Unicode box drawing
- Unicode geometry drawings
- Markdown drawings
- Mermaid
- SVG
- image URLs
- base64 images
- code-block drawings

NEVER create a diagram using characters.

NEVER put a visual drawing inside the user's question,
answer, explanation or solution text.

The renderer creates the actual visual.

==================================================
STRUCTURED DIAGRAM FORMAT
==================================================

Every diagram MUST be separate from normal content.

Use:

{
    "number": QUESTION_NUMBER,
    "diagram": {
        "type": "scene",
        "points": [],
        "lines": [],
        "arrows": [],
        "circles": [],
        "ellipses": [],
        "rectangles": [],
        "polygons": [],
        "paths": [],
        "arcs": [],
        "curves": [],
        "labels": [],
        "dimensions": []
    }
}

==================================================
STRUCTURED DIAGRAM FORMAT
==================================================

Every diagram MUST be separate from normal content.

For normal mathematical or subject-specific diagrams,
use:

{
    "number": QUESTION_NUMBER,
    "diagram": {
        "type": "scene",
        "points": [],
        "lines": [],
        "arrows": [],
        "circles": [],
        "ellipses": [],
        "rectangles": [],
        "polygons": [],
        "paths": [],
        "arcs": [],
        "curves": [],
        "labels": [],
        "dimensions": []
    }
}

==================================================
FLOWCHART RULE
==================================================

Use:

"type": "flowchart"

ONLY when the requested visual is genuinely a
PROCESS / WORKFLOW / PIPELINE / ALGORITHM / SYSTEM
FLOW / STEP-BY-STEP PROCESS diagram.

Examples:

- AI processing pipeline
- machine learning workflow
- neural network processing flow
- software/system workflow
- algorithm steps
- input → processing → output
- data flow between processing stages
- biological process shown as sequential stages
  when the intended visual is explicitly a process flow
- any similar process where boxes/nodes are connected
  by directional arrows

A genuine flowchart MUST NOT be represented as a
normal "scene" diagram.

For flowcharts, use:

{
    "number": QUESTION_NUMBER,
    "diagram": {
        "type": "flowchart",
        "points": [],
        "lines": [],
        "arrows": [],
        "circles": [],
        "ellipses": [],
        "rectangles": [],
        "polygons": [],
        "paths": [],
        "arcs": [],
        "curves": [],
        "labels": [],
        "dimensions": []
    }
}

The flowchart renderer is responsible for arranging
flowchart nodes and connectors.

==================================================
IMPORTANT SUBJECT PROTECTION RULE
==================================================

DO NOT convert a diagram into a flowchart merely because
it contains:

- rectangles
- arrows
- boxes
- labels
- lines

A Mathematics, Physics, Chemistry, Biology, Geography,
or other subject diagram MUST remain "scene" unless its
actual purpose is a process/workflow/step-by-step flow.

Examples that MUST remain "scene":

- geometry figures
- triangles
- circles
- coordinate graphs
- physics apparatus diagrams
- circuit diagrams
- chemistry structures
- molecular diagrams
- biology labelled structures
- anatomy diagrams
- mathematical constructions
- graphs and plots

The semantic PURPOSE of the diagram determines whether
it is "scene" or "flowchart", not the presence of boxes
or arrows.

==================================================
DIAGRAM OWNERSHIP
==================================================

If the diagram belongs to a numbered question,
the number MUST exactly match that question.

Example:

Question 5:

{
    "number": 5,
    "diagram": {
        "type": "scene"
    }
}

Question 8:

{
    "number": 8,
    "diagram": {
        "type": "scene"
    }
}

NEVER:

- hardcode a question number
- assign diagrams sequentially
- assign diagrams by their position
- attach an unnumbered diagram to a question
- shift diagram numbers
- guess the question number

The question number is the ONLY ownership identifier.

==================================================
VECTOR PRIMITIVES
==================================================

Point:

{
    "x": 0,
    "y": 0,
    "label": "O"
}

Line:

{
    "x1": 0,
    "y1": 0,
    "x2": 8,
    "y2": 0
}

Arrow:

{
    "x1": 0,
    "y1": 0,
    "x2": 8,
    "y2": 0
}

Circle:

{
    "cx": 0,
    "cy": 0,
    "r": 5
}

Rectangle:

{
    "x": 0,
    "y": 0,
    "width": 8,
    "height": 5
}

Polygon:

{
    "points": [
        {
            "x": 0,
            "y": 0
        },
        {
            "x": 8,
            "y": 0
        },
        {
            "x": 4,
            "y": 5
        }
    ]
}

Arc:

{
    "cx": 0,
    "cy": 0,
    "r": 3,
    "startAngle": 0,
    "endAngle": 60
}

Curve:

{
    "points": [
        {
            "x": -4,
            "y": 4
        },
        {
            "x": -2,
            "y": 1
        },
        {
            "x": 0,
            "y": 0
        },
        {
            "x": 2,
            "y": 1
        },
        {
            "x": 4,
            "y": 4
        }
    ]
}

==================================================
LABEL PLACEMENT
==================================================

Labels are rendered at the exact x/y coordinates you provide.

YOU are responsible for choosing good final label positions.

For EVERY label:

- Place it close to the geometry it describes.
- Place it in clear empty space.
- NEVER place it directly on a line, circle, arc, curve, polygon
  edge, rectangle edge, vertex, point, arrow or dimension.
- NEVER overlap another label.
- NEVER allow label text to cross or hide mathematical geometry.
- Keep the complete label visible inside the diagram area.
- Consider the ENTIRE diagram before choosing the position.
- Do not use the same fixed offset for every label.
- Choose the best position individually for each label.
- If the natural position is occupied, move the label to the
  nearest clear position while keeping it visually associated
  with the geometry.
- Keep point labels close to their corresponding points while
  placing the text outside the point/geometry.
- Keep descriptive labels close to the geometry they describe.
- Leave enough space for the COMPLETE text, not just its first
  character.

Before returning the diagram JSON, perform a final visual check:

1. Check every label against every line.
2. Check every label against every circle/arc/curve.
3. Check every label against every point/vertex.
4. Check every label against every other label.
5. Check that no label hides an important mathematical marking.
6. Reposition any conflicting label before returning the JSON.

The x/y coordinates are the FINAL rendering positions.
Do not treat them as approximate positions.

IMPORTANT LABEL DISTANCE AND COLLISION RULES

- Labels must remain visually CLOSE to the geometry they describe.
- Do NOT move a label far away just to find empty space.
- Prefer the nearest safe position to the original geometry.
- Minimize the distance between the label and its associated
  point/line/shape while still preventing overlap.

For point labels:

- The label must stay close to its point.
- Place the text just outside the point/vertex.
- Consider the FULL WIDTH and HEIGHT of the label text.
- The complete text bounding area must be clear of ALL geometry.
- A label is NOT considered safe merely because its starting
  coordinate does not touch the geometry.
- Check where the ENTIRE text will extend from the given x/y position.

For long labels such as:

"A (Tower Top)"
"B (Building Top)"
"P (Point)"
"Point of Contact (P)"
"Tangent Line"
"Radius (r)"

give the text enough local empty space, but keep it as close
as possible to the associated geometry.

PRIORITY ORDER:

1. Keep the label close to the geometry it describes.
2. Prevent the COMPLETE label text from overlapping geometry.
3. Prevent overlap with other labels.
4. Keep the label inside the diagram.
5. If several positions are safe, ALWAYS choose the closest one
   to the associated geometry.

Do NOT sacrifice proximity for excessive empty space.

A label should normally be only a small offset from its associated
geometry, not several coordinate units away, unless no nearby
position is safe.

==================================================
LABEL
==================================================

Use:

{
  "x": 0,
  "y": 0,
  "text": "O"
}

Label:

{
    "x": 0,
    "y": 0,
    "text": "O"
}

Dimension:

{
    "x1": 0,
    "y1": 0,
    "x2": 8,
    "y2": 0,
    "text": "8 cm"
}

==================================================
MATHEMATICAL DIAGRAMS
==================================================

Support ALL mathematical diagrams, not only school-level
examples.

Examples include:

- triangles
- circles
- tangents
- angles
- quadrilaterals
- polygons
- constructions
- coordinate geometry
- function graphs
- curves
- number lines
- vectors
- transformations
- loci
- towers
- heights and distances
- geometric configurations
- calculus diagrams
- analytic geometry
- trigonometry figures
- statistical graphs
- probability diagrams
- any other mathematical visual

Represent the actual mathematical configuration using
vector primitives.

==================================================
EDUCATIONAL VISUALS
==================================================

The system is NOT restricted to mathematics.

If a user asks for a visual in:

- science
- physics
- chemistry
- biology
- geography
- computer science
- engineering
- education
- notes
- homework
- doubt solving
- worksheets
- tests
- PDFs

create structured visual data when the renderer supports
the required representation.

If the requested visual cannot be represented accurately
with the available vector primitives, do NOT invent a
fake diagram.

==================================================
QUESTION / CONTENT TEXT
==================================================

Normal content text must contain ONLY the actual
student-facing or user-facing content.

Do not insert ASCII diagrams into the text.

For example:

Q8. Two tangents TP and TQ are drawn to a circle with
centre O from an external point T. Find the required
angles.

Then separately provide the diagram metadata.

==================================================
ANSWER / SOLUTION RULE
==================================================

If an answer or solution genuinely requires a diagram,
create a separate structured diagram for that content.

However:

NEVER take a diagram from an answer or solution and
randomly attach it to a question.

NEVER use answer-key diagram order to determine question
ownership.

NEVER use sequential fallback assignment.

==================================================
EXPLICIT USER DIAGRAM REQUEST
==================================================

If the user explicitly says things such as:

- draw a diagram
- show a diagram
- include a diagram
- add a labelled figure
- create a graph
- illustrate this
- show the geometry
- make a visual
- include a figure

the diagram request MUST be respected.

Do NOT replace the requested diagram with ASCII.

Do NOT omit the diagram merely because the current mode
is normal, notes, homework, doubt, test or PDF.

==================================================
PDF RULE
==================================================

If a PDF/worksheet/test/notes document contains structured
diagram metadata, the PDF renderer must render the diagram.

The AI must provide the structure.

The PDF renderer creates the actual visual.

==================================================
FINAL SELF-CHECK
==================================================

Before returning content:

1. Check whether the user explicitly requested a diagram.
2. Check whether the content genuinely requires a diagram.
3. If yes, create separate structured diagram metadata.
4. Use type "scene" for mathematical/subject diagrams,
   or "flowchart" for genuine process/workflow diagrams.
5. Use the correct ownership number when applicable.
6. Use numeric coordinates.
7. Never generate ASCII.
8. Never generate SVG.
9. Never generate Mermaid.
10. Never generate image URLs.
11. Never generate base64 images.
12. Never attach diagrams sequentially.
13. Never take question diagrams from answer-key order.
14. Never put drawings inside question text.
15. Preserve the diagram across PDF generation.

The AI provides the structured visual description.

The Nyxora renderer creates the actual diagram.

==================================================
END UNIVERSAL DIAGRAM OUTPUT CONTRACT
==================================================
`;

const testFinalOverride =
  selectedMode === "test"
    ? `
==================================================
FINAL TEST STRUCTURE OVERRIDE
==================================================

This is the final authority for test structure and marking.

The user's requested TOTAL MARKS may be ANY value.

SECTION A:
- Exactly 4 MCQs.
- Each MCQ = exactly 1 mark.
- Section A = exactly 4 marks.
- Exactly 4 options per MCQ.

SECTION B:
- Every question = exactly 2 marks.

SECTION C:
- Every question = exactly 5 marks.

Calculate the number of questions required so the
FINAL TOTAL exactly equals the user's requested total.

Never give an MCQ 5 marks.

Never change the fixed mark values of Sections A,
B or C to satisfy a conflicting instruction.

If the user request conflicts with these fixed
section-mark rules, keep the fixed section-mark rules.

Keep question numbering continuous across sections.

Before returning the test, verify:

Section A marks
+ Section B marks
+ Section C marks
+ any additional required section
= EXACT requested TOTAL MARKS.
`
    : "";

return `
${modeInstruction}

${workspacePrompt}

${pdfInstruction}

${diagramOutputEnforcement}

USER REQUEST:

${userPrompt}

${testFinalOverride}
`.trim();}

// ====================================================
// TEST GENERATOR MODE WARNING
// ====================================================

const addTestGeneratorWarning =
  async ({
    currentChat,
    cleanUserMessage,
    file,
    files = [],
  }) => {

    const history =
      currentChat.messages ||
      [];

    const fileMetadata =
      buildFileMetadata(
        file
      );

    const userMessage = {
      id:
        Date.now(),

      role:
        "user",

      message:
        cleanUserMessage,

      ...(fileMetadata
        ? {
            file:
              fileMetadata,
          }
        : {}),
    };

    if (
      files.length > 0 &&
      userMessage.id
    ) {
      attachmentCacheRef.current.set(
        userMessage.id,
        files
      );
    }

    const warningMessage = {
      id:
        Date.now() + 1,

      role:
        "assistant",

      message:
        TEST_GENERATOR_WARNING,

      testModeWarning:
        true,

      testGeneratorMode:
        false,
    };

    const hasUserMessage =
      history.some(
        (msg) =>
          msg.role ===
          "user"
      );

    const shouldCreateTitle =
      currentChat.title ===
        "New Chat" &&
      !hasUserMessage;

    const generatedTitle =
      shouldCreateTitle
        ? buildChatTitle(
            cleanUserMessage,
            file
          )
        : currentChat.title;

    const newMessages = [
      ...history,
      userMessage,
      warningMessage,
    ];

    setChats(
      (prev) =>
        prev.map(
          (chat) => {

            if (
              chat.id !==
              activeChatId
            ) {
              return chat;
            }

            return {
              ...chat,

              title:
                shouldCreateTitle
                  ? generatedTitle
                  : chat.title,

              messages:
                newMessages,
            };

          }
        )
    );

    await saveMessages(
      activeChatId,
      newMessages
    );

    if (
      shouldCreateTitle &&
      generatedTitle !==
        "New Chat"
    ) {
      try {

        await updateChatTitle(
          activeChatId,
          generatedTitle
        );

      } catch (error) {

        console.error(
          "Failed to save chat title:",
          error
        );

      }
    }

    return true;
  };

  // ====================================================
  // PDF MODE WARNING
  // ====================================================

  const addPdfModeWarning =
    async ({
      currentChat,
      cleanUserMessage,
      file,
      files = [],
    }) => {

      const history =
        currentChat.messages ||
        [];


      const fileMetadata =
        buildFileMetadata(
          file
        );


      const userMessage = {

        id:
          Date.now(),

        role:
          "user",

        message:
          cleanUserMessage,

        ...(fileMetadata

          ? {
            file:
              fileMetadata,
          }

          : {}),

      };

      if (
        files.length > 0 &&
        userMessage.id
      ) {

        attachmentCacheRef.current.set(
          userMessage.id,
          files
        );

      }


      const warningMessage = {

        id:
          Date.now() + 1,

        role:
          "assistant",

        message:
          PDF_GENERATOR_WARNING,

        pdfRequested:
          false,

        pdfModeWarning:
          true,

      };


      const hasUserMessage =
        history.some(
          (msg) =>
            msg.role ===
            "user"
        );


      const shouldCreateTitle =
        currentChat.title ===
        "New Chat" &&
        !hasUserMessage;


      const generatedTitle =
        shouldCreateTitle

          ? buildChatTitle(
            cleanUserMessage,
            file
          )

          : currentChat.title;


      const newMessages = [

        ...history,

        userMessage,

        warningMessage,

      ];


      setChats(
        (prev) =>
          prev.map(
            (chat) => {

              if (
                chat.id !==
                activeChatId
              ) {

                return chat;

              }


              return {

                ...chat,

                title:
                  shouldCreateTitle
                    ? generatedTitle
                    : chat.title,

                messages:
                  newMessages,

              };

            }
          )
      );


      await saveMessages(
        activeChatId,
        newMessages
      );


      if (
        shouldCreateTitle &&
        generatedTitle !==
        "New Chat"
      ) {

        try {

          await updateChatTitle(
            activeChatId,
            generatedTitle
          );

        } catch (error) {

          console.error(
            "Failed to save chat title:",
            error
          );

        }

      }


      return true;

    };


  // ====================================================
  // SEND
  // ====================================================

  const send =
    async (
      payload
    ) => {

      if (
        isThinking
      ) {

        return false;

      }


      setAttachmentError("");


      const userId =
        auth.currentUser?.uid;


      const text =
        typeof payload ===
          "string"

          ? payload

          : payload?.message ||
          "";


      const files =
        typeof payload ===
          "string"

          ? []

          : Array.isArray(
            payload?.files
          )

            ? payload.files.filter(
              Boolean
            )

            : payload?.file
              ? [
                payload.file
              ]

              : [];


      const file =
        files[0] ||
        null;

      if (
        !cleanValue(text) &&
        files.length === 0
      ) {
        return false;
      }


      const currentChat =
        chats.find(
          (chat) =>
            chat.id ===
            activeChatId
        );


      if (
        !currentChat
      ) {

        return false;

      }


      const history =
        currentChat.messages ||
        [];


      const cleanUserMessage =
        cleanValue(
          text
        );


      // ================================================
      // DEDICATED PDF GENERATOR MODE VALIDATION
      // ================================================

      if (
        isPdfGeneratorMode &&
        !(
          /\bgenerate\b/iu.test(
            cleanUserMessage
          ) &&
          /\bpdf\b/iu.test(
            cleanUserMessage
          )
        )
      ) {

        try {

          return await addPdfModeWarning({
            currentChat,
            cleanUserMessage,
            file,
            files,
          });

        } catch (error) {

          console.error(
            "PDF mode warning error:",
            error
          );


          return false;

        }

      }

      startThinking(
        cleanUserMessage,
        file
      );

// ================================================
// TEST GENERATOR MODE VALIDATION
// ================================================

if (
  selectedMode !==
    TEST_GENERATOR_MODE &&
  isTestRequest(
    cleanUserMessage
  )
) {

  try {

    return await addTestGeneratorWarning({
      currentChat,
      cleanUserMessage,
      file,
      files,
    });

  } catch (error) {

    console.error(
      "Test Generator mode warning error:",
      error
    );

    return false;

  }

}

      // ================================================
      // PDF REQUEST DETECTION
      //
      // Dedicated PDF mode is always a PDF request once
      // the required command has been accepted.
      //
      // Other assistant modes keep the existing direct
      // PDF request detection.
      // ================================================

      const pdfRequested =
        isPdfGeneratorMode

          ? true

          : isPdfRequest(
            cleanUserMessage
          );

      const notesImageRequested =
        pdfRequested &&
        isNotesImageRequest(
          cleanUserMessage
        );

      console.log(
        "🖼️ Notes image request check:",
        {
          cleanUserMessage,
          pdfRequested,
          notesImageRequested,
          notesImageTopic:
            notesImageRequested
              ? cleanUserMessage
              : "",
        }
      );

      let userPrompt;


      try {

        userPrompt =
          await buildPromptWithFiles(
            cleanUserMessage,
            files
          );
      } catch (error) {

        return handleAttachmentError(
          error
        );

      }

      let memory =
        null;


      try {

        memory =
          await getMemory();

      } catch (error) {

        console.error(
          "Memory loading error:",
          error
        );

      }


      const hasUserMessage =
        history.some(
          (msg) =>
            msg.role ===
            "user"
        );


      const shouldCreateTitle =
        currentChat.title ===
        "New Chat" &&
        !hasUserMessage;


      const generatedTitle =
        shouldCreateTitle

          ? buildChatTitle(
            text,
            file
          )

          : currentChat.title;


      const prompt =
        buildModePrompt(
          userPrompt,
          pdfRequested
        );


      const fileMetadataList =
        files.map(
          (
            selectedFile
          ) =>
            buildFileMetadata(
              selectedFile
            )
        );


      const fileMetadata =
        fileMetadataList[0] ||
        null;


      const userMessage = {

        id:
          Date.now(),

        role:
          "user",

        message:
          cleanUserMessage,

        pdfRequested:
          pdfRequested,

        notesImageRequested:
          notesImageRequested,

        notesImageTopic:
          notesImageRequested
            ? cleanUserMessage
            : "",

        ...(fileMetadata
          ? {
            file:
              fileMetadata,
          }
          : {}),

        ...(fileMetadataList.length > 0
          ? {
            files:
              fileMetadataList,
          }
          : {}),
      };

      const aiMessage = {

        id:
          Date.now() + 1,

        role:
          "assistant",

        message:
          "",

        pdfRequested:
          pdfRequested,

        pdfGeneratorMode:
          isPdfGeneratorMode,

        notesImageRequested:
          notesImageRequested,

        notesImageTopic:
          notesImageRequested
            ? cleanUserMessage
            : "",
      };


      const newMessages = [

        ...history,

        userMessage,

        aiMessage,

      ];


      setChats(
        (prev) =>
          prev.map(
            (chat) => {

              if (
                chat.id !==
                activeChatId
              ) {

                return chat;

              }


              return {

                ...chat,

                title:
                  shouldCreateTitle
                    ? generatedTitle
                    : chat.title,

                messages:
                  newMessages,

              };

            }
          )
      );


      await saveMessages(
        activeChatId,
        newMessages
      );


      if (
        shouldCreateTitle &&
        generatedTitle !==
        "New Chat"
      ) {

        try {

          await updateChatTitle(
            activeChatId,
            generatedTitle
          );

        } catch (error) {

          console.error(
            "Failed to save chat title:",
            error
          );

        }

      }



      try {

        await streamResponse({

          prompt,

          memoryMessage:
            cleanUserMessage,

          file,

          files,

          history,
          messages:
            newMessages,

          aiMessageId:
            aiMessage.id,

          activeChatId,

          setChats,

          setIsThinking,

          userId,

          memory,

        });


        return true;

      } catch (error) {

        console.error(
          "AI streaming error:",
          error
        );

        stopThinking();

        setIsThinking(
          false
        );


        return false;

      }

    };


  // ====================================================
  // REGENERATE
  // ====================================================

  const regenerate =
    async () => {

      if (
        isThinking
      ) {

        return false;

      }


      setAttachmentError("");


      const activeChat =
        chats.find(
          (chat) =>
            chat.id ===
            activeChatId
        );


      if (
        !activeChat
      ) {

        return false;

      }


      const messages =
        activeChat.messages ||
        [];


      const lastUserIndex =
        messages
          .map(
            (msg) =>
              msg.role
          )
          .lastIndexOf(
            "user"
          );


      if (
        lastUserIndex ===
        -1
      ) {

        return false;

      }


      const lastUser =
        messages[
        lastUserIndex
        ];


      const assistantIndex =
        messages.findIndex(
          (
            msg,
            index
          ) =>
            index >
            lastUserIndex &&
            msg.role ===
            "assistant"
        );


      if (
        assistantIndex ===
        -1
      ) {

        return false;

      }


      const lastAssistant =
        messages[
        assistantIndex
        ];


      const cleanUserMessage =
        cleanValue(
          lastUser.message
        );

      startThinking(
        cleanUserMessage
      );

      // ================================================
      // PDF MODE REGENERATE PROTECTION
      // ================================================

      if (
        isPdfGeneratorMode &&
        !hasGeneratePdfCommand(
          cleanUserMessage
        )
      ) {

        const updatedMessages =
          messages.map(
            (msg) =>

              msg.id ===
                lastAssistant.id

                ? {
                  ...msg,

                  message:
                    PDF_GENERATOR_WARNING,

                  pdfRequested:
                    false,

                  pdfModeWarning:
                    true,

                  pdfGeneratorMode:
                    false,
                }

                : msg
          );


        setChats(
          (prev) =>
            prev.map(
              (chat) =>

                chat.id ===
                  activeChatId

                  ? {
                    ...chat,

                    messages:
                      updatedMessages,
                  }

                  : chat
            )
        );


        await saveMessages(
          activeChatId,
          updatedMessages
        );


        return true;

      }

      // ================================================
// TEST GENERATOR REGENERATE PROTECTION
// ================================================
//
// If the user asked for a test while currently in
// Normal Assistant or another non-test mode,
// regeneration must NOT generate the test.
//
// It must show the same warning and tell the user
// to select Test Generator mode.
// ================================================

const isTestRequest =
  /(?:\bmake\b|\bcreate\b|\bgenerate\b|\bprepare\b|\bgive\b|\bwrite\b|\bset\b).{0,80}\btest\b/i.test(
    cleanUserMessage
  ) ||
  /\bquestion\s*paper\b/i.test(
    cleanUserMessage
  ) ||
  /\bquestionnaire\b/i.test(
    cleanUserMessage
  ) ||
  /\bassessment\b/i.test(
    cleanUserMessage
  ) ||
  /\bexam\s*paper\b/i.test(
    cleanUserMessage
  );


const isTestGeneratorMode =
  selectedMode === "test";


if (
  isTestRequest &&
  !isTestGeneratorMode
) {

  const TEST_GENERATOR_WARNING = `
## Test Generator Mode

This request is for generating a test.

Please select **Test Generator** mode from the assistant mode selector before generating a test.

Example:

**Test Generator → Generate a Class 8 Mathematics test on Linear Equations.**

`.trim();


  const updatedMessages =
    messages.map(
      (msg) =>
        msg.id ===
        lastAssistant.id

          ? {
              ...msg,

              message:
                TEST_GENERATOR_WARNING,

              pdfRequested:
                false,

              pdfModeWarning:
                false,

              testModeWarning:
                true,

              testGeneratorMode:
                false,
            }

          : msg
    );


  setChats(
    (prev) =>
      prev.map(
        (chat) =>
          chat.id ===
          activeChatId

            ? {
                ...chat,

                messages:
                  updatedMessages,
              }

            : chat
      )
  );


  await saveMessages(
    activeChatId,
    updatedMessages
  );

  stopThinking();

setIsThinking(false);


  return true;
}


      let memory =
        null;


      try {

        memory =
          await getMemory();

      } catch (error) {

        console.error(
          "Memory loading error:",
          error
        );

      }


      const pdfRequested =
        isPdfGeneratorMode

          ? true

          : Boolean(
            lastAssistant
              ?.pdfRequested
          ) ||
          isPdfRequest(
            cleanUserMessage
          );


      const prompt =
        buildModePrompt(
          cleanUserMessage,
          pdfRequested
        );


      const updatedMessages =
        messages.map(
          (msg) =>

            msg.id ===
              lastAssistant.id

              ? {
                ...msg,

                message:
                  "",

                pdfRequested:
                  pdfRequested,

                pdfModeWarning:
                  false,

                pdfGeneratorMode:
                  isPdfGeneratorMode,
              }

              : msg
        );


      setChats(
        (prev) =>
          prev.map(
            (chat) =>

              chat.id ===
                activeChatId

                ? {
                  ...chat,

                  messages:
                    updatedMessages,
                }

                : chat
          )
      );


      await saveMessages(
        activeChatId,
        updatedMessages
      );



      try {

        await streamResponse({

          prompt,

          memoryMessage:
            cleanUserMessage,

          history:
            updatedMessages.slice(
              0,
              lastUserIndex
            ),

          messages:
            updatedMessages,

          memory,

          aiMessageId:
            lastAssistant.id,

          activeChatId,

          setChats,

          setIsThinking,

          userId:
            auth.currentUser?.uid,

        });


        return true;

      } catch (error) {

        console.error(
          "Regeneration error:",
          error
        );


        setIsThinking(
          false
        );


        return false;

      }

    };


  // ====================================================
  // EDIT MESSAGE
  // ====================================================

  const editMessage =
    async (
      messageId,
      newText,
      attachmentOptions = {}
    ) => {

      if (
        isThinking
      ) {

        return false;

      }


      setAttachmentError("");


      const activeChat =
        chats.find(
          (chat) =>
            chat.id ===
            activeChatId
        );


      if (
        !activeChat
      ) {

        return false;

      }


      const messageIndex =
        activeChat.messages
          .findIndex(
            (msg) =>
              msg.id ===
              messageId
          );


      if (
        messageIndex ===
        -1
      ) {

        return false;

      }


      const originalMessage =
        activeChat.messages[
        messageIndex
        ];


      if (
        originalMessage.role !==
        "user"
      ) {

        return false;

      }


      const assistantIndex =
        activeChat.messages
          .findIndex(
            (
              msg,
              index
            ) =>
              index >
              messageIndex &&
              msg.role ===
              "assistant"
          );


      if (
        assistantIndex ===
        -1
      ) {

        return false;

      }


      const {
        newFile = null,
        removeFile = false,
      } = attachmentOptions;


      const cleanUserMessage =
        cleanValue(
          newText
        );


      let finalFileMetadata =
        originalMessage.file ||
        null;

      let filesForAI =
        attachmentCacheRef.current.get(
          lastUser.id
        ) ||
        [];


      let fileForAI =
        filesForAI[0] ||
        null;


      if (
        newFile
      ) {

        finalFileMetadata =
          buildFileMetadata(
            newFile
          );


        filesForAI = [
          newFile
        ];

        fileForAI =
          newFile;

      } else if (
        removeFile
      ) {

        finalFileMetadata =
          null;

        attachmentCacheRef.current.delete(
          originalMessage.id
        );

      }

      attachmentCacheRef.current.set(
        originalMessage.id,
        filesForAI
      );


      if (
        !cleanUserMessage &&
        !finalFileMetadata
      ) {

        return false;

      }


      // ================================================
      // PDF MODE EDIT VALIDATION
      // ================================================

      const hasGenerateWord =
        /\bgenerate\b/iu.test(
          cleanUserMessage
        );


      const hasPdfWord =
        /\bpdf\b/iu.test(
          cleanUserMessage
        );


      const validPdfGeneratorCommand =
        !isPdfGeneratorMode ||
        (
          hasGenerateWord &&
          hasPdfWord
        );


      const pdfRequested =
        isPdfGeneratorMode

          ? validPdfGeneratorCommand

          : isPdfRequest(
            cleanUserMessage
          );


      // ================================================
      // INVALID PDF MODE EDIT
      //
      // Update the user's edited message and replace the
      // assistant response with the local warning.
      // No AI request is sent.
      // ================================================

      if (
        isPdfGeneratorMode &&
        !validPdfGeneratorCommand
      ) {

        const updatedMessages =
          activeChat.messages.map(
            (
              msg,
              index
            ) => {

              if (
                index ===
                messageIndex
              ) {

                const updatedUserMessage = {

                  ...msg,

                  message:
                    cleanUserMessage,

                };


                if (
                  finalFileMetadata
                ) {

                  updatedUserMessage.file =
                    finalFileMetadata;

                } else {

                  delete updatedUserMessage.file;

                }


                return updatedUserMessage;

              }


              if (
                index ===
                assistantIndex
              ) {

                return {

                  ...msg,

                  message:
                    PDF_GENERATOR_WARNING,

                  pdfRequested:
                    false,

                  pdfModeWarning:
                    true,

                  pdfGeneratorMode:
                    false,

                };

              }


              return msg;

            }
          );


        setChats(
          (prev) =>
            prev.map(
              (chat) =>

                chat.id ===
                  activeChatId

                  ? {
                    ...chat,

                    messages:
                      updatedMessages,
                  }

                  : chat
            )
        );


        await saveMessages(
          activeChatId,
          updatedMessages
        );


        return true;

      }


      let userPrompt =
        cleanUserMessage;


      if (
        newFile
      ) {

        try {

          userPrompt =
            await buildPromptWithFile(
              cleanUserMessage,
              newFile
            );

        } catch (error) {

          return handleAttachmentError(
            error
          );

        }

      }


      let memory =
        null;


      try {

        memory =
          await getMemory();

      } catch (error) {

        console.error(
          "Memory loading error:",
          error
        );

      }


      const updatedMessages =
        activeChat.messages.map(
          (
            msg,
            index
          ) => {

            if (
              index ===
              messageIndex
            ) {

              const updatedUserMessage = {

                ...msg,

                message:
                  cleanUserMessage,

              };


              if (
                finalFileMetadata
              ) {

                updatedUserMessage.file =
                  finalFileMetadata;

              } else {

                delete updatedUserMessage.file;

              }


              return updatedUserMessage;

            }


            if (
              index ===
              assistantIndex
            ) {

              return {

                ...msg,

                message:
                  "",

                pdfRequested:
                  pdfRequested,

                pdfModeWarning:
                  false,

                pdfGeneratorMode:
                  isPdfGeneratorMode,

              };

            }


            return msg;

          }
        );


      setChats(
        (prev) =>
          prev.map(
            (chat) =>

              chat.id ===
                activeChatId

                ? {
                  ...chat,

                  messages:
                    updatedMessages,
                }

                : chat
          )
      );


      await saveMessages(
        activeChatId,
        updatedMessages
      );


      const prompt =
        buildModePrompt(
          userPrompt,
          pdfRequested
        );


      const aiMessage =
        updatedMessages[
        assistantIndex
        ];


      setIsThinking(
        true
      );


      try {

        await streamResponse({

          prompt,

          memoryMessage:
            cleanUserMessage,

          file:
            fileForAI,

          files:
            filesForAI,

          history:
            updatedMessages.slice(
              0,
              messageIndex
            ),

          messages:
            updatedMessages,

          memory,

          aiMessageId:
            aiMessage.id,

          activeChatId,

          setChats,

          setIsThinking,

          userId:
            auth.currentUser?.uid,

        });

        stopThinking();

        return true;

      } catch (error) {

        console.error(
          "Edit regeneration error:",
          error
        );


        setIsThinking(
          false
        );


        return false;

      }

    };


  // ====================================================
  // STOP GENERATION
  // ====================================================

  const stop = async () => {
    stopGeneration();

    stopThinking();

    setIsThinking(false);

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChatId) return chat;

        const messages = [...chat.messages];

        const lastMessage = messages[messages.length - 1];

        if (
          lastMessage &&
          lastMessage.role === "assistant" &&
          !lastMessage.message.trim()
        ) {
          messages.pop();
        }

        saveMessages(activeChatId, messages).catch(console.error);

        return {
          ...chat,
          messages,
        };
      })
    );
  };


  // ====================================================
  // RETURN
  // ====================================================

  return {
    send,
    regenerate,
    editMessage,
    stop,
    isThinking,
    thinkingText,
    attachmentError,
    clearAttachmentError,
  };
}