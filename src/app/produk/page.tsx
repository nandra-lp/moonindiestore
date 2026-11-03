"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listProduk, type WithDocId } from "@/lib/db";
import { formatRupiah } from "@/lib/estimasi";
import type { Produk } from "@/types/firestore";
import { ErrorBox, GhostButton, ProductThumb } from "@/components/ui";
import { ArrowRight, Package } from "lucide-react";

const PREVIEW_COUNT = 50;

function ProductImage({
  url,
  nama,
  jenis,
}: {
  url?: string | null;
  nama: string;
  jenis: string;
}) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
      <ProductThumb url={url} nama={nama} jenis={jenis} fill />
      <span className="absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-moon-ink shadow-sm backdrop-blur">
        {jenis}
      </span>
    </div>
  );
}

function PriceDisplay({ harga, satuan }: { harga: number; satuan: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-bold text-moon-ink">{formatRupiah(harga)}</span>
      <span className="text-sm font-medium text-zinc-500">/{satuan}</span>
    </div>
  );
}

export default function KatalogPage() {
  const [rows, setRows] = useState<WithDocId<Produk>[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [jenisFilter, setJenisFilter] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    listProduk()
      .then((all) => {
        setRows(all.slice(0, PREVIEW_COUNT));
        setFailed(false);
        setLoading(false);
      })
      .catch(() => {
        setFailed(true);
        setLoading(false);
      });
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setFailed(false);
    setReloadKey((k) => k + 1);
  };

  const jenisList = [
    ...new Set(rows.map((p) => p.jenis_produk)),
  ].sort();

  const filteredRows = jenisFilter
    ? rows.filter((p) => p.jenis_produk === jenisFilter)
    : rows;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <header className="mb-8 flex flex-col gap-5 border-b border-zinc-200 pb-7 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-moon-blue">Katalog Moon Indie Store</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-moon-ink sm:text-4xl">
            Temukan produk untuk idemu
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
            Jelajahi produk yang bisa disesuaikan dengan kebutuhan, desain, dan
            jumlah pesanan Anda.
          </p>
        </div>
        <Link
          href="/register"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-moon-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
        >
          Mulai pesan
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      {loading ? (
        <div role="status" aria-label="Memuat katalog" className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <article key={i} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white animate-pulse">
              <div className="aspect-[4/3] bg-zinc-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-zinc-200 rounded" />
                <div className="h-3 w-1/2 bg-zinc-200 rounded" />
                <div className="h-6 w-full bg-zinc-200 rounded" />
                <div className="h-3 w-1/3 bg-zinc-200 rounded" />
              </div>
            </article>
          ))}
        </div>
      ) : failed ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-moon-pink/20 bg-moon-pink/5 px-5 py-10 text-center">
          <ErrorBox>
            Katalog gagal dimuat. Periksa koneksi internetmu lalu coba lagi.
          </ErrorBox>
          <GhostButton type="button" onClick={retry}>
            Coba lagi
          </GhostButton>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 text-center">
          <Package className="h-10 w-10 text-zinc-400" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-moon-ink">Belum ada produk di kategori ini</h2>
            <p className="mt-1 text-sm text-zinc-500">Pilih kategori lain untuk melihat produk.</p>
          </div>
          <GhostButton type="button" onClick={() => setJenisFilter(null)}>
            Lihat semua produk
          </GhostButton>
        </div>
      ) : (
        <>
          {jenisList.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filter jenis produk">
              <button
                onClick={() => setJenisFilter(null)}
                aria-pressed={!jenisFilter}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue ${
                  !jenisFilter
                    ? "border-moon-ink bg-moon-ink text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-moon-blue hover:text-moon-ink"
                }`}
              >
                Semua
              </button>
              {jenisList.map((jenis) => (
                <button
                  key={jenis}
                  onClick={() => setJenisFilter(jenis)}
                  aria-pressed={jenisFilter === jenis}
                  className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue ${
                    jenisFilter === jenis
                      ? "border-moon-ink bg-moon-ink text-white"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-moon-blue hover:text-moon-ink"
                  }`}
                >
                  {jenis}
                </button>
              ))}
            </div>
          )}
          <ul
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4"
            role="list"
          >
            {filteredRows.map((p) => (
              <li key={p.id}>
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-zinc-300">
                  <ProductImage
                    url={p.gambar_url}
                    nama={p.nama_produk}
                    jenis={p.jenis_produk}
                  />
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <h2 className="line-clamp-2 min-h-12 text-base font-semibold leading-snug text-moon-ink">
                      {p.nama_produk}
                    </h2>
                    <div className="mt-2">
                      <p className="mb-0.5 text-xs text-zinc-500">Harga dasar</p>
                      <PriceDisplay harga={p.harga_dasar} satuan={p.satuan} />
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600 line-clamp-2">
                      Spesifikasi dan desain dapat disesuaikan saat membuat pesanan.
                    </p>
                    <Link
                      href={`/produk/${p.id}`}
                      className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-moon-ink transition-colors hover:border-moon-ink hover:bg-moon-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
                    >
                      Lihat detail
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
