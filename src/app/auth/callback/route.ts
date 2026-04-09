import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

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

async function syncUserProfile(user: User) {
  const displayName =
    readMetadataString(user.user_metadata, ["name", "full_name", "display_name"]) ??
    user.email ??
    null;
  const avatarUrl = readMetadataString(user.user_metadata, ["avatar_url", "picture"]);

  const patch = {
    display_name: displayName,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  await supabase.from("profiles").update(patch).eq("id", user.id);
}

function getSafeNextPath(rawNext: string | null) {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return "/app";
  }

  try {
    const url = new URL(rawNext, "https://upscprelimstest.local");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/app";
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await syncUserProfile(user);
      }

      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set("error", "auth_failed");
  return NextResponse.redirect(errorUrl);
}
