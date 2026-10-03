"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/AuthGuard";
import { AlertTriangle } from "lucide-react";
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
  const [demoteDraft, setDemoteDraft] = useState<{ u: WithDocId<UserDoc>; next: Role } | null>(null);

  function reload() {
    listUsers().then(setUsers).catch(() => {});
    listPelanggan().then(setPelanggan).catch(() => {});
  }

  useEffect(reload, []);

  async function simpanRole(u: WithDocId<UserDoc>, bypassConfirm = false) {
    const next = drafts[u.id];
    if (!next || next === u.role) return;
    
    if (u.id === firebaseUser?.uid && next !== "admin" && !bypassConfirm) {
      setDemoteDraft({ u, next });
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
      setDemoteDraft(null);
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
      <Card className="mt-2 overflow-hidden !p-0">
        <ul className="divide-y divide-zinc-100">
          {users.map((u) => {
            const isSelf = u.id === firebaseUser?.uid;
            const val = drafts[u.id] ?? u.role;
            const hasChanged = val !== u.role;
            return (
              <li
                key={u.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 transition-colors hover:bg-zinc-50/80"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-moon-ink">
                    {u.nama}{" "}
                    {isSelf && (
                      <span className="text-xs font-normal text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-md ml-1">
                        (kamu)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-zinc-500 mt-0.5">
                    {u.email}
                    {u.id_pelanggan ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                        Cust #{u.id_pelanggan.slice(0, 6)}
                      </span>
                    ) : ""}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                  <div className="flex flex-col sm:items-end gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Current Role</span>
                    <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                  </div>
                  
                  <div className="h-8 w-px bg-zinc-200 hidden sm:block mx-1"></div>
                  
                  <div className="flex items-center gap-2 flex-1 sm:flex-none">
                    <select
                      value={val}
                      disabled={busyUid === u.id}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [u.id]: e.target.value as Role,
                        }))
                      }
                      className="flex-1 sm:flex-none rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-sm transition focus:border-moon-blue focus:ring-1 focus:ring-moon-blue"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    
                    {hasChanged && (
                      <GhostButton
                        disabled={busyUid === u.id}
                        onClick={() => simpanRole(u)}
                        className="!px-4 flex-none"
                      >
                        {busyUid === u.id ? "…" : "Simpan"}
                      </GhostButton>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
          {users.length === 0 && <EmptyRow>Belum ada pengguna.</EmptyRow>}
        </ul>
      </Card>

      <h2 className="mt-8 font-semibold text-moon-ink">
        Daftar pelanggan ({pelanggan.length})
      </h2>
      <Card className="mt-2 overflow-hidden !p-0">
        <ul className="divide-y divide-zinc-100">
          {pelanggan.map((p) => (
            <li key={p.id} className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-zinc-50/80">
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-semibold text-moon-ink">{p.nama}</p>
                {p.uid ? (
                  <span className="inline-flex items-center rounded-full bg-moon-blue/10 px-2 py-0.5 text-xs font-medium text-moon-blue">
                    Tertaut akun
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                    Belum tertaut
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <span className="text-zinc-400">✉</span> {p.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-zinc-400">☎</span> {p.no_hp}
                </span>
              </div>
              <p className="text-sm text-zinc-500 mt-1 flex items-start gap-1.5">
                <span className="text-zinc-400 mt-0.5">📍</span> {p.alamat}
              </p>
            </li>
          ))}
          {pelanggan.length === 0 && (
            <EmptyRow>Belum ada data pelanggan.</EmptyRow>
          )}
        </ul>
      </Card>

      {/* Demote Self Admin Modal */}
      {demoteDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setDemoteDraft(null)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-moon-pink/10 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-moon-pink" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-lg font-semibold leading-6 text-moon-ink">
                  Cabut Hak Admin?
                </h3>
              </div>
            </div>
            
            <div className="mt-3">
              <p className="text-sm text-zinc-600">
                Anda akan mencabut hak admin dari akun Anda sendiri dan mengubahnya menjadi <strong className="text-moon-ink">{demoteDraft.next}</strong>.
              </p>
              <p className="mt-2 text-sm font-medium text-moon-pink">
                Anda mungkin tidak bisa mengakses halaman ini lagi setelah menyimpan.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <GhostButton 
                onClick={() => setDemoteDraft(null)}
                className="w-full sm:w-auto"
              >
                Batal
              </GhostButton>
              <DangerButton 
                onClick={() => simpanRole(demoteDraft.u, true)}
                className="w-full sm:w-auto"
              >
                Ya, Cabut Admin
              </DangerButton>
            </div>
          </div>
        </div>
      )}
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
