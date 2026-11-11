"use client";

import { useEffect, useState } from "react";
import { Calculator, ArrowRight } from "lucide-react";
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
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { PrimaryLink, Stat } from "@/components/ui";
import { listDetailByOrderIds, subscribeOrdersRecent, type WithDocId } from "@/lib/db";
import { ringkasNamaProduk, usePelangganMap, useProdukMap } from "@/hooks/useLookup";
import { formatRupiah, formatTanggal } from "@/lib/estimasi";
import type { Order } from "@/types/firestore";

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
  const [ringkasan, setRingkasan] = useState<Record<string, string[]>>({});
  const namaPelanggan = usePelangganMap();
  const namaProduk = useProdukMap();

  useEffect(() => {
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
    <DashboardShell role="owner" title="Dashboard" contain="6xl">
      <DashboardHero
        eyebrow="Dashboard owner"
        title="Pantau omzet & produksi"
        desc="Read-only. Untuk update produksi, hubungi admin."
      />

      {/* Ringkasan statistik */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-5">
        <Stat
          label="Omzet (non-batal)"
          value={formatRupiah(omzet)}
          accent="blue"
        />
        <Stat label="Order terpantau" value={orders.length} accent="yellow" />
        <StatLink
          href="/owner/estimasi"
          label="Estimasi pendapatan"
          value="Lihat"
          accent="pink"
          icon={Calculator}
        />
      </div>

      {/* Grafik pemasukan */}
      <RevenueChart orders={orders} loading={!loaded} />

      {/* Daftar order terbaru */}
      <div className="mt-8 flex items-center justify-between">
        <SectionHead title="Order terbaru — klik untuk melihat detail" />
        <PrimaryLink href="/owner">
          Semua order <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </PrimaryLink>
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
        <div className="mt-6 grid gap-4 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="h-4 w-3/4 rounded-full bg-moon-yellow/20 animate-pulse" />
              <div className="mt-3 h-3 w-1/2 rounded-full bg-zinc-100 animate-pulse" />
              <div className="mt-4 h-3 w-full rounded-full bg-zinc-100 animate-pulse" />
              <div className="mt-2 h-10 w-full rounded-xl bg-zinc-100 animate-pulse" />
              <div className="mt-3 h-3 w-1/3 rounded-full bg-zinc-100 animate-pulse" />
            </div>
          ))}
          <span className="sr-only">Memuat order…</span>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((o) => (
            <OrderCard
              key={o.id}
              href={`/owner/orders/${o.id}`}
              title={namaPelanggan[o.id_pelanggan] ?? "Memuat…"}
              status={o.status_order}
              paymentStatus={o.status_pembayaran}
              summary={`${ringkasNamaProduk(ringkasan[o.id], namaProduk)} · #${o.id.slice(0, 8)}`}
              dateLabel="Dipesan pada"
              date={formatTanggal(o.tgl_order)}
              totalLabel="Total Harga"
              total={formatRupiah(o.total_harga)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full">
              <EmptyCard>
                {orders.length === 0 ? (
                  <>Belum ada order.</>
                ) : (
                  <>Tidak ada order berstatus “{filter}”.</>
                )}
              </EmptyCard>
            </div>
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
