"use client";

import { BrandMark, Card, ErrorBox, PrimaryLink, BackLink, Badge, roleTone } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { ExternalLink } from "lucide-react";

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
      <div className="relative overflow-hidden" style={{ borderImage: "linear-gradient(to right, #ffed00, #ff006e, #00aeef) 1" }}>
        {/* Subtle gradient top border */}
        <div className="absolute inset-0 h-1 bg-gradient-to-r from-moon-yellow via-moon-pink to-moon-blue" aria-hidden="true" />
        <Card className="text-center relative z-10">

        {/* Hero brand mark - larger with gradient ring */}
        <div className="relative flex justify-center mb-6">
          <div className="relative h-20 w-20 rounded-2xl bg-white shadow-lg ring-4 ring-moon-yellow/30 flex items-center justify-center">
            <BrandMark className="h-16 w-16" plain />
          </div>
        </div>

        {/* Headline + sub-headline */}
        <h1 className="text-3xl font-bold tracking-tight text-moon-ink md:text-4xl">Akses Ditolak</h1>
        <p className="mt-3 text-base text-zinc-600 md:text-lg">
          Role kamu tidak memiliki izin untuk membuka halaman ini.
        </p>

        {/* ErrorBox */}
        <div className="mt-5">
          <ErrorBox>
            Akses ditolak untuk role <span className="font-medium">{role ?? "tidak dikenal"}</span>.
          </ErrorBox>
        </div>

        {/* Role badge visual */}
        {role && (
          <div className="mt-4 flex justify-center">
            <Badge tone={roleTone(role)} className="text-sm px-3 py-1">
              {role}
            </Badge>
          </div>
        )}

        {/* CTA hierarchy - Primary prominent, Secondary as ghost */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <PrimaryLink href="/dashboard" className="w-full sm:w-auto min-h-[48px] px-6 text-base">
            Ke dashboard saya
          </PrimaryLink>
          <BackLink href={fallbackHref} className="w-full sm:w-auto justify-center">
            Kembali
          </BackLink>
        </div>

        {/* Footer guidance - more visible */}
        <p className="mt-6 text-sm text-zinc-500 flex items-center justify-center gap-1.5">
          Butuh akses?
          <a
            href="/contact"
            className="inline-flex items-center gap-1 font-medium text-moon-blue hover:text-moon-pink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
          >
            Hubungi admin
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </p>
      </Card>
    </div>
    </main>
  );
}
