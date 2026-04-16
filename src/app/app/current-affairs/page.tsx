import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CurrentAffairsAppPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="card p-4 sm:p-6">
        <p className="text-xs font-semibold text-[var(--accent)] sm:text-sm">Practice / Current Affairs</p>
        <h1 className="heading mt-1.5 text-xl sm:mt-2 sm:text-2xl md:text-3xl">
          Current Affairs Bank
        </h1>
        <p className="mt-1.5 max-w-lg text-xs leading-5 text-[var(--muted)] sm:mt-2 sm:text-sm sm:leading-6">
          Master the latest events and UPSC-relevant news. Tap into our curated database of over 1,100+ current-affairs and contemporary issues designed to mirror the actual exam weightage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        {/* 25 Qs */}
        <div className="card-elevated p-6 flex flex-col justify-between border-[var(--border)]">
          <div>
            <div className="text-3xl mb-3">⚡️</div>
            <h2 className="heading text-xl mb-2">Quick Drill</h2>
            <p className="text-sm text-[var(--muted)]">25 questions to quickly test your awareness of recent news events.</p>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/app/design-paper/run?mode=single_subject&size=25&subject=Current%20Affairs"
              className="w-full text-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors inline-block"
            >
              Start 25 Q Drill
            </Link>
          </div>
        </div>

        {/* 50 Qs */}
        <div className="card-elevated p-6 flex flex-col justify-between border-[var(--border)]">
          <div>
            <div className="text-3xl mb-3">📰</div>
            <h2 className="heading text-xl mb-2">Sectional Practice</h2>
            <p className="text-sm text-[var(--muted)]">A robust 50-question session covering a broad range of current-affairs topics.</p>
          </div>
          <div className="mt-6 flex flex-col gap-2">
             <Link
              href="/app/design-paper/run?mode=single_subject&size=50&subject=Current%20Affairs"
              className="w-full text-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors inline-block"
            >
              Start 50 Q Sectional
            </Link>
          </div>
        </div>

        {/* 100 Qs */}
        <div className="card-elevated p-6 flex flex-col justify-between border-[var(--border)]">
          <div>
            <div className="text-3xl mb-3">🧠</div>
            <h2 className="heading text-xl mb-2">Marathon Session</h2>
            <p className="text-sm text-[var(--muted)]">Full length 100-question current affairs test to build stamina.</p>
          </div>
          <div className="mt-6 flex flex-col gap-2">
             <Link
              href="/app/design-paper/run?mode=single_subject&size=100&subject=Current%20Affairs"
              className="w-full text-center rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors inline-block"
            >
              Start 100 Q Marathon
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
