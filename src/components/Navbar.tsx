"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { routeForRole, useAuth } from "@/context/AuthContext";
import { Badge, BrandMark, roleTone } from "@/components/ui";
import {
  DASHBOARD_NAV,
  type DashboardNavItem,
} from "@/components/dashboard/nav";

import {
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  X,
} from "lucide-react";

const GUEST_ITEMS: DashboardNavItem[] = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/#katalog", label: "Katalog", icon: Package },
];

function Logo() {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
    >
      <span className="transition-transform duration-200 group-hover:scale-105 group-hover:rotate-3">
        <BrandMark className="h-10 w-10" />
      </span>
      <span className="hidden text-[17px] font-extrabold tracking-tight text-moon-ink min-[400px]:inline">
        Moon Indie <span className="font-light">Store</span>
      </span>
    </Link>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: DashboardNavItem & { active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue ${
        active
          ? "bg-moon-yellow font-semibold text-moon-ink shadow-sm"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-moon-ink"
      }`}
    >
      {Icon && <Icon className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />}
      {label}
    </Link>
  );
}

export function Navbar() {
  const { firebaseUser, profile, role, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Menu ditutup via handler klik (closeMenus), bukan effect.

  // Tutup dropdown dengan Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const items = (role && DASHBOARD_NAV[role]) ?? GUEST_ITEMS;

  function closeMenus() {
    setMobileOpen(false);
    setMenuOpen(false);
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const displayName =
    profile?.nama ?? firebaseUser?.displayName ?? firebaseUser?.email ?? "Akun";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  async function handleLogout() {
    setMenuOpen(false);
    setMobileOpen(false);
    await logout();
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 shadow-[0_1px_12px_rgba(10,10,10,0.06)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />

        {/* Navigasi desktop */}
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {items.map((it) => (
            <NavLink
              key={it.href}
              href={it.href}
              label={it.label}
              icon={it.icon}
              onNavigate={closeMenus}
              active={isActive(it.href)}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-zinc-200/70 sm:w-44" />
          ) : !firebaseUser ? (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-moon-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue sm:inline"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-moon-ink px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
              >
                Daftar Customer
              </Link>
            </>
          ) : (
            <div className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Menu akun"
                className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-2.5 transition hover:border-zinc-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-moon-ink text-sm font-bold text-moon-yellow">
                  {initial}
                </span>
                <span className="max-w-28 truncate text-sm font-medium text-moon-ink">
                  {displayName}
                </span>
                {role && <Badge tone={roleTone(role)}>{role}</Badge>}
                <ChevronDown
                  className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
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
                    className="absolute right-0 z-20 mt-2 w-60 animate-pop-in overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
                  >
                    <div className="border-b border-zinc-100 bg-zinc-50/60 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-moon-ink">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {firebaseUser.email}
                      </p>
                    </div>
                    <div className="p-1.5">
                      {role && (
                        <button
                          role="menuitem"
                          onClick={() => {
                            router.push(routeForRole(role));
                            setMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-moon-yellow/25 hover:text-moon-ink"
                        >
                          <LayoutDashboard
                            className="h-4 w-4 text-zinc-400"
                            aria-hidden="true"
                          />
                          Dashboard saya
                        </button>
                      )}
                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-moon-pink transition hover:bg-moon-pink/10"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Keluar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-moon-ink transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue md:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Panel mobile */}
      {mobileOpen && (
        <nav
          aria-label="Navigasi mobile"
          className="animate-slide-down border-t border-zinc-100 bg-white px-4 pb-5 pt-2 shadow-lg md:hidden"
        >
          {items.map((it) => {
            const Icon = it.icon;
            const active = isActive(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moon-blue ${
                  active
                    ? "bg-moon-yellow/25 font-semibold text-moon-ink"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-moon-ink"
                }`}
              >
                {Icon && (
                  <Icon
                    className="h-5 w-5 opacity-70"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                )}
                {it.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-moon-pink" aria-hidden="true" />
                )}
              </Link>
            );
          })}
          <div className="mt-2 flex flex-col gap-1 border-t border-zinc-100 pt-3">
            {!firebaseUser && !loading ? (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moon-blue"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl bg-moon-ink px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moon-blue"
                >
                  Daftar Customer
                </Link>
              </>
            ) : (
              firebaseUser && (
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moon-ink text-sm font-bold text-moon-yellow">
                    {initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-moon-ink">
                      {displayName}
                    </p>
                    {role && (
                      <Badge tone={roleTone(role)} className="mt-0.5">
                        {role}
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 rounded-full bg-moon-pink/10 px-3.5 py-1.5 text-sm font-medium text-moon-pink transition hover:bg-moon-pink/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    Keluar
                  </button>
                </div>
              )
            )}
          </div>
        </nav>
      )}

      {/* Hairline gradasi brand */}
      <div className="h-0.5 bg-gradient-to-r from-moon-yellow via-moon-pink to-moon-blue" />
    </header>
  );
}
