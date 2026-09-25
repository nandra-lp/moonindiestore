"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_ROUTE_BY_ROLE, ROLES } from "@/types/firestore";
import { Card, BrandMark, ErrorBox, PrimaryButton } from "@/components/ui";

// Role di Firestore harus persis salah satu nilai ini — proxy, guard, dan
// rules semuanya membandingkan string secara eksak (huruf kecil, tanpa spasi).
function resolveTarget(raw: unknown): string | null {
  const normalized = typeof raw === "string" ? raw.trim() : "";
  if ((ROLES as string[]).includes(normalized)) {
    return (DEFAULT_ROUTE_BY_ROLE as Record<string, string>)[normalized];
  }
  return null;
}

export default function LoginPage() {
  const { login, firebaseUser, role, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
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
    try {
      const role = await login(email.trim(), password);
      const target = resolveTarget(role);
      if (!target) {
        setMsg(
          `Login berhasil, tetapi role "${String(role)}" tidak dikenal. Minta admin memperbaiki field role di dokumen users Firestore menjadi salah satu: admin, owner, customer (huruf kecil semua, tanpa spasi).`
        );
        return;
      }
      // Navigasi penuh (bukan router.replace) agar cookie sesi pasti terkirim
      // dan dibaca proxy pada request berikutnya.
      window.location.assign(target);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal masuk.");
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
            <p className="text-xs font-semibold uppercase tracking-widest text-moon-blue">
              Moon Indie Store
            </p>
            <h1 className="text-2xl font-semibold text-moon-ink">Masuk Akun</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          Selamat datang kembali. Silakan masuk untuk melanjutkan.
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" suppressHydrationWarning>
          <label className="text-sm font-medium text-moon-ink">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-normal placeholder:text-zinc-400 focus:border-moon-blue focus:outline-none focus:ring-2 focus:ring-moon-blue/20 transition-all"
              placeholder="nama@email.com"
              suppressHydrationWarning
            />
          </label>
          <label className="text-sm font-medium text-moon-ink">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-normal placeholder:text-zinc-400 focus:border-moon-blue focus:outline-none focus:ring-2 focus:ring-moon-blue/20 transition-all"
              placeholder="••••••••"
              suppressHydrationWarning
            />
          </label>
          {msg && <ErrorBox>{msg}</ErrorBox>}
          <div className="pt-2">
            <PrimaryButton disabled={busy} className="w-full">
              {busy ? "Memproses…" : "Masuk Sekarang"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Belum punya akun customer?{" "}
        <Link href="/register" className="font-medium text-moon-blue hover:underline">
          Daftar di sini
        </Link>
      </p>
    </main>
  );
}
