"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listProduk, type WithDocId } from "@/lib/db";
import { formatRupiah } from "@/lib/estimasi";
import type { Produk } from "@/types/firestore";
import { ErrorBox, GhostButton, ProductThumb } from "@/components/ui";
import { ArrowRight, Package, PackageOpen } from "lucide-react";

// Katalog publik di home — produk read publik, jadi bisa tampil tanpa login.
const PREVIEW_COUNT = 6;

const registerLinkClass =
  "group inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-moon-blue transition-colors hover:text-moon-pink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moon-blue";

export function KatalogPreview() {
  const [rows, setRows] = useState<WithDocId<Produk>[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
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

  return (
    <section
      id="katalog"
      aria-labelledby="katalog-heading"
      className="mt-12 scroll-mt-24 sm:mt-16"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-moon-blue">
            Katalog
          </p>
          <h2
            id="katalog-heading"
            className="mt-1 text-2xl font-bold tracking-tight text-moon-ink"
          >
            Produk kami
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Pilihan terbaik untuk produksi custom-mu.
          </p>
        </div>
        <Link href="/register" className={`${registerLinkClass} hidden shrink-0 sm:inline-flex`}>
          Daftar untuk memesan
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {loading ? (
        <div
          role="status"
          aria-label="Memuat katalog"
          className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        >
          <span className="sr-only">Memuat katalog…</span>
          {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
            >
              <div className="aspect-[4/3] animate-pulse bg-zinc-200" />
              <div className="space-y-2 p-3">
                <div className="h-3.5 animate-pulse rounded-full bg-zinc-200" />
                <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      ) : failed ? (
        <div role="alert" className="mt-5 flex flex-col items-start gap-3">
          <ErrorBox>
            Katalog gagal dimuat. Periksa koneksi internetmu lalu coba lagi.
          </ErrorBox>
          <GhostButton type="button" onClick={retry}>
            Coba lagi
          </GhostButton>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center">
          <PackageOpen className="h-8 w-8 text-zinc-300" aria-hidden="true" />
          <p className="text-sm font-medium text-zinc-500">
            Belum ada produk di katalog.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {rows.map((p) => (
            <article
              key={p.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_12px_32px_rgba(10,10,10,0.10)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
                  <ProductThumb url={p.gambar_url} nama={p.nama_produk} fill />
                </div>
                <span className="absolute bottom-2 left-2 rounded-full bg-moon-ink/85 px-2.5 py-1 text-[11px] font-bold text-moon-yellow backdrop-blur-sm">
                  {formatRupiah(p.harga_dasar)}
                  <span className="font-medium text-white/70">/{p.satuan}</span>
                </span>
              </div>
              <div className="flex flex-1 flex-col p-3">
                <h3 className="line-clamp-2 min-h-10 text-[13px] font-semibold leading-snug text-moon-ink transition-colors group-hover:text-moon-blue">
                  {p.nama_produk}
                </h3>
                <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition-colors group-hover:bg-moon-yellow/25 group-hover:text-moon-ink">
                  <Package className="h-3 w-3" aria-hidden="true" />
                  {p.jenis_produk}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-4 text-center sm:hidden">
        <Link href="/register" className={registerLinkClass}>
          Daftar untuk memesan
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
