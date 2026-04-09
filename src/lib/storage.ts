import type { AttemptRecord, NotebookEntry } from "@/lib/types";

const ATTEMPTS_KEY = "upscprelimstest.attempts";
const NOTEBOOK_KEY = "upscprelimstest.notebook";
const STORAGE_EVENT = "upscprelimstest:storage-change";

export type SyncedAttempts = {
  attempts: AttemptRecord[];
  isAuthenticated: boolean;
};

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
  void syncAttemptToCloud(attempt).catch(() => undefined);
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

function persistAttempts(attempts: AttemptRecord[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts.slice(0, 30)));
}

function mergeAttempts(
  localAttempts: AttemptRecord[],
  cloudAttempts: AttemptRecord[],
) {
  const byId = new Map<string, AttemptRecord>();

  for (const attempt of cloudAttempts) {
    byId.set(attempt.id, attempt);
  }
  for (const attempt of localAttempts) {
    byId.set(attempt.id, attempt);
  }

  return Array.from(byId.values()).sort(
    (left, right) =>
      new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
  );
}

function isAttemptRecord(value: unknown): value is AttemptRecord {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as Partial<AttemptRecord>).id === "string" &&
    typeof (value as Partial<AttemptRecord>).testSlug === "string" &&
    typeof (value as Partial<AttemptRecord>).completedAt === "string" &&
    Array.isArray((value as Partial<AttemptRecord>).questionReviews)
  );
}

async function fetchCloudAttempts() {
  const response = await fetch("/api/attempts", { cache: "no-store" });
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Could not fetch cloud attempts");
  }

  const data: unknown = await response.json();
  if (
    !data ||
    typeof data !== "object" ||
    !("attempts" in data) ||
    !Array.isArray((data as { attempts: unknown }).attempts)
  ) {
    return [];
  }

  return (data as { attempts: unknown[] }).attempts.filter(isAttemptRecord);
}

async function syncAttemptToCloud(attempt: AttemptRecord) {
  if (!canUseStorage()) {
    return;
  }

  const response = await fetch("/api/attempts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ attempt }),
  });

  if (response.status === 401) {
    return;
  }

  if (!response.ok) {
    throw new Error("Could not sync attempt");
  }
}

export async function getSyncedAttempts(): Promise<SyncedAttempts> {
  const localAttempts = getAttempts();

  try {
    const cloudAttempts = await fetchCloudAttempts();
    if (cloudAttempts === null) {
      return { attempts: localAttempts, isAuthenticated: false };
    }

    await Promise.allSettled(
      localAttempts.slice(0, 30).map((attempt) => syncAttemptToCloud(attempt)),
    );

    const refreshedCloudAttempts = (await fetchCloudAttempts()) ?? cloudAttempts;
    const attempts = mergeAttempts(localAttempts, refreshedCloudAttempts);
    persistAttempts(attempts);
    return { attempts, isAuthenticated: true };
  } catch {
    return { attempts: localAttempts, isAuthenticated: false };
  }
}
