"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/Shell";
import { listEstimasiRecent, type WithDocId } from "@/lib/db";
import { formatRupiah, formatTanggal } from "@/lib/estimasi";
import type { PerkiraanHarga } from "@/types/firestore";
import { BackLink, Card, PageHeader } from "@/components/ui";

import { usePelangganMap, useProdukMap } from "@/hooks/useLookup";

function AdminEstimasiInner() {
  const [rows, setRows] = useState<WithDocId<PerkiraanHarga>[]>([]);
  const namaPelanggan = usePelangganMap();
  const namaProduk = useProdukMap();

  useEffect(() => {
    listEstimasiRecent(50).then(setRows).catch(() => {});
  }, []);

  return (
    <DashboardShell role="admin" title="Estimasi Harga" contain="4xl">
      <BackLink href="/admin">Dashboard admin</BackLink>
      <div className="mt-2">
        <PageHeader
          eyebrow="Admin · Estimasi"
          title="Semua estimasi harga"
          desc="Acuan sebelum order dibuat. Tindak lanjuti order terkait dari dashboard."
        />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {rows.map((e) => (
          <div
            key={e.id}
            className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(10,10,10,0.05)] transition-all hover:-translate-y-0.5 hover:border-moon-yellow hover:shadow-[0_8px_30px_rgba(10,10,10,0.08)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3 mb-3">
              <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">
                {formatTanggal(e.tanggal)}
              </span>
              <span 
                className="truncate rounded-full bg-moon-pink/10 px-2.5 py-1 text-xs font-semibold text-moon-pink max-w-[150px] sm:max-w-[200px]"
                title={namaPelanggan[e.id_pelanggan] ?? `Pelanggan #${e.id_pelanggan}`}
              >
                {namaPelanggan[e.id_pelanggan] ?? `Pelanggan #${e.id_pelanggan.slice(0,8)}`}
              </span>
            </div>
            
            <div className="flex-1">
              <p className="text-xs text-zinc-500 mb-1">Produk & Kuantitas</p>
              <p className="text-base font-semibold text-moon-ink leading-tight mb-4 truncate" title={namaProduk[e.id_produk] ?? e.id_produk}>
                {namaProduk[e.id_produk] ?? `Produk #${e.id_produk.slice(0, 8)}`} 
                <span className="ml-1.5 font-medium text-zinc-500 text-sm">× {e.jumlah}</span>
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-sm bg-zinc-50 p-3 rounded-xl mb-4">
                <div>
                  <p className="text-xs text-zinc-500">Harga Satuan</p>
                  <p className="font-medium text-zinc-700">{formatRupiah(e.harga_satuan)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Produksi & Bahan</p>
                  <p className="font-medium text-zinc-700">{formatRupiah(e.biaya_bahan + e.biaya_produksi)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
              <p className="text-sm font-medium text-zinc-500">Total Estimasi</p>
              <p className="text-lg font-bold text-moon-blue">
                {formatRupiah(e.total_estimasi)}
              </p>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="col-span-full">
            <Card className="text-center py-8">
              <p className="text-zinc-500">Belum ada estimasi tersimpan.</p>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default function AdminEstimasiPage() {
  return (
    <RequireRole allow={["admin"]}>
      <AdminEstimasiInner />
    </RequireRole>
  );
}
