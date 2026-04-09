import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
        404
      </p>
      <h1 className="heading mt-3 text-4xl text-[var(--foreground)] md:text-5xl">
        Page not{" "}
        <span className="italic text-[var(--accent)]">
          found
        </span>
      </h1>
      <p className="mt-3 max-w-sm text-sm text-[var(--muted)]">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--accent-hover)]"
        >
          Go home
        </Link>
        <Link
          href="/app"
          className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-bold text-[var(--foreground)] hover:border-[var(--accent)]"
        >
          Open app
        </Link>
      </div>
    </div>
  );
}
