import { createAdminClient } from "./admin";
import { fetchAllPages } from "./fetch-all-pages";
import type { ExamQuestion, Subject } from "@/lib/types";

type DbQuestion = {
  id: string;
  subject: string;
  difficulty: string;
  prompt: string;
  context_lines: string[] | null;
  options: { id: string; text: string }[];
  correct_option_id: string | null;
  explanation: string | null;
  takeaway: string | null;
  marks: number;
  negative_marks: number;
  year: number | null;
  source_label: string | null;
};

export type SearchablePyqQuestion = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correct_option_id: string | null;
  year: number | null;
  subject: string;
  topic?: string | null;
  sub_topic?: string | null;
  keywords?: string[] | null;
  question_type?: string | null;
  concepts?: string[] | null;
  importance?: string | null;
  difficulty_rationale?: string | null;
  mnemonic_hint?: string | null;
  ncert_class?: string | null;
};

type CountYearRow = {
  id: string;
  year: number;
};

type CountSubjectRow = {
  id: string;
  subject: string;
};

const EXAM_QUESTION_SELECT = `
  id,
  subject,
  difficulty,
  prompt,
  context_lines,
  options,
  correct_option_id,
  explanation,
  takeaway,
  marks,
  negative_marks,
  year,
  source_label
`;

const SEARCHABLE_PYQ_SELECT = `
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
`;

function toExamQuestion(row: DbQuestion): ExamQuestion {
  return {
    id: row.id,
    subject: row.subject as Subject,
    difficulty: row.difficulty as ExamQuestion["difficulty"],
    prompt: row.prompt.replace(/^\d+\.[\s]*/, ''),
    contextLines: row.context_lines?.length ? row.context_lines : undefined,
    options: (row.options as any[]).map((opt, i) => {
      if (typeof opt === 'string') {
        const id = String.fromCharCode(65 + i); // 'A', 'B', 'C', etc.
        const text = opt.replace(/^\(?[a-dA-D]\)?[\s.]*/, '').trim();
        return { id, text: text || opt };
      }
      return opt;
    }),
    correctOptionId: (row.correct_option_id as ExamQuestion["correctOptionId"]) ?? undefined,
    explanation: row.explanation ?? undefined,
    takeaway: row.takeaway ?? undefined,
    marks: Number(row.marks),
    negativeMarks: Number(row.negative_marks),
  };
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export async function fetchQuestions(opts: {
  year?: number;
  subject?: Subject;
  limit?: number;
  shuffle?: boolean;
}): Promise<ExamQuestion[]> {
  const supabase = createAdminClient();

  try {
    const data = await fetchAllPages<DbQuestion>({
      runPage: async (from, to) => {
        let query = supabase
          .from("questions")
          .select(EXAM_QUESTION_SELECT)
          .eq("source", "pyq");

        if (opts.year) {
          query = query.eq("year", opts.year);
        }
        if (opts.subject) {
          query = query.eq("subject", opts.subject);
        }

        return await query
          .order("year", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to);
      },
    });

    let questions = data.map(toExamQuestion);

    if (opts.shuffle) {
      questions = shuffle(questions);
    }

    if (opts.limit && opts.limit < questions.length) {
      questions = questions.slice(0, opts.limit);
    }

    return questions;
  } catch (error) {
    console.error(
      "Failed to fetch questions:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return [];
  }
}

export async function fetchYearCounts(): Promise<{ year: number; count: number }[]> {
  const supabase = createAdminClient();

  try {
    const data = await fetchAllPages<CountYearRow>({
      runPage: async (from, to) =>
        await supabase
          .from("questions")
          .select("id, year")
          .eq("source", "pyq")
          .not("year", "is", null)
          .order("id", { ascending: true })
          .range(from, to),
    });

    const counts = new Map<number, number>();
    for (const row of data) {
      counts.set(row.year, (counts.get(row.year) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year - a.year);
  } catch (error) {
    console.error(
      "Failed to fetch PYQ year counts:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return [];
  }
}

export async function fetchSubjectCounts(): Promise<{ subject: Subject; count: number }[]> {
  const supabase = createAdminClient();

  try {
    const data = await fetchAllPages<CountSubjectRow>({
      runPage: async (from, to) =>
        await supabase
          .from("questions")
          .select("id, subject")
          .eq("source", "pyq")
          .order("id", { ascending: true })
          .range(from, to),
    });

    const counts = new Map<string, number>();
    for (const row of data) {
      counts.set(row.subject, (counts.get(row.subject) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([subject, count]) => ({ subject: subject as Subject, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error(
      "Failed to fetch PYQ subject counts:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return [];
  }
}

export async function fetchTotalCount(): Promise<number> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("source", "pyq");

  if (error) return 0;
  return count ?? 0;
}

export async function fetchSearchablePyqQuestions(): Promise<SearchablePyqQuestion[]> {
  const supabase = createAdminClient();

  try {
    return await fetchAllPages<SearchablePyqQuestion>({
      runPage: async (from, to) =>
        await supabase
          .from("questions")
          .select(SEARCHABLE_PYQ_SELECT)
          .eq("source", "pyq")
          .order("year", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to),
    });
  } catch (error) {
    console.error(
      "Failed to fetch searchable PYQs:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return [];
  }
}
