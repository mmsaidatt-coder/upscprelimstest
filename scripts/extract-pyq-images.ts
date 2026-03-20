/**
 * Extract complete PYQ questions from scanned paper images using Gemini Vision.
 *
 * Usage:
 *   npx tsx scripts/extract-pyq-images.ts "/path/to/image/folder" 2025
 *
 * Requires GEMINI_API_KEY in .env.local
 */

import { readFileSync, readdirSync } from "node:fs";
import { writeFileSync } from "node:fs";
import { resolve, extname, basename } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env.local");
  process.exit(1);
}

type ExtractedQuestion = {
  question_number: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
};

const EXTRACTION_PROMPT = `You are extracting UPSC Civil Services Preliminary Examination questions from a scanned paper image.

Extract ALL questions visible on this page. For each question, capture the COMPLETE text including:
- The full question stem/prompt
- ALL numbered statements (I, II, III, IV, etc.) with their COMPLETE text
- ALL pairs/matches in tables if present
- The final question line (e.g., "Which of the statements given above is/are correct?")

For each question, also extract all 4 options exactly as written (a), (b), (c), (d).

CRITICAL RULES:
- Capture EVERY word of every statement. Do NOT summarize or truncate.
- If a question has statements like "Statement I:", "Statement II:", include the full text of each statement.
- If a question has a table or pairs, reproduce the pairs as text (e.g., "1. Name : Description")
- If a question continues from a previous page and you only see the options, skip it.
- If a question starts on this page but options are on the next page, still extract the question text and leave options empty.
- Ignore page numbers, headers, footers, and booklet codes.

Return ONLY a JSON array (no markdown, no code fences) with objects like:
[
  {
    "question_number": 7,
    "question": "The complete question text including all statements...",
    "option_a": "First option text",
    "option_b": "Second option text",
    "option_c": "Third option text",
    "option_d": "Fourth option text"
  }
]

If no questions are visible (e.g., instruction page), return an empty array: []`;

async function extractFromImage(imagePath: string): Promise<ExtractedQuestion[]> {
  const imageData = readFileSync(imagePath);
  const base64 = imageData.toString("base64");
  const ext = extname(imagePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          { text: EXTRACTION_PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`  Gemini API error: ${response.status} ${errorText.substring(0, 200)}`);
    return [];
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Parse JSON from response (strip markdown fences if present)
  const jsonMatch = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  try {
    const parsed = JSON.parse(jsonMatch);
    if (!Array.isArray(parsed)) return [];
    return parsed as ExtractedQuestion[];
  } catch {
    console.error(`  Failed to parse Gemini response for ${basename(imagePath)}`);
    console.error(`  Raw response: ${text.substring(0, 300)}`);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Usage: npx tsx scripts/extract-pyq-images.ts <image-folder> <year>");
    process.exit(0);
  }

  const folder = resolve(args[0]);
  const year = parseInt(args[1], 10);

  const imageFiles = readdirSync(folder)
    .filter((f) => [".jpg", ".jpeg", ".png"].includes(extname(f).toLowerCase()))
    .sort()
    .map((f) => resolve(folder, f));

  console.log(`Found ${imageFiles.length} images for year ${year}\n`);

  const allQuestions = new Map<number, ExtractedQuestion>();

  for (const file of imageFiles) {
    console.log(`Processing: ${basename(file)}`);
    const questions = await extractFromImage(file);
    console.log(`  Extracted ${questions.length} questions`);

    for (const q of questions) {
      if (q.question_number && q.question && q.option_a) {
        // Keep the version with the longest question text (most complete)
        const existing = allQuestions.get(q.question_number);
        if (!existing || q.question.length > existing.question.length) {
          allQuestions.set(q.question_number, q);
        }
      }
    }

    // Rate limiting — Gemini free tier has per-minute limits
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Sort by question number
  const sorted = Array.from(allQuestions.values()).sort(
    (a, b) => a.question_number - b.question_number,
  );

  console.log(`\nTotal unique questions extracted: ${sorted.length}`);

  // Write CSV
  const csvHeader = "year,exam,question_number,question,option_a,option_b,option_c,option_d";
  const csvRows = sorted.map((q) => {
    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    return [
      year,
      `UPSC Prelims GS1`,
      q.question_number,
      escape(q.question),
      escape(q.option_a),
      escape(q.option_b),
      escape(q.option_c),
      escape(q.option_d),
    ].join(",");
  });

  const csvContent = [csvHeader, ...csvRows].join("\n");
  const outPath = resolve(process.cwd(), `data/pyq-csv/${year}-gs1-complete.csv`);
  writeFileSync(outPath, csvContent, "utf-8");
  console.log(`\nCSV written to: ${outPath}`);
  console.log("Review the CSV, then run:");
  console.log(`  npm run import-pyq -- ${outPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
