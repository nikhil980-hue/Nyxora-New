// ======================================================
// IMPORTS
// ======================================================

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import ChatSidebar from "../components/ChatSidebar";
import ChatHeader from "../components/ChatHeader";
import ChatInput from "../components/ChatInput";
import ChatMessage from "../components/ChatMessage";

import useChatHistory from "../hooks/useChatHistory";
import useChat from "../hooks/useChat";

import useWorkspace
  from "../../workspace/hooks/useWorkspace";

import {
  saveAiDocument,
} from "../../workspace/services/workspaceService";

import {
  WORKSPACE_DOCUMENT_TYPES,
} from "../../workspace/types/workspaceTypes";


// ======================================================
// CHAT PAGE
// ======================================================

function NormalChatPage() {

  const imageStudio = false;

  const location =
    useLocation();

  const navigate =
    useNavigate();


  // ====================================================
  // ASSISTANT MODE
  // ====================================================

  const [
    selectedMode,
    setSelectedMode,
  ] = useState(
    location.state?.assistantMode ||
    "normal"
  );

  // ====================================================
  // REAL-TIME VOICE CONVERSATION
  // ====================================================

  const [
    voiceMode,
    setVoiceMode,
  ] = useState(false);

  const [
    voiceRestartSignal,
    setVoiceRestartSignal,
  ] = useState(0);

  const [
    jarvisMode,
    setJarvisMode,
  ] = useState(false);

  const previousThinkingForVoiceRef =
    useRef(false);

  const handleVoiceModeChange =
    (enabled) => {

      setVoiceMode(
        Boolean(enabled)
      );

      if (!enabled) {
        setVoiceRestartSignal(0);
      }

    };

  const handleVoiceSpeechEnd =
    () => {

      if (!voiceMode) {
        return;
      }

      setVoiceRestartSignal(
        (value) => value + 1
      );

    };

  const handleJarvisModeChange =
    (enabled) => {

      const nextEnabled =
        Boolean(enabled);

      setJarvisMode(nextEnabled);

      if (!nextEnabled) {
        setVoiceMode(false);
        setVoiceRestartSignal(0);
      }

    };


  // ====================================================
  // WORKSPACE
  // ====================================================

  const {
    classes,
    students,
    documents,
    results,

    loading:
    workspaceLoading,
  } = useWorkspace();


  const [
    selectedClassId,
    setSelectedClassId,
  ] = useState("");


  const [
    selectedStudentId,
    setSelectedStudentId,
  ] = useState("");


  const selectedClass =
    classes.find(
      (item) =>
        item.id ===
        selectedClassId
    ) || null;


  const selectedStudent =
    students.find(
      (item) =>
        item.id ===
        selectedStudentId
    ) || null;


  // ====================================================
  // RELEVANT WORKSPACE DOCUMENTS
  // ====================================================

  const relevantDocuments =
    documents.filter(
      (document) => {

        if (
          selectedStudentId &&
          document.studentId ===
          selectedStudentId
        ) {

          return true;

        }


        if (
          selectedClassId &&
          document.classId ===
          selectedClassId
        ) {

          return true;

        }


        return false;

      }
    );


  // ====================================================
  // RELEVANT STUDENT RESULTS
  // ====================================================

  const relevantResults =
    results.filter(
      (result) => {

        if (
          selectedStudentId
        ) {

          return (
            result.studentId ===
            selectedStudentId
          );

        }


        if (
          selectedClassId
        ) {

          return (
            result.classId ===
            selectedClassId
          );

        }


        return false;

      }
    );


  // ====================================================
  // WORKSPACE AI CONTEXT
  // ====================================================

  const workspaceContext = {

    class:
      selectedClass,

    student:
      selectedStudent,

    documents:
      relevantDocuments,

    results:
      relevantResults,

  };


  // ====================================================
  // CHAT HISTORY
  // ====================================================

  const historyScope = imageStudio
    ? "imageStudio"
    : "chat";

  const {
    chats,
    setChats,

    activeChat,
    activeChatId,

    newChat,
    selectChat,
    deleteChat,
    renameChat,

    clearConversation,

    loading:
    chatHistoryLoading,

  } = useChatHistory({
    scope: historyScope,
  });


  // ====================================================
  // DASHBOARD NAVIGATION
  // ====================================================

  const dashboardActionHandled =
    useRef(false);


  useEffect(() => {

    if (
      chatHistoryLoading
    ) {

      return;

    }


    if (
      dashboardActionHandled.current
    ) {

      return;

    }


    const shouldCreateChat =
      location.state
        ?.createNewChat ===
      true;


    const requestedMode =
      location.state
        ?.assistantMode;


    if (
      requestedMode
    ) {

      setSelectedMode(
        requestedMode
      );

    }


    if (
      !shouldCreateChat
    ) {

      dashboardActionHandled.current =
        true;

      return;

    }


    dashboardActionHandled.current =
      true;


    async function createDashboardChat() {

      try {

        await newChat();

      } catch (error) {

        console.error(
          "Dashboard new chat error:",
          error
        );

      } finally {

        navigate(
          imageStudio ? "/image-studio" : "/chat",
          {
            replace: true,
          }
        );

      }

    }


    createDashboardChat();

  }, [
    chatHistoryLoading,
    location.state,
    navigate,
    newChat,
  ]);


  // ====================================================
  // CHAT AI
  // ====================================================

  const {
    send,
    regenerate,
    editMessage,
    stop,
    isThinking,
    thinkingText,
    attachmentError,
    clearAttachmentError,
  } = useChat({

    activeChatId,

    chats,

    setChats,

    selectedMode,

    workspaceContext,
    imageStudio,

    jarvisMode,

  });


  // If a voice request finishes without an assistant response,
  // release the voice loop so it does not remain stuck.
  useEffect(() => {

    const wasThinking =
      previousThinkingForVoiceRef.current;

    previousThinkingForVoiceRef.current =
      Boolean(isThinking);

    if (
      !voiceMode ||
      !wasThinking ||
      isThinking
    ) {
      return;
    }

    const messages =
      activeChat?.messages || [];

    const lastMessage =
      messages[messages.length - 1];

    if (
      lastMessage?.role === "assistant" &&
      String(lastMessage?.message || "").trim()
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {

        if (
          voiceMode &&
          !isThinking
        ) {
          setVoiceRestartSignal(
            (value) => value + 1
          );
        }

      }, 500);

    return () => {
      window.clearTimeout(timer);
    };

  }, [
    voiceMode,
    isThinking,
    activeChat?.messages,
  ]);


  const bottomRef =
    useRef(null);


  // ====================================================
  // AUTO SCROLL
  // ====================================================

  useEffect(() => {

    bottomRef.current
      ?.scrollIntoView({
        behavior:
          "smooth",
      });

  }, [
    activeChat?.messages,
    isThinking,
  ]);


  // ====================================================
  // NEW CHAT
  // ====================================================

  const handleNewChat =
    async () => {

      clearAttachmentError();

      await newChat();

    };
  // ====================================================
  // MODE CHANGE
  // ====================================================

  const handleModeChange = async (modeId) => {

    clearAttachmentError();

    setSelectedMode(modeId);

    await newChat();

  };

  // ====================================================
  // SELECT CHAT
  // ====================================================

  const handleSelectChat =
    (
      chatId
    ) => {

      clearAttachmentError();

      selectChat(
        chatId
      );

    };


  // ====================================================
  // DELETE CHAT
  // ====================================================

  const handleDeleteChat =
    async (
      chatId
    ) => {

      clearAttachmentError();

      return await deleteChat(
        chatId
      );

    };


  // ====================================================
  // RENAME CHAT
  // ====================================================

  const handleRenameChat =
    async (
      chatId,
      title
    ) => {

      await renameChat(
        chatId,
        title
      );


      return true;

    };


  // ====================================================
  // HEADER RENAME
  // ====================================================

  const handleRenameConversation =
    async (
      title
    ) => {

      if (
        !activeChatId
      ) {

        return false;

      }


      return await handleRenameChat(
        activeChatId,
        title
      );

    };


  // ====================================================
  // HEADER DELETE
  // ====================================================

  const handleDeleteConversation =
    async () => {

      if (
        !activeChatId ||
        chats.length <= 1
      ) {

        return false;

      }


      await handleDeleteChat(
        activeChatId
      );


      return true;

    };


  // ====================================================
  // CLEAR CONVERSATION
  // ====================================================

  const handleClearConversation =
    async () => {

      if (
        !activeChatId
      ) {

        return false;

      }


      clearAttachmentError();


      return await clearConversation(
        activeChatId
      );

    };


  // ====================================================
  // REGENERATE
  // ====================================================

  const handleRegenerate =
    () => {

      regenerate();

    };


  // ====================================================
  // EDIT
  // ====================================================

  const handleEdit =
    (
      messageId,
      newText,
      attachmentOptions
    ) => {

      return editMessage(
        messageId,
        newText,
        attachmentOptions
      );

    };


  // ====================================================
  // CLASS CHANGE
  // ====================================================

  const handleClassChange =
    (
      classId
    ) => {

      setSelectedClassId(
        classId
      );


      if (
        !classId
      ) {

        setSelectedStudentId(
          ""
        );

      }

    };


  // ====================================================
  // WORKSPACE DOCUMENT TYPE
  // ====================================================

  const getWorkspaceDocumentType =
    () => {

      switch (
      selectedMode
      ) {

        case "test":

          return (
            WORKSPACE_DOCUMENT_TYPES.TEST
          );


        case "homework":

          return (
            WORKSPACE_DOCUMENT_TYPES.HOMEWORK
          );


        case "report":

          return (
            WORKSPACE_DOCUMENT_TYPES.REPORT
          );


        default:

          return (
            WORKSPACE_DOCUMENT_TYPES.NOTES
          );

      }

    };


  // ====================================================
  // DETECT GENERATED TEST CONTENT
  // ====================================================

  const getWorkspaceDocumentTypeForContent =
    (
      content
    ) => {

      const explicitType =
        getWorkspaceDocumentType();

      if (
        selectedMode !==
        "normal"
      ) {

        return explicitType;

      }

      const cleanContent =
        String(
          content || ""
        )
          .replace(
            /[*_`#>]/g,
            " "
          )
          .replace(
            /\\/g,
            " "
          )
          .replace(
            /\s+/g,
            " "
          )
          .trim();

      if (
        !cleanContent
      ) {

        return explicitType;

      }

      const lowerContent =
        cleanContent.toLowerCase();

      const hasTestTitle =
        /(?:unit\s*(?:test|assessment|exam)|class\s*test|periodic\s*test|question\s*paper|questionnaire|sample\s*paper|practice\s*test|assessment|examination|exam\s*paper|test\s*paper)/i.test(
          cleanContent
        );

      const hasSectionStructure =
        /(?:section\s*[a-d]|खंड\s*['‘“]?[क-घ]['’”]?|खंड\s*[क-घ])/i.test(
          cleanContent
        );

      const hasQuestionNumbering =
        /(?:^|\s)(?:q(?:uestion)?\s*\\d+|प्र\s*\\d+|प्रश्न\s*\\d+|\\d+\s*[.)])(?:\s|$)/i.test(
          cleanContent
        );

      const hasMcqOptions =
        /(?:^|\s)\(?[a-dA-Dक-घ]\)?[.)][ \t]+/.test(
          cleanContent
        );

      const hasMultipleQuestionLines =
        (
          cleanContent.match(
            /(?:^|\s)(?:q(?:uestion)?\s*\\d+|प्र\s*\\d+|प्रश्न\s*\\d+|\\d+\s*[.)])(?:\s|$)/gi
          ) || []
        ).length >= 3;

      const looksLikeTest =
        hasTestTitle ||
        (
          hasSectionStructure &&
          (
            hasQuestionNumbering ||
            hasMcqOptions
          )
        ) ||
        (
          hasMultipleQuestionLines &&
          hasMcqOptions
        );

      if (
        looksLikeTest
      ) {

        return (
          WORKSPACE_DOCUMENT_TYPES.TEST
        );

      }

      return explicitType;

    };


  // ====================================================
  // AI WORKSPACE DOCUMENT METADATA
  // ====================================================

  const getLatestUserMessage = () => {

    const messages =
      activeChat?.messages || [];

    for (
      let index = messages.length - 1;
      index >= 0;
      index -= 1
    ) {

      const message =
        messages[index];

      if (
        message?.role === "user"
      ) {

        return String(
          message?.message ??
          message?.content ??
          ""
        ).trim();

      }

    }

    return "";

  };

  const cleanMetadataText = (
    value
  ) => {

    return String(
      value || ""
    )
      .replace(
        /[*_`#>]/g,
        " "
      )
      .replace(
        /\\/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  };

  const extractMetadataField = (
    text,
    patterns
  ) => {

    const source =
      String(
        text || ""
      );

    for (
      const pattern of patterns
    ) {

      const match =
        source.match(
          pattern
        );

      if (
        match?.[1]
      ) {

        return cleanMetadataText(
          match[1]
        )
          .replace(
            /\s+[-–—:]\s*$/,
            ""
          )
          .trim();

      }

    }

    return "";

  };

  const normalizeClassValue = (
    value
  ) => {

    const cleaned =
      cleanMetadataText(
        value
      )
        .replace(
          /^(?:class|grade|standard|कक्षा|श्रेणी)\s*/i,
          ""
        )
        .trim();

    const romanMap = {
      i: "1",
      ii: "2",
      iii: "3",
      iv: "4",
      v: "5",
      vi: "6",
      vii: "7",
      viii: "8",
      ix: "9",
      x: "10",
      xi: "11",
      xii: "12",
    };

    const roman =
      cleaned.match(
        /^(i{1,3}|iv|vi{0,3}|ix|x|xi|xii)$/i
      );

    if (
      roman?.[1]
    ) {

      return (
        romanMap[
        roman[1].toLowerCase()
        ] ||
        cleaned
      );

    }

    const number =
      cleaned.match(
        /\b(?:1[0-2]|[1-9])\b/
      );

    return (
      number?.[0] ||
      cleaned
    );

  };

  const extractClassValue = (
    text
  ) => {

    const explicit =
      extractMetadataField(
        text,
        [
          /(?:^|\n)\s*(?:class|grade|standard|कक्षा|श्रेणी)\s*[:\-–—]?\s*([0-9]{1,2}|[ivx]{1,4})\b/im,
          /\bclass\s*[:\-–—]?\s*([0-9]{1,2}|[ivx]{1,4})\b/i,
          /\bgrade\s*[:\-–—]?\s*([0-9]{1,2}|[ivx]{1,4})\b/i,
          /\bstandard\s*[:\-–—]?\s*([0-9]{1,2}|[ivx]{1,4})\b/i,
          /कक्षा\s*[:\-–—]?\s*([0-9]{1,2}|[ivx]{1,4})/i,
        ]
      );

    if (
      explicit
    ) {

      return normalizeClassValue(
        explicit
      );

    }

    return "";

  };

  const extractSubjectValue = (
    text
  ) => {

    const explicit =
      extractMetadataField(
        text,
        [
          /(?:^|\n)\s*(?:subject|विषय)\s*[:\-–—]\s*([^\n|]+)/im,
          /\bsubject\s*[:\-–—]\s*([^\n|]+)/i,
          /विषय\s*[:\-–—]\s*([^\n|]+)/i,
        ]
      );

    if (
      explicit
    ) {

      return explicit
        .replace(
          /\b(?:class|grade|chapter|unit|test|exam|assessment)\b.*$/i,
          ""
        )
        .trim();

    }

    const subjects = [
      {
        pattern: /social\s*science|social\s*studies|सामाजिक\s*विज्ञान/i,
        value: "Social Science",
      },
      {
        pattern: /mathematics|maths|math|गणित/i,
        value: "Mathematics",
      },
      {
        pattern: /computer\s*science|computers|कंप्यूटर/i,
        value: "Computer Science",
      },
      {
        pattern: /science|विज्ञान/i,
        value: "Science",
      },
      {
        pattern: /english|अंग्रेज़ी|अंग्रेजी/i,
        value: "English",
      },
      {
        pattern: /hindi|हिंदी/i,
        value: "Hindi",
      },
      {
        pattern: /evs|environmental\s*studies|पर्यावरण/i,
        value: "EVS",
      },
      {
        pattern: /art|drawing|कला|चित्रकला/i,
        value: "Art",
      },
    ];

    for (
      const item of subjects
    ) {

      if (
        item.pattern.test(
          text
        )
      ) {

        return item.value;

      }

    }

    return "";

  };

  const extractChapterValue = (
    text
  ) => {

    const explicit =
      extractMetadataField(
        text,
        [
          /(?:^|\n)\s*(?:chapter|topic|lesson|unit|अध्याय|पाठ|इकाई)\s*[:\-–—]\s*([^\n|]+)/im,
          /\b(?:chapter|topic|lesson)\s+([^\n|,.;]+)/i,
          /(?:अध्याय|पाठ|इकाई)\s*[:\-–—]?\s*([^\n|,.;]+)/i,
        ]
      );

    if (
      explicit
    ) {

      return explicit
        .replace(
          /\s+(?:chapter|topic|lesson|unit|test|assessment|exam)\s*$/i,
          ""
        )
        .trim();

    }

    return "";

  };

  const isGenericTitle = (
    value
  ) => {

    const cleaned =
      cleanMetadataText(
        value
      )
        .toLowerCase();

    if (
      !cleaned
    ) {

      return true;

    }

    return (
      /^(?:hello|hi|hey|sure|okay|ok|of course|here(?:'s| is)|let(?:'s| me)|nyxora(?: ai)?)[!,.\s:]*/i.test(
        cleaned
      ) ||
      /^(?:hello|hi|hey)\s+nyxora/i.test(
        cleaned
      ) ||
      /^(?:sure|okay|ok),?\s+(?:here|i can|let me)/i.test(
        cleaned
      ) ||
      cleaned.length < 4
    );

  };

  const createWorkspaceTitle = (
    userRequest,
    content,
    subject,
    classValue,
    chapter
  ) => {

    const combined =
      `${String(userRequest || "")}\n${String(content || "")}`;

    const explicitTitle =
      extractMetadataField(
        combined,
        [
          /(?:^|\n)\s*(?:title|document\s*title|test\s*title|शीर्षक)\s*[:\-–—]\s*([^\n]+)/im,
        ]
      );

    if (
      explicitTitle &&
      !isGenericTitle(
        explicitTitle
      )
    ) {

      return explicitTitle.slice(
        0,
        80
      );

    }

    const lines =
      String(
        content || ""
      )
        .split("\n")
        .map(
          (line) =>
            cleanMetadataText(
              line
            )
        )
        .filter(Boolean);

    const heading =
      lines.find(
        (line) =>
          !isGenericTitle(line) &&
          (
            /\b(?:test|assessment|exam|examination|question\s*paper|questionnaire|unit\s*test|practice\s*test|sample\s*paper)\b/i.test(line) ||
            /\b(?:class|grade|standard)\s*[0-9ivx]+\b/i.test(line) ||
            /(?:परीक्षा|प्रश्न\s*पत्र|इकाई\s*परीक्षा|मूल्यांकन)/i.test(line)
          )
      );

    if (
      heading
    ) {

      return heading.slice(
        0,
        80
      );

    }

    const userLine =
      String(
        userRequest || ""
      )
        .split("\n")
        .map(
          (line) =>
            cleanMetadataText(
              line
            )
        )
        .find(
          (line) =>
            line &&
            !isGenericTitle(line)
        );

    if (
      userLine
    ) {

      const cleanedRequest =
        userLine
          .replace(
            /^(?:please|pls|can you|could you|i want you to|make|create|generate|give me|prepare|write)\s+/i,
            ""
          )
          .trim();

      if (
        cleanedRequest
      ) {

        return cleanedRequest.slice(
          0,
          80
        );

      }

    }

    const parts = [];

    if (
      classValue
    ) {

      parts.push(
        `Class ${classValue}`
      );

    }

    if (
      subject
    ) {

      parts.push(
        subject
      );

    }

    if (
      chapter
    ) {

      parts.push(
        chapter
      );

    }

    parts.push(
      selectedMode === "test"
        ? "Test"
        : selectedMode === "homework"
          ? "Homework"
          : selectedMode === "report"
            ? "Student Report"
            : selectedMode === "teacher"
              ? "Teacher Notes"
              : selectedMode === "doubt"
                ? "Doubt Solution"
                : "AI Generated Notes"
    );

    return parts.join(
      " — "
    ).slice(
      0,
      80
    );

  };

  // ====================================================
  // SAVE AI RESPONSE TO WORKSPACE
  // ====================================================

  const handleSaveToWorkspace =
    async ({
      content,
      notesImageRequested = false,
      notesImageTopic = "",
    }) => {

      const cleanContent =
        String(
          content || ""
        ).trim();

      if (
        !cleanContent
      ) {

        return false;

      }

      try {

        const userRequest =
          getLatestUserMessage();

        const combinedMetadataText =
          `${userRequest}\n${cleanContent}`;

        const extractedClass =
          extractClassValue(
            combinedMetadataText
          );

        const extractedSubject =
          extractSubjectValue(
            combinedMetadataText
          );

        const extractedChapter =
          extractChapterValue(
            combinedMetadataText
          );

        const selectedClassValue =
          normalizeClassValue(
            selectedClass?.grade ||
            selectedClass?.name ||
            ""
          );

        const hasExplicitClass =
          Boolean(
            extractedClass
          );

        const selectedClassMatches =
          Boolean(
            selectedClassValue &&
            extractedClass &&
            selectedClassValue ===
            extractedClass
          );

        const useSelectedWorkspaceTarget =
          Boolean(
            selectedClassId &&
            (
              !hasExplicitClass ||
              selectedClassMatches
            )
          );

        const resolvedClass =
          extractedClass ||
          (
            useSelectedWorkspaceTarget
              ? selectedClassValue
              : ""
          );

        const resolvedSubject =
          extractedSubject ||
          (
            useSelectedWorkspaceTarget
              ? selectedClass?.subject || ""
              : ""
          );

        const resolvedTitle =
          createWorkspaceTitle(
            userRequest,
            cleanContent,
            resolvedSubject,
            resolvedClass,
            extractedChapter
          );

        await saveAiDocument({

          title:
            resolvedTitle,

          type:
            getWorkspaceDocumentTypeForContent(
              cleanContent
            ),

          content:
            cleanContent,

          classId:
            useSelectedWorkspaceTarget
              ? selectedClassId
              : "",

          studentId:
            useSelectedWorkspaceTarget
              ? selectedStudentId
              : "",

          subject:
            resolvedSubject,

          chapter:
            extractedChapter,

          notesImageRequested:
            Boolean(
              notesImageRequested
            ),

          notesImageTopic:
            String(
              notesImageTopic || ""
            ).trim(),

          aiMode:
            selectedMode,

          aiMode:
            selectedMode,

        });

        return true;

      } catch (error) {

        console.error(
          "Save AI response to Workspace error:",
          error
        );

        alert(
          error?.message ||
          "Nyxora could not save this response to Workspace."
        );

        return false;

      }

    };

  // ====================================================
  // IMAGE STUDIO SAMPLE GALLERY
  // ====================================================

  const imageStudioSamples = [
    {
      title: "Anime character portrait",
      prompt: "beautiful anime character portrait, expressive eyes, detailed hair, cinematic lighting, vibrant colors",
      image: "/image-studio/anime-character.jpg",
    },
    {
      title: "Peaceful mountain landscape",
      prompt: "peaceful mountain landscape, alpine lake, snow covered mountains, pine forest, golden morning light",
      image: "/image-studio/mountain-landscape.jpg",
    },
    {
      title: "Modern house design",
      prompt: "modern luxury house design, large glass windows, warm interior lighting, landscaped garden, architectural photography",
      image: "/image-studio/modern-house.jpg",
    },
    {
      title: "A cute golden retriever",
      prompt: "cute golden retriever puppy, happy expression, soft natural light, detailed fur, professional pet photography",
      image: "/image-studio/golden-retriever.jpg",
    },
  ];

  const imageStudioSidebarSamples = [
    {
      title: "Cyberpunk city",
      prompt: "cinematic cyberpunk city at night, neon signs, rainy street, glowing reflections, futuristic skyscrapers",
      image: "/image-studio/cyberpunk-city.jpg",
    },
    {
      title: "Cute cat",
      prompt: "cute orange tabby kitten, soft natural light, detailed fur, gentle expression, professional pet photography",
      image: "/image-studio/cute-cat.jpg",
    },
  ];

  // ====================================================
  // IMAGE STUDIO UI
  // ====================================================

  if (imageStudio) {

    const imageChats = chats || [];

    const imageStudioMessages =
      (activeChat?.messages || []).filter(
        (message) => {
          const content = String(
            message?.message || ""
          ).trim();

          if (
            message?.role === "assistant" &&
            /welcome to nyxora ai/i.test(content) &&
            /how can i help you today/i.test(content)
          ) {
            return false;
          }

          if (
            message?.role === "assistant" &&
            /^(hello|hi|hey)\s*[👋!,.]*$/i.test(content)
          ) {
            return false;
          }

          return true;
        }
      );

    const hasGeneratedImage =
      imageStudioMessages.some(
        (message) =>
          message?.role === "assistant" &&
          Boolean(
            String(
              message?.image ||
              message?.imageUrl ||
              ""
            ).trim()
          )
      );

    const sampleImages = imageStudioSamples;

    return (

      <div className="flex h-[100dvh] w-full min-w-0 overflow-hidden bg-[#030615] text-white">

        {/* ================================================== */}
        {/* IMAGE STUDIO SIDEBAR                              */}
        {/* ================================================== */}

        <aside className="hidden w-[310px] shrink-0 flex-col border-r border-white/[0.07] bg-[#050918] lg:flex">

          <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-5">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#0a1020] shadow-[0_0_28px_rgba(139,92,246,0.3)]">
              <img
                src="/nyxora-logo.svg"
                alt="Nyxora AI"
                className="h-full w-full object-contain p-1"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                Nyxora AI
              </p>

              <p className="text-[10px] text-slate-500">
                Image Studio
              </p>
            </div>

          </div>


          <div className="p-4">

            <div className="mb-3 flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0a1020] px-3">

              <span className="text-base text-slate-500">
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search image chats..."
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
              />

            </div>


            <button
              type="button"
              onClick={handleNewChat}
              className="group relative isolate flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 px-4 text-sm font-bold text-white shadow-[0_0_24px_rgba(139,92,246,0.22)] transition hover:brightness-110"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-80 transition-all duration-700 group-hover:left-[120%]"
              />
              <span className="relative z-10 text-xl leading-none">+</span>
              <span className="relative z-10">New Image Chat</span>
            </button>

          </div>


          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">

            <p className="px-2 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Recent
            </p>


            <div className="space-y-2">
              {imageStudioSidebarSamples.map((chat) => (
                <button
                  key={chat.title}
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("nyxora:image-studio-suggestion", {
                        detail: chat.prompt,
                      })
                    );
                  }}
                  className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition hover:border-white/[0.08] hover:bg-white/[0.035]"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0b1020]">
                    <img
                      src={chat.image}
                      alt={chat.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-200">
                      {chat.title}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-slate-600">
                      Image Studio
                    </p>
                  </div>
                </button>
              ))}
            </div>

          </div>

          <div className="m-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0a1024] to-[#07111c] p-4 shadow-[0_0_25px_rgba(99,102,241,0.05)]">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0a1020] shadow-[0_0_18px_rgba(139,92,246,0.2)]">
                <img
                  src="/nyxora-logo.svg"
                  alt="Nyxora AI"
                  className="h-full w-full object-contain p-1"
                />
              </div>

              <div>
                <p className="text-xs font-bold text-white">
                  Nyxora AI
                </p>

                <p className="text-[10px] text-slate-500">
                  Your Intelligent Workspace
                </p>
              </div>

            </div>

          </div>

        </aside>


        {/* ================================================== */}
        {/* IMAGE STUDIO MAIN                                 */}
        {/* ================================================== */}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

          <header className="flex min-h-[82px] shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] bg-[#040817]/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-7">

            <div className="flex min-w-0 items-center gap-4">

              <button
                type="button"
                onClick={() =>
                  navigate("/chat")
                }
                className="flex h-14 shrink-0 items-center gap-2 rounded-2xl border border-violet-400/35 bg-gradient-to-r from-violet-500/[0.14] to-cyan-500/[0.08] px-6 text-base font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.12)] transition hover:border-violet-400/70 hover:bg-violet-500/[0.18]"
                aria-label="Back to AI Chat"
              >
                <span className="text-2xl leading-none">
                  ←
                </span>

                AI Chat
              </button>


              <div className="min-w-0">

                <div className="flex items-center gap-2">

                  <span className="truncate text-xl font-bold text-white sm:text-2xl">
                    Nyxora AI{" "}
                    <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                      Image Studio
                    </span>
                  </span>

                  <span className="hidden rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-fuchsia-300 sm:inline-flex">
                    IMAGE AI
                  </span>

                </div>

                <p className="text-[11px] text-slate-500 sm:text-xs">
                  Generate, edit and refine images with AI
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={handleNewChat}
              className="group relative isolate flex h-14 shrink-0 items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 px-5 text-sm font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.24)] transition hover:brightness-110 sm:px-7 sm:text-base"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-80 transition-all duration-700 group-hover:left-[120%]"
              />
              <span className="relative z-10 text-2xl leading-none">
                +
              </span>

              <span className="relative z-10 hidden sm:inline">
                New Image Chat
              </span>

              <span className="relative z-10 sm:hidden">
                New Chat
              </span>

            </button>

          </header>


          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-7">

            <div className="mx-auto flex w-full max-w-[1420px] flex-col gap-5">


              {/* ================================================== */}
              {/* TOP IMAGE PROMPT BAR                              */}
              {/* ================================================== */}

              <section className="relative z-10 px-1 pb-1">

                <ChatInput
                  onSend={send}
                  onStop={stop}
                  loading={isThinking}
                  voiceMode={voiceMode}
                  onVoiceModeChange={
                    handleVoiceModeChange
                  }
                  voiceRestartSignal={
                    voiceRestartSignal
                  }
                  attachmentError={
                    attachmentError
                  }
                  onClearAttachmentError={
                    clearAttachmentError
                  }
                  imageStudio={true}
                />


                <div className="mt-3 flex flex-wrap gap-2">

                  {[
                    "Futuristic City",
                    "Anime Style",
                    "Realistic Portrait",
                    "Nature Landscape",
                    "Logo Design",
                    "Interior Design",
                  ].map(
                    (suggestion) => (

                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {

                          window.dispatchEvent(
                            new CustomEvent(
                              "nyxora:image-studio-suggestion",
                              {
                                detail:
                                  suggestion,
                              }
                            )
                          );

                        }}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2 text-[11px] font-medium text-slate-400 transition hover:border-violet-400/35 hover:bg-violet-500/[0.08] hover:text-white"
                      >
                        {suggestion}
                      </button>

                    )
                  )}

                </div>

              </section>


              {/* ================================================== */}
              {/* RESPONSE / IMAGE STUDIO CANVAS                     */}
              {/* ================================================== */}

              <section className="rounded-2xl border border-white/[0.08] bg-[#050918]/85 p-4 shadow-[0_0_42px_rgba(99,102,241,0.07)] sm:p-6">
                {hasGeneratedImage || isThinking ? (
                  <div className="w-full">
                    <div className="flex w-full flex-col gap-5">
                      {imageStudioMessages.map((msg, index) => {
                        const isLastMessage =
                          index === imageStudioMessages.length - 1;

                        const isThinkingMessage =
                          isThinking &&
                          isLastMessage &&
                          msg.role === "assistant" &&
                          !String(msg.message || "").trim() &&
                          !String(
                            msg.image ||
                            msg.imageUrl ||
                            ""
                          ).trim();

                        return (
                          <div
                            key={msg.id}
                            className="w-full min-w-0"
                          >
                            <ChatMessage
                              message={msg}
                              isThinking={isThinkingMessage}
                              isGenerating={
                                isThinking &&
                                isLastMessage &&
                                msg.role === "assistant"
                              }
                              isLastMessage={isLastMessage}
                              voiceMode={voiceMode}
                              onSpeechEnd={handleVoiceSpeechEnd}
                              thinkingText={
                                isThinkingMessage
                                  ? thinkingText
                                  : ""
                              }
                              onRegenerate={handleRegenerate}
                              onEdit={handleEdit}
                              onSaveToWorkspace={handleSaveToWorkspace}
                            />
                          </div>
                        );
                      })}

                      {isThinking &&
                        !imageStudioMessages.some(
                          (msg) =>
                            msg?.role === "assistant" &&
                            !String(msg?.message || "").trim() &&
                            !String(
                              msg?.image ||
                              msg?.imageUrl ||
                              ""
                            ).trim()
                        ) && (
                          <div className="w-full min-w-0">
                            <ChatMessage
                              message={{
                                id: "image-studio-thinking",
                                role: "assistant",
                                message: "",
                              }}
                              isThinking={true}
                              isGenerating={true}
                              isLastMessage={true}
                              voiceMode={voiceMode}
                              onSpeechEnd={handleVoiceSpeechEnd}
                              thinkingText={thinkingText || "Thinking..."}
                              onRegenerate={handleRegenerate}
                              onEdit={handleEdit}
                              onSaveToWorkspace={handleSaveToWorkspace}
                            />
                          </div>
                        )}

                      <div ref={bottomRef} />
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[440px] flex-col items-center justify-center rounded-xl border border-white/[0.04] bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,0.08),transparent_42%)] px-4 py-10 text-center">
                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-400/25 bg-gradient-to-br from-fuchsia-500/[0.13] via-violet-500/[0.12] to-cyan-500/[0.08] text-4xl shadow-[0_0_40px_rgba(139,92,246,0.16)]">
                      ✧
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                      Bring Your{" "}
                      <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                        Ideas to Life
                      </span>
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                      Describe what you want to see and let Nyxora AI create amazing images for you.
                    </p>
                    <div className="mt-9 grid w-full max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
                      {[
                        ["▧", "High Quality", "Stunning, detailed images"],
                        ["ϟ", "Multiple Styles", "From realistic to artistic"],
                        ["⌁", "Edit & Refine", "Use your images as reference"],
                        ["◷", "Save & Organize", "Keep your creations"],
                      ].map(([icon, title, description]) => (
                        <div key={title} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/[0.08] text-xl text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.08)]">
                            {icon}
                          </div>
                          <p className="text-sm font-bold text-white">{title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* SAMPLE IMAGE FOOTER — separate from the generated conversation */}
              <section className="w-full pt-2">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Try These Examples</h3>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      Start with a sample and customize the prompt.
                    </p>
                  </div>
                  <span className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-700 sm:block">
                    Ideas → Images → Possibilities
                  </span>
                </div>
                <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4">
                  {sampleImages.map((sample) => (
                    <button
                      key={sample.title}
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent("nyxora:image-studio-suggestion", {
                            detail: sample.prompt,
                          })
                        );
                      }}
                      className="group w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080d1a] text-left shadow-[0_0_22px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:border-violet-400/45 hover:shadow-[0_0_30px_rgba(139,92,246,0.12)]"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-[#0a1020]">
                        <img
                          src={sample.image}
                          alt={sample.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="px-3.5 py-3">
                        <p className="truncate text-xs font-semibold text-slate-200">
                          {sample.title}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>


            </div>

          </main>

        </div>

      </div>

    );

  }


  // NORMAL CHAT UI
  // ====================================================

  return (

    <div
      className="
        flex
        h-[100dvh]
        w-full
        min-w-0
        overflow-hidden
        bg-[#050816]
      "
    >

      <ChatSidebar
        chats={
          chats
        }

        activeChatId={
          activeChatId
        }

        onNewChat={
          handleNewChat
        }

        onSelectChat={
          handleSelectChat
        }

        onDeleteChat={
          handleDeleteChat
        }

        onRenameChat={
          handleRenameChat
        }
      />


      <div
        className="
          flex
          min-w-0
          flex-1
          flex-col
          overflow-hidden
        "
      >

        <ChatHeader
          selectedMode={
            selectedMode
          }

          onModeChange={
            handleModeChange
          }

          activeChat={
            activeChat
          }

          chatCount={
            chats.length
          }

          onRenameConversation={
            handleRenameConversation
          }

          onClearConversation={
            handleClearConversation
          }

          onDeleteConversation={
            handleDeleteConversation
          }

          isThinking={
            isThinking
          }

          classes={
            classes
          }

          students={
            students
          }

          selectedClassId={
            selectedClassId
          }

          selectedStudentId={
            selectedStudentId
          }

          onClassChange={
            handleClassChange
          }

          onStudentChange={
            setSelectedStudentId
          }

          workspaceLoading={
            workspaceLoading
          }
        />


        <div
          className="
            flex-1
            overflow-y-auto
            px-8
            py-8
          "
        >

          {activeChat
            ?.messages
            ?.map(
              (msg, index) => {

                const messages =
                  activeChat?.messages || [];

                const isLastMessage =
                  index ===
                  messages.length - 1;

                const isThinkingMessage =
                  isThinking &&
                  isLastMessage &&
                  msg.role === "assistant" &&
                  !String(
                    msg.message || ""
                  ).trim();

                return (

                  <ChatMessage
                    key={
                      msg.id
                    }

                    message={
                      msg
                    }

                    isThinking={
                      isThinkingMessage
                    }

                    isGenerating={
                      isThinking &&
                      isLastMessage &&
                      msg.role === "assistant"
                    }

                    isLastMessage={
                      isLastMessage
                    }

                    voiceMode={
                      voiceMode
                    }

                    onSpeechEnd={
                      handleVoiceSpeechEnd
                    }

                    thinkingText={
                      isThinkingMessage
                        ? thinkingText
                        : ""
                    }

                    onRegenerate={
                      handleRegenerate
                    }

                    onEdit={
                      handleEdit
                    }

                    onSaveToWorkspace={
                      handleSaveToWorkspace
                    }
                  />

                );

              }
            )}


          <div
            ref={
              bottomRef
            }
          />

        </div>


        <ChatInput
          onSend={
            send
          }

          onStop={
            stop
          }

          loading={
            isThinking
          }

          voiceMode={
            voiceMode
          }

          onVoiceModeChange={
            handleVoiceModeChange
          }

          voiceRestartSignal={
            voiceRestartSignal
          }

          attachmentError={
            attachmentError
          }

          onClearAttachmentError={
            clearAttachmentError
          }

          jarvisMode={jarvisMode}

          onJarvisModeChange={
            handleJarvisModeChange
          }

          imageStudio={imageStudio}
        />

      </div>

    </div>

  );

}


// ======================================================
// IMAGE STUDIO — FULLY EPHEMERAL UI STATE
// ======================================================
//
// Image Studio intentionally does NOT use useChatHistory.
// Its session lives only in React state. The existing useChat
// generation pipeline is kept for the next step where its
// persistence calls will be removed from Image Studio.
//

function ImageStudioPage() {

  const navigate =
    useNavigate();

  const [
    voiceMode,
    setVoiceMode,
  ] = useState(false);

  const [
    voiceRestartSignal,
    setVoiceRestartSignal,
  ] = useState(0);

  const previousThinkingForVoiceRef =
    useRef(false);

  const handleVoiceModeChange =
    (enabled) => {

      setVoiceMode(
        Boolean(enabled)
      );

      if (!enabled) {
        setVoiceRestartSignal(0);
      }

    };

  const handleVoiceSpeechEnd =
    () => {

      if (!voiceMode) {
        return;
      }

      setVoiceRestartSignal(
        (value) => value + 1
      );

    };

  // ------------------------------------------------------
  // EPHEMERAL IMAGE SESSION
  // ------------------------------------------------------

  const createImageStudioSession = () => ({
    id:
      `image-studio-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    title:
      "Image Studio",
    messages:
      [],
  });

  const [
    imageStudioChats,
    setImageStudioChats,
  ] = useState(
    () => [
      createImageStudioSession(),
    ]
  );

  const [
    activeImageStudioChatId,
    setActiveImageStudioChatId,
  ] = useState("");

  useEffect(() => {

    if (
      activeImageStudioChatId ||
      !imageStudioChats[0]?.id
    ) {
      return;
    }

    setActiveImageStudioChatId(
      imageStudioChats[0].id
    );

  }, [
    activeImageStudioChatId,
    imageStudioChats,
  ]);

  const activeImageStudioChat =
    imageStudioChats.find(
      (chat) =>
        chat.id ===
        activeImageStudioChatId
    ) || null;

  const {
    send,
    regenerate,
    editMessage,
    stop,
    isThinking,
    thinkingText,
    attachmentError,
    clearAttachmentError,
  } = useChat({

    activeChatId:
      activeImageStudioChatId,

    chats:
      imageStudioChats,

    setChats:
      setImageStudioChats,

    selectedMode:
      "normal",

    workspaceContext:
      null,

    imageStudio:
      true,

  });

  useEffect(() => {

    const wasThinking =
      previousThinkingForVoiceRef.current;

    previousThinkingForVoiceRef.current =
      Boolean(isThinking);

    if (
      !voiceMode ||
      !wasThinking ||
      isThinking
    ) {
      return;
    }

    const messages =
      activeImageStudioChat?.messages || [];

    const lastMessage =
      messages[messages.length - 1];

    if (
      lastMessage?.role === "assistant" &&
      String(
        lastMessage?.message || ""
      ).trim()
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {

        if (
          voiceMode &&
          !isThinking
        ) {
          setVoiceRestartSignal(
            (value) => value + 1
          );
        }

      }, 500);

    return () => {
      window.clearTimeout(timer);
    };

  }, [
    voiceMode,
    isThinking,
    activeImageStudioChat?.messages,
  ]);

  const bottomRef =
    useRef(null);

  useEffect(() => {

    bottomRef.current
      ?.scrollIntoView({
        behavior:
          "smooth",
      });

  }, [
    activeImageStudioChat?.messages,
    isThinking,
  ]);

  const handleNewImageChat =
    () => {

      clearAttachmentError();

      const nextChat =
        createImageStudioSession();

      setImageStudioChats(
        [nextChat]
      );

      setActiveImageStudioChatId(
        nextChat.id
      );

    };

  const handleRegenerate =
    () => {

      regenerate();

    };

  const handleEdit =
    (
      messageId,
      newText,
      attachmentOptions
    ) => {

      return editMessage(
        messageId,
        newText,
        attachmentOptions
      );

    };

  const handleSaveToWorkspace =
    async () => false;

  // IMAGE STUDIO SAMPLE GALLERY
  // ====================================================

  const imageStudioSamples = [
    {
      title: "Anime character portrait",
      prompt: "beautiful anime character portrait, expressive eyes, detailed hair, cinematic lighting, vibrant colors",
      image: "/image-studio/anime-character.jpg",
    },
    {
      title: "Peaceful mountain landscape",
      prompt: "peaceful mountain landscape, alpine lake, snow covered mountains, pine forest, golden morning light",
      image: "/image-studio/mountain-landscape.jpg",
    },
    {
      title: "Modern house design",
      prompt: "modern luxury house design, large glass windows, warm interior lighting, landscaped garden, architectural photography",
      image: "/image-studio/modern-house.jpg",
    },
    {
      title: "A cute golden retriever",
      prompt: "cute golden retriever puppy, happy expression, soft natural light, detailed fur, professional pet photography",
      image: "/image-studio/golden-retriever.jpg",
    },
  ];

  const imageStudioSidebarSamples = [
    {
      title: "Cyberpunk city",
      prompt: "cinematic cyberpunk city at night, neon signs, rainy street, glowing reflections, futuristic skyscrapers",
      image: "/image-studio/cyberpunk-city.jpg",
    },
    {
      title: "Cute cat",
      prompt: "cute orange tabby kitten, soft natural light, detailed fur, gentle expression, professional pet photography",
      image: "/image-studio/cute-cat.jpg",
    },
  ];

  // ====================================================
  // IMAGE STUDIO UI
  // ====================================================

  const imageChats = imageStudioChats || [];

  const imageStudioMessages =
    (activeImageStudioChat?.messages || []).filter(
      (message) => {
        const content = String(
          message?.message || ""
        ).trim();

        if (
          message?.role === "assistant" &&
          /welcome to nyxora ai/i.test(content) &&
          /how can i help you today/i.test(content)
        ) {
          return false;
        }

        if (
          message?.role === "assistant" &&
          /^(hello|hi|hey)\s*[👋!,.]*$/i.test(content)
        ) {
          return false;
        }

        return true;
      }
    );

  const hasGeneratedImage =
    imageStudioMessages.some(
      (message) =>
        message?.role === "assistant" &&
        Boolean(
          String(
            message?.image ||
            message?.imageUrl ||
            ""
          ).trim()
        )
    );

  const sampleImages = imageStudioSamples;

  return (

    <div className="flex h-[100dvh] w-full min-w-0 overflow-hidden bg-[#030615] text-white">

      {/* ================================================== */}
      {/* IMAGE STUDIO SIDEBAR                              */}
      {/* ================================================== */}

      <aside className="hidden w-[310px] shrink-0 flex-col border-r border-white/[0.07] bg-[#050918] lg:flex">

        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-5">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#0a1020] shadow-[0_0_28px_rgba(139,92,246,0.3)]">
            <img
              src="/nyxora-logo.svg"
              alt="Nyxora AI"
              className="h-full w-full object-contain p-1"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              Nyxora AI
            </p>

            <p className="text-[10px] text-slate-500">
              Image Studio
            </p>
          </div>

        </div>


        <div className="p-4">

          <div className="mb-3 flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0a1020] px-3">

            <span className="text-base text-slate-500">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search image chats..."
              className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
            />

          </div>


          <button
            type="button"
            onClick={handleNewImageChat}
            className="group relative isolate flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 px-4 text-sm font-bold text-white shadow-[0_0_24px_rgba(139,92,246,0.22)] transition hover:brightness-110"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-80 transition-all duration-700 group-hover:left-[120%]"
            />
            <span className="relative z-10 text-xl leading-none">+</span>
            <span className="relative z-10">New Image Chat</span>
          </button>

        </div>


        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">

          <p className="px-2 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Recent
          </p>


          <div className="space-y-2">
            {imageStudioSidebarSamples.map((chat) => (
              <button
                key={chat.title}
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("nyxora:image-studio-suggestion", {
                      detail: chat.prompt,
                    })
                  );
                }}
                className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition hover:border-white/[0.08] hover:bg-white/[0.035]"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0b1020]">
                  <img
                    src={chat.image}
                    alt={chat.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-200">
                    {chat.title}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-slate-600">
                    Image Studio
                  </p>
                </div>
              </button>
            ))}
          </div>

        </div>

        <div className="m-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0a1024] to-[#07111c] p-4 shadow-[0_0_25px_rgba(99,102,241,0.05)]">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0a1020] shadow-[0_0_18px_rgba(139,92,246,0.2)]">
              <img
                src="/nyxora-logo.svg"
                alt="Nyxora AI"
                className="h-full w-full object-contain p-1"
              />
            </div>

            <div>
              <p className="text-xs font-bold text-white">
                Nyxora AI
              </p>

              <p className="text-[10px] text-slate-500">
                Your Intelligent Workspace
              </p>
            </div>

          </div>

        </div>

      </aside>


      {/* ================================================== */}
      {/* IMAGE STUDIO MAIN                                 */}
      {/* ================================================== */}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        <header className="flex min-h-[82px] shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] bg-[#040817]/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-7">

          <div className="flex min-w-0 items-center gap-4">

            <button
              type="button"
              onClick={() =>
                navigate("/chat")
              }
              className="flex h-14 shrink-0 items-center gap-2 rounded-2xl border border-violet-400/35 bg-gradient-to-r from-violet-500/[0.14] to-cyan-500/[0.08] px-6 text-base font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.12)] transition hover:border-violet-400/70 hover:bg-violet-500/[0.18]"
              aria-label="Back to AI Chat"
            >
              <span className="text-2xl leading-none">
                ←
              </span>

              AI Chat
            </button>


            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <span className="truncate text-xl font-bold text-white sm:text-2xl">
                  Nyxora AI{" "}
                  <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                    Image Studio
                  </span>
                </span>

                <span className="hidden rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-fuchsia-300 sm:inline-flex">
                  IMAGE AI
                </span>

              </div>

              <p className="text-[11px] text-slate-500 sm:text-xs">
                Generate, edit and refine images with AI
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={handleNewImageChat}
            className="group relative isolate flex h-14 shrink-0 items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 px-5 text-sm font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.24)] transition hover:brightness-110 sm:px-7 sm:text-base"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-80 transition-all duration-700 group-hover:left-[120%]"
            />
            <span className="relative z-10 text-2xl leading-none">
              +
            </span>

            <span className="relative z-10 hidden sm:inline">
              New Image Chat
            </span>

            <span className="relative z-10 sm:hidden">
              New Chat
            </span>

          </button>

        </header>


        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-7">

          <div className="mx-auto flex w-full max-w-[1420px] flex-col gap-5">


            {/* ================================================== */}
            {/* TOP IMAGE PROMPT BAR                              */}
            {/* ================================================== */}

            <section className="relative z-10 px-1 pb-1">

              <ChatInput
                onSend={send}
                onStop={stop}
                loading={isThinking}
                voiceMode={voiceMode}
                onVoiceModeChange={
                  handleVoiceModeChange
                }
                voiceRestartSignal={
                  voiceRestartSignal
                }
                attachmentError={
                  attachmentError
                }
                onClearAttachmentError={
                  clearAttachmentError
                }
                imageStudio={true}
              />


              <div className="mt-3 flex flex-wrap gap-2">

                {[
                  "Futuristic City",
                  "Anime Style",
                  "Realistic Portrait",
                  "Nature Landscape",
                  "Logo Design",
                  "Interior Design",
                ].map(
                  (suggestion) => (

                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {

                        window.dispatchEvent(
                          new CustomEvent(
                            "nyxora:image-studio-suggestion",
                            {
                              detail:
                                suggestion,
                            }
                          )
                        );

                      }}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2 text-[11px] font-medium text-slate-400 transition hover:border-violet-400/35 hover:bg-violet-500/[0.08] hover:text-white"
                    >
                      {suggestion}
                    </button>

                  )
                )}

              </div>

            </section>


            {/* ================================================== */}
            {/* RESPONSE / IMAGE STUDIO CANVAS                     */}
            {/* ================================================== */}

            <section className="rounded-2xl border border-white/[0.08] bg-[#050918]/85 p-4 shadow-[0_0_42px_rgba(99,102,241,0.07)] sm:p-6">
              {hasGeneratedImage || isThinking ? (
                <div className="w-full">
                  <div className="flex w-full flex-col gap-5">
                    {imageStudioMessages.map((msg, index) => {
                      const isLastMessage =
                        index === imageStudioMessages.length - 1;

                      const isThinkingMessage =
                        isThinking &&
                        isLastMessage &&
                        msg.role === "assistant" &&
                        !String(msg.message || "").trim() &&
                        !String(
                          msg.image ||
                          msg.imageUrl ||
                          ""
                        ).trim();

                      return (
                        <div
                          key={msg.id}
                          className="w-full min-w-0"
                        >
                          <ChatMessage
                            message={msg}
                            isThinking={isThinkingMessage}
                            isGenerating={
                              isThinking &&
                              isLastMessage &&
                              msg.role === "assistant"
                            }
                            isLastMessage={isLastMessage}
                            voiceMode={voiceMode}
                            onSpeechEnd={handleVoiceSpeechEnd}
                            thinkingText={
                              isThinkingMessage
                                ? thinkingText
                                : ""
                            }
                            onRegenerate={handleRegenerate}
                            onEdit={handleEdit}
                            onSaveToWorkspace={handleSaveToWorkspace}
                          />
                        </div>
                      );
                    })}

                    <div ref={bottomRef} />
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[440px] flex-col items-center justify-center rounded-xl border border-white/[0.04] bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,0.08),transparent_42%)] px-4 py-10 text-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-400/25 bg-gradient-to-br from-fuchsia-500/[0.13] via-violet-500/[0.12] to-cyan-500/[0.08] text-4xl shadow-[0_0_40px_rgba(139,92,246,0.16)]">
                    ✧
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    Bring Your{" "}
                    <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                      Ideas to Life
                    </span>
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                    Describe what you want to see and let Nyxora AI create amazing images for you.
                  </p>
                  <div className="mt-9 grid w-full max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                      ["▧", "High Quality", "Stunning, detailed images"],
                      ["ϟ", "Multiple Styles", "From realistic to artistic"],
                      ["⌁", "Edit & Refine", "Use your images as reference"],
                      ["◷", "Save & Organize", "Keep your creations"],
                    ].map(([icon, title, description]) => (
                      <div key={title} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/[0.08] text-xl text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.08)]">
                          {icon}
                        </div>
                        <p className="text-sm font-bold text-white">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* SAMPLE IMAGE FOOTER — separate from the generated conversation */}
            <section className="w-full pt-2">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Try These Examples</h3>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Start with a sample and customize the prompt.
                  </p>
                </div>
                <span className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-700 sm:block">
                  Ideas → Images → Possibilities
                </span>
              </div>
              <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4">
                {sampleImages.map((sample) => (
                  <button
                    key={sample.title}
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("nyxora:image-studio-suggestion", {
                          detail: sample.prompt,
                        })
                      );
                    }}
                    className="group w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080d1a] text-left shadow-[0_0_22px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:border-violet-400/45 hover:shadow-[0_0_30px_rgba(139,92,246,0.12)]"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-[#0a1020]">
                      <img
                        src={sample.image}
                        alt={sample.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="px-3.5 py-3">
                      <p className="truncate text-xs font-semibold text-slate-200">
                        {sample.title}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>


          </div>

        </main>

      </div>

    </div>

  );

}

// ======================================================
// ROUTER ENTRY
// ======================================================

export default function Chat({
  imageStudio = false,
}) {

  if (imageStudio) {
    return <ImageStudioPage />;
  }

  return <NormalChatPage />;
}
