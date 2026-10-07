"use client";

// Chrome global: di dalam section dashboard, Navbar + footer marketing
// disembunyikan — DashboardShell yang mengambil alih navigasi & kerangka.
// Di halaman publik, Chrome tidak mengubah apa pun.

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { isDashboardSection } from "./dashboard/nav";

export function Chrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const inApp = isDashboardSection(pathname);

  return (
    <>
      {!inApp && <Navbar />}
      {children}
      {!inApp && (
        <footer className="mt-auto bg-moon-ink py-4 text-center text-xs text-white/60">
          Moon Indie Store • Printing
        </footer>
      )}
    </>
  );
}
