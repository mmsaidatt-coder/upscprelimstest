import Link from "next/link";
import { SUBJECTS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function DesignPaperPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="card p-4 sm:p-6">
        <p className="text-xs font-semibold text-[var(--accent)] sm:text-sm">Design Paper</p>
        <h1 className="heading mt-1.5 text-xl sm:mt-2 sm:text-2xl md:text-3xl">
          Mock Test Generator
        </h1>
        <p className="mt-1.5 max-w-lg text-xs leading-5 text-[var(--muted)] sm:mt-2 sm:text-sm sm:leading-6">
          Access the 10,000+ AI-enriched questions randomly utilizing specific UPSC algorithms.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-6">

        {/* Module 1: UPSC Blueprint */}
        <div className="card-elevated p-6 flex flex-col justify-between">
          <div>
            <div className="mb-3 text-3xl">🏛️</div>
            <h2 className="heading text-xl mb-2">UPSC Blueprint</h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
              A meticulously generated 100-question Full Length Test mimicking the exact UPSC ratio (18% History, 15% Polity, 15% Economy, 15% Current Affairs, etc.)
            </p>
          </div>
          <Link
            href="/app/design-paper/run?mode=upsc_flt&size=100"
            className="w-full text-center rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            Generate FLT Simulator
          </Link>
        </div>

        {/* Module 2: Mixed Drilling */}
        <div className="card-elevated p-6 flex flex-col justify-between">
          <div>
            <div className="mb-3 text-3xl">🎲</div>
            <h2 className="heading text-xl mb-2">Mixed Practice</h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
              Completely random sampling across all subjects and difficulty bands. Great for rapid conceptual switching.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <Link
              href="/app/design-paper/run?mode=mixed&size=50"
              className="text-center rounded-lg border-2 border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
            >
              50 Qs
            </Link>
            <Link
              href="/app/design-paper/run?mode=mixed&size=100"
              className="text-center rounded-lg bg-[var(--foreground)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
            >
              100 Qs
            </Link>
          </div>
        </div>

        {/* Module 3: Granular Subject */}
        <div className="card-elevated p-6 flex flex-col justify-between">
          <div>
            <div className="mb-3 text-3xl">🎯</div>
            <h2 className="heading text-xl mb-2">Subject Mastery</h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
              Focus intensely on a single syllabus component. Test your depth and isolate weak readiness bands.
            </p>
          </div>

          <div className="mt-auto space-y-2">
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.slice(0, 4).map(sub => (
                <Link
                  key={sub}
                  href={`/app/design-paper/run?mode=single_subject&size=50&subject=${encodeURIComponent(sub)}`}
                  className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[#1AA] hover:border-[#1AA] transition-colors"
                >
                  {sub}
                </Link>
              ))}
            </div>
             <div className="flex flex-wrap gap-2">
              {SUBJECTS.slice(4).map(sub => (
                <Link
                  key={sub}
                  href={`/app/design-paper/run?mode=single_subject&size=50&subject=${encodeURIComponent(sub)}`}
                  className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[#1AA] hover:border-[#1AA] transition-colors"
                >
                  {sub}
                </Link>
              ))}
            </div>
             <p className="text-[10px] text-[var(--muted)] pt-2 text-right uppercase tracking-wider">Default to 50 Questions</p>
          </div>
        </div>

      </div>
    </div>
  );
}
