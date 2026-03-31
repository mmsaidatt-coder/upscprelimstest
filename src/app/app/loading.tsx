export default function AppLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="card h-[120px] w-full animate-pulse bg-[var(--background-secondary)]" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="card h-[200px] animate-pulse bg-[var(--background-secondary)]"
          />
        ))}
      </div>
    </div>
  );
}
