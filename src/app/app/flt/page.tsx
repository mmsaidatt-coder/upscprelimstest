import Link from "next/link";

export const dynamic = "force-dynamic";

export default function FLTPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="card p-4 sm:p-6">
        <p className="text-xs font-semibold text-[var(--accent)] sm:text-sm">Practice / FLT</p>
        <h1 className="heading mt-1.5 text-xl sm:mt-2 sm:text-2xl md:text-3xl">
          Full Length Tests
        </h1>
        <p className="mt-1.5 max-w-lg text-xs leading-5 text-[var(--muted)] sm:mt-2 sm:text-sm sm:leading-6">
          Access heavily randomized simulated mock papers utilizing exact UPSC mathematical blueprints across 10,000+ AI records.
        </p>
      </div>

      <div className="card-elevated p-6 flex flex-col justify-between max-w-md">
        <div>
          <div className="mb-3 text-3xl">🏛️</div>
          <h2 className="heading text-xl mb-2">UPSC Simulator (100 Qs)</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed mb-6">
            A meticulously generated 100-question Simulator enforcing exact historical UPSC ratios (History: 18%, Polity: 15%, Economy: 15%, Environment: 15%, Science: 7%, Geography: 15%, Current Affairs: 15%).
          </p>
        </div>
        <Link
          href="/app/design-paper/run?mode=upsc_flt&size=100"
          className="w-full text-center rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          Generate Real-Time Simulator
        </Link>
      </div>
    </div>
  );
}
