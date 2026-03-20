import type {
  AttemptRecord,
  AttemptGrading,
  ExamTest,
  NotebookEntry,
  ReadinessBand,
  Subject,
  SubjectMetric,
} from "@/lib/types";

export const subjectOrder: Subject[] = [
  "Polity",
  "History",
  "Economy",
  "Geography",
  "Environment",
  "Science",
  "Current Affairs",
  "CSAT",
];

export const subjectColorMap: Record<Subject, string> = {
  Polity: "#48573e",
  History: "#8e6444",
  Economy: "#6e7b4b",
  Geography: "#467272",
  Environment: "#3f6a4f",
  Science: "#5a608e",
  "Current Affairs": "#9b5b46",
  CSAT: "#7b5c8c",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (!hours) {
    return `${minutes} min`;
  }

  return `${hours}h ${minutes}m`;
}

export function computeReadinessBand(scorePercent: number): ReadinessBand {
  if (scorePercent >= 82) {
    return "Interview Zone";
  }

  if (scorePercent >= 68) {
    return "Cutoff Ready";
  }

  if (scorePercent >= 52) {
    return "On Track";
  }

  return "Foundation Build";
}

export function computePercentileEstimate(scorePercent: number, accuracyPercent: number) {
  return clamp(Math.round(scorePercent * 0.72 + accuracyPercent * 0.28), 8, 99);
}

export function buildAttemptRecord({
  id,
  test,
  startedAt,
  completedAt,
  answers,
  timeSpent,
  markedForReview,
  eliminatedChoices,
}: {
  id: string;
  test: ExamTest;
  startedAt: string;
  completedAt: string;
  answers: Record<string, string | undefined>;
  timeSpent: Record<string, number>;
  markedForReview: Record<string, boolean>;
  eliminatedChoices: Record<string, string[]>;
}): AttemptRecord {
  let score = 0;
  let attemptedCount = 0;
  let gradedQuestionCount = 0;
  let gradedTotalMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;

  const subjectMetricsMap = new Map<Subject, SubjectMetric>();

  const questionReviews = test.questions.map((question) => {
    const selectedOptionId = answers[question.id] as "A" | "B" | "C" | "D" | undefined;
    const isAttempted = Boolean(selectedOptionId);

    if (isAttempted) {
      attemptedCount += 1;
    }

    const hasAnswerKey = Boolean(question.correctOptionId);
    const isCorrect = hasAnswerKey ? selectedOptionId === question.correctOptionId : null;

    if (hasAnswerKey) {
      gradedQuestionCount += 1;
      gradedTotalMarks += question.marks;

      if (isAttempted) {
        if (isCorrect) {
          correctCount += 1;
          score += question.marks;
        } else {
          incorrectCount += 1;
          score -= question.negativeMarks;
        }
      }

      const existingMetric =
        subjectMetricsMap.get(question.subject) ??
        ({
          subject: question.subject,
          correct: 0,
          incorrect: 0,
          unattempted: 0,
          score: 0,
          total: 0,
          accuracyPercent: 0,
          averageTimeSeconds: 0,
        } satisfies SubjectMetric);

      existingMetric.total += 1;
      existingMetric.averageTimeSeconds += timeSpent[question.id] ?? 0;

      if (!isAttempted) {
        existingMetric.unattempted += 1;
      } else if (isCorrect) {
        existingMetric.correct += 1;
        existingMetric.score += question.marks;
      } else {
        existingMetric.incorrect += 1;
        existingMetric.score -= question.negativeMarks;
      }

      subjectMetricsMap.set(question.subject, existingMetric);
    }

    return {
      questionId: question.id,
      prompt: question.prompt,
      contextLines: question.contextLines,
      subject: question.subject,
      selectedOptionId,
      correctOptionId: question.correctOptionId,
      options: question.options,
      isCorrect,
      timeSpentSeconds: timeSpent[question.id] ?? 0,
      markedForReview: Boolean(markedForReview[question.id]),
      explanation:
        question.explanation ??
        (hasAnswerKey
          ? ""
          : "Answer key not available yet. Upload the answer key (or solved PDF) to unlock grading."),
      takeaway: question.takeaway ?? "",
      eliminatedOptionIds: (eliminatedChoices[question.id] ?? []) as ("A" | "B" | "C" | "D")[],
    };
  });

  const totalMarks = test.questions.reduce((sum, question) => sum + question.marks, 0);
  const unattemptedCount = test.questions.length - attemptedCount;
  const grading: AttemptGrading =
    gradedQuestionCount === 0
      ? "ungraded"
      : gradedQuestionCount === test.questions.length
        ? "graded"
        : "partial";

  const attemptedGradedCount = correctCount + incorrectCount;
  const accuracyPercent =
    grading === "ungraded"
      ? null
      : attemptedGradedCount
        ? Number(((correctCount / attemptedGradedCount) * 100).toFixed(1))
        : 0;
  const scorePercent =
    grading === "ungraded" || !gradedTotalMarks
      ? null
      : Number(((Math.max(score, 0) / gradedTotalMarks) * 100).toFixed(1));
  const percentileEstimate =
    grading === "graded" && scorePercent !== null && accuracyPercent !== null
      ? computePercentileEstimate(scorePercent, accuracyPercent)
      : null;

  const subjectMetrics = subjectOrder
    .map((subject) => subjectMetricsMap.get(subject))
    .filter((metric): metric is SubjectMetric => Boolean(metric))
    .map((metric) => ({
      ...metric,
      accuracyPercent:
        metric.correct + metric.incorrect
          ? Number(((metric.correct / (metric.correct + metric.incorrect)) * 100).toFixed(1))
          : 0,
      averageTimeSeconds: Number((metric.averageTimeSeconds / metric.total).toFixed(0)),
    }));

  const durationSeconds = Math.max(
    1,
    Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000),
  );

  return {
    id,
    testSlug: test.slug,
    testTitle: test.title,
    startedAt,
    completedAt,
    durationSeconds,
    grading,
    score: grading === "ungraded" ? null : Number(score.toFixed(2)),
    totalMarks,
    gradedQuestionCount,
    gradedTotalMarks,
    attemptedCount,
    correctCount: grading === "ungraded" ? null : correctCount,
    incorrectCount: grading === "ungraded" ? null : incorrectCount,
    unattemptedCount,
    accuracyPercent,
    percentileEstimate,
    readinessBand:
      grading === "graded" && scorePercent !== null ? computeReadinessBand(scorePercent) : null,
    subjectMetrics: grading === "ungraded" ? [] : subjectMetrics,
    questionReviews,
  };
}

