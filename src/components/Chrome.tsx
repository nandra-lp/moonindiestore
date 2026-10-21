"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { isDashboardSection } from "./dashboard/nav";

export function Chrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const inApp = isDashboardSection(pathname);

  return (
    <>
      {!inApp && <Navbar />}
      {children}
      {!inApp && <Footer />}
    </>
  );
}