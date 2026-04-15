import type { Metadata } from "next";
import { GeographyLab } from "@/components/geography/geography-lab";

export const metadata: Metadata = {
  title: "Geography Lab — UPSC Prelims Test",
  description:
    "Interactive India atlas with explore, quiz, and spaced-repetition review modes. Master Indian geography for UPSC Prelims.",
};

export default function GeographyPage() {
  return <GeographyLab />;
}
