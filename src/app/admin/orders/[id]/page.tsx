"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { RequireRole } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/Shell";
import { AlertCircle, ClipboardList, Factory, Palette, Send, Check, Circle, CheckCircle, MinusCircle, Clock, Package, FileText } from "lucide-react";
import {
  addTracking,
  createProduksi,
  updateProduksi,
  deleteDocById,
  getOrder,
  listDetailByOrder,
  listProduksiByOrder,
  listTrackingByOrder,
  updateOrderStatus,
  type WithDocId,
} from "@/lib/db";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { hapusFileStorage } from "@/lib/storage";
import { usePelangganMap, useProdukMap } from "@/hooks/useLookup";
import { LABEL_TAHAP, TAHAP_PRODUKSI, formatRupiah, formatTanggal, hitungProgresProduksi } from "@/lib/estimasi";
import type {
  DetailOrder,
  Order,
  Produksi,
  TrackingOrder,
} from "@/types/firestore";
import {
  BackLink,
  Badge,
  Card,
  DangerButton,
  DesainCustomView,
  ErrorBox,
  GhostButton,
  PrimaryButton,
  orderTone,
} from "@/components/ui";

const inputCls = "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 bg-white transition focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20";
const labelCls = "block text-sm font-medium text-ink mb-1";
const STATUS_ORDERS = [
  "menunggu",
  "diproses",
  "produksi",
  "selesai",
  "dibatalkan",
] as const;

function AdminDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [order, setOrder] = useState<WithDocId<Order> | null>(null);
  const [detail, setDetail] = useState<WithDocId<DetailOrder>[]>([]);
  const [produksi, setProduksi] = useState<WithDocId<Produksi>[]>([]);
  const [tracking, setTracking] = useState<WithDocId<TrackingOrder>[]>([]);
  const [tahap, setTahap] = useState<string>(TAHAP_PRODUKSI[0]);
  const [keterangan, setKeterangan] = useState("");
  const [statusTracking, setStatusTracking] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const namaPelanggan = usePelangganMap();
  const namaProduk = useProdukMap();

  function pesanError(err: unknown, konteks: string) {
    setMsg(`${konteks}: ${err instanceof Error ? err.message : "Terjadi kesalahan."}`);
  }

  const reload = useCallback(async () => {
    if (!id) return;
    const [o, d, p, t] = await Promise.all([
      getOrder(id),
      listDetailByOrder(id),
      listProduksiByOrder(id),
      listTrackingByOrder(id),
    ]);
    setOrder(o);
    setDetail(d);
    setProduksi(p);
    setTracking(t);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getOrder(id),
      listDetailByOrder(id),
      listProduksiByOrder(id),
      listTrackingByOrder(id),
    ])
      .then(([o, d, p, t]) => {
        if (!o) {
          setNotFound(true);
          return;
        }
        setOrder(o);
        setDetail(d);
        setProduksi(p);
        setTracking(t);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  async function tambahProduksi(status: Produksi["status_produksi"]) {
    if (!id) return;
    setBusy(true);
    setMsg(null);
    try {
      let produksiId: string | null = null;
      if (status === "selesai") {
        const existingBerjalan = produksi.find(
          (p) => p.tahap_produksi === tahap && p.status_produksi === "berjalan"
        );
        if (existingBerjalan) {
          produksiId = existingBerjalan.id;
          await updateProduksi(produksiId, {
            status_produksi: "selesai",
            waktu_selesai: Timestamp.now(),
            keterangan,
          });
        }
      }

      if (!produksiId) {
        produksiId = await createProduksi({
          id_order: id,
          tahap_produksi: tahap,
          status_produksi: status,
          waktu_mulai: Timestamp.now(),
          waktu_selesai: status === "selesai" ? Timestamp.now() : null,
          keterangan,
        });
      }

      await addTracking({
        id_order: id,
        status: `Produksi: ${LABEL_TAHAP[tahap as keyof typeof LABEL_TAHAP] ?? tahap} (${status})`,
        waktu: Timestamp.now(),
        keterangan,
      });
      setKeterangan("");
      await reload();
    } catch (err) {
      pesanError(err, "Gagal menambah tahap produksi");
    } finally {
      setBusy(false);
    }
  }

  async function tambahTracking() {
    if (!id || !statusTracking) return;
    setBusy(true);
    setMsg(null);
    try {
      await addTracking({
        id_order: id,
        status: statusTracking,
        waktu: Timestamp.now(),
        keterangan,
      });
      setStatusTracking("");
      setKeterangan("");
      await reload();
    } catch (err) {
      pesanError(err, "Gagal menambah tracking");
    } finally {
      setBusy(false);
    }
  }

  async function executeHapusOrder() {
    if (!order || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await Promise.allSettled([
        ...tracking.map((t) => deleteDocById(COLLECTIONS.tracking_order, t.id)),
        ...produksi.map((p) => deleteDocById(COLLECTIONS.produksi, p.id)),
        ...detail.map(async (d) => {
          await hapusFileStorage(d.desain_path).catch(() => {});
          await deleteDocById(COLLECTIONS.detail_order, d.id);
        }),
      ]);
      await deleteDocById(COLLECTIONS.orders, order.id);
      router.push("/admin");
    } catch (err) {
      pesanError(err, "Gagal menghapus order");
      setBusy(false);
      setShowDeleteModal(false);
    }
  }

  const tahapUsang = produksi.filter(
    (p) => !(TAHAP_PRODUKSI as readonly string[]).includes(p.tahap_produksi),
  );

  async function bersihkanTahapUsang() {
    if (busy || tahapUsang.length === 0) return;
    const namaTahap = [...new Set(tahapUsang.map((p) => p.tahap_produksi))].join(", ");
    if (!confirm(`Hapus ${tahapUsang.length} data produksi dengan tahap usang (${namaTahap})? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusy(true);
    setMsg(null);
    try {
      await Promise.allSettled(tahapUsang.map((p) => deleteDocById(COLLECTIONS.produksi, p.id)));
      await reload();
    } catch (err) {
      pesanError(err, "Gagal membersihkan tahap usang");
    } finally {
      setBusy(false);
    }
  }

  if (!order) {
    return (
      <DashboardShell role="admin" title="Kelola Order" contain="6xl">
        {notFound ? (
          <Card className="text-center py-12">
            <p className="text-sm text-zinc-500">Order tidak ditemukan (mungkin sudah dihapus atau ID salah).</p>
            <div className="mt-4 flex justify-center"><BackLink href="/admin">Dashboard admin</BackLink></div>
          </Card>
        ) : (
          <div role="status" aria-label="Memuat order" className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 animate-pulse">
                <Circle className="h-5 w-5 text-zinc-400" aria-hidden="true" />
              </div>
              <p className="text-sm text-zinc-500">Memuat detail pesanan…</p>
            </div>
          </div>
        )}
      </DashboardShell>
    );
  }

  // Progress calculation
  const progres = hitungProgresProduksi(produksi);
  let persen = progres.persen;
  const tahapTerakhir = progres.tahapTerakhir;
  const status = order.status_order;
  if (status === "selesai") persen = 100;
  const activeIdx = tahapTerakhir ? TAHAP_PRODUKSI.indexOf(tahapTerakhir as typeof TAHAP_PRODUKSI[number]) : -1;

  return (
    <DashboardShell role="admin" title="Kelola Order" contain="6xl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <BackLink href="/admin">Dashboard admin</BackLink>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Kelola order <code className="font-mono text-base bg-cream px-1.5 py-0.5 rounded">{order.id.slice(0, 8).toUpperCase()}</code>
          </h1>
          <Badge tone={orderTone(status)}>{status}</Badge>
          <span className="ml-auto">
            <DangerButton disabled={busy} onClick={() => setShowDeleteModal(true)}>Hapus order</DangerButton>
          </span>
        </div>
      </div>

      {msg && <ErrorBox>{msg}</ErrorBox>}

      {/* Order Meta Bar */}
      <div className="rounded-xl border border-zinc-200 bg-cream/50 p-4 md:p-5">
        <dl className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-sm">
          <div>
            <dt className="text-zinc-500">Pelanggan</dt>
            <dd className="mt-0.5 font-medium text-ink">{namaPelanggan[order.id_pelanggan] ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Tanggal order</dt>
            <dd className="mt-0.5 font-medium text-ink">{formatTanggal(order.tgl_order)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Estimasi selesai</dt>
            <dd className="mt-0.5 font-medium text-ink">{order.estimasi_selesai ? formatTanggal(order.estimasi_selesai) : "—"}</dd>
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
                  className={`h-full rounded-full transition-all duration-700 ease-out ${status === "dibatalkan" ? "bg-zinc-400" : "bg-gold"}`}
                  style={{ width: `${persen}%` }}
                />
              </div>
            </div>

            {/* Production Stages Visual Timeline */}
            <ol className="space-y-3" role="list" aria-label="Tahap produksi">
              {TAHAP_PRODUKSI.map((t, i) => {
                const rec = produksi.find((p) => p.tahap_produksi === t);
                const done = (i <= activeIdx && rec && rec.status_produksi === "selesai") || status === "selesai";
                const running = i === activeIdx && rec && rec.status_produksi === "berjalan" && status !== "dibatalkan";
                const isLast = i === TAHAP_PRODUKSI.length - 1;

                let statusText = "Belum dimulai";
                let statusIcon = <Circle className="h-4 w-4 text-zinc-300" aria-hidden="true" />;
                let borderColor = "border-zinc-300";

                if (done) {
                  statusText = rec ? `${rec.status_produksi} · ${rec.keterangan || "Selesai"}` : "Selesai";
                  statusIcon = <CheckCircle className="h-4 w-4 text-gold" aria-hidden="true" />;
                  borderColor = "border-gold";
                } else if (running) {
                  statusText = `${rec?.status_produksi || "Berjalan"} · ${rec?.keterangan || "Sedang diproses"}`;
                  statusIcon = <Circle className="h-4 w-4 text-gold animate-pulse" aria-hidden="true" />;
                  borderColor = "border-gold";
                } else if (rec) {
                  statusText = `${rec.status_produksi} · ${rec.keterangan || "-"}`;
                  statusIcon = <MinusCircle className="h-4 w-4 text-zinc-400" aria-hidden="true" />;
                  borderColor = "border-zinc-400";
                }

                return (
                  <li key={t} className="flex items-start gap-4 relative">
                    {!isLast && <div className="absolute left-5 top-10 h-full w-0.5 bg-zinc-200" aria-hidden="true" />}
                    <div className={`relative flex shrink-0 items-center justify-center w-10 h-10 rounded-full bg-white border-2 transition-colors ${borderColor}`}>
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
            <dl className="space-y-3 text-sm">
              <div className="border-b border-zinc-100 pb-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Estimasi awal</p>
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-zinc-600">Subtotal produk</dt>
                  <dd className="font-medium text-ink font-mono">{detail.reduce((sum, d) => sum + d.subtotal, 0) > 0 ? formatRupiah(detail.reduce((sum, d) => sum + d.subtotal, 0)) : "—"}</dd>
                </div>
              </div>

              {(() => {
                const totalDetail = detail.reduce((sum, d) => sum + d.subtotal, 0);
                if (totalDetail > 0) {
                  return (
                    <div className="flex justify-between gap-4 py-2 border-t border-zinc-200 pt-2">
                      <dt className="font-semibold text-ink">Total order</dt>
                      <dd className="text-xl font-bold text-ink font-mono">{formatRupiah(order.total_harga)}</dd>
                    </div>
                  );
                }
                return null;
              })()}
            </dl>

            <p className="mt-4 text-xs text-zinc-500 text-center">
              Total final dikonfirmasi admin setelah cek desain & spesifikasi.
            </p>
          </div>
        </section>
      </div>

      {/* Kelola Progres + Status Order */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Kelola Progres */}
        <section aria-labelledby="manage-heading" className="space-y-5">
          <header className="flex items-center justify-between">
            <h2 id="manage-heading" className="text-lg font-semibold text-ink flex items-center gap-2">
              <Factory className="h-5 w-5 text-zinc-400" aria-hidden="true" />
              Kelola progres
            </h2>
            <Badge tone={orderTone(status)}>{status}</Badge>
          </header>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 md:p-6">
            {/* Tahap Usang Warning */}
            {tahapUsang.length > 0 && (
              <div className="mb-5 rounded-xl border border-magenta/30 bg-magenta/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-magenta mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-ink">Ditemukan {tahapUsang.length} data tahap usang</p>
                    <p className="mt-0.5 text-sm text-zinc-600">{[...new Set(tahapUsang.map((p) => p.tahap_produksi))].join(", ")}</p>
                    <p className="mt-1 text-xs text-zinc-500">Tahap ini sudah dihapus dari alur produksi dan tidak tampil di progres.</p>
                    <DangerButton disabled={busy} onClick={bersihkanTahapUsang} className="mt-3 text-xs">Bersihkan tahap usang</DangerButton>
                  </div>
                </div>
              </div>
            )}

            {/* Update Tahap Produksi */}
            <h3 className="text-sm font-semibold text-ink mb-4">Update tahap produksi</h3>
            <div className="grid gap-4 sm:grid-cols-2 mb-5">
              <label className={labelCls}>
                Tahap
                <select value={tahap} onChange={(e) => setTahap(e.target.value)} className={inputCls}>
                  {TAHAP_PRODUKSI.map((t) => <option key={t} value={t}>{LABEL_TAHAP[t]}</option>)}
                </select>
              </label>
              <label className={labelCls}>
                Keterangan
                <input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="cth: bahan sudah dipotong semua" className={inputCls} />
              </label>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              <GhostButton disabled={busy} onClick={() => tambahProduksi("berjalan")}>Tandai berjalan</GhostButton>
              <PrimaryButton disabled={busy} onClick={() => tambahProduksi("selesai")}>Tandai selesai</PrimaryButton>
            </div>

            <div className="my-4 border-t border-zinc-100" aria-hidden="true" />

            {/* Tracking Manual */}
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink mb-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              Tracking manual
            </h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={statusTracking}
                onChange={(e) => setStatusTracking(e.target.value)}
                placeholder="cth: Paket diserahkan ke kurir"
                aria-label="Status tracking manual"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm bg-white transition focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
              />
              <PrimaryButton disabled={busy || !statusTracking} onClick={tambahTracking} className="shrink-0">Kirim</PrimaryButton>
            </div>
          </div>
        </section>

        {/* Status Order + Ringkasan */}
        <section aria-labelledby="status-heading" className="space-y-5">
          <header>
            <h2 id="status-heading" className="text-lg font-semibold text-ink flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-zinc-400" aria-hidden="true" />
              Status order
            </h2>
          </header>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 md:p-6">
            <div className="flex flex-wrap gap-2">
              {STATUS_ORDERS.map((s) => (
                <button
                  key={s}
                  disabled={busy || order.status_order === s}
                  onClick={async () => {
                    setBusy(true);
                    setMsg(null);
                    try {
                      await updateOrderStatus(order.id, s);
                      await addTracking({ id_order: order.id, status: `Status order → ${s}`, waktu: Timestamp.now(), keterangan: "" });
                      await reload();
                    } catch (err) { pesanError(err, "Gagal mengubah status"); }
                    finally { setBusy(false); }
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan disabled:cursor-not-allowed disabled:opacity-40 ${
                    order.status_order === s ? "border-ink bg-ink text-gold" : "border-zinc-300 hover:border-cyan hover:text-cyan"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Tracking History */}
      <section aria-labelledby="tracking-heading" className="space-y-5">
        <header>
          <h2 id="tracking-heading" className="text-lg font-semibold text-ink flex items-center gap-2">
            <Clock className="h-5 w-5 text-zinc-400" aria-hidden="true" />
            Riwayat tracking
          </h2>
        </header>

        <div className="rounded-xl border border-zinc-200 bg-white">
          {tracking.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="mx-auto mb-3 h-10 w-10 text-zinc-300" aria-hidden="true" />
              <p className="text-zinc-500">Belum ada update tracking.</p>
              <p className="mt-1 text-sm text-zinc-400">Tambah tracking manual atau update tahap produksi untuk membuat entri otomatis.</p>
            </div>
          ) : (
            <ol className="divide-y divide-zinc-100" role="list">
              {tracking.map((t, idx) => (
                <li key={t.id} className="relative py-5 px-5 sm:px-6 last:border-0">
                  <div className="flex gap-4">
                    <div className="relative flex shrink-0 items-start">
                      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-0.5 bg-zinc-200" aria-hidden="true" />
                      <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-3 transition-colors ${idx === 0 ? "bg-gold border-gold" : "bg-white border-zinc-200"}`}>
                        {idx === 0 && <Check className="h-4 w-4 text-ink" aria-hidden="true" />}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="font-medium text-ink">{t.status}</p>
                      <p className="mt-0.5 text-sm text-zinc-500 flex items-center gap-2">
                        <span className="font-mono">{t.waktu?.toDate?.().toLocaleString("id-ID") ?? "-"}</span>
                      </p>
                      {t.keterangan && <p className="mt-1 text-sm text-zinc-600">{t.keterangan}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Custom Designs */}
      <section aria-labelledby="design-heading" className="space-y-5">
        <header>
          <h2 id="design-heading" className="text-lg font-semibold text-ink flex items-center gap-2">
            <Palette className="h-5 w-5 text-zinc-400" aria-hidden="true" />
            Desain custom customer <span className="text-zinc-500 font-normal">({detail.length} item)</span>
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
                      <span className="text-sm font-medium text-ink bg-gold/20 px-2 py-0.5 rounded-full font-mono">×{d.jumlah}</span>
                    </div>
                    {d.spesifikasi && <p className="text-sm text-zinc-600 max-w-2xl">{d.spesifikasi}</p>}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !busy && setShowDeleteModal(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-magenta/10">
                <AlertCircle className="h-6 w-6 text-magenta" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-lg font-semibold leading-6 text-ink">Hapus Order?</h3>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-zinc-600">
                Yakin hapus order <strong className="text-ink">#{order.id.slice(0, 8)}</strong> beserta
                <strong className="text-ink">{detail.length}</strong> item,
                <strong className="text-ink">{produksi.length}</strong> data produksi,
                <strong className="text-ink">{tracking.length}</strong> tracking, dan file desainnya?
              </p>
              <p className="mt-2 text-sm font-medium text-magenta">Tindakan ini tidak bisa dibatalkan.</p>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <GhostButton disabled={busy} onClick={() => setShowDeleteModal(false)} className="w-full sm:w-auto">Batal</GhostButton>
              <DangerButton disabled={busy} onClick={executeHapusOrder} className="w-full sm:w-auto">{busy ? "Menghapus..." : "Ya, Hapus Order"}</DangerButton>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function AdminOrderDetailPage() {
  return (
    <RequireRole allow={["admin"]}>
      <AdminDetailInner />
    </RequireRole>
  );
}