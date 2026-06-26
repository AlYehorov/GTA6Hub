"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/navigation/navbar";

interface SiteLayoutProps {
  children: React.ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  const pathname = usePathname();
  const isImmersiveMap = pathname === "/map";

  return (
    <>
      <Navbar />
      <main className={isImmersiveMap ? "flex-1 overflow-hidden" : "flex-1 overflow-x-clip"}>
        {children}
      </main>
      {!isImmersiveMap && <Footer />}
    </>
  );
}
