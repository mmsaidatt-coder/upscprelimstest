import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Free UPSC Prelims Practice Platform",
  description:
    "Start practicing UPSC Prelims for free — 1,200+ PYQs, exam-grade simulations, analytics, and notebook. Pro and Institute plans coming soon.",
  alternates: {
    canonical: "https://upscprelimstest.com/pricing",
  },
  openGraph: {
    title: "Pricing — Free UPSC Prelims Practice Platform",
    description:
      "Free UPSC Prelims practice with full access to PYQs, mock tests, and analytics. No paywall.",
    url: "https://upscprelimstest.com/pricing",
  },
};

const plans = [
  {
    name: "Free",
    price: "₹0",
    note: "Everything you need to start practicing.",
    features: ["100+ PYQs with answer keys", "Exam mode + review mode", "Analytics dashboard", "Personal notebook"],
    cta: true,
  },
  {
    name: "Pro",
    price: "Coming soon",
    note: "Full mock library and advanced analytics.",
    features: ["Full PYQ bank (2012-2025)", "Original FLTs", "Performance benchmarking", "Daily digest quizzes"],
    cta: false,
  },
  {
    name: "Institute",
    price: "Custom",
    note: "For coaching centres and guided cohorts.",
    features: ["Cohort dashboards", "Admin controls", "Custom test publishing", "Branded deployment"],
    cta: false,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="py-10 sm:py-16">
        <p className="text-xs font-semibold text-[var(--accent)] sm:text-sm">Pricing</p>
        <h1 className="heading mt-2 text-2xl sm:mt-3 sm:text-3xl md:text-4xl">
          Start free, upgrade when ready
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--muted)]">
          The full practice platform is free during early access. Pro features
          will be added as the question bank grows.
        </p>
      </section>

      <div className="grid gap-4 pb-16 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className={`card p-6 ${plan.cta ? "border-[var(--accent)]" : ""}`}>
            <p className="label">{plan.name}</p>
            <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">{plan.price}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{plan.note}</p>
            <ul className="mt-5 space-y-2 text-sm text-[var(--foreground)]">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-1 text-[var(--accent)]">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
