"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RequireRole } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/Shell";
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
import { formatRupiah, formatTanggal, hitungProgresProduksi, LABEL_TAHAP, TAHAP_PRODUKSI } from "@/lib/estimasi";
import type {
  DetailOrder,
  Order,
  PerkiraanHarga,
  Produksi,
  TrackingOrder,
} from "@/types/firestore";
import { BackLink, Badge, DangerButton, orderTone } from "@/components/ui";
import { DesainCustomView } from "@/components/ui";
import { useProdukMap } from "@/hooks/useLookup";
import { Check, AlertCircle, Clock, Package, FileText, Circle, CheckCircle, MinusCircle } from "lucide-react";

function DetailInner() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { profile } = useAuth();
  const [order, setOrder] = useState<WithDocId<Order> | null>(null);
  const [detail, setDetail] = useState<WithDocId<DetailOrder>[]>([]);
  const [produksi, setProduksi] = useState<WithDocId<Produksi>[]>([]);
  const [tracking, setTracking] = useState<WithDocId<TrackingOrder>[]>([]);
  const [estimasi, setEstimasi] = useState<WithDocId<PerkiraanHarga> | null>(null);
  const [denied, setDenied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const namaProduk = useProdukMap();

  useEffect(() => {
    if (!id) return;
    (async () => {
      const o = await getOrder(id);
      if (!o) return;
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
      if (o.id_estimasi) {
        getEstimasi(o.id_estimasi)
          .then((e) => {
            if (e && e.id_pelanggan === o.id_pelanggan) setEstimasi(e);
          })
          .catch(() => {});
      }
    })().catch(() => {});
  }, [id, profile?.id_pelanggan]);

  async function batalkan() {
    if (!order || order.status_order !== "menunggu" || cancelling) return;
    if (!confirm("Batalkan pesanan ini? Item, tracking, dan file desainnya ikut dihapus.")) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await Promise.allSettled([
        ...tracking.map((t) => deleteDocById(COLLECTIONS.tracking_order, t.id)),
        ...detail.map(async (d) => {
          await hapusFileStorage(d.desain_path).catch(() => {});
          await deleteDocById(COLLECTIONS.detail_order, d.id);
        }),
      ]);
      await deleteDocById(COLLECTIONS.orders, order.id);
      router.push("/customer/orders");
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Gagal membatalkan pesanan.");
    } finally {
      setCancelling(false);
    }
  }

  if (denied) {
    return (
      <DashboardShell role="customer" title="Detail Pesanan" contain="6xl">
        <div className="rounded-xl border border-magenta/30 bg-magenta/5 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-magenta mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium text-ink">Order ini bukan milik akunmu.</p>
              <p className="mt-1 text-sm text-zinc-600">Kamu tidak diizinkan mengakses detail pesanan ini.</p>
            </div>
          </div>
          <div className="mt-4">
            <BackLink href="/customer/orders">Kembali ke pesanan saya</BackLink>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!order) {
    return (
      <DashboardShell role="customer" title="Detail Pesanan" contain="6xl">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 animate-pulse">
              <Circle className="h-5 w-5 text-zinc-400" aria-hidden="true" />
            </div>
            <p className="text-sm text-zinc-500">Memuat detail pesanan…</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const progres = hitungProgresProduksi(produksi);
  let persen = progres.persen;
  const tahapTerakhir = progres.tahapTerakhir;
  const status = order.status_order;

  if (status === "selesai") persen = 100;

  const activeIdx = tahapTerakhir ? TAHAP_PRODUKSI.indexOf(tahapTerakhir as typeof TAHAP_PRODUKSI[number]) : -1;

  return (
    <DashboardShell role="customer" title="Detail Pesanan" contain="6xl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <BackLink href="/customer/orders">Semua pesanan</BackLink>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Order <code className="font-mono text-base bg-cream px-1.5 py-0.5 rounded">{order.id.slice(0, 8).toUpperCase()}</code>
          </h1>
          <Badge tone={orderTone(status)}>{status}</Badge>
          {status === "menunggu" && (
            <DangerButton disabled={cancelling} onClick={batalkan} className="ml-auto">
              {cancelling ? "Membatalkan…" : "Batalkan pesanan"}
            </DangerButton>
          )}
        </div>
      </div>

      {cancelError && (
        <div className="rounded-xl border border-magenta/30 bg-magenta/5 p-4" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-magenta mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium text-ink">Gagal membatalkan</p>
              <p className="mt-1 text-sm text-zinc-600">{cancelError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Order Meta */}
      <div className="rounded-xl border border-zinc-200 bg-cream/50 p-4 md:p-5">
        <dl className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-sm">
          <div>
            <dt className="text-zinc-500">Dipesan pada</dt>
            <dd className="mt-0.5 font-medium text-ink">{formatTanggal(order.tgl_order)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Estimasi selesai</dt>
            <dd className="mt-0.5 font-medium text-ink">{order.estimasi_selesai ? formatTanggal(order.estimasi_selesai) : "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Pelanggan</dt>
            <dd className="mt-0.5 font-medium text-ink">{profile?.nama ?? "—"}</dd>
          </div>
          <div className="text-right sm:text-left">
            <dt className="text-zinc-500">Total</dt>
            <dd className="mt-0.5 text-xl font-bold text-cyan font-mono">{formatRupiah(order.total_harga)}</dd>
          </div>
        </dl>
      </div>

      {/* Main Grid: Progress + Cost */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Production Progress */}
        <section aria-labelledby="progress-heading" className="space-y-5">
          <header>
            <h2 id="progress-heading" className="text-lg font-semibold text-ink flex items-center gap-2">
              <Package className="h-5 w-5 text-zinc-400" aria-hidden="true" />
              Progres produksi
            </h2>
          </header>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 md:p-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-ink">Kemajuan</span>
                <span className="text-2xl font-bold text-gold">{persen}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-ink/10">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    status === "dibatalkan" ? "bg-zinc-400" : "bg-gold"
                  }`}
                  style={{ width: `${persen}%` }}
                />
              </div>
            </div>

            {/* Production Stages */}
            <ol className="space-y-3" role="list" aria-label="Tahap produksi">
              {TAHAP_PRODUKSI.map((t, i) => {
                const rec = produksi.find((p) => p.tahap_produksi === t);
                const done = (i <= activeIdx && rec && rec.status_produksi === "selesai") || status === "selesai";
                const running = i === activeIdx && rec && rec.status_produksi === "berjalan" && status !== "dibatalkan";
                const isLast = i === TAHAP_PRODUKSI.length - 1;

                let statusText = "Belum dimulai";
                let statusIcon = <Circle className="h-4 w-4 text-zinc-300" aria-hidden="true" />;
                let iconClass = "text-zinc-300";

                if (done) {
                  statusText = rec ? `${rec.status_produksi} · ${rec.keterangan || "Selesai"}` : "Selesai";
                  statusIcon = <CheckCircle className="h-4 w-4 text-gold" aria-hidden="true" />;
                  iconClass = "text-gold";
                } else if (running) {
                  statusText = `${rec?.status_produksi || "Berjalan"} · ${rec?.keterangan || "Sedang diproses"}`;
                  statusIcon = <Circle className="h-4 w-4 text-gold animate-pulse" aria-hidden="true" />;
                  iconClass = "text-gold";
                } else if (rec) {
                  statusText = `${rec.status_produksi} · ${rec.keterangan || "-"}`;
                  statusIcon = <MinusCircle className="h-4 w-4 text-zinc-400" aria-hidden="true" />;
                  iconClass = "text-zinc-400";
                }

                return (
                  <li key={t} className="flex items-start gap-4 relative">
                    {/* Connector line */}
                    {!isLast && (
                      <div className="absolute left-5 top-10 h-full w-0.5 bg-zinc-200" aria-hidden="true" />
                    )}
                    <div className="relative flex shrink-0 items-center justify-center w-10 h-10 rounded-full bg-white border-2 transition-colors" style={{ borderColor: iconClass.replace("text-", "") }}>
                      {statusIcon}
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="font-medium text-ink">{LABEL_TAHAP[t]}</p>
                      <p className="mt-0.5 text-sm text-zinc-500">{statusText}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Cost Summary */}
        <section aria-labelledby="cost-heading" className="space-y-5">
          <header>
            <h2 id="cost-heading" className="text-lg font-semibold text-ink flex items-center gap-2">
              <FileText className="h-5 w-5 text-zinc-400" aria-hidden="true" />
              Ringkasan biaya
            </h2>
          </header>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 md:p-6">
            {estimasi ? (
              <>
                <div className="border-b border-zinc-100 pb-4 mb-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Estimasi awal</p>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-600 min-w-0 break-words">
                        {namaProduk?.[estimasi.id_produk] ?? `Produk #${estimasi.id_produk.slice(0, 8)}`} × {estimasi.jumlah}
                      </dt>
                      <dd className="font-medium text-ink whitespace-nowrap font-mono">{formatRupiah(estimasi.harga_satuan * estimasi.jumlah)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 text-zinc-600">
                      <dt>Biaya bahan</dt>
                      <dd className="font-medium text-ink">{formatRupiah(estimasi.biaya_bahan)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 text-zinc-600">
                      <dt>Biaya produksi</dt>
                      <dd className="font-medium text-ink">{formatRupiah(estimasi.biaya_produksi)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-zinc-200 pt-3">
                      <dt className="font-semibold text-ink">Total estimasi awal</dt>
                      <dd className="font-bold text-cyan font-mono">{formatRupiah(estimasi.total_estimasi)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="border-b border-zinc-100 pb-4 mb-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total order aktual</p>
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-ink">Total order</dt>
                    <dd className="text-xl font-bold text-ink font-mono">{formatRupiah(order.total_harga)}</dd>
                  </div>
                </div>

                {(() => {
                  const selisih = order.total_harga - estimasi.total_estimasi;
                  if (selisih === 0) return (
                    <p className="text-sm text-zinc-500 text-center py-2">Total sama persis dengan estimasi awal.</p>
                  );
                  return (
                    <p className={`text-sm font-medium text-center py-2 ${selisih > 0 ? "text-magenta" : "text-green-600"}`}>
                      {selisih > 0 ? "Naik " : "Hemat "} {formatRupiah(Math.abs(selisih))} dari estimasi awal.
                    </p>
                  );
                })()}
              </>
            ) : (
              <>
                <dl className="space-y-3 text-sm">
                  {detail.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500">Belum ada rincian biaya.</div>
                  ) : (
                    detail.map((d) => (
                      <div key={d.id} className="flex justify-between gap-4 py-2 border-b border-zinc-100 last:border-0">
                        <dt className="min-w-0 break-words text-zinc-600">
                          {namaProduk?.[d.id_produk] ?? `Produk #${d.id_produk.slice(0, 8)}`} × {d.jumlah}
                        </dt>
                        <dd className="font-medium text-ink whitespace-nowrap font-mono">{formatRupiah(d.subtotal)}</dd>
                      </div>
                    ))
                  )}
                </dl>
                <div className="mt-4 flex justify-between gap-4 border-t border-zinc-200 pt-3">
                  <dt className="font-semibold text-ink">Total order</dt>
                  <dd className="text-xl font-bold text-ink font-mono">{formatRupiah(order.total_harga)}</dd>
                </div>
                {!estimasi && detail.length > 0 && (
                  <p className="mt-2 text-sm text-zinc-500 text-center">Order dibuat langsung tanpa estimasi awal.</p>
                )}
              </>
            )}
            <p className="mt-4 text-xs text-zinc-500 text-center">
              Total final dikonfirmasi admin setelah cek desain & spesifikasi.
            </p>
          </div>
        </section>
      </div>

      {/* Tracking History */}
      <section aria-labelledby="tracking-heading" className="space-y-5">
        <header className="flex items-center justify-between">
          <h2 id="tracking-heading" className="text-lg font-semibold text-ink flex items-center gap-2">
            <Clock className="h-5 w-5 text-zinc-400" aria-hidden="true" />
            Riwayat tracking
          </h2>
          <Badge tone={orderTone(status)}>{status}</Badge>
        </header>

        <div className="rounded-xl border border-zinc-200 bg-white">
          {tracking.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="mx-auto mb-3 h-10 w-10 text-zinc-300" aria-hidden="true" />
              <p className="text-zinc-500">Belum ada update tracking.</p>
              <p className="mt-1 text-sm text-zinc-400">Admin akan menambah update tiap tahap produksi.</p>
            </div>
          ) : (
            <ol className="divide-y divide-zinc-100" role="list">
              {tracking.map((t, idx) => (
                <li key={t.id} className="relative py-5 px-5 sm:px-6 last:border-0">
                  <div className="flex gap-4">
                    <div className="relative flex shrink-0 items-start">
                      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-0.5 bg-zinc-200" aria-hidden="true" />
                      <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-3 transition-colors ${
                        idx === 0 ? "bg-gold border-gold" : "bg-white border-zinc-200"
                      }`}>
                        {idx === 0 && <Check className="h-4 w-4 text-ink" aria-hidden="true" />}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="font-medium text-ink">{t.status}</p>
                      <p className="mt-0.5 text-sm text-zinc-500 flex items-center gap-2">
                        <span className="font-mono">{t.waktu?.toDate?.().toLocaleString("id-ID") ?? "-"}</span>
                      </p>
                      {t.keterangan && (
                        <p className="mt-1 text-sm text-zinc-600">{t.keterangan}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Order Items */}
      <section aria-labelledby="items-heading" className="space-y-5">
        <header>
          <h2 id="items-heading" className="text-lg font-semibold text-ink flex items-center gap-2">
            <Package className="h-5 w-5 text-zinc-400" aria-hidden="true" />
            Item pesanan <span className="text-zinc-500 font-normal">({detail.length})</span>
          </h2>
        </header>

        <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
          {detail.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">Belum ada item.</div>
          ) : (
            detail.map((d) => (
              <article key={d.id} className="p-5 md:p-6 hover:bg-cream/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-ink">{namaProduk?.[d.id_produk] ?? `Produk #${d.id_produk.slice(0, 8)}`}</p>
                      <span className="text-sm font-medium text-ink bg-gold/20 px-2 py-0.5 rounded-full font-mono">
                        ×{d.jumlah} {d.jumlah === 1 ? "" : ""}
                      </span>
                    </div>
                    {d.spesifikasi && (
                      <p className="text-sm text-zinc-600 max-w-2xl">{d.spesifikasi}</p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="font-semibold text-ink font-mono">{formatRupiah(d.subtotal)}</span>
                    </div>
                  </div>
                </div>

                {(d.desain_url || d.catatan_desain) && (
                  <div className="mt-4 pt-4 border-t border-zinc-100">
                    <DesainCustomView url={d.desain_url} path={d.desain_path} catatan={d.catatan_desain} />
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </DashboardShell>
  );
}

export default function CustomerOrderDetailPage() {
  return (
    <RequireRole allow={["customer"]}>
      <DetailInner />
    </RequireRole>
  );
}