"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listProduk, type WithDocId } from "@/lib/db";
import { formatRupiah } from "@/lib/estimasi";
import type { Produk } from "@/types/firestore";
import { ProductThumb } from "@/components/ui";
import { ArrowRight, Package } from "lucide-react";

// Katalog publik di home — produk read publik, jadi bisa tampil tanpa login.
export function KatalogPreview() {
  const [rows, setRows] = useState<WithDocId<Produk>[]>([]);

  useEffect(() => {
    listProduk().then((all) => setRows(all.slice(0, 6))).catch(() => {});
  }, []);

  if (rows.length === 0) return null;

  return (
    <section id="katalog" className="mt-12 scroll-mt-24 sm:mt-16">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-moon-blue">
            Katalog
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-moon-ink">
            Produk kami
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Pilihan terbaik untuk produksi custom-mu.
          </p>
        </div>
        <Link
          href="/register"
          className="group hidden items-center gap-1.5 text-sm font-semibold text-moon-blue transition-colors hover:text-moon-pink sm:inline-flex"
        >
          Daftar untuk memesan
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {rows.map((p) => (
          <div
            key={p.id}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-zinc-200/50 hover:border-zinc-300"
          >
            <div className="flex justify-center">
              <ProductThumb url={p.gambar_url} nama={p.nama_produk} size="lg" />
            </div>
            <p className="mt-3 truncate text-sm font-semibold text-moon-ink transition-colors group-hover:text-moon-blue">
              {p.nama_produk}
            </p>
            <p className="mt-0.5 text-sm font-medium text-moon-blue">
              {formatRupiah(p.harga_dasar)}/{p.satuan}
            </p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition-colors group-hover:bg-moon-yellow/20 group-hover:text-moon-ink">
              <Package className="h-3 w-3" />
              {p.jenis_produk}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center sm:hidden">
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-moon-blue transition-colors hover:text-moon-pink"
        >
          Daftar untuk memesan
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
