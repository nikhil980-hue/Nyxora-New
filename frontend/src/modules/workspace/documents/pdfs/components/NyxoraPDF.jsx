import {

Document,

Page,

View,

Text,

Image
}

from "@react-pdf/renderer";


import "../styles/pdfFonts";


import PDFHeader

from "./PDFHeader";


import PDFMetadata

from "./PDFMetadata";


import PDFSection

from "./PDFSection";

import PDFQuestion

from "./PDFQuestion";


import MathDiagram

from "../diagrams/MathDiagram";

import NotesTable
from "../notes/NotesTable";

import NotesFlowchart
from "../notes/NotesFlowchart";

import {
    normalizeContentText
} from "../notes/contentTextNormalizer.js";

function formatPdfTitle(title=""){

    return String(title || "")
        .trim()
        .replace(
            /[A-Za-zÀ-ÖØ-öø-ÿ]+/g,
            word => {

                if(
                    word.length <= 4 &&
                    word === word.toUpperCase()
                ){

                    return word;

                }

                return (
                    word.charAt(0).toUpperCase() +
                    word.slice(1).toLowerCase()
                );

            }
        );

}




function NyxoraDocumentDetails({
    data = {}
}){

    const subject =
        String(
            data.subject ||
            data.subjectName ||
            "Not Provided"
        ).trim() ||
        "Not Provided";

    const className =
        String(
            data.className ||
            data.class ||
            data.grade ||
            "Not Provided"
        ).trim() ||
        "Not Provided";

    const chapter =
        String(
            data.chapter ||
            data.chapterName ||
            data.topic ||
            "Not Provided"
        ).trim() ||
        "Not Provided";

    const type =
        String(
            data.type ||
            data.documentType ||
            "Notes"
        ).trim() ||
        "Notes";

    const isTest =
        /test|exam|assessment|quiz/i.test(
            type
        );

    const fields = [
        {
            label:"SUBJECT",
            value:subject
        },
        {
            label:"CLASS",
            value:className
        },
        {
            label:"CHAPTER",
            value:chapter
        },
        {
            label:"TYPE",
            value:type
        }
    ];

    return (

        <View
            style={{
                width:"100%",
                marginBottom:12,
                padding:8,
                borderWidth:1,
                borderColor:"#DCD8EF",
                borderRadius:14,
                backgroundColor:"#FFFFFF"
            }}
           
        >

            {/* CARD HEADER */}

            <View
                style={{
                    flexDirection:"row",
                    alignItems:"center",
                    justifyContent:"space-between",
                    marginBottom:6
                }}
            >

                <View
                    style={{
                        flexDirection:"row",
                        alignItems:"center"
                    }}
                >

                    <View
                        style={{
                            width:4,
                            height:4,
                            borderRadius:2,
                            backgroundColor:"#8B7CF6",
                            marginRight:5
                        }}
                    />

                    <Text
                        style={{
                            fontFamily:"NotoSansDevanagari",
                            fontSize:7,
                            fontWeight:"bold",
                            color:"#6D5DFB",
                            letterSpacing:1.35
                        }}
                    >
                        DOCUMENT DETAILS
                    </Text>

                </View>


                <View
                    style={{
                        paddingVertical:2,
                        paddingHorizontal:6,
                        borderRadius:7,
                        backgroundColor:
                            isTest
                                ? "#FFF7EA"
                                : "#F5F1FF",
                        borderWidth:1,
                        borderColor:
                            isTest
                                ? "#F0D39D"
                                : "#DED5FF"
                    }}
                >

                    <Text
                        style={{
                            fontFamily:"NotoSansDevanagari",
                            fontSize:5.5,
                            fontWeight:"bold",
                            color:
                                isTest
                                    ? "#A96A00"
                                    : "#6D5DFB",
                            letterSpacing:0.8
                        }}
                    >
                        {isTest
                            ? "ASSESSMENT"
                            : "LEARNING NOTES"}
                    </Text>

                </View>

            </View>


            {/* COMPACT 2 x 2 GRID */}

            <View
                style={{
                    flexDirection:"row",
                    flexWrap:"wrap",
                    width:"100%"
                }}
            >

                {fields.map(
                    (field,index) => (

                        <View
                            key={
                                "document-detail-" +
                                index
                            }
                            style={{
                                width:"48.7%",
                                marginRight:
                                    index % 2 === 0
                                        ? "2.6%"
                                        : 0,
                                marginBottom:5,
                                minHeight:45,
                                paddingVertical:8,
                                paddingHorizontal:8,
                                justifyContent:"center",
                                borderWidth:1,
                                borderColor:"#E4E5EC",
                                borderRadius:9,
                                backgroundColor:"#FBFBFD"
                            }}
                        >

                            <View
                                style={{
                                    flexDirection:"row",
                                    alignItems:"center",
                                    marginBottom:1
                                }}
                            >

                                <View
                                    style={{
                                        width:3,
                                        height:3,
                                        borderRadius:2,
                                        backgroundColor:
                                            isTest
                                                ? "#C88A22"
                                                : "#8B7CF6",
                                        marginRight:4
                                    }}
                                />

                                <Text
                                    style={{
                                        fontFamily:"NotoSansDevanagari",
                                        fontSize:5.4,
                                        fontWeight:"bold",
                                        color:"#7B8392",
                                        letterSpacing:0.8
                                    }}
                                >
                                    {field.label}
                                </Text>

                            </View>

                            <Text
                                style={{
                                    fontFamily:"NotoSansDevanagari",
                                    fontSize:8.5,
                                    lineHeight:10,
                                    color:"#292D40",
                                    width:"100%"
                                }}
                            >
                                {String(
                                    field.value ||
                                    "Not Provided"
                                ).trim()}
                            </Text>

                        </View>

                    )
                )}

            </View>


            {/* SMALL NYXORA ACCENT */}

            <View
                style={{
                    flexDirection:"row",
                    alignItems:"center",
                    marginTop:0
                }}
            >

                <View
                    style={{
                        width:32,
                        height:2,
                        backgroundColor:
                            isTest
                                ? "#C88A22"
                                : "#6D5DFB",
                        borderRadius:2
                    }}
                />

                <View
                    style={{
                        width:5,
                        height:5,
                        borderRadius:3,
                        backgroundColor:
                            isTest
                                ? "#E4B968"
                                : "#A99CFB",
                        marginLeft:4,
                        marginRight:5
                    }}
                />

                <View
                    style={{
                        flex:1,
                        height:1,
                        backgroundColor:"#E9E8EF"
                    }}
                />

            </View>

        </View>

    );

}


function NyxoraPDFTitle({
    title = ""
}){

    const safeTitle =
        formatPdfTitle(
            cleanText(title)
        );

    return (

        <View
            style={{
                width:"100%",
                marginTop:2,
                marginBottom:12,
                paddingBottom:8
            }}
            wrap={false}
        >

            {/* SAME NYXORA SECTION BADGE STYLE */}

            <View
                style={{
                    flexDirection:"row",
                    alignItems:"center",
                    marginBottom:5
                }}
            >

                <View
                    style={{
                        width:4,
                        height:4,
                        borderRadius:2,
                        backgroundColor:"#8B7CF6",
                        marginRight:5
                    }}
                />

                <Text
                    style={{
                        fontFamily:"NotoSansDevanagari",
                        fontSize:7.5,
                        fontWeight:"bold",
                        color:"#6D5DFB",
                        letterSpacing:1.5
                    }}
                >
                    SECTION
                </Text>

            </View>


            {/* DOCUMENT TITLE */}

            <Text
                style={{
                    fontFamily:"NotoSansDevanagari",
                    fontSize:15.5,
                    fontWeight:"bold",
                    color:"#24203B",
                    lineHeight:1.38,
                    textAlign:"left"
                }}
            >
                {safeTitle}
            </Text>


            {/* SAME NYXORA GRADIENT-LINE TREATMENT */}

            <View
                style={{
                    width:"100%",
                    flexDirection:"row",
                    alignItems:"center",
                    marginTop:8
                }}
            >

                <View
                    style={{
                        width:52,
                        height:3,
                        backgroundColor:"#6D5DFB",
                        borderRadius:2
                    }}
                />

                <View
                    style={{
                        width:7,
                        height:7,
                        borderRadius:4,
                        backgroundColor:"#A99CFB",
                        marginLeft:5,
                        marginRight:6
                    }}
                />

                <View
                    style={{
                        flex:1,
                        height:1,
                        backgroundColor:"#E3DFF0"
                    }}
                />

            </View>

        </View>

    );

}


