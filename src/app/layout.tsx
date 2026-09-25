import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MoonIndieStore — Pemesanan & Produksi",
  description:
    "Sistem pemesanan & produksi dengan Firebase + role admin, owner, customer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-white text-moon-ink" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          {children}
          <footer className="mt-auto bg-moon-ink py-4 text-center text-xs text-white/60">
            Moon Indie Store • Printing
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
