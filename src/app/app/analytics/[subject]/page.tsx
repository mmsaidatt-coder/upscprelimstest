import type { Metadata } from "next";
import { AnalyticsView } from "@/components/analytics/analytics-view";

const SUBJECT_SLUGS = [
  "polity", "history", "economy", "geography", "environment", "science", "current-affairs",
];

const SLUG_LABELS: Record<string, string> = {
  polity: "Polity",
  history: "History",
  economy: "Economy",
  geography: "Geography",
  environment: "Environment",
  science: "Science",
  "current-affairs": "Current Affairs",
  all: "All Subjects",
};

export function generateStaticParams() {
  return [...SUBJECT_SLUGS, "all"].map((slug) => ({ subject: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>;
}): Promise<Metadata> {
  const { subject } = await params;
  const label = SLUG_LABELS[subject] ?? "Subject";
  return {
    title: `${label} Analytics — UPSCPRELIMSTEST`,
    description: `Track your UPSC Prelims ${label} performance — accuracy, attempts, and session history.`,
  };
}

export default async function AppAnalyticsSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <AnalyticsView subjectSlug={subject} />
    </div>
  );
}
