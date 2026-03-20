import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            UPSC Prelims Test
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Practice like the exam. Review like a strategist.
          </p>
        </div>

        <nav className="flex gap-5 text-sm text-[var(--muted)]">
          <Link href="/platform" className="hover:text-[var(--foreground)]">Platform</Link>
          <Link href="/app" className="hover:text-[var(--foreground)]">Start Practicing</Link>
        </nav>
      </div>
    </footer>
  );
}
