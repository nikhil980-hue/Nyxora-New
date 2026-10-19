import PptxGenJS from "pptxgenjs";

import presentationThemes from "../utils/presentationThemes";

import {
  getPresentationLayout,
} from "../utils/presentationLayouts";

import {
  generateSlideVisual,
  prepareVisualForPpt,
} from "./visualGenerationService";


// ======================================================
// NYXORA AI PPT EXPORT ENGINE
//
// PRESERVED:
//
// ✓ Existing PptxGenJS export
// ✓ Existing theme engine
// ✓ Existing layout engine
// ✓ Existing AI JSON support
// ✓ Existing image-generation backend
// ✓ SVG support
// ✓ Diagram slides
// ✓ Comparison slides
// ✓ Timeline slides
// ✓ Summary slides
// ✓ Numbered points
// ✓ Title icons
// ✓ Slide numbers
// ✓ Top multicolour presentation line
//
// IMPROVED:
//
// ✓ At least one generated image on every slide
// ✓ Adaptive image-card shapes
// ✓ Wide rectangle images
// ✓ Square images
// ✓ Portrait / stretched rectangle images
// ✓ Image proportions depend on slide content
//
// ✓ No multicolour decoration inside image cards
// ✓ Image itself becomes the card
// ✓ Images use crop-to-cover instead of stretching
// ✓ Rounded image corners
//
// ✓ Before/After accepts multiple AI JSON formats
// ✓ Before box no longer remains empty
// ✓ After box no longer remains empty
// ✓ Before gets its own image
// ✓ After gets its own image
// ✓ Enough room remains for comparison text
//
// ✓ Diagram slides use circular generated flow visuals
// ✓ Timeline gets supporting visual
// ✓ Summary gets supporting visual
//
// ✓ Sparse slides receive supporting information cards
// ✓ Minimum visual richness improved
//
// ✓ Cover gets:
//      Presented By
//      Organization
//      Date
//
// IMPORTANT:
//
// The existing visualGenerationService remains unchanged.
// Images continue coming from your current backend.
// ======================================================


const SLIDE_WIDTH = 13.33;
const SLIDE_HEIGHT = 7.5;


const COLORS = [
  "2563EB",
  "06B6D4",
  "22C55E",
  "EAB308",
  "F97316",
];


// ======================================================
// EXPORT PRESENTATION
//
// IMPROVED:
//
// ✓ Existing slides preserved
// ✓ Existing diagram slides preserved
// ✓ Uses ONLY the slides returned by the presentation generator
// ✓ Does NOT add automatic filler/flow slides
// ✓ Requested slide count is preserved during export
// ======================================================

export async function exportPresentationToPpt({
  presentation,
  themeName = "nyxoraPremium",
}) {

  const pptx =
    new PptxGenJS();


  const theme =
    presentationThemes[themeName] ||
    presentationThemes.nyxoraPremium;


  pptx.layout =
    "LAYOUT_WIDE";


  pptx.author =
    "Nyxora AI";


  pptx.company =
    presentation.organization ||
    "Nyxora AI";


  pptx.title =
    presentation.title ||
    "Nyxora AI Presentation";


  pptx.subject =
    presentation.subtitle ||
    presentation.description ||
    "";


  pptx.theme = {

    headFontFace:
      theme.typography.title,

    bodyFontFace:
      theme.typography.body,

    lang:
      "en-US",

  };


  // ==================================================
  // ORIGINAL SLIDES
  // ==================================================

  const originalSlides =
    Array.isArray(
      presentation.slides
    )
      ? presentation.slides
      : [];


  // IMPORTANT:
  // Copy array so original presentation data
  // is never mutated.

  const slides = [
    ...originalSlides,
  ];


  // ==================================================
  // CREATE ALL SLIDES

  // ==================================================

  for (
    let index = 0;
    index < slides.length;
    index++
  ) {

    const slide =
      slides[index];


    if (
      !validateSlide(
        slide
      )
    ) {

      continue;

    }


    await createSlide({

      pptx,

      slide,

      index,

      theme,

      presentation,

    });

  }


  // ==================================================
  // EXPORT
  // ==================================================

  await pptx.writeFile({

    fileName:
      `${
        presentation.title ||
        "Nyxora_AI_Presentation"
      }.pptx`,

  });

}
// ======================================================
// ADAPT CUSTOM SLIDE TO EXISTING NYXORA CONTENT STYLE
//
// This is NOT a new visual style.
//
// It only converts the user's pasted custom content into
// the same data structure already consumed by
// createContentSlide().
//
// The actual rendering is therefore identical to normal
// Nyxora content slides:
// ✓ same background
// ✓ same header
// ✓ same numbered bubbles
// ✓ same generated-image system
// ✓ same insight card
// ✓ same adaptive image layouts
// ======================================================

function adaptCustomSlideToNyxoraContent(
  slide
) {
  const source = String(
    slide?.rawContent ??
    slide?.customContent ??
    ""
  )
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");


  const lines =
    source
      .split("\n")
      .map(
        line =>
          String(line || "").trim()
      )
      .filter(
        line =>
          line &&
          !/^-{3,}$/.test(line)
      );


  if (
    lines.length === 0
  ) {
    return {
      ...slide,
      type: "content",
      layout: "content",
      title:
        slide?.title ||
        "Custom Content",
      headline: "",
      subtitle: "",
      points: [],
      keyTakeaway: "",
    };
  }


  // First meaningful line becomes the normal Nyxora
  // slide title. It is not duplicated in the points.
  let titleIndex =
    lines.findIndex(
      line =>
        /^\s*#{1,6}\s+/.test(line)
    );


  if (
    titleIndex < 0
  ) {
    titleIndex = 0;
  }


  const title =
    cleanCustomMarkdownLine(
      lines[titleIndex]
    );


  const body =
    lines
      .filter(
        (_, index) =>
          index !== titleIndex
      )
      .map(
        line =>
          cleanCustomContentForPoint(
            line
          )
      )
      .filter(Boolean);


  // The existing Nyxora renderer expects point-like
  // content. Group source lines into at most five points
  // without asking AI to rewrite them.
  const points =
    groupCustomContentForExistingStyle(
      body,
      5
    );


  return {
    ...slide,

    type: "content",

    layout: "content",

    title:
      title ||
      "Custom Content",

    subtitle: "",

    headline: "",

    points,

    bullets: points,

    items: points,

    keyTakeaway: "",

    description: "",

    isCustomContent: false,
  };
}


// ======================================================
// GROUP CUSTOM CONTENT FOR EXISTING NYXORA BUBBLES
//
// No new visual behavior is introduced here.
// This only prepares the custom text for the existing
// numbered-bubble renderer.
// ======================================================

function groupCustomContentForExistingStyle(
  lines,
  maxGroups = 5
) {
  if (
    !Array.isArray(lines) ||
    lines.length === 0
  ) {
    return [];
  }


  const groupCount =
    Math.min(
      maxGroups,
      lines.length
    );


  const groups = [];

  let cursor = 0;


  for (
    let index = 0;
    index < groupCount;
    index++
  ) {
    const remaining =
      lines.length -
      cursor;

    const groupsLeft =
      groupCount -
      index;

    const take =
      Math.ceil(
        remaining /
        groupsLeft
      );


    const group =
      lines
        .slice(
          cursor,
          cursor + take
        )
        .join("\n")
        .trim();


    if (group) {
      groups.push(group);
    }


    cursor += take;
  }


  return groups;
}


// ======================================================
// CUSTOM TEXT CLEANING
//
// Only removes presentation markup such as Markdown
// bullets/headings. The actual words are retained.
// ======================================================

function cleanCustomContentForPoint(
  line
) {
  return cleanCustomMarkdownLine(
    String(line || "")
  )
    .replace(
      /^\s*(?:[-*+]\s+|\d+[.)]\s+)/,
      ""
    )
    .trim();
}


// ======================================================
// CREATE SLIDE
//
// CENTRAL SLIDE ROUTER
//
// IMPORTANT:
//
// ✓ Restores export functionality
// ✓ Preserves all new layouts
// ✓ Awaits every async slide renderer
// ✓ Preserves generated images
// ✓ Preserves circular flow chart
// ✓ Preserves comparison images
// ✓ Preserves timeline images
// ✓ Preserves summary images
// ✓ Preserves slide numbers
// ======================================================

async function createSlide({
  pptx,
  slide,
  index,
  theme,
  presentation,
}) {

  // ==================================================
  // CREATE POWERPOINT PAGE
  // ==================================================

  const page =
    pptx.addSlide();


  // ==================================================
  // PREMIUM BACKGROUND
  //
  // Includes:
  // ✓ top multicolour line
  // ✓ page decorations
  // ==================================================

  applyPremiumBackground(
    page,
    theme,
    index
  );


  // ==================================================
  // RESOLVE LAYOUT
  //
  // Custom Mode is connected directly to Nyxora's
  // existing content renderer below. It does NOT have
  // a separate custom visual style.
  // ==================================================

  const requestedLayout =
    String(
      slide?.layout ||
      "content"
    ).toLowerCase();


  if (
    requestedLayout === "custom" ||
    slide?.type === "custom" ||
    slide?.isCustomContent === true
  ) {

    const adaptedSlide =
      adaptCustomSlideToNyxoraContent(
        slide
      );

    if (
      theme?.templateId &&
      theme.templateId !== "nyxoraOriginal"
    ) {
      await createReferenceTemplateSlide(
        page,
        adaptedSlide,
        presentation,
        theme,
        "content",
        index
      );
    }
    else {
      await createContentSlide(
        page,
        adaptedSlide,
        theme
      );
    }

    addSlideNumber(
      page,
      index,
      theme
    );

    return page;

  }


  const resolvedLayout =
    getPresentationLayout(
      requestedLayout
    );


  const layout =
    String(
      resolvedLayout?.type ||
      requestedLayout ||
      "content"
    ).toLowerCase();


  // ==================================================
  // REFERENCE TEMPLATE ENGINE
  //
  // Nyxora Original remains on the original renderer.
  // Reference templates use their own compositions while
  // consuming the same AI slide JSON and Pexels image
  // pipeline.
  // ==================================================

  if (
    theme?.templateId &&
    theme.templateId !== "nyxoraOriginal"
  ) {
    await createReferenceTemplateSlide(
      page,
      slide,
      presentation,
      theme,
      layout,
      index
    );

    addSlideNumber(
      page,
      index,
      theme
    );

    return page;
  }


  // ==================================================
  // SLIDE ROUTER
  // ==================================================

  switch (layout) {

    // ================================================
    // TITLE / COVER
    // ================================================

    case "title":

    case "cover":

      await createTitleSlide(
        page,
        slide,
        presentation,
        theme
      );

      break;


    // ================================================
    // DIAGRAM / FLOW
    // ================================================

    case "diagram":

    case "flow":

    case "process":

    case "cycle":

    case "workflow":

    case "circular-flow":

      await createDiagramSlide(
        page,
        slide,
        theme
      );

      break;


    // ================================================
    // COMPARISON / BEFORE AFTER
    // ================================================

    case "comparison":

    case "before-after":

    case "before_after":

      await createComparisonSlide(
        page,
        slide,
        theme
      );

      break;


    // ================================================
    // TIMELINE
    // ================================================

    case "timeline":

      await createTimelineSlide(
        page,
        slide,
        theme
      );

      break;


    // ================================================
    // SUMMARY / CONCLUSION
    // ================================================

    case "summary":

    case "conclusion":

      await createSummarySlide(
        page,
        slide,
        theme
      );

      break;


    // ================================================
    // NORMAL CONTENT
    // ================================================

    case "content":

    default:

      await createContentSlide(
        page,
        slide,
        theme
      );

      break;

  }


  // ==================================================
  // SLIDE NUMBER
  // ==================================================

  addSlideNumber(
    page,
    index,
    theme
  );


  return page;
}

// ======================================================
// DETECT EXISTING FLOW CHART
//
// Prevents duplicate flow slides.
//
// Recognizes:
//
// diagram
// flow
// process
// cycle
// workflow
// circular-flow
// ======================================================

function presentationHasFlowChart(
  slides
) {

  return slides.some(
    slide => {

      if (!slide) {
        return false;
      }


      const layout =
        String(
          slide.layout || ""
        )
          .toLowerCase();


      const visualType =
        String(
          slide.visualType || ""
        )
          .toLowerCase();


      const diagramType =
        String(
          slide.diagram?.type || ""
        )
          .toLowerCase();


      if (
        layout === "diagram" ||
        layout === "flow" ||
        layout === "process" ||
        layout === "cycle" ||
        layout === "workflow" ||
        layout === "circular-flow"
      ) {

        return true;

      }


      if (
        visualType === "diagram" ||
        visualType === "flow" ||
        visualType === "process"
      ) {

        return true;

      }


      if (
        diagramType === "flow" ||
        diagramType === "process" ||
        diagramType === "cycle" ||
        diagramType === "circular"
      ) {

        return true;

      }


      if (
        Array.isArray(
          slide.diagram?.steps
        ) &&
        slide.diagram.steps.length >= 2
      ) {

        return true;

      }


      return false;

    }
  );

}


// ======================================================
// AUTOMATIC CIRCULAR FLOW SLIDE
//
// Used only when the AI presentation does NOT
// already contain a diagram.
//
// IMPORTANT:
//
// ✓ Does not remove existing slides
// ✓ Does not modify existing content
// ✓ Uses presentation's existing content
// ✓ Does not invent specific facts
// ======================================================

function createAutomaticFlowSlide(
  presentation,
  slides
) {

  const stages =
    collectFlowStages(
      presentation,
      slides
    );


  if (
    stages.length < 2
  ) {

    return null;

  }


  const topic =
    presentation.title ||
    "Presentation";


  return {

    layout:
      "diagram",


    visualType:
      "diagram",


    title:
      `${topic} — Process Flow`,


    headline:
      "A connected view of the key stages and ideas",


    description:
      presentation.description ||
      presentation.subtitle ||
      "A visual overview showing how the major ideas connect.",


    keyTakeaway:
      "Each stage contributes to the complete process and connects with the next.",


    diagram: {

      type:
        "circular",

      steps:
        stages,

    },


    steps:
      stages,


    imagePrompt:
      `${topic} circular process flow showing the major stages and their relationship`,

  };

}


// ======================================================
// COLLECT FLOW STAGES
//
// Uses existing PPT information.
//
// Priority:
//
// 1. Existing slide points
// 2. Existing slide headlines
// 3. Existing slide titles
//
// Maximum 6 stages.
// ======================================================

function collectFlowStages(
  presentation,
  slides
) {

  const stages = [];


  // ==================================================
  // FIRST TRY IMPORTANT POINTS
  // ==================================================

  for (
    const slide
    of slides
  ) {

    if (
      stages.length >= 6
    ) {

      break;

    }


    if (!slide) {
      continue;
    }


    const points =
      normalizePoints(

        slide.points ||

        slide.bullets ||

        slide.items ||

        []

      );


    for (
      const point
      of points
    ) {

      if (
        stages.length >= 6
      ) {

        break;

      }


      addUniqueFlowStage(
        stages,
        point
      );

    }

  }


  // ==================================================
  // THEN USE HEADLINES
  // ==================================================

  if (
    stages.length < 4
  ) {

    for (
      const slide
      of slides
    ) {

      if (
        stages.length >= 6
      ) {

        break;

      }


      if (
        slide?.headline
      ) {

        addUniqueFlowStage(

          stages,

          slide.headline

        );

      }

    }

  }


  // ==================================================
  // THEN USE SLIDE TITLES
  // ==================================================

  if (
    stages.length < 4
  ) {

    for (
      const slide
      of slides
    ) {

      if (
        stages.length >= 6
      ) {

        break;

      }


      if (
        slide?.title &&
        !isGenericFlowTitle(
          slide.title
        )
      ) {

        addUniqueFlowStage(

          stages,

          slide.title

        );

      }

    }

  }


  // ==================================================
  // PRESENTATION LEVEL FALLBACK
  // ==================================================

  if (
    stages.length < 2
  ) {

    if (
      presentation.subtitle
    ) {

      addUniqueFlowStage(

        stages,

        presentation.subtitle

      );

    }


    if (
      presentation.description
    ) {

      const descriptionPoints =
        splitIntoUsefulPoints(

          presentation.description

        );


      descriptionPoints.forEach(
        point => {

          if (
            stages.length < 6
          ) {

            addUniqueFlowStage(

              stages,

              point

            );

          }

        }
      );

    }

  }


  return stages
    .slice(
      0,
      6
    );

}


// ======================================================
// ADD UNIQUE FLOW STAGE
// ======================================================

function addUniqueFlowStage(
  stages,
  value
) {

  if (!value) {
    return;
  }


  const cleaned =
    trimText(
      String(value).trim(),
      65
    );


  if (!cleaned) {
    return;
  }


  const exists =
    stages.some(
      stage =>
        stage
          .toLowerCase() ===
        cleaned
          .toLowerCase()
    );


  if (!exists) {

    stages.push(
      cleaned
    );

  }

}


// ======================================================
// GENERIC FLOW TITLE CHECK
// ======================================================

function isGenericFlowTitle(
  title
) {

  const value =
    String(
      title || ""
    )
      .toLowerCase();


  return (

    value.includes(
      "introduction"
    ) ||

    value.includes(
      "thank you"
    ) ||

    value.includes(
      "summary"
    ) ||

    value.includes(
      "conclusion"
    ) ||

    value.includes(
      "key takeaway"
    )

  );

}


// ======================================================
// SUMMARY DETECTOR
//
// Allows automatic flow slide to be inserted BEFORE
// the final summary/conclusion.
// ======================================================

function isSummaryLikeSlide(
  slide
) {

  if (!slide) {
    return false;
  }


  const layout =
    String(
      slide.layout || ""
    )
      .toLowerCase();


  const title =
    String(
      slide.title || ""
    )
      .toLowerCase();


  return (

    layout === "summary" ||

    layout === "conclusion" ||

    title.includes(
      "summary"
    ) ||

    title.includes(
      "conclusion"
    ) ||

    title.includes(
      "key takeaway"
    ) ||

    title.includes(
      "thank you"
    )

  );

}

// ======================================================
// BACKGROUND
// ======================================================

function applyPremiumBackground(

  page,

  theme,

  index

) {

  page.background = {

    color:
      cleanColor(

        theme.colors.background ||
        "FFFFFF"

      ),

  };


  // Reference templates own the entire visual canvas.
  // Do not add Nyxora Original's multicolour bar or dots
  // to reference-driven slides.
  if (
    theme?.templateId &&
    theme.templateId !== "nyxoraOriginal"
  ) {
    return;
  }


  // Keep the premium multicolour line ONLY
  // at the very top of the slide.

  addGradientBar(page);


  if (index !== 0) {

    addSlideDecorations(

      page,

      theme,

      index

    );

  }

}


// ======================================================
// TOP MULTICOLOUR LINE
//
// IMPORTANT:
//
// This is the ONLY multicolour line used.
// No multicolour line is added inside image cards.
// ======================================================

function addGradientBar(page) {

  const svg = `

<svg

xmlns="http://www.w3.org/2000/svg"

width="1600"

height="40"

viewBox="0 0 1600 40"

>


<defs>


<linearGradient

id="premium"

x1="0"

y1="0"

x2="1600"

y2="0"

gradientUnits="userSpaceOnUse"

>


<stop

offset="0%"

stop-color="#2563EB"

/>


<stop

offset="25%"

stop-color="#06B6D4"

/>


<stop

offset="50%"

stop-color="#22C55E"

/>


<stop

offset="75%"

stop-color="#EAB308"

/>


<stop

offset="100%"

stop-color="#F97316"

/>


</linearGradient>


</defs>


<rect

width="1600"

height="40"

fill="url(#premium)"

/>


</svg>

`;


  page.addImage({

    data:
      svgToDataUri(svg),

    x:
      0,

    y:
      0,

    w:
      SLIDE_WIDTH,

    h:
      0.12,

  });

}


// ======================================================
// SLIDE DECORATION SYSTEM
//
// Gives inner slides at least two subtle decorative
// points/elements without disturbing content.
// ======================================================

function addSlideDecorations(

  page,

  theme,

  index

) {

  if (index % 2 === 0) {


    addDotCluster(

      page,

      0.28,

      6.05,

      theme

    );


    addAccentPill(

      page,

      12.98,

      1.15,

      0.08,

      0.88,

      "F97316"

    );


  } else {


    addDotCluster(

      page,

      11.75,

      6.05,

      theme

    );


    addAccentPill(

      page,

      0.22,

      1.2,

      0.08,

      0.88,

      "2563EB"

    );

  }

}


// ======================================================
// DOT DECORATION
// ======================================================

function addDotDecoration(

  page,

  theme

) {

  addDotCluster(

    page,

    11.1,

    6.25,

    theme

  );

}


// ======================================================
// DOT CLUSTER
// ======================================================

function addDotCluster(

  page,

  startX,

  startY,

  theme

) {

  const color =
    cleanColor(

      theme.colors.accent ||
      "2563EB"

    );


  for (
    let row = 0;
    row < 4;
    row++
  ) {


    for (
      let col = 0;
      col < 5;
      col++
    ) {


      page.addShape(

        "ellipse",

        {

          x:
            startX +
            col * 0.15,

          y:
            startY +
            row * 0.15,

          w:
            0.035,

          h:
            0.035,


          fill: {

            color,

            transparency:
              55,

          },


          line: {

            transparency:
              100,

          },

        }

      );

    }

  }

}


// ======================================================
// ACCENT PILL
// ======================================================

function addAccentPill(

  page,

  x,

  y,

  w,

  h,

  color

) {

  page.addShape(

    "roundRect",

    {

      x,

      y,

      w,

      h,


      rectRadius:
        0.04,


      fill: {

        color,

      },


      line: {

        transparency:
          100,

      },

    }

  );

}


// ======================================================
// COVER SLIDE
// ======================================================

async function createTitleSlide(

  page,

  slide,

  presentation,

  theme

) {


  addDotCluster(

    page,

    0.3,

    6.02,

    theme

  );


  addAccentPill(

    page,

    12.98,

    1.2,

    0.08,

    0.85,

    "F97316"

  );



  // ==================================================
  // TITLE
  // ==================================================

  page.addText(

    slide.title ||
    presentation.title ||
    "Nyxora AI Presentation",

    {

      x:
        0.85,

      y:
        1.2,

      w:
        5.35,

      h:
        1.15,


      fontSize:
        40,

      bold:
        true,


      color:
        cleanColor(
          theme.colors.text
        ),


      margin:
        0,


      fit:
        "shrink",

    }

  );



  // ==================================================
  // SUBTITLE
  // ==================================================

  const subtitle =

    slide.subtitle ||

    presentation.subtitle ||

    presentation.description ||

    "Professional Presentation";


  page.addText(

    trimText(

      subtitle,

      180

    ),

    {

      x:
        0.9,

      y:
        2.6,

      w:
        4.8,

      h:
        0.9,


      fontSize:
        18,


      color:
        cleanColor(
          theme.colors.mutedText
        ),


      margin:
        0,


      fit:
        "shrink",

    }

  );



  // ==================================================
  // COVER IMAGE
  // ==================================================

  const coverPrompt =

    slide.imagePrompt ||

    presentation.imagePrompt ||

    `${
      slide.title ||
      presentation.title ||
      "presentation topic"
    } premium professional presentation photograph`;


  await addGeneratedImageCard(

    page,

    coverPrompt,

    {

      x:
        6.55,

      y:
        1.15,

      w:
        5.65,

      h:
        3.6,

      radius:
        0.22,

    }

  );



  // ==================================================
  // PRESENTED BY / ORGANIZATION / DATE
  // ==================================================

  addCoverInformationCard(

    page,

    presentation,

    theme

  );

}


// ======================================================
// COVER INFORMATION CARD
// ======================================================

function addCoverInformationCard(

  page,

  presentation,

  theme

) {


  const presenter =

    presentation.presenter ||

    presentation.author ||

    "Nyxora AI";


  const organization =

    presentation.organization ||

    "Nyxora AI";


  const date =

    presentation.date ||

    getCurrentPresentationDate();



  page.addShape(

    "roundRect",

    {

      x:
        1.2,

      y:
        5.15,

      w:
        10.8,

      h:
        1.25,


      rectRadius:
        0.08,


      fill: {

        color:
          cleanColor(

            theme.colors.surface ||
            "F8FAFC"

          ),

      },


      line: {

        color:
          "E2E8F0",

        width:
          1,

      },

    }

  );



  addCoverMeta(

    page,

    "PRESENTED BY",

    presenter,

    1.65,

    "2563EB",

    theme

  );


  addCoverMeta(

    page,

    "ORGANIZATION",

    organization,

    5.05,

    "06B6D4",

    theme

  );


  addCoverMeta(

    page,

    "DATE",

    date,

    8.45,

    "22C55E",

    theme

  );

}


