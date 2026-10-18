"use client";

import { useEffect, useState, useMemo } from "react";
import { RequireRole } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/Shell";
import { AlertCircle, Package, Search, Filter, X } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/dashboard/ProductCard";
import {
  createProduk,
  deleteProduk,
  listProduk,
  updateProduk,
  type WithDocId,
} from "@/lib/db";
import { hapusGambarProduk, uploadGambarProduk } from "@/lib/storage";
import type { Produk } from "@/types/firestore";
import {
  BackLink,
  Card,
  DangerButton,
  ErrorBox,
  GhostButton,
  PageHeader,
  PrimaryButton,
  Select,
} from "@/components/ui";

const inputCls = "mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 bg-white transition focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 text-base";
const labelCls = "block text-sm font-medium text-ink mb-1";
const MAX_PREVIEW = 2 * 1024 * 1024;

const JENIS_OPTIONS = [
  "kemasan",
  "cetak",
  "stiker",
  "label",
  "box",
  "tas",
  "lainnya",
] as const;

const SATUAN_OPTIONS = [
  "pcs",
  "pack",
  "meter",
  "kg",
  "rim",
  "lusin",
] as const;

interface FormState {
  nama_produk: string;
  jenis_produk: string;
  harga_dasar: number;
  satuan: string;
}

const EMPTY_FORM: FormState = {
  nama_produk: "",
  jenis_produk: "kemasan",
  harga_dasar: 0,
  satuan: "pcs",
};

