// Konfigurasi navigasi dashboard per role — SINGLE SOURCE OF TRUTH.
// Dipakai DashboardShell (sidebar/drawer) dan Navbar (fallback mobile &
// halaman publik). Satu tempat diubah, seluruh navigasi ikut selaras.

import {
  Calculator,
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types/firestore";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const DASHBOARD_NAV: Record<Role, DashboardNavItem[]> = {
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

// Rute section dashboard (punya sidebar via DashboardShell).
const SECTION_PREFIXES = ["/admin", "/owner", "/customer", "/dashboard"];

export function isDashboardSection(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  return SECTION_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

// Aktif bila path persis sama atau di bawahnya (detail order dsb.).
export function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
