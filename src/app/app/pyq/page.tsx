import Link from "next/link";
import { fetchYearCounts, fetchSubjectCounts, fetchTotalCount } from "@/lib/supabase/questions";
import { PyqTabsView } from "@/components/pyq-tabs-view";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function PyqWorkspacePage() {
  const [yearCounts, subjectCounts, totalCount] = await Promise.all([
    fetchYearCounts(),
    fetchSubjectCounts(),
    fetchTotalCount(),
  ]);

  if (!totalCount) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--accent)]">PYQ library</p>
          <h1 className="heading mt-2 text-2xl">No questions yet</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Run the CSV importer to populate the question bank.
          </p>
          <Link
            href="/app"
            className="mt-4 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="card p-4 sm:p-6">
        <p className="text-xs font-semibold text-[var(--accent)] sm:text-sm">PYQ library</p>
        <h1 className="heading mt-1.5 text-xl sm:mt-2 sm:text-2xl md:text-3xl">
          {totalCount} Previous Year Questions
        </h1>
        <p className="mt-1.5 max-w-lg text-xs leading-5 text-[var(--muted)] sm:mt-2 sm:text-sm sm:leading-6">
          Choose a year, pick a subject, or build a custom session.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
          <Link
            href="/app/pyq/run?limit=25"
            className="rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-medium text-white hover:bg-[var(--accent-hover)] sm:px-4 sm:text-sm"
          >
            Mixed 25Q
          </Link>
          <Link
            href="/app/pyq/run?limit=50"
            className="rounded-lg border border-[var(--border)] px-3.5 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] sm:px-4 sm:text-sm"
          >
            Mixed 50Q
          </Link>
          <Link
            href="/app/pyq/run?limit=100"
            className="rounded-lg border border-[var(--border)] px-3.5 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] sm:px-4 sm:text-sm"
          >
            Full 100Q
          </Link>
        </div>
      </div>

      {/* Tabbed Content */}
      <PyqTabsView yearCounts={yearCounts} subjectCounts={subjectCounts} />
    </div>
  );
}
