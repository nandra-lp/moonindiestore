"use client";

// Isi sidebar dashboard: brand, navigasi per role, dan kartu pengguna.
// Dipakai ulang oleh aside desktop dan drawer mobile di DashboardShell.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { routeForRole, useAuth } from "@/context/AuthContext";
import { Badge, BrandMark, roleTone } from "@/components/ui";
import { DASHBOARD_NAV, isNavActive } from "./nav";
import type { Role } from "@/types/firestore";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin Panel",
  owner: "Owner Panel",
  customer: "Customer Area",
};

export function SidebarBody({
  role,
  onNavigate,
  onLogout,
}: {
  role: Role;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const { profile, firebaseUser } = useAuth();
  const items = DASHBOARD_NAV[role];
  const displayName =
    profile?.nama ?? firebaseUser?.displayName ?? firebaseUser?.email ?? "Akun";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex h-full flex-col">
      {/* Brand section */}
      <Link
        href={routeForRole(role)}
        onClick={onNavigate}
        className="flex items-center gap-3 px-3 py-4 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue hover:bg-zinc-50 transition-colors duration-150"
      >
        <BrandMark className="h-10 w-10 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold text-moon-ink">
            Moon Indie Store
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-wider text-moon-blue/80">
            {ROLE_LABEL[role]}
          </span>
        </span>
      </Link>

      {/* Navigation */}
      <nav aria-label="Navigasi dashboard" className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const Icon = it.icon;
          const active = isNavActive(pathname, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue ${
                active
                  ? "bg-moon-yellow/15 text-moon-ink"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-moon-ink"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center transition-colors duration-150 ${
                  active ? "text-moon-ink" : "text-zinc-400 group-hover:text-moon-ink"
                }`}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <span className="truncate">{it.label}</span>
              {active && (
                <span
                  className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-moon-ink transition-transform duration-150 group-hover:scale-125"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-2 border-t border-zinc-200" aria-hidden="true" />

      {/* User section */}
      <div className="mx-2 mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-zinc-50">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moon-ink text-xs font-bold text-moon-yellow">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-moon-ink">
            {displayName}
          </p>
          <Badge tone={roleTone(role)} className="mt-0.5">
            {role}
          </Badge>
        </div>
        <button
          onClick={onLogout}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors duration-150 hover:bg-zinc-100 hover:text-moon-pink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue"
          aria-label="Keluar"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}