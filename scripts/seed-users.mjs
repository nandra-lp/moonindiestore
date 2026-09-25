// Script khusus untuk menambahkan katalog produk (Force Insert)
// Cara pakai: npm run seed:users (atau sesuaikan dengan nama script di package.json Anda)

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Membaca file service-account.json secara aman di ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.resolve(__dirname, "../service-account.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// 1. Inisialisasi Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

// 2. Fungsi Utama Seed Produk
async function seedProdukBaru() {
  const items = [
    {
      nama_produk: "Lanyard Custom ID Card",
      jenis_produk: "merchandise",
      harga_dasar: 15000,
      satuan: "pcs",
      gambar_url:
        "https://images.unsplash.com/photo-1644331415250-18f0a05dc454?auto=format&fit=crop&q=80&w=500",
      gambar_path: "produk/seed-lanyard.jpg",
    },
    {
      nama_produk: "Kaos Katun Combed 30s",
      jenis_produk: "pakaian",
      harga_dasar: 55000,
      satuan: "pcs",
      gambar_url:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500",
      gambar_path: "produk/seed-kaos.jpg",
    },
    {
      nama_produk: "Spanduk Flexi 280gr",
      jenis_produk: "cetak",
      harga_dasar: 25000,
      satuan: "meter",
      gambar_url:
        "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?auto=format&fit=crop&q=80&w=500",
      gambar_path: "produk/seed-spanduk.jpg",
    },
    {
      nama_produk: "Topi Trucker Jaring",
      jenis_produk: "merchandise",
      harga_dasar: 20000,
      satuan: "pcs",
      gambar_url:
        "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=500",
      gambar_path: "produk/seed-topi.jpg",
    },
    {
      nama_produk: "Gantungan Kunci Akrilik",
      jenis_produk: "merchandise",
      harga_dasar: 5000,
      satuan: "pcs",
      gambar_url:
        "https://images.unsplash.com/photo-1612015900986-4c4d017d1648?auto=format&fit=crop&q=80&w=500",
      gambar_path: "produk/seed-ganci.jpg",
    },
  ];

  let count = 0;
  for (const it of items) {
    await db.collection("produk").add({
      ...it,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    count++;
    console.log(`  -> Menambahkan: ${it.nama_produk}`);
  }

  console.log(`- ${count} produk baru berhasil ditambahkan ke database.`);
}

// 3. Eksekusi Script
async function main() {
  try {
    console.log("Memulai penambahan produk...");
    console.log("-----------------------------------------");

    await seedProdukBaru();

    console.log("-----------------------------------------");
    console.log("Selesai tanpa masalah.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Terjadi kesalahan:", error);
    process.exit(1);
  }
}

main();
