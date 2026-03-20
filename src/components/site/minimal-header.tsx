import Link from "next/link";

export function MinimalHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[#0e0e0e]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-bold tracking-tight text-[var(--foreground)]"
        >
          UPSC Prelims Test
        </Link>
        <span className="badge text-[11px]">Exam mode</span>
      </div>
    </header>
  );
}
