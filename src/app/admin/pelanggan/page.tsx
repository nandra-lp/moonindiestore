"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import {
  listPelanggan,
  listUsers,
  updateUserRole,
  type WithDocId,
} from "@/lib/db";
import type { Pelanggan, Role, UserDoc } from "@/types/firestore";
import {
  BackLink,
  Badge,
  Card,
  EmptyRow,
  ErrorBox,
  GhostButton,
  PageHeader,
  roleTone,
} from "@/components/ui";

const ROLES: Role[] = ["admin", "owner", "customer"];

function PelangganInner() {
  const { firebaseUser } = useAuth();
  const [users, setUsers] = useState<WithDocId<UserDoc>[]>([]);
  const [pelanggan, setPelanggan] = useState<WithDocId<Pelanggan>[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Role>>({});
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function reload() {
    listUsers().then(setUsers).catch(() => {});
    listPelanggan().then(setPelanggan).catch(() => {});
  }

  useEffect(reload, []);

  async function simpanRole(u: WithDocId<UserDoc>) {
    const next = drafts[u.id];
    if (!next || next === u.role) return;
    if (u.id === firebaseUser?.uid && next !== "admin") {
      if (
        !confirm(
          "Kamu akan mencabut hak admin dari akunmu sendiri. Lanjut?"
        )
      )
        return;
    }
    setBusyUid(u.id);
    setMsg(null);
    try {
      await updateUserRole(u.id, next);
      setMsg(`Role ${u.email} diubah menjadi ${next}.`);
      setDrafts((d) => {
        const c = { ...d };
        delete c[u.id];
        return c;
      });
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal mengubah role.");
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <BackLink href="/admin">Dashboard admin</BackLink>
      <div className="mt-2">
        <PageHeader
          eyebrow="Admin · Pengguna"
          title="Pelanggan & role"
          desc="Ubah role pengguna kapan pun. Berhati-hatilah mencabut admin."
        />
      </div>
      {msg && (
        <div className="mt-4">
          <ErrorBox>{msg}</ErrorBox>
        </div>
      )}

      <h2 className="mt-6 font-semibold text-moon-ink">
        Role pengguna ({users.length})
      </h2>
      <Card className="mt-2 !p-0">
        <ul className="divide-y">
          {users.map((u) => {
            const isSelf = u.id === firebaseUser?.uid;
            const val = drafts[u.id] ?? u.role;
            return (
              <li
                key={u.id}
                className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-moon-ink">
                    {u.nama}{" "}
                    {isSelf && (
                      <span className="text-xs font-normal text-zinc-500">
                        (kamu)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {u.email}
                    {u.id_pelanggan ? ` · cust ${u.id_pelanggan.slice(0, 6)}…` : ""}
                  </p>
                </div>
                <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                <select
                  value={val}
                  disabled={busyUid === u.id}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [u.id]: e.target.value as Role,
                    }))
                  }
                  className="rounded-xl border border-zinc-300 px-2 py-1.5 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <GhostButton
                  disabled={busyUid === u.id || val === u.role}
                  onClick={() => simpanRole(u)}
                  className="!px-3"
                >
                  {busyUid === u.id ? "…" : "Simpan"}
                </GhostButton>
              </li>
            );
          })}
          {users.length === 0 && <EmptyRow>Belum ada pengguna.</EmptyRow>}
        </ul>
      </Card>

      <h2 className="mt-8 font-semibold text-moon-ink">
        Daftar pelanggan ({pelanggan.length})
      </h2>
      <Card className="mt-2 !p-0">
        <ul className="divide-y">
          {pelanggan.map((p) => (
            <li key={p.id} className="px-4 py-3 text-sm">
              <p className="font-semibold text-moon-ink">{p.nama}</p>
              <p className="text-xs text-zinc-500">
                {p.email} · {p.no_hp} · {p.alamat}
              </p>
              <p className="mt-0.5 text-xs">
                {p.uid ? (
                  <span className="font-medium text-moon-blue">
                    Tertaut ke akun login
                  </span>
                ) : (
                  <span className="text-zinc-400">
                    Pelanggan impor (belum punya akun)
                  </span>
                )}
              </p>
            </li>
          ))}
          {pelanggan.length === 0 && (
            <EmptyRow>Belum ada data pelanggan.</EmptyRow>
          )}
        </ul>
      </Card>
    </main>
  );
}

export default function AdminPelangganPage() {
  return (
    <RequireRole allow={["admin"]}>
      <PelangganInner />
    </RequireRole>
  );
}
