"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/Shell";
import { DashboardHero } from "@/components/dashboard/widgets";
import { ArrowLeft, Phone, Home } from "lucide-react";
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
        <div className="animate-pulse" aria-hidden="true">
          <div className="h-4 w-40 rounded bg-zinc-200" />
          <div className="mt-2 h-8 w-2/3 rounded-lg bg-zinc-200" />
          <div className="mt-2 h-4 w-1/2 rounded bg-zinc-100" />
          <div className="mt-6 h-32 rounded-2xl bg-zinc-200" />
        </div>
        <span className="sr-only">Memuat profil…</span>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="customer" title="Profil" contain="5xl">
      <BackLink href="/customer">Kembali ke Dashboard</BackLink>

      <DashboardHero
        eyebrow="Pengaturan Akun"
        title="Ubah Profil"
        desc="Perbarui nama dan alamat pengiriman Anda. Nomor HP tidak dapat diubah."
      />

      {msg && <ErrorBox>{msg}</ErrorBox>}
      {successMsg && <SuccessBox>{successMsg}</SuccessBox>}

      <Card className="mt-6 max-w-2xl">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
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
              className="bg-zinc-50"
            />
          </div>

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

          <p className="text-xs text-zinc-500">
            <Phone className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Nomor HP tidak dapat diubah karena digunakan untuk verifikasi
            identitas dan kontak pesanan.
          </p>

          <div className="pt-2 flex gap-3">
            <PrimaryButton disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan Perubahan"}
            </PrimaryButton>
            <Link
              href="/customer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-moon-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Batal
            </Link>
          </div>
        </form>
      </Card>

      <div className="mt-8 flex items-center gap-2 text-sm text-zinc-500">
        <Home className="h-4 w-4" aria-hidden="true" />
        <span className="font-medium text-zinc-600">
          {profile.nama} &bull; {pelanggan.email}
        </span>
      </div>
    </DashboardShell>
  );
}
