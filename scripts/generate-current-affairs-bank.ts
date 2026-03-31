import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

const ENV_API_KEYS = [
  ...(process.env.GEMINI_API_KEYS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  (process.env.GEMINI_API_KEY ?? "").trim(),
].filter(Boolean);

if (!ENV_API_KEYS.length) {
  console.error("Missing GEMINI_API_KEY or GEMINI_API_KEYS in .env.local");
  process.exit(1);
}

let apiKeyCursor = 0;

const SUBJECTS = [
  "Polity",
  "History",
  "Economy",
  "Geography",
  "Environment",
  "Science",
  "Current Affairs",
  "CSAT",
] as const;

const OPTION_IDS = ["A", "B", "C", "D"] as const;

const GENERATION_ROUNDS = [
  {
    label: "Statement-Driven",
    instructions: [
      "Bias towards statement-based, correct-pair, and feature-matching questions.",
      "Make the candidate eliminate close statements rather than recall one copied line.",
      "Prefer subtle distinctions between similar institutions, tools, buffers, ratios, or reserve components.",
    ],
  },
  {
    label: "Applied-And-Comparative",
    instructions: [
      "Bias towards rationale-risk, institution-function, mechanism-design, implication, and comparison-based questions.",
      "Use different micro-concepts from the page than the statement-driven round.",
      "Avoid repeating the same underlying fact pattern with cosmetic wording changes.",
    ],
  },
] as const;

type Subject = (typeof SUBJECTS)[number];
type OptionId = (typeof OPTION_IDS)[number];
type PageClassification =
  | "blank"
  | "cover"
  | "copyright"
  | "toc"
  | "advertisement"
  | "content"
  | "appendix"
  | "unclear";

type Args = {
  inputDir: string;
  outDir: string;
  year: number;
  indexModel: string;
  generateModel: string;
  reviewModel: string;
  requestConcurrency: number;
  overwrite: boolean;
  maxPagesPerPdf?: number;
  onlyPdfIncludes?: string;
};

type ExtractedPage = {
  pageNumber: number;
  rawText: string;
  cleanedText: string;
  textLength: number;
  heuristicClassification: PageClassification;
  needsVisionRescue: boolean;
  ocrClassification?: PageClassification;
  ocrQuestionQuotaHint?: number;
  ocrRationale?: string;
  rescuedText?: string;
};

type ExtractedPdf = {
  filePath: string;
  fileName: string;
  pdfLabel: string;
  defaultSubject: Subject;
  pages: ExtractedPage[];
};

type IndexedPage = {
  pageNumber: number;
  classification: PageClassification;
  questionQuota: number;
  topic: string;
  subtopic: string;
  rationale: string;
  confidence: number;
};

type IndexResponse = {
  pages: IndexedPage[];
};

type TopicPacketDraft = {
  topic: string;
  subtopic: string;
  pageNumbers: number[];
  questionQuota: number;
  rationale: string;
};

type TopicPacket = TopicPacketDraft & {
  id: string;
};

type PacketResponse = {
  packets: TopicPacketDraft[];
};

type SectionDraft = {
  title: string;
  focus: string;
  pageNumbers: number[];
  questionQuota: number;
  rationale: string;
  sectionExcerpt: string;
  evidenceBullets: string[];
};

type Section = SectionDraft & {
  id: string;
  packetId: string;
  topic: string;
  subtopic: string;
};

type SectionResponse = {
  sections: SectionDraft[];
};

type ClaimDraft = {
  claimType: string;
  claimText: string;
  evidenceExcerpt: string;
  pageNumbers: number[];
  examUse: string;
  distractorHooks: string[];
};

type Claim = ClaimDraft & {
  id: string;
  sectionId: string;
};

type ClaimResponse = {
  claims: ClaimDraft[];
};

type VisionIndexedPage = {
  pageNumber: number;
  classification: PageClassification;
  questionQuota: number;
  topic: string;
  subtopic: string;
  rationale: string;
  confidence: number;
  cleanedText: string;
};

type Option = {
  id: OptionId;
  text: string;
};

type CandidateQuestion = {
  subject: Subject;
  difficulty: "Easy" | "Moderate" | "Hard";
  questionType: string;
  prompt: string;
  contextLines?: string[];
  options: Option[];
  correctOptionId: OptionId;
  explanation: string;
  takeaway: string;
  evidenceExcerpt: string;
};

type CandidateResponse = {
  questions: CandidateQuestion[];
};

type ReviewedQuestion = CandidateQuestion & {
  qualityScore: number;
  reviewNotes: string;
};

type ReviewResponse = {
  acceptedQuestions: ReviewedQuestion[];
  reviewerNotes: string;
};

type GeminiJsonResult<T> = {
  modelUsed: string;
  value: T;
};

type SectionFailureStage = "claims" | "generation" | "review";

type SectionFailureRecord = {
  sectionId: string;
  packetId: string;
  topic: string;
  subtopic: string;
  title: string;
  pageNumbers: number[];
  stage: SectionFailureStage;
  error: string;
  attemptedModels: string[];
  timestamp: string;
};

type SectionRunResult = {
  section: Section;
  review: ReviewResponse;
  failed: boolean;
};

type OcrPageResponse = {
  pageNumber: number;
  classification: PageClassification;
  questionQuotaHint: number;
  rationale: string;
  cleanedText: string;
};

type FinalQuestion = ReviewedQuestion & {
  id: string;
  source: "subject";
  year: number;
  exam: string;
  questionNumber: number;
  sourcePdf: string;
  sourcePages: number[];
  sourceTopic: string;
  sourceSubtopic: string;
  sourceSection: string;
};

const INDEX_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["pages"],
  properties: {
    pages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "pageNumber",
          "classification",
          "questionQuota",
          "topic",
          "subtopic",
          "rationale",
          "confidence",
        ],
        properties: {
          pageNumber: { type: "integer" },
          classification: {
            type: "string",
            enum: [
              "blank",
              "cover",
              "copyright",
              "toc",
              "advertisement",
              "content",
              "appendix",
              "unclear",
            ],
          },
          questionQuota: { type: "integer", minimum: 0, maximum: 5 },
          topic: { type: "string" },
          subtopic: { type: "string" },
          rationale: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
    },
  },
} as const;

const VISION_INDEX_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "pageNumber",
    "classification",
    "questionQuota",
    "topic",
    "subtopic",
    "rationale",
    "confidence",
    "cleanedText",
  ],
  properties: {
    pageNumber: { type: "integer" },
    classification: {
      type: "string",
      enum: [
        "blank",
        "cover",
        "copyright",
        "toc",
        "advertisement",
        "content",
        "appendix",
        "unclear",
      ],
    },
    questionQuota: { type: "integer", minimum: 0, maximum: 5 },
    topic: { type: "string" },
    subtopic: { type: "string" },
    rationale: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    cleanedText: { type: "string" },
  },
} as const;

const PACKET_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["packets"],
  properties: {
    packets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["topic", "subtopic", "pageNumbers", "questionQuota", "rationale"],
        properties: {
          topic: { type: "string" },
          subtopic: { type: "string" },
          pageNumbers: {
            type: "array",
            minItems: 1,
            items: { type: "integer" },
          },
          questionQuota: { type: "integer", minimum: 1, maximum: 12 },
          rationale: { type: "string" },
        },
      },
    },
  },
} as const;

const SECTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["sections"],
  properties: {
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "focus", "pageNumbers", "questionQuota", "rationale", "sectionExcerpt", "evidenceBullets"],
        properties: {
          title: { type: "string" },
          focus: { type: "string" },
          pageNumbers: {
            type: "array",
            minItems: 1,
            items: { type: "integer" },
          },
          questionQuota: { type: "integer", minimum: 1, maximum: 8 },
          rationale: { type: "string" },
          sectionExcerpt: { type: "string" },
          evidenceBullets: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  },
} as const;

const CLAIM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["claims"],
  properties: {
    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "claimType",
          "claimText",
          "evidenceExcerpt",
          "pageNumbers",
          "examUse",
          "distractorHooks",
        ],
        properties: {
          claimType: { type: "string" },
          claimText: { type: "string" },
          evidenceExcerpt: { type: "string" },
          pageNumbers: {
            type: "array",
            minItems: 1,
            items: { type: "integer" },
          },
          examUse: { type: "string" },
          distractorHooks: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  },
} as const;

const CANDIDATE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "subject",
          "difficulty",
          "questionType",
          "prompt",
          "options",
          "correctOptionId",
          "explanation",
          "takeaway",
          "evidenceExcerpt",
        ],
        properties: {
          subject: { type: "string", enum: SUBJECTS },
          difficulty: { type: "string", enum: ["Easy", "Moderate", "Hard"] },
          questionType: { type: "string" },
          prompt: { type: "string" },
          contextLines: {
            type: "array",
            items: { type: "string" },
          },
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
          correctOptionId: { type: "string", enum: OPTION_IDS },
          explanation: { type: "string" },
          takeaway: { type: "string" },
          evidenceExcerpt: { type: "string" },
        },
      },
    },
  },
} as const;

const REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["acceptedQuestions", "reviewerNotes"],
  properties: {
    acceptedQuestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "subject",
          "difficulty",
          "questionType",
          "prompt",
          "options",
          "correctOptionId",
          "explanation",
          "takeaway",
          "evidenceExcerpt",
          "qualityScore",
          "reviewNotes",
        ],
        properties: {
          subject: { type: "string", enum: SUBJECTS },
          difficulty: { type: "string", enum: ["Easy", "Moderate", "Hard"] },
          questionType: { type: "string" },
          prompt: { type: "string" },
          contextLines: {
            type: "array",
            items: { type: "string" },
          },
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
          correctOptionId: { type: "string", enum: OPTION_IDS },
          explanation: { type: "string" },
          takeaway: { type: "string" },
          evidenceExcerpt: { type: "string" },
          qualityScore: { type: "integer", minimum: 0, maximum: 100 },
          reviewNotes: { type: "string" },
        },
      },
    },
    reviewerNotes: { type: "string" },
  },
} as const;

const OCR_PAGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["pageNumber", "classification", "questionQuotaHint", "rationale", "cleanedText"],
  properties: {
    pageNumber: { type: "integer" },
    classification: {
      type: "string",
      enum: [
        "blank",
        "cover",
        "copyright",
        "toc",
        "advertisement",
        "content",
        "appendix",
        "unclear",
      ],
    },
    questionQuotaHint: { type: "integer", minimum: 0, maximum: 5 },
    rationale: { type: "string" },
    cleanedText: { type: "string" },
  },
} as const;

function parseArgs(argv: string[]): Args {
  const result: Args = {
    inputDir: "/Users/mani/Desktop/pt365",
    outDir: path.resolve(process.cwd(), "data", "generated", "current-affairs-2025-pt365"),
    year: 2025,
    indexModel: "gemini-3-flash-preview",
    generateModel: "gemini-3.1-pro-preview",
    reviewModel: "gemini-3.1-pro-preview",
    requestConcurrency: Math.max(1, Math.min(ENV_API_KEYS.length, 3)),
    overwrite: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--input-dir" && next) {
      result.inputDir = next;
      i += 1;
    } else if (arg === "--out-dir" && next) {
      result.outDir = path.resolve(process.cwd(), next);
      i += 1;
    } else if (arg === "--year" && next) {
      result.year = Number(next);
      i += 1;
    } else if (arg === "--index-model" && next) {
      result.indexModel = next;
      i += 1;
    } else if (arg === "--generate-model" && next) {
      result.generateModel = next;
      i += 1;
    } else if (arg === "--review-model" && next) {
      result.reviewModel = next;
      i += 1;
    } else if (arg === "--concurrency" && next) {
      result.requestConcurrency = Number(next);
      i += 1;
    } else if (arg === "--max-pages-per-pdf" && next) {
      result.maxPagesPerPdf = Number(next);
      i += 1;
    } else if (arg === "--only-pdf-includes" && next) {
      result.onlyPdfIncludes = next.toLowerCase();
      i += 1;
    } else if (arg === "--overwrite") {
      result.overwrite = true;
    } else if (arg === "--help") {
      console.log([
        "Usage: npx tsx scripts/generate-current-affairs-bank.ts [options]",
        "",
        "Options:",
        "  --input-dir <path>           Directory with source PDFs (default: /Users/mani/Desktop/pt365)",
        "  --out-dir <path>             Output directory under the repo",
        "  --year <number>              Current-affairs year tag (default: 2025)",
        "  --index-model <name>         Gemini model for PDF/page indexing",
        "  --generate-model <name>      Gemini model for candidate generation",
        "  --review-model <name>        Gemini model for question review",
        "  --concurrency <n>            Max concurrent Gemini requests (default: number of keys, capped at 3)",
        "  --max-pages-per-pdf <n>      Limit pages per PDF for dry runs",
        "  --only-pdf-includes <text>   Process only PDFs whose filename includes the text",
        "  --overwrite                  Ignore cached outputs and recompute",
      ].join("\n"));
      process.exit(0);
    }
  }

  if (!Number.isFinite(result.year) || result.year < 2000 || result.year > 2100) {
    throw new Error("Invalid --year value.");
  }

  if (!Number.isFinite(result.requestConcurrency) || result.requestConcurrency < 1) {
    throw new Error("Invalid --concurrency value.");
  }

  result.requestConcurrency = Math.floor(result.requestConcurrency);

  return result;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(attempt: number) {
  return 2_000 * (attempt + 1);
}

function summarizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function uniqueModels(models: string[]) {
  return models.filter((model, index) => Boolean(model) && models.indexOf(model) === index);
}

function modelFallbackChain(primaryModel: string) {
  switch (primaryModel) {
    case "gemini-3.1-pro-preview":
      return uniqueModels([
        "gemini-3.1-pro-preview",
        "gemini-3-flash-preview",
        "gemini-2.5-pro",
      ]);
    case "gemini-3-pro-preview":
      return uniqueModels([
        "gemini-3-pro-preview",
        "gemini-3.1-pro-preview",
        "gemini-3-flash-preview",
        "gemini-2.5-pro",
      ]);
    case "gemini-3-flash-preview":
      return uniqueModels([
        "gemini-3-flash-preview",
        "gemini-2.5-flash",
      ]);
    default:
      return [primaryModel];
  }
}

async function mapWithConcurrency<T, U>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<U>,
): Promise<U[]> {
  const results = new Array<U>(items.length);
  let cursor = 0;

  const worker = async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) {
        return;
      }

      results[index] = await mapper(items[index], index);
    }
  };

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(filePath: string): Promise<T | null> {
  if (!(await exists(filePath))) {
    return null;
  }

  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeSectionFailure(
  pdfCacheDir: string,
  section: Section,
  stage: SectionFailureStage,
  attemptedModels: string[],
  error: unknown,
) {
  const payload: SectionFailureRecord = {
    sectionId: section.id,
    packetId: section.packetId,
    topic: section.topic,
    subtopic: section.subtopic,
    title: section.title,
    pageNumbers: section.pageNumbers,
    stage,
    error: summarizeError(error),
    attemptedModels,
    timestamp: new Date().toISOString(),
  };

  await writeJson(path.join(pdfCacheDir, "errors", `${section.id}.json`), payload);
}

function inferSubjectFromFilename(fileName: string): Subject {
  const lower = fileName.toLowerCase();
  if (lower.includes("economy")) return "Economy";
  if (lower.includes("environment")) return "Environment";
  if (lower.includes("science")) return "Science";
  if (lower.includes("polity") || lower.includes("governance")) return "Polity";
  if (lower.includes("art") || lower.includes("culture")) return "History";
  return "Current Affairs";
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/(\w)-\n(\w)/g, "$1$2")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function cleanPageText(text: string) {
  const normalized = normalizeWhitespace(text);
  const lines = normalized.split("\n");
  const kept: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^AHMEDABAD \| BENGALURU/i.test(line)) continue;
    if (/^©\s*Vision IAS/i.test(line)) continue;
    if (/^Copyright © by Vision IAS/i.test(line)) continue;
    if (/^All rights are reserved\./i.test(line)) continue;
    if (/^Classroom Study Material/i.test(line)) continue;
    if (/^@\w+/.test(line)) continue;
    if (/^\d+\s*$/.test(line)) continue;
    kept.push(line.replace(/^>\s*/, ""));
  }

  return kept.join("\n").trim();
}

function formatQuestionPrompt(prompt: string) {
  return normalizeWhitespace(prompt)
    .replace(/(consider the following statements:?)(\d+\.)/i, "$1\n$2")
    .replace(/(which of the statements given above is\/are correct\?)(select)/i, "$1\n$2")
    .replace(/(select the correct answer using the code given below:?)(\d+\.)/i, "$1\n$2")
    .trim();
}

function heuristicClassifyPage(text: string): PageClassification {
  const lower = text.toLowerCase();
  const alphaCount = (text.match(/[a-z]/gi) ?? []).length;

  if (alphaCount < 20) return "blank";
  if (lower.includes("table of contents")) return "toc";
  if (lower.includes("all rights are reserved") || lower.includes("copyright")) return "copyright";
  if (lower.includes("vision ias") && alphaCount < 90) return "cover";
  if (lower.includes("advertisement")) return "advertisement";
  return "content";
}

function excerpt(text: string, maxLength: number) {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
}

function getBestPageText(page: Pick<ExtractedPage, "cleanedText" | "rescuedText">) {
  return cleanPageText(page.rescuedText || page.cleanedText);
}

function inferHeuristicTopic(text: string, pageNumber: number) {
  const lines = text
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const heading =
    lines.find(
      (line) =>
        line.length >= 8 &&
        line.length <= 140 &&
        !/^(vision ias|page\s+\d+|copyright|all rights reserved|www\.)/i.test(line),
    ) ?? `Page ${pageNumber}`;

  const title = heading.length <= 96 ? heading : `${heading.slice(0, 93)}...`;
  return {
    topic: title,
    subtopic: title,
  };
}

function heuristicQuotaFromText(text: string, classification: PageClassification) {
  if (classification !== "content") return 0;

  const normalized = normalizeWhitespace(text);
  if (!normalized) return 0;

  const length = normalized.length;
  if (length < 250) return 0;
  if (length < 900) return 1;
  if (length < 1_800) return 2;
  if (length < 3_000) return 3;
  if (length < 4_200) return 4;
  return 5;
}

