import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // Enforce apex as the canonical host in production.
  if (host === "www.upscprelimstest.com") {
    const url = request.nextUrl.clone();
    url.hostname = "upscprelimstest.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
