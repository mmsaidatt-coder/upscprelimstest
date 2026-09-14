import type { Metadata } from "next";
import Link from "next/link";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { FaqSection } from "@/components/seo/faq-section";
import { PYQ_SUBJECTS, SUBJECT_SLUGS } from "@/lib/seo/pyq-seo";

const practiceSubjects = PYQ_SUBJECTS;

const subjectCopy: Record<(typeof practiceSubjects)[number], string> = {
  Polity: "Constitution, Parliament, federalism, rights, judiciary, and governance questions from PYQs and the larger practice bank.",
  History: "Ancient, medieval, modern India, freedom struggle, culture, and art-history questions with timed review.",
  Economy: "Budget, banking, inflation, external sector, planning, agriculture, and applied economic concepts.",
  Geography: "Indian geography, world geography, mapping, climate, rivers, resources, and environment-linked geography.",
  Environment: "Ecology, biodiversity, climate agreements, protected areas, pollution, and current-linked environment themes.",
  Science: "General science, health, biotechnology, space, defence, and applied science and technology questions.",
  "Current Affairs": "Repository-backed current affairs practice organized into exam-style timed question sets.",
};

const subjectSlug = (subject: string) =>
  subject.toLowerCase().replace(/\s*&\s*/g, "-").replace(/\s+/g, "-");

const SUBJECT_FAQS = [
  {
    question: "Can I practice UPSC Prelims questions subject-wise?",
    answer:
      "Yes. You can launch focused subject-wise drills for Polity, History, Economy, Geography, Environment, Science, and Current Affairs with timed sessions and negative marking.",
  },
  {
    question: "Which subject should I start with for UPSC Prelims practice?",
    answer:
      "Start with the subject where your accuracy is weakest, or begin with Polity and Environment because they are frequent UPSC Prelims scoring areas. Each drill gives you a faster feedback loop than a full mock.",
  },
  {
    question: "Are subject-wise UPSC practice tests free?",
    answer:
      "Yes. Subject-wise UPSC Prelims practice is free and does not require signup to start a test.",
  },
];

export const metadata: Metadata = {
  title: "UPSC Subject-wise Practice Tests — Polity, History, Economy & More",
  description:
    "Free subject-wise UPSC Prelims practice tests for Polity, History, Economy, Geography, Environment, Science, and Current Affairs. Launch timed 50-question drills and review PYQ trends.",
  alternates: {
    canonical: "https://upscprelimstest.com/subject-wise",
  },
  openGraph: {
    title: "UPSC Subject-wise Practice Tests — Free Timed Drills",
    description:
      "Practice UPSC Prelims by subject with no signup: Polity, History, Economy, Geography, Environment, Science, and Current Affairs.",
    url: "https://upscprelimstest.com/subject-wise",
  },
};

export default function SubjectWisePage() {
  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <FaqJsonLd faqs={SUBJECT_FAQS} />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Subject-wise UPSC practice
          </p>
          <h1 className="heading mt-4 text-4xl leading-none text-[var(--foreground)] sm:text-6xl">
            UPSC Prelims subject-wise practice tests
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
            Pick a subject, launch a timed drill, and review your mistakes with
            negative marking and subject-level analytics. No signup required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/test/pyq-polity-50"
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              Start Polity 50Q
            </Link>
            <Link
              href="/pyq/subject/polity"
              className="rounded-full border border-[var(--border)] bg-[var(--background-secondary)] px-6 py-3 text-sm font-bold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              View Polity PYQ trend
            </Link>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {practiceSubjects.map((subject) => (
            <article
              key={subject}
              className="flex min-h-[260px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                UPSC {subject}
              </p>
              <h2 className="heading mt-3 text-3xl text-[var(--foreground)]">
                {subject}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {subjectCopy[subject]}
              </p>
              <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                <Link
                  href={`/test/pyq-${subjectSlug(subject)}-50`}
                  className="flex min-h-12 items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[var(--accent-hover)]"
                >
                  50Q drill
                </Link>
                <Link
                  href={`/pyq/subject/${SUBJECT_SLUGS[subject as keyof typeof SUBJECT_SLUGS]}`}
                  className="flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Trend
                </Link>
              </div>
            </article>
          ))}
        </section>
        <FaqSection title="Subject-wise UPSC practice FAQs" faqs={SUBJECT_FAQS} />
      </main>
    </div>
  );
}
