"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/AuthGuard";
import {
  createProduk,
  deleteProduk,
  listProduk,
  updateProduk,
  type WithDocId,
} from "@/lib/db";
import { hapusGambarProduk, uploadGambarProduk } from "@/lib/storage";
import { formatRupiah } from "@/lib/estimasi";
import type { Produk } from "@/types/firestore";
import {
  BackLink,
  Card,
  DangerButton,
  EmptyRow,
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
  const [msg, setMsg] = useState<string | null>(null);

  function reload() {
    listProduk().then(setRows).catch(() => {});
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

  async function onDelete(p: WithDocId<Produk>) {
    if (!confirm(`Hapus "${p.nama_produk}" beserta gambarnya?`)) return;
    setBusy(true);
    try {
      await hapusGambarProduk(p.gambar_path).catch(() => {});
      await deleteProduk(p.id);
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal menghapus produk.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
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

      <Card className="mt-6 !p-0">
        <ul className="divide-y">
          {rows.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 px-4 py-3 text-sm"
            >
              <ProductThumb
                url={p.gambar_url}
                nama={p.nama_produk}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-moon-ink">
                  {p.nama_produk}
                </p>
                <p className="text-xs text-zinc-500">
                  {p.jenis_produk} · {formatRupiah(p.harga_dasar)}/{p.satuan}
                </p>
              </div>
              <GhostButton
                disabled={busy}
                onClick={() => openEdit(p)}
                className="!px-3 shrink-0"
              >
                Ubah
              </GhostButton>
              <DangerButton
                disabled={busy}
                onClick={() => onDelete(p)}
                className="!px-3 shrink-0"
              >
                Hapus
              </DangerButton>
            </li>
          ))}
          {rows.length === 0 && <EmptyRow>Belum ada produk.</EmptyRow>}
        </ul>
      </Card>
    </main>
  );
}

export default function AdminProdukPage() {
  return (
    <RequireRole allow={["admin"]}>
      <ProdukInner />
    </RequireRole>
  );
}
