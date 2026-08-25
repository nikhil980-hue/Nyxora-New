import { useMemo, useState } from "react";

import {
  Plus,
  Sparkles,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";

import ChatSearch from "./ChatSearch";
import ChatGroup from "./ChatGroup";
import EmptyState from "./EmptyState";

import NyxoraLogo from "../../../components/common/NyxoraLogo";

import {
  groupChats,
  GROUP_ORDER,
} from "../utils/groupChats";


export default function ChatSidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
}) {

  const [editingId, setEditingId] =
    useState(null);

  const [title, setTitle] =
    useState("");

  const [search, setSearch] =
    useState("");

  // ==================================================
  // MOBILE SIDEBAR STATE
  // ==================================================

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const handleBack =
  () => {

    window.history.back();

  };

  


  // ==================================================
  // SEARCH
  // ==================================================

  const filteredChats = useMemo(() => {

    return chats.filter((chat) =>
      chat.title
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  }, [chats, search]);


  // ==================================================
  // GROUP CHATS
  // ==================================================

  const groupedChats = useMemo(() => {

    return groupChats(filteredChats);

  }, [filteredChats]);


  // ==================================================
  // SAVE RENAMED CHAT
  // ==================================================

  const saveTitle = () => {

    if (!editingId) {
      return;
    }

    onRenameChat(
      editingId,
      title.trim() || "New Chat"
    );

    setEditingId(null);

  };


  // ==================================================
  // MOBILE NEW CHAT
  // Existing new-chat functionality preserved.
  // ==================================================

  const handleNewChat = () => {

    onNewChat();

    setMobileOpen(false);

  };


  // ==================================================
  // MOBILE CHAT SELECT
  // Existing chat selection preserved.
  // ==================================================

  const handleSelectChat = (...args) => {

    onSelectChat(...args);

    setMobileOpen(false);

  };


  // ==================================================
  // MOBILE DELETE
  // Existing delete functionality preserved.
  // ==================================================

  const handleDeleteChat = (...args) => {

    onDeleteChat(...args);

  };


  return (

    <>

      {/* ==================================================
          MOBILE CHAT SIDEBAR BUTTON

          This is separate from the main Nyxora navigation
          button. It only controls the Chat history drawer.
      ================================================== */}

      {!mobileOpen && (

        <button
          type="button"
          onClick={() =>
            setMobileOpen(true)
          }
          aria-label="Open chat history"
          className="
            fixed
            left-16
            top-4
            z-[100]
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            border
            border-white/[0.10]
            bg-[#070B18]/95
            text-slate-300
            shadow-[0_8px_30px_rgba(0,0,0,.35)]
            backdrop-blur-xl
            transition
            hover:bg-white/[0.07]
            hover:text-white
            md:hidden
          "
        >

          <Menu
            size={21}
          />

        </button>

      )}


      {/* ==================================================
          MOBILE OVERLAY
      ================================================== */}

      {mobileOpen && (

        <button
          type="button"
          aria-label="Close chat history"
          onClick={() =>
            setMobileOpen(false)
          }
          className="
            fixed
            inset-0
            z-[110]
            bg-black/55
            backdrop-blur-[2px]
            md:hidden
          "
        />

      )}


      {/* ==================================================
          CHAT SIDEBAR
      ================================================== */}

      <aside

        className={`
          relative
          z-[115]
          flex
          h-screen
          w-80
          shrink-0
          flex-col
          overflow-hidden

          border-r
          border-violet-400/10

          bg-[#070B18]

          max-md:fixed
          max-md:left-0
          max-md:top-0
          max-md:h-[100dvh]
          max-md:w-[min(86vw,20rem)]
          max-md:shadow-[20px_0_60px_rgba(0,0,0,.45)]
          max-md:transition-transform
          max-md:duration-300
          max-md:ease-out

          ${
            mobileOpen
              ? "max-md:translate-x-0"
              : "max-md:-translate-x-full"
          }
        `}

      >

        {/* ==================================================
            MOBILE CLOSE BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            setMobileOpen(false)
          }
          aria-label="Close chat history"
          className="
            absolute
            right-4
            top-4
            z-30
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            border
            border-white/[0.08]
            bg-white/[0.035]
            text-slate-400
            transition
            hover:bg-white/[0.07]
            hover:text-white
            md:hidden
          "
        >

          <X
            size={19}
          />

        </button>


        {/* ==================================================
            BACKGROUND ATMOSPHERE
        ================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            -left-24
            -top-24
            h-64
            w-64
            rounded-full
            bg-violet-600/10
            blur-[100px]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-24
            -right-24
            h-64
            w-64
            rounded-full
            bg-cyan-500/10
            blur-[100px]
          "
        />


        {/* ==================================================
            BRAND
        ================================================== */}

        <div
          className="
            relative
            z-10
            border-b
            border-white/[0.06]
            px-5
            py-5
          "
        >

<div
  className="
    flex
    items-center
    gap-2.5
  "
>

  {/* BACK BUTTON */}

<button
  type="button"
  onClick={handleBack}
  aria-label="Go back"
  title="Back"
  className="
    group
    flex
    h-8
    w-8
    shrink-0
    items-center
    justify-center
    rounded-full
    border
    border-white/[0.08]
    bg-white/[0.025]
    text-slate-500
    transition-all
    duration-300
    hover:border-violet-400/25
    hover:bg-violet-500/[0.08]
    hover:text-violet-200
  "
>
  <ArrowLeft
    size={14}
    strokeWidth={1.8}
    className="
      transition-transform
      duration-300
      group-hover:-translate-x-0.5
    "
  />
</button>


  {/* NYXORA LOGO */}

  <NyxoraLogo
    size={46}
    animated={true}
  />


  <div
    className="
      min-w-0
    "
  >

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <h1
                  className="
                    text-xl
                    font-bold
                    tracking-tight
                    text-white
                  "
                >
                  Nyxora AI
                </h1>

                <Sparkles
                  size={14}
                  className="
                    text-cyan-400
                  "
                />

              </div>


              <p
                className="
                  mt-0.5
                  text-[11px]
                  tracking-wide
                  text-slate-500
                "
              >
                Your Intelligent Workspace
              </p>

            </div>

          </div>

        </div>


        {/* ==================================================
            NEW CHAT + SEARCH
        ================================================== */}

        <div
          className="
            relative
            z-10
            px-4
            pb-3
            pt-5
          "
        >

          <button
            type="button"
            onClick={handleNewChat}
            className="
              group
              relative
              flex
              w-full
              items-center
              justify-center
              gap-2
              overflow-hidden
              rounded-xl
              bg-gradient-to-r
              from-fuchsia-600
via-violet-600
to-cyan-500

              px-4
              py-3
              font-semibold
              text-white
              shadow-lg
              shadow-violet-950/30
              transition-all
              duration-300
              hover:scale-[1.015]
              hover:shadow-xl
              hover:shadow-violet-700/20
              active:scale-[0.99]
            "
          >

            {/* Button shine */}

            <div
              className="
                pointer-events-none
                absolute
                inset-y-0
                -left-1/2
                w-1/3
                -skew-x-12
                bg-white/10
                transition-all
                duration-700
                group-hover:left-[120%]
              "
            />

            <Plus
              size={19}
              strokeWidth={2.4}
            />

            <span>
              New Chat
            </span>

          </button>


          <div className="mt-4">

            <ChatSearch
              search={search}
              setSearch={setSearch}
            />

          </div>

        </div>


        {/* ==================================================
            CHAT HISTORY
        ================================================== */}

        <div
          className="
            nyxora-chat-scrollbar
            relative
            z-10
            flex-1
            overflow-y-auto
            px-3
            pb-4
          "
        >

          {filteredChats.length === 0 ? (

            <EmptyState />

          ) : (

            GROUP_ORDER.map((group) => (

              <ChatGroup
                key={group}
                title={group}
                chats={
                  groupedChats[group] || []
                }
                activeChatId={activeChatId}
                editingId={editingId}
                setEditingId={setEditingId}
                inputTitle={title}
                setInputTitle={setTitle}
                saveTitle={saveTitle}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
              />

            ))

          )}

        </div>


        {/* ==================================================
            TEAM NYXORA BRAND
        ================================================== */}

        <div
          className="
            group
            relative
            mb-3
            overflow-hidden
            rounded-2xl
            border
            border-violet-400/[0.14]
            bg-gradient-to-br
            from-fuchsia-500/[0.08]
            via-violet-500/[0.07]
            to-cyan-500/[0.06]
            px-4
            py-4
            shadow-[0_10px_35px_rgba(0,0,0,.18)]
            transition-all
            duration-300
            hover:border-violet-400/25
            hover:shadow-[0_0_30px_rgba(124,58,237,.10)]
          "
        >

          {/* TOP BRAND LINE */}

          <div
            className="
              absolute
              left-5
              right-5
              top-0
              h-px
              bg-gradient-to-r
              from-fuchsia-400/50
              via-violet-400/60
              to-cyan-400/50
            "
          />


          {/* VIOLET GLOW */}

          <div
            className="
              pointer-events-none
              absolute
              -left-10
              -top-10
              h-24
              w-24
              rounded-full
              bg-fuchsia-500/10
              blur-[40px]
            "
          />


          {/* CYAN GLOW */}

          <div
            className="
              pointer-events-none
              absolute
              -bottom-10
              -right-10
              h-24
              w-24
              rounded-full
              bg-cyan-400/10
              blur-[40px]
            "
          />


          <div
            className="
              relative
              flex
              items-center
              gap-3
            "
          >

            {/* TEAM ICON */}

            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-violet-300/15
                bg-gradient-to-br
                from-fuchsia-500/15
                via-violet-500/15
                to-cyan-400/10
                text-xl
                shadow-[0_0_20px_rgba(124,58,237,.12)]
              "
            >
              ❤️
            </div>


            {/* TEXT */}

            <div className="min-w-0">

              <p
                className="
                  text-[11px]
                  font-medium
                  uppercase
                  tracking-[0.16em]
                  text-slate-500
                "
              >
                Crafted with AI
              </p>


              <p
                className="
                  mt-1
                  text-[15px]
                  font-bold
                  tracking-tight
                  text-white
                "
              >

                Built by{" "}

                <span
                  className="
                    bg-gradient-to-r
                    from-fuchsia-300
                    via-violet-300
                    to-cyan-300
                    bg-clip-text
                    text-transparent
                  "
                >
                  Team Nyxora
                </span>

              </p>

            </div>

          </div>


          {/* BOTTOM DETAIL */}

          <div
            className="
              relative
              mt-3
              flex
              items-center
              gap-2
            "
          >

            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-fuchsia-400
                shadow-[0_0_7px_rgba(217,70,239,.7)]
              "
            />

            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-violet-400
                shadow-[0_0_7px_rgba(167,139,250,.7)]
              "
            />

            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-cyan-400
                shadow-[0_0_7px_rgba(34,211,238,.7)]
              "
            />

            <span
              className="
                ml-1
                text-[10px]
                text-slate-600
              "
            >
              Designed for intelligent work
            </span>

          </div>

        </div>


        {/* ==================================================
            FOOTER
        ================================================== */}

        <div
          className="
            relative
            z-10
            border-t
            border-white/[0.06]
            p-4
          "
        >

          <div
            className="
              relative
              overflow-hidden
              rounded-xl
              border
              border-violet-400/10
              bg-gradient-to-br
              from-violet-500/[0.08]
              via-white/[0.025]
              to-cyan-500/[0.05]
              px-4
              py-3
            "
          >

            <div
              className="
                absolute
                -right-8
                -top-8
                h-20
                w-20
                rounded-full
                bg-violet-500/10
                blur-2xl
              "
            />


            <div
              className="
                relative
                flex
                items-center
                justify-between
                gap-3
              "
            >

              <div>

                <p
                  className="
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  Nyxora AI
                </p>


                <p
                  className="
                    mt-0.5
                    text-[11px]
                    text-slate-500
                  "
                >
                  Your AI. Your Workspace.
                </p>

              </div>


              <span
                className="
                  rounded-full
                  border
                  border-cyan-400/20
                  bg-cyan-400/10
                  px-2
                  py-1
                  text-[10px]
                  font-semibold
                  text-cyan-300
                "
              >
                v1.0
              </span>

            </div>

          </div>

        </div>


        {/* ==================================================
            LOCAL SCROLLBAR
        ================================================== */}

        <style>{`

          .nyxora-chat-scrollbar {
            scrollbar-width: thin;
            scrollbar-color:
              rgba(139, 92, 246, 0.35)
              transparent;
          }

          .nyxora-chat-scrollbar::-webkit-scrollbar {
            width: 5px;
          }

          .nyxora-chat-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }

          .nyxora-chat-scrollbar::-webkit-scrollbar-thumb {
            background:
              linear-gradient(
                to bottom,
                rgba(99, 102, 241, 0.55),
                rgba(139, 92, 246, 0.55),
                rgba(6, 182, 212, 0.55)
              );

            border-radius: 999px;
          }

        `}</style>

      </aside>

    </>

  );

}