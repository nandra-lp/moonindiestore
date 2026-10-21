"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { RequireRole } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/Shell";
import { useAuth } from "@/context/AuthContext";
import {
  generateOrderId,
  createOrderWithDetailsBatch,
  getEstimasi,
  getPelanggan,
  listProduk,
  type WithDocId,
} from "@/lib/db";
import {
  MAX_DESAIN_BYTES,
  hapusFileStorage,
  uploadDesainCustom,
} from "@/lib/storage";
import { formatRupiah } from "@/lib/estimasi";
import type { Produk } from "@/types/firestore";
import {
  BackLink,
  Card,
  ErrorBox,
  PageHeader,
  PrimaryButton,
  ProductThumb,
} from "@/components/ui";
import { Package, Check, X, AlertCircle, FileText, Upload } from "lucide-react";

const inputCls = "mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 bg-white transition focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20";
const labelCls = "block text-base font-medium text-ink mb-1";
const helpCls = "text-sm text-zinc-500";

function PesanInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser, profile } = useAuth();
  const [produkList, setProdukList] = useState<WithDocId<Produk>[]>([]);
  const [idProduk, setIdProduk] = useState("");
  const [jumlah, setJumlah] = useState(100);
  const [spesifikasi, setSpesifikasi] = useState("");
  const [desainFile, setDesainFile] = useState<File | null>(null);
  const [desainPreview, setDesainPreview] = useState<string | null>(null);
  const [catatanDesain, setCatatanDesain] = useState("");
  const [linkage, setLinkage] = useState<null | { ok: boolean; info: string }>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
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
      // Support direct product selection from KatalogPreview
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

    let orderId: string | null = null;
    const desainPaths: string[] = [];

    try {
      const newOrderId = generateOrderId();
      orderId = newOrderId;

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

      try {
        await langkah("menyimpan pesanan ke database", () =>
          createOrderWithDetailsBatch(
            newOrderId,
            {
              id_pelanggan: idp,
              tgl_order: Timestamp.now(),
              total_harga: total,
              status_order: "menunggu",
              estimasi_selesai: null,
              id_estimasi: estimasiId,
            },
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
        await Promise.allSettled(desainPaths.map((p) => hapusFileStorage(p)));
        throw inner;
      }

      router.push(`/customer/orders/${orderId}`);
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

  return (
    <DashboardShell role="customer" title="Pesanan Baru" contain="6xl" className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <BackLink href="/customer">Kembali</BackLink>
        <div className="flex-1">
          <PageHeader
            eyebrow="Customer"
            title="Pesanan baru"
            desc="Isi spesifikasi, lampirkan desain, kirim untuk diproses."
          />
        </div>
      </div>

      {produkList.length === 0 ? (
        <Card className="py-16 text-center border-zinc-200">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/15">
            <Package className="h-8 w-8 text-ink" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-bold text-ink">Belum ada produk</h3>
          <p className="mt-2 text-sm text-zinc-600 max-w-md mx-auto">
            Katalog masih kosong. Mintalah admin menambah produk di{" "}
            <code className="bg-cream px-1.5 py-0.5 rounded text-xs font-mono text-ink">/admin/produk</code>
            {" agar kamu bisa memesan."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Product Selection — Sample Cards */}
          <Card className="p-0 border-zinc-200">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="text-lg font-bold text-ink">Pilih produk</h2>
            </div>
            <div
              role="group"
              aria-label="Pilih produk"
              className="p-5 md:p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {produkList.map((p) => {
                const selected = idProduk === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setIdProduk(p.id)}
                    aria-pressed={selected}
                    className={`relative group overflow-hidden rounded-xl border bg-white p-5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${
                      selected
                        ? "border-gold ring-2 ring-gold/40 shadow-none"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {selected && (
                      <span
                        aria-hidden="true"
                        className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-ink"
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                    <ProductThumb url={p.gambar_url} nama={p.nama_produk} size="lg" />
                    <div className="mt-4 text-center">
                      <p className="font-medium text-ink line-clamp-1">{p.nama_produk}</p>
                      <p className="mt-2 text-sm text-zinc-500 font-mono">
                        {formatRupiah(p.harga_dasar)} <span className="text-zinc-400">/{p.satuan}</span>
                      </p>
                    </div>
                    <span className="absolute inset-0" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Form + Sticky Quote */}
          <div className="space-y-6">
            <Card className="border-zinc-200">
              <form onSubmit={onSubmit} className="p-6 md:p-8 space-y-7">
                {/* Spesifikasi Section */}
                <section aria-labelledby="spec-heading" className="space-y-5 pb-6 border-b border-zinc-100">
                  <h3 id="spec-heading" className="text-base font-semibold text-ink flex items-center gap-2">
                    <FileText className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                    Spesifikasi
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className={labelCls}>
                      Jumlah <span className="text-zinc-500 font-normal">({produk?.satuan ?? "pcs"})</span>
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
                      {!produk && <p id="qty-help" className={helpCls}>Pilih produk terlebih dahulu</p>}
                    </label>
                  </div>

                  <label className={labelCls}>
                    Spesifikasi <span className="text-zinc-500 font-normal">(ukuran, bahan, warna, finishing, dll.)</span>
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

                {/* Desain Custom Section */}
                <section aria-labelledby="design-heading" className="space-y-5">
                  <h3 id="design-heading" className="text-base font-semibold text-ink flex items-center gap-2">
                    <Upload className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                    Desain custom <span className="text-zinc-500 font-normal text-sm">(opsional)</span>
                  </h3>
                  <p className={helpCls}>Drag file desain (JPG, PNG, WebP, PDF — max 10 MB). Admin akan mengecek kelayakan cetak.</p>

                  <div className="relative">
                    <label className="group flex cursor-pointer items-start gap-4 rounded-xl border-2 border-dashed border-zinc-200 p-6 transition-all hover:border-gold/50 hover:bg-cream has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-cyan has-[input:focus-visible]:outline-offset-2">
                      <input
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        onChange={(e) => onDesainChange(e.target.files?.[0] ?? null)}
                        className="sr-only"
                        disabled={!produk}
                        aria-label="Pilih file desain custom"
                      />
                      <div className="flex shrink-0 items-center justify-center w-20 h-20 rounded-xl bg-zinc-100 transition-colors group-hover:bg-gold/10">
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
                        <p className="font-medium text-ink group-hover:text-cyan">
                          {desainFile ? desainFile.name : "Klik atau tarik file desain ke sini"}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {desainFile
                            ? `${(desainFile.size / 1024 / 1024).toFixed(2)} MB • JPG, PNG, WebP, PDF max 10 MB`
                            : "JPG, PNG, WebP, PDF maksimal 10 MB"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-gold/20 px-4 py-1.5 text-sm font-bold text-ink">
                        {desainFile ? "Ganti file" : "Siap cetak"}
                      </span>
                    </label>
                    {desainFile && (
                      <button
                        type="button"
                        onClick={() => onDesainChange(null)}
                        className="absolute right-3 top-3 rounded-full p-1 text-zinc-400 hover:text-magenta hover:bg-magenta/10 focus-visible:outline-2 focus-visible:outline-cyan"
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

                {/* Linkage Status */}
                {linkage && !linkage.ok && (
                  <div className="rounded-xl border border-magenta/30 bg-magenta/5 p-4" role="alert">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 shrink-0 text-magenta mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-ink">Akun belum tertaut ke data pelanggan</p>
                        <p className="mt-1 text-sm text-zinc-600">{linkage.info}</p>
                        <p className="mt-2 text-xs text-zinc-500">Pesanan tidak bisa dikirim sebelum admin memperbaiki tautan akun.</p>
                      </div>
                    </div>
                  </div>
                )}
                {linkage?.ok && (
                  <div className="rounded-xl border border-green-600/30 bg-green-50 p-3">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                      <span className="h-4 w-4 shrink-0" aria-hidden="true">✓</span>
                      Akun tertaut: <span className="font-normal">{linkage.info}</span>
                    </p>
                  </div>
                )}

                {msg && <ErrorBox>{msg}</ErrorBox>}

                <PrimaryButton
                  type="submit"
                  disabled={busy || !produk || (linkage !== null && !linkage.ok)}
                  className="w-full"
                >
                  {busy ? "Membuat pesanan…" : "Kirim pesanan"}
                </PrimaryButton>
              </form>
            </Card>

            {/* Sticky Quote Card (Desktop) */}
            {produk && (
              <aside className="hidden lg:block">
                <Card className="sticky top-24 border-gold/30 bg-cream/50">
                  <div className="p-5 md:p-6 border-b border-gold/20">
                    <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Ringkasan harga</h3>
                  </div>
                  <dl className="p-5 md:p-6 space-y-5 text-sm md:text-base">
                    <div className="flex justify-between gap-4 py-3 border-b border-zinc-200">
                      <dt className="text-zinc-600">{produk.nama_produk}</dt>
                      <dd className="font-medium text-ink whitespace-nowrap font-mono">{formatRupiah(hargaSatuan)}/{produk.satuan}</dd>
                    </div>
                    <div className="flex justify-between gap-4 py-3">
                      <dt className="text-zinc-600">Jumlah</dt>
                      <dd className="font-medium text-ink">{jumlah} {produk.satuan}</dd>
                    </div>
                    <div className="flex justify-between gap-4 py-3 border-t border-zinc-300">
                      <dt className="font-bold text-ink text-base">Total estimasi</dt>
                      <dd className="text-2xl font-bold text-cyan font-mono">{formatRupiah(total)}</dd>
                    </div>
                  </dl>
                  <div className="px-5 md:px-6 pb-5 md:pb-6 border-t border-zinc-200">
                    <p className="text-xs md:text-sm text-zinc-500">
                      Total final dikonfirmasi admin setelah cek desain & spesifikasi.
                    </p>
                  </div>
                </Card>
              </aside>
            )}
          </div>
        </div>
      )}
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