import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";

const baseUrl = "https://upscprelimstest.com";

export const metadata: Metadata = {
  title: "Question Methodology, Sources & Corrections — UPSC Prelims Test",
  description:
    "How UPSC Prelims Test sources PYQ stems, prepares independent answer explanations, uses AI-assisted enrichment, audits quality, and handles corrections.",
  alternates: { canonical: `${baseUrl}/methodology` },
  openGraph: {
    title: "Question Methodology, Sources & Corrections",
    description:
      "A transparent account of source provenance, AI-assisted enrichment, quality checks, and corrections on UPSC Prelims Test.",
    url: `${baseUrl}/methodology`,
    type: "article",
  },
};

const processSteps = [
  {
    title: "1. Source and transcription",
    body: "Previous-year question stems are organized from UPSC Civil Services Preliminary Examination papers. We preserve the question, options, year, and subject context while normalizing formatting for the web.",
  },
  {
    title: "2. Answer and explanation",
    body: "Answer keys and explanations are independent study aids prepared with automation and AI assistance. They are not official UPSC answer keys and should be checked against official material when a final key is available.",
  },
  {
    title: "3. Enrichment",
    body: "AI-assisted classification adds topics, sub-topics, concepts, keywords, difficulty rationale, NCERT pointers, and memory aids. These labels improve discovery and practice, but they can contain judgment calls.",
  },
  {
    title: "4. Quality checks",
    body: "Automated structural checks and content audits flag malformed options, inconsistent keys, weak explanations, duplicates, and classification problems. The repository is reviewed iteratively; an audit flag is not a substitute for an official source.",
  },
  {
    title: "5. Corrections",
    body: "If you find an incorrect answer, year, subject, option, or explanation, send the question URL and the correction evidence. High-impact factual issues take priority.",
  },
];

export default function MethodologyPage() {
  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: baseUrl },
          { name: "Methodology", url: `${baseUrl}/methodology` },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "UPSC Prelims Test question methodology",
          description:
            "Source provenance, AI-assisted enrichment, quality checks, and corrections policy for the UPSC Prelims Test question bank.",
          mainEntityOfPage: `${baseUrl}/methodology`,
          author: {
            "@type": "Organization",
            name: "UPSC Prelims Test editorial and engineering team",
          },
          publisher: {
            "@type": "Organization",
            name: "UPSC Prelims Test",
            url: baseUrl,
          },
          dateModified: "2026-08-12",
        }}
      />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Transparency and trust
        </p>
        <h1 className="heading mt-4 text-4xl leading-none text-[var(--foreground)] sm:text-6xl">
          How our UPSC question bank is built
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg">
          UPSC Prelims Test combines official previous-year question material
          with independent answers, explanations, and AI-assisted metadata. This
          page explains what comes from the exam, what we add, and how to report
          a problem.
        </p>

        <section className="mt-12 space-y-4">
          {processSteps.map((step) => (
            <article
              key={step.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6"
            >
              <h2 className="text-xl font-bold text-[var(--foreground)]">{step.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{step.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Primary source</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            The Union Public Service Commission is the authoritative source for
            examination notices and question papers. This website is an
            independent practice platform and is not affiliated with, endorsed
            by, or operated by UPSC.
          </p>
          <a
            href="https://www.upsc.gov.in/examinations/previous-question-papers"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-5 py-2.5 text-sm font-bold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Open the official UPSC paper archive
          </a>
        </section>

        <section className="mt-12 rounded-2xl bg-[var(--foreground)] p-6 text-white sm:p-8">
          <h2 className="text-2xl font-bold">Found a question problem?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
            Include the question URL, what appears wrong, and a reliable source
            supporting the correction. That gives us enough context to act.
          </p>
          <Link
            href="/feedback"
            className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Report a correction
          </Link>
        </section>
      </main>
    </div>
  );
}