function buildHeuristicOcrResponse(page: ExtractedPage, reason: string): OcrPageResponse {
  const classification = page.ocrClassification ?? page.heuristicClassification;
  const cleanedText = getBestPageText(page);

  return {
    pageNumber: page.pageNumber,
    classification,
    questionQuotaHint:
      page.ocrQuestionQuotaHint ?? heuristicQuotaFromText(cleanedText, classification),
    rationale: normalizeWhitespace(reason),
    cleanedText,
  };
}

async function callGeminiJson<T>({
  model,
  schema,
  prompt,
  inlineParts = [],
  temperature,
}: {
  model: string;
  schema: object;
  prompt: string;
  inlineParts?: Array<{ inline_data: { mime_type: string; data: string } }>;
  temperature: number;
}): Promise<T> {
  const body = {
    contents: [
      {
        parts: [{ text: prompt }, ...inlineParts],
      },
    ],
    generationConfig: {
      temperature,
      responseMimeType: "application/json",
      responseJsonSchema: schema,
    },
  };

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const apiKey = ENV_API_KEYS[apiKeyCursor % ENV_API_KEYS.length];
    apiKeyCursor += 1;
    let response: Response;

    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(body),
        },
      );
    } catch (error) {
      if (attempt < 5) {
        await sleep(retryDelayMs(attempt));
        continue;
      }
      throw error;
    }

    if (response.ok) {
      let data: {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
        promptFeedback?: {
          blockReason?: string;
        };
      };

      try {
        data = await response.json();
      } catch (error) {
        if (attempt < 5) {
          await sleep(retryDelayMs(attempt));
          continue;
        }

        throw new Error(`Gemini ${model} returned invalid JSON: ${String(error)}`);
      }

      const text = data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("")
        .trim();

      if (!text) {
        const blockReason = data?.promptFeedback?.blockReason;
        if (attempt < 5) {
          await sleep(retryDelayMs(attempt));
          continue;
        }

        throw new Error(
          blockReason
            ? `Gemini ${model} returned an empty response (block reason: ${blockReason}).`
            : `Gemini ${model} returned an empty response.`,
        );
      }

      try {
        return JSON.parse(text) as T;
      } catch (error) {
        if (attempt < 5) {
          await sleep(retryDelayMs(attempt));
          continue;
        }

        throw new Error(
          `Gemini ${model} returned invalid JSON content: ${String(error)} | excerpt=${excerpt(text, 240)}`,
        );
      }
    }

    const raw = await response.text().catch(() => "");
    if (response.status === 429 || response.status >= 500) {
      await sleep(retryDelayMs(attempt));
      continue;
    }

    throw new Error(`Gemini ${model} failed (${response.status}): ${raw}`);
  }

  throw new Error(`Gemini ${model} failed after retries.`);
}

async function callGeminiJsonWithFallback<T>({
  models,
  schema,
  prompt,
  inlineParts = [],
  temperature,
}: {
  models: string[];
  schema: object;
  prompt: string;
  inlineParts?: Array<{ inline_data: { mime_type: string; data: string } }>;
  temperature: number;
}): Promise<GeminiJsonResult<T>> {
  const errors: string[] = [];

  for (const model of uniqueModels(models)) {
    try {
      const value = await callGeminiJson<T>({
        model,
        schema,
        prompt,
        inlineParts,
        temperature,
      });

      return {
        modelUsed: model,
        value,
      };
    } catch (error) {
      errors.push(`${model}: ${summarizeError(error)}`);
    }
  }

  throw new Error(`All Gemini model attempts failed. ${errors.join(" | ")}`);
}

async function renderPageImage(pdfPath: string, pageNumber: number) {
  const parser = new PDFParse({ data: await readFile(pdfPath) });
  try {
    const shot = await parser.getScreenshot({
      partial: [pageNumber],
      desiredWidth: 1200,
      imageBuffer: true,
      imageDataUrl: false,
    });
    const page = shot.pages[0];
    if (!page?.data) {
      throw new Error(`No screenshot data for page ${pageNumber}`);
    }
    return Buffer.from(page.data);
  } finally {
    await parser.destroy();
  }
}

async function ocrPageWithGemini(
  pdf: ExtractedPdf,
  page: ExtractedPage,
  pdfCacheDir: string,
  args: Args,
): Promise<OcrPageResponse> {
  const cachePath = path.join(pdfCacheDir, "ocr", `page-${String(page.pageNumber).padStart(3, "0")}.json`);
  if (!args.overwrite) {
    const cached = await readJson<OcrPageResponse>(cachePath);
    if (cached) return cached;
  }

  const imageBuffer = await renderPageImage(pdf.filePath, page.pageNumber);
  const prompt = [
    `OCR and clean this PT365 PDF page from "${pdf.pdfLabel}".`,
    "",
    "Requirements:",
    "- Extract all meaningful text from the page, including text inside charts, tables, sidebars, captions, labels, and callout boxes.",
    "- Remove branding noise, city lists, page numbers, and repeated coaching footer/header text.",
    "- Keep important headings and bullet structure in cleanedText.",
    "- If the page is blank, decorative, copyright-only, or a table-of-contents page, say so via classification and keep questionQuotaHint at 0.",
    "- questionQuotaHint is only a rough first pass from 0 to 5.",
    "",
    "classification meanings:",
    "- content: usable source page",
    "- toc / cover / blank / copyright / advertisement: unusable",
    "- appendix / unclear: maybe usable but weaker",
    "",
    `Default subject for the PDF: ${pdf.defaultSubject}`,
    `pageNumber: ${page.pageNumber}`,
    "",
    "Helper text extracted directly from the PDF. Use it only as support; trust the page image most.",
    excerpt(page.cleanedText, 1800) || "(empty)",
  ].join("\n");

  let response: OcrPageResponse;

  try {
    const result = await callGeminiJsonWithFallback<OcrPageResponse>({
      models: modelFallbackChain(args.indexModel),
      schema: OCR_PAGE_SCHEMA,
      prompt,
      temperature: 0.2,
      inlineParts: [
        {
          inline_data: {
            mime_type: "image/png",
            data: imageBuffer.toString("base64"),
          },
        },
      ],
    });
    response = result.value;
  } catch (error) {
    const fallback = buildHeuristicOcrResponse(
      page,
      `Heuristic OCR fallback because model OCR failed: ${summarizeError(error)}`,
    );
    await writeJson(cachePath, fallback);
    console.warn(
      `  OCR fallback engaged for ${pdf.fileName} page=${String(page.pageNumber).padStart(3, "0")}: ${summarizeError(error)}`,
    );
    return fallback;
  }

  const sanitized = {
    pageNumber: page.pageNumber,
    classification: response.classification,
    questionQuotaHint: Math.max(0, Math.min(5, Math.round(response.questionQuotaHint))),
    rationale: normalizeWhitespace(response.rationale),
    cleanedText: cleanPageText(response.cleanedText),
  } satisfies OcrPageResponse;

  await writeJson(cachePath, sanitized);
  return sanitized;
}

async function extractPdf(pdfPath: string, args: Args, pdfCacheDir: string): Promise<ExtractedPdf> {
  const cachePath = path.join(pdfCacheDir, "pages.json");
  if (!args.overwrite) {
    const cached = await readJson<ExtractedPdf>(cachePath);
    if (cached) return cached;
  }

  const fileName = path.basename(pdfPath);
  const pdfLabel = fileName.replace(/\.pdf$/i, "");
  const defaultSubject = inferSubjectFromFilename(fileName);

  const parser = new PDFParse({ data: await readFile(pdfPath) });
  try {
    const textResult = await parser.getText();
    const allPages = textResult.pages.map((page, index) => {
      const cleanedText = cleanPageText(page.text ?? "");
      const heuristicClassification = heuristicClassifyPage(cleanedText);
      return {
        pageNumber: index + 1,
        rawText: page.text ?? "",
        cleanedText,
        textLength: cleanedText.length,
        heuristicClassification,
        needsVisionRescue:
          heuristicClassification === "content" && cleanedText.length > 0 && cleanedText.length < 160,
      } satisfies ExtractedPage;
    });

    const pages = typeof args.maxPagesPerPdf === "number"
      ? allPages.slice(0, args.maxPagesPerPdf)
      : allPages;

    const result: ExtractedPdf = {
      filePath: pdfPath,
      fileName,
      pdfLabel,
      defaultSubject,
      pages,
    };

    await writeJson(cachePath, result);
    return result;
  } finally {
    await parser.destroy();
  }
}

async function ensurePdfOcr(pdf: ExtractedPdf, pdfCacheDir: string, args: Args) {
  const ocrResults = await mapWithConcurrency(
    pdf.pages,
    args.requestConcurrency,
    async (page) => ({ page, ocr: await ocrPageWithGemini(pdf, page, pdfCacheDir, args) }),
  );

  for (const { page, ocr } of ocrResults) {
    page.ocrClassification = ocr.classification;
    page.ocrQuestionQuotaHint = ocr.questionQuotaHint;
    page.ocrRationale = ocr.rationale;
    page.heuristicClassification = ocr.classification;
    page.needsVisionRescue = false;

    if (ocr.cleanedText) {
      page.rescuedText = ocr.cleanedText;
    }
  }
}

