"use client";

import Link from "next/link";
import { useState } from "react";

const navigation = [
  { href: "/pyq", label: "PYQ" },
  { href: "/flt", label: "FLT" },
  { href: "/subject-wise", label: "Subject wise" },
  { href: "/current-affairs", label: "Current affairs" },
  { href: "/design-paper", label: "Design Paper" },
  { href: "/analytics", label: "Analytics" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[#0e0e0e]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-sm sm:text-base font-display font-bold tracking-widest text-[var(--accent)] uppercase leading-none">
            <span className="hidden sm:inline">UPSCPRELIMSTEST.com</span>
            <span className="sm:hidden">UPSCPT.com</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Hamburger – mobile only */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-lg border border-[#333] bg-[#111]"
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-[var(--muted)] transition-all duration-200 ${open ? "rotate-45 translate-y-[6.5px]" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[var(--muted)] transition-all duration-200 ${open ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[var(--muted)] transition-all duration-200 ${open ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="lg:hidden border-t border-[#222] bg-[#0e0e0e] px-4 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm font-semibold text-[var(--muted)] hover:text-white hover:bg-[#1a1a1a] transition-all"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
