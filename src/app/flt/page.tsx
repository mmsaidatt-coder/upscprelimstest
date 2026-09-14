import type { Metadata } from "next";
import Link from "next/link";
import { FaqJsonLd, JsonLd } from "@/components/seo/json-ld";
import { FaqSection } from "@/components/seo/faq-section";

const FLT_FAQS = [
  {
    question: "Is this UPSC Prelims mock test free?",
    answer:
      "Yes. The UPSC Prelims mock test is free to start and does not require signup.",
  },
  {
    question: "Does the mock test follow UPSC Prelims exam conditions?",
    answer:
      "Yes. Practice sessions include a timer, negative marking, question navigation, mark-for-review, and result analysis.",
  },
  {
    question: "How many questions are in a UPSC Prelims full-length test?",
    answer:
      "The full-length simulator uses 100 questions, matching the General Studies Paper I structure.",
  },
];

export const metadata: Metadata = {
  title: "Free UPSC Prelims Mock Test — 100Q Full-Length Simulator",
  description:
    "Take a free UPSC Prelims mock test with 100 questions, 2-hour exam pressure, negative marking, question palette, and detailed subject-wise review. No signup required.",
  alternates: {
    canonical: "https://upscprelimstest.com/free-upsc-prelims-mock-test",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Free UPSC Prelims Mock Test — 100Q Full-Length Simulator",
    description:
      "Launch a no-signup UPSC Prelims mock test with real exam pressure, negative marking, and analytics.",
    url: "https://upscprelimstest.com/free-upsc-prelims-mock-test",
  },
};

export default function FltPage() {
  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <FaqJsonLd faqs={FLT_FAQS} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Free UPSC Prelims Mock Test",
          description:
            "A 100-question UPSC Prelims full-length simulator with timer, negative marking, and subject-wise review.",
          url: "https://upscprelimstest.com/flt",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web",
          isAccessibleForFree: true,
          inLanguage: "en",
          offers: {
            "@type": "Offer",
            price: 0,
            priceCurrency: "INR",
          },
          assesses: [
            "Indian Polity",
            "History",
            "Geography",
            "Economy",
            "Environment",
            "Science and Technology",
            "Current Affairs",
          ],
          provider: {
            "@type": "Organization",
            name: "UPSC Prelims Test",
            url: "https://upscprelimstest.com",
          },
        }}
      />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Free UPSC Prelims mock test
            </p>
            <h1 className="heading mt-4 max-w-3xl text-4xl leading-none text-[var(--foreground)] sm:text-6xl">
              Take a 100-question mock before you study more
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              Start a full-length UPSC Prelims simulator with real decision
              pressure: timed questions, negative marking, palette navigation,
              and instant subject-wise review.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/app/design-paper/run?mode=upsc_flt&size=100"
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                Start 100Q simulator
              </Link>
              <Link
                href="/test/gs-mini-mock-01"
                className="rounded-full border border-[var(--border)] bg-[var(--background-secondary)] px-6 py-3 text-sm font-bold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Try 10Q warm-up
              </Link>
              <Link
                href="/free-upsc-prelims-mock-test"
                className="rounded-full border border-[var(--border)] bg-[var(--background)] px-6 py-3 text-sm font-bold text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Mock test guide
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Simulator blueprint
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Questions", "100"],
                ["Time", "2 hours"],
                ["Marking", "+2 / -0.67"],
                ["Access", "Free"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
                >
                  <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {label}
                  </dt>
                  <dd className="mt-2 text-2xl font-bold text-[var(--foreground)]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
              The 100-question mode follows a UPSC-like subject mix across
              History, Geography, Polity, Economy, Environment, Science, and
              Current Affairs.
            </p>
          </aside>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Exam pressure",
              body: "Practice with a countdown, question palette, and mark-for-review flow.",
            },
            {
              title: "Negative marking",
              body: "Train the attempt-versus-skip judgment that matters in the real paper.",
            },
            {
              title: "Instant review",
              body: "See subject-wise performance and review every answer after submission.",
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
        <FaqSection title="UPSC full-length test FAQs" faqs={FLT_FAQS} />
      </main>
    </div>
  );
}
