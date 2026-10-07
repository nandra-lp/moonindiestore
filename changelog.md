# Changelog

Semua perubahan yang signifikan pada project ini akan didokumentasikan pada file ini.

## [Unreleased]

### Added (sesi UI/UX & setup Firebase — Okt 2026)
- `firebase.json` + `.firebaserc` — deploy `firestore.rules`/`storage.rules` ke project `mis-db-1e50d` (rules Firestore sudah live, seed 5 produk sukses).
- `src/lib/auth-errors.ts` — `pesanErrorAuth()`: pesan error Firebase Auth dalam Bahasa Indonesia.
- `src/lib/role-route.ts` — `resolveTarget()` bersama (dipakai login + register).
- `src/components/Chrome.tsx` — sembunyikan Navbar + footer marketing di section dashboard.
- `src/components/dashboard/` — modul baru: `nav.ts` (single source navigasi per role), `Shell.tsx` (sidebar + topbar + drawer mobile + skip-link), `Sidebar.tsx`, `widgets.tsx` (`LiveBadge`, `FilterPills`, `OrderCard`, `StatLink`, `EmptyCard`, `SectionHead`, `DashboardHero`), `ProductCard.tsx` (+ skeleton, fallback gambar rusak).
- Primitif `SuccessBox` dan `role="alert"` di `ErrorBox` (`components/ui.tsx`); mode `fill` di `ProductThumb`.
- Skeleton loading di katalog home, dashboard admin/owner, katalog produk admin, dan halaman estimasi.
- Alur "Lupa password?" (`sendPasswordResetEmail`) di halaman login.
- Grid produk selectable di `/customer/estimasi` (klik kartu ↔ dropdown sinkron, `aria-pressed`).
- Kartu "Ringkasan order" (pelanggan/tanggal/estimasi selesai/total) di `/admin/orders/[id]`.
- Animasi `slide-down`/`slide-in-left`/`pop-in` + guard `prefers-reduced-motion` (`globals.css`).

### Changed (sesi UI/UX — Okt 2026)
- 13 halaman section (`/admin/*`, `/owner/*`, `/customer/*`) dibungkus `DashboardShell`; hirarki Sidebar → Topbar → Page Header → Statistik → Konten.
- Navbar: link aktif pill kuning, ikon lucide konsisten, `aria-current`, `focus-visible`, pakai nav bersama.
- Sidebar & topbar dashboard: active subtle (`moon-yellow/15`), ikon seragam, kartu user ringkas, tanpa gradient/glow.
- `BackLink` jadi tombol pill; `StatLink` jadi layout ikon + panah chip (hapus panah ganda).
- Hero berlogo (`DashboardHero`) di 3 dashboard utama; logo `BrandMark` naik ke 256px + `priority`, ukuran tampil diperbesar.
- `KatalogPreview` home: gambar full-bleed + badge harga overlay + skeleton/error/empty state.
- Login/register: toggle password, autofill, backdrop brand, redirect bila sudah login, fokus keyboard.
- `/admin/produk`: list baris → grid kartu premium responsif (1/2/3 kolom).
- `/admin/orders/[id]`: kartu progres digabung, ikon seksi, skeleton loading/not-found.
- `/customer/estimasi`: hasil rincian baris-per-baris + total besar (`aria-live`), riwayat tampilkan nama produk & satuan asli.
- `GhostLink` yang tak terpakai dihapus dari `ui.tsx`.

### Fixed (sesi UI/UX — Okt 2026)
- `src/app/admin/pelanggan/page.tsx`: import `DangerButton` hilang (TS2304, menggagalkan build).
- `/customer/estimasi`: tombol "Simpan" terkunci saat daftar produk async (default produk pertama + state terangkat).
- `.gitignore`: tambah pola `*service-account*.json`, folder `.firebase/`, dan log debug Firebase agar kredensial/sampah lokal tak ter-push (`.env*` dan service account sudah ter-cover sebelumnya).

### Riwayat sebelumnya

### Added
- Fungsi `generateOrderId` pada `src/lib/db.ts` untuk men-generate ID Order secara lokal tanpa perlu network request ke server.
- Fungsi `createOrderWithDetailsBatch` pada `src/lib/db.ts` untuk menyimpan `Order`, `DetailOrder`, dan `TrackingOrder` sekaligus menggunakan Firestore Batch Write.

### Changed
- Refactor fungsi `onSubmit` pada `src/app/customer/pesan/page.tsx` saat pembuatan order. Mengganti pembuatan dokumen secara sekuensial (yang lambat karena harus bolak-balik network) menjadi batch write yang bersifat atomic.
- Perbaikan performa yang sangat signifikan (memangkas 3 round-trips ke Firestore menjadi hanya 1 round-trip) dan menyederhanakan kode *rollback* karena dengan menggunakan *batch*, sistem error handling akan otomatis membatalkan semua dokumen terkait jika salah satunya gagal masuk database.
- Menghapus penggunaan "orderBy bersamaan" dengan "where pada" fungsi listOrdersByPelanggan, listTrackingByOrder, dan "listEstimasiByPelanggan di" "src/lib/db.ts dan" menggantinya dengan sorting array di sisi klien. Hal ini bertujuan untuk membebaskan pengguna dari kewajiban membuat Composite Index di Firebase Console yang berpotensi error.
