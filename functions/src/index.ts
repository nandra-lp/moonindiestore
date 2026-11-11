import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Request, Response } from "express";
import { defineSecret, defineString } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

const REGION = "asia-southeast1";
const PAYMENT_PROOFS_BUCKET = "payment-proofs";
const PAYMENT_PROOF_URL_MARKER = "supabase:private";
const MAX_PAYMENT_PROOF_BYTES = 5 * 1024 * 1024;
const PAYMENT_PROOF_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const SUPABASE_URL = defineString("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = defineSecret("SUPABASE_SERVICE_ROLE_KEY");
const INVALID_TOKEN_CODES = new Set([
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
  "auth/user-disabled",
  "auth/user-not-found",
]);

const app = getApps()[0] ?? initializeApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
let supabase: SupabaseClient | undefined;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function sendJson(
  response: Response,
  status: number,
  body: JsonRecord
) {
  response.set("Cache-Control", "no-store").status(status).json(body);
}

function getErrorCode(error: unknown) {
  if (!isRecord(error) || typeof error.code !== "string") return null;
  return error.code;
}

function getSupabaseAdmin() {
  if (supabase) return supabase;
  supabase = createClient(SUPABASE_URL.value(), SUPABASE_SERVICE_ROLE_KEY.value(), {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return supabase;
}

function getPaymentProofPath(orderId: string, uid: string) {
  return `bukti-pembayaran/${orderId}/${uid}`;
}

async function authenticateRequest(
  request: Request,
  response: Response
) {
  const authorization = request.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
  if (!token) {
    sendJson(response, 401, { code: "unauthorized", error: "Sesi login tidak valid." });
    return null;
  }

  try {
    return await auth.verifyIdToken(token, true);
  } catch (error) {
    const code = getErrorCode(error);
    if (code && INVALID_TOKEN_CODES.has(code)) {
      sendJson(response, 401, { code: "unauthorized", error: "Sesi login tidak valid." });
      return null;
    }

    console.error("Firebase token verification failed:", code ?? "unknown error");
    sendJson(response, 503, {
      code: "auth-service-unavailable",
      error: "Autentikasi server belum tersedia.",
    });
    return null;
  }
}

function getRequestPath(request: Request) {
  return request.path.replace(/^\/paymentProofApi(?=\/|$)/, "") || "/";
}

function getStorageErrorDetails(error: unknown) {
  if (!isRecord(error)) return { status: undefined };
  return {
    status: typeof error.status === "number" ? error.status : undefined,
  };
}

function sendStorageError(
  response: Response,
  error: unknown
) {
  const { status } = getStorageErrorDetails(error);
  console.error("Supabase payment-proof operation failed:", status ?? "unknown status");

  if (status === 401 || status === 403) {
    sendJson(response, status, {
      code: "storage-credentials-invalid",
      error: "Penyimpanan bukti pembayaran menolak kredensial server.",
    });
  } else if (status === 404) {
    sendJson(response, 404, {
      code: "storage-bucket-not-found",
      error: "Penyimpanan bukti pembayaran tidak tersedia.",
    });
  } else {
    sendJson(response, 502, {
      code: "storage-unavailable",
      error: "Tidak dapat mengakses penyimpanan bukti pembayaran.",
    });
  }
}

async function handleUploadUrl(
  request: Request,
  response: Response,
  uid: string,
  emailVerified: boolean
) {
  const body: unknown = request.body;
  if (!isRecord(body)) {
    sendJson(response, 400, { code: "invalid-request", error: "Permintaan unggah tidak valid." });
    return;
  }

  const { orderId, contentType, size } = body;
  if (
    typeof orderId !== "string" ||
    !ORDER_ID_PATTERN.test(orderId) ||
    typeof contentType !== "string" ||
    !PAYMENT_PROOF_CONTENT_TYPES.includes(contentType) ||
    typeof size !== "number" ||
    !Number.isInteger(size) ||
    size <= 0 ||
    size > MAX_PAYMENT_PROOF_BYTES
  ) {
    sendJson(response, 400, {
      code: "invalid-file",
      error: "Format atau ukuran file bukti tidak valid.",
    });
    return;
  }

  const [orderSnapshot, userSnapshot] = await Promise.all([
    firestore.collection("orders").doc(orderId).get(),
    firestore.collection("users").doc(uid).get(),
  ]);
  const order = orderSnapshot.data();
  const user = userSnapshot.data();
  if (!order || !user) {
    sendJson(response, 404, { code: "order-not-found", error: "Pesanan tidak ditemukan." });
    return;
  }
  if (
    user.role !== "customer" ||
    (user.requires_email_verification === true &&
      !emailVerified) ||
    order.uid_pelanggan !== uid
  ) {
    sendJson(response, 403, {
      code: "forbidden",
      error: "Anda tidak dapat mengunggah bukti untuk pesanan ini.",
    });
    return;
  }
  if (
    order.order_siap === false ||
    order.status_order !== "diproses" ||
    !["bca", "qris"].includes(String(order.metode_pembayaran)) ||
    !["menunggu", "bukti_dikirim"].includes(String(order.status_pembayaran ?? "menunggu"))
  ) {
    sendJson(response, 409, {
      code: "order-not-payable",
      error: "Pesanan belum dapat menerima bukti pembayaran.",
    });
    return;
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(PAYMENT_PROOFS_BUCKET)
      .createSignedUploadUrl(getPaymentProofPath(orderId, uid), { upsert: true });
    if (error) {
      sendStorageError(response, error);
      return;
    }
    sendJson(response, 200, {
      path: getPaymentProofPath(orderId, uid),
      signedUrl: data.signedUrl,
    });
  } catch (error) {
    console.error(
      "Could not create payment-proof upload URL:",
      error instanceof Error ? error.message : "Unknown error"
    );
    sendJson(response, 500, {
      code: "server-error",
      error: "Layanan unggah belum dikonfigurasi dengan benar.",
    });
  }
}

async function handleGetProof(
  response: Response,
  orderId: string,
  uid: string,
  emailVerified: boolean
) {
  const [orderSnapshot, userSnapshot] = await Promise.all([
    firestore.collection("orders").doc(orderId).get(),
    firestore.collection("users").doc(uid).get(),
  ]);
  const order = orderSnapshot.data();
  const user = userSnapshot.data();
  if (!order || !user) {
    sendJson(response, 404, {
      code: "proof-not-found",
      error: "Pesanan atau pengguna tidak ditemukan.",
    });
    return;
  }

  const isCustomerOwner =
    user.role === "customer" &&
    (user.requires_email_verification !== true || emailVerified) &&
    order.uid_pelanggan === uid;
  const canReview = user.role === "admin" || user.role === "owner";
  if (!isCustomerOwner && !canReview) {
    sendJson(response, 403, {
      code: "forbidden",
      error: "Anda tidak dapat melihat bukti pembayaran ini.",
    });
    return;
  }

  if (
    typeof order.bukti_pembayaran_url === "string" &&
    order.bukti_pembayaran_url !== PAYMENT_PROOF_URL_MARKER
  ) {
    sendJson(response, 200, { url: order.bukti_pembayaran_url });
    return;
  }

  const proofUid =
    typeof order.uid_pelanggan === "string" ? order.uid_pelanggan : uid;
  try {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(PAYMENT_PROOFS_BUCKET)
      .createSignedUrl(getPaymentProofPath(orderId, proofUid), 60);
    if (error) {
      sendStorageError(response, error);
      return;
    }
    sendJson(response, 200, { url: data.signedUrl });
  } catch (error) {
    console.error(
      "Could not create payment-proof download URL:",
      error instanceof Error ? error.message : "Unknown error"
    );
    sendJson(response, 500, {
      code: "server-error",
      error: "Tidak dapat membuka bukti pembayaran.",
    });
  }
}

async function handleDeleteProof(
  response: Response,
  orderId: string,
  uid: string,
  emailVerified: boolean
) {
  const [orderSnapshot, userSnapshot] = await Promise.all([
    firestore.collection("orders").doc(orderId).get(),
    firestore.collection("users").doc(uid).get(),
  ]);
  const order = orderSnapshot.data();
  const user = userSnapshot.data();
  if (!order || !user || order.bukti_pembayaran_url !== PAYMENT_PROOF_URL_MARKER) {
    sendJson(response, 404, {
      code: "proof-not-found",
      error: "Bukti pembayaran tidak ditemukan.",
    });
    return;
  }

  const isCustomerCancellingOwnOrder =
    user.role === "customer" &&
    (user.requires_email_verification !== true || emailVerified) &&
    order.uid_pelanggan === uid &&
    order.status_order === "menunggu" &&
    order.status_pembayaran !== "terverifikasi";
  if (user.role !== "admin" && !isCustomerCancellingOwnOrder) {
    sendJson(response, 403, {
      code: "forbidden",
      error: "Anda tidak dapat menghapus bukti pembayaran ini.",
    });
    return;
  }

  const proofUid = typeof order.uid_pelanggan === "string" ? order.uid_pelanggan : uid;
  try {
    const { error } = await getSupabaseAdmin()
      .storage.from(PAYMENT_PROOFS_BUCKET)
      .remove([getPaymentProofPath(orderId, proofUid)]);
    if (error) {
      sendStorageError(response, error);
      return;
    }
    sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error(
      "Could not remove payment proof:",
      error instanceof Error ? error.message : "Unknown error"
    );
    sendJson(response, 500, {
      code: "server-error",
      error: "Tidak dapat menghapus bukti pembayaran.",
    });
  }
}

export const paymentProofApi = onRequest(
  {
    region: REGION,
    invoker: "public",
    secrets: [SUPABASE_SERVICE_ROLE_KEY],
    timeoutSeconds: 30,
    maxInstances: 10,
  },
  async (request, response) => {
    response.set("Cache-Control", "no-store");

    try {
      const token = await authenticateRequest(request, response);
      if (!token) return;

      const path = getRequestPath(request);
      if (request.method === "POST" && path === "/upload-url") {
        await handleUploadUrl(
          request,
          response,
          token.uid,
          token.email_verified === true
        );
        return;
      }

      const match = /^\/([A-Za-z0-9_-]{1,128})$/.exec(path);
      if (!match) {
        sendJson(response, 404, { code: "not-found", error: "Endpoint tidak ditemukan." });
        return;
      }

      if (request.method === "GET") {
        await handleGetProof(
          response,
          match[1],
          token.uid,
          token.email_verified === true
        );
        return;
      }
      if (request.method === "DELETE") {
        await handleDeleteProof(
          response,
          match[1],
          token.uid,
          token.email_verified === true
        );
        return;
      }

      response.set("Allow", "GET, DELETE").status(405).end();
    } catch (error) {
      console.error(
        "Payment-proof function failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
      sendJson(response, 500, {
        code: "server-error",
        error: "Layanan bukti pembayaran mengalami gangguan.",
      });
    }
  }
);
