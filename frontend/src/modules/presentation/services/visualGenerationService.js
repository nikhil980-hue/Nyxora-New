// ======================================================
// NYXORA AI VISUAL GENERATION SERVICE
//
// Hybrid Visual Engine
//
// Supports:
// ✓ Gemini AI image generation
// ✓ Pexels image search for PPT export
// ✓ SVG diagrams
// ✓ SVG icons
// ✓ PPT compatible assets
// ✓ Future image providers
//
// Flow:
//
// Slide JSON
//      ↓
// visualType + source
//      ↓
// Visual Generator
//      ↓
// PPT Export / Image Studio
//
// IMPORTANT:
// - Image Studio continues using the existing /api/generate-image route.
// - PPT image requests can explicitly use source:"pexels" and are routed
//   to the existing /api/notes-image Pexels pipeline.
// - Existing SVG/icon/diagram behavior is preserved.
// ======================================================


const IMAGE_API_URL =
  "http://localhost:5000/api/generate-image";


const PEXELS_IMAGE_API_URL =
  "http://localhost:5000/api/notes-image";


// ======================================================
// MAIN VISUAL ROUTER
// ======================================================


export async function generateSlideVisual({

  visualType,

  prompt,

  diagram,

  source,

}) {


  switch(visualType){


    case "image":


      if(
        String(source || "")
          .trim()
          .toLowerCase() === "pexels"
      ){

        return await generatePexelsVisual(

          prompt

        );

      }


      return await generateImageVisual(

        prompt

      );


    case "diagram":


      return generateDiagramVisual(

        diagram

      );


    case "icon":


      return generateIconVisual(

        prompt

      );


    default:


      return null;


  }


}


// ======================================================
// IMAGE STUDIO / EXISTING IMAGE GENERATION
//
// This path remains the same endpoint used by Image Studio.
// It is intentionally NOT replaced by Pexels.
// ======================================================


async function generateImageVisual(

  prompt

){


  try {


    const response =

      await fetch(

        IMAGE_API_URL,

        {


          method:"POST",


          headers:{


            "Content-Type":

              "application/json",


          },


          body:JSON.stringify({


            prompt:

`Create a high-resolution premium presentation photograph for this topic:

${prompt}

IMAGE REQUIREMENTS:
- ultra high quality
- photorealistic
- sharp professional photography
- 16:9 landscape composition
- minimum visual quality equivalent to 1920x1080
- presentation-ready image
- premium Pexels and Unsplash photography style
- realistic natural lighting
- crisp subject details
- professional color grading
- strong visual storytelling
- clean modern composition
- subject clearly visible
- suitable for a professional PowerPoint presentation
- leave natural breathing space around the main subject
- avoid excessive background clutter
- no text
- no captions
- no labels
- no logos
- no watermark
- no borders
- no UI elements

COMPOSITION:
Create the image specifically for a landscape presentation image card.
Keep the important subject away from extreme edges so the image can be safely cropped to fill the PowerPoint card without cutting off the main subject.`,


          })


        }

      );




    const data =

      await response.json();




    if(

      !data.success ||

      !data.image

    ){


      console.error(

        "Gemini image missing"

      );


      return null;


    }




    return {


      type:

        "image",


      format:

        "base64",


      data:

        data.image,


    };


  }

  catch(error){


    console.error(

      "Visual generation failed:",

      error

    );


    return null;


  }


}


// ======================================================
// PEXELS VISUAL GENERATOR
//
// Used by PPT export only when:
// generateSlideVisual({ visualType:"image", source:"pexels" })
//
// This calls the existing Pexels backend pipeline at
// /api/notes-image. That backend reads PEXELS_API_KEY from
// the server environment and downloads the selected Pexels
// image as a data URL.
// ======================================================


