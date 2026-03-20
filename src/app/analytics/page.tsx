import Link from "next/link";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="py-16">
        <p className="text-sm font-semibold text-[var(--accent)]">Analytics</p>
        <h1 className="heading mt-3 max-w-2xl text-3xl md:text-4xl">
          See what to fix next — fast
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
          Subject radar, pacing patterns, and readiness signals convert
          attempts into clear next actions.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          Open analytics
        </Link>
      </section>
    </div>
  );
}
