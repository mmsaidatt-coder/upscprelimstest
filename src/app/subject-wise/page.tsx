import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Subject Wise Practice — UPSCPRELIMSTEST",
  description:
    "Practice UPSC Prelims questions by subject — Polity, History, Economy, Geography, Environment, Science, and Current Affairs.",
};

export default function SubjectWisePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="py-16">
        <p className="text-sm font-semibold text-[var(--accent)]">Subject wise</p>
        <h1 className="heading mt-3 max-w-2xl text-3xl md:text-4xl">
          Practice by subject, not by guesswork
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
          Focus sessions on one subject at a time, then review and capture
          takeaways to turn mistakes into repeatable fixes.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          Start subject practice
        </Link>
      </section>
    </div>
  );
}
