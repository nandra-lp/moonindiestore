// Skema TypeScript hasil pemetaan ERD relasional -> Firestore (NoSQL).
// ERD asli: PELANGGAN, ORDER, PRODUK, DETAIL_ORDER, PRODUKSI, TRACKING_ORDER, PERKIRAAN_HARGA
// Strategi Firestore:
// - Setiap entitas menjadi top-level collection (tetap query-able, mirip tabel).
// - Relasi FK (id_pelanggan, id_order, id_produk) disimpan sebagai string doc-id.
// - Sub-collection tidak dipakai agar migrasi dari MySQL/ERD tetap 1:1 dan mudah dipahami.
// - Field audit createdAt/updatedAt ditambahkan (best practice Firestore).

import type { Timestamp } from "firebase/firestore";

export type Role = "admin" | "owner" | "customer";

export type StatusOrder =
  | "menunggu"
  | "diproses"
  | "produksi"
  | "selesai"
  | "dibatalkan";

export type StatusProduksi = "antri" | "berjalan" | "selesai" | "gagal";

// Dokumen identitas/login + role. Satu user Firebase Auth = satu dokumen di sini.
// id dokumen = Firebase Auth uid.
export interface UserDoc {
  uid: string;
  email: string;
  role: Role;
  // Relasi opsional ke pelanggan (hanya untuk role customer).
  // Menyamai FK id_pelanggan pada ERD.
  id_pelanggan?: string | null;
  nama: string;
  createdAt: Timestamp;
}

// ============ ERD: PELANGGAN ============
export interface Pelanggan {
  id_pelanggan: string; // doc id
  nama: string;
  no_hp: string;
  email: string;
  alamat: string;
  // Jembatan ke Firebase Auth (null untuk pelanggan lama hasil impor).
  uid?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ ERD: PRODUK ============
export interface Produk {
  id_produk: string; // doc id
  nama_produk: string;
  jenis_produk: string;
  harga_dasar: number;
  satuan: string;
  // Gambar katalog di Firebase Storage (opsional — dokumen lama tanpa field ini tetap valid).
  gambar_url?: string | null; // download URL publik untuk <img>
  gambar_path?: string | null; // path Storage (cth. "produk/....jpg") untuk hapus/ganti
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ ERD: ORDER ============
export interface Order {
  id_order: string; // doc id
  id_pelanggan: string; // FK -> Pelanggan.id_pelanggan
  tgl_order: Timestamp;
  total_harga: number;
  status_order: StatusOrder;
  estimasi_selesai: Timestamp | null;
  // FK opsional -> PerkiraanHarga. Diisi bila order dibuat dari estimasi
  // (via /customer/pesan?estimasi=<id>). Order lama tanpa field ini tetap valid.
  id_estimasi?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ ERD: DETAIL_ORDER ============
// Satu dokumen = satu baris join ORDER (N) <-> PRODUK (1).
export interface DetailOrder {
  id_detail: string; // doc id
  id_order: string; // FK -> Order.id_order
  id_produk: string; // FK -> Produk.id_produk
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
  spesifikasi: string;
  // Desain custom dari customer (opsional). File di Firebase Storage folder "desain/".
  desain_url?: string | null; // download URL untuk pratinjau/unduh
  desain_path?: string | null; // path Storage untuk hapus/ganti
  catatan_desain?: string; // instruksi customer: penempatan, warna, revisi, dll.
}

// ============ ERD: PRODUKSI ============
export interface Produksi {
  id_produksi: string; // doc id
  id_order: string; // FK -> Order.id_order
  tahap_produksi: string;
  status_produksi: StatusProduksi;
  waktu_mulai: Timestamp | null;
  waktu_selesai: Timestamp | null;
  keterangan: string;
}

// ============ ERD: TRACKING_ORDER ============
export interface TrackingOrder {
  id_tracking: string; // doc id
  id_order: string; // FK -> Order.id_order
  status: string;
  waktu: Timestamp;
  keterangan: string;
}

// ============ ERD: PERKIRAAN_HARGA ============
export interface PerkiraanHarga {
  id_estimasi: string; // doc id
  id_pelanggan: string; // FK -> Pelanggan.id_pelanggan
  id_produk: string; // FK -> Produk.id_produk
  jumlah: number;
  harga_satuan: number;
  biaya_bahan: number;
  biaya_produksi: number;
  total_estimasi: number;
  tanggal: Timestamp;
}

export const ROLES: Role[] = ["admin", "owner", "customer"];

export const DEFAULT_ROUTE_BY_ROLE: Record<Role, string> = {
  admin: "/admin",
  owner: "/owner",
  customer: "/customer",
};
