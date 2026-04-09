import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  display_name: string | null;
};

function readMetadataString(
  metadata: Record<string, unknown> | undefined,
  keys: string[],
) {
  if (!metadata) return null;

  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getDisplayName(user: User, profile: ProfileRow | null) {
  const profileName = profile?.display_name?.trim() || null;

  return (
    readMetadataString(user.user_metadata, ["name", "full_name", "display_name"]) ??
    profileName ??
    user.email ??
    "Account"
  );
}

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { account: null },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  return NextResponse.json(
    {
      account: {
        displayName: getDisplayName(user, profile ?? null),
        email: user.email ?? null,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
