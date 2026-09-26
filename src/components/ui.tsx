// Primitif UI bersama agar seluruh halaman selaras dengan brand.
// Aturan pakai:
// - Aksi utama      → PrimaryButton / PrimaryLink (kuning brand + teks ink)
// - Aksi sekunder   → GhostButton / GhostLink (outline)
// - Aksi bahaya     → DangerButton (pink brand)
// - Info/link teks  → text-moon-blue
// - Status order    → orderTone(): menunggu=zinc, diproses=blue,
//                     produksi=yellow, selesai=green, dibatalkan=pink
// - Badge role      → roleTone(): admin=yellow, owner=blue, customer=pink

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Role, StatusOrder } from "@/types/firestore";

export type Tone = "yellow" | "blue" | "pink" | "zinc" | "green" | "ink";

const badgeTones: Record<Tone, string> = {
  yellow: "bg-moon-yellow text-moon-ink",
  blue: "bg-moon-blue text-white",
  pink: "bg-moon-pink text-white",
  zinc: "bg-zinc-100 text-zinc-700",
  green: "bg-green-600 text-white",
  ink: "bg-moon-ink text-white",
};

const statAccents: Record<"yellow" | "blue" | "pink", string> = {
  yellow: "border-t-moon-yellow",
  blue: "border-t-moon-blue",
  pink: "border-t-moon-pink",
};

export function orderTone(status: StatusOrder): Tone {
  switch (status) {
    case "diproses":
      return "blue";
    case "produksi":
      return "yellow";
    case "selesai":
      return "green";
    case "dibatalkan":
      return "pink";
    default:
      return "zinc";
  }
}

export function roleTone(role: Role): Tone {
  if (role === "admin") return "yellow";
  if (role === "owner") return "blue";
  return "pink";
}

export function Badge({
  tone = "zinc",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(10,10,10,0.05)] transition-all duration-300 ease-out ${
        hover ? "hover:shadow-[0_8px_30px_rgba(10,10,10,0.08)] hover:-translate-y-0.5 hover:border-zinc-300" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  accent = "yellow",
  icon,
}: {
  label: string;
  value: ReactNode;
  accent?: "yellow" | "blue" | "pink";
  icon?: ReactNode;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-zinc-200 border-t-4 bg-white p-4 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(10,10,10,0.08)] hover:-translate-y-0.5 ${statAccents[accent]}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-moon-yellow/20 group-hover:text-moon-ink">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 break-words text-2xl font-bold tracking-tight text-moon-ink sm:text-3xl">{value}</p>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-moon-blue">
        {eyebrow}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-moon-ink">
        {title}
      </h1>
      {desc && <p className="mt-1 text-sm text-zinc-500">{desc}</p>}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className = "", ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={`rounded-full bg-moon-yellow px-5 py-2.5 text-sm font-semibold text-moon-ink transition hover:brightness-95 active:brightness-90 disabled:opacity-50 ${className}`}
    />
  );
}

export function GhostButton({ className = "", ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={`rounded-full border border-moon-ink/25 px-4 py-1.5 text-sm font-medium text-moon-ink transition hover:border-moon-blue hover:text-moon-blue disabled:opacity-50 ${className}`}
    />
  );
}

export function DangerButton({ className = "", ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={`rounded-full bg-moon-pink px-4 py-1.5 text-sm font-medium text-white transition hover:brightness-95 disabled:opacity-50 ${className}`}
    />
  );
}

export function PrimaryLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full bg-moon-yellow px-5 py-2.5 text-sm font-semibold text-moon-ink transition hover:brightness-95 ${className}`}
    >
      {children}
    </Link>
  );
}

export function GhostLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full border border-moon-ink/25 px-5 py-2.5 text-sm font-medium text-moon-ink transition hover:border-moon-blue hover:text-moon-blue ${className}`}
    >
      {children}
    </Link>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-moon-ink"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 transition-colors group-hover:border-zinc-300 group-hover:bg-white shadow-sm">
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5 text-zinc-400 group-hover:text-moon-ink" strokeWidth={2.5} />
      </span>
      {children}
    </Link>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-moon-pink/30 bg-moon-pink/10 px-3 py-2 text-sm text-moon-pink">
      {children}
    </p>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return (
    <li className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-sm text-zinc-500">
      {children}
    </li>
  );
}

const thumbSizes: Record<"sm" | "md" | "lg", string> = {
  sm: "h-10 w-10 text-lg",
  md: "h-14 w-14 text-2xl",
  lg: "h-20 w-20 text-3xl",
};

// Mark logo brand — satu-satunya cara menampilkan logo di seluruh halaman
// agar ukuran, radius, dan ring selalu konsisten dan harmonis.
export function BrandMark({
  className = "h-10 w-10",
  plain = false,
}: {
  className?: string;
  // plain=true untuk background gelap (tanpa shadow/ring agar menyatu).
  plain?: boolean;
}) {
  return (
    <Image
      src="/logo-mis.png"
      alt="Logo Moon Indie Store"
      width={96}
      height={96}
      className={`${className} shrink-0 rounded-xl object-cover ${plain ? "" : "shadow-sm ring-1 ring-black/10"}`}
    />
  );
}

// Pratinjau desain custom customer (gambar/PDF + catatan). Dipakai di halaman
// detail pesanan customer dan kelola admin.
export function DesainCustomView({
  url,
  path,
  catatan,
}: {
  url?: string | null;
  path?: string | null;
  catatan?: string;
}) {
  const isPdf = (path ?? "").toLowerCase().endsWith(".pdf");
  if (!url && !catatan) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3">
      {url ? (
        isPdf ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-moon-pink/10 text-xs font-semibold text-moon-pink"
          >
            <span className="text-2xl">📄</span>PDF
          </a>
        ) : (
          <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL Storage dinamis */}
            <img
              src={url}
              alt="Desain custom customer"
              loading="lazy"
              className="h-16 w-16 rounded-lg border border-zinc-200 object-cover"
            />
          </a>
        )
      ) : (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-2xl">
          🎨
        </span>
      )}
      <div className="min-w-0 text-xs">
        <p className="font-semibold text-moon-ink">Desain custom</p>
        {catatan ? (
          <p className="text-zinc-600">{catatan}</p>
        ) : (
          <p className="text-zinc-400">Tanpa catatan.</p>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-moon-blue hover:underline"
          >
            Buka file asli →
          </a>
        )}
      </div>
    </div>
  );
}

// Thumbnail produk yang konsisten: gambar bila ada, placeholder kuning bila belum.
export function ProductThumb({
  url,
  nama,
  size = "md",
}: {
  url?: string | null;
  nama: string;
  size?: "sm" | "md" | "lg";
}) {
  if (!url) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl bg-moon-yellow/25 ${thumbSizes[size]}`}
        aria-label={`Belum ada gambar untuk ${nama}`}
      >
        📦
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL Storage dinamis, thumbnail kecil
    <img
      src={url}
      alt={nama}
      loading="lazy"
      className={`shrink-0 rounded-xl border border-zinc-200 object-cover ${thumbSizes[size]}`}
    />
  );
}