// ======================================================
// COVER META ITEM
//
// Presented By → User icon
// Organization → Building icon
// Date → Calendar icon
// ======================================================

function addCoverMeta(
  page,
  label,
  value,
  x,
  accent,
  theme
) {
  const normalizedLabel =
    String(label)
      .toLowerCase();


  let icon =
    "●";


  if (
    normalizedLabel.includes(
      "presented"
    )
  ) {
    icon =
      "👤";
  }


  if (
    normalizedLabel.includes(
      "organization"
    )
  ) {
    icon =
      "▦";
  }


  if (
    normalizedLabel.includes(
      "date"
    )
  ) {
    icon =
      "▣";
  }


  // ==================================================
  // COLOURED CIRCLE
  // ==================================================

  page.addShape(
    "ellipse",
    {
      x,

      y:
        5.42,

      w:
        0.55,

      h:
        0.55,


      fill: {
        color:
          accent,
      },


      line: {
        transparency:
          100,
      },
    }
  );


  // ==================================================
  // ICON INSIDE CIRCLE
  // ==================================================

  page.addText(
    icon,
    {
      x,

      y:
        5.545,

      w:
        0.55,

      h:
        0.2,


      fontSize:
        14,

      bold:
        true,


      color:
        "FFFFFF",

      align:
        "center",

      margin:
        0,
    }
  );


  // ==================================================
  // LABEL
  // ==================================================

  page.addText(
    label,
    {
      x:
        x + 0.72,

      y:
        5.38,

      w:
        1.8,

      h:
        0.18,


      fontSize:
        8,

      bold:
        true,

      charSpacing:
        1,


      color:
        accent,

      margin:
        0,
    }
  );


  // ==================================================
  // VALUE
  // ==================================================

  page.addText(
    trimText(
      value,
      42
    ),
    {
      x:
        x + 0.72,

      y:
        5.68,

      w:
        2.05,

      h:
        0.3,


      fontSize:
        13,

      bold:
        true,


      color:
        cleanColor(
          theme.colors.text
        ),


      margin:
        0,

      fit:
        "shrink",
    }
  );
}


// ======================================================
// COMMON SLIDE HEADER
// ======================================================

function addSlideHeader(

  page,

  slide,

  theme

) {


  addTitleIcon(

    page,

    slide,

    theme

  );



  page.addText(

    slide.title || "",

    {

      x:
        1.15,

      y:
        0.5,

      w:
        10.5,

      h:
        0.48,


      fontSize:
        30,

      bold:
        true,


      color:
        cleanColor(
          theme.colors.text
        ),


      margin:
        0,


      fit:
        "shrink",

    }

  );



  const headline =

    slide.headline ||

    slide.subtitle ||

    "";


  if (headline) {


    page.addText(

      trimText(

        headline,

        160

      ),

      {

        x:
          1.15,

        y:
          1.05,

        w:
          10.1,

        h:
          0.34,


        fontSize:
          14,


        color:
          cleanColor(
            theme.colors.mutedText
          ),


        margin:
          0,


        fit:
          "shrink",

      }

    );

  }

}


// ======================================================
// TITLE ICON
// ======================================================

function addTitleIcon(

  page,

  slide,

  theme

) {


  page.addShape(

    "ellipse",

    {

      x:
        0.55,

      y:
        0.52,

      w:
        0.45,

      h:
        0.45,


      fill: {

        color:
          cleanColor(

            theme.colors.accent ||
            "2563EB"

          ),

      },


      line: {

        transparency:
          100,

      },

    }

  );



  page.addText(

    "✦",

    {

      x:
        0.55,

      y:
        0.61,

      w:
        0.45,

      h:
        0.14,


      fontSize:
        16,

      bold:
        true,

      align:
        "center",


      color:
        "FFFFFF",


      margin:
        0,

    }

  );

}


// ======================================================
// EXACT CUSTOM CONTENT SLIDE
//
// Custom Mode rules:
// ✓ Uses the user's pasted content directly
// ✓ Does not call AI
// ✓ Does not summarize or rewrite
// ✓ Adds only decorative visuals from the existing visual service
// ✓ Does not add filler/flow/comparison content
// ✓ Keeps Nyxora's existing presentation template
// ✓ Converts simple Markdown markers into visual formatting
//   without changing the actual words/content
// ======================================================

// ======================================================
// CUSTOM MARKDOWN RENDERER
//
// The pasted syllabus uses Markdown-like formatting.
// We remove presentation syntax such as **bold**, ## headings,
// `LAB`, and --- separators, but keep the actual content.
// ======================================================

function renderCustomMarkdownLines(
  page,
  lines,
  theme,
  area
) {
  let currentY = area.y;

  const usableLines = lines.map(line => String(line ?? ""));

  for (let index = 0; index < usableLines.length; index++) {
    const originalLine = usableLines[index];
    const trimmed = originalLine.trim();

    if (!trimmed) {
      currentY += 0.12;
      continue;
    }

    // Markdown horizontal rule becomes a Nyxora divider.
    if (/^-{3,}$/.test(trimmed)) {
      page.addShape(
        "line",
        {
          x: area.x,
          y: currentY + 0.02,
          w: area.w,
          h: 0,
          line: {
            color: "CBD5E1",
            width: 0.8,
          },
        }
      );
      currentY += 0.16;
      continue;
    }

    const headingMatch = originalLine.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);

    if (headingMatch) {
      const heading = cleanCustomInlineMarkdown(headingMatch[2]);

      page.addText(
        heading,
        {
          x: area.x,
          y: currentY,
          w: area.w,
          h: 0.34,
          fontSize: headingMatch[1].length <= 2 ? 18 : 15,
          bold: true,
          color: cleanColor(theme.colors.text),
          margin: 0,
          fit: "shrink",
        }
      );

      currentY += headingMatch[1].length <= 2 ? 0.42 : 0.34;
      continue;
    }

    const cleaned = cleanCustomMarkdownLine(originalLine);

    if (!cleaned) {
      currentY += 0.08;
      continue;
    }

    const isBullet = /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(originalLine);
    const isFooter = /^\s*\*?Footer:/i.test(originalLine);

    const fontSize = isFooter ? 9 : isBullet ? 12.5 : 12;
    const lineHeight = isFooter ? 0.26 : isBullet ? 0.42 : 0.38;

    if (isBullet) {
      const bulletMatch = originalLine.match(/^(\s*)([-*+]\s+|\d+[.)]\s+)(.*)$/);
      const prefix = bulletMatch ? bulletMatch[2] : "";
      const content = bulletMatch ? bulletMatch[3] : cleaned;
      const visiblePrefix = /^\d/.test(prefix)
        ? prefix
        : "• ";

      page.addText(
        [
          {
            text: visiblePrefix,
            options: {
              bold: true,
            },
          },
          ...customInlineRuns(content),
        ],
        {
          x: area.x + 0.05,
          y: currentY,
          w: area.w - 0.1,
          h: lineHeight,
          fontSize,
          color: cleanColor(theme.colors.text),
          margin: 0,
          breakLine: false,
          fit: "shrink",
          valign: "mid",
        }
      );
    } else {
      page.addText(
        customInlineRuns(cleaned),
        {
          x: area.x,
          y: currentY,
          w: area.w,
          h: lineHeight,
          fontSize,
          color: cleanColor(theme.colors.text),
          margin: 0,
          fit: "shrink",
          valign: "mid",
        }
      );
    }

    currentY += lineHeight;

    // Keep content inside the Nyxora card. The source itself is never
    // deleted; if an unusually large single slide is supplied, PowerPoint
    // is allowed to shrink the text inside the line boxes.
    if (currentY > area.y + area.h) {
      currentY = area.y + area.h;
    }
  }
}


