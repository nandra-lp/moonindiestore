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
      console.error("Could not create payment-proof upload URL:", error.message);
      return paymentProofJson({ code: "storage-error", error: "Tidak dapat menyiapkan unggahan. Coba lagi." }, 502);
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
