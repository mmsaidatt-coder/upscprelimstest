import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UPSC PYQ Subject Analysis",
  robots: { index: false, follow: true },
};

export default function PyqSubjectAnalyseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
