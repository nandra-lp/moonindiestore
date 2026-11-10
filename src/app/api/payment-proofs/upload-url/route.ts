import {
  MAX_PAYMENT_PROOF_BYTES,
  PAYMENT_PROOF_CONTENT_TYPES,
  getPaymentProofPath,
  getSupabaseAdmin,
  PAYMENT_PROOFS_BUCKET,
} from "@/lib/server/payment-proof-services";
import {
  authenticatePaymentProofRequest,
  getPaymentProofOrder,
  getPaymentProofUser,
  hasVerifiedEmail,
  paymentProofJson,
} from "@/lib/server/payment-proof-auth";

const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export const runtime = "nodejs";

function getStorageErrorDetails(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return { status: undefined, statusCode: undefined };
  }
  const status =
    "status" in error && typeof error.status === "number" ? error.status : undefined;
  const statusCode =
    "statusCode" in error && typeof error.statusCode === "string"
      ? error.statusCode
      : undefined;
  return { status, statusCode };
}

function getStorageErrorResponse(status?: number) {
  if (status === 401 || status === 403) {
    return {
      code: "supabase-credentials-invalid",
      error:
        "Supabase menolak kredensial server. Periksa SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di environment Netlify, lalu redeploy.",
    };
  }
  if (status === 404) {
    return {
      code: "supabase-bucket-not-found",
      error:
        "Bucket payment-proofs tidak ditemukan pada proyek Supabase yang digunakan server. Pastikan SUPABASE_URL mengarah ke proyek yang benar dan migration bucket sudah diterapkan.",
    };
  }
  return {
    code: "supabase-storage-unavailable",
    error:
      "Supabase Storage gagal menyiapkan unggahan. Periksa status proyek Supabase dan log fungsi Netlify, lalu coba lagi.",
  };
}

export async function POST(request: Request) {
  const { token, response: authResponse } = await authenticatePaymentProofRequest(request);
  if (authResponse) return authResponse;
  if (!token) return paymentProofJson({ code: "unauthorized", error: "Sesi login tidak valid." }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return paymentProofJson({ code: "invalid-request", error: "Permintaan unggah tidak valid." }, 400);
  }

  if (typeof body !== "object" || body === null) {
    return paymentProofJson({ code: "invalid-request", error: "Permintaan unggah tidak valid." }, 400);
  }

  const { orderId, contentType, size } = body as {
    orderId?: unknown;
    contentType?: unknown;
    size?: unknown;
  };
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
    return paymentProofJson({ code: "invalid-file", error: "Format atau ukuran file bukti tidak valid." }, 400);
  }

  try {
    const [order, user] = await Promise.all([
      getPaymentProofOrder(orderId),
      getPaymentProofUser(token.uid),
    ]);
    if (!order || !user) {
      return paymentProofJson({ code: "order-not-found", error: "Pesanan tidak ditemukan." }, 404);
    }
    if (
      user.role !== "customer" ||
      !hasVerifiedEmail(token, user) ||
      order.uid_pelanggan !== token.uid
    ) {
      return paymentProofJson({ code: "forbidden", error: "Anda tidak dapat mengunggah bukti untuk pesanan ini." }, 403);
    }
    if (
      order.order_siap === false ||
      order.status_order !== "diproses" ||
      !["bca", "qris"].includes(String(order.metode_pembayaran)) ||
      !["menunggu", "bukti_dikirim"].includes(String(order.status_pembayaran ?? "menunggu"))
    ) {
      return paymentProofJson({ code: "order-not-payable", error: "Pesanan belum dapat menerima bukti pembayaran." }, 409);
    }

    const path = getPaymentProofPath(orderId, token.uid);
    const { data, error } = await getSupabaseAdmin()
      .storage.from(PAYMENT_PROOFS_BUCKET)
      .createSignedUploadUrl(path, { upsert: true });

    if (error) {
      const details = getStorageErrorDetails(error);
      console.error("Could not create payment-proof upload URL:", {
        status: details.status,
        statusCode: details.statusCode,
      });
      return paymentProofJson(
        getStorageErrorResponse(details.status),
        details.status === 401 || details.status === 403 || details.status === 404
          ? details.status
          : 502
      );
    }

    return paymentProofJson({ path, signedUrl: data.signedUrl }, 200);
  } catch (error) {
    console.error(
      "Payment-proof upload setup failed:",
      error instanceof Error ? error.message : "Unknown server error"
    );
    return paymentProofJson({ code: "server-error", error: "Layanan unggah belum dikonfigurasi dengan benar." }, 500);
  }
}
