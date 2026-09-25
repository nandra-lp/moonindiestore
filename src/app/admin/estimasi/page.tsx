"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/AuthGuard";
import { listEstimasiRecent, type WithDocId } from "@/lib/db";
import { formatRupiah } from "@/lib/estimasi";
import type { PerkiraanHarga } from "@/types/firestore";
import { BackLink, Card, PageHeader } from "@/components/ui";

function AdminEstimasiInner() {
  const [rows, setRows] = useState<WithDocId<PerkiraanHarga>[]>([]);
  useEffect(() => {
    listEstimasiRecent(50).then(setRows).catch(() => {});
  }, []);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
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
            className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-moon-yellow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">
                {e.tanggal?.toDate().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="rounded-full bg-moon-pink/10 px-2 py-0.5 text-xs font-semibold text-moon-pink">
                Pelanggan: {e.id_pelanggan.slice(0, 8)}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Produk ID</p>
                <p className="text-sm font-medium text-moon-ink">
                  {e.id_produk.slice(0, 8)} × {e.jumlah}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 mb-0.5">Total Estimasi</p>
                <p className="text-lg font-bold text-moon-blue">
                  {formatRupiah(e.total_estimasi)}
                </p>
              </div>
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
    </main>
  );
}

export default function AdminEstimasiPage() {
  return (
    <RequireRole allow={["admin"]}>
      <AdminEstimasiInner />
    </RequireRole>
  );
}
