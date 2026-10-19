import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { db, auth } from "../firebase/firebase";

const CHAT_SCOPE = "chat";
const IMAGE_STUDIO_SCOPE = "imageStudio";

function getCollectionName(scope = CHAT_SCOPE) {
  return scope === IMAGE_STUDIO_SCOPE
    ? "imageStudioChats"
    : "chats";
}

function chatsCollection(scope = CHAT_SCOPE) {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not authenticated.");
  }

  return collection(
    db,
    "users",
    uid,
    getCollectionName(scope)
  );
}

function chatDocumentRef(chatId, scope = CHAT_SCOPE) {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not authenticated.");
  }

  return doc(
    db,
    "users",
    uid,
    getCollectionName(scope),
    chatId
  );
}

function messagesDocumentRef(chatId, scope = CHAT_SCOPE) {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not authenticated.");
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

export async function createChat(
  title = "New Chat",
  scope = CHAT_SCOPE
) {
  const ref = await addDoc(
    chatsCollection(scope),
    {
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  return ref.id;
}

export async function getChats(
  scope = CHAT_SCOPE
) {
  const q = query(
    chatsCollection(scope),
    orderBy("updatedAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function saveMessages(
  chatId,
  messages,
  scope = CHAT_SCOPE
) {
  await setDoc(
    chatDocumentRef(chatId, scope),
    {
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    messagesDocumentRef(chatId, scope),
    {
      messages,
    }
  );
}

export async function loadMessages(
  chatId,
  scope = CHAT_SCOPE
) {
  const snapshot = await getDoc(
    messagesDocumentRef(chatId, scope)
  );

  if (!snapshot.exists()) {
    return [];
  }

  return snapshot.data().messages || [];
}

export async function renameChat(
  chatId,
  title,
  scope = CHAT_SCOPE
) {
  await updateDoc(
    chatDocumentRef(chatId, scope),
    {
      title,
      updatedAt: serverTimestamp(),
    }
  );
}

export async function updateChatTitle(
  chatId,
  title,
  scope = CHAT_SCOPE
) {
  await updateDoc(
    chatDocumentRef(chatId, scope),
    {
      title,
      updatedAt: serverTimestamp(),
    }
  );
}

export async function deleteChat(
  chatId,
  scope = CHAT_SCOPE
) {
  if (!chatId) {
    throw new Error("Chat ID is required.");
  }

  // Firestore does not automatically delete nested documents.
  // Delete the message document before deleting the parent chat.
  try {
    await deleteDoc(
      messagesDocumentRef(chatId, scope)
    );
  } catch (error) {
    // A missing messages document should not prevent deletion
    // of the parent chat document.
    if (error?.code !== "not-found") {
      throw error;
    }
  }

  await deleteDoc(
    chatDocumentRef(chatId, scope)
  );
}
