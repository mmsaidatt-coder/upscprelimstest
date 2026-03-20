import type { AttemptRecord, NotebookEntry } from "@/lib/types";

const ATTEMPTS_KEY = "upscprelimstest.attempts";
const NOTEBOOK_KEY = "upscprelimstest.notebook";
const STORAGE_EVENT = "upscprelimstest:storage-change";

function canUseStorage() {
  return typeof window !== "undefined";
}

function parseStoredValue<T>(key: string) {
  if (!canUseStorage()) {
    return [] as T[];
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return [] as T[];
  }

  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [] as T[];
  }
}

export function getAttempts() {
  const stored = parseStoredValue<AttemptRecord>(ATTEMPTS_KEY);
  return stored.map((attempt) => {
    if (!attempt || typeof attempt !== "object") {
      return attempt;
    }

    if ("grading" in attempt) {
      return attempt;
    }

    const legacy = attempt as unknown as Omit<AttemptRecord, "grading"> & {
      score?: number;
      totalMarks?: number;
      questionReviews?: AttemptRecord["questionReviews"];
    };

    return {
      ...legacy,
      grading: "graded",
      gradedQuestionCount: legacy.questionReviews?.length ?? 0,
      gradedTotalMarks: legacy.totalMarks ?? 0,
      score: typeof legacy.score === "number" ? legacy.score : null,
      correctCount: legacy.correctCount ?? null,
      incorrectCount: legacy.incorrectCount ?? null,
      accuracyPercent: legacy.accuracyPercent ?? null,
      percentileEstimate: legacy.percentileEstimate ?? null,
      readinessBand: legacy.readinessBand ?? null,
      subjectMetrics: legacy.subjectMetrics ?? [],
      questionReviews: (legacy.questionReviews ?? []).map((review) => ({
        ...review,
        isCorrect: "isCorrect" in review ? (review.isCorrect as boolean) : null,
      })),
    } satisfies AttemptRecord;
  });
}

function emitStorageChange() {
  if (!canUseStorage()) {
    return;
  }

  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function subscribeToStorage(onStoreChange: () => void) {
  if (!canUseStorage()) {
    return () => {};
  }

  const handler = () => onStoreChange();
  window.addEventListener(STORAGE_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(STORAGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function saveAttempt(attempt: AttemptRecord) {
  if (!canUseStorage()) {
    return;
  }

  const attempts = getAttempts().filter((item) => item.id !== attempt.id);
  const next = [attempt, ...attempts].slice(0, 30);
  window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(next));
  emitStorageChange();
}

export function getAttemptById(id: string) {
  return getAttempts().find((attempt) => attempt.id === id) ?? null;
}

export function getNotebookEntries() {
  return parseStoredValue<NotebookEntry>(NOTEBOOK_KEY);
}

export function saveNotebookEntry(entry: NotebookEntry) {
  if (!canUseStorage()) {
    return;
  }

  const entries = getNotebookEntries();
  const deduped = entries.filter(
    (item) => !(item.questionId === entry.questionId && item.testSlug === entry.testSlug),
  );
  const next = [entry, ...deduped].slice(0, 300);
  window.localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(next));
  emitStorageChange();
}
