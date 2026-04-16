import type { Metadata } from "next";
import Link from "next/link";
import {
  Timer,
  BookOpen,
  BarChart3,
  Globe2,
  Users,
  Layers,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  Search,
  Map,
  MessageSquare,
  Shield,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Platform Features — Exam Mode, Review & Analytics | UPSC Prelims Test",
  description:
    "Discover the complete UPSC Prelims practice platform: timed exam simulations, 10,000+ AI-enriched questions, subject-wise drills, interactive Geography Lab, performance analytics, and community forum. 100% free.",
  alternates: {
    canonical: "https://upscprelimstest.com/platform",
  },
  openGraph: {
    title: "Platform Features — UPSC Prelims Test",
    description:
      "Free UPSC Prelims practice platform with exam simulation, 10,000+ questions, analytics, Geography Lab, and community forum.",
    url: "https://upscprelimstest.com/platform",
  },
};

/* ─── Static Data ─────────────────────────────────────────────────── */

const HERO_STATS = [
  { value: "10,000+", label: "Practice Questions" },
  { value: "1,200+", label: "PYQs (2011–2024)" },
  { value: "8", label: "Subjects Covered" },
  { value: "100%", label: "Free Forever" },
];

const CORE_FEATURES = [
  {
    icon: Timer,
    title: "Exam Simulation",
    desc: "Timed tests with real UPSC negative marking, question palette, mark-for-review, and auto-submit — feels exactly like exam day.",
    color: "#C4784A",
  },
  {
    icon: Layers,
    title: "10,000+ Question Bank",
    desc: "AI-enriched questions with difficulty ratings, NCERT references, mnemonics, and detailed explanations for every single answer.",
    color: "#10b981",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    desc: "Subject radar, pacing scatter, score trajectory, readiness bands, and weakness heatmaps that evolve with every test you take.",
    color: "#6366f1",
  },
  {
    icon: Globe2,
    title: "Geography Lab",
    desc: "Interactive high-res maps of Indian rivers, mountain ranges, national parks, and passes — learn geography visually, not from textbooks.",
    color: "#0ea5e9",
  },
  {
    icon: Users,
    title: "Community Forum",
    desc: "Discuss strategies, share resources, and learn from fellow aspirants across topic-based communities — Reddit-style, built for UPSC.",
    color: "#f59e0b",
  },
  {
    icon: BookOpen,
    title: "PYQ Deep Dive",
    desc: "Year-wise, subject-wise, and topic-wise breakdowns of 12 years of previous year papers with trend analysis and pattern recognition.",
    color: "#ec4899",
  },
];

const EXAM_FEATURES = [
  "Real countdown timer with auto-submit",
  "UPSC negative marking (−0.67 per wrong answer)",
  "Question palette with color-coded states",
  "Mark for review & option eliminator",
  "Mobile-optimized with touch-friendly UI",
  "Instant score + detailed review on submit",
];

const PRACTICE_MODES = [
  {
    title: "Year-wise PYQ",
    desc: "Practice any year from 2011 to 2024",
    href: "/app/pyq",
    icon: BookOpen,
  },
  {
    title: "Subject Drill",
    desc: "Focus on Polity, History, Geography, or any subject",
    href: "/app/subject-wise",
    icon: Target,
  },
  {
    title: "Full-Length Test",
    desc: "100-question mock with UPSC subject ratios",
    href: "/app/flt",
    icon: Timer,
  },
  {
    title: "Custom Session",
    desc: "Design your own test — pick size, subjects, mode",
    href: "/app/design-paper",
    icon: Sparkles,
  },
  {
    title: "Current Affairs",
    desc: "1,147 questions from recent current affairs",
    href: "/app/current-affairs",
    icon: Zap,
  },
  {
    title: "Topic-wise",
    desc: "Drill into specific topics like Panchayati Raj or Monsoons",
    href: "/app/pyq/sectional",
    icon: Search,
  },
];

