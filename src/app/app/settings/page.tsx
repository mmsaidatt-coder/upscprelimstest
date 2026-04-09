"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type AccountProfile = {
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  provider: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
};

type ProfileRow = {
  display_name: string | null;
  avatar_url: string | null;
};

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

function getProvider(user: User) {
  const provider = readMetadataString(user.app_metadata, ["provider"]);
  const identityProvider = user.identities?.find((identity) => identity.provider)?.provider;
  return provider ?? identityProvider ?? null;
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getInitials(name: string | null, email: string | null) {
  const source = name ?? email ?? "User";
  const parts = source
    .replace(/@.*/, "")
    .split(/\s+|[._-]+/)
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";
}

function buildAccountProfile(user: User, profile: ProfileRow | null): AccountProfile {
  const metadataName = readMetadataString(user.user_metadata, [
    "name",
    "full_name",
    "display_name",
  ]);
  const profileName =
    profile?.display_name && profile.display_name !== user.email ? profile.display_name : null;

  return {
    displayName: metadataName ?? profileName,
    email: user.email ?? null,
    avatarUrl:
      readMetadataString(user.user_metadata, ["avatar_url", "picture"]) ??
      profile?.avatar_url ??
      null,
    provider: getProvider(user),
    createdAt: user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadAccount() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;

      setIsAuthenticated(!!data.user);

      if (!data.user) {
        setAccountProfile(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle<ProfileRow>();

      if (!active) return;
      setAccountProfile(buildAccountProfile(data.user, profile ?? null));
    }

    void loadAccount();

    return () => {
      active = false;
    };
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
            className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] transition-colors uppercase tracking-widest"
          >
            Login or Sign up
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-8">
      <header>
        <p className="label">Configuration</p>
        <h1 className="heading mt-1.5 text-2xl sm:mt-2 sm:text-3xl">Profile & Settings</h1>
      </header>

      <section className="card p-4 border border-[var(--border)] sm:p-6">
        <h2 className="text-base font-bold text-[var(--foreground)] sm:text-lg">Account Details</h2>

        <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:flex-row sm:items-center sm:gap-5">
          {accountProfile?.avatarUrl ? (
            <div
              aria-label="Profile photo"
              className="h-14 w-14 rounded-full border border-[var(--border)] bg-cover bg-center sm:h-16 sm:w-16"
              role="img"
              style={{ backgroundImage: `url(${accountProfile.avatarUrl})` }}
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-secondary)] text-lg font-bold text-[var(--accent)] sm:h-16 sm:w-16 sm:text-xl">
              {getInitials(accountProfile?.displayName ?? null, accountProfile?.email ?? null)}
            </div>
          )}

          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-[var(--muted)]">Signed in as</p>
            <p className="mt-1 text-lg font-bold text-[var(--foreground)] truncate sm:text-xl">
              {accountProfile?.displayName ?? "Name not provided"}
            </p>
            <p className="mt-0.5 text-sm text-[var(--muted)] truncate">
              {accountProfile?.email ?? "Email not available"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
          {[
            { label: "Name", value: accountProfile?.displayName ?? "Not provided" },
            { label: "Email Address", value: accountProfile?.email ?? "Not available" },
            { label: "Login Provider", value: accountProfile?.provider ?? "Not available" },
            { label: "Account Created", value: formatDate(accountProfile?.createdAt ?? null) },
            { label: "Last Sign-In", value: formatDate(accountProfile?.lastSignInAt ?? null) },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-[var(--background-secondary)] p-3 sm:p-4">
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted)] sm:text-xs">{item.label}</p>
              <p className="mt-1 break-words text-sm font-medium text-[var(--foreground)] sm:text-base">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4 border border-[var(--border)] sm:p-6">
        <h2 className="text-base font-bold text-[var(--foreground)] sm:text-lg">Sync Settings</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Signed-in attempts sync automatically after submission and load back into
          your dashboard, results, and analytics.
        </p>
        <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm font-medium text-[var(--muted)] sm:mt-4 sm:px-4">
          Automatic sync active
        </p>
      </section>
    </div>
  );
}