function cleanCustomMarkdownLine(line) {
  return cleanCustomInlineMarkdown(
    String(line ?? "")
      .replace(/^\s{0,3}#{1,6}\s+/, "")
      .replace(/\s+#+\s*$/, "")
      .replace(/^\s*\*Footer:/i, "Footer:")
      .replace(/\*\s*$/, "")
      .trim()
  );
}


function cleanCustomInlineMarkdown(value) {
  return String(value ?? "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .trim();
}


function customInlineRuns(value) {
  const text = String(value ?? "");
  const runs = [];
  let cursor = 0;
  const pattern = /(\*\*|__)(.+?)\1|`([^`]+)`/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      runs.push({
        text: cleanCustomInlineMarkdown(text.slice(cursor, match.index)),
      });
    }

    if (match[3] !== undefined) {
      runs.push({
        text: match[3],
        options: {
          fontFace: "Courier New",
        },
      });
    } else {
      runs.push({
        text: match[2],
        options: {
          bold: true,
        },
      });
    }

    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    runs.push({
      text: cleanCustomInlineMarkdown(text.slice(cursor)),
    });
  }

  if (runs.length === 0) {
    return [
      {
        text: cleanCustomInlineMarkdown(text),
      },
    ];
  }

  return runs.filter(run => run.text !== "");
}


// ======================================================
// CONTENT SLIDE
//
// Adaptive layouts:
//
// LOW CONTENT
// → large wide image
//
// MEDIUM CONTENT
// → square image
//
// HIGH CONTENT
// → vertical rectangular image
//
// Every content slide gets:
// ✓ content card
// ✓ image
// ✓ supporting card
// ======================================================

async function createContentSlide(

  page,

  slide,

  theme

) {


  addSlideHeader(

    page,

    slide,

    theme

  );



  const points =

    enrichPoints(

      normalizePoints(

        slide.points ||

        slide.bullets ||

        slide.items ||

        []

      ),

      slide

    );



  const imageShape =

    chooseImageShape(

      points.length,

      slide

    );



  // ==================================================
  // WIDE IMAGE LAYOUT
  // ==================================================

  if (
    imageShape ===
    "wide"
  ) {


    addContentPanel(

      page,

      0.7,

      1.55,

      4.75,

      5.0,

      theme

    );


    renderNumberPoints(

      page,

      points,

      theme,

      {

        x:
          1.0,

        y:
          1.95,

textWidth:
  3.35,

maxPoints:
  5,

maxHeight:
  4.15,

      }

    );



    await addGeneratedImageCard(

      page,

      buildHighQualityImagePrompt(
        slide
      ),

      {

        x:
          5.85,

        y:
          1.65,

        w:
          6.4,

        h:
          3.55,

        radius:
          0.18,

      }

    );



    addSmallInsightCard(

      page,

      slide,

      5.85,

      5.45,

      6.4,

      theme

    );


    return;

  }



  // ==================================================
  // SQUARE IMAGE LAYOUT
  // ==================================================

  if (
    imageShape ===
    "square"
  ) {


    addContentPanel(

      page,

      0.7,

      1.55,

      6.45,

      5.0,

      theme

    );


    renderNumberPoints(

      page,

      points,

      theme,

      {

        x:
          1.0,

        y:
          1.95,

textWidth:
  4.95,

maxPoints:
  5,

maxHeight:
  4.15,
      }

    );



    await addGeneratedImageCard(

      page,

      buildHighQualityImagePrompt(
        slide
      ),

      {

        x:
          7.65,

        y:
          1.75,

        w:
          4.25,

        h:
          4.25,

        radius:
          0.18,

      }

    );



    addSmallInsightCard(

      page,

      slide,

      7.65,

      6.15,

      4.25,

      theme

    );


    return;

  }



  // ==================================================
  // PORTRAIT / TALL RECTANGLE IMAGE LAYOUT
  // ==================================================

  addContentPanel(

    page,

    0.7,

    1.55,

    6.0,

    5.0,

    theme

  );


  renderNumberPoints(

    page,

    points,

    theme,

    {

      x:
        1.0,

      y:
        1.95,

textWidth:
  4.55,

maxPoints:
  5,

maxHeight:
  4.15,

    }

  );



  await addGeneratedImageCard(

    page,

    buildHighQualityImagePrompt(
      slide
    ),

    {

      x:
        7.2,

      y:
        1.65,

      w:
        5.0,

      h:
        4.55,

      radius:
        0.18,

    }

  );



  addSmallInsightCard(

    page,

    slide,

    7.2,

    6.3,

    5.0,

    theme

  );

}


// ======================================================
// CHOOSE IMAGE SHAPE
// ======================================================

function chooseImageShape(

  pointCount,

  slide

) {


  const requested =

    slide.imageShape ||

    slide.visualShape ||

    "";


  if (

    requested === "wide" ||

    requested === "square" ||

    requested === "portrait"

  ) {

    return requested;

  }


  // Low content:
  // use a large cinematic horizontal visual.

  if (
    pointCount <= 2
  ) {

    return "wide";

  }


  // Medium content:
  // balanced square visual.

  if (
    pointCount === 3
  ) {

    return "square";

  }


  // More text:
  // keep more horizontal space for content.

  return "portrait";

}


// ======================================================
// CONTENT PANEL
// ======================================================

function addContentPanel(

  page,

  x,

  y,

  w,

  h,

  theme

) {


  page.addShape(

    "roundRect",

    {

      x,

      y,

      w,

      h,


      rectRadius:
        0.08,


      fill: {

        color:
          cleanColor(

            theme.colors.surface ||
            "F8FAFC"

          ),

      },


      line: {

        color:
          "E2E8F0",

        width:
          1,

      },


      shadow: {

        type:
          "outer",

        color:
          "64748B",

        opacity:
          0.08,

        blur:
          2,

        angle:
          45,

        distance:
          1,

      },

    }

  );

}


// ======================================================
// SMALL INSIGHT CARD
// ======================================================

function addSmallInsightCard(

  page,

  slide,

  x,

  y,

  w,

  theme

) {


  const text =

    slide.keyTakeaway ||

    slide.description ||

    slide.headline ||

    "A focused visual summary of the slide's central idea.";



  page.addShape(

    "roundRect",

    {

      x,

      y,

      w,

      h:
        0.62,


      rectRadius:
        0.06,


      fill: {

        color:
          cleanColor(

            theme.colors.surface ||
            "F8FAFC"

          ),

      },


      line: {

        color:
          "E2E8F0",

        width:
          1,

      },

    }

  );



  page.addText(

    trimText(

      text,

      120

    ),

    {

      x:
        x + 0.22,

      y:
        y + 0.15,

      w:
        w - 0.44,

      h:
        0.28,


      fontSize:
        11,


      color:
        cleanColor(
          theme.colors.text
        ),


      margin:
        0,


      fit:
        "shrink",

    }

  );

}


// ======================================================
// NUMBERED POINT BUBBLE SYSTEM
//
// DESIGN:
//
// ┌───────────────────────────────────────────────┐
// │ │  (1)  ✦  Point text                       │
// │ │                                             │
// └───────────────────────────────────────────────┘
//
// ✓ Number circle INSIDE bubble
// ✓ Matching vertical accent line
// ✓ Context icon before text
// ✓ Separate bubbles
// ✓ Consistent connected visual system
// ======================================================

// ======================================================
// NUMBERED POINT BUBBLE SYSTEM
//
// ADAPTIVE VERSION
//
// ✓ Bubble height adapts to text
// ✓ Text remains inside bubble
// ✓ Total point group stays inside parent panel
// ✓ Numbering preserved
// ✓ Icons preserved
// ✓ Existing colors/theme preserved
// ======================================================

// ======================================================
// DYNAMIC NUMBERED POINT BUBBLES
//
// Each bubble has its OWN height.
// Height is calculated from the text length.
// Long text gets more vertical space.
// Short text stays compact.
// Text is top-aligned and kept inside the bubble.
// ======================================================

function renderNumberPoints(
  page,
  points,
  theme,
  options = {}
) {

  const {
    x = 0.8,
    y = 1.8,
    textWidth = 5.2,
    maxPoints = 5,
    startNumber = 1,
    maxHeight = 4.15,
  } = options;


  const normalizedPoints =
    normalizePoints(points)
      .slice(
        0,
        maxPoints
      );


  if (
    normalizedPoints.length === 0
  ) {
    return;
  }


  // ==================================================
  // BASIC LAYOUT
  // ==================================================

  const bubbleWidth =
    textWidth + 0.8;


  const gap =
    0.10;


  const minBubbleHeight =
    0.68;


  const horizontalPadding =
    0.02;


  const topPadding =
    0.12;


  const bottomPadding =
    0.12;


  let currentY =
    y;


  let usedHeight =
    0;


  // ==================================================
  // CALCULATE EACH BUBBLE INDEPENDENTLY
  // ==================================================

  normalizedPoints.forEach(
    (point, index) => {

      const text =
        String(
          point || ""
        ).trim();


      const color =
        COLORS[
          index %
          COLORS.length
        ];


      // ==================================================
      // ESTIMATE REALISTIC WRAPPING
      //
      // PowerPoint wraps based on available width and
      // font size, so use a conservative estimate.
      // ==================================================

      const usableTextWidth =
        Math.max(
          2.0,
          textWidth -
          0.15
        );


      const charactersPerLine =
        Math.max(
          18,
          Math.floor(
            usableTextWidth *
            8.5
          )
        );


      const estimatedLines =
        Math.max(
          1,
          Math.ceil(
            text.length /
            charactersPerLine
          )
        );


      // ==================================================
      // OWN BUBBLE HEIGHT
      // ==================================================

      let bubbleHeight =
        minBubbleHeight +
        (
          Math.min(
            estimatedLines,
            8
          ) - 1
        ) *
        0.22;


      // Extra room for long explanations.

      bubbleHeight =
        Math.max(
          minBubbleHeight,
          bubbleHeight
        );


      // ==================================================
      // FONT SIZE
      //
      // Determined separately for this bubble.
      // ==================================================

      let fontSize =
        13;


      if (
        estimatedLines >= 7
      ) {

        fontSize =
          9.5;

      }

      else if (
        estimatedLines >= 6
      ) {

        fontSize =
          10;

      }

      else if (
        estimatedLines >= 5
      ) {

        fontSize =
          10.5;

      }

      else if (
        estimatedLines >= 4
      ) {

        fontSize =
          11;

      }

      else if (
        estimatedLines >= 3
      ) {

        fontSize =
          11.5;

      }

      else if (
        estimatedLines === 2
      ) {

        fontSize =
          12.5;

      }


      // ==================================================
      // CHECK REMAINING PANEL SPACE
      // ==================================================

      const remainingHeight =
        maxHeight -
        usedHeight;


      const remainingPoints =
        normalizedPoints.length -
        index;


      /*
       * Reserve enough space for the remaining points.
       * Only THIS bubble is reduced if necessary.
       */

      const minimumRemainingHeight =
        Math.max(
          0,
          remainingPoints - 1
        ) *
        (
          minBubbleHeight +
          gap
        );


      const maximumAvailableForCurrent =
        Math.max(
          minBubbleHeight,
          remainingHeight -
          minimumRemainingHeight
        );


      bubbleHeight =
        Math.min(
          bubbleHeight,
          maximumAvailableForCurrent
        );


      // ==================================================
      // MAIN BUBBLE
      // ==================================================

      page.addShape(
        "roundRect",
        {
          x:
            x,

          y:
            currentY,

          w:
            bubbleWidth,

          h:
            bubbleHeight,

          rectRadius:
            0.07,

          fill: {
            color:
              cleanColor(
                theme.colors.surface ||
                "FFFFFF"
              ),
          },

          line: {
            color:
              "E2E8F0",

            width:
              0.8,
          },

          shadow: {
            type:
              "outer",

            color:
              "64748B",

            opacity:
              0.06,

            blur:
              1.5,

            angle:
              45,

            distance:
              0.7,
          },
        }
      );


      // ==================================================
      // ACCENT LINE
      // ==================================================

      page.addShape(
        "roundRect",
        {
          x:
            x + 0.08,

          y:
            currentY + 0.08,

          w:
            0.06,

          h:
            Math.max(
              0.10,
              bubbleHeight -
              0.16
            ),

          rectRadius:
            0.025,

          fill: {
            color,
          },

          line: {
            transparency:
              100,
          },
        }
      );


      // ==================================================
      // NUMBER CIRCLE
      // ==================================================

      const circleSize =
        Math.min(
          0.46,
          bubbleHeight -
          0.20
        );


      const circleY =
        currentY +
        Math.max(
          0.10,
          (
            bubbleHeight -
            circleSize
          ) / 2
        );


      page.addShape(
        "ellipse",
        {
          x:
            x + 0.25,

          y:
            circleY,

          w:
            circleSize,

          h:
            circleSize,

          fill: {
            color,
          },

          line: {
            transparency:
              100,
          },
        }
      );


      page.addText(
        String(
          startNumber +
          index
        ),
        {
          x:
            x + 0.25,

          y:
            circleY +
            0.14,

          w:
            circleSize,

          h:
            0.12,

          fontSize:
            10.5,

          bold:
            true,

          color:
            "FFFFFF",

          align:
            "center",

          margin:
            0,
        }
      );


      // ==================================================
      // CONTEXT ICON
      // ==================================================

      const pointIcon =
        getPointIcon(
          point,
          index
        );


      page.addText(
        pointIcon,
        {
          x:
            x + 0.84,

          y:
            currentY +
            Math.max(
              0.12,
              (
                bubbleHeight -
                0.25
              ) / 2
            ),

          w:
            0.34,

          h:
            0.25,

          fontSize:
            13,

          bold:
            true,

          color,

          align:
            "center",

          margin:
            0,
        }
      );


      // ==================================================
      // TEXT
      //
      // IMPORTANT:
      // Top aligned instead of vertically centered.
      // This prevents the first lines from escaping.
      // ==================================================

      page.addText(
        trimText(
          text,
          220
        ),
        {
          x:
            x + 1.30,

          y:
            currentY +
            topPadding,

          w:
            bubbleWidth -
            1.45,

          h:
            Math.max(
              0.36,
              bubbleHeight -
              topPadding -
              bottomPadding
            ),

          fontSize,

          color:
            cleanColor(
              theme.colors.text
            ),

          valign:
            "top",

          margin:
            horizontalPadding,

          breakLine:
            true,

          fit:
            "shrink",
        }
      );


      // ==================================================
      // NEXT BUBBLE
      //
      // Uses THIS bubble's actual height.
      // ==================================================

      currentY +=
        bubbleHeight +
        gap;


      usedHeight +=
        bubbleHeight +
        gap;

    }
  );

}

// ======================================================
// SMART POINT ICON
//
// Gives heading/point text a contextual symbol.
// ======================================================

function getPointIcon(
  point,
  index = 0
) {
  const text =
    String(
      point || ""
    ).toLowerCase();


  if (
    text.includes("idea") ||
    text.includes("insight") ||
    text.includes("innovation")
  ) {
    return "💡";
  }


  if (
    text.includes("user") ||
    text.includes("people") ||
    text.includes("student") ||
    text.includes("customer") ||
    text.includes("team")
  ) {
    return "👤";
  }


  if (
    text.includes("organization") ||
    text.includes("company") ||
    text.includes("business")
  ) {
    return "▦";
  }


  if (
    text.includes("date") ||
    text.includes("time") ||
    text.includes("schedule")
  ) {
    return "◷";
  }


  if (
    text.includes("growth") ||
    text.includes("result") ||
    text.includes("performance")
  ) {
    return "↗";
  }


  if (
    text.includes("security") ||
    text.includes("protect") ||
    text.includes("safe")
  ) {
    return "◆";
  }


  if (
    text.includes("process") ||
    text.includes("workflow") ||
    text.includes("step")
  ) {
    return "➜";
  }


  if (
    text.includes("goal") ||
    text.includes("target")
  ) {
    return "◎";
  }


  if (
    text.includes("data") ||
    text.includes("analytics") ||
    text.includes("report")
  ) {
    return "▥";
  }


  const defaults = [
    "✦",
    "◆",
    "●",
    "➜",
    "✓",
  ];


  return defaults[
    index %
    defaults.length
  ];
}


// ======================================================
// IMAGE CARD SYSTEM
//
// IMPORTANT FIX:
//
// OLD:
//
// outer card
//    ↓
// image
//    ↓
// blue/cyan coloured lines
//
// NEW:
//
// rounded cropped image itself = card
//
// Therefore:
//
// ✓ no coloured line underneath
// ✓ no white frame around image
// ✓ no visible image/card mismatch
// ✓ rounded corners are part of image
// ✓ crop-to-cover prevents stretching
// ======================================================

async function addGeneratedImageCard(

  page,

  prompt,

  box

) {


  try {


    const visual =

      await generateSlideVisual({

        visualType:
          "image",

        prompt,

        // PPT presentations use the existing Pexels pipeline.
        // Image Studio generation remains unchanged elsewhere.
        source:
          "pexels",

      });



    const prepared =

      prepareVisualForPpt(

        visual

      );



    if (
      !prepared?.data
    ) {

      return false;

    }



    const cardImage =

      await createImageCardData(

        prepared.data,

        box.w,

        box.h,

        box.radius ||
        0.18

      );



    page.addImage({

      data:

        cardImage ||

        prepared.data,


      x:
        box.x,

      y:
        box.y,

      w:
        box.w,

      h:
        box.h,

    });



    return true;


  } catch (error) {


    console.error(

      "Image generation failed",

      error

    );


    return false;

  }

}


// ======================================================
// CREATE ROUNDED IMAGE CARD
//
// This function:
//
// 1. loads generated image
// 2. crops it to target aspect ratio
// 3. clips actual pixels to rounded rectangle
// 4. exports transparent PNG
// 5. inserts that PNG into PowerPoint
//
// Result:
//
// Image itself has rounded corners.
// ======================================================

async function createImageCardData(

  dataUri,

  targetWidth,

  targetHeight,

  radiusRatio = 0.18

) {


  if (

    typeof document ===
      "undefined" ||

    typeof Image ===
      "undefined"

  ) {

    return dataUri;

  }


  try {


    const image =

      await loadImage(

        dataUri

      );



    const canvas =

      document.createElement(

        "canvas"

      );



    const canvasWidth =
      1600;



    const canvasHeight =

      Math.max(

        600,

        Math.round(

          canvasWidth *

          (

            targetHeight /

            targetWidth

          )

        )

      );



    canvas.width =
      canvasWidth;


    canvas.height =
      canvasHeight;



    const ctx =

      canvas.getContext(

        "2d"

      );



    if (!ctx) {

      return dataUri;

    }



    const radius =

      Math.min(

        canvasWidth,

        canvasHeight

      ) *

      Math.min(

        radiusRatio,

        0.12

      );



    roundedRectPath(

      ctx,

      0,

      0,

      canvasWidth,

      canvasHeight,

      radius

    );



    ctx.clip();



    drawImageCover(

      ctx,

      image,

      canvasWidth,

      canvasHeight

    );



    return canvas.toDataURL(

      "image/png",

      1

    );


  } catch (error) {


    console.warn(

      "Rounded image conversion failed:",

      error

    );


    return dataUri;

  }

}


// ======================================================
// LOAD IMAGE
// ======================================================

function loadImage(src) {

  return new Promise(

    (
      resolve,
      reject
    ) => {


      const image =

        new Image();



      image.onload =

        () =>

          resolve(image);



      image.onerror =

        reject;



      image.src =

        src;

    }

  );

}


// ======================================================
// CROP IMAGE TO COVER
//
// Similar to CSS:
//
// object-fit: cover
//
// This prevents stretched images.
// ======================================================

function drawImageCover(

  ctx,

  image,

  targetWidth,

  targetHeight

) {


  const sourceWidth =

    image.naturalWidth ||

    image.width;



  const sourceHeight =

    image.naturalHeight ||

    image.height;



  const sourceRatio =

    sourceWidth /

    sourceHeight;



  const targetRatio =

    targetWidth /

    targetHeight;



  let sx = 0;

  let sy = 0;

  let sw =
    sourceWidth;

  let sh =
    sourceHeight;



  if (

    sourceRatio >

    targetRatio

  ) {


    sw =

      sourceHeight *

      targetRatio;


    sx =

      (

        sourceWidth -

        sw

      ) /

      2;


  } else {


    sh =

      sourceWidth /

      targetRatio;


    sy =

      (

        sourceHeight -

        sh

      ) /

      2;

  }



  ctx.drawImage(

    image,

    sx,

    sy,

    sw,

    sh,

    0,

    0,

    targetWidth,

    targetHeight

  );

}


// ======================================================
// ROUNDED RECTANGLE CLIPPING PATH
// ======================================================

function roundedRectPath(

  ctx,

  x,

  y,

  width,

  height,

  radius

) {


  const r =

    Math.min(

      radius,

      width / 2,

      height / 2

    );



  ctx.beginPath();



  ctx.moveTo(

    x + r,

    y

  );



  ctx.lineTo(

    x + width - r,

    y

  );



  ctx.quadraticCurveTo(

    x + width,

    y,

    x + width,

    y + r

  );



  ctx.lineTo(

    x + width,

    y + height - r

  );



  ctx.quadraticCurveTo(

    x + width,

    y + height,

    x + width - r,

    y + height

  );



  ctx.lineTo(

    x + r,

    y + height

  );



  ctx.quadraticCurveTo(

    x,

    y + height,

    x,

    y + height - r

  );



  ctx.lineTo(

    x,

    y + r

  );



  ctx.quadraticCurveTo(

    x,

    y,

    x + r,

    y

  );



  ctx.closePath();

}


// ======================================================
// HIGH QUALITY IMAGE PROMPT
//
// Your backend remains responsible for image generation.
// This only improves what this PPT service asks it for.
// ======================================================

function buildHighQualityImagePrompt(

  slide

) {


  const original =

    slide.imagePrompt ||

    slide.title ||

    slide.headline ||

    "educational presentation topic";



  return `

${original}

Create one premium presentation visual.

Requirements:

- high resolution
- extremely sharp subject
- clean professional composition
- realistic or polished educational visual
- professional lighting
- strong subject clarity
- presentation-ready framing
- balanced composition
- visually meaningful to the exact topic
- modern editorial quality
- premium keynote presentation quality

Image framing:

- keep important subjects away from extreme edges
- leave safe cropping area
- image may be cropped into a wide rectangle
- image may be cropped into a square
- image may be cropped into a portrait rectangle
- main subject must remain clearly visible after cropping

Do NOT include:

- text
- captions
- labels
- logos
- watermark
- UI
- decorative coloured bars

`;

}
// ======================================================
// COMPARISON / BEFORE-AFTER SLIDE
//
// FIXES:
//
// ✓ Reads multiple possible AI JSON structures
// ✓ Before content no longer stays empty
// ✓ After content no longer stays empty
// ✓ Before gets its own image
// ✓ After gets its own image
// ✓ Images fit inside their sections
// ✓ Text gets enough space
// ✓ No multicolour line inside image cards
// ======================================================

async function createComparisonSlide(

  page,

  slide,

  theme

) {


  addSlideHeader(

    page,

    slide,

    theme

  );


  const comparison =

    extractComparisonData(

      slide

    );


  // ==================================================
  // BEFORE SIDE
  // ==================================================

  await createComparisonBlock(

    page,

    {

      title:
        comparison.leftTitle,

      points:
        comparison.leftPoints,

      description:
        comparison.leftDescription,

      imagePrompt:
        comparison.leftImagePrompt,

      x:
        0.7,

      accent:
        "2563EB",

      theme,

    }

  );


  // ==================================================
  // AFTER SIDE
  // ==================================================

  await createComparisonBlock(

    page,

    {

      title:
        comparison.rightTitle,

      points:
        comparison.rightPoints,

      description:
        comparison.rightDescription,

      imagePrompt:
        comparison.rightImagePrompt,

      x:
        6.85,

      accent:
        "22C55E",

      theme,

    }

  );

}


// ======================================================
// COMPARISON BLOCK
//
// Layout:
//
// ┌─────────────────────────────┐
// │ BEFORE / AFTER              │
// │                             │
// │ text          image         │
// │ text          image         │
// │ text          image         │
// │                             │
// └─────────────────────────────┘
//
// The image occupies the right side of each card.
// Content remains readable on the left.
// ======================================================

async function createComparisonBlock(

  page,

  {

    title,

    points,

    description,

    imagePrompt,

    x,

    accent,

    theme,

  }

) {


  const safePoints =

    ensureComparisonPoints(

      points,

      description,

      title

    );


  // ==================================================
  // MAIN CARD
  // ==================================================

  page.addShape(

    "roundRect",

    {

      x,

      y:
        1.55,

      w:
        5.75,

      h:
        5.05,


      rectRadius:
        0.08,


      fill: {

        color:
          "F8FAFC",

      },


      line: {

        color:
          accent,

        width:
          1.3,

      },


      shadow: {

        type:
          "outer",

        color:
          "64748B",

        opacity:
          0.07,

        blur:
          2,

        angle:
          45,

        distance:
          1,

      },

    }

  );


  // ==================================================
  // SMALL ACCENT RECTANGLE
  //
  // This is NOT the old image-card multicolour line.
  // It is a simple section marker.
  // ==================================================

  page.addShape(

    "roundRect",

    {

      x:
        x + 0.28,

      y:
        1.88,

      w:
        0.1,

      h:
        0.58,


      rectRadius:
        0.03,


      fill: {

        color:
          accent,

      },


      line: {

        transparency:
          100,

      },

    }

  );


  // ==================================================
  // TITLE
  // ==================================================

  page.addText(

    title,

    {

      x:
        x + 0.58,

      y:
        1.91,

      w:
        2.15,

      h:
        0.32,


      fontSize:
        21,

      bold:
        true,


      color:
        accent,


      margin:
        0,


      fit:
        "shrink",

    }

  );


  // ==================================================
  // BEFORE / AFTER IMAGE
  //
  // Each side generates its own image.
  // Portrait rectangle works better here because
  // enough horizontal space must remain for text.
  // ==================================================

  await addGeneratedImageCard(

    page,

    imagePrompt,

    {

      x:
        x + 3.2,

      y:
        1.88,

      w:
        2.18,

      h:
        4.3,

      radius:
        0.16,

    }

  );


  // ==================================================
  // CONTENT POINTS
  // ==================================================

  safePoints

    .slice(

      0,

      5

    )

    .forEach(

      (item, index) => {


        const currentY =

          2.62 +

          index * 0.66;


        // ----------------------------------------------
        // POINT DOT
        // ----------------------------------------------

        page.addShape(

          "ellipse",

          {

            x:
              x + 0.38,

            y:
              currentY + 0.02,

            w:
              0.22,

            h:
              0.22,


            fill: {

              color:
                accent,

            },


            line: {

              transparency:
                100,

            },

          }

        );


        // ----------------------------------------------
        // CHECK ICON
        // ----------------------------------------------

        page.addText(

          "✓",

          {

            x:
              x + 0.38,

            y:
              currentY + 0.062,

            w:
              0.22,

            h:
              0.08,


            fontSize:
              7,

            bold:
              true,


            align:
              "center",


            color:
              "FFFFFF",


            margin:
              0,

          }

        );


        // ----------------------------------------------
        // POINT TEXT
        // ----------------------------------------------

        page.addText(

          trimText(

            item,

            94

          ),

          {

            x:
              x + 0.75,

            y:
              currentY,

            w:
              2.1,

            h:
              0.38,


            fontSize:
              12,


            color:
              cleanColor(
                theme.colors.text
              ),


            margin:
              0,


            fit:
              "shrink",

          }

        );

      }

    );

}


// ======================================================
// EXTRACT COMPARISON DATA
//
// AI models may return comparison data differently.
//
// This function supports:
//
// slide.leftPoints
// slide.rightPoints
//
// slide.beforePoints
// slide.afterPoints
//
// slide.before
// slide.after
//
// slide.comparison.before
// slide.comparison.after
//
// slide.comparison.left
// slide.comparison.right
//
// before.points
// after.points
//
// before.items
// after.items
//
// before.bullets
// after.bullets
//
// before.description
// after.description
//
// This prevents empty comparison cards.
// ======================================================

function extractComparisonData(

  slide

) {


  const comparison =

    slide.comparison ||

    {};


  const before =

    comparison.before ||

    comparison.left ||

    slide.before ||

    {};


  const after =

    comparison.after ||

    comparison.right ||

    slide.after ||

    {};


  // ==================================================
  // TITLES
  // ==================================================

  const leftTitle =

    slide.leftTitle ||

    slide.beforeTitle ||

    getObjectTitle(

      before

    ) ||

    "Before";


  const rightTitle =

    slide.rightTitle ||

    slide.afterTitle ||

    getObjectTitle(

      after

    ) ||

    "After";


  // ==================================================
  // LEFT POINTS
  // ==================================================

  const leftPoints =

    firstNonEmptyArray(

      slide.leftPoints,

      slide.beforePoints,

      before.points,

      before.items,

      before.bullets,

      comparison.leftPoints,

      comparison.beforePoints

    );


  // ==================================================
  // RIGHT POINTS
  // ==================================================

  const rightPoints =

    firstNonEmptyArray(

      slide.rightPoints,

      slide.afterPoints,

      after.points,

      after.items,

      after.bullets,

      comparison.rightPoints,

      comparison.afterPoints

    );


  // ==================================================
  // DESCRIPTIONS
  // ==================================================

  const leftDescription =

    slide.leftDescription ||

    slide.beforeDescription ||

    before.description ||

    before.text ||

    "";


  const rightDescription =

    slide.rightDescription ||

    slide.afterDescription ||

    after.description ||

    after.text ||

    "";


  // ==================================================
  // IMAGE PROMPTS
  // ==================================================

  const basePrompt =

    slide.imagePrompt ||

    slide.title ||

    "before and after comparison";


  const leftImagePrompt =

    slide.leftImagePrompt ||

    slide.beforeImagePrompt ||

    before.imagePrompt ||

    `

${basePrompt}

Show the BEFORE state clearly.

Requirements:

- realistic professional presentation image
- clearly represent the earlier or less developed state
- meaningful to the exact comparison topic
- strong central subject
- portrait-friendly composition
- high resolution
- clean professional lighting
- no text
- no captions
- no labels
- no watermark

`;


  const rightImagePrompt =

    slide.rightImagePrompt ||

    slide.afterImagePrompt ||

    after.imagePrompt ||

    `

${basePrompt}

Show the AFTER state clearly.

Requirements:

- realistic professional presentation image
- clearly represent the improved, transformed, or later state
- meaningful to the exact comparison topic
- strong central subject
- portrait-friendly composition
- high resolution
- clean professional lighting
- no text
- no captions
- no labels
- no watermark

`;


  return {

    leftTitle,

    rightTitle,


    leftPoints:

      normalizePoints(

        leftPoints

      ),


    rightPoints:

      normalizePoints(

        rightPoints

      ),


    leftDescription,

    rightDescription,

    leftImagePrompt,

    rightImagePrompt,

  };

}


// ======================================================
// ENSURE COMPARISON CONTENT
//
// If AI returned description instead of points,
// convert that description into usable points.
//
// This prevents:
// BEFORE [empty]
// AFTER  [empty]
// ======================================================

function ensureComparisonPoints(

  points,

  description,

  title

) {


  const normalized =

    normalizePoints(

      points

    );


  if (

    normalized.length >
    0

  ) {

    return normalized;

  }


  if (description) {

    return splitIntoUsefulPoints(

      description

    );

  }


  // Last visual fallback.
  //
  // This avoids a completely empty card while
  // remaining generic instead of inventing
  // specific facts about the topic.

  return [

    `${title} state and conditions`,

    `Key characteristics of the ${String(
      title
    ).toLowerCase()} stage`,

    `Important factors visible in this stage`,

  ];

}


// ======================================================
// CIRCULAR FLOW CHART SLIDE
//
// ✓ Generated central circular visual
// ✓ Different colour for every stage
// ✓ Matching stage bubbles
// ✓ Different-colour connecting arrows
// ✓ Existing COLORS palette reused
// ✓ Key Insight with bulb
// ======================================================

async function createDiagramSlide(
  page,
  slide,
  theme
) {

  addSlideHeader(
    page,
    slide,
    theme
  );


  const steps =
    enrichPoints(

      normalizePoints(

        slide.diagram?.steps ||

        slide.steps ||

        slide.points ||

        []

      ),

      slide

    )
      .slice(
        0,
        6
      );


  const flowPrompt =
    buildCircularFlowPrompt(
      slide,
      steps
    );


  // ==================================================
  // LEFT — GENERATED CIRCULAR VISUAL
  // ==================================================

  await addGeneratedImageCard(
    page,
    flowPrompt,
    {
      x:
        0.72,

      y:
        1.55,

      w:
        5.55,

      h:
        5.05,

      radius:
        0.16,
    }
  );


  // ==================================================
  // RIGHT — COLOURED FLOW STAGES
  // ==================================================

  addContentPanel(
    page,
    6.65,
    1.55,
    5.72,
    5.05,
    theme
  );


  renderCircularFlowStages(
    page,
    steps,
    theme,
    {
      x:
        6.95,

      y:
        1.85,

      w:
        5.1,
    }
  );


  // ==================================================
  // KEY INSIGHT
  // ==================================================

  addMiniInfoCard(
    page,
    "KEY INSIGHT",
    slide.keyTakeaway ||
      slide.description ||
      "Every stage connects to the next while contributing to the complete cycle.",
    6.95,
    5.45,
    5.1,
    "EAB308",
    theme
  );

}
// ======================================================
// COLOURED CIRCULAR FLOW STAGES
//
// Each stage:
//
// ┌────────────────────────────────────┐
// │ │ (1)  ✦ Stage                    │
// └────────────────────────────────────┘
//          ↓
//       coloured arrow
//          ↓
// ┌────────────────────────────────────┐
//
// ✓ Number inside bubble
// ✓ Vertical matching line
// ✓ Heading icon
// ✓ Arrow matches stage palette
// ======================================================

function renderCircularFlowStages(
  page,
  steps,
  theme,
  options = {}
) {

  const {
    x = 7,
    y = 1.8,
    w = 5,
  } = options;


  const safeSteps =
    normalizePoints(
      steps
    )
      .slice(
        0,
        5
      );


  safeSteps.forEach(
    (step, index) => {

      const color =
        COLORS[
          index %
          COLORS.length
        ];


      const currentY =
        y +
        index * 0.68;


      // ==================================================
      // STAGE BUBBLE
      // ==================================================

      page.addShape(
        "roundRect",
        {
          x,
          y:
            currentY,

          w,
          h:
            0.55,


          rectRadius:
            0.06,


          fill: {
            color:
              cleanColor(
                theme.colors.surface ||
                "FFFFFF"
              ),
          },


          line: {
            color:
              "E2E8F0",

            width:
              0.8,
          },
        }
      );


      // ==================================================
      // MATCHING VERTICAL LINE
      // ==================================================

      page.addShape(
        "roundRect",
        {
          x:
            x + 0.08,

          y:
            currentY + 0.07,

          w:
            0.055,

          h:
            0.41,


          rectRadius:
            0.02,


          fill: {
            color,
          },


          line: {
            transparency:
              100,
          },
        }
      );


      // ==================================================
      // NUMBER CIRCLE INSIDE
      // ==================================================

      page.addShape(
        "ellipse",
        {
          x:
            x + 0.25,

          y:
            currentY + 0.09,

          w:
            0.37,

          h:
            0.37,


          fill: {
            color,
          },


          line: {
            transparency:
              100,
          },
        }
      );


      page.addText(
        String(
          index + 1
        ),
        {
          x:
            x + 0.25,

          y:
            currentY + 0.185,

          w:
            0.37,

          h:
            0.1,


          fontSize:
            9,

          bold:
            true,

          color:
            "FFFFFF",

          align:
            "center",

          margin:
            0,
        }
      );


      // ==================================================
      // CONTEXT ICON
      // ==================================================

      page.addText(
        getPointIcon(
          step,
          index
        ),
        {
          x:
            x + 0.78,

          y:
            currentY + 0.15,

          w:
            0.3,

          h:
            0.2,

          fontSize:
            13,

          bold:
            true,

          color,

          align:
            "center",

          margin:
            0,
        }
      );


      // ==================================================
      // STAGE TEXT
      // ==================================================

      page.addText(
        trimText(
          step,
          90
        ),
        {
          x:
            x + 1.2,

          y:
            currentY + 0.1,

          w:
            w - 1.42,

          h:
            0.32,


          fontSize:
            11.5,

          bold:
            true,

          color:
            cleanColor(
              theme.colors.text
            ),

          valign:
            "top",

          margin:
            0,

          fit:
            "shrink",
        }
      );


      // ==================================================
      // COLOURED CONNECTING ARROW
      // ==================================================

      if (
        index <
        safeSteps.length - 1
      ) {

        const nextColor =
          COLORS[
            (
              index + 1
            ) %
            COLORS.length
          ];


        page.addText(
          "↓",
          {
            x:
              x + w - 0.5,

            y:
              currentY + 0.52,

            w:
              0.28,

            h:
              0.2,

            fontSize:
              15,

            bold:
              true,

            color:
              nextColor,

            align:
              "center",

            margin:
              0,
          }
        );

      }

    }
  );

}






function buildCircularFlowPrompt(
  slide,
  steps
) {

  const topic =
    slide.imagePrompt ||
    slide.title ||
    "process cycle";


  const stepText =
    steps
      .slice(
        0,
        6
      )
      .map(
        (step, index) =>
          `${
            index + 1
          }. ${step}`
      )
      .join("\n");


  return `

Create a premium circular process-flow visual for a professional PowerPoint presentation.

TOPIC:
${topic}

STAGES:
${stepText}

CREATE A TRUE CIRCULAR FLOW CHART.

Arrange every stage clockwise around one central circular area.

Use this exact presentation colour palette in sequence:

Stage 1: blue #2563EB
Stage 2: cyan #06B6D4
Stage 3: green #22C55E
Stage 4: yellow #EAB308
Stage 5: orange #F97316
Stage 6: blue #2563EB

CONNECTING ARROWS:

- use curved arrows
- arrows must follow the circular direction
- each arrow should visually correspond to the colour of the stage it connects
- arrows must clearly show clockwise progression
- make the cycle visibly connected

STAGE VISUALS:

- give every stage a meaningful visual symbol
- symbols should correspond to the meaning of that stage
- use polished modern icons or realistic visual objects
- keep every stage visually distinct

CENTER:

- use one strong central visual representing the overall topic
- keep the center clean and visually dominant

STYLE:

- premium keynote presentation quality
- clean modern infographic
- professional educational design
- high resolution
- balanced spacing
- strong visual hierarchy
- polished lighting and depth
- landscape composition

IMPORTANT:

- keep the complete circle visible
- keep important elements away from image edges
- allow safe rounded-card cropping
- no paragraphs
- no tiny unreadable labels
- no watermark
- no logo
- no random decorative bars
- no UI screenshot

`;
}


// ======================================================
// DIAGRAM SUPPORTING CARDS
// ======================================================

function addDiagramInsightCards(

  page,

  slide,

  steps,

  theme

) {


  addMiniInfoCard(

    page,

    "KEY INSIGHT",

    slide.keyTakeaway ||

    slide.description ||

    "The stages connect continuously to form one complete process.",

    7.45,

    5.32,

    2.35,

    "2563EB",

    theme

  );


  addMiniInfoCard(

    page,

    "STAGES",

    `${
      steps.length
    } connected stages`,

    10.05,

    5.32,

    2.35,

    "22C55E",

    theme

  );

}


// ======================================================
// MINI INFORMATION CARD
//
// Key Insight:
// ✓ large bulb icon
//
// Other cards:
// ✓ contextual symbol
// ======================================================

function addMiniInfoCard(
  page,
  label,
  text,
  x,
  y,
  w,
  accent,
  theme
) {
  page.addShape(
    "roundRect",
    {
      x,
      y,
      w,

      h:
        1.12,


      rectRadius:
        0.07,


      fill: {
        color:
          cleanColor(
            theme.colors.surface ||
            "F8FAFC"
          ),
      },


      line: {
        color:
          "E2E8F0",

        width:
          1,
      },
    }
  );


  // ==================================================
  // ICON CIRCLE
  // ==================================================

  page.addShape(
    "ellipse",
    {
      x:
        x + 0.2,

      y:
        y + 0.27,

      w:
        0.58,

      h:
        0.58,


      fill: {
        color:
          accent,

        transparency:
          88,
      },


      line: {
        color:
          accent,

        width:
          1,
      },
    }
  );


  // ==================================================
  // LARGE KEY INSIGHT BULB
  // ==================================================

  const isInsight =
    String(label)
      .toLowerCase()
      .includes(
        "insight"
      );


  const icon =
    isInsight
      ? "💡"
      : getPointIcon(
          label,
          0
        );


  page.addText(
    icon,
    {
      x:
        x + 0.2,

      y:
        y + 0.385,

      w:
        0.58,

      h:
        0.25,


      fontSize:
        isInsight
          ? 20
          : 16,


      align:
        "center",

      margin:
        0,
    }
  );


  // ==================================================
  // LABEL
  // ==================================================

  page.addText(
    label,
    {
      x:
        x + 0.95,

      y:
        y + 0.18,

      w:
        w - 1.15,

      h:
        0.18,


      fontSize:
        9,

      bold:
        true,

      charSpacing:
        0.8,


      color:
        accent,

      margin:
        0,
    }
  );


  // ==================================================
  // TEXT
  // ==================================================

  page.addText(
    trimText(
      text,
      100
    ),
    {
      x:
        x + 0.95,

      y:
        y + 0.48,

      w:
        w - 1.15,

      h:
        0.4,


      fontSize:
        11.5,

      bold:
        true,


      color:
        cleanColor(
          theme.colors.text
        ),


      margin:
        0,

      fit:
        "shrink",
    }
  );
}

// ======================================================
// TIMELINE SLIDE
//
// Existing timeline concept preserved.
//
// Improved:
//
// ✓ main timeline card
// ✓ numbered timeline
// ✓ generated image
// ✓ supporting insight card
// ======================================================

async function createTimelineSlide(

  page,

  slide,

  theme

) {


  addSlideHeader(

    page,

    slide,

    theme

  );


  const items =

    enrichPoints(

      normalizePoints(

        slide.timeline ||

        slide.points ||

        []

      ),

      slide

    )

    .slice(

      0,

      6

    );


  // ==================================================
  // TIMELINE CARD
  // ==================================================

  addContentPanel(

    page,

    0.75,

    1.55,

    7.25,

    5.05,

    theme

  );


  // ==================================================
  // VERTICAL TIMELINE LINE
  // ==================================================

  page.addShape(

    "line",

    {

      x:
        1.45,

      y:
        1.95,

      w:
        0,

      h:
        4.0,


      line: {

        color:
          "CBD5E1",

        width:
          2,

      },

    }

  );


  // ==================================================
  // TIMELINE ITEMS
  // ==================================================

  items.forEach(

    (
      item,
      index
    ) => {


      const y =

        1.85 +

        index * 0.67;


      const color =

        COLORS[

          index %

          COLORS.length

        ];


      page.addShape(

        "ellipse",

        {

          x:
            1.24,

          y,

          w:
            0.42,

          h:
            0.42,


          fill: {

            color,

          },


          line: {

            color:
              "FFFFFF",

            width:
              1.3,

          },

        }

      );


      page.addText(

        String(

          index + 1

        ),

        {

          x:
            1.24,

          y:
            y + 0.105,

          w:
            0.42,

          h:
            0.11,


          fontSize:
            10,

          bold:
            true,


          color:
            "FFFFFF",


          align:
            "center",


          margin:
            0,

        }

      );


      page.addText(

        trimText(

          item,

          125

        ),

        {

          x:
            1.95,

          y:
            y - 0.01,

          w:
            5.35,

          h:
            0.42,


          fontSize:
            14,


          color:
            cleanColor(
              theme.colors.text
            ),


          margin:
            0,


          fit:
            "shrink",

        }

      );

    }

  );


  // ==================================================
  // TIMELINE IMAGE
  // ==================================================

  await addGeneratedImageCard(

    page,

    buildHighQualityImagePrompt(

      slide

    ),

    {

      x:
        8.45,

      y:
        1.75,

      w:
        3.75,

      h:
        3.75,

      radius:
        0.18,

    }

  );


  // ==================================================
  // SUPPORTING CARD
  // ==================================================

  addSmallInsightCard(

    page,

    slide,

    8.45,

    5.72,

    3.75,

    theme

  );

}


// ======================================================
// SUMMARY SLIDE
//
// Existing summary feature preserved.
//
// Improved:
//
// ✓ main takeaway card
// ✓ two secondary rectangles
// ✓ generated square image
// ======================================================

async function createSummarySlide(

  page,

  slide,

  theme

) {


  addSlideHeader(

    page,

    {

      ...slide,

      title:

        slide.title ||

        "Key Takeaway",

    },

    theme

  );


  const takeaway =

    slide.keyTakeaway ||

    slide.description ||

    slide.headline ||

    "The most important idea from this presentation.";


  // ==================================================
  // MAIN TAKEAWAY CARD
  // ==================================================

  page.addShape(

    "roundRect",

    {

      x:
        0.8,

      y:
        1.65,

      w:
        6.0,

      h:
        2.05,


      rectRadius:
        0.09,


      fill: {

        color:
          cleanColor(

            theme.colors.surface ||

            "F8FAFC"

          ),

      },


      line: {

        color:
          "E2E8F0",

        width:
          1,

      },

    }

  );


  page.addText(

    trimText(

      takeaway,

      300

    ),

    {

      x:
        1.2,

      y:
        2.08,

      w:
        5.2,

      h:
        1.12,


      fontSize:
        21,

      bold:
        true,


      align:
        "center",

      valign:
        "top",


      color:
        cleanColor(
          theme.colors.text
        ),


      margin:
        0,


      fit:
        "shrink",

    }

  );


  const summaryPoints =

    enrichPoints(

      normalizePoints(

        slide.points ||

        slide.summaryPoints ||

        []

      ),

      slide

    );


  // ==================================================
  // SUMMARY RECTANGLE 1
  // ==================================================

  addSummaryMiniCard(

    page,

    summaryPoints[0] ||

    "Understand the core idea",

    0.8,

    4.05,

    "2563EB",

    theme

  );


  // ==================================================
  // SUMMARY RECTANGLE 2
  // ==================================================

  addSummaryMiniCard(

    page,

    summaryPoints[1] ||

    "Apply the key takeaway",

    3.9,

    4.05,

    "22C55E",

    theme

  );


  // ==================================================
  // SUMMARY IMAGE
  // ==================================================

  await addGeneratedImageCard(

    page,

    buildHighQualityImagePrompt(

      slide

    ),

    {

      x:
        7.35,

      y:
        1.65,

      w:
        4.85,

      h:
        4.85,

      radius:
        0.2,

    }

  );

}


// ======================================================
// SUMMARY MINI CARD
// ======================================================

// ======================================================
// DYNAMIC SUMMARY MINI CARD
//
// Each summary card adapts independently to its text.
// Short text  → compact card
// Long text   → taller card
//
// Text always remains inside the card.
// ======================================================

function addSummaryMiniCard(

  page,

  text,

  x,

  y,

  accent,

  theme

) {

  const safeText =

    String(

      text ||

      ""

    ).trim();



  // ====================================================
  // CARD WIDTH
  // ====================================================

  const cardWidth =
    2.85;



  // ====================================================
  // TEXT WIDTH
  // ====================================================

  const textWidth =
    1.72;



  // ====================================================
  // ESTIMATE WRAPPED LINES
  // ====================================================

  const charactersPerLine =
    20;



  const estimatedLines =

    Math.max(

      1,

      Math.ceil(

        safeText.length /

        charactersPerLine

      )

    );



  // ====================================================
  // DYNAMIC CARD HEIGHT
  // ====================================================

  const minHeight =
    1.30;



  const maxHeight =
    2.35;



  const cardHeight =

    Math.min(

      maxHeight,

      Math.max(

        minHeight,

        0.82 +

        Math.min(

          estimatedLines,

          7

        ) *

        0.20

      )

    );



  // ====================================================
  // CARD
  // ====================================================

  page.addShape(

    "roundRect",

    {

      x,

      y,

      w:
        cardWidth,

      h:
        cardHeight,



      rectRadius:
        0.07,



      fill: {

        color:

          cleanColor(

            theme.colors.surface ||

            "F8FAFC"

          ),

      },



      line: {

        color:

          "E2E8F0",

        width:
          1,

      },

    }

  );



  // ====================================================
  // CHECK CIRCLE
  // ====================================================

  const circleSize =
    0.42;



  const circleY =

    y +

    Math.max(

      0.18,

      (

        cardHeight -

        circleSize

      ) / 2

    );



  page.addShape(

    "ellipse",

    {

      x:
        x + 0.25,

      y:
        circleY,

      w:
        circleSize,

      h:
        circleSize,



      fill: {

        color:
          accent,

      },



      line: {

        transparency:
          100,

      },

    }

  );



  // ====================================================
  // CHECK ICON
  // ====================================================

  page.addText(

    "✓",

    {

      x:
        x + 0.25,

      y:
        circleY + 0.09,

      w:
        circleSize,

      h:
        0.12,



      fontSize:
        11,

      bold:
        true,



      align:
        "center",



      color:
        "FFFFFF",



      margin:
        0,

    }

  );



  // ====================================================
  // ADAPTIVE FONT SIZE
  // ====================================================

  let fontSize =
    14;



  if (

    estimatedLines >= 6

  ) {

    fontSize =
      9.5;

  }

  else if (

    estimatedLines >= 5

  ) {

    fontSize =
      10.5;

  }

  else if (

    estimatedLines >= 4

  ) {

    fontSize =
      11;

  }

  else if (

    estimatedLines >= 3

  ) {

    fontSize =
      12;

  }

  else if (

    estimatedLines === 2

  ) {

    fontSize =
      13;

  }



  // ====================================================
  // TEXT
  //
  // IMPORTANT:
  // Top aligned so the first line always starts inside
  // the card.
  // ====================================================

  page.addText(

    trimText(

      safeText,

      180

    ),

    {

      x:
        x + 0.88,

      y:
        y + 0.20,

      w:
        textWidth,

      h:
        cardHeight - 0.35,



      fontSize,

      bold:
        true,



      valign:
        "top",



      color:

        cleanColor(

          theme.colors.text

        ),



      margin:
        0.02,



      breakLine:
        true,



      fit:
        "shrink",

    }

  );

}


// ======================================================
// CONTENT ENRICHMENT
//
// IMPORTANT:
//
// This does NOT replace existing points.
//
// Existing points always stay.
//
// If a slide contains very little information,
// existing headline / description / takeaway fields
// are reused to fill visual empty space.
// ======================================================

function enrichPoints(

  points,

  slide

) {


  const result =

    normalizePoints(

      points

    );


  const candidates = [

    slide.description,

    slide.headline,

    slide.keyTakeaway,

    slide.subtitle,

  ]

    .filter(Boolean)

    .map(

      value =>

        String(value)

    );


  for (

    const candidate

    of candidates

  ) {


    if (

      result.length >= 3

    ) {

      break;

    }


    if (

      !result.includes(

        candidate

      )

    ) {


      result.push(

        candidate

      );

    }

  }


  return result;

}


// ======================================================
// NORMALIZE POINTS
//
// Supports:
//
// ["point"]
//
// OR
//
// [
//   { text: "point" },
//   { title: "point" },
//   { description: "point" },
//   { label: "point" }
// ]
// ======================================================

function normalizePoints(

  points

) {


  if (

    !Array.isArray(

      points

    )

  ) {

    return [];

  }


  return points

    .map(

      point => {


        if (

          typeof point ===

          "string"

        ) {

          return point;

        }


        if (

          point &&

          typeof point ===

          "object"

        ) {


          return (

            point.text ||

            point.title ||

            point.description ||

            point.label ||

            point.value ||

            ""

          );

        }


        return "";

      }

    )

    .filter(Boolean);

}


// ======================================================
// FIRST NON-EMPTY ARRAY
// ======================================================

function firstNonEmptyArray(

  ...values

) {


  for (

    const value

    of values

  ) {


    if (

      Array.isArray(

        value

      ) &&

      value.length > 0

    ) {


      return value;

    }

  }


  return [];

}


// ======================================================
// GET OBJECT TITLE
// ======================================================

function getObjectTitle(

  value

) {


  if (

    value &&

    typeof value ===

      "object" &&

    !Array.isArray(value)

  ) {


    return (

      value.title ||

      value.label ||

      value.name ||

      ""

    );

  }


  return "";

}


// ======================================================
// SPLIT DESCRIPTION INTO POINTS
//
// Useful when AI gives:
//
// before.description:
// "Old process was manual. Work took longer.
//  Data was fragmented."
//
// instead of:
//
// before.points: [...]
//
// This converts the description into usable items.
// ======================================================

function splitIntoUsefulPoints(

  text

) {


  const value =

    String(

      text ||

      ""

    );


  const pieces =

    value

      .split(

        /[.;]\s+|\n+/g

      )

      .map(

        item =>

          item.trim()

      )

      .filter(Boolean);


  if (

    pieces.length > 0

  ) {


    return pieces.slice(

      0,

      5

    );

  }


  return [

    value,

  ].filter(Boolean);

}


// ======================================================
// SLIDE NUMBER
// ======================================================


// ======================================================
// REFERENCE TEMPLATE DESIGN ENGINE — PREMIUM EDITION
//
// Three distinct editorial systems rebuilt around the supplied
// reference decks. These are not recolors of Nyxora Original.
// They deliberately avoid repetitive rounded-card layouts and
// use photography, typography, negative space, image bands,
// oversized numbering, rules and asymmetric compositions.
//
// 1. Engineering — editorial / architecture / print-magazine
// 2. Aquatic — premium healthcare / fluid photography / waves
// 3. Business — annual-report / corporate / data-editorial
//
// IMPORTANT:
// - Nyxora Original + Modern Classroom remain untouched.
// - Reference templates reuse the current AI slide JSON.
// - PPT visuals continue through the existing Pexels pipeline.
// - No Image Studio call is introduced here.
// - Every reference slide awaits its Pexels image request.
// ======================================================

async function createReferenceTemplateSlide(
  page,
  slide,
  presentation,
  theme,
  layout,
  index
) {
  const templateId = String(theme?.templateId || '').trim().toLowerCase();
  const normalizedLayout = String(layout || slide?.layout || 'content').trim().toLowerCase();

  if (templateId === 'modernclassroom') {
    return renderModernClassroomReferenceSlide(page, slide, presentation, theme, normalizedLayout, index);
  }

  if (templateId === 'engineering') {
    return renderEngineeringReferenceSlide(page, slide, presentation, theme, normalizedLayout, index);
  }

  if (templateId === 'aquatic') {
    return renderAquaticReferenceSlide(page, slide, presentation, theme, normalizedLayout, index);
  }

  if (templateId === 'businessannualreport') {
    return renderBusinessReferenceSlide(page, slide, presentation, theme, normalizedLayout, index);
  }

  return createContentSlide(page, slide, theme);
}

// ======================================================
// SHARED PREMIUM HELPERS
// ======================================================

function referenceValue(value, fallback = '') {
  const cleaned = String(value ?? '').trim();
  return cleaned || fallback;
}

function referenceTitle(slide, presentation) {
  return referenceValue(slide?.title, referenceValue(presentation?.title, 'Presentation'));
}

function referenceSubtitle(slide, presentation, fallback = '') {
  return referenceValue(
    slide?.headline,
    referenceValue(slide?.subtitle, referenceValue(presentation?.subtitle, fallback))
  );
}

function referenceDescription(slide, presentation, fallback = '') {
  const explicit = [
    slide?.description,
    slide?.keyTakeaway,
    slide?.insight,
    slide?.takeaway,
    slide?.summary,
    slide?.note,
    slide?.supportingStatement,
    slide?.headline,
    presentation?.description,
  ].find((value) => String(value ?? '').trim());

  if (explicit) {
    return String(explicit).trim();
  }

  const points = referencePoints(slide, 6);
  return points[points.length - 1] || fallback;
}

function referencePoints(slide, max = 6) {
  return normalizePoints(slide?.points || slide?.bullets || slide?.items || [])
    .map((point) => String(point || '').trim())
    .filter(Boolean)
    .slice(0, max);
}

function referenceStepArrayCandidates(slide) {
  return [
    slide?.steps,
    slide?.processSteps,
    slide?.stages,
    slide?.phases,
    slide?.timeline,
    slide?.timeline?.steps,
    slide?.process?.steps,
    slide?.flow?.steps,
    slide?.workflow?.steps,
    slide?.diagram?.steps,
    slide?.diagram?.stages,
  ];
}

function cleanReferenceStepLabel(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return text
    .replace(/^\s*(?:step|stage|phase|item)\s*[:\-]?\s*/i, '')
    .replace(/^\s*\d{1,2}\s*[.)\/:-]\s*/, '')
    .trim();
}

function referenceStepObject(item, index) {
  if (typeof item === 'string') {
    const value = cleanReferenceStepLabel(item);
    return {
      title: value || `Stage ${index + 1}`,
      body: '',
      phase: `${String(index + 1).padStart(2, '0')} / PHASE`,
    };
  }

  if (!item || typeof item !== 'object') {
    return null;
  }

  const titleCandidate =
    item.title ??
    item.name ??
    item.label ??
    item.heading ??
    item.step ??
    item.stage ??
    item.phase ??
    item.topic ??
    item.value ??
    '';

  const bodyCandidate =
    item.description ??
    item.details ??
    item.body ??
    item.content ??
    item.text ??
    item.summary ??
    item.explanation ??
    '';

  let title = cleanReferenceStepLabel(titleCandidate);
  let body = String(bodyCandidate ?? '').trim();

  const genericTitle = !title || /^(step|stage|phase|item)$/i.test(title);

  if (genericTitle && body) {
    const parts = body.split(/(?<=[.!?])\s+/).filter(Boolean);
    title = cleanReferenceStepLabel(parts.shift() || body);
    body = parts.join(' ').trim();
  }

  if (!title && body) {
    const parts = body.split(/(?<=[.!?])\s+/).filter(Boolean);
    title = cleanReferenceStepLabel(parts.shift() || body);
    body = parts.join(' ').trim();
  }

  if (!title) {
    title = `Stage ${index + 1}`;
  }

  const phase = cleanReferenceStepLabel(
    item.phaseLabel ??
    item.phaseName ??
    item.category ??
    item.type ??
    item.phase ??
    ''
  );

  return {
    title,
    body,
    phase: phase ? phase.toUpperCase() : `${String(index + 1).padStart(2, '0')} / PHASE`,
  };
}

function referenceProcessSteps(slide, max = 4) {
  let raw = [];

  for (const candidate of referenceStepArrayCandidates(slide)) {
    if (Array.isArray(candidate) && candidate.length) {
      raw = candidate;
      break;
    }
  }

  if (!raw.length) {
    raw = referencePoints(slide, max);
  }

  const steps = raw
    .map((item, index) => referenceStepObject(item, index))
    .filter(Boolean);

  if (!steps.length) {
    const fallback = splitIntoUsefulPoints(
      slide?.description || slide?.keyTakeaway || slide?.headline || ''
    );
    return fallback
      .slice(0, max)
      .map((value, index) => referenceStepObject(value, index));
  }

  return steps.slice(0, max);
}

function referenceFont(theme, kind = 'body') {
  return theme?.typography?.[kind] || (kind === 'title' ? 'Georgia' : 'Segoe UI');
}

function referenceColor(theme, key, fallback) {
  return cleanColor(theme?.colors?.[key] || fallback);
}

function safeReferenceBox(x = 0, y = 0, w = 1, h = 0.4, minW = 0.12, minH = 0.08) {
  const rawX = Number.isFinite(Number(x)) ? Number(x) : 0;
  const rawY = Number.isFinite(Number(y)) ? Number(y) : 0;
  const rawW = Math.max(minW, Number.isFinite(Number(w)) ? Number(w) : minW);
  const rawH = Math.max(minH, Number.isFinite(Number(h)) ? Number(h) : minH);
  const safeX = Math.min(Math.max(rawX, 0), Math.max(0, SLIDE_WIDTH - minW));
  const safeY = Math.min(Math.max(rawY, 0), Math.max(0, SLIDE_HEIGHT - minH));
  return {
    x: safeX,
    y: safeY,
    w: Math.min(rawW, Math.max(minW, SLIDE_WIDTH - safeX)),
    h: Math.min(rawH, Math.max(minH, SLIDE_HEIGHT - safeY)),
  };
}

function referenceText(page, text, options = {}) {
  const value = String(text ?? '').trim();
  if (!value) return;

  const box = safeReferenceBox(
    options.x ?? 0,
    options.y ?? 0,
    options.w ?? 1,
    options.h ?? 0.4
  );

  page.addText(value, {
    margin: 0,
    breakLine: false,
    fit: 'shrink',
    valign: 'mid',
    fontFace: options.fontFace || referenceFont(options.theme, 'body'),
    color: options.color || referenceColor(options.theme, 'text', '111827'),
    fontSize: options.fontSize || 16,
    bold: Boolean(options.bold),
    italic: Boolean(options.italic),
    align: options.align || 'left',
    charSpacing: options.charSpacing,
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    transparency: options.transparency,
    breakLineOnTextOverflow: false,
  });
}

function referenceLabel(page, text, x, y, w, color, theme) {
  referenceText(page, String(text || '').toUpperCase(), {
    theme,
    x,
    y,
    w,
    h: 0.2,
    fontSize: 8.2,
    bold: true,
    charSpacing: 2,
    color,
  });
}

function addReferenceRule(page, x, y, w, color, width = 1) {
  const box = safeReferenceBox(x, y, w, 0.01, 0.12, 0.01);
  page.addShape('line', {
    x: box.x,
    y: box.y,
    w: box.w,
    h: 0,
    line: { color: cleanColor(color), width },
  });
}

function addReferenceRect(page, x, y, w, h, fill, transparency = 0, lineColor = 'FFFFFF', lineTransparency = 100) {
  const box = safeReferenceBox(x, y, w, h);
  page.addShape('rect', {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    fill: { color: cleanColor(fill), transparency },
    line: { color: cleanColor(lineColor), transparency: lineTransparency },
  });
}

function addReferenceCircle(page, x, y, d, fill, transparency = 0, lineColor = 'FFFFFF', lineTransparency = 100, lineWidth = 1) {
  const box = safeReferenceBox(x, y, d, d, 0.08, 0.08);
  const diameter = Math.min(box.w, box.h);
  page.addShape('ellipse', {
    x: box.x,
    y: box.y,
    w: diameter,
    h: diameter,
    fill: { color: cleanColor(fill), transparency },
    line: { color: cleanColor(lineColor), transparency: lineTransparency, width: lineWidth },
  });
}

function addReferenceImageFailedMarker(page, box, theme, label = 'PHOTO') {
  // Fail-safe only: this is intentionally quiet and never replaces a successful photo.
  addReferenceRect(
    page,
    box.x,
    box.y,
    box.w,
    box.h,
    referenceColor(theme, 'surface', 'F4F0E8'),
    0,
    referenceColor(theme, 'border', 'D5D1CA'),
    35
  );
  referenceLabel(
    page,
    label,
    box.x + 0.18,
    box.y + 0.16,
    Math.min(box.w - 0.36, 1.0),
    referenceColor(theme, 'mutedText', '777777'),
    theme
  );
}

function referenceTopic(slide, presentation) {
  return referenceValue(
    slide?.imagePrompt,
    referenceValue(
      slide?.title,
      referenceValue(presentation?.title, 'professional presentation topic')
    )
  );
}

function referenceImagePrompt(slide, presentation, role = 'hero photograph') {
  const topic = referenceTopic(slide, presentation);
  const detail = referenceDescription(slide, presentation, 'supporting visual');
  return `${topic}. ${detail}. Premium ${role} for a polished presentation; realistic Pexels editorial photography; subject-specific, professional lighting, natural depth, sophisticated composition, no text, no logos, no watermark, no UI, no collage labels.`;
}

async function addReferenceImage(page, slide, presentation, box, theme, role = 'hero photograph', radius = 0.02) {
  const prompt = referenceImagePrompt(slide, presentation, role);
  const safeBox = safeReferenceBox(box?.x, box?.y, box?.w, box?.h);
  const ok = await addGeneratedImageCard(page, prompt, { ...safeBox, radius });
  if (!ok) addReferenceImageFailedMarker(page, safeBox, theme, 'IMAGE');
  return ok;
}

async function addReferenceImageFromPrompt(page, prompt, box, theme, radius = 0.02) {
  const safeBox = safeReferenceBox(box?.x, box?.y, box?.w, box?.h);
  const ok = await addGeneratedImageCard(page, String(prompt || ''), { ...safeBox, radius });
  if (!ok) addReferenceImageFailedMarker(page, safeBox, theme, 'IMAGE');
  return ok;
}

function addReferenceNumber(page, value, x, y, w, h, theme, colorOverride) {
  referenceText(page, String(value).padStart(2, '0'), {
    theme,
    x,
    y,
    w,
    h,
    fontFace: referenceFont(theme, 'title'),
    fontSize: 16,
    bold: true,
    color: colorOverride || referenceColor(theme, 'primary', '222222'),
  });
}

function addEngineeringTopline(page, theme, index = 0) {
  const taupe = referenceColor(theme, 'primary', '908269');
  const pale = referenceColor(theme, 'secondary', 'CFC3AC');
  addReferenceRect(page, 0, 0, 2.15, 0.08, taupe);
  addReferenceRect(page, 2.15, 0, 2.15, 0.08, pale);
  addReferenceRect(page, 4.30, 0, 1.1, 0.08, referenceColor(theme, 'tertiary', '976E26'));
  referenceLabel(page, `NYXORA / ${String(index + 1).padStart(2, '0')}`, 10.72, 0.30, 1.72, taupe, theme);
}

function addAquaticWaves(page, theme, position = 'bottom') {
  const c1 = referenceColor(theme, 'secondary', '9DCEDF');
  const c2 = referenceColor(theme, 'tertiary', '80C9DD');
  const c3 = referenceColor(theme, 'primary', '285E89');
  const y = position === 'top' ? -0.02 : 6.86;
  const svg = position === 'top'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="120" viewBox="0 0 1600 120"><path d="M0 40 C240 88 420 8 650 36 S1090 96 1600 26 L1600 0 L0 0 Z" fill="#${c1}" fill-opacity="0.50"/><path d="M0 60 C220 106 470 20 730 48 S1160 108 1600 34 L1600 0 L0 0 Z" fill="#${c2}" fill-opacity="0.58"/><path d="M0 82 C260 124 520 32 800 58 S1230 116 1600 52 L1600 0 L0 0 Z" fill="#${c3}" fill-opacity="0.16"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="120" viewBox="0 0 1600 120"><path d="M0 76 C260 26 430 110 700 78 S1170 24 1600 82 L1600 120 L0 120 Z" fill="#${c1}" fill-opacity="0.55"/><path d="M0 56 C260 8 520 92 810 56 S1210 6 1600 68 L1600 120 L0 120 Z" fill="#${c2}" fill-opacity="0.52"/><path d="M0 40 C280 2 530 70 840 42 S1240 4 1600 52 L1600 120 L0 120 Z" fill="#${c3}" fill-opacity="0.18"/></svg>`;
  page.addImage({ data: svgToDataUri(svg), x: 0, y, w: SLIDE_WIDTH, h: 0.64 });
}

function addAquaticWaterline(page, theme, x = 0.82, y = 5.92, w = 5.7) {
  addReferenceRule(page, x, y, w, referenceColor(theme, 'secondary', '9DCEDF'), 4.2);
  addReferenceRule(page, x + 0.42, y - 0.02, w * 0.53, referenceColor(theme, 'primary', '285E89'), 0.8);
}

function addBusinessGrid(page, theme, index = 0) {
  const cyan = referenceColor(theme, 'secondary', '63DBF5');
  const blue = referenceColor(theme, 'tertiary', '516CEE');
  addReferenceRect(page, 0, 0, 1.45, 0.09, cyan);
  addReferenceRect(page, 1.45, 0, 0.56, 0.09, blue);
  addReferenceRect(page, 12.40, 0, 0.93, 0.09, cyan);

  addReferenceRect(page, index % 2 === 0 ? 12.96 : 0.00, 1.30, 0.07, 4.72, blue, 8);
  addReferenceRect(page, index % 2 === 0 ? 12.78 : 0.18, 1.52, 0.05, 3.68, cyan, 12);
}

function addBusinessDiagonal(page, theme, x, y, w, h, color, transparency = 0) {
  const c = cleanColor(color);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700"><polygon points="0,700 1200,0 1200,160 260,700" fill="#${c}" fill-opacity="${1 - transparency / 100}"/></svg>`;
  page.addImage({ data: svgToDataUri(svg), x, y, w, h });
}

// ======================================================
// ENGINEERING — EDITORIAL PROJECT PROPOSAL
// ======================================================

async function renderEngineeringReferenceSlide(page, slide, presentation, theme, layout, index) {
  switch (layout) {
    case 'title':
    case 'cover':
    case 'hero':
      return renderEngineeringCover(page, slide, presentation, theme, index);
    case 'section-divider':
      return renderEngineeringSection(page, slide, presentation, theme, index);
    case 'full-image':
      return renderEngineeringFullImage(page, slide, presentation, theme, index);
    case 'quote':
      return renderEngineeringQuote(page, slide, presentation, theme, index);
    case 'stats':
    case 'metric-grid':
      return renderEngineeringStats(page, slide, presentation, theme, index);
    case 'imageText':
    case 'imagetext':
    case 'two-column':
      return renderEngineeringImageText(page, slide, presentation, theme, index);
    case 'three-column':
      return renderEngineeringThreeColumn(page, slide, presentation, theme, index);
    case 'process':
    case 'timeline':
    case 'diagram':
    case 'architecture':
      return renderEngineeringProcess(page, slide, presentation, theme, index);
    case 'comparison':
    case 'before-after':
      return renderEngineeringComparison(page, slide, presentation, theme, index);
    case 'case-study':
      return renderEngineeringImageText(page, slide, presentation, theme, index);
    case 'testimonial':
      return renderEngineeringQuote(page, slide, presentation, theme, index);
    case 'key-takeaway':
    case 'closing':
    case 'summary':
    case 'conclusion':
      return renderEngineeringClosing(page, slide, presentation, theme, index);
    default:
      return renderEngineeringContent(page, slide, presentation, theme, index);
  }
}

async function renderEngineeringCover(page, slide, presentation, theme, index) {
  const taupe = referenceColor(theme, 'primary', '908269');
  const pale = referenceColor(theme, 'surface', 'F4F0E8');
  page.background = { color: referenceColor(theme, 'background', 'FFFFFF') };

  await addReferenceImage(page, slide, presentation, { x: 6.88, y: 0, w: 6.45, h: 7.5 }, theme, 'architectural / project hero photograph', 0);
  addReferenceRect(page, 0, 0, 7.38, 7.5, 'FFFFFF');
  addReferenceRect(page, 5.76, 0.74, 1.72, 2.86, pale, 8);
  addEngineeringTopline(page, theme, index);

  referenceLabel(page, 'PROJECT PROPOSAL', 0.86, 0.98, 3.0, taupe, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.84, y: 1.52, w: 5.72, h: 1.84,
    fontFace: referenceFont(theme, 'title'), fontSize: 42, bold: true,
    color: referenceColor(theme, 'title', '212121'),
  });
  addReferenceRule(page, 0.86, 3.86, 1.64, taupe, 1.6);
  referenceText(page, referenceSubtitle(slide, presentation, 'A structured visual story with project context and evidence.'), {
    theme, x: 0.88, y: 4.08, w: 4.92, h: 0.92, fontSize: 15,
    color: referenceColor(theme, 'text', '434343'),
  });

  referenceLabel(page, 'PREPARED FOR', 0.88, 5.38, 1.65, referenceColor(theme, 'secondary', 'CFC3AC'), theme);
  referenceText(page, referenceValue(presentation?.organization, 'Nyxora AI'), {
    theme, x: 0.88, y: 5.66, w: 4.1, h: 0.30, fontSize: 12, bold: true,
    color: referenceColor(theme, 'text', '434343'),
  });
  referenceLabel(page, 'DATE', 4.10, 5.38, 0.9, taupe, theme);
  referenceText(page, referenceValue(presentation?.date, getCurrentPresentationDate()), {
    theme, x: 4.10, y: 5.66, w: 1.72, h: 0.30, fontSize: 12, bold: true,
    color: referenceColor(theme, 'text', '434343'),
  });

  addReferenceNumber(page, index + 1, 0.88, 6.73, 0.65, 0.26, theme, taupe);
}

