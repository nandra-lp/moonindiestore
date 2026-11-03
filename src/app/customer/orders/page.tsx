"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";
import { RequireRole } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/Shell";
import { useAuth } from "@/context/AuthContext";
import { listDetailByOrderIds, listOrdersByPelanggan, type WithDocId } from "@/lib/db";
import { ringkasNamaProduk, useProdukMap } from "@/hooks/useLookup";
import { formatRupiah, formatTanggal } from "@/lib/estimasi";
import type { Order } from "@/types/firestore";
import { BackLink, Badge, PageHeader, PrimaryLink, orderTone } from "@/components/ui";

// Petunjuk singkat agar customer tahu langkah pembayaran yang perlu dilakukan.
function paymentHint(o: WithDocId<Order>) {
  if (o.status_order === "dibatalkan" || o.status_order === "selesai") return null;
  if (!o.metode_pembayaran) return null;
  if (o.status_pembayaran === "terverifikasi")
    return { tone: "green" as const, label: "Pembayaran lunas" };
  if (o.status_pembayaran === "bukti_dikirim")
    return { tone: "blue" as const, label: "Bukti diperiksa" };
  if (o.status_order === "diproses")
    return { tone: "yellow" as const, label: "Perlu bayar" };
  return null;
}

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
    <DashboardShell role="customer" title="Pesanan Saya" contain="4xl" className="space-y-6">
      <BackLink href="/customer">Kembali ke Dashboard</BackLink>

      <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          eyebrow="Riwayat pesanan"
          title="Pesanan saya"
          desc="Pantau status, pembayaran, dan progres setiap pesanan."
        />
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
          <span className="text-sm text-zinc-500">
            {orders.length} pesanan
          </span>
          <PrimaryLink href="/customer/pesan" className="w-full justify-center sm:w-auto">
            Buat pesanan
          </PrimaryLink>
        </div>
      </header>

      {orders.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <PackageCheck className="h-4 w-4 text-moon-blue" aria-hidden="true" />
          <span>Pilih pesanan untuk melihat rincian dan perkembangannya.</span>
        </div>
      )}

      <div className="grid gap-3 sm:gap-4">
        {orders.map((o) => {
          const hint = paymentHint(o);
          return (
            <Link
              key={o.id}
              href={`/customer/orders/${o.id}`}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-moon-blue/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1 bg-moon-yellow transition-colors group-hover:bg-moon-blue"
              />
              <div className="p-4 pl-5 sm:p-5 sm:pl-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-moon-ink">
                        {profile?.nama ?? "Pesanan saya"}
                      </span>
                      <Badge tone={orderTone(o.status_order)}>
                        {o.status_order}
                      </Badge>
                      {hint && (
                        <Badge tone={hint.tone} size="sm">
                          {hint.label}
                        </Badge>
                      )}
                    </div>

                    <p className="mt-2 break-words text-sm font-medium text-zinc-700">
                      {ringkasNamaProduk(ringkasan[o.id], namaProduk)}
                    </p>
                    <p className="mt-1 font-mono text-xs text-zinc-400">
                      Order #{o.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-3 sm:min-w-40 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                    <div className="sm:text-right">
                      <p className="text-xs text-zinc-500">Total pesanan</p>
                      <p className="mt-0.5 text-base font-bold text-moon-ink">
                        {formatRupiah(o.total_harga)}
                      </p>
                    </div>
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-moon-ink group-hover:text-moon-yellow"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Dipesan pada {formatTanggal(o.tgl_order)}</span>
                </div>
              </div>
            </Link>
          );
        })}
        {orders.length === 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-8">
            <div className="flex flex-col items-center rounded-2xl bg-zinc-50 px-5 py-9 text-center sm:py-12">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-moon-yellow/25 text-moon-ink">
                <ShoppingBag className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-moon-ink">
                Belum ada pesanan
              </h2>
              <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">
                Pesanan yang Anda buat akan tampil di sini untuk memudahkan pemantauan.
              </p>
              <PrimaryLink href="/customer/pesan" className="mt-5">
                Buat pesanan pertama
              </PrimaryLink>
            </div>
          </div>
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
