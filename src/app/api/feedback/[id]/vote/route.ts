import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // In Next.js 15+, params is often treated as a Promise in Route Handlers
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: feedbackId } = await params;

    // Check if the user already voted
    const { data: existingVote } = await supabase
      .from("feedback_votes")
      .select("*")
      .eq("feedback_id", feedbackId)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      // Toggle off (remove vote)
      const { error } = await supabase
        .from("feedback_votes")
        .delete()
        .eq("feedback_id", feedbackId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Remove vote error:", error);
        return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: "removed" });
    } else {
      // Toggle on (add vote)
      const { error } = await supabase
        .from("feedback_votes")
        .insert({
          feedback_id: feedbackId,
          user_id: user.id
        });

      if (error) {
        console.error("Add vote error:", error);
        return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: "added" });
    }
  } catch (error) {
    console.error("Vote API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