async function renderEngineeringSection(page, slide, presentation, theme, index) {
  const taupe = referenceColor(theme, 'primary', '908269');
  page.background = { color: referenceColor(theme, 'surface', 'F4F0E8') };
  await addReferenceImage(page, slide, presentation, { x: 7.15, y: 0, w: 6.18, h: 7.5 }, theme, 'architecture or project detail photograph', 0);
  addReferenceRect(page, 0, 0, 7.60, 7.5, referenceColor(theme, 'background', 'FFFFFF'), 2);
  addReferenceRect(page, 5.55, 0.74, 2.05, 5.90, referenceColor(theme, 'secondary', 'CFC3AC'), 58);

  referenceText(page, String(index + 1).padStart(2, '0'), {
    theme, x: 0.88, y: 0.82, w: 1.22, h: 0.55,
    fontFace: referenceFont(theme, 'title'), fontSize: 26, bold: true, color: taupe,
  });
  referenceLabel(page, 'SECTION', 0.90, 1.46, 1.12, taupe, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.86, y: 1.90, w: 5.72, h: 1.72,
    fontFace: referenceFont(theme, 'title'), fontSize: 38, bold: true,
    color: referenceColor(theme, 'title', '212121'),
  });
  referenceText(page, referenceSubtitle(slide, presentation, 'A new chapter in the story.'), {
    theme, x: 0.90, y: 3.98, w: 4.88, h: 0.88, fontSize: 15,
    color: referenceColor(theme, 'text', '434343'),
  });
  addReferenceRule(page, 0.90, 5.16, 1.90, taupe, 1.4);
  referenceLabel(page, 'PROJECT / PROPOSAL', 0.90, 5.42, 2.24, referenceColor(theme, 'secondary', 'CFC3AC'), theme);
  referenceText(page, referenceDescription(slide, presentation, 'Visual section opener.'), {
    theme, x: 0.90, y: 5.78, w: 4.70, h: 0.64, fontSize: 11.5,
    color: referenceColor(theme, 'mutedText', '595959'),
  });
}

