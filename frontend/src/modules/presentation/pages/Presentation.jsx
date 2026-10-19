import {
  Presentation as PresentationIcon,
  Sparkles,
  AlertCircle,
  Download,
  Loader2,
} from "lucide-react";


import {
  useEffect,
  useState,
} from "react";


import PresentationForm
  from "../components/PresentationForm";


import SlidePreview
  from "../components/SlidePreview";


import {
  generatePresentation,
} from "../services/presentationService";


import presentationThemes
  from "../utils/presentationThemes";


import {
  exportPresentationToPpt,
} from "../services/pptExportService";


import {
  saveWorkspacePresentation,
  getLatestWorkspacePresentation,
} from "../services/presentationWorkspaceService";


import {
  auth,
} from "../../../firebase/firebase";



// ======================================================
// PRESENTATION PAGE
// ======================================================

export default function Presentation() {


  const [
    slides,
    setSlides,
  ] = useState([]);


  const [
    title,
    setTitle,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  // ====================================================
  // EXPORT STATE
  // ====================================================

  const [
    exporting,
    setExporting,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    presentationId,
    setPresentationId,
  ] = useState(null);


  // ====================================================
  // PRESENTATION THEME
  // ====================================================

  const [
    selectedTheme,
    setSelectedTheme,
  ] = useState("nyxoraPremium");




  useEffect(() => {
    loadWorkspacePresentation();
  }, []);


  // ====================================================
  // LOAD LATEST WORKSPACE PRESENTATION
  // ====================================================

  async function loadWorkspacePresentation() {

    try {

      const user =
        auth.currentUser;


      if (!user) {
        return;
      }


      const saved =
        await getLatestWorkspacePresentation({

          userId:
            user.uid,

        });


      if (saved) {

        setPresentationId(
          saved.id
        );


        setTitle(
          saved.title ||
          ""
        );


        setSlides(
          saved.slides ||
          []
        );


        setSelectedTheme(
          saved.theme ||
          "nyxoraPremium"
        );

      }

    }

    catch (error) {

      console.error(
        "Workspace load failed:",
        error
      );

    }

  }



  // ====================================================
  // GENERATE PRESENTATION
  // ====================================================

  async function handleGenerate(
    data
  ) {

    try {

      setLoading(true);

      setError("");

      setSlides([]);


      const result =
        await generatePresentation({

          topic:
            data.topic,

          subject:
            data.subject,

          className:
            data.className,

          slideCount:
            data.slideCount,

          theme:
            selectedTheme,

          customPrompt:
            data.customPrompt,

          // ==================================================
          // PRESENTATION CONTENT MODE
          //
          // Comes directly from PresentationForm:
          //
          // "concise"
          // or
          // "detailed"
          // ==================================================

          presentationMode:
            data.presentationMode,

        });



      const generatedTitle =
        result.title ||
        data.topic;


      const generatedSlides =
        result.slides ||
        [];


      setTitle(
        generatedTitle
      );


      setSlides(
        generatedSlides
      );


      // ==================================================
      // SAVE TO NYXORA WORKSPACE
      // ==================================================

      const user =
        auth.currentUser;


      if (user) {

        const savedId =
          await saveWorkspacePresentation({

            userId:
              user.uid,

            title:
              generatedTitle,

            topic:
              data.topic,

            slides:
              generatedSlides,

            theme:
              selectedTheme,

          });


        setPresentationId(
          savedId
        );

      }

    }

    catch (error) {

      console.error(
        "Presentation generation failed:",
        error
      );


      setError(
        error.message ||
        "Unable to generate presentation."
      );

    }

    finally {

      setLoading(false);

    }

  }



  // ====================================================
  // EXPORT PRESENTATION
  // ====================================================

  async function handleExport() {

    if (
      slides.length === 0 ||
      exporting
    ) {

      return;

    }


    try {

      setExporting(true);

      setError("");


      await exportPresentationToPpt({

        presentation: {

          title,

          slides,

        },


        themeName:
          selectedTheme,

      });

    }

    catch (error) {

      console.error(
        "Presentation export failed:",
        error
      );


      setError(
        error?.message ||
        "Unable to export presentation."
      );

    }

    finally {

      setExporting(false);

    }

  }



  // ====================================================
  // UI
  // ====================================================

  return (

    <div
      className="
        relative
        min-h-full
        overflow-hidden
        bg-[#050816]
        p-6
        text-white
      "
    >


      {/* ===============================================
          PAGE AMBIENT GLOW
      ================================================ */}

      <div
        className="
          pointer-events-none
          absolute
          -left-40
          -top-40
          h-96
          w-96
          rounded-full
          bg-fuchsia-500/[0.045]
          blur-3xl
        "
      />


      <div
        className="
          pointer-events-none
          absolute
          -bottom-48
          right-0
          h-[430px]
          w-[430px]
          rounded-full
          bg-cyan-400/[0.045]
          blur-3xl
        "
      />


      <div
        className="
          relative
          z-10
        "
      >


        {/* =============================================
            PAGE HEADER
        ============================================== */}

        <div
          className="
            mb-8
            flex
            items-center
            gap-4
          "
        >


          <div
            className="
              relative
              flex
              h-14
              w-14
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-2xl
              border
              border-violet-400/25
              bg-gradient-to-br
              from-fuchsia-500/15
              via-violet-500/20
              to-cyan-400/15
              shadow-[0_0_28px_rgba(139,92,246,0.14)]
            "
          >


            <div
              className="
                pointer-events-none
                absolute
                inset-0
                bg-gradient-to-br
                from-fuchsia-400/[0.08]
                via-transparent
                to-cyan-400/[0.08]
              "
            />


            <PresentationIcon
              size={27}
              className="
                relative
                z-10
                text-violet-200
              "
            />


          </div>



          <div>


            <div
              className="
                mb-1
                flex
                items-center
                gap-2
              "
            >

              <h1
                className="
                  text-3xl
                  font-bold
                  tracking-tight
                  text-white
                "
              >
                Presentation Generator
              </h1>


              <span
                className="
                  hidden
                  rounded-full
                  border
                  border-violet-400/20
                  bg-violet-500/[0.08]
                  px-2
                  py-1
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-violet-300
                  sm:inline-flex
                "
              >
                AI
              </span>

            </div>


            <p
              className="
                text-sm
                text-slate-400
                sm:text-base
              "
            >
              Create AI-designed presentations with Nyxora AI
            </p>


          </div>


        </div>



        {/* =============================================
            PRESENTATION THEME
        ============================================== */}

        <div
          className="
            mb-6
            flex
            flex-wrap
            items-center
            justify-between
            gap-4
            rounded-2xl
            border
            border-violet-400/20
            bg-[#0B1020]/90
            p-4
          "
        >

          <div>
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-violet-300
              "
            >
              Presentation Style
            </p>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              Choose the visual theme used for PPTX export.
            </p>
          </div>

          <select
            value={selectedTheme}
            onChange={(event) =>
              setSelectedTheme(event.target.value)
            }
            disabled={loading || exporting}
            className="
              min-w-[220px]
              rounded-xl
              border
              border-violet-400/25
              bg-[#050816]
              px-4
              py-2.5
              text-sm
              font-medium
              text-white
              outline-none
              transition
              focus:border-violet-400/60
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {Object.entries(presentationThemes).map(
              ([themeId, theme]) => (
                <option
                  key={themeId}
                  value={themeId}
                >
                  {theme.name || themeId}
                </option>
              )
            )}
          </select>

        </div>


        {/* =============================================
            ERROR
        ============================================== */}

        {error && (

          <div
            className="
              mb-6
              flex
              items-center
              gap-3
              rounded-xl
              border
              border-red-500/25
              bg-red-500/[0.08]
              p-4
              text-red-300
            "
          >

            <AlertCircle
              size={18}
            />


            {error}

          </div>

        )}



        {/* =============================================
            GENERATOR + PREVIEW
        ============================================== */}

        <div
          className="
            grid
            items-start
            gap-6
            lg:grid-cols-2
          "
        >


          {/* ===========================================
              LEFT SIDE
          ============================================ */}

          <div
            className="
              min-w-0
            "
          >

            <PresentationForm
              onGenerate={
                handleGenerate
              }
              loading={
                loading
              }
            />

          </div>



          {/* ===========================================
              RIGHT SIDE
          ============================================ */}

          <div
            className="
              min-w-0
            "
          >


            {title && (

              <div
                className="
                  relative
                  mb-4
                  overflow-hidden
                  rounded-2xl
                  border
                  border-violet-400/20
                  bg-gradient-to-br
                  from-fuchsia-950/15
                  via-[#0B1020]/95
                  to-cyan-950/15
                  shadow-[0_10px_35px_rgba(0,0,0,0.18)]
                "
              >


                {/* TOP ACCENT */}

                <div
                  className="
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


                {/* AMBIENT GLOW */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    -left-12
                    -top-12
                    h-28
                    w-28
                    rounded-full
                    bg-fuchsia-500/[0.06]
                    blur-3xl
                  "
                />


                <div
                  className="
                    pointer-events-none
                    absolute
                    -bottom-12
                    right-0
                    h-28
                    w-28
                    rounded-full
                    bg-cyan-400/[0.06]
                    blur-3xl
                  "
                />


                <div
                  className="
                    relative
                    z-10
                    flex
                    flex-wrap
                    items-center
                    justify-between
                    gap-4
                    p-4
                  "
                >


                  {/* TITLE */}

                  <div
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-3
                    "
                  >

                    <div
                      className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-violet-400/25
                        bg-gradient-to-br
                        from-fuchsia-500/15
                        via-violet-500/15
                        to-cyan-400/10
                      "
                    >

                      <Sparkles
                        size={17}
                        className="
                          text-violet-200
                        "
                      />

                    </div>


                    <div
                      className="
                        min-w-0
                      "
                    >

                      <p
                        className="
                          mb-0.5
                          text-[9px]
                          font-semibold
                          uppercase
                          tracking-[0.18em]
                          text-fuchsia-300
                        "
                      >
                        Nyxora Presentation
                      </p>


                      <p
                        className="
                          truncate
                          text-sm
                          font-semibold
                          text-white
                        "
                      >
                        {title}
                      </p>


                    </div>


                  </div>



                  {/* ===================================
                      EXPORT PPTX

                      Local button instead of
                      NyxoraButton so shared decorative
                      side lines are not rendered.
                  ==================================== */}

                  <button
                    type="button"
                    onClick={
                      handleExport
                    }
                    disabled={
                      slides.length === 0 ||
                      exporting
                    }
                    className="
                      group/export
                      relative
                      inline-flex
                      shrink-0
                      items-center
                      justify-center
                      gap-2
                      overflow-hidden
                      rounded-xl
                      border-violet-400/25
                      bg-gradient-to-r
                      from-fuchsia-600
                      via-violet-600
                      to-cyan-500
                      px-4
                      py-2.5
                      text-sm
                      font-semibold
                      text-white
                      shadow-[0_0_24px_rgba(139,92,246,0.18)]
                      transition-all
                      duration-200
                      hover:-translate-y-[1px]
                      hover:shadow-[0_0_30px_rgba(139,92,246,0.26)]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      disabled:saturate-75
                      disabled:hover:translate-y-0
                    "
                  >


                    {/* SHINE */}

                    <span
                      className="
                        pointer-events-none
                        absolute
                        inset-0
                        -translate-x-full
                        bg-gradient-to-r
                        from-transparent
                        via-white/15
                        to-transparent
                        transition-transform
                        duration-700
                        group-hover/export:translate-x-full
                      "
                    />


                    {exporting ? (

                      <Loader2
                        size={15}
                        className="
                          relative
                          z-10
                          animate-spin
                        "
                      />

                    ) : (

                      <Download
                        size={15}
                        className="
                          relative
                          z-10
                        "
                      />

                    )}


                    <span
                      className="
                        relative
                        z-10
                      "
                    >
                      {exporting
                        ? "Exporting..."
                        : "Export PPTX"}
                    </span>


                  </button>


                </div>


              </div>

            )}



            {/* =========================================
                SLIDE PREVIEW
            ========================================== */}

            <div
              className="
                relative
                overflow-hidden
                rounded-2xl
              "
            >

              <SlidePreview
                slides={
                  slides
                }
              />

            </div>


          </div>


        </div>


      </div>


    </div>

  );

}