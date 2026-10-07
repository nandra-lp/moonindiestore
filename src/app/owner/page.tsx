"use client";

import { useEffect, useState } from "react";
import { Calculator } from "lucide-react";
import { RequireRole } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/Shell";
import {
  DashboardHero,
  EmptyCard,
  FilterPills,
  OrderCard,
  SectionHead,
  StatLink,
} from "@/components/dashboard/widgets";
import { listDetailByOrderIds, subscribeOrdersRecent, type WithDocId } from "@/lib/db";
import { ringkasNamaProduk, usePelangganMap, useProdukMap } from "@/hooks/useLookup";
import { formatRupiah, formatTanggal } from "@/lib/estimasi";
import type { Order } from "@/types/firestore";
import { Stat } from "@/components/ui";

const FILTERS = [
  "semua",
  "menunggu",
  "diproses",
  "produksi",
  "selesai",
  "dibatalkan",
] as const;

function OwnerInner() {
  const [orders, setOrders] = useState<WithDocId<Order>[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("semua");
  const [loaded, setLoaded] = useState(false);
  // orderId -> daftar id_produk, untuk ringkasan nama produk per kartu.
  const [ringkasan, setRingkasan] = useState<Record<string, string[]>>({});
  const namaPelanggan = usePelangganMap();
  const namaProduk = useProdukMap();
  useEffect(() => {
    // Listener realtime: kartu order ikut berubah saat ada order
    // baru / perubahan status, tanpa refresh halaman.
    const unsub = subscribeOrdersRecent(
      50,
      (rows) => {
        setOrders(rows);
        setLoaded(true);
      },
      () => setLoaded(true),
    );
    return () => unsub();
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
  const counts: Record<string, number> = { semua: orders.length };
  for (const f of FILTERS) {
    if (f !== "semua") counts[f] = orders.filter((o) => o.status_order === f).length;
  }

  const omzet = orders
    .filter((o) => o.status_order !== "dibatalkan")
    .reduce((s, o) => s + (o.total_harga || 0), 0);

  return (
    <DashboardShell role="owner" title="Dashboard" contain="5xl">
      <DashboardHero
        eyebrow="Dashboard owner"
        title="Pantau omzet & produksi"
        desc="Read-only. Untuk update produksi, hubungi admin."
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat
          label="Estimasi omzet (non-batal)"
          value={formatRupiah(omzet)}
          accent="blue"
        />
        <Stat label="Order terpantau" value={orders.length} accent="yellow" />
        <StatLink
          href="/owner/estimasi"
          label="Estimasi harga"
          value="Lihat"
          accent="pink"
          icon={Calculator}
        />
      </div>

      <div className="mt-8">
        <SectionHead title="Order terbaru — klik untuk melihat detail" live />
      </div>
      <div className="mt-3">
        <FilterPills
          options={FILTERS}
          value={filter}
          counts={counts}
          onChange={setFilter}
        />
      </div>

      {!loaded ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <div className="h-4 w-2/3 rounded-full bg-zinc-200" />
              <div className="mt-2 h-3 w-1/2 rounded-full bg-zinc-100" />
              <div className="mt-4 h-10 rounded-xl bg-zinc-100" />
            </div>
          ))}
          <span className="sr-only">Memuat order…</span>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {filtered.map((o) => (
            <OrderCard
              key={o.id}
              href={`/owner/orders/${o.id}`}
              title={namaPelanggan[o.id_pelanggan] ?? "Memuat…"}
              status={o.status_order}
              summary={`${ringkasNamaProduk(ringkasan[o.id], namaProduk)} · #${o.id.slice(0, 8)}`}
              dateLabel="Dipesan pada"
              date={formatTanggal(o.tgl_order)}
              totalLabel="Total Harga"
              total={formatRupiah(o.total_harga)}
            />
          ))}
          {filtered.length === 0 && (
            <EmptyCard>
              {orders.length === 0 ? (
                <>Belum ada order.</>
              ) : (
                <>Tidak ada order berstatus “{filter}”.</>
              )}
            </EmptyCard>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

export default function OwnerPage() {
  return (
    <RequireRole allow={["owner"]}>
      <OwnerInner />
    </RequireRole>
  );
}