function cleanText(text = ""){



return text

.replace(/\*\*/g,"")

.replace(/###/g,"")

.replace(/##/g,"")

.replace(/#/g,"")

.replace(/\\\(/g,"")

.replace(/\\\)/g,"")

.replace(/\$/g,"")

.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g,"$1/$2")

.replace(/\\times/g,"×")

.replace(/\\div/g,"÷")

.replace(/\\cdot/g,"·")

.replace(/\\circ/g,"°")

.replace(/\^\{([^}]+)\}/g,"^$1")

.replace(/\\angle/g,"∠")


.replace(/\\rightarrow/g,"→")

.replace(/\\to/g,"→")

.replace(/\\left/g,"")

.replace(/\\right/g,"")

.replace(/\\pm/g,"±")

.replace(/\\leq/g,"≤")

.replace(/\\le/g,"≤")

.replace(/\\geq/g,"≥")

.replace(/\\ge/g,"≥")

.replace(/\\neq/g,"≠")

.replace(/\\text\{([^{}]+)\}/g,"$1")

.replace(/\\mathrm\{([^{}]+)\}/g,"$1")

.replace(/\\mathbf\{([^{}]+)\}/g,"$1")

.replace(/\\_/g,"_")

.replace(/\\,/g," ")

.replace(/\$/g,"")

.replace(/\s*---\s*/g,"")

.replace(/\\ /g," ")


.trim();



}





function detectAnswerKey(text=""){



return text.match(

/^(Answer Key|उत्तर कुंजी)/i

);



}


function AnswerKeyBadge({title}){

    return(

        <View
            style={{
                width:"100%",
                marginTop:2,
                marginBottom:14,
                paddingBottom:10,
            }}
            wrap={false}
        >

            {/* SECTION LABEL */}

            <View
                style={{
                    flexDirection:"row",
                    alignItems:"center",
                    marginBottom:5,
                }}
            >

                <View
                    style={{
                        width:4,
                        height:4,
                        borderRadius:2,
                        backgroundColor:"#8B7CF6",
                        marginRight:5,
                    }}
                />

                <Text
                    style={{
                        fontFamily:"NotoSansDevanagari",
                        fontSize:7.5,
                        fontWeight:"bold",
                        color:"#6D5DFB",
                        letterSpacing:1.5,
                    }}
                >
                    ANSWER KEY
                </Text>

            </View>


            {/* MAIN HEADING */}

            <Text
                style={{
                    fontFamily:"NotoSansDevanagari",
                    fontSize:15.5,
                    fontWeight:"bold",
                    color:"#24203B",
                    lineHeight:1.38,
                    textAlign:"left",
                }}
            >
                {title}
            </Text>


            {/* PREMIUM DIVIDER */}

            <View
                style={{
                    flexDirection:"row",
                    alignItems:"center",
                    marginTop:8,
                }}
            >

                <View
                    style={{
                        width:52,
                        height:3,
                        backgroundColor:"#6D5DFB",
                        borderRadius:2,
                    }}
                />

                <View
                    style={{
                        width:7,
                        height:7,
                        borderRadius:4,
                        backgroundColor:"#A99CFB",
                        marginLeft:5,
                        marginRight:6,
                    }}
                />

                <View
                    style={{
                        flex:1,
                        height:1,
                        backgroundColor:"#E3DFF0",
                    }}
                />

            </View>

        </View>

    );

}


function AnswerKeySectionBubble({title}){

    return(

        <View
            style={{
                width:"100%",
                marginTop:12,
                marginBottom:10,
                paddingBottom:8,
            }}
            wrap={false}
            minPresenceAhead={120}
        >

            {/* MAIN HEADING */}

            <Text
                style={{
                    fontFamily:"NotoSansDevanagari",
                    fontSize:15.5,
                    fontWeight:"bold",
                    color:"#24203B",
                    lineHeight:1.38,
                    textAlign:"left",
                }}
            >
                {cleanText(title)}
            </Text>


            {/* PREMIUM DIVIDER */}

            <View
                style={{
                    flexDirection:"row",
                    alignItems:"center",
                    marginTop:8,
                }}
            >

                <View
                    style={{
                        width:52,
                        height:3,
                        backgroundColor:"#6D5DFB",
                        borderRadius:2,
                    }}
                />

                <View
                    style={{
                        width:7,
                        height:7,
                        borderRadius:4,
                        backgroundColor:"#A99CFB",
                        marginLeft:5,
                        marginRight:6,
                    }}
                />

                <View
                    style={{
                        flex:1,
                        height:1,
                        backgroundColor:"#E3DFF0",
                    }}
                />

            </View>

        </View>

    );

}



function AnswerKeyLabelBubble({text}){

    return(

        <View
            style={{
                width:"100%",
                marginTop:12,
                marginBottom:8,
                paddingBottom:6,
            }}
            wrap={false}
        >

            {/* SUBSECTION LABEL */}

            <View
                style={{
                    flexDirection:"row",
                    alignItems:"center",
                    marginBottom:4,
                }}
            >

                <View
                    style={{
                        width:3.5,
                        height:3.5,
                        borderRadius:2,
                        backgroundColor:"#9B8CF7",
                        marginRight:5,
                    }}
                />

                <Text
                    style={{
                        fontFamily:"NotoSansDevanagari",
                        fontSize:6.8,
                        fontWeight:"bold",
                        color:"#8174D4",
                        letterSpacing:1.2,
                    }}
                >
                    SUBSECTION
                </Text>

            </View>


            {/* SUBHEADING */}

            <Text
                style={{
                    fontFamily:"NotoSansDevanagari",
                    fontSize:11.5,
                    fontWeight:"bold",
                    color:"#373052",
                    lineHeight:1.35,
                    textAlign:"left",
                }}
            >
                {renderMixedMathText(cleanText(text))}
            </Text>


            {/* PREMIUM DIVIDER */}

            <View
                style={{
                    flexDirection:"row",
                    alignItems:"center",
                    marginTop:6,
                }}
            >

                <View
                    style={{
                        width:30,
                        height:2,
                        backgroundColor:"#8172F2",
                        borderRadius:2,
                    }}
                />

                <View
                    style={{
                        width:5,
                        height:5,
                        borderRadius:3,
                        backgroundColor:"#B0A5FA",
                        marginLeft:4,
                        marginRight:5,
                    }}
                />

                <View
                    style={{
                        flex:1,
                        height:1,
                        backgroundColor:"#E9E5F2",
                    }}
                />

            </View>

        </View>

    );

}



function AnswerKeyOptionBubble({letter,text}){

return(

<View

style={{

alignSelf:"flex-start",

flexDirection:"row",

alignItems:"flex-start",

backgroundColor:"#F8F5FF",

borderWidth:1,

borderColor:"#E0D7FF",

borderRadius:8,

paddingVertical:4,

paddingHorizontal:7,

marginTop:4,

marginBottom:2,

maxWidth:"100%"

}}

>

<View

style={{

width:14,

height:14,

borderRadius:7,

backgroundColor:"#6D5DFB",

justifyContent:"center",

alignItems:"center",

marginRight:6,

marginTop:1,

flexShrink:0

}}

>

<Text

style={{

fontFamily:"NotoSansDevanagari",

fontSize:7,

fontWeight:"bold",

color:"#FFFFFF",

lineHeight:8

}}

>

{letter}

</Text>

</View>

<Text

style={{

fontFamily:"NotoSansDevanagari",

fontSize:8.8,

lineHeight:1.3,

color:"#111827",

flexShrink:1

}}

>

{cleanText(text)}

</Text>

</View>

);

}

function readBalancedGroup(text, startIndex) {
  if (text[startIndex] !== "{") {
    return null;
  }

  let depth = 0;

  for (let i = startIndex; i < text.length; i++) {
    if (text[i] === "{") {
      depth++;
    } else if (text[i] === "}") {
      depth--;

      if (depth === 0) {
        return {
          content: text.slice(
            startIndex + 1,
            i
          ),
          endIndex: i + 1
        };
      }
    }
  }

  return null;
}


function replaceBalancedLatexCommand(
  text,
  command,
  replacer
) {
  let result = text;
  let searchFrom = 0;

  while (true) {
    const commandIndex =
      result.indexOf(
        "\\" + command,
        searchFrom
      );

    if (commandIndex < 0) {
      break;
    }

    const braceStart =
      commandIndex + command.length + 1;

    if (result[braceStart] !== "{") {
      searchFrom =
        braceStart + 1;

      continue;
    }

    const firstGroup =
      readBalancedGroup(
        result,
        braceStart
      );

    if (!firstGroup) {
      break;
    }

    let replacement;
    let endIndex =
      firstGroup.endIndex;

    if (command === "frac") {
      const secondBraceStart =
        firstGroup.endIndex;

      if (
        result[secondBraceStart] !== "{"
      ) {
        searchFrom =
          firstGroup.endIndex;

        continue;
      }

      const secondGroup =
        readBalancedGroup(
          result,
          secondBraceStart
        );

      if (!secondGroup) {
        break;
      }

      replacement = replacer(
        firstGroup.content,
        secondGroup.content
      );

      endIndex =
        secondGroup.endIndex;
    } else {
      replacement = replacer(
        firstGroup.content
      );
    }

    result =
      result.slice(0, commandIndex) +
      replacement +
      result.slice(endIndex);

    searchFrom =
      commandIndex +
      replacement.length;
  }

  return result;
}


function cleanAnswerKeyText(text = "") {

  let value =
    String(text || "");


  // Remove markdown
  value =
    value
      .replace(/\*\*/g, "")
      .replace(/`/g, "");


  // --------------------------------------------------
  // FRACTIONS
  // --------------------------------------------------

  value =
    replaceBalancedLatexCommand(
      value,
      "frac",
      (numerator, denominator) =>
        `${numerator}/${denominator}`
    );

  value =
    replaceBalancedLatexCommand(
      value,
      "dfrac",
      (numerator, denominator) =>
        `${numerator}/${denominator}`
    );


  // --------------------------------------------------
  // SQUARE ROOTS
  // --------------------------------------------------

  value =
    replaceBalancedLatexCommand(
      value,
      "sqrt",
      content =>
        `√(${content})`
    );


  // --------------------------------------------------
  // COMMON LATEX COMMANDS
  // --------------------------------------------------

  value =
    value
      .replace(/\\implies/g, "⇒")
      .replace(/\\Rightarrow/g, "⇒")
      .replace(/\\Longrightarrow/g, "⇒")
      

      .replace(/\\therefore/g, "∴")
      .replace(/\\because/g, "∵")

      .replace(/\\rightarrow/g, "→")
      .replace(/\\to/g, "→")

      .replace(/\\triangle/g, "△ ")
      .replace(/\\Delta/g, "Δ")

      .replace(/\\angle/g, "∠")
      .replace(/\\alpha/g, "α")
      .replace(/\\beta/g, "β")
      .replace(/\\gamma/g, "γ")
      .replace(/\\delta/g, "δ")
      .replace(/\\epsilon/g, "ε")
      .replace(/\\theta/g, "θ")
      .replace(/\\lambda/g, "λ")
      .replace(/\\mu/g, "μ")
      .replace(/\\pi/g, "π")
      .replace(/\\rho/g, "ρ")
      .replace(/\\sigma/g, "σ")
      .replace(/\\phi/g, "φ")
      .replace(/\\psi/g, "ψ")
      .replace(/\\omega/g, "ω")
      .replace(/\\Gamma/g, "Γ")
      .replace(/\\Delta/g, "Δ")
      .replace(/\\Theta/g, "Θ")
      .replace(/\\Lambda/g, "Λ")
      .replace(/\\Pi/g, "Π")
      .replace(/\\Sigma/g, "Σ")
      .replace(/\\Phi/g, "Φ")
      .replace(/\\Psi/g, "Ψ")
      .replace(/\\Omega/g, "Ω")
      .replace(/\\cong/g, "≅")
      .replace(/\\approx/g, "≈")
      
      .replace(/\\times/g, "×")
      .replace(/\\cdot/g, "·")
      .replace(/\\div/g, "÷")

      .replace(/\\pm/g, "±")

      .replace(/\\leq/g, "≤")
      .replace(/\\le/g, "≤")

      .replace(/\\geq/g, "≥")
      .replace(/\\ge/g, "≥")

      .replace(/\\neq/g, "≠")

      .replace(/\\sim/g, "∼")

      .replace(/\\parallel/g, " || ")
      .replace(/\\parallel/g, " || ")
      .replace(/\\perpendicular/g, "⊥")
      .replace(/\\perp/g, "⊥")

      .replace(/\\in/g, "∈")
      .replace(/\\notin/g, "∉");


  // --------------------------------------------------
  // TRIGONOMETRY
  // --------------------------------------------------

  value =
    value
      .replace(/\\tan\b/g, "tan")
      .replace(/\\theta/g, "θ")
      .replace(/\\sin\b/g, "sin")
      .replace(/\\cos\b/g, "cos")
      .replace(/\\cot\b/g, "cot")
      .replace(/\\sec\b/g, "sec")
      .replace(/\\csc\b/g, "csc");



  // --------------------------------------------------
  // TEXT COMMANDS
  // --------------------------------------------------

  value =
    value
      .replace(
        /\\text\{([^{}]*)\}/g,
        "$1"
      )

      .replace(
        /\\mathrm\{([^{}]*)\}/g,
        "$1"
      )

      .replace(
        /\\mathbf\{([^{}]*)\}/g,
        "$1"
      )

      .replace(
        /\\textbf\{([^{}]*)\}/g,
        "$1"
      )

      .replace(
        /\\textit\{([^{}]*)\}/g,
        "$1"
      );


  // --------------------------------------------------
  // ANGLES / POWERS
  // --------------------------------------------------

  value =
    value
      .replace(
        /\^\{([^{}]+)\}/g,
        "^$1"
      )

      .replace(
        /\^\\circ/g,
        "°"
      )

      .replace(
        /\^o\b/g,
        "°"
      )

      .replace(
        /\\circ/g,
        "°"
      );


  // --------------------------------------------------
  // LATEX DELIMITERS
  // --------------------------------------------------

  value =
    value
      .replace(/\\left/g, "")
      .replace(/\\right/g, "")

      .replace(/\\\(/g, "")
      .replace(/\\\)/g, "")

      .replace(/\\\[/g, "")
      .replace(/\\\]/g, "")

      .replace(/\$\$/g, "")
      .replace(/\$/g, "")

      .replace(/\\,/g, " ")
      .replace(/\\_/g, "_")
      .replace(/\\ /g, " ");


  // --------------------------------------------------
  // CLEAN SPACING
  // --------------------------------------------------

  value =
    value
      .replace(
        /[ \t]+/g,
        " "
      )

      .replace(
        /[ \t]*\r?\n[ \t]*/g,
        "\n"
      )

      .trim();


  return value;
}

function renderMixedMathText(text = "") {

    const value =
        normalizeContentText(
            String(text || "")
        );

    const mathSymbols =
        /[^\x00-\x7F]/u;

    const parts =
        value.split(
            /([^\x00-\x7F]+)/u
        );

    return parts.map(
        (part, index) => {

            if (!part) {
                return null;
            }

            const isDevanagari =
                /[\u0900-\u097F]/u.test(part);

            if (isDevanagari) {
                return (
                    <Text
                        key={"mixed-math-" + index}
                        style={{
                            fontFamily:
                                "NotoSansDevanagari",
                            fontSize: 9.5
                        }}
                    >
                        {part}
                    </Text>
                );
            }

            if (part === "△") {
                return (
                    <Text
                        key={"mixed-math-" + index}
                        style={{
                            fontFamily:
                                "NotoSansSymbols2",
                            fontSize: 9.5
                        }}
                    >
                        {part}
                    </Text>
                );
            }

            if (mathSymbols.test(part)) {
                return (
                    <Text
                        key={"mixed-math-" + index}
                        style={{
                            fontFamily:
                                "STIXTwoMath",
                            fontSize: 9.5
                        }}
                    >
                        {part}
                    </Text>
                );
            }

            return (
                <Text
                    key={"mixed-math-" + index}
                    style={{
                        fontFamily:
                            "NotoSans",
                        fontSize: 9.5
                    }}
                >
                    {part}
                </Text>
            );

        }
    );

}

 
function isLikelyAnswerKeyStepLine(text = ""){

const value = cleanAnswerKeyText(text)
.replace(/^(?:Q\s*)?\d+[.)]\s*/i, "")
.replace(/^प्र(?:श्न)?\s*\d+[.)]\s*/u, "")
.trim();

if(!value){
return false;
}

if(/^(?:Correct Option|Solution|Explanation|Answer|Working|Proof|उत्तर|समाधान|व्याख्या|उत्तर है)\b/i.test(value)){
return false;
}

if(/^(?:what|why|how|which|find|calculate|solve|prove|show|state|write|define|explain|if|let|given|in|a|an|the)\b/i.test(value)){
return false;
}

if(/^(?:[A-Z]{1,5}\s*=|[A-Z]{1,5}\s*(?:≤|≥|<|>|≠)|\(?[a-z]\)?\s*=|x\s*=|y\s*=|\d+\s*[+\-×÷=])/i.test(value)){
return true;
}

if(/^(?:By|Since|Thus|Therefore|Hence|So|Then|Also|Similarly|Because|As|From|Using|Given that|This implies|This shows)\b/i.test(value)){
return true;
}

if(/^(?:AB|BC|CD|DA|AC|BD|AD|BC|PQ|QR|RS|SP|DE|EF|FG|GH)\s*=/.test(value)){
return true;
}

if(/\b(?:opposite sides|common side|alternate interior angles|mid-point theorem|congruent triangles|perpendicular|parallel)\b/i.test(value)){
return true;
}

return false;
}


function splitAnswerKeySteps(text = ""){
const cleaned = cleanAnswerKeyText(text);

if(!cleaned){
return [];
}

const sourceLines = cleaned
.split(/\r?\n+/)
.map(line=>line.trim())
.filter(Boolean);

const steps = [];

sourceLines.forEach(line=>{
const implicationParts = line
.split(/\s*(?:⇒|\\implies|\\Rightarrow|\\Longrightarrow)\s*/u)
.map(part=>part.trim())
.filter(Boolean);

if(implicationParts.length > 1){
implicationParts.forEach(part=>steps.push(part));
return;
}

const semicolonParts = line
.split(/\s*;\s+/)
.map(part=>part.trim())
.filter(Boolean);

if(semicolonParts.length > 1){
semicolonParts.forEach(part=>steps.push(part));
return;
}

const sentenceParts = line
.split(/(?<=[.!?])\s+(?=[A-ZА-Яअ-ह0-9])/u)
.map(part=>part.trim())
.filter(Boolean);

if(sentenceParts.length > 1){
sentenceParts.forEach(part=>steps.push(part));
}else{
steps.push(line);
}
});

return steps;
}


function parseAnswerKeyDisplay(question={}){

const raw = cleanAnswerKeyText(String(question?.text || ""));

const labels = [

"Correct Option",

"Solution",

"Explanation",

"Answer",

"Working",

"Proof",

"उत्तर",

"समाधान",

"व्याख्या",

"उत्तर है"

];

const escapedLabels = labels.map(

label =>

label.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")

);

const labelPattern = new RegExp(

"(?:^|\\s)(" +

escapedLabels.join("|") +

")\\s*[:：-]?\\s*",

"iu"

);

const match = raw.match(labelPattern);

let questionText = raw;

const parts = [];



if(match){

const start = match.index;

questionText = raw.slice(0,start).trim();

const rest = raw.slice(start);

const partPattern = new RegExp(

"(" +

escapedLabels.join("|") +

")\\s*[:：-]?\\s*",

"giu"

);

const matches = [];

let partMatch;

while((partMatch = partPattern.exec(rest)) !== null){

matches.push({

index:partMatch.index,

length:partMatch[0].length,

label:partMatch[1]

});

}

matches.forEach((entry,index)=>{

const contentStart = entry.index + entry.length;

const contentEnd =

index + 1 < matches.length

?

matches[index + 1].index

:

rest.length;

parts.push({
    label:entry.label,

    content:
        cleanAnswerKeyText(
            rest.slice(contentStart,contentEnd)
        )
        .replace(
            /^\s*\*+\s*$/gm,
            ""
        )
        .trim()
});

});

}



return {

questionText,

parts,

options:Array.isArray(question?.options)

?

question.options.filter(Boolean)

:

[]

};

}



function AnswerKeyQuestion({question,index}){

const parsedNumber = Number(question?.number);

const number =

Number.isFinite(parsedNumber) &&

parsedNumber > 0

?

parsedNumber

:

index + 1;

const parsed =

parseAnswerKeyDisplay(question);

const optionLetters = ["a","b","c","d","e","f"];

return(

<View

style={{

width:"100%",

marginBottom:7

}}

>

<View
wrap={false}
style={{

flexDirection:"row",

alignItems:"flex-start",

width:"100%",

paddingTop:2,

paddingBottom:2

}}

>

<View

style={{

width:22,

height:22,

borderRadius:11,

backgroundColor:"#6D5DFB",

justifyContent:"center",

alignItems:"center",

marginRight:8

}}

>

<Text

style={{

fontFamily:"NotoSansDevanagari",

color:"#FFFFFF",

fontSize:9,

fontWeight:700

}}

>

{String(number)}

</Text>

</View>

<Text

style={{

fontFamily:"NotoSansDevanagari",

fontSize:10,

lineHeight:1.4,

color:"#111827",

fontWeight:"500",

flex:1

}}

>

{renderMixedMathText(parsed.questionText)}

</Text>

</View>



{

parsed.options.length > 0 &&

<View

style={{

width:"100%",

paddingLeft:25,

marginTop:1

}}

>

{

parsed.options.map((option,optionIndex)=>(

<AnswerKeyOptionBubble

key={

"answer-option-"+

number+

"-"+

optionIndex

}

letter={

optionLetters[optionIndex] ||

String(optionIndex + 1)

}

text={option}

/>

))

}

</View>

}



{

parsed.parts.map((part,partIndex)=>(

<View

key={

"answer-part-"+

number+

"-"+

partIndex

}

style={{

width:"100%",

paddingLeft:25,

marginTop:1

}}

>

<AnswerKeyLabelBubble

text={

part.label === "Correct Option"

?

"Correct Option" +

(

part.content

?

": " + part.content.replace(/^\*+\s*/u, "").trim()

:

""

)

:

part.label

}

/>



{

part.label !== "Correct Option" &&

part.content &&

<View

style={{

width:"100%",

paddingRight:4,

marginBottom:3

}}

>

{
  splitAnswerKeySteps(part.content).map(
    (step, stepIndex) => (
      <Text
        key={
          "answer-step-" +
          number +
          "-" +
          partIndex +
          "-" +
          stepIndex
        }
        style={{
          fontFamily: "NotoSansDevanagari",
          fontSize: 9.5,
          lineHeight: 1.45,
          color: "#111827",
          marginBottom: 3
        }}
      >
        {renderMixedMathText(
          step.replace(
            /^(?:\d+[.)]\s*|[①②③④⑤⑥⑦⑧⑨⑩]\s*)/,
            ""
          )
        )}
      </Text>
    )
  )
}

</View>

}

</View>

))

}

</View>

);

}



function cleanNoteText(
  text = ""
) {
    return normalizeContentText(
        String(text || "")
            .replace(/\*\*/g,"")
            .replace(/`/g,"")
            .trim()
    );

}

 
function isNoteHeading(line=""){

return /^\s*(?:[-*•]\s*)?#{1,6}\s+/.test(line);

}



