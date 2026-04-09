"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface YearData {
  totalQuestions: number;
  subjects: Record<string, number>;
  questionTypes: { static: number; current: number; integrated: number };
  difficulty: { easy: number; medium: number; hard: number }; // paper-level difficulty split
  errors: { conceptual: number; application: number; guessing: number; misreading: number };
}

// ─── Accurate Dataset — sourced from superkalam.com/upsc-prelims/analysis ────
// Subject taxonomy: 13 granular subject areas used by UPSC analysis experts
const MOCK_DATA: Record<number, YearData> = {
  2025: {
    totalQuestions: 100,
    subjects: {
      "Ancient History": 6, "Art & Culture": 2, "Economy": 18,
      "Environment & Ecology": 15, "Indian Geography": 1, "Indian Polity": 14,
      "International Relations": 8, "Medieval History": 0, "Modern History": 8,
      "Physical Geography": 7, "Science & Technology": 13,
      "Social Issues & Schemes": 3, "World Geography": 5,
    },
    questionTypes: { static: 46, current: 22, integrated: 32 },
    difficulty: { easy: 33, medium: 35, hard: 32 },
    errors: { conceptual: 36, application: 28, guessing: 24, misreading: 12 },
  },
  2024: {
    totalQuestions: 100,
    subjects: {
      "Ancient History": 3, "Art & Culture": 4, "Economy": 13,
      "Environment & Ecology": 13, "Indian Geography": 4, "Indian Polity": 19,
      "International Relations": 6, "Medieval History": 1, "Modern History": 3,
      "Physical Geography": 8, "Science & Technology": 11,
      "Social Issues & Schemes": 7, "World Geography": 8,
    },
    questionTypes: { static: 42, current: 28, integrated: 30 },
    difficulty: { easy: 42, medium: 40, hard: 18 },
    errors: { conceptual: 35, application: 30, guessing: 20, misreading: 15 },
  },
  2023: {
    totalQuestions: 100,
    subjects: {
      "Ancient History": 1, "Art & Culture": 8, "Economy": 16,
      "Environment & Ecology": 16, "Indian Geography": 8, "Indian Polity": 15,
      "International Relations": 10, "Medieval History": 3, "Modern History": 3,
      "Physical Geography": 3, "Science & Technology": 10,
      "Social Issues & Schemes": 3, "World Geography": 4,
    },
    questionTypes: { static: 45, current: 20, integrated: 35 },
    difficulty: { easy: 20, medium: 45, hard: 35 },
    errors: { conceptual: 40, application: 25, guessing: 20, misreading: 15 },
  },
  2022: {
    totalQuestions: 100,
    subjects: {
      "Ancient History": 1, "Art & Culture": 7, "Economy": 16,
      "Environment & Ecology": 18, "Indian Geography": 5, "Indian Polity": 12,
      "International Relations": 11, "Medieval History": 5, "Modern History": 3,
      "Physical Geography": 2, "Science & Technology": 15,
      "Social Issues & Schemes": 2, "World Geography": 3,
    },
    questionTypes: { static: 50, current: 18, integrated: 32 },
    difficulty: { easy: 25, medium: 48, hard: 27 },
    errors: { conceptual: 42, application: 22, guessing: 24, misreading: 12 },
  },
  2021: {
    totalQuestions: 100,
    subjects: {
      "Ancient History": 3, "Art & Culture": 10, "Economy": 14,
      "Environment & Ecology": 18, "Indian Geography": 5, "Indian Polity": 18,
      "International Relations": 2, "Medieval History": 4, "Modern History": 7,
      "Physical Geography": 2, "Science & Technology": 13,
      "Social Issues & Schemes": 2, "World Geography": 2,
    },
    questionTypes: { static: 55, current: 15, integrated: 30 },
    difficulty: { easy: 35, medium: 38, hard: 27 },
    errors: { conceptual: 45, application: 20, guessing: 22, misreading: 13 },
  },
  2020: {
    totalQuestions: 100,
    subjects: {
      "Ancient History": 3, "Art & Culture": 5, "Economy": 21,
      "Environment & Ecology": 19, "Indian Geography": 6, "Indian Polity": 15,
      "International Relations": 3, "Medieval History": 2, "Modern History": 9,
      "Physical Geography": 1, "Science & Technology": 13,
      "Social Issues & Schemes": 2, "World Geography": 1,
    },
    questionTypes: { static: 48, current: 20, integrated: 32 },
    difficulty: { easy: 30, medium: 43, hard: 27 },
    errors: { conceptual: 38, application: 28, guessing: 20, misreading: 14 },
  },
  2019: {
    totalQuestions: 100,
    subjects: {
      "Ancient History": 4, "Art & Culture": 6, "Economy": 17,
      "Environment & Ecology": 19, "Indian Geography": 6, "Indian Polity": 14,
      "International Relations": 5, "Medieval History": 3, "Modern History": 6,
      "Physical Geography": 4, "Science & Technology": 12,
      "Social Issues & Schemes": 2, "World Geography": 2,
    },
    questionTypes: { static: 52, current: 16, integrated: 32 },
    difficulty: { easy: 28, medium: 44, hard: 28 },
    errors: { conceptual: 40, application: 26, guessing: 22, misreading: 12 },
  },
  2018: {
    totalQuestions: 100,
    subjects: {
      "Ancient History": 5, "Art & Culture": 8, "Economy": 15,
      "Environment & Ecology": 17, "Indian Geography": 6, "Indian Polity": 16,
      "International Relations": 4, "Medieval History": 3, "Modern History": 13,
      "Physical Geography": 2, "Science & Technology": 9,
      "Social Issues & Schemes": 1, "World Geography": 1,
    },
    questionTypes: { static: 58, current: 12, integrated: 30 },
    difficulty: { easy: 32, medium: 42, hard: 26 },
    errors: { conceptual: 44, application: 22, guessing: 24, misreading: 10 },
  },
  2017: {
    totalQuestions: 100,
    subjects: {
      "Ancient History": 5, "Art & Culture": 6, "Economy": 16,
      "Environment & Ecology": 18, "Indian Geography": 7, "Indian Polity": 17,
      "International Relations": 4, "Medieval History": 3, "Modern History": 8,
      "Physical Geography": 3, "Science & Technology": 10,
      "Social Issues & Schemes": 2, "World Geography": 1,
    },
    questionTypes: { static: 60, current: 10, integrated: 30 },
    difficulty: { easy: 34, medium: 40, hard: 26 },
    errors: { conceptual: 46, application: 22, guessing: 20, misreading: 12 },
  },
  2016: {
    totalQuestions: 100,
    subjects: {
      "Ancient History": 4, "Art & Culture": 7, "Economy": 15,
      "Environment & Ecology": 19, "Indian Geography": 6, "Indian Polity": 17,
      "International Relations": 4, "Medieval History": 3, "Modern History": 8,
      "Physical Geography": 3, "Science & Technology": 11,
      "Social Issues & Schemes": 2, "World Geography": 1,
    },
    questionTypes: { static: 62, current: 10, integrated: 28 },
    difficulty: { easy: 36, medium: 38, hard: 26 },
    errors: { conceptual: 48, application: 20, guessing: 20, misreading: 12 },
  },
  2015: {
    totalQuestions: 100,
    subjects: {
      "Ancient History": 5, "Art & Culture": 8, "Economy": 14,
      "Environment & Ecology": 20, "Indian Geography": 7, "Indian Polity": 16,
      "International Relations": 3, "Medieval History": 3, "Modern History": 7,
      "Physical Geography": 4, "Science & Technology": 10,
      "Social Issues & Schemes": 1, "World Geography": 2,
    },
    questionTypes: { static: 65, current: 8, integrated: 27 },
    difficulty: { easy: 38, medium: 38, hard: 24 },
    errors: { conceptual: 50, application: 18, guessing: 20, misreading: 12 },
  },
  2014: {
    totalQuestions: 100,
    subjects: {
      "Ancient History": 7, "Art & Culture": 15, "Economy": 14,
      "Environment & Ecology": 28, "Indian Geography": 6, "Indian Polity": 12,
      "International Relations": 3, "Medieval History": 2, "Modern History": 5,
      "Physical Geography": 3, "Science & Technology": 10,
      "Social Issues & Schemes": 1, "World Geography": 2,  // Note: 2014 had 28 Env Qs
    },
    questionTypes: { static: 68, current: 7, integrated: 25 },
    difficulty: { easy: 40, medium: 38, hard: 22 },
    errors: { conceptual: 52, application: 18, guessing: 18, misreading: 12 },
  },
};

