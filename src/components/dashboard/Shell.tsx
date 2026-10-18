"use client";

// Kerangka aplikasi dashboard: Sidebar (desktop) → Topbar → Konten.
// Menggantikan Navbar global di dalam section dashboard (lihat Chrome).

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { routeForRole, useAuth } from "@/context/AuthContext";
import type { Role } from "@/types/firestore";
import { SidebarBody } from "./Sidebar";

const ROLE_EYEBROW: Record<Role, string> = {
  admin: "Admin",
  owner: "Owner",
  customer: "Customer",
};

const CONTAIN: Record<"3xl" | "4xl" | "5xl" | "6xl", string> = {
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

export function DashboardShell({
  role,
  title,
  contain = "6xl",
  className = "",
  children,
}: {
  role: Role;
  title: string;
  contain?: keyof typeof CONTAIN;
  /** Kelas tambahan untuk kontainer konten (mis. space-y-4). */
  className?: string;
  children: ReactNode;
}) {
  const { profile, firebaseUser, logout } = useAuth();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Tutup drawer/menu dengan Escape.
  useEffect(() => {
    if (!drawer && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawer(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer, menuOpen]);

  const displayName =
    profile?.nama ?? firebaseUser?.displayName ?? firebaseUser?.email ?? "Akun";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  async function handleLogout() {
    setDrawer(false);
    setMenuOpen(false);
    await logout();
    router.replace("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 items-stretch bg-zinc-50/60">
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-moon-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-moon-yellow"
      >
        Lewati ke konten
      </a>

      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-zinc-200/80 bg-white px-4 py-6 lg:block xl:w-72">
        <SidebarBody role={role} onLogout={handleLogout} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setDrawer(true)}
              aria-label="Buka menu navigasi"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-moon-ink transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Page identity */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-moon-blue/80">
                {ROLE_EYEBROW[role]}
              </p>
              <h1 className="truncate text-lg font-semibold text-moon-ink">
                {title}
              </h1>
            </div>

            {/* User menu */}
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Menu akun"
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 transition-colors duration-150 hover:border-zinc-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moon-ink text-sm font-bold text-moon-yellow">
                  {initial}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-medium text-moon-ink sm:inline">
                  {displayName}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-150 ${menuOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {menuOpen && (
                <>
                  <button
                    aria-label="Tutup menu akun"
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-10 cursor-default"
                  />
                  <div
                    role="menu"
                    aria-label="Menu akun"
                    className="absolute right-0 z-20 mt-2 w-52 animate-pop-in overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
                  >
                    <button
                      role="menuitem"
                      onClick={() => {
                        router.push(routeForRole(role));
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-none px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-zinc-100 hover:text-moon-ink focus-visible:bg-zinc-100 focus-visible:text-moon-ink focus-visible:outline-none"
                    >
                      <LayoutDashboard className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                      Dashboard saya
                    </button>
                    <button
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-none px-3 py-2 text-left text-sm font-medium text-moon-pink transition-colors duration-150 hover:bg-moon-pink/10 focus-visible:bg-moon-pink/10 focus-visible:outline-none"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Konten */}
        <main
          id="konten-utama"
          className={`mx-auto w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 ${CONTAIN[contain]} ${className}`}
        >
          {children}
        </main>
      </div>

      {/* Drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Tutup menu navigasi"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 bg-moon-ink/40 backdrop-blur-[2px]"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-slide-in-left flex-col overflow-y-auto bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-end">
              <button
                onClick={() => setDrawer(false)}
                aria-label="Tutup menu navigasi"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-moon-ink transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <SidebarBody
                role={role}
                onNavigate={() => setDrawer(false)}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}