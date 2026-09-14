import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import {
  classifyPyqTopic,
  getIndexableCanonicalPyqTopics,
  isPyqSeoSubject,
  OTHER_CANONICAL_PYQ_TOPIC,
} from "@/lib/seo/pyq-topic-taxonomy";
import {
  compactPrompt,
  getPyqYearSeoData,
  MIN_INDEXABLE_YEAR_SUBJECT_QUESTIONS,
  SOLVED_PYQ_YEARS,
  SUBJECT_SLUGS,
  type PyqSeoSubject,
} from "@/lib/seo/pyq-seo";
import type { SearchablePyqQuestion } from "@/lib/supabase/questions";

const baseUrl = "https://upscprelimstest.com";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return SOLVED_PYQ_YEARS.map((year) => ({ year: String(year) }));
}

function asPercent(count: number, total: number) {
  return total ? Number(((count / total) * 100).toFixed(1)) : 0;
}

function chooseRepresentativeQuestions(questions: SearchablePyqQuestion[]) {
  const selected: SearchablePyqQuestion[] = [];
  const ids = new Set<string>();
  const promptKeys = new Set<string>();

  const add = (question: SearchablePyqQuestion | undefined) => {
    if (!question || !question.correct_option_id || ids.has(question.id)) return;
    const promptKey = question.prompt.replace(/\s+/g, " ").trim().toLowerCase();
    if (promptKeys.has(promptKey)) return;
    ids.add(question.id);
    promptKeys.add(promptKey);
    selected.push(question);
  };

  for (const subject of Object.keys(SUBJECT_SLUGS) as PyqSeoSubject[]) {
    add(questions.find((question) => question.subject === subject));
  }
  for (const question of questions) {
    if (selected.length >= 12) break;
    add(question);
  }

  return selected;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year: rawYear } = await params;
  const year = Number(rawYear);
  if (!SOLVED_PYQ_YEARS.includes(year)) {
    return { title: "UPSC PYQ Analysis Not Found" };
  }

  const data = await getPyqYearSeoData(year);
  if (!data.questions.length) return { title: "UPSC PYQ Analysis Not Found" };

  const title = `UPSC Prelims ${year} Paper Analysis — Subjects & Topics`;
  const description = `Data-led analysis of ${data.questions.length} UPSC Prelims ${year} GS Paper I questions: subject distribution, canonical topic counts, year comparison, and solved examples.`;
  const canonical = `${baseUrl}/pyq/${year}/analysis`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "article" },
    robots: { index: true, follow: true },
  };
}

