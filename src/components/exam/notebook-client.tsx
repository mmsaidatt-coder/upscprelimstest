"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getNotebookEntries, subscribeToStorage } from "@/lib/storage";
import type { NotebookEntry } from "@/lib/types";

export function NotebookClient() {
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState("All");
  const [entries, setEntries] = useState<NotebookEntry[]>([]);

  useEffect(() => {
    const hydrate = () => {
      setHydrated(true);
      setEntries(getNotebookEntries());
    };
    hydrate();
    return subscribeToStorage(hydrate);
  }, []);

  const filters = useMemo(
    () => ["All", ...Array.from(new Set(entries.map((e) => e.subject)))],
    [entries],
  );

  const visibleEntries = entries.filter((e) => filter === "All" || e.subject === filter);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="card p-6 text-sm text-[var(--muted)]">Loading...</div>
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--accent)]">Notebook</p>
          <h1 className="heading mt-2 text-2xl">Nothing saved yet</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Review a test and save high-signal takeaways. This becomes your compressed revision layer.
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

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">Notebook</p>
          <h1 className="heading mt-2 text-2xl">Your revision layer</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Distilled takeaways from weak questions.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                filter === f
                  ? "bg-[var(--foreground)] text-white"
                  : "border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--background-secondary)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleEntries.map((entry) => (
          <div key={entry.id} className="card p-4">
            <div className="flex items-center justify-between">
              <span className="badge-accent rounded-md px-2 py-0.5 text-[11px] font-semibold">
                {entry.subject}
              </span>
              <span className="text-[11px] text-[var(--muted)]">
                {new Date(entry.savedAt).toLocaleDateString()}
              </span>
            </div>
            <h2 className="mt-3 text-sm font-semibold text-[var(--foreground)]">
              {entry.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{entry.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
