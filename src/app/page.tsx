import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpenText,
  Check,
  Clock3,
  FileText,
  Layers3,
  MoveUpRight,
} from "lucide-react";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { FaqSection } from "@/components/seo/faq-section";

export const metadata: Metadata = {
  title: "UPSC Prelims Practice | Free PYQs and Mock Tests",
  description:
    "Free UPSC Prelims practice with 1,199 solved PYQs from 2014 to 2025, official 2026 papers, and 10,000+ practice questions. Timed tests, subject practice, and analytics.",
  alternates: { canonical: "https://upscprelimstest.com" },
};

const HOME_FAQS = [
  {
    question: "What is UPSC Prelims Test?",
    answer:
      "UPSC Prelims Test is a free independent practice platform with 1,199 solved General Studies Paper I questions from 2014 to 2025, official 2026 paper links, a larger mock bank, subject practice, and performance analytics.",
  },
  {
    question: "How many UPSC previous year questions are available?",
    answer:
      "The solved library has 1,199 questions from 12 General Studies Paper I papers covering 2014 to 2025. It includes Polity, History, Economy, Geography, Environment, Science, and Current Affairs. Official 2026 GS Paper I and CSAT PDF links are also available.",
  },
  {
    question: "Is the platform completely free?",
    answer:
      "Yes. There is no paywall, no trial period, and no signup required to start practicing. Full access to all questions, analytics, and features is completely free.",
  },
  {
    question: "Does the practice test simulate real UPSC Prelims exam conditions?",
    answer:
      "Yes. Every session includes a countdown timer, one third negative marking, question map navigation, and a save for review option. The flow reflects the core conditions of the real examination.",
  },
];

const practiceModes = [
  {
    number: "01",
    title: "Past papers",
    eyebrow: "Twelve years of GS Paper I",
    description:
      "Work through solved questions by year. Notice repeated themes, changing language, and the logic behind each answer.",
    href: "/pyq",
    cta: "Browse past papers",
    icon: BookOpenText,
  },
  {
    number: "02",
    title: "Mock exam",
    eyebrow: "100 questions in 120 minutes",
    description:
      "Rehearse the full paper with a timer, negative marking, review flags, and the subject balance of the real exam.",
    href: "/free-upsc-prelims-mock-test",
    cta: "Start a mock",
    icon: FileText,
  },
  {
    number: "03",
    title: "Subject practice",
    eyebrow: "One subject at a time",
    description:
      "Focus on one subject, find weak concepts, and improve through short, repeatable sessions.",
    href: "/subject-wise",
    cta: "Choose a subject",
    icon: Layers3,
  },
];

const subjects = ["Polity", "History", "Economy", "Geography", "Environment", "Science", "Current Affairs"];

