"use client";

import {
  UserPlus,
  PackageSearch,
  Calculator,
  ShoppingCart,
  Truck,
  ArrowRight,
} from "lucide-react";

type StepColor = "yellow" | "blue" | "pink" | "ink";

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: StepColor;
  href: string;
  cta: string;
  ctaPrimary: boolean;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: "Daftar & Masuk",
    description: "Buat akun customer atau masuk ke dashboard kamu.",
    icon: UserPlus,
    color: "yellow",
    href: "/register",
    cta: "Daftar sekarang",
    ctaPrimary: true,
  },
  {
    number: 2,
    title: "Pilih Produk",
    description: "Jelajahi katalog, pilih jenis, ukuran, & kuantitas yang dibutuhkan.",
    icon: PackageSearch,
    color: "blue",
    href: "/register#katalog",
    cta: "Lihat katalog",
    ctaPrimary: false,
  },
  {
    number: 3,
    title: "Hitung Estimasi",
    description: "Isi detail pesanan & dapatkan perhitungan biaya otomatis & transparan.",
    icon: Calculator,
    color: "pink",
    href: "/customer/pesan",
    cta: "Coba estimasi",
    ctaPrimary: true,
  },
  {
    number: 4,
    title: "Pesan & Bayar",
    description: "Upload desain, checkout, & bayar dengan metode yang tersedia.",
    icon: ShoppingCart,
    color: "ink",
    href: "/customer/pesan",
    cta: "Mulai pesan",
    ctaPrimary: true,
  },
  {
    number: 5,
    title: "Pantau Progres",
    description: "Lacak status produksi real-time: diproses → produksi → selesai → dikirim.",
    icon: Truck,
    color: "yellow",
    href: "/customer/orders",
    cta: "Cek status",
    ctaPrimary: false,
  },
];

const colorStyles: Record<"yellow" | "blue" | "pink" | "ink", {
  bg: string;
  text: string;
  hoverBg: string;
  hoverText: string;
  shadow: string;
  dotBg: string;
}> = {
  yellow: {
    bg: "bg-moon-yellow/10",
    text: "text-moon-yellow",
    hoverBg: "group-hover:bg-moon-yellow",
    hoverText: "group-hover:text-moon-ink",
    shadow: "group-hover:shadow-[0_8px_24px_rgba(255,237,0,0.35)]",
    dotBg: "bg-moon-yellow",
  },
  blue: {
    bg: "bg-moon-blue/10",
    text: "text-moon-blue",
    hoverBg: "group-hover:bg-moon-blue",
    hoverText: "group-hover:text-white",
    shadow: "group-hover:shadow-[0_8px_24px_rgba(0,174,239,0.35)]",
    dotBg: "bg-moon-blue",
  },
  pink: {
    bg: "bg-moon-pink/10",
    text: "text-moon-pink",
    hoverBg: "group-hover:bg-moon-pink",
    hoverText: "group-hover:text-white",
    shadow: "group-hover:shadow-[0_8px_24px_rgba(255,0,110,0.35)]",
    dotBg: "bg-moon-pink",
  },
  ink: {
    bg: "bg-moon-ink/10",
    text: "text-moon-ink",
    hoverBg: "group-hover:bg-moon-ink",
    hoverText: "group-hover:text-white",
    shadow: "group-hover:shadow-[0_8px_24px_rgba(10,10,10,0.35)]",
    dotBg: "bg-moon-ink",
  },
};

const ctaStyles = {
  primary: "bg-moon-yellow text-moon-ink hover:brightness-95 active:brightness-90 shadow-lg shadow-moon-yellow/20",
  secondary: "border border-zinc-200 bg-white text-moon-blue hover:bg-moon-blue hover:text-white hover:border-moon-blue",
};

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="py-14 sm:py-16 lg:py-20 bg-white"
    >
      <div className="mx-auto max-w-5xl px-6">
        <header className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 lg:mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-moon-blue">
            Cara Kerja
          </p>
          <h2 id="how-it-works-heading" className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-moon-ink">
            Pesan Produksi Custom jadi Simple
          </h2>
          <p className="mt-3 text-base sm:text-lg text-zinc-600">
            Dari ide hingga di tanganmu — 5 langkah jelas, tanpa tebak-tebakan.
          </p>
        </header>

        <ol className="relative" role="list" aria-label="Langkah-langkah pemesanan">
          {/* Desktop: horizontal connector line */}
          <div className="hidden lg:absolute lg:left-0 lg:right-0 lg:top-[56px] lg:h-px lg:bg-gradient-to-r lg:from-moon-yellow lg:via-moon-pink lg:to-moon-blue" aria-hidden="true" />

          <div className="relative lg:flex lg:items-start lg:justify-between lg:gap-4">
            {STEPS.map((step, index) => {
              const colors = colorStyles[step.color];
              const isLast = index === STEPS.length - 1;

              return (
                <li
                  key={step.number}
                  className="relative group"
                  style={{ "--delay": `${index * 100}ms` } as React.CSSProperties}
                >
                  {/* Mobile: vertical connector line between items */}
                  <div className="lg:hidden absolute left-10 top-full bottom-0 w-px bg-gradient-to-b from-moon-yellow to-moon-pink -translate-x-1/2 last:hidden" aria-hidden="true" />

                  <article className="relative lg:flex-1 lg:max-w-xs">
                    {/* Step number badge - mobile: top center, desktop: left of card */}
                    <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-[-16px] lg:top-[52px] lg:translate-x-0 lg:translate-y-0 flex items-center justify-center w-8 h-8 rounded-full bg-moon-yellow text-moon-ink font-bold text-sm select-none z-10">
                      {step.number.toString().padStart(2, "0")}
                    </div>

                    {/* Desktop: connector dot on the horizontal line */}
                    <div className="hidden lg:absolute lg:left-1/2 lg:top-[52px] lg:-translate-x-1/2 lg:z-10">
                      <div className={`flex h-2.5 w-2.5 rounded-full border-2 border-white transition-all duration-300 ${colors.dotBg} group-hover:scale-125`} aria-hidden="true" />
                    </div>

                    {/* Card content */}
                    <div className="relative pt-14 lg:pt-0 lg:pl-0 lg:pr-4 text-center lg:text-left">
                      {/* Icon wrapper */}
                      <div
                        className={`relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${colors.bg} ${colors.text} ${colors.hoverBg} ${colors.hoverText} ${colors.shadow}`}
                      >
                        <step.icon className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
                      </div>

                      <h3 className="mt-5 text-lg font-semibold text-moon-ink">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-base text-zinc-600 leading-relaxed">
                        {step.description}
                      </p>

                      <a
                        href={step.href}
                        className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue min-h-[44px] ${step.ctaPrimary ? ctaStyles.primary : ctaStyles.secondary}`}
                      >
                        {step.cta}
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                      </a>
                    </div>

                    {/* Desktop: step separator line extension (visual only) */}
                    {(!isLast) && (
                      <div className="hidden lg:absolute lg:left-[calc(50%+8px)] lg:right-[calc(50%+8px)] lg:top-[52px] lg:h-px lg:bg-gradient-to-r lg:from-moon-yellow lg:via-moon-pink lg:to-moon-blue" aria-hidden="true" />
                    )}
                  </article>
                </li>
              );
            })}
          </div>
        </ol>
      </div>

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .group *,
          .group {
            transition: none !important;
            animation: none !important;
            transform: none !important;
          }
        }
        /* Staggered entrance animation using CSS custom property */
        ol > li {
          opacity: 0;
          transform: translateY(16px);
          animation: fadeUp 0.5s ease-out forwards;
          animation-delay: var(--delay, 0ms);
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