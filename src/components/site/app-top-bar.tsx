"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";

const pageNames: Record<string, string> = {
  "/app": "Command centre",
  "/app/pyq": "Previous papers",
  "/app/flt": "Full-length tests",
  "/app/subject-wise": "Subject drills",
  "/app/design-paper": "Design a paper",
  "/app/current-affairs": "Current affairs",
  "/app/analytics": "Performance analytics",
  "/app/bookmarks": "Saved questions",
  "/app/forum": "Community forum",
  "/app/settings": "Profile settings",
};

export function AppTopBar() {
  const pathname = usePathname();
  const exact = pageNames[pathname];
  const prefix = Object.keys(pageNames)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(`${key}/`));
  const pageName = exact ?? (prefix ? pageNames[prefix] : "Study workspace");

  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-[var(--border)] bg-[color:rgba(27,33,28,0.93)] px-6 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3">
        <span className="signal-dot" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
          {pageName}
        </span>
      </div>

      <Link
        href="/app/settings"
        id="app-top-bar-profile-btn"
        aria-label="Profile and settings"
        className="flex h-10 w-10 items-center justify-center border border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
      >
        <UserRound className="h-4 w-4" strokeWidth={1.7} />
      </Link>
    </header>
  );
}
