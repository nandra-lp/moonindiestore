"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { listProduk, type WithDocId } from "@/lib/db";
import { formatRupiah } from "@/lib/estimasi";
import type { Produk } from "@/types/firestore";
import { ErrorBox, GhostButton } from "@/components/ui";
import { ArrowRight, Package } from "lucide-react";

export function ProdukRingkasan({ maxItems = 4, title = "Produk Kami" }: { maxItems?: number; title?: string }) {
  const [rows, setRows] = useState<WithDocId<Produk>[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    listProduk()
      .then((all) => {
        setRows(all.slice(0, maxItems));
        setFailed(false);
        setLoading(false);
      })
      .catch(() => {
        setFailed(true);
        setLoading(false);
      });
  }, [reloadKey, maxItems]);

  const retry = () => {
    setLoading(true);
    setFailed(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <section
      id="produk-ringkasan"
      aria-labelledby="produk-ringkasan-heading"
      className="py-6 sm:py-8 bg-white"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-moon-blue">
              Produk
            </p>
            <h2 id="produk-ringkasan-heading" className="mt-1 text-2xl font-bold tracking-tight text-moon-ink">
              {title}
            </h2>
          </div>
          <Link href="/register" className="shrink-0 inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-moon-blue hover:text-moon-pink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue">
            Lihat Katalog
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </header>

        {loading ? (
          <div role="status" aria-label="Memuat produk" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: maxItems }).map((_, i) => (
              <article key={i} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white animate-pulse">
                <div className="aspect-square bg-zinc-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 bg-zinc-200 rounded" />
                  <div className="h-3 w-1/2 bg-zinc-200 rounded" />
                  <div className="h-6 w-full bg-zinc-200 rounded" />
                </div>
              </article>
            ))}
          </div>
        ) : failed ? (
          <div role="alert" className="mt-5 flex flex-col items-center gap-3 text-center">
            <ErrorBox>
              Produk gagal dimuat. Periksa koneksi internetmu lalu coba lagi.
            </ErrorBox>
            <GhostButton type="button" onClick={retry}>
              Coba lagi
            </GhostButton>
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
            <Package className="h-10 w-10 text-zinc-300" aria-hidden="true" />
            <p className="text-sm font-medium text-zinc-500">Belum ada produk di katalog.</p>
            <Link
              href="/register"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-moon-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Daftar untuk memulai
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" role="list">
            {rows.map((p) => (
              <li key={p.id}>
                <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_12px_32px_rgba(10,10,10,0.10)]">
                  <div className="relative aspect-square overflow-hidden bg-zinc-100">
                    {p.gambar_url ? (
                      <Image
                        src={p.gambar_url}
                        alt={p.nama_produk}
                        fill
                        sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-moon-yellow/25 text-zinc-300" aria-label={`Belum ada gambar untuk ${p.nama_produk}`}>
                        <Package className="h-12 w-12" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <h3 className="line-clamp-2 min-h-[3rem] text-base font-semibold leading-normal text-moon-ink transition-colors group-hover:text-moon-blue">
                      {p.nama_produk}
                    </h3>

                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-lg font-bold text-moon-ink">{formatRupiah(p.harga_dasar)}</span>
                      <span className="text-sm font-medium text-zinc-500">/{p.satuan}</span>
                    </div>

                    <p className="mt-2 flex-1 text-sm text-zinc-600 leading-relaxed line-clamp-2">
                      {p.jenis_produk} • Siap dipesan & dikirim ke seluruh Indonesia.
                    </p>

                    <Link
                      href={`/customer/pesan?produk=${p.id}`}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-moon-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
                    >
                      Lihat & Pesan
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}