"use client";

import Link from "next/link";

export function AppTopBar() {
  return (
    <header className="sticky top-0 z-30 hidden lg:flex h-14 items-center justify-between border-b border-[#1a1a1a] bg-[#0e0e0e]/95 backdrop-blur-sm px-6">
      {/* Left: Logo / Brand */}
      <Link href="/" className="flex items-center gap-2 group shrink-0">
        <span className="text-sm font-display font-bold tracking-widest text-[var(--accent)] uppercase leading-none group-hover:text-[#b0f53b] transition-colors">
          <span className="hidden xl:inline">UPSCPRELIMSTEST</span>
          <span className="xl:hidden">UPSCPT</span>
        </span>
        <span className="rounded border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
          App
        </span>
      </Link>

      {/* Right: Profile / Settings */}
      <Link
        href="/app/settings"
        id="app-top-bar-profile-btn"
        aria-label="Profile and settings"
        className="flex items-center justify-center h-9 w-9 rounded-full border border-[#333] bg-[#111] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[#444] transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>
    </header>
  );
}

