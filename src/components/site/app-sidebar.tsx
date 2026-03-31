"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const mainNavigation = [
  { href: "/app", label: "Dashboard", icon: "📊", exact: true },
  { href: "/app/analytics/all", label: "Analytics", icon: "📈", matchPrefix: "/app/analytics" },
  { href: "/app/pyq", label: "PYQ", icon: "📚", exact: false },
  { href: "/app/notebook", label: "Notebook", icon: "📓", exact: false },
];

const bottomNavigation = [
  { href: "/app/settings", label: "Profile / Settings", icon: "⚙️" },
];

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="flex h-5 w-5 flex-col items-center justify-center gap-[4px]">
      <span
        className={`block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ${
          open ? "translate-y-[6px] rotate-45" : ""
        }`}
      />
      <span
        className={`block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ${
          open ? "opacity-0 scale-x-0" : ""
        }`}
      />
      <span
        className={`block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ${
          open ? "-translate-y-[6px] -rotate-45" : ""
        }`}
      />
    </span>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Desktop: collapsed = icon-only rail; default expanded
  const [collapsed, setCollapsed] = useState(false);

  // Persist collapse state across reloads
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  }

  function isActive(item: (typeof mainNavigation)[number]) {
    return item.exact
      ? pathname === item.href
      : "matchPrefix" in item && item.matchPrefix
        ? pathname.startsWith(item.matchPrefix as string)
        : pathname === item.href || pathname.startsWith(item.href + "/");
  }

  // Shared nav links — used in both mobile drawer and desktop sidebar
  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      <div className="flex-1 py-4">
        <nav className="space-y-0.5 px-2">
          {mainNavigation.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClick}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                } ${collapsed ? "justify-center px-2" : ""}`}
              >
                <span className="shrink-0 text-base leading-none">{item.icon}</span>
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-[var(--border)] p-2">
        <nav className="space-y-0.5">
          {bottomNavigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClick}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                } ${collapsed ? "justify-center px-2" : ""}`}
              >
                <span className="shrink-0 text-base leading-none">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────────────────────── */}
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
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#333] bg-[#111] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          <HamburgerIcon open={mobileOpen} />
        </button>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-64 max-w-[80vw] flex-col bg-[#0e0e0e] shadow-xl">
            <div className="flex h-14 items-center border-b border-[var(--border)] px-5">
              <span className="text-sm font-display font-bold tracking-widest text-[var(--accent)] uppercase">
                Menu
              </span>
            </div>
            <NavLinks onClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col border-r border-[#262626] bg-[#0e0e0e] transition-all duration-300 ease-in-out ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo + hamburger toggle row */}
        <div
          className={`flex h-16 items-center border-b border-[#1a1a1a] ${
            collapsed ? "justify-center px-0" : "justify-between px-5"
          }`}
        >
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-base font-display font-bold tracking-wider text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                UPSCPT
              </span>
              <span className="rounded border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                App
              </span>
            </Link>
          )}

          <button
            onClick={toggleCollapsed}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] transition-colors ${
              collapsed ? "mx-auto" : ""
            }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <HamburgerIcon open={!collapsed} />
          </button>
        </div>

        <NavLinks />
      </aside>
    </>
  );
}
