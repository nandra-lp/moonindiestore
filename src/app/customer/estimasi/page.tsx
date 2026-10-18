"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { RequireRole } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/Shell";
import { EstimasiForm } from "@/components/EstimasiForm";
import { useAuth } from "@/context/AuthContext";
import { listEstimasiByPelanggan, listProduk, type WithDocId } from "@/lib/db";
import { formatRupiah, formatTanggal } from "@/lib/estimasi";
import type { PerkiraanHarga, Produk } from "@/types/firestore";
import { BackLink, Card, PageHeader, ProductThumb } from "@/components/ui";

function EstimasiInner() {
  const { profile } = useAuth();
  const [produk, setProduk] = useState<WithDocId<Produk>[]>([]);
  const [riwayat, setRiwayat] = useState<WithDocId<PerkiraanHarga>[]>([]);
  const [idProduk, setIdProduk] = useState("");
  const [produkLoading, setProdukLoading] = useState(true);
  const [riwayatLoading, setRiwayatLoading] = useState(true);
  const idp = profile?.id_pelanggan ?? null;

  const fetchRiwayat = useCallback(() => {
    if (!idp) return;
    listEstimasiByPelanggan(idp)
      .then((rows) => {
        setRiwayat(rows);
        setRiwayatLoading(false);
      })
      .catch(() => setRiwayatLoading(false));
  }, [idp]);

  // Refresh manual (mis. setelah simpan): nyalakan loading lalu ambil ulang.
  const reload = useCallback(() => {
    setRiwayatLoading(true);
    fetchRiwayat();
  }, [fetchRiwayat]);

  useEffect(() => {
    listProduk()
      .then((rows) => {
        setProduk(rows);
        // Default ke produk pertama agar tombol tidak terkunci saat daftar async.
        if (rows.length > 0) setIdProduk((cur) => cur || rows[0].id);
        setProdukLoading(false);
      })
      .catch(() => setProdukLoading(false));
  }, []);
  useEffect(fetchRiwayat, [fetchRiwayat]);

  // Peta id_produk -> produk (nama & satuan untuk kartu riwayat, tanpa fetch baru).
  const produkById = useMemo(() => {
    const m = new Map<string, WithDocId<Produk>>();
    for (const p of produk) m.set(p.id, p);
    return m;
  }, [produk]);

  if (!idp) {
    return (
      <DashboardShell role="customer" title="Estimasi" contain="3xl">
        <p className="text-sm text-zinc-500">
          Profil pelanggan belum termuat. Coba muat ulang.
        </p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="customer" title="Estimasi" contain="3xl">
      <BackLink href="/customer">Dashboard</BackLink>
      <div className="mt-2">
        <PageHeader
          eyebrow="Customer · Estimasi"
          title="Estimasi biaya"
          desc="Ketuk produk, atur jumlah & biaya, lalu simpan. Hasil tersimpan di riwayat."
        />
      </div>

      <div className="mt-6">
        {produkLoading ? (
          <div
            role="status"
            aria-label="Memuat katalog produk"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
          >
            <span className="sr-only">Memuat katalog produk…</span>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                aria-hidden="true"
                className="rounded-2xl border border-zinc-200 bg-white p-4"
              >
                <div className="mx-auto h-20 w-20 animate-pulse rounded-xl bg-zinc-200" />
                <div className="mx-auto mt-3 h-3.5 w-3/4 animate-pulse rounded-full bg-zinc-200" />
                <div className="mx-auto mt-2 h-3 w-1/2 animate-pulse rounded-full bg-zinc-100" />
              </div>
            ))}
          </div>
        ) : produk.length === 0 ? (
          <Card>
            <p className="text-sm text-zinc-500">
              Katalog produk masih kosong. Minta admin menambah data di halaman{" "}
              <code>/admin/produk</code>.
            </p>
          </Card>
        ) : (
          <>
            <div
              role="group"
              aria-label="Pilih produk"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
            >
              {produk.map((p) => {
                const selected = p.id === idProduk;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setIdProduk(p.id)}
                    aria-pressed={selected}
                    className={`group relative flex flex-col items-center justify-center rounded-2xl border bg-white p-4 text-center transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue ${
                      selected
                        ? "border-moon-yellow shadow-md ring-2 ring-moon-yellow/40"
                        : "border-zinc-200 shadow-sm hover:-translate-y-0.5 hover:border-moon-yellow hover:shadow-md"
                    }`}
                  >
                    {selected && (
                      <span
                        aria-hidden="true"
                        className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-moon-yellow text-moon-ink"
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                    <ProductThumb
                      url={p.gambar_url}
                      nama={p.nama_produk}
                      size="lg"
                    />
                    <span className="mt-3 w-full truncate text-sm font-bold text-moon-ink transition-colors group-hover:text-moon-blue">
                      {p.nama_produk}
                    </span>
                    <span className="mt-0.5 text-xs font-medium text-zinc-500">
                      {formatRupiah(p.harga_dasar)}
                      <span className="text-zinc-400">/{p.satuan}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4">
              <EstimasiForm
                id_pelanggan={idp}
                produkList={produk}
                idProduk={idProduk}
                onIdProdukChange={setIdProduk}
                onSaved={reload}
              />
            </div>
          </>
        )}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-moon-ink">
        Riwayat estimasi ({riwayatLoading ? "…" : riwayat.length})
      </h2>
      {riwayatLoading ? (
        <div
          role="status"
          aria-label="Memuat riwayat estimasi"
className="mt-4 grid gap-4 sm:gap-5 sm:grid-cols-2"
        >
          <span className="sr-only">Memuat riwayat estimasi…</span>
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-zinc-200" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-zinc-100" />
              <div className="mt-4 h-8 animate-pulse rounded-xl bg-zinc-100" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:gap-5 sm:grid-cols-2">
          {riwayat.map((e) => {
            const prod = produkById.get(e.id_produk);
            const nama = prod?.nama_produk ?? `Produk #${e.id_produk.slice(0, 8)}`;
            const satuan = prod?.satuan ?? "pcs";
            return (
              <div
                key={e.id}
                className="group flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-moon-yellow hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-zinc-500">
                      {formatTanggal(e.tanggal)}
                    </span>
                    <span
                      title={nama}
                      className="max-w-[55%] truncate rounded-full bg-moon-blue/10 px-2 py-0.5 text-xs font-semibold text-moon-blue"
                    >
                      {nama}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-moon-ink">
                    {e.jumlah} {satuan} @ {formatRupiah(e.harga_satuan)}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                    <span>Bahan: {formatRupiah(e.biaya_bahan)}</span>
                    <span>Produksi: {formatRupiah(e.biaya_produksi)}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                  <span className="text-lg font-bold tracking-tight text-moon-ink">
                    {formatRupiah(e.total_estimasi)}
                  </span>
                  <Link
                    href={`/customer/pesan?estimasi=${e.id}`}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-moon-yellow px-4 py-2 text-xs font-bold text-moon-ink shadow-sm transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
                  >
                    Pesan <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            );
          })}
          {riwayat.length === 0 && (
            <div className="col-span-full">
              <Card className="text-center py-8">
                <p className="text-zinc-500">Belum ada estimasi tersimpan.</p>
              </Card>
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

export default function EstimasiPage() {
  return (
    <RequireRole allow={["customer"]}>
      <EstimasiInner />
    </RequireRole>
  );
}
