import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import type { ExamQuestion, ExamTest, Subject } from "@/lib/types";

const CURRENT_AFFAIRS_REPO_PATH = path.join(
  process.cwd(),
  "data/generated/current-affairs-2025-pt365-sections-gemini-3/final-questions.json",
);

const CURRENT_AFFAIRS_TEST_SIZES = [25, 50] as const;

type CurrentAffairsRepoQuestion = {
  id: string;
  subject: Subject;
  difficulty: ExamQuestion["difficulty"];
  prompt: string;
  contextLines?: string[];
  options: ExamQuestion["options"];
  correctOptionId?: ExamQuestion["correctOptionId"];
  explanation?: string;
  takeaway?: string;
  sourceTopic?: string;
  sourceSection?: string;
};

export type CurrentAffairsSectionSummary = {
  subject: Subject;
  questionCount: number;
  topicCount: number;
  sectionCount: number;
};

const SUBJECT_ORDER: Subject[] = [
  "Polity",
  "History",
  "Economy",
  "Geography",
  "Environment",
  "Science",
  "Current Affairs",
];

function isNonEmptyString(value: string | undefined): value is string {
  return Boolean(value);
}

function slugifySubject(subject: Subject) {
  return subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildStableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function sortQuestionsForSlug(
  questions: CurrentAffairsRepoQuestion[],
  seed: string,
) {
  return [...questions].sort((left, right) => {
    const leftHash = buildStableHash(`${seed}:${left.id}`);
    const rightHash = buildStableHash(`${seed}:${right.id}`);
    if (leftHash !== rightHash) return leftHash - rightHash;
    return left.id.localeCompare(right.id);
  });
}

function mapRepoQuestionToExamQuestion(question: CurrentAffairsRepoQuestion): ExamQuestion {
  return {
    id: question.id,
    subject: question.subject,
    difficulty: question.difficulty,
    prompt: question.prompt,
    contextLines: question.contextLines ?? [],
    options: question.options,
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
    takeaway: question.takeaway,
    marks: 2,
    negativeMarks: 0.67,
  };
}

const loadCurrentAffairsQuestions = cache(async () => {
  const raw = await readFile(CURRENT_AFFAIRS_REPO_PATH, "utf8");
  const parsed = JSON.parse(raw) as CurrentAffairsRepoQuestion[];
  return parsed;
});

export function buildCurrentAffairsExamSlug(subject: Subject, size: (typeof CURRENT_AFFAIRS_TEST_SIZES)[number]) {
  return `ca-repo-${slugifySubject(subject)}-${size}`;
}

export async function getCurrentAffairsSectionSummaries(): Promise<CurrentAffairsSectionSummary[]> {
  const questions = await loadCurrentAffairsQuestions();

  return SUBJECT_ORDER.map((subject) => {
    const sectionQuestions = questions.filter((question) => question.subject === subject);
    if (!sectionQuestions.length) return null;

    const topicSet = new Set(
      sectionQuestions.map((question) => question.sourceTopic?.trim()).filter(isNonEmptyString),
    );
    const sectionSet = new Set(
      sectionQuestions.map((question) => question.sourceSection?.trim()).filter(isNonEmptyString),
    );

    return {
      subject,
      questionCount: sectionQuestions.length,
      topicCount: topicSet.size,
      sectionCount: sectionSet.size,
    } satisfies CurrentAffairsSectionSummary;
  }).filter((summary): summary is CurrentAffairsSectionSummary => Boolean(summary));
}

export async function getCurrentAffairsTestBySlug(slug: string): Promise<ExamTest | null> {
  const match = /^ca-repo-(.+)-(\d+)$/.exec(slug);
  if (!match) return null;

  const [, rawSubjectSlug, rawSize] = match;
  const size = Number(rawSize);
  if (!CURRENT_AFFAIRS_TEST_SIZES.includes(size as (typeof CURRENT_AFFAIRS_TEST_SIZES)[number])) {
    return null;
  }

  const subject = SUBJECT_ORDER.find((item) => slugifySubject(item) === rawSubjectSlug);
  if (!subject) return null;

  const questions = (await loadCurrentAffairsQuestions()).filter((question) => question.subject === subject);
  if (!questions.length) return null;

  const selected = sortQuestionsForSlug(questions, slug)
    .slice(0, Math.min(size, questions.length))
    .map(mapRepoQuestionToExamQuestion);

  const durationMinutes = Math.max(20, Math.ceil((selected.length * 120) / 100));

  return {
    slug,
    title: `Current Affairs Repository · ${subject}`,
    tagline: `Sectional drill from the reviewed ${subject} current-affairs bank`,
    description: `${selected.length}-question timed session built from the repository-backed PT365 current-affairs set.`,
    durationMinutes,
    difficultyLabel: `${selected.length}Q · Repository`,
    questions: selected,
  };
}
