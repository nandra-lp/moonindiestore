"use client";

import { useEffect, useState } from "react";
import { listPelanggan, listProduk } from "@/lib/db";

// Map id_produk -> nama_produk. Koleksi produk boleh dibaca semua role
// (katalog publik), jadi aman dipakai di dashboard admin/owner/customer.
export function useProdukMap() {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    listProduk()
      .then((rows) => {
        const m: Record<string, string> = {};
        for (const p of rows) m[p.id] = p.nama_produk;
        setMap(m);
      })
      .catch(() => {});
  }, []);
  return map;
}

// Map id_pelanggan -> nama. Hanya untuk admin/owner (rules melarang
// customer membaca dokumen pelanggan milik orang lain).
export function usePelangganMap() {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    listPelanggan()
      .then((rows) => {
        const m: Record<string, string> = {};
        for (const p of rows) m[p.id] = p.nama;
        setMap(m);
      })
      .catch(() => {});
  }, []);
  return map;
}

// Ringkas daftar id_produk menjadi "2× Kaos, 1× Topi".
// `ids === undefined` berarti belum termuat.
export function ringkasNamaProduk(
  ids: string[] | undefined,
  namaProduk: Record<string, string>
) {
  if (!ids) return "Memuat…";
  if (ids.length === 0) return "Tanpa item";
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, n]) => `${n}× ${namaProduk[id] ?? `${id.slice(0, 8)}…`}`)
    .join(", ");
}
