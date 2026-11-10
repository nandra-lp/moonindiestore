"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { RequireRole } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/Shell";
import { PaymentProofLink } from "@/components/payment/PaymentProofLink";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, ClipboardList, Factory, Palette, Send, Check, Circle, CheckCircle, MinusCircle, Clock, Package, FileText, MessageCircle, Phone, CreditCard } from "lucide-react";
import {
  addTracking,
  createProduksi,
  updateProduksi,
  deleteDocById,
  getPelanggan,
  getOrder,
  listDetailByOrder,
  listProduksiByOrder,
  listTrackingByOrder,
  updateOrderStatusWithTracking,
  verifyOrderPayment,
  type WithDocId,
} from "@/lib/db";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { hapusFileStorage } from "@/lib/storage";
import { deletePaymentProofForOrder } from "@/lib/payment-proof-client";
import { usePelangganMap, useProdukMap } from "@/hooks/useLookup";
import { LABEL_TAHAP, TAHAP_PRODUKSI, formatRupiah, formatTanggal, hitungProgresProduksi } from "@/lib/estimasi";
import type {
  DetailOrder,
  Order,
  Pelanggan,
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
  const { firebaseUser } = useAuth();
  const [order, setOrder] = useState<WithDocId<Order> | null>(null);
  const [customerContact, setCustomerContact] = useState<{
    orderId: string;
    customer: Pelanggan | null;
    failed: boolean;
  } | null>(null);
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
  const customerForOrder =
    customerContact?.orderId === order?.id ? customerContact : null;
  const customerPhone = customerForOrder?.customer?.no_hp.trim() ?? "";
  const whatsappNumber = customerPhone.replace(/\D/g, "");
  const normalizedWhatsappNumber = whatsappNumber.startsWith("0")
    ? `62${whatsappNumber.slice(1)}`
    : whatsappNumber.startsWith("8")
      ? `62${whatsappNumber}`
      : whatsappNumber;
  const paymentConfirmed =
    order?.order_siap !== false &&
    (order?.metode_pembayaran == null ||
      order.status_pembayaran === "terverifikasi");

  function pesanError(err: unknown, konteks: string) {
    const errorCode =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof err.code === "string"
        ? err.code
        : "";
    if (
      errorCode === "permission-denied" ||
      (err instanceof Error &&
        /missing or insufficient permissions/i.test(err.message))
    ) {
      setMsg(
        `${konteks}: Firestore menolak perubahan. Pastikan akun memiliki role admin dan firestore.rules terbaru sudah dipublikasikan.`,
      );
      return;
    }
    setMsg(`${konteks}: ${err instanceof Error ? err.message : "Terjadi kesalahan."}`);
  }

  async function periksaKesiapanOrder() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const latestOrder = await reload();
      if (latestOrder?.order_siap === false) {
        setMsg(
          "Detail pesanan belum selesai disimpan oleh customer. Minta customer menyelesaikan atau mengirim ulang pesanan sebelum mengonfirmasi.",
        );
      }
    } catch (err) {
      pesanError(err, "Gagal memuat ulang pesanan");
    } finally {
      setBusy(false);
    }
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
    return o;
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

  useEffect(() => {
    if (!order?.id_pelanggan) return;
    getPelanggan(order.id_pelanggan)
      .then((customer) =>
        setCustomerContact({ orderId: order.id, customer, failed: false }),
      )
      .catch(() =>
        setCustomerContact({ orderId: order.id, customer: null, failed: true }),
      );
  }, [order?.id, order?.id_pelanggan]);

  async function tambahProduksi(status: Produksi["status_produksi"]) {
    if (!id) return;
    if (!paymentConfirmed) {
      setMsg("Konfirmasi pembayaran sebelum memulai produksi.");
      return;
    }
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
    if (!paymentConfirmed) {
      setMsg("Konfirmasi pembayaran sebelum menambahkan tracking.");
      return;
    }
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

  async function konfirmasiPembayaran() {
    if (!order || order.status_pembayaran !== "bukti_dikirim" || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await verifyOrderPayment(order.id);
      await reload();
    } catch (err) {
      pesanError(err, "Gagal mengonfirmasi pembayaran");
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
        deletePaymentProofForOrder(
          order.id,
          order.bukti_pembayaran_url,
          order.bukti_pembayaran_path,
          firebaseUser
        ),
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

  const statusPembayaran = order.status_pembayaran ?? "menunggu";
  let alurJudul = "";
  let alurDesc = "";
  if (status === "dibatalkan") {
    alurJudul = "Pesanan dibatalkan";
    alurDesc = "Tidak ada tindakan lanjutan. Pesanan tidak akan diproses.";
  } else if (status === "selesai") {
    alurJudul = "Pesanan selesai";
    alurDesc = "Seluruh proses pesanan sudah tuntas.";
  } else if (statusPembayaran === "bukti_dikirim") {
    alurJudul = "Verifikasi pembayaran";
    alurDesc = "Periksa bukti pembayaran customer, lalu klik Konfirmasi pembayaran. Produksi masih terkunci sampai pembayaran terverifikasi.";
  } else if (statusPembayaran === "terverifikasi") {
    if (status === "produksi") {
      alurJudul = "Produksi berjalan";
      alurDesc = "Pembayaran sudah valid. Perbarui tahap produksi dan tracking pengiriman.";
    } else {
      alurJudul = "Pembayaran valid — siap diproses";
      alurDesc = "Pembayaran sudah terverifikasi. Set status ke produksi, lalu mulai tahap produksi.";
    }
  } else if (status === "menunggu") {
    alurJudul = "Tinjau pesanan";
    alurDesc = "Cek detail & desain. Set status ke diproses agar customer dapat melakukan pembayaran.";
  } else if (status === "diproses") {
    alurJudul = "Menunggu pembayaran customer";
    alurDesc = "Customer sudah dapat membayar. Tunggu bukti pembayaran sebelum memproses produksi.";
  } else if (status === "produksi") {
    alurJudul = "Produksi berjalan";
    alurDesc = "Perbarui tahap produksi dan tracking pengiriman.";
  }

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

      {order.order_siap === false && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between" role="status">
          <p>
            Pesanan sedang disiapkan customer. Konfirmasi akan aktif setelah detail produk dan pesanan selesai disimpan.
          </p>
          <button
            type="button"
            onClick={periksaKesiapanOrder}
            disabled={busy}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-amber-700/30 bg-white px-3 py-2 font-semibold text-amber-900 transition hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Memeriksa…" : "Periksa kembali"}
          </button>
        </div>
      )}

      {alurJudul && (
        <div
          className={`rounded-xl border p-4 ${
            statusPembayaran === "terverifikasi"
              ? "border-green-600/30 bg-green-50"
              : statusPembayaran === "bukti_dikirim"
                ? "border-moon-blue/30 bg-moon-blue/5"
                : "border-moon-yellow/40 bg-moon-yellow/10"
          }`}
          role="status"
        >
          <p className="text-sm font-semibold text-moon-ink">{alurJudul}</p>
          <p className="mt-1 text-sm text-zinc-600">{alurDesc}</p>
        </div>
      )}

      {/* Order Meta Bar */}
      <div className="rounded-xl border border-zinc-200 bg-cream/50 p-4 md:p-5">
        <dl className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 text-sm">
          <div>
            <dt className="text-zinc-500">Pelanggan</dt>
            <dd className="mt-0.5 font-medium text-ink">{namaPelanggan[order.id_pelanggan] ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">No. HP customer</dt>
            {customerPhone ? (
              <dd className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <a
                  href={`tel:${customerPhone}`}
                  className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-cyan"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  {customerPhone}
                </a>
                {normalizedWhatsappNumber.length >= 10 && (
                  <a
                    href={`https://wa.me/${normalizedWhatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    WhatsApp
                  </a>
                )}
              </dd>
            ) : (
              <dd className="mt-0.5 text-zinc-500">
                {customerForOrder?.failed
                  ? "Gagal memuat nomor"
                  : customerForOrder?.customer
                    ? "Belum diisi"
                    : "Memuat…"}
              </dd>
            )}
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

      {(order.metode_pembayaran === "bca" || order.metode_pembayaran === "qris") && (
        <section aria-labelledby="payment-heading" className="rounded-xl border border-zinc-200 bg-white p-5 md:p-6">
          <h2 id="payment-heading" className="flex items-center gap-2 text-lg font-semibold text-ink">
            <CreditCard className="h-5 w-5 text-zinc-400" aria-hidden="true" />
            Pembayaran {order.metode_pembayaran === "qris" ? "QRIS" : "BCA"}
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Status: <strong className="text-ink">{order.status_pembayaran ?? "menunggu"}</strong>
          </p>
          {order.bukti_pembayaran_url === "supabase:private" ? (
            <PaymentProofLink
              orderId={order.id}
              proofUrl={order.bukti_pembayaran_url}
              className="mt-3 inline-flex font-medium text-cyan underline underline-offset-2"
            >
              Lihat bukti pembayaran
            </PaymentProofLink>
          ) : order.bukti_pembayaran_url ? (
            <a
              href={order.bukti_pembayaran_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex font-medium text-cyan underline underline-offset-2"
            >
              Lihat bukti pembayaran
            </a>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">Customer belum mengirim bukti pembayaran.</p>
          )}
          {order.status_pembayaran === "bukti_dikirim" && (
            <div className="mt-4">
              <PrimaryButton disabled={busy} onClick={konfirmasiPembayaran}>
                {busy ? "Memproses…" : "Konfirmasi pembayaran"}
              </PrimaryButton>
            </div>
          )}
          {order.status_pembayaran === "terverifikasi" && (
            <p className="mt-3 text-sm font-medium text-green-700">
              Pembayaran terverifikasi. Produksi dan pengiriman dapat dilanjutkan.
            </p>
          )}
        </section>
      )}

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
              <GhostButton disabled={busy || !paymentConfirmed} onClick={() => tambahProduksi("berjalan")}>Tandai berjalan</GhostButton>
              <PrimaryButton disabled={busy || !paymentConfirmed} onClick={() => tambahProduksi("selesai")}>Tandai selesai</PrimaryButton>
            </div>
            {!paymentConfirmed && (
              <p className="mb-5 text-sm text-zinc-500">
                Produksi dan tracking dikunci sampai admin mengonfirmasi pembayaran customer.
              </p>
            )}

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
                disabled={!paymentConfirmed}
              />
              <PrimaryButton disabled={busy || !paymentConfirmed || !statusTracking} onClick={tambahTracking} className="shrink-0">Kirim</PrimaryButton>
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
                  type="button"
                  disabled={
                    busy ||
                    order.order_siap === false ||
                    order.status_order === s ||
                    (!paymentConfirmed && !["menunggu", "diproses", "dibatalkan"].includes(s))
                  }
                  aria-label={
                    s === "diproses" && status === "menunggu"
                      ? "Konfirmasi pesanan dan aktifkan pembayaran"
                      : `Ubah status pesanan menjadi ${s}`
                  }
                  onClick={async () => {
                    setBusy(true);
                    setMsg(null);
                    try {
                      await updateOrderStatusWithTracking(order.id, s, {
                        status: `Status order → ${s}`,
                        keterangan: "",
                      });
                      await reload();
                    } catch (err) { pesanError(err, "Gagal mengubah status"); }
                    finally { setBusy(false); }
                  }}
                  className={`rounded-xl border-2 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan disabled:cursor-not-allowed disabled:opacity-40 ${
                    s === "diproses" && status === "menunggu"
                      ? "flex min-h-16 w-full basis-full items-center justify-center gap-3 border-moon-yellow bg-moon-yellow px-5 py-4 text-base text-moon-ink shadow-sm hover:bg-moon-yellow/80 hover:shadow-md"
                      : `rounded-full border px-3 py-2 text-sm ${
                          order.status_order === s
                            ? "border-ink bg-ink text-gold"
                            : "border-zinc-300 hover:border-cyan hover:text-cyan"
                        }`
                  }`}>
                  {s === "diproses" && status === "menunggu" ? (
                    <>
                      <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className="text-left">
                        <span className="block">Konfirmasi pesanan</span>
                        <span className="mt-0.5 block text-xs font-medium text-moon-ink/75">
                          Setujui pesanan dan aktifkan pembayaran customer
                        </span>
                      </span>
                    </>
                  ) : (
                    s
                  )}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Alur: tinjau pesanan → set <strong className="text-ink">diproses</strong> agar customer
              membayar → verifikasi pembayaran → status <strong className="text-ink">produksi</strong>{" "}
              baru aktif setelah pembayaran terverifikasi.
            </p>
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