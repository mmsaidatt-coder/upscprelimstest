/**
 * Fill missing PYQs v2 — stricter duplicate checking.
 * Run: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/fill-missing-pyqs-v2.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const API_KEY = process.env.GEMINI_API_KEY!;
const MODEL = "gemini-3.1-pro-preview";

async function callGemini(prompt: string): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 16384 },
        }),
      });

      if (response.status === 429) {
        await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
        continue;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error(`  Gemini error ${response.status}: ${text.slice(0, 200)}`);
        continue;
      }

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
    } catch (err) {
      console.error(`  Error:`, err instanceof Error ? err.message : err);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  return null;
}

async function fetchAllPyqPrompts(): Promise<Map<string, Set<string>>> {
  // Fetch ALL PYQ prompts to check for cross-year duplicates
  const all: { prompt: string; year: number }[] = [];
  let page = 0;
  while (true) {
    const { data } = await supabase.from("questions")
      .select("prompt, year").eq("source", "pyq")
      .range(page * 500, (page + 1) * 500 - 1);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 500) break;
    page++;
  }

  const byNorm = new Map<string, Set<string>>();
  for (const q of all) {
    const norm = q.prompt.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 80);
    if (!byNorm.has(norm)) byNorm.set(norm, new Set());
    byNorm.get(norm)!.add(String(q.year));
  }
  return byNorm;
}

async function processYear(year: number, allPromptNorms: Map<string, Set<string>>) {
  const { data, error } = await supabase.from("questions")
    .select("prompt, subject").eq("source", "pyq").eq("year", year);
  if (error) { console.error(error.message); return; }

  const existing = data ?? [];
  const missing = 100 - existing.length;
  if (missing <= 0) { console.log(`${year}: already has ${existing.length}, skipping`); return; }

  console.log(`\n${year}: has ${existing.length}, need ${missing} more`);

  // Build list of ALL known questions across all years for dedup
  const allKnownPrefixes = [...allPromptNorms.keys()];

  const promptList = existing.map((q, i) => `${i + 1}. ${q.prompt.slice(0, 130)}`).join("\n");

  const prompt = `You are a UPSC Civil Services exam expert with comprehensive knowledge of all past papers.

I need EXACTLY ${missing} question(s) from the UPSC CSE Prelims ${year} General Studies Paper I that are missing from my database.

I already have ${existing.length} questions. Here they are (first 130 chars):

${promptList}

CRITICAL RULES:
- Provide questions ONLY from the ${year} paper, NOT from any other year
- Do NOT provide questions about: monoclonal antibodies, direct air capture, 15th Finance Commission, International Bank for Reconstruction, kingdoms associated with Buddha, money multiplier — these are from other years
- The ${year} paper has EXACTLY 100 unique questions
- Use the EXACT official question text

For each missing question, provide in this format (separated by ===):

QUESTION: <full text>
OPTION_A: <text>
OPTION_B: <text>
OPTION_C: <text>
OPTION_D: <text>
ANSWER: <A/B/C/D>
SUBJECT: <Polity/History/Economy/Geography/Environment/Science/Current Affairs>
EXPLANATION: <2-4 sentences>
===`;

  const response = await callGemini(prompt);
  if (!response) { console.error("No response"); return; }

  // Parse response
  const blocks = response.split("===").map((b) => b.trim()).filter(Boolean);
  console.log(`  Got ${blocks.length} question blocks`);

  let inserted = 0;
  for (const block of blocks) {
    const qMatch = block.match(/QUESTION:\s*(.+?)(?=\nOPTION_A:)/s);
    const aMatch = block.match(/OPTION_A:\s*(.+?)(?=\nOPTION_B:)/s);
    const bMatch = block.match(/OPTION_B:\s*(.+?)(?=\nOPTION_C:)/s);
    const cMatch = block.match(/OPTION_C:\s*(.+?)(?=\nOPTION_D:)/s);
    const dMatch = block.match(/OPTION_D:\s*(.+?)(?=\nANSWER:)/s);
    const ansMatch = block.match(/ANSWER:\s*([A-D])/);
    const subjMatch = block.match(/SUBJECT:\s*(.+?)(?=\n|$)/);
    const explMatch = block.match(/EXPLANATION:\s*(.+)/s);

    if (!qMatch || !ansMatch || !aMatch || !bMatch || !cMatch || !dMatch) {
      console.log("  Skipping unparseable block");
      continue;
    }

    const qPrompt = qMatch[1]!.trim();
    const norm = qPrompt.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 80);

    // Cross-year duplicate check
    if (allPromptNorms.has(norm)) {
      console.log(`  Skipping duplicate: "${qPrompt.slice(0, 60)}..."`);
      continue;
    }

    const subject = (subjMatch?.[1] || "Current Affairs").trim();
    const validSubjects = ["Polity", "History", "Economy", "Geography", "Environment", "Science", "Current Affairs"];
    const finalSubject = validSubjects.includes(subject) ? subject : "Current Affairs";

    const { error: insertErr } = await supabase.from("questions").insert({
      prompt: qPrompt,
      options: [
        { id: "A", text: aMatch[1]!.trim() },
        { id: "B", text: bMatch[1]!.trim() },
        { id: "C", text: cMatch[1]!.trim() },
        { id: "D", text: dMatch[1]!.trim() },
      ],
      correct_option_id: ansMatch[1],
      explanation: explMatch?.[1]?.trim() || null,
      subject: finalSubject,
      year,
      source: "pyq",
      source_label: `UPSC CSE ${year}`,
      difficulty: "Moderate",
    });

    if (insertErr) {
      console.error(`  Insert error: ${insertErr.message}`);
    } else {
      inserted++;
      // Add to known prompts to prevent further dups
      allPromptNorms.set(norm, new Set([String(year)]));
      console.log(`  ✓ Inserted: ${qPrompt.slice(0, 60)}...`);
    }
  }

  const { count } = await supabase.from("questions")
    .select("id", { count: "exact", head: true }).eq("source", "pyq").eq("year", year);
  console.log(`  ${year} total: ${count}`);
}

async function main() {
  const allPromptNorms = await fetchAllPyqPrompts();
  console.log(`Loaded ${allPromptNorms.size} unique PYQ prompt prefixes for dedup\n`);

  for (const year of [2025, 2021, 2015]) {
    await processYear(year, allPromptNorms);
  }

  console.log("\n=== FINAL ===");
  for (let y = 2014; y <= 2025; y++) {
    const { count } = await supabase.from("questions")
      .select("id", { count: "exact", head: true }).eq("source", "pyq").eq("year", y);
    console.log(`  ${y}: ${count}${count !== 100 ? " ⚠️" : " ✓"}`);
  }
}

main().catch(console.error);