async function renderEngineeringContent(page, slide, presentation, theme, index) {
  const taupe = referenceColor(theme, 'primary', '908269');
  const points = referencePoints(slide, 5);
  page.background = { color: referenceColor(theme, 'background', 'FFFFFF') };
  addEngineeringTopline(page, theme, index);

  referenceLabel(page, 'OVERVIEW', 0.84, 0.60, 1.8, taupe, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.82, y: 0.94, w: 7.12, h: 0.78,
    fontFace: referenceFont(theme, 'title'), fontSize: 30, bold: true,
    color: referenceColor(theme, 'title', '212121'),
  });
  referenceText(page, referenceSubtitle(slide, presentation, 'Key context and supporting evidence.'), {
    theme, x: 0.84, y: 1.73, w: 6.44, h: 0.54, fontSize: 13.5,
    color: referenceColor(theme, 'mutedText', '595959'),
  });

  await addReferenceImage(page, slide, presentation, { x: 8.06, y: 0.62, w: 4.47, h: 2.68 }, theme, 'clean editorial hero photograph', 0);
  await addReferenceImageFromPrompt(
    page,
    `${referenceTopic(slide, presentation)} close-up detail photograph, premium Pexels editorial style, natural light, no text`,
    { x: 7.86, y: 3.62, w: 2.16, h: 2.15 },
    theme,
    0
  );
  await addReferenceImageFromPrompt(
    page,
    `${referenceTopic(slide, presentation)} secondary contextual photograph, documentary editorial style, no text`,
    { x: 10.20, y: 3.62, w: 2.33, h: 2.15 },
    theme,
    0
  );

  addReferenceRect(page, 0.82, 2.62, 6.50, 3.22, referenceColor(theme, 'surface', 'F4F0E8'), 0);
  points.forEach((point, i) => {
    const y = 2.98 + i * 0.54;
    addReferenceNumber(page, i + 1, 1.08, y, 0.38, 0.24, theme, taupe);
    addReferenceRule(page, 1.56, y + 0.17, 0.42, referenceColor(theme, 'secondary', 'CFC3AC'), 1);
    referenceText(page, trimText(point, 132), {
      theme, x: 2.12, y: y - 0.04, w: 4.66, h: 0.42, fontSize: 12,
      color: referenceColor(theme, 'text', '434343'),
    });
  });

  referenceLabel(page, 'EDITORIAL NOTE', 8.08, 6.16, 1.82, taupe, theme);
  referenceText(page, referenceDescription(slide, presentation, 'A concise visual takeaway that supports the main point.'), {
    theme, x: 8.08, y: 6.40, w: 4.46, h: 0.54,
    fontFace: referenceFont(theme, 'title'), fontSize: 12.2, italic: true,
    color: referenceColor(theme, 'title', '212121'),
  });
}

async function renderEngineeringImageText(page, slide, presentation, theme, index) {
  const taupe = referenceColor(theme, 'primary', '908269');
  page.background = { color: referenceColor(theme, 'background', 'FFFFFF') };
  addEngineeringTopline(page, theme, index);

  referenceLabel(page, 'VISUAL STORY', 0.84, 0.58, 1.68, taupe, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.82, y: 0.94, w: 4.45, h: 1.08,
    fontFace: referenceFont(theme, 'title'), fontSize: 31, bold: true,
    color: referenceColor(theme, 'title', '212121'),
  });
  referenceText(page, referenceSubtitle(slide, presentation, 'A focused narrative with an editorial visual anchor.'), {
    theme, x: 0.84, y: 2.24, w: 4.28, h: 1.12, fontSize: 14,
    color: referenceColor(theme, 'text', '434343'),
  });
  addReferenceRule(page, 0.84, 3.72, 1.66, taupe, 1.5);

  await addReferenceImage(page, slide, presentation, { x: 5.34, y: 0.54, w: 7.14, h: 5.98 }, theme, 'large editorial project photograph', 0);

  referenceLabel(page, 'DETAIL', 0.86, 4.18, 1.0, taupe, theme);
  referenceText(page, referenceDescription(slide, presentation, 'Supporting note.'), {
    theme, x: 0.86, y: 4.55, w: 3.88, h: 0.92, fontSize: 12,
    color: referenceColor(theme, 'mutedText', '595959'),
  });
  referenceText(page, referenceValue(presentation?.author || presentation?.presenter, 'Nyxora AI'), {
    theme, x: 0.86, y: 6.02, w: 3.4, h: 0.26, fontSize: 10.5, bold: true,
    color: taupe,
  });
}

async function renderEngineeringThreeColumn(page, slide, presentation, theme, index) {
  const taupe = referenceColor(theme, 'primary', '908269');
  const pale = referenceColor(theme, 'surface', 'F4F0E8');
  const points = referencePoints(slide, 3);
  page.background = { color: referenceColor(theme, 'background', 'FFFFFF') };
  addEngineeringTopline(page, theme, index);

  referenceLabel(page, 'PROJECT HIGHLIGHTS', 0.84, 0.58, 2.2, taupe, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.82, y: 0.92, w: 8.2, h: 0.66,
    fontFace: referenceFont(theme, 'title'), fontSize: 29, bold: true,
    color: referenceColor(theme, 'title', '212121'),
  });

  const xs = [0.84, 4.48, 8.12];
  const imagePrompts = [
    'primary subject photograph',
    'detail / materials photograph',
    'context / environment photograph',
  ];
  for (let i = 0; i < 3; i++) {
    const point = points[i] || referenceDescription(slide, presentation, 'Supporting project point.');
    const x = xs[i];
    await addReferenceImageFromPrompt(
      page,
      `${referenceTopic(slide, presentation)} ${imagePrompts[i]}, premium editorial Pexels photography, realistic, no text`,
      { x, y: 1.82, w: 3.20, h: 2.04 },
      theme,
      0
    );
    referenceText(page, String(i + 1).padStart(2, '0'), {
      theme, x, y: 4.15, w: 0.52, h: 0.34,
      fontFace: referenceFont(theme, 'title'), fontSize: 18, bold: true, color: taupe,
    });
    referenceText(page, trimText(point, 118), {
      theme, x: x + 0.68, y: 4.13, w: 2.52, h: 0.86, fontSize: 11.4,
      color: referenceColor(theme, 'text', '434343'),
    });
    addReferenceRule(page, x, 5.40, 3.18, referenceColor(theme, 'secondary', 'CFC3AC'), 0.9);
    addReferenceRect(page, x, 5.56, 3.18, 0.52, pale, 4);
  }
}

async function renderEngineeringStats(page, slide, presentation, theme, index) {
  const taupe = referenceColor(theme, 'primary', '908269');
  const points = referencePoints(slide, 3);
  page.background = { color: referenceColor(theme, 'surface', 'F4F0E8') };
  addEngineeringTopline(page, theme, index);

  referenceLabel(page, 'AT A GLANCE', 0.84, 0.62, 1.65, taupe, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.82, y: 0.96, w: 7.0, h: 0.76,
    fontFace: referenceFont(theme, 'title'), fontSize: 30, bold: true,
    color: referenceColor(theme, 'title', '212121'),
  });

  const stats = points.length ? points : ['01 — Scope', '02 — Reach', '03 — Result'];
  for (let i = 0; i < 3; i++) {
    const x = 0.86 + i * 2.18;
    referenceText(page, String(i + 1).padStart(2, '0'), {
      theme, x, y: 2.08, w: 0.48, h: 0.24, fontSize: 9, bold: true, color: taupe,
    });
    referenceText(page, trimText(stats[i] || stats[0], 45), {
      theme, x, y: 2.54, w: 1.74, h: 1.08,
      fontFace: referenceFont(theme, 'title'), fontSize: 19, bold: true,
      color: referenceColor(theme, 'title', '212121'),
    });
    addReferenceRule(page, x, 3.88, 1.72, referenceColor(theme, 'secondary', 'CFC3AC'), 1.1);
  }

  await addReferenceImage(page, slide, presentation, { x: 7.70, y: 1.56, w: 4.82, h: 4.92 }, theme, 'project results / evidence photograph', 0);
  referenceText(page, referenceDescription(slide, presentation, 'A visual summary of the most important signals.'), {
    theme, x: 0.86, y: 4.72, w: 5.74, h: 0.92, fontSize: 12,
    color: referenceColor(theme, 'text', '434343'),
  });
}

async function renderEngineeringQuote(page, slide, presentation, theme, index) {
  const taupe = referenceColor(theme, 'primary', '908269');
  page.background = { color: 'FFFFFF' };
  await addReferenceImage(page, slide, presentation, { x: 0, y: 0, w: 13.33, h: 7.5 }, theme, 'cinematic editorial background photograph', 0);
  addReferenceRect(page, 0, 0, 13.33, 7.5, 'FFFFFF', 20);
  addReferenceRect(page, 0.72, 0.74, 6.28, 5.82, 'FFFFFF', 10);

  referenceLabel(page, 'STATEMENT', 1.02, 1.08, 1.42, taupe, theme);
  referenceText(page, '“', {
    theme, x: 0.96, y: 1.48, w: 0.48, h: 0.66,
    fontFace: referenceFont(theme, 'title'), fontSize: 38, bold: true, color: taupe,
  });
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 1.06, y: 2.12, w: 5.34, h: 1.74,
    fontFace: referenceFont(theme, 'title'), fontSize: 28, bold: true,
    color: referenceColor(theme, 'title', '212121'),
  });
  referenceText(page, referenceDescription(slide, presentation, 'A concise statement for the audience.'), {
    theme, x: 1.06, y: 4.46, w: 5.06, h: 0.82, fontSize: 13,
    color: referenceColor(theme, 'text', '434343'),
  });
  referenceText(page, referenceValue(presentation?.author || presentation?.presenter, 'Nyxora AI'), {
    theme, x: 1.06, y: 5.72, w: 3.2, h: 0.28, fontSize: 10.5, bold: true, color: taupe,
  });
}

async function renderEngineeringFullImage(page, slide, presentation, theme, index) {
  page.background = { color: '000000' };
  await addReferenceImage(page, slide, presentation, { x: 0, y: 0, w: 13.33, h: 7.5 }, theme, 'full-frame cinematic editorial photograph', 0);
  addReferenceRect(page, 0, 4.58, 13.33, 2.92, '111111', 22);
  referenceLabel(page, `PROJECT / ${String(index + 1).padStart(2, '0')}`, 0.84, 5.04, 2.1, 'FFFFFF', theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.82, y: 5.34, w: 8.84, h: 0.88,
    fontFace: referenceFont(theme, 'title'), fontSize: 31, bold: true, color: 'FFFFFF',
  });
  referenceText(page, referenceSubtitle(slide, presentation, 'A cinematic visual moment.'), {
    theme, x: 0.84, y: 6.34, w: 7.0, h: 0.54, fontSize: 13, color: 'FFFFFF', transparency: 4,
  });
}

async function renderEngineeringProcess(page, slide, presentation, theme, index) {
  const taupe = referenceColor(theme, 'primary', '908269');
  const pale = referenceColor(theme, 'surface', 'F4F0E8');
  const steps = referenceProcessSteps(slide, 4);
  page.background = { color: referenceColor(theme, 'background', 'FFFFFF') };
  addEngineeringTopline(page, theme, index);

  referenceLabel(page, 'PROCESS / TIMELINE', 0.84, 0.62, 2.25, taupe, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.82, y: 0.98, w: 7.40, h: 0.72,
    fontFace: referenceFont(theme, 'title'), fontSize: 30, bold: true,
    color: referenceColor(theme, 'title', '212121'),
  });
  referenceText(page, referenceSubtitle(slide, presentation, 'A connected sequence explained through the supplied presentation content.'), {
    theme, x: 0.84, y: 1.76, w: 7.10, h: 0.48, fontSize: 12.6,
    color: referenceColor(theme, 'mutedText', '595959'),
  });

  await addReferenceImage(page, slide, presentation, { x: 8.74, y: 0.58, w: 3.82, h: 2.36 }, theme, 'process / workflow project photograph', 0.02);

  const lineY = 3.70;
  addReferenceRule(page, 1.20, lineY, 10.96, referenceColor(theme, 'secondary', 'CFC3AC'), 1.1);

  for (let i = 0; i < 4; i++) {
    const step = steps[i] || {
      title: `Stage ${i + 1}`,
      body: referenceDescription(slide, presentation, ''),
      phase: `${String(i + 1).padStart(2, '0')} / PHASE`,
    };
    const x = 0.88 + i * 3.10;

    addReferenceCircle(page, x, lineY - 0.31, 0.62, taupe, 0, 'FFFFFF', 100);
    referenceText(page, String(i + 1).padStart(2, '0'), {
      theme, x, y: lineY - 0.08, w: 0.62, h: 0.16,
      fontSize: 8.5, bold: true, align: 'center', color: 'FFFFFF',
    });

    referenceText(page, step.title, {
      theme, x, y: 4.18, w: 2.56, h: 0.62,
      fontFace: referenceFont(theme, 'title'), fontSize: 15, bold: true,
      color: referenceColor(theme, 'title', '212121'),
    });

    if (step.body) {
      referenceText(page, step.body, {
        theme, x, y: 4.88, w: 2.56, h: 0.82,
        fontSize: 10.8, color: referenceColor(theme, 'text', '434343'),
      });
    }

    referenceLabel(page, step.phase || `${String(i + 1).padStart(2, '0')} / PHASE`, x, 5.90, 2.30, taupe, theme);
    addReferenceRule(page, x, 6.16, 2.32, pale, 1.15);
  }

  referenceText(page, referenceDescription(slide, presentation, 'A connected sequence from beginning to outcome.'), {
    theme, x: 0.88, y: 6.50, w: 7.32, h: 0.42, fontSize: 11.2,
    color: referenceColor(theme, 'mutedText', '595959'),
  });
}

