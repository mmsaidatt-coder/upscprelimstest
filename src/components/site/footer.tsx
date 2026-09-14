import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const practiceLinks = [
  ["Past papers", "/pyq"],
  ["Mock exam", "/free-upsc-prelims-mock-test"],
  ["Subject practice", "/subject-wise"],
  ["Current affairs", "/current-affairs"],
] as const;

const platformLinks = [
  ["How it works", "/platform"],
  ["Analytics", "/analytics"],
  ["Methodology", "/methodology"],
  ["Corrections", "/feedback"],
] as const;

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between py-3 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
    >
      {label}
      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)] group-hover:opacity-100" />
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--ink)]">
      <div className="mx-auto max-w-[96rem] px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[1.35fr_0.65fr_0.65fr] lg:gap-20">
          <div>
            <p className="editorial-kicker">Independent exam practice</p>
            <p className="mt-8 max-w-xl text-[clamp(2.4rem,5vw,5.8rem)] font-semibold leading-[0.92] tracking-[-0.075em] text-[var(--foreground)]">
              Read the paper.
              <br />
              <span className="text-[var(--accent)]">Find the pattern.</span>
            </p>
            <p className="mt-8 max-w-md text-sm leading-7 text-[var(--muted)]">
              Free UPSC Prelims practice built around past papers, deliberate repetition, and clear performance feedback.
            </p>
          </div>

          <nav aria-label="Footer practice">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)]">
              01 · Practice
            </p>
            <div className="mt-5 border-t border-[var(--border)]">
              {practiceLinks.map(([label, href]) => (
                <FooterLink key={href} label={label} href={href} />
              ))}
            </div>
          </nav>

          <nav aria-label="Footer platform">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)]">
              02 · Platform
            </p>
            <div className="mt-5 border-t border-[var(--border)]">
              {platformLinks.map(([label, href]) => (
                <FooterLink key={href} label={label} href={href} />
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-20 grid gap-5 border-t border-[var(--border)] pt-6 font-mono text-[9px] uppercase leading-5 tracking-[0.14em] text-[var(--muted)] sm:grid-cols-3 sm:items-end">
          <p>© {new Date().getFullYear()} UPSC Prelims Test</p>
          <p className="max-w-sm sm:text-center">
            Not affiliated with the Union Public Service Commission
          </p>
          <Link href="/about" className="group inline-flex items-center gap-2 sm:justify-self-end">
            About this project
            <ArrowUpRight className="h-3 w-3 text-[var(--accent)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
