"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Database, FileText, Layers3 } from "lucide-react";
import { PyqDatabaseView } from "@/components/pyq-database-view";

const YEARS = [2026, ...Array.from({ length: 12 }, (_, index) => 2025 - index)];
const SUBJECTS = [
  "History",
  "Geography",
  "Economics",
  "Environment",
  "Polity",
  "Science & Tech",
  "Current Affairs",
];

type Tab = "year" | "subject" | "database";

const tabMeta: Record<Tab, { label: string; title: string; description: string }> = {
  year: {
    label: "By year",
    title: "Read each paper in context.",
    description:
      "Use the official 2026 paper links, or enter solved GS-I papers from 2014 to 2025 as timed sessions, sectionals, and year analyses.",
  },
  subject: {
    label: "By subject",
    title: "Follow one idea across years.",
    description:
      "Isolate a subject to see how UPSC revisits foundational concepts through changing facts, frames, and distractors.",
  },
  database: {
    label: "Search bank",
    title: "Find the exact question.",
    description:
      "Search all 1,199 solved previous-year questions by phrase, topic, subject, or year.",
  },
};

export function PyqTabs({ initialQuery = "" }: { initialQuery?: string }) {
  const [activeTab, setActiveTab] = useState<Tab>(initialQuery ? "database" : "year");
  const meta = tabMeta[activeTab];

  return (
    <>
      <header className="grid gap-10 border-b border-[var(--border)] pb-10 sm:pb-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <p className="editorial-kicker">Previous paper archive</p>
          <h1 className="heading mt-8 text-5xl sm:text-6xl lg:text-7xl">
            UPSC PYQ,
            <br />
            <span className="text-[var(--accent)]">2014—2026.</span>
          </h1>
        </div>

        <div className="lg:pb-1">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            {meta.label} / Active view
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-3xl">
            {meta.title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            {meta.description}
          </p>
        </div>
      </header>

      <div className="sticky top-16 z-20 -mx-4 border-b border-[var(--border)] bg-[color:rgba(27,33,28,0.94)] px-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:top-[76px]">
        <div className="mx-auto flex max-w-4xl overflow-x-auto scrollbar-hide">
          {(
            [
              ["year", "01", "By year", FileText],
              ["subject", "02", "By subject", Layers3],
              ["database", "03", "Search bank", Database],
            ] as const
          ).map(([tab, number, label, Icon]) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-pressed={active}
                className={`relative flex min-w-[9rem] flex-1 items-center justify-center gap-2 px-4 py-5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] sm:text-[10px] ${
                  active ? "text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <span className="hidden text-[var(--accent)] sm:inline">{number}</span>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                {label}
                {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--accent)]" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-10 sm:pt-14">
        {activeTab === "database" ? <PyqDatabaseView initialQuery={initialQuery} /> : null}

        {activeTab === "year" ? (
          <div className="grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
            {YEARS.map((year, index) => (
              <article
                key={year}
                className="group flex min-h-64 flex-col bg-[var(--background-secondary)] p-5 transition-colors hover:bg-[var(--background-tertiary)] sm:min-h-72 sm:p-7"
              >
                <div className="flex items-start justify-between">
                  <span className="index-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {year === 2026 ? "Official PDFs" : "Solved GS-I"}
                  </span>
                </div>

                <p className="mt-8 text-5xl font-semibold tracking-[-0.065em] text-[var(--foreground)] sm:text-6xl">
                  {year}
                </p>
                <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
                  {year === 2026
                    ? "General Studies Paper I and CSAT from the official UPSC source."
                    : "Timed paper, sectional practice, and a subject-topic breakdown."}
                </p>

                <div className="mt-auto pt-7">
                  {year === 2026 ? (
                    <Link href="/pyq/2026" className="group/link flex items-center justify-between border-t border-[var(--border)] pt-4 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--foreground)]">
                      Open official papers
                      <ArrowRight className="h-4 w-4 text-[var(--accent)] transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4 font-mono text-[8px] font-bold uppercase tracking-[0.1em]">
                      <Link href={`/app/pyq/run?year=${year}&limit=100`} className="text-[var(--foreground)] hover:text-[var(--accent)]">Test</Link>
                      <Link href={`/app/pyq/sectional?year=${year}`} className="text-center text-[var(--muted)] hover:text-[var(--foreground)]">Sectional</Link>
                      <Link href={`/pyq/${year}/analysis`} className="text-right text-[var(--muted)] hover:text-[var(--foreground)]">Analysis</Link>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {activeTab === "subject" ? (
          <div className="grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
            {SUBJECTS.map((subject, index) => (
              <article
                key={subject}
                className="group flex min-h-60 flex-col bg-[var(--background-secondary)] p-5 transition-colors hover:bg-[var(--background-tertiary)] sm:min-h-64 sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="index-number">0{index + 1}</span>
                  <Layers3 className="h-4 w-4 text-[var(--muted)] group-hover:text-[var(--accent)]" strokeWidth={1.5} />
                </div>
                <h3 className="mt-8 text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-4xl">
                  {subject}
                </h3>
                <p className="mt-3 text-xs leading-6 text-[var(--muted)]">Practice a focused 25Q or 50Q drill, then inspect its pattern.</p>
                <div className="mt-auto grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4 font-mono text-[8px] font-bold uppercase tracking-[0.1em]">
                  <Link href={`/app/pyq/run?subject=${encodeURIComponent(subject)}&limit=50`} className="text-[var(--foreground)] hover:text-[var(--accent)]">50Q</Link>
                  <Link href={`/app/pyq/run?subject=${encodeURIComponent(subject)}&limit=25`} className="text-center text-[var(--muted)] hover:text-[var(--foreground)]">25Q</Link>
                  <Link href={`/pyq/subject-analyse?subject=${encodeURIComponent(subject)}`} className="text-right text-[var(--muted)] hover:text-[var(--foreground)]">Analysis</Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
