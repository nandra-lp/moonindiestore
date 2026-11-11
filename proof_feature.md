# Unggah bukti pembayaran

## Ringkasan

Fitur ini menyimpan **bukti pembayaran saja** di bucket privat Supabase Storage. Data order tetap berada di Cloud Firestore. Gambar produk, desain custom, dan file lain tetap menggunakan Firebase Storage seperti sebelumnya.

Bucket yang digunakan bernama `payment-proofs`. Migration `supabase/migrations/20261110220000_create_private_payment_proofs_bucket.sql` membuat bucket privat dengan batas 5 MB dan MIME type JPG, PNG, serta WebP. Migration sudah diterapkan ke proyek Supabase.

## Alur unggah

1. Customer memilih file gambar JPG, PNG, atau WebP dengan ukuran maksimal 5 MB. Form menampilkan progres unggah.
2. Aplikasi mengirim Firebase ID token ke `POST /api/payment-proofs/upload-url`.
3. Server memverifikasi token dengan Firebase Admin, lalu membaca order dan profil customer dari Firestore. Server hanya menerbitkan URL unggah jika:
   - pengguna memiliki role `customer` dan email terverifikasi jika diwajibkan oleh profil;
   - order tersebut milik pengguna;
   - order berstatus `diproses`, siap diproses, memakai metode BCA/QRIS, dan pembayaran belum terverifikasi.
4. Server membuat signed upload URL Supabase untuk object key `bukti-pembayaran/{orderId}/{firebaseUid}`. Browser mengunggah file langsung ke URL tersebut; service-role key tidak pernah dikirim ke browser.
5. Setelah unggah selesai, aplikasi menyimpan `status_pembayaran: "bukti_dikirim"` beserta object path di Firestore. Field `bukti_pembayaran_url` berisi penanda `supabase:private`, bukan URL publik.

Jika upload berhasil tetapi penyimpanan Firestore gagal, file tetap berada di Supabase. Customer dapat mencoba menyimpan ulang tanpa harus mengunggah file kembali selama halaman belum ditutup.

## Akses dan penghapusan

- Bucket privat; file tidak dapat dibuka melalui URL publik.
- Customer hanya dapat meminta URL baca untuk bukti order miliknya.
- Admin dan owner dapat meminta URL baca untuk memeriksa bukti.
- Endpoint baca menerbitkan signed URL dengan masa berlaku 60 detik.
- Penghapusan bukti Supabase dilakukan melalui server setelah pemeriksaan role dan order. Ketika order lama masih menunjuk Firebase Storage, proses penghapusan tetap memakai Firebase seperti sebelumnya.
- Bukti Firebase yang sudah tersimpan tetap dapat dibuka melalui URL lama. Bukti lama tidak dipindahkan otomatis.

## Konfigurasi environment

Set variabel berikut untuk aplikasi dan Firebase Cloud Functions:

| Variabel | Penggunaan | Rahasia? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Header API untuk unggah menggunakan signed URL di browser | Tidak; publishable/anon key |
| `PAYMENT_PROOF_API_BASE_URL` | URL Firebase Cloud Function `paymentProofApi`, dipakai proxy server Next.js | Bukan rahasia |
| `SUPABASE_URL` | Parameter Firebase Functions untuk URL proyek Supabase | Bukan rahasia |
| `SUPABASE_SERVICE_ROLE_KEY` | Firebase Secret untuk akses Supabase Storage | **Ya — Firebase Secret saja** |

Atur `PAYMENT_PROOF_API_BASE_URL` di environment hosting Next.js dan redeploy. Jangan simpan secret Supabase di environment browser atau Cloudflare. Sebelum deploy function:

```bash
firebase functions:secrets:set SUPABASE_SERVICE_ROLE_KEY
firebase deploy --only functions:paymentProofApi
```

