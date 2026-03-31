"use client";

import Link from "next/link";

export default function AttemptError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--danger)]">
        Error
      </p>
      <h1 className="heading mt-3 text-3xl text-[var(--foreground)]">
        Could not load results
      </h1>
      <p className="mt-3 max-w-sm text-sm text-[var(--muted)]">
        We could not load your attempt results. Please try again.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          Try again
        </button>
        <Link
          href="/app"
          className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:border-[#555]"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
