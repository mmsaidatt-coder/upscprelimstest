export const SUBJECTS = [
  "Polity",
  "History",
  "Economy",
  "Geography",
  "Environment",
  "Science",
  "Current Affairs",
  "CSAT",
] as const;

export type Subject = (typeof SUBJECTS)[number];

export type Difficulty = "Easy" | "Moderate" | "Hard";

export type QuestionOption = {
  id: "A" | "B" | "C" | "D";
  text: string;
};

export type ExamQuestion = {
  id: string;
  subject: Subject;
  difficulty: Difficulty;
  prompt: string;
  contextLines?: string[];
  options: QuestionOption[];
  correctOptionId?: QuestionOption["id"];
  explanation?: string;
  takeaway?: string;
  marks: number;
  negativeMarks: number;
};

export type ExamTest = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  durationMinutes: number;
  difficultyLabel: string;
  questions: ExamQuestion[];
};

export type SubjectMetric = {
  subject: Subject;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  total: number;
  accuracyPercent: number;
  averageTimeSeconds: number;
};

export type AttemptQuestionReview = {
  questionId: string;
  prompt: string;
  contextLines?: string[];
  subject: Subject;
  selectedOptionId?: QuestionOption["id"];
  correctOptionId?: QuestionOption["id"];
  options: QuestionOption[];
  isCorrect: boolean | null;
  timeSpentSeconds: number;
  markedForReview: boolean;
  explanation: string;
  takeaway: string;
  eliminatedOptionIds: QuestionOption["id"][];
};

export type ReadinessBand =
  | "Foundation Build"
  | "On Track"
  | "Cutoff Ready"
  | "Interview Zone";

export type AttemptGrading = "graded" | "partial" | "ungraded";

export type AttemptRecord = {
  id: string;
  testSlug: string;
  testTitle: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  grading: AttemptGrading;
  score: number | null;
  totalMarks: number;
  gradedQuestionCount: number;
  gradedTotalMarks: number;
  attemptedCount: number;
  correctCount: number | null;
  incorrectCount: number | null;
  unattemptedCount: number;
  accuracyPercent: number | null;
  percentileEstimate: number | null;
  readinessBand: ReadinessBand | null;
  subjectMetrics: SubjectMetric[];
  questionReviews: AttemptQuestionReview[];
};

export type NotebookEntry = {
  id: string;
  questionId: string;
  testSlug: string;
  subject: Subject;
  title: string;
  body: string;
  savedAt: string;
};

export type PyqQuestion = ExamQuestion & {
  year: number;
  topics: string[];
  sourceLabel?: string;
};
