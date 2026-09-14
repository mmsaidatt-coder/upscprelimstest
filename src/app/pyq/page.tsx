import type { Metadata } from "next";
import Link from "next/link";
import { PyqTabs } from "@/components/pyq/pyq-tabs";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { FaqSection } from "@/components/seo/faq-section";
import { PYQ_YEARS, SUBJECT_SLUGS } from "@/lib/seo/pyq-seo";

export const metadata: Metadata = {
  title:
    "UPSC PYQ 2014–2026 — Solved Papers & Official 2026 PDFs",
  description:
    "Practice 1,199 solved UPSC Prelims questions from 2014–2025, or download the official 2026 GS Paper I and CSAT PDFs. Free year- and subject-wise PYQs.",
  alternates: {
    canonical: "https://upscprelimstest.com/pyq",
  },
  openGraph: {
    title: "UPSC PYQ 2014–2026 — Solved Papers & Official 2026 PDFs",
    description:
      "Practice 1,199 solved PYQs from 2014–2025 and access UPSC-hosted 2026 GS Paper I and CSAT PDFs.",
    url: "https://upscprelimstest.com/pyq",
  },
};

const PYQ_FAQS = [
  {
    question: "How many UPSC Prelims previous year questions are available?",
    answer:
      "The solved bank has 1,199 General Studies Paper I questions from 2014 to 2025. The 2026 page currently links to the official UPSC-hosted GS Paper I and CSAT PDFs while independent answer review is pending.",
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
      "Yes. The 1,199 solved questions, paper links, practice sessions, and core analytics are available without a paywall.",
  },
];

export default async function PyqPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <FaqJsonLd faqs={PYQ_FAQS} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-20 md:py-28 fade-up">
        <PyqTabs initialQuery={q?.slice(0, 120) ?? ""} />
      </div>

      {/* SEO-visible content for crawlers — years and subjects listed as text */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <h2 className="heading text-2xl sm:text-3xl text-[var(--foreground)] mb-6">
          UPSC PRELIMS PYQ YEARS
        </h2>
        <p className="text-sm text-[var(--muted)] mb-4 max-w-2xl">
          Browse solved General Studies Paper I questions from 2014–2025, plus
          official UPSC-hosted Paper I and Paper II PDFs for 2026 while our
          independent answer review is pending.
        </p>
        <div className="flex flex-wrap gap-2 mb-12">
          {PYQ_YEARS.map((year) => (
            <Link
              key={year}
              href={`/pyq/${year}`}
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
              href={`/pyq/subject/${
                SUBJECT_SLUGS[
                  (subject === "Science & Tech" ? "Science" : subject) as keyof typeof SUBJECT_SLUGS
                ]
              }`}
              className="rounded-full border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              {subject}
            </Link>
          ))}
        </div>
        <FaqSection title="UPSC PYQ practice questions" faqs={PYQ_FAQS} />
      </section>
    </div>
  );
}
