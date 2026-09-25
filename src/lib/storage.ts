// Upload & hapus file di Firebase Storage.
// - Gambar katalog produk -> folder "produk/" (URL dicatat di produk.gambar_url).
// - Desain custom customer -> folder "desain/{id_order}/" (URL dicatat di
//   detail_order.desain_url agar admin bisa meninjau & memproduksi).

import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/config";

export const MAX_GAMBAR_BYTES = 2 * 1024 * 1024; // 2 MB (sama dengan storage.rules)
export const MAX_DESAIN_BYTES = 10 * 1024 * 1024; // 10 MB (sama dengan storage.rules)

export function validasiGambar(file: File): string | null {
  if (!file.type.startsWith("image/")) return "File harus berupa gambar.";
  if (file.size > MAX_GAMBAR_BYTES)
    return "Ukuran gambar maksimal 2 MB. Kompres dulu lalu coba lagi.";
  return null;
}

const TIPE_DESAIN_OK = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function validasiDesain(file: File): string | null {
  const tipeOk =
    file.type.startsWith("image/") || TIPE_DESAIN_OK.includes(file.type);
  if (!tipeOk) return "Desain harus berupa gambar (JPG/PNG/WebP) atau PDF.";
  if (file.size > MAX_DESAIN_BYTES)
    return "Ukuran file desain maksimal 10 MB.";
  return null;
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : ".jpg";
}

export async function uploadGambarProduk(
  file: File
): Promise<{ url: string; path: string }> {
  const err = validasiGambar(file);
  if (err) throw new Error(err);
  const path = `produk/${Date.now()}-${Math.random().toString(36).slice(2)}${extOf(file.name)}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type });
  const url = await getDownloadURL(r);
  return { url, path };
}

export async function uploadDesainCustom(
  file: File,
  orderId: string
): Promise<{ url: string; path: string }> {
  const err = validasiDesain(file);
  if (err) throw new Error(err);
  const path = `desain/${orderId}/${Date.now()}-${Math.random().toString(36).slice(2)}${extOf(file.name)}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type });
  const url = await getDownloadURL(r);
  return { url, path };
}

export async function hapusFileStorage(path?: string | null): Promise<void> {
  if (!path) return;
  await deleteObject(ref(storage, path));
}

export async function hapusGambarProduk(path?: string | null): Promise<void> {
  return hapusFileStorage(path);
}
