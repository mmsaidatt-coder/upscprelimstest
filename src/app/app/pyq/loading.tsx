export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="card h-[200px] w-full animate-pulse bg-[var(--background-secondary)]"></div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card h-[400px] animate-pulse bg-[var(--background-secondary)]"></div>
        <div className="card h-[400px] animate-pulse bg-[var(--background-secondary)]"></div>
      </div>
    </div>
  );
}
