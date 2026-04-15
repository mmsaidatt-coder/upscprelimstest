import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function fetchAll(query: string) {
  const { data, error } = await supabase.rpc("", {}).then(() => ({ data: null, error: null }));
  // We'll use the query builder instead
  return null;
}

async function audit() {
  console.log("=== UPSC QUESTION DATABASE AUDIT ===\n");

  // 1. Total counts by source
  const { data: sourceCounts } = await supabase
    .from("questions")
    .select("source")
    .then(({ data }) => {
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.source] = (counts[row.source] ?? 0) + 1;
      }
      return { data: counts };
    });
  console.log("1. QUESTION COUNTS BY SOURCE:");
  console.log(JSON.stringify(sourceCounts, null, 2));

  // 2. Questions missing correct_option_id (no answer)
  const { count: noAnswer } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .is("correct_option_id", null);
  console.log(`\n2. QUESTIONS WITHOUT ANSWER: ${noAnswer}`);

  // Breakdown by source
  for (const src of ["pyq", "custom", "flt", "subject"]) {
    const { count } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("source", src)
      .is("correct_option_id", null);
    console.log(`   ${src}: ${count} missing answer`);
  }

  // 3. Questions missing explanation
  const { count: noExplanation } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .is("explanation", null);
  console.log(`\n3. QUESTIONS WITHOUT EXPLANATION: ${noExplanation}`);

  for (const src of ["pyq", "custom", "flt"]) {
    const { count } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("source", src)
      .is("explanation", null);
    console.log(`   ${src}: ${count} missing explanation`);
  }

  // 4. Subject distribution
  const { data: allQ } = await supabase
    .from("questions")
    .select("subject, source");
  const subjectDist: Record<string, Record<string, number>> = {};
  for (const row of allQ ?? []) {
    if (!subjectDist[row.source]) subjectDist[row.source] = {};
    subjectDist[row.source][row.subject] = (subjectDist[row.source][row.subject] ?? 0) + 1;
  }
  console.log("\n4. SUBJECT DISTRIBUTION BY SOURCE:");
  for (const [src, subjects] of Object.entries(subjectDist)) {
    console.log(`\n   ${src}:`);
    for (const [subj, count] of Object.entries(subjects).sort((a, b) => b[1] - a[1])) {
      console.log(`     ${subj}: ${count}`);
    }
  }

  // 5. PYQ year coverage
  const { data: pyqYears } = await supabase
    .from("questions")
    .select("year")
    .eq("source", "pyq")
    .not("year", "is", null);
  const yearCounts: Record<number, number> = {};
  for (const row of pyqYears ?? []) {
    yearCounts[row.year] = (yearCounts[row.year] ?? 0) + 1;
  }
  console.log("\n5. PYQ YEAR COVERAGE:");
  for (const [year, count] of Object.entries(yearCounts).sort((a, b) => Number(b[0]) - Number(a[0]))) {
    console.log(`   ${year}: ${count} questions`);
  }

  // 6. Questions with missing/empty subject
  const { count: noSubject } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .is("subject", null);
  console.log(`\n6. QUESTIONS WITH NULL SUBJECT: ${noSubject}`);

  // 7. Topic enrichment coverage (PYQ only)
  const { count: pyqTotal } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("source", "pyq");
  const { count: pyqWithTopic } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("source", "pyq")
    .not("topic", "is", null);
  const { count: pyqWithKeywords } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("source", "pyq")
    .not("keywords", "is", null);
  console.log(`\n7. PYQ ENRICHMENT COVERAGE:`);
  console.log(`   Total PYQ: ${pyqTotal}`);
  console.log(`   With topic: ${pyqWithTopic} (${((pyqWithTopic ?? 0) / (pyqTotal ?? 1) * 100).toFixed(1)}%)`);
  console.log(`   With keywords: ${pyqWithKeywords} (${((pyqWithKeywords ?? 0) / (pyqTotal ?? 1) * 100).toFixed(1)}%)`);

  // 8. Difficulty distribution
  const { data: diffData } = await supabase
    .from("questions")
    .select("difficulty, source");
  const diffDist: Record<string, Record<string, number>> = {};
  for (const row of diffData ?? []) {
    if (!diffDist[row.source]) diffDist[row.source] = {};
    diffDist[row.source][row.difficulty] = (diffDist[row.source][row.difficulty] ?? 0) + 1;
  }
  console.log("\n8. DIFFICULTY DISTRIBUTION:");
  for (const [src, diffs] of Object.entries(diffDist)) {
    console.log(`   ${src}: ${JSON.stringify(diffs)}`);
  }

  // 9. Sample questions with issues — empty prompts
  const { data: emptyPrompts, count: emptyPromptCount } = await supabase
    .from("questions")
    .select("id, source, subject, prompt", { count: "exact" })
    .or("prompt.eq.,prompt.is.null")
    .limit(5);
  console.log(`\n9. QUESTIONS WITH EMPTY/NULL PROMPT: ${emptyPromptCount}`);
  if (emptyPrompts?.length) {
    for (const q of emptyPrompts) {
      console.log(`   ${q.id} (${q.source}/${q.subject})`);
    }
  }

  // 10. Questions with very short prompts (< 20 chars) — possibly truncated
  const { data: shortPrompts } = await supabase
    .from("questions")
    .select("id, source, subject, prompt")
    .eq("source", "pyq")
    .limit(1000);
  const tooShort = (shortPrompts ?? []).filter(q => q.prompt && q.prompt.length < 30);
  console.log(`\n10. PYQ WITH VERY SHORT PROMPT (<30 chars): ${tooShort.length}`);
  for (const q of tooShort.slice(0, 5)) {
    console.log(`   ${q.id}: "${q.prompt.slice(0, 60)}"`);
  }

  // 11. Duplicate prompts check
  const { data: allPrompts } = await supabase
    .from("questions")
    .select("id, prompt, source")
    .eq("source", "pyq");
  const promptSet = new Map<string, string[]>();
  for (const q of allPrompts ?? []) {
    const key = q.prompt.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 100);
    if (!promptSet.has(key)) promptSet.set(key, []);
    promptSet.get(key)!.push(q.id);
  }
  const dupes = Array.from(promptSet.entries()).filter(([_, ids]) => ids.length > 1);
  console.log(`\n11. POTENTIAL DUPLICATE PYQs: ${dupes.length} groups`);
  for (const [prompt, ids] of dupes.slice(0, 5)) {
    console.log(`   "${prompt.slice(0, 80)}..." → ${ids.length} copies`);
  }

  console.log("\n=== AUDIT COMPLETE ===");
}

audit().catch(console.error);
