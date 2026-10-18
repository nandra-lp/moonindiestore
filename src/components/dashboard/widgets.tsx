"use client";

// Widget bersama dashboard — menggantikan markup duplikat yang tersebar di
// halaman admin/owner/customer (live badge, filter pills, kartu order,
// kartu statistik tertaut, empty state).

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Badge, BrandMark, orderTone } from "@/components/ui";
import type { StatusOrder } from "@/types/firestore";

// ---------- LiveBadge: penanda data realtime ----------
export function LiveBadge() {
  return (
    <span
      title="Status terupdate otomatis"
      className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-600" />
      </span>
      Live
    </span>
  );
}

// ---------- FilterPills: filter status order + jumlah ----------
export function FilterPills<T extends string>({
  options,
  value,
  counts,
  onChange,
}: {
  options: readonly T[];
  value: T;
  counts: Record<string, number>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter status">
      {options.map((f) => {
        const active = value === f;
        return (
          <button
            key={f}
            onClick={() => onChange(f)}
            aria-pressed={active}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue ${
              active
                ? "border-moon-ink bg-moon-ink text-moon-yellow shadow-sm"
                : "border-zinc-300 bg-white hover:border-moon-blue hover:text-moon-blue"
            }`}
          >
            {f} ({counts[f] ?? 0})
          </button>
        );
      })}
    </div>
  );
}

// ---------- OrderCard: kartu ringkas satu order (admin & owner) ----------
export function OrderCard({
  href,
  title,
  status,
  summary,
  dateLabel,
  date,
  totalLabel,
  total,
}: {
  href: string;
  title: string;
  status: StatusOrder;
  summary: string;
  dateLabel: string;
  date: string;
  totalLabel: string;
  total: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-moon-yellow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-bold text-moon-ink">{title}</span>
        <Badge tone={orderTone(status)}>{status}</Badge>
      </div>
      <p className="mt-1.5 truncate text-xs text-zinc-500">{summary}</p>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
        <div className="min-w-0">
          <p className="mb-0.5 text-xs text-zinc-500">{dateLabel}</p>
          <p className="truncate text-sm text-moon-ink">{date}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="mb-0.5 text-xs text-zinc-500">{totalLabel}</p>
          <p className="text-sm font-bold text-moon-ink">{total}</p>
        </div>
      </div>
    </Link>
  );
}

// ---------- StatLink: kartu statistik yang tertaut (gaya Stat) ----------
export function StatLink({
  href,
  label,
  value,
  accent = "yellow",
  icon: Icon,
}: {
  href: string;
  label: string;
  value: ReactNode;
  accent?: "yellow" | "blue" | "pink";
  icon?: LucideIcon;
}) {
  const bars = {
    yellow: "border-t-moon-yellow",
    blue: "border-t-moon-blue",
    pink: "border-t-moon-pink",
  } as const;
  const tiles = {
    yellow: "bg-moon-yellow/20 text-moon-ink",
    blue: "bg-moon-blue/10 text-moon-blue",
    pink: "bg-moon-pink/10 text-moon-pink",
  } as const;
  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-2xl border border-zinc-200 border-t-4 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue ${bars[accent]}`}
    >
      {Icon && (
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${tiles[accent]}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-zinc-500">{label}</span>
        <span className="mt-0.5 block break-words text-2xl font-bold tracking-tight text-moon-ink transition-colors group-hover:text-moon-blue sm:text-3xl">
          {value}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition-all duration-200 group-hover:border-moon-ink group-hover:bg-moon-ink group-hover:text-moon-yellow"
      >
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-px" />
      </span>
    </Link>
  );
}

// ---------- EmptyCard: status kosong (pengganti EmptyRow di luar <ul>) ----------
export function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}

// ---------- DashboardHero: banner sambutan berlogo untuk dashboard utama ----------
// Bahasa visual selaras dengan hero halaman utama (kartu gelap + blob brand).
export function DashboardHero({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-moon-ink p-6 text-white sm:p-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-moon-ink via-moon-ink to-zinc-900"
      />
      <span
        aria-hidden="true"
        className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-moon-pink/25 blur-2xl"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-moon-blue/25 blur-2xl"
      />
      <span
aria-hidden="true"
        className="absolute -left-8 bottom-4 h-16 w-16 rounded-full bg-moon-yellow/30 blur-xl"
      />
      <div className="relative flex items-center gap-4 sm:gap-5">
        <BrandMark
          className="h-16 w-16 shrink-0 sm:h-20 sm:w-20"
          plain
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-moon-yellow">
            {eyebrow}
          </p>
          <h2 className="mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl">
            {title}
          </h2>
          {desc && (
            <p className="mt-1 line-clamp-2 text-sm text-white/70">{desc}</p>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------- SectionHead: judul seksi + badge live ----------
export function SectionHead({
  title,
  live = false,
  action,
}: {
  title: string;
  live?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-moon-ink sm:text-lg">
        {title}
        {live && <LiveBadge />}
      </h2>
      {action}
    </div>
  );
}
