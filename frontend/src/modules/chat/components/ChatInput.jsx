import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Send,
  Square,
  X,
  Mic,
  MicOff,
  Monitor,
  AlertTriangle,
  FileText,
  File,
  Image as ImageIcon,
  Sparkles,
  Download,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import FileUploadButton from "./FileUploadButton";
import useScreenUnderstanding from "../hooks/useScreenUnderstanding";

import {
  getJarvisSuggestions,
  isJarvisActivationCommand,
  isJarvisDeactivationCommand,
  stripJarvisWakePrefix,
} from "../utils/jarvisMode";


export default function ChatInput({
  onSend,
  onStop,
  loading,

  attachmentError = "",

  onClearAttachmentError,

  // Image Studio mode keeps the existing Chat composer intact while
  // enabling the dedicated image-generation experience.
  imageStudio = false,

  // Step 39 — Real-time voice conversation
  voiceMode = false,
  onVoiceModeChange,
  voiceRestartSignal = 0,

  jarvisMode = false,
  onJarvisModeChange,
}) {

  const navigate =
    useNavigate();

  const [
    message,
    setMessage,
  ] = useState("");

  const textareaRef =
  useRef(null);

  useEffect(() => {

  const textarea =
    textareaRef.current;

  if (!textarea) {
    return;
  }

  textarea.style.height =
    "auto";

  const maxHeight =
    220;

  textarea.style.height =
    `${Math.min(
      textarea.scrollHeight,
      maxHeight
    )}px`;

  textarea.style.overflowY =
    textarea.scrollHeight >
    maxHeight
      ? "auto"
      : "hidden";

}, [message]);

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState([]);


  const [
    localAttachmentError,
    setLocalAttachmentError,
  ] = useState("");


  const [
    isListening,
    setIsListening,
  ] = useState(false);

  const [
    voiceStarting,
    setVoiceStarting,
  ] = useState(false);


  const recognitionRef =
    useRef(null);


  const voiceBaseMessageRef =
    useRef("");


  const voiceTranscriptRef =
    useRef("");


  const voiceFinalMessageRef =
    useRef("");


  const voiceModeRef =
    useRef(
      Boolean(voiceMode)
    );

  const jarvisModeRef =
    useRef(
      Boolean(jarvisMode)
    );

  const [
    jarvisSuggestions,
    setJarvisSuggestions,
  ] = useState([]);


  useEffect(() => {
    voiceModeRef.current =
      Boolean(voiceMode);
  }, [voiceMode]);

  useEffect(() => {
    jarvisModeRef.current =
      Boolean(jarvisMode);

    if (!jarvisMode) {
      setJarvisSuggestions([]);
    } else if (jarvisSuggestions.length === 0) {
      setJarvisSuggestions(getJarvisSuggestions());
    }
  }, [jarvisMode]);


  const [
    voiceError,
    setVoiceError,
  ] = useState("");

  const { capture: captureScreen, error: screenError } = useScreenUnderstanding();

  // ====================================================
  // AI IMAGE GENERATION
  // ====================================================
  // This uses Nyxora's dedicated /api/ai-image route.
  // It is intentionally separate from the existing Pexels
  // image systems used by PPT generation and Notes.
  // ====================================================

  const [showImageGenerator, setShowImageGenerator] =
    useState(false);

  const [imagePrompt, setImagePrompt] =
    useState("");

  const [generatedImage, setGeneratedImage] =
    useState("");

  const [generatedImageMeta, setGeneratedImageMeta] =
    useState(null);

  const [imageGenerationLoading, setImageGenerationLoading] =
    useState(false);

  const [imageGenerationError, setImageGenerationError] =
    useState("");

  // Image Studio model selection.
  // Image Studio currently uses Cloudflare Workers AI.
  // Auto and FLUX.2 Klein 4B both resolve to the verified
  // Cloudflare FLUX.2 Klein 4B model on the backend.
  const IMAGE_STUDIO_MODELS = [
    {
      id: "auto",
      name: "Auto",
      description: "Nyxora uses the available Cloudflare image model",
    },
    {
      id: "klein",
      name: "FLUX.2 Klein 4B",
      description: "Cloudflare Workers AI generation and image editing",
    },
  ];

  const [selectedImageModel, setSelectedImageModel] =
    useState("auto");

  // Image Studio owns the image generator UI. Normal Chat keeps the
  // existing optional image-generator button/flow for compatibility.
  useEffect(() => {
    if (imageStudio) {
      setShowImageGenerator(true);
    }
  }, [imageStudio]);

  useEffect(() => {
    if (!imageStudio) {
      return undefined;
    }

    const handleSuggestion = (event) => {
      const suggestion = String(event?.detail || "").trim();
      if (!suggestion) return;

      setImagePrompt(suggestion);
      setImageGenerationError("");
    };

    window.addEventListener(
      "nyxora:image-studio-suggestion",
      handleSuggestion
    );

    return () => {
      window.removeEventListener(
        "nyxora:image-studio-suggestion",
        handleSuggestion
      );
    };
  }, [imageStudio]);

  const apiBaseUrl =
    String(
      import.meta.env.VITE_API_URL ||
        "http://localhost:5000"
    ).replace(/\/$/, "");

  const handleGenerateImage = async (event) => {
    event?.preventDefault?.();

    const prompt =
      imagePrompt.trim();

    if (!prompt || imageGenerationLoading) {
      return;
    }

    setImageGenerationLoading(true);
    setImageGenerationError("");
    setGeneratedImage("");
    setGeneratedImageMeta(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/ai-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (
        !response.ok ||
        !data?.success ||
        !data?.image
      ) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Image generation failed (${response.status}).`
        );
      }

      setGeneratedImage(data.image);

      setGeneratedImageMeta({
        provider: data.provider || "nyxora",
        model: data.model || "auto",
      });
    } catch (error) {
      console.error(
        "Nyxora AI image generation error:",
        error
      );

      setImageGenerationError(
        error?.message ||
          "Unable to generate the image. Please try again."
      );
    } finally {
      setImageGenerationLoading(false);
    }
  };

  const handleDownloadGeneratedImage = () => {
    if (!generatedImage) {
      return;
    }

    const link =
      document.createElement("a");

    link.href =
      generatedImage;

    link.download =
      `nyxora-generated-${Date.now()}.jpg`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const clearImageGenerator = () => {
    setImagePrompt("");
    setGeneratedImage("");
    setGeneratedImageMeta(null);
    setImageGenerationError("");
  };

  const handleScreenCapture = async () => {
    setLocalAttachmentError("");
    const screenshot = await captureScreen();
    if (!screenshot) {
      if (screenError) setLocalAttachmentError(screenError);
      return;
    }
    handleFileSelect(screenshot, [screenshot]);
  };


  // ====================================================
  // FILE TYPE HELPERS
  // ====================================================

  const IMAGE_ATTACHMENT_LIMIT =
    5;


  const DOCUMENT_ATTACHMENT_LIMIT =
    3;


  const selectedFile =
    selectedFiles[0] ||
    null;


  const isPdf =
    selectedFile &&
    (
      selectedFile.type ===
        "application/pdf" ||
      selectedFile.name
        ?.toLowerCase()
        .endsWith(".pdf")
    );


  const isImage =
    selectedFile?.type
      ?.startsWith(
        "image/"
      );


  const isImageFile = (
    file
  ) => {

    return Boolean(
      file?.type?.startsWith(
        "image/"
      )
    );

  };


  const getFileKey = (
    file
  ) => {

    return [
      file?.name || "",
      file?.type || "",
      Number(
        file?.size || 0
      ),
      Number(
        file?.lastModified || 0
      ),
    ].join(
      "::"
    );

  };


  // ====================================================
  // FILE SELECT
  // ====================================================

  const handleFileSelect = (
    file,
    incomingFiles = []
  ) => {

    const files =
      Array.isArray(
        incomingFiles
      ) &&
      incomingFiles.length > 0
        ? incomingFiles
        : file
          ? [file]
          : [];


    if (
      files.length ===
      0
    ) {

      return;

    }


    setLocalAttachmentError(
      ""
    );


    const existingKeys =
      new Set(
        selectedFiles.map(
          getFileKey
        )
      );


    const mergedFiles =
      [
        ...selectedFiles
      ];


    for (
      const nextFile of files
    ) {

      if (!nextFile) {

        continue;

      }


      const key =
        getFileKey(
          nextFile
        );


      if (
        existingKeys.has(
          key
        )
      ) {

        continue;

      }


      existingKeys.add(
        key
      );


      mergedFiles.push(
        nextFile
      );

    }


    const imageFiles =
      mergedFiles.filter(
        isImageFile
      );


    const documentFiles =
      mergedFiles.filter(
        (
          nextFile
        ) =>
          !isImageFile(
            nextFile
          )
      );


    const acceptedImages =
      imageFiles.slice(
        0,
        IMAGE_ATTACHMENT_LIMIT
      );


    const acceptedDocuments =
      documentFiles.slice(
        0,
        DOCUMENT_ATTACHMENT_LIMIT
      );


    const rejectedImages =
      Math.max(
        0,
        imageFiles.length -
          IMAGE_ATTACHMENT_LIMIT
      );


    const rejectedDocuments =
      Math.max(
        0,
        documentFiles.length -
          DOCUMENT_ATTACHMENT_LIMIT
      );


    setSelectedFiles([
      ...acceptedImages,
      ...acceptedDocuments,
    ]);


    if (
      rejectedImages >
        0 &&
      rejectedDocuments >
        0
    ) {

      setLocalAttachmentError(
        `You can attach up to ${IMAGE_ATTACHMENT_LIMIT} images and ${DOCUMENT_ATTACHMENT_LIMIT} documents per message. ${rejectedImages + rejectedDocuments} file(s) were not added.`
      );

    }
    else if (
      rejectedImages >
      0
    ) {

      setLocalAttachmentError(
        `You can attach up to ${IMAGE_ATTACHMENT_LIMIT} images per message. ${rejectedImages} image(s) were not added.`
      );

    }
    else if (
      rejectedDocuments >
      0
    ) {

      setLocalAttachmentError(
        `You can attach up to ${DOCUMENT_ATTACHMENT_LIMIT} documents per message. ${rejectedDocuments} document(s) were not added.`
      );

    }


    onClearAttachmentError?.();

  };


  // ====================================================
  // PASTE IMAGE FROM CLIPBOARD
  //
  // Allows users to copy an image/screenshot and paste it
  // directly into the Nyxora chat composer.
  // Existing text-paste behaviour remains unchanged.
  // ====================================================

  const handlePaste = (
    event
  ) => {

    const items =
      event.clipboardData?.items ||
      [];


    const pastedImages =
      [];


    for (
      const item of items
    ) {

      if (
        !item.type.startsWith(
          "image/"
        )
      ) {

        continue;

      }


      const pastedFile =
        item.getAsFile();


      if (
        !pastedFile
      ) {

        continue;

      }


      pastedImages.push(
        pastedFile
      );

    }


    if (
      pastedImages.length ===
      0
    ) {

      return;

    }


    event.preventDefault();


    handleFileSelect(
      pastedImages[0],
      pastedImages
    );

  };


  // ====================================================
  // REMOVE FILE
  // ====================================================

  const removeFile = (
    fileIndex
  ) => {

    setSelectedFiles(
      (
        previousFiles
      ) =>
        previousFiles.filter(
          (
            _,
            index
          ) =>
            index !==
            fileIndex
        )
    );


    setLocalAttachmentError(
      ""
    );


    onClearAttachmentError?.();

  };


  const stopVoiceRecognition = () => {
    const recognition = recognitionRef.current;

    if (recognition) {
      try {
        recognition.abort();
      } catch {
        // Recognition is already stopped.
      }
    }

    recognitionRef.current = null;
    setIsListening(false);
    setVoiceStarting(false);
  };

  const announceJarvis = (text, onEnd = null) => {
    if (!text || !window.speechSynthesis) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      utterance.rate = 1;
      utterance.pitch = 0.92;
      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn("JARVIS announcement failed:", error);
      onEnd?.();
    }
  };

  const activateJarvisMode = () => {
    jarvisModeRef.current = true;
    onJarvisModeChange?.(true);
    setJarvisSuggestions(getJarvisSuggestions());
    voiceModeRef.current = true;
    onVoiceModeChange?.(true);

    announceJarvis(
      "JARVIS mode activated. You can say a command now.",
      () => {
        if (jarvisModeRef.current && voiceModeRef.current) {
          startVoiceRecognition();
        }
      }
    );
  };

  const deactivateJarvisMode = () => {
    jarvisModeRef.current = false;
    onJarvisModeChange?.(false);
    setJarvisSuggestions([]);
    stopVoiceRecognition();
    voiceModeRef.current = false;
    onVoiceModeChange?.(false);
    voiceFinalMessageRef.current = "";
    voiceTranscriptRef.current = "";
    announceJarvis("JARVIS mode deactivated.");
  };

  // ====================================================
  // SUBMIT
  // ====================================================

  const handleSubmit =
    async (e, messageOverride = null) => {

      e?.preventDefault?.();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Recognition is already stopped.
        }
      }

      if (imageStudio) {
        if (loading) return;

        const submitMessage =
          messageOverride !== null
            ? String(messageOverride || "")
            : imagePrompt;

        if (
          !submitMessage.trim() &&
          selectedFiles.length === 0
        ) {
          return;
        }

        const currentMessage = submitMessage;
        const currentFiles = [...selectedFiles];
        const currentFile = currentFiles[0] || null;

        setImagePrompt("");
        setSelectedFiles([]);
        setLocalAttachmentError("");
        setImageGenerationError("");
        onClearAttachmentError?.();

        try {
          const success = await onSend({
            message: currentMessage,
            file: currentFile,
            files: currentFiles,
            imageModel:
              selectedImageModel === "auto"
                ? ""
                : selectedImageModel,
          });

          if (success === false) {
            setImagePrompt(currentMessage);
            setSelectedFiles(currentFiles);
          }
        } catch (error) {
          console.error(
            "Image Studio message send error:",
            error
          );
          setImagePrompt(currentMessage);
          setSelectedFiles(currentFiles);
        } finally {
          if (voiceModeRef.current) {
            voiceModeRef.current = false;
            onVoiceModeChange?.(false);
          }
        }

        return;
      }

      if (loading) return;

      const submitMessage =
        messageOverride !== null
          ? String(messageOverride || "")
          : message;

      if (
        !submitMessage.trim() &&
        selectedFiles.length === 0
      ) {
        return;
      }

      if (
        !imageStudio &&
        !jarvisModeRef.current &&
        isJarvisActivationCommand(submitMessage)
      ) {
        setMessage("");
        setSelectedFiles([]);
        setLocalAttachmentError("");
        onClearAttachmentError?.();
        activateJarvisMode();
        return true;
      }

      if (
        !imageStudio &&
        jarvisModeRef.current &&
        isJarvisDeactivationCommand(submitMessage)
      ) {
        setMessage("");
        setSelectedFiles([]);
        setLocalAttachmentError("");
        onClearAttachmentError?.();
        deactivateJarvisMode();
        return true;
      }

      const currentMessage =
        jarvisModeRef.current
          ? stripJarvisWakePrefix(submitMessage)
          : submitMessage;
      const currentFiles = [...selectedFiles];
      const currentFile = currentFiles[0] || null;

      setMessage("");
      setSelectedFiles([]);
      setLocalAttachmentError("");
      onClearAttachmentError?.();

      try {
        const success = await onSend({
          message: currentMessage,
          file: currentFile,
          files: currentFiles,
          jarvisMode: jarvisModeRef.current,
        });

        if (
          success !== false &&
          jarvisModeRef.current
        ) {
          setJarvisSuggestions(
            getJarvisSuggestions(currentMessage)
          );
        }

        if (success === false) {
          setMessage(currentMessage);
          setSelectedFiles(currentFiles);
        }
      } catch (error) {
        console.error(
          "Message send error:",
          error
        );

        setMessage(currentMessage);
        setSelectedFiles(currentFiles);
      }
    };


  // ====================================================
  // VOICE INPUT / REAL-TIME VOICE MODE
  // ====================================================

  const requestMicrophonePermission = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      return true;
    }

    try {
      if (navigator.permissions?.query) {
        try {
          const permission = await navigator.permissions.query({
            name: "microphone",
          });

          if (permission.state === "granted") {
            return true;
          }

          if (permission.state === "denied") {
            setVoiceError(
              "Microphone access is blocked. Please allow microphone permission for Nyxora in your browser/site settings and try again."
            );
            return false;
          }
        } catch {
          // Browser does not expose microphone permission state.
        }
      }

      // Only request a temporary stream when permission is not already
      // granted. This preserves the mobile permission prompt without
      // adding getUserMedia startup latency on every turn.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error("Microphone permission error:", error);

      const permissionMessages = {
        NotAllowedError:
          "Microphone access is blocked. Please allow microphone permission for Nyxora in your browser/site settings and try again.",
        PermissionDeniedError:
          "Microphone access is blocked. Please allow microphone permission for Nyxora in your browser/site settings and try again.",
        NotFoundError:
          "No microphone was detected. Please check your microphone and try again.",
        NotReadableError:
          "The microphone is already being used by another application. Please close it and try again.",
        SecurityError:
          "Microphone is blocked by the browser. Please allow microphone access for Nyxora.",
      };

      setVoiceError(
        permissionMessages[error?.name] ||
          "Microphone permission could not be granted. Please allow microphone access for Nyxora and try again."
      );

      return false;
    }
  };

  const startVoiceRecognition = async () => {
    // Never capture Nyxora's own answer. Voice recognition can only
    // begin when the backend is idle and speech synthesis is fully idle.
    if (
      voiceStarting ||
      isListening ||
      loading ||
      window.speechSynthesis?.speaking ||
      window.speechSynthesis?.pending
    ) {
      return;
    }

    setVoiceStarting(true);

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    setVoiceError("");

    if (!SpeechRecognition) {

      setVoiceError(
        "Voice input is not supported in this browser. Please use Chrome or Edge."
      );

      setVoiceStarting(false);
      onVoiceModeChange?.(false);
      return;

    }

    if (recognitionRef.current) {

      try {
        recognitionRef.current.abort();
      } catch {
        // Recognition is already stopped.
      }

      recognitionRef.current = null;

    }

    voiceBaseMessageRef.current =
      (imageStudio ? imagePrompt : message).trim();

    voiceTranscriptRef.current =
      "";

    voiceFinalMessageRef.current =
      "";

    const recognition =
      new SpeechRecognition();

    // One utterance at a time prevents Nyxora's own
    // speech from being captured while it is responding.
    recognition.continuous =
      false;

    recognition.interimResults =
      true;

    recognition.maxAlternatives =
      1;

    recognition.lang =
      "en-IN";

    recognitionRef.current =
      recognition;

    recognition.onstart =
      () => {

        setVoiceStarting(false);
        setIsListening(true);
        setVoiceError("");

      };

    recognition.onresult =
      (event) => {

        let transcript = "";
        let finalTranscript = "";

        for (
          let i = 0;
          i < event.results.length;
          i += 1
        ) {

          const result =
            event.results[i];

          const value =
            result?.[0]?.transcript || "";

          transcript += value;

          if (result?.isFinal) {
            finalTranscript += value;
          }

        }

        voiceTranscriptRef.current =
          transcript;

        const cleanTranscript =
          transcript.trim();

        if (!cleanTranscript) {
          return;
        }

        const baseMessage =
          voiceBaseMessageRef.current;

        const nextMessage =
          baseMessage
            ? `${baseMessage} ${cleanTranscript}`
            : cleanTranscript;

        if (imageStudio) {
          setImagePrompt(nextMessage);
        } else {
          setMessage(nextMessage);
        }

        // Store the final value separately because React state
        // updates are asynchronous and the recognition onend
        // handler must submit the exact spoken prompt.
        if (finalTranscript.trim()) {

          voiceFinalMessageRef.current =
            baseMessage
              ? `${baseMessage} ${finalTranscript.trim()}`
              : finalTranscript.trim();

        }

      };

    recognition.onerror =
      (event) => {

        console.error(
          "Speech recognition error:",
          event.error
        );

        const errorMessages = {
          "not-allowed":
            "Microphone permission was denied. Please allow microphone access and try again.",
          "service-not-allowed":
            "Speech recognition service is not available. Please try again.",
          "audio-capture":
            "No microphone was detected. Please check your microphone and try again.",
          "network":
            "Voice recognition needs a network connection in this browser.",
          "no-speech":
            "",
        };

        const errorMessage =
          errorMessages[event.error];

        if (errorMessage) {
          setVoiceError(errorMessage);
        }

        setIsListening(false);
        setVoiceStarting(false);

      };

    recognition.onend =
      async () => {

        setIsListening(false);
        setVoiceStarting(false);

        if (
          recognitionRef.current ===
          recognition
        ) {

          recognitionRef.current =
            null;

        }

        const spokenMessage =
          voiceFinalMessageRef.current.trim() ||
          voiceTranscriptRef.current.trim();

        voiceFinalMessageRef.current =
          "";

        // JARVIS behaves like a wake/listen loop: silence or a
        // browser recognition timeout should not permanently end
        // the session. It simply returns to the listening state.
        if (
          !spokenMessage &&
          jarvisModeRef.current &&
          voiceModeRef.current &&
          !loading
        ) {
          window.setTimeout(() => {
            if (
              jarvisModeRef.current &&
              voiceModeRef.current &&
              !loading
            ) {
              startVoiceRecognition();
            }
          }, 450);

          return;
        }

        // Voice mode automatically sends the completed
        // utterance. Normal typing mode is unchanged.
        if (
          voiceModeRef.current &&
          spokenMessage &&
          !loading
        ) {

          await handleSubmit(
            null,
            spokenMessage
          );

        }

      };

    try {

      const microphoneGranted =
        await requestMicrophonePermission();

      if (!microphoneGranted) {
        voiceModeRef.current = false;
        onVoiceModeChange?.(false);
        setIsListening(false);
        setVoiceStarting(false);
        recognitionRef.current = null;

        try {
          recognition.abort();
        } catch {
          // Recognition is already stopped.
        }

        return;
      }

      recognition.start();

    } catch (error) {

      console.error(
        "Unable to start speech recognition:",
        error
      );

      setIsListening(false);
      setVoiceStarting(false);
      setVoiceError(
        "Unable to start voice input. Please try again."
      );

      recognitionRef.current =
        null;

    }

  };


  const handleVoiceInput = async () => {

    setVoiceError("");

    if (
      window.speechSynthesis?.speaking ||
      window.speechSynthesis?.pending
    ) {
      return;
    }

    if (voiceMode) {

      voiceModeRef.current =
        false;

      onVoiceModeChange?.(false);

      voiceFinalMessageRef.current =
        "";

      voiceTranscriptRef.current =
        "";

      const recognition =
        recognitionRef.current;

      if (recognition) {

        try {
          recognition.stop();
        } catch {
          // Recognition is already stopped.
        }

      }

      setIsListening(false);
      return;

    }

    voiceModeRef.current =
      true;

    onVoiceModeChange?.(true);
    startVoiceRecognition();

  };


  // ====================================================
  // VOICE RESPONSE LOCK / RESTART
  //
  // A voice turn has three protected phases:
  // 1. microphone input
  // 2. backend generation
  // 3. Nyxora speech output
  //
  // The microphone may restart only after the speech component
  // explicitly reports that the complete answer has finished.
  // ====================================================
  useEffect(() => {

    if (
      !voiceMode ||
      loading ||
      isListening ||
      voiceStarting
    ) {
      return;
    }

    if (
      voiceRestartSignal === 0
    ) {
      return;
    }

    // Never start recognition while Nyxora is still speaking or
    // waiting to speak another queued chunk. This is intentionally
    // checked immediately before startVoiceRecognition as well as
    // by the speech component's completion callback.
    if (
      window.speechSynthesis?.speaking ||
      window.speechSynthesis?.pending
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {

        if (
          voiceModeRef.current &&
          !loading &&
          !isListening &&
          !voiceStarting &&
          !(window.speechSynthesis?.speaking || window.speechSynthesis?.pending)
        ) {
          startVoiceRecognition();
        }

      }, 350);

    return () => {
      window.clearTimeout(timer);
    };

  }, [
    voiceRestartSignal,
    voiceMode,
    loading,
    isListening,
    voiceStarting,
  ]);

  // ====================================================
  // VOICE CLEANUP
  // ====================================================

  useEffect(() => {

    return () => {

      const recognition =
        recognitionRef.current;

      if (recognition) {

        try {

          recognition.abort();

        } catch {
          // Recognition is already stopped.
        }

      }

      recognitionRef.current =
        null;

    };

  }, []);


  // ====================================================
  // ATTACHMENT ICON
  // ====================================================

  const getAttachmentIcon =
    () => {

      if (
        isPdf
      ) {

        return (

          <FileText
            size={22}
            className="text-red-400"
          />

        );

      }


      if (
        isImage
      ) {

        return (

          <ImageIcon
            size={22}
            className="text-violet-400"
          />

        );

      }


      return (

        <File
          size={22}
          className="text-blue-400"
        />

      );

    };


  // ====================================================
  // FILE SIZE
  // ====================================================

  const formatFileSize = (
    bytes
  ) => {

    if (!bytes) {

      return "";

    }


    if (
      bytes <
      1024
    ) {

      return `${bytes} B`;

    }


    if (
      bytes <
      1024 *
      1024
    ) {

      return `${(
        bytes /
        1024
      ).toFixed(1)} KB`;

    }


    return `${(
      bytes /
      (
        1024 *
        1024
      )
    ).toFixed(1)} MB`;

  };


  // ====================================================
  // UI
  // ====================================================

  const visibleAttachmentError =
    localAttachmentError ||
    attachmentError;


  return (

    <div
      className="
        border-t
        border-slate-800
        bg-[#050816]
        p-5
      "
    >


      {/* =============================================== */}
      {/* ATTACHMENT ERROR                               */}
      {/* =============================================== */}

      {visibleAttachmentError && (

        <div
          className="
            mb-3
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-amber-500/40
            bg-amber-500/10
            px-4
            py-3
          "
        >

          <AlertTriangle
            size={20}
            className="
              mt-0.5
              shrink-0
              text-amber-400
            "
          />


          <div
            className="flex-1"
          >

            <p
              className="
                text-sm
                leading-6
                text-amber-200
              "
            >

              {
                visibleAttachmentError
              }

            </p>

          </div>


          <button
            type="button"

            onClick={() => {

              setLocalAttachmentError(
                ""
              );

              onClearAttachmentError?.();

            }}

            className="
              shrink-0
              text-amber-300
              transition
              hover:text-white
            "

            aria-label=
              "Dismiss attachment warning"

            title=
              "Dismiss warning"
          >

            <X
              size={18}
            />

          </button>

        </div>

      )}


      {/* =============================================== */}
      {/* SELECTED FILES                                 */}
      {/* =============================================== */}

      {selectedFiles.length > 0 && (

        <div
          className="
            mb-3
            flex
            flex-col
            gap-2
          "
        >

          {selectedFiles.map(
            (
              file,
              fileIndex
            ) => {

              const fileIsPdf =
                file &&
                (
                  file.type ===
                    "application/pdf" ||
                  file.name
                    ?.toLowerCase()
                    .endsWith(".pdf")
                );


              const fileIsImage =
                file?.type
                  ?.startsWith(
                    "image/"
                  );


              return (

                <div
                  key={
                    getFileKey(
                      file
                    ) +
                    "::" +
                    fileIndex
                  }

                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    rounded-xl
                    border
                    border-slate-700
                    bg-[#111827]
                    px-4
                    py-3
                  "
                >

                  <div
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-3
                    "
                  >

                    <div
                      className=
                        "shrink-0"
                    >

                      {fileIsPdf ? (

                        <FileText
                          size={22}
                          className=
                            "text-red-400"
                        />

                      ) : fileIsImage ? (

                        <ImageIcon
                          size={22}
                          className=
                            "text-violet-400"
                        />

                      ) : (

                        <File
                          size={22}
                          className=
                            "text-blue-400"
                        />

                      )}

                    </div>


                    <div
                      className=
                        "min-w-0"
                    >

                      <p
                        className="
                          truncate
                          text-sm
                          font-medium
                          text-white
                        "
                      >

                        {
                          file.name
                        }

                      </p>


                      <div
                        className="
                          mt-1
                          flex
                          flex-wrap
                          items-center
                          gap-2
                          text-xs
                          text-gray-400
                        "
                      >

                        <span>

                          {
                            file.type ||
                            "Unknown file type"
                          }

                        </span>


                        {file.size > 0 && (

                          <>

                            <span>
                              •
                            </span>

                            <span>

                              {
                                formatFileSize(
                                  file.size
                                )
                              }

                            </span>

                          </>

                        )}

                      </div>

                    </div>

                  </div>


                  {/* REMOVE ATTACHMENT */}

                  <button
                    type="button"

                    onClick={() =>
                      removeFile(
                        fileIndex
                      )
                    }

                    className="
                      shrink-0
                      rounded-lg
                      p-2
                      text-gray-400
                      transition
                      hover:bg-white/10
                      hover:text-white
                    "

                    aria-label={
                      `Remove ${file.name}`
                    }

                    title=
                      "Remove attachment"
                  >

                    <X
                      size={18}
                    />

                  </button>

                </div>

              );

            }
          )}

        </div>

      )}


      {/* =============================================== */}
      {/* AI IMAGE GENERATOR                            */}
      {/* =============================================== */}

      {showImageGenerator && (
        <div
          className="
            mb-3
            rounded-2xl
            border
            border-violet-500/30
            bg-[#0b1020]
            p-4
            shadow-[0_12px_40px_rgba(0,0,0,0.25)]
          "
        >
          <div
            className="
              mb-3
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <div className="flex min-w-0 items-center gap-2">
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-fuchsia-600
                  via-violet-600
                  to-cyan-500
                  text-white
                "
              >
                <Sparkles size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  {imageStudio ? "Nyxora AI Image Studio" : "Nyxora AI Image Generator"}
                </p>
                <p className="text-xs text-gray-400">
                  {imageStudio
                    ? "Create images with prompts and reference files."
                    : "Describe the image you want to create."}
                </p>
              </div>
            </div>

            {!imageStudio && (
              <button
                type="button"
                onClick={() => {
                  clearImageGenerator();
                  setShowImageGenerator(false);
                }}
                className="
                rounded-lg
                p-2
                text-gray-400
                transition
                hover:bg-white/10
                hover:text-white
              "
              aria-label="Close AI image generator"
                title="Close"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {imageStudio && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="nyxora-image-model"
                  className="shrink-0 text-xs font-medium text-gray-400"
                >
                  Model
                </label>

                <div className="relative min-w-0 flex-1">
                  <select
                    id="nyxora-image-model"
                    value={selectedImageModel}
                    onChange={(event) =>
                      setSelectedImageModel(event.target.value)
                    }
                    disabled={
                      loading ||
                      isListening ||
                      voiceStarting
                    }
                    className="
                      w-full
                      appearance-none
                      rounded-xl
                      border
                      border-slate-700
                      bg-[#111827]
                      px-3
                      py-2.5
                      pr-9
                      text-sm
                      text-white
                      outline-none
                      transition
                      focus:border-violet-500
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                    title="Choose the image generation model"
                  >
                    {IMAGE_STUDIO_MODELS.map((model) => (
                      <option
                        key={model.id}
                        value={model.id}
                        className="bg-[#111827] text-white"
                      >
                        {model.name}
                      </option>
                    ))}
                  </select>

                  <span
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                    "
                  >
                    ▾
                  </span>
                </div>

                <span className="hidden text-xs text-gray-500 sm:block">
                  {
                    IMAGE_STUDIO_MODELS.find(
                      (model) =>
                        model.id === selectedImageModel
                    )?.description
                  }
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
               {imageStudio && (
                 <div
                   className={
                     loading || isListening || voiceStarting
                       ? "pointer-events-none opacity-50"
                       : ""
                   }
                 >
                   <FileUploadButton
                     onSelect={handleFileSelect}
                   />
                 </div>
               )}

               <input
                 type="text"
                 value={imagePrompt}
                 onChange={(event) => {
                   setImagePrompt(event.target.value);
                   if (imageGenerationError) {
                     setImageGenerationError("");
                   }
                 }}
                 onKeyDown={(event) => {
                   if (
                     event.key === "Enter" &&
                     !event.shiftKey
                   ) {
                     event.preventDefault();

                     if (imageStudio) {
                       handleSubmit(event);
                     } else {
                       handleGenerateImage(event);
                     }
                   }
                 }}
                 disabled={
                   imageStudio
                     ? loading || isListening || voiceStarting
                     : imageGenerationLoading
                 }
                 placeholder="e.g. A futuristic neon city at night..."
                 className="
                   min-w-0
                   flex-1
                   rounded-xl
                   border
                   border-slate-700
                   bg-[#111827]
                   px-4
                   py-3
                   text-sm
                   text-white
                   outline-none
                   transition
                   placeholder:text-gray-500
                   focus:border-violet-500
                   disabled:cursor-not-allowed
                   disabled:opacity-60
                 "
               />

               {imageStudio && (
                 <button
                   type="button"
                   onClick={handleVoiceInput}
                   disabled={loading || voiceStarting}
                   className={`
                     shrink-0
                     rounded-xl
                     p-3
                     text-white
                     transition-all
                     duration-300
                     ${
                       voiceMode
                         ? isListening
                           ? "bg-red-500 hover:bg-red-600"
                           : "bg-violet-600 hover:bg-violet-500"
                         : "bg-slate-700 hover:bg-slate-600"
                     }
                     disabled:cursor-not-allowed
                     disabled:opacity-50
                   `}
                   aria-label={
                     voiceMode
                       ? isListening
                         ? "Stop voice input"
                         : "Voice input active"
                       : "Start voice input"
                   }
                   title={
                     voiceMode
                       ? isListening
                         ? "Stop voice input"
                         : "Voice input active"
                       : "Voice input"
                   }
                 >
                   {isListening || voiceStarting ? (
                     <MicOff size={18} />
                   ) : (
                     <Mic size={18} />
                   )}
                 </button>
               )}

               <button
                 type="button"
                 onClick={
                   imageStudio
                     ? handleSubmit
                     : handleGenerateImage
                 }
                 disabled={
                   imageStudio
                     ? loading || !imagePrompt.trim()
                     : imageGenerationLoading || !imagePrompt.trim()
                 }
                 className="
                   group
                   relative
                   inline-flex
                   shrink-0
                   items-center
                   gap-2
                   overflow-hidden
                   rounded-xl
                   bg-gradient-to-r
                   from-fuchsia-600
                   via-violet-600
                   to-cyan-500
                   px-4
                   py-3
                   text-sm
                   font-semibold
                   text-white
                   transition-all
                   duration-300
                   hover:scale-[1.015]
                   hover:shadow-[0_0_22px_rgba(139,92,246,0.35)]
                   active:scale-[0.99]
                   disabled:cursor-not-allowed
                   disabled:opacity-40
                   disabled:hover:scale-100
                   disabled:hover:shadow-none
                 "
               >
                 {!(imageStudio ? loading : imageGenerationLoading) && (
                   <span
                     aria-hidden="true"
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
                 )}

                 <Sparkles
                   size={17}
                   className="relative z-10"
                 />
                 <span className="relative z-10">
                   Generate
                 </span>
               </button>
             </div>

            {imageGenerationError && (
              <div
                className="
                  rounded-xl
                  border
                  border-red-500/30
                  bg-red-950/30
                  px-3
                  py-2
                  text-xs
                  leading-5
                  text-red-200
                "
                role="alert"
              >
                {imageGenerationError}
              </div>
            )}

            {!imageStudio && generatedImage && (
              <div
                className="
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-700
                  bg-[#050816]
                "
              >
                <div className="relative">
                  <img
                    src={generatedImage}
                    alt={imagePrompt || "Generated by Nyxora AI"}
                    className="
                      block
                      max-h-[420px]
                      w-full
                      object-contain
                      bg-[#050816]
                    "
                  />

                  <button
                    type="button"
                    onClick={handleDownloadGeneratedImage}
                    className="
                      absolute
                      right-3
                      top-3
                      inline-flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-white/10
                      bg-black/70
                      px-3
                      py-2
                      text-xs
                      font-medium
                      text-white
                      shadow-lg
                      backdrop-blur
                      transition
                      hover:bg-black/85
                    "
                    title="Download generated image"
                  >
                    <Download size={15} />
                    Download
                  </button>
                </div>

                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    justify-between
                    gap-2
                    border-t
                    border-slate-800
                    px-3
                    py-2
                    text-xs
                    text-gray-400
                  "
                >
                  <span>
                    {generatedImageMeta?.provider || "nyxora"}
                    {" · "}
                    {generatedImageMeta?.model || "auto"}
                  </span>

                  <button
                    type="button"
                    onClick={clearImageGenerator}
                    className="
                      text-gray-400
                      transition
                      hover:text-white
                    "
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =============================================== */}
      {/* MESSAGE FORM                                   */}
      {/* NORMAL AI CHAT ONLY                            */}
      {/* =============================================== */}

      {!imageStudio && (
      <form
        onSubmit={
          handleSubmit
        }

        className="
          relative
          flex
          items-end
          gap-3
        "
      >


        {/* ADD / REPLACE FILE */}

        <div className={(isListening || voiceStarting) ? "pointer-events-none opacity-50" : ""}>
          <FileUploadButton
            onSelect={
              handleFileSelect
            }
          />
        </div>


        {/* MESSAGE */}

        {isListening && (
          <div
            className="
              absolute
              left-16
              right-16
              bottom-full
              mb-2
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-red-500/30
              bg-[#111827]/95
              px-4
              py-2
              text-xs
              font-medium
              text-red-200
              shadow-lg
              backdrop-blur
            "
            role="status"
            aria-live="polite"
          >
            <span className="flex items-end gap-0.5">
              <span className="h-2 w-1 animate-pulse rounded-full bg-red-400" />
              <span className="h-4 w-1 animate-pulse rounded-full bg-red-400 [animation-delay:120ms]" />
              <span className="h-6 w-1 animate-pulse rounded-full bg-red-400 [animation-delay:240ms]" />
              <span className="h-3 w-1 animate-pulse rounded-full bg-red-400 [animation-delay:360ms]" />
              <span className="h-5 w-1 animate-pulse rounded-full bg-red-400 [animation-delay:480ms]" />
            </span>
            <span>Listening… Speak now</span>
          </div>
        )}

        {jarvisMode && !imageStudio && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-violet-400/15 bg-violet-500/[0.05] px-3 py-2">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">
              JARVIS READY
            </span>
            {jarvisSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setMessage(suggestion);
                  setJarvisSuggestions(
                    getJarvisSuggestions(suggestion)
                  );
                }}
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-300 transition hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <textarea
        ref={textareaRef}
          rows={1}

          value={
            message
          }

          placeholder={

            isListening

              ? "Listening..."

              : selectedFiles.length >
                0

                ? selectedFiles.length ===
                  1

                  ? "Ask Nyxora about this file..."

                  : "Ask Nyxora about these files..."

                : "Message Nyxora AI..."

          }

          onPaste={(e) => {
            if (isListening || voiceStarting) {
              e.preventDefault();
              return;
            }

            handlePaste(e);
          }}

          disabled={isListening || voiceStarting}

          onChange={(e) => {

            if (isListening || voiceStarting) {
              return;
            }

            setMessage(
              e.target.value
            );


            if (
              attachmentError
            ) {

              onClearAttachmentError?.();

            }


            if (
              localAttachmentError
            ) {

              setLocalAttachmentError(
                ""
              );

            }

          }}

          onKeyDown={(e) => {

            if (isListening || voiceStarting) {
              e.preventDefault();
              return;
            }

            if (
              e.key ===
                "Enter" &&
              !e.shiftKey
            ) {

              e.preventDefault();


              handleSubmit(
                e
              );

            }

          }}

className="
  min-h-[48px]
  max-h-[220px]
  flex-1
  resize-none
  overflow-y-auto
  rounded-2xl
  border
  border-slate-700
  bg-[#111827]
  px-4
  py-3
  text-white
  outline-none
  transition
  placeholder:text-gray-500
  focus:border-violet-500
"
        />


        {voiceError && (

          <div
            className="
              absolute
              bottom-full
              left-0
              right-0
              mb-2
              rounded-xl
              border
              border-red-500/30
              bg-red-950/90
              px-3
              py-2
              text-xs
              text-red-200
              shadow-lg
            "
            role="alert"
          >

            {voiceError}

          </div>

        )}


        {/* ============================================= */}
        {/* SCREEN CAPTURE — STEP 40                     */}
        {/* ============================================= */}

        <button
          type="button"
          onClick={handleScreenCapture}
          disabled={loading || isListening || voiceStarting}
          className="rounded-xl bg-slate-700 p-3 text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Capture screen for Nyxora"
          title="Capture screen"
        >
          <Monitor size={18} />
        </button>

        {/* ============================================= */}
        {/* AI IMAGE GENERATOR                            */}
        {/* ============================================= */}

        {!imageStudio && (
          <button
            type="button"
            onClick={() => {
              clearImageGenerator();
              setShowImageGenerator(false);
              navigate("/image-studio");
            }}
            disabled={loading || isListening || voiceStarting}
            className={`
              rounded-xl
              p-3
              text-white
              transition
              ${
                showImageGenerator
                  ? "bg-violet-600 hover:bg-violet-500"
                  : "bg-slate-700 hover:bg-slate-600"
              }
              disabled:cursor-not-allowed
              disabled:opacity-50
            `}
            aria-label="Open AI image generator"
            title="Generate image with Nyxora AI"
          >
            <Sparkles size={18} />
          </button>
        )}


        {/* ============================================= */}
        {/* VOICE INPUT                                  */}
        {/* ============================================= */}

        <button
          type="button"

          onClick={
            handleVoiceInput
          }

          disabled={loading || voiceStarting}

          className={`
            rounded-xl
            p-3
            text-white
            transition

            ${
              voiceMode
                ? isListening
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-violet-600 hover:bg-violet-500"
                : "bg-slate-700 hover:bg-slate-600"
            }

            ${
              loading

                ? "cursor-not-allowed opacity-50"

                : ""
            }
          `}

          aria-label={

            voiceMode

              ? isListening
                ? "Stop voice conversation"
                : "Voice conversation mode active"

              : "Start voice conversation"

          }

          title={

            voiceMode

              ? isListening
                ? "Stop voice conversation"
                : "Voice conversation mode active"

              : "Start voice conversation"

          }
        >

          {isListening || voiceStarting ? (

            <span className="relative flex h-[18px] w-[18px] items-center justify-center">
              <span className="absolute h-4 w-4 animate-ping rounded-full bg-red-400/40" />
              <span className="absolute h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />
              <MicOff
                size={18}
                className="relative z-10"
              />
            </span>

          ) : (

            <Mic
              size={18}
            />

          )}

        </button>


        {/* ============================================= */}
        {/* SEND / STOP                                  */}
        {/* ============================================= */}

        {loading ? (

          <button
            type="button"

            onClick={
              onStop
            }

            className="
              rounded-xl
              bg-red-500
              p-3
              text-white
              transition
              hover:bg-red-600
            "

            aria-label=
              "Stop generating"

            title=
              "Stop generating"
          >

            <Square
              size={18}
            />

          </button>

        ) : (

          <button
            type="submit"

            disabled={
              isListening ||
              voiceStarting ||
              (!message.trim() &&
                selectedFiles.length === 0)
            }

            className="
              group
              relative
              overflow-hidden
              rounded-xl
              bg-gradient-to-r
              from-fuchsia-600
              via-violet-600
              to-cyan-500
              p-3
              text-white
              transition-all
              duration-300
              hover:scale-105
              hover:shadow-[0_0_22px_rgba(139,92,246,0.45)]
              active:scale-95
              disabled:cursor-not-allowed
              disabled:opacity-40
              disabled:hover:scale-100
              disabled:hover:shadow-none
            "

            aria-label=
              "Send message"

            title=
              "Send"
          >

            <span
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

            <Send
              size={18}
            />

          </button>

        )}

      </form>
      )}

    </div>

  );

}