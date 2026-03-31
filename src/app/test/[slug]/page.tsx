import { notFound } from "next/navigation";
import { ExamRunner } from "@/components/exam/exam-runner";
import { fetchQuestions } from "@/lib/supabase/questions";
import { getTestBySlug } from "@/data/tests";
import { getCurrentAffairsTestBySlug } from "@/lib/current-affairs";
import type { ExamTest, Subject } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Slug parsing
// Supported formats:
//   pyq-2024                → year=2024, limit=100
//   pyq-2024-polity         → year=2024, subject=Polity
//   pyq-2024-polity-50      → year=2024, subject=Polity, limit=50
//   pyq-polity              → subject=Polity, limit=25
//   pyq-polity-50           → subject=Polity, limit=50
//   pyq-mixed-25            → mixed PYQ, limit=25
//   <anything-else>         → FLT lookup in tests.ts / current-affairs
// ---------------------------------------------------------------------------

const SUBJECT_SLUG_MAP: Record<string, Subject> = {
  polity: "Polity",
  history: "History",
  economy: "Economy",
  economics: "Economy",
  geography: "Geography",
  environment: "Environment",
  science: "Science",
  "science-tech": "Science",
  "current-affairs": "Current Affairs",
  "current affairs": "Current Affairs",
  csat: "CSAT",
};

function parseLimit(raw: string | undefined): number {
  if (!raw) return 25;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(1, Math.min(200, Math.round(n))) : 25;
}

interface ParsedPyqSlug {
  year?: number;
  subject?: Subject;
  limit: number;
}

function parsePyqSlug(rest: string): ParsedPyqSlug {
  // rest is everything after "pyq-"
  // Possible: "2024", "2024-polity", "2024-polity-50",
  //           "polity", "polity-50", "mixed", "mixed-25"
  const parts = rest.split("-");

  let year: number | undefined;
  let subject: Subject | undefined;
  let limit = 25;

  let i = 0;

  // Check if first part is a 4-digit year (2014-2030)
  if (parts[0] && /^\d{4}$/.test(parts[0])) {
    const y = Number(parts[0]);
    if (y >= 2014 && y <= 2030) {
      year = y;
      limit = 100; // default for year-based sessions
      i = 1;
    }
  }

  // Skip "mixed" keyword
  if (parts[i] === "mixed") {
    i++;
  }

  // Try to read subject (may be multi-part like "current-affairs")
  // We test progressively longer combinations
  let subjectFound = false;
  for (let end = parts.length - 1; end >= i && !subjectFound; end--) {
    // Last part might be a number (limit)
    const lastPart = parts[parts.length - 1];
    const lastIsNumber = lastPart && /^\d+$/.test(lastPart);
    const candidateEnd = lastIsNumber && end === parts.length - 1 ? end - 1 : end;

    const candidate = parts.slice(i, candidateEnd + 1).join("-");
    if (candidate && SUBJECT_SLUG_MAP[candidate]) {
      subject = SUBJECT_SLUG_MAP[candidate];
      i = candidateEnd + 1;
      subjectFound = true;
    }
  }

  // Last part as limit if numeric
  const lastPart = parts[parts.length - 1];
  if (lastPart && /^\d+$/.test(lastPart)) {
    limit = parseLimit(lastPart);
  }

  // Defaults: year-only → 100Q, subject-only → 25Q
  if (year && !subject) limit = limit === 25 ? 100 : limit;

  return { year, subject, limit };
}

// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const isPyq = slug.startsWith("pyq-") || slug === "pyq";

  if (isPyq) {
    const rest = slug.replace(/^pyq-?/, "") || "mixed";
    const { year, subject } = parsePyqSlug(rest);
    const label = [year, subject ?? "Mixed"].filter(Boolean).join(" · ");
    return {
      title: `PYQ ${label} — UPSCPRELIMSTEST`,
      description: `Start your UPSC Prelims PYQ drill: ${label}`,
    };
  }

  return {
    title: `Test — UPSCPRELIMSTEST`,
    description: "Start your UPSC Prelims practice test.",
  };
}

export default async function TestSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // ── PYQ path ──────────────────────────────────────────────────────────────
  if (slug.startsWith("pyq-") || slug === "pyq") {
    const rest = slug === "pyq" ? "mixed" : slug.slice(4);
    const { year, subject, limit } = parsePyqSlug(rest);

    const questions = await fetchQuestions({
      year,
      subject,
      limit,
      shuffle: true,
    });

    if (!questions.length) notFound();

    const effectiveYear = year ? String(year) : "Mixed years";
    const effectiveSubject = subject ?? "All subjects";
    const durationMinutes = Math.max(6, Math.ceil((questions.length * 120) / 100));

    const test: ExamTest = {
      slug,
      title: `PYQ Drill · ${effectiveYear}`,
      tagline: subject ? `Subject focus: ${effectiveSubject}` : "Paper-style drilling with PYQs",
      description: `Timed PYQ session (${questions.length} questions).`,
      durationMinutes,
      difficultyLabel:
        year && subject
          ? `${year} · ${effectiveSubject}`
          : year
            ? String(year)
            : "Mixed",
      questions,
    };

    return <ExamRunner test={test} />;
  }

  // ── FLT / Custom test path ─────────────────────────────────────────────────
  const test = getTestBySlug(slug) ?? (await getCurrentAffairsTestBySlug(slug));
  if (!test) notFound();

  return <ExamRunner test={test} />;
}
