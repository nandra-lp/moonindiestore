"use client";

// Dispatcher: /dashboard meneruskan ke rute sesuai role.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, routeForRole } from "@/context/AuthContext";

export default function DashboardPage() {
  const { role, loading, firebaseUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (role) router.replace(routeForRole(role));
  }, [loading, firebaseUser, role, router]);

  return <p className="p-8 text-sm text-zinc-500">Mengarahkan ke dashboard…</p>;
}
