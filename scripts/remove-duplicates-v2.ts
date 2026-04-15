/**
 * Remove duplicate questions (keep the oldest, delete the rest).
 * Groups by normalized prompt prefix (first 120 chars, lowercased, whitespace collapsed).
 *
 * Run: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/remove-duplicates-v2.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const all: { id: string; prompt: string; source: string; created_at: string }[] = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, prompt, source, created_at")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) { console.error("Fetch error:", error.message); return; }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    page++;
  }

  console.log(`Total questions: ${all.length}`);

  // Group by normalized prompt
  const groups = new Map<string, typeof all>();
  for (const q of all) {
    const norm = q.prompt.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 120);
    if (!groups.has(norm)) groups.set(norm, []);
    groups.get(norm)!.push(q);
  }

  // Find duplicates
  const toDelete: string[] = [];
  let dupGroups = 0;

  for (const [, items] of groups) {
    if (items.length <= 1) continue;
    dupGroups++;

    // Sort by created_at ascending, keep first (oldest)
    items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Prefer keeping PYQ source over custom
    const pyqItem = items.find((i) => i.source === "pyq");
    const keepId = pyqItem ? pyqItem.id : items[0]!.id;

    for (const item of items) {
      if (item.id !== keepId) {
        toDelete.push(item.id);
      }
    }
  }

  console.log(`Duplicate groups: ${dupGroups}`);
  console.log(`Questions to delete: ${toDelete.length}`);

  if (toDelete.length === 0) {
    console.log("Nothing to delete!");
    return;
  }

  // Delete in batches of 50
  let deleted = 0;
  let errors = 0;

  for (let i = 0; i < toDelete.length; i += 50) {
    const batch = toDelete.slice(i, i + 50);

    // Clean dependent tables first
    for (const table of ["attempt_answers", "question_topics", "bookmarks", "test_template_questions"]) {
      await supabase.from(table).delete().in("question_id", batch);
    }

    const { error } = await supabase
      .from("questions")
      .delete()
      .in("id", batch);

    if (error) {
      console.error(`  Delete batch error:`, error.message);
      errors += batch.length;
    } else {
      deleted += batch.length;
    }

    if ((i + 50) % 200 === 0 || i + 50 >= toDelete.length) {
      console.log(`  Deleted ${deleted}/${toDelete.length}...`);
    }
  }

  console.log(`\nDone: ${deleted} deleted, ${errors} errors`);
}

main().catch(console.error);