function buildIndexPrompt(pdf: ExtractedPdf, pages: ExtractedPage[]) {
  const payload = pages.map((page) => ({
    pageNumber: page.pageNumber,
    heuristicClassification: page.heuristicClassification,
    ocrClassification: page.ocrClassification ?? page.heuristicClassification,
    ocrQuestionQuotaHint: page.ocrQuestionQuotaHint ?? 0,
    cleanedText: excerpt(
      page.rescuedText || page.cleanedText,
      2600,
    ),
  }));

  return [
    `You are indexing pages from the PDF "${pdf.pdfLabel}" for UPSC CSE Prelims current-affairs question generation.`,
    "",
    "Goal:",
    "- classify every page",
    "- assign a strict questionQuota from 0 to 5",
    "- only high-signal, content-rich pages should get 4 or 5",
    "- advertisements, cover pages, copyright pages, table-of-contents pages, blank pages, and thin filler pages must get 0",
    "- OCR-derived classification and quota hints are stronger signals than raw text heuristics",
    "",
    "Rubric for questionQuota:",
    "- 0: unusable for question generation",
    "- 1: only one strong UPSC-worthy fact/concept",
    "- 2: two decent questions possible",
    "- 3: moderate factual/conceptual density",
    "- 4: dense page with several prelims-worthy facts or concepts",
    "- 5: very dense content page; about five strong questions are realistic",
    "",
    "Quality bar:",
    "- Prefer pages supporting conceptual, statement-based, comparative, institution-related, treaty-related, scheme-related, or feature-based questions.",
    "- Do not over-allocate quotas to pages that only list headings or repeated bullets.",
    "- Topic and subtopic should be concise.",
    "",
    "Return JSON only.",
    "",
    `PAGES = ${JSON.stringify(payload)}`,
  ].join("\n");
}

function clampQuota(value: number, classification: PageClassification, heuristic: PageClassification) {
  if (classification !== "content") return 0;
  if (heuristic !== "content") return Math.min(value, 2);
  return Math.max(0, Math.min(5, Math.round(value)));
}

function buildHeuristicIndexedPage(page: ExtractedPage, reason: string): IndexedPage {
  const classification = page.ocrClassification ?? page.heuristicClassification;
  const cleanedText = getBestPageText(page);
  const quotaSeed =
    page.ocrQuestionQuotaHint ?? heuristicQuotaFromText(cleanedText, classification);
  const { topic, subtopic } = inferHeuristicTopic(cleanedText, page.pageNumber);

  return {
    pageNumber: page.pageNumber,
    classification,
    questionQuota: clampQuota(quotaSeed, classification, page.heuristicClassification),
    topic,
    subtopic,
    rationale: normalizeWhitespace(reason),
    confidence: 0.2,
  };
}

function buildHeuristicVisionIndexedPage(page: ExtractedPage, reason: string): VisionIndexedPage {
  const indexed = buildHeuristicIndexedPage(page, reason);

  return {
    pageNumber: indexed.pageNumber,
    classification: indexed.classification,
    questionQuota: indexed.questionQuota,
    topic: indexed.topic,
    subtopic: indexed.subtopic,
    rationale: indexed.rationale,
    confidence: indexed.confidence,
    cleanedText: getBestPageText(page),
  };
}

async function rescuePageWithVision(
  pdf: ExtractedPdf,
  page: ExtractedPage,
  pdfCacheDir: string,
  args: Args,
): Promise<VisionIndexedPage> {
  const rescuePath = path.join(pdfCacheDir, "vision-index", `page-${String(page.pageNumber).padStart(3, "0")}.json`);
  if (!args.overwrite) {
    const cached = await readJson<VisionIndexedPage>(rescuePath);
    if (cached) return cached;
  }

  const imageBuffer = await renderPageImage(pdf.filePath, page.pageNumber);
  const prompt = [
    `Read this PDF page image from "${pdf.pdfLabel}".`,
    "First, transcribe the meaningful page content into cleanedText.",
    "Then classify the page and decide whether it can support 0 to 5 high-quality UPSC prelims questions.",
    "",
    "Rules:",
    "- Remove branding, footer noise, city lists, and page numbers from cleanedText.",
    "- If the page is blank, decorative, an advertisement, a cover page, or otherwise unfit, set questionQuota to 0.",
    "- Only assign 4 or 5 if the page is genuinely dense and can support close-to-real UPSC questions.",
    "- topic and subtopic should be concise.",
    "",
    `pageNumber: ${page.pageNumber}`,
  ].join("\n");

  let result: VisionIndexedPage;

  try {
    const response = await callGeminiJsonWithFallback<VisionIndexedPage>({
      models: modelFallbackChain(args.indexModel),
      schema: VISION_INDEX_SCHEMA,
      prompt,
      temperature: 0.2,
      inlineParts: [
        {
          inline_data: {
            mime_type: "image/png",
            data: imageBuffer.toString("base64"),
          },
        },
      ],
    });
    result = response.value;
  } catch (error) {
    result = buildHeuristicVisionIndexedPage(
      page,
      `Heuristic vision-index fallback because model rescue failed: ${summarizeError(error)}`,
    );
    console.warn(
      `  Vision rescue fallback engaged for ${pdf.fileName} page=${String(page.pageNumber).padStart(3, "0")}: ${summarizeError(error)}`,
    );
  }

  result.pageNumber = page.pageNumber;
  result.questionQuota = clampQuota(
    result.questionQuota,
    result.classification,
    page.heuristicClassification,
  );

  await writeJson(rescuePath, result);
  return result;
}

async function buildPdfIndex(pdf: ExtractedPdf, pdfCacheDir: string, args: Args) {
  const cachePath = path.join(pdfCacheDir, "index.json");
  if (!args.overwrite) {
    const cached = await readJson<IndexResponse>(cachePath);
    if (cached) return cached;
  }

  const indexedPages: IndexedPage[] = [];
  const chunkSize = 18;
  const chunks: ExtractedPage[][] = [];
  for (let i = 0; i < pdf.pages.length; i += chunkSize) {
    chunks.push(pdf.pages.slice(i, i + chunkSize));
  }

  const chunkResults = await mapWithConcurrency(
    chunks,
    args.requestConcurrency,
    async (chunk) => {
      try {
        const result = await callGeminiJsonWithFallback<IndexResponse>({
          models: modelFallbackChain(args.indexModel),
          schema: INDEX_SCHEMA,
          prompt: buildIndexPrompt(pdf, chunk),
          temperature: 0.2,
        });

        const chunkIndexedPages: IndexedPage[] = [];
        const byPage = new Map(result.value.pages.map((page) => [page.pageNumber, page]));
        for (const chunkPage of chunk) {
          const indexed = byPage.get(chunkPage.pageNumber);
          if (indexed) {
            chunkIndexedPages.push({
              ...indexed,
              questionQuota: clampQuota(
                indexed.questionQuota,
                indexed.classification,
                chunkPage.heuristicClassification,
              ),
            });
          } else {
            chunkIndexedPages.push(
              buildHeuristicIndexedPage(
                chunkPage,
                "Filled from heuristic fallback because the page was missing from the model response.",
              ),
            );
          }
        }
        return chunkIndexedPages;
      } catch (error) {
        const reason = `Heuristic chunk fallback because model indexing failed: ${summarizeError(error)}`;
        console.warn(
          `  Index chunk fallback engaged for ${pdf.fileName} pages=${formatPacketPages(chunk.map((page) => page.pageNumber))}: ${summarizeError(error)}`,
        );
        return chunk.map((chunkPage) => buildHeuristicIndexedPage(chunkPage, reason));
      }
    },
  );

  for (const chunkIndexedPages of chunkResults) {
    indexedPages.push(...chunkIndexedPages);
  }

  const byPage = new Map(indexedPages.map((page) => [page.pageNumber, page]));
  for (const page of pdf.pages) {
    if (!page.needsVisionRescue) continue;
    const current = byPage.get(page.pageNumber);
    if (!current || current.questionQuota >= 2) continue;

    const rescued = await rescuePageWithVision(pdf, page, pdfCacheDir, args);
    page.rescuedText = cleanPageText(rescued.cleanedText);
    byPage.set(page.pageNumber, {
      pageNumber: page.pageNumber,
      classification: rescued.classification,
      questionQuota: rescued.questionQuota,
      topic: rescued.topic,
      subtopic: rescued.subtopic,
      rationale: rescued.rationale,
      confidence: rescued.confidence,
    });
  }

  const result = {
    pages: pdf.pages.map((page) => byPage.get(page.pageNumber)!).sort((a, b) => a.pageNumber - b.pageNumber),
  } satisfies IndexResponse;
  await writeJson(cachePath, result);
  return result;
}

function splitIntoContiguousRuns(pageNumbers: number[]) {
  if (!pageNumbers.length) return [];

  const runs: number[][] = [];
  let currentRun = [pageNumbers[0]];

  for (let i = 1; i < pageNumbers.length; i += 1) {
    const pageNumber = pageNumbers[i];
    if (pageNumber === currentRun[currentRun.length - 1] + 1) {
      currentRun.push(pageNumber);
      continue;
    }

    runs.push(currentRun);
    currentRun = [pageNumber];
  }

  runs.push(currentRun);
  return runs;
}

