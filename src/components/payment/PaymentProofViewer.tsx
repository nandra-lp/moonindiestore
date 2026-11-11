"use client";

import { useState, type MouseEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { Image as ImageIcon, X, Download, ExternalLink } from "lucide-react";
import { Dialog } from "@/components/ui";
import {
  getPaymentProofSignedUrl,
  SUPABASE_PAYMENT_PROOF_MARKER,
} from "@/lib/payment-proof-client";

export function PaymentProofViewer({
  orderId,
  proofUrl,
  className,
  children,
}: {
  orderId: string;
  proofUrl: string | null | undefined;
  className?: string;
  children?: React.ReactNode;
}) {
  const { firebaseUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupabaseProof = proofUrl === SUPABASE_PAYMENT_PROOF_MARKER;
  const isPublicUrl = Boolean(proofUrl) && !isSupabaseProof;

  async function handleOpen(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setError(null);
    setSignedUrl(null);
    setLoading(true);
    setIsOpen(true);

    if (!isSupabaseProof) return;

    try {
      if (!firebaseUser) {
        throw new Error("Sesi login berakhir. Silakan login kembali.");
      }
      const url = await getPaymentProofSignedUrl(orderId, firebaseUser);
      setSignedUrl(url);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Tidak dapat memuat bukti pembayaran.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setSignedUrl(null);
    setError(null);
  }

  if (!proofUrl) return null;

  // Bukti publik (Firebase Storage lama) — tampilkan langsung tanpa signed URL.
  if (isPublicUrl) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-ink">Bukti Pembayaran</h3>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-ink transition"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center min-h-[300px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL Storage dinamis */}
            <img src={proofUrl} alt="Bukti pembayaran" className="max-w-full max-h-[60vh] object-contain" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <a
              href={proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-moon-ink/25 px-4 py-1.5 text-sm font-medium text-moon-ink transition hover:border-moon-blue hover:text-moon-blue"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Buka di tab baru
            </a>
            <button
              onClick={handleClose}
              className="rounded-full bg-moon-pink px-4 py-1.5 text-sm font-medium text-white transition hover:brightness-95"
            >
              Tutup
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  // Bukti Supabase (privak) — butuh signed URL dari server sebelum ditampilkan.
  return (
    <>
      <button
        onClick={handleOpen}
        className={`inline-flex items-center gap-2 rounded-full border border-moon-ink/25 px-4 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-moon-blue hover:text-moon-blue hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed ${className ?? ""}`}
        disabled={loading}
      >
        {loading ? (
          <>
            <ImageIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
            Memuat bukti…
          </>
        ) : children ?? (
          <>
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
            Lihat bukti pembayaran
          </>
        )}
      </button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-ink">Bukti Pembayaran</h3>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-ink transition"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {error ? (
            <div className="rounded-xl border border-moon-pink/30 bg-moon-pink/10 p-4 text-sm text-moon-pink">
              {error}
              <button
                onClick={handleOpen}
                className="mt-3 inline-flex items-center gap-1 rounded-lg border border-moon-pink/50 px-3 py-1.5 text-xs font-medium text-moon-pink hover:bg-moon-pink/50 transition"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Coba lagi
              </button>
            </div>
          ) : signedUrl ? (
            <>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center min-h-[300px]">
                {/* eslint-disable-next-line @next/next/no-img-element -- URL signed Storage dinamis */}
                <img
                  src={signedUrl}
                  alt="Bukti pembayaran"
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-moon-ink/25 px-4 py-1.5 text-sm font-medium text-moon-ink transition hover:border-moon-blue hover:text-moon-blue"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Buka di tab baru
                </a>
                <button
                  onClick={handleClose}
                  className="rounded-full bg-moon-pink px-4 py-1.5 text-sm font-medium text-white transition hover:brightness-95"
                >
                  Tutup
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
              <ImageIcon className="h-8 w-8 mb-2 text-zinc-400" aria-hidden="true" />
              <p>Memuat bukti pembayaran…</p>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
