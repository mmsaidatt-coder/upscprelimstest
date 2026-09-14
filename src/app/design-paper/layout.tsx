import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom UPSC Paper Designer — Coming Soon",
  robots: { index: false, follow: true },
};

export default function DesignPaperLayout({ children }: { children: React.ReactNode }) {
  return children;
}
