import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import {
  compactPrompt,
  getPyqYearSeoData,
  MIN_INDEXABLE_YEAR_SUBJECT_QUESTIONS,
  PYQ_YEARS,
  SUBJECT_SLUGS,
} from "@/lib/seo/pyq-seo";

const baseUrl = "https://upscprelimstest.com";
const official2026ExamUrl =
  "https://www.upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination%2C%202026";
const official2026PaperOneUrl =
  "https://www.upsc.gov.in/sites/default/files/QP_CSP_2026_GENERAL_STUDIES_PAPER-I_25052026.pdf";
const official2026PaperTwoUrl =
  "https://www.upsc.gov.in/sites/default/files/QP_CSP_2026_GENERAL_STUDIES_PAPER-II_25052026.pdf";

export function generateStaticParams() {
  return PYQ_YEARS.map((year) => ({ year: String(year) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year: rawYear } = await params;
  const year = Number(rawYear);
  if (!PYQ_YEARS.includes(year)) return { title: "UPSC PYQ Year Not Found" };

  if (year === 2026) {
    return {
      title: "UPSC Prelims 2026 Question Papers — GS I & CSAT PDFs",
      description:
        "Download the official UPSC Prelims 2026 General Studies Paper I and Paper II (CSAT) PDFs. Exam date, source status, and independent answer-analysis update.",
      alternates: { canonical: `${baseUrl}/pyq/2026` },
      openGraph: {
        title: "UPSC Prelims 2026 Question Papers — Official PDFs",
        description:
          "Official UPSC-hosted GS Paper I and CSAT question papers for Civil Services Prelims 2026, with a transparent answer-analysis status.",
        url: `${baseUrl}/pyq/2026`,
      },
    };
  }

  return {
    title: `UPSC Prelims PYQ ${year} — Free Timed Practice Test With Answers`,
    description: `Practice UPSC Prelims ${year} previous year questions with subject breakdown, topic trends, answers, explanations, timer, and negative marking. Free, no signup required.`,
    alternates: {
      canonical: `${baseUrl}/pyq/${year}`,
    },
    openGraph: {
      title: `UPSC Prelims PYQ ${year} — Free Practice Test`,
      description: `Start the ${year} UPSC Prelims PYQ paper or review subject-wise topic patterns before practicing.`,
      url: `${baseUrl}/pyq/${year}`,
    },
  };
}

export default async function PyqYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: rawYear } = await params;
  const year = Number(rawYear);
  if (!PYQ_YEARS.includes(year)) notFound();

  if (year === 2026) return <Official2026PaperPage />;

  const data = await getPyqYearSeoData(year);
  if (!data.questions.length) notFound();

  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: baseUrl },
          { name: "UPSC PYQ", url: `${baseUrl}/pyq` },
          { name: `UPSC Prelims PYQ ${year}`, url: `${baseUrl}/pyq/${year}` },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `UPSC Prelims PYQ ${year}`,
          description: `Practice ${data.questions.length} UPSC Prelims ${year} previous year questions with timer, negative marking, and instant review.`,
          url: `${baseUrl}/pyq/${year}`,
          isAccessibleForFree: true,
          educationalLevel: "Graduate",
          inLanguage: "en",
          about: data.subjectCounts.map((item) => ({
            "@type": "Thing",
            name: item.name,
          })),
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
          <span className="text-[var(--foreground)]">{year}</span>
        </nav>

        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              UPSC Prelims previous year paper
            </p>
            <h1 className="heading mt-4 text-4xl leading-none text-[var(--foreground)] sm:text-6xl">
              UPSC Prelims PYQ {year}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              Practice the {year} UPSC Prelims paper as a timed test, or scan
              the subject and topic pattern before you start. The session uses
              exam-style navigation, negative marking, and instant review.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/test/pyq-${year}`}
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                Start full {year} PYQ
              </Link>
              <Link
                href={`/pyq/${year}/analysis`}
                className="rounded-full border border-[var(--border)] bg-[var(--background-secondary)] px-6 py-3 text-sm font-bold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                View {year} paper analysis
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Paper snapshot
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Questions", String(data.questions.length)],
                ["Subjects", String(data.subjectCounts.length)],
                ["Top Subject", data.subjectCounts[0]?.name ?? "Mixed"],
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
              Subject distribution
            </h2>
            <div className="mt-5 space-y-3">
              {data.subjectCounts.map((item) => (
                <Link
                  key={item.name}
                  href={
                    item.count >= MIN_INDEXABLE_YEAR_SUBJECT_QUESTIONS
                      ? `/pyq/${year}/${SUBJECT_SLUGS[item.name as keyof typeof SUBJECT_SLUGS] ?? item.name.toLowerCase()}`
                      : `/pyq/subject/${SUBJECT_SLUGS[item.name as keyof typeof SUBJECT_SLUGS] ?? item.name.toLowerCase()}`
                  }
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm transition-colors hover:border-[var(--accent)]"
                >
                  <span className="font-semibold text-[var(--foreground)]">
                    {item.name}
                  </span>
                  <span className="text-[var(--muted)]">{item.count} questions</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Frequent topics
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {data.topicCounts.map((item) => (
                <span
                  key={item.name}
                  className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)]"
                >
                  {item.name} · {item.count}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Sample questions from {year}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Review a few prompts, then launch the full timed paper when you
                are ready.
              </p>
            </div>
            <Link
              href={`/test/pyq-${year}`}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              Practice all
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
                  {question.subject}
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

function Official2026PaperPage() {
  const papers = [
    {
      name: "General Studies Paper I",
      detail: "Official UPSC PDF · approximately 34 MB",
      url: official2026PaperOneUrl,
    },
    {
      name: "General Studies Paper II (CSAT)",
      detail: "Official UPSC PDF · approximately 27 MB",
      url: official2026PaperTwoUrl,
    },
  ];

  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: baseUrl },
          { name: "UPSC PYQ", url: `${baseUrl}/pyq` },
          { name: "UPSC Prelims 2026 papers", url: `${baseUrl}/pyq/2026` },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "UPSC Prelims 2026 question papers",
          description:
            "Official UPSC-hosted General Studies Paper I and Paper II question-paper links for Civil Services Preliminary Examination 2026.",
          url: `${baseUrl}/pyq/2026`,
          datePublished: "2026-05-25",
          dateModified: "2026-08-12",
          isBasedOn: official2026ExamUrl,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: papers.length,
            itemListElement: papers.map((paper, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "DigitalDocument",
                name: paper.name,
                url: paper.url,
                encodingFormat: "application/pdf",
                publisher: {
                  "@type": "GovernmentOrganization",
                  name: "Union Public Service Commission",
                  url: "https://www.upsc.gov.in",
                },
              },
            })),
          },
        }}
      />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-20">
        <nav className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
          <span>/</span>
          <Link href="/pyq" className="hover:text-[var(--accent)]">PYQ</Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">2026</span>
        </nav>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Official question-paper links
          </p>
          <h1 className="heading mt-4 text-4xl leading-none text-[var(--foreground)] sm:text-6xl">
            UPSC Prelims 2026 question papers
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg">
            The Civil Services Preliminary Examination was held on 24 May 2026.
            UPSC uploaded the General Studies Paper I and Paper II question
            papers on 25 May 2026. The links below point directly to files on
            the official UPSC website.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {papers.map((paper) => (
              <a
                key={paper.name}
                href={paper.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 transition-colors hover:border-[var(--accent)]"
              >
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                  Download PDF
                </span>
                <span className="mt-2 block text-lg font-bold text-[var(--foreground)]">
                  {paper.name}
                </span>
                <span className="mt-2 block text-sm text-[var(--muted)]">
                  {paper.detail}
                </span>
              </a>
            ))}
          </div>

          <a
            href={official2026ExamUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex text-sm font-bold text-[var(--accent)] hover:underline"
          >
            Verify on the official UPSC examination page →
          </a>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Answer-key status
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              No answer key is reproduced on this page. We will add solved
              questions only after the paper has been accurately transcribed
              and the answers and explanations have passed our independent
              review. We do not present coaching-institute estimates as an
              official UPSC key.
            </p>
            <Link
              href="/methodology"
              className="mt-4 inline-flex text-sm font-bold text-[var(--accent)] hover:underline"
            >
              Read our question methodology →
            </Link>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Practice a fully solved paper
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              While the 2026 review is pending, use the complete 2025 GS Paper I
              question set for timed practice and then inspect every answer and
              explanation.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/pyq/2025"
                className="rounded-full border border-[var(--border)] bg-[var(--background)] px-5 py-2.5 text-sm font-bold text-[var(--foreground)] hover:border-[var(--accent)]"
              >
                Review 2025 PYQs
              </Link>
              <Link
                href="/test/pyq-2025"
                className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--accent-hover)]"
              >
                Take 2025 timed test
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-8 text-xs leading-5 text-[var(--muted)]">
          UPSC Prelims Test is an independent practice platform and is not
          affiliated with or endorsed by the Union Public Service Commission.
        </p>
      </main>
    </div>
  );
}