function buildTopicPacketPrompt(pdf: ExtractedPdf, contentPages: IndexedPage[]) {
  const payload = contentPages.map((page) => ({
    pageNumber: page.pageNumber,
    topic: page.topic,
    subtopic: page.subtopic,
    questionQuota: page.questionQuota,
    cleanedText: excerpt(getSourceText(pdf, page.pageNumber), 1400),
  }));

  return [
    `You are grouping OCRed PT365 pages from "${pdf.pdfLabel}" into single-topic packets for UPSC CSE Prelims question generation.`,
    "",
    "Goal:",
    "- group the pages into coherent micro-topic packets",
    "- each packet should be suitable for one focused Gemini generation call",
    "- every usable content page must appear exactly once across all packets",
    "",
    "Packeting rules:",
    "- each packet must represent one clear UPSC-examinable topic or subtopic",
    "- prefer 1 to 2 adjacent pages per packet; 3 only if the topic clearly continues",
    "- do not mix unrelated schemes, institutions, tools, or initiatives merely because they are under the same broad chapter",
    "- if a page contains multiple unrelated items, keep it standalone instead of forcing a merge",
    "- pageNumbers within a packet should be adjacent",
    "- questionQuota should be the realistic final accepted question count for the packet, not the raw candidate count",
    "- topic and subtopic should be concise and publication-ready",
    "",
    "Quality bar:",
    "- optimize for close-to-real UPSC prelims questions with plausible distractors",
    "- prefer packets that help statement-based, comparison-based, institution-feature, or mechanism-based questions",
    "- avoid over-packing weak or fragmented pages",
    "",
    "Return JSON only.",
    "",
    `PAGES = ${JSON.stringify(payload)}`,
  ].join("\n");
}

function buildFallbackTopicPackets(index: IndexResponse): TopicPacket[] {
  const contentPages = index.pages.filter(
    (page) => page.classification === "content" && page.questionQuota > 0,
  );

  return contentPages.map((page, indexWithinPdf) => ({
    id: `packet-${String(indexWithinPdf + 1).padStart(3, "0")}-${slugify(page.subtopic || page.topic || `page-${page.pageNumber}`)}`,
    topic: normalizeWhitespace(page.topic || "Unknown Topic"),
    subtopic: normalizeWhitespace(page.subtopic || page.topic || `Page ${page.pageNumber}`),
    pageNumbers: [page.pageNumber],
    questionQuota: Math.max(1, Math.min(8, page.questionQuota)),
    rationale: "Fallback single-page packet derived from page-level indexing.",
  }));
}

async function buildTopicPackets(
  pdf: ExtractedPdf,
  index: IndexResponse,
  pdfCacheDir: string,
  args: Args,
) {
  const cachePath = path.join(pdfCacheDir, "packets.json");
  if (!args.overwrite) {
    const cached = await readJson<TopicPacket[]>(cachePath);
    if (cached) return cached;
  }

  const contentPages = index.pages.filter(
    (page) => page.classification === "content" && page.questionQuota > 0,
  );

  if (!contentPages.length) {
    await writeJson(cachePath, []);
    return [] satisfies TopicPacket[];
  }

  let drafts: TopicPacketDraft[] = [];

  try {
    const response = await callGeminiJson<PacketResponse>({
      model: args.indexModel,
      schema: PACKET_SCHEMA,
      prompt: buildTopicPacketPrompt(pdf, contentPages),
      temperature: 0.2,
    });
    drafts = response.packets ?? [];
  } catch (error) {
    console.warn(
      `  Topic packeting fallback engaged for ${pdf.fileName}: ${error instanceof Error ? error.message : error}`,
    );
  }

  const contentPageMap = new Map(contentPages.map((page) => [page.pageNumber, page]));
  const usedPages = new Set<number>();
  const packets: TopicPacket[] = [];

  const pushPacket = (
    draft: Pick<TopicPacketDraft, "topic" | "subtopic" | "questionQuota" | "rationale">,
    pageNumbers: number[],
  ) => {
    const uniquePageNumbers = [...new Set(pageNumbers)]
      .filter((pageNumber) => contentPageMap.has(pageNumber) && !usedPages.has(pageNumber))
      .sort((left, right) => left - right);

    for (const run of splitIntoContiguousRuns(uniquePageNumbers)) {
      if (!run.length) continue;

      const firstPage = contentPageMap.get(run[0])!;
      const sumQuota = run.reduce(
        (total, pageNumber) => total + (contentPageMap.get(pageNumber)?.questionQuota ?? 0),
        0,
      );
      const packet: TopicPacket = {
        id: `packet-${String(packets.length + 1).padStart(3, "0")}-${slugify(
          draft.subtopic || draft.topic || `pages-${run.join("-")}`,
        )}`,
        topic: normalizeWhitespace(draft.topic || firstPage.topic || "Unknown Topic"),
        subtopic: normalizeWhitespace(
          draft.subtopic || firstPage.subtopic || firstPage.topic || `Pages ${run.join(", ")}`,
        ),
        pageNumbers: run,
        questionQuota: Math.max(1, Math.min(12, Math.min(sumQuota, Math.round(draft.questionQuota)))),
        rationale: normalizeWhitespace(draft.rationale || "Model-created topic packet."),
      };

      packets.push(packet);
      for (const pageNumber of run) {
        usedPages.add(pageNumber);
      }
    }
  };

  for (const draft of drafts) {
    pushPacket(draft, draft.pageNumbers ?? []);
  }

  for (const fallback of buildFallbackTopicPackets(index)) {
    if (fallback.pageNumbers.every((pageNumber) => usedPages.has(pageNumber))) {
      continue;
    }

    pushPacket(fallback, fallback.pageNumbers);
  }

  packets.sort((left, right) => left.pageNumbers[0] - right.pageNumbers[0]);
  const normalizedPackets = packets.map((packet, indexWithinPdf) => ({
    ...packet,
    id: `packet-${String(indexWithinPdf + 1).padStart(3, "0")}-${slugify(
      packet.subtopic || packet.topic || `pages-${packet.pageNumbers.join("-")}`,
    )}`,
  }));

  await writeJson(cachePath, normalizedPackets);
  return normalizedPackets;
}

function getSourceText(pdf: ExtractedPdf, pageNumber: number) {
  const page = pdf.pages.find((item) => item.pageNumber === pageNumber);
  if (!page) return "";
  return page.rescuedText || page.cleanedText;
}

