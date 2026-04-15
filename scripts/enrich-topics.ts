/**
 * Enrich questions missing topic/sub_topic/keywords/concepts metadata.
 * Uses Gemini to classify and tag questions.
 *
 * Run: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/enrich-topics.ts
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

const MODEL = "gemini-3.1-pro-preview";
const CONCURRENCY_PER_KEY = 2;
const TOTAL_CONCURRENCY = API_KEYS.length * CONCURRENCY_PER_KEY;

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
  subject: string;
  year: number | null;
};

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
            temperature: 0.1,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
          },
        }),
      });

      if (response.status === 429) {
        const wait = Math.min(15000, 3000 * (attempt + 1));
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

function buildEnrichPrompt(q: Question): string {
  const optionsText = q.options.map((o) => `(${o.id}) ${o.text}`).join("\n");

  return `You are a UPSC Civil Services exam expert. Classify and tag this question.

Question (${q.subject}, ${q.year ? `Year ${q.year}` : "Practice"}):
${q.prompt}

Options:
${optionsText}

Return a JSON object with:
{
  "topic": "<specific topic, e.g. 'Fundamental Rights', 'Indian Ocean Currents', 'Mughal Administration'>",
  "sub_topic": "<narrower sub-topic if applicable, or null>",
  "keywords": ["<keyword1>", "<keyword2>", ...],
  "concepts": ["<concept1>", "<concept2>", ...],
  "difficulty": "<Easy, Moderate, or Hard>",
  "question_type": "<Factual, Conceptual, Application, or Analytical>",
  "importance": "<High, Medium, or Low>"
}

Be specific with topics. Use 3-6 keywords and 2-4 concepts. Return ONLY JSON.`;
}

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

async function main() {
  console.log(`Using ${API_KEYS.length} API keys, concurrency=${TOTAL_CONCURRENCY}\n`);

  // Fetch questions needing enrichment
  const { data, error } = await supabase
    .from("questions")
    .select("id, prompt, options, subject, year")
    .is("topic", null)
    .order("year", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Fetch error:", error.message);
    return;
  }

  const questions = (data ?? []) as Question[];
  console.log(`Found ${questions.length} questions needing enrichment.\n`);

  let success = 0;
  let fail = 0;

  await processPool(questions, TOTAL_CONCURRENCY, async (q, idx) => {
    const apiKey = nextKey();
    const prompt = buildEnrichPrompt(q);
    const response = await callGemini(apiKey, prompt);

    if (!response) {
      fail++;
      return;
    }

    try {
      const parsed = JSON.parse(response);
      const update: Record<string, unknown> = {};

      if (parsed.topic && typeof parsed.topic === "string") update.topic = parsed.topic;
      if (parsed.sub_topic && typeof parsed.sub_topic === "string") update.sub_topic = parsed.sub_topic;
      if (Array.isArray(parsed.keywords) && parsed.keywords.length > 0) update.keywords = parsed.keywords;
      if (Array.isArray(parsed.concepts) && parsed.concepts.length > 0) update.concepts = parsed.concepts;
      if (["Easy", "Moderate", "Hard"].includes(parsed.difficulty)) update.difficulty = parsed.difficulty;
      if (parsed.question_type) update.question_type = parsed.question_type;
      if (parsed.importance) update.importance = parsed.importance;

      if (!update.topic) {
        fail++;
        return;
      }

      const { error: dbErr } = await supabase
        .from("questions")
        .update(update)
        .eq("id", q.id);

      if (dbErr) {
        console.error(`  DB error for ${q.id}:`, dbErr.message);
        fail++;
      } else {
        success++;
      }
    } catch {
      fail++;
    }

    if ((idx + 1) % 20 === 0 || idx === questions.length - 1) {
      console.log(`  Progress: ${idx + 1}/${questions.length} (${success} ok, ${fail} fail)`);
    }
  });

  console.log(`\nDone: ${success} enriched, ${fail} failed`);
}

main().catch(console.error);
