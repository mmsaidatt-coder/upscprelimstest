/**
 * Identify and fill missing PYQ questions for years with < 100 questions.
 * Uses Gemini to identify which official UPSC GS Paper 1 questions are missing
 * from our database, then generates them with options, answers, and explanations.
 *
 * Run: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/fill-missing-pyqs.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const API_KEY = process.env.GEMINI_API_KEY!;
const MODEL = "gemini-3.1-pro-preview";

type Option = { id: string; text: string };
type DbQuestion = {
  id: string;
  prompt: string;
  options: Option[];
  correct_option_id: string | null;
  subject: string;
  explanation: string | null;
};

const VALID_SUBJECTS = [
  "Polity",
  "History",
  "Economy",
  "Geography",
  "Environment",
  "Science",
  "Current Affairs",
  "CSAT",
];

async function callGemini(prompt: string, retries = 3): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 65536,
            responseMimeType: "application/json",
          },
        }),
      });

      if (response.status === 429) {
        const wait = Math.min(30000, 5000 * (attempt + 1));
        console.log(`  Rate limited, waiting ${wait}ms...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error(`  Gemini error ${response.status}: ${text.slice(0, 300)}`);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        return null;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return typeof text === "string" ? text.trim() : null;
    } catch (err) {
      console.error(`  Network error:`, err instanceof Error ? err.message : err);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      return null;
    }
  }
  return null;
}

async function fetchExistingQuestions(year: number): Promise<DbQuestion[]> {
  const all: DbQuestion[] = [];
  let page = 0;
  const pageSize = 500;

  while (true) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, prompt, options, correct_option_id, subject, explanation")
      .eq("source", "pyq")
      .eq("year", year)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error(`Fetch error for ${year}:`, error.message);
      break;
    }
    if (!data || data.length === 0) break;
    all.push(...(data as DbQuestion[]));
    if (data.length < pageSize) break;
    page++;
  }

  return all;
}

function buildIdentifyPrompt(year: number, existingPrompts: string[]): string {
  const existingList = existingPrompts
    .map((p, i) => `${i + 1}. ${p.slice(0, 150)}`)
    .join("\n");

  return `You are a UPSC Civil Services exam expert with comprehensive knowledge of all past papers.

I have a database of UPSC Civil Services Preliminary Examination General Studies Paper I questions for the year ${year}.
The official paper has exactly 100 questions, but my database only has ${existingPrompts.length} questions.

Here are the questions I ALREADY HAVE in my database (showing first 150 characters of each):

${existingList}

Please identify ALL the questions from the official UPSC CSE Prelims ${year} GS Paper I that are MISSING from my database.

For each missing question, provide the COMPLETE question with all details.

Return a JSON array where each element has:
{
  "question_number": <number 1-100>,
  "prompt": "<full question text exactly as it appeared in the official paper>",
  "options": [
    {"id": "A", "text": "<option A text>"},
    {"id": "B", "text": "<option B text>"},
    {"id": "C", "text": "<option C text>"},
    {"id": "D", "text": "<option D text>"}
  ],
  "correct_option_id": "<A, B, C, or D>",
  "subject": "<one of: Polity, History, Economy, Geography, Environment, Science, Current Affairs>",
  "explanation": "<2-4 sentence explanation of why the correct answer is right>"
}

IMPORTANT:
- Only include questions that are GENUINELY MISSING from my list above
- Use the EXACT official question text — do not paraphrase
- The correct_option_id must be A, B, C, or D
- subject must be exactly one of: Polity, History, Economy, Geography, Environment, Science, Current Affairs
- Provide accurate answers based on the official UPSC answer key
- If you're not certain about a question, still include it with your best knowledge

Return ONLY the JSON array, no other text.`;
}

async function processYear(year: number) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Processing year ${year}`);
  console.log(`${"=".repeat(50)}`);

  const existing = await fetchExistingQuestions(year);
  console.log(`Existing questions: ${existing.length}`);

  if (existing.length >= 100) {
    console.log(`Already has 100+ questions, skipping.`);
    return;
  }

  const missing = 100 - existing.length;
  console.log(`Missing: ${missing} questions`);

  // Build prompt with existing question text
  const existingPrompts = existing.map((q) => q.prompt);

  console.log("Calling Gemini to identify missing questions...");
  const prompt = buildIdentifyPrompt(year, existingPrompts);
  const response = await callGemini(prompt);

  if (!response) {
    console.error("Failed to get response from Gemini");
    return;
  }

  // Parse JSON response
  let questions: Array<{
    question_number: number;
    prompt: string;
    options: Option[];
    correct_option_id: string;
    subject: string;
    explanation: string;
  }>;

  try {
    questions = JSON.parse(response);
    if (!Array.isArray(questions)) {
      console.error("Response is not an array");
      console.error("Raw:", response.slice(0, 500));
      return;
    }
  } catch {
    console.error("Failed to parse JSON response");
    console.error("Raw:", response.slice(0, 500));
    return;
  }

  console.log(`Gemini identified ${questions.length} missing questions`);

  // Validate and filter
  const valid = questions.filter((q) => {
    if (!q.prompt || q.prompt.length < 20) {
      console.warn(`  Skipping short prompt: "${q.prompt?.slice(0, 50)}"`);
      return false;
    }
    if (!q.options || q.options.length !== 4) {
      console.warn(`  Skipping Q${q.question_number}: wrong option count`);
      return false;
    }
    if (!["A", "B", "C", "D"].includes(q.correct_option_id)) {
      console.warn(`  Skipping Q${q.question_number}: invalid answer "${q.correct_option_id}"`);
      return false;
    }
    if (!VALID_SUBJECTS.includes(q.subject)) {
      console.warn(`  Fixing subject "${q.subject}" for Q${q.question_number}`);
      // Try to map common variations
      if (q.subject.toLowerCase().includes("polity") || q.subject.toLowerCase().includes("governance")) {
        q.subject = "Polity";
      } else if (q.subject.toLowerCase().includes("history") || q.subject.toLowerCase().includes("culture")) {
        q.subject = "History";
      } else if (q.subject.toLowerCase().includes("economy")) {
        q.subject = "Economy";
      } else if (q.subject.toLowerCase().includes("geography")) {
        q.subject = "Geography";
      } else if (q.subject.toLowerCase().includes("environment") || q.subject.toLowerCase().includes("ecology")) {
        q.subject = "Environment";
      } else if (q.subject.toLowerCase().includes("science")) {
        q.subject = "Science";
      } else if (q.subject.toLowerCase().includes("current")) {
        q.subject = "Current Affairs";
      } else {
        q.subject = "Current Affairs"; // fallback
      }
    }

    // Check for duplicate against existing DB
    const normalizedNew = q.prompt.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 80);
    const isDuplicate = existingPrompts.some((ep) => {
      const normalizedExisting = ep.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 80);
      return normalizedExisting === normalizedNew;
    });
    if (isDuplicate) {
      console.warn(`  Skipping Q${q.question_number}: duplicate of existing question`);
      return false;
    }

    return true;
  });

  console.log(`Valid questions to insert: ${valid.length}`);

  if (valid.length === 0) {
    console.log("No valid questions to insert.");
    return;
  }

  // Insert into database
  let inserted = 0;
  let errors = 0;

  for (const q of valid) {
    // Clean option text (strip any a)/b) prefixes)
    const cleanOptions = q.options.map((o) => ({
      id: o.id.toUpperCase(),
      text: o.text.replace(/^\s*\(?[a-dA-D1-4]\)?[\.\)]\s*/, "").trim(),
    }));

    const row = {
      prompt: q.prompt.trim(),
      options: cleanOptions,
      correct_option_id: q.correct_option_id.toUpperCase(),
      explanation: q.explanation?.trim() || null,
      subject: q.subject,
      year: year,
      source: "pyq",
      source_label: `UPSC CSE ${year}`,
      difficulty: "Moderate", // default, can be enriched later
    };

    const { error } = await supabase.from("questions").insert(row);

    if (error) {
      console.error(`  Insert failed for Q${q.question_number}:`, error.message);
      errors++;
    } else {
      inserted++;
      console.log(`  ✓ Inserted Q${q.question_number}: ${q.prompt.slice(0, 60)}...`);
    }
  }

  console.log(`\nYear ${year} complete: ${inserted} inserted, ${errors} errors`);
}

async function main() {
  console.log("=== FILL MISSING PYQs ===\n");

  // Process each incomplete year
  const incompleteYears = [2025, 2021, 2018, 2015];

  for (const year of incompleteYears) {
    await processYear(year);
  }

  // Final count
  console.log("\n\n=== FINAL PYQ COUNTS ===");
  for (let year = 2014; year <= 2025; year++) {
    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("source", "pyq")
      .eq("year", year);
    console.log(`  ${year}: ${count} questions`);
  }
}

main().catch(console.error);
