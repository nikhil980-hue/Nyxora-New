import {
  Sparkles,
  WandSparkles,
} from "lucide-react";


import {
  useState,
} from "react";


// ======================================================
// PROMPT PRESETS
// ======================================================

const promptPresets = {

  Academic:
    "Create a detailed academic presentation. Include definitions, diagrams, examples, important concepts and a conclusion slide.",

  Professional:
    "Create a professional business-style presentation with clean structure, modern visuals, real-world examples and key insights.",

  Startup:
    "Create a startup pitch style presentation with problem, solution, market impact, innovation and future scope.",

  Visual:
    "Create a highly visual presentation with minimal text, diagrams, infographics and modern AI-style designs.",

};


// ======================================================
// PRESENTATION FORM
// ======================================================

export default function PresentationForm({

  onGenerate,

  loading,

}) {


  const [
    topic,
    setTopic,
  ] = useState("");


  const [
    subject,
    setSubject,
  ] = useState("");


  const [
    className,
    setClassName,
  ] = useState("");


  const [
    slideCount,
    setSlideCount,
  ] = useState(10);


  const [
    customPrompt,
    setCustomPrompt,
  ] = useState("");


  const [
    presentationMode,
    setPresentationMode,
  ] = useState("concise");


  // ====================================================
  // GENERATE
  // ====================================================

  function handleSubmit(e) {

    e.preventDefault();


    onGenerate({

      topic,

      subject,

      className,

      slideCount,

      customPrompt,

      presentationMode,

    });

  }


  // ====================================================
  // UI
  // ====================================================

  return (

    <form

      onSubmit={
        handleSubmit
      }

      className="
        relative
        overflow-hidden
        rounded-2xl
        border
        border-violet-400/20
        bg-gradient-to-br
        from-fuchsia-950/10
        via-[#0B1020]/95
        to-cyan-950/10
        p-6
        shadow-[0_12px_40px_rgba(0,0,0,0.18)]
      "

    >

      {/* ===============================================
          AMBIENT GLOW
      ================================================ */}

      <div
        className="
          pointer-events-none
          absolute
          -left-20
          -top-20
          h-40
          w-40
          rounded-full
          bg-fuchsia-500/[0.05]
          blur-3xl
        "
      />


      <div
        className="
          pointer-events-none
          absolute
          -bottom-20
          right-0
          h-40
          w-40
          rounded-full
          bg-cyan-400/[0.05]
          blur-3xl
        "
      />


      {/* ===============================================
          TOP ACCENT
      ================================================ */}

      <div
        className="
          pointer-events-none
          absolute
          left-0
          right-0
          top-0
          h-[2px]
          bg-gradient-to-r
          from-fuchsia-500
          via-violet-500
          to-cyan-400
        "
      />


      <div
        className="
          relative
          z-10
        "
      >

        {/* =============================================
            TITLE
        ============================================== */}

        <div
          className="
            mb-6
            flex
            items-center
            gap-3
          "
        >

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-violet-400/20
              bg-gradient-to-br
              from-fuchsia-500/15
              via-violet-500/15
              to-cyan-400/10
            "
          >

            <Sparkles
              size={18}
              className="
                text-violet-200
              "
            />

          </div>


          <div>

            <h2
              className="
                text-xl
                font-semibold
                text-white
              "
            >
              Presentation Details
            </h2>


            <p
              className="
                mt-0.5
                text-xs
                text-slate-500
              "
            >
              Configure your AI-generated presentation
            </p>

          </div>

        </div>


        {/* =============================================
            TOPIC
        ============================================== */}

        <Input

          label="Topic"

          value={
            topic
          }

          setValue={
            setTopic
          }

          placeholder="Example: Photosynthesis"

        />


        {/* =============================================
            SUBJECT
        ============================================== */}

        <Input

          label="Subject"

          value={
            subject
          }

          setValue={
            setSubject
          }

          placeholder="Example: Science"

        />


        {/* =============================================
            CLASS
        ============================================== */}

        <Input

          label="Class"

          value={
            className
          }

          setValue={
            setClassName
          }

          placeholder="Example: Class 8"

        />


        {/* =============================================
            NUMBER OF SLIDES
        ============================================== */}

        <div
          className="
            mb-5
          "
        >

          <label
            className="
              mb-2
              block
              text-sm
              font-medium
              text-slate-400
            "
          >
            Number of Slides
          </label>


          <div
            className="
              relative
            "
          >

            <select

              value={
                slideCount
              }

              onChange={(e) =>

                setSlideCount(

                  Number(
                    e.target.value
                  )

                )

              }

              className="
                w-full
                appearance-none
                rounded-xl
                border
                border-violet-400/15
                bg-[#0A0F1E]
                px-4
                py-3
                text-sm
                text-white
                outline-none
                transition-all
                duration-200
                hover:border-violet-400/25
                focus:border-violet-400/50
                focus:ring-2
                focus:ring-violet-500/10
              "

            >

              <option value={5}>
                5 Slides
              </option>


              <option value={10}>
                10 Slides
              </option>


              <option value={15}>
                15 Slides
              </option>


              <option value={20}>
                20 Slides
              </option>

            </select>


            <div
              className="
                pointer-events-none
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                text-xs
                text-violet-300
              "
            >
              ▼
            </div>

          </div>

        </div>


        {/* =============================================
            AI DESIGN INSTRUCTIONS
        ============================================== */}

        <div

          className="
            relative
            mt-6
            overflow-hidden
            rounded-2xl
            border
            border-violet-400/15
            bg-gradient-to-br
            from-fuchsia-950/10
            via-white/[0.025]
            to-cyan-950/10
            p-5
          "

        >

          {/* GLOW */}

          <div
            className="
              pointer-events-none
              absolute
              -right-16
              -top-16
              h-32
              w-32
              rounded-full
              bg-violet-500/[0.07]
              blur-3xl
            "
          />


          {/* HEADER */}

          <div

            className="
              relative
              z-10
              mb-4
              flex
              items-center
              gap-3
            "

          >

            <div

              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                border
                border-violet-400/20
                bg-gradient-to-br
                from-fuchsia-500/15
                via-violet-500/20
                to-cyan-400/10
              "

            >

              <WandSparkles

                size={19}

                className="
                  text-violet-200
                "

              />

            </div>


            <div>

              <h3
                className="
                  font-semibold
                  text-white
                "
              >
                AI Design Instructions
              </h3>


              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-500
                "
              >
                Guide Nyxora AI for better results
              </p>

            </div>

          </div>


          {/* ===========================================
              PRESENTATION MODE
          ============================================ */}

          <div
            className="
              relative
              z-10
              mb-4
            "
          >

            <div
              className="
                mb-2
                flex
                items-center
                justify-between
                gap-3
              "
            >

              <span
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-slate-400
                "
              >
                Presentation Mode
              </span>


              <span
                className="
                  text-[11px]
                  text-slate-600
                "
              >
                Choose content depth
              </span>

            </div>


            <div
              className="
                grid
                grid-cols-2
                gap-2
                rounded-xl
                border
                border-violet-400/15
                bg-[#080D19]/70
                p-1
              "
            >

              <button
                type="button"
                onClick={() =>
                  setPresentationMode(
                    "concise"
                  )
                }
className={`
  flex-1
  rounded-lg
  border
  px-4
  py-2.5
  text-sm
  font-medium
  transition-all
  duration-200

  ${
    presentationMode === "concise"
      ? `
        border-violet-400/30
        bg-[#171329]
        text-white
        shadow-[0_0_18px_rgba(139,92,246,0.12)]
      `
      : `
        border-transparent
        bg-transparent
        text-slate-500
        hover:bg-white/[0.03]
        hover:text-slate-300
      `
  }
`}
              >
                Concise
              </button>


              <button
                type="button"
                onClick={() =>
                  setPresentationMode(
                    "detailed"
                  )
                }
className={`
  flex-1
  rounded-lg
  border
  px-4
  py-2.5
  text-sm
  font-medium
  transition-all
  duration-200

  ${
    presentationMode === "detailed"
      ? `
        border-violet-400/30
        bg-[#171329]
        text-white
        shadow-[0_0_18px_rgba(139,92,246,0.12)]
      `
      : `
        border-transparent
        bg-transparent
        text-slate-500
        hover:bg-white/[0.03]
        hover:text-slate-300
      `
  }
`}
              >
                Detailed
              </button>

            </div>


            <p
              className="
                mt-2
                text-[11px]
                leading-5
                text-slate-600
              "
            >
              {presentationMode === "detailed"
                ? "Detailed: deeper explanations, examples, steps and applications."
                : "Concise: short, clean and presentation-friendly content."
              }
            </p>

          </div>


          {/* ===========================================
              PROMPT PRESETS
          ============================================ */}

          <div

            className="
              relative
              z-10
              mb-4
              flex
              flex-wrap
              gap-2
            "

          >

            {

              Object.keys(
                promptPresets
              ).map(

                (
                  preset
                ) => (

                  <button

                    key={
                      preset
                    }

                    type="button"

                    onClick={() =>

                      setCustomPrompt(

                        promptPresets[
                          preset
                        ]

                      )

                    }

                    className="
                      rounded-lg
                      border
                      border-violet-400/20
                      bg-violet-500/[0.07]
                      px-3
                      py-2
                      text-xs
                      font-medium
                      text-violet-200
                      transition-all
                      duration-200
                      hover:border-cyan-400/30
                      hover:bg-violet-500/12
                      hover:text-white
                    "

                  >

                    {preset}

                  </button>

                )

              )

            }

          </div>


          {/* ===========================================
              CUSTOM AI PROMPT
          ============================================ */}

          <textarea

            value={
              customPrompt
            }

            onChange={(e) =>

              setCustomPrompt(

                e.target.value

              )

            }

            placeholder={`Example:

Create a professional BCA presentation.
Add diagrams, examples, modern visuals and conclusion.`}

            rows={6}

            className="
              relative
              z-10
              w-full
              resize-none
              rounded-xl
              border
              border-violet-400/15
              bg-[#080D19]/90
              px-4
              py-3
              text-sm
              leading-6
              text-white
              outline-none
              transition-all
              duration-200
              placeholder:text-slate-600
              hover:border-violet-400/25
              focus:border-violet-400/50
              focus:ring-2
              focus:ring-violet-500/10
            "

          />

        </div>


        {/* =============================================
            GENERATE PRESENTATION
        ============================================== */}

        <button

          type="submit"

          disabled={
            loading
          }

          className="
            group/generate
            relative
            mt-6
            flex
            w-full
            items-center
            justify-center
            gap-2
            overflow-hidden
            rounded-xl
            bg-violet-600
            px-5
            py-3.5
            text-sm
            font-semibold
            text-white
            shadow-[0_0_24px_rgba(139,92,246,0.20)]
            transition-all
            duration-200
            hover:-translate-y-[1px]
            hover:shadow-[0_0_30px_rgba(139,92,246,0.28)]
            disabled:cursor-not-allowed
            disabled:opacity-60
            disabled:hover:translate-y-0
          "

        >

          {/* ===========================================
              INSET GRADIENT

              Keeps gradient away from outer edges.
          ============================================ */}

          <span
            className="
              pointer-events-none
              absolute
              inset-[1px]
              rounded-[11px]
              bg-gradient-to-r
              from-fuchsia-600
              via-violet-600
              to-cyan-500
            "
          />


          {/* SHINE */}

          <span
            className="
              pointer-events-none
              absolute
              inset-[1px]
              -translate-x-full
              rounded-[11px]
              bg-gradient-to-r
              from-transparent
              via-white/15
              to-transparent
              transition-transform
              duration-700
              group-hover/generate:translate-x-full
            "
          />


          <Sparkles
            size={18}
            className="
              relative
              z-10
            "
          />


          <span
            className="
              relative
              z-10
            "
          >

            {
              loading
                ? "Generating..."
                : "Generate Presentation"
            }

          </span>

        </button>

      </div>

    </form>

  );

}


// ======================================================
// REUSABLE INPUT
// ======================================================

function Input({

  label,

  value,

  setValue,

  placeholder,

}) {


  return (

    <div
      className="
        mb-4
      "
    >

      <label
        className="
          mb-2
          block
          text-sm
          font-medium
          text-slate-400
        "
      >
        {label}
      </label>


      <input

        value={
          value
        }

        onChange={(e) =>

          setValue(

            e.target.value

          )

        }

        placeholder={
          placeholder
        }

        className="
          w-full
          rounded-xl
          border
          border-violet-400/15
          bg-[#0A0F1E]
          px-4
          py-3
          text-sm
          text-white
          outline-none
          transition-all
          duration-200
          placeholder:text-slate-600
          hover:border-violet-400/25
          focus:border-violet-400/50
          focus:ring-2
          focus:ring-violet-500/10
        "

      />

    </div>

  );

}