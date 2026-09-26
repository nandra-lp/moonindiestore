"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/AuthGuard";
import {
  ArrowRight,
  Calculator,
  PackagePlus,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeEstimasiByPelanggan,
  subscribeOrdersByPelanggan,
  type WithDocId,
} from "@/lib/db";
import { formatRupiah, formatTanggal } from "@/lib/estimasi";
import type { Order, PerkiraanHarga } from "@/types/firestore";
import { Badge, EmptyRow, PageHeader, orderTone } from "@/components/ui";

function CustomerInner() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<WithDocId<Order>[]>([]);
  const [estimasi, setEstimasi] = useState<WithDocId<PerkiraanHarga>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const idp = profile?.id_pelanggan;
    if (!idp) {
      Promise.resolve().then(() => setIsLoading(false));
      return;
    }

    // Listener realtime: badge status dkk. ikut berubah saat admin
    // mengupdate order, tanpa perlu refresh halaman.
    const unsubOrders = subscribeOrdersByPelanggan(
      idp,
      (resOrders) => {
        setOrders(resOrders);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );
    const unsubEstimasi = subscribeEstimasiByPelanggan(idp, setEstimasi);
    return () => {
      unsubOrders();
      unsubEstimasi();
    };
  }, [profile?.id_pelanggan]);

  // Skeleton yang menyerupai layout asli
  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 animate-pulse px-6 py-10">
        <div className="h-4 w-40 rounded bg-zinc-200" />
        <div className="mt-2 h-8 w-2/3 rounded-lg bg-zinc-200" />
        <div className="mt-2 h-4 w-1/2 rounded bg-zinc-100" />
        <div className="mt-6 h-24 rounded-2xl bg-zinc-200" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="h-36 rounded-2xl bg-zinc-100" />
          <div className="h-36 rounded-2xl bg-zinc-100" />
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="h-48 rounded-2xl bg-zinc-100" />
          <div className="h-48 rounded-2xl bg-zinc-100" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <PageHeader
        eyebrow="Dashboard Customer"
        title={`Halo, ${profile?.nama ?? "Customer"}`}
        desc="Kelola estimasi biaya dan pantau progres pesanan Anda."
      />

      {/* CTA utama — gradasi ink brand + aksen kuning */}
      <Link
        href="/customer/pesan"
        className="group relative mt-6 flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-moon-ink p-5 text-white transition hover:brightness-110 sm:p-6"
      >
        <span className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-moon-yellow/20 transition-transform duration-300 group-hover:scale-125" />
        <span className="relative flex min-w-0 items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-moon-yellow text-moon-ink">
            <PackagePlus className="h-6 w-6" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold">Buat pesanan baru</span>
            <span className="block text-sm text-white/70">
              Pilih produk, lampirkan desain custom — langsung tercatat sebagai
              order.
            </span>
          </span>
        </span>
        <span className="relative flex shrink-0 items-center gap-1.5 rounded-full bg-moon-yellow px-4 py-2 text-sm font-semibold text-moon-ink">
          Pesan
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </Link>

      {/* Aksi cepat — aksen brand, konsisten dengan sistem desain */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link
          href="/customer/estimasi"
          className="group flex flex-col justify-between rounded-2xl border border-zinc-200 border-t-4 border-t-moon-yellow bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-moon-ink text-moon-yellow">
              <Calculator className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
              {estimasi.length} Tersimpan
            </span>
          </div>
          <div className="mt-4">
            <h3 className="font-semibold text-moon-ink">
              Kalkulasi Estimasi Baru
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Hitung & simpan perkiraan harga sebelum memesan.
            </p>
          </div>
        </Link>

        <Link
          href="/customer/orders"
          className="group flex flex-col justify-between rounded-2xl border border-zinc-200 border-t-4 border-t-moon-blue bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-moon-blue/10 text-moon-blue">
              <ShoppingCart className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
              {orders.length} Pesanan
            </span>
          </div>
          <div className="mt-4">
            <h3 className="font-semibold text-moon-ink">Lacak Produksi</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Pantau progres produksi pesanan Anda saat ini.
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-10 grid items-start gap-8 md:grid-cols-2">
        {/* Pesanan Terbaru Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-moon-ink">
              Pesanan Terbaru
              <span
                title="Status terupdate otomatis"
                className="flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-600" />
                </span>
                Live
              </span>
            </h2>
            {orders.length > 5 && (
              <Link
                href="/customer/orders"
                className="text-sm font-medium text-moon-blue hover:underline"
              >
                Lihat semua
              </Link>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <ul className="divide-y divide-zinc-100">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/customer/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-moon-yellow/10"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="font-mono text-sm font-medium text-moon-ink">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatTanggal(o.tgl_order)}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="font-semibold text-moon-ink">
                        Rp {o.total_harga.toLocaleString("id-ID")}
                      </span>
                      <Badge tone={orderTone(o.status_order)}>
                        {o.status_order}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
              {orders.length === 0 && (
                <EmptyRow>
                  Belum ada pesanan aktif.{" "}
                  <Link
                    href="/customer/pesan"
                    className="font-medium text-moon-blue hover:underline"
                  >
                    Buat pesanan pertama →
                  </Link>
                </EmptyRow>
              )}
            </ul>
          </div>
        </section>

        {/* Estimasi Terakhir Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-moon-ink">
              Riwayat Estimasi
            </h2>
            {estimasi.length > 5 && (
              <Link
                href="/customer/estimasi"
                className="text-sm font-medium text-moon-blue hover:underline"
              >
                Lihat semua
              </Link>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <ul className="divide-y divide-zinc-100">
              {estimasi.slice(0, 5).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-mono text-sm font-medium text-moon-ink">
                      {e.id_produk.slice(0, 8).toUpperCase()} × {e.jumlah}
                    </span>
                    <Link
                      href={`/customer/pesan?estimasi=${e.id}`}
                      className="mt-0.5 w-fit text-xs font-semibold text-moon-blue hover:underline"
                    >
                      Pesan produk ini →
                    </Link>
                  </div>
                  <span className="shrink-0 font-semibold text-moon-ink">
                    {formatRupiah(e.total_estimasi)}
                  </span>
                </li>
              ))}
              {estimasi.length === 0 && (
                <EmptyRow>
                  Belum ada data estimasi.{" "}
                  <Link
                    href="/customer/estimasi"
                    className="font-medium text-moon-blue hover:underline"
                  >
                    Buat estimasi baru →
                  </Link>
                </EmptyRow>
              )}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CustomerPage() {
  return (
    <RequireRole allow={["customer"]}>
      <CustomerInner />
    </RequireRole>
  );
}
