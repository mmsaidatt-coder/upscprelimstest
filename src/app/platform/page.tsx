import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenText,
  Check,
  Clock3,
  Database,
  Globe2,
  Layers3,
  Map,
  MessageSquareText,
  MoveUpRight,
  Search,
  Target,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Platform Features — Exam Mode, Review & Analytics | UPSC Prelims Test",
  description:
    "Discover the complete UPSC Prelims practice platform: timed exam simulations, 10,000+ AI-enriched questions, subject-wise drills, interactive Geography Lab, performance analytics, and community forum. 100% free.",
  alternates: { canonical: "https://upscprelimstest.com/platform" },
  openGraph: {
    title: "Platform Features — UPSC Prelims Test",
    description:
      "Free UPSC Prelims practice platform with exam simulation, 10,000+ questions, analytics, Geography Lab, and community forum.",
    url: "https://upscprelimstest.com/platform",
  },
};

const features = [
  {
    icon: Clock3,
    title: "Exam simulation",
    label: "Pressure",
    description: "Countdown, negative marking, question palette, mark-for-review, auto-submit, and a mobile exam flow built for long sessions.",
  },
  {
    icon: Database,
    title: "Question bank",
    label: "Depth",
    description: "1,199 solved PYQs sit inside a 10,000+ question practice system with explanations, topics, and difficulty context.",
  },
  {
    icon: BarChart3,
    title: "Performance review",
    label: "Evidence",
    description: "Subject accuracy, pacing, score movement, readiness bands, and question-level review turn attempts into next actions.",
  },
  {
    icon: Globe2,
    title: "Geography Lab",
    label: "Spatial memory",
    description: "Explore Indian rivers, mountain systems, national parks, states, and physical features on an interactive map.",
  },
  {
    icon: MessageSquareText,
    title: "Community forum",
    label: "Discussion",
    description: "Ask focused questions, compare approaches, and discuss preparation within subject-based communities.",
  },
  {
    icon: BookOpenText,
    title: "PYQ intelligence",
    label: "Pattern",
    description: "Move from paper to subject to topic, with multi-year hubs that reveal repetition without inventing false certainty.",
  },
];

const modes = [
  ["01", "Previous papers", "Year-wise, subject-wise, and searchable PYQs", "/pyq", BookOpenText],
  ["02", "Full-length test", "100 questions with a UPSC-like subject ratio", "/free-upsc-prelims-mock-test", Clock3],
  ["03", "Subject drill", "Focused 25Q and 50Q feedback loops", "/subject-wise", Target],
  ["04", "Custom paper", "Choose size, mode, and subject mix", "/app/design-paper", Layers3],
  ["05", "Current affairs", "Repository-backed exam-style question sets", "/current-affairs", Search],
  ["06", "Geography Lab", "Learn features through an interactive spatial canvas", "/app/geography", Map],
] as const;

