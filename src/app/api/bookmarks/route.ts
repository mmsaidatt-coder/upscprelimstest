import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Subject } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_HEADERS = { "Cache-Control": "no-store" };

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** GET — Fetch all bookmarks for the authenticated user */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401, headers: CACHE_HEADERS },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .select("question_id, subject, prompt, year, saved_at")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json(
      { success: false, error: "Could not fetch bookmarks" },
      { status: 500, headers: CACHE_HEADERS },
    );
  }

  const bookmarks = (data ?? []).map((row) => ({
    questionId: row.question_id as string,
    subject: row.subject as Subject,
    prompt: row.prompt as string,
    year: row.year as number | null,
    savedAt: row.saved_at as string,
  }));

  return NextResponse.json(
    { success: true, bookmarks },
    { headers: CACHE_HEADERS },
  );
}

/** POST — Sync bookmarks (upsert array of bookmarks) */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401, headers: CACHE_HEADERS },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    !("bookmarks" in body) ||
    !Array.isArray((body as { bookmarks: unknown }).bookmarks)
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid payload — expected { bookmarks: [] }" },
      { status: 400, headers: CACHE_HEADERS },
    );
  }

  const incoming = (body as { bookmarks: unknown[] }).bookmarks;
  const rows = incoming
    .filter(
      (b): b is { questionId: string; subject: string; prompt: string; year?: number | null; savedAt: string } =>
        Boolean(b) &&
        typeof b === "object" &&
        typeof (b as Record<string, unknown>).questionId === "string" &&
        typeof (b as Record<string, unknown>).subject === "string" &&
        typeof (b as Record<string, unknown>).prompt === "string" &&
        typeof (b as Record<string, unknown>).savedAt === "string",
    )
    .map((b) => ({
      user_id: user.id,
      question_id: b.questionId,
      subject: b.subject,
      prompt: b.prompt,
      year: b.year ?? null,
      saved_at: b.savedAt,
    }));

  if (!rows.length) {
    return NextResponse.json(
      { success: true, synced: 0 },
      { headers: CACHE_HEADERS },
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookmarks")
    .upsert(rows, { onConflict: "user_id,question_id" });

  if (error) {
    return NextResponse.json(
      { success: false, error: "Could not sync bookmarks" },
      { status: 500, headers: CACHE_HEADERS },
    );
  }

  return NextResponse.json(
    { success: true, synced: rows.length },
    { headers: CACHE_HEADERS },
  );
}

/** DELETE — Remove a bookmark by questionId */
export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401, headers: CACHE_HEADERS },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as Record<string, unknown>).questionId !== "string"
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid payload — expected { questionId: string }" },
      { status: 400, headers: CACHE_HEADERS },
    );
  }

  const questionId = (body as { questionId: string }).questionId;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("question_id", questionId);

  if (error) {
    return NextResponse.json(
      { success: false, error: "Could not delete bookmark" },
      { status: 500, headers: CACHE_HEADERS },
    );
  }

  return NextResponse.json(
    { success: true },
    { headers: CACHE_HEADERS },
  );
}
