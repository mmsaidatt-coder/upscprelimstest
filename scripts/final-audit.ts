/**
 * Comprehensive database quality audit.
 * Run: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/final-audit.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Option = { id: string; text: string };
type Question = {
  id: string;
  prompt: string;
  options: Option[];
  correct_option_id: string | null;
  explanation: string | null;
  subject: string;
  year: number | null;
  source: string;
  difficulty: string | null;
  topic: string | null;
  sub_topic: string | null;
  keywords: string[] | null;
  concepts: string[] | null;
};

async function fetchAll(): Promise<Question[]> {
  const all: Question[] = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, prompt, options, correct_option_id, explanation, subject, year, source, difficulty, topic, sub_topic, keywords, concepts")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("Fetch error:", error.message);
      break;
    }
    if (!data || data.length === 0) break;
    all.push(...(data as Question[]));
    if (data.length < pageSize) break;
    page++;
  }

  return all;
}

async function main() {
  console.log("Fetching all questions...\n");
  const questions = await fetchAll();
  console.log(`Total questions: ${questions.length}\n`);

  const issues: Record<string, string[]> = {};
  function addIssue(category: string, detail: string) {
    if (!issues[category]) issues[category] = [];
    issues[category]!.push(detail);
  }

  // ── 1. Missing answers ──
  for (const q of questions) {
    if (!q.correct_option_id) {
      addIssue("Missing correct_option_id", `${q.id} [${q.source}] ${q.prompt.slice(0, 80)}`);
    }
  }

  // ── 2. Missing explanations ──
  for (const q of questions) {
    if (!q.explanation || q.explanation.trim().length === 0) {
      addIssue("Missing explanation", `${q.id} [${q.source}] ${q.prompt.slice(0, 80)}`);
    }
  }

  // ── 3. Very short explanations (< 30 chars) ──
  for (const q of questions) {
    if (q.explanation && q.explanation.trim().length > 0 && q.explanation.trim().length < 30) {
      addIssue("Very short explanation (<30 chars)", `${q.id}: "${q.explanation.trim().slice(0, 50)}"`);
    }
  }

  // ── 4. Malformed options ──
  for (const q of questions) {
    const opts = q.options;
    if (!Array.isArray(opts) || opts.length < 2) {
      addIssue("Malformed options (< 2 options)", `${q.id}: ${JSON.stringify(opts).slice(0, 100)}`);
      continue;
    }
    for (const o of opts) {
      if (!o.id || !o.text || o.text.trim().length === 0) {
        addIssue("Option with empty text", `${q.id} option ${o.id}`);
      }
    }
  }

  // ── 5. Answer not matching any option ──
  for (const q of questions) {
    if (q.correct_option_id) {
      const optionIds = q.options.map((o) => o.id);
      if (!optionIds.includes(q.correct_option_id)) {
        addIssue("Answer not in options", `${q.id}: answer=${q.correct_option_id}, options=${optionIds.join(",")}`);
      }
    }
  }

  // ── 6. Truncated prompts (ends mid-word or with common truncation patterns) ──
  for (const q of questions) {
    const p = q.prompt.trim();
    if (p.length < 20) {
      addIssue("Very short prompt (<20 chars)", `${q.id}: "${p}"`);
    }
    // Check for truncation: ends with incomplete word or common truncation markers
    if (/[a-zA-Z]{2,}$/.test(p) && !p.endsWith("?") && !p.endsWith(".") && !p.endsWith(":") && !p.endsWith(")") && !p.endsWith('"')) {
      // Could be truncated — check if last char is a letter and doesn't end a sentence
      const lastWord = p.split(/\s+/).pop() || "";
      if (lastWord.length >= 3 && /^[a-zA-Z]+$/.test(lastWord)) {
        addIssue("Possibly truncated prompt", `${q.id}: ...${p.slice(-60)}`);
      }
    }
  }

  // ── 7. AI refusal text in explanations ──
  const refusalPatterns = [
    "i cannot",
    "i can't",
    "i don't have enough",
    "as an ai",
    "i'm not able to",
    "i am not able to",
    "i apologize",
    "sorry, i",
    "unfortunately, i",
    "i'm unable to",
  ];
  for (const q of questions) {
    if (q.explanation) {
      const lower = q.explanation.toLowerCase();
      for (const pattern of refusalPatterns) {
        if (lower.includes(pattern)) {
          addIssue("AI refusal text in explanation", `${q.id}: contains "${pattern}" — "${q.explanation.slice(0, 100)}"`);
          break;
        }
      }
    }
  }

  // ── 8. Duplicate detection (normalized prompt prefix) ──
  const promptMap = new Map<string, string[]>();
  for (const q of questions) {
    const norm = q.prompt.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 120);
    if (!promptMap.has(norm)) promptMap.set(norm, []);
    promptMap.get(norm)!.push(`${q.id} [${q.source}]`);
  }
  for (const [prefix, ids] of promptMap) {
    if (ids.length > 1) {
      addIssue("Duplicate questions (same prompt prefix)", `${ids.length}x: "${prefix.slice(0, 80)}..." — IDs: ${ids.join(", ")}`);
    }
  }

  // ── 9. Subject distribution ──
  console.log("=== SUBJECT DISTRIBUTION ===");
  const bySourceSubject: Record<string, Record<string, number>> = {};
  for (const q of questions) {
    if (!bySourceSubject[q.source]) bySourceSubject[q.source] = {};
    bySourceSubject[q.source]![q.subject] = (bySourceSubject[q.source]![q.subject] ?? 0) + 1;
  }
  for (const [source, subjects] of Object.entries(bySourceSubject)) {
    console.log(`\n  ${source}:`);
    const sorted = Object.entries(subjects).sort((a, b) => b[1] - a[1]);
    for (const [subj, count] of sorted) {
      console.log(`    ${subj}: ${count}`);
    }
  }

  // ── 10. PYQ year coverage ──
  console.log("\n=== PYQ YEAR COVERAGE ===");
  const pyqs = questions.filter((q) => q.source === "pyq");
  const byYear: Record<number, number> = {};
  for (const q of pyqs) {
    if (q.year) byYear[q.year] = (byYear[q.year] ?? 0) + 1;
  }
  const years = Object.keys(byYear).map(Number).sort();
  for (const y of years) {
    const count = byYear[y]!;
    const flag = count < 50 ? " ⚠️ LOW" : "";
    console.log(`  ${y}: ${count} questions${flag}`);
  }

  // ── 11. Difficulty distribution ──
  console.log("\n=== DIFFICULTY DISTRIBUTION ===");
  const byDifficulty: Record<string, number> = {};
  for (const q of questions) {
    const d = q.difficulty ?? "null";
    byDifficulty[d] = (byDifficulty[d] ?? 0) + 1;
  }
  for (const [diff, count] of Object.entries(byDifficulty).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${diff}: ${count}`);
  }

  // ── 12. Enrichment coverage ──
  console.log("\n=== ENRICHMENT COVERAGE ===");
  let hasTopic = 0, hasSubTopic = 0, hasKeywords = 0, hasConcepts = 0;
  for (const q of questions) {
    if (q.topic) hasTopic++;
    if (q.sub_topic) hasSubTopic++;
    if (q.keywords && q.keywords.length > 0) hasKeywords++;
    if (q.concepts && q.concepts.length > 0) hasConcepts++;
  }
  console.log(`  topic: ${hasTopic}/${questions.length} (${((hasTopic / questions.length) * 100).toFixed(1)}%)`);
  console.log(`  sub_topic: ${hasSubTopic}/${questions.length} (${((hasSubTopic / questions.length) * 100).toFixed(1)}%)`);
  console.log(`  keywords: ${hasKeywords}/${questions.length} (${((hasKeywords / questions.length) * 100).toFixed(1)}%)`);
  console.log(`  concepts: ${hasConcepts}/${questions.length} (${((hasConcepts / questions.length) * 100).toFixed(1)}%)`);

  // ── Print issues summary ──
  console.log("\n\n========================================");
  console.log("  ISSUES SUMMARY");
  console.log("========================================\n");

  const categories = Object.keys(issues).sort();
  if (categories.length === 0) {
    console.log("  ✅ No issues found!\n");
  } else {
    for (const cat of categories) {
      const items = issues[cat]!;
      console.log(`❌ ${cat}: ${items.length}`);
      // Show first 5 examples
      for (const item of items.slice(0, 5)) {
        console.log(`   → ${item}`);
      }
      if (items.length > 5) {
        console.log(`   ... and ${items.length - 5} more`);
      }
      console.log();
    }
  }

  const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`Total issues: ${totalIssues}`);
}

main().catch(console.error);
