"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user);
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-[var(--background-secondary)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <section className="card flex flex-col items-center justify-center p-12 text-center border-dashed border-[var(--border)] bg-transparent">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--background-secondary)] mb-6 text-2xl">
            ⚙️
          </div>
          <h2 className="heading text-3xl mb-3">Login to manage account</h2>
          <p className="max-w-md text-[var(--muted)] mb-8 leading-7">
            You must be logged in to manage your profile and app settings.
          </p>
          <Link
            href="/login?next=/app/settings"
            className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--accent)]/90 transition-colors uppercase tracking-widest"
          >
            Login or Sign up
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header>
        <p className="label">Configuration</p>
        <h1 className="heading mt-2 text-3xl">Profile & Settings</h1>
      </header>

      <section className="card p-6 border border-[#333]">
        <h2 className="text-lg font-bold text-[var(--foreground)]">Account Details</h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--muted)]">Email Address</p>
            <p className="mt-1 font-medium">{userEmail}</p>
          </div>
        </div>
      </section>

      <section className="card p-6 border border-[#333]">
        <h2 className="text-lg font-bold text-[var(--foreground)]">Sync Settings</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Sync your local storage attempts to the cloud database securely. (Feature placeholder)
        </p>
        <button 
          disabled
          className="mt-4 rounded-lg bg-[var(--background-secondary)] px-4 py-2 text-sm font-medium text-[var(--muted)] cursor-not-allowed border border-[#333]"
        >
          Sync to Cloud
        </button>
      </section>
    </div>
  );
}
