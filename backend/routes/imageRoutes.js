import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";


dotenv.config();


const router = express.Router();



// ======================================================
// IMAGE STUDIO — CLOUDFLARE WORKERS AI
// ======================================================
//
// Image Studio is intentionally separate from the existing
// Pexels pipeline used by PPT/Notes image workflows.
//
// Verified model:
// @cf/black-forest-labs/flux-2-klein-4b
//
// The model accepts multipart/form-data:
// - prompt
// - input_image_0 ... input_image_3 for references
// ======================================================

const CLOUDFLARE_IMAGE_MODEL =
  "@cf/black-forest-labs/flux-2-klein-4b";

const CLOUDFLARE_IMAGE_ENDPOINT = () => {
  const accountId =
    String(
      process.env.CLOUDFLARE_ACCOUNT_ID || ""
    ).trim();

  if (!accountId) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID is missing."
    );
  }

  return (
    `https://api.cloudflare.com/client/v4/accounts/` +
    `${accountId}/ai/run/${CLOUDFLARE_IMAGE_MODEL}`
  );
};

function normalizeImageData(value) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const normalized =
    value.trim();

  if (
    normalized.startsWith("data:image/")
  ) {
    return normalized;
  }

  return null;
}

function dataUrlToBlob(dataUrl) {
  const match =
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(
      dataUrl
    );

  if (!match) {
    throw new Error(
      "Invalid reference image data."
    );
  }

  const mimeType =
    match[1];

  const buffer =
    Buffer.from(
      match[2],
      "base64"
    );

  if (!buffer.length) {
    throw new Error(
      "Reference image data is empty."
    );
  }

  return {
    blob: new Blob(
      [buffer],
      {
        type: mimeType,
      }
    ),
    mimeType,
  };
}

function getCloudflareImageModel(model = "auto") {
  const value =
    typeof model === "string"
      ? model.trim().toLowerCase()
      : "";

  if (
    !value ||
    value === "auto" ||
    value === "klein" ||
    value === "flux-2-klein-4b" ||
    value === CLOUDFLARE_IMAGE_MODEL
  ) {
    return CLOUDFLARE_IMAGE_MODEL;
  }

  // Older frontend values were Pollinations model aliases.
  // They are no longer valid Image Studio providers.
  throw new Error(
    `Unsupported Image Studio model "${model}". ` +
    `Use Auto or FLUX.2 Klein 4B.`
  );
}

