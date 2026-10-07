"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/Shell";
import { useAuth } from "@/context/AuthContext";
import { listDetailByOrderIds, listOrdersByPelanggan, type WithDocId } from "@/lib/db";
import { ringkasNamaProduk, useProdukMap } from "@/hooks/useLookup";
import { formatRupiah, formatTanggal } from "@/lib/estimasi";
import type { Order } from "@/types/firestore";
import { BackLink, Badge, Card, PageHeader, PrimaryLink, orderTone } from "@/components/ui";

function OrdersInner() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<WithDocId<Order>[]>([]);
  // orderId -> daftar id_produk, untuk ringkasan nama produk per kartu.
  const [ringkasan, setRingkasan] = useState<Record<string, string[]>>({});
  const namaProduk = useProdukMap();

  useEffect(() => {
    const idp = profile?.id_pelanggan;
    if (!idp) return;
    listOrdersByPelanggan(idp).then(setOrders).catch((err) => {
      console.error("Gagal memuat pesanan:", err);
    });
  }, [profile?.id_pelanggan]);

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

  return (
    <DashboardShell role="customer" title="Pesanan Saya" contain="3xl">
      <BackLink href="/customer">Kembali</BackLink>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          eyebrow="Customer · Tracking"
          title="Pesanan saya"
          desc="Klik pesanan untuk melihat progres produksi & tracking."
        />
        <PrimaryLink href="/customer/pesan">+ Buat pesanan</PrimaryLink>
      </div>
      <div className="mt-6 grid gap-4">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/customer/orders/${o.id}`}
            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-moon-yellow hover:shadow-md"
          >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-moon-ink">
                    {profile?.nama ?? "Pesanan saya"}
                  </span>
                  <Badge tone={orderTone(o.status_order)}>
                    {o.status_order}
                  </Badge>
                </div>
                <p className="mt-1.5 truncate text-xs text-zinc-500">
                  {ringkasNamaProduk(ringkasan[o.id], namaProduk)} · #{o.id.slice(0, 8)}
                </p>
                <p className="mt-1.5 text-xs text-zinc-500">
                  Dipesan pada: {formatTanggal(o.tgl_order)}
                </p>
            </div>
            
            <div className="flex items-center justify-between border-t border-zinc-100 pt-3 sm:border-0 sm:pt-0">
              <div className="text-left sm:text-right sm:mr-4">
                <p className="text-xs text-zinc-500 mb-0.5">Total Harga</p>
                <p className="text-sm font-bold text-moon-ink">
                  {formatRupiah(o.total_harga)}
                </p>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 transition group-hover:bg-moon-yellow group-hover:text-moon-ink">
                →
              </span>
            </div>
          </Link>
        ))}
        {orders.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-zinc-500">Belum ada pesanan.</p>
            <Link
              href="/customer/pesan"
              className="mt-2 inline-block font-medium text-moon-blue hover:underline"
            >
              Buat pesanan pertama →
            </Link>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}

export default function CustomerOrdersPage() {
  return (
    <RequireRole allow={["customer"]}>
      <OrdersInner />
    </RequireRole>
  );
}
