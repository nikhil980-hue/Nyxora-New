import {
  generateResponse,
} from "../../chat/services/geminiService";



/*
======================================================

 NYXORA AI CINEMATIC PRESENTATION ENGINE


 Flow:

 User Input
      ↓
 Gemini AI
      ↓
 Structured Slide JSON
      ↓
 Presentation Builder
      ↓
 PPT Export


 Philosophy:

 - Apple Keynote inspired
 - TED talk storytelling
 - Minimal words
 - Maximum visual impact

======================================================
*/







export async function generatePresentation({


  topic,


  subject,


  className,


  slideCount,


  theme,


  customPrompt = "",



}) {


  // ======================================================
  // USER REQUEST DETAIL MODE
  // ======================================================
  // Explicit requests for detail override the normal
  // concise presentation style.
  // ======================================================

  const detailMode =
    isDetailedPresentationRequest(
      customPrompt
    );





  const prompt =


    buildPresentationPrompt({


      topic,


      subject,


      className,


      slideCount,


      theme,


      customPrompt,

      detailMode,



    });







  let response = "";








  await generateResponse(



    prompt,



    (chunk)=>{



      response = chunk;



    }



  );








  return parsePresentationResponse(

    response,

    detailMode,

    customPrompt

  );



}









function buildPresentationPrompt({



  topic,


  subject,


  className,


  slideCount,


  theme,


  customPrompt,

  detailMode,



}) {



return `



You are Nyxora AI, a world-class cinematic presentation designer.



Create a premium Apple Keynote style presentation.



TOPIC:

${topic}



SUBJECT:

${subject}



AUDIENCE:

${className}



NUMBER OF SLIDES:

${slideCount}



THEME:

${theme}





CUSTOM INSTRUCTIONS:

${customPrompt || "Create a premium educational presentation."}



USER REQUEST PRIORITY:

The user's custom instructions are authoritative for
content depth and explanation style.



REQUEST MODE:

${detailMode ? "DETAILED MODE" : "STANDARD MODE"}



COMPARISON MODE:

${
  isComparisonRequested(customPrompt)
    ? "COMPARISON REQUESTED"
    : "NO COMPARISON REQUESTED"
}



IMPORTANT MODE OVERRIDE:

If REQUEST MODE is DETAILED MODE:

- The presentation must actually TEACH and EXPLAIN the topic.
- Do not merely summarize the topic with keywords.
- Use complete explanatory sentences.
- Explain what the concept is, how it works, why it works,
  its major parts, relationships, examples, applications,
  and important details relevant to the requested topic.
- Use concrete educational explanations instead of generic
  placeholder phrases.
- Use enough content across the slides to make the topic
  understandable to someone learning it for the first time.
- Do not use comparison, before/after, dichotomy, or split-card
  storytelling unless the user explicitly requested comparison.
- Do not invent a "Before" and "After" concept merely because
  the topic contains words such as change, state, stage,
  transformation, memory, or process.
- Prefer concept, process, diagram, example, application,
  and summary slides for normal educational explanations.



======================================================

CORE DESIGN RULES

======================================================



RULE 1:

This is a visual presentation.

By default, it should feel like a premium
Apple Keynote / TED-style presentation rather
than a document.



Do NOT create:

- textbook-style slides by default
- generic lecture-note formatting
- reports
- unnecessary repetition



IMPORTANT:

If the user explicitly asks for detailed,
elaborate, comprehensive, extensive,
step-by-step, in-depth, full, or expanded
explanation, the user's requested depth takes
priority over the default concise presentation
style.

In detailed mode, the presentation may contain
longer supporting text, explanatory sentences,
multiple meaningful points, examples, reasoning,
and additional context where useful.

Do not artificially shorten educational content
just to satisfy the default cinematic style.





RULE 2:

Every slide must communicate ONE main idea.

A slide may explain that idea in enough detail
to satisfy the user's request.

Do not merge unrelated ideas just to reduce
the slide count.





RULE 3:

CONTENT DEPTH IS ADAPTIVE.



DEFAULT / CONCISE MODE:

- Keep titles short.
- Keep supporting text concise.
- Prefer 3–5 meaningful points.
- Keep each point presentation-friendly.
- Avoid unnecessary paragraphs.



DETAILED MODE:

- Do not force points into short fragments.
- Use complete explanatory sentences.
- Use 4–6 meaningful points where appropriate.
- Each point should explain an actual idea, not a label.
- Include definitions, mechanisms, reasoning, examples,
  applications, relationships, and step-by-step detail.
- Explain WHY and HOW, not only WHAT.
- Avoid generic filler such as "important factors",
  "key characteristics", or "state and conditions".
- Never replace missing knowledge with placeholder text.
- Use the available slide count to distribute the explanation
  across the topic logically.
- Keep the visual hierarchy clean while allowing the content
  to be genuinely detailed.



The goal is NOT to make every presentation long.

The goal is to follow the user's requested level
of explanation.





======================================================

SLIDE CREATION RULES

======================================================



Create exactly ${slideCount} slides.



Each slide must have:

- one main idea
- one visual concept
- strong hierarchy
- cinematic composition






======================================================

AVAILABLE STORY SLIDES

======================================================



SLIDE TYPE SELECTION:

For normal educational topics:

- Use hero for the opening.
- Use concept for explanations.
- Use process for how something works.
- Use diagram for relationships or workflows.
- Use comparison ONLY when the user explicitly asks to compare,
  contrast, show differences, or explain before/after.
- Use summary for the closing.

Do NOT create a comparison slide simply because a topic has
different states, stages, types, memory concepts, phases,
advantages/disadvantages, or transformations.



1. HERO SLIDE



Purpose:

Opening cinematic impact.





Structure:



{

"type":"hero",

"title":"",

"headline":"",

"visualConcept":"",

"imagePrompt":""

}







2. CONCEPT SLIDE



Purpose:

Explain one important idea.





Rules:

DEFAULT MODE:
- Avoid definition paragraphs.
- Use metaphor or visual explanation.
- Use concise supporting words.

DETAILED MODE:
- Definitions and explanatory paragraphs are allowed
  when they improve understanding.
- Include clear explanation, examples, or context
  when requested.
- Prefer meaningful complete statements over
  artificial 3-word fragments.





Structure:



{

"type":"concept",

"title":"",

"headline":"",

"points":[

"",

"",

""

],

"visualConcept":"",

"imagePrompt":"",

"keyTakeaway":""

}







3. PROCESS SLIDE



Purpose:

Explain transformation or flow.





Rules:

DEFAULT MODE:
- Maximum 5 steps.
- Short labels.
- Clear movement.

DETAILED MODE:
- Up to 7 meaningful steps when needed.
- Step labels may be descriptive.
- Include short explanations with steps when useful.
- Preserve clear visual progression.





Structure:



{

"type":"process",

"title":"",

"diagram":{

"type":"flow",

"steps":[

"",

"",

""

]

},

"visualConcept":"",

"imagePrompt":""

}







4. COMPARISON SLIDE



Purpose:

Show contrast ONLY when the user explicitly requested
comparison, difference, contrast, before/after, or
dichotomy content.

Do NOT use this layout for a normal "explain the topic"
request.



Structure:



{

"type":"comparison",

"title":"",

"leftTitle":"",

"leftPoints":[

""

],

"rightTitle":"",

"rightPoints":[

""

]

}







5. SUMMARY SLIDE



Purpose:

End with memorable message.





Structure:



{

"type":"summary",

"title":"",

"headline":"",

"keyTakeaway":"",

"visualConcept":"",

"imagePrompt":""

}








======================================================

VISUAL RULES

======================================================



Every slide MUST include:



visualConcept:

Describe the visual idea.





Examples:



"Human brain connected with artificial neurons"



"Plant leaf glowing with solar energy"



"Data flowing through a neural network"







imagePrompt:

Must describe:



- cinematic illustration

- professional educational visual

- clean composition

- modern design








======================================================

FORBIDDEN OUTPUT

======================================================



DEFAULT PRESENTATION MODE:

Avoid:

- unnecessary 5+ point lists
- long explanations when not requested
- large blocks of text
- Wikipedia-style content



DETAILED MODE:

The following are REQUIRED when relevant to the user's
detailed request:

- longer explanations
- complete sentences
- explanatory paragraphs when useful
- additional meaningful points
- examples
- step-by-step detail
- definitions
- mechanisms / working
- applications
- expanded educational context

Do NOT confuse "minimal visual design" with "minimal
educational content".



In every mode, avoid:

- filler
- repetition
- unsupported facts
- generic headings like:



"Introduction"



"Overview"



"Conclusion"







Create a presentation that looks like:



- Apple keynote

- TED talk

- Premium educational documentary






RETURN JSON ONLY.

Before returning JSON, internally verify:

1. The requested topic is the actual topic of every slide.
2. If DETAILED MODE is active, the content genuinely explains
   the topic rather than merely listing keywords.
3. No comparison/before-after slide exists unless explicitly
   requested.
4. No generic placeholder text is used as educational content.
5. The slide sequence teaches the topic logically.



Return ONLY JSON.

No markdown.

No explanation.



Required JSON format:



{

"title":"",

"description":"",


"slides":[


{

"slideNumber":1,


"type":"hero",


"title":"",


"subtitle":"",


"headline":"",


"points":[

""

],


"visualConcept":"",


"imagePrompt":"",


"visualType":"image",


"diagram":{

"type":"",

"steps":[]

},


"keyTakeaway":""


}

]

}



`;
}
// ======================================================
// PARSE PRESENTATION RESPONSE
// ======================================================


