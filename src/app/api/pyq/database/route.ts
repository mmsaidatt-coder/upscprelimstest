import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages";
import type { SearchablePyqQuestion } from "@/lib/supabase/questions";

const SEARCHABLE_PYQ_SELECT = `
  id, prompt, options, correct_option_id, year, subject,
  topic, sub_topic, keywords, question_type, concepts,
  importance, difficulty_rationale, mnemonic_hint, ncert_class
`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "0"));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? "0")));
  const paginated = page > 0 && limit > 0;

  try {
    const supabase = createAdminClient();

    if (paginated) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const [{ count }, { data, error }] = await Promise.all([
        supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("source", "pyq"),
        supabase
          .from("questions")
          .select(SEARCHABLE_PYQ_SELECT)
          .eq("source", "pyq")
          .order("year", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to),
      ]);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        count: data?.length ?? 0,
        total: count ?? 0,
        page,
        limit,
        hasMore: to < (count ?? 0) - 1,
        questions: data ?? [],
      });
    }

    // Default: return all (backward compatible for PyqDatabaseView)
    const questions = await fetchAllPages<SearchablePyqQuestion>({
      runPage: async (from, to) =>
        await supabase
          .from("questions")
          .select(SEARCHABLE_PYQ_SELECT)
          .eq("source", "pyq")
          .order("year", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to),
    });

    return NextResponse.json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("PYQ Database API Error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
