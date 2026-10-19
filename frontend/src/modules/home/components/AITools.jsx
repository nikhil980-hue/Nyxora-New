import {
  Bot,
  FileText,
  FileDown,
  ClipboardList,
  Presentation,
  FileSpreadsheet,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

import NyxoraOrbitLogo
  from "../../../components/common/NyxoraOrbitLogo";

import {
  useNavigate,
} from "react-router-dom";


export default function AITools() {

  const navigate =
    useNavigate();


  const tools = [

    {
      title: "AI Chat",
      description: "Ask, learn and create",
      icon: Bot,
      path: "/chat",
      accent: "fuchsia",
    },

    {
      title: "Image Studio",
      description: "Generate and refine AI images",
      icon: Sparkles,
      path: "/image-studio",
      accent: "fuchsia",
    },

    {
      title: "Notes Generator",
      description: "Create structured notes",
      icon: FileText,
      path: "/notes",
      accent: "purple",
    },

    {
      title: "PDF Generator",
      description: "Build polished documents",
      icon: FileDown,
      path: "/pdf",
      accent: "violet",
    },

    {
      title: "Test Generator",
      description: "Generate smart assessments",
      icon: ClipboardList,
      path: "/chat",
      state: {
  createNewChat: true,
  assistantMode: "test",
},
      accent: "indigo",
    },
    
    {
      title: "Presentation",
      description: "Design AI presentations",
      icon: Presentation,
      path: "/presentation",
      accent: "blue",
    },

    {
      title: "Spreadsheet",
      description: "Organize structured data",
      icon: FileSpreadsheet,
      path: "/workspace",
      accent: "cyan",
    },

  ];


  return (

    <div>


      {/* ==================================================
          SECTION HEADER
      ================================================== */}

      <div
        className="
          mb-5
          flex
          items-end
          justify-between
          gap-4
        "
      >


        <div>


          <div
            className="
              mb-2
              flex
              items-center
              gap-2
            "
          >

            <div
  className="
    flex
    h-8
    w-8
    shrink-0
    items-center
    justify-center
  "
>
  <NyxoraOrbitLogo
    size={30}
    animated={true}
  />
</div>


            <span
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-slate-500
              "
            >

              Powered by Nyxora

            </span>

          </div>


          <h2
            className="
              text-2xl
              font-bold
              tracking-tight
              text-white
            "
          >

            AI Tools

          </h2>


          <p
            className="
              mt-1
              text-sm
              text-slate-500
            "
          >

            Everything you need to learn, create and work with AI.

          </p>


        </div>


        {/* BRAND LINE */}

        <div
          className="
            mb-2
            hidden
            items-center
            gap-3
            sm:flex
          "
        >

          <div
            className="
              h-px
              w-24
              bg-gradient-to-r
              from-fuchsia-500/50
              via-violet-500/45
              to-cyan-400/40
            "
          />


          <div
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-cyan-400
              shadow-[0_0_8px_rgba(34,211,238,.75)]
            "
          />

        </div>


      </div>



      {/* ==================================================
          AI TOOL GRID
      ================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          md:grid-cols-3
          xl:grid-cols-6
        "
      >


        {tools.map(
          (tool, index) => {


            const Icon =
              tool.icon;


            const styles =
              getToolStyles(
                tool.accent
              );


            return (

              <button

                key={
                  tool.title
                }

                type="button"

onClick={() =>
  navigate(
    tool.path,
    tool.state
      ? {
          state:
            tool.state,
        }
      : undefined
  )
}

                className="
                  group
                  nyxora-card
                  nyxora-card-hover
                  relative
                  min-h-[205px]
                  overflow-hidden
                  p-5
                  text-left
                "

              >


                {/* ==========================================
                    AMBIENT TOOL GLOW
                ========================================== */}

                <div
                  className={`
                    pointer-events-none
                    absolute
                    -right-16
                    -top-16
                    h-40
                    w-40
                    rounded-full
                    blur-[70px]
                    transition-all
                    duration-500
                    group-hover:scale-125
                    ${styles.glow}
                  `}
                />



                {/* ==========================================
                    TOP COLOR ACCENT
                ========================================== */}

                <div
                  className={`
                    absolute
                    left-5
                    right-5
                    top-0
                    h-px
                    bg-gradient-to-r
                    from-transparent
                    via-current
                    to-transparent
                    opacity-45
                    ${styles.text}
                  `}
                />



                {/* ==========================================
                    TOOL NUMBER
                ========================================== */}

                <div
                  className="
                    absolute
                    right-4
                    top-4
                    text-[9px]
                    font-semibold
                    tracking-[0.18em]
                    text-slate-700
                  "
                >

                  0{index + 1}

                </div>



                {/* ==========================================
                    ICON
                ========================================== */}

                <div
                  className={`
                    relative
                    z-10
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-xl
                    border
                    transition-all
                    duration-300
                    group-hover:scale-105
                    ${styles.icon}
                  `}
                >

                  <Icon
                    size={22}
                  />

                </div>



                {/* ==========================================
                    TOOL CONTENT
                ========================================== */}

                <div
                  className="
                    relative
                    z-10
                    mt-5
                  "
                >


                  <h3
                    className="
                      text-sm
                      font-semibold
                      text-white
                    "
                  >

                    {tool.title}

                  </h3>


                  <p
                    className="
                      mt-2
                      text-xs
                      leading-5
                      text-slate-600
                      transition-colors
                      duration-300
                      group-hover:text-slate-400
                    "
                  >

                    {tool.description}

                  </p>


                </div>



                {/* ==========================================
                    OPEN TOOL INDICATOR
                ========================================== */}

                <div
                  className="
                    absolute
                    bottom-4
                    right-4
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-white/[0.05]
                    bg-white/[0.02]
                    text-slate-700
                    opacity-0
                    transition-all
                    duration-300
                    group-hover:translate-x-0
                    group-hover:opacity-100
                    group-hover:text-white
                  "
                >

                  <ArrowUpRight
                    size={13}
                    className="
                      transition-transform
                      duration-300
                      group-hover:translate-x-[1px]
                      group-hover:-translate-y-[1px]
                    "
                  />

                </div>



                {/* ==========================================
                    BOTTOM COLOR LINE
                ========================================== */}

                <div
                  className="
                    absolute
                    bottom-0
                    left-0
                    right-0
                    h-[2px]
                    overflow-hidden
                    opacity-0
                    transition-opacity
                    duration-300
                    group-hover:opacity-100
                  "
                >

                  <div
                    className={`
                      h-full
                      w-full
                      bg-gradient-to-r
                      ${styles.line}
                    `}
                  />

                </div>


              </button>

            );


          }
        )}


      </div>


    </div>

  );

}



