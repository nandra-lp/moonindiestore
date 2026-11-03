"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { pesanErrorAuth } from "@/lib/auth-errors";
import { resolveTarget } from "@/lib/role-route";
import {
  BrandMark,
  Card,
  ErrorBox,
  GhostButton,
  PrimaryButton,
  SuccessBox,
} from "@/components/ui";

export default function VerifyEmailPage() {
  const {
    firebaseUser,
    role,
    loading,
    needsEmailVerification,
    resendVerificationEmail,
    refreshEmailVerification,
    logout,
  } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (!needsEmailVerification) {
      router.replace(resolveTarget(role) ?? "/login");
    }
  }, [loading, firebaseUser, needsEmailVerification, role, router]);

  async function handleResend() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await resendVerificationEmail();
      setMessage("Email verifikasi telah dikirim. Periksa inbox dan folder spam.");
    } catch (err) {
      setError(pesanErrorAuth(err, "Email verifikasi gagal dikirim. Coba lagi."));
    } finally {
      setBusy(false);
    }
  }

  async function handleCheckVerification() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const isVerified = await refreshEmailVerification();
      if (!isVerified) {
        setMessage("Email belum terverifikasi. Buka tautan di email, lalu coba lagi.");
        return;
      }
      window.location.assign(resolveTarget(role) ?? "/customer");
    } catch (err) {
      setError(pesanErrorAuth(err, "Status verifikasi gagal diperiksa. Coba lagi."));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setError(null);
    try {
      await logout();
      router.replace("/login");
    } catch (err) {
      setError(pesanErrorAuth(err, "Gagal keluar dari akun. Coba lagi."));
    } finally {
      setBusy(false);
    }
  }

  if (loading || !firebaseUser || !needsEmailVerification) {
    return <p className="p-8 text-sm text-zinc-500">Memeriksa status verifikasi…</p>;
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-6 py-16">
      <Card className="w-full">
        <div className="flex items-center gap-3">
          <BrandMark className="h-12 w-12" />
          <div>
            <p className="text-sm font-semibold text-moon-blue">Satu langkah lagi</p>
            <h1 className="text-2xl font-semibold text-moon-ink">
              Verifikasi email
            </h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          Gunakan tautan verifikasi yang dikirim ke{" "}
          <strong className="break-all text-moon-ink">{firebaseUser.email}</strong>.
          Buka tautan tersebut untuk mengaktifkan akses akun customer.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Jika email tidak terlihat, periksa folder spam atau kirim ulang tautannya.
        </p>

        {error && (
          <div className="mt-5">
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
        {message && (
          <div className="mt-5">
            <SuccessBox>{message}</SuccessBox>
          </div>
        )}

        <div className="mt-6 grid gap-3">
          <PrimaryButton
            type="button"
            disabled={busy}
            onClick={handleCheckVerification}
            className="w-full"
          >
            {busy ? "Memeriksa…" : "Saya sudah verifikasi"}
          </PrimaryButton>
          <GhostButton
            type="button"
            disabled={busy}
            onClick={handleResend}
            className="w-full justify-center"
          >
            Kirim ulang email verifikasi
          </GhostButton>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={handleLogout}
          className="mt-5 w-full rounded-sm text-center text-sm font-medium text-zinc-500 hover:text-moon-ink disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
        >
          Keluar dari akun
        </button>
      </Card>
    </main>
  );
}
