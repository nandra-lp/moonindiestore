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
    case "auth/network-request-failed":
      return "Periksa koneksi internetmu lalu coba lagi.";
    default:
      // Teruskan pesan non-Firebase (mis. error logika aplikasi sendiri).
      if (err instanceof Error && err.message && !err.message.startsWith("Firebase:")) {
        return err.message;
      }
      return fallback;
  }
}