async function renderEngineeringComparison(page, slide, presentation, theme, index) {
  const taupe = referenceColor(theme, 'primary', '908269');
  const points = referencePoints(slide, 4);
  page.background = { color: referenceColor(theme, 'background', 'FFFFFF') };
  addEngineeringTopline(page, theme, index);

  referenceLabel(page, 'COMPARISON', 0.84, 0.62, 1.50, taupe, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.82, y: 0.96, w: 7.8, h: 0.72, fontFace: referenceFont(theme, 'title'), fontSize: 29, bold: true,
    color: referenceColor(theme, 'title', '212121'),
  });

  await addReferenceImageFromPrompt(page, `${referenceTopic(slide, presentation)} before state photograph, documentary Pexels editorial style, no text`, { x: 0.84, y: 1.92, w: 5.82, h: 3.34 }, theme, 0);
  await addReferenceImageFromPrompt(page, `${referenceTopic(slide, presentation)} after state photograph, polished professional Pexels editorial style, no text`, { x: 6.96, y: 1.92, w: 5.56, h: 3.34 }, theme, 0);

  referenceLabel(page, '01 / BEFORE', 0.84, 5.52, 1.55, taupe, theme);
  referenceText(page, trimText(points[0] || referenceSubtitle(slide, presentation, 'Starting state'), 95), {
    theme, x: 0.84, y: 5.82, w: 5.64, h: 0.62, fontSize: 11.5, color: referenceColor(theme, 'text', '434343'),
  });
  referenceLabel(page, '02 / AFTER', 6.96, 5.52, 1.55, referenceColor(theme, 'tertiary', '976E26'), theme);
  referenceText(page, trimText(points[1] || referenceDescription(slide, presentation, 'Resulting state'), 95), {
    theme, x: 6.96, y: 5.82, w: 5.42, h: 0.62, fontSize: 11.5, color: referenceColor(theme, 'text', '434343'),
  });
}

async function renderEngineeringClosing(page, slide, presentation, theme, index) {
  const taupe = referenceColor(theme, 'primary', '908269');
  page.background = { color: referenceColor(theme, 'surface', 'F4F0E8') };
  await addReferenceImage(page, slide, presentation, { x: 6.88, y: 0, w: 6.45, h: 7.5 }, theme, 'closing architecture / project photograph', 0);
  addReferenceRect(page, 0, 0, 7.15, 7.5, 'FFFFFF', 0);
  referenceLabel(page, 'KEY TAKEAWAY', 0.88, 1.06, 2.04, taupe, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.84, y: 1.58, w: 5.52, h: 1.62,
    fontFace: referenceFont(theme, 'title'), fontSize: 37, bold: true, color: referenceColor(theme, 'title', '212121'),
  });
  addReferenceRule(page, 0.86, 3.72, 1.76, taupe, 1.4);
  referenceText(page, referenceSubtitle(slide, presentation, 'The closing message in one clear visual statement.'), {
    theme, x: 0.88, y: 4.04, w: 4.92, h: 0.96, fontSize: 14, color: referenceColor(theme, 'text', '434343'),
  });
  referenceText(page, referenceValue(presentation?.author || presentation?.presenter, 'Nyxora AI'), {
    theme, x: 0.88, y: 6.28, w: 2.9, h: 0.24, fontSize: 10, bold: true, color: taupe,
  });
  addReferenceNumber(page, index + 1, 0.88, 6.72, 0.65, 0.26, theme, taupe);
}

// ======================================================
// AQUATIC — PREMIUM HEALTHCARE / WELLNESS
// ======================================================

async function renderAquaticReferenceSlide(page, slide, presentation, theme, layout, index) {
  switch (layout) {
    case 'title':
    case 'cover':
    case 'hero':
      return renderAquaticCover(page, slide, presentation, theme, index);
    case 'section-divider':
      return renderAquaticSection(page, slide, presentation, theme, index);
    case 'full-image':
      return renderAquaticFullImage(page, slide, presentation, theme, index);
    case 'quote':
      return renderAquaticQuote(page, slide, presentation, theme, index);
    case 'stats':
    case 'metric-grid':
      return renderAquaticStats(page, slide, presentation, theme, index);
    case 'imageText':
    case 'imagetext':
    case 'two-column':
      return renderAquaticImageText(page, slide, presentation, theme, index);
    case 'three-column':
      return renderAquaticThreeColumn(page, slide, presentation, theme, index);
    case 'process':
    case 'timeline':
    case 'diagram':
    case 'architecture':
      return renderAquaticProcess(page, slide, presentation, theme, index);
    case 'comparison':
    case 'before-after':
      return renderAquaticComparison(page, slide, presentation, theme, index);
    case 'case-study':
      return renderAquaticImageText(page, slide, presentation, theme, index);
    case 'testimonial':
      return renderAquaticQuote(page, slide, presentation, theme, index);
    case 'key-takeaway':
    case 'closing':
    case 'summary':
    case 'conclusion':
      return renderAquaticClosing(page, slide, presentation, theme, index);
    default:
      return renderAquaticContent(page, slide, presentation, theme, index);
  }
}

async function renderAquaticCover(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '285E89');
  const blue = referenceColor(theme, 'secondary', '9DCEDF');
  page.background = { color: referenceColor(theme, 'background', 'FFFFFF') };

  await addReferenceImage(page, slide, presentation, { x: 7.00, y: 0.44, w: 5.52, h: 5.96 }, theme, 'wellness / nature / healthcare hero photograph', 0.12);
  addReferenceCircle(page, 10.82, 0.42, 1.02, blue, 12, 'FFFFFF', 100);
  addAquaticWaves(page, theme, 'bottom');
  addAquaticWaves(page, theme, 'top');

  referenceLabel(page, 'HEALTH • WELLNESS • SCIENCE', 0.84, 0.88, 3.2, navy, theme);
  referenceText(page, String(index + 1).padStart(2, '0'), {
    theme, x: 0.84, y: 1.34, w: 0.66, h: 0.38, fontFace: referenceFont(theme, 'title'), fontSize: 18, bold: true, color: navy,
  });
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.82, y: 1.92, w: 5.62, h: 1.76,
    fontFace: referenceFont(theme, 'title'), fontSize: 39, bold: true, color: referenceColor(theme, 'title', '1A4568'),
  });
  addAquaticWaterline(page, theme, 0.84, 4.06, 4.88);
  referenceText(page, referenceSubtitle(slide, presentation, 'A clear story supported by evidence and visual context.'), {
    theme, x: 0.84, y: 4.38, w: 5.32, h: 0.92, fontSize: 14, color: referenceColor(theme, 'text', '1A4568'),
  });
  referenceText(page, `${referenceValue(presentation?.organization, 'Nyxora AI')}  •  ${referenceValue(presentation?.date, getCurrentPresentationDate())}`, {
    theme, x: 0.84, y: 5.70, w: 5.26, h: 0.26, fontSize: 10.5, bold: true, color: referenceColor(theme, 'subtitle', '66A5BB'),
  });
}

async function renderAquaticSection(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '285E89');
  const blue = referenceColor(theme, 'secondary', '9DCEDF');
  page.background = { color: navy };
  await addReferenceImage(page, slide, presentation, { x: 7.32, y: 0.78, w: 4.96, h: 4.92 }, theme, 'calm healthcare / aquatic lifestyle photograph', 0.12);
  addAquaticWaves(page, theme, 'bottom');

  addReferenceCircle(page, 0.86, 0.84, 0.76, blue, 0, 'FFFFFF', 100);
  referenceText(page, String(index + 1).padStart(2, '0'), {
    theme, x: 0.86, y: 1.09, w: 0.76, h: 0.22, fontSize: 9.5, bold: true, align: 'center', color: navy,
  });
  referenceLabel(page, 'SECTION', 1.82, 1.00, 1.10, blue, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.86, y: 1.86, w: 5.80, h: 1.72,
    fontFace: referenceFont(theme, 'title'), fontSize: 38, bold: true, color: 'FFFFFF',
  });
  referenceText(page, referenceSubtitle(slide, presentation, 'A new chapter in the story.'), {
    theme, x: 0.88, y: 4.00, w: 5.16, h: 0.86, fontSize: 14.5, color: 'DCEFF5',
  });
  referenceLabel(page, `${String(index + 1).padStart(2, '0')} / NYXORA AI`, 0.88, 6.35, 2.10, blue, theme);
}

async function renderAquaticContent(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '285E89');
  const points = referencePoints(slide, 5);
  page.background = { color: referenceColor(theme, 'background', 'FFFFFF') };
  addAquaticWaves(page, theme, 'top');
  addAquaticWaves(page, theme, 'bottom');

  referenceLabel(page, 'OVERVIEW', 0.84, 0.66, 1.56, navy, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.82, y: 0.98, w: 7.06, h: 0.74,
    fontFace: referenceFont(theme, 'title'), fontSize: 30, bold: true, color: referenceColor(theme, 'title', '1A4568'),
  });
  referenceText(page, referenceSubtitle(slide, presentation, 'A focused visual explanation.'), {
    theme, x: 0.84, y: 1.78, w: 6.35, h: 0.52, fontSize: 13.2, color: referenceColor(theme, 'subtitle', '66A5BB'),
  });

  await addReferenceImage(page, slide, presentation, { x: 8.22, y: 2.08, w: 4.02, h: 3.56 }, theme, 'clean healthcare / science photograph', 0.16);
  addReferenceRect(page, 7.72, 2.06, 0.14, 3.60, referenceColor(theme, 'secondary', '9DCEDF'), 0);
  addReferenceCircle(page, 7.48, 2.02, 0.54, referenceColor(theme, 'primary', '285E89'), 0, 'FFFFFF', 100);
  referenceText(page, String(index + 1).padStart(2, '0'), { theme, x: 7.48, y: 2.20, w: 0.54, h: 0.18, fontSize: 8.5, bold: true, align: 'center', color: 'FFFFFF' });

  points.forEach((point, i) => {
    const y = 2.55 + i * 0.58;
    addReferenceCircle(page, 0.88, y, 0.42, referenceColor(theme, 'primary', '285E89'), 0, 'FFFFFF', 100);
    referenceText(page, String(i + 1).padStart(2, '0'), { theme, x: 0.88, y: y + 0.13, w: 0.42, h: 0.14, fontSize: 7.5, bold: true, align: 'center', color: 'FFFFFF' });
    referenceText(page, trimText(point, 120), { theme, x: 1.48, y: y + 0.01, w: 5.68, h: 0.40, fontSize: 11.5, color: referenceColor(theme, 'text', '1A4568') });
  });

  referenceLabel(page, 'VISUAL TAKEAWAY', 8.24, 5.94, 1.88, navy, theme);
  referenceText(page, referenceDescription(slide, presentation, 'A focused visual summary of the main idea.'), {
    theme, x: 8.24, y: 6.20, w: 3.96, h: 0.52, fontSize: 10.8, color: referenceColor(theme, 'text', '1A4568'),
  });
}

async function renderAquaticImageText(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '285E89');
  page.background = { color: referenceColor(theme, 'background', 'FFFFFF') };
  addAquaticWaves(page, theme, 'bottom');

  referenceLabel(page, 'VISUAL STORY', 0.84, 0.70, 1.66, navy, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.82, y: 1.06, w: 4.72, h: 1.02,
    fontFace: referenceFont(theme, 'title'), fontSize: 31, bold: true, color: referenceColor(theme, 'title', '1A4568'),
  });
  referenceText(page, referenceSubtitle(slide, presentation, 'Clear explanation paired with strong visual context.'), {
    theme, x: 0.84, y: 2.32, w: 4.36, h: 1.02, fontSize: 14, color: referenceColor(theme, 'text', '1A4568'),
  });
  addAquaticWaterline(page, theme, 0.84, 3.76, 4.20);
  referenceText(page, referenceDescription(slide, presentation, 'Supporting detail.'), {
    theme, x: 0.84, y: 4.10, w: 4.36, h: 1.00, fontSize: 11.8, color: referenceColor(theme, 'subtitle', '66A5BB'),
  });

  await addReferenceImage(page, slide, presentation, { x: 5.42, y: 0.68, w: 6.82, h: 5.84 }, theme, 'large calm healthcare / science editorial photograph', 0.18);
}

async function renderAquaticThreeColumn(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '285E89');
  const points = referencePoints(slide, 3);
  page.background = { color: 'FFFFFF' };
  addAquaticWaves(page, theme, 'top');
  addAquaticWaves(page, theme, 'bottom');

  referenceLabel(page, 'KEY AREAS', 0.84, 0.66, 1.40, navy, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.82, y: 0.98, w: 8.0, h: 0.66, fontFace: referenceFont(theme, 'title'), fontSize: 29, bold: true, color: referenceColor(theme, 'title', '1A4568'),
  });

  const xs = [0.82, 4.48, 8.14];
  for (let i = 0; i < 3; i++) {
    const x = xs[i];
    await addReferenceImageFromPrompt(page, `${referenceTopic(slide, presentation)} ${['primary subject','supporting detail','real-world context'][i]} photograph, healthcare editorial Pexels style, no text`, { x, y: 1.90, w: 3.18, h: 2.12 }, theme, 0.14);
    addReferenceCircle(page, x + 0.22, 3.72, 0.52, navy, 0, 'FFFFFF', 100);
    referenceText(page, String(i + 1).padStart(2, '0'), { theme, x: x + 0.22, y: 3.89, w: 0.52, h: 0.15, fontSize: 8, bold: true, align: 'center', color: 'FFFFFF' });
    referenceText(page, trimText(points[i] || referenceDescription(slide, presentation, 'Supporting point.'), 90), { theme, x: x, y: 4.50, w: 3.02, h: 0.92, fontSize: 11.2, color: referenceColor(theme, 'text', '1A4568') });
    addAquaticWaterline(page, theme, x, 5.65, 2.68);
  }
}

async function renderAquaticStats(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '285E89');
  const teal = referenceColor(theme, 'secondary', '9DCEDF');
  const points = referencePoints(slide, 3);
  page.background = { color: referenceColor(theme, 'surface', 'F8FCFD') };
  addAquaticWaves(page, theme, 'top');

  referenceLabel(page, 'IN FOCUS', 0.84, 0.62, 1.20, navy, theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.82, y: 0.98, w: 7.4, h: 0.72, fontFace: referenceFont(theme, 'title'), fontSize: 29, bold: true, color: navy });

  const stats = points.length ? points : ['Key signal', 'Reach', 'Outcome'];
  for (let i = 0; i < 3; i++) {
    const x = 0.84 + i * 2.12;
    referenceText(page, String(i + 1).padStart(2, '0'), { theme, x, y: 2.02, w: 0.44, h: 0.24, fontSize: 8.5, bold: true, color: teal });
    referenceText(page, trimText(stats[i] || stats[0], 42), {
      theme, x, y: 2.52, w: 1.82, h: 1.12, fontFace: referenceFont(theme, 'title'), fontSize: 18, bold: true, color: navy,
    });
    addReferenceRule(page, x, 3.94, 1.72, teal, 1.2);
  }

  await addReferenceImage(page, slide, presentation, { x: 7.56, y: 1.62, w: 4.92, h: 4.70 }, theme, 'wellness outcomes / healthcare evidence photograph', 0.16);
  referenceText(page, referenceDescription(slide, presentation, 'The visual evidence that supports the metrics.'), { theme, x: 0.84, y: 4.78, w: 5.88, h: 0.72, fontSize: 12, color: referenceColor(theme, 'text', '1A4568') });
}

async function renderAquaticProcess(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '285E89');
  const teal = referenceColor(theme, 'secondary', '9DCEDF');
  const steps = referenceProcessSteps(slide, 4);
  page.background = { color: referenceColor(theme, 'background', 'FFFFFF') };
  addAquaticWaves(page, theme, 'top');

  referenceLabel(page, 'PROCESS JOURNEY', 0.84, 0.66, 1.96, navy, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.82, y: 1.02, w: 7.30, h: 0.72,
    fontFace: referenceFont(theme, 'title'), fontSize: 30, bold: true, color: referenceColor(theme, 'title', '1A4568'),
  });
  referenceText(page, referenceSubtitle(slide, presentation, 'Each step is populated from the AI-generated slide content.'), {
    theme, x: 0.84, y: 1.78, w: 7.02, h: 0.46, fontSize: 12.4, color: referenceColor(theme, 'subtitle', '66A5BB'),
  });

  await addReferenceImage(page, slide, presentation, { x: 8.72, y: 0.68, w: 3.60, h: 2.26 }, theme, 'aquatic wellness process photograph', 0.12);

  const lineY = 3.92;
  addReferenceRule(page, 1.18, lineY, 10.60, teal, 2.4);

  for (let i = 0; i < 4; i++) {
    const step = steps[i] || {
      title: `Stage ${i + 1}`,
      body: referenceDescription(slide, presentation, ''),
      phase: `${String(i + 1).padStart(2, '0')} / PHASE`,
    };
    const x = 0.90 + i * 3.10;

    addReferenceCircle(page, x, lineY - 0.34, 0.68, navy, 0, 'FFFFFF', 100);
    referenceText(page, String(i + 1).padStart(2, '0'), {
      theme, x, y: lineY - 0.09, w: 0.68, h: 0.16, fontSize: 8.5, bold: true, align: 'center', color: 'FFFFFF',
    });

    referenceText(page, step.title, {
      theme, x: x - 0.02, y: 4.64, w: 2.64, h: 0.62,
      fontFace: referenceFont(theme, 'title'), fontSize: 14.2, bold: true, color: navy,
    });

    if (step.body) {
      referenceText(page, step.body, {
        theme, x: x - 0.02, y: 5.30, w: 2.64, h: 0.84, fontSize: 10.6, color: referenceColor(theme, 'text', '1A4568'),
      });
    }

    referenceLabel(page, step.phase || `${String(i + 1).padStart(2, '0')} / PHASE`, x - 0.02, 6.18, 2.40, referenceColor(theme, 'subtitle', '66A5BB'), theme);
  }

  addAquaticWaves(page, theme, 'bottom');
}

async function renderAquaticQuote(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '285E89');
  page.background = { color: navy };
  await addReferenceImage(page, slide, presentation, { x: 6.30, y: 0, w: 7.03, h: 7.5 }, theme, 'calm healthcare / nature photograph', 0);
  addReferenceRect(page, 0, 0, 7.0, 7.5, navy, 0);
  addReferenceWavesLeft(page, theme);

  referenceLabel(page, 'PERSPECTIVE', 0.92, 0.98, 1.54, referenceColor(theme, 'secondary', '9DCEDF'), theme);
  referenceText(page, '“', { theme, x: 0.88, y: 1.58, w: 0.52, h: 0.64, fontFace: referenceFont(theme, 'title'), fontSize: 40, bold: true, color: referenceColor(theme, 'secondary', '9DCEDF') });
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.96, y: 2.28, w: 4.95, h: 1.84, fontFace: referenceFont(theme, 'title'), fontSize: 28, bold: true, color: 'FFFFFF' });
  referenceText(page, referenceDescription(slide, presentation, 'A single idea, given room to breathe.'), { theme, x: 0.98, y: 4.72, w: 4.64, h: 0.82, fontSize: 13, color: 'DCEFF5' });
  referenceText(page, referenceValue(presentation?.author || presentation?.presenter, 'Nyxora AI'), { theme, x: 0.98, y: 6.02, w: 3.20, h: 0.24, fontSize: 10.5, bold: true, color: referenceColor(theme, 'secondary', '9DCEDF') });
}

