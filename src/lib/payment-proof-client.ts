import type { User as FirebaseUser } from "firebase/auth";
import { hapusFileStorage } from "@/lib/storage";

export const MAX_BUKTI_PEMBAYARAN_BYTES = 5 * 1024 * 1024;
const TIPE_BUKTI_PEMBAYARAN_OK = ["image/jpeg", "image/png", "image/webp"];
export const SUPABASE_PAYMENT_PROOF_MARKER = "supabase:private";
const API_REQUEST_TIMEOUT_MS = 30_000;

type UploadUrlResult = { path: string; signedUrl: string };

function isUploadUrlResult(value: unknown): value is UploadUrlResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "path" in value &&
    typeof value.path === "string" &&
    "signedUrl" in value &&
    typeof value.signedUrl === "string"
  );
}

export function validasiBuktiPembayaran(file: File): string | null {
  if (!TIPE_BUKTI_PEMBAYARAN_OK.includes(file.type)) {
    return "Bukti pembayaran harus berupa gambar JPG, PNG, atau WebP.";
  }
  if (file.size > MAX_BUKTI_PEMBAYARAN_BYTES) {
    return "Ukuran bukti pembayaran maksimal 5 MB.";
  }
  return null;
}

async function getIdToken(user: FirebaseUser) {
  return user.getIdToken();
}

async function fetchPaymentProofApi(input: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw Object.assign(new Error("Permintaan ke layanan bukti pembayaran melewati batas waktu."), {
        code: "request-timeout",
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function getApiError(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null);
  if (typeof body === "object" && body !== null && "error" in body && typeof body.error === "string") {
    const code = "code" in body && typeof body.code === "string" ? body.code : "request-failed";
    return Object.assign(new Error(body.error), { code });
  }
  return Object.assign(new Error(fallback), { code: "request-failed" });
}

export async function uploadBuktiPembayaran(
  file: File,
  orderId: string,
  user: FirebaseUser,
  onProgress?: (progress: number) => void
): Promise<{ url: string; path: string }> {
  const validationError = validasiBuktiPembayaran(file);
  if (validationError) throw new Error(validationError);

  const token = await getIdToken(user);
  const response = await fetchPaymentProofApi("/api/payment-proofs/upload-url", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderId, contentType: file.type, size: file.size }),
  });
  if (!response.ok) throw await getApiError(response, "Tidak dapat menyiapkan unggahan.");

  const result: unknown = await response.json();
  if (!isUploadUrlResult(result)) {
    throw Object.assign(new Error("Respons unggahan tidak valid."), { code: "invalid-response" });
  }

  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("Supabase belum dikonfigurasi pada aplikasi."), {
      code: "supabase-not-configured",
    });
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", result.signedUrl);
    xhr.setRequestHeader("apikey", apiKey);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(
        Object.assign(new Error("Supabase menolak file bukti pembayaran."), {
          code: xhr.status === 413 ? "file-too-large" : "storage-upload-failed",
        })
      );
    };
    xhr.onerror = () => {
      reject(
        Object.assign(new Error("Koneksi ke Supabase Storage gagal."), {
          code: "network-request-failed",
        })
      );
    };
    xhr.ontimeout = () => {
      reject(
        Object.assign(new Error("Unggahan melewati batas waktu 2 menit."), {
          code: "upload-timeout",
        })
      );
    };
    xhr.onabort = () => {
      reject(Object.assign(new Error("Unggahan dibatalkan."), { code: "upload-aborted" }));
    };
    xhr.send(file);
  });

  return { url: SUPABASE_PAYMENT_PROOF_MARKER, path: result.path };
}

export async function getPaymentProofSignedUrl(orderId: string, user: FirebaseUser) {
  const token = await getIdToken(user);
  const response = await fetchPaymentProofApi(`/api/payment-proofs/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw await getApiError(response, "Tidak dapat membuka bukti pembayaran.");

  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null || !("url" in body) || typeof body.url !== "string") {
    throw new Error("Tautan bukti pembayaran tidak valid.");
  }
  return body.url;
}

export async function deleteSupabasePaymentProof(orderId: string, user: FirebaseUser) {
  const token = await getIdToken(user);
  const response = await fetchPaymentProofApi(`/api/payment-proofs/${encodeURIComponent(orderId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw await getApiError(response, "Tidak dapat menghapus bukti pembayaran.");
}

export async function deletePaymentProofForOrder(
  orderId: string,
  proofUrl: string | null | undefined,
  proofPath: string | null | undefined,
  user: FirebaseUser | null
) {
  if (!proofPath) return;
  if (proofUrl === SUPABASE_PAYMENT_PROOF_MARKER) {
    if (!user) throw new Error("Sesi login berakhir. Silakan login kembali.");
    await deleteSupabasePaymentProof(orderId, user);
    return;
  }
  await hapusFileStorage(proofPath);
}
