import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session — this is critical for Server Components.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes under /app that guests can access (test-taking + single-test result).
  const publicAppRoutes = ["/app/pyq/run", "/app/pyq/sectional", "/app/exams/", "/app/attempts/"];
  const isPublicAppRoute = publicAppRoutes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  // Protect /app routes: redirect to /login if not authenticated.
  // Guest-accessible test routes are exempted so anyone can take a test.
  if (!user && request.nextUrl.pathname.startsWith("/app") && !isPublicAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from /login.
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
