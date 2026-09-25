"use client";

// Penjaga rute sisi klien. Otorisasi final tetap di Firestore Rules + query per-role.
// Komponen ini hanya untuk UX (redirect cepat + pesan).

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types/firestore";

export function RequireRole({
  allow,
  children,
}: {
  allow: Role[];
  children: ReactNode;
}) {
  const { role, loading, firebaseUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (role && !allow.includes(role)) {
      router.replace("/unauthorized");
    }
  }, [loading, firebaseUser, role, allow, router]);

  if (loading) {
    return <p className="p-8 text-sm text-zinc-500">Memeriksa sesi…</p>;
  }
  if (!firebaseUser) return null;
  if (role && !allow.includes(role)) return null;
  return <>{children}</>;
}
