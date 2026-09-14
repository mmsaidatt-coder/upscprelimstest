import type { Metadata } from "next";
import { GeographyLab } from "@/components/geography/geography-lab";

export const metadata: Metadata = {
  title: "India Field Atlas | UPSC Geography Practice",
  description:
    "Explore India through interactive rivers, mountain systems, passes, protected areas, map quizzes, and spaced repetition for UPSC Prelims.",
};

export default function GeographyPage() {
  return <GeographyLab />;
}
