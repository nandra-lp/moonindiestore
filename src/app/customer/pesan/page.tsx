"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Timestamp } from "firebase/firestore";
import qrisImage from "@/images/mis-qris.jpeg";
import { RequireRole } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/Shell";
import { useAuth } from "@/context/AuthContext";
import {
  createOrderDetailsAndTrackingBatch,
  createOrderWithId,
  deleteDocById,
  generateOrderId,
  getEstimasi,
  getPelanggan,
  listProduk,
  type WithDocId,
} from "@/lib/db";
import { COLLECTIONS } from "@/lib/firebase/collections";
import {
  MAX_DESAIN_BYTES,
  hapusFileStorage,
  uploadDesainCustom,
} from "@/lib/storage";
import { formatRupiah } from "@/lib/estimasi";
import type { PaymentMethod, Produk } from "@/types/firestore";
import {
  BackLink,
  Card,
  ErrorBox,
  PageHeader,
  PrimaryButton,
  ProductThumb,
  SuccessBox,
} from "@/components/ui";
import {
  Package,
  Check,
  X,
  AlertCircle,
  FileText,
  Upload,
  CreditCard,
} from "lucide-react";

const inputCls =
  "mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 bg-white text-sm text-moon-ink placeholder:text-zinc-400 transition focus:border-moon-blue focus:outline-none focus:ring-2 focus:ring-moon-blue/15 disabled:cursor-not-allowed disabled:bg-zinc-50";
const labelCls = "block text-sm font-medium text-moon-ink";
const helpCls = "text-sm text-zinc-500";

function PesanInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser, profile } = useAuth();
  const [produkList, setProdukList] = useState<WithDocId<Produk>[]>([]);
  const [idProduk, setIdProduk] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [spesifikasi, setSpesifikasi] = useState("");
  const [desainFile, setDesainFile] = useState<File | null>(null);
  const [desainPreview, setDesainPreview] = useState<string | null>(null);
  const [catatanDesain, setCatatanDesain] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bca");
  const [linkage, setLinkage] = useState<null | { ok: boolean; info: string }>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [estimasiId, setEstimasiId] = useState<string | null>(null);

  const idp = profile?.id_pelanggan ?? null;
  const produk = produkList.find((p) => p.id === idProduk) ?? null;
  const hargaSatuan = produk?.harga_dasar ?? 0;
  const total = hargaSatuan * Math.max(0, jumlah);

  useEffect(() => {
    listProduk().then(setProdukList).catch(() => {});
  }, []);

  useEffect(() => {
    if (!idp || !firebaseUser) return;
    const uid = firebaseUser.uid; 
    getPelanggan(idp)
      .then((p) => {
        if (!p) {
          setLinkage({ ok: false, info: `Dokumen pelanggan "${idp}" tidak ditemukan.` });
        } else if (p.uid !== uid) {
          setLinkage({ ok: false, info: `UID pelanggan ("${p.uid ?? "-"}") beda dengan UID login ("${uid}").` });
        } else {
          setLinkage({ ok: true, info: p.nama });
        }
      })
      .catch(() => setLinkage({ ok: false, info: `Dokumen pelanggan "${idp}" tidak bisa dibaca.` }));
  }, [idp, firebaseUser]);

  useEffect(() => {
    const estimasiParam = searchParams.get("estimasi");
    const produkParam = searchParams.get("produk");

    if (estimasiParam && idp) {
      getEstimasi(estimasiParam)
        .then((e) => {
          if (!e || e.id_pelanggan !== idp) return;
          setEstimasiId(estimasiParam);
          setIdProduk(e.id_produk);
          setJumlah(e.jumlah);
        })
        .catch(() => {});
    } else if (produkParam && idp) {
      listProduk()
        .then((list) => {
          const produk = list.find((p) => p.id === produkParam);
          if (produk) {
            setIdProduk(produkParam);
            setJumlah(1);
          }
        })
        .catch(() => {});
    }
  }, [searchParams, idp]);

  function onDesainChange(f: File | null) {
    if (f && f.size > MAX_DESAIN_BYTES) {
      setMsg("Ukuran file desain maksimal 10 MB.");
      setDesainFile(null);
      setDesainPreview(null);
      return;
    }
    setDesainFile(f);
    setDesainPreview(f ? URL.createObjectURL(f) : null);
    if (f) setMsg(null);
  }

  async function langkah<T>(nama: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      throw new Error(`${nama} → ${raw}`);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) {
      setMsg("Sesi login belum termuat. Muat ulang halaman, lalu coba lagi.");
      return;
    }
    if (!idp) {
      setMsg("Profil pelanggan belum termuat. Muat ulang halaman.");
      return;
    }
    if (!produk) {
      setMsg("Pilih produk dulu.");
      return;
    }
    if (jumlah < 1) {
      setMsg("Jumlah minimal 1.");
      return;
    }
    setBusy(true);
    setMsg(null);
    setSuccessMsg(null);

    let orderId: string | null = null;
    const desainPaths: string[] = [];

    try {
      const newOrderId = generateOrderId();
      orderId = newOrderId;

      const newOrder = {
        id_pelanggan: idp,
        uid_pelanggan: firebaseUser.uid,
        order_siap: false,
        tgl_order: Timestamp.now(),
        total_harga: total,
        status_order: "menunggu" as const,
        metode_pembayaran: paymentMethod,
        status_pembayaran: "menunggu" as const,
        bukti_pembayaran_url: null,
        bukti_pembayaran_path: null,
        waktu_pembayaran: null,
        estimasi_selesai: null,
        id_estimasi: estimasiId,
      };

      await langkah("membuat pesanan", () =>
        createOrderWithId(newOrderId, newOrder)
      );

      try {
        let desain_url: string | null = null;
        let desain_path: string | null = null;
        if (desainFile) {
          const up = await langkah("mengunggah desain", () =>
            uploadDesainCustom(desainFile, newOrderId)
          );
          desain_url = up.url;
          desain_path = up.path;
          desainPaths.push(up.path);
        }

        await langkah("menyimpan pesanan ke database", () =>
          createOrderDetailsAndTrackingBatch(
            newOrderId,
            {
              id_produk: produk.id,
              jumlah,
              harga_satuan: hargaSatuan,
              subtotal: total,
              spesifikasi: spesifikasi.trim(),
              desain_url,
              desain_path,
              catatan_desain: catatanDesain.trim(),
            },
            {
              status: "Order dibuat",
              waktu: Timestamp.now(),
              keterangan: "Menunggu konfirmasi admin.",
            }
          )
        );
      } catch (inner) {
        await Promise.all([
          ...desainPaths.map((p) => hapusFileStorage(p)),
          deleteDocById(COLLECTIONS.orders, newOrderId),
        ]);
        throw inner;
      }

      setSuccessMsg("Pesanan berhasil dikirim. Mengarahkan ke detail pesanan…");
      setTimeout(() => router.push(`/customer/orders/${orderId}`), 900);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Coba lagi.";
      const isIzin = /permission|insufficient|PERMISSION_DENIED/i.test(raw);
      setMsg(
        `Gagal membuat pesanan: ${raw}` +
          (isIzin
            ? " Kemungkinan: (1) firestore.rules terbaru belum di-Publish di Firebase Console, atau (2) akun tidak tertaut ke data pelanggan. Minta admin memeriksa keduanya."
            : "")
      );
    } finally {
      setBusy(false);
    }
  }

  if (produkList.length === 0) {
    return (
      <DashboardShell role="customer" title="Pesanan Baru" contain="5xl" className="space-y-6">
        <BackLink href="/customer">Kembali ke Dashboard</BackLink>
        <Card className="border-zinc-200 px-5 py-16 text-center sm:py-20">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-moon-yellow/20 text-moon-ink">
            <Package className="h-7 w-7" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-moon-ink">Katalog belum tersedia</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Belum ada produk yang dapat dipesan. Silakan kembali lagi setelah katalog diperbarui.
          </p>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="customer" title="Pesanan Baru" contain="6xl" className="space-y-0">
      <BackLink href="/customer">Kembali ke Dashboard</BackLink>

      <PageHeader
        eyebrow="Pesanan custom"
        title="Mulai pesanan baru"
        desc="Pilih produk, jelaskan spesifikasi, lampirkan desain, lalu kirim untuk ditinjau admin."
      />

      {/* 1. Pilih produk — lebar penuh di semua layar */}
      <Card className="overflow-hidden border-zinc-200 p-0">
        <div className="border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-moon-ink">Pilih produk</h2>
            <p className="mt-1 text-sm text-zinc-500">Pilih satu produk yang ingin Anda pesan.</p>
          </div>
          {produk && (
            <p className="text-sm font-medium text-moon-blue">
              Dipilih: {produk.nama_produk}
            </p>
          )}
        </div>
        <div
          role="group"
          aria-label="Pilih produk"
          className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-5 lg:grid-cols-4 xl:grid-cols-5"
        >
          {produkList.map((p) => {
            const selected = idProduk === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setIdProduk(p.id)}
                aria-pressed={selected}
                className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue sm:p-4 ${
                  selected
                    ? "border-moon-ink bg-moon-yellow/10 ring-2 ring-moon-yellow/60"
                    : "border-zinc-200 bg-white hover:border-zinc-400"
                }`}
              >
                {selected && (
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-moon-ink text-moon-yellow shadow-sm"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
                <div className="flex h-24 items-center justify-center overflow-hidden rounded-xl bg-zinc-50 sm:h-32">
                  <ProductThumb
                    url={p.gambar_url}
                    nama={p.nama_produk}
                    jenis={p.jenis_produk}
                    size="lg"
                  />
                </div>
                <div className="mt-3 min-w-0">
                  <p className="truncate text-sm font-semibold text-moon-ink">{p.nama_produk}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatRupiah(p.harga_dasar)} <span className="text-zinc-400">/ {p.satuan}</span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 2. Layout dua kolom: form di kiri, ringkasan di kanan (desktop). Mobile: bertumpuk. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px] lg:gap-8">
        {/* Form kirim pesanan */}
        <Card className="order-first border-zinc-200 p-0 lg:order-first">
          <form onSubmit={onSubmit} className="space-y-0">
            {/* Spesifikasi */}
            <section aria-labelledby="spec-heading" className="space-y-5 border-b border-zinc-100 px-5 py-6 sm:px-7">
              <div>
                <h3 id="spec-heading" className="flex items-center gap-2 text-base font-semibold text-moon-ink">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-moon-yellow/20 text-moon-ink">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </span>
                  Spesifikasi produk
                </h3>
                <p className="mt-1 pl-10 text-sm text-zinc-500">
                  Beri tahu detail yang dibutuhkan untuk produksi.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelCls}>
                  Jumlah <span className="font-normal text-zinc-500">({produk?.satuan ?? "pcs"})</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={jumlah}
                    onChange={(e) => setJumlah(Number(e.target.value))}
                    className={inputCls}
                    disabled={!produk}
                    aria-describedby={produk ? undefined : "qty-help"}
                  />
                  {!produk && <p id="qty-help" className={`mt-2 ${helpCls}`}>Pilih produk terlebih dahulu</p>}
                </label>
              </div>

              <label className={labelCls}>
                Spesifikasi <span className="font-normal text-zinc-500">(ukuran, bahan, warna, finishing, dll.)</span>
                <textarea
                  rows={4}
                  value={spesifikasi}
                  onChange={(e) => setSpesifikasi(e.target.value)}
                  placeholder="Contoh: Paper bag kraft 20×30 cm, laminasi doff, tali paper twisted hitam, logo full color 1 sisi"
                  className={inputCls}
                  disabled={!produk}
                />
              </label>
            </section>

            {/* Desain custom */}
            <section aria-labelledby="design-heading" className="space-y-5 border-b border-zinc-100 px-5 py-6 sm:px-7">
              <div>
                <h3 id="design-heading" className="flex items-center gap-2 text-base font-semibold text-moon-ink">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-moon-blue/10 text-moon-blue">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                  </span>
                  Desain custom <span className="text-sm font-normal text-zinc-500">(opsional)</span>
                </h3>
                <p className="mt-1 pl-10 text-sm leading-6 text-zinc-500">
                  Lampirkan JPG, PNG, WebP, atau PDF hingga 10 MB. Admin akan mengecek kelayakan cetak.
                </p>
              </div>

              <div className="relative">
                <label className="group flex cursor-pointer flex-col items-start gap-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 p-4 transition-colors hover:border-moon-blue/50 hover:bg-moon-blue/5 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-moon-blue has-[input:focus-visible]:outline-offset-2 sm:flex-row sm:items-center sm:p-5">
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    onChange={(e) => onDesainChange(e.target.files?.[0] ?? null)}
                    className="sr-only"
                    disabled={!produk}
                    aria-label="Pilih file desain custom"
                  />
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-zinc-200 transition-colors group-hover:ring-moon-blue/30">
                    {desainPreview ? (
                      desainFile?.type === "application/pdf" ? (
                        <span className="text-4xl" aria-hidden="true">📄</span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element -- pratinjau blob lokal
                        <img
                          src={desainPreview}
                          alt="Pratinjau desain custom"
                          className="h-20 w-20 rounded-xl object-cover"
                        />
                      )
                    ) : (
                      <span className="text-4xl" aria-hidden="true">🎨</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="break-all font-medium text-moon-ink group-hover:text-moon-blue">
                      {desainFile ? desainFile.name : "Klik atau tarik file desain ke sini"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      {desainFile
                        ? `${(desainFile.size / 1024 / 1024).toFixed(2)} MB • JPG, PNG, WebP, PDF max 10 MB`
                        : "JPG, PNG, WebP, PDF maksimal 10 MB"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-moon-ink ring-1 ring-zinc-200">
                    {desainFile ? "Ganti file" : "Pilih file"}
                  </span>
                </label>
                {desainFile && (
                  <button
                    type="button"
                    onClick={() => onDesainChange(null)}
                    className="absolute right-2 top-2 rounded-full bg-white p-2 text-zinc-400 shadow-sm ring-1 ring-zinc-200 transition-colors hover:bg-moon-pink/10 hover:text-moon-pink focus-visible:outline-2 focus-visible:outline-moon-blue"
                    aria-label="Hapus file desain"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  </button>
                )}
              </div>

              <label className={labelCls}>
                Catatan untuk produksi
                <textarea
                  rows={2}
                  value={catatanDesain}
                  onChange={(e) => setCatatanDesain(e.target.value)}
                  placeholder="Contoh: Logo di tengah, warna dasar hitam, teks putih, area cetak full bleed"
                  className={inputCls}
                  disabled={!produk}
                />
              </label>
            </section>

            {/* Pembayaran */}
            <section aria-labelledby="payment-heading" className="space-y-5 px-5 pb-8 sm:px-7 sm:pb-10">
              <div>
                <h3 id="payment-heading" className="flex items-center gap-2 text-base font-semibold text-moon-ink">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-moon-yellow/20 text-moon-ink">
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                  </span>
                  Metode pembayaran
                </h3>
                <p className="mt-1 pl-10 text-sm text-zinc-500">
                  Pembayaran dilakukan setelah admin mengonfirmasi pesanan dan total akhir.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-moon-blue/20 ${
                  paymentMethod === "bca"
                    ? "border-moon-ink bg-moon-yellow/10"
                    : "border-zinc-200 bg-white hover:border-zinc-400"
                }`}>
                  <input
                    type="radio"
                    name="metode-pembayaran"
                    value="bca"
                    checked={paymentMethod === "bca"}
                    onChange={() => setPaymentMethod("bca")}
                    className="mt-1 accent-moon-ink"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold text-moon-ink">Transfer BCA</span>
                    <span className="mt-1 block break-words text-sm text-zinc-600">
                      4750477785 a.n. Rafsan Jani
                    </span>
                  </span>
                </label>
                <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-moon-blue/20 ${
                  paymentMethod === "qris"
                    ? "border-moon-ink bg-moon-yellow/10"
                    : "border-zinc-200 bg-white hover:border-zinc-400"
                }`}>
                  <input
                    type="radio"
                    name="metode-pembayaran"
                    value="qris"
                    checked={paymentMethod === "qris"}
                    onChange={() => setPaymentMethod("qris")}
                    className="mt-1 accent-moon-ink"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold text-moon-ink">QRIS</span>
                    <span className="mt-1 block text-sm text-zinc-600">
                      Bayar melalui mobile banking atau e-wallet.
                    </span>
                  </span>
                </label>
              </div>
              {paymentMethod === "qris" && (
                <div className="grid gap-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-[minmax(0,336px)_minmax(0,1fr)] sm:items-center sm:p-5">
                  <div className="mx-auto w-full max-w-[336px] rounded-xl bg-white p-3 ring-1 ring-zinc-200 sm:mx-0">
                    <Image
                      src={qrisImage}
                      alt="Kode QRIS Moon Indie Store untuk pembayaran"
                      width={648}
                      height={642}
                      unoptimized
                      className="block h-auto w-full object-contain"
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="font-semibold text-moon-ink">Kode QRIS siap dipindai</h4>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      Gunakan fitur scan di mobile banking atau e-wallet. Pindai dari perangkat lain, atau buka kode ukuran penuh jika aplikasi mendukung scan dari galeri.
                    </p>
                    <a
                      href={qrisImage.src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex rounded-lg font-medium text-moon-blue underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-moon-blue focus-visible:outline-offset-4"
                    >
                      Buka kode QRIS ukuran penuh
                    </a>
                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                      Lakukan pembayaran setelah admin mengonfirmasi total pesanan.
                    </p>
                  </div>
                </div>
              )}
              <p className="text-xs leading-5 text-zinc-500">
                GoPay belum tersedia. Jangan melakukan pembayaran sebelum total akhir dikonfirmasi admin.
              </p>

              {/* Linkage status */}
              {linkage && !linkage.ok && (
                <div className="mt-6 rounded-xl border border-moon-pink/30 bg-moon-pink/5 p-4 sm:mt-8" role="alert">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-moon-pink" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-moon-ink">Akun belum tertaut ke data pelanggan</p>
                      <p className="mt-1 text-sm text-zinc-600">{linkage.info}</p>
                      <p className="mt-2 text-xs text-zinc-500">Pesanan tidak bisa dikirim sebelum admin memperbaiki tautan akun.</p>
                    </div>
                  </div>
                </div>
              )}
              {linkage?.ok && (
                <div className="mt-6 rounded-xl border border-green-600/20 bg-green-50 p-3 sm:mt-8">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                    <span className="h-4 w-4 shrink-0" aria-hidden="true">✓</span>
                    Akun tertaut: <span className="font-normal">{linkage.info}</span>
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-3">
                {msg && <ErrorBox>{msg}</ErrorBox>}
                {successMsg && <SuccessBox>{successMsg}</SuccessBox>}
              </div>

              <PrimaryButton
                type="submit"
                disabled={busy || !produk || (linkage !== null && !linkage.ok)}
                className="mt-8 min-h-12 w-full rounded-xl"
              >
                {busy ? "Membuat pesanan…" : "Kirim pesanan"}
              </PrimaryButton>
              <p className="mt-3 text-center text-xs leading-5 text-zinc-500">
                Pesanan akan ditinjau admin sebelum pembayaran dan proses produksi.
              </p>
            </section>
          </form>
        </Card>

        {/* Ringkasan pesanan — kanan, menempel di desktop */}
        <aside className="order-last lg:order-last lg:sticky lg:top-24">
          <Card className="border-moon-yellow/40 bg-white p-0">
            <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-moon-ink">Ringkasan pesanan</h2>
              <p className="mt-1 text-sm text-zinc-500">Perkiraan awal sebelum konfirmasi admin.</p>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              {produk ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-500">Produk</p>
                      <p className="mt-1 break-words font-medium text-moon-ink">{produk.nama_produk}</p>
                    </div>
                    <p className="shrink-0 text-right text-sm font-medium text-moon-ink">
                      {formatRupiah(hargaSatuan)}
                      <span className="block text-xs font-normal text-zinc-500">/ {produk.satuan}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-100 pt-4 text-sm">
                    <span className="text-zinc-600">Jumlah</span>
                    <span className="flex items-center gap-1.5 font-medium text-moon-ink">
                      {jumlah}
                      <span className="text-xs font-normal text-zinc-500">{produk.satuan}</span>
                    </span>
                  </div>
                  <div className="rounded-xl bg-moon-ink p-4 text-white">
                    <p className="text-xs text-white/65">Total estimasi</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-moon-yellow">
                      {formatRupiah(total)}
                    </p>
                  </div>
                </>
              ) : (
                <p className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                  Pilih produk untuk melihat ringkasan harga.
                </p>
              )}
              <p className="text-xs leading-5 text-zinc-500">
                Total akhir akan dikonfirmasi admin setelah desain dan spesifikasi ditinjau.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </DashboardShell>
  );
}

export default function PesanPage() {
  return (
    <RequireRole allow={["customer"]}>
      <Suspense>
        <PesanInner />
      </Suspense>
    </RequireRole>
  );
}
