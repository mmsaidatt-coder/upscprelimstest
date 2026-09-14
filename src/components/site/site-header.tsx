"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

type HeaderAccount = {
  displayName: string;
  email: string | null;
};

type AccountResponse = {
  account: HeaderAccount | null;
};

const navigation = [
  { href: "/pyq", label: "Previous Papers" },
  { href: "/free-upsc-prelims-mock-test", label: "Mock Test" },
  { href: "/subject-wise", label: "Subjects" },
  { href: "/analytics", label: "Analytics" },
  { href: "/current-affairs", label: "Current Affairs" },
];

function isAccountResponse(value: unknown): value is AccountResponse {
  if (!value || typeof value !== "object" || !("account" in value)) return false;
  const { account } = value as { account: unknown };
  if (account === null) return true;
  if (!account || typeof account !== "object") return false;
  const candidate = account as Partial<HeaderAccount>;
  return (
    typeof candidate.displayName === "string" &&
    (typeof candidate.email === "string" || candidate.email === null)
  );
}

function Brand() {
  return (
    <span className="flex items-center gap-3" aria-label="UPSC Prelims Test">
      <span className="font-mono text-[1.05rem] font-bold tracking-[-0.09em] text-[var(--foreground)] sm:text-xl">
        UPSC
      </span>
      <span className="h-7 w-px bg-[var(--accent)]" aria-hidden="true" />
      <span className="hidden text-[9px] font-bold uppercase leading-[1.35] tracking-[0.24em] text-[var(--muted)] sm:block">
        Prelims
        <br />
        Test
      </span>
    </span>
  );
}

function HeaderAccountLink({ mobile = false }: { mobile?: boolean }) {
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
      if (active) setAccount(isAccountResponse(data) ? data.account : null);
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
    return <span className="h-10 w-24 animate-pulse bg-[var(--border-light)]" />;
  }

  const href = account ? "/app/settings" : "/login";
  const label = account ? account.displayName : "Sign in";

  return (
    <Link
      href={href}
      title={account?.email ?? label}
      className={
        mobile
          ? "group flex items-center justify-between border-t border-[var(--border)] py-6 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--foreground)]"
          : "group inline-flex min-h-10 items-center gap-2 border border-[var(--border)] px-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--foreground)] hover:border-[var(--foreground)]"
      }
    >
      <span className="max-w-32 truncate">{label}</span>
      <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:rgba(27,33,28,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[96rem] items-center px-4 sm:px-6 lg:h-[76px] lg:px-10">
          <Link href="/" className="group shrink-0" aria-label="UPSC Prelims Test home">
            <Brand />
          </Link>

          <nav aria-label="Primary" className="ml-auto hidden items-center gap-7 lg:flex xl:gap-9">
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative py-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] transition-colors xl:text-[10px] ${
                    active ? "text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {active ? <span className="absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent)]" /> : null}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-7 hidden lg:block">
            <HeaderAccountLink />
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            className="ml-auto flex h-11 w-11 items-center justify-center border border-[var(--border)] text-[var(--foreground)] lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div
          id="mobile-navigation"
          className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-[var(--background)] px-5 pb-8 pt-8 lg:hidden"
        >
          <div className="mx-auto flex min-h-full max-w-xl flex-col">
            <p className="editorial-kicker">Navigate</p>
            <nav className="mt-10 border-t border-[var(--border)]" aria-label="Mobile primary">
              {navigation.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="group flex items-center border-b border-[var(--border)] py-5"
                >
                  <span className="index-number w-10">0{index + 1}</span>
                  <span className="text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                    {item.label}
                  </span>
                  <ArrowUpRight className="ml-auto h-5 w-5 text-[var(--muted)] group-hover:text-[var(--accent)]" />
                </Link>
              ))}
            </nav>
            <div className="mt-auto pt-12">
              <HeaderAccountLink mobile />
              <p className="mt-5 max-w-xs text-xs leading-6 text-[var(--muted)]">
                Independent, free UPSC Prelims practice. No paywall and no signup required to start.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
