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

const inputCls = "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2";

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
  // Diagnosis keterkaitan akun: users.id_pelanggan -> pelanggan.uid == auth uid.
  // Rules menolak "menyimpan order" bila rantai ini putus.
  const [linkage, setLinkage] = useState<null | {
    ok: boolean;
    info: string;
  }>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // ID estimasi asal (bila dibuka via ?estimasi=), disimpan ke order.id_estimasi.
  const [estimasiId, setEstimasiId] = useState<string | null>(null);

  const idp = profile?.id_pelanggan ?? null;
  const produk = produkList.find((p) => p.id === idProduk) ?? null;
  const hargaSatuan = produk?.harga_dasar ?? 0;
  const total = hargaSatuan * Math.max(0, jumlah);

  useEffect(() => {
    listProduk().then(setProdukList).catch(() => {});
  }, []);

  // Cek keterkaitan akun setiap idp berubah. Read dokumen sendiri selalu
  // diizinkan, jadi hasil cek ini valid apa pun versi rules yang terpublish.
  // (setState hanya di dalam callback promise, mengikuti pola halaman lain.)
  useEffect(() => {
    if (!idp || !firebaseUser) return;
    const uid = firebaseUser.uid;
    getPelanggan(idp)
      .then((p) => {
        if (!p) {
          setLinkage({
            ok: false,
            info: `dokumen pelanggan "${idp}" tidak ditemukan.`,
          });
        } else if (p.uid !== uid) {
          setLinkage({
            ok: false,
            info: `field uid pelanggan ("${p.uid ?? "-"}") beda dengan UID login ("${uid}").`,
          });
        } else {
          setLinkage({ ok: true, info: p.nama });
        }
      })
      .catch(() =>
        setLinkage({
          ok: false,
          info: `dokumen pelanggan "${idp}" tidak bisa dibaca.`,
        })
      );
  }, [idp, firebaseUser]);

  // Prefill dari riwayat estimasi: /customer/pesan?estimasi=<id>.
  useEffect(() => {
    const param = searchParams.get("estimasi");
    if (!param || !idp) return;
    getEstimasi(param)
      .then((e) => {
        if (!e || e.id_pelanggan !== idp) return;
        setEstimasiId(param);
        setIdProduk(e.id_produk);
        setJumlah(e.jumlah);
      })
      .catch(() => {});
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

  // Bungkus tiap langkah tulis agar error tahu persis langkah yang gagal
  // (order / upload desain / item / tracking) — penting untuk diagnosis rules.
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
      // 1. Generate ID secara lokal tanpa network request ke server
      const newOrderId = generateOrderId();
      orderId = newOrderId;

      // 2. Upload desain custom (opsional) menggunakan ID order
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

      // 3. Batch Write: Simpan Order, Detail, dan Tracking sekaligus
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
        // Rollback jauh lebih sederhana: Firestore batch bersifat atomic,
        // jadi kita cukup hapus file Storage jika db gagal. 
        // Tidak perlu hapus dokumen yatim satu per satu.
        await Promise.allSettled(
          desainPaths.map((p) => hapusFileStorage(p))
        );
        throw inner;
      }
      
      router.push(`/customer/orders/${orderId}`);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Coba lagi.";
      const isIzin = /permission|insufficient|PERMISSION_DENIED/i.test(raw);
      setMsg(
        `Gagal membuat pesanan: ${raw}` +
          (isIzin
            ? " Kemungkinan: (1) firestore.rules terbaru belum di-Publish di Firebase Console (cek status keterkaitan di atas form — bila akun dinyatakan tertaut, berarti penyebabnya ini), atau (2) akun ini tidak tertaut ke data pelanggan. Minta admin memeriksa keduanya."
            : "")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell role="customer" title="Pesanan Baru" contain="3xl">
      <BackLink href="/customer">Kembali</BackLink>
      <div className="mt-2">
        <PageHeader
          eyebrow="Customer · Pesanan baru"
          title="Buat pesanan"
          desc="Pesanan masuk dengan status menunggu, lalu diproses admin."
        />
      </div>

      {produkList.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-zinc-500">
            Katalog produk masih kosong. Minta admin menambah data di halaman{" "}
            <code>/admin/produk</code>.
          </p>
        </Card>
      ) : (
        <Card className="mt-6">
          <form onSubmit={onSubmit}>
            <label className="text-sm font-medium">
              Produk
              <span className="mt-2 grid gap-2 sm:grid-cols-2">
                {produkList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setIdProduk(p.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                      idProduk === p.id
                        ? "border-moon-blue bg-moon-blue/5 ring-2 ring-moon-blue/30"
                        : "border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    <ProductThumb
                      url={p.gambar_url}
                      nama={p.nama_produk}
                      size="md"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-moon-ink">
                        {p.nama_produk}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {formatRupiah(p.harga_dasar)}/{p.satuan}
                      </span>
                    </span>
                  </button>
                ))}
              </span>
            </label>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Jumlah ({produk?.satuan ?? "pcs"})
                <input
                  type="number"
                  min={1}
                  required
                  value={jumlah}
                  onChange={(e) => setJumlah(Number(e.target.value))}
                  className={inputCls}
                />
              </label>
              <div className="rounded-xl bg-moon-ink px-4 py-3 text-white sm:self-end">
                <p className="text-xs text-white/70">
                  {formatRupiah(hargaSatuan)} × {jumlah}
                </p>
                <p className="text-xl font-bold text-moon-yellow">
                  {formatRupiah(total)}
                </p>
              </div>
            </div>

            <label className="mt-3 block text-sm font-medium">
              Spesifikasi / catatan (ukuran, bahan, warna, dll.)
              <textarea
                rows={3}
                value={spesifikasi}
                onChange={(e) => setSpesifikasi(e.target.value)}
                placeholder="cth: ukuran 20×30 cm, laminasi doff, tali paper twisted"
                className={inputCls}
              />
            </label>

            <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-4">
              <p className="text-sm font-semibold text-moon-ink">
                Desain custom{" "}
                <span className="font-normal text-zinc-500">(opsional)</span>
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Lampirkan file desainmu (JPG/PNG/WebP/PDF, maks 10 MB) beserta
                instruksi untuk admin.
              </p>
              <div className="mt-3 flex items-center gap-3">
                {desainPreview ? (
                  desainFile?.type === "application/pdf" ? (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-moon-pink/10 text-2xl">
                      📄
                    </span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- pratinjau blob lokal
                    <img
                      src={desainPreview}
                      alt="Pratinjau desain custom"
                      className="h-14 w-14 shrink-0 rounded-xl border border-zinc-200 object-cover"
                    />
                  )
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-2xl">
                    🎨
                  </span>
                )}
                <label className="text-sm font-medium">
                  File desain
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    onChange={(e) => onDesainChange(e.target.files?.[0] ?? null)}
                    className="mt-1 block w-full text-sm"
                  />
                </label>
              </div>
              <label className="mt-3 block text-sm font-medium">
                Catatan desain untuk admin
                <textarea
                  rows={2}
                  value={catatanDesain}
                  onChange={(e) => setCatatanDesain(e.target.value)}
                  placeholder="cth: logo di tengah dada, warna dasar hitam, teks putih"
                  className={inputCls}
                />
              </label>
            </div>

            {linkage && !linkage.ok && (
              <div className="mt-3">
                <ErrorBox>
                  Akun tidak tertaut ke data pelanggan: {linkage.info}{" "}
                  Pesanan tidak bisa dibuat sampai admin memperbaikinya.
                </ErrorBox>
              </div>
            )}
            {linkage?.ok && (
              <p className="mt-3 text-xs font-medium text-green-600">
                ✓ Akun tertaut ke pelanggan: {linkage.info}
              </p>
            )}
            {msg && (
              <div className="mt-3">
                <ErrorBox>{msg}</ErrorBox>
              </div>
            )}
            <PrimaryButton
              disabled={busy || !produk || (linkage !== null && !linkage.ok)}
              className="mt-4"
            >
              {busy ? "Membuat pesanan…" : "Buat pesanan"}
            </PrimaryButton>
          </form>
        </Card>
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
