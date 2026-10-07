"use client";

import { useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { Calculator } from "lucide-react";
import { createEstimasi, type WithDocId } from "@/lib/db";
import { formatRupiah, hitungTotalEstimasi } from "@/lib/estimasi";
import type { Produk } from "@/types/firestore";
import { Card, ErrorBox, PrimaryButton, SuccessBox } from "@/components/ui";

const inputCls =
  "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2";

export function EstimasiForm({
  id_pelanggan,
  produkList,
  idProduk,
  onIdProdukChange,
  onSaved,
}: {
  id_pelanggan: string;
  produkList: WithDocId<Produk>[];
  /** Produk terpilih — dikendalikan halaman agar sinkron dengan grid katalog. */
  idProduk: string;
  onIdProdukChange: (id: string) => void;
  onSaved: () => void;
}) {
  const [jumlah, setJumlah] = useState(100);
  const [biayaBahan, setBiayaBahan] = useState(50000);
  const [biayaProduksi, setBiayaProduksi] = useState(75000);
  const [busy, setBusy] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const produk = useMemo(
    () => produkList.find((p) => p.id === idProduk) ?? null,
    [produkList, idProduk],
  );
  const hargaSatuan = produk?.harga_dasar ?? 0;
  const subtotalSatuan = hargaSatuan * (Number.isFinite(jumlah) && jumlah > 0 ? jumlah : 0);
  const total = hitungTotalEstimasi({
    harga_satuan: hargaSatuan,
    jumlah,
    biaya_bahan: biayaBahan,
    biaya_produksi: biayaProduksi,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!produk) {
      setOkMsg(null);
      setErrMsg("Pilih produk dulu.");
      return;
    }
    setBusy(true);
    setOkMsg(null);
    setErrMsg(null);
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
      setOkMsg("Estimasi tersimpan ke riwayat.");
      onSaved();
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Gagal menyimpan estimasi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="flex items-center gap-2 font-semibold text-moon-ink">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-moon-yellow/20 text-moon-ink">
          <Calculator className="h-4 w-4" aria-hidden="true" />
        </span>
        Hitung estimasi biaya
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Total = (harga satuan × jumlah) + biaya bahan + biaya produksi.
      </p>
      <form onSubmit={onSubmit}>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-moon-ink">
            Produk
            <select
              value={idProduk}
              onChange={(e) => onIdProdukChange(e.target.value)}
              className={inputCls}
            >
              {produkList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama_produk} — {formatRupiah(p.harga_dasar)}/{p.satuan}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-moon-ink">
            Jumlah ({produk?.satuan ?? "pcs"})
            <input
              type="number"
              min={1}
              value={jumlah}
              onChange={(e) => setJumlah(Number(e.target.value))}
              className={inputCls}
            />
          </label>
          <label className="text-sm font-medium text-moon-ink">
            Biaya bahan (Rp)
            <input
              type="number"
              min={0}
              value={biayaBahan}
              onChange={(e) => setBiayaBahan(Number(e.target.value))}
              className={inputCls}
            />
          </label>
          <label className="text-sm font-medium text-moon-ink">
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

        {/* Hasil — fokus utama: rincian baris-per-baris + total besar */}
        <div
          aria-live="polite"
          className="mt-4 overflow-hidden rounded-2xl bg-moon-ink text-white"
        >
          <dl className="space-y-2 px-4 pt-4 text-sm sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-white/70">
                {formatRupiah(hargaSatuan)} × {jumlah} {produk?.satuan ?? ""}
              </dt>
              <dd className="font-semibold">{formatRupiah(subtotalSatuan)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-white/70">Biaya bahan</dt>
              <dd className="font-semibold">{formatRupiah(biayaBahan)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-white/70">Biaya produksi</dt>
              <dd className="font-semibold">{formatRupiah(biayaProduksi)}</dd>
            </div>
          </dl>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/15 px-4 py-3 sm:px-5">
            <span className="text-sm font-medium text-white/70">
              Total estimasi
            </span>
            <span className="text-2xl font-bold tracking-tight text-moon-yellow">
              {formatRupiah(total)}
            </span>
          </div>
        </div>

        {errMsg && (
          <div className="mt-3">
            <ErrorBox>{errMsg}</ErrorBox>
          </div>
        )}
        {okMsg && (
          <div className="mt-3">
            <SuccessBox>{okMsg}</SuccessBox>
          </div>
        )}
        <PrimaryButton disabled={busy || !produk} className="mt-4 w-full sm:w-auto">
          {busy ? "Menyimpan…" : "Simpan estimasi"}
        </PrimaryButton>
      </form>
    </Card>
  );
}
