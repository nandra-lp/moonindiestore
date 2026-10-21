"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function ClosingCTA() {
  return (
    <section
      aria-labelledby="closing-cta-heading"
      className="py-14 sm:py-20 bg-white"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-moon-ink p-8 text-white sm:p-12 lg:p-16">
          <div className="absolute inset-0 bg-gradient-to-br from-moon-ink via-moon-ink to-zinc-900" />
          <span className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-moon-pink/30 blur-2xl" />
          <span className="absolute -bottom-24 right-32 h-56 w-56 rounded-full bg-moon-blue/30 blur-2xl" />
          <span className="absolute -left-10 bottom-6 h-20 w-20 rounded-full bg-moon-yellow/40 blur-xl" />

          <div className="relative text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-moon-yellow/10 px-4 py-1.5 text-sm font-medium text-moon-yellow mb-4">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Siap memulai produksi custom-mu?
            </div>

            <h2 id="closing-cta-heading" className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Wujudkan desain impianmu bersama <span className="text-moon-yellow">Moon Indie Store</span>
            </h2>

            <p className="mt-4 text-base text-white/70 sm:text-lg max-w-lg mx-auto">
              Hitung biaya, pesan, & pantau progres — semuanya di satu platform.
              Bergabung dengan ratusan kreator & UMKM yang sudah percaya.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-moon-yellow px-7 py-3 text-base font-semibold text-moon-ink transition hover:brightness-95 active:brightness-90 shadow-lg shadow-moon-yellow/20 min-w-[220px] justify-center"
              >
                Mulai Pesan Sekarang
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-3 text-base font-medium text-white transition hover:border-moon-yellow hover:text-moon-yellow hover:bg-white/5 min-w-[220px]"
              >
                Lihat Katalog Lengkap
              </Link>
            </div>

            <p className="mt-6 text-sm text-white/50">
              Gratis daftar · Tidak ada biaya tersembunyi · Bisa batalkan kapan saja
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}