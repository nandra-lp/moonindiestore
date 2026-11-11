// Primitif UI bersama agar seluruh halaman selaras dengan brand.
// Aturan pakai:
// - Aksi utama      → PrimaryButton / PrimaryLink (kuning brand + teks ink)
// - Aksi sekunder   → GhostButton (outline)
// - Aksi bahaya     → DangerButton (pink brand)
// - Info/link teks  → text-moon-blue
// - Status order    → orderTone(): menunggu=zinc, diproses=blue,
//                     produksi=yellow, selesai=green, dibatalkan=pink
// - Badge role      → roleTone(): admin=yellow, owner=blue, customer=pink

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Role, StatusOrder } from "@/types/firestore";
import { getProductImage } from "@/lib/product-images";

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}

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
  size = "md",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md";
}) {
  const sizeClasses =
    size === "sm"
      ? "px-2 py-0 text-[10px] font-medium"
      : "px-2.5 py-0.5 text-xs font-medium";
  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeClasses} ${badgeTones[tone]} ${className}`}
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
      className={`rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 shadow-[0_1px_2px_rgba(10,10,10,0.05)] transition-all duration-300 ease-out ${
        hover ? "hover:shadow-[0_8px_30px_rgba(10,10,10,0.08)] hover:-translate-y-0.5 hover:border-zinc-300" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

const baseInput =
  "w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-normal placeholder:text-zinc-400 focus:border-moon-blue focus:ring-1 focus:ring-moon-blue/20 focus:outline-none transition-colors";

export interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  name?: string;
  minLength?: number;
  className?: string;
  ref?: React.Ref<HTMLInputElement>;
  rows?: number;
  multiline?: boolean;
}

export function InputField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  disabled,
  error,
  inputMode,
  name,
  minLength,
  className = "",
  ref,
  rows,
  multiline = false,
}: InputFieldProps) {
  const hasError = Boolean(error);
  const inputClasses = cn(
    baseInput,
    hasError
      ? "border-moon-pink/50 focus:border-moon-pink focus:ring-moon-pink/20"
      : "",
    className,
  );
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={cn(
          "text-sm font-medium",
          hasError ? "text-moon-pink" : "text-moon-ink",
        )}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          ref={ref as React.Ref<HTMLTextAreaElement>}
          name={name ?? id}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          placeholder={placeholder}
          inputMode={inputMode}
          minLength={minLength}
          rows={rows}
          className={cn(
            inputClasses,
            "resize-none",
          )}
          suppressHydrationWarning
        />
      ) : (
        <input
          id={id}
          ref={ref}
          type={type}
          name={name ?? id}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          placeholder={placeholder}
          inputMode={inputMode}
          minLength={minLength}
          className={inputClasses}
          suppressHydrationWarning
        />
      )}
      {error && (
        <p className="mt-1 text-xs text-moon-pink" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export interface PasswordInputProps {
  id: string;
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  minLength?: number;
  className?: string;
}

export function PasswordInput({
  id,
  label = "Password",
  value,
  onChange,
  placeholder,
  autoComplete = "new-password",
  required,
  disabled,
  error,
  minLength,
  className = "",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium",
            Boolean(error) ? "text-moon-pink" : "text-moon-ink",
          )}
        >
          {label}
        </label>
      )}
      <span className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          name={id}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          placeholder={placeholder}
          minLength={minLength}
          className={cn(
            baseInput,
            "py-2.5 pl-4 pr-12",
            Boolean(error)
              ? "border-moon-pink/50 focus:border-moon-pink focus:ring-moon-pink/20"
              : "",
            className,
          )}
          suppressHydrationWarning
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={
            showPassword ? "Sembunyikan password" : "Tampilkan password"
          }
          aria-pressed={showPassword}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-zinc-400 transition-colors hover:text-moon-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moon-blue"
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </span>
      {error && (
        <p className="mt-1 text-xs text-moon-pink" role="alert">
          {error}
        </p>
      )}
      {minLength && !error && (
        <p className="mt-1 text-xs text-zinc-500">Minimal {minLength} karakter</p>
      )}
    </div>
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
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-moon-ink md:text-3xl">
        {title}
      </h1>
      {desc && <p className="mt-1 text-sm text-zinc-500 md:text-base">{desc}</p>}
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

export function BackLink({
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
      className={`group inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white py-1.5 pl-1.5 pr-4 text-sm font-medium text-zinc-600 shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-zinc-300 hover:text-moon-ink hover:shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue ${className}`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors duration-200 group-hover:bg-moon-yellow group-hover:text-moon-ink">
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-px" strokeWidth={2.5} aria-hidden="true" />
      </span>
      {children}
    </Link>
  );
}

export function Select({
  value,
  onChange,
  options,
  className = "",
  disabled = false,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full rounded-xl border border-zinc-300 px-4 py-3 bg-white text-base transition focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-moon-pink/30 bg-moon-pink/10 px-3 py-2 text-sm text-moon-pink"
    >
      {children}
    </p>
  );
}

export function SuccessBox({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-xl border border-green-600/30 bg-green-50 px-3 py-2 text-sm text-green-700"
    >
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

// Dialog / modal primer untuk menampilkan konten dalam layar tertutup (cth. pratinjau bukti pembayaran).
export function Dialog({
  open,
  onOpenChange,
  children,
  className = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={`relative w-full max-w-xl mx-4 rounded-2xl bg-white shadow-2xl border border-zinc-200 p-6 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 ${className}`}
      >
        {children}
      </div>
    </div>
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
      width={256}
      height={256}
      priority
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
  jenis,
  size = "md",
  fill = false,
}: {
  url?: string | null;
  nama: string;
  jenis?: string;
  size?: "sm" | "md" | "lg";
  /** fill=true: gambar mengisi penuh kontainer (untuk kartu katalog), bukan kotak thumbnail. */
  fill?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const fallbackImage = getProductImage(nama, jenis);
  const shouldShowLocalImage =
    fallbackImage?.overrideUploaded || !url || failedUrl === url;

  if (shouldShowLocalImage) {
    if (fallbackImage) {
      return (
        <Image
          src={fallbackImage.image}
          alt={nama}
          fill={fill}
          sizes={fill ? "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw" : undefined}
          className={
            fill
              ? "h-full w-full object-cover"
              : `shrink-0 rounded-xl border border-zinc-200 object-cover ${thumbSizes[size]}`
          }
        />
      );
    }

    return (
      <span
        role="img"
        className={
          fill
            ? "flex h-full w-full items-center justify-center bg-moon-yellow/25 text-4xl"
            : `flex shrink-0 items-center justify-center rounded-xl bg-moon-yellow/25 ${thumbSizes[size]}`
        }
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
      onError={() => setFailedUrl(url)}
      className={
        fill
          ? "h-full w-full object-cover"
          : `shrink-0 rounded-xl border border-zinc-200 object-cover ${thumbSizes[size]}`
      }
    />
  );
}
