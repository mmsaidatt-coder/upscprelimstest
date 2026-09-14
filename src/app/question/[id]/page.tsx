import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchQuestionById,
  fetchAllQuestionIds,
  fetchSearchablePyqQuestions,
} from "@/lib/supabase/questions";
import { BookmarkButton } from "@/components/bookmark-button";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import {
  compactPrompt,
  MIN_INDEXABLE_YEAR_SUBJECT_QUESTIONS,
  SUBJECT_SLUGS,
} from "@/lib/seo/pyq-seo";
import type { PyqQuestion } from "@/lib/types";

const baseUrl = "https://upscprelimstest.com";
const officialPapersUrl =
  "https://www.upsc.gov.in/examinations/previous-question-papers";

export const revalidate = 86400;

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function buildQuestionTitle(question: PyqQuestion) {
  const focus =
    question.subTopic ??
    question.primaryTopic ??
    question.topics[0] ??
    compactPrompt(question.prompt, 38);
  return truncate(`UPSC ${question.year} ${question.subject} PYQ: ${focus} — Answer`, 68);
}

// Generate static routes for every single question in the database at build time.
export async function generateStaticParams() {
  const ids = await fetchAllQuestionIds();
  return ids.map((id) => ({ id }));
}

// Dynamically generate SEO metadata based on the specific question content.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const question = await fetchQuestionById(id);

  if (!question) {
    return { title: "Question Not Found" };
  }

  const title = buildQuestionTitle(question);
  const topic = question.subTopic ?? question.primaryTopic ?? question.subject;
  const description = truncate(
    `Solve this UPSC Prelims ${question.year} ${question.subject} PYQ on ${topic}. Review all options, the correct answer, explanation, and syllabus context.`,
    158,
  );

  return {
    title,
    description,
    alternates: {
      canonical: `https://upscprelimstest.com/question/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://upscprelimstest.com/question/${id}`,
      type: "article",
    },
    robots: {
      index: Boolean(question.correctOptionId && question.explanation),
      follow: true,
    },
  };
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = await fetchQuestionById(id);

  if (!question) {
    notFound();
  }

  const yearLabel = question.year ? `UPSC ${question.year}` : "UPSC PYQ";
  const subjectSlug =
    SUBJECT_SLUGS[question.subject as keyof typeof SUBJECT_SLUGS] ??
    question.subject.toLowerCase().replaceAll(" ", "-");
  const allQuestions = await fetchSearchablePyqQuestions();
  const relatedQuestions = allQuestions
    .filter(
      (candidate) =>
        candidate.id !== question.id &&
        candidate.subject === question.subject &&
        (candidate.topic === question.primaryTopic || candidate.year === question.year),
    )
    .sort((a, b) => {
      const aTopicMatch = a.topic === question.primaryTopic ? 1 : 0;
      const bTopicMatch = b.topic === question.primaryTopic ? 1 : 0;
      return bTopicMatch - aTopicMatch || (b.year ?? 0) - (a.year ?? 0);
    })
    .slice(0, 8);
  const yearSubjectCount = allQuestions.filter(
    (candidate) =>
      candidate.year === question.year && candidate.subject === question.subject,
  ).length;
  const correctOption = question.options.find(
    (option) => option.id === question.correctOptionId,
  );
  const canonical = `${baseUrl}/question/${id}`;
  const title = buildQuestionTitle(question);

  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: baseUrl },
          { name: "UPSC PYQ", url: `${baseUrl}/pyq` },
          {
            name: `${question.subject} PYQ`,
            url: `${baseUrl}/pyq/subject/${subjectSlug}`,
          },
          { name: `${yearLabel} question`, url: canonical },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": ["WebPage", "LearningResource"],
          name: title,
          url: canonical,
          learningResourceType: "Solved previous year question",
          educationalLevel: "Competitive examination",
          inLanguage: "en-IN",
          isAccessibleForFree: true,
          isBasedOn: officialPapersUrl,
          about: [
            { "@type": "Thing", name: "UPSC Civil Services Preliminary Examination" },
            { "@type": "Thing", name: question.subject },
            ...(question.primaryTopic
              ? [{ "@type": "Thing", name: question.primaryTopic }]
              : []),
          ],
          mainEntity: {
            "@type": "Question",
            text: question.prompt,
            acceptedAnswer: correctOption
              ? {
                  "@type": "Answer",
                  text: `${correctOption.id}. ${correctOption.text}${question.explanation ? ` — ${question.explanation}` : ""}`,
                }
              : undefined,
          },
          provider: { "@id": `${baseUrl}/#organization` },
        }}
      />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-20">
        
        {/* Breadcrumbs for SEO and navigation */}
        <nav className="mb-8 flex flex-wrap items-center text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
          <span className="mx-2 opacity-50">/</span>
          <Link href="/pyq" className="hover:text-[var(--accent)] transition-colors">PYQ</Link>
          <span className="mx-2 opacity-50">/</span>
          <Link href={`/pyq/subject/${subjectSlug}`} className="text-[var(--foreground)] hover:text-[var(--accent)]">
            {question.subject}
          </Link>
        </nav>

        <article className="reading-paper relative overflow-hidden border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-[0_34px_90px_rgba(4,7,5,0.28)] sm:p-10">
          {/* Header Metadata */}
          <header className="mb-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
              {yearLabel}
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              {question.subject}
            </span>
            {question.difficulty && (
              <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                {question.difficulty}
              </span>
            )}
            <BookmarkButton
              questionId={question.id}
              subject={question.subject}
              prompt={question.prompt}
              year={question.year}
              variant="pill"
              size="md"
              className="ml-auto"
            />
          </header>

          {/* Question Stem */}
          <div className="mb-10 text-[var(--foreground)]">
            <h1 className="whitespace-pre-line text-xl font-medium leading-relaxed sm:text-2xl">
              {question.prompt}
            </h1>
            {question.contextLines && question.contextLines.length > 0 && (
              <div className="mt-6 flex flex-col gap-3">
                {question.contextLines.map((line, i) => (
                  <div key={i} className="flex gap-4 text-base sm:text-lg">
                    <span className="font-bold text-[var(--muted)] shrink-0">{i + 1}.</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-4 mb-12">
            {question.options.map((opt) => {
              const isCorrect = opt.id === question.correctOptionId;
              
              return (
                <div
                  key={opt.id}
                  className={`flex items-start gap-4 rounded-xl border p-4 sm:p-5 transition-colors ${
                    isCorrect 
                      ? "border-green-500/50 bg-green-500/10" 
                      : "border-[var(--border)] bg-[var(--background)]"
                  }`}
                >
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isCorrect ? "bg-green-500 text-white" : "bg-[var(--border)] text-[var(--muted)]"
                  }`}>
                    {opt.id}
                  </div>
                  <div className={`text-sm sm:text-base ${isCorrect ? "font-semibold text-green-800" : "text-[var(--muted)]"}`}>
                    {opt.text}
                  </div>
                  {isCorrect && (
                    <div className="ml-auto flex items-center justify-center text-green-500">
                      <span className="text-xs font-bold uppercase tracking-widest">Correct Answer</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation / Solution */}
          {question.explanation && (
            <div className="mt-8 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-6 sm:p-8">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[var(--accent)]">
                Explanation
              </h3>
              <div className="max-w-none text-sm sm:text-base text-[var(--muted)] leading-relaxed">
                {question.explanation.split('\n').map((para, i) => (
                  <p key={i} className="mb-2 last:mb-0">{para}</p>
                ))}
              </div>
            </div>
          )}

          {/* Value adding tags */}
          {question.topics && question.topics.length > 0 && (
            <div className="mt-10 mb-2 flex flex-wrap gap-2">
              {question.topics.map((item, i) => (
                <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3 py-1 rounded-md bg-[var(--background)] border border-[var(--border)]">
                  {item}
                </span>
              ))}
            </div>
          )}

          <aside className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--foreground)]">
              Source and answer status
            </h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Question source</dt>
                <dd className="mt-1 text-[var(--foreground)]">
                  {question.sourceLabel ?? `UPSC Civil Services Prelims ${question.year}`}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Study aid status</dt>
                <dd className="mt-1 text-[var(--foreground)]">Independent answer and AI-assisted classification</dd>
              </div>
              {question.ncertClass ? (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">NCERT pointer</dt>
                  <dd className="mt-1 text-[var(--foreground)]">{question.ncertClass}</dd>
                </div>
              ) : null}
              {question.difficultyRationale ? (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Difficulty context</dt>
                  <dd className="mt-1 text-[var(--foreground)]">{question.difficultyRationale}</dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-5 text-xs leading-6 text-[var(--muted)]">
              The explanation and metadata are independent preparation aids, not
              an official UPSC answer key. Check the{" "}
              <a href={officialPapersUrl} target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent)] hover:underline">
                official UPSC paper archive
              </a>{" "}
              and read our{" "}
              <Link href="/methodology" className="font-semibold text-[var(--accent)] hover:underline">
                methodology
              </Link>.
            </p>
          </aside>
        </article>

        {relatedQuestions.length ? (
          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="heading text-3xl text-[var(--foreground)] sm:text-4xl">
                  Related {question.subject} PYQs
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Continue with questions from the same topic or exam year.
                </p>
              </div>
              <Link
                href={
                  yearSubjectCount >= MIN_INDEXABLE_YEAR_SUBJECT_QUESTIONS
                    ? `/pyq/${question.year}/${subjectSlug}`
                    : `/pyq/subject/${subjectSlug}`
                }
                className="text-sm font-bold text-[var(--accent)] hover:underline"
              >
                View all {question.year} {question.subject} questions
              </Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {relatedQuestions.map((related) => (
                <Link
                  key={related.id}
                  href={`/question/${related.id}`}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 transition-colors hover:border-[var(--accent)]"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                    UPSC {related.year}{related.topic ? ` · ${related.topic}` : ""}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                    {compactPrompt(related.prompt, 150)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Global CTA */}
        <section className="mt-12 text-center fade-up">
          <div className="inline-flex flex-col items-center p-8 rounded-[2rem] border border-[var(--border)] bg-[var(--background-secondary)] shadow-xl w-full">
            <h2 className="heading text-3xl sm:text-4xl text-[var(--foreground)] mb-4">
              WANT TO PRACTICE LIKE THE REAL EXAM?
            </h2>
            <p className="text-[var(--muted)] max-w-lg mb-8">
              Don&apos;t just read questions. Take a full timed test with negative marking and detailed analytics to see where you stand.
            </p>
            <Link 
              href={`/test/pyq-${subjectSlug}-50`}
               className="action-primary"
            >
              Start {question.subject} Test Now
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
