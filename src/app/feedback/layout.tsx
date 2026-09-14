import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Feedback - UPSC Prelims Test",
  description:
    "Share product feedback, report question mistakes, and request improvements for UPSC Prelims Test.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
