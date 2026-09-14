import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";

const baseUrl = "https://upscprelimstest.com";

export const metadata: Metadata = {
  title: "About UPSC Prelims Test — Free Exam Practice Platform",
  description:
    "Learn why UPSC Prelims Test exists: free, exam-like PYQ and mock practice with transparent methodology, answer review, and useful analytics.",
  alternates: { canonical: `${baseUrl}/about` },
  openGraph: {
    title: "About UPSC Prelims Test",
    description:
      "A free, independent UPSC Prelims practice platform built around real exam decisions and transparent review.",
    url: `${baseUrl}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: baseUrl },
          { name: "About", url: `${baseUrl}/about` },
        ]}
      />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          About the platform
        </p>
        <h1 className="heading mt-4 text-4xl leading-none text-[var(--foreground)] sm:text-6xl">
          Free UPSC Prelims practice built for real decisions
        </h1>
        <p className="mt-5 text-base leading-8 text-[var(--muted)] sm:text-lg">
          UPSC Prelims Test is an independent education platform for aspirants
          who want to practise under exam-like constraints and understand their
          mistakes. The core library contains 1,199 previous-year questions from
          2014–2025, alongside a larger practice bank used for dynamic mocks.
        </p>

        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            ["Free access", "Start PYQs and mock sessions without a paywall."],
            ["Exam behaviour", "Timer, negative marking, palette, and review states."],
            ["Transparent data", "Visible sources, methodology, and a correction route."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
              <h2 className="text-lg font-bold text-[var(--foreground)]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Editorial position</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            The platform is not affiliated with UPSC. Previous-year question
            material is organized for study; explanations, labels, analytics,
            and predictions are independent additions. We document the role of
            automation and invite evidence-backed corrections.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/methodology" className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--accent-hover)]">
              Read the methodology
            </Link>
            <Link href="/pyq" className="rounded-full border border-[var(--border)] bg-[var(--background)] px-5 py-2.5 text-sm font-bold text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
              Explore UPSC PYQs
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
