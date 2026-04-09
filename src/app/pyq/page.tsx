import type { Metadata } from "next";
import Link from "next/link";
import { PyqTabs } from "@/components/pyq/pyq-tabs";
import { FaqJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title:
    "UPSC Previous Year Questions (PYQ) 2014–2025 — Free Practice | upscprelimstest.com",
  description:
    "Practice 1,200+ UPSC Prelims previous year questions from 2014 to 2025. Drill by year or subject — Polity, History, Economy, Geography, Environment, Science & Current Affairs. Free, timed, exam-like sessions.",
  alternates: {
    canonical: "https://upscprelimstest.com/pyq",
  },
  openGraph: {
    title: "UPSC Previous Year Questions (PYQ) 2014–2025 — Free Practice",
    description:
      "Practice 1,200+ UPSC Prelims PYQs from the last 12 years. Choose by year or subject. Timed sessions with analytics.",
    url: "https://upscprelimstest.com/pyq",
  },
};

const PYQ_FAQS = [
  {
    question: "How many UPSC Prelims previous year questions are available?",
    answer:
      "We have over 1,200 previous year questions spanning from 2014 to 2025, covering all subjects — Polity, History, Economy, Geography, Environment, Science & Technology, and Current Affairs.",
  },
  {
    question: "Can I practice UPSC PYQs subject-wise?",
    answer:
      "Yes. You can drill PYQs by individual subject (Polity, History, Economy, Geography, Environment, Science & Tech, Current Affairs) or take a full year-wise test with all 100 questions.",
  },
  {
    question: "Are the PYQ practice tests timed like the real UPSC exam?",
    answer:
      "Yes. Every practice session includes a countdown timer, negative marking, question palette navigation, and mark-for-review — exactly like the real UPSC Prelims examination.",
  },
  {
    question: "Is the UPSC PYQ practice platform free?",
    answer:
      "Completely free. No paywall, no trial period. Full access to all 1,200+ questions, analytics, and features — always.",
  },
];

export default function PyqPage() {
  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <FaqJsonLd faqs={PYQ_FAQS} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-20 md:py-28 fade-up">
        <PyqTabs />
      </div>

      {/* SEO-visible content for crawlers — years and subjects listed as text */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <h2 className="heading text-2xl sm:text-3xl text-[var(--foreground)] mb-6">
          UPSC PRELIMS PYQ YEARS
        </h2>
        <p className="text-sm text-[var(--muted)] mb-4 max-w-2xl">
          Practice original UPSC Civil Services Preliminary Examination
          questions from the following years. Each year&apos;s paper contains
          100 questions with 2-hour time limit and ⅓ negative marking.
        </p>
        <div className="flex flex-wrap gap-2 mb-12">
          {Array.from({ length: 12 }, (_, i) => 2025 - i).map((year) => (
            <Link
              key={year}
              href={`/app/pyq/run?year=${year}&limit=100`}
              className="rounded-full border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              UPSC {year}
            </Link>
          ))}
        </div>

        <h2 className="heading text-2xl sm:text-3xl text-[var(--foreground)] mb-6">
          PRACTICE BY SUBJECT
        </h2>
        <p className="text-sm text-[var(--muted)] mb-4 max-w-2xl">
          Focus your preparation on specific subjects. Each subject drill pulls
          questions from all available years, helping you identify patterns and
          frequently tested topics.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "Polity",
            "History",
            "Economy",
            "Geography",
            "Environment",
            "Science & Tech",
            "Current Affairs",
          ].map((subject) => (
            <Link
              key={subject}
              href={`/app/pyq/run?subject=${encodeURIComponent(subject)}&limit=50`}
              className="rounded-full border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              {subject}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
