"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSyncedAttempts } from "@/lib/storage";
import type { AttemptRecord, Subject } from "@/lib/types";
import { subjectColorMap, formatDuration } from "@/lib/exam";

// Slug → canonical Subject
const SLUG_TO_SUBJECT: Record<string, Subject | "all"> = {
  polity: "Polity",
  history: "History",
  economy: "Economy",
  geography: "Geography",
  environment: "Environment",
  science: "Science",
  "current-affairs": "Current Affairs",
  csat: "CSAT",
  all: "all",
};

const SUBJECT_SLUGS = [
  { slug: "polity", label: "Polity" },
  { slug: "history", label: "History" },
  { slug: "economy", label: "Economy" },
  { slug: "geography", label: "Geography" },
  { slug: "environment", label: "Environment" },
  { slug: "science", label: "Science" },
  { slug: "current-affairs", label: "Current Affairs" },
];

function subjectToSlug(subject: Subject): string {
  return subject.toLowerCase().replace(/\s+/g, "-");
}

function AccuracyBar({ percent, subject }: { percent: number; subject: Subject | "all" }) {
  const color = subject === "all" ? "var(--accent)" : (subjectColorMap[subject as Subject] ?? "var(--accent)");
  return (
    <div className="h-2 w-full rounded-full bg-[var(--border)]">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}

interface SubjectStat {
  subject: Subject;
  attempts: number;
  totalQuestions: number;
  correct: number;
  accuracy: number;
  avgDuration: number;
}

function computeStats(attempts: AttemptRecord[], filter: Subject | "all"): SubjectStat[] {
  const map = new Map<Subject, { attempts: number; totalQ: number; correct: number; totalTime: number }>();

  for (const attempt of attempts) {
    if (attempt.grading === "ungraded") continue;

    for (const metric of attempt.subjectMetrics) {
      if (filter !== "all" && metric.subject !== filter) continue;

      const existing = map.get(metric.subject) ?? { attempts: 0, totalQ: 0, correct: 0, totalTime: 0 };
      existing.attempts += 1;
      existing.totalQ += metric.correct + metric.incorrect + metric.unattempted;
      existing.correct += metric.correct;
      existing.totalTime += attempt.durationSeconds;
      map.set(metric.subject, existing);
    }
  }

  return Array.from(map.entries()).map(([subject, data]) => ({
    subject,
    attempts: data.attempts,
    totalQuestions: data.totalQ,
    correct: data.correct,
    accuracy: data.totalQ > 0 ? Math.round((data.correct / data.totalQ) * 100) : 0,
    avgDuration: data.attempts > 0 ? Math.round(data.totalTime / data.attempts) : 0,
  })).sort((a, b) => b.accuracy - a.accuracy);
}

export function AnalyticsView({ subjectSlug }: { subjectSlug: string }) {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const subjectFilter = SLUG_TO_SUBJECT[subjectSlug] ?? "all";
  const isKnownSlug = subjectSlug in SLUG_TO_SUBJECT;

  useEffect(() => {
    let active = true;

    async function loadAttempts() {
      const synced = await getSyncedAttempts();
      if (!active) return;
      setAttempts(synced.attempts);
      setHydrated(true);
    }

    void loadAttempts();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => computeStats(attempts, subjectFilter), [attempts, subjectFilter]);

  const filteredAttempts = useMemo(() => {
    if (subjectFilter === "all") return attempts;
    return attempts.filter((a) =>
      a.subjectMetrics.some((m) => m.subject === subjectFilter),
    );
  }, [attempts, subjectFilter]);

  const displayLabel =
    subjectFilter === "all"
      ? "All Subjects"
      : (subjectFilter as string);

  const accentColor =
    subjectFilter === "all"
      ? "var(--accent)"
      : (subjectColorMap[subjectFilter as Subject] ?? "var(--accent)");

  if (!isKnownSlug) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <p className="text-6xl">🧭</p>
        <h1 className="heading text-2xl">Unknown subject</h1>
        <p className="text-sm text-[var(--muted)] max-w-sm">
          That subject slug does not exist. Pick one below.
        </p>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {SUBJECT_SLUGS.map((s) => (
            <Link
              key={s.slug}
              href={`/analytics/${s.slug}`}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card h-24 animate-pulse bg-[var(--background-secondary)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2 sm:gap-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{
              backgroundColor: `${accentColor}20`,
              color: accentColor,
              border: `1px solid ${accentColor}40`,
            }}
          >
            Analytics
          </span>
          {/* Subject switcher */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            <Link
              href="/analytics/all"
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:text-xs ${
                subjectFilter === "all"
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              All
            </Link>
            {SUBJECT_SLUGS.map((s) => (
              <Link
                key={s.slug}
                href={`/analytics/${s.slug}`}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:text-xs ${
                  subjectToSlug(s.label as Subject) === subjectSlug
                    ? "text-[var(--background)]"
                    : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                style={
                  subjectToSlug(s.label as Subject) === subjectSlug
                    ? { backgroundColor: accentColor }
                    : {}
                }
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        <h1 className="heading text-2xl mt-3 sm:text-3xl sm:mt-4 md:text-4xl">
          {displayLabel}
          <span className="text-[var(--muted)]"> Performance</span>
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Data from your saved practice sessions — updated after every test.
        </p>
      </div>

      {/* Empty state */}
      {filteredAttempts.length === 0 && (
        <div className="card flex flex-col items-center gap-5 p-12 text-center border-dashed">
          <p className="text-5xl">📭</p>
          <div>
            <p className="font-semibold text-[var(--foreground)]">No attempts yet</p>
            <p className="mt-1 text-sm text-[var(--muted)] max-w-sm mx-auto">
              {subjectFilter === "all"
                ? "Take a practice test and your stats will appear here."
                : `Take a ${displayLabel} PYQ session and your stats will appear here.`}
            </p>
          </div>
          <Link
            href={
              subjectFilter === "all"
                ? "/app/pyq/run?limit=25"
                : `/app/pyq/run?subject=${encodeURIComponent(subjectFilter as string)}&limit=25`
            }
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent)]/90 transition-colors"
          >
            Start a session →
          </Link>
        </div>
      )}

      {/* Stats grid */}
      {stats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.subject} className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--foreground)]">{stat.subject}</p>
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-bold"
                  style={{
                    backgroundColor: `${subjectColorMap[stat.subject]}20`,
                    color: subjectColorMap[stat.subject],
                  }}
                >
                  {stat.accuracy}%
                </span>
              </div>
              <AccuracyBar percent={stat.accuracy} subject={stat.subject} />
              <div className="flex gap-4 text-xs text-[var(--muted)]">
                <span>{stat.correct}/{stat.totalQuestions} correct</span>
                <span>{stat.attempts} session{stat.attempts !== 1 ? "s" : ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent attempts */}
      {filteredAttempts.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-semibold text-[var(--foreground)] mb-4">
            Recent sessions
          </p>
          <div className="space-y-2">
            {filteredAttempts.slice(0, 8).map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between rounded-lg bg-[var(--background-secondary)] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)] truncate max-w-[180px] sm:max-w-[240px]">
                    {attempt.testTitle}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {new Date(attempt.completedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" · "}
                    {formatDuration(attempt.durationSeconds)}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  {attempt.score !== null ? (
                    <>
                      <p className="text-sm font-bold text-[var(--foreground)]">
                        {attempt.score}
                        <span className="text-xs text-[var(--muted)] font-normal">
                          /{attempt.grading === "graded" ? attempt.totalMarks : attempt.gradedTotalMarks}
                        </span>
                      </p>
                      {attempt.accuracyPercent !== null && (
                        <p className="text-xs text-[var(--muted)]">{attempt.accuracyPercent}% acc</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-[var(--muted)]">Ungraded</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredAttempts.length > 8 && (
            <p className="mt-3 text-xs text-[var(--muted)] text-center">
              +{filteredAttempts.length - 8} more sessions
            </p>
          )}
        </div>
      )}

      {/* Bookmark tip */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-5 py-4 text-sm text-[var(--muted)] flex items-start gap-3">
        <span className="text-lg mt-0.5">🔖</span>
        <div>
          <p className="font-medium text-[var(--foreground)]">Bookmark this page</p>
          <p className="mt-0.5">
            This URL always shows your {displayLabel.toLowerCase()} performance. Bookmark it and it will still work tomorrow.
          </p>
        </div>
      </div>
    </div>
  );
}
