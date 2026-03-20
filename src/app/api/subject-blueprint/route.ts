import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Subject } from "@/lib/types";

const SUBJECT_MAP: Record<string, Subject> = {
  "History":        "History",
  "Geography":      "Geography",
  "Economics":      "Economy",
  "Economy":        "Economy",
  "Environment":    "Environment",
  "Polity":         "Polity",
  "Science & Tech": "Science",
  "Science":        "Science",
  "Current Affairs": "Current Affairs",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject") ?? "";
  
  const dbSubject = SUBJECT_MAP[subject];
  if (!dbSubject) {
    return NextResponse.json({ topics: [], error: "Invalid params" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from("questions")
      .select("id, year, topic")
      .eq("source", "pyq")
      .eq("subject", dbSubject);

    if (error || !data) {
      throw new Error(error?.message ?? "No data");
    }

    // Build the TopicRow[]
    // Format: { topic: "Physical Geography", years: { 2024: 1, 2025: 2 } }
    const topicMap: Record<string, Record<number, number>> = {};

    data.forEach(q => {
      const year = q.year;
      const t = q.topic || "Uncategorized";
      if (!year) return;
      
      if (!topicMap[t]) {
        topicMap[t] = {};
      }
      topicMap[t][year] = (topicMap[t][year] || 0) + 1;
    });

    const topicRows = Object.entries(topicMap).map(([topic, years]) => ({
      topic,
      years
    }));

    // Sort topics by total descending
    topicRows.sort((a, b) => {
      const aTotal = Object.values(a.years).reduce((s, y) => s + y, 0);
      const bTotal = Object.values(b.years).reduce((s, y) => s + y, 0);
      return bTotal - aTotal;
    });

    return NextResponse.json({ topics: topicRows });
  } catch (err: any) {
    return NextResponse.json({ topics: [], error: err.message }, { status: 500 });
  }
}
