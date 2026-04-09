"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/site/app-sidebar";
import { AppTopBar } from "@/components/site/app-top-bar";
import { Footer } from "@/components/site/footer";
import { MinimalHeader } from "@/components/site/minimal-header";
import { SiteHeader } from "@/components/site/site-header";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";
  const isExamRoute = pathname.startsWith("/app/exams/") || pathname.startsWith("/app/pyq/run");
  const isAppRoute = pathname.startsWith("/app");
  const isSidebarRoute = isAppRoute && !isExamRoute;

  if (isLoginRoute) {
    return <div className="min-h-dvh">{children}</div>;
  }

  if (pathname === "/" || isSidebarRoute) {
    return (
      <div className="flex min-h-dvh bg-[#FAF7F2] flex-col lg:flex-row">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppTopBar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      {isExamRoute ? <MinimalHeader /> : <SiteHeader />}
      <main>{children}</main>
      {!isExamRoute ? <Footer /> : null}
    </div>
  );
}
