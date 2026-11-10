"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getPaymentProofSignedUrl,
  SUPABASE_PAYMENT_PROOF_MARKER,
} from "@/lib/payment-proof-client";

export function PaymentProofLink({
  orderId,
  proofUrl,
  className,
  children,
}: {
  orderId: string;
  proofUrl: string;
  className: string;
  children: ReactNode;
}) {
  const { firebaseUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const isSupabaseProof = proofUrl === SUPABASE_PAYMENT_PROOF_MARKER;

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isSupabaseProof) return;
    event.preventDefault();
    setError(null);
    const proofWindow = window.open("about:blank", "_blank");
    if (proofWindow) proofWindow.opener = null;

    try {
      if (!firebaseUser) throw new Error("Sesi login berakhir. Silakan login kembali.");
      const signedUrl = await getPaymentProofSignedUrl(orderId, firebaseUser);
      if (proofWindow) proofWindow.location.replace(signedUrl);
      else window.location.assign(signedUrl);
    } catch (cause) {
      proofWindow?.close();
      setError(cause instanceof Error ? cause.message : "Tidak dapat membuka bukti pembayaran.");
    }
  }

  return (
    <span>
      <a
        href={isSupabaseProof ? "#" : proofUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={className}
      >
        {children}
      </a>
      {error && (
        <p className="mt-2 text-sm text-magenta" role="alert">
          {error}
        </p>
      )}
    </span>
  );
}
