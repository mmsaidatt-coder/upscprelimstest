import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[#0e0e0e]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <span className="text-sm sm:text-base font-display font-bold tracking-widest text-[var(--accent)] uppercase leading-none group-hover:text-[#b0f53b] transition-colors">
            <span className="hidden sm:inline">UPSCPRELIMSTEST.com</span>
            <span className="sm:hidden">UPSCPT.com</span>
          </span>
        </Link>

        {/* Right: Profile / Settings */}
        <Link
          href="/app/settings"
          id="site-header-profile-btn"
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
      </div>
    </header>
  );
}