export default async function PyqYearAnalysisPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: rawYear } = await params;
  const year = Number(rawYear);
  if (!SOLVED_PYQ_YEARS.includes(year)) notFound();

  const [data, previousData, indexableTopics] = await Promise.all([
    getPyqYearSeoData(year),
    year > Math.min(...SOLVED_PYQ_YEARS)
      ? getPyqYearSeoData(year - 1)
      : Promise.resolve(null),
    getIndexableCanonicalPyqTopics(),
  ]);
  if (!data.questions.length) notFound();

  const previousSubjectCounts = new Map(
    previousData?.subjectCounts.map((item) => [item.name, item.count]) ?? [],
  );
  const subjectRows = data.subjectCounts.map((item) => ({
    subject: item.name,
    count: item.count,
    share: asPercent(item.count, data.questions.length),
    previousCount: previousSubjectCounts.get(item.name),
    delta:
      previousSubjectCounts.has(item.name)
        ? item.count - (previousSubjectCounts.get(item.name) ?? 0)
        : null,
  }));

  const canonicalCounts = new Map<
    string,
    { subject: PyqSeoSubject; subjectSlug: string; topicSlug: string; label: string; count: number }
  >();
  for (const question of data.questions) {
    if (!isPyqSeoSubject(question.subject)) continue;
    const rule = classifyPyqTopic({
      subject: question.subject,
      topic: question.topic,
      subTopic: question.sub_topic,
    });
    if (rule.slug === OTHER_CANONICAL_PYQ_TOPIC.slug) continue;
    const key = `${question.subject}:${rule.slug}`;
    const current = canonicalCounts.get(key);
    canonicalCounts.set(key, {
      subject: question.subject,
      subjectSlug: SUBJECT_SLUGS[question.subject],
      topicSlug: rule.slug,
      label: rule.label,
      count: (current?.count ?? 0) + 1,
    });
  }
  const eligibleTopicKeys = new Set(
    indexableTopics.map((item) => `${item.subject}:${item.topicSlug}`),
  );
  const topicRows = [...canonicalCounts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 15);
  const representativeQuestions = chooseRepresentativeQuestions(data.questions);
  const topSubject = subjectRows[0];
  const topTwoCount = subjectRows.slice(0, 2).reduce((sum, item) => sum + item.count, 0);
  const largestIncrease = subjectRows
    .filter((item) => item.delta !== null)
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))[0];
  const canonical = `${baseUrl}/pyq/${year}/analysis`;

  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: baseUrl },
          { name: "UPSC PYQ", url: `${baseUrl}/pyq` },
          { name: `${year} PYQs`, url: `${baseUrl}/pyq/${year}` },
          { name: `${year} paper analysis`, url: canonical },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `UPSC Prelims ${year} GS Paper I analysis`,
          description: `Subject and canonical-topic distribution calculated from ${data.questions.length} questions in the ${year} question bank.`,
          url: canonical,
          datePublished: "2026-08-12",
          dateModified: "2026-08-12",
          isPartOf: { "@id": `${baseUrl}/#website` },
          about: {
            "@type": "Exam",
            name: `UPSC Civil Services Preliminary Examination ${year}`,
          },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: subjectRows.length,
            itemListElement: subjectRows.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.subject,
              description: `${item.count} questions (${item.share}% of the classified paper)`,
            })),
          },
        }}
      />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
          <span>/</span>
          <Link href="/pyq" className="hover:text-[var(--accent)]">PYQ</Link>
          <span>/</span>
          <Link href={`/pyq/${year}`} className="hover:text-[var(--accent)]">{year}</Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">Analysis</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Data-derived GS Paper I breakdown
            </p>
            <h1 className="heading mt-4 text-4xl leading-none text-[var(--foreground)] sm:text-6xl">
              UPSC Prelims {year} paper analysis
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              This analysis counts {data.questions.length} questions in our {year}{" "}
              GS Paper I library. It shows the recorded subject mix, canonical
              topic distribution, and changes in counts versus {year - 1} where
              comparison data is available. It does not infer difficulty or predict
              a future paper.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/test/pyq-${year}`}
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                Take the {year} timed test
              </Link>
              <Link
                href={`/pyq/${year}`}
                className="rounded-full border border-[var(--border)] bg-[var(--background-secondary)] px-6 py-3 text-sm font-bold text-[var(--foreground)] hover:border-[var(--accent)]"
              >
                Browse {year} questions
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Paper snapshot</p>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Questions", String(data.questions.length)],
                ["Subjects", String(subjectRows.length)],
                ["Largest bucket", topSubject?.subject ?? "—"],
                ["Top-two share", `${asPercent(topTwoCount, data.questions.length)}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">{label}</dt>
                  <dd className="mt-2 text-lg font-bold text-[var(--foreground)]">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Subject distribution in {year}</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs uppercase tracking-[0.13em] text-[var(--muted)]">
                  <th className="px-3 py-3">Subject</th>
                  <th className="px-3 py-3">Questions</th>
                  <th className="px-3 py-3">Share</th>
                  <th className="px-3 py-3">vs {year - 1}</th>
                </tr>
              </thead>
              <tbody>
                {subjectRows.map((item) => {
                  const subject = isPyqSeoSubject(item.subject) ? item.subject : null;
                  const href = subject
                    ? item.count >= MIN_INDEXABLE_YEAR_SUBJECT_QUESTIONS
                      ? `/pyq/${year}/${SUBJECT_SLUGS[subject]}`
                      : `/pyq/subject/${SUBJECT_SLUGS[subject]}`
                    : `/pyq/${year}`;
                  return (
                    <tr key={item.subject} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-3 py-4">
                        <Link href={href} className="font-bold text-[var(--foreground)] hover:text-[var(--accent)]">
                          {item.subject}
                        </Link>
                      </td>
                      <td className="px-3 py-4 font-semibold text-[var(--foreground)]">{item.count}</td>
                      <td className="px-3 py-4 text-[var(--muted)]">{item.share}%</td>
                      <td className="px-3 py-4 text-[var(--muted)]">
                        {item.delta === null
                          ? "No prior row"
                          : `${item.delta > 0 ? "+" : ""}${item.delta}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Most represented canonical topics</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              These are conservative category counts based on enriched topic and
              sub-topic labels, not official UPSC syllabus tags.
            </p>
            <div className="mt-5 space-y-3">
              {topicRows.map((item) => {
                const key = `${item.subject}:${item.topicSlug}`;
                const href = eligibleTopicKeys.has(key)
                  ? `/pyq/topic/${item.subjectSlug}/${item.topicSlug}`
                  : `/pyq/subject/${item.subjectSlug}`;
                return (
                  <Link
                    key={key}
                    href={href}
                    className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 transition-colors hover:border-[var(--accent)]"
                  >
                    <span>
                      <span className="block font-bold text-[var(--foreground)]">{item.label}</span>
                      <span className="mt-1 block text-xs text-[var(--muted)]">{item.subject}</span>
                    </span>
                    <span className="shrink-0 font-bold text-[var(--accent)]">{item.count}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <aside className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">What the counts establish</h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-[var(--muted)]">
              <li>
                <strong className="text-[var(--foreground)]">Largest recorded subject:</strong>{" "}
                {topSubject
                  ? `${topSubject.subject}, with ${topSubject.count} questions (${topSubject.share}%).`
                  : "No subject count is available."}
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Concentration:</strong>{" "}
                The two largest subject buckets contain {topTwoCount} questions,
                or {asPercent(topTwoCount, data.questions.length)}% of the recorded paper.
              </li>
              {previousData?.questions.length &&
              largestIncrease &&
              largestIncrease.delta !== null ? (
                <li>
                  <strong className="text-[var(--foreground)]">Largest positive count change:</strong>{" "}
                  {largestIncrease.subject} changed by {largestIncrease.delta > 0 ? "+" : ""}
                  {largestIncrease.delta} question(s) versus {year - 1} in this classification.
                </li>
              ) : null}
            </ul>
          </aside>
        </section>

        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Representative solved questions</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            The sample starts with one graded question from each available subject,
            then fills remaining slots without repeating identical prompt text.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {representativeQuestions.map((question) => (
              <Link
                key={question.id}
                href={`/question/${question.id}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 transition-colors hover:border-[var(--accent)]"
              >
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">{question.subject}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{compactPrompt(question.prompt, 175)}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 text-sm leading-6 text-[var(--muted)]">
          <h2 className="font-bold text-[var(--foreground)]">Method and limitations</h2>
          <p className="mt-2">
            Counts come from the live PYQ database snapshot reviewed on 12 August
            2026. Subject, topic, and concept classifications are independent,
            AI-assisted enrichment rather than official UPSC labels. We publish
            descriptive counts—not predictions—and correct classification errors
            when found. Read the {" "}
            <Link href="/methodology" className="font-bold text-[var(--accent)] hover:underline">
              complete methodology and correction policy
            </Link>.
          </p>
        </section>
      </main>
    </div>
  );
}
