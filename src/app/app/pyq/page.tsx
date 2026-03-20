import Link from "next/link";
import { fetchYearCounts, fetchSubjectCounts, fetchTotalCount } from "@/lib/supabase/questions";

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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="card p-6">
        <p className="text-sm font-semibold text-[var(--accent)]">PYQ library</p>
        <h1 className="heading mt-2 text-2xl md:text-3xl">
          {totalCount} Previous Year Questions
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">
          Choose a year, pick a subject, or build a custom session.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/app/pyq/run?limit=25"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            Mixed 25Q
          </Link>
          <Link
            href="/app/pyq/run?limit=50"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
          >
            Mixed 50Q
          </Link>
          <Link
            href="/app/pyq/run?limit=100"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
          >
            Full 100Q
          </Link>
        </div>
      </div>

      {/* Year + Subject */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Year wise</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Full-year papers as timed sessions.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {yearCounts.map((row) => (
              <Link
                key={row.year}
                href={`/app/pyq/run?year=${row.year}&limit=100`}
                className="rounded-lg border border-[var(--border)] p-3.5 hover:bg-[var(--background-secondary)]"
              >
                <p className="text-xs text-[var(--muted)]">{row.count} questions</p>
                <p className="mt-1 text-xl font-bold text-[var(--foreground)]">{row.year}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Subject wise</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Isolate a subject for targeted drilling.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {subjectCounts.map((row) => (
              <Link
                key={row.subject}
                href={`/app/pyq/run?subject=${encodeURIComponent(row.subject)}&limit=25`}
                className="rounded-lg border border-[var(--border)] p-3.5 hover:bg-[var(--background-secondary)]"
              >
                <p className="text-xs text-[var(--muted)]">{row.count} questions</p>
                <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{row.subject}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Custom session */}
      <div className="card p-5">
        <p className="text-sm font-semibold text-[var(--foreground)]">Custom session</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Combine year + subject filters with your question count.
        </p>

        <form
          action="/app/pyq/run"
          method="get"
          className="mt-4 grid gap-3 sm:grid-cols-4"
        >
          <label className="space-y-1.5">
            <span className="label">Year</span>
            <select
              name="year"
              defaultValue=""
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            >
              <option value="">All years</option>
              {yearCounts.map((row) => (
                <option key={row.year} value={row.year}>{row.year}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="label">Subject</span>
            <select
              name="subject"
              defaultValue=""
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            >
              <option value="">All subjects</option>
              {subjectCounts.map((row) => (
                <option key={row.subject} value={row.subject}>
                  {row.subject} ({row.count})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="label">Questions</span>
            <select
              name="limit"
              defaultValue="25"
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            >
              {[10, 25, 50, 100].map((v) => (
                <option key={v} value={String(v)}>{v}</option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="mt-5 h-fit rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] sm:mt-6"
          >
            Start session
          </button>
        </form>
      </div>
    </div>
  );
}
