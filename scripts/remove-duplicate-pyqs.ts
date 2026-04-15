import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const { data: allPyqs, error } = await supabase
    .from("questions")
    .select("id, prompt, year, subject, created_at")
    .eq("source", "pyq")
    .order("created_at", { ascending: true });

  if (error || !allPyqs) {
    console.error("Failed to fetch:", error?.message);
    return;
  }

  // Group by normalized prompt prefix
  const groups = new Map<string, typeof allPyqs>();
  for (const q of allPyqs) {
    const key = q.prompt.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 100);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(q);
  }

  const dupes = Array.from(groups.entries()).filter(([, items]) => items.length > 1);
  console.log(`Found ${dupes.length} duplicate groups:\n`);

  const idsToDelete: string[] = [];

  for (const [prompt, items] of dupes) {
    console.log(`"${prompt.slice(0, 80)}..."`);
    // Keep the first (oldest) one, delete the rest
    const [keep, ...remove] = items;
    console.log(`  KEEP: ${keep!.id} (year=${keep!.year}, created=${keep!.created_at})`);
    for (const r of remove) {
      console.log(`  DELETE: ${r.id} (year=${r.year}, created=${r.created_at})`);
      idsToDelete.push(r.id);
    }
    console.log();
  }

  if (!idsToDelete.length) {
    console.log("No duplicates to remove.");
    return;
  }

  console.log(`\nDeleting ${idsToDelete.length} duplicate questions...`);

  // First check for references in attempt_answers and bookmarks
  const { count: answerRefs } = await supabase
    .from("attempt_answers")
    .select("*", { count: "exact", head: true })
    .in("question_id", idsToDelete);
  console.log(`  References in attempt_answers: ${answerRefs}`);

  const { count: bookmarkRefs } = await supabase
    .from("bookmarks")
    .select("*", { count: "exact", head: true })
    .in("question_id", idsToDelete);
  console.log(`  References in bookmarks: ${bookmarkRefs}`);

  // Delete from dependent tables first
  if (answerRefs && answerRefs > 0) {
    const { error: delAns } = await supabase
      .from("attempt_answers")
      .delete()
      .in("question_id", idsToDelete);
    if (delAns) console.error("  Failed to clean attempt_answers:", delAns.message);
    else console.log("  Cleaned attempt_answers references.");
  }

  if (bookmarkRefs && bookmarkRefs > 0) {
    const { error: delBm } = await supabase
      .from("bookmarks")
      .delete()
      .in("question_id", idsToDelete);
    if (delBm) console.error("  Failed to clean bookmarks:", delBm.message);
    else console.log("  Cleaned bookmarks references.");
  }

  // Also clean question_topics
  const { error: delTopics } = await supabase
    .from("question_topics")
    .delete()
    .in("question_id", idsToDelete);
  if (delTopics) console.log("  question_topics cleanup:", delTopics.message);

  // Delete the duplicate questions
  const { error: delError } = await supabase
    .from("questions")
    .delete()
    .in("id", idsToDelete);

  if (delError) {
    console.error("Failed to delete:", delError.message);
  } else {
    console.log(`\nSuccessfully removed ${idsToDelete.length} duplicate questions.`);
  }
}

main().catch(console.error);
