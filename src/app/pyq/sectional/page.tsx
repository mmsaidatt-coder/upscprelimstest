import Link from "next/link";
import { redirect } from "next/navigation";

const SUBJECTS = [
  "History",
  "Geography",
  "Economics",
  "Environment",
  "Polity",
  "Science & Tech",
  "Current Affairs"
];

export const dynamic = "force-dynamic";

export default async function SectionalTestPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year } = await searchParams;

  if (!year) {
    redirect("/app/pyq");
  }

  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28 fade-up">
        
        {/* Header Section */}
        <div className="text-center mb-16 relative flex flex-col items-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--accent)]/10 blur-[80px] rounded-full pointer-events-none -z-10"></div>
          
          {/* Pill Badge */}
          <div className="flex justify-center mb-6 z-10 relative">
            <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--muted)] tracking-wider">
              SECTIONAL TEST
            </span>
          </div>

          <h1 className="heading text-5xl md:text-7xl lg:text-8xl text-[var(--foreground)] mt-2 mb-6 transition-all relative z-10">
            YEAR <span className="text-[var(--accent)] drop-shadow-sm">
              {year}
            </span>
          </h1>
          <p className="mt-2 text-lg md:text-xl text-[var(--muted)] mb-8 max-w-2xl mx-auto font-medium transition-all relative z-10">
            Choose a subject to begin your {year} Sectional Test. 
            You will be tested on all available PYQs for this subject in the selected year.
          </p>
        </div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 relative z-10 transition-all">
          {SUBJECTS.map((subject) => (
            <div
              key={subject}
              className="group relative flex flex-col rounded-[1rem] bg-[var(--background-secondary)] p-6 border-2 border-[var(--border)] transition-all hover:bg-[var(--background)] hover:border-[var(--border)] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300"
            >
              {/* Subject Heading */}
              <div className="text-center mb-6 mt-2 relative min-h-[48px] flex items-center justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[var(--accent)]/0 group-hover:bg-[var(--accent)]/10 blur-2xl rounded-full pointer-events-none transition-colors duration-500"></div>
                <span className="text-3xl lg:text-4xl font-display font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] group-hover:drop-shadow-[0_0_12px_rgba(163,230,53,0.3)] transition-all relative z-10 uppercase tracking-wide leading-none">
                  {subject}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-3 w-full mt-auto relative z-10">
                 <Link 
                   href={`/app/pyq/run?year=${year}&subject=${encodeURIComponent(subject)}&limit=100`} 
                   className="flex items-center justify-center w-full py-2.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 text-xs font-bold uppercase tracking-widest hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all shadow-inner"
                 >
                   Start Test
                 </Link>
              </div>
            </div>
          ))}
        </div>
        
        {/* Back Button */}
        <div className="mt-16 text-center relative z-10">
          <Link
            href="/app/pyq"
            className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-[var(--background-secondary)] text-[var(--muted)] border border-[var(--border)] text-sm font-bold uppercase tracking-wider leading-tight hover:text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[#F0EBE4] transition-all"
          >
            ← Back to PYQ Library
          </Link>
        </div>

      </div>
    </div>
  );
}
