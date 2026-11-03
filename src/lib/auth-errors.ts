// Memetakan error Firebase Auth ke pesan Bahasa Indonesia yang ramah user.
// Pesan mentah Firebase ("Firebase: Error (auth/...)") jangan ditampilkan langsung.
export function pesanErrorAuth(err: unknown, fallback = "Terjadi kesalahan. Coba lagi."): string {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  switch (code) {
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/missing-password":
      return "Password wajib diisi.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email atau password salah.";
    case "auth/user-disabled":
      return "Akun ini dinonaktifkan. Hubungi admin.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
    case "auth/email-already-verified":
      return "Email akun ini sudah terverifikasi.";
    case "auth/unauthorized-continue-uri":
    case "auth/invalid-continue-uri":
      return "Domain aplikasi belum diizinkan untuk tautan verifikasi. Tambahkan domain ini di Firebase Console > Authentication > Settings > Authorized domains.";
    case "auth/operation-not-allowed":
      return "Metode Email/Password belum aktif. Aktifkan di Firebase Console > Authentication > Sign-in method.";
    case "auth/quota-exceeded":
      return "Batas pengiriman email Firebase tercapai. Coba lagi nanti atau periksa kuota Authentication di Firebase Console.";
    case "auth/network-request-failed":
      return "Periksa koneksi internetmu lalu coba lagi.";
    case "auth/user-token-expired":
      return "Sesi akun sudah kedaluwarsa. Keluar lalu masuk kembali untuk mengirim email verifikasi.";
    default:
      // Teruskan pesan non-Firebase (mis. error logika aplikasi sendiri).
      if (err instanceof Error && err.message && !err.message.startsWith("Firebase:")) {
        return err.message;
      }
      return fallback;
  }
}
