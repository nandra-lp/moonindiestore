"use client";

import { formatRupiah } from "@/lib/estimasi";
import type { WithDocId } from "@/lib/db";
import type {
  DetailOrder,
  Order,
  PerkiraanHarga,
} from "@/types/firestore";
import { Card, DesainCustomView } from "@/components/ui";

// Kartu rincian biaya order. Bila order dibuat dari estimasi, tampilkan
// perbandingan estimasi awal vs total aktual; bila dibuat langsung,
// tampilkan rincian dari item pesanan.
// `namaProduk` opsional: bila belum termuat, tampil potongan ID seperti dulu.
export function EstimasiBiayaCard({
  order,
  estimasi,
  detail,
  namaProduk,
}: {
  order: WithDocId<Order>;
  estimasi: WithDocId<PerkiraanHarga> | null;
  detail: WithDocId<DetailOrder>[];
  namaProduk?: Record<string, string>;
}) {
  const nama = (id: string) => namaProduk?.[id] ?? `${id.slice(0, 8)}…`;
  return (
    <Card>
      <h2 className="font-semibold text-moon-ink">Estimasi biaya</h2>
      {estimasi ? (
        <div className="mt-2 text-sm">
          <div className="flex justify-between gap-2 py-1">
            <span className="min-w-0 break-words">
              {nama(estimasi.id_produk)} × {estimasi.jumlah} @{" "}
              {formatRupiah(estimasi.harga_satuan)}
            </span>
            <span className="font-medium">
              {formatRupiah(estimasi.harga_satuan * estimasi.jumlah)}
            </span>
          </div>
          <div className="flex justify-between gap-2 py-1 text-zinc-600">
            <span>Biaya bahan</span>
            <span>{formatRupiah(estimasi.biaya_bahan)}</span>
          </div>
          <div className="flex justify-between gap-2 py-1 text-zinc-600">
            <span>Biaya produksi</span>
            <span>{formatRupiah(estimasi.biaya_produksi)}</span>
          </div>
          <div className="mt-1 flex justify-between gap-2 border-t border-zinc-200 pt-2">
            <span className="font-medium">Total estimasi awal</span>
            <span className="font-semibold text-moon-blue">
              {formatRupiah(estimasi.total_estimasi)}
            </span>
          </div>
          <div className="flex justify-between gap-2 py-1">
            <span className="font-medium">Total order aktual</span>
            <span className="font-semibold text-moon-ink">
              {formatRupiah(order.total_harga)}
            </span>
          </div>
          {(() => {
            const selisih = order.total_harga - estimasi.total_estimasi;
            if (selisih === 0) {
              return (
                <p className="mt-1 text-xs text-zinc-500">
                  Sama persis dengan estimasi awal.
                </p>
              );
            }
            return (
              <p
                className={`mt-1 text-xs font-medium ${selisih > 0 ? "text-moon-pink" : "text-green-600"}`}
              >
                {selisih > 0 ? "Naik " : "Hemat "}
                {formatRupiah(Math.abs(selisih))} dari estimasi awal.
              </p>
            );
          })()}
        </div>
      ) : (
        <div className="mt-2 text-sm">
          {detail.length === 0 ? (
            <p className="text-zinc-500">Belum ada rincian biaya.</p>
          ) : (
            <>
              {detail.map((d) => (
                <div key={d.id} className="flex justify-between gap-2 py-1">
                  <span className="min-w-0 break-words">
                    {nama(d.id_produk)} × {d.jumlah} @{" "}
                    {formatRupiah(d.harga_satuan)}
                  </span>
                  <span className="font-medium">
                    {formatRupiah(d.subtotal)}
                  </span>
                </div>
              ))}
              <div className="mt-1 flex justify-between gap-2 border-t border-zinc-200 pt-2">
                <span className="font-medium">Total order</span>
                <span className="font-semibold text-moon-ink">
                  {formatRupiah(order.total_harga)}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Order dibuat langsung tanpa estimasi awal.
              </p>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// Daftar item pesanan beserta desain custom tiap item.
export function OrderItemsCard({
  detail,
  namaProduk,
}: {
  detail: WithDocId<DetailOrder>[];
  namaProduk?: Record<string, string>;
}) {
  const nama = (id: string) => namaProduk?.[id] ?? `${id.slice(0, 8)}…`;
  return (
    <Card>
      <h2 className="font-semibold text-moon-ink">
        Item pesanan ({detail.length})
      </h2>
      <ul className="mt-2 divide-y text-sm">
        {detail.map((d) => (
          <li key={d.id} className="py-3">
            <div className="flex justify-between gap-2">
              <span className="min-w-0 break-words">
                {nama(d.id_produk)} × {d.jumlah}
                {d.spesifikasi && (
                  <span className="block text-xs text-zinc-500">
                    {d.spesifikasi}
                  </span>
                )}
              </span>
              <span className="font-medium">{formatRupiah(d.subtotal)}</span>
            </div>
            {(d.desain_url || d.catatan_desain) && (
              <div className="mt-2">
                <DesainCustomView
                  url={d.desain_url}
                  path={d.desain_path}
                  catatan={d.catatan_desain}
                />
              </div>
            )}
          </li>
        ))}
        {detail.length === 0 && (
          <li className="py-4 text-zinc-500">Belum ada item.</li>
        )}
      </ul>
    </Card>
  );
}
