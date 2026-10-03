import Link from "next/link";
import { BrandMark } from "@/components/ui";
import { KatalogPreview } from "@/components/KatalogPreview";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10 sm:py-12">
      <section className="relative overflow-hidden rounded-3xl bg-moon-ink p-8 text-white sm:p-12 lg:p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-moon-ink via-moon-ink to-zinc-900" />
        <span className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-moon-pink/30 blur-2xl" />
        <span className="absolute -bottom-24 right-32 h-56 w-56 rounded-full bg-moon-blue/30 blur-2xl" />
        <span className="absolute -left-10 bottom-6 h-20 w-20 rounded-full bg-moon-yellow/40 blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-9 w-9 shrink-0" plain />
            <p className="text-xs font-semibold uppercase tracking-widest text-moon-yellow">
              Sistem Pemesanan & Produksi
            </p>
          </div>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Cetak & kemas impianmu bersama{" "}
            <span className="text-moon-yellow">Moon Indie Store</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
            Hitung estimasi biaya, pesan, lalu pantau progres produksimu tahap
            demi tahap — semua dalam satu tempat.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-moon-yellow px-6 py-2.5 text-sm font-semibold text-moon-ink transition hover:brightness-95 active:brightness-90 shadow-lg shadow-moon-yellow/20"
            >
              Daftar sebagai Customer
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/30 px-6 py-2.5 text-sm font-medium text-white transition hover:border-moon-yellow hover:text-moon-yellow hover:bg-white/5"
            >
              Masuk
            </Link>
          </div>
        </div>
      </section>

      <KatalogPreview />
    </main>
  );
}