function ProdukInner() {
  const [rows, setRows] = useState<WithDocId<Produk>[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WithDocId<Produk> | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<WithDocId<Produk> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [jenisFilter, setJenisFilter] = useState<string>("");

  function reload() {
    listProduk()
      .then((rows) => {
        setRows(rows);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(reload, []);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setPreview(null);
    setMsg(null);
    setShowModal(true);
  }

  function openEdit(p: WithDocId<Produk>) {
    setEditing(p);
    setForm({
      nama_produk: p.nama_produk,
      jenis_produk: p.jenis_produk,
      harga_dasar: p.harga_dasar,
      satuan: p.satuan,
    });
    setFile(null);
    setPreview(p.gambar_url ?? null);
    setMsg(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setPreview(null);
    setMsg(null);
  }

  function onFileChange(f: File | null) {
    setFile(f);
    if (f) {
      if (f.size > MAX_PREVIEW) {
        setMsg("Ukuran gambar maksimal 2 MB.");
        setFile(null);
        return;
      }
      setPreview(URL.createObjectURL(f));
      setMsg(null);
    } else {
      setPreview(editing?.gambar_url ?? null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (editing) {
        let gambar_url = editing.gambar_url ?? null;
        let gambar_path = editing.gambar_path ?? null;
        if (file) {
          const up = await uploadGambarProduk(file);
          await hapusGambarProduk(editing.gambar_path).catch(() => {});
          gambar_url = up.url;
          gambar_path = up.path;
        }
        await updateProduk(editing.id, { ...form, gambar_url, gambar_path });
        setMsg("Produk diperbarui.");
      } else {
        let gambar_url: string | null = null;
        let gambar_path: string | null = null;
        if (file) {
          const up = await uploadGambarProduk(file);
          gambar_url = up.url;
          gambar_path = up.path;
        }
        await createProduk({ ...form, gambar_url, gambar_path });
        setMsg("Produk ditambahkan.");
      }
      closeModal();
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal menyimpan produk.");
    } finally {
      setBusy(false);
    }
  }

  async function executeDelete() {
    if (!productToDelete) return;
    setBusy(true);
    try {
      await hapusGambarProduk(productToDelete.gambar_path).catch(() => {});
      await deleteProduk(productToDelete.id);
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal menghapus produk.");
    } finally {
      setBusy(false);
      setProductToDelete(null);
    }
  }

  const filteredRows = useMemo(() => {
    return rows.filter((p) => {
      const matchesSearch = p.nama_produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.jenis_produk.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesJenis = !jenisFilter || p.jenis_produk === jenisFilter;
      return matchesSearch && matchesJenis;
    });
  }, [rows, searchQuery, jenisFilter]);

  const uniqueJenis = useMemo(() => {
    return [...new Set(rows.map((p) => p.jenis_produk))].sort();
  }, [rows]);

  return (
    <DashboardShell role="admin" title="Katalog Produk" contain="6xl">
      <BackLink href="/admin">Dashboard admin</BackLink>
      <div className="mt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <PageHeader
          eyebrow="Admin · Katalog"
          title="Kelola produk"
          desc="Tambah, ganti gambar, atau hapus produk. Katalog publik langsung ikut berubah."
        />
        <PrimaryButton onClick={openAdd}>+ Tambah produk</PrimaryButton>
      </div>

      {msg && (
        <div className="mt-4">
          <ErrorBox>{msg}</ErrorBox>
        </div>
      )}

      {/* Search & Filter Bar */}
      <Card className="mt-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Cari nama atau jenis produk…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-300 bg-white text-base transition focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
            />
          </label>
          <div className="flex items-center gap-3 sm:flex-row flex-col sm:items-center">
            <Filter className="h-5 w-5 text-zinc-400 shrink-0" aria-hidden="true" />
            <Select
              value={jenisFilter}
              onChange={(e) => setJenisFilter(e.target.value)}
              options={[{ value: "", label: "Semua jenis" }, ...uniqueJenis.map((j) => ({ value: j, label: j }))]}
              className="w-full sm:w-48"
            />
          </div>
        </div>
      </Card>

      {/* Product Grid */}
      <div className="mt-6">
        {loading ? (
          <div
            role="status"
            aria-label="Memuat katalog produk"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <span className="sr-only">Memuat katalog produk…</span>
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <Card className="text-center py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/15">
              <Package className="h-8 w-8 text-ink" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-ink">Belum ada produk</h3>
            <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
              {searchQuery || jenisFilter
                ? "Tidak ada produk yang cocok dengan filter. Coba ubah pencarian atau filter."
                : "Katalog masih kosong. Tambahkan produk pertama — katalog publik langsung ikut berubah."}
            </p>
            {(!searchQuery && !jenisFilter) && (
              <PrimaryButton type="button" onClick={openAdd} className="mt-4">
                + Tambah produk
              </PrimaryButton>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRows.map((p) => (
              <ProductCard
                key={p.id}
                produk={p}
                busy={busy}
                onEdit={() => openEdit(p)}
                onDelete={() => setProductToDelete(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-ink">{editing ? "Ubah produk" : "Produk baru"}</h2>
              <button onClick={closeModal} className="p-1 rounded-lg text-zinc-400 hover:text-ink hover:bg-zinc-100 transition-colors" aria-label="Tutup modal">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelCls}>
                    Nama produk
                    <input
                      required
                      value={form.nama_produk}
                      onChange={(e) => setForm((f) => ({ ...f, nama_produk: e.target.value }))}
                      className={inputCls}
                      placeholder="cth: Paper Bag Kraft"
                    />
                  </label>
                  <label className={labelCls}>
                    Jenis produk
                    <Select
                      value={form.jenis_produk}
                      onChange={(e) => setForm((f) => ({ ...f, jenis_produk: e.target.value }))}
                      options={JENIS_OPTIONS.map((j) => ({ value: j, label: j }))}
                      className={inputCls.replace("text-base", "text-base")}
                    />
                  </label>
                  <label className={labelCls}>
                    Harga dasar (Rp)
                    <input
                      type="number"
                      min={0}
                      required
                      value={form.harga_dasar}
                      onChange={(e) => setForm((f) => ({ ...f, harga_dasar: Number(e.target.value) }))}
                      className={inputCls}
                    />
                  </label>
                  <label className={labelCls}>
                    Satuan
                    <Select
                      value={form.satuan}
                      onChange={(e) => setForm((f) => ({ ...f, satuan: e.target.value }))}
                      options={SATUAN_OPTIONS.map((s) => ({ value: s, label: s }))}
                      className={inputCls.replace("text-base", "text-base")}
                    />
                  </label>
                </div>

                {/* Image Dropzone */}
                <fieldset className="rounded-xl border-2 border-dashed border-zinc-200 p-5 space-y-4">
                  <legend className="text-sm font-semibold text-ink">Gambar produk <span className="font-normal text-zinc-500">(maks 2 MB)</span></legend>
                  <div className="relative">
                    <label className="group flex cursor-pointer items-start gap-4 rounded-xl border-2 border-dashed border-zinc-200 p-5 transition-all hover:border-gold/50 hover:bg-gold/5 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-cyan has-[input:focus-visible]:outline-offset-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                        className="sr-only"
                        disabled={busy}
                        aria-label="Pilih gambar produk"
                      />
                      <div className="flex shrink-0 items-center justify-center w-20 h-20 rounded-xl bg-zinc-100 transition-colors group-hover:bg-gold/10">
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element -- pratinjau blob lokal
                          <img src={preview} alt="Pratinjau gambar produk" className="h-20 w-20 rounded-xl object-cover" />
                        ) : (
                          <span className="text-4xl" aria-hidden="true">📦</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pt-1">
                        <p className="font-medium text-ink group-hover:text-cyan">
                          {file ? file.name : editing?.gambar_url ? "Ganti gambar" : "Klik atau tarik gambar ke sini"}
                        </p>
                        <p className="text-sm text-zinc-500 mt-0.5">
                          {file
                            ? `${(file.size / 1024 / 1024).toFixed(2)} MB • JPG, PNG, WebP max 2 MB`
                            : editing?.gambar_url
                            ? "Kosongkan untuk hapus gambar"
                            : "JPG, PNG, WebP maksimal 2 MB"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-gold/20 px-4 py-1.5 text-sm font-bold text-ink">
                        {file || editing?.gambar_url ? "Ganti" : "Unggah"}
                      </span>
                    </label>
                    {file && (
                      <button
                        type="button"
                        onClick={() => onFileChange(null)}
                        className="absolute right-3 top-3 rounded-full p-1 text-zinc-400 hover:text-magenta hover:bg-magenta/10 focus-visible:outline-2 focus-visible:outline-cyan"
                        aria-label="Hapus gambar"
                      >
                        <X className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </fieldset>

                {msg && <ErrorBox>{msg}</ErrorBox>}

                <div className="flex flex-wrap gap-2 pt-2">
                  <PrimaryButton disabled={busy} type="submit">
                    {busy ? "Menyimpan…" : editing ? "Simpan perubahan" : "Tambah produk"}
                  </PrimaryButton>
                  <GhostButton type="button" disabled={busy} onClick={closeModal}>
                    Batal
                  </GhostButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0" onClick={() => !busy && setProductToDelete(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-magenta/10 sm:h-10 sm:w-10">
                <AlertCircle className="h-6 w-6 text-magenta" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-lg font-semibold leading-6 text-ink">Hapus Produk?</h3>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-zinc-600">
                Yakin hapus produk <strong className="text-ink">&ldquo;{productToDelete.nama_produk}&rdquo;</strong> beserta gambarnya?
              </p>
              <p className="mt-2 text-sm font-medium text-magenta">Tindakan ini tidak bisa dibatalkan.</p>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <GhostButton disabled={busy} onClick={() => setProductToDelete(null)} className="w-full sm:w-auto">Batal</GhostButton>
              <DangerButton disabled={busy} onClick={executeDelete} className="w-full sm:w-auto">{busy ? "Menghapus..." : "Ya, Hapus Produk"}</DangerButton>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function AdminProdukPage() {
  return (
    <RequireRole allow={["admin"]}>
      <ProdukInner />
    </RequireRole>
  );
}