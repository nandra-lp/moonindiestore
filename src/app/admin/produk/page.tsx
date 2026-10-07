"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/Shell";
import { AlertCircle, Package } from "lucide-react";
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
  ProductThumb,
} from "@/components/ui";

const inputCls = "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2";
const MAX_PREVIEW = 2 * 1024 * 1024;

interface FormState {
  nama_produk: string;
  jenis_produk: string;
  harga_dasar: number;
  satuan: string;
}

const EMPTY_FORM: FormState = {
  nama_produk: "",
  jenis_produk: "",
  harga_dasar: 0,
  satuan: "pcs",
};

function ProdukInner() {
  const [rows, setRows] = useState<WithDocId<Produk>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WithDocId<Produk> | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<WithDocId<Produk> | null>(null);

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
    setShowForm(true);
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
    setShowForm(true);
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
      setShowForm(false);
      setEditing(null);
      setFile(null);
      setPreview(null);
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

  return (
    <DashboardShell role="admin" title="Katalog Produk" contain="4xl">
      <BackLink href="/admin">Dashboard admin</BackLink>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
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

      {showForm && (
        <Card className="mt-4">
          <h2 className="font-semibold text-moon-ink">
            {editing ? "Ubah produk" : "Produk baru"}
          </h2>
          <form onSubmit={onSubmit}>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Nama produk
                <input
                  required
                  value={form.nama_produk}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nama_produk: e.target.value }))
                  }
                  className={inputCls}
                  placeholder="cth: Paper Bag Kraft"
                />
              </label>
              <label className="text-sm font-medium">
                Jenis produk
                <input
                  required
                  value={form.jenis_produk}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, jenis_produk: e.target.value }))
                  }
                  className={inputCls}
                  placeholder="cth: kemasan / cetak"
                />
              </label>
              <label className="text-sm font-medium">
                Harga dasar (Rp)
                <input
                  type="number"
                  min={0}
                  required
                  value={form.harga_dasar}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      harga_dasar: Number(e.target.value),
                    }))
                  }
                  className={inputCls}
                />
              </label>
              <label className="text-sm font-medium">
                Satuan
                <input
                  required
                  value={form.satuan}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, satuan: e.target.value }))
                  }
                  className={inputCls}
                  placeholder="pcs / pack / meter"
                />
              </label>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ProductThumb
                url={preview}
                nama={form.nama_produk || "produk"}
                size="lg"
              />
              <label className="text-sm font-medium">
                Gambar produk (maks 2 MB)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-sm"
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <PrimaryButton disabled={busy}>
                {busy ? "Menyimpan…" : editing ? "Simpan perubahan" : "Tambah"}
              </PrimaryButton>
              <GhostButton
                type="button"
                disabled={busy}
                onClick={() => setShowForm(false)}
              >
                Batal
              </GhostButton>
            </div>
          </form>
        </Card>
      )}

      <div className="mt-6">
        {loading ? (
          <div
            role="status"
            aria-label="Memuat katalog produk"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <span className="sr-only">Memuat katalog produk…</span>
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-moon-yellow/20 text-moon-ink">
              <Package className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-moon-ink">Belum ada produk</p>
              <p className="mt-1 text-sm text-zinc-500">
                Tambahkan produk pertama — katalog publik langsung ikut berubah.
              </p>
            </div>
            <PrimaryButton
              type="button"
              onClick={openAdd}
              className="mt-1"
            >
              + Tambah produk
            </PrimaryButton>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((p) => (
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

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !busy && setProductToDelete(null)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-moon-pink/10 sm:h-10 sm:w-10">
                <AlertCircle className="h-6 w-6 text-moon-pink" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-lg font-semibold leading-6 text-moon-ink">
                  Hapus Produk?
                </h3>
              </div>
            </div>
            
            <div className="mt-3">
              <p className="text-sm text-zinc-600">
                Apakah Anda yakin ingin menghapus produk <strong className="text-moon-ink">&quot;{productToDelete.nama_produk}&quot;</strong> beserta gambarnya?
              </p>
              <p className="mt-2 text-sm font-medium text-moon-pink">
                Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <GhostButton 
                disabled={busy} 
                onClick={() => setProductToDelete(null)}
                className="w-full sm:w-auto"
              >
                Batal
              </GhostButton>
              <DangerButton 
                disabled={busy} 
                onClick={executeDelete}
                className="w-full sm:w-auto"
              >
                {busy ? "Menghapus..." : "Ya, Hapus Produk"}
              </DangerButton>
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
