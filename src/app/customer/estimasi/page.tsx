"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/AuthGuard";
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
  const idp = profile?.id_pelanggan ?? null;

  const reload = useCallback(() => {
    if (!idp) return;
    listEstimasiByPelanggan(idp).then(setRiwayat).catch(() => {});
  }, [idp]);

  useEffect(() => {
    listProduk().then(setProduk).catch(() => {});
  }, []);
  useEffect(reload, [reload]);

  if (!idp) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <p className="text-sm text-zinc-500">
          Profil pelanggan belum termuat. Coba muat ulang.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <BackLink href="/customer">Kembali</BackLink>
      <div className="mt-2">
        <PageHeader
          eyebrow="Customer · Estimasi"
          title="Estimasi biaya"
          desc="Simulasikan biaya sebelum memesan. Hasil tersimpan di riwayat."
        />
      </div>
      <div className="mt-6">
        {produk.length === 0 ? (
          <Card>
            <p className="text-sm text-zinc-500">
              Katalog produk masih kosong. Minta admin menambah data di halaman{" "}
              <code>/admin/produk</code>.
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {produk.map((p) => (
                <div
                  key={p.id}
                  className="group flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm transition hover:border-moon-yellow hover:shadow-md"
                >
                  <ProductThumb
                    url={p.gambar_url}
                    nama={p.nama_produk}
                    size="lg"
                  />
                  <p className="mt-3 w-full truncate text-sm font-bold text-moon-ink transition-colors group-hover:text-moon-blue">
                    {p.nama_produk}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-zinc-500">
                    {formatRupiah(p.harga_dasar)}
                    <span className="text-zinc-400">/{p.satuan}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <EstimasiForm
                id_pelanggan={idp}
                produkList={produk}
                onSaved={reload}
              />
            </div>
          </>
        )}
      </div>
      <h2 className="mt-8 font-semibold text-moon-ink">
        Riwayat estimasi ({riwayat.length})
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {riwayat.map((e) => (
          <div
            key={e.id}
            className="group flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-moon-yellow hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  {formatTanggal(e.tanggal)}
                </span>
                <span className="rounded-full bg-moon-blue/10 px-2 py-0.5 text-xs font-semibold text-moon-blue">
                  {e.id_produk.slice(0, 8)}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-moon-ink">
                {e.jumlah} pcs @ {formatRupiah(e.harga_satuan)}
              </p>
              <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                <span>Bahan: {formatRupiah(e.biaya_bahan)}</span>
                <span>Produksi: {formatRupiah(e.biaya_produksi)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
              <span className="text-lg font-bold text-moon-ink">
                {formatRupiah(e.total_estimasi)}
              </span>
              <Link
                href={`/customer/pesan?estimasi=${e.id}`}
                className="flex items-center gap-1 rounded-full bg-moon-yellow px-3 py-1.5 text-xs font-bold text-moon-ink transition hover:brightness-95"
              >
                Pesan <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        ))}
        {riwayat.length === 0 && (
          <div className="col-span-full">
            <Card className="text-center py-8">
              <p className="text-zinc-500">Belum ada estimasi tersimpan.</p>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

export default function EstimasiPage() {
  return (
    <RequireRole allow={["customer"]}>
      <EstimasiInner />
    </RequireRole>
  );
}
