import Link from "next/link";
import { ExamRunner } from "@/components/exam/exam-runner";
import { fetchCustomExamSession, CustomTestConfig } from "@/lib/supabase/questions";
import type { ExamTest, Subject, Difficulty } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DesignPaperRunPage({
  searchParams,
}: {
  searchParams: Promise<{ size?: string; mode?: string; subject?: string }>;
}) {
  const { size, mode, subject } = await searchParams;

  const validSizes = [25, 50, 100];
  const testSize = validSizes.includes(Number(size)) ? Number(size) : 50;
  
  const validModes = ["single_subject", "mixed", "upsc_flt"];
  const testMode = validModes.includes(mode || "") ? (mode as CustomTestConfig["mode"]) : "mixed";
  
  const testSubject = subject ? (subject as Subject) : undefined;

  const questions = await fetchCustomExamSession({
    mode: testMode,
    size: testSize,
    subject: testSubject
  });

  if (!questions.length) {
    return (
      <section className="mx-auto max-w-5xl space-y-6 px-6 py-16">
        <div className="mesh-card rounded-[2rem] p-8">
          <h1 className="display-title text-4xl text-[var(--foreground)]">
            Generation Failed
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-[var(--muted)]">
            Could not fetch enough questions for the requested blueprint.
          </p>
          <Link
            href="/app/design-paper"
            className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background-soft)]"
          >
            Back to Design Paper
          </Link>
        </div>
      </section>
    );
  }

  const durationMinutes = Math.max(6, Math.ceil((questions.length * 120) / 100));
  
  let label = "Mixed Practice";
  if (testMode === "upsc_flt") label = "UPSC Prelims Blueprint";
  if (testMode === "single_subject") label = `${testSubject} Drill`;

  const test: ExamTest = {
    slug: `custom-${testMode}-${testSize}`,
    title: `Custom Test · ${questions.length} Qs`,
    tagline: `Mode: ${label}`,
    description: `A custom generated mock session based on the 10,000+ AI enriched database.`,
    durationMinutes,
    difficultyLabel: "Mixed",
    questions,
  };

  return <ExamRunner test={test} />;
}
