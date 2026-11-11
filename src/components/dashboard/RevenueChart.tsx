"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { formatRupiah } from "@/lib/estimasi";
import type { WithDocId } from "@/lib/db";
import type { Order } from "@/types/firestore";

interface RevenueChartProps {
  orders: WithDocId<Order>[];
  loading?: boolean;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
];

const AXIS_FORMATTER = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const SKELETON_BAR_HEIGHTS = [38, 62, 46, 74, 56, 88] as const;

export function RevenueChart({ orders, loading = false }: RevenueChartProps) {
  const now = new Date();
  const months = new Map<string, { date: Date; value: number }>();

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.set(key, { date, value: 0 });
  }

  for (const order of orders) {
    if (order.status_order === "dibatalkan") continue;

    const date = order.tgl_order?.toDate?.();
    if (!date || Number.isNaN(date.getTime())) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const month = months.get(key);
    if (month) month.value += order.total_harga || 0;
  }

  const data = Array.from(months.values(), ({ date, value }) => ({
    month: `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`,
    label: MONTH_LABELS[date.getMonth()],
    value,
  }));
  const max = Math.max(0, ...data.map((month) => month.value));
  const total = data.reduce((sum, month) => sum + month.value, 0);
  const firstHalf = data.slice(0, 3).reduce((sum, month) => sum + month.value, 0);
  const secondHalf = data.slice(3).reduce((sum, month) => sum + month.value, 0);
  const trend = secondHalf > firstHalf ? "up" : secondHalf < firstHalf ? "down" : "flat";
  const ticks = [
    { value: max, position: "top" },
    { value: max / 2, position: "middle" },
    { value: 0, position: "bottom" },
  ] as const;

  return (
    <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-moon-ink">
            Pemasukan per bulan
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            6 bulan terakhir, tidak termasuk order dibatalkan
          </p>
        </div>

        {!loading && total > 0 && (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:justify-end">
            <span className="text-xs font-medium text-zinc-500">Total</span>
            <span className="text-xl font-bold text-moon-ink">
              {formatRupiah(total)}
            </span>
            {trend !== "flat" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold">
                {trend === "up" ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-moon-pink" aria-hidden="true" />
                )}
                <span className={trend === "up" ? "text-green-700" : "text-moon-pink"}>
                  {trend === "up" ? "Naik" : "Turun"} dibanding 3 bulan sebelumnya
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3" aria-hidden="true">
          <div className="h-44 animate-pulse rounded bg-zinc-100" />
          <div className="flex h-44 items-end justify-around gap-2">
            {SKELETON_BAR_HEIGHTS.map((height, index) => (
              <div
                key={index}
                className="w-full max-w-12 animate-pulse rounded-t-md bg-zinc-100"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      ) : total === 0 ? (
        <div className="mt-6 rounded-2xl bg-zinc-50 px-5 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-moon-blue/10 text-moon-blue">
            <TrendingUp className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-moon-ink">
            Belum ada pemasukan
          </h3>
          <p className="mx-auto mt-1 max-w-xs text-sm text-zinc-500">
            Order pertama yang tercatat akan muncul di grafik ini.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mt-8 grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3"
            role="img"
            aria-label={`Grafik pemasukan enam bulan terakhir. Total ${formatRupiah(total)}.`}
          >
            <div className="relative h-44 text-right" aria-hidden="true">
              {ticks.map((tick) => (
                <span
                  key={tick.position}
                  className={`absolute right-0 text-[11px] leading-none text-zinc-500 ${
                    tick.position === "top"
                      ? "top-0"
                      : tick.position === "middle"
                        ? "top-1/2 -translate-y-1/2"
                        : "bottom-0"
                  }`}
                >
                  {AXIS_FORMATTER.format(tick.value)}
                </span>
              ))}
            </div>

            <div>
              <div className="relative h-44">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                  {ticks.map((tick) => (
                    <div
                      key={tick.position}
                      className={`absolute inset-x-0 border-t ${
                        tick.position === "top"
                          ? "top-0 border-zinc-200"
                          : tick.position === "middle"
                            ? "top-1/2 border-dashed border-zinc-200"
                            : "bottom-0 border-zinc-300"
                      }`}
                    />
                  ))}
                </div>

                <div className="absolute inset-0 grid grid-cols-6 gap-1 sm:gap-3">
                  {data.map((month) => (
                    <div
                      key={month.month}
                      className="flex h-full min-w-0 items-end justify-center"
                      title={`${month.month}: ${formatRupiah(month.value)}`}
                    >
                      <div
                        className="w-full max-w-12 rounded-t-md bg-moon-blue transition-[height] duration-300 ease-out motion-reduce:transition-none"
                        style={{
                          height: month.value > 0 ? `${Math.max(3, (month.value / max) * 100)}%` : "0%",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-6 gap-1 sm:gap-3">
                {data.map((month) => (
                  <span
                    key={month.month}
                    className="text-center text-[11px] font-medium text-zinc-600"
                    title={month.month}
                  >
                    {month.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <ul className="sr-only" aria-label="Rincian pemasukan bulanan">
            {data.map((month) => (
              <li key={month.month}>{month.month}: {formatRupiah(month.value)}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
