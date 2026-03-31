export default function AttemptLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="card h-[100px] w-full animate-pulse bg-[var(--background-secondary)]" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card h-[300px] animate-pulse bg-[var(--background-secondary)]" />
        <div className="card h-[300px] animate-pulse bg-[var(--background-secondary)]" />
      </div>
    </div>
  );
}
