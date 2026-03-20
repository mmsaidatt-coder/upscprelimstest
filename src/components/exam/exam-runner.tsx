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
    [test.questions[0].id]: true,
  });
  const [remainingSeconds, setRemainingSeconds] = useState(test.durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = test.questions[currentIndex];
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
    const nextQuestion = test.questions[nextIndex];
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Header bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[var(--muted)]">{test.title}</p>
          <h1 className="heading mt-1 text-xl">{test.tagline}</h1>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Question area */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
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
                  markedForReview[currentQuestion.id]
                    ? "bg-violet-100 text-violet-700"
                    : "border border-[var(--border)] text-[var(--muted)]"
                }`}
              >
                {markedForReview[currentQuestion.id] ? "Marked" : "Mark for review"}
              </button>
            </div>

            {/* Question lines */}
            <div className="mt-5 space-y-2.5">
              {currentLines.map((line, index) => {
                const isHighlighted = (highlightedLines[currentQuestion.id] ?? []).includes(index);
                return (
                  <button
                    key={`${currentQuestion.id}-${index}`}
                    type="button"
                    onClick={() => toggleHighlight(index)}
                    className={`block w-full rounded-lg border px-4 py-3 text-left text-sm leading-7 ${
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

            {/* Options */}
            <div className="mt-5 space-y-2">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option.id;
                const isEliminated = (eliminatedChoices[currentQuestion.id] ?? []).includes(option.id);

                return (
                  <div
                    key={option.id}
                    className={`rounded-lg border p-3.5 ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)]/10"
                        : "border-[var(--border)] bg-[var(--background-secondary)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => selectAnswer(option.id)}
                        className="flex flex-1 items-start gap-3 text-left"
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                            isSelected
                              ? "bg-[var(--accent)] text-black"
                              : "bg-[var(--background)] text-[var(--muted)]"
                          }`}
                        >
                          {option.id}
                        </span>
                        <span
                          className={`text-sm leading-6 ${
                            isEliminated ? "text-[var(--muted)] line-through" : "text-[var(--foreground)]"
                          }`}
                        >
                          {option.text}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleElimination(option.id)}
                        className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold ${
                          isEliminated
                            ? "bg-amber-500/20 text-amber-500"
                            : "text-[var(--muted)] hover:bg-[var(--background)]"
                        }`}
                      >
                        {isEliminated ? "Undo" : "Strike"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex flex-wrap gap-2">
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

        {/* Sidebar */}
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
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
    </div>
  );
}
