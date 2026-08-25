export default function NyxoraLogo({
  size = 60,
  animated = true,
}) {

  const uid =
    "nyxora-main-logo";


  return (

    <div

      className="relative flex shrink-0 items-center justify-center"

      style={{
        width: size,
        height: size,
      }}

      aria-label="Nyxora AI"

      role="img"

    >


      {/* ==================================================
          CONTROLLED AMBIENT GLOW

          Keeps the AI/neon identity without the old
          orbit/ring appearance.
      ================================================== */}

      <div

        aria-hidden="true"

        className={
          `pointer-events-none absolute rounded-full ${
            animated
              ? "nyxora-logo-glow"
              : ""
          }`
        }

        style={{

          width:
            size * 0.9,

          height:
            size * 0.9,

          background:
            `
            radial-gradient(
              circle,
              rgba(168,85,247,.34) 0%,
              rgba(99,102,241,.22) 35%,
              rgba(6,182,212,.12) 58%,
              transparent 75%
            )
            `,

          filter:
            `blur(${Math.max(
              8,
              size * 0.16
            )}px)`,

        }}

      />


      {/* ==================================================
          NYXORA N

          Original folded-ribbon N identity.

          Palette:
          Magenta → Violet → Indigo → Blue → Cyan
      ================================================== */}

      <svg

        width="100"

        height={size}

        viewBox="0 0 100 100"

        fill="none"

        xmlns="http://www.w3.org/2000/svg"

        className={
          animated
            ? "nyxora-logo-mark"
            : ""
        }

        style={{
          overflow: "visible",
        }}

      >


        <defs>


          {/* LEFT RIBBON */}

          <linearGradient

            id={`${uid}-left`}

            x1="15"

            y1="10"

            x2="48"

            y2="90"

            gradientUnits="userSpaceOnUse"

          >

            <stop
              offset="0%"
              stopColor="#F43AF5"
            />

            <stop
              offset="38%"
              stopColor="#A855F7"
            />

            <stop
              offset="100%"
              stopColor="#5B21B6"
            />

          </linearGradient>


          {/* CENTER RIBBON */}

          <linearGradient

            id={`${uid}-center`}

            x1="28"

            y1="18"

            x2="76"

            y2="84"

            gradientUnits="userSpaceOnUse"

          >

            <stop
              offset="0%"
              stopColor="#D946EF"
            />

            <stop
              offset="32%"
              stopColor="#8B5CF6"
            />

            <stop
              offset="67%"
              stopColor="#3B82F6"
            />

            <stop
              offset="100%"
              stopColor="#06B6D4"
            />

          </linearGradient>


          {/* RIGHT RIBBON */}

          <linearGradient

            id={`${uid}-right`}

            x1="67"

            y1="14"

            x2="88"

            y2="88"

            gradientUnits="userSpaceOnUse"

          >

            <stop
              offset="0%"
              stopColor="#22D3EE"
            />

            <stop
              offset="42%"
              stopColor="#0EA5E9"
            />

            <stop
              offset="100%"
              stopColor="#2563EB"
            />

          </linearGradient>


          {/* EDGE HIGHLIGHT */}

          <linearGradient

            id={`${uid}-edge`}

            x1="18"

            y1="14"

            x2="83"

            y2="84"

            gradientUnits="userSpaceOnUse"

          >

            <stop
              offset="0%"
              stopColor="#F0ABFC"
            />

            <stop
              offset="45%"
              stopColor="#818CF8"
            />

            <stop
              offset="100%"
              stopColor="#67E8F9"
            />

          </linearGradient>


          {/* INTERNAL LINE PATTERN */}

          <pattern

            id={`${uid}-pattern`}

            width="4"

            height="4"

            patternUnits="userSpaceOnUse"

            patternTransform="rotate(-12)"

          >

            <line

              x1="0"

              y1="0"

              x2="0"

              y2="4"

              stroke="white"

              strokeOpacity="0.18"

              strokeWidth="0.65"

            />

          </pattern>


          {/* SOFT LOGO SHADOW */}

          <filter

            id={`${uid}-shadow`}

            x="-60%"

            y="-60%"

            width="220%"

            height="220%"

          >

            <feDropShadow

              dx="0"

              dy="4"

              stdDeviation="4"

              floodColor="#7C3AED"

              floodOpacity="0.32"

            />

            <feDropShadow

              dx="0"

              dy="0"

              stdDeviation="2"

              floodColor="#06B6D4"

              floodOpacity="0.18"

            />

          </filter>


        </defs>


        {/* =================================================
            COMPLETE MARK
        ================================================= */}

        <g
          filter={`url(#${uid}-shadow)`}
        >


          {/* LEFT VERTICAL FOLD */}

          <path

            d="
              M18 14
              L34 19
              L34 82
              L18 89
              Z
            "

            fill={`url(#${uid}-left)`}

          />


          {/* LEFT DARK FOLD FOR DEPTH */}

          <path

            d="
              M34 19
              L43 31
              L43 72
              L34 82
              Z
            "

            fill="#4C1D95"

            fillOpacity="0.62"

          />


          {/* RIGHT VERTICAL RIBBON */}

          <path

            d="
              M68 23
              L83 14
              L83 89
              L68 84
              Z
            "

            fill={`url(#${uid}-right)`}

          />


          {/* RIGHT INNER SHADOW */}

          <path

            d="
              M61 69
              L68 62
              L68 84
              L61 73
              Z
            "

            fill="#1D4ED8"

            fillOpacity="0.58"

          />


          {/* MAIN DIAGONAL RIBBON */}

          <path

            d="
              M18 14
              L34 19
              L83 89
              L67 84
              Z
            "

            fill={`url(#${uid}-center)`}

          />


          {/* =================================================
              SUBTLE RIBBON PATTERN
          ================================================= */}

          <path

            d="
              M18 14
              L34 19
              L83 89
              L67 84
              Z
            "

            fill={`url(#${uid}-pattern)`}

            opacity="0.72"

          />


          <path

            d="
              M18 14
              L34 19
              L34 82
              L18 89
              Z
            "

            fill={`url(#${uid}-pattern)`}

            opacity="0.45"

          />


          <path

            d="
              M68 23
              L83 14
              L83 89
              L68 84
              Z
            "

            fill={`url(#${uid}-pattern)`}

            opacity="0.32"

          />


          {/* =================================================
              PREMIUM EDGE LIGHTS
          ================================================= */}

          <path

            d="
              M18.5 14.5
              L33.5 19.5
              L82.5 88.5
            "

            stroke={`url(#${uid}-edge)`}

            strokeWidth="1.25"

            strokeLinecap="round"

            opacity="0.92"

          />


          <path

            d="
              M82.5 14.5
              L68.5 23.5
            "

            stroke="#67E8F9"

            strokeWidth="1.2"

            strokeLinecap="round"

            opacity="0.95"

          />


          {/* =================================================
              SMALL SPECULAR HIGHLIGHT
          ================================================= */}

          <path

            d="
              M21 18
              L31 21
              L73 80
            "

            stroke="white"

            strokeWidth="0.7"

            strokeLinecap="round"

            opacity="0.22"

          />


        </g>


      </svg>


      {/* ==================================================
          COMPONENT ANIMATION

          IMPORTANT:
          This is only subtle idle animation.

          The big cinematic startup zoom will be handled
          separately in SplashScreen.jsx.
      ================================================== */}

      <style>{`

        .nyxora-logo-mark {

          transform-origin:
            50% 50%;

          animation:
            nyxora-logo-idle 4.8s ease-in-out infinite;

          will-change:
            transform,
            filter;

        }


        .nyxora-logo-glow {

          animation:
            nyxora-logo-glow-pulse 3.8s ease-in-out infinite;

          will-change:
            transform,
            opacity;

        }


        @keyframes nyxora-logo-idle {

          0% {

            transform:
              translateY(0)
              scale(1);

            filter:
              brightness(1);

          }


          50% {

            transform:
              translateY(-1px)
              scale(1.018);

            filter:
              brightness(1.08);

          }


          100% {

            transform:
              translateY(0)
              scale(1);

            filter:
              brightness(1);

          }

        }


        @keyframes nyxora-logo-glow-pulse {

          0%,
          100% {

            opacity:
              0.62;

            transform:
              scale(0.94);

          }


          50% {

            opacity:
              1;

            transform:
              scale(1.08);

          }

        }


        @media (
          prefers-reduced-motion:
          reduce
        ) {

          .nyxora-logo-mark,
          .nyxora-logo-glow {

            animation:
              none !important;

          }

        }

      `}</style>


    </div>

  );

}