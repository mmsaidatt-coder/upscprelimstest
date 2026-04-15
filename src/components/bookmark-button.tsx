"use client";

import { useCallback, useSyncExternalStore, useState } from "react";
import { Bookmark } from "lucide-react";
import {
  isBookmarked as checkBookmarked,
  toggleBookmark,
  subscribeToStorage,
} from "@/lib/storage";
import type { BookmarkEntry } from "@/lib/types";

type BookmarkButtonProps = {
  questionId: string;
  subject: string;
  prompt: string;
  year?: number | null;
  /** "icon" = just the icon (exam runner, database row). "pill" = icon + label (desktop). */
  variant?: "icon" | "pill";
  /** Override size: sm (database rows), md (default), lg (question page) */
  size?: "sm" | "md" | "lg";
  className?: string;
};

function useIsBookmarked(questionId: string): boolean {
  return useSyncExternalStore(
    subscribeToStorage,
    () => checkBookmarked(questionId),
    () => false,
  );
}

export function BookmarkButton({
  questionId,
  subject,
  prompt,
  year,
  variant = "icon",
  size = "md",
  className = "",
}: BookmarkButtonProps) {
  const bookmarked = useIsBookmarked(questionId);
  const [animating, setAnimating] = useState(false);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const entry: BookmarkEntry = {
        questionId,
        subject: subject as BookmarkEntry["subject"],
        prompt,
        year: year ?? null,
        savedAt: new Date().toISOString(),
      };

      const added = toggleBookmark(entry);

      if (added) {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 400);
      }
    },
    [questionId, subject, prompt, year],
  );

  const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark question"}
        aria-pressed={bookmarked}
        className={`group/bm inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
          bookmarked
            ? "bg-amber-100 text-amber-700"
            : "border border-[var(--border)] text-[var(--muted)] hover:border-amber-300 hover:text-amber-600"
        } ${className}`}
      >
        <Bookmark
          size={iconSize}
          fill={bookmarked ? "currentColor" : "none"}
          className={`transition-transform duration-200 ${animating ? "scale-125" : "scale-100"} ${
            !bookmarked ? "group-hover/bm:scale-110" : ""
          }`}
        />
        {bookmarked ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark question"}
      aria-pressed={bookmarked}
      className={`group/bm inline-flex items-center justify-center rounded-md transition-all duration-200 ${
        size === "sm"
          ? "h-7 w-7"
          : size === "lg"
            ? "h-10 w-10"
            : "h-8 w-8"
      } ${
        bookmarked
          ? "text-amber-500"
          : "text-[var(--muted)]/50 hover:text-amber-500"
      } ${className}`}
    >
      <Bookmark
        size={iconSize}
        fill={bookmarked ? "currentColor" : "none"}
        strokeWidth={bookmarked ? 2.2 : 1.8}
        className={`transition-all duration-200 ${animating ? "scale-[1.3]" : "scale-100"} ${
          !bookmarked ? "group-hover/bm:scale-110" : ""
        }`}
      />
    </button>
  );
}
