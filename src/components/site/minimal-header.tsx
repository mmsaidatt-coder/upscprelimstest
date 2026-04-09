import Link from "next/link";

export function MinimalHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/app"
          className="flex items-center gap-2.5 group"
        >
          {/* Logo mark */}
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white sm:h-9 sm:w-9 sm:text-base">
            U
          </span>
          <span className="text-base font-serif font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors sm:text-lg">
            <span className="sm:hidden">UPSCPT</span>
            <span className="hidden sm:inline">UPSC Prelims Test</span>
          </span>
        </Link>
        <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] sm:text-xs">
          Exam mode
        </span>
      </div>
    </header>
  );
}