function parsePresentationResponse(

  response,

  detailed = false,

  customPrompt = ""

){



  try {



    const cleaned =


      response

        .replace(

          /```json/g,

          ""

        )

        .replace(

          /```/g,

          ""

        )

        .trim();







    const parsed =


      JSON.parse(

        cleaned

      );







    return {



      title:


        parsed.title ||


        "Nyxora AI Presentation",






      description:


        parsed.description ||


        "",






      slides:


        normalizeSlides(

          parsed.slides || [],

          detailed,

          customPrompt

        ),



    };



  }

  catch(error){



    console.error(


      "Presentation JSON parsing failed:",


      error



    );







    return {



      title:


        "Generated Presentation",






      description:


        "",






      slides:


        [],



    };



  }



}









// ======================================================
// NORMALIZE SLIDES
// ======================================================


function normalizeSlides(

  slides,

  detailed = false,

  customPrompt = ""

){



  return slides.map(

    (slide,index)=>({



      slideNumber:


        slide.slideNumber ||


        index + 1,






      type:


        sanitizeSlideType(

          slide.type,

          customPrompt

        ),


        layout:


        convertLayout(

          sanitizeSlideType(

            slide.type,

            customPrompt

          )

        ),






      title:


        cleanText(

          slide.title

        ),






      subtitle:


        cleanText(

          slide.subtitle

        ),






      headline:


        cleanText(

          slide.headline

        ),






      points:


        limitPoints(

          getNormalizedSlidePoints(

            slide,

            customPrompt

          ),

          detailed

        ),






      visualConcept:


        cleanText(

          slide.visualConcept

        ),






      imagePrompt:


        cleanText(

          slide.imagePrompt

        ),






      visualType:


        slide.visualType ||


        "image",






      diagram:


        slide.diagram || {



          type:"",


          steps:[],


        },






      keyTakeaway:


        cleanText(

          slide.keyTakeaway

        ),



    })

  );



}









