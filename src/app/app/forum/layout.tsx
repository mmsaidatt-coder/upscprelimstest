import { ReactNode } from "react";
import Link from "next/link";
import { MessageSquarePlus } from "lucide-react";

export const metadata = {
  title: "Community Forum | UPSC Prelims Test",
  description: "Discuss UPSC preparation, get help, and share insights.",
};

export default function ForumLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
      {children}
    </div>
  );
}