async function generatePexelsVisual(

  prompt

){


  try {


    const query =

      buildPexelsSearchQuery(

        prompt

      );


    const response =

      await fetch(

        PEXELS_IMAGE_API_URL,

        {

          method:"POST",

          headers:{

            "Content-Type":

              "application/json",

          },

          body:JSON.stringify({

            topic:

              query,

          }),

        }

      );


    let data = null;


    try {

      data =

        await response.json();


    }

    catch {

      data = null;

    }


    if(

      !response.ok ||

      !data?.success

    ){

      throw new Error(

        data?.message ||

        `Pexels image request failed (${response.status}).`

      );

    }


    const imageResult =

      data?.image ||

      data?.images?.[0] ||

      null;


    const imageData =

      typeof imageResult === "string"

        ? imageResult

        : imageResult?.imageUrl ||

          imageResult?.image ||

          "";


    if(!imageData){

      throw new Error(

        "Pexels response did not contain image data."

      );

    }


    return {

      type:

        "image",

      format:

        "base64",

      data:

        imageData,

      source:

        "pexels",

      metadata:

        typeof imageResult === "object"

          ? {

              topic:

                imageResult.topic ||

                query,

              alt:

                imageResult.alt ||

                "",

              photographer:

                imageResult.photographer ||

                "",

              photographerUrl:

                imageResult.photographerUrl ||

                "",

              photoUrl:

                imageResult.photoUrl ||

                "",

              width:

                Number(

                  imageResult.width

                ) || 0,

              height:

                Number(

                  imageResult.height

                ) || 0,

            }

          : null,

    };


  }

  catch(error){


    console.error(

      "Pexels visual generation failed:",

      error

    );


    return null;


  }


}


// ======================================================
// PEXELS SEARCH QUERY CLEANER
//
// Removes presentation-generation instructions that are
// useful for AI image generation but harmful as Pexels search
// keywords. The topic itself is retained.
// ======================================================


function buildPexelsSearchQuery(

  prompt

){


  const value =

    String(prompt || "")

      .trim();


  if(!value){

    return "professional presentation topic";

  }


  return value

    .replace(

      /Create a high-resolution premium presentation photograph for this topic:/gi,

      ""

    )

    .replace(

      /Create one premium presentation visual\.?/gi,

      ""

    )

    .replace(

      /IMAGE REQUIREMENTS:[\s\S]*?(?=COMPOSITION:|$)/gi,

      ""

    )

    .replace(

      /Requirements:[\s\S]*?(?=Image framing:|Do NOT include:|$)/gi,

      ""

    )

    .replace(

      /Image framing:[\s\S]*?(?=Do NOT include:|$)/gi,

      ""

    )

    .replace(

      /Do NOT include:[\s\S]*$/gi,

      ""

    )

    .replace(

      /COMPOSITION:[\s\S]*$/gi,

      ""

    )

    .replace(/\s+/g, " ")

    .replace(/[^a-zA-Z0-9,.:&+\- ]/g, " ")

    .trim()

    .slice(

      0,

      180

    ) ||

    "professional presentation topic";


}


// ======================================================
// ICON VISUAL GENERATOR
//
// Used for:
// ✓ Concept cards
// ✓ Feature highlights
// ✓ Small visual elements
//
// Output:
// SVG → PPT Image
//
// ======================================================


function generateIconVisual(

  prompt

){


  return {


    type:

      "image",


    format:

      "svg",


    data:

` 

<svg

xmlns="http://www.w3.org/2000/svg"

width="600"

height="600"

viewBox="0 0 600 600"

>



<defs>


<linearGradient

id="iconGradient"

x1="0"

y1="0"

x2="1"

y2="1"

>


<stop

offset="0%"

stop-color="#2563EB"

/>


<stop

offset="100%"

stop-color="#38BDF8"

/>

</linearGradient>


</defs>





<rect

width="600"

height="600"

rx="120"

fill="#F8FAFC"

/>





<circle

cx="300"

cy="240"

r="110"

fill="url(#iconGradient)"

/>





<text

x="300"

y="275"

fill="white"

font-size="90"

font-family="Arial"

text-anchor="middle"

>

✦

</text>






<text

x="300"

y="430"

fill="#0F172A"

font-size="24"

font-family="Arial"

text-anchor="middle"

>

${escapeXML(

shortenText(prompt)

)}

</text>



</svg>

`

  };


}


