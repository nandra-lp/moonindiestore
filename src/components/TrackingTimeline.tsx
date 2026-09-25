"use client";

import type { WithDocId } from "@/lib/db";
import {
  LABEL_TAHAP,
  TAHAP_PRODUKSI,
  formatRupiah,
  hitungProgresProduksi,
  type TahapProduksi,
} from "@/lib/estimasi";
import type { Order, Produksi, TrackingOrder } from "@/types/firestore";
import { Badge, Card, orderTone } from "@/components/ui";

function fmtTime(ts: { toDate?: () => Date } | null | undefined): string {
  try {
    if (!ts || typeof ts.toDate !== "function") return "-";
    return ts.toDate().toLocaleString("id-ID");
  } catch {
    return "-";
  }
}

export function ProduksiProgress({
  produksi,
  order,
}: {
  produksi: WithDocId<Produksi>[];
  order?: WithDocId<Order>;
}) {
  let { persen, tahapTerakhir } = hitungProgresProduksi(produksi);
  const status = order?.status_order;
  
  if (status === "selesai") {
    persen = 100;
  } else if (status === "dibatalkan") {
    // Biarkan persen apa adanya (sejauh mana progres sebelum batal)
  }

  const activeIdx = tahapTerakhir
    ? TAHAP_PRODUKSI.indexOf(tahapTerakhir as TahapProduksi)
    : -1;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-moon-ink">Progres produksi</h2>
          {persen < 100 && status !== "dibatalkan" && (
            <span className="flex h-2 w-2 rounded-full bg-moon-blue animate-pulse" />
          )}
        </div>
        <span className="text-2xl font-bold text-moon-blue">{persen}%</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-moon-ink/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            status === "dibatalkan"
              ? "bg-zinc-400"
              : "bg-gradient-to-r from-moon-blue to-moon-blue/70"
          }`}
          style={{ width: `${persen}%` }}
        />
      </div>
      <ol className="mt-5 space-y-2.5">
        {TAHAP_PRODUKSI.map((t, i) => {
          const rec = produksi.find((p) => p.tahap_produksi === t);
          const done =
            (i <= activeIdx && rec && rec.status_produksi === "selesai") ||
            status === "selesai";
          const running =
            i === activeIdx && rec && rec.status_produksi === "berjalan" && status !== "dibatalkan";
          
          let textStatus = "belum dimulai";
          if (rec) {
            textStatus = `${rec.status_produksi} · ${rec.keterangan || "-"}`;
          } else if (status === "selesai") {
            textStatus = "selesai (dilompati)";
          } else if (status === "dibatalkan") {
            textStatus = "dibatalkan";
          }

          return (
            <li key={t} className="flex items-start gap-3 text-sm">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ${
                  done
                    ? "bg-moon-blue text-white shadow-md shadow-moon-blue/30"
                    : running
                      ? "bg-moon-yellow text-moon-ink shadow-md shadow-moon-yellow/30 animate-pulse"
                      : "bg-zinc-200 text-zinc-500"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-moon-ink">{LABEL_TAHAP[t]}</p>
                <p className="text-xs text-zinc-500">{textStatus}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

export function TrackingTimeline({
  order,
  tracking,
}: {
  order: WithDocId<Order>;
  tracking: WithDocId<TrackingOrder>[];
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-moon-ink">Riwayat tracking</h2>
        <Badge tone={orderTone(order.status_order)}>{order.status_order}</Badge>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        Order <code>{order.id.slice(0, 8)}…</code> · total{" "}
        {formatRupiah(order.total_harga)}
      </p>
      {tracking.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          Belum ada update tracking. Admin akan menambahkan update tiap tahap
          produksi.
        </p>
      ) : (
        <ol className="mt-4 space-y-0 border-l-2 border-moon-pink/40 pl-0">
          {tracking.map((t) => (
            <li key={t.id} className="relative pb-5 pl-5">
              <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-moon-pink" />
              <p className="text-sm font-medium text-moon-ink">{t.status}</p>
              <p className="text-xs text-zinc-500">{fmtTime(t.waktu)}</p>
              {t.keterangan && (
                <p className="mt-1 text-sm text-zinc-600">{t.keterangan}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
