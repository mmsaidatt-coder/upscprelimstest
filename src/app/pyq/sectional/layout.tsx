import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UPSC PYQ Sectional Test",
  robots: { index: false, follow: true },
};

export default function PyqSectionalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
