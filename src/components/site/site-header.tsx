"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HeaderAccount = {
  displayName: string;
  email: string | null;
};

type AccountResponse = {
  account: HeaderAccount | null;
};

function isAccountResponse(value: unknown): value is AccountResponse {
  if (!value || typeof value !== "object" || !("account" in value)) {
    return false;
  }

  const { account } = value as { account: unknown };
  if (account === null) return true;
  if (!account || typeof account !== "object") return false;

  const candidate = account as Partial<HeaderAccount>;
  return (
    typeof candidate.displayName === "string" &&
    (typeof candidate.email === "string" || candidate.email === null)
  );
}

function HeaderAccountLink() {
  const [account, setAccount] = useState<HeaderAccount | null | undefined>();

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadAccount() {
      const response = await fetch("/api/account", {
        cache: "no-store",
        signal: controller.signal,
      });
      const data: unknown = await response.json();

      if (!active) return;

      setAccount(isAccountResponse(data) ? data.account : null);
    }

    void loadAccount().catch(() => {
      if (active) setAccount(null);
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  if (account === undefined) {
    return (
      <span
        aria-label="Checking signed-in account"
        className="h-4 w-24 shrink-0 animate-pulse rounded bg-[var(--border)]"
      />
    );
  }

  if (!account) {
    return (
      <Link
        href="/login"
        className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors shrink-0"
      >
        Login / Sign up
      </Link>
    );
  }

  return (
    <Link
      href="/app/settings"
      title={account.email ?? account.displayName}
      aria-label={`Signed in as ${account.displayName}. Open account settings.`}
      className="block max-w-[9rem] truncate text-right text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--foreground)] sm:max-w-[14rem]"
    >
      {account.displayName}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
      <div className="flex h-14 w-full items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <span className="text-sm sm:text-base font-serif font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
            <span className="hidden sm:inline">UPSC Prelims Test</span>
            <span className="sm:hidden">UPSCPT</span>
          </span>
        </Link>

        <HeaderAccountLink />
      </div>
    </header>
  );
}
