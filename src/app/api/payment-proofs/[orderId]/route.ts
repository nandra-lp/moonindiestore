import {
  getPaymentProofPath,
  getSupabaseAdmin,
  PAYMENT_PROOF_URL_MARKER,
  PAYMENT_PROOFS_BUCKET,
} from "@/lib/server/payment-proof-services";
import {
  authenticatePaymentProofRequest,
  getPaymentProofOrder,
  getPaymentProofUser,
  hasVerifiedEmail,
  paymentProofJson,
} from "@/lib/server/payment-proof-auth";

type RouteContext = { params: Promise<{ orderId: string }> };
const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export const runtime = "nodejs";

export async function GET(request: Request, { params }: RouteContext) {
  const { token, response: authResponse } = await authenticatePaymentProofRequest(request);
  if (authResponse) return authResponse;
  if (!token) return paymentProofJson({ code: "unauthorized", error: "Sesi login tidak valid." }, 401);

  try {
    const { orderId } = await params;
    if (!ORDER_ID_PATTERN.test(orderId)) {
      return paymentProofJson({ code: "invalid-order", error: "ID pesanan tidak valid." }, 400);
    }
    const [order, user] = await Promise.all([
      getPaymentProofOrder(orderId),
      getPaymentProofUser(token.uid),
    ]);
    if (!order || !user || order.bukti_pembayaran_url !== PAYMENT_PROOF_URL_MARKER) {
      return paymentProofJson({ code: "proof-not-found", error: "Bukti pembayaran tidak ditemukan." }, 404);
    }

    const isCustomerOwner =
      user.role === "customer" &&
      hasVerifiedEmail(token, user) &&
      order.uid_pelanggan === token.uid;
    const canReview = user.role === "admin" || user.role === "owner";
    if (!isCustomerOwner && !canReview) {
      return paymentProofJson({ code: "forbidden", error: "Anda tidak dapat melihat bukti pembayaran ini." }, 403);
    }

    const path = getPaymentProofPath(orderId, String(order.uid_pelanggan));
    const { data, error } = await getSupabaseAdmin()
      .storage.from(PAYMENT_PROOFS_BUCKET)
      .createSignedUrl(path, 60);
    if (error) {
      console.error("Could not create payment-proof download URL:", error.message);
      return paymentProofJson({ code: "storage-error", error: "Tidak dapat membuka bukti pembayaran." }, 502);
    }

    return paymentProofJson({ url: data.signedUrl }, 200);
  } catch (error) {
    console.error(
      "Payment-proof download failed:",
      error instanceof Error ? error.message : "Unknown server error"
    );
    return paymentProofJson({ code: "server-error", error: "Tidak dapat membuka bukti pembayaran." }, 500);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { token, response: authResponse } = await authenticatePaymentProofRequest(request);
  if (authResponse) return authResponse;
  if (!token) return paymentProofJson({ code: "unauthorized", error: "Sesi login tidak valid." }, 401);

  try {
    const { orderId } = await params;
    if (!ORDER_ID_PATTERN.test(orderId)) {
      return paymentProofJson({ code: "invalid-order", error: "ID pesanan tidak valid." }, 400);
    }
    const [order, user] = await Promise.all([
      getPaymentProofOrder(orderId),
      getPaymentProofUser(token.uid),
    ]);
    if (!order || !user || order.bukti_pembayaran_url !== PAYMENT_PROOF_URL_MARKER) {
      return paymentProofJson({ code: "proof-not-found", error: "Bukti pembayaran tidak ditemukan." }, 404);
    }

    const isCustomerCancellingOwnOrder =
      user.role === "customer" &&
      hasVerifiedEmail(token, user) &&
      order.uid_pelanggan === token.uid &&
      order.status_order === "menunggu" &&
      order.status_pembayaran !== "terverifikasi";
    if (user.role !== "admin" && !isCustomerCancellingOwnOrder) {
      return paymentProofJson({ code: "forbidden", error: "Anda tidak dapat menghapus bukti pembayaran ini." }, 403);
    }

    const path = getPaymentProofPath(orderId, String(order.uid_pelanggan));
    const { error } = await getSupabaseAdmin()
      .storage.from(PAYMENT_PROOFS_BUCKET)
      .remove([path]);
    if (error) {
      console.error("Could not remove payment proof:", error.message);
      return paymentProofJson({ code: "storage-error", error: "Tidak dapat menghapus bukti pembayaran." }, 502);
    }

    return paymentProofJson({ ok: true }, 200);
  } catch (error) {
    console.error(
      "Payment-proof deletion failed:",
      error instanceof Error ? error.message : "Unknown server error"
    );
    return paymentProofJson({ code: "server-error", error: "Tidak dapat menghapus bukti pembayaran." }, 500);
  }
}
