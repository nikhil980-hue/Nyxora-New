import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import {
  db,
  auth,
} from "../../../firebase/firebase";


// ======================================================
// CHAT SCOPES
// ======================================================

export const CHAT_SCOPE = "chat";
export const IMAGE_STUDIO_SCOPE = "imageStudio";

function getCollectionName(
  scope = CHAT_SCOPE
) {

  return scope === IMAGE_STUDIO_SCOPE
    ? "imageStudioChats"
    : "chats";

}


// ======================================================
// CHATS COLLECTION
// ======================================================

function chatsCollection(
  scope = CHAT_SCOPE
) {

  const uid =
    auth.currentUser?.uid;

  if (!uid) {
    throw new Error(
      "User not authenticated"
    );
  }

  return collection(
    db,
    "users",
    uid,
    getCollectionName(scope)
  );

}


// ======================================================
// CHAT DOCUMENT REFERENCE
// ======================================================

function chatDocRef(
  chatId,
  scope = CHAT_SCOPE
) {

  const uid =
    auth.currentUser?.uid;

  if (!uid) {
    throw new Error(
      "User not authenticated"
    );
  }

  return doc(
    db,
    "users",
    uid,
    getCollectionName(scope),
    chatId
  );

}


// ======================================================
// MESSAGES DOCUMENT REFERENCE
// ======================================================

function messagesRef(
  chatId,
  scope = CHAT_SCOPE
) {

  const uid =
    auth.currentUser?.uid;

  if (!uid) {
    throw new Error(
      "User not authenticated"
    );
  }

  return doc(
    db,
    "users",
    uid,
    getCollectionName(scope),
    chatId,
    "data",
    "messages"
  );

}


// ======================================================
// CREATE CHAT
// ======================================================

export async function createChat(
  title = "New Chat",
  scope = CHAT_SCOPE
) {

  const ref =
    await addDoc(
      chatsCollection(scope),
      {
        title,
        createdAt:
          serverTimestamp(),
        updatedAt:
          serverTimestamp(),
      }
    );

  return ref.id;

}


// ======================================================
// GET CHATS
// ======================================================

export async function getChats(
  scope = CHAT_SCOPE
) {

  const q =
    query(
      chatsCollection(scope),
      orderBy(
        "updatedAt",
        "desc"
      )
    );

  const snapshot =
    await getDocs(q);

  const chats = [];

  for (
    const chatDocument of
    snapshot.docs
  ) {

    const data =
      chatDocument.data();

    const messagesSnapshot =
      await getDoc(
        messagesRef(
          chatDocument.id,
          scope
        )
      );

    chats.push({
      id:
        chatDocument.id,

      title:
        data.title ||
        "New Chat",

      messages:
        messagesSnapshot.exists()
          ? (
              messagesSnapshot
                .data()
                .messages ||
              []
            )
          : [],
    });

  }

  return chats;

}


// ======================================================
// SUBSCRIBE TO CHATS
// ======================================================

export function subscribeToChats(
  callback,
  scope = CHAT_SCOPE
) {

  const q =
    query(
      chatsCollection(scope),
      orderBy(
        "updatedAt",
        "desc"
      )
    );

  return onSnapshot(
    q,
    (snapshot) => {

      const chats =
        snapshot.docs.map(
          (
            chatDocument
          ) => ({
            id:
              chatDocument.id,

            title:
              chatDocument
                .data()
                .title ||
              "New Chat",

            messages: [],
          })
        );

      console.log(
        "Realtime chats received:",
        chats,
        "scope:",
        scope
      );

      callback(
        chats
      );

    },
    (error) => {

      console.error(
        "Chat realtime error:",
        error
      );

    }
  );

}


// ======================================================
// SUBSCRIBE TO MESSAGES
// ======================================================