function buildPacketSourceText(pdf: ExtractedPdf, pageNumbers: number[], perPageMaxLength = 3200) {
  return pageNumbers
    .map((pageNumber) => {
      const pageText = excerpt(getSourceText(pdf, pageNumber), perPageMaxLength);
      return [`[Page ${String(pageNumber).padStart(3, "0")}]`, pageText].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

function formatPacketPages(pageNumbers: number[]) {
  return pageNumbers.map((pageNumber) => String(pageNumber).padStart(3, "0")).join(", ");
}

function buildSectionPrompt(packet: TopicPacket, packetText: string) {
  return [
    "You are extracting section-level study blocks from a PT365 topic packet.",
    "",
    "Goal:",
    "- split the packet into the smallest coherent UPSC-examinable sections",
    "- each section should cover one clear concept cluster",
    "- if the packet is already atomic, return one section only",
    "",
    "Rules:",
    "- split by headings, subheadings, or clear concept shifts",
    "- do not merge unrelated institutions, schemes, tools, or initiatives",
    "- sectionExcerpt should summarize only that section's grounded content",
    "- evidenceBullets should list the strongest factual anchors for question generation",
    "- questionQuota should be a realistic final accepted question count for the section",
    "- pageNumbers must be chosen only from the packet pages",
    "",
    `Packet topic: ${packet.topic}`,
    `Packet subtopic: ${packet.subtopic}`,
    `Packet pages: ${formatPacketPages(packet.pageNumbers)}`,
    "",
    "SOURCE PACKET TEXT:",
    packetText,
  ].join("\n");
}

function buildFallbackSections(pdf: ExtractedPdf, packet: TopicPacket): Section[] {
  const packetText = buildPacketSourceText(pdf, packet.pageNumbers, 2200);
  const evidenceBullets = packetText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("[Page"))
    .slice(0, 5);

  return [
    {
      id: `${packet.id}-section-001-${slugify(packet.subtopic || packet.topic)}`,
      packetId: packet.id,
      topic: packet.topic,
      subtopic: packet.subtopic,
      title: packet.subtopic || packet.topic,
      focus: packet.rationale,
      pageNumbers: packet.pageNumbers,
      questionQuota: Math.max(1, Math.min(6, packet.questionQuota)),
      rationale: "Fallback section derived from packet-level grouping.",
      sectionExcerpt: excerpt(packetText, 2500),
      evidenceBullets,
    },
  ];
}

async function buildSectionsForPacket(
  pdf: ExtractedPdf,
  packet: TopicPacket,
  pdfCacheDir: string,
  args: Args,
) {
  const cachePath = path.join(pdfCacheDir, "sections", `${packet.id}.json`);
  if (!args.overwrite) {
    const cached = await readJson<Section[]>(cachePath);
    if (cached) return cached;
  }

  const packetText = excerpt(buildPacketSourceText(pdf, packet.pageNumbers), 12_000);
  let drafts: SectionDraft[] = [];

  try {
    const response = await callGeminiJson<SectionResponse>({
      model: args.reviewModel,
      schema: SECTION_SCHEMA,
      prompt: buildSectionPrompt(packet, packetText),
      temperature: 0.15,
    });
    drafts = response.sections ?? [];
  } catch (error) {
    console.warn(
      `  Section extraction fallback engaged for ${packet.id}: ${error instanceof Error ? error.message : error}`,
    );
  }

  const allowedPages = new Set(packet.pageNumbers);
  const sections = (drafts.length ? drafts : buildFallbackSections(pdf, packet))
    .map((section, indexWithinPacket) => {
      const pageNumbers = [...new Set(section.pageNumbers ?? [])]
        .filter((pageNumber) => allowedPages.has(pageNumber))
        .sort((left, right) => left - right);

      return {
        id: `${packet.id}-section-${String(indexWithinPacket + 1).padStart(3, "0")}-${slugify(
          section.title || section.focus || packet.subtopic,
        )}`,
        packetId: packet.id,
        topic: packet.topic,
        subtopic: packet.subtopic,
        title: normalizeWhitespace(section.title || packet.subtopic || packet.topic),
        focus: normalizeWhitespace(section.focus || packet.rationale),
        pageNumbers: pageNumbers.length ? pageNumbers : packet.pageNumbers,
        questionQuota: Math.max(1, Math.min(8, Math.round(section.questionQuota || 1))),
        rationale: normalizeWhitespace(section.rationale || "Model-extracted section."),
        sectionExcerpt: normalizeWhitespace(
          section.sectionExcerpt || excerpt(packetText, 2200),
        ),
        evidenceBullets: (section.evidenceBullets ?? []).map(normalizeWhitespace).filter(Boolean).slice(0, 8),
      } satisfies Section;
    })
    .filter((section, index, all) =>
      all.findIndex((candidate) => candidate.title.toLowerCase() === section.title.toLowerCase()) === index,
    );

  const normalizedSections = sections.length ? sections : buildFallbackSections(pdf, packet);
  await writeJson(cachePath, normalizedSections);
  return normalizedSections;
}

function buildClaimPrompt(section: Section) {
  return [
    "You are extracting atomic UPSC-relevant claims from a section.",
    "",
    "Goal:",
    "- extract only grounded, testable claims",
    "- prefer claims that can support statement-based, correct-pair, comparison, or institution-feature questions",
    "",
    "Rules:",
    "- one claim should express one factual or conceptual unit",
    "- evidenceExcerpt must directly support the claim",
    "- distractorHooks should describe likely near-miss distractors",
    "- do not invent anything beyond the section excerpt and bullets",
    "",
    `Topic: ${section.topic}`,
    `Subtopic: ${section.subtopic}`,
    `Section title: ${section.title}`,
    `Section pages: ${formatPacketPages(section.pageNumbers)}`,
    "",
    "SECTION EXCERPT:",
    section.sectionExcerpt,
    "",
    "SECTION EVIDENCE BULLETS:",
    section.evidenceBullets.length ? section.evidenceBullets.map((bullet) => `- ${bullet}`).join("\n") : "(none)",
  ].join("\n");
}

function buildFallbackClaims(section: Section): Claim[] {
  const sourceBullets = section.evidenceBullets.length
    ? section.evidenceBullets
    : section.sectionExcerpt.split("\n").filter(Boolean).slice(0, 4);

  return sourceBullets.map((bullet, indexWithinSection) => ({
    id: `claim-${String(indexWithinSection + 1).padStart(3, "0")}`,
    sectionId: section.id,
    claimType: "feature",
    claimText: bullet,
    evidenceExcerpt: bullet,
    pageNumbers: section.pageNumbers,
    examUse: "Could support a statement-based or institution-feature question.",
    distractorHooks: [],
  }));
}

async function extractClaimsForSection(
  section: Section,
  pdfCacheDir: string,
  args: Args,
) {
  const cachePath = path.join(pdfCacheDir, "claims", `${section.id}.json`);
  if (!args.overwrite) {
    const cached = await readJson<Claim[]>(cachePath);
    if (cached) return cached;
  }

  let drafts: ClaimDraft[] = [];

  try {
    const response = await callGeminiJson<ClaimResponse>({
      model: args.reviewModel,
      schema: CLAIM_SCHEMA,
      prompt: buildClaimPrompt(section),
      temperature: 0.1,
    });
    drafts = response.claims ?? [];
  } catch (error) {
    console.warn(
      `  Claim extraction fallback engaged for ${section.id}: ${error instanceof Error ? error.message : error}`,
    );
  }

  const allowedPages = new Set(section.pageNumbers);
  const claims = (drafts.length ? drafts : buildFallbackClaims(section))
    .map((claim, indexWithinSection) => ({
      id: `claim-${String(indexWithinSection + 1).padStart(3, "0")}`,
      sectionId: section.id,
      claimType: normalizeWhitespace(claim.claimType || "feature"),
      claimText: normalizeWhitespace(claim.claimText || ""),
      evidenceExcerpt: normalizeWhitespace(claim.evidenceExcerpt || ""),
      pageNumbers: [...new Set(claim.pageNumbers ?? [])]
        .filter((pageNumber) => allowedPages.has(pageNumber))
        .sort((left, right) => left - right),
      examUse: normalizeWhitespace(claim.examUse || ""),
      distractorHooks: (claim.distractorHooks ?? []).map(normalizeWhitespace).filter(Boolean).slice(0, 6),
    } satisfies Claim))
    .filter((claim) => claim.claimText.length >= 12 && claim.evidenceExcerpt.length >= 12)
    .filter((claim, index, all) =>
      all.findIndex((candidate) => candidate.claimText.toLowerCase() === claim.claimText.toLowerCase()) === index,
    );

  const normalizedClaims = claims.length ? claims : buildFallbackClaims(section);
  await writeJson(cachePath, normalizedClaims);
  return normalizedClaims;
}

function buildSectionSourceText(section: Section, claims: Claim[]) {
  const claimText = claims.length
    ? claims.map((claim, indexWithinSection) => [
        `${indexWithinSection + 1}. [${claim.claimType}] ${claim.claimText}`,
        `Evidence: ${claim.evidenceExcerpt}`,
        claim.examUse ? `Exam use: ${claim.examUse}` : "",
        claim.distractorHooks.length ? `Distractor hooks: ${claim.distractorHooks.join("; ")}` : "",
      ].filter(Boolean).join("\n")).join("\n\n")
    : "(none)";

  return [
    `SECTION TITLE: ${section.title}`,
    `SECTION FOCUS: ${section.focus}`,
    `SECTION PAGES: ${formatPacketPages(section.pageNumbers)}`,
    "",
    "SECTION EXCERPT:",
    section.sectionExcerpt,
    "",
    "SECTION EVIDENCE BULLETS:",
    section.evidenceBullets.length ? section.evidenceBullets.map((bullet) => `- ${bullet}`).join("\n") : "(none)",
    "",
    "ATOMIC CLAIMS:",
    claimText,
  ].join("\n");
}

function buildGenerationPrompt({
  pdf,
  section,
  sectionText,
  candidateCount,
  roundLabel,
  roundInstructions,
  existingPrompts,
}: {
  pdf: ExtractedPdf;
  section: Section;
  sectionText: string;
  candidateCount: number;
  roundLabel: string;
  roundInstructions: readonly string[];
  existingPrompts: string[];
}) {
  return [
    `You are generating UPSC CSE Prelims-quality current-affairs MCQs from Vision IAS source material.`,
    `Generation round: ${roundLabel}`,
    "",
    "Internal workflow:",
    "- First identify the strongest distinct examinable concepts in the section.",
    "- Prefer concepts that permit elimination between close alternatives, subtle distinctions, or application of features.",
    "- Do not ask multiple questions about the same narrow fact unless the angle is materially different.",
    "",
    "Objective:",
    `Generate up to ${candidateCount} strong candidate questions from the source section.`,
    "",
    "Quality bar:",
    "- The questions must feel as close as possible to real UPSC prelims.",
    "- Prefer conceptual, statement-based, assertion-reason, correct-pair, institution-feature, treaty-feature, scheme-feature, or comparison-driven questions.",
    "- Avoid low-value trivia, direct line-lift recall, or coaching-style gimmicks.",
    "- Every distractor must be plausible and parallel to the correct option.",
    "- Only one option may be correct.",
    "- Use only facts supported by the source material. If the section is too thin, return fewer questions.",
    "- If a fact pattern only supports a direct recall question, skip it unless the distractors can be genuinely close.",
    "- Questions may synthesize information across the section's pages, but must remain within one coherent micro-topic.",
    "",
    "Option-quality rules:",
    "- No joke options, no obviously wrong fillers.",
    "- Keep all four options in the same semantic class.",
    "- Avoid clueing via length, grammatical mismatch, or 'all/none' shortcuts unless the source truly supports it.",
    "",
    "Style rules:",
    "- UPSC tone should be formal, terse, and elimination-friendly.",
    "- At least half the output should be statement-based, correct-pair, or feature-matching unless the source strongly favors another format.",
    "- A good distractor is near-correct for a principled reason, not because it is random.",
    "- Avoid stems that simply ask the candidate to repeat a list from the section.",
    "",
    `Special focus for ${roundLabel}:`,
    ...roundInstructions.map((instruction) => `- ${instruction}`),
    "",
    "Explain the answer briefly and provide a short evidenceExcerpt grounded in the section text.",
    `Default subject for this PDF: ${pdf.defaultSubject}`,
    `Section topic: ${section.topic || "Unknown"}`,
    `Section subtopic: ${section.subtopic || "Unknown"}`,
    `Section title: ${section.title || "Unknown"}`,
    `Section pages: ${formatPacketPages(section.pageNumbers)}`,
    "",
    "Avoid repeating or paraphrasing these existing candidate stems:",
    existingPrompts.length ? existingPrompts.map((prompt) => `- ${prompt}`).join("\n") : "(none)",
    "",
    "SOURCE SECTION TEXT:",
    sectionText,
  ].join("\n");
}

function sanitizeQuestion(question: CandidateQuestion): CandidateQuestion | null {
  const prompt = formatQuestionPrompt(question.prompt);
  if (prompt.length < 20) return null;
  if (!OPTION_IDS.includes(question.correctOptionId)) return null;
  if (!Array.isArray(question.options) || question.options.length !== 4) return null;

  const options = question.options.map((option, index) => ({
    id: OPTION_IDS[index],
    text: normalizeWhitespace(option.text ?? ""),
  }));

  if (options.some((option) => option.text.length < 2)) return null;
  if (new Set(options.map((option) => option.text.toLowerCase())).size !== 4) return null;
  if (options.some((option) => /\b1\b/.test(option.text)) && !/\b1\./.test(prompt)) return null;
  if (
    /consider the following (statements|pairs)/i.test(prompt) &&
    !/\b1\./.test(prompt)
  ) {
    return null;
  }

  return {
    ...question,
    prompt,
    contextLines: (question.contextLines ?? []).map(normalizeWhitespace).filter(Boolean),
    options,
    explanation: normalizeWhitespace(question.explanation),
    takeaway: normalizeWhitespace(question.takeaway),
    evidenceExcerpt: normalizeWhitespace(question.evidenceExcerpt),
  };
}

function alignQuestionSubject(question: CandidateQuestion, defaultSubject: Subject): CandidateQuestion {
  if (defaultSubject === "Current Affairs" || question.subject !== "Current Affairs") {
    return question;
  }

  return {
    ...question,
    subject: defaultSubject,
  };
}

function candidateFingerprint(question: Pick<CandidateQuestion, "prompt" | "options">) {
  const normalizedPrompt = normalizeWhitespace(question.prompt)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const normalizedOptions = question.options
    .map((option) =>
      normalizeWhitespace(option.text)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim(),
    )
    .join("|");

  return `${normalizedPrompt}::${normalizedOptions}`;
}

async function generateCandidatesForSection(
  pdf: ExtractedPdf,
  section: Section,
  claims: Claim[],
  pdfCacheDir: string,
  args: Args,
) {
  const cachePath = path.join(
    pdfCacheDir,
    "generated",
    `${section.id}.json`,
  );

  if (!args.overwrite) {
    const cached = await readJson<CandidateResponse>(cachePath);
    if (cached) return cached;
  }

  const sectionText = excerpt(buildSectionSourceText(section, claims), 12_000);
  const candidateCount = Math.min(Math.max(section.questionQuota + 2, 5), 10);
  const seen = new Set<string>();
  const questions: CandidateQuestion[] = [];
  const candidateModels = modelFallbackChain(args.generateModel);

  for (const round of GENERATION_ROUNDS) {
    const { modelUsed, value } = await callGeminiJsonWithFallback<CandidateResponse>({
      models: candidateModels,
      schema: CANDIDATE_SCHEMA,
      prompt: buildGenerationPrompt({
        pdf,
        section,
        sectionText,
        candidateCount,
        roundLabel: round.label,
        roundInstructions: round.instructions,
        existingPrompts: questions.map((question) => question.prompt),
      }),
      temperature: 0.45,
    });

    if (modelUsed !== args.generateModel) {
      console.warn(
        `  Fallback generation model used for section "${section.title}": ${modelUsed}`,
      );
    }

    for (const question of value.questions ?? []) {
      const sanitizedQuestion = sanitizeQuestion(alignQuestionSubject(question, pdf.defaultSubject));
      if (!sanitizedQuestion) continue;
      const fingerprint = candidateFingerprint(sanitizedQuestion);
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      questions.push(sanitizedQuestion);
    }
  }

  const sanitized = { questions } satisfies CandidateResponse;

  await writeJson(cachePath, sanitized);
  return sanitized;
}

function buildReviewPrompt({
  pdf,
  section,
  sectionText,
  candidates,
}: {
  pdf: ExtractedPdf;
  section: Section;
  sectionText: string;
  candidates: CandidateQuestion[];
}) {
  return [
    "You are the final quality controller for UPSC CSE Prelims MCQs.",
    "",
    "Task:",
    `Select and rewrite up to ${section.questionQuota} questions from the candidate set.`,
    "",
    "Hard filters:",
    "- Reject any unsupported, weak, trivial, ambiguous, repetitive, or non-UPSC-feeling question.",
    "- Reject any question whose distractors are not close, plausible, and parallel.",
    "- Reject questions that depend on facts not grounded in the source text.",
    "- Keep fewer than the quota if the quality bar cannot be met.",
    "",
    "Rewrite rules:",
    "- Improve wording to sound like real UPSC prelims.",
    "- If a candidate is salvageable, rewrite it into a stronger UPSC-style question instead of rejecting it outright.",
    "- Prefer a set that covers different concepts from the section rather than near-duplicates on one fact cluster.",
    "- Keep exactly one correct option.",
    "- explanation must justify the answer tightly.",
    "- qualityScore should be conservative; only genuinely strong questions should score above 85.",
    "",
    `PDF: ${pdf.pdfLabel}`,
    `Pages: ${formatPacketPages(section.pageNumbers)}`,
    `Topic: ${section.topic || "Unknown"}`,
    `Subtopic: ${section.subtopic || "Unknown"}`,
    `Section title: ${section.title || "Unknown"}`,
    "",
    "SOURCE SECTION TEXT:",
    sectionText,
    "",
    `CANDIDATES = ${JSON.stringify(candidates)}`,
  ].join("\n");
}

async function reviewSectionQuestions(
  pdf: ExtractedPdf,
  section: Section,
  claims: Claim[],
  candidates: CandidateQuestion[],
  pdfCacheDir: string,
  args: Args,
) {
  const cachePath = path.join(
    pdfCacheDir,
    "reviewed",
    `${section.id}.json`,
  );

  if (!args.overwrite) {
    const cached = await readJson<ReviewResponse>(cachePath);
    if (cached) return cached;
  }

  const sectionText = excerpt(buildSectionSourceText(section, claims), 12_000);
  const { modelUsed, value } = await callGeminiJsonWithFallback<ReviewResponse>({
    models: modelFallbackChain(args.reviewModel),
    schema: REVIEW_SCHEMA,
    prompt: buildReviewPrompt({
      pdf,
      section,
      sectionText,
      candidates,
    }),
    temperature: 0.15,
  });

  if (modelUsed !== args.reviewModel) {
    console.warn(
      `  Fallback review model used for section "${section.title}": ${modelUsed}`,
    );
  }

  const sanitized = {
    acceptedQuestions: (value.acceptedQuestions ?? [])
      .map((question) => sanitizeQuestion(alignQuestionSubject(question, pdf.defaultSubject)))
      .filter((question): question is ReviewedQuestion => question !== null)
      .filter((question) => question.qualityScore >= 85)
      .filter((question, index, all) =>
        all.findIndex((candidate) => candidateFingerprint(candidate) === candidateFingerprint(question)) === index,
      )
      .sort((left, right) => right.qualityScore - left.qualityScore)
      .slice(0, section.questionQuota),
    reviewerNotes: normalizeWhitespace(value.reviewerNotes ?? ""),
  } satisfies ReviewResponse;

  await writeJson(cachePath, sanitized);
  return sanitized;
}

function fingerprintQuestion(question: ReviewedQuestion) {
  return normalizeWhitespace(question.prompt)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildQuestionId(finalQuestion: Omit<FinalQuestion, "id">) {
  const fingerprint = JSON.stringify(
    {
      year: finalQuestion.year,
      sourcePdf: finalQuestion.sourcePdf,
      sourcePages: finalQuestion.sourcePages,
      sourceSection: finalQuestion.sourceSection,
      prompt: finalQuestion.prompt,
      options: finalQuestion.options.map((option) => option.text),
    },
    null,
    0,
  );
  return `ca-${finalQuestion.year}-${createHash("sha1").update(fingerprint, "utf8").digest("hex").slice(0, 12)}`;
}

function toCsvCell(value: string | number) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, "\"\"")}"`;
}

