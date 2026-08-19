import { fetchSearchablePyqQuestions } from "@/lib/supabase/questions";
import type { SearchablePyqQuestion } from "@/lib/supabase/questions";
import type { Subject } from "@/lib/types";

export const SOLVED_PYQ_YEARS = Array.from({ length: 12 }, (_, i) => 2025 - i);
export const PYQ_YEARS = [2026, ...SOLVED_PYQ_YEARS];

export const PYQ_SUBJECTS = [
  "Polity",
  "History",
  "Economy",
  "Geography",
  "Environment",
  "Science",
  "Current Affairs",
] as const satisfies readonly Subject[];

export type PyqSeoSubject = (typeof PYQ_SUBJECTS)[number];

export const SUBJECT_SLUGS: Record<PyqSeoSubject, string> = {
  Polity: "polity",
  History: "history",
  Economy: "economy",
  Geography: "geography",
  Environment: "environment",
  Science: "science",
  "Current Affairs": "current-affairs",
};

export const SUBJECT_FROM_SLUG = Object.fromEntries(
  PYQ_SUBJECTS.map((subject) => [SUBJECT_SLUGS[subject], subject]),
) as Record<string, PyqSeoSubject>;

export const SUBJECT_INTROS: Record<PyqSeoSubject, string> = {
  Polity:
    "Constitutional articles, Parliament, judiciary, federalism, rights, elections, and governance form the core of Polity PYQs.",
  History:
    "History PYQs move across ancient India, medieval developments, modern India, freedom struggle, culture, and art-history themes.",
  Economy:
    "Economy PYQs test concepts through banking, fiscal policy, inflation, external sector, agriculture, schemes, and market institutions.",
  Geography:
    "Geography PYQs combine Indian and world geography, maps, rivers, climate, resources, agriculture, and physical geography.",
  Environment:
    "Environment PYQs repeatedly test ecology, biodiversity, protected areas, climate change, conventions, laws, and pollution.",
  Science:
    "Science PYQs focus on applied general science, health, biotechnology, space, defence, IT, energy, and emerging technologies.",
  "Current Affairs":
    "Current Affairs PYQs connect contemporary events with static subjects, schemes, reports, institutions, and international developments.",
};

export type TopicCount = {
  name: string;
  count: number;
};

export type YearSubjectCount = {
  name: string;
  count: number;
};

export type PyqSeoQuestion = SearchablePyqQuestion;

export const MIN_INDEXABLE_TOPIC_QUESTIONS = 8;
export const MIN_INDEXABLE_YEAR_SUBJECT_QUESTIONS = 5;

export type PyqTopicGroup = {
  name: string;
  slug: string;
  count: number;
  questions: SearchablePyqQuestion[];
};

