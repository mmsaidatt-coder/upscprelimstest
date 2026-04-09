"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

// Shared type for the fetched question
export type Question = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correct_option_id: string | null;
  year: number | null;
  subject: string;
  topic?: string | null;
  sub_topic?: string | null;
  keywords?: string[] | null;
  question_type?: string | null;
  concepts?: string[] | null;
  importance?: string | null;
  difficulty_rationale?: string | null;
  mnemonic_hint?: string | null;
  ncert_class?: string | null;
};

const SUBJECTS = [
  "All Subjects",
  "History",
  "Geography",
  "Economy",  // standardizing to Economy based on DB mapping
  "Environment",
  "Polity",
  "Science",
  "Current Affairs"
];

const YEARS = ["All Years", ...Array.from({ length: 12 }, (_, i) => String(2025 - i))];

export function PyqDatabaseView() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [selectedYear, setSelectedYear] = useState("All Years");
  
  // UI State
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  // Pagination (for performance rendering)
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    let active = true;
    fetch("/api/pyq/database")
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          if (data.success && data.questions) {
            setQuestions(data.questions);
          } else {
            setError(data.error || "Failed to load database.");
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    const timeout = window.setTimeout(() => setPage(1), 0);
    return () => window.clearTimeout(timeout);
  }, [searchQuery, selectedSubject, selectedYear]);

  // Instantaneous Client-Side Filtering
  const filteredQuestions = useMemo(() => {
    let temp = questions;

    // Filter by Subject
    if (selectedSubject !== "All Subjects") {
      temp = temp.filter((q) => {
        // Handle mapped names like Economics vs Economy
        if (selectedSubject === "Economy" && (q.subject === "Economics" || q.subject === "Economy")) return true;
        if (selectedSubject === "Science" && (q.subject === "Science & Tech" || q.subject === "Science")) return true;
        return q.subject === selectedSubject;
      });
    }

    // Filter by Year
    if (selectedYear !== "All Years") {
      temp = temp.filter((q) => String(q.year) === selectedYear);
    }

    // Filter by Search Query
    if (searchQuery.trim() !== "") {
      const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
      temp = temp.filter((q) => {
        // Build a massive string of all searchable content for this question
        const searchableText = [
          q.prompt,
          q.topic,
          q.sub_topic,
          String(q.year || ""),
          q.subject,
          ...(q.keywords || []),
          ...(q.concepts || [])
        ].filter(Boolean).join(" ").toLowerCase();

        // Ensure EVERY search term is found somewhere in the searchable text
        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    return temp;
  }, [questions, searchQuery, selectedSubject, selectedYear]);

  const displayedQuestions = filteredQuestions.slice(0, page * PAGE_SIZE);
  const hasMore = displayedQuestions.length < filteredQuestions.length;

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* ── Filter Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 mb-5 bg-[var(--background-secondary)] p-3 rounded-xl border border-[var(--border)] sticky top-14 z-20 shadow-md sm:sticky sm:top-4 sm:p-4 sm:gap-3 md:flex-row md:items-center sm:mb-6">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search keywords, topics..."
            className="w-full bg-white border border-[var(--border)] rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-all sm:py-3 sm:pl-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto md:gap-3">
          <select
            className="w-full md:w-auto appearance-none bg-white border border-[var(--border)] rounded-lg py-2.5 pl-3 pr-8 text-sm font-semibold text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-all cursor-pointer sm:py-3 sm:pl-4 sm:pr-10"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="w-full md:w-auto appearance-none bg-white border border-[var(--border)] rounded-lg py-2.5 pl-3 pr-8 text-sm font-semibold text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-all cursor-pointer sm:py-3 sm:pl-4 sm:pr-10"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Status & Results ────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between px-2">
        <p className="text-sm font-bold tracking-widest uppercase text-[var(--muted)]">
          {loading ? "Initializing Database..." : `${filteredQuestions.length} Questions Found`}
        </p>
      </div>

      <div className="space-y-3 pb-20">
        {loading ? (
          // Skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-white h-24 animate-pulse"></div>
          ))
        ) : error ? (
          <div className="p-10 text-center border border-red-500/30 rounded-xl bg-red-500/10 text-red-400">
            <p>Error loading database: {error}</p>
          </div>
        ) : displayedQuestions.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center border border-[var(--border)] rounded-xl bg-[var(--background-secondary)]">
            <span className="text-4xl mb-3">🔍</span>
            <p className="font-bold text-lg text-[var(--foreground)]">No matches found</p>
            <p className="text-sm text-[var(--muted)] mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          displayedQuestions.map((q, idx) => {
            const isExpanded = expandedQ === q.id;
            const opts = Array.isArray(q.options) ? q.options : [];
            const barColor = "var(--accent)";
            const importanceColor = {
              "Very High": "#f87171", "High": "#fb923c",
              "Medium": "#facc15", "Low": "#6b7280",
            }[q.importance ?? ""] ?? "#6b7280";

            return (
              <div
                key={q.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] overflow-hidden transition-all shadow-sm hover:border-[var(--accent)]/40"
              >
                {/* Header (Clickable) */}
                <button
                  className="w-full text-left px-3 py-3 flex items-start gap-3 hover:bg-white transition-colors sm:px-5 sm:py-4 sm:gap-4"
                  onClick={() => setExpandedQ(isExpanded ? null : q.id)}
                >
                  <span
                    className="flex-shrink-0 text-xs font-bold rounded-lg w-8 h-8 flex items-center justify-center mt-1"
                    style={{ background: "#F0EBE4", color: "#6B7280", border: "1px solid #E5E0DA" }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{q.year ?? "—"} · {q.subject}</p>
                      
                      {q.topic && (
                        <>
                          <span className="text-xs text-[var(--muted)]">•</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">{q.topic}</span>
                        </>
                      )}

                      {q.question_type && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm bg-[#EDE9E3] text-[#7C6A5B] ml-2">
                          {q.question_type}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[13px] font-medium text-[var(--foreground)] leading-snug line-clamp-2 sm:text-[15px]">
                      {q.prompt.replace(/^\d+\.\s*/, '')}
                    </p>
                  </div>
                  <svg
                    className={`flex-shrink-0 text-[var(--muted)] mt-2 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                    width="18" height="18" viewBox="0 0 24 24" fill="none"
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] px-3 pb-4 pt-3 space-y-3 bg-[#F5F1EB] sm:px-5 sm:pb-5 sm:pt-4 sm:space-y-4">
                    <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{q.prompt.replace(/^\d+\.\s*/, '')}</p>
                    
                    {/* Options */}
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
                      {opts.map((opt) => {
                        const isCorrect = q.correct_option_id?.toUpperCase() === opt.id?.toUpperCase();
                        return (
                          <div
                            key={opt.id}
                            className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-all sm:gap-3 sm:px-4 sm:py-3 sm:text-sm ${
                              isCorrect
                                ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)]"
                                : "bg-white border border-[var(--border)] text-[var(--muted)]"
                            }`}
                          >
                            <span className={`font-bold flex-shrink-0 ${isCorrect ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>({opt.id})</span>
                            <span className="leading-relaxed">{opt.text}</span>
                            {isCorrect && <span className="ml-auto flex-shrink-0 font-bold">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                    
                    {!q.correct_option_id && (
                      <p className="text-xs text-[var(--muted)]">Answer key not yet available.</p>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-[var(--border)]">
                      
                      {/* Left Col: Keywords & Concepts */}
                      <div className="space-y-4">
                        {q.sub_topic && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1">Sub-topic</p>
                            <p className="text-sm font-semibold text-[var(--foreground)]">{q.sub_topic}</p>
                          </div>
                        )}
                        {q.keywords && q.keywords.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Key Terms</p>
                            <div className="flex flex-wrap gap-1.5">
                              {q.keywords.map((kw) => (
                                <span key={kw} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">{kw}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {q.concepts && q.concepts.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Concepts Tested</p>
                            <div className="flex flex-wrap gap-1.5">
                              {q.concepts.map((c) => (
                                <span key={c} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#EDE7F6] text-[#5E35B1] border border-[#D1C4E9]">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Col: Importance, Mnemonic, Rationale */}
                      <div className="space-y-4">
                        {q.importance && (
                          <div className="flex items-center gap-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Importance</p>
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: importanceColor + "20", color: importanceColor, border: `1px solid ${importanceColor}30` }}>
                              {q.importance}
                            </span>
                          </div>
                        )}
                        {q.ncert_class && (
                          <div className="flex items-start gap-2 text-sm text-[var(--muted)]">
                            <span className="shrink-0 mt-0.5">📖</span>
                            <span>{q.ncert_class}</span>
                          </div>
                        )}
                        {q.difficulty_rationale && (
                          <div className="flex items-start gap-2 text-sm text-[var(--muted)] italic">
                            <span className="shrink-0 mt-0.5">📊</span>
                            <span>{q.difficulty_rationale}</span>
                          </div>
                        )}
                        {q.mnemonic_hint && (
                          <div className="mt-2 rounded-lg bg-[#FFF8E1] border border-[#FFE082] p-4 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#F57F17] mb-1.5 flex items-center gap-1.5">
                              <span>💡</span> Memory Tip
                            </p>
                            <p className="text-sm text-[#5D4037] leading-relaxed">{q.mnemonic_hint}</p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {hasMore && !loading && (
        <div className="py-8 flex justify-center border-t border-[var(--border)]">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full bg-[var(--background-secondary)] border border-[var(--border)] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[var(--foreground)] hover:bg-[#F0EBE4] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all shadow-xl"
          >
            Load 50 More
          </button>
        </div>
      )}
    </div>
  );
}
