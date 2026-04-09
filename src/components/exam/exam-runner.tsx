"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buildAttemptRecord, formatSeconds } from "@/lib/exam";
import { saveAttempt } from "@/lib/storage";
import type { ExamTest, QuestionOption } from "@/lib/types";

function createAttemptId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

function paletteClass({
  answered,
  marked,
  visited,
  current,
}: {
  answered: boolean;
  marked: boolean;
  visited: boolean;
  current: boolean;
}) {
  if (current) return "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]";
  if (answered && marked) return "bg-amber-500/20 text-amber-500 border-amber-500/30";
  if (answered) return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
  if (marked) return "bg-violet-500/20 text-violet-500 border-violet-500/30";
  if (visited) return "bg-rose-500/20 text-rose-500 border-rose-500/30";
  return "bg-[var(--background-secondary)] text-[var(--muted)] border-[var(--border)]";
}

export function ExamRunner({ test }: { test: ExamTest }) {
  const router = useRouter();
  const totalQuestions = test.questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionOption["id"] | undefined>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [eliminatedChoices, setEliminatedChoices] = useState<Record<string, string[]>>({});
  const [highlightedLines, setHighlightedLines] = useState<Record<string, number[]>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({
    [test.questions[0]!.id]: true,
  });
  const [remainingSeconds, setRemainingSeconds] = useState(test.durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = test.questions[currentIndex]!;
  const currentQuestionIdRef = useRef(currentQuestion.id);
  const startedAtRef = useRef<string | null>(null);
  const deadlineRef = useRef(0);
  const activeStartedAtRef = useRef(0);
  const timeSpentRef = useRef<Record<string, number>>({});
  const submittedRef = useRef(false);
  const latestStateRef = useRef({
    answers,
    markedForReview,
    eliminatedChoices,
    attemptedCount: 0,
  });
  const finalizeAttemptRef = useRef<(autoSubmitted: boolean) => void>(() => {});

  useEffect(() => {
    currentQuestionIdRef.current = currentQuestion.id;
  }, [currentQuestion.id]);

  const ensureTimingInitialized = () => {
    if (startedAtRef.current && deadlineRef.current && activeStartedAtRef.current) return;
    const now = Date.now();
    startedAtRef.current = new Date(now).toISOString();
    deadlineRef.current = now + test.durationMinutes * 60 * 1000;
    activeStartedAtRef.current = now;
  };

  const attemptedCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers],
  );

  useEffect(() => {
    latestStateRef.current = { answers, markedForReview, eliminatedChoices, attemptedCount };
  }, [answers, markedForReview, eliminatedChoices, attemptedCount]);

  const recordElapsed = (questionId: string) => {
    ensureTimingInitialized();
    const elapsed = Math.max(0, Math.round((Date.now() - activeStartedAtRef.current) / 1000));
    timeSpentRef.current[questionId] = (timeSpentRef.current[questionId] ?? 0) + elapsed;
    activeStartedAtRef.current = Date.now();
  };

  const finalizeAttempt = (autoSubmitted: boolean) => {
    if (submittedRef.current) return;
    const snapshot = latestStateRef.current;

    if (!autoSubmitted) {
      const unanswered = totalQuestions - snapshot.attemptedCount;
      const confirmation = window.confirm(
        unanswered
          ? `You still have ${unanswered} unattempted question(s). Submit anyway?`
          : "Submit this attempt now?",
      );
      if (!confirmation) return;
    }

    submittedRef.current = true;
    setSubmitting(true);
    recordElapsed(currentQuestionIdRef.current);

    const attempt = buildAttemptRecord({
      id: createAttemptId(),
      test,
      startedAt: startedAtRef.current ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      answers: snapshot.answers,
      timeSpent: timeSpentRef.current,
      markedForReview: snapshot.markedForReview,
      eliminatedChoices: snapshot.eliminatedChoices,
    });

    saveAttempt(attempt);
    startTransition(() => {
      router.push(`/app/attempts/${attempt.id}`);
    });
  };

  useEffect(() => {
    finalizeAttemptRef.current = finalizeAttempt;
  });

  useEffect(() => {
    if (!startedAtRef.current || !deadlineRef.current || !activeStartedAtRef.current) {
      const now = Date.now();
      startedAtRef.current = new Date(now).toISOString();
      deadlineRef.current = now + test.durationMinutes * 60 * 1000;
      activeStartedAtRef.current = now;
    }

    const timer = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next === 0) {
        window.clearInterval(timer);
        finalizeAttemptRef.current(true);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [test.durationMinutes]);

  useEffect(() => {
    const activeStartedAtStore = activeStartedAtRef;
    const activeQuestionStore = currentQuestionIdRef;
    const timeSpentStore = timeSpentRef;

    return () => {
      if (!submittedRef.current) {
        const elapsed = Math.max(0, Math.round((Date.now() - activeStartedAtStore.current) / 1000));
        const activeQuestionId = activeQuestionStore.current;
        timeSpentStore.current[activeQuestionId] =
          (timeSpentStore.current[activeQuestionId] ?? 0) + elapsed;
      }
    };
  }, []);

  const goToQuestion = (nextIndex: number) => {
    if (nextIndex === currentIndex) return;
    recordElapsed(currentQuestion.id);
    const nextQuestion = test.questions[nextIndex]!;
    currentQuestionIdRef.current = nextQuestion.id;
    activeStartedAtRef.current = Date.now();
    setCurrentIndex(nextIndex);
    setVisited((prev) => ({ ...prev, [nextQuestion.id]: true }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectAnswer = (optionId: QuestionOption["id"]) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  };

  const clearResponse = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });
  };

  const toggleReviewMark = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const toggleElimination = (optionId: QuestionOption["id"]) => {
    setEliminatedChoices((prev) => {
      const current = new Set(prev[currentQuestion.id] ?? []);
      if (current.has(optionId)) current.delete(optionId);
      else current.add(optionId);
      return { ...prev, [currentQuestion.id]: Array.from(current) };
    });
  };

  const toggleHighlight = (lineIndex: number) => {
    setHighlightedLines((prev) => {
      const current = new Set(prev[currentQuestion.id] ?? []);
      if (current.has(lineIndex)) current.delete(lineIndex);
      else current.add(lineIndex);
      return { ...prev, [currentQuestion.id]: Array.from(current) };
    });
  };

  const currentLines = [
    currentQuestion.prompt,
    ...(currentQuestion.contextLines ?? []),
  ];

  const [showMobilePalette, setShowMobilePalette] = useState(false);

  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const isMarked = Boolean(markedForReview[currentQuestion.id]);
  const hasAnswer = Boolean(answers[currentQuestion.id]);

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6">
      {/* ── Mobile sticky header ─────────────────────────────────── */}
      <div className="sticky top-14 z-30 -mx-3 mb-3 bg-[var(--background)]/95 backdrop-blur-md sm:hidden">
        {/* Progress bar */}
        <div className="h-1 w-full bg-[var(--border)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Info row */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--foreground)]">
              Q{currentIndex + 1}
              <span className="font-normal text-[var(--muted)]">/{totalQuestions}</span>
            </span>
            <span className="rounded bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent)]">
              {currentQuestion.subject}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-emerald-600">{attemptedCount}</span>
              <span className="text-[10px] text-[var(--muted)]">/</span>
              <span className="text-[10px] text-[var(--muted)]">{totalQuestions}</span>
            </div>
            <div className="rounded-md bg-[var(--background-secondary)] border border-[var(--border)] px-2 py-1">
              <span className="font-mono text-xs font-bold text-[var(--foreground)]">
                {formatSeconds(remainingSeconds)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop header ───────────────────────────────────────── */}
      <div className="mb-5 hidden items-center justify-between gap-3 sm:flex">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[var(--muted)] truncate">{test.title}</p>
          <h1 className="heading mt-1 text-xl truncate">{test.tagline}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Time left
            </p>
            <p className="font-mono text-lg font-bold text-[var(--foreground)]">
              {formatSeconds(remainingSeconds)}
            </p>
          </div>
          <Link
            href="/app"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--background-secondary)]"
          >
            Leave
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] sm:gap-5">
        {/* Question area */}
        <div className="space-y-5">
          <div className="card p-3.5 sm:p-5">
            {/* Desktop: question meta + mark button */}
            <div className="hidden sm:flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  Q{currentIndex + 1}/{totalQuestions}
                </span>
                <span className="badge-accent rounded-md px-2 py-0.5 text-[11px] font-semibold">
                  {currentQuestion.subject}
                </span>
                <span className="badge rounded-md px-2 py-0.5 text-[11px]">
                  {currentQuestion.difficulty}
                </span>
              </div>

              <button
                type="button"
                onClick={toggleReviewMark}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  isMarked
                    ? "bg-violet-100 text-violet-700"
                    : "border border-[var(--border)] text-[var(--muted)]"
                }`}
              >
                {isMarked ? "Marked" : "Mark for review"}
              </button>
            </div>

            {/* Question lines */}
            <div className="mt-1 space-y-2 sm:mt-5 sm:space-y-2.5">
              {currentLines.map((line, index) => {
                const isHighlighted = (highlightedLines[currentQuestion.id] ?? []).includes(index);
                return (
                  <button
                    key={`${currentQuestion.id}-${index}`}
                    type="button"
                    onClick={() => toggleHighlight(index)}
                    className={`block w-full rounded-lg border px-3 py-2.5 text-left text-[13px] leading-6 sm:px-4 sm:py-3 sm:text-sm sm:leading-7 ${
                      isHighlighted
                        ? "border-amber-500/50 bg-amber-500/10 text-[var(--foreground)]"
                        : "border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] hover:bg-[var(--background)]"
                    }`}
                  >
                    {line}
                  </button>
                );
              })}
            </div>

            {/* Options — mobile-optimized with larger touch targets */}
            <div className="mt-3.5 space-y-2 sm:mt-5">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option.id;
                const isEliminated = (eliminatedChoices[currentQuestion.id] ?? []).includes(option.id);

                return (
                  <div
                    key={option.id}
                    className={`rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)]/8 shadow-sm"
                        : "border-[var(--border)] bg-[var(--background-secondary)]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => selectAnswer(option.id)}
                        className="flex flex-1 items-start gap-2.5 p-3 text-left sm:gap-3 sm:p-3.5"
                      >
                        {/* Radio circle on mobile, letter badge on desktop */}
                        <span className="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center sm:h-7 sm:w-7">
                          {/* Radio outline */}
                          <span className={`absolute inset-0 rounded-full border-2 transition-colors ${
                            isSelected ? "border-[var(--accent)]" : "border-[var(--border)]"
                          }`} />
                          {/* Fill dot */}
                          <span className={`h-3 w-3 rounded-full transition-all duration-150 ${
                            isSelected ? "scale-100 bg-[var(--accent)]" : "scale-0 bg-transparent"
                          }`} />
                          {/* Letter overlay */}
                          <span className={`absolute inset-0 hidden sm:flex items-center justify-center rounded-md text-xs font-bold ${
                            isSelected ? "bg-[var(--accent)] text-white" : "bg-[var(--background)] text-[var(--muted)]"
                          }`}>
                            {option.id}
                          </span>
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="sm:hidden text-[10px] font-bold text-[var(--muted)] uppercase">({option.id})&ensp;</span>
                          <span
                            className={`text-[13px] leading-6 sm:text-sm ${
                              isEliminated ? "text-[var(--muted)] line-through" : "text-[var(--foreground)]"
                            }`}
                          >
                            {option.text}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleElimination(option.id)}
                        className={`shrink-0 self-center mr-2 rounded-md px-2 py-1.5 text-[10px] font-bold sm:mr-3 sm:px-2 sm:py-1 ${
                          isEliminated
                            ? "bg-amber-500/20 text-amber-600"
                            : "text-[var(--muted)]/60 hover:bg-[var(--background)] hover:text-[var(--muted)]"
                        }`}
                      >
                        {isEliminated ? "Undo" : "Strike"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons — desktop only */}
            <div className="mt-5 hidden flex-wrap gap-2 sm:flex">
              <button
                type="button"
                onClick={clearResponse}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--background-secondary)]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => goToQuestion(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] disabled:opacity-30 hover:bg-[var(--background-secondary)]"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => goToQuestion(Math.min(totalQuestions - 1, currentIndex + 1))}
                disabled={currentIndex === totalQuestions - 1}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] disabled:opacity-30 hover:bg-[var(--background-secondary)]"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => finalizeAttempt(false)}
                disabled={submitting}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[var(--accent-hover)]"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar — desktop only */}
        <aside className="hidden xl:block space-y-4 xl:sticky xl:top-20 xl:self-start">
          <div className="card p-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">Progress</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Done", value: attemptedCount },
                { label: "Marked", value: Object.values(markedForReview).filter(Boolean).length },
                { label: "Left", value: totalQuestions - attemptedCount },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-[var(--background-secondary)] p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-[var(--muted)]">{item.label}</p>
                  <p className="mt-0.5 text-lg font-bold text-[var(--foreground)]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--foreground)]">Palette</p>
              <span className="text-xs text-[var(--muted)]">{totalQuestions}Q</span>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {test.questions.map((question, index) => (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => goToQuestion(index)}
                  className={`rounded-md border py-2 text-xs font-semibold ${paletteClass({
                    answered: Boolean(answers[question.id]),
                    marked: Boolean(markedForReview[question.id]),
                    visited: Boolean(visited[question.id]),
                    current: currentQuestion.id === question.id,
                  })}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px] text-[var(--muted)]">
              {[
                ["Answered", "bg-emerald-500/20"],
                ["Visited", "bg-rose-500/20"],
                ["Marked", "bg-violet-500/20"],
                ["Both", "bg-amber-500/20"],
              ].map(([label, swatch]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-sm ${swatch}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Mobile bottom action bar ─────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--background-secondary)]/95 backdrop-blur-md sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Row 1: Secondary actions */}
        <div className="flex items-center justify-between border-b border-[var(--border)]/50 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleReviewMark}
              className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold transition-colors ${
                isMarked
                  ? "bg-violet-100 text-violet-700"
                  : "text-[var(--muted)]"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isMarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
              {isMarked ? "Marked" : "Mark"}
            </button>
            <button
              type="button"
              onClick={clearResponse}
              disabled={!hasAnswer}
              className="flex h-8 items-center gap-1 rounded-full px-3 text-[11px] font-bold text-[var(--muted)] disabled:opacity-30"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M8 6V4h8v2" /></svg>
              Clear
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowMobilePalette(true)}
            className="flex h-8 items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-2.5 text-[11px] font-bold text-[var(--foreground)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            {attemptedCount}/{totalQuestions}
          </button>
        </div>

        {/* Row 2: Primary navigation */}
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => goToQuestion(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white text-sm font-semibold text-[var(--foreground)] disabled:opacity-25 active:scale-[0.97] transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            Prev
          </button>

          {currentIndex < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => goToQuestion(currentIndex + 1)}
              className="flex h-12 flex-[2] items-center justify-center gap-1.5 rounded-xl bg-[var(--foreground)] text-sm font-bold text-white active:scale-[0.97] transition-transform"
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => finalizeAttempt(false)}
              disabled={submitting}
              className="flex h-12 flex-[2] items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] text-sm font-bold text-white disabled:opacity-50 active:scale-[0.97] transition-transform"
            >
              {submitting ? "Submitting..." : "Submit Test"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile palette sheet ─────────────────────────────── */}
      {showMobilePalette && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowMobilePalette(false)}
          />
          <div className="relative rounded-t-2xl bg-[var(--background-secondary)] shadow-2xl animate-in slide-in-from-bottom duration-200" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
            </div>

            {/* Summary stats */}
            <div className="flex items-center gap-3 px-5 pb-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-[var(--foreground)]">Question Palette</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500/30" />
                  {attemptedCount}
                </span>
                <span className="flex items-center gap-1 text-violet-600">
                  <span className="h-2 w-2 rounded-full bg-violet-500/30" />
                  {markedCount}
                </span>
                <span className="flex items-center gap-1 text-[var(--muted)]">
                  <span className="h-2 w-2 rounded-full bg-rose-500/30" />
                  {totalQuestions - attemptedCount}
                </span>
              </div>
              <button
                onClick={() => setShowMobilePalette(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--background)] text-[var(--muted)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="border-t border-[var(--border)]" />

            <div className="max-h-[45vh] overflow-y-auto p-4 scroll-touch">
              <div className="grid grid-cols-6 gap-2">
                {test.questions.map((question, index) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => { goToQuestion(index); setShowMobilePalette(false); }}
                    className={`rounded-lg border py-3 text-sm font-semibold active:scale-95 transition-transform ${paletteClass({
                      answered: Boolean(answers[question.id]),
                      marked: Boolean(markedForReview[question.id]),
                      visited: Boolean(visited[question.id]),
                      current: currentQuestion.id === question.id,
                    })}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-[var(--muted)]">
                {[
                  ["Answered", "bg-emerald-500/20 border-emerald-500/30"],
                  ["Not visited", "bg-[var(--background-secondary)] border-[var(--border)]"],
                  ["Visited", "bg-rose-500/20 border-rose-500/30"],
                  ["Marked", "bg-violet-500/20 border-violet-500/30"],
                ].map(([label, swatch]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`h-3.5 w-3.5 rounded border ${swatch}`} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit from palette */}
            <div className="border-t border-[var(--border)] p-3">
              <button
                type="button"
                onClick={() => { setShowMobilePalette(false); finalizeAttempt(false); }}
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-[var(--accent)] text-sm font-bold text-white disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                {submitting ? "Submitting..." : `Submit Test (${attemptedCount}/${totalQuestions} answered)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer for mobile action bar */}
      <div className="h-16 sm:hidden" />
    </div>
  );
}
