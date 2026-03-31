/**
 * Runtime environment variable validation.
 * Import this file early (e.g., in layout.tsx or middleware.ts)
 * to fail fast if required vars are missing.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check your .env.local file.`,
    );
  }
  return value;
}

/** Validated server-side environment variables. */
export const env = {
  get SUPABASE_URL() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get SUPABASE_ANON_KEY() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get GEMINI_API_KEY() {
    return process.env.GEMINI_API_KEY ?? "";
  },
  get GEMINI_MODEL() {
    return process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";
  },
} as const;
