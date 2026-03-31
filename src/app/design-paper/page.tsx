export default function DesignPaperPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <header className="mb-12 text-center">
        <h1 className="heading text-5xl">DESIGN PAPER</h1>
        <p className="mt-4 text-[var(--muted)]">Custom test design laboratory. Coming soon.</p>
      </header>

      <section className="card flex flex-col items-center justify-center p-16 text-center border-dashed border-[var(--border)] bg-transparent">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--background-secondary)] mb-6 text-2xl">
          🏗️
        </div>
        <h2 className="heading text-3xl mb-3">Under Construction</h2>
        <p className="max-w-md text-[var(--muted)] leading-7">
          This feature will allow you to construct tailor-made mock exams by selecting exact topics and mixing historical PYQ data. Stay tuned!
        </p>
      </section>
    </div>
  );
}
