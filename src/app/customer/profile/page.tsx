"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/Shell";
import { ArrowLeft, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPelanggan } from "@/lib/db";
import type { Pelanggan } from "@/types/firestore";
import {
  BackLink,
  Card,
  ErrorBox,
  InputField,
  PrimaryButton,
  SuccessBox,
} from "@/components/ui";

export default function ProfilePage() {
  const { profile, updateProfile, loading } = useAuth();
  const [pelanggan, setPelanggan] = useState<Pelanggan | null>(null);
  const [form, setForm] = useState({ nama: "", alamat: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const idp = profile?.id_pelanggan;
    if (!idp) return;
    (async () => {
      const p = await getPelanggan(idp);
      setPelanggan(p ?? null);
      if (p) {
        setForm({ nama: p.nama, alamat: p.alamat });
      }
    })();
  }, [profile?.id_pelanggan]);

  function set(key: "nama" | "alamat", value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setSuccessMsg(null);
    try {
      await updateProfile({ nama: form.nama, alamat: form.alamat });
      setSuccessMsg("Profil berhasil diperbarui.");
    } catch (err) {
      setMsg(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui profil. Coba lagi."
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading || !profile || !pelanggan) {
    return (
      <DashboardShell role="customer" title="Profil" contain="5xl">
        <div className="animate-pulse space-y-6" aria-hidden="true">
          <div className="h-5 w-36 rounded bg-zinc-200" />
          <div className="h-10 w-56 rounded-lg bg-zinc-200" />
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.5fr]">
            <div className="h-56 rounded-2xl bg-zinc-100" />
            <div className="h-80 rounded-2xl bg-zinc-100" />
          </div>
        </div>
        <span className="sr-only">Memuat profil…</span>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="customer" title="Profil" contain="5xl" className="space-y-6">
      <BackLink href="/customer">Kembali ke Dashboard</BackLink>

      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-moon-ink sm:text-3xl">
          Profil akun
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 sm:text-base">
          Perbarui informasi kontak dan alamat yang digunakan untuk pesanan Anda.
        </p>
      </header>

      {(msg || successMsg) && (
        <div className="space-y-3" aria-live="polite">
          {msg && <ErrorBox>{msg}</ErrorBox>}
          {successMsg && <SuccessBox>{successMsg}</SuccessBox>}
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[0.85fr_1.5fr] lg:gap-6">
        <aside className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="h-2 bg-moon-yellow" aria-hidden="true" />
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-moon-ink text-moon-yellow">
                <UserRound className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-moon-ink">
                  {profile.nama}
                </h2>
                <p className="text-sm text-zinc-500">Akun customer</p>
              </div>
            </div>

            <div className="mt-6 space-y-4 border-t border-zinc-100 pt-5">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-500">Email</p>
                  <p className="mt-0.5 break-words text-sm font-medium text-moon-ink">
                    {pelanggan.email}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-500">Nomor WhatsApp</p>
                  <p className="mt-0.5 text-sm font-medium text-moon-ink">
                    {pelanggan.no_hp}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-zinc-50 p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-moon-blue" aria-hidden="true" />
              <p className="text-xs leading-5 text-zinc-600">
                Nomor HP digunakan untuk verifikasi identitas dan koordinasi pesanan, sehingga tidak dapat diubah dari halaman ini.
              </p>
            </div>
          </div>
        </aside>

        <Card className="p-5 sm:p-7">
          <div className="mb-6 border-b border-zinc-100 pb-5">
            <h2 className="text-lg font-semibold text-moon-ink">Informasi profil</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Pastikan alamat sudah lengkap untuk membantu proses pengiriman.
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <InputField
              id="nama"
              label="Nama lengkap"
              type="text"
              autoComplete="name"
              required
              value={form.nama}
              onChange={(e) => set("nama", e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
            />

            <InputField
              id="no_hp"
              label="Nomor HP (WhatsApp)"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              disabled
              value={pelanggan.no_hp}
              onChange={() => {}}
              placeholder="Tidak dapat diubah"
              className="bg-zinc-50 text-zinc-500"
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
              rows={4}
            />

            <div className="flex flex-col-reverse gap-3 border-t border-zinc-100 pt-5 sm:flex-row sm:justify-end">
              <Link
                href="/customer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-moon-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Batal
              </Link>
              <PrimaryButton disabled={busy} className="min-h-11">
                {busy ? "Menyimpan…" : "Simpan Perubahan"}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      </div>
    </DashboardShell>
  );
}
