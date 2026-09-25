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
              Akun customer
            </p>
            <h1 className="text-2xl font-semibold text-moon-ink">
              Daftar sebagai Customer
            </h1>
          </div>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Data ini masuk ke collection <code>pelanggan</code> +{" "}
          <code>users (role=customer)</code>.
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          {(
            [
              ["nama", "Nama lengkap", "text"],
              ["email", "Email", "email"],
              ["password", "Password (min. 6 karakter)", "password"],
              ["no_hp", "No. HP", "tel"],
              ["alamat", "Alamat", "text"],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="text-sm font-medium">
              {label}
              <input
                type={type}
                required
                minLength={key === "password" ? 6 : undefined}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 font-normal"
              />
            </label>
          ))}
          {msg && <ErrorBox>{msg}</ErrorBox>}
          <PrimaryButton disabled={busy}>
            {busy ? "Mendaftar…" : "Buat akun customer"}
          </PrimaryButton>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-zinc-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-moon-blue hover:underline">
          Masuk
        </Link>
      </p>
    </main>
  );
}
