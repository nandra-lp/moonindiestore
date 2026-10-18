"use client";

import { BrandMark, Card, ErrorBox, PrimaryLink, BackLink } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

export default function UnauthorizedPage() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        <Card className="text-center">
          <p className="text-sm text-zinc-500">Memeriksa sesi…</p>
        </Card>
      </main>
    );
  }

  const referrer = typeof document !== "undefined" ? document.referrer : null;
  const fallbackHref = referrer && referrer !== window.location.href ? referrer : "/dashboard";

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <Card className="text-center">
        <div className="flex justify-center">
          <BrandMark className="h-12 w-12" />
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-moon-ink md:text-3xl">403 — Akses ditolak</h1>
        <div className="mt-3">
          <ErrorBox>Role kamu tidak diizinkan membuka halaman ini.</ErrorBox>
        </div>

        {role && (
          <p className="mt-2 text-xs text-zinc-500">
            Role saat ini: <span className="font-medium text-moon-ink">{role}</span>
          </p>
        )}

        <BackLink href={fallbackHref} className="mt-4 w-full">
          Kembali ke halaman sebelumnya
        </BackLink>
        <PrimaryLink href="/dashboard" className="mt-3 w-full">
          Ke dashboard saya
        </PrimaryLink>

        <p className="mt-4 text-xs text-zinc-500">
          Butuh akses? <a href="/contact" className="text-moon-blue underline">Hubungi admin</a>
        </p>
      </Card>
    </main>
  );
}
