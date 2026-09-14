import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import {
  compactPrompt,
  getIndexablePyqYearSubjects,
  getPyqYearSubjectSeoData,
  PYQ_YEARS,
  SUBJECT_FROM_SLUG,
  SUBJECT_SLUGS,
} from "@/lib/seo/pyq-seo";

const baseUrl = "https://upscprelimstest.com";

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateStaticParams() {
  const combinations = await getIndexablePyqYearSubjects();
  return combinations.map(({ year, subjectSlug }) => ({
    year: String(year),
    subject: subjectSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string; subject: string }>;
}): Promise<Metadata> {
  const { year: rawYear, subject: subjectSlug } = await params;
  const year = Number(rawYear);
  const subject = SUBJECT_FROM_SLUG[subjectSlug];
  if (!PYQ_YEARS.includes(year) || !subject) return { title: "PYQ Set Not Found" };

  const data = await getPyqYearSubjectSeoData(year, subject);
  if (!data) return { title: "PYQ Set Not Found" };

  const title = `UPSC ${year} ${subject} Questions — Answers & Explanations`;
  const description = `Study ${data.questions.length} ${subject} questions from UPSC Prelims ${year}, with answer keys, explanations, topic distribution, and links to timed practice.`;
  const canonical = `${baseUrl}/pyq/${year}/${subjectSlug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

export default async function PyqYearSubjectPage({
  params,
}: {
  params: Promise<{ year: string; subject: string }>;
}) {
  const { year: rawYear, subject: subjectSlug } = await params;
  const year = Number(rawYear);
  const subject = SUBJECT_FROM_SLUG[subjectSlug];
  if (!PYQ_YEARS.includes(year) || !subject) notFound();

  const data = await getPyqYearSubjectSeoData(year, subject);
  if (!data) notFound();

  const canonical = `${baseUrl}/pyq/${year}/${subjectSlug}`;

  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: baseUrl },
          { name: "UPSC PYQ", url: `${baseUrl}/pyq` },
          { name: `UPSC ${year} PYQ`, url: `${baseUrl}/pyq/${year}` },
          { name: `${subject} questions`, url: canonical },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `UPSC Prelims ${year} ${subject} Questions`,
          description: `${data.questions.length} ${subject} questions from the UPSC Civil Services Preliminary Examination ${year}.`,
          url: canonical,
          isPartOf: { "@type": "WebSite", name: "UPSC Prelims Test", url: baseUrl },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: data.questions.length,
            itemListElement: data.questions.map((question, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${baseUrl}/question/${question.id}`,
              name: compactPrompt(question.prompt, 100),
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
          <span className="text-[var(--foreground)]">{subject}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              UPSC Prelims {year} · GS Paper I
            </p>
            <h1 className="heading mt-4 text-4xl leading-none text-[var(--foreground)] sm:text-6xl">
              {subject} questions from UPSC {year}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              Review every {subject} question in the {year} paper with its answer
              and study explanation, then launch the same set under timed exam
              conditions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/test/pyq-${year}-${subjectSlug}-${Math.min(50, data.questions.length)}`}
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                Start timed {subject} set
              </Link>
              <Link
                href={`/pyq/subject/${SUBJECT_SLUGS[subject]}`}
                className="rounded-full border border-[var(--border)] bg-[var(--background-secondary)] px-6 py-3 text-sm font-bold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                All {subject} PYQs
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Set snapshot
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Questions", String(data.questions.length)],
                ["Topics", String(data.topicCounts.length)],
                ["Top topic", data.topicCounts[0]?.name ?? subject],
                ["Access", "Free"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</dt>
                  <dd className="mt-2 text-lg font-bold text-[var(--foreground)]">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Topic distribution</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {data.topicCounts.map((topic) => (
              <span key={topic.slug} className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
                {topic.name} · {topic.count}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                All {year} {subject} questions
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Open any question for the full options, answer, explanation, and
                syllabus metadata.
              </p>
            </div>
            <Link href="/methodology" className="text-sm font-semibold text-[var(--accent)] hover:underline">
              How answers are prepared
            </Link>
          </div>
          <ol className="mt-6 grid gap-3 md:grid-cols-2">
            {data.questions.map((question, index) => (
              <li key={question.id}>
                <Link
                  href={`/question/${question.id}`}
                  className="block h-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 transition-colors hover:border-[var(--accent)]"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                    Question {index + 1}{question.topic ? ` · ${question.topic}` : ""}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                    {compactPrompt(question.prompt, 190)}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <aside className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 text-sm leading-6 text-[var(--muted)]">
          Question stems are transcribed from the UPSC Civil Services Preliminary
          Examination. Explanations and classifications are independent study aids,
          not official UPSC answer keys. See our <Link href="/methodology" className="font-semibold text-[var(--accent)] hover:underline">methodology and corrections policy</Link>.
        </aside>
      </main>
    </div>
  );
}
