"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/AuthGuard";
import { listDetailByOrderIds, listProduk, subscribeOrdersRecent, type WithDocId } from "@/lib/db";
import { ringkasNamaProduk, usePelangganMap, useProdukMap } from "@/hooks/useLookup";
import { formatTanggal } from "@/lib/estimasi";
import type { Order, Produk } from "@/types/firestore";
import { Badge, EmptyRow, PageHeader, Stat, orderTone } from "@/components/ui";

const FILTERS = [
  "semua",
  "menunggu",
  "diproses",
  "produksi",
  "selesai",
  "dibatalkan",
] as const;

function AdminInner() {
  const [orders, setOrders] = useState<WithDocId<Order>[]>([]);
  const [produk, setProduk] = useState<WithDocId<Produk>[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("semua");
  // orderId -> daftar id_produk, untuk ringkasan nama produk per kartu.
  const [ringkasan, setRingkasan] = useState<Record<string, string[]>>({});
  const namaPelanggan = usePelangganMap();
  const namaProduk = useProdukMap();

  useEffect(() => {
    // Listener realtime: kartu order ikut berubah saat ada order
    // baru / perubahan status, tanpa refresh halaman.
    const unsubOrders = subscribeOrdersRecent(50, setOrders, () => {});
    listProduk().then(setProduk).catch(() => {});
    return () => unsubOrders();
  }, []);

  useEffect(() => {
    if (orders.length === 0) return;
    listDetailByOrderIds(orders.map((o) => o.id))
      .then((rows) => {
        const m: Record<string, string[]> = {};
        for (const d of rows) (m[d.id_order] ??= []).push(d.id_produk);
        setRingkasan(m);
      })
      .catch(() => {});
  }, [orders]);

  const filtered =
    filter === "semua" ? orders : orders.filter((o) => o.status_order === filter);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <PageHeader
        eyebrow="Dashboard admin"
        title="Kelola order & produksi"
        desc="Data live dari Firestore. Klik order untuk update produksi & tracking."
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Total order (50 terakhir)" value={orders.length} accent="yellow" />
        <Link
          href="/admin/produk"
          className="rounded-2xl border border-zinc-200 border-t-4 border-t-moon-blue bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-xs text-zinc-500">Produk + gambar →</p>
          <p className="mt-1 text-3xl font-semibold text-moon-ink">{produk.length}</p>
        </Link>
        <Link
          href="/admin/estimasi"
          className="rounded-2xl border border-zinc-200 border-t-4 border-t-moon-pink bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-xs text-zinc-500">Estimasi harga →</p>
          <p className="mt-1 text-3xl font-semibold text-moon-ink">lihat</p>
        </Link>
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <h2 className="font-semibold text-moon-ink">Order terbaru</h2>
        <span
          title="Status terupdate otomatis"
          className="flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-600" />
          </span>
          Live
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              filter === f
                ? "border-moon-ink bg-moon-ink text-moon-yellow"
                : "border-zinc-300 hover:border-moon-blue hover:text-moon-blue"
            }`}
          >
            {f} (
            {f === "semua"
              ? orders.length
              : orders.filter((o) => o.status_order === f).length}
            )
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {filtered.map((o) => (
          <Link
            key={o.id}
            href={`/admin/orders/${o.id}`}
            className="group block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-moon-yellow hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-bold text-moon-ink">
                {namaPelanggan[o.id_pelanggan] ?? "Memuat…"}
              </span>
              <Badge tone={orderTone(o.status_order)}>{o.status_order}</Badge>
            </div>
            <p className="mt-1.5 truncate text-xs text-zinc-500">
              {ringkasNamaProduk(ringkasan[o.id], namaProduk)} · #{o.id.slice(0, 8)}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Dipesan pada</p>
                <p className="text-sm text-moon-ink">{formatTanggal(o.tgl_order)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 mb-0.5">Total Harga</p>
                <p className="text-sm font-bold text-moon-ink">
                  Rp{o.total_harga.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <EmptyRow>
            {orders.length === 0 ? (
              <>
                Belum ada order. Collection <code>orders</code> masih kosong.
              </>
            ) : (
              <>Tidak ada order berstatus “{filter}”.</>
            )}
          </EmptyRow>
        )}
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <RequireRole allow={["admin"]}>
      <AdminInner />
    </RequireRole>
  );
}