function getNoteHeading(line=""){

return cleanNoteText(

line.replace(/^\s*(?:[-*•]\s*)?#{1,6}\s+/,"")

);

}



function isNoteSubheading(line=""){

const cleaned = cleanNoteText(

line

.replace(/^\s*(?:[-*•]\s*)?/,"")

);

return (

/^\*{1,2}[^*]+\*{1,2}\s*:?\s*$/.test(cleaned)

||

/^[A-Za-z\u0900-\u097F][A-Za-z0-9\u0900-\u097F &()\/-]{1,60}:\s*$/u.test(cleaned)

);

}



function getNoteSubheading(line=""){

return cleanNoteText(

line

.replace(/^\s*(?:[-*•]\s*)?/,"")

.replace(/^\*{1,2}/,"")

.replace(/\*{1,2}\s*:?\s*$/,"")

.trim()

);

}

function parseNoteTable(line = "") {

    const value = String(line || "").trim();

    if (!value.includes("|")) {
        return null;
    }

    const cells = value
        .split("|")
        .map(cell => cleanNoteText(cell.trim()))
        .filter(Boolean);

    if (cells.length < 2) {
        return null;
    }

    // Ignore Markdown separator rows such as:
    // |---|---|---|
    const isSeparatorRow =
        cells.every(
            cell => /^:?-{2,}:?$/.test(cell)
        );

    if (isSeparatorRow) {
        return {
            separator: true,
            cells
        };
    }

    return {
        separator: false,
        cells
    };
}


function isFlowchartDiagramBlock(language="", content=""){

    const lang =
        String(language || "")
            .trim()
            .toLowerCase();

    if(
        lang === "mermaid" ||
        lang === "mermaidjs" ||
        lang === "flowchart" ||
        lang === "graph"
    ){
        return true;
    }

    const source =
        String(content || "");

    return (
        /\b(?:graph|flowchart)\s+(?:td|tb|lr|rl|bt)\b/i.test(source) ||
        /(?:-->|==>|-.->|══>|→|⇒)/u.test(source) ||
        /[┌┐└┘├┤┬┴│─╲╱▼△]/u.test(source)
    );

}


function extractFlowchartDiagramSteps(content=""){

    const source =
        String(content || "");

    const steps = [];
    const seen = new Set();

    const addStep = value => {

        const point =
            String(value || "")
                .replace(/\*\*/g, "")
                .replace(/^[-*•\d.)\s]+/u, "")
                .replace(/[┌┐└┘├┤┬┴│─═╲╱▼△→⇒]+/gu, " ")
                .replace(/\s+/g, " ")
                .trim();

        if(
            !point ||
            point.length < 2 ||
            point.length > 80
        ){
            return;
        }

        if(
            /^[<>'"`;:,._\\/=+\-]+$/u.test(point) ||
            /^(?:graph|flowchart|td|tb|lr|rl|bt)$/iu.test(point)
        ){
            return;
        }

        const key =
            point.toLowerCase();

        if(
            seen.has(key) ||
            steps.length >= 6
        ){
            return;
        }

        seen.add(key);
        steps.push(point);

    };

    /*
     * Mermaid / bracket node labels:
     * A[Machine Learning] --> B[Supervised Learning]
     */
    for(
        const match of source.matchAll(
            /(?:[A-Za-z0-9_-]+\s*)?\[\[?([^\]\n]+?)\]\]?/g
        )
    ){
        addStep(match[1]);
    }

    /*
     * ASCII boxes using pipe-separated cells.
     * Merge matching columns across successive rows.
     */
    const pipeRows =
        source
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(
                line =>
                    (line.match(/\|/g) || []).length >= 2
            )
            .map(line =>
                line
                    .split("|")
                    .slice(1,-1)
                    .map(cell =>
                        cell
                            .replace(
                                /[`~^<>{}\[\]()*_:=;]+/gu,
                                " "
                            )
                            .replace(/\s+/g," ")
                            .trim()
                    )
                    .filter(Boolean)
            )
            .filter(row => row.length > 0);

    if(pipeRows.length){

        const maxColumns =
            Math.max(
                ...pipeRows.map(
                    row => row.length
                )
            );

        for(
            let column=0;
            column<maxColumns;
            column++
        ){

            const parts=[];

            pipeRows.forEach(row => {

                if(
                    row[column] &&
                    (
                        !parts.length ||
                        parts[parts.length - 1].toLowerCase() !==
                            row[column].toLowerCase()
                    )
                ){
                    parts.push(
                        row[column]
                    );
                }

            });

            if(parts.length){
                addStep(
                    parts.join(" ")
                );
            }

        }

    }

    /*
     * Single-box labels such as:
     * | Machine Learning |
     */
    source
        .split(/\r?\n/)
        .forEach(line => {

            const cells =
                line
                    .split("|")
                    .slice(1,-1)
                    .map(cell =>
                        cell
                            .replace(
                                /[`~^<>{}\[\]()*_:=;]+/gu,
                                " "
                            )
                            .replace(/\s+/g," ")
                            .trim()
                    )
                    .filter(Boolean);

            cells.forEach(
                addStep
            );

        });

    return steps.slice(0,6);

}

