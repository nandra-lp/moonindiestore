"use client";

import {
  UserPlus,
  PackageSearch,
  Calculator,
  ShoppingCart,
  Truck,
} from "lucide-react";

const STEPS = [
  {
    number: 1,
    title: "Daftar & Masuk",
    description: "Buat akun customer atau masuk ke dashboard kamu.",
    icon: UserPlus,
    iconBg: "bg-moon-yellow/10 text-moon-yellow",
    iconHover: "group-hover:bg-moon-yellow group-hover:text-moon-ink group-hover:shadow-[0_8px_24px_rgba(255,237,0,0.3)]",
    href: "/register",
    cta: "Daftar sekarang",
    ctaPrimary: true,
  },
  {
    number: 2,
    title: "Pilih Produk",
    description: "Jelajahi katalog, pilih jenis, ukuran, & kuantitas yang dibutuhkan.",
    icon: PackageSearch,
    iconBg: "bg-moon-blue/10 text-moon-blue",
    iconHover: "group-hover:bg-moon-blue group-hover:text-white group-hover:shadow-[0_8px_24px_rgba(0,174,239,0.3)]",
    href: "/register",
    cta: "Lihat katalog",
    ctaPrimary: false,
  },
  {
    number: 3,
    title: "Hitung Estimasi",
    description: "Isi detail pesanan & dapatkan perhitungan biaya otomatis & transparan.",
    icon: Calculator,
    iconBg: "bg-moon-pink/10 text-moon-pink",
    iconHover: "group-hover:bg-moon-pink group-hover:text-white group-hover:shadow-[0_8px_24px_rgba(255,0,110,0.3)]",
    href: "/customer/pesan",
    cta: "Coba estimasi",
    ctaPrimary: true,
  },
  {
    number: 4,
    title: "Pesan & Bayar",
    description: "Upload desain, checkout, & bayar dengan metode yang tersedia.",
    icon: ShoppingCart,
    iconBg: "bg-emerald-500/10 text-emerald-600",
    iconHover: "group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_8px_24px_rgba(16,185,129,0.3)]",
    href: "/customer/pesan",
    cta: "Mulai pesan",
    ctaPrimary: true,
  },
  {
    number: 5,
    title: "Pantau Progres",
    description: "Lacak status produksi real-time: diproses → produksi → selesai → dikirim.",
    icon: Truck,
    iconBg: "bg-violet-500/10 text-violet-600",
    iconHover: "group-hover:bg-violet-500 group-hover:text-white group-hover:shadow-[0_8px_24px_rgba(139,92,246,0.3)]",
    href: "/customer/orders",
    cta: "Cek status",
    ctaPrimary: false,
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="py-14 sm:py-20 bg-white"
    >
      <div className="mx-auto max-w-5xl px-6">
        <header className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-moon-blue">
            Cara Kerja
          </p>
          <h2 id="how-it-works-heading" className="mt-2 text-3xl font-bold tracking-tight text-moon-ink sm:text-4xl">
            Pesan Produksi Custom jadi Simple
          </h2>
          <p className="mt-3 text-base text-zinc-600 sm:text-lg">
            Dari ide hingga di tanganmu — 5 langkah jelas, tanpa tebak-tebakan.
          </p>
        </header>

        <ol className="relative" role="list" aria-label="Langkah-langkah pemesanan">
          {/* Vertical connector line - hidden on mobile, shown on desktop */}
          <div className="hidden lg:absolute lg:left-1/2 lg:top-0 lg:h-full lg:w-px lg:bg-gradient-to-b lg:from-moon-yellow lg:via-moon-pink lg:to-moon-blue lg:-translate-x-1/2" aria-hidden="true" />

          <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-4">
            {STEPS.map((step, index) => (
              <li
                key={step.number}
                className="relative group"
                style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
              >
                {/* Mobile: connector line between items */}
                <div className="lg:hidden absolute left-1/2 top-full h-8 w-px bg-gradient-to-b from-moon-yellow to-moon-pink -translate-x-1/2" aria-hidden="true" />

                <article className="relative lg:max-w-xs">
                  {/* Desktop: connector dot on the line */}
                  <div className="hidden lg:flex lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:z-10">
                    <div
                      className={`flex h-3 w-3 rounded-full border-2 border-white transition-all duration-300 ${step.iconBg.replace("bg-", "bg-").replace("text-", "bg-")} group-hover:scale-125`}
                      style={{ backgroundColor: step.iconBg.includes("moon-yellow") ? "#ffed00" :
                               step.iconBg.includes("moon-blue") ? "#00aeef" :
                               step.iconBg.includes("moon-pink") ? "#ff006e" :
                               step.iconBg.includes("emerald") ? "#10b981" : "#8b5cf6" }}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="lg:pl-16 lg:pr-4 lg:text-left text-center">
                    {/* Step number badge */}
                    <div className="absolute lg:left-0 lg:top-0 lg:translate-x-full lg:-translate-y-1/2 hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-moon-yellow text-moon-ink font-bold text-sm select-none">
                      {step.number.toString().padStart(2, "0")}
                    </div>

                    {/* Mobile step number */}
                    <div className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-full bg-moon-yellow text-moon-ink font-bold text-sm mb-3 mx-auto select-none">
                      {step.number.toString().padStart(2, "0")}
                    </div>

                    {/* Icon wrapper */}
                    <div
                      className={`relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${step.iconBg} ${step.iconHover}`}
                    >
                      <step.icon className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
                    </div>

                    <h3 className="mt-5 text-xl font-semibold text-moon-ink lg:text-left">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-base text-zinc-600 leading-relaxed lg:text-left">
                      {step.description}
                    </p>

                    <a
                      href={step.href}
                      className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue min-h-[48px] ${step.ctaPrimary
                        ? "bg-moon-yellow text-moon-ink hover:brightness-95 active:brightness-90 shadow-lg shadow-moon-yellow/20"
                        : "border border-zinc-200 bg-white text-moon-blue hover:bg-moon-blue hover:text-white hover:border-moon-blue"
                      }`}
                    >
                      {step.cta}
                      <span className="transition-transform group-hover:translate-x-0.5">→</span>
                    </a>
                  </div>
                </article>
              </li>
            ))}
          </div>
        </ol>
      </div>

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .group * {
            transition: none !important;
            animation: none !important;
          }
        }
        /* Staggered entrance animation */
        ol > li {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.5s ease-out forwards;
        }
        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          ol > li {
            opacity: 1;
            transform: none;
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}