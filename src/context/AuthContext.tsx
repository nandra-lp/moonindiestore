"use client";

// AuthProvider berbasis Firebase Auth + dokumen role di Firestore.
// Alur:
// - Customer: register/login mandiri lewat /register dan /login.
// - Admin/Owner: akun dibuat via script seed (scripts/seed-users.mjs), login lewat /login yang sama.
// - Role dibaca dari collection `users` (doc id = uid). Cookie ringan `mis_role`
//   diset untuk optimistic check di proxy.ts (tidak untuk otorisasi final).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/collections";
import {
  DEFAULT_ROUTE_BY_ROLE,
  type Role,
  type UserDoc,
} from "@/types/firestore";
import { collection } from "firebase/firestore";

interface AuthState {
  firebaseUser: FirebaseUser | null;
  profile: UserDoc | null;
  role: Role | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<Role>;
  registerCustomer: (input: {
    nama: string;
    email: string;
    password: string;
    no_hp: string;
    alamat: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function setRoleCookie(role: Role | null) {
  if (typeof document === "undefined") return;
  if (!role) {
    document.cookie = "mis_role=; path=/; max-age=0";
    document.cookie = "mis_auth=; path=/; max-age=0";
    return;
  }
  // Cookie 7 hari, hanya untuk redirect optimistis di proxy. Otorisasi tetap di Firestore Rules.
  document.cookie = `mis_auth=1; path=/; max-age=${7 * 24 * 3600}`;
  document.cookie = `mis_role=${role}; path=/; max-age=${7 * 24 * 3600}`;
}

async function fetchProfile(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

// Menjamin setiap user Auth punya dokumen role + pelanggan. Bila belum ada,
// dibuatkan otomatis sebagai customer (self-healing untuk akun yang dibuat
// manual via Console). Urutan: users dulu, pelanggan kemudian — agar lolos
// rules versi lama maupun baru.
async function ensureCustomerDocs(
  fbUser: FirebaseUser,
  fallback: { nama: string; no_hp: string; alamat: string }
): Promise<UserDoc> {
  const existing = await fetchProfile(fbUser.uid);
  if (existing) return existing;
  const email = fbUser.email ?? "";
  const pelangganRef = doc(collection(db, COLLECTIONS.pelanggan));
  await setDoc(doc(db, COLLECTIONS.users, fbUser.uid), {
    uid: fbUser.uid,
    email,
    role: "customer",
    id_pelanggan: pelangganRef.id,
    nama: fallback.nama,
    createdAt: serverTimestamp(),
  });
  await setDoc(pelangganRef, {
    nama: fallback.nama,
    no_hp: fallback.no_hp,
    email,
    alamat: fallback.alamat,
    uid: fbUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const created = await fetchProfile(fbUser.uid);
  if (!created) throw new Error("Dokumen role gagal dibuat otomatis.");
  return created;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setRoleCookie(null);
        setLoading(false);
        return;
      }
      try {
        const p = await fetchProfile(user.uid);
        setProfile(p);
        setRoleCookie(p?.role ?? null);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    let p = await fetchProfile(cred.user.uid);
    if (!p) {
      // Akun Auth yatim (tanpa dokumen role) otomatis menjadi customer
      // agar login tidak mentok — admin bisa menaikkan rolenya nanti.
      const nama =
        cred.user.displayName ??
        (cred.user.email ?? email).split("@")[0] ??
        "Customer";
      p = await ensureCustomerDocs(cred.user, {
        nama,
        no_hp: "-",
        alamat: "-",
      });
    }
    setProfile(p);
    setRoleCookie(p.role);
    return p.role;
  }, []);

  const registerCustomer = useCallback(
    async (input: {
      nama: string;
      email: string;
      password: string;
      no_hp: string;
      alamat: string;
    }) => {
      setError(null);
      // 1. Buat user di Firebase Auth.
      const cred = await createUserWithEmailAndPassword(
        auth,
        input.email,
        input.password
      );
      await updateProfile(cred.user, { displayName: input.nama });

      // 2-3. Dokumen pelanggan + role customer (idempoten via helper).
      const p = await ensureCustomerDocs(cred.user, {
        nama: input.nama,
        no_hp: input.no_hp,
        alamat: input.alamat,
      });
      setProfile(p);
      setRoleCookie("customer");
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setProfile(null);
    setRoleCookie(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      firebaseUser,
      profile,
      role: profile?.role ?? null,
      loading,
      error,
      login,
      registerCustomer,
      logout,
    }),
    [firebaseUser, profile, loading, error, login, registerCustomer, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}

export function routeForRole(role: Role) {
  return DEFAULT_ROUTE_BY_ROLE[role];
}
