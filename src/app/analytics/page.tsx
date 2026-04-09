import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "UPSC Prelims Analytics — Subject-wise Performance Tracking",
  description:
    "Track your UPSC Prelims readiness with subject-wise analytics for Polity, History, Economy, Geography, Environment, Science & Current Affairs. Radar charts, pacing analysis, and readiness bands.",
  alternates: {
    canonical: "https://upscprelimstest.com/analytics",
  },
  openGraph: {
    title: "UPSC Prelims Analytics — Subject-wise Performance Tracking",
    description:
      "Track UPSC Prelims performance by subject with radar charts, pacing analysis, and readiness bands.",
    url: "https://upscprelimstest.com/analytics",
  },
};

const SUBJECTS = [
  { slug: "polity", label: "Polity", icon: "⚖️" },
  { slug: "history", label: "History", icon: "🏛️" },
  { slug: "economy", label: "Economy", icon: "📈" },
  { slug: "geography", label: "Geography", icon: "🌍" },
  { slug: "environment", label: "Environment", icon: "🌿" },
  { slug: "science", label: "Science & Tech", icon: "🔬" },
  { slug: "current-affairs", label: "Current Affairs", icon: "📰" },
];

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="py-16">
        <p className="text-sm font-semibold text-[var(--accent)]">Analytics</p>
        <h1 className="heading mt-3 max-w-2xl text-3xl md:text-4xl">
          See what to fix next — fast
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
          Subject radar, pacing patterns, and readiness signals convert attempts into
          clear next actions. Every analytics page has its own URL — bookmark it and it works tomorrow.
        </p>

        <Link
          href="/analytics/all"
          className="mt-6 inline-flex rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent)]/90 transition-colors"
        >
          Open analytics →
        </Link>
      </section>

      <section className="pb-16">
        <p className="label mb-4">Browse by subject</p>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {SUBJECTS.map((s) => (
            <Link
              key={s.slug}
              href={`/analytics/${s.slug}`}
              className="card flex items-center gap-3 p-4 hover:bg-[var(--background-secondary)] transition-colors group"
            >
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  {s.label}
                </p>
                <p className="text-xs text-[var(--muted)]">upscprelimstest.com/analytics/{s.slug}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
