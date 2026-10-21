import Link from "next/link";
import { KatalogPreview } from "@/components/KatalogPreview";
import { SocialProof } from "@/components/SocialProof";
import { HowItWorks } from "@/components/HowItWorks";
import { ClosingCTA } from "@/components/ClosingCTA";
import { ArrowRight, Sparkles, Shield, Truck } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10 sm:py-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-moon-ink p-8 text-white sm:p-12 lg:p-16">
        {/* Top brand accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-moon-yellow/60 to-transparent" aria-hidden="true" />

        {/* Background gradients - more refined */}
        <div className="absolute inset-0 bg-gradient-to-br from-moon-ink via-moon-ink to-zinc-950" />
        <span className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-moon-pink/20 blur-3xl" />
        <span className="absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-moon-blue/15 blur-3xl" />
        <span className="absolute -left-12 bottom-8 h-24 w-24 rounded-full bg-moon-yellow/25 blur-2xl" />

        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.03%22/%3E%3C/svg%3E')]" aria-hidden="true" />

        <div className="relative">
          {/* Eyebrow + Brand */}
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-moon-yellow/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-moon-yellow">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Sistem Pemesanan & Produksi
            </span>
          </div>

          {/* Headline */}
          <h1 className="max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Cetak & kemas impianmu bersama{" "}
            <span className="text-moon-yellow">Moon Indie Store</span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-5 max-w-2xl text-base sm:text-lg text-white/70 leading-relaxed">
            Hitung estimasi biaya, pesan, lalu pantau progres produksimu tahap
            demi tahap — semua dalam satu tempat.
          </p>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/50">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-moon-yellow/80" aria-hidden="true" />
              <span>Garansi kualitas cetak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-moon-blue/80" aria-hidden="true" />
              <span>Kirim seluruh Indonesia</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-moon-pink/80" aria-hidden="true" />
              <span>Desain custom gratis</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-moon-yellow px-7 py-3.5 text-base font-semibold text-moon-ink transition hover:brightness-95 active:brightness-90 shadow-lg shadow-moon-yellow/30 min-w-[240px]"
            >
              Mulai Pesan Sekarang
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2.5 rounded-full border border-white/20 px-7 py-3.5 text-base font-medium text-white transition hover:border-moon-yellow hover:text-moon-yellow hover:bg-white/5 min-w-[240px]"
            >
              Masuk ke Dashboard
            </Link>
          </div>

          {/* Bottom accent */}
          <div className="mt-12 h-px bg-gradient-to-r from-transparent via-moon-yellow/40 to-transparent" aria-hidden="true" />
        </div>
      </section>

      <SocialProof />

      <KatalogPreview />

      <HowItWorks />

      <ClosingCTA />
    </main>
  );
}