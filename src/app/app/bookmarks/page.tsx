"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Bookmark, Search, X, Trash2 } from "lucide-react";
import {
  getBookmarks,
  getSyncedBookmarks,
  removeBookmark,
  subscribeToStorage,
} from "@/lib/storage";
import type { BookmarkEntry } from "@/lib/types";

const SUBJECT_FILTERS = [
  "All",
  "Polity",
  "History",
  "Economy",
  "Geography",
  "Environment",
  "Science",
  "Current Affairs",
  "CSAT",
] as const;

const emptyBookmarks: BookmarkEntry[] = [];

export default function BookmarksPage() {
  const bookmarks = useSyncExternalStore(subscribeToStorage, getBookmarks, () => emptyBookmarks);
  const [subjectFilter, setSubjectFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Sync with cloud on mount (merges local + cloud bookmarks)
  useEffect(() => {
    void getSyncedBookmarks().catch(() => undefined);
  }, []);

  const filtered = useMemo(() => {
    let result = bookmarks;

    if (subjectFilter !== "All") {
      result = result.filter((b) => b.subject === subjectFilter);
    }

    if (searchQuery.trim()) {
      const terms = searchQuery.toLowerCase().trim().split(/\s+/);
      result = result.filter((b) =>
        terms.every((t) => b.prompt.toLowerCase().includes(t)),
      );
    }

    return result;
  }, [bookmarks, subjectFilter, searchQuery]);

  const handleRemove = (questionId: string) => {
    setRemovingId(questionId);
    setTimeout(() => {
      removeBookmark(questionId);
      setRemovingId(null);
    }, 250);
  };

  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of bookmarks) {
      counts[b.subject] = (counts[b.subject] ?? 0) + 1;
    }
    return counts;
  }, [bookmarks]);

  return (
    <div className="px-4 py-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="heading text-2xl mb-1.5 sm:text-4xl sm:mb-2">
          Bookmarks
        </h1>
        <p className="text-sm text-[var(--muted)] sm:text-base">
          {bookmarks.length === 0
            ? "Save important questions during tests or while browsing PYQs."
            : `${bookmarks.length} saved question${bookmarks.length === 1 ? "" : "s"} for quick revision.`}
        </p>
      </div>

      {bookmarks.length === 0 ? (
        /* Empty state */
        <div className="card-elevated p-8 text-center border border-[var(--border)] sm:p-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
            <Bookmark className="h-8 w-8 text-amber-500" strokeWidth={1.5} />
          </div>
          <h2 className="heading text-xl mb-2 sm:text-2xl">
            No Bookmarks Yet
          </h2>
          <p className="text-[var(--muted)] text-sm max-w-md mx-auto mb-6">
            Tap the bookmark icon on any question during a test, in the PYQ
            database, or on a question page to save it here.
          </p>
          <Link
            href="/pyq"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            Browse PYQs
          </Link>
        </div>
      ) : (
        <>
          {/* Filter bar */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-white py-2.5 pl-10 pr-9 text-sm font-medium text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Subject pills */}
            <div className="flex flex-wrap gap-1.5">
              {SUBJECT_FILTERS.map((s) => {
                const count =
                  s === "All" ? bookmarks.length : (subjectCounts[s] ?? 0);
                if (s !== "All" && count === 0) return null;

                return (
                  <button
                    key={s}
                    onClick={() => setSubjectFilter(s)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                      subjectFilter === s
                        ? "bg-[var(--accent)] text-white"
                        : "border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    }`}
                  >
                    {s}
                    <span className="ml-1 opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results count */}
          <p className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
            {filtered.length} question{filtered.length === 1 ? "" : "s"}
          </p>

          {/* Bookmark list */}
          {filtered.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-sm text-[var(--muted)]">
                No bookmarks match your filters.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((b) => (
                <div
                  key={b.questionId}
                  className={`group rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] overflow-hidden transition-all duration-250 hover:border-[var(--accent)]/40 ${
                    removingId === b.questionId
                      ? "opacity-0 scale-95"
                      : "opacity-100 scale-100"
                  }`}
                >
                  <div className="flex items-start gap-3 px-3 py-3 sm:px-5 sm:py-4 sm:gap-4">
                    {/* Bookmark icon indicator */}
                    <div className="mt-1 flex-shrink-0">
                      <Bookmark
                        size={16}
                        fill="currentColor"
                        className="text-amber-500"
                      />
                    </div>

                    {/* Content */}
                    <Link
                      href={`/question/${b.questionId}`}
                      className="flex-1 min-w-0 hover:no-underline"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                          {b.year ?? "—"} &middot; {b.subject}
                        </span>
                      </div>
                      <p className="text-[13px] font-medium text-[var(--foreground)] leading-snug line-clamp-2 sm:text-[15px]">
                        {b.prompt.replace(/^\d+\.\s*/, "")}
                      </p>
                      <p className="mt-1.5 text-[10px] text-[var(--muted)]">
                        Saved{" "}
                        {new Date(b.savedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </Link>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(b.questionId)}
                      className="mt-1 flex-shrink-0 rounded-lg p-2 text-[var(--muted)]/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                      aria-label="Remove bookmark"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
