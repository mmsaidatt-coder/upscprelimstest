"use client";

import { useState } from "react";
import Link from "next/link";
import { PyqDatabaseView } from "@/components/pyq-database-view";

type YearRow = { year: number; count: number };
type SubjectRow = { subject: string; count: number };

const TABS = [
  { id: "year", label: "Year Wise", icon: CalendarIcon },
  { id: "subject", label: "Subject Wise", icon: BookIcon },
  { id: "custom", label: "Custom Session", icon: SlidersIcon },
  { id: "search", label: "Search Bank", icon: SearchIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function PyqTabsView({
  yearCounts,
  subjectCounts,
}: {
  yearCounts: YearRow[];
  subjectCounts: SubjectRow[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("year");

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-0.5 rounded-xl bg-[var(--background-secondary)] p-1 border border-[var(--border)] shadow-sm overflow-x-auto scrollbar-hide sm:gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center justify-center gap-1.5 flex-1 min-w-0
                  rounded-lg px-2 py-2.5 text-xs font-semibold
                  transition-all duration-200 whitespace-nowrap
                  sm:px-4 sm:text-sm sm:gap-2
                  ${
                    isActive
                      ? "bg-white text-[var(--accent)] shadow-sm border border-[var(--border)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/50"
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5 shrink-0 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-[11px]">{tab.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-300">
        {activeTab === "year" && <YearPanel yearCounts={yearCounts} />}
        {activeTab === "subject" && <SubjectPanel subjectCounts={subjectCounts} />}
        {activeTab === "custom" && (
          <CustomPanel yearCounts={yearCounts} subjectCounts={subjectCounts} />
        )}
        {activeTab === "search" && <SearchPanel />}
      </div>
    </div>
  );
}

/* ─── Tab Panels ──────────────────────────────────────────── */

function YearPanel({ yearCounts }: { yearCounts: YearRow[] }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-semibold text-[var(--foreground)]">Year wise practice</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Full-year papers as timed sessions. Pick a year to begin.
        </p>
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {yearCounts.map((row) => (
          <Link
            key={row.year}
            href={`/app/pyq/run?year=${row.year}&limit=100`}
            className="group relative rounded-xl border border-[var(--border)] bg-white p-4 transition-all hover:border-[var(--accent)] hover:shadow-md"
          >
            <p className="text-xs font-medium text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
              {row.count} questions
            </p>
            <p className="mt-1.5 text-2xl font-bold text-[var(--foreground)]">{row.year}</p>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowIcon className="w-4 h-4 text-[var(--accent)]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SubjectPanel({ subjectCounts }: { subjectCounts: SubjectRow[] }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-semibold text-[var(--foreground)]">Subject wise practice</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Isolate a subject for targeted drilling across all years.
        </p>
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {subjectCounts.map((row) => (
          <Link
            key={row.subject}
            href={`/app/pyq/run?subject=${encodeURIComponent(row.subject)}&limit=25`}
            className="group relative rounded-xl border border-[var(--border)] bg-white p-4 transition-all hover:border-[var(--accent)] hover:shadow-md"
          >
            <p className="text-xs font-medium text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
              {row.count} questions
            </p>
            <p className="mt-1.5 text-base font-bold text-[var(--foreground)]">{row.subject}</p>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowIcon className="w-4 h-4 text-[var(--accent)]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CustomPanel({
  yearCounts,
  subjectCounts,
}: {
  yearCounts: YearRow[];
  subjectCounts: SubjectRow[];
}) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-semibold text-[var(--foreground)]">Build a custom session</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Combine year + subject filters with your preferred question count.
        </p>
      </div>

      <form action="/app/pyq/run" method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Year
          </span>
          <select
            name="year"
            defaultValue=""
            className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors"
          >
            <option value="">All years</option>
            {yearCounts.map((row) => (
              <option key={row.year} value={row.year}>
                {row.year}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Subject
          </span>
          <select
            name="subject"
            defaultValue=""
            className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors"
          >
            <option value="">All subjects</option>
            {subjectCounts.map((row) => (
              <option key={row.subject} value={row.subject}>
                {row.subject} ({row.count})
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Questions
          </span>
          <select
            name="limit"
            defaultValue="25"
            className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors"
          >
            {[10, 25, 50, 100].map((v) => (
              <option key={v} value={String(v)}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
          >
            Start session
          </button>
        </div>
      </form>
    </div>
  );
}

function SearchPanel() {
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-semibold text-[var(--foreground)]">Search question bank</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Browse, search, and explore all previous year questions with detailed metadata.
        </p>
      </div>
      <PyqDatabaseView />
    </div>
  );
}

/* ─── Icons (inline SVG to avoid extra dependencies) ──────── */

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function SlidersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
