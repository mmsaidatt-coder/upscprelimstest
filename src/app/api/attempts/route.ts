import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { subjectOrder } from "@/lib/exam";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AttemptGrading,
  AttemptQuestionReview,
  AttemptRecord,
  QuestionOption,
  ReadinessBand,
  Subject,
  SubjectMetric,
} from "@/lib/types";

type DbAttemptRow = {
  id: string;
  test_slug: string;
  test_title: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  grading: AttemptGrading;
  score: number | string | null;
  total_marks: number | string;
  graded_question_count: number;
  graded_total_marks: number | string;
  attempted_count: number;
  correct_count: number | null;
  incorrect_count: number | null;
  unattempted_count: number;
  accuracy_percent: number | string | null;
  percentile_estimate: number | null;
  readiness_band: ReadinessBand | null;
};

type DbQuestionRow = {
  id: string;
  subject: Subject;
  prompt: string;
  context_lines: string[] | null;
  options: unknown;
  correct_option_id: QuestionOption["id"] | null;
  explanation: string | null;
  takeaway: string | null;
  marks: number | string;
  negative_marks: number | string;
};

type DbAnswerRow = {
  attempt_id: string;
  question_id: string;
  ordinal: number;
  selected_option_id: QuestionOption["id"] | null;
  is_correct: boolean | null;
  time_spent_seconds: number;
  marked_for_review: boolean;
  eliminated_option_ids: QuestionOption["id"][] | null;
  questions: DbQuestionRow | DbQuestionRow[] | null;
};

const CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const OPTION_IDS = ["A", "B", "C", "D"] as const;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function deterministicUuid(value: string) {
  const hash = createHash("sha256")
    .update(`upscprelimstest:${value}`)
    .digest("hex");
  const variant = ((Number.parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, "0");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `${variant}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

function getCloudQuestionId(questionId: string) {
  return isUuid(questionId) ? questionId : deterministicUuid(`question:${questionId}`);
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  return toNumber(value);
}

function isOptionId(value: unknown): value is QuestionOption["id"] {
  return typeof value === "string" && OPTION_IDS.includes(value as QuestionOption["id"]);
}

function normalizeOptions(value: unknown): QuestionOption[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((option, index) => {
      const fallbackId = OPTION_IDS[index] ?? "A";
      if (typeof option === "string") {
        return { id: fallbackId, text: option } satisfies QuestionOption;
      }
      if (!isRecord(option) || typeof option.text !== "string") {
        return null;
      }
      return {
        id: isOptionId(option.id) ? option.id : fallbackId,
        text: option.text,
      } satisfies QuestionOption;
    })
    .filter((option): option is QuestionOption => Boolean(option));
}

function normalizeOptionIds(value: unknown): QuestionOption["id"][] {
  if (!Array.isArray(value)) return [];
  return value.filter(isOptionId);
}

function unwrapQuestion(question: DbAnswerRow["questions"]) {
  if (Array.isArray(question)) return question[0] ?? null;
  return question;
}

function isAttemptRecord(value: unknown): value is AttemptRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isUuid(value.id) &&
    typeof value.testSlug === "string" &&
    typeof value.testTitle === "string" &&
    typeof value.startedAt === "string" &&
    typeof value.completedAt === "string" &&
    typeof value.durationSeconds === "number" &&
    Array.isArray(value.questionReviews)
  );
}

function toQuestionUpsert(review: AttemptQuestionReview) {
  return {
    id: getCloudQuestionId(review.questionId),
    source: "custom",
    subject: review.subject,
    difficulty: "Moderate",
    prompt: review.prompt,
    context_lines: review.contextLines ?? [],
    options: review.options,
    correct_option_id: review.correctOptionId ?? null,
    explanation: review.explanation || null,
    takeaway: review.takeaway || null,
    marks: 2,
    negative_marks: 0.67,
    source_label: "App practice",
  };
}

function toReview(row: DbAnswerRow): AttemptQuestionReview {
  const question = unwrapQuestion(row.questions);

  return {
    questionId: row.question_id,
    prompt: question?.prompt ?? "Question unavailable",
    contextLines: question?.context_lines?.length ? question.context_lines : undefined,
    subject: question?.subject ?? "Current Affairs",
    selectedOptionId: row.selected_option_id ?? undefined,
    correctOptionId: question?.correct_option_id ?? undefined,
    options: normalizeOptions(question?.options),
    isCorrect: row.is_correct,
    timeSpentSeconds: row.time_spent_seconds ?? 0,
    markedForReview: row.marked_for_review ?? false,
    explanation: question?.explanation ?? "",
    takeaway: question?.takeaway ?? "",
    eliminatedOptionIds: normalizeOptionIds(row.eliminated_option_ids),
  };
}

function computeSubjectMetrics(rows: DbAnswerRow[], grading: AttemptGrading): SubjectMetric[] {
  if (grading === "ungraded") return [];

  const metrics = new Map<
    Subject,
    SubjectMetric & { totalTimeSeconds: number }
  >();

  for (const row of rows) {
    const question = unwrapQuestion(row.questions);
    if (!question?.correct_option_id) continue;

    const subject = question.subject;
    const metric =
      metrics.get(subject) ??
      ({
        subject,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        score: 0,
        total: 0,
        accuracyPercent: 0,
        averageTimeSeconds: 0,
        totalTimeSeconds: 0,
      } satisfies SubjectMetric & { totalTimeSeconds: number });

    const marks = toNumber(question.marks);
    const negativeMarks = toNumber(question.negative_marks);

    metric.total += 1;
    metric.totalTimeSeconds += row.time_spent_seconds ?? 0;

    if (!row.selected_option_id) {
      metric.unattempted += 1;
    } else if (row.is_correct) {
      metric.correct += 1;
      metric.score += marks;
    } else {
      metric.incorrect += 1;
      metric.score -= negativeMarks;
    }

    metrics.set(subject, metric);
  }

  return subjectOrder
    .map((subject) => metrics.get(subject))
    .filter((metric): metric is SubjectMetric & { totalTimeSeconds: number } => Boolean(metric))
    .map(({ totalTimeSeconds, ...metric }) => ({
      ...metric,
      score: Number(metric.score.toFixed(2)),
      accuracyPercent:
        metric.correct + metric.incorrect
          ? Number(((metric.correct / (metric.correct + metric.incorrect)) * 100).toFixed(1))
          : 0,
      averageTimeSeconds: metric.total
        ? Math.round(totalTimeSeconds / metric.total)
        : 0,
    }));
}

function toAttemptRecord(row: DbAttemptRow, answerRows: DbAnswerRow[]): AttemptRecord {
  const reviews = [...answerRows]
    .sort((left, right) => left.ordinal - right.ordinal)
    .map(toReview);

  return {
    id: row.id,
    testSlug: row.test_slug,
    testTitle: row.test_title,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationSeconds: row.duration_seconds,
    grading: row.grading,
    score: toNullableNumber(row.score),
    totalMarks: toNumber(row.total_marks),
    gradedQuestionCount: row.graded_question_count,
    gradedTotalMarks: toNumber(row.graded_total_marks),
    attemptedCount: row.attempted_count,
    correctCount: row.correct_count,
    incorrectCount: row.incorrect_count,
    unattemptedCount: row.unattempted_count,
    accuracyPercent: toNullableNumber(row.accuracy_percent),
    percentileEstimate: row.percentile_estimate,
    readinessBand: row.readiness_band,
    subjectMetrics: computeSubjectMetrics(answerRows, row.grading),
    questionReviews: reviews,
  };
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401, headers: CACHE_HEADERS },
    );
  }

  const supabase = createAdminClient();
  const { data: attemptRows, error: attemptsError } = await supabase
    .from("attempts")
    .select(
      `
        id,
        test_slug,
        test_title,
        started_at,
        completed_at,
        duration_seconds,
        grading,
        score,
        total_marks,
        graded_question_count,
        graded_total_marks,
        attempted_count,
        correct_count,
        incorrect_count,
        unattempted_count,
        accuracy_percent,
        percentile_estimate,
        readiness_band
      `,
    )
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(30)
    .returns<DbAttemptRow[]>();

  if (attemptsError) {
    return NextResponse.json(
      { success: false, error: "Could not load attempts" },
      { status: 500, headers: CACHE_HEADERS },
    );
  }

  const attemptIds = (attemptRows ?? []).map((attempt) => attempt.id);
  if (!attemptIds.length) {
    return NextResponse.json({ success: true, attempts: [] }, { headers: CACHE_HEADERS });
  }

  const { data: answerRows, error: answersError } = await supabase
    .from("attempt_answers")
    .select(
      `
        attempt_id,
        question_id,
        ordinal,
        selected_option_id,
        is_correct,
        time_spent_seconds,
        marked_for_review,
        eliminated_option_ids,
        questions (
          id,
          subject,
          prompt,
          context_lines,
          options,
          correct_option_id,
          explanation,
          takeaway,
          marks,
          negative_marks
        )
      `,
    )
    .in("attempt_id", attemptIds)
    .order("ordinal", { ascending: true })
    .returns<DbAnswerRow[]>();

  if (answersError) {
    return NextResponse.json(
      { success: false, error: "Could not load attempt answers" },
      { status: 500, headers: CACHE_HEADERS },
    );
  }

  const answersByAttempt = new Map<string, DbAnswerRow[]>();
  for (const row of answerRows ?? []) {
    const current = answersByAttempt.get(row.attempt_id) ?? [];
    current.push(row);
    answersByAttempt.set(row.attempt_id, current);
  }

  const attempts = (attemptRows ?? []).map((attempt) =>
    toAttemptRecord(attempt, answersByAttempt.get(attempt.id) ?? []),
  );

  return NextResponse.json({ success: true, attempts }, { headers: CACHE_HEADERS });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401, headers: CACHE_HEADERS },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const attempt = isRecord(body) ? body.attempt : null;
  if (!isAttemptRecord(attempt)) {
    return NextResponse.json(
      { success: false, error: "Invalid attempt payload" },
      { status: 400, headers: CACHE_HEADERS },
    );
  }

  const supabase = createAdminClient();
  const { data: existingAttempt, error: existingError } = await supabase
    .from("attempts")
    .select("user_id")
    .eq("id", attempt.id)
    .maybeSingle<{ user_id: string }>();

  if (existingError) {
    return NextResponse.json(
      { success: false, error: "Could not verify attempt ownership" },
      { status: 500, headers: CACHE_HEADERS },
    );
  }

  if (existingAttempt && existingAttempt.user_id !== user.id) {
    return NextResponse.json(
      { success: false, error: "Attempt belongs to another user" },
      { status: 403, headers: CACHE_HEADERS },
    );
  }

  const generatedQuestions = attempt.questionReviews
    .filter((review) => !isUuid(review.questionId))
    .map(toQuestionUpsert);

  if (generatedQuestions.length) {
    const { error: questionsError } = await supabase
      .from("questions")
      .upsert(generatedQuestions, { onConflict: "id" });

    if (questionsError) {
      return NextResponse.json(
        { success: false, error: "Could not store generated questions" },
        { status: 500, headers: CACHE_HEADERS },
      );
    }
  }

  const { error: attemptError } = await supabase.from("attempts").upsert(
    {
      id: attempt.id,
      user_id: user.id,
      test_template_id: null,
      test_slug: attempt.testSlug,
      test_title: attempt.testTitle,
      started_at: attempt.startedAt,
      completed_at: attempt.completedAt,
      duration_seconds: attempt.durationSeconds,
      grading: attempt.grading,
      score: attempt.score,
      total_marks: attempt.totalMarks,
      graded_question_count: attempt.gradedQuestionCount,
      graded_total_marks: attempt.gradedTotalMarks,
      attempted_count: attempt.attemptedCount,
      correct_count: attempt.correctCount,
      incorrect_count: attempt.incorrectCount,
      unattempted_count: attempt.unattemptedCount,
      accuracy_percent: attempt.accuracyPercent,
      percentile_estimate: attempt.percentileEstimate,
      readiness_band: attempt.readinessBand,
    },
    { onConflict: "id" },
  );

  if (attemptError) {
    return NextResponse.json(
      { success: false, error: "Could not store attempt" },
      { status: 500, headers: CACHE_HEADERS },
    );
  }

  const { error: deleteError } = await supabase
    .from("attempt_answers")
    .delete()
    .eq("attempt_id", attempt.id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: "Could not refresh attempt answers" },
      { status: 500, headers: CACHE_HEADERS },
    );
  }

  const answers = attempt.questionReviews.map((review, index) => ({
    attempt_id: attempt.id,
    question_id: getCloudQuestionId(review.questionId),
    ordinal: index + 1,
    selected_option_id: review.selectedOptionId ?? null,
    is_correct: review.isCorrect,
    time_spent_seconds: review.timeSpentSeconds,
    marked_for_review: review.markedForReview,
    eliminated_option_ids: review.eliminatedOptionIds,
  }));

  if (answers.length) {
    const { error: answersError } = await supabase.from("attempt_answers").insert(answers);

    if (answersError) {
      return NextResponse.json(
        { success: false, error: "Could not store attempt answers" },
        { status: 500, headers: CACHE_HEADERS },
      );
    }
  }

  return NextResponse.json({ success: true, attemptId: attempt.id }, { headers: CACHE_HEADERS });
}