async function exportQuestions(questions: FinalQuestion[], outDir: string) {
  const jsonPath = path.join(outDir, "final-questions.json");
  const csvPath = path.join(outDir, "final-questions.csv");
  const reportPath = path.join(outDir, "report.json");

  await writeJson(jsonPath, questions);

  const header = [
    "year",
    "source",
    "exam",
    "question_number",
    "question",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "correct_option",
    "subject",
    "explanation",
    "takeaway",
    "source_pdf",
    "source_pages",
    "section_title",
    "evidence_excerpt",
    "quality_score",
    "topic",
    "sub_topic",
  ];

  const rows = questions.map((question) => {
    const fullQuestion = [
      ...(question.contextLines ?? []),
      question.prompt,
    ].filter(Boolean).join("\n");

    return [
      question.year,
      question.source,
      question.exam,
      question.questionNumber,
      fullQuestion,
      question.options[0]?.text ?? "",
      question.options[1]?.text ?? "",
      question.options[2]?.text ?? "",
      question.options[3]?.text ?? "",
      question.correctOptionId,
      question.subject,
      question.explanation,
      question.takeaway,
      question.sourcePdf,
      question.sourcePages.join(","),
      question.sourceSection,
      question.evidenceExcerpt,
      question.qualityScore,
      question.sourceTopic,
      question.sourceSubtopic,
    ].map(toCsvCell).join(",");
  });

  await mkdir(outDir, { recursive: true });
  await writeFile(csvPath, `${header.join(",")}\n${rows.join("\n")}\n`, "utf8");

  const report = {
    totalQuestions: questions.length,
    byPdf: questions.reduce<Record<string, number>>((acc, question) => {
      acc[question.sourcePdf] = (acc[question.sourcePdf] ?? 0) + 1;
      return acc;
    }, {}),
    bySubject: questions.reduce<Record<string, number>>((acc, question) => {
      acc[question.subject] = (acc[question.subject] ?? 0) + 1;
      return acc;
    }, {}),
    byTopic: questions.reduce<Record<string, number>>((acc, question) => {
      const key = `${question.sourceTopic} :: ${question.sourceSubtopic}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
    bySection: questions.reduce<Record<string, number>>((acc, question) => {
      const key = `${question.sourceSubtopic} :: ${question.sourceSection}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
    averageQualityScore:
      questions.length > 0
        ? Number(
            (
              questions.reduce((sum, question) => sum + question.qualityScore, 0) / questions.length
            ).toFixed(2),
          )
        : 0,
  };
  await writeJson(reportPath, report);
}

async function exportHumanReviewPack(questions: FinalQuestion[], outDir: string) {
  const reviewDir = path.join(outDir, "review");
  const reviewJsonPath = path.join(reviewDir, "human-review-pack.json");
  const reviewCsvPath = path.join(reviewDir, "human-review-sheet.csv");
  const reviewGuidePath = path.join(reviewDir, "REVIEW.md");

  const reviewQuestions = questions.map((question) => ({
    approval_status: "pending",
    reviewer_notes: "",
    ...question,
  }));

  await writeJson(reviewJsonPath, {
    workflow: "Review after model generation/review and before any import into the bank.",
    totalQuestions: reviewQuestions.length,
    questions: reviewQuestions,
  });

  const header = [
    "question_id",
    "approval_status",
    "reviewer_notes",
    "year",
    "exam",
    "question_number",
    "question",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "correct_option",
    "subject",
    "quality_score",
    "source_pdf",
    "source_pages",
    "topic",
    "sub_topic",
    "section_title",
    "evidence_excerpt",
    "explanation",
    "takeaway",
  ];

  const rows = reviewQuestions.map((question) => [
    question.id,
    question.approval_status,
    question.reviewer_notes,
    question.year,
    question.exam,
    question.questionNumber,
    [...(question.contextLines ?? []), question.prompt].filter(Boolean).join("\n"),
    question.options[0]?.text ?? "",
    question.options[1]?.text ?? "",
    question.options[2]?.text ?? "",
    question.options[3]?.text ?? "",
    question.correctOptionId,
    question.subject,
    question.qualityScore,
    question.sourcePdf,
    question.sourcePages.join(","),
    question.sourceTopic,
    question.sourceSubtopic,
    question.sourceSection,
    question.evidenceExcerpt,
    question.explanation,
    question.takeaway,
  ].map(toCsvCell).join(","));

  await mkdir(reviewDir, { recursive: true });
  await writeFile(reviewCsvPath, `${header.join(",")}\n${rows.join("\n")}\n`, "utf8");
  await writeFile(
    reviewGuidePath,
    [
      "# Human Review",
      "",
      "Review stage: after model generation and model review, before import.",
      "",
      "Open `human-review-sheet.csv` and fill `approval_status` with one of:",
      "- approved",
      "- edited",
      "- rejected",
      "",
      "Use `reviewer_notes` for fixes, objections, or edit instructions.",
      "Import to the bank only after this review pass is complete.",
    ].join("\n"),
    "utf8",
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputDir = path.resolve(args.inputDir);
  const inputStat = await stat(inputDir);

  if (!inputStat.isDirectory()) {
    throw new Error(`Input path is not a directory: ${inputDir}`);
  }

  const fileNames = (await readdir(inputDir))
    .filter((fileName) => fileName.toLowerCase().endsWith(".pdf"))
    .filter((fileName) =>
      args.onlyPdfIncludes ? fileName.toLowerCase().includes(args.onlyPdfIncludes) : true,
    )
    .sort();

  if (!fileNames.length) {
    throw new Error(`No PDFs found in ${inputDir}`);
  }

  await mkdir(args.outDir, { recursive: true });
  const cacheRoot = path.join(args.outDir, "cache");
  await mkdir(cacheRoot, { recursive: true });

  console.log(
    [
      `Models: index=${args.indexModel}`,
      `generate=${args.generateModel}`,
      `review=${args.reviewModel}`,
      `concurrency=${args.requestConcurrency}`,
    ].join(" | "),
  );

  const finalQuestions: FinalQuestion[] = [];
  let globalQuestionNumber = 1;
  let lastExportedQuestionCount = 0;

  const exportCheckpoint = async () => {
    if (finalQuestions.length === lastExportedQuestionCount) {
      return;
    }

    await exportQuestions(finalQuestions, args.outDir);
    await exportHumanReviewPack(finalQuestions, args.outDir);
    lastExportedQuestionCount = finalQuestions.length;
    console.log(`  Checkpoint export: ${finalQuestions.length} questions`);
  };

  for (const fileName of fileNames) {
    const pdfPath = path.join(inputDir, fileName);
    const pdfSlug = slugify(fileName.replace(/\.pdf$/i, ""));
    const pdfCacheDir = path.join(cacheRoot, pdfSlug);

    console.log(`\nProcessing PDF: ${fileName}`);

    const extracted = await extractPdf(pdfPath, args, pdfCacheDir);
    await ensurePdfOcr(extracted, pdfCacheDir, args);
    const index = await buildPdfIndex(extracted, pdfCacheDir, args);
    const packets = await buildTopicPackets(extracted, index, pdfCacheDir, args);

    let acceptedForPdf = 0;
    for (const packet of packets) {
      if (packet.questionQuota <= 0) continue;

      const sections = await buildSectionsForPacket(extracted, packet, pdfCacheDir, args);
      const sectionRuns = await mapWithConcurrency(
        sections.filter((section) => section.questionQuota > 0),
        args.requestConcurrency,
        async (section): Promise<SectionRunResult> => {
          let stage: SectionFailureStage = "claims";

          try {
            const claims = await extractClaimsForSection(section, pdfCacheDir, args);
            stage = "generation";
            const candidates = await generateCandidatesForSection(extracted, section, claims, pdfCacheDir, args);

            if (!candidates.questions.length) {
              return {
                section,
                failed: false,
                review: {
                  acceptedQuestions: [],
                  reviewerNotes: "No candidates generated for this section.",
                } satisfies ReviewResponse,
              };
            }

            stage = "review";
            const review = await reviewSectionQuestions(
              extracted,
              section,
              claims,
              candidates.questions,
              pdfCacheDir,
              args,
            );

            return {
              section,
              review,
              failed: false,
            };
          } catch (error) {
            const attemptedModels =
              stage === "generation"
                ? modelFallbackChain(args.generateModel)
                : stage === "review"
                  ? modelFallbackChain(args.reviewModel)
                  : modelFallbackChain(args.reviewModel);

            await writeSectionFailure(pdfCacheDir, section, stage, attemptedModels, error);
            console.warn(
              `  Section failed pages=${formatPacketPages(section.pageNumbers)} title="${section.title}" stage=${stage} error=${summarizeError(error)}`,
            );

            return {
              section,
              failed: true,
              review: {
                acceptedQuestions: [],
                reviewerNotes: `Section failed at ${stage}: ${summarizeError(error)}`,
              } satisfies ReviewResponse,
            };
          }
        },
      );

      for (const { section, review, failed } of sectionRuns) {
        for (const reviewedQuestion of review.acceptedQuestions) {
          const fingerprint = fingerprintQuestion(reviewedQuestion);
          if (finalQuestions.some((existing) => fingerprintQuestion(existing) === fingerprint)) {
            continue;
          }

          const finalQuestionBase = {
            ...reviewedQuestion,
            source: "subject" as const,
            year: args.year,
            exam: `PT365 Current Affairs ${args.year}`,
            questionNumber: globalQuestionNumber,
            sourcePdf: extracted.fileName,
            sourcePages: section.pageNumbers,
            sourceTopic: packet.topic,
            sourceSubtopic: packet.subtopic,
            sourceSection: section.title,
          };

          finalQuestions.push({
            ...finalQuestionBase,
            id: buildQuestionId(finalQuestionBase),
          });
          globalQuestionNumber += 1;
          acceptedForPdf += 1;
        }

        console.log(
          `  Section pages=${formatPacketPages(section.pageNumbers)} title="${section.title}" quota=${section.questionQuota} accepted=${review.acceptedQuestions.length}${failed ? " failed=true" : ""}`,
        );
      }

      console.log(
        `  Packet pages=${formatPacketPages(packet.pageNumbers)} topic="${packet.subtopic}" sections=${sectionRuns.length}`,
      );

      await exportCheckpoint();
    }

    console.log(`  Accepted questions from PDF: ${acceptedForPdf}`);
    await exportCheckpoint();
  }

  await exportCheckpoint();
  console.log(`\nDone. Final questions: ${finalQuestions.length}`);
  console.log(`Output: ${args.outDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
