"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getProduk, listProduk, type WithDocId } from "@/lib/db";
import { formatRupiah } from "@/lib/estimasi";
import type { Produk } from "@/types/firestore";
import { Card, ProductThumb } from "@/components/ui";
import { ArrowRight, Package, Sparkles, Tag, RotateCcw } from "lucide-react";

export default function ProdukDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [produk, setProduk] = useState<WithDocId<Produk> | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [failed, setFailed] = useState(!id);
  const [terkait, setTerkait] = useState<WithDocId<Produk>[]>([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setFailed(false);
      try {
        const [detail, all] = await Promise.all([
          getProduk(id),
          listProduk(),
        ]);
        if (cancelled) return;
        if (!detail) {
          setProduk(null);
          setFailed(true);
          setLoading(false);
          return;
        }
        setProduk(detail);
        setTerkait(
          all
            .filter((p) => p.id !== id)
            .slice(0, 4)
        );
        setFailed(false);
        setLoading(false);
      } catch {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <div role="status" aria-label="Memuat produk" className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="aspect-[4/3] animate-pulse overflow-hidden rounded-3xl bg-zinc-200" />
          <div className="animate-pulse space-y-4 py-2">
            <div className="h-4 w-1/2 bg-zinc-200 rounded" />
            <div className="h-8 w-2/3 bg-zinc-200 rounded" />
            <div className="h-4 w-1/3 bg-zinc-200 rounded" />
            <div className="h-16 w-full bg-zinc-200 rounded-2xl" />
            <div className="h-4 w-1/2 bg-zinc-200 rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (failed || !produk) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14">
        <Card className="border-zinc-200 px-5 py-12 text-center sm:px-8 sm:py-16">
          <Package className="mx-auto mb-4 h-10 w-10 text-zinc-400" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-moon-ink">Produk belum dapat ditampilkan</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
            Produk mungkin sudah tidak tersedia atau gagal dimuat. Kembali ke katalog untuk melihat pilihan lainnya.
          </p>
          <Link
            href="/produk"
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-moon-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
          >
            Kembali ke katalog
            <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" />
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <Link
        href="/produk"
        className="mb-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-moon-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue sm:mb-8"
      >
        <ArrowRight className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
        Kembali ke katalog
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-zinc-100">
          <ProductThumb
            url={produk.gambar_url}
            nama={produk.nama_produk}
            jenis={produk.jenis_produk}
            fill
          />
        </div>

        <section className="flex flex-col lg:py-3">
          <p className="w-fit rounded-full bg-moon-blue/10 px-3 py-1 text-sm font-medium text-moon-ink">
            {produk.jenis_produk}
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-moon-ink sm:text-4xl">
            {produk.nama_produk}
          </h1>

          <div className="mt-5 border-y border-zinc-200 py-5">
            <p className="text-sm text-zinc-500">Harga dasar</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-3xl font-bold tracking-tight text-moon-ink">
                {formatRupiah(produk.harga_dasar)}
              </span>
              <span className="text-sm font-medium text-zinc-500">/ {produk.satuan}</span>
            </p>
          </div>

          <p className="mt-5 text-sm leading-6 text-zinc-600 sm:text-base">
            Produk dapat dipesan dengan spesifikasi dan desain yang disesuaikan.
            Admin akan mengonfirmasi detail serta total akhir sebelum produksi.
          </p>

          <div className="mt-6 border-t border-zinc-200 pt-5">
            <p className="mb-3 text-sm text-zinc-500">
              Harga akhir dapat berubah mengikuti spesifikasi pesanan.
            </p>
            <Link
              href={`/customer/pesan?produk=${produk.id}`}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-moon-ink px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue sm:w-auto sm:min-w-52"
            >
              Pesan produk ini
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>

      <section className="mt-10 border-t border-zinc-200 pt-7 sm:mt-12 sm:pt-8">
        <h2 className="text-xl font-semibold text-moon-ink">
          Tentang produk ini
        </h2>
        <ul className="mt-4 divide-y divide-zinc-200 border-y border-zinc-200 text-sm leading-6 text-zinc-600 sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <li className="flex items-start gap-3 py-4 sm:py-4">
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-moon-yellow" aria-hidden="true" />
              <span>
                Jenis produk: <span className="font-medium text-moon-ink">{produk.jenis_produk}</span>
              </span>
            </li>
            <li className="flex items-start gap-3 py-4 sm:px-5 sm:py-4">
              <Tag className="mt-1 h-4 w-4 shrink-0 text-moon-blue" aria-hidden="true" />
              <span>
                Harga dasar:
                <span className="font-medium text-moon-ink">
                  {formatRupiah(produk.harga_dasar)} / {produk.satuan}
                </span>
              </span>
            </li>
            <li className="flex items-start gap-3 py-4 sm:border-t sm:border-zinc-200 sm:py-4">
              <RotateCcw className="mt-1 h-4 w-4 shrink-0 text-moon-pink" aria-hidden="true" />
              <span>
                Desain custom:
                <span className="font-medium text-moon-ink">Dapat disesuaikan</span>
              </span>
            </li>
            <li className="flex items-start gap-3 py-4 sm:border-t sm:border-zinc-200 sm:px-5 sm:py-4">
              <Package className="mt-1 h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
              <span>
                Pengiriman:
                <span className="font-medium text-moon-ink">Seluruh Indonesia</span>
              </span>
            </li>
        </ul>
      </section>

      {terkait.length > 0 && (
        <section className="mt-10 border-t border-zinc-200 pt-7 sm:mt-12 sm:pt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-moon-ink">
                Produk lainnya
              </h2>
              <p className="mt-1 text-sm text-zinc-500">Pilihan lain yang mungkin sesuai.</p>
            </div>
            <Link
              href="/produk"
              className="hidden min-h-10 items-center gap-1 text-sm font-medium text-moon-blue hover:text-moon-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue sm:inline-flex"
            >
              Semua produk
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4" role="list">
            {terkait.map((p) => (
                <li key={p.id}>
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-zinc-300">
                    <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                      <ProductThumb
                        url={p.gambar_url}
                        nama={p.nama_produk}
                        jenis={p.jenis_produk}
                        fill
                      />
                      <span className="absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-moon-ink shadow-sm backdrop-blur">
                        {p.jenis_produk}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-2 min-h-12 text-base font-semibold leading-snug text-moon-ink">
                        {p.nama_produk}
                      </h3>
                      <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-lg font-bold text-moon-ink">
                          {formatRupiah(p.harga_dasar)}
                        </span>
                        <span className="text-sm text-zinc-500">/ {p.satuan}</span>
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
          <Link
            href="/produk"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-zinc-300 text-sm font-medium text-moon-ink hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue sm:hidden"
          >
            Lihat semua produk
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      )}
    </main>
  );
}
