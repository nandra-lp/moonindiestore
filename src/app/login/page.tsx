"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase/config";
import { pesanErrorAuth } from "@/lib/auth-errors";
import { resolveTarget } from "@/lib/role-route";
import {
  Card,
  BrandMark,
  ErrorBox,
  PrimaryButton,
  SuccessBox,
} from "@/components/ui";

export default function LoginPage() {
  const { login, firebaseUser, role, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [resetOk, setResetOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Pengguna yang sesinya masih aktif tidak perlu melihat form login.
  useEffect(() => {
    if (loading || !firebaseUser) return;
    const target = resolveTarget(role);
    if (target) router.replace(target);
  }, [loading, firebaseUser, role, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setResetOk(null);
    try {
      const role = await login(email.trim(), password);
      const target = resolveTarget(role);
      if (!target) {
        setMsg(
          `Login berhasil, tetapi role "${String(role)}" tidak dikenal. Minta admin memperbaiki field role di dokumen users Firestore menjadi salah satu: admin, owner, customer (huruf kecil semua, tanpa spasi).`,
        );
        return;
      }
      // Navigasi penuh (bukan router.replace) agar cookie sesi pasti terkirim
      // dan dibaca proxy pada request berikutnya.
      window.location.assign(target);
    } catch (err) {
      setMsg(pesanErrorAuth(err, "Gagal masuk."));
    } finally {
      setBusy(false);
    }
  }

  async function onForgotPassword() {
    const target = email.trim();
    if (!target) {
      setResetOk(null);
      setMsg("Isi alamat email dulu, lalu klik “Lupa password?”.");
      return;
    }
    setBusy(true);
    setMsg(null);
    setResetOk(null);
    try {
      await sendPasswordResetEmail(auth, target);
      setResetOk(
        `Tautan reset password dikirim ke ${target}. Cek inbox/spam lalu ikuti instruksinya.`,
      );
    } catch (err) {
      setMsg(pesanErrorAuth(err, "Gagal mengirim tautan reset."));
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
            <p className="text-xs font-semibold uppercase tracking-widest text-moon-blue">
              Moon Indie Store
            </p>
            <h1 className="text-2xl font-semibold text-moon-ink">Masuk Akun</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          Selamat datang kembali. Silakan masuk untuk melanjutkan.
        </p>
        {/* suppressHydrationWarning: ekstensi browser (password manager dsb.)
            kadang menyentuh DOM form saat autofill. */}
        <form
          onSubmit={onSubmit}
          className="mt-6 flex flex-col gap-4"
          suppressHydrationWarning
        >
          <label className="text-sm font-medium text-moon-ink">
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-normal placeholder:text-zinc-400"
              placeholder="nama@email.com"
              suppressHydrationWarning
            />
          </label>
          <label className="text-sm font-medium text-moon-ink">
            Password
            <span className="relative mt-1 block">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 py-2.5 pl-4 pr-12 font-normal placeholder:text-zinc-400"
                placeholder="••••••••"
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
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={busy}
              className="rounded-sm text-sm font-medium text-moon-blue transition-colors hover:text-moon-pink disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
            >
              Lupa password?
            </button>
          </div>
          {msg && <ErrorBox>{msg}</ErrorBox>}
          {resetOk && <SuccessBox>{resetOk}</SuccessBox>}
          <div className="pt-2">
            <PrimaryButton disabled={busy} className="w-full">
              {busy ? "Memproses…" : "Masuk Sekarang"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
      <p className="relative mt-6 text-center text-sm text-zinc-500">
        Belum punya akun customer?{" "}
        <Link
          href="/register"
          className="rounded-sm font-medium text-moon-blue hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
        >
          Daftar di sini
        </Link>
      </p>
    </main>
  );
}
