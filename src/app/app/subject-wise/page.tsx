import Link from "next/link";
import { SUBJECTS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function SubjectWisePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="card p-4 sm:p-6">
        <p className="text-xs font-semibold text-[var(--accent)] sm:text-sm">Practice / Subject Wise</p>
        <h1 className="heading mt-1.5 text-xl sm:mt-2 sm:text-2xl md:text-3xl">
          Subject Drills
        </h1>
        <p className="mt-1.5 max-w-lg text-xs leading-5 text-[var(--muted)] sm:mt-2 sm:text-sm sm:leading-6">
          Focus intensely on a single syllabus component to isolate weak readiness bands across a targeted cross-section of AI enriched questions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        {SUBJECTS.map((sub) => (
          <div key={sub} className="card-elevated p-6 flex flex-col justify-between">
            <div>
              <h2 className="heading text-xl mb-2">{sub}</h2>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/app/design-paper/run?mode=single_subject&size=50&subject=${encodeURIComponent(sub)}`}
                className="w-full text-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                50 Question Drill
              </Link>
               <Link
                href={`/app/design-paper/run?mode=single_subject&size=100&subject=${encodeURIComponent(sub)}`}
                className="w-full text-center rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
              >
                100 Question Marathon
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
