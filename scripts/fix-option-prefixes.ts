/**
 * Strip redundant a)/b)/c)/d) prefixes from option text.
 * The option ID (A/B/C/D) already identifies the option.
 *
 * Run: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/fix-option-prefixes.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Option = { id: string; text: string };

function stripPrefix(text: string): string {
  // Remove patterns like "a) ", "a. ", "(a) ", "A) ", "A. ", "(A) ", "1) ", "1. ", "(1) "
  return text.replace(/^\s*(?:\(?[a-dA-D1-4]\)?[\.\)]\s*)/, "").trim();
}

async function main() {
  const all: { id: string; options: Option[] }[] = [];
  let page = 0;

  while (true) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, options")
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (error) { console.error("Fetch error:", error.message); return; }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  console.log(`Total questions: ${all.length}`);

  // Find questions with prefixed options
  const needsFix: { id: string; newOptions: Option[] }[] = [];

  for (const q of all) {
    const hasPrefixed = q.options.some((o) => /^\s*\(?[a-dA-D1-4]\)?[\.\)]\s/.test(o.text));
    if (!hasPrefixed) continue;

    const newOptions = q.options.map((o) => ({
      ...o,
      text: stripPrefix(o.text),
    }));

    // Only fix if something actually changed and no text became empty
    const changed = newOptions.some((o, i) => o.text !== q.options[i]!.text);
    const allValid = newOptions.every((o) => o.text.length > 0);

    if (changed && allValid) {
      needsFix.push({ id: q.id, newOptions });
    }
  }

  console.log(`Questions needing prefix strip: ${needsFix.length}`);

  if (needsFix.length === 0) {
    console.log("Nothing to fix!");
    return;
  }

  // Show samples
  console.log("\nSamples:");
  for (const item of needsFix.slice(0, 3)) {
    const orig = all.find((q) => q.id === item.id)!;
    console.log(`  Before: ${orig.options.map((o) => o.text.slice(0, 40)).join(" | ")}`);
    console.log(`  After:  ${item.newOptions.map((o) => o.text.slice(0, 40)).join(" | ")}`);
    console.log();
  }

  // Apply fixes
  let fixed = 0;
  let errors = 0;

  for (const item of needsFix) {
    const { error } = await supabase
      .from("questions")
      .update({ options: item.newOptions })
      .eq("id", item.id);

    if (error) {
      console.error(`  Failed ${item.id}:`, error.message);
      errors++;
    } else {
      fixed++;
    }

    if (fixed % 200 === 0 && fixed > 0) {
      console.log(`  Fixed ${fixed}/${needsFix.length}...`);
    }
  }

  console.log(`\nDone: ${fixed} fixed, ${errors} errors`);
}

main().catch(console.error);
