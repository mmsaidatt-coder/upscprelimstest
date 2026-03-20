export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--accent)]"></div>
        <p className="text-sm font-medium tracking-wider text-[var(--muted)] animate-pulse uppercase">
          Building your test...
        </p>
      </div>
    </div>
  );
}
