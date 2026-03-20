import { createAdminClient } from "./admin";
import type { ExamQuestion, Subject } from "@/lib/types";

type DbQuestion = {
  id: string;
  source: string;
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
    [arr[i], arr[j]] = [arr[j], arr[i]];
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

  let query = supabase
    .from("questions")
    .select("*")
    .eq("source", "pyq");

  if (opts.year) {
    query = query.eq("year", opts.year);
  }
  if (opts.subject) {
    query = query.eq("subject", opts.subject);
  }

  const { data, error } = await query.order("year", { ascending: false });

  if (error) {
    console.error("Failed to fetch questions:", error.message);
    return [];
  }

  let questions = (data as DbQuestion[]).map(toExamQuestion);

  if (opts.shuffle) {
    questions = shuffle(questions);
  }

  if (opts.limit && opts.limit < questions.length) {
    questions = questions.slice(0, opts.limit);
  }

  return questions;
}

export async function fetchYearCounts(): Promise<{ year: number; count: number }[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("questions")
    .select("year")
    .eq("source", "pyq")
    .not("year", "is", null);

  if (error || !data) return [];

  const counts = new Map<number, number>();
  for (const row of data) {
    const year = row.year as number;
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year - a.year);
}

export async function fetchSubjectCounts(): Promise<{ subject: Subject; count: number }[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("questions")
    .select("subject")
    .eq("source", "pyq");

  if (error || !data) return [];

  const counts = new Map<string, number>();
  for (const row of data) {
    counts.set(row.subject, (counts.get(row.subject) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([subject, count]) => ({ subject: subject as Subject, count }))
    .sort((a, b) => b.count - a.count);
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
