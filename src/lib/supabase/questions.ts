import { unstable_cache } from "next/cache";
import { createAdminClient } from "./admin";
import { fetchAllPages } from "./fetch-all-pages";
import type { ExamQuestion, Subject, PyqQuestion } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

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

type CustomQuestionMeta = {
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

const CUSTOM_EXAM_SOURCES = ["pyq", "custom", "flt"];

const getCachedCustomQuestionMeta = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    return await fetchAllPages<CustomQuestionMeta>({
      runPage: async (from, to) =>
        await supabase
          .from("questions")
          .select("id, subject")
          .in("source", CUSTOM_EXAM_SOURCES)
          .order("id", { ascending: true })
          .range(from, to),
    });
  },
  ["custom-exam-question-meta-v1"],
  { revalidate: 300 },
);

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
    year: row.year ?? null,
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

export async function fetchQuestionById(id: string): Promise<PyqQuestion | null> {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from("questions")
      .select(`
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
        source_label,
        topic,
        sub_topic,
        keywords
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error(
        "Failed to fetch question by ID:",
        error ? error.message : "Not found"
      );
      return null;
    }

    const examQ = toExamQuestion(data as DbQuestion);
    return {
      ...examQ,
      year: data.year as number,
      topics: [
        data.topic,
        data.sub_topic,
        ...(data.keywords || []),
      ].filter(Boolean) as string[],
      sourceLabel: data.source_label as string | undefined,
    };
  } catch (error) {
    console.error(
      "Failed to fetch question by ID:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

export async function fetchAllQuestionIds(): Promise<string[]> {
  const supabase = createAdminClient();

  try {
    const data = await fetchAllPages<{ id: string }>({
      runPage: async (from, to) =>
        await supabase
          .from("questions")
          .select("id")
          .eq("source", "pyq")
          .order("id", { ascending: true })
          .range(from, to),
    });

    return data.map((row) => row.id);
  } catch (error) {
    console.error(
      "Failed to fetch all question IDs:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return [];
  }
}

export type CustomTestMode = "single_subject" | "mixed" | "upsc_flt";

export interface CustomTestConfig {
  mode: CustomTestMode;
  size: number;
  subject?: Subject;
}

async function fetchCustomExamQuestionIdsWithMetadataFallback(
  config: CustomTestConfig,
) {
  let allMeta: CustomQuestionMeta[];
  try {
    allMeta = await getCachedCustomQuestionMeta();
  } catch (error) {
    console.error(
      "Failed to fetch custom exam metadata:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return [];
  }

  if (!allMeta.length) return [];

  // Group by Subject
  const subjectMap = new Map<string, string[]>();
  for (const m of allMeta) {
    if (!subjectMap.has(m.subject)) subjectMap.set(m.subject, []);
    subjectMap.get(m.subject)!.push(m.id);
  }

  let selectedIds: string[] = [];

  if (config.mode === "single_subject" && config.subject) {
    const available = shuffle(subjectMap.get(config.subject) || []);
    selectedIds = available.slice(0, config.size);
  } else if (config.mode === "mixed") {
    const allIds = shuffle(allMeta.map((m) => m.id));
    selectedIds = allIds.slice(0, config.size);
  } else if (config.mode === "upsc_flt") {
    const distribution: Record<string, number> = {
      History: 0.18,
      Geography: 0.15,
      Polity: 0.15,
      Economy: 0.15,
      Environment: 0.15,
      Science: 0.07,
      "Current Affairs": 0.15,
    };

    for (const [subj, percentage] of Object.entries(distribution)) {
      const allocCount = Math.round(percentage * config.size);
      const available = shuffle(subjectMap.get(subj) || []);
      selectedIds.push(...available.slice(0, allocCount));
    }

    selectedIds = shuffle(selectedIds);
    if (selectedIds.length > config.size) {
      selectedIds = selectedIds.slice(0, config.size);
    } else if (selectedIds.length < config.size) {
      const padding = config.size - selectedIds.length;
      const selectedIdSet = new Set(selectedIds);
      const remaining = shuffle(
        allMeta.map((m) => m.id).filter((id) => !selectedIdSet.has(id)),
      );
      selectedIds.push(...remaining.slice(0, padding));
    }
  }

  if (!selectedIds.length) return [];

  return selectedIds;
}

async function fetchCustomExamQuestionIds(
  supabase: SupabaseClient,
  config: CustomTestConfig,
) {
  const { data, error } = await supabase
    .rpc("get_custom_exam_question_ids", {
      p_mode: config.mode,
      p_size: config.size,
      p_subject: config.subject ?? null,
    });

  if (error) {
    console.warn(
      "Falling back to app-side custom exam sampling:",
      error.message,
    );
    return fetchCustomExamQuestionIdsWithMetadataFallback(config);
  }

  const selectedIds = Array.isArray(data)
    ? data
        .map((row) => (typeof row?.id === "string" ? row.id : null))
        .filter((id): id is string => Boolean(id))
    : [];
  if (selectedIds.length) return selectedIds;

  return fetchCustomExamQuestionIdsWithMetadataFallback(config);
}

export async function fetchCustomExamSession(config: CustomTestConfig): Promise<ExamQuestion[]> {
  const supabase = createAdminClient();
  const selectedIds = await fetchCustomExamQuestionIds(supabase, config);

  if (!selectedIds.length) return [];

  // 2. Safely fetch only the randomly targeted full payloads using single efficient network call
  let finalQuestions: DbQuestion[] = [];
  const CHUNK_SIZE = 200;

  for (let i = 0; i < selectedIds.length; i += CHUNK_SIZE) {
    const chunk = selectedIds.slice(i, i + CHUNK_SIZE);
    const { data: chunkData, error: chunkError } = await supabase
      .from("questions")
      .select(EXAM_QUESTION_SELECT)
      .in("id", chunk);

    if (chunkError) {
      console.error("Failed to fetch custom exam chunk:", chunkError.message);
      return [];
    }

    if (chunkData) finalQuestions.push(...chunkData);
  }

  return shuffle(finalQuestions.map(toExamQuestion));
}
