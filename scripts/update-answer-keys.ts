/**
 * Update answer keys for UPSC Prelims 2025 GS1 questions in Supabase.
 *
 * Usage:
 *   npx tsx scripts/update-answer-keys.ts
 *
 * Source: Legacy IAS answer key (Set A) — cross-referenced with multiple coaching institutes.
 */

import { createClient } from "@supabase/supabase-js";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// UPSC Prelims 2025 GS Paper 1 — Set A answer key
// Source: Legacy IAS (legacyias.com)
const ANSWER_KEY_2025: Record<number, "A" | "B" | "C" | "D"> = {
  1: "B", 2: "A", 3: "A", 4: "B", 5: "D",
  6: "B", 7: "A", 8: "A", 9: "A", 10: "A",
  11: "C", 12: "C", 13: "B", 14: "A", 15: "B",
  16: "C", 17: "B", 18: "D", 19: "B", 20: "C",
  21: "B", 22: "C", 23: "D", 24: "D", 25: "D",
  26: "C", 27: "B", 28: "C", 29: "C", 30: "C",
  31: "B", 32: "A", 33: "B", 34: "C", 35: "A",
  36: "C", 37: "D", 38: "C", 39: "B", 40: "B",
  41: "C", 42: "D", 43: "C", 44: "C", 45: "C",
  46: "B", 47: "C", 48: "D", 49: "D", 50: "B",
  51: "C", 52: "C", 53: "A", 54: "A", 55: "C",
  56: "D", 57: "D", 58: "A", 59: "D", 60: "B",
  61: "D", 62: "A", 63: "B", 64: "C", 65: "A",
  66: "C", 67: "C", 68: "C", 69: "B", 70: "D",
  71: "B", 72: "A", 73: "A", 74: "A", 75: "B",
  76: "C", 77: "A", 78: "A", 79: "C", 80: "D",
  81: "A", 82: "A", 83: "C", 84: "B", 85: "A",
  86: "A", 87: "C", 88: "D", 89: "B", 90: "C",
  91: "D", 92: "D", 93: "C", 94: "D", 95: "A",
  96: "D", 97: "A", 98: "A", 99: "A", 100: "B",
};

async function main() {
  const year = 2025;

  // Fetch all 2025 PYQ questions
  const { data: questions, error: fetchError } = await supabase
    .from("questions")
    .select("id, source_label")
    .eq("source", "pyq")
    .eq("year", year);

  if (fetchError) {
    console.error("Error fetching questions:", fetchError.message);
    process.exit(1);
  }

  if (!questions || questions.length === 0) {
    console.error("No 2025 PYQ questions found in database");
    process.exit(1);
  }

  console.log(`Found ${questions.length} questions for year ${year}`);

  let updated = 0;
  let errors = 0;

  for (const q of questions) {
    // Extract question number from source_label like "UPSC Prelims GS1 2025 Q42"
    const match = q.source_label?.match(/Q(\d+)$/);
    if (!match) {
      console.warn(`  Skipping: can't parse question number from "${q.source_label}"`);
      errors++;
      continue;
    }

    const qNum = parseInt(match[1], 10);
    const correctAnswer = ANSWER_KEY_2025[qNum];

    if (!correctAnswer) {
      console.warn(`  No answer key for Q${qNum}`);
      errors++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("questions")
      .update({ correct_option_id: correctAnswer })
      .eq("id", q.id);

    if (updateError) {
      console.error(`  Error updating Q${qNum}: ${updateError.message}`);
      errors++;
    } else {
      updated++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Errors: ${errors}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
