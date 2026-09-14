import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  FlaskConical,
  Globe2,
  Landmark,
  Leaf,
  Newspaper,
  Scale,
} from "lucide-react";

export const metadata: Metadata = {
  title: "UPSC Prelims Analytics — Subject-wise Performance Tracking",
  description:
    "Track your UPSC Prelims readiness with subject-wise analytics for Polity, History, Economy, Geography, Environment, Science & Current Affairs. Radar charts, pacing analysis, and readiness bands.",
  alternates: { canonical: "https://upscprelimstest.com/analytics" },
  openGraph: {
    title: "UPSC Prelims Analytics — Subject-wise Performance Tracking",
    description:
      "Track UPSC Prelims performance by subject with radar charts, pacing analysis, and readiness bands.",
    url: "https://upscprelimstest.com/analytics",
  },
};

const subjects = [
  { slug: "polity", label: "Polity", detail: "Constitution and governance", icon: Scale },
  { slug: "history", label: "History", detail: "History, culture and freedom struggle", icon: Landmark },
  { slug: "economy", label: "Economy", detail: "Money, policy and development", icon: Banknote },
  { slug: "geography", label: "Geography", detail: "India, world and physical systems", icon: Globe2 },
  { slug: "environment", label: "Environment", detail: "Ecology, biodiversity and climate", icon: Leaf },
  { slug: "science", label: "Science & Tech", detail: "Health, space and applied science", icon: FlaskConical },
  { slug: "current-affairs", label: "Current Affairs", detail: "Events connected to the syllabus", icon: Newspaper },
];

export default function AnalyticsPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)]">
      <section className="editorial-grid border-b border-[var(--border)]">
        <div className="page-shell grid gap-12 py-16 sm:py-24 lg:grid-cols-[0.95fr_1.05fr] lg:items-end lg:gap-20 lg:py-28">
          <div>
            <p className="editorial-kicker">Performance intelligence</p>
            <h1 className="heading mt-8 text-5xl sm:text-6xl lg:text-7xl">
              Turn attempts into
              <br />
              <span className="text-[var(--accent)]">the next decision.</span>
            </h1>
          </div>
          <div>
            <p className="body-copy max-w-xl">
              Inspect subject accuracy, pacing patterns, and readiness signals. Each view is a durable URL you can return to as your attempt history grows.
            </p>
            <Link href="/analytics/all" className="action-primary mt-8">
              Open complete analytics <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="page-shell py-16 sm:py-24 lg:py-28">
        <div className="flex flex-col gap-5 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="editorial-kicker">Subject index</p>
            <h2 className="heading mt-6 text-3xl sm:text-4xl">Find the weakest signal first.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">Open any subject to inspect its performance view and recommended focus areas.</p>
        </div>

        <div className="grid gap-px border-x border-b border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject, index) => {
            const Icon = subject.icon;
            return (
              <Link
                key={subject.slug}
                href={`/analytics/${subject.slug}`}
                className="group flex min-h-48 flex-col bg-[var(--background-secondary)] p-6 transition-colors hover:bg-[var(--background-tertiary)] sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="index-number">0{index + 1}</span>
                  <Icon className="h-5 w-5 text-[var(--muted)] group-hover:text-[var(--accent)]" strokeWidth={1.5} />
                </div>
                <h3 className="mt-8 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{subject.label}</h3>
                <p className="mt-2 text-xs leading-6 text-[var(--muted)]">{subject.detail}</p>
                <span className="mt-auto flex items-center gap-2 pt-7 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--foreground)]">
                  Inspect subject <ArrowRight className="h-3.5 w-3.5 text-[var(--accent)] transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
