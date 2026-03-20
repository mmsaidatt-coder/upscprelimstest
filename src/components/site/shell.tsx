"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { Footer } from "@/components/site/footer";
import { MinimalHeader } from "@/components/site/minimal-header";
import { SiteHeader } from "@/components/site/site-header";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";
  const isExamRoute = pathname.startsWith("/app/exams/") || pathname.startsWith("/app/pyq/run");
  const isAppRoute = pathname.startsWith("/app");

  if (isLoginRoute) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen">
      {isExamRoute ? <MinimalHeader /> : isAppRoute ? <AppHeader /> : <SiteHeader />}
      <main>{children}</main>
      {!isExamRoute ? <Footer /> : null}
    </div>
  );
}
