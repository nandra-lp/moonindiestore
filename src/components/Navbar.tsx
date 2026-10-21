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
      aria-label="Moon Indie Store - Beranda"
    >
      <span className="transition-transform duration-200 group-hover:scale-105 group-hover:rotate-3">
        <BrandMark className="h-10 w-10" />
      </span>
      <span className="text-base font-extrabold tracking-tight text-moon-ink sm:text-lg">
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
  mobile = false,
}: DashboardNavItem & { active: boolean; onNavigate?: () => void; mobile?: boolean }) {
  const baseClasses =
    "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue";
  const activeClasses = "bg-moon-yellow font-semibold text-moon-ink shadow-sm";
  const inactiveClasses =
    "text-zinc-500 hover:bg-zinc-50 hover:text-moon-ink";
  const mobileClasses = mobile ? "w-full justify-start px-3 py-3" : "";

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`${baseClasses} ${mobileClasses} ${active ? activeClasses : inactiveClasses}`}
    >
      {Icon && <Icon className="h-4.5 w-4.5" strokeWidth={2.5} aria-hidden="true" />}
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
    <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/95 shadow-[0_1px_3px_rgba(10,10,10,0.04),0_4px_12px_rgba(10,10,10,0.03)] backdrop-blur-xl">
      {/* Top brand accent line */}
      <div className="h-px bg-gradient-to-r from-moon-yellow via-moon-pink to-moon-blue" aria-hidden="true" />

      <div className="mx-auto flex h-16 sm:h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 pt-safe">
        <Logo />

        {/* Navigasi desktop */}
        <nav aria-label="Navigasi utama" className="hidden items-center gap-2 md:flex">
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

        <div className="flex items-center gap-2.5">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-zinc-200/70 sm:w-44" />
          ) : !firebaseUser ? (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-moon-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue hidden sm:inline-flex min-h-[44px]"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-moon-ink px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue min-h-[44px]"
              >
                Daftar
              </Link>
            </>
          ) : (
            <div className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Menu akun"
                className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white py-1.5 pl-2 pr-3 transition hover:border-zinc-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
              >
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-moon-ink text-sm font-bold text-moon-yellow">
                  {initial}
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-moon-yellow text-[10px] font-bold text-moon-ink ring-2 ring-white">
                    {role === "admin" ? "A" : role === "owner" ? "O" : "C"}
                  </span>
                </span>
                <span className="max-w-32 truncate text-sm font-medium text-moon-ink hidden sm:inline-block">
                  {displayName}
                </span>
                {role && <Badge tone={roleTone(role)} className="inline-flex">{role}</Badge>}
                <ChevronDown
                  className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
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
                    className="absolute right-0 z-20 mt-3 w-64 animate-pop-in overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
                  >
                    <div className="border-b border-zinc-100 bg-gradient-to-r from-moon-ink/5 to-transparent px-4 py-4">
                      <p className="truncate text-sm font-semibold text-moon-ink">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-zinc-500 mt-0.5">
                        {firebaseUser.email}
                      </p>
                    </div>
                    <div className="p-2 space-y-1">
                      {role && (
                        <button
                          role="menuitem"
                          onClick={() => {
                            router.push(routeForRole(role));
                            setMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-moon-yellow/15 hover:text-moon-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moon-blue"
                        >
                          <LayoutDashboard
                            className="h-4 w-4 text-zinc-400 flex-shrink-0"
                            aria-hidden="true"
                          />
                          Dashboard saya
                        </button>
                      )}
                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-moon-pink transition hover:bg-moon-pink/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moon-blue"
                      >
                        <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
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
            aria-controls="mobile-nav-panel"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 text-moon-ink transition hover:bg-zinc-100 hover:border-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue md:hidden"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Panel mobile */}
      {mobileOpen && (
        <nav
          id="mobile-nav-panel"
          aria-label="Navigasi mobile"
          className="animate-slide-down border-t border-zinc-100 bg-white px-4 pb-5 pt-4 shadow-xl md:hidden"
        >
          {/* User section at top when logged in */}
          {firebaseUser && (
            <div className="mb-4 flex items-center gap-3 px-2 py-3 rounded-2xl bg-gradient-to-r from-moon-ink/5 to-transparent">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-moon-ink text-base font-bold text-moon-yellow flex-shrink-0">
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-moon-ink">
                  {displayName}
                </p>
                {role && (
                  <Badge tone={roleTone(role)} className="mt-1">
                    {role}
                  </Badge>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-full bg-moon-pink/10 px-4 py-2 text-sm font-medium text-moon-pink transition hover:bg-moon-pink/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue min-h-[44px]"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Keluar
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            {items.map((it) => {
              const Icon = it.icon;
              const active = isActive(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-full px-3 py-3.5 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moon-blue min-h-[48px] ${
                    active
                      ? "bg-moon-yellow font-semibold text-moon-ink"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-moon-ink"
                  }`}
                >
                  {Icon && (
                    <Icon
                      className="h-5 w-5 opacity-70 flex-shrink-0"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  )}
                  {it.label}
                </Link>
              );
            })}
          </div>

          {(!firebaseUser && !loading) && (
            <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full px-4 py-3 text-base font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-moon-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moon-blue min-h-[48px]"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full bg-moon-ink px-4 py-3 text-center text-base font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moon-blue min-h-[48px]"
              >
                Daftar
              </Link>
            </div>
          )}
        </nav>
      )}

      {/* Bottom hairline gradasi brand */}
      <div className="h-0.5 bg-gradient-to-r from-moon-yellow via-moon-pink to-moon-blue" aria-hidden="true" />
    </header>
  );
}