async function generateCloudflareImage({
  prompt,
  references = [],
  model = "auto",
}) {
  const apiToken =
    String(
      process.env.CLOUDFLARE_API_TOKEN || ""
    ).trim();

  if (!apiToken) {
    throw new Error(
      "CLOUDFLARE_API_TOKEN is missing."
    );
  }

  const selectedModel =
    getCloudflareImageModel(
      model
    );

  const validReferences =
    references
      .map(normalizeImageData)
      .filter(Boolean)
      .slice(0, 4);

  const formData =
    new FormData();

  formData.append(
    "prompt",
    String(prompt || "").trim()
  );

  for (
    let index = 0;
    index < validReferences.length;
    index += 1
  ) {
    const {
      blob,
      mimeType,
    } =
      dataUrlToBlob(
        validReferences[index]
      );

    const extension =
      mimeType.split("/")[1] ||
      "png";

    formData.append(
      `input_image_${index}`,
      blob,
      `reference-${index + 1}.${extension}`
    );
  }

  const response =
    await fetch(
      CLOUDFLARE_IMAGE_ENDPOINT(),
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiToken}`,
        },
        body: formData,
      }
    );

  const contentType =
    String(
      response.headers.get(
        "content-type"
      ) || ""
    ).toLowerCase();

  if (!response.ok) {
    let message =
      `Cloudflare image generation failed (${response.status}).`;

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      try {
        const errorBody =
          await response.json();

        const apiMessage =
          errorBody?.errors?.[0]?.message ||
          errorBody?.result?.error ||
          errorBody?.message;

        if (apiMessage) {
          message += ` ${apiMessage}`;
        }
      } catch {
        // Keep the HTTP status message.
      }
    } else {
      try {
        const text =
          await response.text();

        if (text.trim()) {
          message += ` ${text.trim().slice(0, 500)}`;
        }
      } catch {
        // Keep the HTTP status message.
      }
    }

    throw new Error(
      message
    );
  }

  // Workers AI image models return the generated image
  // as binary image data for the REST endpoint.
  if (
    contentType.startsWith(
      "image/"
    )
  ) {
    const arrayBuffer =
      await response.arrayBuffer();

    const base64 =
      Buffer
        .from(arrayBuffer)
        .toString("base64");

    return {
      source: "cloudflare",
      provider: "cloudflare",
      model: selectedModel,
      image:
        `data:${contentType.split(";")[0]};base64,${base64}`,
      edit:
        validReferences.length > 0,
      hasReferences:
        validReferences.length > 0,
    };
  }

  // Keep a JSON fallback for API response variants.
  let body = null;

  try {
    body =
      await response.json();
  } catch {
    body = null;
  }

  const resultImage =
    body?.result?.image ||
    body?.result?.output ||
    body?.image ||
    body?.imageUrl;

  if (!resultImage) {
    throw new Error(
      "Cloudflare returned no generated image."
    );
  }

  const image =
    typeof resultImage === "string" &&
    resultImage.startsWith("data:image/")
      ? resultImage
      : `data:image/png;base64,${resultImage}`;

  return {
    source: "cloudflare",
    provider: "cloudflare",
    model: selectedModel,
    image,
    edit:
      validReferences.length > 0,
    hasReferences:
      validReferences.length > 0,
  };
}

// ======================================================
// PEXELS FREE IMAGE FALLBACK
// ======================================================

function normalizePexelsQuery(prompt) {
  const value = String(prompt || "").trim();

  if (!value) {
    return "professional presentation topic";
  }

  return value
    .replace(/Create one premium presentation visual\.?/gi, "")
    .replace(/Requirements:[\s\S]*?(?=Image framing:|Do NOT include:|$)/gi, "")
    .replace(/Image framing:[\s\S]*?(?=Do NOT include:|$)/gi, "")
    .replace(/Do NOT include:[\s\S]*$/gi, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z0-9,.:&+\- ]/g, " ")
    .trim()
    .slice(0, 180) || "professional presentation topic";
}

async function generatePexelsImage(prompt) {
  const apiKey =
    String(process.env.PEXELS_API_KEY || "").trim();

  if (!apiKey) {
    throw new Error("Pexels API key missing.");
  }

  const query = normalizePexelsQuery(prompt);

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
    {
      headers: {
        Authorization: apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Pexels search failed (${response.status}).`
    );
  }

  const data = await response.json();
  const imageUrl = data?.photos?.[0]?.src?.large;

  if (!imageUrl) {
    throw new Error("No Pexels image found.");
  }

  const imageResponse = await fetch(imageUrl);

  if (!imageResponse.ok) {
    throw new Error(
      `Pexels image download failed (${imageResponse.status}).`
    );
  }

  const contentType =
    String(imageResponse.headers.get("content-type") || "image/jpeg")
      .split(";")[0]
      .trim();

  const buffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  return {
    source: "pexels",
    provider: "pexels",
    image: `data:${contentType};base64,${base64}`,
    query,
  };
}



// ======================================================
// FINAL IMAGE GENERATOR
// ======================================================
//
// Image Studio:
// - Cloudflare Workers AI only
// - FLUX.2 Klein 4B handles generation and editing
// - references are passed as actual image bytes
//
// Pexels is intentionally not used here. Existing Pexels
// functionality elsewhere in this route remains untouched.
// ======================================================

async function generateImage({
  prompt,
  references = [],
  model = "auto",
}) {
  return await generateCloudflareImage({
    prompt,
    references,
    model,
  });
}

// ======================================================
// POST /api/generate-image
// ======================================================

