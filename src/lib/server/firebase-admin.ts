import "server-only";

import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
  if (!serviceAccountBase64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 is not configured.");
  }

  let serviceAccount: ServiceAccount;
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(serviceAccountBase64, "base64").toString("utf8")
    );
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("project_id" in parsed) ||
      typeof parsed.project_id !== "string" ||
      !("client_email" in parsed) ||
      typeof parsed.client_email !== "string" ||
      !("private_key" in parsed) ||
      typeof parsed.private_key !== "string"
    ) {
      throw new Error("Invalid Firebase service account.");
    }

    serviceAccount = {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    };
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 must contain a valid base64-encoded service account JSON."
    );
  }

  adminApp =
    getApps().find((app) => app.name === "payment-proof-server") ??
    initializeApp(
      { credential: cert(serviceAccount), projectId: serviceAccount.projectId },
      "payment-proof-server"
    );

  return adminApp;
}

export function getFirebaseAdminAuth() {
  return getAuth(getAdminApp());
}

export function getFirebaseAdminFirestore() {
  return getFirestore(getAdminApp());
}
