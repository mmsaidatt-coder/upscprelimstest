"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--danger)]">
        Something went wrong
      </p>
      <h1 className="heading mt-3 text-3xl text-[var(--foreground)]">
        Unexpected error
      </h1>
      <p className="mt-3 max-w-sm text-sm text-[var(--muted)]">
        An error occurred while loading this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
      >
        Try again
      </button>
    </div>
  );
}