router.post(

"/",

async(req,res)=>{

try{

const {

  prompt,

  references = [],

  edit = false,

  model = "auto",

  source = "ai"

}=req.body;


if(!prompt){

return res.status(400).json({

success:false,

message:

"Image prompt required."

});

}


const normalizedReferences =
  Array.isArray(references)
    ? references
        .map(normalizeImageData)
        .filter(Boolean)
    : [];


const result =
  String(source || "ai").trim().toLowerCase() === "pexels"
    ? await generatePexelsImage(prompt)
    : await generateImage({
        prompt,
        references: normalizedReferences,
        model,
      });


return res.json({

success:true,

image:

result.image,

source:

result.source,

provider:

result.source,

model:

result.model ||
(result.source === "pexels" ? "pexels" : CLOUDFLARE_IMAGE_MODEL),

edit:

Boolean(
  edit ||
  result.edit
),

hasReferences:

Boolean(
  normalizedReferences.length
)

});


}

catch(error){

console.error(

"Image generation failed:",

error

);


return res.status(500).json({

success:false,

message:

error.message

});

}

}

);


export default router;


// ======================================================
// BACKGROUND SYSTEM
// ======================================================


function applyPremiumBackground(

  page,

  theme,

  index

){

  page.background = {

    color:

      cleanColor(

        theme.colors.background ||

        "FFFFFF"

      )

  };


  // no gradient bar on cover

  if(index !== 0){

    addGradientBar(page);

  }


  addDotDecoration(

    page,

    theme

  );

}



// ======================================================
// SMOOTH BLENDED TOP BAR
// ======================================================


function addGradientBar(

  page

){

const svg = `

<svg

xmlns="http://www.w3.org/2000/svg"

width="1600"

height="80"

>



<defs>


<linearGradient

id="premiumGradient"

x1="0%"

y1="0%"

x2="100%"

y2="0%"

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

stop-color="#8B5CF6"

/>



<stop

offset="75%"

stop-color="#EC4899"

/>



<stop

offset="100%"

stop-color="#F97316"

/>



</linearGradient>


</defs>





<rect

width="1600"

height="80"

rx="30"

fill="url(#premiumGradient)"

/>



</svg>

`;



page.addImage({

data:

svgToDataUri(svg),


x:0,

y:0,


w:13.33,

h:0.16


});

}



// ======================================================
// DECORATIVE DOTS
// Maximum 2 clusters
// ======================================================


function addDotDecoration(

page,

theme

){

const color =

cleanColor(

theme.colors.accent ||

"2563EB"

);


for(

let i=0;

i<2;

i++

){



page.addShape(

"ellipse",

{


x:

11.7 +

i*0.25,


y:

6.55,


w:

0.12,


h:

0.12,



fill:{

color,

transparency:40

},


line:{

transparency:100

}



}


);



}

}



// ======================================================
// CONTENT SLIDE
// ======================================================


async function createContentSlide(

page,

slide,

theme

){



addTitleIcon(

page,

slide,

theme

);


page.addText(

slide.title || "",

{


x:1.15,

y:0.55,


w:7.5,

h:0.45,


fontSize:30,


bold:true,


color:

cleanColor(

theme.colors.text

),


margin:0


}


);



if(slide.headline){



page.addText(

slide.headline,

{


x:1.15,

y:1.05,


w:6.2,


h:0.35,


fontSize:17,


color:

cleanColor(

theme.colors.mutedText

),


margin:0


}


);


}



renderNumberPoints(

page,

slide.points || [],

theme

);



if(

slide.imagePrompt

){



await addGeneratedImage(

page,

slide,

theme

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

){



page.addShape(

"ellipse",

{


x:0.55,

y:0.55,

w:0.45,

h:0.45,


fill:{

color:

cleanColor(

theme.colors.accent ||

"2563EB"

)

},


line:{

transparency:100

}


}


);



page.addText(

"✦",

{


x:0.55,

y:0.63,

w:0.45,

h:0.15,


fontSize:18,


bold:true,


align:"center",


color:"FFFFFF",


margin:0


}


);


}