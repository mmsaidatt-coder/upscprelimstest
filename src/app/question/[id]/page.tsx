import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchQuestionById,
  fetchAllQuestionIds,
} from "@/lib/supabase/questions";

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

  // Create a highly relevant SEO title based on year, subject, and prompt snippet
  const snippet =
    question.prompt.length > 50
      ? question.prompt.substring(0, 50) + "..."
      : question.prompt;
      
  const yearText = question.year ? ` ${question.year}` : "";
  const title = `UPSC Prelims${yearText} ${question.subject} Question: ${snippet}`;
  
  const description = `Practice this UPSC PYQ on ${
    question.subject
  }. Question: ${snippet}. See the full question, options, correct answer, and explanation.`;

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

  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-20">
        
        {/* Breadcrumbs for SEO and navigation */}
        <nav className="mb-8 flex items-center text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
          <span className="mx-2 opacity-50">/</span>
          <Link href="/pyq" className="hover:text-[var(--accent)] transition-colors">PYQ</Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="text-[var(--foreground)]">{question.subject}</span>
        </nav>

        <article className="rounded-[1.5rem] bg-[var(--background-secondary)] border border-[var(--border)] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
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
          </header>

          {/* Question Stem */}
          <div className="mb-10 text-[var(--foreground)]">
            <h1 className="text-xl sm:text-2xl leading-relaxed font-medium">
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
                  <div className={`text-sm sm:text-base ${isCorrect ? "text-green-50" : "text-[var(--muted)]"}`}>
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
              <div className="prose prose-invert max-w-none text-sm sm:text-base text-[var(--muted)] leading-relaxed">
                {/* Since explanations might have basic formatting, we render it safely. In a real app involving markdown, use a markdown renderer. */}
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
        </article>

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
              href={`/app/pyq/run?subject=${encodeURIComponent(question.subject)}&limit=50`}
               className="rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#86bf2c]"
            >
              Start {question.subject} Test Now
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