// ======================================================
// COMPARISON REQUEST DETECTION
// ======================================================

function isComparisonRequested(

  customPrompt

){

  const value =

    String(

      customPrompt || ""

    )

      .toLowerCase()

      .trim();


  if(!value){

    return false;

  }


  const comparisonPatterns = [

    /\bcompare\b/,
    /\bcomparison\b/,
    /\bcontrast\b/,
    /\bdifference\b/,
    /\bdifferences\b/,
    /\bbefore\s+and\s+after\b/,
    /\bbefore\/after\b/,
    /\bpros\s+and\s+cons\b/,
    /\badvantages\s+and\s+disadvantages\b/,
    /\bversus\b/,
    /\bvs\.?\b/,
    /\bdichotomy\b/,

  ];


  return comparisonPatterns.some(

    pattern =>

      pattern.test(

        value

      )

  );

}



// ======================================================
// SANITIZE AI SLIDE TYPE
// ======================================================

function sanitizeSlideType(

  type,

  customPrompt

){

  const normalizedType =

    String(

      type || ""

    )

      .toLowerCase()

      .trim();


  if(

    normalizedType === "comparison" &&

    !isComparisonRequested(

      customPrompt

    )

  ){

    return "concept";

  }


  if(

    normalizedType === "hero" ||
    normalizedType === "concept" ||
    normalizedType === "process" ||
    normalizedType === "comparison" ||
    normalizedType === "summary"

  ){

    return normalizedType;

  }


  return "concept";

}



