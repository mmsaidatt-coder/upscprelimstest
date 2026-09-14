import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — UPSC Prelims Test",
  description:
    "Sign in to sync UPSC Prelims practice attempts, bookmarks, and progress across devices.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
