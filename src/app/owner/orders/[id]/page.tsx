"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RequireRole } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/Shell";
import {
  ProduksiProgress,
  TrackingTimeline,
} from "@/components/TrackingTimeline";
import { EstimasiBiayaCard, OrderItemsCard } from "@/components/OrderCards";
import {
  getEstimasi,
  getOrder,
  listDetailByOrder,
  listProduksiByOrder,
  listTrackingByOrder,
  type WithDocId,
} from "@/lib/db";
import { formatRupiah } from "@/lib/estimasi";
import { usePelangganMap, useProdukMap } from "@/hooks/useLookup";
import type {
  DetailOrder,
  Order,
  PerkiraanHarga,
  Produksi,
  TrackingOrder,
} from "@/types/firestore";
import { BackLink, Badge, orderTone } from "@/components/ui";

// Tampilan read-only untuk owner: estimasi, progres, tracking, item, desain.
// Tanpa tombol aksi apa pun (penegakan tambahan di atas rules).
function OwnerDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [order, setOrder] = useState<WithDocId<Order> | null>(null);
  const [detail, setDetail] = useState<WithDocId<DetailOrder>[]>([]);
  const [produksi, setProduksi] = useState<WithDocId<Produksi>[]>([]);
  const [tracking, setTracking] = useState<WithDocId<TrackingOrder>[]>([]);
  const [estimasi, setEstimasi] = useState<WithDocId<PerkiraanHarga> | null>(
    null
  );
  const namaPelanggan = usePelangganMap();
  const namaProduk = useProdukMap();

  useEffect(() => {
    if (!id) return;
    (async () => {
      const o = await getOrder(id);
      if (!o) return;
      setOrder(o);
      const [d, p, t] = await Promise.all([
        listDetailByOrder(id),
        listProduksiByOrder(id),
        listTrackingByOrder(id),
      ]);
      setDetail(d);
      setProduksi(p);
      setTracking(t);
      if (o.id_estimasi) {
        getEstimasi(o.id_estimasi)
          .then((e) => {
            if (e) setEstimasi(e);
          })
          .catch(() => {});
      }
    })().catch(() => {});
  }, [id]);

  if (!order) {
    return (
      <DashboardShell role="owner" title="Detail Order" contain="3xl">
        <p className="text-sm text-zinc-500">Memuat detail order…</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="owner" title="Detail Order" contain="3xl" className="space-y-4">
      <BackLink href="/owner">Dashboard owner</BackLink>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-moon-ink md:text-3xl">
          Order <code>{order.id.slice(0, 8)}…</code>
        </h1>
        <Badge tone={orderTone(order.status_order)}>{order.status_order}</Badge>
        <Badge tone="blue">read-only</Badge>
      </div>
      <p className="text-sm text-zinc-500">
        Pelanggan:{" "}
        <span className="font-medium text-moon-ink">
          {namaPelanggan[order.id_pelanggan] ?? "Memuat…"}
        </span>{" "}
        · Total{" "}
        <span className="font-semibold text-moon-ink">
          {formatRupiah(order.total_harga)}
        </span>
      </p>

      <EstimasiBiayaCard order={order} estimasi={estimasi} detail={detail} namaProduk={namaProduk} />
      <ProduksiProgress order={order} produksi={produksi} />
      <TrackingTimeline order={order} tracking={tracking} />
      <OrderItemsCard detail={detail} namaProduk={namaProduk} />
    </DashboardShell>
  );
}

export default function OwnerOrderDetailPage() {
  return (
    <RequireRole allow={["owner"]}>
      <OwnerDetailInner />
    </RequireRole>
  );
}