function addReferenceWavesLeft(page, theme) {
  const blue = referenceColor(theme, 'secondary', '9DCEDF');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="900" viewBox="0 0 700 900"><path d="M0 170 C120 80 150 310 270 220 S420 60 700 120 L700 0 L0 0 Z" fill="#${blue}" fill-opacity="0.13"/><path d="M0 760 C140 650 240 870 390 770 S540 640 700 700 L700 900 L0 900 Z" fill="#${blue}" fill-opacity="0.10"/></svg>`;
  page.addImage({ data: svgToDataUri(svg), x: 0, y: 0, w: 5.82, h: 7.5 });
}

async function renderAquaticFullImage(page, slide, presentation, theme, index) {
  page.background = { color: '000000' };
  await addReferenceImage(page, slide, presentation, { x: 0, y: 0, w: 13.33, h: 7.5 }, theme, 'full-frame wellness / healthcare cinematic photograph', 0);
  addReferenceRect(page, 0, 4.66, 13.33, 2.84, referenceColor(theme, 'primary', '285E89'), 22);
  addAquaticWaves(page, theme, 'bottom');
  referenceLabel(page, `${String(index + 1).padStart(2, '0')} / VISUAL`, 0.86, 5.04, 1.54, 'FFFFFF', theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.84, y: 5.34, w: 8.82, h: 0.86, fontFace: referenceFont(theme, 'title'), fontSize: 31, bold: true, color: 'FFFFFF' });
  referenceText(page, referenceSubtitle(slide, presentation, 'A cinematic moment.'), { theme, x: 0.86, y: 6.36, w: 6.68, h: 0.50, fontSize: 12.8, color: 'E5F6FA' });
}

async function renderAquaticComparison(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '285E89');
  const teal = referenceColor(theme, 'secondary', '9DCEDF');
  const points = referencePoints(slide, 4);
  page.background = { color: 'FFFFFF' };
  addAquaticWaves(page, theme, 'top');

  referenceLabel(page, 'COMPARISON', 0.84, 0.64, 1.52, navy, theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.82, y: 0.98, w: 7.66, h: 0.68, fontFace: referenceFont(theme, 'title'), fontSize: 29, bold: true, color: navy });
  await addReferenceImageFromPrompt(page, `${referenceTopic(slide, presentation)} first state photograph, clean healthcare Pexels editorial style, no text`, { x: 0.84, y: 1.88, w: 5.80, h: 3.40 }, theme, 0.14);
  await addReferenceImageFromPrompt(page, `${referenceTopic(slide, presentation)} second state photograph, clean healthcare Pexels editorial style, no text`, { x: 6.98, y: 1.88, w: 5.50, h: 3.40 }, theme, 0.14);

  addReferenceCircle(page, 1.10, 5.46, 0.56, navy, 0, 'FFFFFF', 100);
  referenceText(page, '01', { theme, x: 1.10, y: 5.65, w: 0.56, h: 0.14, fontSize: 8, bold: true, align: 'center', color: 'FFFFFF' });
  referenceText(page, trimText(points[0] || 'Starting point', 92), { theme, x: 1.84, y: 5.46, w: 4.68, h: 0.50, fontSize: 11.3, color: referenceColor(theme, 'text', '1A4568') });
  addReferenceCircle(page, 7.22, 5.46, 0.56, teal, 0, 'FFFFFF', 100);
  referenceText(page, '02', { theme, x: 7.22, y: 5.65, w: 0.56, h: 0.14, fontSize: 8, bold: true, align: 'center', color: navy });
  referenceText(page, trimText(points[1] || 'Resulting point', 92), { theme, x: 7.96, y: 5.46, w: 4.42, h: 0.50, fontSize: 11.3, color: referenceColor(theme, 'text', '1A4568') });
}

async function renderAquaticClosing(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '285E89');
  page.background = { color: navy };
  await addReferenceImage(page, slide, presentation, { x: 6.58, y: 0.44, w: 6.02, h: 6.42 }, theme, 'calm closing wellness / nature photograph', 0.18);
  addAquaticWaves(page, theme, 'bottom');
  addAquaticWaves(page, theme, 'top');

  referenceLabel(page, 'KEY TAKEAWAY', 0.86, 1.04, 1.68, referenceColor(theme, 'secondary', '9DCEDF'), theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.82, y: 1.58, w: 5.30, h: 1.78, fontFace: referenceFont(theme, 'title'), fontSize: 36, bold: true, color: 'FFFFFF' });
  addAquaticWaterline(page, theme, 0.84, 3.78, 4.42);
  referenceText(page, referenceSubtitle(slide, presentation, 'A clear final message.'), { theme, x: 0.84, y: 4.18, w: 4.92, h: 0.86, fontSize: 13.5, color: 'DCEFF5' });
  referenceText(page, referenceValue(presentation?.organization, 'Nyxora AI'), { theme, x: 0.84, y: 6.12, w: 3.0, h: 0.24, fontSize: 10.2, bold: true, color: referenceColor(theme, 'secondary', '9DCEDF') });
}

// ======================================================
// BUSINESS — ANNUAL REPORT / CORPORATE DATA EDITORIAL
// ======================================================

async function renderBusinessReferenceSlide(page, slide, presentation, theme, layout, index) {
  switch (layout) {
    case 'title':
    case 'cover':
    case 'hero':
      return renderBusinessCover(page, slide, presentation, theme, index);
    case 'section-divider':
      return renderBusinessSection(page, slide, presentation, theme, index);
    case 'full-image':
      return renderBusinessFullImage(page, slide, presentation, theme, index);
    case 'quote':
      return renderBusinessQuote(page, slide, presentation, theme, index);
    case 'stats':
    case 'metric-grid':
      return renderBusinessStats(page, slide, presentation, theme, index);
    case 'chart':
    case 'table':
      return renderBusinessData(page, slide, presentation, theme, index);
    case 'timeline':
    case 'process':
    case 'diagram':
    case 'architecture':
      return renderBusinessProcess(page, slide, presentation, theme, index);
    case 'three-column':
      return renderBusinessThreeColumn(page, slide, presentation, theme, index);
    case 'imageText':
    case 'imagetext':
    case 'two-column':
      return renderBusinessImageText(page, slide, presentation, theme, index);
    case 'comparison':
    case 'before-after':
      return renderBusinessComparison(page, slide, presentation, theme, index);
    case 'case-study':
      return renderBusinessImageText(page, slide, presentation, theme, index);
    case 'testimonial':
      return renderBusinessQuote(page, slide, presentation, theme, index);
    case 'key-takeaway':
    case 'closing':
    case 'summary':
    case 'conclusion':
      return renderBusinessClosing(page, slide, presentation, theme, index);
    default:
      return renderBusinessContent(page, slide, presentation, theme, index);
  }
}

async function renderBusinessCover(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '00094A');
  const cyan = referenceColor(theme, 'secondary', '63DBF5');
  const blue = referenceColor(theme, 'tertiary', '516CEE');
  page.background = { color: 'FEFEFE' };

  addReferenceRect(page, 7.34, 0, 5.99, 7.5, navy);
  await addReferenceImage(page, slide, presentation, { x: 7.98, y: 0.66, w: 4.66, h: 4.24 }, theme, 'corporate annual-report hero photograph', 0);
  addReferenceRect(page, 7.80, 5.24, 4.96, 0.62, cyan, 3);
  addReferenceRect(page, 12.68, 0, 0.65, 1.66, blue, 0);
  addBusinessDiagonal(page, theme, 5.84, 4.72, 2.32, 1.84, cyan, 72);

  referenceLabel(page, 'ANNUAL REPORT', 0.84, 0.86, 1.86, blue, theme);
  referenceText(page, String(index + 1).padStart(2, '0'), { theme, x: 0.84, y: 1.32, w: 0.58, h: 0.26, fontSize: 10.5, bold: true, color: blue });
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.82, y: 1.74, w: 5.82, h: 1.64,
    fontFace: referenceFont(theme, 'title'), fontSize: 41, bold: true, color: navy,
  });
  referenceText(page, referenceSubtitle(slide, presentation, 'Performance, progress and perspective.'), {
    theme, x: 0.84, y: 3.94, w: 4.94, h: 0.76, fontSize: 15, color: blue,
  });
  addReferenceRule(page, 0.84, 5.00, 1.72, cyan, 2.2);
  referenceText(page, `${referenceValue(presentation?.organization, 'Nyxora AI')}  /  ${referenceValue(presentation?.date, getCurrentPresentationDate())}`, {
    theme, x: 0.84, y: 5.34, w: 5.48, h: 0.28, fontSize: 10.5, bold: true, color: navy,
  });
  referenceLabel(page, 'NYXORA AI', 8.02, 6.30, 1.40, 'FFFFFF', theme);
  referenceText(page, '01', { theme, x: 12.00, y: 6.30, w: 0.46, h: 0.22, fontSize: 9.5, bold: true, align: 'right', color: 'FFFFFF' });
}

async function renderBusinessSection(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '00094A');
  const cyan = referenceColor(theme, 'secondary', '63DBF5');
  page.background = { color: navy };
  addReferenceRect(page, 0, 0, 1.92, 7.5, cyan, 84);
  addReferenceRect(page, 11.86, 0, 1.47, 7.5, referenceColor(theme, 'tertiary', '516CEE'), 75);
  await addReferenceImage(page, slide, presentation, { x: 7.98, y: 1.16, w: 4.32, h: 4.68 }, theme, 'corporate section photography', 0);
  addBusinessDiagonal(page, theme, 5.92, 0.46, 2.16, 2.26, cyan, 78);

  referenceText(page, String(index + 1).padStart(2, '0'), { theme, x: 0.92, y: 1.04, w: 0.70, h: 0.34, fontSize: 12, bold: true, color: cyan });
  referenceLabel(page, 'SECTION', 1.84, 1.08, 1.12, cyan, theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.92, y: 1.76, w: 6.30, h: 1.70, fontFace: referenceFont(theme, 'title'), fontSize: 39, bold: true, color: 'FFFFFF' });
  referenceText(page, referenceSubtitle(slide, presentation, 'A clean division point for the report.'), { theme, x: 0.94, y: 4.08, w: 5.55, h: 0.82, fontSize: 14, color: 'D9EBF5' });
  addReferenceRule(page, 0.94, 5.30, 2.06, cyan, 1.5);
  referenceLabel(page, 'ANNUAL REPORT / NYXORA', 0.94, 5.58, 2.42, referenceColor(theme, 'tertiary', '516CEE'), theme);
}

async function renderBusinessContent(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '00094A');
  const cyan = referenceColor(theme, 'secondary', '63DBF5');
  const blue = referenceColor(theme, 'tertiary', '516CEE');
  const points = referencePoints(slide, 5);
  page.background = { color: 'FEFEFE' };
  addBusinessGrid(page, theme, index);

  referenceLabel(page, 'SECTION', 0.84, 0.62, 1.16, blue, theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.82, y: 0.98, w: 7.42, h: 0.74, fontFace: referenceFont(theme, 'title'), fontSize: 30, bold: true, color: navy });
  referenceText(page, referenceSubtitle(slide, presentation, 'A concise business view of the subject.'), { theme, x: 0.84, y: 1.82, w: 6.62, h: 0.54, fontSize: 13.5, color: blue });

  await addReferenceImage(page, slide, presentation, { x: 8.34, y: 0.78, w: 4.18, h: 2.58 }, theme, 'business / real-world context photograph', 0);
  await addReferenceImageFromPrompt(page, `${referenceTopic(slide, presentation)} detail or close-up, premium corporate Pexels photography, no text`, { x: 7.94, y: 3.70, w: 2.18, h: 2.02 }, theme, 0);
  await addReferenceImageFromPrompt(page, `${referenceTopic(slide, presentation)} environment or people context, premium corporate Pexels photography, no text`, { x: 10.38, y: 3.70, w: 2.14, h: 2.02 }, theme, 0);

  addReferenceRule(page, 0.84, 2.74, 6.48, cyan, 1.5);
  points.forEach((point, i) => {
    const y = 3.10 + i * 0.54;
    referenceText(page, String(i + 1).padStart(2, '0'), { theme, x: 0.86, y, w: 0.46, h: 0.22, fontSize: 9, bold: true, color: blue });
    referenceText(page, trimText(point, 128), { theme, x: 1.48, y: y - 0.02, w: 5.54, h: 0.38, fontSize: 11.6, color: navy });
  });

  referenceLabel(page, 'INSIGHT', 8.00, 6.05, 1.02, blue, theme);
  referenceText(page, referenceDescription(slide, presentation, 'A concise business insight supporting the topic.'), { theme, x: 9.00, y: 5.98, w: 3.52, h: 0.60, fontSize: 10.2, color: navy });
}

async function renderBusinessImageText(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '00094A');
  const blue = referenceColor(theme, 'tertiary', '516CEE');
  const cyan = referenceColor(theme, 'secondary', '63DBF5');
  page.background = { color: 'FEFEFE' };
  addBusinessGrid(page, theme, index);

  referenceLabel(page, 'VISUAL STORY', 0.84, 0.62, 1.68, blue, theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.82, y: 1.00, w: 5.30, h: 1.16, fontFace: referenceFont(theme, 'title'), fontSize: 31, bold: true, color: navy });
  referenceText(page, referenceSubtitle(slide, presentation, 'A concise narrative with a strong visual anchor.'), { theme, x: 0.84, y: 2.40, w: 4.94, h: 1.02, fontSize: 14, color: blue });
  addReferenceRule(page, 0.84, 3.78, 1.84, cyan, 2.0);
  referenceText(page, referenceDescription(slide, presentation, 'Supporting business context.'), { theme, x: 0.84, y: 4.14, w: 4.62, h: 0.88, fontSize: 11.8, color: navy });
  referenceLabel(page, `${String(index + 1).padStart(2, '0')} / NYXORA`, 0.84, 6.02, 1.72, blue, theme);

  await addReferenceImage(page, slide, presentation, { x: 5.58, y: 0.62, w: 6.56, h: 5.94 }, theme, 'large corporate editorial photograph', 0);
}

async function renderBusinessThreeColumn(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '00094A');
  const blue = referenceColor(theme, 'tertiary', '516CEE');
  const cyan = referenceColor(theme, 'secondary', '63DBF5');
  const points = referencePoints(slide, 3);
  page.background = { color: 'FEFEFE' };
  addBusinessGrid(page, theme, index);

  referenceLabel(page, 'HIGHLIGHTS', 0.84, 0.64, 1.32, blue, theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.82, y: 1.02, w: 8.0, h: 0.68, fontFace: referenceFont(theme, 'title'), fontSize: 29, bold: true, color: navy });

  const xs = [0.82, 4.48, 8.14];
  for (let i = 0; i < 3; i++) {
    const x = xs[i];
    await addReferenceImageFromPrompt(page, `${referenceTopic(slide, presentation)} ${['leadership / subject','operations / detail','market / environment'][i]} photograph, premium annual-report Pexels style, no text`, { x, y: 1.92, w: 3.18, h: 2.18 }, theme, 0);
    referenceText(page, String(i + 1).padStart(2, '0'), { theme, x, y: 4.34, w: 0.52, h: 0.22, fontSize: 9, bold: true, color: blue });
    referenceText(page, trimText(points[i] || referenceDescription(slide, presentation, 'Supporting point.'), 90), { theme, x: x + 0.64, y: 4.24, w: 2.42, h: 0.90, fontSize: 11.1, color: navy });
    addReferenceRule(page, x, 5.42, 3.14, cyan, 1.2);
  }
}

async function renderBusinessStats(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '00094A');
  const cyan = referenceColor(theme, 'secondary', '63DBF5');
  const blue = referenceColor(theme, 'tertiary', '516CEE');
  const points = referencePoints(slide, 3);
  page.background = { color: 'FEFEFE' };
  addBusinessGrid(page, theme, index);

  referenceLabel(page, 'PERFORMANCE', 0.84, 0.64, 1.46, blue, theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.82, y: 1.00, w: 8.0, h: 0.68, fontFace: referenceFont(theme, 'title'), fontSize: 29, bold: true, color: navy });

  const stats = points.length ? points : ['Reach', 'Growth', 'Outcome'];
  for (let i = 0; i < 3; i++) {
    const x = 0.84 + i * 2.08;
    referenceText(page, String(i + 1).padStart(2, '0'), { theme, x, y: 2.10, w: 0.44, h: 0.20, fontSize: 8.5, bold: true, color: blue });
    referenceText(page, trimText(stats[i] || stats[0], 40), { theme, x, y: 2.62, w: 1.70, h: 0.98, fontFace: referenceFont(theme, 'title'), fontSize: 18, bold: true, color: navy });
    addReferenceRule(page, x, 3.90, 1.70, cyan, 1.7);
  }
  await addReferenceImage(page, slide, presentation, { x: 7.62, y: 1.56, w: 4.88, h: 4.72 }, theme, 'business results / executive photography', 0);
  referenceText(page, referenceDescription(slide, presentation, 'The visual evidence behind the headline metrics.'), { theme, x: 0.84, y: 4.86, w: 5.86, h: 0.70, fontSize: 11.8, color: navy });
}

async function renderBusinessData(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '00094A');
  const cyan = referenceColor(theme, 'secondary', '63DBF5');
  const blue = referenceColor(theme, 'tertiary', '516CEE');
  const points = referencePoints(slide, 5);
  page.background = { color: 'FEFEFE' };
  addBusinessGrid(page, theme, index);

  referenceLabel(page, 'DATA STORY', 0.84, 0.64, 1.44, blue, theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.82, y: 1.00, w: 7.88, h: 0.70, fontFace: referenceFont(theme, 'title'), fontSize: 29, bold: true, color: navy });

  await addReferenceImage(page, slide, presentation, { x: 8.02, y: 0.78, w: 4.48, h: 2.62 }, theme, 'business analytics / market photograph', 0);

  referenceText(page, '01', { theme, x: 0.86, y: 2.00, w: 0.54, h: 0.24, fontSize: 9, bold: true, color: blue });
  referenceText(page, trimText(points[0] || referenceSubtitle(slide, presentation, 'Primary signal'), 54), { theme, x: 1.54, y: 1.94, w: 5.72, h: 0.58, fontFace: referenceFont(theme, 'title'), fontSize: 18, bold: true, color: navy });
  addReferenceRule(page, 0.86, 2.68, 6.40, cyan, 1.4);

  for (let i = 1; i < Math.min(points.length, 5); i++) {
    const y = 2.98 + (i - 1) * 0.68;
    referenceText(page, String(i + 1).padStart(2, '0'), { theme, x: 0.86, y, w: 0.54, h: 0.22, fontSize: 8.5, bold: true, color: blue });
    referenceText(page, trimText(points[i], 98), { theme, x: 1.54, y: y - 0.02, w: 5.72, h: 0.42, fontSize: 11.2, color: navy });
    addReferenceRule(page, 0.86, y + 0.56, 6.40, 'D7E6EC', 0.8);
  }

  referenceLabel(page, 'SOURCE / CONTEXT', 8.04, 3.92, 2.10, blue, theme);
  referenceText(page, referenceDescription(slide, presentation, 'Supporting context for the data story.'), { theme, x: 8.04, y: 4.26, w: 4.44, h: 1.02, fontSize: 11.2, color: navy });
}

async function renderBusinessProcess(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '00094A');
  const cyan = referenceColor(theme, 'secondary', '63DBF5');
  const blue = referenceColor(theme, 'tertiary', '516CEE');
  const steps = referenceProcessSteps(slide, 4);
  page.background = { color: 'FEFEFE' };
  addBusinessGrid(page, theme, index);

  referenceLabel(page, 'PROCESS / TIMELINE', 0.84, 0.64, 2.18, blue, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.82, y: 1.00, w: 7.80, h: 0.66, fontFace: referenceFont(theme, 'title'), fontSize: 29, bold: true, color: navy,
  });
  referenceText(page, referenceSubtitle(slide, presentation, 'A connected sequence built from the AI-generated stages.'), {
    theme, x: 0.84, y: 1.74, w: 7.10, h: 0.46, fontSize: 12.3, color: referenceColor(theme, 'mutedText', '516CEE'),
  });
  await addReferenceImage(page, slide, presentation, { x: 8.30, y: 0.72, w: 4.10, h: 2.40 }, theme, 'corporate workflow / transformation photograph', 0.01);

  const lineY = 3.98;
  addReferenceRule(page, 1.12, lineY, 10.70, cyan, 1.8);

  for (let i = 0; i < 4; i++) {
    const step = steps[i] || {
      title: `Stage ${i + 1}`,
      body: referenceDescription(slide, presentation, ''),
      phase: `${String(i + 1).padStart(2, '0')} / PHASE`,
    };
    const x = 0.98 + i * 3.12;

    addReferenceRect(page, x, 3.72, 0.66, 0.52, navy);
    referenceText(page, String(i + 1).padStart(2, '0'), {
      theme, x, y: 3.88, w: 0.66, h: 0.15, fontSize: 8, bold: true, align: 'center', color: 'FFFFFF',
    });

    referenceText(page, step.title, {
      theme, x: x - 0.04, y: 4.52, w: 2.68, h: 0.64, fontFace: referenceFont(theme, 'title'), fontSize: 13.5, bold: true, color: navy,
    });

    if (step.body) {
      referenceText(page, step.body, {
        theme, x: x - 0.04, y: 5.22, w: 2.68, h: 0.80, fontSize: 10.4, color: referenceColor(theme, 'text', '00094A'),
      });
    }

    referenceLabel(page, step.phase || `${String(i + 1).padStart(2, '0')} / PHASE`, x - 0.04, 6.10, 2.30, blue, theme);
    addReferenceRule(page, x - 0.04, 6.38, 2.62, referenceColor(theme, 'border', 'B9DCE8'), 0.9);
  }

  referenceText(page, referenceDescription(slide, presentation, 'A connected view of the progression.'), {
    theme, x: 0.90, y: 6.74, w: 6.70, h: 0.32, fontSize: 10.8, color: navy,
  });
}

async function renderBusinessQuote(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '00094A');
  const cyan = referenceColor(theme, 'secondary', '63DBF5');
  page.background = { color: 'FEFEFE' };
  await addReferenceImage(page, slide, presentation, { x: 0, y: 0, w: 7.02, h: 7.5 }, theme, 'executive / corporate editorial portrait or context photograph', 0);
  addReferenceRect(page, 6.44, 0, 6.89, 7.5, navy);
  addBusinessDiagonal(page, theme, 6.42, 5.08, 2.22, 1.96, cyan, 76);

  referenceLabel(page, 'PERSPECTIVE', 7.24, 1.08, 1.54, cyan, theme);
  referenceText(page, '“', { theme, x: 7.18, y: 1.56, w: 0.50, h: 0.62, fontFace: referenceFont(theme, 'title'), fontSize: 40, bold: true, color: cyan });
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 7.30, y: 2.22, w: 4.72, h: 1.84, fontFace: referenceFont(theme, 'title'), fontSize: 27, bold: true, color: 'FFFFFF' });
  referenceText(page, referenceDescription(slide, presentation, 'A focused statement with room for emphasis.'), { theme, x: 7.30, y: 4.66, w: 4.50, h: 0.86, fontSize: 12.6, color: 'D9EBF5' });
  referenceText(page, referenceValue(presentation?.author || presentation?.presenter, 'Nyxora AI'), { theme, x: 7.30, y: 6.16, w: 3.00, h: 0.24, fontSize: 10.4, bold: true, color: cyan });
}

async function renderBusinessFullImage(page, slide, presentation, theme, index) {
  page.background = { color: '000000' };
  await addReferenceImage(page, slide, presentation, { x: 0, y: 0, w: 13.33, h: 7.5 }, theme, 'full-frame corporate annual-report photograph', 0);
  addReferenceRect(page, 0, 4.74, 13.33, 2.76, '00094A', 24);
  referenceLabel(page, `${String(index + 1).padStart(2, '0')} / VISUAL`, 0.86, 5.08, 1.62, '63DBF5', theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.84, y: 5.38, w: 8.76, h: 0.82, fontFace: referenceFont(theme, 'title'), fontSize: 30, bold: true, color: 'FFFFFF' });
  referenceText(page, referenceSubtitle(slide, presentation, 'A cinematic business visual.'), { theme, x: 0.86, y: 6.38, w: 6.60, h: 0.46, fontSize: 12.5, color: 'D9EBF5' });
}

async function renderBusinessComparison(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '00094A');
  const cyan = referenceColor(theme, 'secondary', '63DBF5');
  const blue = referenceColor(theme, 'tertiary', '516CEE');
  const points = referencePoints(slide, 4);
  page.background = { color: 'FEFEFE' };
  addBusinessGrid(page, theme, index);

  referenceLabel(page, 'COMPARISON', 0.84, 0.64, 1.50, blue, theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.82, y: 0.98, w: 7.84, h: 0.70, fontFace: referenceFont(theme, 'title'), fontSize: 29, bold: true, color: navy });
  await addReferenceImageFromPrompt(page, `${referenceTopic(slide, presentation)} current / starting state, premium corporate Pexels editorial photography, no text`, { x: 0.84, y: 1.90, w: 5.80, h: 3.42 }, theme, 0);
  await addReferenceImageFromPrompt(page, `${referenceTopic(slide, presentation)} improved / resulting state, premium corporate Pexels editorial photography, no text`, { x: 6.98, y: 1.90, w: 5.52, h: 3.42 }, theme, 0);

  addReferenceRect(page, 0.84, 5.58, 5.80, 0.72, navy);
  referenceLabel(page, '01 / CURRENT', 1.08, 5.82, 1.32, cyan, theme);
  referenceText(page, trimText(points[0] || 'Current state', 60), { theme, x: 2.34, y: 5.74, w: 4.04, h: 0.36, fontSize: 10.5, bold: true, color: 'FFFFFF' });
  addReferenceRect(page, 6.98, 5.58, 5.52, 0.72, blue);
  referenceLabel(page, '02 / NEXT', 7.22, 5.82, 1.18, 'FFFFFF', theme);
  referenceText(page, trimText(points[1] || 'Resulting state', 60), { theme, x: 8.36, y: 5.74, w: 3.92, h: 0.36, fontSize: 10.5, bold: true, color: 'FFFFFF' });
}

async function renderBusinessClosing(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '00094A');
  const cyan = referenceColor(theme, 'secondary', '63DBF5');
  const blue = referenceColor(theme, 'tertiary', '516CEE');
  page.background = { color: 'FEFEFE' };
  addReferenceRect(page, 0, 0, 6.98, 7.5, navy);
  await addReferenceImage(page, slide, presentation, { x: 7.18, y: 0.56, w: 5.52, h: 5.84 }, theme, 'closing corporate annual-report photograph', 0);
  addReferenceRect(page, 7.18, 6.10, 5.52, 0.56, cyan, 2);
  addBusinessDiagonal(page, theme, 5.74, 0.40, 1.98, 2.12, cyan, 76);

  referenceLabel(page, 'KEY TAKEAWAY', 0.92, 1.06, 1.72, cyan, theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.86, y: 1.62, w: 5.20, h: 1.74, fontFace: referenceFont(theme, 'title'), fontSize: 37, bold: true, color: 'FFFFFF' });
  addReferenceRule(page, 0.90, 3.88, 1.82, cyan, 2.0);
  referenceText(page, referenceSubtitle(slide, presentation, 'The closing message in one clear visual statement.'), { theme, x: 0.90, y: 4.24, w: 4.92, h: 0.96, fontSize: 13.5, color: 'D9EBF5' });
  referenceLabel(page, `${String(index + 1).padStart(2, '0')} / NYXORA AI`, 0.90, 6.22, 2.10, blue, theme);
  referenceText(page, referenceValue(presentation?.organization, 'Nyxora AI'), { theme, x: 7.40, y: 6.22, w: 3.60, h: 0.22, fontSize: 10, bold: true, color: navy });
}

// ======================================================
// MODERN CLASSROOM — PREMIUM EDUCATIONAL EDITORIAL
// ======================================================

async function renderModernClassroomReferenceSlide(page, slide, presentation, theme, layout, index) {
  switch (layout) {
    case 'title':
    case 'cover':
    case 'hero':
      return renderModernClassroomCover(page, slide, presentation, theme, index);
    case 'section-divider':
      return renderModernClassroomSection(page, slide, presentation, theme, index);
    case 'full-image':
      return renderModernClassroomFullImage(page, slide, presentation, theme, index);
    case 'quote':
    case 'testimonial':
      return renderModernClassroomQuote(page, slide, presentation, theme, index);
    case 'stats':
    case 'metric-grid':
      return renderModernClassroomStats(page, slide, presentation, theme, index);
    case 'process':
    case 'timeline':
    case 'diagram':
    case 'architecture':
      return renderModernClassroomProcess(page, slide, presentation, theme, index);
    case 'comparison':
    case 'before-after':
      return renderModernClassroomComparison(page, slide, presentation, theme, index);
    case 'imageText':
    case 'imagetext':
    case 'two-column':
    case 'three-column':
    case 'case-study':
      return renderModernClassroomImageStory(page, slide, presentation, theme, index);
    case 'key-takeaway':
    case 'closing':
    case 'summary':
    case 'conclusion':
      return renderModernClassroomClosing(page, slide, presentation, theme, index);
    default:
      return renderModernClassroomContent(page, slide, presentation, theme, index);
  }
}

function addModernClassroomFrame(page, theme, index, dark = false) {
  const navy = referenceColor(theme, 'primary', '0B4F6C');
  const teal = referenceColor(theme, 'secondary', '20B2AA');
  const gold = referenceColor(theme, 'tertiary', 'D89B2B');
  if (!dark) {
    addReferenceRect(page, 0, 0, 0.12, 7.5, navy);
    addReferenceRect(page, 0.12, 0, 0.05, 7.5, teal);
    addReferenceRect(page, 0, 0, 2.30, 0.08, navy);
    addReferenceRect(page, 2.30, 0, 1.10, 0.08, teal);
    addReferenceRect(page, 3.40, 0, 0.62, 0.08, gold);
  } else {
    addReferenceRect(page, 0, 0, 13.33, 0.09, teal);
    addReferenceRect(page, 0, 7.41, 13.33, 0.09, navy);
  }

  referenceLabel(
    page,
    `${String(index + 1).padStart(2, '0')} / NYXORA CLASSROOM`,
    10.18,
    0.28,
    2.28,
    dark ? teal : navy,
    theme
  );
}

async function renderModernClassroomCover(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '0B4F6C');
  const teal = referenceColor(theme, 'secondary', '20B2AA');
  const gold = referenceColor(theme, 'tertiary', 'D89B2B');
  page.background = { color: referenceColor(theme, 'background', 'F7F8FA') };

  addReferenceRect(page, 0, 0, 4.52, 7.5, navy);
  addReferenceRect(page, 4.52, 0, 8.81, 7.5, referenceColor(theme, 'surface', 'F0F4F8'));
  addReferenceRect(page, 0, 0, 0.10, 7.5, teal);
  addReferenceRect(page, 4.10, 5.98, 0.42, 0.82, gold);
  addReferenceRect(page, 4.34, 5.76, 0.58, 0.22, teal);

  await addReferenceImage(page, slide, presentation, { x: 6.00, y: 0.58, w: 6.42, h: 6.34 }, theme, 'modern classroom / learning / student study hero photograph', 0.06);

  referenceLabel(page, 'MODERN CLASSROOM', 0.78, 0.82, 2.30, teal, theme);
  referenceText(page, String(index + 1).padStart(2, '0'), {
    theme, x: 0.78, y: 1.34, w: 0.84, h: 0.54, fontFace: referenceFont(theme, 'title'), fontSize: 25, bold: true, color: 'FFFFFF',
  });
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.78, y: 2.04, w: 3.20, h: 1.88,
    fontFace: referenceFont(theme, 'title'), fontSize: 38, bold: true, color: 'FFFFFF',
  });
  addReferenceRule(page, 0.80, 4.28, 1.58, gold, 2.2);
  referenceText(page, referenceSubtitle(slide, presentation, 'A polished lesson story built for clear learning.'), {
    theme, x: 0.80, y: 4.62, w: 2.96, h: 1.00, fontSize: 13.4, color: 'E7F3F5',
  });
  referenceLabel(page, 'PRESENTED BY', 0.80, 6.28, 1.28, teal, theme);
  referenceText(page, referenceValue(presentation?.presenter || presentation?.author, 'Nyxora AI'), {
    theme, x: 0.80, y: 6.54, w: 2.70, h: 0.28, fontSize: 11.2, bold: true, color: 'FFFFFF',
  });
  referenceText(page, referenceValue(presentation?.date, getCurrentPresentationDate()), {
    theme, x: 3.04, y: 6.54, w: 1.00, h: 0.28, fontSize: 9.6, bold: true, align: 'right', color: 'C7E7EC',
  });
}

async function renderModernClassroomSection(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '0B4F6C');
  const teal = referenceColor(theme, 'secondary', '20B2AA');
  page.background = { color: referenceColor(theme, 'surface', 'F0F4F8') };
  addModernClassroomFrame(page, theme, index);

  await addReferenceImage(page, slide, presentation, { x: 7.92, y: 0.84, w: 4.54, h: 5.92 }, theme, 'classroom / science learning editorial photograph', 0.04);

  referenceLabel(page, 'LESSON SECTION', 0.78, 0.86, 1.70, teal, theme);
  referenceText(page, String(index + 1).padStart(2, '0'), {
    theme, x: 0.78, y: 1.48, w: 1.00, h: 0.58, fontFace: referenceFont(theme, 'title'), fontSize: 26, bold: true, color: navy,
  });
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.80, y: 2.12, w: 5.72, h: 1.86,
    fontFace: referenceFont(theme, 'title'), fontSize: 36, bold: true, color: referenceColor(theme, 'title', '0C2340'),
  });
  addReferenceRule(page, 0.82, 4.24, 1.52, teal, 1.8);
  referenceText(page, referenceSubtitle(slide, presentation, 'A focused chapter in the lesson.'), {
    theme, x: 0.82, y: 4.56, w: 5.52, h: 0.96, fontSize: 13.5, color: referenceColor(theme, 'subtitle', '5B6B7A'),
  });
  referenceLabel(page, 'CORE IDEA', 0.82, 6.14, 1.18, navy, theme);
  referenceText(page, referenceDescription(slide, presentation, 'Use the slide narrative to reinforce the core idea.'), {
    theme, x: 2.12, y: 6.06, w: 4.72, h: 0.60, fontSize: 10.8, color: referenceColor(theme, 'text', '16263A'),
  });
}

async function renderModernClassroomContent(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '0B4F6C');
  const teal = referenceColor(theme, 'secondary', '20B2AA');
  const gold = referenceColor(theme, 'tertiary', 'D89B2B');
  const points = referencePoints(slide, 5);
  page.background = { color: referenceColor(theme, 'background', 'F7F8FA') };
  addModernClassroomFrame(page, theme, index);

  referenceLabel(page, 'LESSON NOTE', 0.76, 0.58, 1.34, navy, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 0.76, y: 0.90, w: 7.34, h: 0.76,
    fontFace: referenceFont(theme, 'title'), fontSize: 30, bold: true, color: referenceColor(theme, 'title', '0C2340'),
  });
  referenceText(page, referenceSubtitle(slide, presentation, 'Core concepts and evidence from the generated lesson.'), {
    theme, x: 0.78, y: 1.70, w: 6.98, h: 0.48, fontSize: 12.4, color: referenceColor(theme, 'subtitle', '5B6B7A'),
  });

  await addReferenceImage(page, slide, presentation, { x: 8.86, y: 0.76, w: 3.66, h: 2.52 }, theme, 'student learning / classroom context editorial photograph', 0.05);
  addReferenceRect(page, 8.54, 0.76, 0.06, 2.52, teal);
  referenceLabel(page, 'VISUAL CONTEXT', 8.88, 3.58, 1.64, navy, theme);
  referenceText(page, referenceDescription(slide, presentation, 'Visual context supporting the lesson.'), {
    theme, x: 8.88, y: 3.88, w: 3.46, h: 0.72, fontSize: 10.8, color: referenceColor(theme, 'text', '16263A'),
  });

  const count = Math.min(points.length, 5);
  const topY = 2.52;
  const rowGap = count >= 5 ? 0.76 : 0.86;

  for (let i = 0; i < count; i++) {
    const y = topY + i * rowGap;
    addReferenceRect(page, 0.78, y, 0.06, 0.56, i % 2 === 0 ? navy : teal);
    referenceText(page, String(i + 1).padStart(2, '0'), {
      theme, x: 0.98, y: y + 0.02, w: 0.48, h: 0.26, fontSize: 9.2, bold: true, color: gold,
    });
    referenceText(page, points[i], {
      theme, x: 1.58, y: y - 0.02, w: 6.56, h: 0.62, fontSize: 11.5, color: referenceColor(theme, 'text', '16263A'),
    });
    addReferenceRule(page, 1.58, y + 0.62, 6.28, referenceColor(theme, 'border', 'D6DEE6'), 0.8);
  }

  if (count === 0) {
    referenceText(page, referenceDescription(slide, presentation, 'Add the key concept or explanation here.'), {
      theme, x: 1.58, y: 2.66, w: 6.28, h: 1.12, fontSize: 12.2, color: referenceColor(theme, 'text', '16263A'),
    });
  }
}

async function renderModernClassroomImageStory(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '0B4F6C');
  const teal = referenceColor(theme, 'secondary', '20B2AA');
  page.background = { color: referenceColor(theme, 'background', 'F7F8FA') };
  addModernClassroomFrame(page, theme, index);

  await addReferenceImage(page, slide, presentation, { x: 0.76, y: 0.84, w: 6.08, h: 5.86 }, theme, 'education / classroom subject editorial photograph', 0.04);

  referenceLabel(page, 'VISUAL STORY', 7.44, 0.82, 1.50, navy, theme);
  referenceText(page, referenceTitle(slide, presentation), {
    theme, x: 7.42, y: 1.18, w: 4.82, h: 1.30, fontFace: referenceFont(theme, 'title'), fontSize: 30, bold: true, color: referenceColor(theme, 'title', '0C2340'),
  });
  referenceText(page, referenceSubtitle(slide, presentation, 'Explanation paired with visual context.'), {
    theme, x: 7.44, y: 2.64, w: 4.60, h: 0.82, fontSize: 13.0, color: referenceColor(theme, 'subtitle', '5B6B7A'),
  });

  const points = referencePoints(slide, 3);
  const ys = [3.72, 4.64, 5.56];
  points.forEach((point, i) => {
    addReferenceCircle(page, 7.46, ys[i], 0.42, i === 1 ? teal : navy);
    referenceText(page, String(i + 1).padStart(2, '0'), { theme, x: 7.46, y: ys[i] + 0.13, w: 0.42, h: 0.14, fontSize: 7.5, bold: true, align: 'center', color: 'FFFFFF' });
    referenceText(page, point, { theme, x: 8.08, y: ys[i] - 0.02, w: 4.18, h: 0.54, fontSize: 10.7, color: referenceColor(theme, 'text', '16263A') });
  });
  referenceLabel(page, 'TEACHER NOTE', 7.46, 6.52, 1.46, teal, theme);
}

async function renderModernClassroomProcess(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '0B4F6C');
  const teal = referenceColor(theme, 'secondary', '20B2AA');
  const gold = referenceColor(theme, 'tertiary', 'D89B2B');
  const steps = referenceProcessSteps(slide, 4);
  page.background = { color: referenceColor(theme, 'surface', 'F0F4F8') };
  addModernClassroomFrame(page, theme, index);

  referenceLabel(page, 'LEARNING PATH', 0.76, 0.58, 1.44, navy, theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.76, y: 0.90, w: 7.40, h: 0.76, fontFace: referenceFont(theme, 'title'), fontSize: 30, bold: true, color: referenceColor(theme, 'title', '0C2340') });
  referenceText(page, referenceSubtitle(slide, presentation, 'The generated stages are shown directly in the sequence.'), { theme, x: 0.78, y: 1.70, w: 7.24, h: 0.44, fontSize: 12.3, color: referenceColor(theme, 'subtitle', '5B6B7A') });

  await addReferenceImage(page, slide, presentation, { x: 9.02, y: 0.72, w: 3.42, h: 2.18 }, theme, 'learning process / classroom activity photograph', 0.04);

  const lineY = 3.62;
  addReferenceRule(page, 1.12, lineY, 10.56, teal, 2.4);

  for (let i = 0; i < 4; i++) {
    const step = steps[i] || { title: `Stage ${i + 1}`, body: referenceDescription(slide, presentation, ''), phase: `${String(i + 1).padStart(2, '0')} / PHASE` };
    const x = 0.92 + i * 3.08;
    const marker = i % 2 === 0 ? navy : teal;
    addReferenceCircle(page, x, lineY - 0.32, 0.64, marker);
    referenceText(page, String(i + 1).padStart(2, '0'), { theme, x, y: lineY - 0.08, w: 0.64, h: 0.16, fontSize: 8.2, bold: true, align: 'center', color: 'FFFFFF' });
    referenceText(page, step.title, { theme, x: x - 0.02, y: 4.28, w: 2.58, h: 0.58, fontFace: referenceFont(theme, 'title'), fontSize: 14, bold: true, color: navy });
    if (step.body) {
      referenceText(page, step.body, { theme, x: x - 0.02, y: 4.94, w: 2.58, h: 0.88, fontSize: 10.3, color: referenceColor(theme, 'text', '16263A') });
    }
    referenceLabel(page, step.phase || `${String(i + 1).padStart(2, '0')} / PHASE`, x - 0.02, 5.98, 2.26, gold, theme);
  }

  addReferenceRect(page, 0.78, 6.56, 0.05, 0.46, teal);
  referenceText(page, referenceDescription(slide, presentation, 'A connected progression from the first idea to the final outcome.'), { theme, x: 1.02, y: 6.50, w: 7.30, h: 0.54, fontSize: 10.6, color: referenceColor(theme, 'subtitle', '5B6B7A') });
}

async function renderModernClassroomStats(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '0B4F6C');
  const teal = referenceColor(theme, 'secondary', '20B2AA');
  const gold = referenceColor(theme, 'tertiary', 'D89B2B');
  const points = referencePoints(slide, 3);
  page.background = { color: referenceColor(theme, 'background', 'F7F8FA') };
  addModernClassroomFrame(page, theme, index);

  referenceLabel(page, 'LEARNING SIGNALS', 0.76, 0.58, 1.76, navy, theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.76, y: 0.90, w: 7.2, h: 0.72, fontFace: referenceFont(theme, 'title'), fontSize: 30, bold: true, color: referenceColor(theme, 'title', '0C2340') });

  await addReferenceImage(page, slide, presentation, { x: 9.12, y: 0.72, w: 3.18, h: 2.18 }, theme, 'students learning / education results editorial photograph', 0.04);

  for (let i = 0; i < 3; i++) {
    const x = 0.80 + i * 2.44;
    const value = points[i] || ['Concept', 'Evidence', 'Outcome'][i];
    referenceText(page, String(i + 1).padStart(2, '0'), { theme, x, y: 2.34, w: 0.50, h: 0.26, fontSize: 9.2, bold: true, color: gold });
    referenceText(page, value, { theme, x, y: 2.82, w: 2.02, h: 1.36, fontFace: referenceFont(theme, 'title'), fontSize: 19, bold: true, color: navy });
    addReferenceRule(page, x, 4.34, 2.06, i === 1 ? teal : navy, 1.6);
  }

  referenceLabel(page, 'INTERPRETATION', 0.82, 5.14, 1.54, teal, theme);
  referenceText(page, referenceDescription(slide, presentation, 'Use the narrative to explain why these learning signals matter.'), { theme, x: 0.82, y: 5.46, w: 7.24, h: 0.94, fontSize: 11.8, color: referenceColor(theme, 'text', '16263A') });
}

async function renderModernClassroomComparison(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '0B4F6C');
  const teal = referenceColor(theme, 'secondary', '20B2AA');
  page.background = { color: referenceColor(theme, 'background', 'F7F8FA') };
  addModernClassroomFrame(page, theme, index);

  referenceLabel(page, 'COMPARE', 0.76, 0.58, 0.96, navy, theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.76, y: 0.90, w: 8.10, h: 0.74, fontFace: referenceFont(theme, 'title'), fontSize: 30, bold: true, color: referenceColor(theme, 'title', '0C2340') });

  await addReferenceImageFromPrompt(page, `${referenceTopic(slide, presentation)} first concept / classroom context, premium education editorial Pexels photography, no text`, { x: 0.80, y: 1.82, w: 5.76, h: 3.26 }, theme, 0.04);
  await addReferenceImageFromPrompt(page, `${referenceTopic(slide, presentation)} second concept / classroom context, premium education editorial Pexels photography, no text`, { x: 6.76, y: 1.82, w: 5.76, h: 3.26 }, theme, 0.04);

  const points = referencePoints(slide, 2);
  addReferenceRect(page, 0.80, 5.34, 5.76, 0.92, navy);
  addReferenceRect(page, 6.76, 5.34, 5.76, 0.92, teal);
  referenceLabel(page, '01 /', 1.02, 5.52, 0.70, 'FFFFFF', theme);
  referenceText(page, points[0] || 'First concept', { theme, x: 1.76, y: 5.47, w: 4.46, h: 0.46, fontSize: 10.6, bold: true, color: 'FFFFFF' });
  referenceLabel(page, '02 /', 6.98, 5.52, 0.70, 'FFFFFF', theme);
  referenceText(page, points[1] || 'Second concept', { theme, x: 7.72, y: 5.47, w: 4.48, h: 0.46, fontSize: 10.6, bold: true, color: 'FFFFFF' });
  referenceText(page, referenceDescription(slide, presentation, 'A concise learning contrast.'), { theme, x: 0.82, y: 6.58, w: 7.50, h: 0.42, fontSize: 10.8, color: referenceColor(theme, 'subtitle', '5B6B7A') });
}

async function renderModernClassroomQuote(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '0B4F6C');
  const teal = referenceColor(theme, 'secondary', '20B2AA');
  page.background = { color: navy };
  addModernClassroomFrame(page, theme, index, true);
  await addReferenceImage(page, slide, presentation, { x: 7.02, y: 0, w: 6.31, h: 7.5 }, theme, 'teacher / student portrait or learning environment editorial photograph', 0);
  addReferenceRect(page, 0, 0, 7.38, 7.5, navy);
  referenceLabel(page, 'TEACHER NOTE', 0.82, 0.92, 1.46, teal, theme);
  referenceText(page, '“', { theme, x: 0.80, y: 1.48, w: 0.56, h: 0.68, fontFace: referenceFont(theme, 'title'), fontSize: 44, bold: true, color: teal });
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.88, y: 2.16, w: 5.52, h: 1.88, fontFace: referenceFont(theme, 'title'), fontSize: 28, bold: true, color: 'FFFFFF' });
  referenceText(page, referenceDescription(slide, presentation, 'A focused message for the learner.'), { theme, x: 0.90, y: 4.60, w: 5.28, h: 1.00, fontSize: 13.0, color: 'E4F3F5' });
  referenceLabel(page, referenceValue(presentation?.author || presentation?.presenter, 'NYXORA AI'), 0.90, 6.34, 2.60, teal, theme);
}

async function renderModernClassroomFullImage(page, slide, presentation, theme, index) {
  page.background = { color: '000000' };
  await addReferenceImage(page, slide, presentation, { x: 0, y: 0, w: 13.33, h: 7.5 }, theme, 'full-frame premium classroom / learning cinematic photograph', 0);
  addReferenceRect(page, 0, 4.76, 13.33, 2.74, referenceColor(theme, 'primary', '0B4F6C'), 28);
  referenceLabel(page, `${String(index + 1).padStart(2, '0')} / CLASSROOM`, 0.86, 5.10, 1.72, referenceColor(theme, 'secondary', '20B2AA'), theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.84, y: 5.40, w: 8.84, h: 0.86, fontFace: referenceFont(theme, 'title'), fontSize: 31, bold: true, color: 'FFFFFF' });
  referenceText(page, referenceSubtitle(slide, presentation, 'A cinematic learning moment.'), { theme, x: 0.86, y: 6.40, w: 7.12, h: 0.46, fontSize: 12.4, color: 'E2F2F4' });
}

async function renderModernClassroomClosing(page, slide, presentation, theme, index) {
  const navy = referenceColor(theme, 'primary', '0B4F6C');
  const teal = referenceColor(theme, 'secondary', '20B2AA');
  const gold = referenceColor(theme, 'tertiary', 'D89B2B');
  page.background = { color: navy };
  addReferenceRect(page, 0, 0, 5.48, 7.5, navy);
  await addReferenceImage(page, slide, presentation, { x: 5.36, y: 0.56, w: 7.12, h: 6.36 }, theme, 'students / graduation / learning success closing photograph', 0.04);
  addReferenceRect(page, 5.36, 6.38, 7.12, 0.54, teal, 8);
  referenceLabel(page, 'KEY TAKEAWAY', 0.80, 0.94, 1.68, gold, theme);
  referenceText(page, referenceTitle(slide, presentation), { theme, x: 0.80, y: 1.56, w: 4.02, h: 1.80, fontFace: referenceFont(theme, 'title'), fontSize: 36, bold: true, color: 'FFFFFF' });
  addReferenceRule(page, 0.82, 3.84, 1.60, teal, 2.2);
  referenceText(page, referenceSubtitle(slide, presentation, 'The most important lesson to remember.'), { theme, x: 0.82, y: 4.22, w: 4.18, h: 1.08, fontSize: 13.4, color: 'E2F2F4' });
  referenceLabel(page, `${String(index + 1).padStart(2, '0')} / NYXORA AI`, 0.82, 6.40, 1.94, teal, theme);
}

// ======================================================
// END PREMIUM REFERENCE TEMPLATE ENGINE
// ======================================================

function addSlideNumber(

  page,

  index,

  theme

) {

  const referenceTemplate =
    theme?.templateId &&
    theme.templateId !== "nyxoraOriginal";

  if (referenceTemplate) {
    const templateId =
      String(theme.templateId).toLowerCase();

    const color =
      templateId === "businessannualreport"
        ? cleanColor(theme.colors.secondary || "63DBF5")
        : templateId === "aquatic"
          ? cleanColor(theme.colors.primary || "285E89")
          : cleanColor(theme.colors.primary || "908269");

    page.addText(
      String(index + 1).padStart(2, "0"),
      {
        x: 12.08,
        y: 6.94,
        w: 0.55,
        h: 0.18,
        fontFace: theme?.typography?.body || "Segoe UI",
        fontSize: 8.5,
        bold: true,
        align: "right",
        color,
        margin: 0,
      }
    );

    return;
  }

  page.addShape(

    "ellipse",

    {

      x:
        12.42,

      y:
        6.88,

      w:
        0.36,

      h:
        0.36,


      fill: {

        color:
          cleanColor(

            theme.colors.surface ||

            "F8FAFC"

          ),

      },


      line: {

        color:
          "E2E8F0",

        width:
          0.7,

      },

    }

  );


  page.addText(

    String(

      index + 1

    ),

    {

      x:
        12.42,

      y:
        6.98,

      w:
        0.36,

      h:
        0.1,


      fontSize:
        9,

      bold:
        true,


      align:
        "center",


      color:
        cleanColor(
          theme.colors.mutedText
        ),


      margin:
        0,

    }

  );


}


// ======================================================
// CURRENT PRESENTATION DATE
// ======================================================

function getCurrentPresentationDate() {


  try {


    return new Intl.DateTimeFormat(

      "en-US",

      {

        year:
          "numeric",

        month:
          "long",

        day:
          "numeric",

      }

    ).format(

      new Date()

    );


  } catch (error) {


    return new Date()

      .toLocaleDateString();

  }

}


// ======================================================
// SVG TO DATA URI
// ======================================================

function svgToDataUri(

  svg

) {


  return (

    "data:image/svg+xml;base64," +

    btoa(

      unescape(

        encodeURIComponent(

          svg

        )

      )

    )

  );

}


// ======================================================
// COLOR CLEANER
// ======================================================

function cleanColor(

  color

) {


  return String(

    color ||

    "FFFFFF"

  ).replace(

    "#",

    ""

  );

}


// ======================================================
// VALIDATE SLIDE
// ======================================================

function validateSlide(

  slide

) {


  return (

    slide &&

    typeof slide ===

      "object"

  );

}


// ======================================================
// SAFE TEXT
// ======================================================

function safeText(

  value

) {


  return value || "";

}


// ======================================================
// TRIM TEXT
// ======================================================

function trimText(

  text,

  limit = 120

) {


  const value =

    String(

      safeText(

        text

      )

    );


  if (

    value.length <=

    limit

  ) {


    return value;

  }


  return (

    value.substring(

      0,

      limit

    ) +

    "..."

  );

}


// ======================================================
// END NYXORA AI PPT EXPORT ENGINE
//
// FINAL FEATURES:
//
// ✓ Existing PPT export retained
// ✓ Existing theme engine retained
// ✓ Existing layout engine retained
// ✓ Existing image backend retained
//
// ✓ Top multicolour line retained
// ✓ No multicolour line inside image cards
//
// ✓ Rounded generated images
// ✓ Image itself appears as card
// ✓ Crop-to-cover image fitting
// ✓ No stretched images
//
// ✓ Wide image layouts
// ✓ Square image layouts
// ✓ Portrait rectangle image layouts
// ✓ Adaptive image sizing
//
// ✓ At least one generated image on every slide type
//
// ✓ Before has content
// ✓ After has content
// ✓ Before has its own image
// ✓ After has its own image
//
// ✓ Comparison supports multiple JSON structures
//
// ✓ Diagram uses generated circular flow-chart visual
// ✓ Flow stages remain readable outside generated image
//
// ✓ Timeline gets generated image
// ✓ Summary gets generated image
//
// ✓ Sparse content slides are enriched from existing
//   slide data without deleting original content
//
// ✓ At least two supporting visual/card elements
//   are used where the layout allows them
//
// ✓ Cover contains:
//      Presented By
//      Organization
//      Date
//
// ======================================================