function isNyxoraFlowchartDiagram(diagram = {}){

    if(
        !diagram ||
        typeof diagram !== "object"
    ){
        return false;
    }

    const labels =
        Array.isArray(diagram.labels)
            ? diagram.labels
            : [];

    const lines =
        Array.isArray(diagram.lines)
            ? diagram.lines
            : [];

    const rectangles =
        Array.isArray(diagram.rectangles)
            ? diagram.rectangles
            : [];

    const points =
        Array.isArray(diagram.points)
            ? diagram.points
            : [];

    const polygons =
        Array.isArray(diagram.polygons)
            ? diagram.polygons
            : [];

    const ellipses =
        Array.isArray(diagram.ellipses)
            ? diagram.ellipses
            : [];

    const paths =
        Array.isArray(diagram.paths)
            ? diagram.paths
            : [];

    const dimensions =
        Array.isArray(diagram.dimensions)
            ? diagram.dimensions
            : [];

    /*
     * AI flowcharts generated for Notes use:
     * scene + labeled rectangles + connector lines.
     *
     * Scientific/geometry diagrams generally contain additional
     * geometric primitives such as points, polygons, ellipses,
     * paths or dimensions.
     */

    return (
        String(diagram.type || "")
            .toLowerCase() === "scene" &&

        labels.length >= 3 &&
        lines.length >= 1 &&
        rectangles.length >= 2 &&

        points.length === 0 &&
        polygons.length === 0 &&
        ellipses.length === 0 &&
        paths.length === 0 &&
        dimensions.length === 0
    );

}

