import Link from "next/link";
import { Badge, BrandMark } from "@/components/ui";
import { KatalogPreview } from "@/components/KatalogPreview";
import {
  LayoutDashboard,
  Shield,
  User,
  ArrowRight,
} from "lucide-react";

const ROLE_CARDS = [
  {
    role: "admin",
    tone: "yellow" as const,
    icon: Shield,
    desc: "Kelola order, produksi, tracking, dan estimasi. Full write access.",
    href: "/admin",
    gradient: "from-moon-yellow/20 via-moon-yellow/5 to-transparent",
  },
  {
    role: "owner",
    tone: "blue" as const,
    icon: LayoutDashboard,
    desc: "Pantau omzet & produksi. Read-only analytics.",
    href: "/owner",
    gradient: "from-moon-blue/20 via-moon-blue/5 to-transparent",
  },
  {
    role: "customer",
    tone: "pink" as const,
    icon: User,
    desc: "Hitung estimasi & lacak produksimu sendiri.",
    href: "/customer",
    gradient: "from-moon-pink/20 via-moon-pink/5 to-transparent",
  },
] as const;

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
              Masuk (semua role)
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {ROLE_CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.role}
              href={c.href}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/60 hover:border-zinc-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${c.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <Badge tone={c.tone} className="shadow-sm">
                    {c.role}
                  </Badge>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-moon-yellow/20 group-hover:text-moon-ink">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                  {c.desc}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-moon-blue transition-colors group-hover:text-moon-pink">
                  Buka dashboard
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <KatalogPreview />
    </main>
  );
}