Firebase CLI meminta nilai `SUPABASE_URL` jika belum dikonfigurasi. Function memakai runtime service account untuk mengakses Firebase Auth dan Firestore; berikan izin Firestore yang diperlukan ke service account tersebut. Jangan kirim atau commit nilai secret. Jika service-role key pernah masuk ke file yang di-commit atau dibagikan, rotasi key itu di Supabase sebelum deployment.

## Deployment

1. Pastikan bucket `payment-proofs` ada, berstatus private, maksimal 5 MB, dan mengizinkan `image/jpeg`, `image/png`, serta `image/webp`. Migration di atas mengatur nilai tersebut.
2. Deploy Cloud Function ke project Firebase yang sama dengan Firebase Auth dan Firestore. Function memakai region `asia-southeast1`.
3. Salin URL hasil deploy ke `PAYMENT_PROOF_API_BASE_URL` pada environment hosting Next.js, lalu redeploy Worker/aplikasi.
4. Uji unggah dengan customer terautentikasi pada order yang eligible. Storage Firebase tidak perlu diaktifkan untuk fitur bukti ini; Firebase Auth dan Firestore tetap diperlukan.

## Pengujian setelah deploy

- Customer dengan order `diproses`, metode BCA/QRIS, status pembayaran `menunggu` dapat mengunggah file yang valid.
- Customer tidak dapat membuat URL unggah untuk order milik pengguna lain.
- Order yang masih `menunggu`, dibatalkan, belum siap, atau sudah terverifikasi tidak dapat menerima bukti.
- File >5 MB atau MIME type selain JPG/PNG/WebP ditolak.
- Setelah unggah, Firestore menyimpan marker `supabase:private`, path object, dan status `bukti_dikirim`.
- Customer dan admin/owner yang berhak dapat membuka bukti melalui signed URL; pengguna lain tidak dapat.
- Gambar produk dan desain custom masih berfungsi memakai Firebase Storage.

## Pemecahan masalah

| Gejala / kode respons | Kemungkinan penyebab | Tindakan |
|---|---|---|
| `401 unauthorized` | Token Firebase hilang, kedaluwarsa, atau tidak valid | Login ulang; pastikan aplikasi mengirim Firebase ID token |
| `403 forbidden` | Bukan pemilik order, role tidak sesuai, atau verifikasi email belum selesai | Periksa role/profil Firestore, UID pemilik order, dan status verifikasi email |
| `409 order-not-payable` | Status order/metode pembayaran belum memenuhi syarat | Pastikan order siap dan berstatus `diproses`, metode BCA/QRIS, serta belum terverifikasi |
| `503 payment-api-unavailable` | `PAYMENT_PROOF_API_BASE_URL` kosong atau tidak valid | Pastikan URL Function benar dan redeploy aplikasi |
| `502 payment-api-unavailable` | Function tidak dapat dijangkau | Periksa status deploy, URL Function, dan log Firebase Functions |
| `503 auth-service-unavailable` | Verifikasi Firebase token gagal karena layanan/konfigurasi | Periksa Firebase Auth, project target, dan log Cloud Functions |
| `502 storage-unavailable` atau `storage-credentials-invalid` | Bucket tidak ada, secret Supabase salah, atau Supabase Storage menolak operasi | Pastikan parameter/secret cocok, bucket `payment-proofs` aktif dan private, lalu periksa log Cloud Functions |
| Upload jaringan gagal/CORS | Browser gagal mengakses endpoint Supabase atau jaringan terputus | Periksa origin situs, Network tab, dan CORS untuk Supabase Storage; jangan mengubah Firebase Storage CORS untuk fitur ini |
| Link bukti tidak dapat dibuka | Marker/path Firestore tidak cocok dengan object di bucket atau signed URL kedaluwarsa | Minta link baru dengan membuka ulang bukti; periksa object `bukti-pembayaran/{orderId}/{uid}` dan field order |

Jangan pernah mengubah bucket menjadi public untuk mengatasi kegagalan akses. Gunakan endpoint aplikasi dan signed URL yang berumur pendek.
