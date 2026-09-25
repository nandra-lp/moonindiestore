"use client";

import { useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { createEstimasi, type WithDocId } from "@/lib/db";
import { formatRupiah, hitungTotalEstimasi } from "@/lib/estimasi";
import type { Produk } from "@/types/firestore";
import { Card, PrimaryButton } from "@/components/ui";

const inputCls =
  "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2";

export function EstimasiForm({
  id_pelanggan,
  produkList,
  onSaved,
}: {
  id_pelanggan: string;
  produkList: WithDocId<Produk>[];
  onSaved: () => void;
}) {
  const [idProduk, setIdProduk] = useState(produkList[0]?.id ?? "");
  const [jumlah, setJumlah] = useState(100);
  const [biayaBahan, setBiayaBahan] = useState(50000);
  const [biayaProduksi, setBiayaProduksi] = useState(75000);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const produk = useMemo(
    () => produkList.find((p) => p.id === idProduk),
    [produkList, idProduk]
  );
  const hargaSatuan = produk?.harga_dasar ?? 0;
  const total = hitungTotalEstimasi({
    harga_satuan: hargaSatuan,
    jumlah,
    biaya_bahan: biayaBahan,
    biaya_produksi: biayaProduksi,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!produk) {
      setMsg("Pilih produk dulu.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await createEstimasi({
        id_pelanggan,
        id_produk: produk.id,
        jumlah,
        harga_satuan: hargaSatuan,
        biaya_bahan: biayaBahan,
        biaya_produksi: biayaProduksi,
        total_estimasi: total,
        tanggal: Timestamp.now(),
      });
      setMsg("Estimasi tersimpan ke riwayat.");
      onSaved();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal menyimpan estimasi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="font-semibold text-moon-ink">Hitung estimasi biaya</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Total = (harga satuan × jumlah) + biaya bahan + biaya produksi.
      </p>
      <form onSubmit={onSubmit}>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Produk
            <select
              value={idProduk}
              onChange={(e) => setIdProduk(e.target.value)}
              className={inputCls}
            >
              {produkList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama_produk} — {formatRupiah(p.harga_dasar)}/{p.satuan}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Jumlah ({produk?.satuan ?? "pcs"})
            <input
              type="number"
              min={1}
              value={jumlah}
              onChange={(e) => setJumlah(Number(e.target.value))}
              className={inputCls}
            />
          </label>
          <label className="text-sm font-medium">
            Biaya bahan (Rp)
            <input
              type="number"
              min={0}
              value={biayaBahan}
              onChange={(e) => setBiayaBahan(Number(e.target.value))}
              className={inputCls}
            />
          </label>
          <label className="text-sm font-medium">
            Biaya produksi (Rp)
            <input
              type="number"
              min={0}
              value={biayaProduksi}
              onChange={(e) => setBiayaProduksi(Number(e.target.value))}
              className={inputCls}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-moon-ink px-4 py-3 text-white">
          <span className="text-sm text-white/70">
            {formatRupiah(hargaSatuan)} × {jumlah} + {formatRupiah(biayaBahan)}{" "}
            + {formatRupiah(biayaProduksi)}
          </span>
          <span className="text-xl font-bold text-moon-yellow">
            {formatRupiah(total)}
          </span>
        </div>
        {msg && <p className="mt-3 text-sm text-zinc-600">{msg}</p>}
        <PrimaryButton disabled={busy || !produk} className="mt-4">
          {busy ? "Menyimpan…" : "Simpan estimasi"}
        </PrimaryButton>
      </form>
    </Card>
  );
}
