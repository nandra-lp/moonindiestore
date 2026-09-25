// Nama collection Firestore — 1:1 dengan tabel pada ERD + koleksi users untuk role.
export const COLLECTIONS = {
  users: "users",
  pelanggan: "pelanggan",
  produk: "produk",
  orders: "orders",
  detail_order: "detail_order",
  produksi: "produksi",
  tracking_order: "tracking_order",
  perkiraan_harga: "perkiraan_harga",
} as const;

export type CollectionKey = keyof typeof COLLECTIONS;
