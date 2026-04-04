"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/app";

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
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${nextPath}` },
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
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${nextPath}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-blueprint-grid w-full min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 transition-all duration-500 fade-up">
        {/* Decorative background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[var(--accent)]/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative card-elevated border-2 border-[#262626] bg-[#0e0e0e]/95 backdrop-blur-md rounded-[2rem] p-8 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <div className="text-center mb-8">
            <h1 className="heading text-3xl sm:text-4xl text-[var(--foreground)] tracking-wide">
              {mode === "login" ? "WELCOME BACK" : "CREATE ACCOUNT"}
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
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#333] bg-white px-4 py-3.5 text-sm font-bold tracking-wide text-black hover:bg-gray-100 disabled:opacity-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
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
            <div className="h-px flex-1 bg-[#333]" />
            <span className="text-xs uppercase tracking-widest text-[#666] font-bold">or</span>
            <div className="h-px flex-1 bg-[#333]" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#333] bg-[#161616] px-4 py-3 text-sm text-white outline-none focus:border-[var(--accent)] hover:border-[#444] transition-colors focus:ring-1 focus:ring-[var(--accent)] placeholder-[#555]"
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
                className="w-full rounded-xl border border-[#333] bg-[#161616] px-4 py-3 text-sm text-white outline-none focus:border-[var(--accent)] hover:border-[#444] transition-colors focus:ring-1 focus:ring-[var(--accent)] placeholder-[#555]"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[var(--accent)] px-4 py-3.5 text-[15px] font-bold uppercase tracking-widest text-black hover:bg-[#b0f53b] disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(163,230,53,0.2)] hover:shadow-[0_0_30px_rgba(163,230,53,0.4)] hover:-translate-y-0.5"
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
                  className="font-bold text-[var(--accent)] hover:text-[#b0f53b] transition-colors hover:underline"
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
                  className="font-bold text-[var(--accent)] hover:text-[#b0f53b] transition-colors hover:underline"
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
