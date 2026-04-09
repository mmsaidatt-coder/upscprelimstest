"use client";

import Link from "next/link";

export function AppTopBar() {
  return (
    <header className="sticky top-0 z-30 hidden lg:flex h-14 items-center justify-between border-b border-[#E5E0DA] bg-[#FAF7F2]/95 backdrop-blur-sm px-6">
      {/* Left: Logo / Brand */}
      <Link href="/" className="flex items-center gap-2 group shrink-0">
        <span className="text-sm font-serif font-bold tracking-wide text-[#1A1A1A] leading-none group-hover:text-[#C4784A] transition-colors">
          <span className="hidden xl:inline">UPSC Prelims Test</span>
          <span className="xl:hidden">UPSCPT</span>
        </span>
      </Link>

      {/* Right: Profile / Settings */}
      <Link
        href="/app/settings"
        id="app-top-bar-profile-btn"
        aria-label="Profile and settings"
        className="flex items-center justify-center h-9 w-9 rounded-full border border-[#E0DBD4] bg-white text-[#6B7280] hover:text-[#1A1A1A] hover:border-[#C4784A]/40 transition-all"
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
