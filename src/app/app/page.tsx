import Link from "next/link";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { tests } from "@/data/tests";

export default function AppPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <DashboardOverview />

      <section>
        <p className="label">Mock library</p>
        <h2 className="heading mt-2 text-xl">Available tests</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {tests.map((test) => (
            <div key={test.slug} className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--foreground)]">{test.title}</p>
                <span className="badge text-[11px]">{test.durationMinutes} min</span>
              </div>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {test.tagline}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {test.description}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="badge-accent rounded-md px-2 py-0.5 text-[11px] font-semibold">
                  {test.questions.length} questions
                </span>
                <span className="badge rounded-md px-2 py-0.5 text-[11px]">
                  {test.difficultyLabel}
                </span>
              </div>
              <Link
                href={`/app/exams/${test.slug}`}
                className="mt-4 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
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
