// Proxy Next.js 16 (pengganti middleware). Hanya optimistic check via cookie ringan.
// Otorisasi final tetap di Firestore Rules + AuthGuard sisi klien.
// Cookie `mis_auth=1` dan `mis_role=admin|owner|customer` diset saat login/register.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  owner: "/owner",
  customer: "/customer",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = request.cookies.get("mis_auth")?.value === "1";
  const role = request.cookies.get("mis_role")?.value;

  const needsAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/customer") ||
    pathname.startsWith("/dashboard");

  if (needsAuth && !authed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Cegah salah kamar: /admin hanya admin, dst. (optimistis; AuthGuard + Rules yang mengunci)
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(
      new URL(role && ROLE_HOME[role] ? ROLE_HOME[role] : "/unauthorized", request.url)
    );
  }
  if (pathname.startsWith("/owner") && role !== "owner") {
    return NextResponse.redirect(
      new URL(role && ROLE_HOME[role] ? ROLE_HOME[role] : "/unauthorized", request.url)
    );
  }
  if (pathname.startsWith("/customer") && role !== "customer") {
    return NextResponse.redirect(
      new URL(role && ROLE_HOME[role] ? ROLE_HOME[role] : "/unauthorized", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/owner/:path*", "/customer/:path*", "/dashboard/:path*"],
};
