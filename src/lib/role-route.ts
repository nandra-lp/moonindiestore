import { DEFAULT_ROUTE_BY_ROLE, ROLES } from "@/types/firestore";

// Role di Firestore harus persis salah satu nilai ini — proxy, guard, dan
// rules semuanya membandingkan string secara eksak (huruf kecil, tanpa spasi).
export function resolveTarget(raw: unknown): string | null {
  const normalized = typeof raw === "string" ? raw.trim() : "";
  if ((ROLES as string[]).includes(normalized)) {
    return (DEFAULT_ROUTE_BY_ROLE as Record<string, string>)[normalized];
  }
  return null;
}