// ======================================================
// DIAGRAM VISUAL GENERATOR
//
// Keeps SVG because:
// ✓ Faster
// ✓ Editable
// ✓ Perfect for process slides
//
// ======================================================


function generateDiagramVisual(

  diagram

){


  const steps =

    diagram?.steps || [];


  return {


    type:

      "image",


    format:

      "svg",


    data:

` 

<svg

xmlns="http://www.w3.org/2000/svg"

width="1200"

height="400"

viewBox="0 0 1200 400"

>



<defs>


<linearGradient

id="boxGradient"

x1="0"

y1="0"

x2="1"

y2="1"

>


<stop

offset="0%"

stop-color="#2563EB"

/>


<stop

offset="100%"

stop-color="#38BDF8"

/>

</linearGradient>


</defs>





${

steps.map(

(step,index)=>`



<rect

x="${80 + index * 260}"

y="120"

width="190"

height="100"

rx="25"

fill="url(#boxGradient)"

/>





<text

x="${175 + index * 260}"

y="180"

fill="white"

font-size="22"

font-family="Arial"

text-anchor="middle"

>

${escapeXML(step)}

</text>






${

index < steps.length - 1

?

`

<text

x="${225 + index * 260}"

y="180"

fill="#2563EB"

font-size="45"

font-family="Arial"

text-anchor="middle"

>

→

</text>

`

:

""

}



`

).join("")

}



</svg>

`

  };


}


// ======================================================
// HELPERS
// ======================================================


function shortenText(

  text,

  limit = 40

){


  if(!text){

    return "";

  }


  const value =

    String(text);


  if(

    value.length <= limit

  ){

    return value;

  }


  return (

    value.substring(

      0,

      limit

    )

    +

    "..."

  );


}






function escapeXML(

  value

){


  return String(

    value || ""

  )

  .replace(

    /&/g,

    "&amp;"

  )

  .replace(

    /</g,

    "&lt;"

  )

  .replace(

    />/g,

    "&gt;"

  )

  .replace(

    /"/g,

    "&quot;"

  )

  .replace(

    /'/g,

    "&apos;"

  );


}






// ======================================================
// IMAGE FORMAT CONVERTER
//
// Makes Gemini/Pexels response compatible
// with pptx.addImage()
//
// ======================================================


export function prepareVisualForPpt(

  visual

){


  if(!visual){

    return null;

  }




  if(

    visual.format === "base64"

  ){



    return {


      type:"image",


      data:

        visual.data,


    };


  }




  if(

    visual.format === "svg"

  ){



    return {


      type:"image",


      data:

        svgToDataUri(

          visual.data

        ),


    };


  }




  return visual;


}






// ======================================================
// SVG TO DATA URI
// ======================================================


function svgToDataUri(

  svg

){


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
// DEFAULT VISUAL FALLBACK
//
// Keeps PPT stable if Image Studio or Pexels fails.
//
// IMPORTANT:
// No fake AI Visual Concept card.
//
// Returns null so PPT can skip visual.
// ======================================================


export function fallbackVisual(){

  return null;

}






// ======================================================
// CHECK VISUAL SUPPORT
// ======================================================


export function isVisualAvailable(

  visual

){


  return !!(

    visual &&

    visual.type === "image" &&

    visual.data

  );


}






// ======================================================
// VISUAL TYPE NORMALIZER
//
// Keeps compatibility with old AI JSON
// ======================================================


export function normalizeVisualType(

  type

){


  switch(type){


    case "hero":

    case "image":

      return "image";



    case "process":

    case "flow":

      return "diagram";



    case "feature":

    case "icon":

      return "icon";



    default:

      return "image";


  }


}






// ======================================================
// END NYXORA AI VISUAL ENGINE
//
// Features:
//
// ✓ Existing Image Studio generation path preserved
// ✓ Pexels PPT path added
// ✓ Real cinematic visuals
// ✓ SVG diagrams
// ✓ SVG icons
// ✓ PPT compatible
// ✓ No fake purple placeholders
// ✓ No AI Visual Concept cards
//
// ======================================================
