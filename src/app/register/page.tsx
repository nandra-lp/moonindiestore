"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { pesanErrorAuth } from "@/lib/auth-errors";
import { resolveTarget } from "@/lib/role-route";
import { Card, BrandMark, ErrorBox, PrimaryButton } from "@/components/ui";

// Pendaftaran mandiri KHUSUS customer (sesuai permintaan).
// Admin/owner tidak bisa daftar dari sini — dibuat via scripts/seed-users.mjs.
export default function RegisterPage() {
  const { registerCustomer, firebaseUser, role, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    no_hp: "",
    alamat: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Pengguna yang sesinya masih aktif tidak perlu melihat form daftar.
  useEffect(() => {
    if (loading || !firebaseUser) return;
    const target = resolveTarget(role);
    if (target) router.replace(target);
  }, [loading, firebaseUser, role, router]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await registerCustomer(form);
      router.replace("/customer");
    } catch (err) {
      setMsg(pesanErrorAuth(err, "Gagal mendaftar. Coba lagi."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center overflow-clip px-6 py-16">
      {/* Dekorasi brand yang lembut — konsisten dengan hero di halaman utama. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-moon-yellow/25 blur-3xl" />
        <span className="absolute -right-24 bottom-8 h-64 w-64 rounded-full bg-moon-blue/15 blur-3xl" />
        <span className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-moon-pink/10 blur-3xl" />
      </div>
      <Card className="relative">
        <div className="flex items-center gap-3">
          <BrandMark className="h-12 w-12" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-moon-pink">
              Pendaftaran
            </p>
            <h1 className="text-2xl font-semibold text-moon-ink">
              Buat Akun Baru
            </h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          Daftar untuk mulai menghitung estimasi biaya dan memesan cetakan custom Anda.
        </p>
        {/* suppressHydrationWarning: ekstensi browser (password manager dsb.)
            kadang menyentuh DOM form saat autofill. */}
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" suppressHydrationWarning>
          <label className="text-sm font-medium text-moon-ink">
            Nama lengkap
            <input
              type="text"
              name="name"
              autoComplete="name"
              required
              value={form.nama}
              onChange={(e) => set("nama", e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-normal placeholder:text-zinc-400"
              suppressHydrationWarning
            />
          </label>
          <label className="text-sm font-medium text-moon-ink">
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="nama@email.com"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-normal placeholder:text-zinc-400"
              suppressHydrationWarning
            />
          </label>
          <label className="text-sm font-medium text-moon-ink">
            No. HP (WhatsApp)
            <input
              type="tel"
              name="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              value={form.no_hp}
              onChange={(e) => set("no_hp", e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-normal placeholder:text-zinc-400"
              suppressHydrationWarning
            />
          </label>
          <label className="text-sm font-medium text-moon-ink">
            Alamat pengiriman
            <textarea
              name="street-address"
              autoComplete="street-address"
              required
              rows={3}
              value={form.alamat}
              onChange={(e) => set("alamat", e.target.value)}
              placeholder="Alamat lengkap untuk pengiriman barang"
              className="mt-1 w-full resize-none rounded-xl border border-zinc-200 px-4 py-2.5 font-normal placeholder:text-zinc-400"
              suppressHydrationWarning
            />
          </label>
          <label className="text-sm font-medium text-moon-ink">
            Password
            <span className="relative mt-1 block">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-xl border border-zinc-200 py-2.5 pl-4 pr-12 font-normal placeholder:text-zinc-400"
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword
                    ? "Sembunyikan password"
                    : "Tampilkan password"
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
          </label>

          {msg && <ErrorBox>{msg}</ErrorBox>}
          <div className="pt-2">
            <PrimaryButton disabled={busy} className="w-full">
              {busy ? "Memproses…" : "Daftar Sekarang"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
      <p className="relative mt-6 text-center text-sm text-zinc-500">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="rounded-sm font-medium text-moon-blue hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
        >
          Masuk di sini
        </Link>
      </p>
    </main>
  );
}
