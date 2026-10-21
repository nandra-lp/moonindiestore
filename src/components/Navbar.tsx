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
    "flex items-center gap-2 rounded-full px-4 py-2.5 text-base font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue";
  const activeClasses = "bg-moon-yellow font-semibold text-moon-ink shadow-sm";
  const inactiveClasses =
    "text-zinc-500 hover:bg-zinc-100 hover:text-moon-ink";
  const mobileClasses = mobile ? "w-full justify-start px-3 py-3" : "";

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`${baseClasses} ${mobileClasses} ${active ? activeClasses : inactiveClasses}`}
    >
      {Icon && <Icon className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />}
      {label}
      {active && !mobile && (
        <span className="h-1.5 w-1.5 rounded-full bg-moon-pink" aria-hidden="true" />
      )}
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
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 shadow-[0_1px_12px_rgba(10,10,10,0.05)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 pt-safe">
        <Logo />

        {/* Navigasi desktop */}
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1.5 md:flex">
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
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-moon-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue sm:inline-flex"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-moon-ink px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
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
                className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:border-zinc-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moon-ink text-sm font-bold text-moon-yellow">
                  {initial}
                </span>
                <span className="max-w-28 truncate text-sm font-medium text-moon-ink hidden sm:inline-block">
                  {displayName}
                </span>
                {role && <Badge tone={roleTone(role)} className="hidden sm:inline-flex">{role}</Badge>}
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
                    className="absolute right-0 z-20 mt-2.5 w-60 animate-pop-in overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
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
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-moon-yellow/25 hover:text-moon-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moon-blue"
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
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-moon-pink transition hover:bg-moon-pink/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moon-blue"
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
            aria-controls="mobile-nav-panel"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 text-moon-ink transition hover:bg-zinc-100 hover:border-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue md:hidden"
          >
            {mobileOpen ? (
              <X className="h-5.5 w-5.5" aria-hidden="true" />
            ) : (
              <Menu className="h-5.5 w-5.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Panel mobile */}
      {mobileOpen && (
        <nav
          id="mobile-nav-panel"
          aria-label="Navigasi mobile"
          className="animate-slide-down border-t border-zinc-100 bg-white px-4 pb-4 pt-3 shadow-lg md:hidden"
        >
          <div className="flex flex-col gap-2">
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
                  {active && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-moon-pink flex-shrink-0" aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3">
            {!firebaseUser && !loading ? (
              <>
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
                  className="flex items-center justify-center gap-2 rounded-full bg-moon-ink px-4 py-3.5 text-center text-base font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moon-blue min-h-[48px]"
                >
                  Daftar
                </Link>
              </>
            ) : (
              firebaseUser && (
                <div className="flex items-center gap-3 px-1 py-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-moon-ink text-base font-bold text-moon-yellow flex-shrink-0">
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
                    className="flex items-center gap-2 rounded-full bg-moon-pink/10 px-4 py-2 text-base font-medium text-moon-pink transition hover:bg-moon-pink/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue min-h-[48px]"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Keluar
                  </button>
                </div>
              )
            )}
          </div>
        </nav>
      )}

      {/* Hairline gradasi brand */}
      <div className="h-0.5 bg-gradient-to-r from-moon-yellow via-moon-pink to-moon-blue" aria-hidden="true" />
    </header>
  );
}