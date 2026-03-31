"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const mainNavigation = [
  { href: "/", label: "Dashboard", icon: "📊", exact: true },
  { href: "/app/analytics/all", label: "Analytics", icon: "📈", matchPrefix: "/app/analytics" },
  { href: "/app/pyq", label: "PYQ", icon: "📚", exact: false },
  { href: "/app/notebook", label: "Notebook", icon: "📓", exact: false },
];


const bottomNavigation = [
  { href: "/app/settings", label: "Profile / Settings", icon: "⚙️" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="flex-1 py-6">
        <nav className="space-y-1 px-4">
          {mainNavigation.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : item.matchPrefix
                ? pathname.startsWith(item.matchPrefix)
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-[var(--border)] p-4">
        <nav className="space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[#0e0e0e]/95 px-4 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-sm font-display font-bold tracking-widest text-[var(--foreground)] uppercase">
            UPSCPT
          </span>
          <span className="rounded bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
            App
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-lg border border-[#333] bg-[#111]"
          aria-label="Menu"
        >
          <span className={`block h-0.5 w-5 bg-[var(--muted)] transition-all ${mobileOpen ? "translate-y-[6.5px] rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-[var(--muted)] transition-all ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-[var(--muted)] transition-all ${mobileOpen ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 flex lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex w-64 max-w-[80vw] flex-col bg-[#0e0e0e] shadow-xl">
            <div className="flex h-14 items-center border-b border-[var(--border)] px-6">
              <span className="text-sm font-display font-bold tracking-widest text-[var(--accent)] uppercase">
                Menu
              </span>
            </div>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#262626] bg-[#0e0e0e]">
        <div className="flex h-16 items-center px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-lg font-display font-bold tracking-wider text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              UPSCPT
            </span>
            <span className="rounded border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
              App
            </span>
          </Link>
        </div>
        <NavContent />
      </aside>
    </>
  );
}
