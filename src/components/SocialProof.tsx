"use client";

import { BrandMark } from "./ui";

const METRICS = [
  { value: "2023", label: "Tahun Berdiri", tone: "yellow" as const },
  { value: "500+", label: "Proyek Selesai", tone: "blue" as const },
  { value: "98%", label: "Tingkat Kepuasan", tone: "pink" as const },
];

const toneStyles: Record<"yellow" | "blue" | "pink", string> = {
  yellow: "bg-moon-yellow text-moon-ink hover:bg-moon-yellow/90",
  blue: "bg-moon-blue text-white hover:bg-moon-blue/90",
  pink: "bg-moon-pink text-white hover:bg-moon-pink/90",
};

export function SocialProof() {
  return (
    <section
      aria-labelledby="social-proof-heading"
      className="relative py-10 sm:py-14 bg-white border-y border-zinc-200"
    >
      {/* Gradient top accent - echoes Hero gradient blobs */}
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-moon-yellow via-moon-pink to-moon-blue"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl px-6">
        <header className="text-center mb-10 sm:mb-12">
          <p id="social-proof-heading" className="text-xs font-semibold uppercase tracking-widest text-moon-blue">
            Kepercayaan
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <BrandMark className="h-12 sm:h-16 shrink-0" plain />
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-moon-ink">
              Moon Indie Store
            </p>
          </div>
          <p className="mt-4 text-base sm:text-lg text-zinc-600 max-w-xl mx-auto leading-relaxed">
            Partner produksi custom terpercaya untuk kreator & UMKM Indonesia.
          </p>
        </header>

        {/* Subtle divider */}
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-moon-yellow/40 to-transparent mx-auto mb-10" aria-hidden="true" />

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {METRICS.map((metric, index) => (
            <div
              key={metric.label}
              className="group flex items-center gap-2.5 rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
              style={{ animationDelay: `${index * 80}ms` } as React.CSSProperties}
            >
              <div className={`${toneStyles[metric.tone]} inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold shadow-sm transition-all duration-200 group-hover:shadow-md`}>
                {metric.value}
              </div>
              <p className="text-sm font-medium text-zinc-700 whitespace-nowrap">{metric.label}</p>
            </div>
          ))}
        </div>

        <style jsx>{`
          @media (prefers-reduced-motion: reduce) {
            .group {
              transition: none !important;
              transform: none !important;
            }
            .group > div {
              transition: none !important;
            }
          }
          /* Staggered entrance animation */
          section > div > div:last-child > div {
            opacity: 0;
            transform: translateY(16px);
            animation: fadeUp 0.5s ease-out forwards;
          }
          @keyframes fadeUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            section > div > div:last-child > div {
              opacity: 1;
              transform: none;
              animation: none;
            }
          }
        `}</style>
      </div>
    </section>
  );
}