import crypto from "node:crypto";
import dotenv from "dotenv";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

type TablePlan = {
  name: string;
  columns: string;
  orderBy: string[];
  onConflict: string;
  transform?: (row: Record<string, unknown>, userIdMap: Map<string, string>) => Record<string, unknown>;
};

const PAGE_SIZE = 1000;
const UPSERT_CHUNK_SIZE = 200;

const sourceUrl = process.env.SOURCE_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const sourceServiceRoleKey =
  process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetUrl = process.env.TARGET_SUPABASE_URL;
const targetServiceRoleKey = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY;

if (!sourceUrl || !sourceServiceRoleKey) {
  throw new Error("Missing source Supabase configuration.");
}

if (!targetUrl || !targetServiceRoleKey) {
  throw new Error("Missing target Supabase configuration.");
}

const source = createClient(sourceUrl, sourceServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const target = createClient(targetUrl, targetServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tablePlans: TablePlan[] = [
  {
    name: "questions",
    columns:
      "id,source,subject,difficulty,prompt,context_lines,options,correct_option_id,explanation,takeaway,marks,negative_marks,year,source_label,created_at,updated_at,topic,sub_topic,keywords,question_type,concepts,difficulty_rationale,importance,ncert_class,mnemonic_hint",
    orderBy: ["id"],
    onConflict: "id",
  },
  {
    name: "topics",
    columns: "id,name,created_at",
    orderBy: ["id"],
    onConflict: "id",
  },
  {
    name: "question_topics",
    columns: "question_id,topic_id",
    orderBy: ["question_id", "topic_id"],
    onConflict: "question_id,topic_id",
  },
  {
    name: "test_templates",
    columns:
      "id,slug,title,tagline,description,duration_minutes,difficulty_label,question_count,is_published,created_at,updated_at",
    orderBy: ["id"],
    onConflict: "id",
  },
  {
    name: "test_template_questions",
    columns: "template_id,question_id,ordinal",
    orderBy: ["template_id", "ordinal"],
    onConflict: "template_id,question_id",
  },
  {
    name: "attempts",
    columns:
      "id,user_id,test_template_id,test_slug,test_title,started_at,completed_at,duration_seconds,grading,score,total_marks,graded_question_count,graded_total_marks,attempted_count,correct_count,incorrect_count,unattempted_count,accuracy_percent,percentile_estimate,readiness_band,created_at",
    orderBy: ["created_at", "id"],
    onConflict: "id",
    transform: (row, userIdMap) => ({
      ...row,
      user_id: remapUserId(row.user_id, userIdMap, "attempts"),
    }),
  },
  {
    name: "attempt_answers",
    columns:
      "id,attempt_id,question_id,ordinal,selected_option_id,is_correct,time_spent_seconds,marked_for_review,eliminated_option_ids",
    orderBy: ["attempt_id", "ordinal"],
    onConflict: "id",
  },
  {
    name: "notebook_entries",
    columns: "id,user_id,question_id,attempt_id,test_slug,subject,title,body,saved_at",
    orderBy: ["saved_at", "id"],
    onConflict: "id",
    transform: (row, userIdMap) => ({
      ...row,
      user_id: remapUserId(row.user_id, userIdMap, "notebook_entries"),
    }),
  },
];

function remapUserId(
  userId: unknown,
  userIdMap: Map<string, string>,
  table: string,
): string {
  const sourceUserId = typeof userId === "string" ? userId : "";
  const targetUserId = userIdMap.get(sourceUserId);

  if (!targetUserId) {
    throw new Error(`Missing user id mapping for ${table}: ${sourceUserId}`);
  }

  return targetUserId;
}

async function listAllUsers(client: SupabaseClient) {
  const users: User[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });

    if (error) {
      throw error;
    }

    users.push(...data.users);

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return users;
}

async function countRows(client: SupabaseClient, table: string) {
  const { count, error } = await client.from(table).select("*", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function fetchPage(client: SupabaseClient, plan: TablePlan, from: number, to: number) {
  let query = client.from(plan.name).select(plan.columns).range(from, to);

  for (const column of plan.orderBy) {
    query = query.order(column);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Record<string, unknown>[];
}

async function fetchAllRows(client: SupabaseClient, plan: TablePlan) {
  const total = await countRows(client, plan.name);
  const rows: Record<string, unknown>[] = [];

  for (let from = 0; from < total; from += PAGE_SIZE) {
    const page = await fetchPage(client, plan, from, from + PAGE_SIZE - 1);
    rows.push(...page);
  }

  return rows;
}

async function upsertRows(
  client: SupabaseClient,
  plan: TablePlan,
  rows: Record<string, unknown>[],
) {
  for (let index = 0; index < rows.length; index += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(index, index + UPSERT_CHUNK_SIZE);
    const { error } = await client
      .from(plan.name)
      .upsert(chunk, { onConflict: plan.onConflict, ignoreDuplicates: false });

    if (error) {
      throw error;
    }
  }
}

async function ensureUsersAndProfiles() {
  const sourceUsers = await listAllUsers(source);
  const targetUsers = await listAllUsers(target);
  const sourceProfiles = await fetchAllRows(source, {
    name: "profiles",
    columns: "id,display_name,avatar_url,created_at,updated_at",
    orderBy: ["id"],
    onConflict: "id",
  });

  const targetUsersByEmail = new Map(
    targetUsers
      .filter((user) => typeof user.email === "string" && user.email.length > 0)
      .map((user) => [user.email!.toLowerCase(), user]),
  );
  const sourceProfileById = new Map(
    sourceProfiles.map((profile) => [String(profile.id), profile]),
  );

  const userIdMap = new Map<string, string>();
  let createdUsers = 0;

  for (const sourceUser of sourceUsers) {
    if (!sourceUser.email) {
      continue;
    }

    const emailKey = sourceUser.email.toLowerCase();
    let targetUser = targetUsersByEmail.get(emailKey);

    if (!targetUser) {
      const { data, error } = await target.auth.admin.createUser({
        email: sourceUser.email,
        email_confirm: Boolean(sourceUser.email_confirmed_at ?? sourceUser.confirmed_at),
        app_metadata: sourceUser.app_metadata ?? {},
        user_metadata: sourceUser.user_metadata ?? {},
        password: crypto.randomBytes(24).toString("base64url"),
      });

      if (error) {
        throw error;
      }

      targetUser = data.user ?? undefined;
      if (targetUser) {
        targetUsersByEmail.set(emailKey, targetUser);
      }
      createdUsers += 1;
    }

    if (!targetUser?.id) {
      throw new Error(`Unable to create or resolve target user for ${sourceUser.email}`);
    }

    userIdMap.set(sourceUser.id, targetUser.id);
  }

  const profileRows = [...userIdMap.entries()]
    .map(([sourceUserId, targetUserId]) => {
      const profile = sourceProfileById.get(sourceUserId);
      if (!profile) return null;

      return {
        id: targetUserId,
        display_name: profile.display_name ?? null,
        avatar_url: profile.avatar_url ?? null,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };
    })
    .filter((row): row is Record<string, unknown> => row !== null);

  if (profileRows.length > 0) {
    await upsertRows(
      target,
      {
        name: "profiles",
        columns: "id,display_name,avatar_url,created_at,updated_at",
        orderBy: ["id"],
        onConflict: "id",
      },
      profileRows,
    );
  }

  return {
    userIdMap,
    sourceUserCount: sourceUsers.length,
    targetUserCount: targetUsers.length + createdUsers,
    createdUsers,
  };
}

async function migrateTable(plan: TablePlan, userIdMap: Map<string, string>) {
  const total = await countRows(source, plan.name);
  console.log(`\nMigrating ${plan.name}: ${total} rows`);

  for (let from = 0; from < total; from += PAGE_SIZE) {
    const page = await fetchPage(source, plan, from, from + PAGE_SIZE - 1);
    const transformed = plan.transform ? page.map((row) => plan.transform!(row, userIdMap)) : page;
    await upsertRows(target, plan, transformed);
    console.log(`  ${plan.name}: ${Math.min(from + page.length, total)} / ${total}`);
  }

  const sourceCount = await countRows(source, plan.name);
  const targetCount = await countRows(target, plan.name);

  if (sourceCount !== targetCount) {
    throw new Error(
      `Count mismatch for ${plan.name}: source=${sourceCount}, target=${targetCount}`,
    );
  }

  console.log(`  Verified ${plan.name}: ${targetCount}`);
}

async function main() {
  console.log("Source:", sourceUrl);
  console.log("Target:", targetUrl);

  const userSummary = await ensureUsersAndProfiles();
  console.log(
    `Users ready: source=${userSummary.sourceUserCount}, target=${userSummary.targetUserCount}, created=${userSummary.createdUsers}`,
  );

  for (const plan of tablePlans) {
    await migrateTable(plan, userSummary.userIdMap);
  }

  console.log("\nSupabase data migration completed successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
