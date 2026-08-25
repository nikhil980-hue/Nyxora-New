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
// ✓ Detects whether PPT already has a flow/diagram
// ✓ Automatically adds circular flow slide if missing
// ✓ Never duplicates an existing diagram unnecessarily
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
  // GUARANTEE ONE FLOW CHART
  // ==================================================

  const hasFlowChart =
    presentationHasFlowChart(
      slides
    );


  if (!hasFlowChart) {

    const automaticFlowSlide =
      createAutomaticFlowSlide(
        presentation,
        slides
      );


    if (automaticFlowSlide) {

      // Keep summary/conclusion as the final slide
      // whenever possible.

      const summaryIndex =
        slides.findIndex(
          slide =>
            isSummaryLikeSlide(
              slide
            )
        );


      if (
        summaryIndex !== -1
      ) {

        slides.splice(
          summaryIndex,
          0,
          automaticFlowSlide
        );

      } else {

        slides.push(
          automaticFlowSlide
        );

      }

    }

  }


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
  // ==================================================

  const requestedLayout =
    String(
      slide?.layout ||
      "content"
    ).toLowerCase();


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
    maxHeight = 4.25,
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
  // ADAPTIVE VERTICAL LAYOUT
  // ==================================================

  const gap =
    0.10;


  const safePoints =
    normalizedPoints.map(
      point =>
        String(
          point || ""
        ).trim()
    );


  const estimatedCharactersPerLine =
    textWidth <= 3.5
      ? 30
      : textWidth <= 4.2
        ? 40
        : 50;


  const desiredHeights =
    safePoints.map(
      point => {

        const estimatedLines =
          Math.max(
            1,
            Math.ceil(
              point.length /
              estimatedCharactersPerLine
            )
          );


        return Math.min(
          1.20,
          Math.max(
            0.70,
            0.48 +
            estimatedLines *
            0.18
          )
        );

      }
    );


  const totalGap =
    Math.max(
      0,
      safePoints.length - 1
    ) * gap;


  const desiredContentHeight =
    desiredHeights.reduce(
      (sum, height) =>
        sum + height,
      0
    );


  const availableContentHeight =
    Math.max(
      0,
      maxHeight - totalGap
    );


  const heightScale =
    desiredContentHeight >
    availableContentHeight
      ? availableContentHeight /
        desiredContentHeight
      : 1;


  const rowHeights =
    desiredHeights.map(
      height =>
        Math.max(
          0.64,
          height * heightScale
        )
    );


  let currentY =
    y;


  normalizedPoints.forEach(
    (point, index) => {

      const color =
        COLORS[
          index %
          COLORS.length
        ];


      const bubbleX =
        x;


      const bubbleY =
        currentY;


      const bubbleWidth =
        textWidth +
        0.8;


      const bubbleHeight =
        rowHeights[index];


      // ==================================================
      // MAIN BUBBLE
      // ==================================================

      page.addShape(
        "roundRect",
        {
          x:
            bubbleX,

          y:
            bubbleY,

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
      // MATCHING VERTICAL LINE
      // ==================================================

      page.addShape(
        "roundRect",
        {
          x:
            bubbleX +
            0.08,

          y:
            bubbleY +
            0.08,

          w:
            0.06,

          h:
            Math.max(
              0.12,
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
          Math.max(
            0.32,
            bubbleHeight -
            0.20
          )
        );


      const circleY =
        bubbleY +
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
            bubbleX +
            0.25,

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
            bubbleX +
            0.25,

          y:
            circleY +
            Math.max(
              0.08,
              circleSize *
              0.29
            ),

          w:
            circleSize,

          h:
            0.12,

          fontSize:
            circleSize < 0.4
              ? 9
              : 11,

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
      // POINT ICON
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
            bubbleX +
            0.84,

          y:
            bubbleY +
            Math.max(
              0.13,
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
            bubbleHeight < 0.75
              ? 12
              : 15,

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
      // POINT TEXT
      // ==================================================

      const pointFontSize =
        bubbleHeight <= 0.70
          ? 9.5
          : bubbleHeight <= 0.82
            ? 10.5
            : bubbleHeight <= 0.96
              ? 11.5
              : 13.5;


      page.addText(
        trimText(
          point,
          260
        ),
        {
          x:
            bubbleX +
            1.3,

          y:
            bubbleY +
            0.07,

          w:
            bubbleWidth -
            1.52,

          h:
            Math.max(
              0.32,
              bubbleHeight -
              0.14
            ),

          fontSize:
            pointFontSize,

          color:
            cleanColor(
              theme.colors.text
            ),

          valign:
            "mid",

          margin:
            0,

          breakLine:
            true,

          fit:
            "shrink",
        }
      );


      // ==================================================
      // NEXT BUBBLE
      // ==================================================

      currentY +=
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
            "mid",

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
        "mid",


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

function addSummaryMiniCard(

  page,

  text,

  x,

  y,

  accent,

  theme

) {


  page.addShape(

    "roundRect",

    {

      x,

      y,

      w:
        2.85,

      h:
        1.55,


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


  page.addShape(

    "ellipse",

    {

      x:
        x + 0.25,

      y:
        y + 0.48,

      w:
        0.42,

      h:
        0.42,


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


  page.addText(

    "✓",

    {

      x:
        x + 0.25,

      y:
        y + 0.58,

      w:
        0.42,

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


  page.addText(

    trimText(

      text,

      105

    ),

    {

      x:
        x + 0.9,

      y:
        y + 0.35,

      w:
        1.65,

      h:
        0.72,


      fontSize:
        14,

      bold:
        true,


      valign:
        "mid",


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

function addSlideNumber(

  page,

  index,

  theme

) {


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