import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Full Length Tests — UPSCPRELIMSTEST",
  description:
    "Take 100-question full-length tests that simulate real UPSC Prelims exam conditions with timed sessions and detailed analytics.",
};

export default function FltPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="py-16">
        <p className="text-sm font-semibold text-[var(--accent)]">FLT series</p>
        <h1 className="heading mt-3 max-w-2xl text-3xl md:text-4xl">
          Full-length tests that feel like the paper
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
          Timed sessions, palette navigation, mark-for-review, and negative
          marking — so your practice matches real decision pressure.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          Open FLTs
        </Link>
      </section>
    </div>
  );
}
