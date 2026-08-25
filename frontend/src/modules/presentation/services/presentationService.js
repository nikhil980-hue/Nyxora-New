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


  presentationMode = "concise",



}) {


  // ======================================================
  // EXPLICIT PRESENTATION MODE
  // ======================================================
  // The UI now controls the content depth directly.
  //
  // concise  → short presentation-friendly content
  // detailed → in-depth educational explanation
  // ======================================================

  const normalizedPresentationMode =
    presentationMode === "detailed"
      ? "detailed"
      : "concise";


  const detailMode =
    normalizedPresentationMode === "detailed";





  const prompt =


    buildPresentationPrompt({


      topic,


      subject,


      className,


      slideCount,


      theme,


      customPrompt,

      detailMode,

      presentationMode:
        normalizedPresentationMode,



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

  presentationMode,



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



PRESENTATION MODE:

${
  presentationMode === "detailed"
    ? "DETAILED MODE"
    : "CONCISE MODE"
}



COMPARISON MODE:

${
  isComparisonRequested(customPrompt)
    ? "COMPARISON REQUESTED"
    : "NO COMPARISON REQUESTED"
}



IMPORTANT MODE RULES:

If PRESENTATION MODE is CONCISE MODE:

- Keep the presentation concise, cinematic, and easy to scan.
- Prefer short supporting text and compact points.
- Do not add long explanatory paragraphs unless essential.
- Focus on the most important concepts, visuals, and takeaways.
- Keep the amount of text appropriate for presentation viewing.
- Avoid unnecessary repetition.



If PRESENTATION MODE is DETAILED MODE:

- The presentation MUST actually TEACH and EXPLAIN the topic in depth.
- Do not merely summarize the topic with keywords.
- Use complete explanatory sentences.
- Explain what the concept is, how it works, why it works,
  its major parts, relationships, examples, applications,
  and important details relevant to the requested topic.
- Use concrete educational explanations instead of generic
  placeholder phrases.
- Use enough content across the slides to make the topic
  understandable to someone learning it for the first time.
- Do not compress complex concepts into one-line summaries.
- Distribute related information across the available slides.
- Include definitions where appropriate.
- Include mechanisms and working principles where appropriate.
- Include practical or realistic examples where appropriate.
- Include step-by-step explanations for processes.
- Include applications and significance where relevant.
- Explain relationships between major ideas.
- Preserve factual accuracy.
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

The selected PRESENTATION MODE controls content depth.
The mode is an explicit user choice and must be followed.



CONCISE MODE:

The presentation should be concise enough
to scan quickly while still communicating
the important information correctly.



DETAILED MODE:

The presentation must contain enough educational
content to genuinely explain the topic.

Do not artificially shorten educational content
just to satisfy the default cinematic style.

Minimal visual design does NOT mean minimal
educational content.

The design should remain clean while the information
depth follows the selected mode.





RULE 2:

Every slide must communicate ONE main idea.

A slide may explain that idea in enough detail
to satisfy the selected presentation mode.

Do not merge unrelated ideas just to reduce
the slide count.





RULE 3:

CONTENT DEPTH IS CONTROLLED BY PRESENTATION MODE.



CONCISE MODE:

- Keep titles short.
- Keep supporting text concise.
- Prefer 3–5 meaningful points.
- Keep each point presentation-friendly.
- Avoid unnecessary paragraphs.
- Focus on essential concepts.
- Prefer short explanations over long prose.



DETAILED MODE:

- Do not force points into short fragments.
- Use complete explanatory sentences.
- Use 4–7 meaningful points where appropriate.
- Each point should explain an actual idea, not a label.
- Include definitions, mechanisms, reasoning, examples,
  applications, relationships, and step-by-step detail.
- Explain WHY and HOW, not only WHAT.
- Include concrete examples or realistic scenarios when useful.
- Use the available slide count to distribute the explanation
  across the topic logically.
- Do not compress a multi-part concept into one short slide.
- Use explanatory paragraphs when they improve understanding.
- Use descriptive process steps when useful.
- Make each slide contribute new understanding.
- Avoid repeating the same explanation on multiple slides.
- Preserve clear visual hierarchy even with detailed content.



The goal is NOT to make every presentation long.

The goal is to follow the user's selected content depth.





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

CONCISE MODE:

- Avoid definition paragraphs unless essential.
- Use concise supporting words.
- Focus on the main takeaway.
- Use compact explanatory statements.



DETAILED MODE:

- Definitions and explanatory paragraphs are allowed
  when they improve understanding.
- Include clear explanation, examples, or context.
- Explain mechanisms and relationships.
- Prefer meaningful complete statements over
  artificial 3-word fragments.
- Use enough detail to teach the concept, not just name it.
- Avoid replacing explanations with generic labels.





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

CONCISE MODE:

- Maximum 5 steps.
- Short labels.
- Clear movement.



DETAILED MODE:

- Up to 7 meaningful steps when needed.
- Step labels may be descriptive.
- Include short explanations with steps when useful.
- Explain what happens at each stage.
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





CONCISE MODE:

- Keep the summary brief.
- Highlight the main takeaway.



DETAILED MODE:

- Summarize the most important concepts learned.
- Reinforce the central relationship or process.
- End with a useful educational takeaway.





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



CONCISE MODE:

Avoid:

- unnecessary long explanations
- large blocks of text
- repetitive explanations
- unnecessary 5+ point lists
- Wikipedia-style content



DETAILED MODE:

Do NOT:

- reduce detailed concepts to keywords
- replace explanations with generic labels
- repeat the same idea merely to increase length
- add unsupported facts
- use filler text just to make slides longer



DETAILED MODE MUST INCLUDE WHEN RELEVANT:

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
- relationships between concepts



Do NOT confuse:

"minimal visual design"

with:

"minimal educational content".



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
2. The selected presentation mode has been followed.
3. If DETAILED MODE is active, the content genuinely teaches
   the topic rather than merely listing keywords.
4. If CONCISE MODE is active, unnecessary long explanations
   have not been added.
5. No comparison/before-after slide exists unless explicitly
   requested.
6. No generic placeholder text is used as educational content.
7. The slide sequence teaches the topic logically.
8. Each slide contributes new information.
9. The content is factually coherent.
10. The presentation contains exactly the requested slide count.



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
//
// Kept as a fallback for older callers that may not yet
// provide presentationMode.
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

      ? 7

      : 3;


  const maxCharacters =

    detailed

      ? 700

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