# Changelog

Semua perubahan yang signifikan pada project ini akan didokumentasikan pada file ini.

## [Unreleased]

### Added
- Fungsi `generateOrderId` pada `src/lib/db.ts` untuk men-generate ID Order secara lokal tanpa perlu network request ke server.
- Fungsi `createOrderWithDetailsBatch` pada `src/lib/db.ts` untuk menyimpan `Order`, `DetailOrder`, dan `TrackingOrder` sekaligus menggunakan Firestore Batch Write.

### Changed
- Refactor fungsi `onSubmit` pada `src/app/customer/pesan/page.tsx` saat pembuatan order. Mengganti pembuatan dokumen secara sekuensial (yang lambat karena harus bolak-balik network) menjadi batch write yang bersifat atomic.
- Perbaikan performa yang sangat signifikan (memangkas 3 round-trips ke Firestore menjadi hanya 1 round-trip) dan menyederhanakan kode *rollback* karena dengan menggunakan *batch*, sistem error handling akan otomatis membatalkan semua dokumen terkait jika salah satunya gagal masuk database.
- Menghapus penggunaan "orderBy bersamaan" dengan "where pada" fungsi listOrdersByPelanggan, listTrackingByOrder, dan "listEstimasiByPelanggan di" "src/lib/db.ts dan" menggantinya dengan sorting array di sisi klien. Hal ini bertujuan untuk membebaskan pengguna dari kewajiban membuat Composite Index di Firebase Console yang berpotensi error.
