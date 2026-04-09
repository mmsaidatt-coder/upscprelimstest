import type { Metadata } from "next";
import Link from "next/link";
import { FaqJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title:
    "UPSC Prelims Practice — Free PYQ Tests & Mock Exams | upscprelimstest.com",
  description:
    "Free UPSC Prelims practice platform with 1,200+ previous year questions from 2014–2025. Timed exam simulations, negative marking, subject-wise drills, and analytics. No paywall, no signup required.",
  alternates: {
    canonical: "https://upscprelimstest.com",
  },
};

const HOME_FAQS = [
  {
    question: "What is UPSC Prelims Test?",
    answer:
      "UPSC Prelims Test is a free online platform for practicing UPSC Civil Services Preliminary Examination questions. It offers 1,200+ previous year questions from 2014 to 2025, full-length mock tests, subject-wise drills, and detailed performance analytics.",
  },
  {
    question: "How many UPSC previous year questions are available?",
    answer:
      "Over 1,200 questions from 12 years (2014–2025) of UPSC Prelims papers, covering all GS subjects — Polity, History, Economy, Geography, Environment, Science & Technology, and Current Affairs.",
  },
  {
    question: "Is the platform completely free?",
    answer:
      "Yes. There is no paywall, no trial period, and no signup required to start practicing. Full access to all questions, analytics, and features is completely free.",
  },
  {
    question:
      "Does the practice test simulate real UPSC Prelims exam conditions?",
    answer:
      "Yes. Every session includes a countdown timer, UPSC-standard negative marking (⅓ deduction for wrong answers), question palette navigation, and mark-for-review functionality — exactly like the real examination.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] bg-warm-grid">
      <FaqJsonLd faqs={HOME_FAQS} />
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-28 sm:pt-16">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-5 lg:gap-16">
          {/* Left: Copy */}
          <div className="lg:col-span-3">
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF] sm:mb-6">
              &mdash;&ensp;Free UPSC Prelims Practice
            </span>

            <h1 className="mb-6 font-serif text-[2.5rem] font-bold leading-[1.08] text-[#1A1A1A] sm:mb-8 sm:text-6xl md:text-7xl lg:text-[5.5rem]">
              Practice like
              <br />
              the real
              <br />
              <span className="italic text-[#C4784A]">exam.</span>
            </h1>

            <p className="mb-8 max-w-lg text-base leading-relaxed text-[#6B7280] sm:mb-10 sm:text-lg">
              1,200+ previous year questions from the last 12&nbsp;years.
              Timed, exam-like sessions with detailed analytics to sharpen
              your preparation.
            </p>

            {/* CTAs */}
            <div className="mb-10 flex flex-col gap-3 sm:mb-14 sm:flex-row sm:gap-4">
              <Link
                href="/app/pyq"
                className="rounded-full bg-[#C4784A] px-8 py-4 text-center text-base font-bold text-white transition-colors hover:bg-[#B06838]"
              >
                Start PYQ Practice
              </Link>
              <Link
                href="/app/exams/gs-mini-mock-01"
                className="rounded-full border-2 border-[#1A1A1A] px-8 py-4 text-center text-base font-bold text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A] hover:text-white"
              >
                Take a Mock Test
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 sm:gap-10">
              {[
                { value: "1,200+", label: "questions from PYQs" },
                { value: "12+", label: "years of papers" },
                { value: "100%", label: "free, no paywall" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-serif text-xl font-bold text-[#1A1A1A] sm:text-2xl">
                    {stat.value}
                  </div>
                  <div className="text-xs font-medium text-[#9CA3AF] sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Exam question mockup (dark card) */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-[#1C1C1C] p-5 text-white shadow-2xl sm:rounded-3xl sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#888]">
                  Question 42 / 100
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#888]">
                  PYQ 2023
                </span>
              </div>

              <p className="mb-5 text-[15px] leading-relaxed text-[#E5E7EB]">
                Consider the following statements about the Fundamental Rights
                enshrined in the Indian Constitution:
              </p>

              <div className="mb-4 space-y-1 text-sm text-[#C8C8C8]">
                <p>1. Article 14 guarantees equality before law</p>
                <p>2. Article 19 provides six freedoms</p>
                <p>3. Article 21 ensures right to life and liberty</p>
              </div>

              <p className="mb-5 text-sm text-[#E5E7EB]">
                Which of the above is/are correct?
              </p>

              <div className="space-y-2.5">
                {[
                  "1 only",
                  "1 and 2 only",
                  "2 and 3 only",
                  "1, 2 and 3",
                ].map((opt, i) => (
                  <div
                    key={opt}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                      i === 3
                        ? "border-[#C4784A] bg-[#C4784A]/10 text-white"
                        : "border-[var(--border)] text-[#999]"
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        i === 3 ? "border-[#C4784A]" : "border-[var(--accent)]"
                      }`}
                    >
                      {i === 3 && (
                        <div className="h-2 w-2 rounded-full bg-[#C4784A]" />
                      )}
                    </div>
                    <span>
                      {String.fromCharCode(65 + i)}) {opt}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between border-t border-[var(--border)] pt-4">
                <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  Previous
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C4784A]">
                  Mark for Review
                </span>
                <span className="text-[11px] uppercase tracking-wider text-white">
                  Next &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Practice Modes ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-28">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: Copy */}
          <div>
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
              &mdash;&ensp;How It Works
            </span>
            <h2 className="mb-5 font-serif text-3xl font-bold leading-[1.1] text-[#1A1A1A] sm:mb-6 sm:text-5xl">
              Choose your mode.
              <br />
              Practice under real conditions.
            </h2>
            <p className="mb-8 max-w-md text-base leading-relaxed text-[#6B7280] sm:mb-10 sm:text-lg">
              Year-wise PYQs, subject drills, or full-length mocks &mdash;
              every session mirrors the actual UPSC prelims experience with
              timed questions and negative marking.
            </p>

            {/* Subject pills */}
            <div className="flex flex-wrap gap-2">
              {[
                "Polity",
                "History",
                "Economy",
                "Geography",
                "Environment",
                "Science",
                "Current Affairs",
              ].map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-[#E0DBD4] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Step cards */}
          <div className="space-y-5">
            {[
              {
                step: "01",
                title: "Choose Your Focus",
                desc: "Pick a year, subject, or topic. Or launch a full-length mock that covers the entire syllabus.",
              },
              {
                step: "02",
                title: "Practice Under Pressure",
                desc: "Timed sessions with UPSC-style negative marking. No hints, no shortcuts \u2014 exactly like exam day.",
              },
              {
                step: "03",
                title: "Review & Improve",
                desc: "See your score, review every question, identify weak subjects, and track improvement over time.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-[#E5E0DA] bg-white p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 text-sm font-bold text-[#C4784A]">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="mb-1 text-lg font-bold text-[#1A1A1A]">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#6B7280]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Analytics / Track ───────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-28">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: Copy + feature cards */}
          <div>
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
              &mdash;&ensp;Track Your Progress
            </span>
            <h2 className="mb-5 font-serif text-3xl font-bold leading-[1.1] text-[#1A1A1A] sm:mb-6 sm:text-5xl">
              Know where you stand.
              <br />
              Compound over time.
            </h2>
            <p className="mb-8 max-w-md text-base leading-relaxed text-[#6B7280] sm:text-lg">
              Every test builds your profile. See which subjects need work,
              track your score trajectory, and watch your accuracy improve
              test after test.
            </p>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[#E5E0DA] bg-white p-5">
                <h4 className="mb-1 text-base font-bold text-[#1A1A1A]">
                  Subject Analysis
                </h4>
                <p className="text-sm text-[#6B7280]">
                  See accuracy for Polity, History, Economy, Geography,
                  Science, Environment &mdash; pinpoint your gaps.
                </p>
              </div>
              <div className="rounded-2xl border border-[#E5E0DA] bg-white p-5">
                <h4 className="mb-1 text-base font-bold text-[#1A1A1A]">
                  Score Trajectory
                </h4>
                <p className="text-sm text-[#6B7280]">
                  Track mock-test scores over time. See readiness bands and
                  know when you&rsquo;re cutoff-ready.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Dark dashboard mockup */}
          <div className="rounded-2xl bg-[#1C1C1C] p-5 shadow-2xl sm:rounded-3xl sm:p-7">
            <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#888]">
              Performance Dashboard
            </div>

            {/* Score cards */}
            <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl bg-[#262626] p-4">
                <div className="mb-1 text-[11px] text-[#888]">Target</div>
                <div className="font-serif text-2xl font-bold text-white">
                  115
                </div>
              </div>
              <div className="rounded-xl border border-[#C4784A]/30 bg-[#C4784A]/10 p-4">
                <div className="mb-1 text-[11px] text-[#C4784A]">Average</div>
                <div className="font-serif text-2xl font-bold text-[#C4784A]">
                  102.5
                </div>
              </div>
              <div className="rounded-xl bg-[#262626] p-4">
                <div className="mb-1 text-[11px] text-[#888]">Accuracy</div>
                <div className="font-serif text-2xl font-bold text-white">
                  76%
                </div>
              </div>
            </div>

            {/* Chart bars */}
            <div className="mb-6 rounded-xl bg-[#262626] p-5">
              <div className="mb-4 text-[11px] text-[#888]">
                Score Progression (Last 10)
              </div>
              <div className="flex h-28 items-end gap-2">
                {[40, 55, 45, 70, 65, 80, 75, 90, 85, 102].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm transition-all duration-700"
                    style={{
                      height: `${h}%`,
                      backgroundColor: i === 9 ? "#C4784A" : "#3a3a3a",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Subject accuracy bars */}
            <div className="space-y-4">
              {[
                { subject: "Polity", score: 85, color: "#10b981" },
                { subject: "Economics", score: 78, color: "#C4784A" },
                { subject: "Environment", score: 55, color: "#eab308" },
                { subject: "History", score: 45, color: "#ef4444" },
              ].map((s) => (
                <div key={s.subject}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-[#888]">{s.subject}</span>
                    <span className="font-bold" style={{ color: s.color }}>
                      {s.score}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#333]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.score}%`,
                        backgroundColor: s.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-5 font-serif text-4xl font-bold leading-[1.06] text-[#1A1A1A] sm:mb-6 sm:text-6xl md:text-7xl">
            Start with one
            <br />
            <span className="italic text-[#C4784A]">test today.</span>
          </h2>
          <p className="mx-auto mb-8 max-w-md text-base text-[#6B7280] sm:mb-10 sm:text-lg">
            No signup needed. Pick a year, take the test, see where you stand.
          </p>
          <Link
            href="/app"
            className="inline-block rounded-full bg-[#C4784A] px-8 py-4 text-base font-bold text-white transition-colors hover:bg-[#B06838] sm:px-10 sm:py-5 sm:text-lg"
          >
            Start your first test
          </Link>
          <p className="mt-4 text-sm text-[#9CA3AF]">
            No paywall. No trial period. Full access, always.
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E5E0DA]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-serif text-sm font-bold text-[#1A1A1A]">
              UPSC Prelims Test
            </span>
            <span className="block text-xs text-[#9CA3AF]">
              Practice like the exam. Review like a strategist.
            </span>
          </div>
          <nav className="flex gap-5 text-sm text-[#6B7280]">
            <Link
              href="/app/pyq"
              className="transition-colors hover:text-[#1A1A1A]"
            >
              PYQ Practice
            </Link>
            <Link
              href="/app"
              className="transition-colors hover:text-[#1A1A1A]"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="transition-colors hover:text-[#1A1A1A]"
            >
              Login
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
