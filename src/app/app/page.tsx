import Link from "next/link";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { tests } from "@/data/tests";

export default function AppPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-8">
      <DashboardOverview />

      <section>
        <p className="label">Mock library</p>
        <h2 className="heading mt-1.5 text-lg sm:mt-2 sm:text-xl">Available tests</h2>

        <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 md:grid-cols-2">
          {tests.map((test) => (
            <div key={test.slug} className="card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">{test.title}</p>
                <span className="badge text-[10px] shrink-0 sm:text-[11px]">{test.durationMinutes} min</span>
              </div>
              <p className="mt-1.5 text-base font-semibold text-[var(--foreground)] sm:mt-2 sm:text-lg">
                {test.tagline}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-[var(--muted)] sm:mt-2">
                {test.description}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:mt-3">
                <span className="badge-accent rounded-md px-2 py-0.5 text-[10px] font-semibold sm:text-[11px]">
                  {test.questions.length} questions
                </span>
                <span className="badge rounded-md px-2 py-0.5 text-[10px] sm:text-[11px]">
                  {test.difficultyLabel}
                </span>
              </div>
              <Link
                href={`/app/exams/${test.slug}`}
                className="mt-3 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] sm:mt-4"
              >
                Start test
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