function RunnerPreview() {
  return (
    <div className="border border-[var(--border)] bg-[var(--background-secondary)] p-5 sm:p-7">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
        <span>Session / 100Q</span>
        <span className="flex items-center gap-2 text-[var(--foreground)]"><span className="signal-dot" /> 01:42:18</span>
      </div>
      <div className="py-7">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Q42 / Environment</p>
        <p className="mt-5 max-w-xl text-base font-medium leading-7 text-[var(--foreground)] sm:text-lg">
          Which of the following statements best explains the ecological significance of a wetland buffer zone?
        </p>
        <div className="mt-6 space-y-2">
          {["It isolates all human activity", "It moderates runoff and habitat disturbance", "It raises water salinity", "It replaces the wetland core"].map((option, index) => (
            <div key={option} className={`flex min-h-12 items-center gap-3 border px-4 text-sm ${index === 1 ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--foreground)]" : "border-[var(--border)] text-[var(--muted)]"}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[8px] ${index === 1 ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--muted)]"}`}>
                {index === 1 ? <Check className="h-3 w-3" strokeWidth={3} /> : String.fromCharCode(65 + index)}
              </span>
              {option}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 font-mono text-[9px] font-bold uppercase tracking-[0.14em]">
        <span className="text-[var(--muted)]">Mark / Clear</span>
        <span className="flex items-center gap-2 text-[var(--foreground)]">Next <ArrowRight className="h-3.5 w-3.5 text-[var(--accent)]" /></span>
      </div>
    </div>
  );
}

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <section className="editorial-grid overflow-hidden border-b border-[var(--border)]">
        <div className="page-shell grid min-h-[78svh] gap-14 py-16 sm:py-24 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-20 lg:py-28">
          <div>
            <p className="editorial-kicker">The complete practice system</p>
            <h1 className="display-title mt-9 max-w-[10ch]">
              Less content noise.
              <br />
              <em>More useful practice.</em>
            </h1>
            <p className="body-copy mt-8 max-w-xl">
              One free system for previous papers, simulations, focused drills, maps, analysis, and review—designed around the decisions the exam actually demands.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/app" className="action-primary">Open the workspace <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/pyq" className="action-secondary">Browse the archive</Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 border border-[var(--border-light)] sm:-inset-8" />
            <div className="relative grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
              {[
                ["10,000+", "Practice questions"],
                ["1,199", "Solved PYQs"],
                ["8", "Subject areas"],
                ["Free", "No paywall"],
              ].map(([value, label], index) => (
                <div key={label} className="min-h-36 bg-[var(--background-secondary)] p-6 sm:min-h-44">
                  <span className="index-number">0{index + 1}</span>
                  <p className="mt-8 text-4xl font-semibold tracking-[-0.06em] text-[var(--foreground)] sm:text-5xl">{value}</p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--muted)]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-20 sm:py-28 lg:py-36">
        <div className="grid gap-12 lg:grid-cols-[0.42fr_1fr] lg:gap-20">
          <div>
            <p className="editorial-kicker">Six connected layers</p>
            <h2 className="heading mt-8 text-4xl sm:text-5xl lg:text-6xl">Everything earns its place.</h2>
            <p className="body-copy mt-6 max-w-sm">Features are organized around a simple loop: choose, attempt, inspect, repeat.</p>
          </div>
          <div className="grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="group min-h-72 bg-[var(--background-secondary)] p-6 transition-colors hover:bg-[var(--background-tertiary)] sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="index-number">0{index + 1}</span>
                    <Icon className="h-5 w-5 text-[var(--muted)] group-hover:text-[var(--accent)]" strokeWidth={1.5} />
                  </div>
                  <p className="mt-10 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">{feature.label}</p>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[var(--foreground)]">{feature.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--ink)]">
        <div className="page-shell grid gap-14 py-20 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-24 lg:py-36">
          <div>
            <p className="editorial-kicker">The runner</p>
            <h2 className="heading mt-8 text-4xl sm:text-5xl lg:text-6xl">Calm interface. Real pressure.</h2>
            <p className="body-copy mt-7 max-w-xl">
              The interface stays quiet so the difficult part remains visible: deciding what you know, what you can eliminate, and what you should leave.
            </p>
            <ul className="mt-8 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
              {["Countdown + auto-submit", "UPSC negative marking", "Option eliminator", "Mark for review", "Mobile palette", "Instant result review"].map((item) => (
                <li key={item} className="flex items-center gap-3 border-t border-[var(--border)] pt-3"><Check className="h-4 w-4 text-[var(--accent)]" /> {item}</li>
              ))}
            </ul>
          </div>
          <RunnerPreview />
        </div>
      </section>

      <section className="page-shell py-20 sm:py-28 lg:py-36">
        <div className="grid gap-12 lg:grid-cols-[0.42fr_1fr] lg:gap-20">
          <div>
            <p className="editorial-kicker">Practice modes</p>
            <h2 className="heading mt-8 text-4xl sm:text-5xl">One system, many entry points.</h2>
          </div>
          <div className="border-t border-[var(--border)]">
            {modes.map(([number, title, description, href, Icon]) => (
              <Link key={number} href={href} className="group grid gap-4 border-b border-[var(--border)] py-7 sm:grid-cols-[3rem_2rem_1fr_auto] sm:items-center sm:gap-5">
                <span className="index-number">{number}</span>
                <Icon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.6} />
                <span>
                  <span className="block text-xl font-semibold tracking-[-0.035em] text-[var(--foreground)]">{title}</span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">{description}</span>
                </span>
                <MoveUpRight className="hidden h-5 w-5 text-[var(--muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)] sm:block" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)]">
        <div className="page-shell flex flex-col items-start gap-8 py-20 sm:py-28 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="editorial-kicker">Start anywhere</p>
            <h2 className="heading mt-8 max-w-3xl text-5xl sm:text-6xl lg:text-7xl">The next useful session is one click away.</h2>
          </div>
          <Link href="/app" className="action-primary shrink-0">Start practicing <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  );
}
