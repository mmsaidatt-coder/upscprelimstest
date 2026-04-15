/**
 * Enrich questions using Gemini API:
 * 1. Generate explanations for PYQs that have correct_option_id but no explanation
 * 2. Generate correct_option_id + explanation for custom questions missing answers
 *
 * Uses multiple API keys in round-robin for parallelism.
 * Run: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/enrich-questions.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const API_KEYS = [
  process.env.GEMINI_API_KEY!,
  process.env.GEMINI_API_KEY_2!,
  process.env.GEMINI_API_KEY_3!,
  process.env.GEMINI_API_KEY_4!,
].filter(Boolean);

const MODEL = "gemini-3-flash-preview";
const CONCURRENCY_PER_KEY = 3; // requests in flight per key
const TOTAL_CONCURRENCY = API_KEYS.length * CONCURRENCY_PER_KEY;
const BATCH_SIZE = 10; // DB update batch size

let keyIndex = 0;
function nextKey(): string {
  const key = API_KEYS[keyIndex % API_KEYS.length]!;
  keyIndex++;
  return key;
}

type Question = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correct_option_id: string | null;
  subject: string;
  year: number | null;
  source: string;
  explanation: string | null;
};

// ── Gemini API call ─────────────────────────────────────

async function callGemini(apiKey: string, prompt: string, retries = 2): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (response.status === 429) {
        // Rate limited — wait and retry
        const wait = Math.min(10000, 2000 * (attempt + 1));
        console.log(`  Rate limited, waiting ${wait}ms...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error(`  Gemini error ${response.status}: ${text.slice(0, 200)}`);
        if (attempt < retries) continue;
        return null;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return typeof text === "string" ? text.trim() : null;
    } catch (err) {
      console.error(`  Network error:`, err instanceof Error ? err.message : err);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      return null;
    }
  }
  return null;
}

// ── Prompt builders ────────────────────────────────────

function buildExplanationPrompt(q: Question): string {
  const optionsText = q.options
    .map((o) => `(${o.id}) ${o.text}`)
    .join("\n");

  return `You are an expert UPSC Civil Services exam tutor. Generate a clear, concise explanation for why the correct answer is correct.

Question (${q.subject}, ${q.year ? `Year ${q.year}` : "Practice"}):
${q.prompt}

Options:
${optionsText}

Correct Answer: (${q.correct_option_id})

Write a 2-4 sentence explanation that:
1. States why the correct option is right
2. Briefly explains why the most tempting wrong option is wrong
3. Mentions the core concept being tested

Be factual and direct. No preamble. Start directly with the explanation.`;
}

function buildAnswerAndExplanationPrompt(q: Question): string {
  const optionsText = q.options
    .map((o) => `(${o.id}) ${o.text}`)
    .join("\n");

  return `You are an expert UPSC Civil Services exam tutor. Determine the correct answer and provide an explanation.

Question (${q.subject}):
${q.prompt}

Options:
${optionsText}

Respond in EXACTLY this format (2 lines only):
ANSWER: X
EXPLANATION: Your 2-4 sentence explanation here.

Where X is one of A, B, C, or D. Be factual and confident. If truly ambiguous, pick the most likely correct answer.`;
}

// ── Parse response for answer+explanation ───────────────

function parseAnswerResponse(text: string): { answer: string; explanation: string } | null {
  const answerMatch = text.match(/ANSWER:\s*([A-Da-d])/i);
  const explanationMatch = text.match(/EXPLANATION:\s*(.+)/is);

  if (!answerMatch) return null;

  return {
    answer: answerMatch[1]!.toUpperCase(),
    explanation: explanationMatch
      ? explanationMatch[1]!.trim()
      : text.replace(/ANSWER:\s*[A-Da-d]/i, "").trim(),
  };
}

// ── Concurrency pool ────────────────────────────────────

async function processPool<T>(
  items: T[],
  concurrency: number,
  processor: (item: T, index: number) => Promise<void>,
) {
  let index = 0;
  const total = items.length;

  async function worker() {
    while (index < total) {
      const current = index++;
      await processor(items[current]!, current);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
  await Promise.all(workers);
}

// ── Main ────────────────────────────────────────────────

async function main() {
  console.log(`Using ${API_KEYS.length} API keys, concurrency=${TOTAL_CONCURRENCY}\n`);

  // ── Phase 1: PYQ explanations ─────────────────────────
  console.log("=== PHASE 1: PYQ Explanations ===\n");

  const { data: pyqsRaw, error: pyqErr } = await supabase
    .from("questions")
    .select("id, prompt, options, correct_option_id, subject, year, source, explanation")
    .eq("source", "pyq")
    .not("correct_option_id", "is", null)
    .is("explanation", null)
    .order("year", { ascending: false });

  if (pyqErr) {
    console.error("Failed to fetch PYQs:", pyqErr.message);
    return;
  }

  const pyqs = (pyqsRaw ?? []) as Question[];
  console.log(`Found ${pyqs.length} PYQs needing explanations.\n`);

  let pyqSuccess = 0;
  let pyqFail = 0;
  const pyqUpdates: { id: string; explanation: string }[] = [];

  await processPool(pyqs, TOTAL_CONCURRENCY, async (q, idx) => {
    const apiKey = nextKey();
    const prompt = buildExplanationPrompt(q);
    const explanation = await callGemini(apiKey, prompt);

    if (explanation && explanation.length > 20) {
      pyqUpdates.push({ id: q.id, explanation });
      pyqSuccess++;
    } else {
      pyqFail++;
    }

    if ((idx + 1) % 50 === 0 || idx === pyqs.length - 1) {
      console.log(`  PYQ progress: ${idx + 1}/${pyqs.length} (${pyqSuccess} ok, ${pyqFail} fail)`);
    }

    // Flush updates in batches
    if (pyqUpdates.length >= BATCH_SIZE) {
      const batch = pyqUpdates.splice(0, BATCH_SIZE);
      await flushExplanations(batch);
    }
  });

  // Flush remaining
  if (pyqUpdates.length) {
    await flushExplanations(pyqUpdates.splice(0));
  }

  console.log(`\nPYQ Phase complete: ${pyqSuccess} explanations added, ${pyqFail} failed.\n`);

  // ── Phase 2: Custom question answers + explanations ───
  console.log("=== PHASE 2: Custom Question Answers ===\n");

  const { data: customRaw, error: customErr } = await supabase
    .from("questions")
    .select("id, prompt, options, correct_option_id, subject, year, source, explanation")
    .eq("source", "custom")
    .is("correct_option_id", null)
    .order("created_at", { ascending: true });

  if (customErr) {
    console.error("Failed to fetch custom questions:", customErr.message);
    return;
  }

  const customs = (customRaw ?? []) as Question[];
  console.log(`Found ${customs.length} custom questions needing answers.\n`);

  let customSuccess = 0;
  let customFail = 0;
  const customUpdates: { id: string; correct_option_id: string; explanation: string }[] = [];

  await processPool(customs, TOTAL_CONCURRENCY, async (q, idx) => {
    const apiKey = nextKey();
    const prompt = buildAnswerAndExplanationPrompt(q);
    const response = await callGemini(apiKey, prompt);

    if (response) {
      const parsed = parseAnswerResponse(response);
      if (parsed && ["A", "B", "C", "D"].includes(parsed.answer)) {
        customUpdates.push({
          id: q.id,
          correct_option_id: parsed.answer,
          explanation: parsed.explanation,
        });
        customSuccess++;
      } else {
        customFail++;
      }
    } else {
      customFail++;
    }

    if ((idx + 1) % 50 === 0 || idx === customs.length - 1) {
      console.log(`  Custom progress: ${idx + 1}/${customs.length} (${customSuccess} ok, ${customFail} fail)`);
    }

    // Flush updates in batches
    if (customUpdates.length >= BATCH_SIZE) {
      const batch = customUpdates.splice(0, BATCH_SIZE);
      await flushAnswers(batch);
    }
  });

  // Flush remaining
  if (customUpdates.length) {
    await flushAnswers(customUpdates.splice(0));
  }

  console.log(`\nCustom Phase complete: ${customSuccess} answers added, ${customFail} failed.\n`);
  console.log("=== ALL DONE ===");
}

async function flushExplanations(batch: { id: string; explanation: string }[]) {
  for (const item of batch) {
    const { error } = await supabase
      .from("questions")
      .update({ explanation: item.explanation })
      .eq("id", item.id);
    if (error) console.error(`  DB update failed for ${item.id}:`, error.message);
  }
}

async function flushAnswers(batch: { id: string; correct_option_id: string; explanation: string }[]) {
  for (const item of batch) {
    const { error } = await supabase
      .from("questions")
      .update({
        correct_option_id: item.correct_option_id,
        explanation: item.explanation,
      })
      .eq("id", item.id);
    if (error) console.error(`  DB update failed for ${item.id}:`, error.message);
  }
}

main().catch(console.error);
