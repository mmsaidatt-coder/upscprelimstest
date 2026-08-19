import type { MetadataRoute } from "next";
import {
  fetchSearchablePyqQuestions,
  type SearchablePyqQuestion,
} from "@/lib/supabase/questions";
import {
  latestQuestionUpdate,
  MIN_INDEXABLE_YEAR_SUBJECT_QUESTIONS,
  PYQ_SUBJECTS,
  PYQ_YEARS,
  SOLVED_PYQ_YEARS,
  SUBJECT_SLUGS,
} from "@/lib/seo/pyq-seo";
import {
  getCanonicalPyqTopicGroups,
  isIndexableCanonicalTopic,
} from "@/lib/seo/pyq-topic-taxonomy";

const baseUrl = "https://upscprelimstest.com";

// Question URLs live in their own sitemap at /question/sitemap.xml so that
// Search Console reports an index rate for hubs separately from the long tail.
// Both are submitted; splitting changes reporting granularity, not coverage.

// Marketing pages carry no runtime content signal — they change when we deploy,
// so one shared date is the honest value for those. Every data-backed URL below
// derives its own lastmod from the questions it actually renders.
const STATIC_PAGE_LAST_MODIFIED = new Date("2026-08-12T00:00:00+05:30");

function pushGrouped<K>(
  map: Map<K, SearchablePyqQuestion[]>,
  key: K,
  question: SearchablePyqQuestion,
) {
  const bucket = map.get(key);
  if (bucket) bucket.push(question);
  else map.set(key, [question]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [allQuestions, topicGroups] = await Promise.all([
    fetchSearchablePyqQuestions(),
    getCanonicalPyqTopicGroups(),
  ]);

  const byYear = new Map<number, SearchablePyqQuestion[]>();
  const bySubject = new Map<string, SearchablePyqQuestion[]>();
  const byYearSubject = new Map<string, SearchablePyqQuestion[]>();

  for (const question of allQuestions) {
    pushGrouped(bySubject, question.subject, question);
    if (question.year === null) continue;
    pushGrouped(byYear, question.year, question);
    pushGrouped(byYearSubject, `${question.year}:${question.subject}`, question);
  }

  const lastmodOf = (questions: SearchablePyqQuestion[] | undefined) =>
    latestQuestionUpdate(questions ?? [], STATIC_PAGE_LAST_MODIFIED);

  // Pages that render straight from the question bank move when the bank moves.
  const bankLastModified = lastmodOf(allQuestions);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: bankLastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/pyq`,
      lastModified: bankLastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/free-upsc-prelims-mock-test`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/subject-wise`,
      lastModified: bankLastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/current-affairs`,
      lastModified: bankLastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/analytics`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/platform`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/methodology`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const yearRoutes: MetadataRoute.Sitemap = PYQ_YEARS.map((year) => ({
    url: `${baseUrl}/pyq/${year}`,
    lastModified: lastmodOf(byYear.get(year)),
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const analysisRoutes: MetadataRoute.Sitemap = SOLVED_PYQ_YEARS.map((year) => ({
    url: `${baseUrl}/pyq/${year}/analysis`,
    lastModified: lastmodOf(byYear.get(year)),
    changeFrequency: "yearly" as const,
    priority: 0.82,
  }));

  const subjectRoutes: MetadataRoute.Sitemap = PYQ_SUBJECTS.map((subject) => ({
    url: `${baseUrl}/pyq/subject/${SUBJECT_SLUGS[subject]}`,
    lastModified: lastmodOf(bySubject.get(subject)),
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const yearSubjectRoutes: MetadataRoute.Sitemap = PYQ_YEARS.flatMap((year) =>
    PYQ_SUBJECTS.flatMap((subject) => {
      const questions = byYearSubject.get(`${year}:${subject}`) ?? [];
      if (questions.length < MIN_INDEXABLE_YEAR_SUBJECT_QUESTIONS) return [];

      return [
        {
          url: `${baseUrl}/pyq/${year}/${SUBJECT_SLUGS[subject]}`,
          lastModified: lastmodOf(questions),
          changeFrequency: "yearly" as const,
          priority: 0.8,
        },
      ];
    }),
  );

  const topicRoutes: MetadataRoute.Sitemap = topicGroups
    .filter(isIndexableCanonicalTopic)
    .map((group) => ({
      url: `${baseUrl}/pyq/topic/${group.subjectSlug}/${group.rule.slug}`,
      lastModified: lastmodOf(group.questions),
      changeFrequency: "monthly" as const,
      priority: 0.78,
    }));

  return [
    ...staticRoutes,
    ...yearRoutes,
    ...analysisRoutes,
    ...subjectRoutes,
    ...yearSubjectRoutes,
    ...topicRoutes,
  ];
}