/* ─── Page Component ──────────────────────────────────────────────── */

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">

      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F2] via-[#FAF7F2] to-[#F5F0E8]" />
        <div className="absolute inset-0 bg-warm-grid opacity-60" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-16 lg:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <span className="mb-4 inline-block rounded-full border border-[#C4784A]/20 bg-[#C4784A]/5 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#C4784A] sm:mb-6">
              Platform Overview
            </span>

            <h1 className="mb-6 font-serif text-[2.25rem] font-bold leading-[1.08] text-[#1A1A1A] sm:mb-8 sm:text-5xl md:text-6xl lg:text-7xl">
              Everything you need to
              <br />
              <span className="italic text-[#C4784A]">crack Prelims.</span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-[#6B7280] sm:mb-12 sm:text-lg md:text-xl">
              A free, AI-powered practice platform with 10,000+ questions,
              exam simulations, interactive geography maps, smart analytics,
              and a community of serious aspirants — all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="mb-12 flex flex-col items-center justify-center gap-3 sm:mb-16 sm:flex-row sm:gap-4">
              <Link
                href="/app"
                className="group flex items-center gap-2 rounded-full bg-[#C4784A] px-8 py-4 text-base font-bold text-white transition-all hover:bg-[#B06838] hover:shadow-lg hover:shadow-[#C4784A]/20 sm:px-10"
              >
                Start Practicing Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/app/pyq"
                className="rounded-full border-2 border-[#1A1A1A] px-8 py-4 text-base font-bold text-[#1A1A1A] transition-all hover:bg-[#1A1A1A] hover:text-white sm:px-10"
              >
                Browse PYQs
              </Link>
            </div>

            {/* Stats Row */}
            <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="mb-1 font-serif text-2xl font-bold text-[#1A1A1A] sm:text-3xl md:text-4xl">
                    {stat.value}
                  </div>
                  <div className="text-xs font-medium text-[#9CA3AF] sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CORE FEATURES GRID
      ══════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
            &mdash;&ensp;What&apos;s Inside
          </span>
          <h2 className="font-serif text-3xl font-bold leading-tight text-[#1A1A1A] sm:text-4xl md:text-5xl">
            Six pillars of your preparation
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {CORE_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-[#E5E0DA] bg-white p-6 transition-all duration-300 hover:border-[#C4784A]/30 hover:shadow-lg hover:shadow-[#C4784A]/5 sm:rounded-3xl sm:p-8"
            >
              {/* Icon */}
              <div
                className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${feature.color}12` }}
              >
                <feature.icon
                  className="h-6 w-6"
                  style={{ color: feature.color }}
                />
              </div>

              <h3 className="mb-2 text-lg font-bold text-[#1A1A1A] sm:text-xl">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#6B7280] sm:text-[15px]">
                {feature.desc}
              </p>

              {/* Subtle corner accent on hover */}
              <div
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(circle, ${feature.color}10 0%, transparent 70%)`,
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          EXAM MODE SHOWCASE
      ══════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: Copy */}
          <div>
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
              &mdash;&ensp;Exam Simulation
            </span>
            <h2 className="mb-5 font-serif text-3xl font-bold leading-tight text-[#1A1A1A] sm:text-4xl md:text-5xl">
              Feels exactly like
              <br />
              <span className="italic text-[#C4784A]">the real exam.</span>
            </h2>
            <p className="mb-8 max-w-md text-base leading-relaxed text-[#6B7280] sm:text-lg">
              Our exam runner replicates every detail of the UPSC Prelims
              experience — from the countdown timer to the question palette
              and negative marking rules.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {EXAM_FEATURES.map((feat) => (
                <div key={feat} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#10b981]" />
                  <span className="text-sm font-medium text-[#1A1A1A]">
                    {feat}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/app/pyq"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#C4784A] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#B06838]"
            >
              Try a Practice Session
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right: Exam mockup */}
          <div className="rounded-2xl bg-[#1C1C1C] p-5 shadow-2xl sm:rounded-3xl sm:p-7">
            {/* Header bar */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-[#ef4444]" />
                <div className="h-3 w-3 rounded-full bg-[#eab308]" />
                <div className="h-3 w-3 rounded-full bg-[#10b981]" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#666]">
                Exam Mode
              </span>
            </div>

            {/* Timer + progress */}
            <div className="mb-5 flex items-center justify-between rounded-xl bg-[#262626] px-4 py-3">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-[#C4784A]" />
                <span className="text-sm font-bold text-[#C4784A]">
                  01:42:16
                </span>
              </div>
              <span className="text-xs font-medium text-[#888]">
                Q 42 of 100
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#10b981]">● 38</span>
                <span className="text-[10px] text-[#eab308]">● 3</span>
                <span className="text-[10px] text-[#666]">● 59</span>
              </div>
            </div>

            {/* Question */}
            <p className="mb-5 text-[15px] leading-relaxed text-[#E5E7EB]">
              Consider the following statements about the 73rd Constitutional
              Amendment:
            </p>
            <div className="mb-4 space-y-1 rounded-xl bg-[#262626] p-4 text-sm text-[#C8C8C8]">
              <p>1. It mandates regular elections to Panchayats.</p>
              <p>2. It reserves seats for SCs and STs.</p>
              <p>3. It provides for a State Finance Commission.</p>
            </div>
            <p className="mb-5 text-sm font-medium text-[#E5E7EB]">
              Which of the above statements is/are correct?
            </p>

            {/* Options */}
            <div className="space-y-2.5">
              {["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"].map(
                (opt, i) => (
                  <div
                    key={opt}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
                      i === 3
                        ? "border-[#C4784A] bg-[#C4784A]/10 text-white"
                        : "border-[#333] text-[#999] hover:border-[#555]"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        i === 3 ? "border-[#C4784A]" : "border-[#555]"
                      }`}
                    >
                      {i === 3 && (
                        <div className="h-2.5 w-2.5 rounded-full bg-[#C4784A]" />
                      )}
                    </div>
                    <span>
                      {String.fromCharCode(65 + i)}) {opt}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* Bottom bar */}
            <div className="mt-6 flex items-center justify-between border-t border-[#333] pt-4">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#666]">
                ← Previous
              </span>
              <span className="rounded-lg bg-[#C4784A]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#C4784A]">
                Mark for Review
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-white">
                Next →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PRACTICE MODES
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-[#F5F0E8] to-[#FAF7F2]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
              &mdash;&ensp;Practice Modes
            </span>
            <h2 className="mb-4 font-serif text-3xl font-bold leading-tight text-[#1A1A1A] sm:text-4xl md:text-5xl">
              Six ways to practice
            </h2>
            <p className="text-base text-[#6B7280] sm:text-lg">
              Whether you want a quick 25-question drill or a full 2-hour
              simulation, there&apos;s a mode for your schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRACTICE_MODES.map((mode) => (
              <Link
                key={mode.title}
                href={mode.href}
                className="group flex items-start gap-4 rounded-2xl border border-[#E5E0DA] bg-white p-5 transition-all duration-300 hover:border-[#C4784A]/30 hover:shadow-md sm:p-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C4784A]/8 transition-colors group-hover:bg-[#C4784A]/15">
                  <mode.icon className="h-5 w-5 text-[#C4784A]" />
                </div>
                <div>
                  <h3 className="mb-1 text-base font-bold text-[#1A1A1A] group-hover:text-[#C4784A] transition-colors">
                    {mode.title}
                  </h3>
                  <p className="text-sm text-[#6B7280]">{mode.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ANALYTICS SHOWCASE
      ══════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: Dark analytics mockup */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl bg-[#1C1C1C] p-5 shadow-2xl sm:rounded-3xl sm:p-7">
              {/* Browser dots */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-[#ef4444]" />
                  <div className="h-3 w-3 rounded-full bg-[#eab308]" />
                  <div className="h-3 w-3 rounded-full bg-[#10b981]" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#666]">
                  Analytics Dashboard
                </span>
              </div>

              {/* Score cards */}
              <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl bg-[#262626] p-3 sm:p-4">
                  <div className="mb-1 text-[10px] text-[#888] sm:text-[11px]">Score</div>
                  <div className="font-serif text-xl font-bold text-white sm:text-2xl">
                    118.67
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-[#10b981]">
                    <TrendingUp className="h-3 w-3" /> +12.5
                  </div>
                </div>
                <div className="rounded-xl border border-[#C4784A]/30 bg-[#C4784A]/10 p-3 sm:p-4">
                  <div className="mb-1 text-[10px] text-[#C4784A] sm:text-[11px]">Accuracy</div>
                  <div className="font-serif text-xl font-bold text-[#C4784A] sm:text-2xl">
                    76.4%
                  </div>
                  <div className="mt-1 text-[10px] text-[#C4784A]/60">
                    Cutoff Ready
                  </div>
                </div>
                <div className="rounded-xl bg-[#262626] p-3 sm:p-4">
                  <div className="mb-1 text-[10px] text-[#888] sm:text-[11px]">Tests</div>
                  <div className="font-serif text-xl font-bold text-white sm:text-2xl">
                    24
                  </div>
                  <div className="mt-1 text-[10px] text-[#888]">
                    This month
                  </div>
                </div>
              </div>

              {/* Bar chart */}
              <div className="mb-5 rounded-xl bg-[#262626] p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#888]">
                    Score Trajectory
                  </span>
                  <span className="text-[10px] text-[#555]">Last 12 tests</span>
                </div>
                <div className="flex h-24 items-end gap-1.5 sm:h-28 sm:gap-2">
                  {[35, 42, 50, 48, 60, 55, 68, 72, 65, 78, 85, 92].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t transition-all duration-700"
                        style={{
                          height: `${h}%`,
                          backgroundColor:
                            i === 11
                              ? "#C4784A"
                              : i >= 9
                              ? "#C4784A80"
                              : "#3a3a3a",
                        }}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Subject bars */}
              <div className="space-y-3">
                {[
                  { subject: "Polity", score: 88, color: "#10b981" },
                  { subject: "Geography", score: 76, color: "#0ea5e9" },
                  { subject: "Economics", score: 72, color: "#C4784A" },
                  { subject: "Environment", score: 64, color: "#eab308" },
                  { subject: "History", score: 55, color: "#ef4444" },
                ].map((s) => (
                  <div key={s.subject}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-[#888]">{s.subject}</span>
                      <span className="font-bold" style={{ color: s.color }}>
                        {s.score}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#333]">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${s.score}%`,
                          backgroundColor: s.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Copy */}
          <div className="order-1 lg:order-2">
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
              &mdash;&ensp;Smart Analytics
            </span>
            <h2 className="mb-5 font-serif text-3xl font-bold leading-tight text-[#1A1A1A] sm:text-4xl md:text-5xl">
              Know exactly where
              <br />
              <span className="italic text-[#C4784A]">you stand.</span>
            </h2>
            <p className="mb-8 max-w-md text-base leading-relaxed text-[#6B7280] sm:text-lg">
              Every test builds your profile. Track your score trajectory,
              identify weak subjects, monitor pacing patterns, and see your
              readiness band evolve over time.
            </p>

            <div className="space-y-4">
              {[
                {
                  icon: BarChart3,
                  title: "Subject-wise Breakdown",
                  desc: "See accuracy per subject with color-coded performance bars.",
                },
                {
                  icon: TrendingUp,
                  title: "Score Trajectory",
                  desc: "Visual chart of your scores over time — spot trends instantly.",
                },
                {
                  icon: Target,
                  title: "Readiness Bands",
                  desc: "From 'Foundation Build' to 'Interview Zone' — know your cutoff status.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-2xl border border-[#E5E0DA] bg-white p-4 sm:p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C4784A]/8">
                    <item.icon className="h-5 w-5 text-[#C4784A]" />
                  </div>
                  <div>
                    <h4 className="mb-0.5 text-sm font-bold text-[#1A1A1A]">
                      {item.title}
                    </h4>
                    <p className="text-sm text-[#6B7280]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          GEOGRAPHY LAB + COMMUNITY
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E8]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Geography Lab Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#E5E0DA] bg-white p-6 sm:rounded-3xl sm:p-8">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#0ea5e9]/5" />
              <div className="relative">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0ea5e9]/10">
                  <Map className="h-6 w-6 text-[#0ea5e9]" />
                </div>
                <h3 className="mb-3 font-serif text-2xl font-bold text-[#1A1A1A] sm:text-3xl">
                  Geography Lab
                </h3>
                <p className="mb-6 max-w-sm text-sm leading-relaxed text-[#6B7280] sm:text-[15px]">
                  Interactive high-resolution maps with spotlight mode for
                  mountain ranges, flowing river visualizations, national
                  parks, and important passes — all searchable and explorable.
                </p>

                {/* Mini feature list */}
                <div className="mb-6 grid grid-cols-2 gap-2">
                  {[
                    "Himalayan Ranges",
                    "Major Rivers",
                    "National Parks",
                    "Mountain Passes",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 rounded-lg bg-[#0ea5e9]/5 px-3 py-2 text-xs font-medium text-[#0ea5e9]"
                    >
                      <Globe2 className="h-3.5 w-3.5" />
                      {f}
                    </div>
                  ))}
                </div>

                <Link
                  href="/app/geography"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#0ea5e9] transition-colors hover:text-[#0284c7]"
                >
                  Explore the Geography Lab
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Community Forum Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#E5E0DA] bg-white p-6 sm:rounded-3xl sm:p-8">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#f59e0b]/5" />
              <div className="relative">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f59e0b]/10">
                  <MessageSquare className="h-6 w-6 text-[#f59e0b]" />
                </div>
                <h3 className="mb-3 font-serif text-2xl font-bold text-[#1A1A1A] sm:text-3xl">
                  Community Forum
                </h3>
                <p className="mb-6 max-w-sm text-sm leading-relaxed text-[#6B7280] sm:text-[15px]">
                  Reddit-style communities dedicated to UPSC prep. Discuss
                  strategies, share doubts, upvote answers, and learn from
                  fellow aspirants across topic-specific spaces.
                </p>

                {/* Mini community list */}
                <div className="mb-6 grid grid-cols-2 gap-2">
                  {[
                    "c/polity",
                    "c/current-affairs",
                    "c/geography",
                    "c/upsc-journey",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 rounded-lg bg-[#f59e0b]/5 px-3 py-2 text-xs font-medium text-[#f59e0b]"
                    >
                      <Users className="h-3.5 w-3.5" />
                      {f}
                    </div>
                  ))}
                </div>

                <Link
                  href="/app/forum"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#f59e0b] transition-colors hover:text-[#d97706]"
                >
                  Join the Community
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          AI-ENRICHED QUESTIONS
      ══════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: Copy */}
          <div>
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
              &mdash;&ensp;AI-Enriched Questions
            </span>
            <h2 className="mb-5 font-serif text-3xl font-bold leading-tight text-[#1A1A1A] sm:text-4xl md:text-5xl">
              Every question is a
              <br />
              <span className="italic text-[#C4784A]">learning moment.</span>
            </h2>
            <p className="mb-8 max-w-md text-base leading-relaxed text-[#6B7280] sm:text-lg">
              Each of our 10,000+ questions has been processed by AI to
              include difficulty ratings, topic tags, NCERT class references,
              mnemonic hints, and detailed explanations.
            </p>

            <div className="space-y-3">
              {[
                "Detailed explanations for every option — not just the correct one",
                "Difficulty ratings: Easy, Moderate, Hard",
                "Topic and sub-topic classification for targeted revision",
                "NCERT class references to go back to basics",
                "Mnemonic hints for tricky factual questions",
                "Keywords and concepts extracted for quick revision",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#C4784A]" />
                  <span className="text-sm text-[#4B5563]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Question detail mockup */}
          <div className="rounded-2xl bg-[#1C1C1C] p-5 shadow-2xl sm:rounded-3xl sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-[#ef4444]" />
                <div className="h-3 w-3 rounded-full bg-[#eab308]" />
                <div className="h-3 w-3 rounded-full bg-[#10b981]" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#666]">
                Question Detail
              </span>
            </div>

            {/* Tags */}
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#6366f1]/15 px-3 py-1 text-[10px] font-bold text-[#818cf8]">
                Polity
              </span>
              <span className="rounded-full bg-[#eab308]/15 px-3 py-1 text-[10px] font-bold text-[#eab308]">
                Moderate
              </span>
              <span className="rounded-full bg-[#10b981]/15 px-3 py-1 text-[10px] font-bold text-[#10b981]">
                PYQ 2023
              </span>
              <span className="rounded-full bg-[#888]/15 px-3 py-1 text-[10px] font-bold text-[#888]">
                NCERT: Class 11
              </span>
            </div>

            {/* Correct answer indicator */}
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#10b981]/10 px-4 py-3 text-sm text-[#10b981]">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-bold">Correct Answer: D) 1, 2 and 3</span>
            </div>

            {/* Explanation */}
            <div className="mb-4 rounded-xl bg-[#262626] p-4">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#C4784A]">
                Explanation
              </div>
              <p className="text-sm leading-relaxed text-[#C8C8C8]">
                The 73rd Amendment Act of 1992 added Part IX to the Constitution.
                It mandates regular elections (Art 243E), reserves seats for SCs/STs
                proportional to their population (Art 243D), and establishes a State
                Finance Commission every five years (Art 243I).
              </p>
            </div>

            {/* Mnemonic */}
            <div className="mb-4 rounded-xl bg-[#262626] p-4">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#f59e0b]">
                💡 Mnemonic Hint
              </div>
              <p className="text-sm text-[#C8C8C8]">
                &quot;ERS&quot; — Elections, Reservations, State Finance Commission
              </p>
            </div>

            {/* Concepts */}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg bg-[#333] px-3 py-1.5 text-[10px] font-medium text-[#888]">
                Panchayati Raj
              </span>
              <span className="rounded-lg bg-[#333] px-3 py-1.5 text-[10px] font-medium text-[#888]">
                73rd Amendment
              </span>
              <span className="rounded-lg bg-[#333] px-3 py-1.5 text-[10px] font-medium text-[#888]">
                Local Governance
              </span>
              <span className="rounded-lg bg-[#333] px-3 py-1.5 text-[10px] font-medium text-[#888]">
                Art 243
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TRUST STRIP
      ══════════════════════════════════════════════════════════════ */}
      <section className="border-y border-[#E5E0DA] bg-white/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
            {[
              { icon: Shield, title: "No Paywall", desc: "Every feature is 100% free. No premium tier, no trial." },
              { icon: Zap, title: "No Signup Required", desc: "Start practicing instantly. Create an account only if you want cloud sync." },
              { icon: Globe2, title: "Open Source", desc: "Transparent codebase. Built by aspirants, for aspirants." },
              { icon: Sparkles, title: "AI-Powered", desc: "10,000+ questions enriched with AI-generated explanations and metadata." },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C4784A]/8">
                  <item.icon className="h-6 w-6 text-[#C4784A]" />
                </div>
                <h4 className="mb-1 text-sm font-bold text-[#1A1A1A]">
                  {item.title}
                </h4>
                <p className="text-xs leading-relaxed text-[#6B7280]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-5 font-serif text-3xl font-bold leading-[1.06] text-[#1A1A1A] sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl">
            Start with one
            <br />
            <span className="italic text-[#C4784A]">test today.</span>
          </h2>
          <p className="mx-auto mb-8 max-w-md text-base text-[#6B7280] sm:mb-10 sm:text-lg">
            No signup needed. Pick a year, take the test, see where you stand.
            Your UPSC journey starts with a single question.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/app"
              className="group flex items-center gap-2 rounded-full bg-[#C4784A] px-10 py-5 text-base font-bold text-white transition-all hover:bg-[#B06838] hover:shadow-lg hover:shadow-[#C4784A]/20 sm:text-lg"
            >
              Start Practicing
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/app/pyq"
              className="rounded-full border-2 border-[#1A1A1A] px-10 py-5 text-base font-bold text-[#1A1A1A] transition-all hover:bg-[#1A1A1A] hover:text-white sm:text-lg"
            >
              Browse 1,200+ PYQs
            </Link>
          </div>
          <p className="mt-5 text-sm text-[#9CA3AF]">
            No paywall. No trial period. Full access, always free.
          </p>
        </div>
      </section>
    </div>
  );
}
