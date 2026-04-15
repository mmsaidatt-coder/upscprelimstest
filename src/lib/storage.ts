import type { AttemptRecord, BookmarkEntry, NotebookEntry } from "@/lib/types";

const ATTEMPTS_KEY = "upscprelimstest.attempts";
const NOTEBOOK_KEY = "upscprelimstest.notebook";
const BOOKMARKS_KEY = "upscprelimstest.bookmarks";
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

// ── Bookmarks ───────────────────────────────────────────────

let _bookmarksCache: BookmarkEntry[] | null = null;
let _bookmarksRaw: string | null | undefined = undefined;

export function getBookmarks(): BookmarkEntry[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(BOOKMARKS_KEY);
  if (raw === _bookmarksRaw && _bookmarksCache) return _bookmarksCache;
  _bookmarksRaw = raw;
  _bookmarksCache = parseStoredValue<BookmarkEntry>(BOOKMARKS_KEY);
  return _bookmarksCache;
}

export function isBookmarked(questionId: string): boolean {
  return getBookmarks().some((b) => b.questionId === questionId);
}

function invalidateBookmarksCache() {
  _bookmarksCache = null;
  _bookmarksRaw = undefined;
}

export function toggleBookmark(entry: BookmarkEntry): boolean {
  if (!canUseStorage()) return false;

  const existing = getBookmarks();
  const alreadyBookmarked = existing.some((b) => b.questionId === entry.questionId);

  if (alreadyBookmarked) {
    const next = existing.filter((b) => b.questionId !== entry.questionId);
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    invalidateBookmarksCache();
    emitStorageChange();
    void deleteBookmarkFromCloud(entry.questionId).catch(() => undefined);
    return false; // removed
  }

  const next = [entry, ...existing].slice(0, 500);
  window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
  invalidateBookmarksCache();
  emitStorageChange();
  void syncBookmarksToCloud([entry]).catch(() => undefined);
  return true; // added
}

export function removeBookmark(questionId: string): void {
  if (!canUseStorage()) return;

  const next = getBookmarks().filter((b) => b.questionId !== questionId);
  window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
  invalidateBookmarksCache();
  emitStorageChange();
  void deleteBookmarkFromCloud(questionId).catch(() => undefined);
}

function persistBookmarks(bookmarks: BookmarkEntry[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks.slice(0, 500)));
  invalidateBookmarksCache();
}

async function fetchCloudBookmarks(): Promise<BookmarkEntry[] | null> {
  const response = await fetch("/api/bookmarks", { cache: "no-store" });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Could not fetch cloud bookmarks");

  const data: unknown = await response.json();
  if (
    !data ||
    typeof data !== "object" ||
    !("bookmarks" in data) ||
    !Array.isArray((data as { bookmarks: unknown }).bookmarks)
  ) {
    return [];
  }

  return (data as { bookmarks: BookmarkEntry[] }).bookmarks;
}

async function syncBookmarksToCloud(bookmarks: BookmarkEntry[]) {
  if (!canUseStorage() || !bookmarks.length) return;

  const response = await fetch("/api/bookmarks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookmarks }),
  });

  if (response.status === 401) return;
  if (!response.ok) throw new Error("Could not sync bookmarks");
}

async function deleteBookmarkFromCloud(questionId: string) {
  if (!canUseStorage()) return;

  const response = await fetch("/api/bookmarks", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId }),
  });

  if (response.status === 401) return;
  if (!response.ok) throw new Error("Could not delete cloud bookmark");
}

function mergeBookmarks(local: BookmarkEntry[], cloud: BookmarkEntry[]): BookmarkEntry[] {
  const byId = new Map<string, BookmarkEntry>();

  for (const b of cloud) byId.set(b.questionId, b);
  for (const b of local) byId.set(b.questionId, b);

  return Array.from(byId.values())
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    .slice(0, 500);
}

export async function getSyncedBookmarks(): Promise<{ bookmarks: BookmarkEntry[]; isAuthenticated: boolean }> {
  const localBookmarks = getBookmarks();

  try {
    const cloudBookmarks = await fetchCloudBookmarks();
    if (cloudBookmarks === null) {
      return { bookmarks: localBookmarks, isAuthenticated: false };
    }

    // Push local bookmarks to cloud
    if (localBookmarks.length) {
      await syncBookmarksToCloud(localBookmarks).catch(() => undefined);
    }

    // Re-fetch to get the merged set from the server
    const refreshed = (await fetchCloudBookmarks()) ?? cloudBookmarks;
    const merged = mergeBookmarks(localBookmarks, refreshed);
    persistBookmarks(merged);
    emitStorageChange();
    return { bookmarks: merged, isAuthenticated: true };
  } catch {
    return { bookmarks: localBookmarks, isAuthenticated: false };
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
