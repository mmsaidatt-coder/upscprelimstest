"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RadarChart } from "@/components/charts/radar-chart";
import { PacingChart } from "@/components/charts/pacing-chart";
import { tests } from "@/data/tests";
import {
  computeDailyStreak,
  computeStrongestSubject,
  formatDuration,
  subjectColorMap,
} from "@/lib/exam";
import { getAttempts, getNotebookEntries, subscribeToStorage } from "@/lib/storage";
import type { AttemptRecord, NotebookEntry } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export function DashboardOverview() {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [notebookEntries, setNotebookEntries] = useState<NotebookEntry[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const latestAttempt = attempts[0] ?? null;
  const latestScoredAttempt = attempts.find((attempt) => attempt.score !== null) ?? null;
  const dailyStreak = useMemo(() => computeDailyStreak(attempts), [attempts]);
  const strongestSubject = useMemo(() => computeStrongestSubject(attempts), [attempts]);
  const totalQuestionsPracticed = attempts.reduce(
    (sum, attempt) => sum + attempt.attemptedCount,
    0,
  );

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user);
    });

    const hydrate = () => {
      setHydrated(true);
      setAttempts(getAttempts());
      setNotebookEntries(getNotebookEntries());
    };

    hydrate();
    return subscribeToStorage(hydrate);
  }, []);

  if (!hydrated || isAuthenticated === null) {
    return (
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card h-[250px] animate-pulse bg-[var(--background-secondary)]"></div>
        <div className="card h-[250px] animate-pulse bg-[var(--background-secondary)]"></div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="card flex flex-col items-center justify-center p-12 text-center border-dashed border-[var(--border)] bg-transparent">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--background-secondary)] mb-6 text-2xl">
          🔒
        </div>
        <h2 className="heading text-3xl mb-3">Login to view dashboard</h2>
        <p className="max-w-md text-[var(--muted)] mb-8 leading-7">
          Your personal student history, test analytics, and readiness signals require an account. Login to sync your practice data securely.
        </p>
        <Link
          href="/login?next=/app"
          className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--accent)]/90 transition-colors uppercase tracking-widest"
        >
          Login or Sign up
        </Link>
      </section>
    );
  }

  // Fresh state
  if (!latestAttempt) {
    const firstTest = tests[0]!;
    return (
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--accent)]">Welcome</p>
          <h1 className="heading mt-2 text-2xl md:text-3xl">
            Your dashboard starts empty on purpose.
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">
            Take your first test and the app will unlock readiness signals,
            pacing diagnostics, and a personal notebook.
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              href={`/app/exams/${firstTest.slug}`}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              Take first mock
            </Link>
            <Link
              href="/app/pyq"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
            >
              PYQ library
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { label: "Daily streak", value: "0", note: "Starts after first session" },
            { label: "Notebook", value: "0", note: "Save high-signal takeaways" },
            { label: "Exam mode", value: "On", note: "Timer + negative marking live" },
          ].map((item) => (
            <div key={item.label} className="card p-4">
              <p className="text-xs text-[var(--muted)]">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{item.value}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{item.note}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Ungraded state
  if (!latestScoredAttempt) {
    return (
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--accent)]">Practice started</p>
          <h1 className="heading mt-2 text-2xl md:text-3xl">
            Sessions logged, scoring unlocks with answer keys.
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">
            You can still practice in exam mode. Scoring, accuracy radar,
            and readiness signals appear once answer keys are available.
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              href="/app/pyq"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              PYQ practice
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { label: "Streak", value: dailyStreak, note: dailyStreak ? "Keep going" : "One session starts the chain" },
            { label: "Notebook", value: notebookEntries.length, note: "Takeaways saved" },
            { label: "Questions", value: totalQuestionsPracticed, note: "Practiced so far" },
          ].map((item) => (
            <div key={item.label} className="card p-4">
              <p className="text-xs text-[var(--muted)]">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{item.value}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{item.note}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Scored state
  const radarData = latestScoredAttempt.subjectMetrics.map((metric) => ({
    label: metric.subject,
    value: metric.accuracyPercent,
  }));
  const paceData = latestScoredAttempt.questionReviews
    .filter((review) => review.isCorrect !== null)
    .map((review, index) => ({
      index,
      value: Math.max(review.timeSpentSeconds, 1),
      correct: review.isCorrect!,
    }));
  const weakestSubjects = [...latestScoredAttempt.subjectMetrics]
    .sort((left, right) => left.accuracyPercent - right.accuracyPercent)
    .slice(0, 3);
  const scoreDenominator =
    latestScoredAttempt.grading === "graded"
      ? latestScoredAttempt.totalMarks
      : latestScoredAttempt.gradedTotalMarks;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-lg">
              <p className="text-sm font-semibold text-[var(--accent)]">Latest result</p>
              <h1 className="heading mt-2 text-2xl">
                {latestScoredAttempt.testTitle}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {latestScoredAttempt.grading === "partial" ? (
                  <>
                    Partially graded ({latestScoredAttempt.gradedQuestionCount}/
                    {latestScoredAttempt.questionReviews.length} questions).
                  </>
                ) : latestScoredAttempt.readinessBand ? (
                  <>
                    Readiness: {latestScoredAttempt.readinessBand}
                    {latestScoredAttempt.accuracyPercent !== null && ` · ${latestScoredAttempt.accuracyPercent}% accuracy`}
                  </>
                ) : null}
              </p>
            </div>

            <div className="rounded-xl bg-[var(--foreground)] px-5 py-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                Score
              </p>
              <p className="mt-1 text-3xl font-bold">
                {latestScoredAttempt.score}
                <span className="text-base text-white/50">/{scoreDenominator}</span>
              </p>
              <p className="mt-1 text-xs text-white/60">
                {formatDuration(latestScoredAttempt.durationSeconds)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { label: "Streak", value: dailyStreak, note: dailyStreak ? "Consistency compounds" : "Start the chain" },
            { label: "Notebook", value: notebookEntries.length, note: "Takeaways saved" },
            {
              label: "Questions",
              value: totalQuestionsPracticed,
              note: strongestSubject ? `Strongest: ${strongestSubject}` : "Keep practicing",
            },
          ].map((item) => (
            <div key={item.label} className="card p-4">
              <p className="text-xs text-[var(--muted)]">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{item.value}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <RadarChart data={radarData} />
        <PacingChart data={paceData} />

        <div className="card p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Weak areas</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Prioritize subjects with low accuracy.
          </p>
          <div className="mt-4 space-y-3">
            {weakestSubjects.map((metric) => (
              <div key={metric.subject} className="rounded-lg bg-[var(--background-secondary)] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--foreground)]">{metric.subject}</p>
                  <span
                    className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      backgroundColor: `${subjectColorMap[metric.subject]}15`,
                      color: subjectColorMap[metric.subject],
                    }}
                  >
                    {metric.accuracyPercent}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-[var(--border)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${metric.accuracyPercent}%`,
                      backgroundColor: subjectColorMap[metric.subject],
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Avg {metric.averageTimeSeconds}s/question
                </p>
              </div>
            ))}
          </div>

          <Link
            href={`/app/attempts/${latestScoredAttempt.id}`}
            className="mt-4 inline-flex rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
          >
            Full review
          </Link>
        </div>
      </div>
    </section>
  );
}
