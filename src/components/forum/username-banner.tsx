"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateAnonymousName } from "@/app/app/forum/actions";
import { UserCircle2, Loader2 } from "lucide-react";

export function UsernameBanner() {
  const [needsName, setNeedsName] = useState(false);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("anonymous_name")
        .eq("id", user.id)
        .single();
      if (!data?.anonymous_name) setNeedsName(true);
    });
  }, []);

  if (!needsName || done) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("anonymous_name", value.trim());
      await updateAnonymousName(fd);
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Failed to set username.");
    }
    setSubmitting(false);
  }

  return (
    <div className="mb-6 rounded-2xl border border-accent/20 bg-accent/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
          <UserCircle2 className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Choose your forum username</p>
          <p className="text-sm text-muted">Pick an anonymous name that will be displayed on all your posts and comments.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
        {error && <p className="text-danger text-xs font-medium">{error}</p>}
        <input
          type="text"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. aspirant_2026"
          maxLength={30}
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={submitting || !value.trim()}
          className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Saving..." : "Set Username"}
        </button>
      </form>
    </div>
  );
}
