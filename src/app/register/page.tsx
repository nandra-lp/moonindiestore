"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Card, BrandMark, ErrorBox, PrimaryButton } from "@/components/ui";

// Pendaftaran mandiri KHUSUS customer (sesuai permintaan).
// Admin/owner tidak bisa daftar dari sini — dibuat via scripts/seed-users.mjs.
export default function RegisterPage() {
  const { registerCustomer } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    no_hp: "",
    alamat: "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      setMsg(
        err instanceof Error ? err.message : "Gagal mendaftar. Coba lagi."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <Card>
        <div className="flex items-center gap-3">
          <BrandMark className="h-11 w-11" />
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
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" suppressHydrationWarning>
          <label className="text-sm font-medium text-moon-ink">
            Nama lengkap
            <input
              type="text"
              required
              value={form.nama}
              onChange={(e) => set("nama", e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-normal placeholder:text-zinc-400 focus:border-moon-blue focus:outline-none focus:ring-2 focus:ring-moon-blue/20 transition-all"
              suppressHydrationWarning
            />
          </label>
          <label className="text-sm font-medium text-moon-ink">
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="nama@email.com"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-normal placeholder:text-zinc-400 focus:border-moon-blue focus:outline-none focus:ring-2 focus:ring-moon-blue/20 transition-all"
              suppressHydrationWarning
            />
          </label>
          <label className="text-sm font-medium text-moon-ink">
            No. HP (WhatsApp)
            <input
              type="tel"
              required
              value={form.no_hp}
              onChange={(e) => set("no_hp", e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-normal placeholder:text-zinc-400 focus:border-moon-blue focus:outline-none focus:ring-2 focus:ring-moon-blue/20 transition-all"
              suppressHydrationWarning
            />
          </label>
          <label className="text-sm font-medium text-moon-ink">
            Alamat pengiriman
            <textarea
              required
              rows={3}
              value={form.alamat}
              onChange={(e) => set("alamat", e.target.value)}
              placeholder="Alamat lengkap untuk pengiriman barang"
              className="mt-1 w-full resize-none rounded-xl border border-zinc-200 px-4 py-2.5 font-normal placeholder:text-zinc-400 focus:border-moon-blue focus:outline-none focus:ring-2 focus:ring-moon-blue/20 transition-all"
              suppressHydrationWarning
            />
          </label>
          <label className="text-sm font-medium text-moon-ink">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Minimal 6 karakter"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-normal placeholder:text-zinc-400 focus:border-moon-blue focus:outline-none focus:ring-2 focus:ring-moon-blue/20 transition-all"
              suppressHydrationWarning
            />
          </label>

          {msg && <ErrorBox>{msg}</ErrorBox>}
          <div className="pt-2">
            <PrimaryButton disabled={busy} className="w-full">
              {busy ? "Memproses..." : "Daftar Sekarang"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-moon-blue hover:underline">
          Masuk di sini
        </Link>
      </p>
    </main>
  );
}
