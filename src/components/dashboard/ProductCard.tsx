"use client";

// Kartu produk katalog: gambar sebagai fokus, harga menonjol, aksi kelola.
// Gambar rusak otomatis jatuh ke placeholder (tanpa ikon rusak).

import { useState } from "react";
import { Package } from "lucide-react";
import { formatRupiah } from "@/lib/estimasi";
import type { Produk } from "@/types/firestore";
import type { WithDocId } from "@/lib/db";
import { DangerButton, GhostButton } from "@/components/ui";

export function ProductCard({
  produk,
  busy,
  onEdit,
  onDelete,
}: {
  produk: WithDocId<Produk>;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // URL yang pernah gagal dimuat — tanpa effect, cukup bandingkan string.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPlaceholder = !produk.gambar_url || failedUrl === produk.gambar_url;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_12px_32px_rgba(10,10,10,0.10)] focus-within:border-zinc-300 focus-within:shadow-[0_12px_32px_rgba(10,10,10,0.10)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
        {showPlaceholder ? (
          <span
            role="img"
            aria-label={`Belum ada gambar untuk ${produk.nama_produk}`}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-moon-yellow/15 text-zinc-400"
          >
            <Package className="h-9 w-9" strokeWidth={1.5} aria-hidden="true" />
            <span className="px-4 text-center text-[11px] font-medium">
              Belum ada foto
            </span>
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- URL Storage dinamis
          <img
            src={produk.gambar_url ?? ""}
            alt={produk.nama_produk}
            loading="lazy"
            onError={() => setFailedUrl(produk.gambar_url ?? null)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
        <span className="absolute left-3 top-3 max-w-[60%] truncate rounded-full bg-moon-ink/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {produk.jenis_produk}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="line-clamp-2 min-h-11 text-[15px] font-semibold leading-snug text-moon-ink">
          {produk.nama_produk}
        </h3>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-xl font-bold tracking-tight text-moon-ink">
            {formatRupiah(produk.harga_dasar)}
          </span>
          <span className="text-xs font-medium text-zinc-400">
            /{produk.satuan}
          </span>
        </p>

        <div className="mt-4 flex gap-2 border-t border-zinc-100 pt-4">
          <GhostButton
            type="button"
            disabled={busy}
            onClick={onEdit}
            className="flex-1 justify-center"
          >
            Ubah
          </GhostButton>
          <DangerButton
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="flex-1 justify-center"
          >
            Hapus
          </DangerButton>
        </div>
      </div>
    </article>
  );
}

// Skeleton kartu — menyerupai proporsi ProductCard agar tidak layout shift.
export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
    >
      <div className="aspect-[4/3] animate-pulse bg-zinc-200" />
      <div className="space-y-2.5 p-4 sm:p-5">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-zinc-200" />
        <div className="h-6 w-1/2 animate-pulse rounded-full bg-zinc-100" />
        <div className="flex gap-2 pt-2">
          <div className="h-9 flex-1 animate-pulse rounded-full bg-zinc-100" />
          <div className="h-9 flex-1 animate-pulse rounded-full bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}
