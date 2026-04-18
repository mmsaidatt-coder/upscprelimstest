import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // use service role to bypass RLS

const supabase = createClient(supabaseUrl, supabaseKey);

const defaultCommunities = [
  {
    name: "UPSC Journey",
    slug: "upsc-journey",
    description: "General discussion, study routines, motivation, and everything related to your UPSC Civil Services exam preparation.",
  },
  {
    name: "Current Affairs & News",
    slug: "current-affairs",
    description: "Daily news analysis, current-affairs compilations, editorials, and important current events for Prelims and Mains.",
  },
  {
    name: "Geography Lab",
    slug: "geography",
    description: "Discuss India & World mapping, physical geography concepts, national parks, and rivers.",
  },
  {
    name: "Polity & Constitution",
    slug: "polity",
    description: "Debate and discuss constitutional articles, recent Supreme Court judgments, and governance issues.",
  },
  {
    name: "CSAT Strategy",
    slug: "c-sat",
    description: "Math, logical reasoning, and reading comprehension strategies for Paper 2.",
  }
];

async function main() {
  console.log("Seeding communities...");

  for (const c of defaultCommunities) {
    const { data: existing } = await supabase
      .from("communities")
      .select("id")
      .eq("slug", c.slug)
      .single();

    if (!existing) {
      const { error, data } = await supabase.from("communities").insert([c]);
      if (error) {
        console.error(`Failed to create ${c.name}:`, error.message);
      } else {
        console.log(`✅ Created c/${c.slug}`);
      }
    } else {
      console.log(`ℹ️ Community c/${c.slug} already exists.`);
    }
  }

  console.log("Done seeding.");
}

main();
