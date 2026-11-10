import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Chrome } from "@/components/Chrome";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://moonindiestore.netlify.app"
  ),
  title: {
    default: "MoonIndieStore — Pemesanan & Produksi",
    template: "%s · MoonIndieStore",
  },
  description:
    "Sistem pemesanan & produksi dengan Firebase + role admin, owner, customer.",
  applicationName: "MoonIndieStore",
  authors: [{ name: "Moon Indie Store" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "MoonIndieStore",
    title: "MoonIndieStore — Pemesanan & Produksi",
    description:
      "Sistem pemesanan & produksi dengan Firebase + role admin, owner, customer.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0f", // sesuaikan dengan moon-ink
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-white text-moon-ink" suppressHydrationWarning>
        <AuthProvider>
          <Chrome>{children}</Chrome>
        </AuthProvider>
      </body>
    </html>
  );
}