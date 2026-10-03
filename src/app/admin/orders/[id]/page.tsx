"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { RequireRole } from "@/components/AuthGuard";
import { AlertCircle } from "lucide-react";
import {
  ProduksiProgress,
  TrackingTimeline,
} from "@/components/TrackingTimeline";
import {
  addTracking,
  createProduksi,
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
import { LABEL_TAHAP, TAHAP_PRODUKSI, formatRupiah } from "@/lib/estimasi";
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

const inputCls = "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2";
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
    setMsg(
      `${konteks}: ${err instanceof Error ? err.message : "Terjadi kesalahan."}`,
    );
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
    // setState hanya di dalam callback promise (pola yang sama dengan halaman lain).
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
      .catch(() => {
        setNotFound(true);
      });
  }, [id]);

  async function tambahProduksi(status: Produksi["status_produksi"]) {
    if (!id) return;
    setBusy(true);
    setMsg(null);
    try {
      await createProduksi({
        id_order: id,
        tahap_produksi: tahap,
        status_produksi: status,
        waktu_mulai: Timestamp.now(),
        waktu_selesai: status === "selesai" ? Timestamp.now() : null,
        keterangan,
      });
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

  // Data produksi yang tahapnya sudah tidak ada di TAHAP_PRODUKSI
  // (mis. "perakitan" yang sudah dihapus) — tidak tampil di progres.
  const tahapUsang = produksi.filter(
    (p) => !(TAHAP_PRODUKSI as readonly string[]).includes(p.tahap_produksi),
  );

  async function bersihkanTahapUsang() {
    if (busy || tahapUsang.length === 0) return;
    const namaTahap = [
      ...new Set(tahapUsang.map((p) => p.tahap_produksi)),
    ].join(", ");
    if (
      !confirm(
        `Hapus ${tahapUsang.length} data produksi dengan tahap usang (${namaTahap})? Tindakan ini tidak bisa dibatalkan.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await Promise.allSettled(
        tahapUsang.map((p) => deleteDocById(COLLECTIONS.produksi, p.id)),
      );
      await reload();
    } catch (err) {
      pesanError(err, "Gagal membersihkan tahap usang");
    } finally {
      setBusy(false);
    }
  }

  if (!order) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        {notFound ? (
          <>
            <p className="text-sm text-zinc-500">
              Order tidak ditemukan (mungkin sudah dihapus atau ID salah).
            </p>
            <div className="mt-4">
              <BackLink href="/admin">Dashboard admin</BackLink>
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-500">Memuat order…</p>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-6 py-10">
      <BackLink href="/admin">Dashboard admin</BackLink>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-moon-ink cursor-pointer">
          Kelola order <code>{order.id.slice(0, 8)}…</code>
        </h1>
        <Badge tone={orderTone(order.status_order)}>{order.status_order}</Badge>
        <DangerButton disabled={busy} onClick={() => setShowDeleteModal(true)}>
          Hapus order
        </DangerButton>
      </div>
      <p className="text-sm text-zinc-500">
        Pelanggan:{" "}
        <span className="font-medium text-moon-ink">
          {namaPelanggan[order.id_pelanggan] ?? "Memuat…"}
        </span>
      </p>
      {msg && <ErrorBox>{msg}</ErrorBox>}

      <Card>
        <h2 className="font-semibold text-moon-ink">Status order</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUS_ORDERS.map((s) => (
            <button
              key={s}
              disabled={busy || order.status_order === s}
              onClick={async () => {
                setBusy(true);
                setMsg(null);
                try {
                  await updateOrderStatus(order.id, s);
                  await addTracking({
                    id_order: order.id,
                    status: `Status order → ${s}`,
                    waktu: Timestamp.now(),
                    keterangan: "",
                  });
                  await reload();
                } catch (err) {
                  pesanError(err, "Gagal mengubah status");
                } finally {
                  setBusy(false);
                }
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-40 ${
                order.status_order === s
                  ? "border-moon-ink bg-moon-ink text-moon-yellow"
                  : "border-zinc-300 hover:border-moon-blue hover:text-moon-blue"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      <ProduksiProgress order={order} produksi={produksi} />

      <Card>
        <h2 className="font-semibold text-moon-ink">
          Desain custom customer ({detail.length} item)
        </h2>
        {detail.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Belum ada item.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {detail.map((d) => (
              <li
                key={d.id}
                className="rounded-xl border border-zinc-200 p-3 text-sm"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-moon-ink">
                    {namaProduk[d.id_produk] ?? `${d.id_produk.slice(0, 8)}…`} ×{" "}
                    {d.jumlah}
                  </span>
                  <span>{formatRupiah(d.subtotal)}</span>
                </div>
                {d.spesifikasi && (
                  <p className="mt-1 text-xs text-zinc-500">{d.spesifikasi}</p>
                )}
                {d.desain_url || d.catatan_desain ? (
                  <div className="mt-2">
                    <DesainCustomView
                      url={d.desain_url}
                      path={d.desain_path}
                      catatan={d.catatan_desain}
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-zinc-400">
                    Tanpa desain custom.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-moon-ink">Update tahap produksi</h2>
        {tahapUsang.length > 0 && (
          <div className="mt-3 rounded-xl border border-moon-pink/30 bg-moon-pink/5 p-3 text-sm">
            <p className="font-medium text-moon-ink">
              Ditemukan {tahapUsang.length} data tahap usang:{" "}
              {[...new Set(tahapUsang.map((p) => p.tahap_produksi))].join(", ")}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Tahap ini sudah dihapus dari alur produksi dan tidak tampil di
              progres.
            </p>
            <DangerButton
              disabled={busy}
              onClick={bersihkanTahapUsang}
              className="mt-2 !py-1.5 text-xs"
            >
              Bersihkan tahap usang
            </DangerButton>
          </div>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Tahap
            <select
              value={tahap}
              onChange={(e) => setTahap(e.target.value)}
              className={inputCls}
            >
              {TAHAP_PRODUKSI.map((t) => (
                <option key={t} value={t}>
                  {LABEL_TAHAP[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Keterangan
            <input
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="cth: bahan sudah dipotong semua"
              className={inputCls}
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <GhostButton
            disabled={busy}
            onClick={() => tambahProduksi("berjalan")}
          >
            Tandai berjalan
          </GhostButton>
          <PrimaryButton
            disabled={busy}
            onClick={() => tambahProduksi("selesai")}
            className="!py-1.5"
          >
            Tandai selesai
          </PrimaryButton>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-moon-ink">Tracking manual</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={statusTracking}
            onChange={(e) => setStatusTracking(e.target.value)}
            placeholder="cth: Paket diserahkan ke kurir"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
          <PrimaryButton
            disabled={busy || !statusTracking}
            onClick={tambahTracking}
            className="shrink-0 !py-1.5"
          >
            Kirim
          </PrimaryButton>
        </div>
      </Card>

      <TrackingTimeline order={order} tracking={tracking} />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !busy && setShowDeleteModal(false)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-moon-pink/10 sm:h-10 sm:w-10">
                <AlertCircle
                  className="h-6 w-6 text-moon-pink"
                  strokeWidth={2}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold leading-6 text-moon-ink">
                  Hapus Order?
                </h3>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-sm text-zinc-600">
                Apakah Anda yakin ingin menghapus order{" "}
                <strong className="text-moon-ink">
                  #{order.id.slice(0, 8)}
                </strong>{" "}
                beserta{" "}
                <strong className="text-moon-ink">{detail.length}</strong> item,{" "}
                <strong className="text-moon-ink">{produksi.length}</strong>{" "}
                data produksi,{" "}
                <strong className="text-moon-ink">{tracking.length}</strong>{" "}
                tracking, dan file desainnya?
              </p>
              <p className="mt-2 text-sm font-medium text-moon-pink">
                Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <GhostButton
                disabled={busy}
                onClick={() => setShowDeleteModal(false)}
                className="w-full sm:w-auto"
              >
                Batal
              </GhostButton>
              <DangerButton
                disabled={busy}
                onClick={executeHapusOrder}
                className="w-full sm:w-auto"
              >
                {busy ? "Menghapus..." : "Ya, Hapus Order"}
              </DangerButton>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AdminOrderDetailPage() {
  return (
    <RequireRole allow={["admin"]}>
      <AdminDetailInner />
    </RequireRole>
  );
}
