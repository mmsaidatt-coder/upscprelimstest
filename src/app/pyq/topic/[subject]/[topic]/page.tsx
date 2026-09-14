import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getCanonicalPyqTopicData,
  getIndexableCanonicalPyqTopics,
} from "@/lib/seo/pyq-topic-taxonomy";
import {
  compactPrompt,
  SUBJECT_FROM_SLUG,
} from "@/lib/seo/pyq-seo";

const baseUrl = "https://upscprelimstest.com";

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateStaticParams() {
  const topics = await getIndexableCanonicalPyqTopics();
  return topics.map(({ subjectSlug, topicSlug }) => ({
    subject: subjectSlug,
    topic: topicSlug,
  }));
}

async function resolveTopic(subjectSlug: string, topicSlug: string) {
  const subject = SUBJECT_FROM_SLUG[subjectSlug];
  if (!subject) return null;
  return getCanonicalPyqTopicData(subject, topicSlug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string; topic: string }>;
}): Promise<Metadata> {
  const { subject: subjectSlug, topic: topicSlug } = await params;
  const data = await resolveTopic(subjectSlug, topicSlug);
  if (!data) return { title: "UPSC PYQ Topic Not Found" };

  const canonical = `${baseUrl}/pyq/topic/${data.subjectSlug}/${data.rule.slug}`;
  const title = `${data.rule.label}: UPSC ${data.subject} PYQs`;
  const description = `Study ${data.count} ${data.subject} PYQs on ${data.rule.label} across ${data.representedYears} UPSC Prelims years (${data.earliestYear}–${data.latestYear}), with solved examples and a real year trend.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function PyqCanonicalTopicPage({
  params,
}: {
  params: Promise<{ subject: string; topic: string }>;
}) {
  const { subject: subjectSlug, topic: topicSlug } = await params;
  const data = await resolveTopic(subjectSlug, topicSlug);
  if (!data) notFound();

  const canonical = `${baseUrl}/pyq/topic/${data.subjectSlug}/${data.rule.slug}`;
  const peakYear = [...data.yearCounts].sort(
    (a, b) => b.count - a.count || b.year - a.year,
  )[0];
  const concepts = data.conceptCounts.slice(0, 12);
  const labels = data.rawTopicCounts.slice(0, 10);

  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: baseUrl },
          { name: "UPSC PYQ", url: `${baseUrl}/pyq` },
          {
            name: `${data.subject} PYQs`,
            url: `${baseUrl}/pyq/subject/${data.subjectSlug}`,
          },
          { name: data.rule.label, url: canonical },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${data.rule.label}: UPSC ${data.subject} PYQs`,
          description: `${data.count} classified UPSC Prelims questions across ${data.representedYears} exam years, with a year trend and representative solved questions.`,
          url: canonical,
          dateModified: "2026-08-12",
          isPartOf: { "@id": `${baseUrl}/#website` },
          about: [
            { "@type": "Thing", name: data.subject },
            { "@type": "Thing", name: data.rule.label },
            { "@type": "Thing", name: "UPSC Civil Services Preliminary Examination" },
          ],
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: data.representativeQuestions.length,
            itemListElement: data.representativeQuestions.map((question, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${baseUrl}/question/${question.id}`,
              name: compactPrompt(question.prompt, 120),
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
          <Link
            href={`/pyq/subject/${data.subjectSlug}`}
            className="hover:text-[var(--accent)]"
          >
            {data.subject}
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">{data.rule.label}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {data.subject} topic analysis
            </p>
            <h1 className="heading mt-4 text-4xl leading-none text-[var(--foreground)] sm:text-6xl">
              {data.rule.label} UPSC PYQs
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              {data.rule.overview} This live collection contains {data.count}{" "}
              classified questions across {data.representedYears} exam years,
              from {data.earliestYear} to {data.latestYear}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/test/pyq-${data.subjectSlug}-50`}
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                Practice {data.subject} PYQs
              </Link>
              <Link
                href={`/pyq/subject/${data.subjectSlug}`}
                className="rounded-full border border-[var(--border)] bg-[var(--background-secondary)] px-6 py-3 text-sm font-bold text-[var(--foreground)] transition-colors hover:border-[var(--accent)]"
              >
                All {data.subject} PYQs
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Evidence snapshot
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Questions", String(data.count)],
                ["Years present", String(data.representedYears)],
                ["Coverage", `${data.earliestYear}–${data.latestYear}`],
                ["Highest count", peakYear ? `${peakYear.year} · ${peakYear.count}` : "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
                >
                  <dt className="text-[11px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                    {label}
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-[var(--foreground)]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            Year-by-year frequency
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Counts show how many questions in this library were assigned to the
            category in each represented exam year. A zero is not implied for
            omitted years, and frequency alone is not a prediction of a future paper.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.yearCounts.map(({ year, count }) => (
              <Link
                key={year}
                href={`/pyq/${year}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 transition-colors hover:border-[var(--accent)]"
              >
                <span className="font-bold text-[var(--foreground)]">{year}</span>
                <span className="text-sm text-[var(--muted)]">
                  {count} {count === 1 ? "question" : "questions"}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Source topic labels in this cluster
            </h2>
            <div className="mt-5 space-y-3">
              {labels.map((item) => (
                <div
                  key={item.name}
                  className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-sm leading-5 text-[var(--foreground)]">{item.name}</span>
                  <span className="shrink-0 text-sm font-bold text-[var(--accent)]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Recurrent concept labels
            </h2>
            {concepts.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {concepts.map((item) => (
                  <span
                    key={item.name}
                    className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                  >
                    {item.name} · {item.count}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                No repeated concept labels are available for this category yet.
              </p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            Representative solved questions
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            The sample prioritizes different years and removes repeated prompt
            text. Open a question to see its options, independent answer, and explanation.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {data.representativeQuestions.map((question) => (
              <Link
                key={question.id}
                href={`/question/${question.id}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 transition-colors hover:border-[var(--accent)]"
              >
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
                  UPSC {question.year} · {question.subject}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                  {compactPrompt(question.prompt, 175)}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 text-sm leading-6 text-[var(--muted)]">
          <h2 className="font-bold text-[var(--foreground)]">How this page is built</h2>
          <p className="mt-2">
            Topic and concept labels are AI-assisted enrichment, not official
            UPSC classifications. We map them into a conservative editorial
            taxonomy using deterministic label rules, publish a category only
            when it has at least 10 questions across at least three exam years,
            and keep ambiguous records out of topic pages. Counts update with the
            question bank. See the {" "}
            <Link href="/methodology" className="font-bold text-[var(--accent)] hover:underline">
              full methodology and correction policy
            </Link>.
          </p>
        </section>
      </main>
    </div>
  );
}
