import Link from "next/link";

const pillars = [
  {
    title: "Exam mode",
    desc: "Palette navigation, mark for review, strike-out eliminator, highlighted stem lines, and real timer pressure.",
  },
  {
    title: "Review mode",
    desc: "Each question resolves into answer status, explanation, and notebook takeaway. Text-first, no video.",
  },
  {
    title: "Analytics mode",
    desc: "Readiness band, subject radar, pacing scatter, and topic heatmap that surfaces weak areas.",
  },
];

export default function PlatformPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="py-16">
        <p className="text-sm font-semibold text-[var(--accent)]">Platform</p>
        <h1 className="heading mt-3 max-w-2xl text-3xl md:text-4xl">
          One product, three interfaces, zero wasted motion
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
          Simulate cleanly, review deeply, analyze selectively. You should never
          feel all three modes at once.
        </p>
      </section>

      <div className="grid gap-4 pb-12 md:grid-cols-3">
        {pillars.map((p) => (
          <div key={p.title} className="card p-5">
            <p className="text-sm font-semibold text-[var(--foreground)]">{p.title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{p.desc}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-4 border-t border-[var(--border)] py-12 md:grid-cols-2">
        <div className="card p-5">
          <p className="label">Interaction patterns</p>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--muted)]">
            <li>Question palette with visited, answered, and marked states</li>
            <li>Option eliminator for Boolean-style UPSC MCQs</li>
            <li>Line-level highlighting for prompt focus</li>
            <li>Negative marking in mock result calculation</li>
            <li>One-click notebook capture from post-test review</li>
          </ul>
        </div>

        <div className="card p-5">
          <p className="label">Architecture</p>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Built with Next.js and Supabase. Questions stored in PostgreSQL with
            RLS. Auth via Google OAuth or email. Deployed on Vercel.
          </p>
          <Link
            href="/app"
            className="mt-5 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            Open app
          </Link>
        </div>
      </section>
    </div>
  );
}
