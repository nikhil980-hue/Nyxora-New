import {
  Sparkles,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";


export default function DashboardHeader() {


  const navigate =
    useNavigate();


  const hour =
    new Date().getHours();


  let greeting =
    "Good Evening";


  if (hour < 12) {

    greeting =
      "Good Morning";

  } else if (hour < 18) {

    greeting =
      "Good Afternoon";

  }


  const handleProfileClick =
    () => {

      navigate(
        "/profile"
      );

    };


  return (

    <div
      className="
        relative
        overflow-hidden
        rounded-3xl
        border
        border-white/[0.07]
        bg-[#080C18]/90
        px-6
        py-6
        shadow-[0_18px_60px_rgba(0,0,0,.22)]
        lg:px-7
      "
    >


      {/* ==================================================
          AMBIENT BACKGROUND GLOWS
      ================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -left-20
          -top-24
          h-64
          w-64
          rounded-full
          bg-fuchsia-600/[0.08]
          blur-[90px]
        "
      />


      <div
        className="
          pointer-events-none
          absolute
          -right-16
          -top-20
          h-64
          w-64
          rounded-full
          bg-cyan-400/[0.07]
          blur-[90px]
        "
      />


      {/* ==================================================
          TOP GRADIENT ACCENT
      ================================================== */}

      <div
        className="
          absolute
          left-8
          right-8
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-violet-400/60
          to-transparent
        "
      />


      {/* ==================================================
          HEADER CONTENT
      ================================================== */}

      <div
        className="
          relative
          z-10
          flex
          flex-col
          gap-6
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >


        {/* ==================================================
            LEFT SIDE
        ================================================== */}

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
                h-7
                w-7
                items-center
                justify-center
                rounded-lg
                bg-gradient-to-br
                from-fuchsia-500/20
                via-violet-500/20
                to-cyan-400/15
                text-violet-300
              "
            >

              <Sparkles
                size={15}
              />

            </div>


            <span
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.18em]
                text-slate-500
              "
            >

              Nyxora Workspace

            </span>


          </div>



          <h1
            className="
              text-3xl
              font-bold
              tracking-tight
              text-white
              sm:text-4xl
            "
          >

            {greeting}

            <span className="ml-2">
              👋
            </span>

          </h1>



          <p
            className="
              mt-2
              text-base
              text-slate-400
              sm:text-lg
            "
          >

            Welcome back to{" "}

            <span
              className="
                font-medium
                text-slate-300
              "
            >

              Nyxora AI Workspace

            </span>

          </p>


        </div>



        {/* ==================================================
            RIGHT SIDE
        ================================================== */}

        <div
          className="
            flex
            w-full
            items-center
            justify-end
            gap-3
            lg:w-auto
          "
        >


          {/* ==================================================
              PROFILE AVATAR
          ================================================== */}

          <button

            type="button"

            onClick={
              handleProfileClick
            }

            aria-label="Open profile"

            title="Profile"

            className="
              group
              relative
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-gradient-to-br
              from-fuchsia-500
              via-violet-600
              to-cyan-400
              p-[1px]
              shadow-[0_0_22px_rgba(124,58,237,.18)]
              transition-all
              duration-300
              hover:scale-[1.04]
              hover:shadow-[0_0_28px_rgba(124,58,237,.28)]
              focus:outline-none
              focus:ring-2
              focus:ring-violet-400/40
            "

          >


            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                rounded-[11px]
                bg-[#090D1A]
                text-base
                font-bold
                text-white
              "
            >

              <span
                className="
                  nyxora-gradient-text
                "
              >

                N

              </span>


            </div>



            {/* ONLINE STATUS */}

            <span
              className="
                absolute
                -bottom-0.5
                -right-0.5
                h-3
                w-3
                rounded-full
                border-2
                border-[#080C18]
                bg-emerald-400
                shadow-[0_0_7px_rgba(52,211,153,.55)]
              "
            />


          </button>


        </div>


      </div>


    </div>

  );

}