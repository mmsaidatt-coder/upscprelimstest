import Link from "next/link";

const appNavigation = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/pyq", label: "PYQ" },
  { href: "/app/notebook", label: "Notebook" },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-xl font-serif font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
            UPSC Prelims Test
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {appNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
