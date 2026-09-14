import type { Metadata } from "next";
import Link from "next/link";
import { FaqJsonLd, JsonLd } from "@/components/seo/json-ld";
import { FaqSection } from "@/components/seo/faq-section";

const baseUrl = "https://upscprelimstest.com";

const MOCK_TEST_FAQS = [
  {
    question: "Where can I take a free UPSC Prelims mock test?",
    answer:
      "You can take a free UPSC Prelims mock test on UPSC Prelims Test without signup. The simulator includes timed questions, negative marking, and instant review.",
  },
  {
    question: "Is the UPSC Prelims mock test based on the real exam pattern?",
    answer:
      "Yes. The full simulator uses 100 questions, a 2-hour structure, negative marking, and subject distribution inspired by UPSC Prelims General Studies Paper I.",
  },
  {
    question: "Do I need to create an account before starting the mock test?",
    answer:
      "No. You can start the mock test immediately. Creating an account is only useful if you want cloud sync and long-term tracking.",
  },
];

export const metadata: Metadata = {
  title: "Free UPSC Prelims Mock Test - 100 Questions, No Signup",
  description:
    "Take a free UPSC Prelims mock test with 100 questions, 2-hour timer, negative marking, question palette, and instant subject-wise review. No signup required.",
  alternates: {
    canonical: `${baseUrl}/free-upsc-prelims-mock-test`,
  },
  openGraph: {
    title: "Free UPSC Prelims Mock Test - 100 Questions",
    description:
      "Start a no-signup UPSC Prelims mock test with timer, negative marking, and instant review.",
    url: `${baseUrl}/free-upsc-prelims-mock-test`,
  },
};

export default function FreeUpscPrelimsMockTestPage() {
  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <FaqJsonLd faqs={MOCK_TEST_FAQS} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Free UPSC Prelims Mock Test",
          description:
            "A free 100-question UPSC Prelims mock test with timer, negative marking, and instant subject-wise review.",
          url: `${baseUrl}/free-upsc-prelims-mock-test`,
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web",
          isAccessibleForFree: true,
          inLanguage: "en",
          offers: {
            "@type": "Offer",
            price: 0,
            priceCurrency: "INR",
          },
          provider: {
            "@type": "Organization",
            name: "UPSC Prelims Test",
            url: baseUrl,
          },
        }}
      />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Free UPSC Prelims mock test
            </p>
            <h1 className="heading mt-4 max-w-3xl text-4xl leading-none text-[var(--foreground)] sm:text-6xl">
              Take a free UPSC Prelims mock test
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              Start a 100-question UPSC Prelims simulator with a 2-hour exam
              structure, negative marking, question palette, and instant
              subject-wise review. No signup, no paywall.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/app/design-paper/run?mode=upsc_flt&size=100"
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                Start 100Q mock test
              </Link>
              <Link
                href="/test/gs-mini-mock-01"
                className="rounded-full border border-[var(--border)] bg-[var(--background-secondary)] px-6 py-3 text-sm font-bold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Try 10Q warm-up
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Mock test format
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Questions", "100"],
                ["Time", "2 hours"],
                ["Wrong answer", "-0.67"],
                ["Signup", "Not needed"],
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

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Practice under pressure",
              body: "Use timer, palette navigation, and mark-for-review to build exam-day stamina.",
            },
            {
              title: "Learn from review",
              body: "After submission, inspect your answers and subject-wise performance.",
            },
            {
              title: "Use PYQs too",
              body: "Move from the mock test into year-wise and subject-wise UPSC PYQ practice.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6"
            >
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {item.body}
              </p>
            </article>
          ))}
        </section>
        <FaqSection title="Free UPSC mock test FAQs" faqs={MOCK_TEST_FAQS} />
      </main>
    </div>
  );
}
