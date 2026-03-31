"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Target, 
  BookOpenText, 
  FileEdit, 
  FolderOpen, 
  PencilRuler, 
  Newspaper, 
  LineChart, 
  Bookmark, 
  ChevronRight,
  User
} from "lucide-react";

// ── Navigation structure ──────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
  matchPrefix?: string;
};

type NavGroup = {
  label: string;
  icon: React.ReactNode;
  matchPrefix: string;
  children: NavItem[];
};

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const mainNavigation: NavEntry[] = [
  {
    label: "Practice",
    icon: <Target className="w-5 h-5 flex-shrink-0" strokeWidth={2.2} />,
    matchPrefix: "/app/practice",
    children: [
      { href: "/app/pyq", label: "PYQ", icon: <BookOpenText className="w-4 h-4" strokeWidth={2} />, matchPrefix: "/app/pyq" },
      { href: "/app/flt", label: "FLT", icon: <FileEdit className="w-4 h-4" strokeWidth={2} />, matchPrefix: "/app/flt" },
      { href: "/app/subject-wise", label: "Subject Wise", icon: <FolderOpen className="w-4 h-4" strokeWidth={2} />, matchPrefix: "/app/subject-wise" },
      { href: "/app/design-paper", label: "Design Paper", icon: <PencilRuler className="w-4 h-4" strokeWidth={2} />, matchPrefix: "/app/design-paper" },
    ],
  },
  {
    href: "/app/current-affairs",
    label: "Current Affairs",
    icon: <Newspaper className="w-5 h-5 flex-shrink-0" strokeWidth={2.2} />,
    matchPrefix: "/app/current-affairs",
  } as NavItem,
  {
    href: "/app/analytics/all",
    label: "Analytics",
    icon: <LineChart className="w-5 h-5 flex-shrink-0" strokeWidth={2.2} />,
    matchPrefix: "/app/analytics",
  } as NavItem,
  {
    href: "/app/bookmarks",
    label: "Bookmarks",
    icon: <Bookmark className="w-5 h-5 flex-shrink-0" strokeWidth={2.2} />,
    matchPrefix: "/app/bookmarks",
  } as NavItem,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

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



// ── NavLinks component (shared between desktop & mobile) ──────────────────────

function NavLinks({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();

  function isItemActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    if (item.matchPrefix) return pathname === item.href || pathname.startsWith(item.matchPrefix);
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  function isGroupActive(group: NavGroup): boolean {
    return group.children.some((child) => isItemActive(child));
  }

  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Auto-expand a group if a child route is active
  useEffect(() => {
    const autoExpand: Record<string, boolean> = {};
    mainNavigation.forEach((entry) => {
      if (isGroup(entry) && isGroupActive(entry)) {
        autoExpand[entry.label] = true;
      }
    });
    setExpandedGroups((prev) => ({ ...prev, ...autoExpand }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <div className="flex-1 overflow-y-auto py-5">
      <nav className="space-y-1.5 px-3">
        {mainNavigation.map((entry) => {
          if (isGroup(entry)) {
            const active = isGroupActive(entry);
            const open = expandedGroups[entry.label] ?? false;

            return (
              <div key={entry.label}>
                {/* Group header button */}
                <button
                  onClick={() => toggleGroup(entry.label)}
                  title={collapsed ? entry.label : undefined}
                  className={`group flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-semibold transition-all ${
                    active
                      ? "text-[var(--accent)]"
                      : "text-[var(--muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                  } ${collapsed ? "justify-center px-2" : ""}`}
                >
                  <span className={`shrink-0 flex items-center justify-center transition-transform ${active && !collapsed ? 'scale-110' : ''}`}>{entry.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-left">{entry.label}</span>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? "rotate-90 text-[var(--foreground)]" : "text-[var(--muted)]"}`} />
                    </>
                  )}
                </button>

                {/* Children */}
                {!collapsed && open && (
                  <div className="ml-5 mt-1 space-y-1 border-l-2 border-[#262626] pl-3 py-1">
                    {entry.children.map((child) => {
                      const childActive = isItemActive(child);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClick}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-all ${
                            childActive
                              ? "bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm"
                              : "text-[var(--muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          <span className={`shrink-0 flex items-center justify-center transition-transform ${childActive ? 'scale-110' : ''}`}>{child.icon}</span>
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Collapsed tooltip-style children visible on hover — show icons only */}
                {collapsed && open && (
                  <div className="mt-1 space-y-1">
                    {entry.children.map((child) => {
                      const childActive = isItemActive(child);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClick}
                          title={child.label}
                          className={`flex justify-center items-center rounded-lg px-2 py-2 text-sm font-medium transition-all ${
                            childActive
                              ? "bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm"
                              : "text-[var(--muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          <span className="flex items-center justify-center">{child.icon}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Regular nav item
          const item = entry as NavItem;
          const active = isItemActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClick}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-semibold transition-all ${
                active
                  ? "bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm"
                  : "text-[var(--muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
              } ${collapsed ? "justify-center px-2" : ""}`}
            >
              <span className={`shrink-0 flex items-center justify-center transition-transform ${active && !collapsed ? 'scale-110' : ''}`}>{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// ── AppSidebar ────────────────────────────────────────────────────────────────

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#262626] bg-[#0e0e0e]/95 px-4 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[1.1rem] font-display font-extrabold tracking-widest text-[var(--foreground)] uppercase">
            UPSCPT
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/app/settings"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#333] bg-[#111] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Settings"
          >
            <User className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#333] bg-[#111] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>
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
            <NavLinks collapsed={false} onClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col border-r border-[#262626] bg-[#0e0e0e] transition-all duration-300 ease-in-out ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo + hamburger toggle row */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-[#1a1a1a] ${
            collapsed ? "justify-center px-0" : "justify-between px-5"
          }`}
        >
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-[1.3rem] font-display font-black tracking-wider text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                UPSCPT
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

        <NavLinks collapsed={collapsed} />

        {/* Bottom: Profile / Settings */}
        <div className="shrink-0 border-t border-[#1a1a1a] p-3">
          <Link
            href="/app/settings"
            title={collapsed ? "Profile / Settings" : undefined}
            className={`flex items-center gap-3.5 rounded-xl px-3 py-3 text-[15px] font-semibold text-[var(--muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] transition-all ${
              collapsed ? "justify-center px-2" : ""
            }`}
          >
            <span className="shrink-0 flex items-center justify-center"><User className="w-5 h-5 flex-shrink-0" strokeWidth={2.2} /></span>
            {!collapsed && <span className="truncate">Profile / Settings</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