function parseNotes(content="", orderedDiagrams=[]){

const rawSource =
String(content || "");

const safeSource =
rawSource.replace(
    /```([^\n`]*)\n([\s\S]*?)```/g,
    (full, language, fencedContent) => {

        if(
            isFlowchartDiagramBlock(
                language,
                fencedContent
            )
        ){

            /*
             * The fenced diagram is converted into the existing
             * mandatory Nyxora flowchart instead of becoming
             * ordinary note bullets.
             */
            return "";

        }

        return fencedContent;

    }
);

const lines = safeSource

.split("\n")

.map(line=>line.trim())

.filter(Boolean);


const blocks = [];

let currentBullets = [];



const flushBullets = () => {

if(currentBullets.length){

const safeItems = currentBullets

.map(item=>String(item || "").trim())

.filter(item=>item && !/^[*•._-]+$/.test(item));



if(safeItems.length){

blocks.push({

type:"bullets",

items:safeItems

});

}



currentBullets=[];

}

};



for(let lineIndex = 0; lineIndex < lines.length; lineIndex++){

    const rawLine = lines[lineIndex];

    let line = rawLine.trim();

    if(!line){

        continue;

    }



const diagramMatch = line.match(

/^__NYXORA_DIAGRAM_(\d+)__$/

);



if(diagramMatch){

flushBullets();

const diagramIndex = Number(diagramMatch[1]);

const diagramEntry = orderedDiagrams[diagramIndex];



if(

diagramEntry &&

diagramEntry.diagram

){

blocks.push({

type:"diagram",

diagram:diagramEntry.diagram

});

}

continue;

}



if(

/^\s*(?:[-–—]|[*•])\s*$/.test(line)

){

continue;

}



if(isNoteHeading(line)){

flushBullets();

blocks.push({

type:"heading",

text:getNoteHeading(line)

});

continue;

}



if(isNoteSubheading(line)){

flushBullets();

blocks.push({

type:"subheading",

text:getNoteSubheading(line)

});

continue;

}

const tableStart = parseNoteTable(line);

if(
    tableStart &&
    !tableStart.separator
){

    flushBullets();

    const headers =
        tableStart.cells.slice(0, 4);

    const rows = [];

    let rowIndex = lineIndex + 1;

    while(
        rowIndex < lines.length
        
    ){

        const parsedRow =
            parseNoteTable(
                lines[rowIndex]
            );

        if(!parsedRow){
            break;
        }

        if(parsedRow.separator){
            rowIndex++;
            continue;
        }

        rows.push(
            parsedRow.cells.slice(0, 4)
        );

        rowIndex++;
    }

    blocks.push({
        type:"table",
        headers,
        rows
    });

    lineIndex = rowIndex - 1;

    continue;
}

const inlineSubheading = line.match(

/^\s*(?:[-*•]\s+)?\*{1,2}([^*]+)\*{1,2}\s*:\s*(.+)$/i

);



if(inlineSubheading){

flushBullets();

blocks.push({

type:"subheading",

text:cleanNoteText(

inlineSubheading[1].trim() + ":"

)

});



const inlineText = cleanNoteText(

inlineSubheading[2].trim()

);



if(inlineText){

blocks.push({

type:"bullets",

items:[inlineText]

});

}



continue;

}



const hasBullet = /^\s*(?:[-*•]|\d+[.)])\s+/.test(line);



line = cleanNoteText(line);



if(!line){

continue;

}



if(hasBullet){

line = line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/g,"").trim();

if(line){

currentBullets.push(line);

}

continue;

}



if(line){

currentBullets.push(line);

}

};



flushBullets();



return blocks;

}



function NotesContent({blocks=[]}){

return(

<View>

{

blocks.map((block,index)=>{

if(block.type==="diagram"){

    const useNyxoraFlowchart =
        isNyxoraFlowchartDiagram(
            block.diagram
        );

    return(

        <View
            key={"note-diagram-"+index}
            style={{
                width:"100%",
                marginTop:8,
                marginBottom:10,
                alignItems:"center"
            }}
            wrap={false}
        >

            {useNyxoraFlowchart ? (

                <NotesFlowchart
                    title={
                        block.diagram?.title ||
                        "Flow Chart"
                    }
                    steps={
                        Array.isArray(
                            block.diagram?.labels
                        )
                            ? block.diagram.labels
                                .map(label =>
                                    typeof label === "string"
                                        ? label
                                        : label?.text || ""
                                )
                                .filter(Boolean)
                            : []
                    }
                />

            ) : (

                <MathDiagram
                    {...(block.diagram || {})}
                />

            )}

        </View>

    );

}

if(block.type==="image"){

    return(
        <View
            key={"note-image-"+index}
            style={{
                width:"100%",
                marginTop:10,
                marginBottom:12,
                alignItems:"center"
            }}
            wrap={false}
        >

            <View
                style={{
                    width:"100%",
                    borderRadius:14,
                    overflow:"hidden",
                    backgroundColor:"#FFFFFF",
                    borderWidth:1,
                    borderColor:"#E4E5EC",
                    padding:0
                }}
            >

                <Image
                    src={block.imageUrl}
                    style={{
                        width:"100%",
                        height:220,
                        objectFit:"cover",
                        borderRadius:14
                    }}
                />

            </View>

        </View>
    );

}

if(block.type==="table"){
    return(
        <NotesTable
            key={"note-table-"+index}
            title={block.title || ""}
            headers={block.headers || []}
            rows={block.rows || []}
        />
    );
}


if(block.type==="subheading"){

    return(

        <View
            key={"note-subheading-"+index}

            style={{
                width:"100%",

                marginTop:12,

                marginBottom:8,

                paddingBottom:6,
            }}

        >

            {/* SUBSECTION LABEL */}

            <View
                style={{
                    flexDirection:"row",

                    alignItems:"center",

                    marginBottom:4,
                }}
            >

                <View
                    style={{
                        width:3.5,

                        height:3.5,

                        borderRadius:2,

                        backgroundColor:"#9B8CF7",

                        marginRight:5,
                    }}
                />

                <Text
                    style={{
                        fontFamily:
                            "NotoSansDevanagari",

                        fontSize:6.8,

                        fontWeight:"bold",

                        color:"#8174D4",

                        letterSpacing:1.2,
                    }}
                >
                    SUBSECTION
                </Text>

            </View>


            {/* SUBHEADING */}

            <Text
                style={{
                    fontFamily:
                        "NotoSansDevanagari",

                    fontSize:11.5,

                    fontWeight:"bold",

                    color:"#373052",

                    lineHeight:1.35,

                    textAlign:"left",
                }}
            >
                {renderMixedMathText(block.text)}
            </Text>


            {/* PREMIUM DIVIDER */}

            <View
                style={{
                    flexDirection:"row",

                    alignItems:"center",

                    marginTop:6,
                }}
            >

                <View
                    style={{
                        width:30,

                        height:2,

                        backgroundColor:"#8172F2",

                        borderRadius:2,
                    }}
                />

                <View
                    style={{
                        width:5,

                        height:5,

                        borderRadius:3,

                        backgroundColor:"#B0A5FA",

                        marginLeft:4,

                        marginRight:5,
                    }}
                />

                <View
                    style={{
                        flex:1,

                        height:1,

                        backgroundColor:"#E9E5F2",
                    }}
                />

            </View>

        </View>

    );

}



if(block.type==="heading"){

    return(

        <View
            key={"note-heading-"+index}

            style={{
                width:"100%",

                marginTop:index===0?2:20,

                marginBottom:14,

                paddingBottom:10,
            }}

            wrap={false}
        >

            {/* SECTION LABEL */}

            <View
                style={{
                    flexDirection:"row",

                    alignItems:"center",

                    marginBottom:5,
                }}
            >

                <View
                    style={{
                        width:4,

                        height:4,

                        borderRadius:2,

                        backgroundColor:"#8B7CF6",

                        marginRight:5,
                    }}
                />

                <Text
                    style={{
                        fontFamily:
                            "NotoSansDevanagari",

                        fontSize:7.5,

                        fontWeight:"bold",

                        color:"#6D5DFB",

                        letterSpacing:1.5,
                    }}
                >
                    SECTION
                </Text>

            </View>


            {/* MAIN HEADING */}

            <Text
                style={{
                    fontFamily:
                        "NotoSansDevanagari",

                    fontSize:15.5,

                    fontWeight:"bold",

                    color:"#24203B",

                    lineHeight:1.38,

                    textAlign:"left",
                }}
            >
                {renderMixedMathText(block.text)}
            </Text>


            {/* PREMIUM DIVIDER */}

            <View
                style={{
                    flexDirection:"row",

                    alignItems:"center",

                    marginTop:8,
                }}
            >

                <View
                    style={{
                        width:52,

                        height:3,

                        backgroundColor:"#6D5DFB",

                        borderRadius:2,
                    }}
                />

                <View
                    style={{
                        width:7,

                        height:7,

                        borderRadius:4,

                        backgroundColor:"#A99CFB",

                        marginLeft:5,

                        marginRight:6,
                    }}
                />

                <View
                    style={{
                        flex:1,

                        height:1,

                        backgroundColor:"#E3DFF0",
                    }}
                />

            </View>

        </View>

    );

}



return(

<View

key={"note-bullets-"+index}

style={{

marginBottom:4

}}

>

{

block.items.map((item,itemIndex)=>(

<View
  key={"note-item-"+index+"-"+itemIndex}
  style={{
    flexDirection:"row",
    alignItems:"flex-start",
    marginBottom:5,
    paddingLeft:2
  }}
>

  <Text
    style={{
      fontFamily:"NotoSansDevanagari",
      fontSize:18,
      lineHeight:1.35,
      color:"#6D5DFB",
      width:18,
      marginTop:1
    }}
  >
    {"•"}
  </Text>

  <Text
    style={{
      fontFamily:"NotoSansDevanagari",
      fontSize:10,
      lineHeight:1.35,
      color:"#111827",
      flex:1
    }}
  >
    {renderMixedMathText(item)}
  </Text>

</View>

))

}

</View>

);

})

}

</View>

);

}



function isMultipleChoiceSectionTitle(title=""){

return (

/बहुविकल्पीय/.test(title)

||

/multiple\s*choice/i.test(title)

||

/multiple-choice/i.test(title)

);

}



function parseMultipleChoiceLine(line=""){

const normalized = cleanText(line)

.replace(/\s+/g," ")

.trim();



const questionPattern =

/(?:^|\s)((?:Q\s*)\d+\s*[.)]|(?:प्र|प्रश्न)\s*\d+\s*[.)]|\d+\s*\.\s*(?=[A-Za-zअ-ह]))/giu;



const matches = [];

let match;



while((match = questionPattern.exec(normalized)) !== null){

const marker = match[0].trim();



matches.push({

index:match.index + match[0].indexOf(marker),

marker,

length:marker.length,

number:(marker.match(/\d+/)||[""])[0]

});

}



if(!matches.length){

return [];

}



const questions = [];



matches.forEach((entry,index)=>{

const start = entry.index + entry.length;

const end = index + 1 < matches.length

? matches[index + 1].index

: normalized.length;



const body = normalized.slice(start,end).trim();



if(!body){

return;

}



const optionPattern =

/(?:^|\s)(?:\(([a-dA-Dकखगघ])\)|([a-dA-Dकखगघ])\s*[.)])\s*/gu;



const optionMatches = [];

let optionMatch;



while((optionMatch = optionPattern.exec(body)) !== null){

const markerIndex = optionMatch[0].indexOf(optionMatch[1] || optionMatch[2]);



optionMatches.push({

index:optionMatch.index + markerIndex,

length:optionMatch[0].length - markerIndex

});

}



let questionText = body;

const options = [];



if(optionMatches.length){

questionText = body.slice(0,optionMatches[0].index).trim();



optionMatches.forEach((option,index2)=>{

const optionStart = option.index + option.length;

const optionEnd = index2 + 1 < optionMatches.length

? optionMatches[index2 + 1].index

: body.length;



const optionText = body

.slice(optionStart,optionEnd)

.replace(/^\s*[-:]+\s*/g,"")

.trim();



if(optionText){

options.push(optionText);

}

});

}



if(questionText && options.length >= 2){

questions.push({

text:questionText,

options,

number:Number(entry.number) || questions.length + 1

});

}

});



return questions;

}



function isHindiMCQSection(section={}, isHindi=false){

const title = String(section.title || "");

const questions =

Array.isArray(section.questions)

? section.questions

: [];



const hasHindiOptions = questions.some(question=>{

if(question?.isHindiMCQ === true){

return true;

}



const questionText = String(question?.text || "");

const optionText = Array.isArray(question?.options)

? question.options.join(" ")

: "";



return (

(

Array.isArray(question?.options)

&&

question.options.length >= 2

&&

/[कखगघ]/u.test(

questionText +

" " +

optionText

)

)

||

/(?:\([कखगघ]\)|[कखगघ]\s*[.)])/.test(

questionText

)

);

});



return (

Boolean(isHindi)

&&

(

/बहुविकल्पीय/.test(title)

||

/MCQ|multiple\s*choice|multiple-choice/i.test(title)

||

hasHindiOptions

)

);

}



function HindiQuestionCircle({number}){

return(

<View

style={{

width:16,

height:16,

borderRadius:8,

backgroundColor:"#6D5DFB",

justifyContent:"center",

alignItems:"center",

marginRight:7,

marginTop:1,

flexShrink:0

}}

>

<Text

style={{

fontFamily:"NotoSansDevanagari",

fontSize:8,

fontWeight:"bold",

color:"#FFFFFF",

lineHeight:10

}}

>

{String(number)}

</Text>

</View>

);

}



function HindiOptionBubble({letter,text}){

return(

<View

style={{

flexDirection:"row",

alignItems:"flex-start",

width:"100%",

marginTop:5,

paddingVertical:6,

paddingHorizontal:8,

borderRadius:9,

backgroundColor:"#F8F5FF",

borderWidth:1,

borderColor:"#E0D7FF"

}}

wrap={false}

>

<View

style={{

width:15,

height:15,

borderRadius:7.5,

backgroundColor:"#6D5DFB",

justifyContent:"center",

alignItems:"center",

marginRight:7,

marginTop:1,

flexShrink:0

}}

>

<Text

style={{

fontFamily:"NotoSansDevanagari",

fontSize:7.5,

fontWeight:"bold",

color:"#FFFFFF",

lineHeight:9

}}

>

{letter}

</Text>

</View>



<Text
  style={{
    fontFamily:"NotoSansDevanagari",
    fontSize:9,
    lineHeight:1.45,
    color:"#111827",
    flex:1
  }}
  preserveWhitespace
>

{text}

</Text>

</View>

);

}



function HindiMCQQuestion({question,index}){

const number =

question?.number ||

index + 1;



const options = Array.isArray(question?.options)

? question.options.filter(Boolean)

: [];



const letters = ["क","ख","ग","घ"];



return(

<View

style={{

width:"100%",

marginBottom:10

}}

wrap={false}

>

<View

style={{

flexDirection:"row",

alignItems:"flex-start",

width:"100%",

paddingVertical:7,

paddingHorizontal:9,

borderRadius:10,

backgroundColor:"#F3EEFF",

borderWidth:1,

borderColor:"#D8CCFF"

}}

>

<HindiQuestionCircle

number={number}

/>



<Text

style={{

fontFamily:"NotoSansDevanagari",

fontSize:10,

lineHeight:1.4,

color:"#111827",

fontWeight:"500",

flex:1

}}

>

{String(question?.text || "")}

</Text>

</View>



<View

style={{

width:"100%",

paddingLeft:10,

paddingRight:1,

paddingTop:1

}}

>

{

options.map((option,optionIndex)=>(

<HindiOptionBubble

key={"hindi-option-"+number+"-"+optionIndex}

letter={letters[optionIndex] || String.fromCharCode(97 + optionIndex)}

text={String(option)}

/>

))

}

</View>

</View>

);

}



function expandHindiMCQQuestions(questions=[]){

const expanded = [];



questions.forEach((question,index)=>{

if(

!question ||

typeof question !== "object"

){

return;

}



const rawText = String(question.text || "").trim();



const rawOptions = Array.isArray(question.options)

? question.options

.filter(Boolean)

.map(option=>

typeof option === "object"

? String(option.text || "").trim()

: String(option).trim()

)

.filter(Boolean)

: [];



const parsed = parseMultipleChoiceLine(rawText);



if(

parsed.length >= 1

){

parsed.forEach(parsedQuestion=>{

if(

parsedQuestion &&

String(parsedQuestion.text || "").trim() &&

Array.isArray(parsedQuestion.options) &&

parsedQuestion.options.length >= 2

){

expanded.push({

text:String(parsedQuestion.text).trim(),

options:parsedQuestion.options,

number:

Number(parsedQuestion.number) ||

expanded.length + 1

});

}

});



if(parsed.some(parsedQuestion=>

parsedQuestion &&

Array.isArray(parsedQuestion.options) &&

parsedQuestion.options.length >= 2

)){

return;

}

}



if(

rawOptions.length >= 2 &&

/[कखगघ]/u.test(

rawText +

" " +

rawOptions.join(" ")

)

){

expanded.push({

text:rawText,

options:rawOptions,

number:

Number(question.number) ||

expanded.length + 1

});



return;

}

});



return expanded;

}



function parseHindiMCQsFromSource(content=""){

const source = String(content || "");



const cleaned = source

.replace(/\r/g,"")

.replace(/\*\*/g,"")

.replace(/###/g,"")

.replace(/##/g,"")

.replace(/#/g,"")

.replace(/\\\(/g,"")

.replace(/\\\)/g,"")

.replace(/\$/g,"")

.replace(/\s+/g," ")

.trim();



const questions = [];



const sectionMatch = cleaned.match(

/खंड\s*['"]?क['"]?\s*:\s*बहुविकल्पीय[\s\S]*?(?=\s*खंड\s*['"]?[खगघ]['"]?\s*:|\s*(?:उत्तर कुंजी|Answer Key))/iu

);



const mcqBlock = sectionMatch

?

sectionMatch[0]

:

cleaned;



const questionRegex =

/प्र(?:श्न)?\s*(\d+)\s*[.)]\s*([\s\S]*?)(?=\s*प्र(?:श्न)?\s*\d+\s*[.)]|\s*खंड\s*['"]?[खगघ]['"]?\s*:|\s*(?:उत्तर कुंजी|Answer Key)|$)/gu;



let questionMatch;



while(

(questionMatch = questionRegex.exec(mcqBlock)) !== null

){



const number =

Number(questionMatch[1]) ||

questions.length + 1;



const body =

String(questionMatch[2] || "")

.replace(/\s+/g," ")

.trim();



const optionRegex =

/(?:^|\s)\(([कखगघ])\)\s*([\s\S]*?)(?=\s*\([कखगघ]\)\s*|$)/gu;



const options = [];

let optionMatch;



while(

(optionMatch = optionRegex.exec(body)) !== null

){

const text =

String(optionMatch[2] || "")

.trim();



if(text){

options.push({

letter:optionMatch[1],

text

});

}

}



if(options.length >= 2){

const firstOptionIndex =

body.search(

/(?:^|\s)\([कखगघ]\)\s*/u

);



const questionText =

firstOptionIndex >= 0

?

body

.slice(0,firstOptionIndex)

.trim()

:

body;



if(questionText){

questions.push({

number,

text:questionText,

options:options.map(

option=>option.text

),

isHindiMCQ:true

});

}

}

}



return questions;

}



function HindiMCQSection({section,sourceContent=""}){

const sourceQuestions =

parseHindiMCQsFromSource(

sourceContent

);



const mcqQuestions =

sourceQuestions.length

?

sourceQuestions

:

expandHindiMCQQuestions(

Array.isArray(section.questions)

? section.questions

: []

);



return(

<View

style={{

width:"100%",

marginBottom:8

}}

>

<View

style={{

backgroundColor:"#F5F1FF",

borderWidth:1,

borderColor:"#D8CCFF",

borderRadius:12,

paddingVertical:7,

paddingHorizontal:11,

marginBottom:8

}}

wrap={false}

>

<Text

style={{

fontFamily:"NotoSansDevanagari",

fontSize:10.5,

fontWeight:"bold",

color:"#4F46E5"

}}

>

{section.title}

</Text>

</View>



{

mcqQuestions.map((question,index)=>(

<HindiMCQQuestion

key={"hindi-question-"+String(question?.number || index + 1)+"-"+index}

question={question}

index={index}

/>

))

}

</View>

);

}



function parseHindiMCQQuestionLine(line=""){

const normalized = cleanText(line)

.replace(/\s+/g," ")

.trim();



const questionMatch = normalized.match(

/^प्र(?:श्न)?\s*(\d+)\s*[.)]\s*/u

);



if(!questionMatch){

return null;

}



const number = Number(questionMatch[1]);



const body = normalized

.slice(questionMatch[0].length)

.trim();



const optionPattern =

/(?:^|\s)\(([कखगघ])\)\s*/gu;



const optionMatches = [];

let optionMatch;



while(

(optionMatch = optionPattern.exec(body)) !== null

){

optionMatches.push({

index:optionMatch.index,

letter:optionMatch[1],

prefixLength:optionMatch[0].length

});

}



if(optionMatches.length < 2){

return null;

}



const questionText =

body

.slice(

0,

optionMatches[0].index

)

.trim();



if(!questionText){

return null;

}



const options = [];



optionMatches.forEach(

(option,index)=>{

const optionEnd =

index + 1 < optionMatches.length

?

optionMatches[index + 1].index

:

body.length;



const optionStart =

option.index +

option.prefixLength;



const optionText =

body

.slice(optionStart,optionEnd)

.trim();



if(optionText){

options.push({

letter:option.letter,

text:optionText

});

}

}

);



if(options.length < 2){

return null;

}



return {

number:number || 1,

text:questionText,

options:options.map(

option=>option.text

)

};

}






function readBalancedJsonObject(text="", startIndex=0){

if(text[startIndex] !== "{"){

return null;

}



let depth = 0;

let inString = false;

let escaped = false;



for(let index=startIndex; index<text.length; index += 1){

const char = text[index];



if(inString){

if(escaped){

escaped = false;

continue;

}



if(char === "\\"){

escaped = true;

continue;

}



if(char === '"'){

inString = false;

}



continue;

}



if(char === '"'){

inString = true;

continue;

}



if(char === "{"){

depth += 1;

continue;

}



if(char === "}"){

depth -= 1;



if(depth === 0){

return {

startIndex,

endIndex:index + 1

};

}

}

}



return null;

}



function extractMathDiagramData(content=""){

const diagramsByNumber = {};

const unnumberedDiagrams = [];

const orderedDiagrams = [];

const source = String(content || "");

let cleanedContent = source;



const addDiagram = (diagram, number) => {

if(!diagram || typeof diagram !== "object"){

return;

}



const parsedNumber = Number(number);



if(Number.isFinite(parsedNumber) && parsedNumber > 0){

diagramsByNumber[parsedNumber] = diagram;

}else{

unnumberedDiagrams.push(diagram);

}



orderedDiagrams.push({

number:

Number.isFinite(parsedNumber) && parsedNumber > 0

? parsedNumber

: null,

diagram

});

};



const collect = value => {

if(!value || typeof value !== "object"){

return 0;

}



let count = 0;



if(value.diagram && typeof value.diagram === "object"){

addDiagram(

value.diagram,

value.number ??

value.questionNumber ??

value.questionNo ??

value.qNumber

);

count += 1;

}else{

const hasVectorDiagramData =

Array.isArray(value.points) ||

Array.isArray(value.lines) ||

Array.isArray(value.segments) ||

Array.isArray(value.vectors) ||

Array.isArray(value.labels);



if(hasVectorDiagramData){

const number =

value.number ??

value.questionNumber ??

value.questionNo ??

value.qNumber;



const diagram = {

...value

};



delete diagram.number;

delete diagram.questionNumber;

delete diagram.questionNo;

delete diagram.qNumber;



addDiagram(diagram, number);

count += 1;

}

}



if(Array.isArray(value)){

value.forEach(item=>{

count += collect(item);

});



return count;

}



Object.entries(value).forEach(([key, item])=>{

if(key === "diagram"){

return;

}



count += collect(item);

});



return count;

};



const replaceWithPlaceholders = (

text,

startIndex,

endIndex,

startOrder,

count

) => {

const placeholders = [];



for(let index=0; index<count; index += 1){

placeholders.push(

`__NYXORA_DIAGRAM_${

startOrder + index

}__`

);

}



return (

text.slice(0,startIndex) +

placeholders.join("\n") +

text.slice(endIndex)

);

};



/*

 * ---------------------------------------------------------
 * 1. Remove fenced diagram JSON from visible PDF content.
 * ---------------------------------------------------------
 */

const fencedMatches = [

...source.matchAll(

/```(?:json|javascript|js)?\s*([\s\S]*?)```/gi

)

];



const fencedDiagramReplacements = [];



fencedMatches.forEach(match=>{

const block = match[1];



try{

const parsed = JSON.parse(block.trim());

const beforeCount = orderedDiagrams.length;

const foundCount = collect(parsed);



if(foundCount > 0 && orderedDiagrams.length > beforeCount){

fencedDiagramReplacements.push({

startIndex:match.index,

endIndex:

match.index + match[0].length,

startOrder:beforeCount,

count:foundCount

});

}

}catch(error){

/*

 * Leave non-JSON fenced content untouched.
 */

}

});



fencedDiagramReplacements

.slice()

.reverse()

.forEach(replacement=>{

cleanedContent =

replaceWithPlaceholders(

cleanedContent,

replacement.startIndex,

replacement.endIndex,

replacement.startOrder,

replacement.count

);

});



/*

 * ---------------------------------------------------------
 * 2. Support a response that is itself a diagram JSON
 *    object/array.
 * ---------------------------------------------------------
 */

const trimmedSource = source.trim();



if(

trimmedSource.startsWith("{") ||

trimmedSource.startsWith("[")

){

try{

const parsed = JSON.parse(trimmedSource);

const beforeCount = orderedDiagrams.length;

const foundCount = collect(parsed);



if(foundCount > 0 && orderedDiagrams.length > beforeCount){

const leadingWhitespaceLength =

source.indexOf(trimmedSource);



cleanedContent =

replaceWithPlaceholders(

cleanedContent,

leadingWhitespaceLength,

leadingWhitespaceLength + trimmedSource.length,

beforeCount,

foundCount

);

}

}catch(error){

/*

 * Continue with inline scanning when the complete
 * response is not valid JSON.
 */

}

}



/*

 * ---------------------------------------------------------
 * 3. Remove standalone json({...}) / {..."diagram"...}
 *    objects that are not fenced.
 * ---------------------------------------------------------
 */

let scanIndex = 0;



while(scanIndex < cleanedContent.length){

const wrapperMatch =

/json\s*\(\s*\{/gi.exec(

cleanedContent.slice(scanIndex)

);



const rawMatch =

/\{\s*"(?:number|questionNumber|questionNo|qNumber|diagram)"\s*:/gi.exec(

cleanedContent.slice(scanIndex)

);



let candidate = null;



if(wrapperMatch){

candidate = {

startIndex:

scanIndex + wrapperMatch.index,

objectStart:

scanIndex +

wrapperMatch.index +

wrapperMatch[0].lastIndexOf("{"),

wrapper:true

};

}



if(rawMatch){

const rawCandidate = {

startIndex:

scanIndex + rawMatch.index,

objectStart:

scanIndex + rawMatch.index,

wrapper:false

};



if(

!candidate ||

rawCandidate.startIndex < candidate.startIndex

){

candidate = rawCandidate;

}

}



if(!candidate){

break;

}



const balanced = readBalancedJsonObject(

cleanedContent,

candidate.objectStart

);



if(!balanced){

break;

}



let endIndex = balanced.endIndex;



if(candidate.wrapper){

while(

endIndex < cleanedContent.length &&

/\s/.test(cleanedContent[endIndex])

){

endIndex += 1;

}



if(cleanedContent[endIndex] === ")"){

endIndex += 1;

}

}



const jsonText = cleanedContent.slice(

candidate.objectStart,

balanced.endIndex

);



try{

const parsed = JSON.parse(jsonText);

const beforeCount = orderedDiagrams.length;

const foundCount = collect(parsed);

const afterCount = orderedDiagrams.length;



if(foundCount > 0 && afterCount > beforeCount){

cleanedContent =

replaceWithPlaceholders(

cleanedContent,

candidate.startIndex,

endIndex,

beforeCount,

foundCount

);



scanIndex =

candidate.startIndex +

Math.max(1, foundCount * 20);

continue;

}

}catch(error){

/*

 * Ignore malformed inline JSON and continue scanning.
 */

}



scanIndex =

Math.max(

candidate.startIndex + 1,

balanced.endIndex

);

}



return {

diagramsByNumber,

unnumberedDiagrams,

orderedDiagrams,

cleanedContent

};

}



function isProgrammingMarkdownTableSeparator(line=""){

    const value =
        String(line || "")
        .trim();

    if(!value.includes("|")){
        return false;
    }

    const cells =
        value
        .replace(/^\|/,"")
        .replace(/\|$/,"")
        .split("|")
        .map(cell =>
            String(cell || "").trim()
        )
        .filter(Boolean);

    if(cells.length < 2){
        return false;
    }

    return cells.every(
        cell =>
            /^[|:\-\s]+$/.test(cell) &&
            /:/.test(cell)
    );

}



function parseProgrammingMarkdownTable(
    lines=[],
    startIndex=0
){

    const headerLine =
        String(
            lines[startIndex] || ""
        ).trim();

    if(!headerLine.includes("|")){
        return null;
    }

    const separatorIndex =
        startIndex + 1;

    if(
        separatorIndex >=
        lines.length
    ){
        return null;
    }

    if(
        !isProgrammingMarkdownTableSeparator(
            lines[separatorIndex]
        )
    ){
        return null;
    }

    const splitCells = line =>
        String(line || "")
        .trim()
        .replace(/^\|/,"")
        .replace(/\|$/,"")
        .split("|")
        .map(
            cell =>
                cleanNoteText(
                    cell.trim()
                )
        )
        .filter(Boolean);

    const headers =
        splitCells(headerLine);

    if(headers.length < 2){
        return null;
    }

    const rows = [];

    let rowIndex =
        separatorIndex + 1;

    while(
        rowIndex <
        lines.length
    ){

        const line =
            String(
                lines[rowIndex] || ""
            ).trim();

        if(
            !line ||
            !line.includes("|")
        ){
            break;
        }

        if(
            isProgrammingMarkdownTableSeparator(
                line
            )
        ){
            rowIndex++;
            continue;
        }

        const cells =
            splitCells(line);

        if(cells.length < 2){
            break;
        }

        rows.push(
            cells.slice(
                0,
                Math.max(
                    2,
                    headers.length
                )
            )
        );

        rowIndex++;
    }

    if(!rows.length){
        return null;
    }

    return {
        endIndex:rowIndex,
        block:{
            type:"table",
            title:"",
            headers:headers.slice(0,4),
            rows:rows.map(
                row =>
                    row.slice(0,4)
            )
        }
    };

}



function extractProgrammingAnswerContent(
    answerText=""
){

    const sourceLines =
        String(answerText || "")
        .split(/\r?\n/)
        .map(
            line =>
                String(line || "")
                .trim()
        )
        .filter(Boolean);

    const answerPoints = [];
    const tableBlocks = [];

    let lineIndex = 0;

    while(
        lineIndex <
        sourceLines.length
    ){

        const table =
            parseProgrammingMarkdownTable(
                sourceLines,
                lineIndex
            );

        if(table){

            tableBlocks.push(
                table.block
            );

            lineIndex =
                table.endIndex;

            continue;
        }

        const value =
            cleanNoteText(
                sourceLines[lineIndex]
            )
            .replace(
                /^\s*(?:[-*•]|\d+[.)])\s+/,
                ""
            )
            .trim();

        if(
            value &&
            !/^[._*=-]+$/.test(value)
        ){
            answerPoints.push(value);
        }

        lineIndex++;
    }

    return {
        answerText:
            answerPoints.join("\n"),
        tableBlocks
    };

}



function splitProgrammingAnswerPoints(
    text=""
){

    return String(text || "")
        .split(/\r?\n/)
        .map(
            line =>
                cleanAnswerKeyText(
                    String(line || "")
                    .replace(
                        /^\s*(?:[-*•]|\d+[.)])\s+/,
                        ""
                    )
                )
                .trim()
        )
        .filter(
            line =>
                line &&
                !/^[._*=-]+$/.test(line)
        );

}




function parseContent(content="", options={}){

const mathDiagramData =
extractMathDiagramData(content);
console.log(
  "NYXORA DIAGRAM DATA:",
  JSON.stringify(mathDiagramData, null, 2)
);

console.log(
  "NYXORA RAW CONTENT:",
  content
);

const sourceContent =

String(

mathDiagramData.cleanedContent || content || ""

)

.replace(

/__NYXORA_DIAGRAM_\d+__/g,

""

);



const lines = sourceContent

.split("\n")

.map(line=>line.trim())

.filter(Boolean);



const sections = [];

const answerSections = [];

const isHindi = /उत्तर कुंजी|बहुविकल्पीय|खंड\s*["']?[कखगघ]/u.test(sourceContent);



let currentSection = {

title:"",

questions:[]

};



let currentAnswerSection = {

title:"",

questions:[]

};



let currentQuestion = null;

let currentAnswerQuestion = null;

let readingAnswerKey = false;

let inCodeBlock = false;
let codeLanguage = "";
let codeLines = [];


const pushCurrentSection = () => {

  if(
    currentSection.questions.length
  ){

    sections.push({

      ...currentSection,

      title:
        currentSection.title ||
        "Questions",

    });

  }

};



const pushCurrentAnswerSection = () => {

if(

currentAnswerSection.title &&

currentAnswerSection.questions.length

){

answerSections.push(currentAnswerSection);

}

};



lines.forEach(rawLine=>{

const clean = cleanText(rawLine);

const fence = clean.match(/^```([a-zA-Z0-9#+-]*)$/);

if (fence) {

    if (!inCodeBlock) {

        inCodeBlock = true;
        codeLanguage = fence[1] || "text";
        codeLines = [];

    } else {

        if (currentQuestion) {

            if (!currentQuestion.blocks) {
                currentQuestion.blocks = [];
            }

            currentQuestion.blocks.push({
                type: "code",
                language: codeLanguage,
                content: codeLines.join("\n")
            });

        }

        inCodeBlock = false;
        codeLanguage = "";
        codeLines = [];

    }

    return;
}

if (inCodeBlock) {
    codeLines.push(rawLine);
    return;
}

if(!clean){

return;

}



if(detectAnswerKey(clean)){

pushCurrentSection();

currentSection = {

title:"",

questions:[]

};



readingAnswerKey = true;

currentQuestion = null;

currentAnswerQuestion = null;



currentAnswerSection = {

title:isHindi

?

"उत्तर कुंजी"

:

"ANSWER KEY",

questions:[]

};



return;

}



if(readingAnswerKey){



if(

/^section\s+[a-d](?:\s*[:：-].*)?$/i.test(clean)

||

/^खंड\s*["']?[कखगघ](?:["']?\s*[:：-].*)?/u.test(clean)

){

pushCurrentAnswerSection();



currentAnswerSection = {

title:clean,

questions:[]

};



currentAnswerQuestion = null;



return;

}



if(
currentAnswerQuestion &&
isLikelyAnswerKeyStepLine(clean)
){

const continuationText = clean
.replace(
/^(?:Q\s*)?\d+[.)]\s*/i,
""
)
.replace(
/^प्र(?:श्न)?\s*\d+[.)]\s*/u,
""
)
.trim();

if(continuationText){
currentAnswerQuestion.text +=
"\n" + continuationText;
}

return;
}

const answerQuestionMatch = clean.match(

/^(?:Q\s*)?(\d+)[.)]/i

);



const hindiAnswerQuestionMatch = clean.match(

/^प्र(?:श्न)?\s*(\d+)[.)]/u

);



