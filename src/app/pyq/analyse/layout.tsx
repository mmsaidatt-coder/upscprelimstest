import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UPSC PYQ Year Analysis",
  robots: { index: false, follow: true },
};

export default function PyqAnalyseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
