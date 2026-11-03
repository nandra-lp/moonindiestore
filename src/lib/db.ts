// Lapisan akses data Firestore. Satu modul per entitas ERD agar import tetap ringan.
// Semua fungsi memakai modular SDK (v12) dan bekerja di Client Component.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type {
  DetailOrder,
  Order,
  Pelanggan,
  PerkiraanHarga,
  Produk,
  Produksi,
  Role,
  TrackingOrder,
  UserDoc,
} from "@/types/firestore";

function withId<T extends DocumentData>(id: string, data: T): T & { id: string } {
  return { ...data, id } as T & { id: string };
}

// ---------- USERS (role) ----------
export async function listUsers() {
  return listBy<UserDoc>(COLLECTIONS.users, [orderBy("email")]);
}

export async function updateUserRole(uid: string, role: Role) {
  await updateDoc(doc(db, COLLECTIONS.users, uid), { role });
}

export async function updateUserNama(uid: string, nama: string) {
  await updateDoc(doc(db, COLLECTIONS.users, uid), {
    nama,
    updatedAt: serverTimestamp(),
  });
}

// ---------- generic ----------
export type WithDocId<T> = T & { id: string };

async function listBy<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<WithDocId<T>[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => withId(d.id, d.data() as T));
}

// Listener realtime (onSnapshot): UI ikut berubah saat data di Firestore
// berubah tanpa refresh. Kueri disamakan dengan versi list* agar tidak butuh
// composite index tambahan. Mengembalikan fungsi unsubscribe.
function subscribeBy<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[],
  sortFn: (a: WithDocId<T>, b: WithDocId<T>) => number,
  onData: (rows: WithDocId<T>[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => withId(d.id, d.data() as T));
      rows.sort(sortFn);
      onData(rows);
    },
    (err) => onError?.(err)
  );
}