export function computeDailyStreak(attempts: AttemptRecord[]) {
  if (!attempts.length) {
    return 0;
  }

  const uniqueDays = Array.from(
    new Set(
      attempts.map((attempt) => new Date(attempt.completedAt).toISOString().slice(0, 10)),
    ),
  ).sort((left, right) => right.localeCompare(left));

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const day of uniqueDays) {
    const expected = cursor.toISOString().slice(0, 10);
    if (day !== expected) {
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        if (day !== cursor.toISOString().slice(0, 10)) {
          break;
        }
      } else {
        break;
      }
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function computeStrongestSubject(attempts: AttemptRecord[]) {
  const aggregate = new Map<Subject, { correct: number; attempted: number }>();

  attempts.forEach((attempt) => {
    attempt.subjectMetrics.forEach((metric) => {
      const current = aggregate.get(metric.subject) ?? { correct: 0, attempted: 0 };
      current.correct += metric.correct;
      current.attempted += metric.correct + metric.incorrect;
      aggregate.set(metric.subject, current);
    });
  });

  const ranked = Array.from(aggregate.entries())
    .map(([subject, metric]) => ({
      subject,
      accuracy: metric.attempted ? metric.correct / metric.attempted : 0,
    }))
    .sort((left, right) => right.accuracy - left.accuracy);

  return ranked[0]?.subject;
}

export function notebookEntryTitle(entry: NotebookEntry) {
  return `${entry.subject} note`;
}
