"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { listProduk, type WithDocId } from "@/lib/db";
import { formatRupiah } from "@/lib/estimasi";
import type { Produk } from "@/types/firestore";
import { ErrorBox, GhostButton } from "@/components/ui";
import { ArrowRight, Package, Sparkles, Tag, RotateCcw } from "lucide-react";

const PREVIEW_COUNT = 8;

const registerLinkClass =
  "group inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-moon-blue transition-colors hover:text-moon-pink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moon-blue";

type ProductBadge = "bestseller" | "baru" | "custom" | null;

interface ProductWithBadge extends WithDocId<Produk> {
  badge: ProductBadge;
}

function getDeterministicBadge(id: string): ProductBadge {
  const badges: ProductBadge[] = ["bestseller", "baru", "custom", null, null];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return badges[hash % badges.length];
}

function BadgeIcon({ type }: { type: ProductBadge }) {
  switch (type) {
    case "bestseller":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-moon-yellow text-moon-ink px-2 py-0.5 text-[10px] font-bold">
          <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
          Bestseller
        </span>
      );
    case "baru":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-moon-blue text-white px-2 py-0.5 text-[10px] font-bold">
          <Tag className="h-2.5 w-2.5" aria-hidden="true" />
          Baru
        </span>
      );
    case "custom":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-moon-pink text-white px-2 py-0.5 text-[10px] font-bold">
          <RotateCcw className="h-2.5 w-2.5" aria-hidden="true" />
          Custom
        </span>
      );
    default:
      return null;
  }
}

function ProductImage({
  url,
  nama,
  badge,
}: {
  url?: string | null;
  nama: string;
  badge: ProductBadge;
}) {
  return (
    <div className="relative aspect-square overflow-hidden bg-zinc-100">
      {url ? (
        <Image
          src={url}
          alt={nama}
          fill
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-moon-yellow/25 text-zinc-300" aria-label={`Belum ada gambar untuk ${nama}`}>
          <Package className="h-12 w-12" aria-hidden="true" />
        </div>
      )}
      {badge && (
        <div className="absolute top-2 left-2 z-10">
          <BadgeIcon type={badge} />
        </div>
      )}
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

export function KatalogPreview() {
  const [rows, setRows] = useState<ProductWithBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    listProduk()
      .then((all) => {
        const withBadges = all.slice(0, PREVIEW_COUNT).map((p) => ({
          ...p,
          badge: getDeterministicBadge(p.id),
        }));
        setRows(withBadges);
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
      className="py-14 sm:py-16 lg:py-20 bg-white"
    >
      <div className="mx-auto max-w-5xl px-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-moon-blue">
              Katalog
            </p>
            <h2 id="katalog-heading" className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-moon-ink">
              Produk Kami
            </h2>
            <p className="mt-1 text-sm sm:text-base text-zinc-600 max-w-xs">
              Pilihan terbaik untuk produksi custom-mu.
            </p>
          </div>
          <Link href="/register" className={`${registerLinkClass} shrink-0`}>
            Daftar untuk memesan
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </header>

        {loading ? (
          <div role="status" aria-label="Memuat katalog" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
              <article key={i} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white animate-pulse">
                <div className="aspect-square bg-zinc-200" />
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
          <div role="alert" className="mt-5 flex flex-col items-center gap-3 text-center">
            <ErrorBox>
              Katalog gagal dimuat. Periksa koneksi internetmu lalu coba lagi.
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
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list">
            {rows.map((p) => (
              <li key={p.id}>
                <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_12px_32px_rgba(10,10,10,0.10)]">
                  <ProductImage url={p.gambar_url} nama={p.nama_produk} badge={p.badge} />

                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="line-clamp-2 min-h-[3rem] text-base font-semibold leading-snug text-moon-ink transition-colors group-hover:text-moon-blue">
                      {p.nama_produk}
                    </h3>

                    <PriceDisplay harga={p.harga_dasar} satuan={p.satuan} />

                    <p className="mt-2 flex-1 text-sm text-zinc-600 leading-relaxed line-clamp-2">
                      {p.jenis_produk} • Siap dipesan & dikirim ke seluruh Indonesia.
                    </p>

                    <Link
                      href={`/customer/pesan?produk=${p.id}`}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-moon-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
                    >
                      Lihat detail & pesan
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