/* =========================================================
   NYXORA AI TOOL PALETTE
========================================================= */

function getToolStyles(
  accent
) {


  switch (accent) {


    case "fuchsia":

      return {

        icon:
          "border-fuchsia-400/15 bg-fuchsia-500/[0.09] text-fuchsia-300 shadow-[0_0_22px_rgba(217,70,239,.07)]",

        glow:
          "bg-fuchsia-500/[0.10]",

        text:
          "text-fuchsia-400",

        line:
          "from-fuchsia-500 via-purple-500 to-transparent",

      };


    case "purple":

      return {

        icon:
          "border-purple-400/15 bg-purple-500/[0.09] text-purple-300 shadow-[0_0_22px_rgba(168,85,247,.07)]",

        glow:
          "bg-purple-500/[0.10]",

        text:
          "text-purple-400",

        line:
          "from-purple-500 via-violet-500 to-transparent",

      };


    case "violet":

      return {

        icon:
          "border-violet-400/15 bg-violet-500/[0.09] text-violet-300 shadow-[0_0_22px_rgba(124,58,237,.07)]",

        glow:
          "bg-violet-500/[0.10]",

        text:
          "text-violet-400",

        line:
          "from-violet-500 via-indigo-500 to-transparent",

      };


    case "indigo":

      return {

        icon:
          "border-indigo-400/15 bg-indigo-500/[0.09] text-indigo-300 shadow-[0_0_22px_rgba(79,70,229,.07)]",

        glow:
          "bg-indigo-500/[0.10]",

        text:
          "text-indigo-400",

        line:
          "from-indigo-500 via-blue-500 to-transparent",

      };


    case "blue":

      return {

        icon:
          "border-blue-400/15 bg-blue-500/[0.09] text-blue-300 shadow-[0_0_22px_rgba(59,130,246,.07)]",

        glow:
          "bg-blue-500/[0.10]",

        text:
          "text-blue-400",

        line:
          "from-blue-500 via-cyan-500 to-transparent",

      };


    case "cyan":

      return {

        icon:
          "border-cyan-400/15 bg-cyan-500/[0.09] text-cyan-300 shadow-[0_0_22px_rgba(34,211,238,.07)]",

        glow:
          "bg-cyan-500/[0.10]",

        text:
          "text-cyan-400",

        line:
          "from-cyan-400 via-blue-500 to-transparent",

      };


    default:

      return {

        icon:
          "border-violet-400/15 bg-violet-500/[0.09] text-violet-300",

        glow:
          "bg-violet-500/[0.10]",

        text:
          "text-violet-400",

        line:
          "from-violet-500 via-blue-500 to-transparent",

      };


  }


}