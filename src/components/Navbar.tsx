"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { routeForRole, useAuth } from "@/context/AuthContext";
import { Badge, BrandMark, roleTone } from "@/components/ui";
import type { Role } from "@/types/firestore";

import {
  Home,
  LayoutDashboard,
  Package,
  Calculator,
  Users,
  ShoppingCart,
  PlusCircle,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon?: React.ElementType;
}

const GUEST_ITEMS: NavItem[] = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/#katalog", label: "Katalog", icon: Package },
];

const ROLE_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/produk", label: "Produk", icon: Package },
    { href: "/admin/estimasi", label: "Estimasi", icon: Calculator },
    { href: "/admin/pelanggan", label: "Pelanggan", icon: Users },
  ],
  owner: [
    { href: "/owner", label: "Dashboard", icon: LayoutDashboard },
    { href: "/owner/estimasi", label: "Estimasi", icon: Calculator },
  ],
  customer: [
    { href: "/customer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/customer/estimasi", label: "Estimasi", icon: Calculator },
    { href: "/customer/orders", label: "Pesanan", icon: ShoppingCart },
    { href: "/customer/pesan", label: "Pesan", icon: PlusCircle },
  ],
};

function Logo() {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-2.5">
      <span className="transition-transform group-hover:scale-105">
        <BrandMark className="h-9 w-9" />
      </span>
      <span className="hidden text-[17px] font-extrabold tracking-tight text-moon-ink min-[400px]:inline">
        MoonIndie <span className="font-light">Store</span>
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
}: NavItem & { active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? "text-moon-ink" : "text-zinc-500 hover:text-moon-ink hover:bg-moon-yellow/10"
      }`}
    >
      {Icon && <Icon className="h-4 w-4" strokeWidth={2.5} />}
      {label}
      <span
        className={`absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-moon-yellow transition-opacity ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
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

  const items = role ? ROLE_ITEMS[role] : GUEST_ITEMS;

  function closeMenus() {
    setMobileOpen(false);
    setMenuOpen(false);
  }
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
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />

        {/* Navigasi desktop */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {items.map((it) => (
            <NavLink
              key={it.href}
              href={it.href}
              label={it.label}
              icon={it.icon}
              onNavigate={closeMenus}
              active={
                it.href === "/"
                  ? pathname === "/"
                  : pathname === it.href || pathname.startsWith(`${it.href}/`)
              }
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
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:text-moon-ink sm:inline"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-moon-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Daftar Customer
              </Link>
            </>
          ) : (
            <div className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-label="Menu akun"
                className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-2.5 transition hover:border-zinc-300 hover:shadow-sm"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-moon-ink text-sm font-bold text-moon-yellow">
                  {initial}
                </span>
                <span className="max-w-28 truncate text-sm font-medium text-moon-ink">
                  {displayName}
                </span>
                {role && (
                  <Badge tone={roleTone(role)} className="!px-2">
                    {role}
                  </Badge>
                )}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  className={`text-zinc-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                >
                  <path
                    d="M2 4l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <button
                    aria-hidden
                    tabIndex={-1}
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-10 cursor-default"
                  />
                  <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
                    <div className="border-b border-zinc-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-moon-ink">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {firebaseUser.email}
                      </p>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          if (role) router.push(routeForRole(role));
                          setMenuOpen(false);
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-moon-yellow/20"
                      >
                        Dashboard saya
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-moon-pink transition hover:bg-moon-pink/10"
                      >
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
            aria-label="Menu navigasi"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-moon-ink md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              {mobileOpen ? (
                <path
                  d="M4 4l10 10M14 4L4 14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M2 5h14M2 9h14M2 13h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Panel mobile */}
      {mobileOpen && (
        <nav className="border-t border-zinc-100 bg-white px-4 pb-5 pt-2 md:hidden shadow-lg">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  pathname === it.href
                    ? "bg-moon-yellow/25 text-moon-ink"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-moon-ink"
                }`}
              >
                {Icon && <Icon className="h-5 w-5 opacity-70" strokeWidth={2.5} />}
                {it.label}
              </Link>
            );
          })}
          <div className="mt-2 border-t border-zinc-100 pt-3">
            {!firebaseUser && !loading ? (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600"
              >
                Masuk
              </Link>
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
                    className="rounded-full bg-moon-pink/10 px-3.5 py-1.5 text-sm font-medium text-moon-pink"
                  >
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