if(

answerQuestionMatch ||

hindiAnswerQuestionMatch

){

const number = Number(

(answerQuestionMatch ||

hindiAnswerQuestionMatch)[1]

);



currentAnswerQuestion = {

text:clean

.replace(

/^(?:Q\s*)?\d+[.)]\s*/i,

""

)

.replace(

/^प्र(?:श्न)?\s*\d+[.)]\s*/u,

""

)

.trim(),

options:[],

blocks: [],

number:

number ||

currentAnswerSection.questions.length + 1

};



currentAnswerSection.questions.push(

currentAnswerQuestion

);

return;

}



if(

/^\s*\(?[a-dA-Dकखगघ]\)?[.)]/u.test(clean)

){

if(currentAnswerQuestion){

currentAnswerQuestion.options.push(

clean

.replace(

/^\s*\(?[a-dA-Dकखगघ]\)?[.)]\s*/u,

""

)

.trim()

);

}



return;

}



if(currentAnswerQuestion){

currentAnswerQuestion.text +=

"\n" + clean;

}



return;

}



if(

/^(subject|class|student name|time allowed|maximum marks|marks|विषय|कक्षा|विद्यार्थी|समय|पूर्णांक)\s*[:：]/iu.test(clean)

){

return;

}



const sectionHeading = clean.replace(
    /^#{1,6}\s*/,
    ""
).trim();

