"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RequireRole } from "@/components/AuthGuard";
import {
  ProduksiProgress,
  TrackingTimeline,
} from "@/components/TrackingTimeline";
import { useAuth } from "@/context/AuthContext";
import {
  deleteDocById,
  getEstimasi,
  getOrder,
  listDetailByOrder,
  listProduksiByOrder,
  listTrackingByOrder,
  type WithDocId,
} from "@/lib/db";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { hapusFileStorage } from "@/lib/storage";
import { formatRupiah } from "@/lib/estimasi";
import type {
  DetailOrder,
  Order,
  PerkiraanHarga,
  Produksi,
  TrackingOrder,
} from "@/types/firestore";
import { BackLink, Badge, DangerButton, ErrorBox, orderTone } from "@/components/ui";
import { EstimasiBiayaCard, OrderItemsCard } from "@/components/OrderCards";
import { useProdukMap } from "@/hooks/useLookup";

function DetailInner() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { profile } = useAuth();
  const [order, setOrder] = useState<WithDocId<Order> | null>(null);
  const [detail, setDetail] = useState<WithDocId<DetailOrder>[]>([]);
  const [produksi, setProduksi] = useState<WithDocId<Produksi>[]>([]);
  const [tracking, setTracking] = useState<WithDocId<TrackingOrder>[]>([]);
  const [estimasi, setEstimasi] = useState<WithDocId<PerkiraanHarga> | null>(
    null
  );
  const [denied, setDenied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const namaProduk = useProdukMap();

  useEffect(() => {
    if (!id) return;
    (async () => {
      const o = await getOrder(id);
      if (!o) return;
      // Customer hanya boleh membuka order miliknya sendiri.
      if (profile?.id_pelanggan && o.id_pelanggan !== profile.id_pelanggan) {
        setDenied(true);
        return;
      }
      setOrder(o);
      const [d, p, t] = await Promise.all([
        listDetailByOrder(id),
        listProduksiByOrder(id),
        listTrackingByOrder(id),
      ]);
      setDetail(d);
      setProduksi(p);
      setTracking(t);
      // Estimasi awal hanya ada bila order dibuat dari riwayat estimasi.
      if (o.id_estimasi) {
        getEstimasi(o.id_estimasi)
          .then((e) => {
            if (e && e.id_pelanggan === o.id_pelanggan) setEstimasi(e);
          })
          .catch(() => {});
      }
    })().catch(() => {});
  }, [id, profile?.id_pelanggan]);

  // Pembatalan oleh customer: hanya selagi status masih menunggu.
  // Anak-anak (tracking, item + file desain) dihapus dulu, order terakhir,
  // sesuai urutan yang diizinkan rules.
  async function batalkan() {
    if (!order || order.status_order !== "menunggu" || cancelling) return;
    if (
      !confirm(
        "Batalkan pesanan ini? Item, tracking, dan file desainnya ikut dihapus."
      )
    )
      return;
    setCancelling(true);
    setCancelError(null);
    try {
      await Promise.allSettled([
        ...tracking.map((t) =>
          deleteDocById(COLLECTIONS.tracking_order, t.id)
        ),
        ...detail.map(async (d) => {
          await hapusFileStorage(d.desain_path).catch(() => {});
          await deleteDocById(COLLECTIONS.detail_order, d.id);
        }),
      ]);
      await deleteDocById(COLLECTIONS.orders, order.id);
      router.push("/customer/orders");
    } catch (err) {
      setCancelError(
        err instanceof Error ? err.message : "Gagal membatalkan pesanan."
      );
    } finally {
      setCancelling(false);
    }
  }

  if (denied) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <ErrorBox>Order ini bukan milik akunmu.</ErrorBox>
        <div className="mt-4">
          <BackLink href="/customer/orders">Kembali ke pesanan saya</BackLink>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <p className="text-sm text-zinc-500">Memuat detail order…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-6 py-10">
      <BackLink href="/customer/orders">Semua pesanan</BackLink>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-moon-ink">
          Order <code>{order.id.slice(0, 8)}…</code>
        </h1>
        <Badge tone={orderTone(order.status_order)}>{order.status_order}</Badge>
        {order.status_order === "menunggu" && (
          <DangerButton disabled={cancelling} onClick={batalkan}>
            {cancelling ? "Membatalkan…" : "Batalkan pesanan"}
          </DangerButton>
        )}
      </div>
      {cancelError && <ErrorBox>{cancelError}</ErrorBox>}
      <p className="text-sm text-zinc-500">
        Dipesan oleh{" "}
        <span className="font-medium text-moon-ink">
          {profile?.nama ?? "Memuat…"}
        </span>{" "}
        · Total <span className="font-semibold text-moon-ink">{formatRupiah(order.total_harga)}</span>
      </p>

      <EstimasiBiayaCard order={order} estimasi={estimasi} detail={detail} namaProduk={namaProduk} />

      <ProduksiProgress order={order} produksi={produksi} />
      <TrackingTimeline order={order} tracking={tracking} />

      <OrderItemsCard detail={detail} namaProduk={namaProduk} />
    </main>
  );
}

export default function CustomerOrderDetailPage() {
  return (
    <RequireRole allow={["customer"]}>
      <DetailInner />
    </RequireRole>
  );
}