export function subscribeToMessages(
  chatId,
  callback,
  scope = CHAT_SCOPE
) {

  console.log(
    "Listening messages:",
    chatId,
    "scope:",
    scope
  );

  return onSnapshot(
    messagesRef(
      chatId,
      scope
    ),
    (snapshot) => {

      console.log(
        "Realtime message snapshot:",
        snapshot.exists()
      );

      if (
        snapshot.exists()
      ) {

        const messages =
          snapshot
            .data()
            .messages ||
          [];

        console.log(
          "Realtime messages received:",
          messages
        );

        callback(
          messages
        );

      } else {

        callback(
          []
        );

      }

    },
    (error) => {

      console.error(
        "Message realtime error:",
        error
      );

    }
  );

}


// ======================================================
// SAVE MESSAGES
// ======================================================

export async function saveMessages(
  chatId,
  messages,
  scope = CHAT_SCOPE
) {

  const chatRef =
    chatDocRef(
      chatId,
      scope
    );

  // ====================================================
  // STEP 1 — ENSURE THE PARENT CHAT DOCUMENT EXISTS
  //
  // Image Studio can temporarily hold a stale active
  // chat id after realtime deletion/reconciliation.
  //
  // setDoc(..., { merge: true }) prevents
  // "No document to update" while preserving the
  // existing chat title and createdAt fields.
  // ====================================================

  await setDoc(
    chatRef,
    {
      updatedAt:
        serverTimestamp(),
    },
    {
      merge: true,
    }
  );

  // ====================================================
  // STEP 2 — SAVE MESSAGE DATA
  // ====================================================

  await setDoc(
    messagesRef(
      chatId,
      scope
    ),
    {
      messages,
    }
  );

}


// ======================================================
// CLEAR CHAT MESSAGES
// ======================================================

export async function clearChatMessages(
  chatId,
  scope = CHAT_SCOPE
) {

  if (!chatId) {
    throw new Error(
      "Chat ID is required."
    );
  }

  const chatRef =
    chatDocRef(
      chatId,
      scope
    );

  // Ensure the parent exists before clearing.
  await setDoc(
    chatRef,
    {
      title:
        "New Chat",
      updatedAt:
        serverTimestamp(),
    },
    {
      merge: true,
    }
  );

  await setDoc(
    messagesRef(
      chatId,
      scope
    ),
    {
      messages: [],
    }
  );

  console.log(
    "🧹 Conversation cleared:",
    chatId,
    "scope:",
    scope
  );

}


// ======================================================
// UPDATE CHAT TITLE
// ======================================================

export async function updateChatTitle(
  chatId,
  title,
  scope = CHAT_SCOPE
) {

  // Use merge instead of updateDoc so a stale/missing
  // Image Studio parent document is recreated safely.
  await setDoc(
    chatDocRef(
      chatId,
      scope
    ),
    {
      title,
      updatedAt:
        serverTimestamp(),
    },
    {
      merge: true,
    }
  );

}


// ======================================================
// DELETE CHAT
//
// Firestore does NOT automatically delete nested
// documents when their parent document is deleted.
//
// Normal Chat:
// users/{uid}/chats/{chatId}/data/messages
//
// Image Studio:
// users/{uid}/imageStudioChats/{chatId}/data/messages
//
// Therefore the messages document is deleted first,
// followed by the parent chat document.
// ======================================================

export async function deleteChat(
  chatId,
  scope = CHAT_SCOPE
) {

  if (!chatId) {
    throw new Error(
      "Chat ID is required."
    );
  }

  // ====================================================
  // STEP 1 — DELETE MESSAGE DATA
  // ====================================================

  await deleteDoc(
    messagesRef(
      chatId,
      scope
    )
  );

  // ====================================================
  // STEP 2 — DELETE PARENT CHAT
  // ====================================================

  await deleteDoc(
    chatDocRef(
      chatId,
      scope
    )
  );

  console.log(
    "🗑️ Chat and message data deleted:",
    chatId,
    "scope:",
    scope
  );

}