if(

/^section\s+(?:[a-d]|\d+)\b/i.test(sectionHeading)

||

/^खंड\s*["']?[कखगघ](?:\s*\d+)?/u.test(sectionHeading)

){

pushCurrentSection();



currentSection = {

title:clean,

questions:[]

};



currentQuestion = null;

return;

}



if(

/^(?:सामान्य निर्देश|निर्देश|General Instructions|General Instruction|Instructions)(?:\s*[:：-])?/iu.test(clean)

){

pushCurrentSection();



currentSection = {

title:"Instructions",

questions:[]

};



currentQuestion = null;

return;

}



if(

currentSection.title === "Instructions"

){

const instructionText = clean

.replace(

/^\s*(?:[-*•]|\d+[.)])\s*/,

""

)

.trim();



if(instructionText){

currentSection.questions.push({

text:instructionText,

options:[],

blocks: [],

number:currentSection.questions.length + 1

});

}



return;

}



const hindiMCQQuestion =

parseHindiMCQQuestionLine(

clean.replace(

/^प्र\s+(\d+)/u,

"प्र$1"

)

);



if(hindiMCQQuestion){

currentQuestion = {

text:String(

hindiMCQQuestion.text || ""

).trim(),

options:Array.isArray(

hindiMCQQuestion.options

)

?

hindiMCQQuestion.options

.filter(Boolean)

.map(option=>

typeof option === "object"

?

String(

option.text || ""

).trim()

:

String(option).trim()

)

.filter(Boolean)

:

[],

number:

Number(

hindiMCQQuestion.number

) ||

currentSection.questions.length + 1,

isHindiMCQ:true

};



currentSection.questions.push(

currentQuestion

);

return;

}



const inlineMCQQuestions =

parseMultipleChoiceLine(clean);



if(

inlineMCQQuestions.length &&

(

isMultipleChoiceSectionTitle(

currentSection.title

)

||

/(?:प्र|प्रश्न)\s*\d+\s*[.)].*\([कखगघ]\)/u.test(clean)

)

){

inlineMCQQuestions.forEach(

question=>{

if(

question &&

String(question.text || "").trim() &&

Array.isArray(question.options) &&

question.options.length >= 2

){

currentSection.questions.push({

text:String(

question.text || ""

).trim(),

options:question.options

.filter(Boolean)

.map(option=>

String(option).trim()

)

.filter(Boolean),

number:

Number(question.number) ||

currentSection.questions.length + 1

});

}

}

);



currentQuestion =

currentSection.questions[

currentSection.questions.length - 1

] || null;



return;

}



const hindiQuestionMatch =

clean.match(

/^प्र(?:श्न)?\s*(\d+)\s*[:.)-]/u

);



const normalQuestionMatch =

clean.match(

/^(?:(?:Question|Q)\s*)?(\d+)\s*[:.)-]/i

);



if(

hindiQuestionMatch ||

normalQuestionMatch

){

const number = Number(

(hindiQuestionMatch ||

normalQuestionMatch)[1]

);



currentQuestion = {

text:clean

.replace(

/^प्र(?:श्न)?\s*\d+\s*[:.)-]\s*/u,

""

)

.replace(

/^(?:(?:Question|Q)\s*)?\d+\s*[:.)-]\s*/i,

""

)

.trim(),

options:[],

blocks: [],

number:

number ||

currentSection.questions.length + 1

};



currentSection.questions.push(

currentQuestion

);

return;

}



if(

/^\s*(?:\([a-dA-Dकखगघ]\)|[a-dA-Dकखगघ][.)])\s*/u.test(clean)

){

if(currentQuestion){

currentQuestion.options.push(

clean

.replace(

/^\s*(?:\([a-dA-Dकखगघ]\)|[a-dA-Dकखगघ][.)])\s*/u,

""

)

.trim()

);



if(

/^\s*\([कखगघ]\)/u.test(clean)

){

currentQuestion.isHindiMCQ = true;

}

}



return;

}



if(

currentSection.title === "Instructions"

){

if(

/^\d+[.)]/.test(clean)

){

currentSection.questions.push({

text:clean.replace(

/^\d+[.)]\s*/,

""

),

options:[],

blocks: [],

number:

currentSection.questions.length + 1

});



return;

}

}



if (currentQuestion) {

    // Don't append fenced code lines to question text.
    if (!inCodeBlock && clean) {

        currentQuestion.text +=
            (currentQuestion.text ? "\n" : "") +
            clean;

    }

}

});



pushCurrentSection();

pushCurrentAnswerSection();

console.log(
    "NYXORA PARSE RESULT:",
    {
        sections: sections.map(section => ({
            title: section?.title || "",
            questionCount: Array.isArray(section?.questions)
                ? section.questions.length
                : 0
        })),
        answerSections: answerSections.map(section => ({
            title: section?.title || "",
            questionCount: Array.isArray(section?.questions)
                ? section.questions.length
                : 0
        }))
    }
);

if(
    options.isProgrammingTest === true
){

    sections.forEach(section=>{

        (section.questions || [])
        .forEach(question=>{

            const rawQuestionText =
                String(
                    question?.text || ""
                );

            const answerMatch =
                rawQuestionText.match(
                    /(?:^|\n)\s*(?:answer|solution)\s*:\s*/i
                );

            if(!answerMatch){
                return;
            }

            const questionText =
                rawQuestionText
                .slice(
                    0,
                    answerMatch.index
                )
                .trim();

            const rawAnswerText =
                rawQuestionText
                .slice(
                    answerMatch.index +
                    answerMatch[0].length
                )
                .trim();

            const parsedAnswer =
                extractProgrammingAnswerContent(
                    rawAnswerText
                );

            const existingBlocks =
                Array.isArray(
                    question.blocks
                )
                ?
                question.blocks
                :
                [];

            question.text =
                questionText;

            question.answerText =
                parsedAnswer.answerText;

            question.blocks = [
                ...existingBlocks,
                ...parsedAnswer.tableBlocks
            ];

            question.isProgrammingTest =
                true;

        });

    });

}


sections.forEach(section=>{

(section.questions || []).forEach(question=>{

const questionNumber = Number(
question.number
);



if(
Number.isFinite(questionNumber) &&
mathDiagramData.diagramsByNumber[questionNumber]
){

question.diagram =
mathDiagramData.diagramsByNumber[questionNumber];

}

});

});

return {

sections,

answerSections,

diagramData:mathDiagramData

};

}



