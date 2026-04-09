"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PacingChart } from "@/components/charts/pacing-chart";
import { RadarChart } from "@/components/charts/radar-chart";
import { tests } from "@/data/tests";
import { formatDuration, formatSeconds, subjectColorMap } from "@/lib/exam";
import {
  getNotebookEntries,
  getSyncedAttempts,
  saveNotebookEntry,
  subscribeToStorage,
} from "@/lib/storage";
import type { AttemptRecord, NotebookEntry } from "@/lib/types";

function createNotebookId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

/** Guest banner: shown for history-dependent features when no login. */
function GuestBanner() {
  return (
    <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-5 py-4">
      <p className="text-sm font-semibold text-[var(--accent)]">Track your progress over time</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Sign in to save this result, track your streak, compare scores across attempts, and unlock
        your personal notebook.
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          href="/login"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/login?mode=signup"
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

export function ResultClient({ attemptId }: { attemptId: string }) {
  const [hydrated, setHydrated] = useState(false);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [notebookEntries, setNotebookEntries] = useState<NotebookEntry[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const synced = await getSyncedAttempts();
      if (!active) return;
      setHydrated(true);
      setAttempts(synced.attempts);
      setIsAuthenticated(synced.isAuthenticated);
      setNotebookEntries(getNotebookEntries());
    };

    void hydrate();
    const unsubscribe = subscribeToStorage(() => {
      void hydrate();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const attempt = useMemo(
    () => attempts.find((item) => item.id === attemptId) ?? null,
    [attemptId, attempts],
  );

  const savedQuestionIds = useMemo(
    () => Object.fromEntries(notebookEntries.map((entry) => [entry.questionId, true])),
    [notebookEntries],
  );

  const test = useMemo(
    () => (attempt ? tests.find((item) => item.slug === attempt.testSlug) ?? null : null),
    [attempt],
  );
  const retakeHref = useMemo(() => {
    if (!attempt) return null;
    if (test) return `/app/exams/${test.slug}`;
    if (attempt.testSlug.startsWith("ca-repo-")) return `/app/exams/${attempt.testSlug}`;
    return null;
  }, [attempt, test]);

  const isGuest = hydrated && !isAuthenticated;

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="card p-6 text-sm text-[var(--muted)]">Loading...</div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="card p-6">
          <h1 className="heading text-2xl">Attempt not found</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            This result is stored locally. If storage was cleared, it cannot be recovered.
          </p>
          <Link
            href="/app"
            className="mt-4 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const radarData = attempt.subjectMetrics.map((m) => ({ label: m.subject, value: m.accuracyPercent }));
  const paceData = attempt.questionReviews
    .filter((r) => r.isCorrect !== null)
    .map((r, i) => ({ index: i, value: Math.max(r.timeSpentSeconds, 1), correct: r.isCorrect! }));
  const subjectRank = [...attempt.subjectMetrics].sort((a, b) => a.accuracyPercent - b.accuracyPercent);
  const scoreDenominator = attempt.grading === "graded" ? attempt.totalMarks : attempt.gradedTotalMarks;

  const saveToNotebook = (entry: NotebookEntry) => saveNotebookEntry(entry);

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-8">
      {/* Hero */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div className="max-w-lg min-w-0 flex-1">
            <p className="text-xs font-semibold text-[var(--accent)] sm:text-sm">Result</p>
            <h1 className="heading mt-1.5 text-xl sm:mt-2 sm:text-2xl md:text-3xl">{attempt.testTitle}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {attempt.grading === "ungraded" ? (
                <>Ungraded. {attempt.attemptedCount}/{attempt.questionReviews.length} attempted.</>
              ) : attempt.grading === "partial" ? (
                <>Partially graded ({attempt.gradedQuestionCount}/{attempt.questionReviews.length}).
                  {attempt.accuracyPercent !== null && ` ${attempt.accuracyPercent}% accuracy.`}</>
              ) : (
                <>Readiness: {attempt.readinessBand}.
                  {attempt.accuracyPercent !== null && ` ${attempt.accuracyPercent}% accuracy.`}</>
              )}
            </p>
          </div>

          {attempt.score !== null ? (
            <div className="rounded-xl bg-[var(--foreground)] px-4 py-3 text-white sm:px-5 sm:py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60 sm:text-[11px]">Score</p>
              <p className="mt-0.5 text-2xl font-bold sm:mt-1 sm:text-3xl">
                {attempt.score}<span className="text-sm text-white/50 sm:text-base">/{scoreDenominator}</span>
              </p>
              {attempt.percentileEstimate !== null && (
                <p className="mt-1 text-xs text-white/60">{attempt.percentileEstimate} percentile</p>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-[var(--foreground)] px-4 py-3 text-white sm:px-5 sm:py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60 sm:text-[11px]">Status</p>
              <p className="mt-0.5 text-xl font-bold sm:mt-1 sm:text-2xl">Ungraded</p>
              <p className="mt-1 text-xs text-white/60">No answer key yet</p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {[
            { label: "Correct", value: attempt.correctCount ?? "—" },
            { label: "Incorrect", value: attempt.incorrectCount ?? "—" },
            { label: "Skipped", value: attempt.unattemptedCount },
            { label: "Duration", value: formatDuration(attempt.durationSeconds) },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-[var(--background-secondary)] px-3.5 py-2.5">
              <p className="text-[10px] font-semibold uppercase text-[var(--muted)]">{item.label}</p>
              <p className="mt-0.5 text-lg font-bold text-[var(--foreground)]">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          {retakeHref && !isGuest && (
            <Link
              href={retakeHref}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              Retake
            </Link>
          )}
          {!isGuest && (
            <Link
              href="/app/notebook"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
            >
              Notebook
            </Link>
          )}
          {!isGuest && (
            <Link
              href="/app"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
            >
              Dashboard
            </Link>
          )}
        </div>

        {isGuest && (
          <div className="mt-5">
            <GuestBanner />
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-3 sm:gap-4 xl:grid-cols-3">
        <RadarChart data={radarData} />
        <PacingChart data={paceData} />
        <div className="card p-4 sm:p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Subject breakdown</p>
          {subjectRank.length ? (
            <div className="mt-4 space-y-3">
              {subjectRank.map((m) => (
                <div key={m.subject} className="rounded-lg bg-[var(--background-secondary)] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{m.subject}</p>
                    <span
                      className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: `${subjectColorMap[m.subject]}15`, color: subjectColorMap[m.subject] }}
                    >
                      {m.accuracyPercent}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[var(--border)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${m.accuracyPercent}%`, backgroundColor: subjectColorMap[m.subject] }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {m.averageTimeSeconds}s avg · Score {m.score}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted)]">Unlocks after answer keys are imported.</p>
          )}
        </div>
      </div>

      {/* Question review */}
      <section>
        <p className="label">Review mode</p>
        <h2 className="heading mt-2 text-xl">Question-by-question review</h2>

        <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
          {attempt.questionReviews.map((review, index) => (
            <details key={review.questionId} open={index === 0} className="card overflow-hidden">
              <summary className="cursor-pointer p-3 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge rounded-md px-2 py-0.5 text-[11px]">Q{index + 1}</span>
                      <span
                        className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                        style={{ backgroundColor: `${subjectColorMap[review.subject]}15`, color: subjectColorMap[review.subject] }}
                      >
                        {review.subject}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          review.isCorrect === null
                            ? "bg-gray-100 text-gray-600"
                            : review.isCorrect
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {review.isCorrect === null
                          ? review.selectedOptionId ? "Attempted" : "Skipped"
                          : review.isCorrect ? "Correct" : review.selectedOptionId ? "Incorrect" : "Skipped"}
                      </span>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--foreground)]">
                      {review.prompt}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">{formatSeconds(review.timeSpentSeconds)}</p>
                    {review.markedForReview && (
                      <p className="mt-1 text-[10px] font-semibold text-violet-600">Marked</p>
                    )}
                  </div>
                </div>
              </summary>

              <div className="border-t border-[var(--border)] px-3 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
                {review.contextLines?.length ? (
                  <div className="mb-4 rounded-lg bg-[var(--background-secondary)] p-4">
                    {review.contextLines.map((line) => (
                      <p key={line} className="text-sm leading-6 text-[var(--muted)]">{line}</p>
                    ))}
                  </div>
                ) : null}

                <div className="space-y-2">
                  {review.options.map((option) => {
                    const hasKey = Boolean(review.correctOptionId);
                    const isCorrect = hasKey && option.id === review.correctOptionId;
                    const isSelected = option.id === review.selectedOptionId;
                    return (
                      <div
                        key={option.id}
                        className={`rounded-lg border p-3 ${
                          hasKey
                            ? isCorrect
                              ? "border-emerald-200 bg-emerald-50"
                              : isSelected
                                ? "border-rose-200 bg-rose-50"
                                : "border-[var(--border)]"
                            : isSelected
                              ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                              : "border-[var(--border)]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="rounded-md bg-[var(--background-secondary)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">
                            {option.id}
                          </span>
                          <p className="flex-1 text-sm leading-6">{option.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-[var(--background-secondary)] p-4">
                    <p className="label">Explanation</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                      {review.explanation || (review.correctOptionId ? "No explanation provided." : "Answer key not available.")}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--accent-soft)] p-4">
                    <p className="text-xs font-semibold text-[var(--accent)]">TAKEAWAY</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                      {review.takeaway || "Add your own takeaway after reviewing."}
                    </p>
                  </div>
                </div>

                {isGuest ? (
                  <Link
                    href="/login"
                    className="mt-4 inline-flex rounded-lg border border-[var(--accent)]/40 px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10"
                  >
                    Sign in to save to notebook
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      saveToNotebook({
                        id: createNotebookId(),
                        questionId: review.questionId,
                        testSlug: attempt.testSlug,
                        subject: review.subject,
                        title: `${review.subject} / Q${index + 1}`,
                        body: review.takeaway,
                        savedAt: new Date().toISOString(),
                      })
                    }
                    disabled={savedQuestionIds[review.questionId]}
                    className="mt-4 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 hover:bg-[var(--accent-hover)]"
                  >
                    {savedQuestionIds[review.questionId] ? "Saved" : "Save to notebook"}
                  </button>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
