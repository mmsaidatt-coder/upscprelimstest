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

        {/* Right: Auth */}
        <Link
          href="/login"
          className="text-sm font-semibold text-[var(--muted)] hover:text-white transition-colors"
        >
          Login / Sign up
        </Link>
      </div>
    </header>
  );
}
