import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DUMMY_USERS = [
  { email: "aspirant1@example.com", name: "UPSC_Warrior" },
  { email: "aspirant2@example.com", name: "LBSNAA_Bound" },
  { email: "aspirant3@example.com", name: "Delhi_Aspirant" },
  { email: "aspirant4@example.com", name: "Daily_Hustler" },
  { email: "aspirant5@example.com", name: "IAS_Dreamer" },
];

const POSTS_DATA: Record<
  string,
  { title: string; content: string; comments: string[] }[]
> = {
  "c-sat": [
    {
      title: "How are you guys managing time for CSAT passages?",
      content:
        "I find myself spending almost 5 minutes per reading comprehension passage. I get them right, but then I miss out on the easier math questions towards the end. Any strategies to skim faster without losing accuracy?",
      comments: [
        "Read the question first, then jump to the passage. Usually, the keywords are right there.",
        "Honestly, I skip the long inference-based passages completely and target the math and logical reasoning sections first.",
        "Practice 5 passages daily with a timer. Your brain will automatically start filtering out filler words.",
      ],
    },
    {
      title: "Best resources for Permutation & Combination?",
      content:
        "P&C always trips me up. The questions in recent years are getting trickier. What's a good resource to build the foundation from scratch?",
      comments: [
        "Watch Amit Garg's old videos on YouTube. He explains the base logic really well.",
        "Just stick to PYQs for P&C. If it's too complex, better to leave it than risk a negative mark.",
      ],
    },
  ],
  polity: [
    {
      title: "Is Laxmikanth enough for 2026 given recent analytical questions?",
      content:
        "Looking at the 2024 and 2025 papers, Polity questions seem more analytical and less direct fact-based. Should we supplement Laxmikanth with something else like D.D. Basu?",
      comments: [
        "Laxmikanth is still the base, but you need to read the newspaper (The Hindu/Express) for the applied part. Link current cases to static chapters.",
        "Don't read D.D. Basu now, it's too academic. Laxmikanth + bare act of the Constitution is enough.",
        "I just use the platform's subject-wise Polity practice sets. The AI explanations bridge the gap nicely.",
      ],
    },
  ],
  geography: [
    {
      title: "Anyone used the new Geography Lab? The Himalayan rivers map is super helpful.",
      content:
        "I always confused the tributaries of Ganga and Indus. The new high-res interactive map on this platform finally made it click for me. Suggest checking it out if you struggle with mapping.",
      comments: [
        "Yeah! I wish they added more passes and glaciers soon.",
        "Mapping questions are basically free marks if your visual memory is good. The cinematic pan thing they added is cool.",
      ],
    },
  ],
  "current-affairs": [
    {
      title: "Monthly magazines vs daily newspaper notes? I commute 2 hours daily.",
      content:
        "I travel 2 hours daily for work. Reading the paper and making notes is taking up all my energy. Can I just rely on Vision/Insights monthly magazines?",
      comments: [
        "Listen to newspaper analysis podcasts during your commute. Don't make notes from the paper, just read it to understand the issue. Use magazines for notes.",
        "I second this. Making daily notes is a trap for working professionals.",
        "If you use this platform's Current Affairs database, you get 1000+ MCQs. Just solving those covers 90% of the magazines anyway.",
      ],
    },
  ],
  "upsc-journey": [
    {
      title: "Feeling burnt out after 2 failed prelims. How do you stay motivated?",
      content:
        "I gave my 100% last year but missed the cutoff by 3 marks. Now starting the cycle again feels incredibly heavy. How do you guys manage the emotional toll?",
      comments: [
        "Take a complete 2-week break. Don't even look at a book. You need a hard reset.",
        "Remember why you started. And also have a solid Plan B — it takes the pressure off.",
        "Missed it by 1 mark in 2023. I know the pain. Focus on mock tests and track your progress strictly. Gamifying the prep helps.",
      ],
    },
  ],
};

async function main() {
  console.log("Starting Forum Seed Script...");

  const userIds: string[] = [];

  // 1. Create or get dummy users
  for (const dummy of DUMMY_USERS) {
    // Attempt to create user
    const { data: userRecord, error: createError } =
      await supabase.auth.admin.createUser({
        email: dummy.email,
        password: "Password123!",
        email_confirm: true,
      });

    let userId: string;

    if (createError) {
        // If already exists, we must fetch their ID
        const { data: existingUser } = await supabase.from('profiles').select('id').eq('display_name', dummy.email).single();
        if(existingUser){
            userId = existingUser.id;
        } else {
            console.log(`Failed to create or fetch ${dummy.email}:`, createError);
            continue;
        }
    } else {
        userId = userRecord.user.id;
    }

    userIds.push(userId);

    // Wait a second to allow the postgres trigger 'handle_new_user' to create the profile row
    await new Promise((res) => setTimeout(res, 1000));

    // Update the profile with anonymous_name
    await supabase
      .from("profiles")
      .update({ anonymous_name: dummy.name })
      .eq("id", userId);
      
    console.log(`User seeded: ${dummy.name} (${userId})`);
  }

  if (userIds.length === 0) {
    console.error("No users were created/found. Exiting.");
    return;
  }

  // 2. Fetch communities
  const { data: communities, error: comError } = await supabase
    .from("communities")
    .select("id, slug, name");

  if (comError || !communities) {
    console.error("Failed to fetch communities", comError);
    return;
  }

  // 3. Seed Posts & Comments
  for (const community of communities) {
    const postsConfig = POSTS_DATA[community.slug];
    if (!postsConfig) continue;

    console.log(`Seeding posts for ${community.name}...`);

    for (const postConfig of postsConfig) {
      const authorId = userIds[Math.floor(Math.random() * userIds.length)];

      const { data: insertedPost, error: postError } = await supabase
        .from("community_posts")
        .insert({
          community_id: community.id,
          user_id: authorId,
          title: postConfig.title,
          content: postConfig.content,
        })
        .select()
        .single();

      if (postError) {
        console.error("Error inserting post:", postError);
        continue;
      }

      console.log(`  -> Created Post: "${postConfig.title}"`);

      // Seed comments
      for (const commentText of postConfig.comments) {
        let commentAuthorId = authorId;
        // Try to pick a different author for comments
        while (commentAuthorId === authorId && userIds.length > 1) {
          commentAuthorId = userIds[Math.floor(Math.random() * userIds.length)];
        }

        const { error: commentError } = await supabase
          .from("community_comments")
          .insert({
            post_id: insertedPost.id,
            user_id: commentAuthorId,
            content: commentText,
          });

        if (commentError) {
          console.error("Error inserting comment:", commentError);
        }
      }
    }
  }

  console.log("Forum seeding completed successfully!");
}

main();
