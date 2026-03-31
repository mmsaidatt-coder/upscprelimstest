"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/site/app-sidebar";
import { Footer } from "@/components/site/footer";
import { MinimalHeader } from "@/components/site/minimal-header";
import { SiteHeader } from "@/components/site/site-header";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";
  const isExamRoute = pathname.startsWith("/app/exams/") || pathname.startsWith("/app/pyq/run");
  const isAppRoute = pathname.startsWith("/app");
  const isSidebarRoute = pathname === "/" || (isAppRoute && !isExamRoute);

  if (isLoginRoute) {
    return <div className="min-h-screen">{children}</div>;
  }

  if (isSidebarRoute) {
    return (
      <div className="flex min-h-screen bg-[var(--background)] flex-col lg:flex-row">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {pathname === "/" && <SiteHeader />}
          <main className="flex-1">{children}</main>
          {pathname === "/" && <Footer />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {isExamRoute ? <MinimalHeader /> : <SiteHeader />}
      <main>{children}</main>
      {!isExamRoute ? <Footer /> : null}
    </div>
  );
}
