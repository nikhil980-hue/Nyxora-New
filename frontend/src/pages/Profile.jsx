import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  Check,
  Mail,
  Pencil,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import {
  updateProfile,
} from "firebase/auth";

import {
  auth,
} from "../firebase/firebase";


// ======================================================
// PROFILE PAGE
// ======================================================

export default function Profile() {

  const navigate =
    useNavigate();


  const currentUser =
    auth.currentUser;


  const initialName =
    currentUser?.displayName ||
    "Nyxora User";


  const initialEmail =
    currentUser?.email ||
    "No email available";


  const [
    name,
    setName
  ] = useState(
    initialName
  );


  const [
    editing,
    setEditing
  ] = useState(false);


  const [
    saving,
    setSaving
  ] = useState(false);


  const [
    saved,
    setSaved
  ] = useState(false);


  const initials =
    name
      .trim()
      .split(/\s+/)
      .map(
        (part) =>
          part[0] || ""
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "N";


  const handleSave =
    async () => {

      const cleanName =
        name.trim();


      if (!cleanName) {
        return;
      }


      try {

        setSaving(true);
        setSaved(false);


        if (currentUser) {

          await updateProfile(
            currentUser,
            {
              displayName:
                cleanName,
            }
          );

        }


        setEditing(false);
        setSaved(true);


        window.setTimeout(
          () => {
            setSaved(false);
          },
          2500
        );

      } catch (error) {

        console.error(
          "Profile update failed:",
          error
        );

      } finally {

        setSaving(false);

      }

    };


  return (

    <div
      className="
        min-h-screen
        bg-[#050814]
        px-4
        py-5
        text-white
        sm:px-6
        lg:px-8
      "
    >

      {/* ==================================================
          AMBIENT BACKGROUND
      ================================================== */}

      <div
        className="
          pointer-events-none
          fixed
          -left-32
          -top-32
          h-80
          w-80
          rounded-full
          bg-fuchsia-600/[0.07]
          blur-[110px]
        "
      />

      <div
        className="
          pointer-events-none
          fixed
          -right-32
          top-20
          h-80
          w-80
          rounded-full
          bg-cyan-500/[0.06]
          blur-[110px]
        "
      />


      {/* ==================================================
          MAIN CONTAINER
      ================================================== */}

      <div
        className="
          relative
          mx-auto
          w-full
          max-w-5xl
        "
      >


        {/* ==================================================
            TOP BAR
        ================================================== */}

        <div
          className="
            mb-6
            flex
            items-center
            justify-between
          "
        >

          <button
            type="button"
onClick={() =>
  navigate(-1)
}
            className="
              group
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-white/[0.08]
              bg-[#0B1020]/80
              px-4
              py-2.5
              text-sm
              text-slate-300
              transition-all
              duration-300
              hover:border-violet-400/30
              hover:bg-violet-500/[0.06]
              hover:text-white
            "
          >

            <ArrowLeft
              size={16}
              className="
                transition-transform
                duration-300
                group-hover:-translate-x-0.5
              "
            />

            Back to Dashboard

          </button>


          <div
            className="
              hidden
              items-center
              gap-2
              text-xs
              font-semibold
              uppercase
              tracking-[0.18em]
              text-slate-500
              sm:flex
            "
          >

            <Sparkles
              size={14}
              className="
                text-violet-400
              "
            />

            Nyxora Profile

          </div>

        </div>


        {/* ==================================================
            PROFILE HERO
        ================================================== */}

        <div
          className="
            relative
            overflow-hidden
            rounded-3xl
            border
            border-white/[0.08]
            bg-[#080C18]/90
            p-6
            shadow-[0_18px_60px_rgba(0,0,0,.24)]
            sm:p-8
          "
        >

          <div
            className="
              pointer-events-none
              absolute
              -left-20
              -top-20
              h-56
              w-56
              rounded-full
              bg-fuchsia-600/[0.08]
              blur-[85px]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              h-56
              w-56
              rounded-full
              bg-cyan-400/[0.06]
              blur-[85px]
            "
          />


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


          <div
            className="
              relative
              z-10
              flex
              flex-col
              gap-6
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <div
              className="
                flex
                items-center
                gap-5
              "
            >

              {/* AVATAR */}

              <div
                className="
                  relative
                  h-24
                  w-24
                  shrink-0
                  rounded-2xl
                  bg-gradient-to-br
                  from-fuchsia-500
                  via-violet-600
                  to-cyan-400
                  p-[2px]
                  shadow-[0_0_28px_rgba(124,58,237,.18)]
                "
              >

                <div
                  className="
                    flex
                    h-full
                    w-full
                    items-center
                    justify-center
                    rounded-[14px]
                    bg-[#090D1A]
                    text-4xl
                    font-bold
                  "
                >

                  <span
                    className="
                      nyxora-gradient-text
                    "
                  >

                    {initials}

                  </span>

                </div>


                <span
                  className="
                    absolute
                    -bottom-1
                    -right-1
                    h-4
                    w-4
                    rounded-full
                    border-[3px]
                    border-[#080C18]
                    bg-emerald-400
                    shadow-[0_0_10px_rgba(52,211,153,.55)]
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
                      text-2xl
                      font-bold
                      tracking-tight
                      text-white
                      sm:text-3xl
                    "
                  >

                    {name}

                  </h1>


                  <ShieldCheck
                    size={18}
                    className="
                      text-violet-300
                    "
                  />

                </div>



                <div
                  className="
                    mt-3
                    flex
                    items-center
                    gap-2
                    text-sm
                    text-slate-500
                  "
                >

                  <Mail
                    size={15}
                  />

                  {initialEmail}

                </div>

              </div>

            </div>


            <button
              type="button"
              onClick={() =>
                setEditing(
                  (value) =>
                    !value
                )
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-violet-400/20
                bg-violet-500/[0.08]
                px-4
                py-3
                text-sm
                font-medium
                text-violet-200
                transition-all
                duration-300
                hover:border-violet-400/35
                hover:bg-violet-500/[0.13]
              "
            >

              <Pencil
                size={16}
              />

              {editing
                ? "Cancel"
                : "Edit Profile"}

            </button>

          </div>

        </div>


        {/* ==================================================
            PROFILE DETAILS
        ================================================== */}

        <div
          className="
            mt-6
            grid
            grid-cols-1
            gap-6
            lg:grid-cols-[1fr_320px]
          "
        >


          {/* ==================================================
              PERSONAL INFORMATION
          ================================================== */}

          <div
            className="
              rounded-3xl
              border
              border-white/[0.08]
              bg-[#080C18]/90
              p-6
              shadow-[0_18px_60px_rgba(0,0,0,.18)]
              sm:p-7
            "
          >

            <div
              className="
                mb-6
              "
            >

              <div
                className="
                  mb-2
                  flex
                  items-center
                  gap-2
                "
              >

                <UserRound
                  size={15}
                  className="
                    text-violet-400
                  "
                />

                <span
                  className="
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-slate-500
                  "
                >

                  Account Information

                </span>

              </div>


              <h2
                className="
                  text-xl
                  font-semibold
                  text-white
                "
              >

                Personal Details

              </h2>


              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                "
              >

                Manage the basic information
                connected to your Nyxora account.

              </p>

            </div>


            <div
              className="
                space-y-5
              "
            >

              {/* NAME */}

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-slate-300
                  "
                >

                  Full Name

                </label>


                <input
                  type="text"
                  value={name}
                  disabled={!editing}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-white/[0.08]
                    bg-[#0B1020]
                    px-4
                    py-3.5
                    text-sm
                    text-white
                    outline-none
                    transition-all
                    duration-300
                    placeholder:text-slate-600
                    focus:border-violet-400/40
                    focus:bg-[#0D1324]
                    disabled:cursor-not-allowed
                    disabled:opacity-70
                  "
                />

              </div>


              {/* EMAIL */}

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-slate-300
                  "
                >

                  Email Address

                </label>


                <div
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-white/[0.08]
                    bg-[#0B1020]
                    px-4
                    py-3.5
                  "
                >

                  <Mail
                    size={17}
                    className="
                      shrink-0
                      text-slate-500
                    "
                  />

                  <span
                    className="
                      min-w-0
                      truncate
                      text-sm
                      text-slate-400
                    "
                  >

                    {initialEmail}

                  </span>

                </div>


                <p
                  className="
                    mt-2
                    text-xs
                    text-slate-600
                  "
                >

                  Email changes require account
                  re-authentication and are not
                  changed from this page.

                </p>

              </div>


              {/* SAVE */}

              {editing && (

                <div
                  className="
                    flex
                    flex-col
                    gap-3
                    pt-2
                    sm:flex-row
                    sm:items-center
                  "
                >

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-gradient-to-r
                      from-fuchsia-600
                      via-violet-600
                      to-cyan-500
                      px-5
                      py-3
                      text-sm
                      font-semibold
                      text-white
                      shadow-[0_0_22px_rgba(124,58,237,.16)]
                      transition-all
                      duration-300
                      hover:scale-[1.01]
                      hover:shadow-[0_0_28px_rgba(124,58,237,.24)]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >

                    <Check
                      size={16}
                    />

                    {saving
                      ? "Saving..."
                      : "Save Changes"}

                  </button>


                  {saved && (

                    <span
                      className="
                        text-sm
                        text-emerald-400
                      "
                    >

                      Profile updated successfully.

                    </span>

                  )}

                </div>

              )}

            </div>

          </div>


          {/* ==================================================
              ACCOUNT STATUS
          ================================================== */}

          <div
            className="
              rounded-3xl
              border
              border-white/[0.08]
              bg-[#080C18]/90
              p-6
              shadow-[0_18px_60px_rgba(0,0,0,.18)]
            "
          >

            <div
              className="
                mb-5
              "
            >

              <div
                className="
                  mb-2
                  flex
                  items-center
                  gap-2
                "
              >

                <ShieldCheck
                  size={15}
                  className="
                    text-emerald-400
                  "
                />

                <span
                  className="
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-slate-500
                  "
                >

                  Account Status

                </span>

              </div>


              <h2
                className="
                  text-xl
                  font-semibold
                  text-white
                "
              >

                Nyxora Account

              </h2>

            </div>


            <div
              className="
                space-y-3
              "
            >

              <div
                className="
                  rounded-2xl
                  border
                  border-white/[0.07]
                  bg-[#0B1020]
                  p-4
                "
              >

                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >

                  <span
                    className="
                      text-sm
                      text-slate-400
                    "
                  >

                    Account

                  </span>


                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      text-xs
                      font-medium
                      text-emerald-400
                    "
                  >

                    <span
                      className="
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-emerald-400
                      "
                    />

                    Active

                  </span>

                </div>

              </div>


              <div
                className="
                  rounded-2xl
                  border
                  border-white/[0.07]
                  bg-[#0B1020]
                  p-4
                "
              >

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                  "
                >

                  <span
                    className="
                      text-sm
                      text-slate-400
                    "
                  >

                    Email

                  </span>


                  <span
                    className="
                      truncate
                      text-xs
                      text-slate-500
                    "
                  >

                    Verified by Firebase

                  </span>

                </div>

              </div>


              <div
                className="
                  rounded-2xl
                  border
                  border-white/[0.07]
                  bg-[#0B1020]
                  p-4
                "
              >

                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >

                  <span
                    className="
                      text-sm
                      text-slate-400
                    "
                  >

                    Platform

                  </span>


                  <span
                    className="
                      text-xs
                      font-medium
                      text-violet-300
                    "
                  >

                    Nyxora AI

                  </span>

                </div>

              </div>

            </div>

          </div>


        </div>


      </div>

    </div>

  );

}