// ======================================================
// NORMALIZE SLIDE POINTS
// ======================================================

function getNormalizedSlidePoints(

  slide,

  customPrompt

){

  if(!slide){

    return [];

  }


  const originalType =

    String(

      slide.type || ""

    )

      .toLowerCase()

      .trim();


  if(

    originalType !== "comparison" ||

    isComparisonRequested(

      customPrompt

    )

  ){

    return Array.isArray(

      slide.points

    )

      ? slide.points

      : [];

  }


  const combined = [];


  const groups = [

    slide.points,
    slide.leftPoints,
    slide.rightPoints,
    slide.beforePoints,
    slide.afterPoints,

  ];


  groups.forEach(

    group => {

      if(

        Array.isArray(

          group

        )

      ){

        group.forEach(

          item => {

            if(

              item !== null &&
              item !== undefined &&
              String(item).trim()

            ){

              combined.push(

                String(item).trim()

              );

            }

          }

        );

      }

    }

  );


  return combined;

}



// ======================================================
// CONVERT AI TYPE TO PPT LAYOUT
// ======================================================
// ======================================================


function convertLayout(

  type

){



  switch(type){



    case "hero":


      return "title";





    case "process":


      return "diagram";





    case "comparison":


      return "comparison";





    case "summary":


      return "summary";





    default:


      return "content";



  }



}









// ======================================================
// CLEAN TEXT
// ======================================================


function cleanText(

  value

){



  if(

    !value

  ){


    return "";

  }







  return String(value)

    .replace(

      /\n+/g,

      " "

    )

    .trim();



}









// ======================================================
// DETECT DETAILED PRESENTATION REQUEST
// ======================================================

function isDetailedPresentationRequest(

  customPrompt

){

  const value =

    String(

      customPrompt || ""

    )

      .toLowerCase()

      .trim();


  if(

    !value

  ){

    return false;

  }


  const detailedPatterns = [

    /\bdetailed\b/,

    /\belaborate\b/,

    /\belaborated\b/,

    /\bexplain\s+(?:it\s+)?in\s+depth\b/,

    /\bin\s+depth\b/,

    /\bdeep\s+explanation\b/,

    /\bdeeply\s+explain\b/,

    /\bcomprehensive\b/,

    /\bcomprehensively\b/,

    /\bextensive\b/,

    /\bexpanded\b/,

    /\bexpand\b/,

    /\bfull\s+explanation\b/,

    /\bcomplete\s+explanation\b/,

    /\bstep[- ]by[- ]step\b/,

    /\bstepwise\b/,

    /\bthorough\b/,

    /\bexplain\s+thoroughly\b/,

    /\bmore\s+information\b/,

    /\bmore\s+detail\b/,

    /\bgo\s+into\s+detail\b/,

    /\belaborate\s+on\b/,

    /\bexplain\s+clearly\s+and\s+fully\b/,

  ];


  return detailedPatterns.some(

    pattern =>

      pattern.test(

        value

      )

  );

}



// ======================================================
// LIMIT POINTS
// ======================================================

function limitPoints(

  points,

  detailed = false

){

  if(

    !Array.isArray(

      points

    )

  ){

    return [];

  }


  const maxPoints =

    detailed

      ? 6

      : 3;


  const maxCharacters =

    detailed

      ? 260

      : 35;


  return points

    .slice(

      0,

      maxPoints

    )

    .map(

      point => {

        const text =

          cleanText(

            point

          );


        if(

          text.length >

          maxCharacters

        ){

          return (

            text.substring(

              0,

              maxCharacters

            )

            +

            "..."

          );

        }


        return text;

      }

    )

    .filter(

      Boolean

    );

}


// ======================================================


// ======================================================
// END OF NYXORA AI PRESENTATION SERVICE
// ======================================================