const YEARS = Object.keys(MOCK_DATA).map(Number).sort((a, b) => b - a);

// ─── Color Palette ───────────────────────────────────────────────────────────
const ACCENT = "#C4784A";
const SUBJECT_COLORS = ["#C4784A","#34d399","#60a5fa","#f472b6","#fb923c","#a78bfa","#fbbf24"];
const PIE_COLORS = { static: "#60a5fa", current: "#f472b6", integrated: "#C4784A" };
const ERROR_COLORS = ["#f87171","#fb923c","#fbbf24","#C4784A"];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{value: number; name?: string; color?: string;}> ; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] px-4 py-3 shadow-xl text-sm">
      {label && <p className="text-[var(--muted)] font-bold mb-1 uppercase tracking-wider text-[10px]">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? ACCENT }} className="font-semibold">
          {p.name ? `${p.name}: ` : ""}{p.value}{typeof p.value === "number" && p.name !== "Questions" ? "" : ""}
        </p>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] p-5 hover:border-[var(--accent)]/40 transition-all">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{label}</p>
      <p className="text-3xl font-display font-bold mt-2 text-[var(--accent)]">{value}</p>
      <p className="text-xs text-[var(--muted)] mt-1">{sub}</p>
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] p-6">
      <p className="text-base font-bold uppercase tracking-wider text-[var(--foreground)]">{title}</p>
      {subtitle && <p className="text-xs text-[var(--muted)] mt-1 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

// ─── Heatmap Cell ─────────────────────────────────────────────────────────────
function HeatCell({ value, max }: { value: number; max: number }) {
  const intensity = max > 0 ? value / max : 0;
  const bg = intensity < 0.2 ? "#EDE9E3"
    : intensity < 0.4 ? "#E8D5C4"
    : intensity < 0.6 ? "#D4A574"
    : intensity < 0.8 ? "#C4784A"
    : "#9A5A32";
  const text = intensity > 0.6 ? "#fff" : "#6B7280";
  return (
    <div
      className="w-full h-9 rounded flex items-center justify-center text-xs font-bold transition-all cursor-default"
      style={{ backgroundColor: bg, color: text }}
      title={`${value} questions`}
    >
      {value}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
function AnalyseDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultYear = YEARS[0] ?? 2025;
  const yearParam = Number(searchParams.get("year")) || defaultYear;
  const [selectedYear, setSelectedYear] = [
    YEARS.includes(yearParam) ? yearParam : defaultYear,
    (y: number) => router.push(`/pyq/analyse?year=${y}`),
  ];

  const data = MOCK_DATA[selectedYear] ?? MOCK_DATA[defaultYear]!;

  // ── Derived data ──────────────────────────────────────────────────────────
  const subjectEntries = Object.entries(data.subjects).sort((a, b) => b[1] - a[1]);
  const dominantSubject = subjectEntries[0]?.[0] ?? "Unknown";
  const staticRatio = Math.round((data.questionTypes.static / data.totalQuestions) * 100);

  // Short labels for the Y-axis (so all 13 fit without wrapping)
  const SHORT_NAMES: Record<string, string> = {
    "Ancient History":           "Ancient Hist.",
    "Art & Culture":             "Art & Culture",
    "Economy":                   "Economy",
    "Environment & Ecology":     "Env & Ecology",
    "Indian Geography":          "Indian Geo.",
    "Indian Polity":             "Indian Polity",
    "International Relations":   "Intl. Relations",
    "Medieval History":          "Medieval Hist.",
    "Modern History":            "Modern Hist.",
    "Physical Geography":        "Physical Geo.",
    "Science & Technology":      "Sci & Tech",
    "Social Issues & Schemes":   "Social Issues",
    "World Geography":           "World Geo.",
  };

  const subjectBarData = subjectEntries.map(([subject, count]) => ({
    subject: SHORT_NAMES[subject] ?? subject,
    fullSubject: subject,
    count,
  }));


  const pieData = [
    { name: "Static", value: data.questionTypes.static },
    { name: "Current Affairs", value: data.questionTypes.current },
    { name: "Integrated", value: data.questionTypes.integrated },
  ];

  const difficultyBarData = [
    { name: "Easy", value: data.difficulty.easy, fill: "#34d399" },
    { name: "Medium", value: data.difficulty.medium, fill: "#fbbf24" },
    { name: "Hard", value: data.difficulty.hard, fill: "#f87171" },
  ];




  // Heatmap: all available years (2014–2025)
  const heatYears = YEARS; // already sorted newest → oldest
  const heatSubjects = Object.keys(MOCK_DATA[defaultYear]!.subjects);
  const heatMax = Math.max(...heatYears.flatMap(y => Object.values(MOCK_DATA[y]?.subjects ?? {})));

  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 space-y-8">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
              QP Analysis
            </span>
            <h1 className="heading text-4xl md:text-5xl text-[var(--foreground)] mt-3">
              PYQ ANALYSIS{" "}
              <span className="text-[var(--accent)] drop-shadow-sm">
                DASHBOARD
              </span>
            </h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Decode the paper. Find your edge.
            </p>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Year</label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--background)] pl-4 pr-9 py-2.5 text-sm font-bold text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                width="12" height="12" viewBox="0 0 12 12" fill="none"
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <Link
              href="/pyq"
              className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-all"
            >
              ← PYQ
            </Link>
          </div>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Questions" value={data.totalQuestions} sub={`UPSC Prelims GS-1 ${selectedYear}`} />
          <KpiCard label="Subjects Covered" value={Object.keys(data.subjects).length} sub="distinct subject areas" />
          <KpiCard label="Top Subject" value={dominantSubject} sub={`${data.subjects[dominantSubject]} questions`} />
          <KpiCard label="Static : Dynamic" value={`${staticRatio}%`} sub="questions from static topics" />
        </div>

        {/* ── Row 1: Subject Weightage + Question Nature ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Section title="Subject Weightage" subtitle="Questions per subject — where the paper focused">
            <ResponsiveContainer width="100%" height={390}>
              <BarChart data={subjectBarData} layout="vertical" margin={{ left: 4, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="subject"
                  tick={{ fill: "#bbb", fontSize: 10.5, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={112}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length || !payload[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] px-4 py-3 shadow-xl text-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">{d.fullSubject}</p>
                        <p className="font-bold text-[var(--accent)]">{d.count} Questions</p>
                      </div>
                    );
                  }}
                  cursor={{ fill: "#ffffff08" }}
                />
                <Bar dataKey="count" name="Questions" radius={[0, 6, 6, 0]} barSize={18}>
                  {subjectBarData.map((_, i) => (
                    <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* Question Nature Pie */}
          <Section title="Question Nature" subtitle="Static facts vs current affairs vs integrated">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "#444" }}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={Object.values(PIE_COLORS)[i]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: Object.values(PIE_COLORS)[i] }} />
                  {d.name}: <strong className="text-[var(--foreground)]">{d.value}Q</strong>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ── Year-wise Heatmap ────────────────────────────────────────────── */}
        <Section title="Year-wise Subject Heatmap" subtitle="Question frequency per subject across all years (2014–2025) — darker = higher">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  <th className="text-left text-[var(--muted)] font-bold uppercase tracking-wide pb-2 pr-2 text-[10px]" style={{ width: "110px" }}>Subject</th>
                  {heatYears.map((y) => (
                    <th key={y} className={`pb-2 font-bold text-center text-[9px] ${y === selectedYear ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                      {`'${String(y).slice(2)}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatSubjects.map((subject) => (
                  <tr key={subject}>
                    <td className="pr-2 py-[3px] text-[var(--foreground)] font-semibold text-[10px] whitespace-nowrap">{subject}</td>
                    {heatYears.map((y) => {
                      const val = MOCK_DATA[y]?.subjects[subject] ?? 0;
                      const intensity = heatMax > 0 ? val / heatMax : 0;
                      const bg = intensity < 0.15 ? "#111"
                        : intensity < 0.35 ? "#1a3a1a"
                        : intensity < 0.55 ? "#275c1a"
                        : intensity < 0.75 ? "#3d8020"
                        : "#C4784A";
                      const fg = intensity > 0.65 ? "#000" : "#999";
                      const ring = y === selectedYear ? "2px solid #C4784A" : "none";
                      return (
                        <td key={y} className="px-[2px] py-[3px]">
                          <div
                            style={{ backgroundColor: bg, color: fg, outline: ring }}
                            className="w-full h-7 rounded flex items-center justify-center text-[9px] font-bold cursor-default"
                            title={`${subject} ${y}: ${val} questions`}
                          >
                            {val || ""}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
        {/* ── Paper Difficulty Split ──────────────────────────────────── */}
        <Section title="Paper Difficulty Split" subtitle="Easy / Medium / Hard question distribution for this year">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={difficultyBarData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#aaa", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 60]} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
                <Bar dataKey="value" name="Questions" radius={[8, 8, 0, 0]}>
                  {difficultyBarData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex sm:flex-col justify-center gap-6 shrink-0 pr-4">
              {difficultyBarData.map((d) => (
                <div key={d.name} className="text-center">
                  <p className="text-3xl font-bold" style={{ color: d.fill }}>{d.value}</p>
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-1">{d.name}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}

// ─── Page (with Suspense for useSearchParams) ─────────────────────────────────
export default function AnalysePage() {
  return (
    <Suspense fallback={
      <div className="bg-blueprint-grid min-h-screen flex items-center justify-center">
        <div className="text-[var(--muted)] text-sm animate-pulse uppercase tracking-widest">Loading dashboard…</div>
      </div>
    }>
      <AnalyseDashboard />
    </Suspense>
  );
}