// ---------- PELANGGAN ----------
export async function createPelanggan(
  data: Omit<Pelanggan, "id_pelanggan" | "createdAt" | "updatedAt">
) {
  const ref = await addDoc(collection(db, COLLECTIONS.pelanggan), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPelanggan(id_pelanggan: string) {
  const snap = await getDoc(doc(db, COLLECTIONS.pelanggan, id_pelanggan));
  return snap.exists() ? ({ ...snap.data(), id_pelanggan: snap.id } as Pelanggan) : null;
}

export async function listPelanggan() {
  return listBy<Pelanggan>(COLLECTIONS.pelanggan, [orderBy("nama")]);
}

export async function updatePelangganProfile(
  id_pelanggan: string,
  data: { nama?: string; alamat?: string }
) {
  await updateDoc(doc(db, COLLECTIONS.pelanggan, id_pelanggan), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ---------- PRODUK ----------
export async function getProduk(id_produk: string) {
  const snap = await getDoc(doc(db, COLLECTIONS.produk, id_produk));
  return snap.exists()
    ? ({ ...snap.data(), id: snap.id } as WithDocId<Produk>)
    : null;
}

export async function listProduk() {
  return listBy<Produk>(COLLECTIONS.produk, [orderBy("nama_produk")]);
}

export async function createProduk(
  data: Omit<Produk, "id_produk" | "createdAt" | "updatedAt">
) {
  const ref = await addDoc(collection(db, COLLECTIONS.produk), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduk(
  id_produk: string,
  data: Partial<Omit<Produk, "id_produk" | "createdAt" | "updatedAt">>
) {
  await updateDoc(doc(db, COLLECTIONS.produk, id_produk), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduk(id_produk: string) {
  await deleteDoc(doc(db, COLLECTIONS.produk, id_produk));
}

// ---------- ORDER ----------
export async function getOrder(id_order: string) {
  const snap = await getDoc(doc(db, COLLECTIONS.orders, id_order));
  return snap.exists()
    ? ({ ...snap.data(), id: snap.id } as WithDocId<Order>)
    : null;
}

export async function createOrder(
  data: Omit<Order, "id_order" | "createdAt" | "updatedAt">
) {
  const ref = await addDoc(collection(db, COLLECTIONS.orders), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listOrdersByPelanggan(id_pelanggan: string) {
  const docs = await listBy<Order>(COLLECTIONS.orders, [
    where("id_pelanggan", "==", id_pelanggan),
  ]);
  return docs.sort((a, b) => (b.tgl_order?.toMillis?.() || 0) - (a.tgl_order?.toMillis?.() || 0));
}

export function subscribeOrdersByPelanggan(
  id_pelanggan: string,
  onData: (orders: WithDocId<Order>[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  return subscribeBy<Order>(
    COLLECTIONS.orders,
    [where("id_pelanggan", "==", id_pelanggan)],
    (a, b) => (b.tgl_order?.toMillis?.() || 0) - (a.tgl_order?.toMillis?.() || 0),
    onData,
    onError
  );
}

export async function listOrdersRecent(max = 50) {
  return listBy<Order>(COLLECTIONS.orders, [
    orderBy("tgl_order", "desc"),
    limit(max),
  ]);
}

export function subscribeOrdersRecent(
  max: number,
  onData: (orders: WithDocId<Order>[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  return subscribeBy<Order>(
    COLLECTIONS.orders,
    [orderBy("tgl_order", "desc"), limit(max)],
    () => 0,
    onData,
    onError
  );
}

// Ubah status order + catat tracking dalam satu batch agar tidak ada
// perubahan status yang "berhasil" tanpa jejak tracking.
export async function updateOrderStatusWithTracking(
  id_order: string,
  status_order: Order["status_order"],
  tracking: { status: string; keterangan?: string }
) {
  const batch = writeBatch(db);
  const trackingRef = doc(collection(db, COLLECTIONS.tracking_order));

  batch.update(doc(db, COLLECTIONS.orders, id_order), {
    status_order,
    updatedAt: serverTimestamp(),
  });
  batch.set(trackingRef, {
    id_tracking: trackingRef.id,
    id_order,
    status: tracking.status,
    waktu: Timestamp.now(),
    keterangan: tracking.keterangan ?? "",
  });
  await batch.commit();
}

export async function submitPaymentProof(
  id_order: string,
  proof: { url: string; path: string }
) {
  await updateDoc(doc(db, COLLECTIONS.orders, id_order), {
    status_pembayaran: "bukti_dikirim",
    bukti_pembayaran_url: proof.url,
    bukti_pembayaran_path: proof.path,
    updatedAt: serverTimestamp(),
  });
}

export async function verifyOrderPayment(id_order: string) {
  const batch = writeBatch(db);
  const orderRef = doc(db, COLLECTIONS.orders, id_order);
  const trackingRef = doc(collection(db, COLLECTIONS.tracking_order));

  batch.update(orderRef, {
    status_pembayaran: "terverifikasi",
    waktu_pembayaran: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(trackingRef, {
    id_tracking: trackingRef.id,
    id_order,
    status: "Pembayaran terverifikasi",
    waktu: Timestamp.now(),
    keterangan: "Admin telah mengonfirmasi pembayaran.",
  });
  await batch.commit();
}

// ---------- DETAIL_ORDER ----------
export async function listDetailByOrder(id_order: string) {
  return listBy<DetailOrder>(COLLECTIONS.detail_order, [
    where("id_order", "==", id_order),
  ]);
}

// Ambil item untuk banyak order sekaligus (chunked `in`, maks 10 per query).
// Dipakai dashboard agar ringkasan produk tidak perlu N+1 query.
export async function listDetailByOrderIds(ids: string[]) {
  const uniq = [...new Set(ids)].filter(Boolean);
  if (uniq.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < uniq.length; i += 10) chunks.push(uniq.slice(i, i + 10));
  const parts = await Promise.all(
    chunks.map((c) =>
      listBy<DetailOrder>(COLLECTIONS.detail_order, [where("id_order", "in", c)])
    )
  );
  return parts.flat();
}

export async function createDetailOrder(
  data: Omit<DetailOrder, "id_detail">
) {
  const ref = await addDoc(collection(db, COLLECTIONS.detail_order), data);
  return ref.id;
}

// ---------- PRODUKSI ----------
export async function listProduksiByOrder(id_order: string) {
  return listBy<Produksi>(COLLECTIONS.produksi, [
    where("id_order", "==", id_order),
  ]);
}

export async function upsertProduksi(id_produksi: string, data: Partial<Produksi>) {
  await setDoc(
    doc(db, COLLECTIONS.produksi, id_produksi),
    { ...data, id_produksi },
    { merge: true }
  );
}

export async function createProduksi(data: Omit<Produksi, "id_produksi">) {
  const ref = await addDoc(collection(db, COLLECTIONS.produksi), data);
  return ref.id;
}

export async function updateProduksi(
  id_produksi: string,
  data: Partial<Produksi>
) {
  await updateDoc(doc(db, COLLECTIONS.produksi, id_produksi), data);
}

// ---------- TRACKING_ORDER ----------
export async function listTrackingByOrder(id_order: string) {
  const docs = await listBy<TrackingOrder>(COLLECTIONS.tracking_order, [
    where("id_order", "==", id_order),
  ]);
  return docs.sort((a, b) => (a.waktu?.toMillis?.() || 0) - (b.waktu?.toMillis?.() || 0));
}

export async function addTracking(
  data: Omit<TrackingOrder, "id_tracking">
) {
  const ref = await addDoc(collection(db, COLLECTIONS.tracking_order), data);
  return ref.id;
}

// ---------- PERKIRAAN_HARGA ----------
export async function listEstimasiRecent(max = 50) {
  return listBy<PerkiraanHarga>(COLLECTIONS.perkiraan_harga, [
    orderBy("tanggal", "desc"),
    limit(max),
  ]);
}

export async function listEstimasiByPelanggan(id_pelanggan: string) {
  const docs = await listBy<PerkiraanHarga>(COLLECTIONS.perkiraan_harga, [
    where("id_pelanggan", "==", id_pelanggan),
  ]);
  return docs.sort((a, b) => (b.tanggal?.toMillis?.() || 0) - (a.tanggal?.toMillis?.() || 0));
}

export function subscribeEstimasiByPelanggan(
  id_pelanggan: string,
  onData: (rows: WithDocId<PerkiraanHarga>[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  return subscribeBy<PerkiraanHarga>(
    COLLECTIONS.perkiraan_harga,
    [where("id_pelanggan", "==", id_pelanggan)],
    (a, b) => (b.tanggal?.toMillis?.() || 0) - (a.tanggal?.toMillis?.() || 0),
    onData,
    onError
  );
}

export async function getEstimasi(id_estimasi: string) {
  const snap = await getDoc(doc(db, COLLECTIONS.perkiraan_harga, id_estimasi));
  return snap.exists()
    ? ({ ...snap.data(), id: snap.id } as WithDocId<PerkiraanHarga>)
    : null;
}

export async function createEstimasi(
  data: Omit<PerkiraanHarga, "id_estimasi">
) {
  const ref = await addDoc(collection(db, COLLECTIONS.perkiraan_harga), data);
  return ref.id;
}

export async function deleteDocById(collectionName: string, id: string) {
  await deleteDoc(doc(db, collectionName, id));
}

// ---------- BATCH OPERATIONS (PERFORMANCE OPTIMIZATION) ----------
export function generateOrderId() {
  return doc(collection(db, COLLECTIONS.orders)).id;
}

export async function createOrderWithId(
  orderId: string,
  orderData: Omit<Order, "id_order" | "createdAt" | "updatedAt">
) {
  await setDoc(doc(db, COLLECTIONS.orders, orderId), {
    ...orderData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function createOrderDetailsAndTrackingBatch(
  orderId: string,
  detailData: Omit<DetailOrder, "id_detail" | "id_order">,
  trackingData: Omit<TrackingOrder, "id_tracking" | "id_order">
) {
  const batch = writeBatch(db);
  const detailRef = doc(collection(db, COLLECTIONS.detail_order));
  const trackingRef = doc(collection(db, COLLECTIONS.tracking_order));
  const orderRef = doc(db, COLLECTIONS.orders, orderId);

  batch.update(orderRef, {
    order_siap: true,
    updatedAt: serverTimestamp(),
  });
  batch.set(detailRef, {
    ...detailData,
    id_order: orderId,
  });

  batch.set(trackingRef, {
    ...trackingData,
    id_order: orderId,
  });

  await batch.commit();
}
