import Link from "next/link";

export function MinimalHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color:rgba(27,33,28,0.96)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[96rem] items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-10">
        <Link href="/app" className="group flex items-center gap-3" aria-label="Exit exam mode">
          <span className="font-mono text-sm font-bold tracking-[-0.08em] text-[var(--foreground)] sm:text-base">
            UPSC
          </span>
          <span className="h-6 w-px bg-[var(--accent)]" />
          <span className="font-mono text-[8px] font-bold uppercase leading-[1.3] tracking-[0.2em] text-[var(--muted)] sm:text-[9px]">
            Prelims
            <br />
            Test
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="signal-dot" aria-hidden="true" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] sm:text-[10px]">
            Exam mode
          </span>
        </div>
      </div>
    </header>
  );
}
