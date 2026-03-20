import Link from "next/link";
import { ExamRunner } from "@/components/exam/exam-runner";
import { fetchQuestions } from "@/lib/supabase/questions";
import type { ExamTest, Subject } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseLimit(raw: string | undefined) {
  const parsed = raw ? Number(raw) : 25;
  if (!Number.isFinite(parsed)) return 25;
  return Math.max(1, Math.min(200, Math.round(parsed)));
}

export default async function PyqRunPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; subject?: string; limit?: string }>;
}) {
  const { year, subject, limit } = await searchParams;

  const yearNumber = year ? Number(year) : undefined;
  const subjectFilter = subject?.trim() as Subject | undefined;
  const questionLimit = parseLimit(limit);

  const questions = await fetchQuestions({
    year: yearNumber,
    subject: subjectFilter,
    limit: questionLimit,
    shuffle: true,
  });

  if (!questions.length) {
    return (
      <section className="mx-auto max-w-5xl space-y-6 px-6 py-16">
        <div className="mesh-card rounded-[2rem] p-8">
          <h1 className="display-title text-4xl text-[var(--foreground)]">
            No matching PYQs found
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-[var(--muted)]">
            Try removing a filter or import more questions.
          </p>
          <Link
            href="/app/pyq"
            className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background-soft)]"
          >
            Back to PYQ library
          </Link>
        </div>
      </section>
    );
  }

  const effectiveYear = yearNumber ? String(yearNumber) : "Mixed years";
  const effectiveSubject = subjectFilter || "All subjects";
  const questionCount = questions.length;
  const durationMinutes = Math.max(6, Math.ceil((questionCount * 120) / 100));

  const test: ExamTest = {
    slug: `pyq-${yearNumber ?? "mixed"}-${(subjectFilter ?? "all").toLowerCase().replace(/\s+/g, "-")}-${questionCount}`,
    title: `PYQ Drill · ${effectiveYear}`,
    tagline: subjectFilter
      ? `Subject focus: ${effectiveSubject}`
      : "Paper-style drilling with PYQs",
    description: `Timed PYQ session (${questionCount} questions).`,
    durationMinutes,
    difficultyLabel:
      yearNumber && subjectFilter
        ? `${yearNumber} · ${effectiveSubject}`
        : yearNumber
          ? `${yearNumber}`
          : "Mixed",
    questions,
  };

  return <ExamRunner test={test} />;
}
