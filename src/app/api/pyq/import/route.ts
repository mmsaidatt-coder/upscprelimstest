import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PyqQuestion, QuestionOption, Subject } from "@/lib/types";

export const runtime = "nodejs";

const SUBJECTS: Subject[] = [
  "Polity",
  "History",
  "Economy",
  "Geography",
  "Environment",
  "Science",
  "Current Affairs",
  "CSAT",
];

const OPTION_IDS = ["A", "B", "C", "D"] as const;

type ImportMode = "gemini_vision" | "vision_ocr";

type ExtractedOption = { id: (typeof OPTION_IDS)[number]; text: string };
type ExtractedQuestion = {
  question_number?: number | null;
  subject: Subject;
  prompt: string;
  context_lines?: string[] | null;
  options: ExtractedOption[];
  correct_option_id?: (typeof OPTION_IDS)[number] | null;
  topics?: string[] | null;
  explanation?: string | null;
  takeaway?: string | null;
};
type ExtractedQuestionsResponse = { questions: ExtractedQuestion[] };

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

type VisionAnnotateResponse = {
  responses?: Array<{ fullTextAnnotation?: { text?: string } }>;
};

const extractedQuestionsJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["subject", "prompt", "options"],
        properties: {
          question_number: { type: ["integer", "null"] },
          subject: { type: "string", enum: SUBJECTS },
          prompt: { type: "string" },
          context_lines: { type: ["array", "null"], items: { type: "string" } },
          options: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "text"],
              properties: {
                id: { type: "string", enum: OPTION_IDS },
                text: { type: "string" },
              },
            },
          },
          correct_option_id: { type: ["string", "null"], enum: [...OPTION_IDS, null] },
          topics: { type: ["array", "null"], items: { type: "string" } },
          explanation: { type: ["string", "null"] },
          takeaway: { type: ["string", "null"] },
        },
      },
    },
  },
} as const;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isExtractedQuestionsResponse(value: unknown): value is ExtractedQuestionsResponse {
  if (!value || typeof value !== "object") return false;
  if (!("questions" in value)) return false;
  const questions = (value as { questions?: unknown }).questions;
  return Array.isArray(questions);
}

function parseBoolean(value: FormDataEntryValue | null) {
  if (!value) return false;
  const text = String(value).trim().toLowerCase();
  return text === "1" || text === "true" || text === "on" || text === "yes";
}

function parseYear(value: FormDataEntryValue | null) {
  const parsed = Number(value ? String(value) : "");
  if (!Number.isFinite(parsed)) return null;
  const year = Math.round(parsed);
  if (year < 1900 || year > 2100) return null;
  return year;
}

