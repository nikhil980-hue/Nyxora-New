import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";


dotenv.config();


const router = express.Router();



// ======================================================
// GEMINI IMAGE MODELS
// ======================================================


const IMAGE_MODELS = [

  "gemini-2.5-flash-image",

  "gemini-3.1-flash-image",

  "gemini-3-pro-image"

];




// ======================================================
// GEMINI IMAGE GENERATION
// ======================================================


async function generateGeminiImage(

  prompt

){


  const ai =

  new GoogleGenAI({

    apiKey:

      process.env.GEMINI_API_KEY

  });




  let lastError = null;




  for(

    const model of IMAGE_MODELS

  ){


    try{


      console.log(

        "Trying Gemini image model:",

        model

      );





      const response =

      await ai.models.generateContent({

        model,


        contents:[

          {

            role:"user",


            parts:[

              {

                text:

`Create a premium presentation image.

Topic:
${prompt}

Style:
- Apple keynote quality
- Professional educational visual
- Realistic
- Cinematic lighting
- Clean composition
- No text
- No watermark`

              }

            ]

          }

        ]


      });







      const imagePart =

      response

      ?.candidates

      ?. [0]

      ?.content

      ?.parts

      ?.find(

        part =>

        part.inlineData

      );







      if(imagePart){


        return {

          source:"gemini",


          image:

          `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`

        };


      }



      throw new Error(

        "No Gemini image returned"

      );



    }


    catch(error){


      console.log(

        model,

        "failed:",

        error.message

      );


      lastError = error;


    }


  }





  throw lastError;

}









// ======================================================
// PEXELS FREE IMAGE FALLBACK
// ======================================================


async function generatePexelsImage(

  prompt

){



  if(

    !process.env.PEXELS_API_KEY

  ){


    throw new Error(

      "Pexels API key missing."

    );


  }





  const response =

  await fetch(

`https://api.pexels.com/v1/search?query=${encodeURIComponent(prompt)}&per_page=1`,

    {


      headers:{


        Authorization:

        process.env.PEXELS_API_KEY


      }


    }

  );





  const data =

  await response.json();






  const imageUrl =

  data

  ?.photos

  ?. [0]

  ?.src

  ?.large;






  if(!imageUrl){


    throw new Error(

      "No Pexels image found."

    );


  }







  const imageResponse =

  await fetch(

    imageUrl

  );





  const buffer =

  await imageResponse.arrayBuffer();






  const base64 =

  Buffer

  .from(buffer)

  .toString("base64");







  return {


    source:"pexels",


    image:

    `data:image/jpeg;base64,${base64}`


  };


}









// ======================================================
// FINAL IMAGE GENERATOR
//
// Gemini first
// Pexels fallback
// ======================================================


async function generateImage(

 prompt

){



  try{


    return await generateGeminiImage(

      prompt

    );


  }


  catch(error){



    console.log(

      "Gemini image unavailable."

    );



    return await generatePexelsImage(

      prompt

    );


  }


}









// ======================================================
// POST /api/generate-image
// ======================================================


router.post(

"/",

async(req,res)=>{


try{


const {

prompt

}=req.body;





if(!prompt){


return res.status(400).json({


success:false,


message:

"Image prompt required."


});


}






const result =

await generateImage(

prompt

);






return res.json({


success:true,


image:

result.image,


source:

result.source



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