function ExamStage() {
  return (
    <div className="relative mx-auto w-full max-w-[43rem] lg:mr-0">
      <div className="relative border border-[var(--border)] bg-[var(--background-secondary)] p-4 shadow-[0_45px_100px_rgba(3,6,4,0.35)] sm:p-7">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
          <span>GS Paper I practice</span>
          <span className="flex items-center gap-2 text-[var(--foreground)]">
            <span className="signal-dot" /> 01:17:42
          </span>
        </div>

        <div className="grid sm:grid-cols-[1fr_5.5rem]">
          <div className="py-7 sm:pr-7">
            <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
              <span>Question 42</span>
              <span aria-hidden="true" className="signal-dot !h-1 !w-1 !shadow-none" />
              <span>Polity</span>
            </div>
            <p className="mt-6 text-[15px] font-medium leading-7 text-[var(--foreground)] sm:text-base">
              Consider the following statements about Fundamental Rights:
            </p>
            <ol className="mt-4 space-y-2 text-sm leading-6 text-[var(--muted-strong)]">
              <li>1. Article 14 guarantees equality before law.</li>
              <li>2. Article 19 protects six freedoms.</li>
              <li>3. Article 21 protects life and personal liberty.</li>
            </ol>
            <p className="mt-4 text-sm text-[var(--foreground)]">Which statements are correct?</p>

            <div className="mt-6 grid gap-2">
              {["1 only", "1 and 2 only", "2 and 3 only", "1, 2 and 3"].map((option, index) => (
                <div
                  key={option}
                  className={`flex min-h-12 items-center gap-3 border px-4 text-sm ${
                    index === 3
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--foreground)]"
                      : "border-[var(--border)] text-[var(--muted)]"
                  }`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[8px] ${index === 3 ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--muted)]"}`}>
                    {index === 3 ? <Check className="h-3 w-3" strokeWidth={3} /> : String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden border-l border-[var(--border)] py-7 pl-5 sm:block">
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Question map</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {Array.from({ length: 12 }, (_, index) => (
                <span
                  key={index}
                  className={`flex h-8 w-8 items-center justify-center border font-mono text-[9px] ${
                    index === 5
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : index < 5
                        ? "border-[var(--foreground)] text-[var(--foreground)]"
                        : "border-[var(--border)] text-[var(--muted)]"
                  }`}
                >
                  {index + 37}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 font-mono text-[9px] font-bold uppercase tracking-[0.14em]">
          <span className="text-[var(--muted)]">Save for review</span>
          <span className="flex items-center gap-2 text-[var(--foreground)]">Next question <ArrowRight className="h-3.5 w-3.5 text-[var(--accent)]" /></span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <FaqJsonLd faqs={HOME_FAQS} />

      <section className="editorial-grid relative min-h-[calc(100svh-4rem)] overflow-hidden border-b border-[var(--border)]">
        <div className="page-shell grid min-h-[calc(100svh-4rem)] gap-16 pb-16 pt-14 sm:pt-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="relative z-10 fade-up">
            <p className="editorial-kicker">UPSC Prelims practice</p>
            <h1 className="display-title mt-9">
              Study what repeats.
              <br />
              <em>Master what changes.</em>
            </h1>
            <p className="body-copy mt-8 max-w-xl">
              Work through past papers, take realistic mock exams, and strengthen one subject at a time. Each session shows you what to improve next.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/app/pyq/run?limit=25" className="action-primary">
                Start 25 questions <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pyq" className="action-secondary">
                Browse past papers
              </Link>
            </div>

            <div className="mt-14 flex items-center gap-4 text-[var(--muted)]">
              <ArrowDown className="h-4 w-4 text-[var(--accent)]" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em]">See how practice works</span>
            </div>
          </div>

          <div className="relative z-10 pb-8 lg:pb-0">
            <ExamStage />
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)]">
        <div className="page-shell grid divide-y divide-[var(--border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {[
            ["1,199", "Solved PYQs"],
            ["12 years", "2014 to 2025"],
            ["10,000+", "Practice questions"],
            ["Free", "No paywall"],
          ].map(([value, label], index) => (
            <div key={label} className="px-1 py-7 sm:px-6 lg:py-9">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">0{index + 1} · {label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-3xl">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell py-20 sm:py-28 lg:py-36">
        <div className="grid gap-10 lg:grid-cols-[0.42fr_1fr] lg:gap-20">
          <div>
            <p className="editorial-kicker">Practice modes</p>
            <h2 className="heading mt-8 text-4xl sm:text-5xl lg:text-6xl">
              Choose how you want to train.
            </h2>
          </div>

          <div className="border-t border-[var(--border)]">
            {practiceModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <Link
                  key={mode.number}
                  href={mode.href}
                  className="group grid gap-5 border-b border-[var(--border)] py-8 sm:grid-cols-[3rem_1fr_auto] sm:items-start sm:gap-8 sm:py-10"
                >
                  <span className="index-number">{mode.number}</span>
                  <span>
                    <span className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.6} />
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">{mode.eyebrow}</span>
                    </span>
                    <span className="mt-4 block text-3xl font-semibold tracking-[-0.045em] text-[var(--foreground)] sm:text-4xl">{mode.title}</span>
                    <span className="mt-4 block max-w-xl text-sm leading-7 text-[var(--muted)]">{mode.description}</span>
                    <span className="mt-5 inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--foreground)] sm:hidden">
                      {mode.cta} <ArrowRight className="h-3.5 w-3.5 text-[var(--accent)]" />
                    </span>
                  </span>
                  <span className="hidden h-12 w-12 items-center justify-center border border-[var(--border)] text-[var(--muted)] transition-all group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white sm:flex">
                    <MoveUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--ink)]">
        <div className="page-shell grid gap-14 py-20 sm:py-28 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-24 lg:py-36">
          <div className="relative border border-[var(--border)] bg-[var(--background-secondary)] p-5 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Last 10 attempts</p>
                <p className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">102.5</p>
              </div>
              <BarChart3 className="h-6 w-6 text-[var(--accent)]" strokeWidth={1.5} />
            </div>
            <div className="mt-10 flex h-48 items-end gap-2 border-b border-l border-[var(--border)] px-4 pt-4">
              {[39, 52, 46, 65, 58, 72, 68, 79, 75, 88].map((height, index) => (
                <div key={index} className="group flex h-full flex-1 items-end">
                  <div
                    className={`w-full transition-all duration-500 ${index === 9 ? "bg-[var(--accent)]" : "bg-[var(--border)] group-hover:bg-[var(--muted)]"}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[["Accuracy", "76%"], ["Attempted", "84"], ["Streak", "12d"]].map(([label, value]) => (
                <div key={label} className="border-l border-[var(--border)] pl-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-[var(--muted)]">{label}</p>
                  <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="editorial-kicker">Clear feedback</p>
            <h2 className="heading mt-8 text-4xl sm:text-5xl lg:text-6xl">
              Make the next session count.
            </h2>
            <p className="body-copy mt-7 max-w-xl">
              See where marks are gained and lost. Review accuracy, pace, negative marking, and individual questions after every attempt.
            </p>
            <Link href="/analytics" className="action-secondary mt-9">
              View performance <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="page-shell py-20 sm:py-28 lg:py-36">
        <div className="grid gap-12 lg:grid-cols-[0.68fr_1fr] lg:gap-24">
          <div>
            <p className="editorial-kicker">Subject practice</p>
            <h2 className="heading mt-8 text-4xl sm:text-5xl">Build one subject at a time.</h2>
            <p className="body-copy mt-6 max-w-md">
              Practice one subject across years. See which concepts return, how questions evolve, and where your preparation needs work.
            </p>
          </div>
          <div className="grid border-t border-[var(--border)] sm:grid-cols-2">
            {subjects.map((subject, index) => (
              <Link
                key={subject}
                href={`/pyq/subject/${subject.toLowerCase().replaceAll(" ", "-")}`}
                className={`group flex min-h-28 items-center border-b border-[var(--border)] px-2 py-6 sm:px-6 ${index % 2 === 0 ? "sm:border-r" : ""}`}
              >
                <span className="index-number mr-5">0{index + 1}</span>
                <span className="text-xl font-semibold tracking-[-0.035em] text-[var(--foreground)]">{subject}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent)]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)]">
        <div className="page-shell grid gap-12 py-20 sm:py-28 lg:grid-cols-[0.78fr_1fr] lg:gap-24">
          <div>
            <p className="editorial-kicker">Question standards</p>
            <h2 className="heading mt-8 text-4xl sm:text-5xl">Know where every question comes from.</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <Clock3 className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">Source clarity</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Every solved paper shows its year, source, answer status, and review method.</p>
            </div>
            <div>
              <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">Meaningful topic groups</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Topic groups appear only when several questions reveal a useful pattern across years.</p>
            </div>
            <Link href="/methodology" className="action-secondary sm:col-span-2 sm:justify-self-start">
              See how questions are reviewed <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="page-shell py-20 sm:py-28">
        <FaqSection title="Before you begin" faqs={HOME_FAQS} />
      </section>
    </div>
  );
}
