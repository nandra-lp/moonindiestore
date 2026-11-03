"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { pesanErrorAuth } from "@/lib/auth-errors";
import { resolveTarget } from "@/lib/role-route";
import {
  Card,
  BrandMark,
  ErrorBox,
  InputField,
  PasswordInput,
  PrimaryButton,
  SuccessBox,
} from "@/components/ui";

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
  const [msg, setMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

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
    setSuccessMsg(null);
    try {
      await registerCustomer(form);
      setSuccessMsg("Akun berhasil dibuat! Mengarahkan ke dashboard…");
      // Brief delay to show success message before redirect
      setTimeout(() => router.replace("/customer"), 800);
    } catch (err) {
      setMsg(pesanErrorAuth(err, "Gagal mendaftar. Coba lagi."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      {/* Dekorasi brand yang lembut — konsisten dengan hero di halaman utama. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <span className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-moon-yellow/20 blur-3xl" />
        <span className="absolute -right-24 bottom-1/3 h-72 w-72 rounded-full bg-moon-blue/10 blur-3xl" />
        <span className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-moon-pink/10 blur-3xl" />
      </div>
      <Card className="relative w-full">
        <div className="flex items-center gap-3">
          <BrandMark className="h-12 w-12" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-moon-ink">
              Daftar
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-moon-ink">
              Buat Akun Baru
            </h1>
          </div>
        </div>
        <p className="mt-2 text-sm md:text-base text-zinc-500">
          Daftar untuk mulai menghitung estimasi biaya dan memesan cetakan custom Anda.
        </p>
        {/* suppressHydrationWarning: ekstensi browser (password manager dsb.)
            kadang menyentuh DOM form saat autofill. */}
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4 md:gap-5" suppressHydrationWarning>
          <InputField
            id="nama"
            label="Nama lengkap"
            type="text"
            name="name"
            autoComplete="name"
            required
            value={form.nama}
            onChange={(e) => set("nama", e.target.value)}
            placeholder="Masukkan nama lengkap Anda"
          />
          <InputField
            id="email"
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            ref={emailRef}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="nama@email.com"
          />
          <InputField
            id="no_hp"
            label="No. HP (WhatsApp)"
            type="tel"
            name="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            value={form.no_hp}
            onChange={(e) => set("no_hp", e.target.value)}
            placeholder="08xxxxxxxxxx"
          />
          <InputField
            id="alamat"
            label="Alamat pengiriman"
            type="text"
            name="street-address"
            autoComplete="street-address"
            required
            value={form.alamat}
            onChange={(e) => set("alamat", e.target.value)}
            placeholder="Alamat lengkap untuk pengiriman barang"
            multiline
            rows={3}
          />
          <PasswordInput
            id="password"
            label="Password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="Minimal 6 karakter"
          />

          {msg && <ErrorBox>{msg}</ErrorBox>}
          {successMsg && <SuccessBox>{successMsg}</SuccessBox>}
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
