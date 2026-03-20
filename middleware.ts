import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Enforce apex domain in production.
  const host = request.headers.get("host") ?? "";
  if (host === "www.upscprelimstest.com") {
    const url = request.nextUrl.clone();
    url.hostname = "upscprelimstest.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  // Supabase session refresh + auth guard for /app routes.
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
