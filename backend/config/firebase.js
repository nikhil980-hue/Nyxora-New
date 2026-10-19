import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("\n[Nyxora Firebase] Missing Firebase environment variables.");

  console.error(
    "[Nyxora Firebase] Required:"
  );

  console.error("  FIREBASE_PROJECT_ID");
  console.error("  FIREBASE_CLIENT_EMAIL");
  console.error("  FIREBASE_PRIVATE_KEY");

  throw new Error(
    "Firebase Admin configuration is incomplete. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in backend/.env."
  );
}

const serviceAccount = {
  projectId,
  clientEmail,
  privateKey,
};

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const db = getFirestore();