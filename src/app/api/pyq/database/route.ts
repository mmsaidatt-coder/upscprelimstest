import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

  try {
    // Fetch all 1,200+ questions. 
    // We only select the fields needed for display and searching to optimize payload size.
    const { data: questions, error } = await supabase
      .from("questions")
      .select(`
        id,
        prompt,
        options,
        correct_option_id,
        year,
        subject,
        topic,
        sub_topic,
        keywords,
        question_type,
        concepts,
        importance,
        difficulty_rationale,
        mnemonic_hint,
        ncert_class
      `)
      .eq("source", "pyq")
      .order("year", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      count: questions?.length || 0,
      questions: questions || [],
    });
  } catch (err: any) {
    console.error("PYQ Database API Error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
