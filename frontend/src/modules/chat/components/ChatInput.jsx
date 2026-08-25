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
  AlertTriangle,
  FileText,
  File,
  Image as ImageIcon,
} from "lucide-react";

import FileUploadButton from "./FileUploadButton";


export default function ChatInput({
  onSend,
  onStop,
  loading,

  attachmentError = "",

  onClearAttachmentError,
}) {

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


  const recognitionRef =
    useRef(null);


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


  // ====================================================
  // SUBMIT
  // ====================================================

  const handleSubmit =
    async (e) => {

      e?.preventDefault?.();


      if (loading) {

        return;

      }


      if (
        !message.trim() &&
        selectedFiles.length ===
          0
      ) {

        return;

      }


      // =================================================
      // KEEP CURRENT VALUES
      //
      // We keep these references because the visible
      // composer will be cleared immediately.
      // =================================================

      const currentMessage =
        message;


      const currentFiles =
        [
          ...selectedFiles
        ];


      const currentFile =
        currentFiles[0] ||
        null;


      // =================================================
      // CLEAR COMPOSER IMMEDIATELY
      //
      // The attachments should move into the sent message
      // instead of remaining inside the bottom composer
      // while Nyxora generates its response.
      // =================================================

      setMessage("");


      setSelectedFiles(
        []
      );


      setLocalAttachmentError(
        ""
      );


      onClearAttachmentError?.();


      try {

        const success =
          await onSend({

            message:
              currentMessage,

            // Backward-compatible
            // first attachment.

            file:
              currentFile,

            // New multi-attachment
            // payload.

            files:
              currentFiles,

          });


        // ================================================
        // SEND / VALIDATION FAILURE
        //
        // Restore the original prompt and attachments.
        //
        // This is especially important for:
        // - password-protected PDFs
        // - corrupted PDFs
        // - attachment validation failures
        // - AI/server failures returning false
        // ================================================

        if (
          success === false
        ) {

          setMessage(
            currentMessage
          );


          setSelectedFiles(
            currentFiles
          );

        }

      } catch (
        error
      ) {

        console.error(
          "Message send error:",
          error
        );


        // ================================================
        // UNEXPECTED FAILURE
        //
        // Restore the unsent content so the user does not
        // lose their prompt or selected attachments.
        // ================================================

        setMessage(
          currentMessage
        );


        setSelectedFiles(
          currentFiles
        );

      }

    };


  // ====================================================
  // VOICE INPUT
  // ====================================================

  const handleVoiceInput = () => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;


    if (
      !SpeechRecognition
    ) {

      alert(
        "Voice input is not supported in this browser. Please use Chrome or Edge."
      );

      return;

    }


    if (
      isListening
    ) {

      recognitionRef
        .current
        ?.stop();

      return;

    }


    const recognition =
      new SpeechRecognition();


    recognition.continuous =
      false;


    recognition.interimResults =
      true;


    recognition.lang =
      "en-IN";


    recognitionRef.current =
      recognition;


    recognition.onstart =
      () => {

        setIsListening(
          true
        );

      };


    recognition.onresult = (
      event
    ) => {

      let transcript =
        "";


      for (
        let i =
          event.resultIndex;

        i <
          event.results.length;

        i++
      ) {

        transcript +=
          event.results[
            i
          ][0].transcript;

      }


      setMessage(
        transcript
      );

    };


    recognition.onerror = (
      event
    ) => {

      console.error(
        "Speech recognition error:",
        event.error
      );


      setIsListening(
        false
      );

    };


    recognition.onend =
      () => {

        setIsListening(
          false
        );


        recognitionRef.current =
          null;

      };


    recognition.start();

  };


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
      {/* MESSAGE FORM                                   */}
      {/* =============================================== */}

      <form
        onSubmit={
          handleSubmit
        }

        className="
          flex
          items-end
          gap-3
        "
      >


        {/* ADD / REPLACE FILE */}

        <FileUploadButton
          onSelect={
            handleFileSelect
          }
        />


        {/* MESSAGE */}

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

          onPaste={
            handlePaste
          }

          onChange={(e) => {

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


        {/* ============================================= */}
        {/* VOICE INPUT                                  */}
        {/* ============================================= */}

        <button
          type="button"

          onClick={
            handleVoiceInput
          }

          disabled={
            loading
          }

          className={`
            rounded-xl
            p-3
            text-white
            transition

            ${
              isListening

                ? "bg-red-500 hover:bg-red-600"

                : "bg-slate-700 hover:bg-slate-600"
            }

            ${
              loading

                ? "cursor-not-allowed opacity-50"

                : ""
            }
          `}

          aria-label={

            isListening

              ? "Stop listening"

              : "Start voice input"

          }

          title={

            isListening

              ? "Stop listening"

              : "Voice input"

          }
        >

          {isListening ? (

            <MicOff
              size={18}
            />

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
              !message.trim() &&
              selectedFiles.length ===
                0
            }

            className="
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

            <Send
              size={18}
            />

          </button>

        )}

      </form>

    </div>

  );

}