export function toTopicSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function groupQuestionsByTopic(
  questions: SearchablePyqQuestion[],
): PyqTopicGroup[] {
  const groups = new Map<
    string,
    { questions: SearchablePyqQuestion[]; labels: Map<string, number> }
  >();

  for (const question of questions) {
    const topic = question.topic?.trim();
    if (!topic) continue;
    const slug = toTopicSlug(topic);
    if (!slug) continue;

    const group = groups.get(slug) ?? {
      questions: [],
      labels: new Map<string, number>(),
    };
    group.questions.push(question);
    group.labels.set(topic, (group.labels.get(topic) ?? 0) + 1);
    groups.set(slug, group);
  }

  return Array.from(groups.entries())
    .map(([slug, group]) => ({
      slug,
      name:
        Array.from(group.labels.entries()).sort(
          (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
        )[0]?.[0] ?? slug,
      count: group.questions.length,
      questions: group.questions,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getQuestionTopic(question: SearchablePyqQuestion) {
  return question.topic || question.sub_topic || "Mixed concepts";
}

export function compactPrompt(prompt: string, maxLength = 150) {
  const normalized = prompt.replace(/^\d+\.[\s]*/, "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}...`;
}

export function countBy<T extends string | number>(
  items: SearchablePyqQuestion[],
  getKey: (item: SearchablePyqQuestion) => T | null | undefined,
) {
  const counts = new Map<T, number>();
  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name: String(name), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getPyqYearSeoData(year: number) {
  const allQuestions = await fetchSearchablePyqQuestions();
  const questions = allQuestions.filter((question) => question.year === year);

  return {
    year,
    questions,
    subjectCounts: countBy(questions, (question) => question.subject),
    topicCounts: countBy(questions, getQuestionTopic).slice(0, 12),
    sampleQuestions: questions.slice(0, 12),
    allYears: PYQ_YEARS,
  };
}

export async function getPyqSubjectSeoData(subject: PyqSeoSubject) {
  const allQuestions = await fetchSearchablePyqQuestions();
  const questions = allQuestions.filter((question) => question.subject === subject);
  const topicGroups = groupQuestionsByTopic(questions);

  return {
    subject,
    questions,
    yearCounts: countBy(questions, (question) => question.year).sort(
      (a, b) => Number(b.name) - Number(a.name),
    ),
    topicCounts: topicGroups.slice(0, 14),
    sampleQuestions: questions.slice(0, 12),
  };
}

export async function getPyqTopicSeoData(
  subject: PyqSeoSubject,
  topicSlug: string,
) {
  const subjectData = await getPyqSubjectSeoData(subject);
  const group = groupQuestionsByTopic(subjectData.questions).find(
    (candidate) => candidate.slug === topicSlug,
  );

  if (!group || group.count < MIN_INDEXABLE_TOPIC_QUESTIONS) return null;

  return {
    subject,
    ...group,
    yearCounts: countBy(group.questions, (question) => question.year).sort(
      (a, b) => Number(b.name) - Number(a.name),
    ),
    subTopicCounts: countBy(group.questions, (question) => question.sub_topic).slice(
      0,
      12,
    ),
  };
}

export async function getPyqYearSubjectSeoData(
  year: number,
  subject: PyqSeoSubject,
) {
  const allQuestions = await fetchSearchablePyqQuestions();
  const questions = allQuestions.filter(
    (question) => question.year === year && question.subject === subject,
  );

  if (questions.length < MIN_INDEXABLE_YEAR_SUBJECT_QUESTIONS) return null;

  return {
    year,
    subject,
    questions,
    topicCounts: groupQuestionsByTopic(questions).slice(0, 12),
    questionTypeCounts: countBy(questions, (question) => question.question_type).slice(
      0,
      8,
    ),
  };
}

export async function getIndexablePyqYearSubjects() {
  const allQuestions = await fetchSearchablePyqQuestions();

  return PYQ_YEARS.flatMap((year) =>
    PYQ_SUBJECTS.map((subject) => {
      const count = allQuestions.filter(
        (question) => question.year === year && question.subject === subject,
      ).length;
      return {
        year,
        subject,
        subjectSlug: SUBJECT_SLUGS[subject],
        count,
      };
    }).filter((item) => item.count >= MIN_INDEXABLE_YEAR_SUBJECT_QUESTIONS),
  );
}

export async function getIndexablePyqTopics() {
  const allQuestions = await fetchSearchablePyqQuestions();

  return PYQ_SUBJECTS.flatMap((subject) =>
    groupQuestionsByTopic(
      allQuestions.filter((question) => question.subject === subject),
    )
      .filter((group) => group.count >= MIN_INDEXABLE_TOPIC_QUESTIONS)
      .map((group) => ({
        subject,
        subjectSlug: SUBJECT_SLUGS[subject],
        topic: group.name,
        topicSlug: group.slug,
        count: group.count,
      })),
  );
}

// Derives a genuine <lastmod> for a hub page from the questions it renders.
// A hub is "modified" when its newest underlying question was last touched.
export function latestQuestionUpdate(
  questions: readonly { updated_at: string }[],
  fallback: Date,
): Date {
  let latest = 0;

  for (const question of questions) {
    const timestamp = Date.parse(question.updated_at);
    if (Number.isFinite(timestamp) && timestamp > latest) latest = timestamp;
  }

  return latest > 0 ? new Date(latest) : fallback;
}
