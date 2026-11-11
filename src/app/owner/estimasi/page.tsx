"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CircleDollarSign,
  Search,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { RequireRole } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/Shell";
import {
  listEstimasiRecent,
  listOrdersByEstimasiIds,
  type WithDocId,
} from "@/lib/db";
import { usePelangganMap, useProdukMap } from "@/hooks/useLookup";
import { formatRupiah, formatTanggal } from "@/lib/estimasi";
import type { Order, PerkiraanHarga } from "@/types/firestore";
import { BackLink, Badge, Card, PageHeader, Stat } from "@/components/ui";

type EstimateFilter = "all" | "open" | "converted";

const PAGE_SIZE = 12;

function groupOrdersByEstimate(orders: WithDocId<Order>[]) {
  const grouped: Record<string, WithDocId<Order>[]> = {};
  for (const order of orders) {
    if (!order.id_estimasi) continue;
    (grouped[order.id_estimasi] ??= []).push(order);
  }
  return grouped;
}

function OwnerEstimasiInner() {
  const [rows, setRows] = useState<WithDocId<PerkiraanHarga>[]>([]);
  const [ordersByEstimate, setOrdersByEstimate] = useState<
    Record<string, WithDocId<Order>[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [filter, setFilter] = useState<EstimateFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const namaPelanggan = usePelangganMap();
  const namaProduk = useProdukMap();

  useEffect(() => {
    let active = true;

    async function loadEstimates() {
      setLoading(true);
      setError(null);
      try {
        const estimates = await listEstimasiRecent(50);
        const orders = await listOrdersByEstimasiIds(estimates.map((row) => row.id));
        if (!active) return;
        setPage(1);
        setRows(estimates);
        setOrdersByEstimate(groupOrdersByEstimate(orders));
      } catch {
        if (active) setError("Data estimasi pendapatan gagal dimuat. Coba muat ulang.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadEstimates();
    return () => {
      active = false;
    };
  }, [retryCount]);

  const convertedIds = useMemo(
    () =>
      new Set(
        Object.entries(ordersByEstimate)
          .filter(([, orders]) => orders.some((order) => order.status_order !== "dibatalkan"))
          .map(([id]) => id)
      ),
    [ordersByEstimate]
  );

  const metrics = useMemo(() => {
    const estimatedValue = rows.reduce((sum, row) => sum + (row.total_estimasi || 0), 0);
    const pendingValue = rows.reduce(
      (sum, row) => sum + (convertedIds.has(row.id) ? 0 : row.total_estimasi || 0),
      0
    );
    const relatedOrders = Object.values(ordersByEstimate).flat();
    const activeOrderValue = relatedOrders
      .filter((order) => order.status_order !== "dibatalkan")
      .reduce((sum, order) => sum + (order.total_harga || 0), 0);

    return {
      estimatedValue,
      pendingValue,
      activeOrderValue,
      convertedCount: convertedIds.size,
      conversionRate: rows.length ? Math.round((convertedIds.size / rows.length) * 100) : 0,
    };
  }, [rows, ordersByEstimate, convertedIds]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("id-ID");
    return rows.filter((row) => {
      const converted = convertedIds.has(row.id);
      if (filter === "open" && converted) return false;
      if (filter === "converted" && !converted) return false;
      if (!normalizedSearch) return true;

      const customer = namaPelanggan[row.id_pelanggan] ?? "";
      const product = namaProduk[row.id_produk] ?? "";
      const searchable = [
        customer,
        product,
        row.id,
        row.id_pelanggan,
        row.id_produk,
      ]
        .join(" ")
        .toLocaleLowerCase("id-ID");
      return searchable.includes(normalizedSearch);
    });
  }, [rows, filter, search, convertedIds, namaPelanggan, namaProduk]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const counts = {
    all: rows.length,
    open: rows.length - metrics.convertedCount,
    converted: metrics.convertedCount,
  };

  return (
    <DashboardShell role="owner" title="Estimasi Pendapatan" contain="6xl">
      <BackLink href="/owner">Dashboard owner</BackLink>
      <div className="mt-2">
        <PageHeader
          eyebrow="Owner · Estimasi"
          title="Estimasi pendapatan"
          desc="Pantau nilai estimasi, konversi menjadi pesanan, dan nilai pesanan terkait."
        />
      </div>

      {error ? (
        <Card className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p role="alert" className="text-sm text-moon-pink">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setRetryCount((count) => count + 1);
            }}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-moon-ink transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
          >
            Coba lagi
          </button>
        </Card>
      ) : (
        <>
          {loading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-white"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat
                  label="Nilai estimasi"
                  value={formatRupiah(metrics.estimatedValue)}
                  accent="blue"
                  icon={<CircleDollarSign className="h-4 w-4" aria-hidden="true" />}
                />
                <Stat
                  label="Potensi tanpa pesanan aktif"
                  value={formatRupiah(metrics.pendingValue)}
                  accent="yellow"
                  icon={<ShoppingBag className="h-4 w-4" aria-hidden="true" />}
                />
                <Stat
                  label="Nilai pesanan non-batal"
                  value={formatRupiah(metrics.activeOrderValue)}
                  accent="pink"
                  icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
                />
                <Stat
                  label="Estimasi jadi pesanan"
                  value={`${metrics.conversionRate}%`}
                  accent="blue"
                  icon={<ArrowUpRight className="h-4 w-4" aria-hidden="true" />}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                <p>Ringkasan dari maksimal 50 estimasi terbaru.</p>
                <p>
                  {metrics.convertedCount} dari {rows.length} estimasi terhubung ke pesanan aktif
                </p>
              </div>
            </>
          )}

          <section aria-label="Daftar estimasi pendapatan" className="mt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold tracking-tight text-moon-ink">
                Rincian estimasi
              </h2>
              <label className="relative block w-full sm:max-w-xs">
                <span className="sr-only">Cari nama pelanggan, produk, atau ID</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari pelanggan atau produk"
                  className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm text-moon-ink outline-none transition focus:border-moon-blue focus:ring-2 focus:ring-moon-blue/20"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter konversi estimasi">
              {([
                ["all", "Semua"],
                ["open", "Belum ada pesanan aktif"],
                ["converted", "Ada pesanan aktif"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => {
                    setFilter(key);
                    setPage(1);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue ${
                    filter === key
                      ? "border-moon-ink bg-moon-ink text-moon-yellow"
                      : "border-zinc-300 bg-white text-zinc-600 hover:border-moon-blue hover:text-moon-blue"
                  }`}
                >
                  {label} ({counts[key]})
                </button>
              ))}
            </div>

            {loading ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Memuat estimasi">
                {Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={index}
                    className="h-56 animate-pulse rounded-2xl border border-zinc-200 bg-white"
                  />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <Card className="mt-5 py-10 text-center">
                <p className="font-semibold text-moon-ink">Belum ada estimasi tersimpan</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Estimasi pendapatan pelanggan akan muncul di sini.
                </p>
              </Card>
            ) : filteredRows.length === 0 ? (
              <Card className="mt-5 py-10 text-center">
                <p className="font-semibold text-moon-ink">Tidak ada hasil yang cocok</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Coba ubah kata pencarian atau filter konversi.
                </p>
              </Card>
            ) : (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleRows.map((estimate) => {
                    const relatedOrders = ordersByEstimate[estimate.id] ?? [];
                    const activeOrders = relatedOrders.filter(
                      (order) => order.status_order !== "dibatalkan"
                    );
                    const converted = activeOrders.length > 0;
                    const canceled = relatedOrders.length > 0 && !converted;
                    const linkedRevenue = activeOrders.reduce(
                      (sum, order) => sum + (order.total_harga || 0),
                      0
                    );
                    const latestOrder = activeOrders[0] ?? relatedOrders[0];
                    const customerName =
                      namaPelanggan[estimate.id_pelanggan] ??
                      `Pelanggan #${estimate.id_pelanggan.slice(0, 8)}`;
                    const productName =
                      namaProduk[estimate.id_produk] ??
                      `Produk #${estimate.id_produk.slice(0, 8)}`;

                    return (
                      <article
                        key={estimate.id}
                        className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(10,10,10,0.05)]"
                      >
                        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-moon-ink" title={customerName}>
                              {customerName}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {formatTanggal(estimate.tanggal)}
                            </p>
                          </div>
                          <Badge tone={converted ? "green" : canceled ? "pink" : "zinc"}>
                            {converted
                              ? "Ada pesanan aktif"
                              : canceled
                                ? "Semua pesanan dibatalkan"
                                : "Belum ada pesanan"}
                          </Badge>
                        </div>

                        <div className="mt-4 min-w-0">
                          <p className="truncate text-base font-semibold text-moon-ink" title={productName}>
                            {productName}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500">
                            Jumlah {estimate.jumlah}
                          </p>
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl bg-zinc-50 p-3 text-sm">
                          <div>
                            <dt className="text-xs text-zinc-500">Harga satuan</dt>
                            <dd className="mt-0.5 font-medium text-zinc-700">
                              {formatRupiah(estimate.harga_satuan)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-zinc-500">Bahan & produksi</dt>
                            <dd className="mt-0.5 font-medium text-zinc-700">
                              {formatRupiah(estimate.biaya_bahan + estimate.biaya_produksi)}
                            </dd>
                          </div>
                          {converted && (
                            <div className="col-span-2 border-t border-zinc-200 pt-2">
                              <dt className="text-xs text-zinc-500">Nilai pesanan aktif</dt>
                              <dd className="mt-0.5 font-semibold text-green-700">
                                {formatRupiah(linkedRevenue)}
                              </dd>
                            </div>
                          )}
                        </dl>

                        <div className="mt-auto flex items-end justify-between gap-3 border-t border-zinc-100 pt-4">
                          <div className="min-w-0">
                            <p className="text-xs text-zinc-500">Nilai estimasi</p>
                            <p className="mt-0.5 break-words text-lg font-bold text-moon-ink">
                              {formatRupiah(estimate.total_estimasi)}
                            </p>
                          </div>
                          {latestOrder && (
                            <Link
                              href={`/owner/orders/${latestOrder.id}`}
                              className="inline-flex shrink-0 items-center gap-1 rounded-sm text-xs font-semibold text-moon-blue hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
                            >
                              Lihat pesanan
                              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                        {relatedOrders.length > 1 && (
                          <p className="mt-2 text-right text-xs text-zinc-500">
                            {relatedOrders.length} pesanan terkait
                          </p>
                        )}
                        {latestOrder && (
                          <p className="mt-1 text-right text-xs text-zinc-500">
                            Status pesanan:{" "}
                            <span className="font-medium text-zinc-700">
                              {latestOrder.status_order}
                            </span>
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-zinc-500">
                    Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, filteredRows.length)}–
                    {Math.min(page * PAGE_SIZE, filteredRows.length)} dari {filteredRows.length} hasil
                  </p>
                  {pageCount > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        className="rounded-full border border-zinc-300 px-4 py-2 font-medium text-zinc-700 transition hover:border-moon-blue hover:text-moon-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Sebelumnya
                      </button>
                      <span className="min-w-16 text-center text-xs text-zinc-500">
                        {page} / {pageCount}
                      </span>
                      <button
                        type="button"
                        disabled={page === pageCount}
                        onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                        className="rounded-full border border-zinc-300 px-4 py-2 font-medium text-zinc-700 transition hover:border-moon-blue hover:text-moon-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Berikutnya
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </DashboardShell>
  );
}

export default function OwnerEstimasiPage() {
  return (
    <RequireRole allow={["owner"]}>
      <OwnerEstimasiInner />
    </RequireRole>
  );
}
