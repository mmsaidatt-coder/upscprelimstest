"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

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

function getAppOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredOrigin) {
    try {
      return new URL(configuredOrigin).origin;
    } catch {
      // Fall back to the runtime origin below.
    }
  }

  return window.location.origin;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth_failed"
      ? "Authentication failed. Please try again."
      : null,
  );

  const supabase = createClient();

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "signup") {
      const callbackUrl = new URL("/auth/callback", getAppOrigin());
      callbackUrl.searchParams.set("next", nextPath);

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callbackUrl.toString() },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      setError(null);
      setMode("login");
      setLoading(false);
      alert("Check your email for a confirmation link, then log in.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    router.push(nextPath);
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    const callbackUrl = new URL("/auth/callback", getAppOrigin());
    callbackUrl.searchParams.set("next", nextPath);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-warm-grid w-full min-h-dvh flex items-center justify-center px-4 py-8 relative overflow-hidden bg-[var(--background)] sm:py-12">
      <div className="w-full max-w-md relative z-10 transition-all duration-500 fade-up">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[var(--accent)]/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] sm:rounded-[2rem] sm:p-12">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="heading text-2xl text-[var(--foreground)] sm:text-4xl">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[var(--muted)] font-medium">
              {mode === "login"
                ? "Log in to continue practicing."
                : "Sign up to start your UPSC prep."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3.5 text-sm font-bold tracking-wide text-[var(--foreground)] hover:bg-[#F5F0EB] disabled:opacity-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">or</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] hover:border-[var(--accent)]/50 transition-colors focus:ring-1 focus:ring-[var(--accent)] placeholder-[var(--muted)]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] hover:border-[var(--accent)]/50 transition-colors focus:ring-1 focus:ring-[var(--accent)] placeholder-[var(--muted)]"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[var(--accent)] px-4 py-3.5 text-[15px] font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all hover:-translate-y-0.5"
            >
              {loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--muted)] font-medium">
            {mode === "login" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(null); }}
                  className="font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(null); }}
                  className="font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors hover:underline"
                >
                  Log in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