export default function NyxoraPDF({



data = {}



}){



const parsed = parseContent(

data.content || "",

{

isProgrammingTest:

/test/i.test(

String(

data.type || ""

)

) &&

/```/.test(

String(

data.content || ""

)

)

}

);



const sections = parsed.sections;



const answerSections = parsed.answerSections;



const instructionSection = sections.find(

item=>item.title==="Instructions"

);



const questionSections = sections.filter(

item =>

item &&

typeof item === "object" &&

item.title !== "Instructions" &&

Array.isArray(item.questions) &&

item.questions.length > 0

);



const hasAnswer = answerSections.length > 0;



const isHindi =

/उत्तर कुंजी|बहुविकल्पीय|खंड\s*["']?[कखगघ]|प्र(?:श्न)?\s*\d+/iu.test(

data.content || ""

);



const isNotes =

/notes|नोट्स/iu.test(

String(data.type || "")

);


const parsedNoteBlocks = isNotes

    ?

    parseNotes(

        parsed.diagramData?.cleanedContent || data.content || "",

        parsed.diagramData?.orderedDiagrams || []

    )

    :

    [];

    const quickRevisionRows = [];

parsedNoteBlocks.forEach(block => {

    if(
        quickRevisionRows.length >= 6
    ){
        return;
    }


    if(
        block?.type === "heading"
    ){

        const heading =
            String(
                block.text || ""
            ).trim();


        if(heading){

            quickRevisionRows.push([

                heading,

                "Important concept to revise"

            ]);

        }

    }


    if(
        block?.type === "bullets" &&
        Array.isArray(block.items)
    ){

        block.items.forEach(item => {

            if(
                quickRevisionRows.length >= 6
            ){
                return;
            }


            const point =
                String(
                    item || ""
                ).trim();


            if(point){

                quickRevisionRows.push([

                    point,

                    "Key point"

                ]);

            }

        });

    }

});


if(
    quickRevisionRows.length === 0
){

    quickRevisionRows.push([

        "Key Concepts",

        "Review the important points from the notes"

    ]);

}


const quickRevisionTable = isNotes
    ? {

        type:"table",

        title:"Quick Revision",

        headers:[
            "Topic / Point",
            "Quick Revision"
        ],

        rows:quickRevisionRows

    }

    :

    null;

function normalizeImageMatchText(
    value = ""
) {

    return String(value || "")
        .toLowerCase()
        .replace(/\*\*/g, "")
        .replace(/^#{1,6}\s*/u, "")
        .replace(/^\d+[.)]\s*/u, "")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

}


function getHeadingMatchScore(
    heading,
    topic
) {

    const h =
        normalizeImageMatchText(
            heading
        );

    const t =
        normalizeImageMatchText(
            topic
        );

    if (
        !h ||
        !t
    ) {

        return 0;

    }


    if (
        h === t
    ) {

        return 100;

    }


    if (
        h.includes(t) ||
        t.includes(h)
    ) {

        return 80;

    }


    const headingWords =
        new Set(
            h.split(" ")
        );


    const topicWords =
        t.split(" ");


    const matchedWords =
        topicWords.filter(
            word =>
                word.length > 2 &&
                headingWords.has(
                    word
                )
        );


    return (
        matchedWords.length * 10
    );

}


function findBestImageInsertionIndex(
    blocks = [],
    imageTopic = ""
) {

    let bestIndex = -1;

    let bestScore = 0;


    blocks.forEach(
        (
            block,
            index
        ) => {

            if (
                block?.type !== "heading" &&
                block?.type !== "subheading"
            ) {

                return;

            }


            const score =
                getHeadingMatchScore(
                    block.text,
                    imageTopic
                );


            if (
                score > bestScore
            ) {

                bestScore =
                    score;

                bestIndex =
                    index;

            }

        }
    );


    return bestIndex;

}

const notesImageBlocks =
    Array.isArray(
        data?.notesImages
    )
        ? data.notesImages
            .filter(
                image =>
                    Boolean(
                        image?.imageUrl
                    )
            )
            .map(
                (
                    image,
                    imageIndex
                ) => ({

                    type:
                        "image",

                    imageUrl:
                        image.imageUrl,

                    alt:
                        image.alt ||
                        image.topic ||
                        "Notes image",

                    topic:
                        image.topic ||
                        "",

                    photographer:
                        image.photographer ||
                        "",

                    photographerUrl:
                        image.photographerUrl ||
                        "",

                    photoUrl:
                        image.photoUrl ||
                        "",

                    pexelsUrl:
                        image.pexelsUrl ||
                        "https://www.pexels.com/",

                    source:
                        image.source ||
                        "pexels",

                    imageIndex

                })
            )
        : [];


let noteBlocks =
    isNotes
        ? [
            ...parsedNoteBlocks
        ]
        : [];


if (
    isNotes &&
    notesImageBlocks.length > 0
) {

    const matchedImages = [];


    notesImageBlocks.forEach(
        (
            imageBlock
        ) => {

            const imageIndex =
                findBestImageInsertionIndex(
                    noteBlocks,
                    imageBlock.topic
                );


            matchedImages.push({

                imageBlock,

                imageIndex

            });

        }
    );


    matchedImages
        .sort(
            (
                a,
                b
            ) =>
                b.imageIndex -
                a.imageIndex
        )
        .forEach(
            (
                item
            ) => {

                if (
                    item.imageIndex >= 0
                ) {

                    noteBlocks.splice(
                        item.imageIndex + 1,
                        0,
                        item.imageBlock
                    );

                }
                else {

                    noteBlocks.push(
                        item.imageBlock
                    );

                }

            }
        );

}


if (
    isNotes &&
    quickRevisionTable
) {

    noteBlocks.push(
        quickRevisionTable
    );

}

const noteChapterHeading =

isNotes

?

(() => {

const rawNotesContent =

String(data.content || "");



const mainTopicMatch =

rawNotesContent.match(

/(?:^|\n|\r)\s*(?:यहाँ\s*)?(?:\*\*\s*)?(.+?)(?:\s*\*\*)?\s+अध्याय\s+के\s+विस्तृत\s+और\s+सरल\s+नोट्स\s+दिए\s+गए\s+हैं\s*:?/iu

);



if(mainTopicMatch && mainTopicMatch[1]){

const extractedTopic =

cleanNoteText(

mainTopicMatch[1]

)

.replace(

/^यहाँ\s*/iu,

""

)

.trim();



if(extractedTopic){

return extractedTopic;

}

}



return

noteBlocks.find(

block =>

block &&

block.type === "heading" &&

String(block.text || "").trim()

)?.text || "";

})()

:

"";

const mandatoryFlowchartSteps = [];

const flowPointSeen = new Set();

const addMainFlowPoint = value => {

    const text =
        String(value || "")
            .replace(/\*\*/g,"")
            .replace(/^[-*•]\s*/u,"")
            .replace(/^\d+[.)]\s*/u,"")
            .replace(/\s+/g," ")
            .trim();

    if(!text){
        return;
    }

    const colonMatch =
        text.match(
            /^([^:：]{2,60})\s*[:：]/
        );

    const sentenceMatch =
        text.match(
            /^(.{3,120}?[.!?])(?:\s|$)/u
        );

    let point =
        (
            colonMatch
                ? colonMatch[1]
                : sentenceMatch
                    ? sentenceMatch[1]
                    : text
        )
            .trim();

    if(point.length > 52){

        const clauseMatch =
            point.match(
                /^(.{3,52}?)(?:,|;|\s+-\s+|\s+—\s+)/u
            );

        if(clauseMatch){

            point =
                clauseMatch[1]
                    .trim();

        }

    }

    const normalized =
        point.toLowerCase();

    if(
        !point ||
        flowPointSeen.has(normalized) ||
        normalized ===
            String(noteChapterHeading || "")
                .trim()
                .toLowerCase()
    ){
        return;
    }

    flowPointSeen.add(normalized);

    mandatoryFlowchartSteps.push(
        point
    );

};


/*
 * 1. Highest priority:
 * If the AI response contains a Mermaid / ASCII / diagram block,
 * use its actual node labels for the existing Nyxora flowchart.
 */
const rawFlowchartSource =
    String(
        data.content ||
        parsed.diagramData?.cleanedContent ||
        ""
    );

const diagramFlowSteps =
    extractFlowchartDiagramSteps(
        rawFlowchartSource
    );

diagramFlowSteps.forEach(
    addMainFlowPoint
);


/*
 * 2. Otherwise use real headings/subheadings.
 */
if(
    mandatoryFlowchartSteps.length === 0
){

    parsedNoteBlocks.forEach(block => {

        if(
            mandatoryFlowchartSteps.length >= 6
        ){
            return;
        }

        if(
            (
                block?.type === "heading" ||
                block?.type === "subheading"
            ) &&
            block.text
        ){

            addMainFlowPoint(
                block.text
            );

        }

    });

}


/*
 * 3. If there are fewer than three main points,
 * use only the first meaningful point from each bullet group.
 */
if(
    mandatoryFlowchartSteps.length < 3
){

    parsedNoteBlocks.forEach(block => {

        if(
            mandatoryFlowchartSteps.length >= 6
        ){
            return;
        }

        if(
            block?.type === "bullets" &&
            Array.isArray(block.items)
        ){

            const firstMeaningful =
                block.items.find(
                    item =>
                        String(item || "").trim()
                );

            if(firstMeaningful){

                addMainFlowPoint(
                    firstMeaningful
                );

            }

        }

    });

}


/*
 * 4. Last-resort raw content fallback.
 */
if(
    mandatoryFlowchartSteps.length === 0
){

    rawFlowchartSource
        .split(/\r?\n/)
        .map(line =>
            line
                .replace(/^#{1,6}\s*/u,"")
                .replace(/^[-*•]\s*/u,"")
                .replace(/^\d+[.)]\s*/u,"")
                .replace(/\*\*/g,"")
                .trim()
        )
        .filter(Boolean)
        .forEach(line => {

            if(
                mandatoryFlowchartSteps.length >= 6
            ){
                return;
            }

            addMainFlowPoint(
                line
            );

        });

}


if(
    mandatoryFlowchartSteps.length === 0
){

    addMainFlowPoint(
        noteChapterHeading ||
        data.title ||
        "Main Topic"
    );

}

const finalNoteBlocks = noteBlocks;





const metadataClass =

data.className ||

data.class ||

data.classLabel ||

"";



const metadataSource =

String(data.content || "");



const contentClassMatch =

metadataSource.match(

/(?:^|\n)\s*(?:#+\s*)?(?:Class\s*|कक्षा\s*)([0-9]+(?:\s*[A-Za-z])?)/iu

);



const metadataFromTitle =

String(data.title || "").match(

/(?:Class\s*|कक्षा\s*)([0-9]+(?:\s*[A-Za-z])?)/i

)

||

contentClassMatch;



const contentTitleMatch =

metadataSource.match(

/(?:^|\n)\s*(?:#+\s*)?(?:Class\s*\d+|कक्षा\s*\d+)\s+([^\n]+)/iu

);



const contentSubjectMatch =

metadataSource.match(

/(?:^|\n)\s*(?:#+\s*)?(?:Subject|विषय)\s*[:：-]\s*([^\n]+)/iu

);



const contentChapterMatch =

metadataSource.match(

/(?:^|\n)\s*(?:#+\s*)?(?:Chapter|अध्याय)\s*[:：-]\s*([^\n]+)/iu

);



const normalizedMetadata = {

...data,

subject:

isNotes &&

/^Hindi$/iu.test(

String(

data.subject ||

data.subjectName ||

""

).trim()

)

?

"हिंदी"

:

data.subject ||

data.subjectName ||

(

contentSubjectMatch

?

contentSubjectMatch[1].trim()

:

""

) ||

(

contentTitleMatch

?

contentTitleMatch[1].split(/[—|]/)[0].trim()

:

""

) ||

(

String(data.title || "").match(

/^(?:Class\s*\d+|कक्षा\s*\d+)\s+([^—|]+)/i

)

?

String(data.title || "").match(

/^(?:Class\s*\d+|कक्षा\s*\d+)\s+([^—|]+)/i

)[1].trim()

:

""

),



chapter:

isNotes &&
noteChapterHeading

?

noteChapterHeading

:

data.chapter ||
data.topic ||
data.chapterName ||

(

contentChapterMatch

?

contentChapterMatch[1].trim()

:

""

) ||

(

contentTitleMatch &&

/(?:अध्याय|Chapter)\s*[:：-]/i.test(

contentTitleMatch[1]

)

?

contentTitleMatch[1]

.split(

/(?:अध्याय|Chapter)\s*[:：-]/i

)[1].trim()

:

""

) ||

(

String(data.title || "").match(

/(?:Chapter\s*[:\/-]?\s*|अध्याय\s*[:\/-]?\s*)([^—|]+)/i

)

?

String(data.title || "").match(

/(?:Chapter\s*[:\/-]?\s*|अध्याय\s*[:\/-]?\s*)([^—|]+)/i

)[1].trim()

:

""

),



type:

isNotes

?

/[\u0900-\u097F]/u.test(
String(data.content || "")
)

?

"नोट्स"

:

"Notes"

:

data.type ||

data.documentType ||

"",

className:

isNotes &&

metadataClass

?

(

/^Class\s*\d+(?:\s*[A-Za-z])?$/iu.test(

String(metadataClass).trim()

)

?

"कक्षा " +

String(metadataClass)

.trim()

.replace(

/^Class\s*/i,

""

)

:

/^\d+(?:\s*[A-Za-z])?$/u.test(

String(metadataClass).trim()

)

?

"कक्षा " +

String(metadataClass).trim()

:

metadataClass

)

:

metadataClass ||

(

metadataFromTitle

?

(

/कक्षा/.test(

String(data.title || "")

)

?

"कक्षा " +

metadataFromTitle[1].trim()

:

"Class " +

metadataFromTitle[1].trim()

)

:

""

)

};



if(isNotes){

return(

<Document>

<Page

size="A4"

wrap={true}

style={{

paddingTop:40,

paddingBottom:40,

paddingLeft:40,

paddingRight:40,

backgroundColor:"#FFFFFF"

}}

>

<PDFHeader

title=""

/>



<NyxoraPDFTitle
title={
formatPdfTitle(
data.title || "Nyxora Document"
)
}
/>

<NyxoraDocumentDetails
data={normalizedMetadata}
/>



{

(() => {

    const firstHeadingIndex =
        finalNoteBlocks.findIndex(
            block =>
                block &&
                block.type === "heading"
        );

    if(
        firstHeadingIndex >= 0
    ){

        return (

            <>

                <NotesContent
                    blocks={
                        finalNoteBlocks.slice(
                            0,
                            firstHeadingIndex + 1
                        )
                    }
                />

                <NotesFlowchart
                    title={
                        noteChapterHeading ||
                        data.title ||
                        "Flow Chart"
                    }
                    steps={
                        mandatoryFlowchartSteps
                    }
                    content={
                        parsed.diagramData?.cleanedContent ||
                        data.content ||
                        ""
                    }
                />

                <NotesContent
                    blocks={
                        finalNoteBlocks.slice(
                            firstHeadingIndex + 1
                        )
                    }
                />

            </>

        );

    }

    return (

        <>

            <NotesContent
                blocks={finalNoteBlocks}
            />

            <NotesFlowchart
                title={
                    noteChapterHeading ||
                    data.title ||
                    "Flow Chart"
                }
                steps={
                    mandatoryFlowchartSteps
                }
                content={
                    parsed.diagramData?.cleanedContent ||
                    data.content ||
                    ""
                }
            />

        </>

    );

})()

}

</Page>

</Document>

);

}



return(

<Document>

<Page

size="A4"

style={{

paddingTop:40,

paddingBottom:40,

paddingLeft:40,

paddingRight:40,

backgroundColor:"#FFFFFF"

}}

>

<PDFHeader

title=""

/>



<NyxoraPDFTitle
title={
formatPdfTitle(
data.title || "Nyxora Document"
)
}
/>

<NyxoraDocumentDetails
data={normalizedMetadata}
/>



{

instructionSection &&

<PDFSection

section={instructionSection}

/>

}



</Page>



<Page

size="A4"

wrap={true}

style={{

paddingTop:40,

paddingBottom:40,

paddingLeft:40,

paddingRight:40,

backgroundColor:"#FFFFFF"

}}

>



{

questionSections.map(

(section,index)=>

section &&

Array.isArray(section.questions)

?

(

(

/बहुविकल्पीय/.test(

String(section.title || "")

)

||

isHindiMCQSection(

section,

isHindi

)

)

?

(

<HindiMCQSection

key={

"hindi-mcq-section-"+index

}

section={section}

sourceContent={

data.content || ""

}

/>

)

:

(

<PDFSection

key={

"pdf-section-"+index

}

section={section}

/>

)

)

:

null

)

}



{

hasAnswer && (

<>

<AnswerKeyBadge

title={

isHindi

?

"उत्तर कुंजी"

:

"ANSWER KEY"

}

/>



{

answerSections

.filter(

section =>

section &&

Array.isArray(section.questions) &&

section.questions.length > 0

)

.map(

(section,sectionIndex)=>(

<View

key={"answer-section-"+sectionIndex}

style={{

width:"100%",

marginTop:2,

marginBottom:8

}}

>

{

section.title &&

section.title !== "ANSWER KEY" &&

section.title !== "उत्तर कुंजी" &&

<AnswerKeySectionBubble

title={section.title}

/>

}



{

section.questions

.filter(Boolean)

.map(

(question,questionIndex)=>(

<AnswerKeyQuestion

key={

"answer-question-"+

sectionIndex+

"-"+

questionIndex+

"-"+

String(question?.number || questionIndex + 1)

}

number={

Number(question?.number) ||

questionIndex + 1

}

question={question}

index={questionIndex}

/>

)

)

}

</View>

)

)

}



</>

)

}



</Page>



</Document>

);

}