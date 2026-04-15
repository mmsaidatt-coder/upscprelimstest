/**
 * Fix case mismatch: normalize option IDs to uppercase (A,B,C,D)
 * where correct_option_id is already uppercase but option IDs are lowercase.
 *
 * Run: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/fix-case-mismatch.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Option = { id: string; text: string };

async function main() {
  // Fetch all questions with lowercase option IDs
  const all: { id: string; options: Option[]; correct_option_id: string | null }[] = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, options, correct_option_id")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) { console.error("Fetch error:", error.message); return; }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    page++;
  }

  console.log(`Total questions: ${all.length}`);

  // Find questions with lowercase option IDs
  const needsFix: { id: string; options: Option[]; correct_option_id: string | null }[] = [];
  for (const q of all) {
    const hasLowercase = q.options.some((o: Option) => /^[a-d]$/.test(o.id));
    if (hasLowercase) needsFix.push(q);
  }

  console.log(`Questions with lowercase option IDs: ${needsFix.length}`);

  if (needsFix.length === 0) {
    console.log("Nothing to fix!");
    return;
  }

  // Fix: uppercase option IDs
  let fixed = 0;
  let errors = 0;

  for (const q of needsFix) {
    const newOptions = q.options.map((o: Option) => ({
      ...o,
      id: o.id.toUpperCase(),
    }));

    const { error } = await supabase
      .from("questions")
      .update({ options: newOptions })
      .eq("id", q.id);

    if (error) {
      console.error(`  Failed ${q.id}:`, error.message);
      errors++;
    } else {
      fixed++;
    }

    if (fixed % 100 === 0) {
      console.log(`  Fixed ${fixed}/${needsFix.length}...`);
    }
  }

  console.log(`\nDone: ${fixed} fixed, ${errors} errors`);
}

main().catch(console.error);
