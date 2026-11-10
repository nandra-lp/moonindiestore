# Alur Pemesanan hingga Pengiriman

Dokumen ini menjelaskan alur yang tersedia di aplikasi Moon Indie Store saat ini, dari customer membuat pesanan sampai admin mencatat pengiriman.

## Ringkasan alur

```text
Customer membuat pesanan
        ↓
Admin meninjau detail dan mengubah status menjadi "diproses"
        ↓
Customer membayar sesuai total yang dikonfirmasi dan mengunggah bukti
        ↓
Admin memeriksa bukti dan mengonfirmasi pembayaran
        ↓
Admin memperbarui tahap produksi
        ↓
Admin mengemas pesanan dan mencatat informasi pengiriman di tracking
        ↓
Admin menandai pesanan selesai setelah proses tuntas
```

## 1. Customer membuat pesanan

1. Customer masuk ke halaman **Pesan** dan memilih produk serta jumlah.
2. Customer mengisi spesifikasi pesanan. Desain custom dan catatan produksi dapat ditambahkan bila diperlukan.
3. Customer memilih metode pembayaran yang tersedia. Saat ini pilihan yang dapat digunakan adalah transfer BCA atau QRIS; GoPay belum tersedia.
4. Customer mengirim pesanan. Pesanan dibuat dengan status order `menunggu` dan status pembayaran `menunggu`.
5. Customer dapat melihat detail, status, dan riwayat pesanan pada halaman detail order. Pesanan juga memiliki catatan tracking awal “Order dibuat”.

**Catatan:** Pilihan metode pembayaran saat membuat pesanan belum berarti customer harus langsung membayar. Tunggu admin meninjau pesanan dan mengonfirmasi total akhir terlebih dahulu.

## 2. Admin meninjau pesanan

Admin membuka detail order untuk memeriksa produk, jumlah, spesifikasi, desain custom, catatan produksi, dan total pesanan. Admin dapat menghubungi customer melalui nomor telepon atau WhatsApp yang tercantum jika perlu klarifikasi.

Setelah detail dan total akhir siap, admin mengubah status order menjadi `diproses`. Perubahan ini membuat instruksi pembayaran dan form unggah bukti tersedia bagi customer.

Jika pesanan perlu dibatalkan, admin dapat mengubah status order menjadi `dibatalkan`. Customer juga dapat membatalkan pesanan selama statusnya masih `menunggu`.

## 3. Customer membayar dan mengunggah bukti

1. Setelah status order menjadi `diproses`, customer membuka detail order dan mengikuti instruksi BCA atau QRIS yang dipilih.
2. Customer membayar sesuai total yang sudah dikonfirmasi admin.
3. Jika metode pembayaran menyediakan kolom catatan/berita, customer mencantumkan kode order dan nama agar pembayaran mudah dicocokkan.
4. Customer mengunggah tangkapan layar atau foto bukti transaksi yang menampilkan detail pembayaran.
5. File yang diterima adalah JPG, PNG, atau WebP, dengan ukuran maksimal 5 MB.
6. Setelah bukti terkirim, status pembayaran berubah menjadi `bukti_dikirim` dan customer dapat melihat tautan ke bukti yang dikirim. Jika perlu, customer dapat mengirim bukti pengganti.

## 4. Admin memverifikasi pembayaran

Admin membuka bukti pembayaran dari detail order dan mencocokkannya dengan transaksi serta total pesanan. Jika pembayaran valid, admin memilih **Konfirmasi pembayaran**.

Status pembayaran berubah menjadi `terverifikasi` dan aplikasi mencatat pembaruan pada riwayat tracking. Jika bukti belum sesuai, admin perlu menghubungi customer untuk klarifikasi sebelum melanjutkan.

Produksi dan penambahan tracking dikunci sebelum pembayaran terverifikasi.

## 5. Admin memperbarui produksi

Setelah pembayaran diverifikasi, admin dapat mengubah status order ke `produksi` serta memperbarui tahap produksi berikut:

1. Persiapan bahan
2. Cetak / potong
3. Finishing & QC
4. Pengemasan
5. Siap kirim

Admin dapat menandai tahap berjalan atau selesai dan menambahkan keterangan. Pembaruan tahap produksi juga dicatat otomatis di riwayat tracking yang bisa dilihat customer.

## 6. Admin mencatat pengiriman

Setelah pesanan siap dikirim:

1. Admin menambahkan pembaruan pada bagian **Tracking manual**, misalnya “Paket diserahkan ke kurir”.
2. Tulis nama kurir, nomor resi, dan informasi lain pada kolom keterangan tracking agar customer dapat menggunakannya untuk mengecek paket.
3. Admin menambahkan pembaruan tracking secara manual saat ada perkembangan pengiriman.
4. Setelah proses pesanan tuntas, admin mengubah status order menjadi `selesai`. Customer akan melihat status dan riwayat tracking pada detail order.

**Batasan saat ini:** Aplikasi belum terintegrasi dengan API kurir. Nomor resi dan status perjalanan paket tidak diperbarui otomatis; admin memasukkannya sebagai teks tracking manual. Status `selesai` juga perlu diperbarui admin.

## Status yang digunakan

| Jenis | Status | Arti |
|---|---|---|
| Order | `menunggu` | Pesanan baru menunggu pemeriksaan admin. |
| Order | `diproses` | Admin telah meninjau pesanan; customer dapat membayar dan mengunggah bukti. |
| Order | `produksi` | Pesanan masuk tahap produksi setelah pembayaran diverifikasi. |
| Order | `selesai` | Proses pesanan ditandai selesai oleh admin. |
| Order | `dibatalkan` | Pesanan tidak dilanjutkan. |
| Pembayaran | `menunggu` | Belum ada bukti pembayaran yang dikirim. |
| Pembayaran | `bukti_dikirim` | Bukti telah dikirim dan menunggu pemeriksaan admin. |
| Pembayaran | `terverifikasi` | Admin telah mengonfirmasi pembayaran. |

## Hal yang perlu diperhatikan

- Customer sebaiknya menunggu konfirmasi admin sebelum membayar.
- Status pembayaran dan status order adalah dua hal berbeda: bukti dapat sudah dikirim, tetapi produksi baru dapat dimulai setelah pembayaran diverifikasi.
- GoPay belum tersedia meskipun tercantum dalam tipe data internal aplikasi.
- Informasi kurir/resi harus disampaikan melalui tracking manual; aplikasi tidak menghubungi kurir secara otomatis.
