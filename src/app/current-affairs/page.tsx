import type { Metadata } from "next";
import Link from "next/link";
import {
  buildCurrentAffairsExamSlug,
  getCurrentAffairsSectionSummaries,
} from "@/lib/current-affairs";

export const metadata: Metadata = {
  title: "Current Affairs Repository — UPSCPRELIMSTEST",
  description:
    "Take subject-wise current-affairs tests built from the reviewed PT365 repository across Environment, Economy, History, Polity, Science, Geography, and more.",
};

export default async function CurrentAffairsPage() {
  const sections = await getCurrentAffairsSectionSummaries();
  const totalQuestions = sections.reduce((sum, section) => sum + section.questionCount, 0);

  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20 md:py-28">
        <div className="text-center mb-10 sm:mb-16 relative flex flex-col items-center">
          <div className="absolute top-1/2 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]/10 blur-[80px] pointer-events-none" />

          <div className="mb-6 flex justify-center">
            <span className="rounded-full border border-[#333] bg-[#0e0e0e] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              Current affairs repository
            </span>
          </div>

          <h1 className="heading mt-2 mb-6 text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-[var(--foreground)]">
            SUBJECT-WISE{" "}
            <span className="text-[var(--accent)] drop-shadow-[0_0_15px_rgba(163,230,53,0.3)]">
              CURRENT AFFAIRS
            </span>
          </h1>
          <p className="mt-2 max-w-3xl text-lg md:text-xl font-medium text-[var(--muted)]">
            Launch repository-backed current-affairs tests grouped by subject bucket. Each card is
            still part of the same PT365 current-affairs bank, only organized into focused tracks
            such as Polity, Economy, History, Science, and a general current-affairs bucket.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="badge rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest">
              {sections.length} subject buckets
            </span>
            <span className="badge-accent rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest">
              {totalQuestions} reviewed questions
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {sections.map((section) => {
            const subjectLabel =
              section.subject === "Current Affairs" ? "General Current Affairs" : section.subject;
            const stats = [
              { label: "Questions", value: section.questionCount },
              { label: "Topics", value: section.topicCount },
              { label: "Source Units", value: section.sectionCount },
            ];

            return (
              <div
                key={section.subject}
                className="group relative flex h-full flex-col gap-5 rounded-[1rem] border-2 border-[#262626] bg-[var(--background-secondary)] p-6 transition-all hover:border-[#333] hover:bg-[var(--background)] hover:shadow-[0_0_30px_rgba(0,0,0,0.45)]"
              >
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex min-h-[72px] flex-col items-center text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--muted)]">
                    Subject bucket
                  </p>
                  <h2 className="heading mt-3 text-3xl leading-none text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                    {subjectLabel}
                  </h2>
                </div>

                <div className="mx-auto grid w-full max-w-[520px] grid-cols-3 gap-3">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex min-h-[96px] flex-col items-center rounded-xl border border-[#2e2e2e] bg-[#121212] px-4 py-3.5 text-center"
                    >
                      <p className="flex min-h-[2.2rem] items-center justify-center text-[9px] font-bold uppercase leading-[1.2] tracking-[0.12em] text-[var(--muted)]">
                        {stat.label}
                      </p>
                      <p className="mt-auto text-2xl font-bold leading-none text-[var(--foreground)]">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mx-auto grid w-full max-w-[520px] grid-cols-2 gap-3 pt-1">
                  <Link
                    href={`/app/exams/${buildCurrentAffairsExamSlug(section.subject, 25)}`}
                    className="flex min-h-14 items-center justify-center rounded-xl border border-[#333] bg-[#181818] px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)] transition-all hover:border-[#555] hover:bg-[#222] hover:text-white"
                  >
                    25Q test
                  </Link>
                  <Link
                    href={`/app/exams/${buildCurrentAffairsExamSlug(section.subject, 50)}`}
                    className="flex min-h-14 items-center justify-center rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] transition-all hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-black"
                  >
                    50Q test
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