function parseTopics(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  const topics = raw
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  return topics.filter((topic) => {
    const key = topic.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stableQuestionId({
  year,
  questionNumber,
  prompt,
  options,
}: {
  year: number;
  questionNumber: number | null;
  prompt: string;
  options: ExtractedOption[];
}) {
  if (questionNumber && questionNumber > 0) {
    return `pyq-${year}-${questionNumber}`;
  }

  const fingerprint = JSON.stringify(
    {
      year,
      prompt: prompt.trim(),
      options: options.map((option) => ({ [option.id]: option.text.trim() })),
    },
    null,
    0,
  );
  const digest = crypto.createHash("sha1").update(fingerprint, "utf8").digest("hex").slice(0, 12);
  return `pyq-${year}-h${digest}`;
}

function normalizeTopics(globalTopics: string[], extractedTopics: string[] | null | undefined) {
  const seen = new Set<string>();
  const merged = [...globalTopics, ...(extractedTopics ?? [])]
    .map((topic) => (topic ?? "").trim())
    .filter(Boolean)
    .filter((topic) => {
      const key = topic.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return merged.slice(0, 6);
}

function buildPrompt({
  year,
  globalTopics,
  sourceLabel,
  mode,
  ocrText,
}: {
  year: number;
  globalTopics: string[];
  sourceLabel: string;
  mode: ImportMode;
  ocrText?: string;
}) {
  const topicsHint = globalTopics.length ? globalTopics.join(", ") : "None";
  const baseRules = [
    "Return JSON only (no markdown).",
    "Extract only actual UPSC Prelims multiple-choice questions from the input.",
    "Each question MUST have exactly 4 options with ids A, B, C, D.",
    "Ignore headers, footers, watermarks, page numbers, and instructions.",
    "Put multi-statement blocks (like '1. ... 2. ...') into context_lines, and keep prompt as the question sentence.",
    "correct_option_id MUST be null unless the correct answer is explicitly present in the input.",
    `subject MUST be one of: ${SUBJECTS.join(", ")}.`,
    `topics: 0-5 short tags. Use global topics as hints: ${topicsHint}.`,
    "Preserve meaning. Do not invent facts.",
  ].join("\n- ");

  if (mode === "vision_ocr") {
    return `You are extracting UPSC Prelims questions from OCR text.\n\nRules:\n- ${baseRules}\n\nMetadata:\n- year: ${year}\n- source: ${sourceLabel}\n\nOCR TEXT:\n${ocrText ?? ""}`.trim();
  }

  return `You are extracting UPSC Prelims questions from an image.\n\nRules:\n- ${baseRules}\n\nMetadata:\n- year: ${year}\n- source: ${sourceLabel}`.trim();
}

async function callGeminiJson({
  apiKey,
  model,
  contents,
}: {
  apiKey: string;
  model: string;
  contents: unknown;
}): Promise<ExtractedQuestionsResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseJsonSchema: extractedQuestionsJsonSchema,
        },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Gemini request failed (${response.status}). ${text}`.trim());
  }

  const data = (await response.json()) as GeminiGenerateContentResponse;
  const candidateText = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text)
    .filter(Boolean)
    .join("");

  if (!candidateText || typeof candidateText !== "string") {
    return { questions: [] };
  }

  try {
    const parsed = JSON.parse(candidateText) as unknown;
    if (!isExtractedQuestionsResponse(parsed)) {
      return { questions: [] };
    }
    return parsed as ExtractedQuestionsResponse;
  } catch (error) {
    throw new Error(
      `Gemini returned non-JSON output. ${(error as Error).message}`.trim(),
    );
  }
}

async function visionOcr({
  apiKey,
  bytes,
}: {
  apiKey: string;
  bytes: Uint8Array;
}) {
  const base64 = Buffer.from(bytes).toString("base64");
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Vision OCR failed (${response.status}). ${text}`.trim());
  }

  const data = (await response.json()) as VisionAnnotateResponse;
  const text = data?.responses?.[0]?.fullTextAnnotation?.text;
  return typeof text === "string" ? text : "";
}

function toPyqQuestion({
  extracted,
  year,
  globalTopics,
  sourceLabel,
  warnings,
}: {
  extracted: ExtractedQuestion;
  year: number;
  globalTopics: string[];
  sourceLabel: string;
  warnings: string[];
}): PyqQuestion | null {
  const prompt = (extracted.prompt ?? "").trim();
  if (prompt.length < 8) {
    warnings.push(`Skipped a question with an empty/short prompt (${sourceLabel}).`);
    return null;
  }

  const options = extracted.options ?? [];
  if (options.length !== 4) {
    warnings.push(`Skipped a question with non-4 options (${sourceLabel}).`);
    return null;
  }

  const optionMap = new Map<string, string>();
  options.forEach((option) => optionMap.set(option.id, (option.text ?? "").trim()));
  if (OPTION_IDS.some((id) => !(optionMap.get(id) ?? "").trim())) {
    warnings.push(`Skipped a question with missing option text (${sourceLabel}).`);
    return null;
  }

  const normalizedOptions: QuestionOption[] = OPTION_IDS.map((id) => ({
    id,
    text: optionMap.get(id) ?? "",
  }));

  const questionId = stableQuestionId({
    year,
    questionNumber: extracted.question_number ?? null,
    prompt,
    options,
  });

  const subject = SUBJECTS.includes(extracted.subject) ? extracted.subject : "Current Affairs";
  const topics = normalizeTopics(globalTopics, extracted.topics);
  const marks = subject === "CSAT" ? 2.5 : 2;
  const negativeMarks = subject === "CSAT" ? 0.83 : 0.67;
  const contextLines =
    extracted.context_lines?.map((line) => line.trim()).filter(Boolean) ?? undefined;

  return {
    id: questionId,
    year,
    topics,
    sourceLabel,
    subject,
    difficulty: "Moderate",
    prompt,
    contextLines: contextLines?.length ? contextLines : undefined,
    options: normalizedOptions,
    correctOptionId: extracted.correct_option_id ?? undefined,
    explanation: extracted.explanation?.trim() ? extracted.explanation.trim() : undefined,
    takeaway: extracted.takeaway?.trim() ? extracted.takeaway.trim() : undefined,
    marks,
    negativeMarks,
  };
}

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse(
        "Upload failed: request body could not be parsed. Try uploading fewer/smaller images (or increase experimental.proxyClientMaxBodySize in next.config.ts).",
      );
    }

    const year = parseYear(formData.get("year"));
    if (!year) {
      return errorResponse("Invalid year. Example: 2023.");
    }

    const modeRaw = String(formData.get("mode") ?? "gemini_vision") as ImportMode;
    const mode: ImportMode = modeRaw === "vision_ocr" ? "vision_ocr" : "gemini_vision";
    const overwrite = parseBoolean(formData.get("overwrite"));
    const globalTopics = parseTopics(formData.get("topics"));

    const geminiApiKey = String(process.env.GEMINI_API_KEY ?? "").trim();
    if (!geminiApiKey) {
      return errorResponse("Missing server env var GEMINI_API_KEY.", 500);
    }

    const visionApiKey = String(process.env.GOOGLE_VISION_API_KEY ?? "").trim();
    if (mode === "vision_ocr" && !visionApiKey) {
      return errorResponse(
        "Missing server env var GOOGLE_VISION_API_KEY for Vision OCR mode.",
        500,
      );
    }

    const model = String(process.env.GEMINI_MODEL ?? "gemini-3-flash-preview").trim();

    const fileEntries = formData.getAll("files");
    const files = fileEntries.filter((entry): entry is File => entry instanceof File);
    if (!files.length) {
      return errorResponse("No images uploaded.");
    }

    if (files.length > 25) {
      return errorResponse("Too many images. Upload up to 25 at a time.");
    }

    const warnings: string[] = [];
    const extractedQuestions: PyqQuestion[] = [];

    for (const file of files) {
      if (!file.type || !["image/png", "image/jpeg"].includes(file.type)) {
        warnings.push(`Skipped unsupported file type: ${file.name}`);
        continue;
      }

      if (file.size > 12 * 1024 * 1024) {
        warnings.push(`Skipped large file (>12MB): ${file.name}`);
        continue;
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      const sourceLabel = file.name;

      if (mode === "vision_ocr") {
        const ocrText = await visionOcr({ apiKey: visionApiKey, bytes });
        if (!ocrText.trim()) {
          warnings.push(`No OCR text extracted from: ${file.name}`);
          continue;
        }

        const prompt = buildPrompt({
          year,
          globalTopics,
          sourceLabel,
          mode,
          ocrText,
        });

        const response = await callGeminiJson({
          apiKey: geminiApiKey,
          model,
          contents: [{ parts: [{ text: prompt }] }],
        });

        response.questions.forEach((question) => {
          const mapped = toPyqQuestion({
            extracted: question,
            year,
            globalTopics,
            sourceLabel,
            warnings,
          });
          if (mapped) extractedQuestions.push(mapped);
        });

        continue;
      }

      const prompt = buildPrompt({
        year,
        globalTopics,
        sourceLabel,
        mode,
      });

      const base64 = Buffer.from(bytes).toString("base64");
      const response = await callGeminiJson({
        apiKey: geminiApiKey,
        model,
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64,
                },
              },
              { text: prompt },
            ],
          },
        ],
      });

      response.questions.forEach((question) => {
        const mapped = toPyqQuestion({
          extracted: question,
          year,
          globalTopics,
          sourceLabel,
          warnings,
        });
        if (mapped) extractedQuestions.push(mapped);
      });
    }

    if (!extractedQuestions.length) {
      const supabase = createAdminClient();
      const { count } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("source", "pyq");

      return NextResponse.json({
        ok: true,
        extractedCount: 0,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        bankSize: count ?? 0,
        warnings,
      });
    }

    const supabase = createAdminClient();

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const question of extractedQuestions) {
      const normalizedPrompt = question.prompt.trim();

      // Check for existing question by year + prompt text
      const { data: existing } = await supabase
        .from("questions")
        .select("id")
        .eq("source", "pyq")
        .eq("year", question.year)
        .eq("prompt", normalizedPrompt)
        .limit(1);

      const questionRow = {
        source: "pyq" as const,
        subject: question.subject,
        difficulty: question.difficulty,
        prompt: normalizedPrompt,
        context_lines: question.contextLines ?? [],
        options: question.options,
        correct_option_id: question.correctOptionId ?? null,
        explanation: question.explanation ?? null,
        takeaway: question.takeaway ?? null,
        marks: question.marks,
        negative_marks: question.negativeMarks,
        year: question.year,
        source_label: question.sourceLabel ?? null,
      };

      const existingRow = existing?.[0];
      if (existingRow) {
        if (!overwrite) {
          skippedCount += 1;
          continue;
        }
        const { error } = await supabase
          .from("questions")
          .update({ ...questionRow, updated_at: new Date().toISOString() })
          .eq("id", existingRow.id);
        if (error) {
          warnings.push(`Failed to update question (year=${question.year}): ${error.message}`);
        } else {
          updatedCount += 1;
        }
      } else {
        const { data: inserted, error } = await supabase
          .from("questions")
          .insert(questionRow)
          .select("id")
          .single();
        if (error) {
          warnings.push(`Failed to insert question (year=${question.year}): ${error.message}`);
        } else {
          insertedCount += 1;

          // Link topics via question_topics junction table
          if (inserted && question.topics.length > 0) {
            for (const topicName of question.topics) {
              // Upsert topic
              const { data: topicRow } = await supabase
                .from("topics")
                .upsert({ name: topicName }, { onConflict: "name_lower" })
                .select("id")
                .single();
              if (topicRow) {
                await supabase
                  .from("question_topics")
                  .upsert(
                    { question_id: inserted.id, topic_id: topicRow.id },
                    { onConflict: "question_id,topic_id" },
                  );
              }
            }
          }
        }
      }
    }

    // Get total count for response
    const { count: bankSize } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("source", "pyq");

    return NextResponse.json({
      ok: true,
      extractedCount: extractedQuestions.length,
      insertedCount,
      updatedCount,
      skippedCount,
      bankSize: bankSize ?? 0,
      warnings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    return errorResponse(message, 500);
  }
}
