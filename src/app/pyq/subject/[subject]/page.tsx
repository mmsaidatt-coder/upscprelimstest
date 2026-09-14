import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import { getIndexableCanonicalPyqTopics } from "@/lib/seo/pyq-topic-taxonomy";
import {
  compactPrompt,
  getPyqSubjectSeoData,
  MIN_INDEXABLE_YEAR_SUBJECT_QUESTIONS,
  PYQ_SUBJECTS,
  SUBJECT_FROM_SLUG,
  SUBJECT_INTROS,
  SUBJECT_SLUGS,
} from "@/lib/seo/pyq-seo";

const baseUrl = "https://upscprelimstest.com";

export function generateStaticParams() {
  return PYQ_SUBJECTS.map((subject) => ({ subject: SUBJECT_SLUGS[subject] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>;
}): Promise<Metadata> {
  const { subject: subjectSlug } = await params;
  const subject = SUBJECT_FROM_SLUG[subjectSlug];
  if (!subject) return { title: "UPSC PYQ Subject Not Found" };

  return {
    title: `UPSC ${subject} PYQ Practice — Previous Year Questions With Answers`,
    description: `Practice UPSC Prelims ${subject} previous year questions with year-wise trends, frequent topics, answers, explanations, timer, and negative marking. Free, no signup required.`,
    alternates: {
      canonical: `${baseUrl}/pyq/subject/${subjectSlug}`,
    },
    openGraph: {
      title: `UPSC ${subject} PYQ Practice — Free Timed Drills`,
      description: `Review ${subject} PYQ patterns and start a timed UPSC Prelims subject-wise drill.`,
      url: `${baseUrl}/pyq/subject/${subjectSlug}`,
    },
  };
}

export default async function PyqSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: subjectSlug } = await params;
  const subject = SUBJECT_FROM_SLUG[subjectSlug];
  if (!subject) notFound();

  const [data, allCanonicalTopics] = await Promise.all([
    getPyqSubjectSeoData(subject),
    getIndexableCanonicalPyqTopics(),
  ]);
  if (!data.questions.length) notFound();
  const canonicalTopics = allCanonicalTopics
    .filter((item) => item.subject === subject)
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));

  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: baseUrl },
          { name: "UPSC PYQ", url: `${baseUrl}/pyq` },
          { name: `${subject} PYQ`, url: `${baseUrl}/pyq/subject/${subjectSlug}` },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `UPSC ${subject} PYQ Practice`,
          description: `Practice ${data.questions.length} UPSC Prelims ${subject} previous year questions with topic trends, timer, and instant review.`,
          url: `${baseUrl}/pyq/subject/${subjectSlug}`,
          isAccessibleForFree: true,
          inLanguage: "en",
          provider: {
            "@type": "Organization",
            name: "UPSC Prelims Test",
            url: baseUrl,
          },
        }}
      />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
        <nav className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--accent)]">
            Home
          </Link>
          <span>/</span>
          <Link href="/pyq" className="hover:text-[var(--accent)]">
            PYQ
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">{subject}</span>
        </nav>

        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              UPSC subject-wise previous year questions
            </p>
            <h1 className="heading mt-4 text-4xl leading-none text-[var(--foreground)] sm:text-6xl">
              UPSC {subject} PYQ Practice
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              {SUBJECT_INTROS[subject]} Use this page to understand the trend,
              then start a timed subject-wise drill with negative marking and
              instant review.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/test/pyq-${subjectSlug}-50`}
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                Start 50Q {subject} drill
              </Link>
              <Link
                href={`/app/design-paper/run?mode=single_subject&size=100&subject=${encodeURIComponent(subject)}`}
                className="rounded-full border border-[var(--border)] bg-[var(--background-secondary)] px-6 py-3 text-sm font-bold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Generate 100Q bank test
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Subject snapshot
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["PYQs", String(data.questions.length)],
                ["Years", String(data.yearCounts.length)],
                ["Top Category", canonicalTopics[0]?.topic ?? "Mixed"],
                ["Access", "Free"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
                >
                  <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {label}
                  </dt>
                  <dd className="mt-2 text-xl font-bold text-[var(--foreground)]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Year-wise {subject} PYQ count
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.yearCounts.map((item) => (
                <Link
                  key={item.name}
                  href={
                    item.count >= MIN_INDEXABLE_YEAR_SUBJECT_QUESTIONS
                      ? `/pyq/${item.name}/${subjectSlug}`
                      : `/pyq/${item.name}`
                  }
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 transition-colors hover:border-[var(--accent)]"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {item.name}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
                    {item.count}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Canonical {subject} PYQ topics
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Stable study categories built from the bank&apos;s detailed labels.
              Only categories with at least 10 questions across three years are listed.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {canonicalTopics.map((item) => (
                <Link
                  key={item.topicSlug}
                  href={`/pyq/topic/${item.subjectSlug}/${item.topicSlug}`}
                  className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)]"
                >
                  {item.topic} · {item.count}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Sample {subject} questions
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Scan real previous year prompts before starting the timed drill.
              </p>
            </div>
            <Link
              href={`/test/pyq-${subjectSlug}-50`}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              Start drill
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {data.sampleQuestions.map((question) => (
              <Link
                key={question.id}
                href={`/question/${question.id}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 transition-colors hover:border-[var(--accent)]"
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                  UPSC {question.year}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                  {compactPrompt(question.prompt)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
