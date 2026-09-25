// Logika bisnis estimasi biaya (dipakai customer + admin).
// Formula: total_estimasi = (harga_satuan × jumlah) + biaya_bahan + biaya_produksi
// Menyamai field pada ERD PERKIRAAN_HARGA.

export interface EstimasiInput {
  harga_satuan: number;
  jumlah: number;
  biaya_bahan: number;
  biaya_produksi: number;
}

export function hitungTotalEstimasi(input: EstimasiInput): number {
  const { harga_satuan, jumlah, biaya_bahan, biaya_produksi } = input;
  const safe = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  return (
    safe(harga_satuan) * safe(jumlah) + safe(biaya_bahan) + safe(biaya_produksi)
  );
}

export function formatRupiah(n: number): string {
  return `Rp${(n || 0).toLocaleString("id-ID")}`;
}

// Aman untuk Timestamp Firestore yang null/undefined (dokumen lama) —
// mengembalikan "-" daripada melempar error.
export function formatTanggal(ts: unknown): string {
  try {
    const d = (ts as { toDate?: () => Date } | null | undefined)?.toDate?.();
    if (!d) return "-";
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

// Tahapan produksi baku — dipakai untuk progress bar customer & form admin.
export const TAHAP_PRODUKSI = [
  "persiapan_bahan",
  "cetak_potong",
  "finishing_qc",
  "pengemasan",
  "siap_kirim",
] as const;

export type TahapProduksi = (typeof TAHAP_PRODUKSI)[number];

export const LABEL_TAHAP: Record<TahapProduksi, string> = {
  persiapan_bahan: "Persiapan bahan",
  cetak_potong: "Cetak / potong",
  finishing_qc: "Finishing & QC",
  pengemasan: "Pengemasan",
  siap_kirim: "Siap kirim",
};

/** Index tahap terakhir yang selesai → persen progres 0..100. */
export function hitungProgresProduksi(
  produksi: { tahap_produksi: string; status_produksi: string }[]
): { persen: number; tahapTerakhir: string | null } {
  if (produksi.length === 0) return { persen: 0, tahapTerakhir: null };
  let best = -1;
  let selesaiSemua = false;
  for (const p of produksi) {
    const idx = TAHAP_PRODUKSI.indexOf(p.tahap_produksi as TahapProduksi);
    if (idx > best) best = idx;
    if (
      p.tahap_produksi === "siap_kirim" &&
      p.status_produksi === "selesai"
    ) {
      selesaiSemua = true;
    }
  }
  if (selesaiSemua) return { persen: 100, tahapTerakhir: "siap_kirim" };
  if (best < 0) return { persen: 5, tahapTerakhir: produksi[0]?.tahap_produksi ?? null };
  const persen = Math.round(((best + 1) / TAHAP_PRODUKSI.length) * 100);
  return { persen, tahapTerakhir: TAHAP_PRODUKSI[best] };
}
