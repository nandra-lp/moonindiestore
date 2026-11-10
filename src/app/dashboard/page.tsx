"use client";

// Dispatcher: /dashboard meneruskan ke rute sesuai role.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth, routeForRole } from "@/context/AuthContext";
import { Card, PrimaryLink } from "@/components/ui";

export default function DashboardPage() {
  const { role, loading, firebaseUser } = useAuth();
  const router = useRouter();

  const target = role ? routeForRole(role) : null;
  const redirectError = target ? null : "Role akun tidak dikenali. Hubungi admin.";

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (target) {
      router.replace(target);
    }
  }, [loading, firebaseUser, target, router]);

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center items-center px-6 py-16">
        <Card className="w-full max-w-sm text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-moon-ink text-moon-yellow animate-spin">
              <Loader2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm text-zinc-500">Mengarahkan ke dashboard…</p>
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            Tunggu sebentar, kami memeriksa hak akses akun Anda.
          </p>
        </Card>
      </main>
    );
  }

  if (redirectError) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center items-center px-6 py-16">
        <Card className="w-full max-w-sm text-center">
          <div className="flex flex-col items-center gap-3">
            <ArrowRight className="h-10 w-10 text-moon-pink" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-moon-ink">Tidak dapat mengarahkan</h2>
            <p className="text-sm text-zinc-500">{redirectError}</p>
          </div>
          <div className="mt-6">
            <PrimaryLink href="/" className="w-full sm:w-auto min-h-[44px]">
              Kembali ke beranda
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </PrimaryLink>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center items-center px-6 py-16" aria-live="polite">
      <Card className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-moon-ink text-moon-yellow animate-spin">
            <Loader2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm text-zinc-500">Mengarahkan ke dashboard…</p>
        </div>
      </Card>
    </main>
  );
}
