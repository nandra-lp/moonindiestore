import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "./firebase-admin";

export async function verifyPaymentProofRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
  if (!token) return null;

  const auth = getFirebaseAdminAuth();
  try {
    return await auth.verifyIdToken(token, true);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : null;
    if (
      typeof code === "string" &&
      [
        "auth/argument-error",
        "auth/id-token-expired",
        "auth/id-token-revoked",
        "auth/invalid-id-token",
        "auth/user-disabled",
        "auth/user-not-found",
      ].includes(code)
    ) {
      return null;
    }
    throw error;
  }
}

export async function getPaymentProofOrder(orderId: string) {
  const snapshot = await getFirebaseAdminFirestore().collection("orders").doc(orderId).get();
  return snapshot.exists ? snapshot.data() : null;
}

export async function getPaymentProofUser(uid: string) {
  const snapshot = await getFirebaseAdminFirestore().collection("users").doc(uid).get();
  return snapshot.exists ? snapshot.data() : null;
}

export function hasVerifiedEmail(token: DecodedIdToken, user: Record<string, unknown>) {
  return user.requires_email_verification !== true || token.email_verified === true;
}

export function paymentProofJson(
  body: Record<string, unknown>,
  status: number
) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function authenticatePaymentProofRequest(request: Request) {
  try {
    return {
      token: await verifyPaymentProofRequest(request),
      response: null,
    };
  } catch (error) {
    console.error(
      "Firebase payment-proof authentication is unavailable:",
      error instanceof Error ? error.message : "Unknown server error"
    );
    return {
      token: null,
      response: paymentProofJson(
        { code: "auth-service-unavailable", error: "Autentikasi server belum dikonfigurasi." },
        503
      ),
    };
  }
}
