import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const CRAWLER_FILES =
  /^\/(?:robots\.txt|llms\.txt|sitemap\.xml|[^/]+\/sitemap\.xml|\.well-known\/.+|api\/openapi\.json)$/;

export async function middleware(request: NextRequest) {
  // Enforce apex domain in production.
  const host = request.headers.get("host") ?? "";
  if (host === "www.upscprelimstest.com") {
    const url = request.nextUrl.clone();
    url.hostname = "upscprelimstest.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  // Crawler-facing files carry no session. Skipping updateSession keeps a slow
  // or failing Supabase call from ever turning a robots/sitemap fetch into an
  // error for Googlebot. The www redirect above still applies to them.
  if (CRAWLER_FILES.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Supabase session refresh + auth guard for account/admin app routes.
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
