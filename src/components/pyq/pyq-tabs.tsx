"use client";

import Link from "next/link";
import { useState } from "react";
import { PyqDatabaseView } from "@/components/pyq-database-view";

const YEARS = Array.from({ length: 12 }, (_, i) => 2025 - i); // 2025 to 2014
const SUBJECTS = [
  "History",
  "Geography",
  "Economics",
  "Environment",
  "Polity",
  "Science & Tech",
  "Current Affairs",
];

export function PyqTabs() {
  const [activeTab, setActiveTab] = useState<"year" | "subject" | "database">(
    "year"
  );

  return (
    <>
      {/* Header Section */}
      <div className="text-center mb-10 sm:mb-16 relative flex flex-col items-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--accent)]/10 blur-[80px] rounded-full pointer-events-none -z-10"></div>

        {/* Pill Badge */}
        <div className="flex justify-center mb-6 z-10 relative">
          <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--muted)] tracking-wider">
            PYQ Practice
          </span>
        </div>

        <h1 className="heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-[var(--foreground)] mt-2 mb-4 sm:mb-6 transition-all relative z-10">
          {activeTab === "database" ? (
            "PYQ DATA BASE"
          ) : (
            <>
              CHOOSE YOUR{" "}
              <span className="text-[var(--accent)] drop-shadow-sm">
                {activeTab === "year" ? "YEAR" : "SUBJECT"}
              </span>
            </>
          )}
        </h1>
        <p className="mt-2 text-lg md:text-xl text-[var(--muted)] mb-8 max-w-2xl mx-auto font-medium transition-all relative z-10">
          {activeTab === "year"
            ? "Drill original UPSC questions from 2014 to 2025 in a high-pressure, distraction-free environment."
            : activeTab === "subject"
              ? "Master foundational concepts by drilling subject-specific PYQ sections."
              : "Search instantly across all 1,200+ enriched UPSC Prelims previous year questions."}
        </p>

        {/* Tab Toggle */}
        <div className="inline-flex flex-wrap items-center p-1 rounded-[2rem] border border-[var(--border)] bg-[var(--background)] relative z-10 w-full max-w-[32rem] transition-shadow hover:shadow-sm mx-auto">
          <button
            onClick={() => setActiveTab("year")}
            className={`flex-1 min-w-[100px] rounded-full py-3 text-xs md:text-sm font-bold uppercase tracking-widest transition-all ${
              activeTab === "year"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            By Year
          </button>
          <button
            onClick={() => setActiveTab("subject")}
            className={`flex-1 min-w-[100px] rounded-full py-3 text-xs md:text-sm font-bold uppercase tracking-widest transition-all ${
              activeTab === "subject"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Subject Wise
          </button>
          <button
            onClick={() => setActiveTab("database")}
            className={`flex-1 min-w-[120px] rounded-full py-3 text-xs md:text-sm font-bold uppercase tracking-widest transition-all ${
              activeTab === "database"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            PYQ Data Base
          </button>
        </div>
      </div>

      {/* Dynamic Grid / Database View */}
      <div className="relative z-10 transition-all">
        {activeTab === "database" && <PyqDatabaseView />}

        {activeTab === "year" && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {YEARS.map((year) => (
              <div
                key={year}
                className="group relative flex flex-col rounded-[1rem] bg-[var(--background-secondary)] p-4 sm:p-6 border-2 border-[var(--border)] transition-all hover:bg-[var(--background)] hover:border-[var(--border)] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300"
              >
                {/* Year Heading */}
                <div className="text-center mb-4 sm:mb-6 mt-1 sm:mt-2 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[var(--accent)]/0 group-hover:bg-[var(--accent)]/10 blur-2xl rounded-full pointer-events-none transition-colors duration-500" />
                  <span className="text-4xl sm:text-5xl font-display font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] group-hover:drop-shadow-[0_0_12px_rgba(163,230,53,0.3)] transition-all relative z-10">
                    {year}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 w-full mt-auto relative z-10">
                  <Link
                    href={`/app/pyq/run?year=${year}&limit=100`}
                    className="flex items-center justify-center w-full py-2.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 text-xs font-bold uppercase tracking-widest hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all shadow-inner"
                  >
                    Take FLT
                  </Link>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <Link
                      href={`/app/pyq/sectional?year=${year}`}
                      className="flex items-center justify-center text-center w-full h-12 px-2 rounded-lg bg-[var(--background-secondary)] text-[var(--muted)] border border-[var(--border)] text-[10px] font-bold uppercase tracking-wider leading-tight hover:text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[#F0EBE4] transition-all"
                    >
                      Sectional Test
                    </Link>
                    <Link
                      href={`/pyq/analyse?year=${year}`}
                      className="flex items-center justify-center text-center w-full h-12 px-2 rounded-lg bg-[var(--background-secondary)] text-[var(--muted)] border border-[var(--border)] text-[10px] font-bold uppercase tracking-wider leading-tight hover:text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[#F0EBE4] transition-all"
                    >
                      Analyse QP
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "subject" && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {SUBJECTS.map((subject) => (
              <div
                key={subject}
                className="group relative flex flex-col rounded-[1rem] bg-[var(--background-secondary)] p-4 sm:p-6 border-2 border-[var(--border)] transition-all hover:bg-[var(--background)] hover:border-[var(--border)] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300"
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
                    href={`/app/pyq/run?subject=${encodeURIComponent(subject)}&limit=50`}
                    className="flex items-center justify-center w-full py-2.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 text-xs font-bold uppercase tracking-widest hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all shadow-inner"
                  >
                    50Q Test
                  </Link>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <Link
                      href={`/app/pyq/run?subject=${encodeURIComponent(subject)}&limit=25`}
                      className="flex items-center justify-center text-center w-full h-12 px-2 rounded-lg bg-[var(--background-secondary)] text-[var(--muted)] border border-[var(--border)] text-[10px] font-bold uppercase tracking-wider leading-tight hover:text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[#F0EBE4] transition-all"
                    >
                      25Q Test
                    </Link>
                    <Link
                      href={`/pyq/subject-analyse?subject=${encodeURIComponent(subject)}`}
                      className="flex items-center justify-center text-center w-full h-12 px-2 rounded-lg bg-[var(--background-secondary)] text-[var(--muted)] border border-[var(--border)] text-[10px] font-bold uppercase tracking-wider leading-tight hover:text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[#F0EBE4] transition-all"
                    >
                      Analyse QP
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
