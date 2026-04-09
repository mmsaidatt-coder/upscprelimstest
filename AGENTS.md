# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (Next.js on localhost:3000)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (ESLint with next/core-web-vitals + next/typescript)
- **Import PYQs:** `npm run import-pyq` (runs `tsx scripts/import-pyq-csv.ts`)
- **Generate current affairs:** `npm run generate-current-affairs` (runs `tsx scripts/generate-current-affairs-bank.ts`)
- **Run any script:** `npx tsx scripts/<name>.ts` (scripts are excluded from tsconfig)

No test framework is configured. Node.js >= 20 required.

## Tech Stack

- Next.js 16 with App Router, React 19, TypeScript (strict mode + `noUncheckedIndexedAccess`)
- Tailwind CSS v4 via `@tailwindcss/postcss`
- Supabase (PostgreSQL + Auth + RLS) — `@supabase/supabase-js` + `@supabase/ssr`
- Recharts v3 for data visualizations on marketing/analysis pages
- Fonts: Manrope (sans), Fraunces (serif), JetBrains Mono (mono), Teko (display headings) via `next/font/google`
- Path alias: `@/*` maps to `./src/*`

### TypeScript Strictness

`noUncheckedIndexedAccess` is enabled — array indexing returns `T | undefined`. Use `!` non-null assertion only when the index is provably safe (e.g., parallel `.map()` with same-length array). Otherwise use `?? fallback` or guard with `if (!item) return`.

Scripts in `scripts/` are excluded from tsconfig and don't need to follow these rules.

## Architecture

UPSC Prelims practice platform combining a marketing site and an authenticated exam application. Production domain: `upscprelimstest.com`. Deployed on Vercel.

### Database (Supabase)

Schema defined in `supabase/migrations/` (001: initial schema, 002: PYQ metadata enrichment).

**`questions`** — Unified question bank. Source enum: `pyq | flt | subject | custom`. PYQ-specific fields (`year`, `source_label`) nullable. Options are JSONB array of `{id: "A"|"B"|"C"|"D", text}`. AI enrichment fields: `topic`, `sub_topic`, `keywords[]`, `concepts[]`, `question_type`, `importance`, `difficulty_rationale`, `ncert_class`, `mnemonic_hint`. GIN indexes on `keywords` and `concepts`.

**`topics` + `question_topics`** — Normalized many-to-many. `topics.name_lower` generated column for case-insensitive lookups.

**`test_templates` + `test_template_questions`** — Predefined FLTs only. PYQ/subject/topic drills generated dynamically.

**`attempts`** — Test session results. `grading` enum (`graded`/`partial`/`ungraded`), nullable score fields. Currently NOT wired — data goes to localStorage only.

**`attempt_answers`** — Per-question detail. Subject metrics computed from this table, not stored.

**`notebook_entries`** — User's saved takeaways. One per user per question. Currently NOT wired — localStorage only.

**`profiles`** — Auto-created via trigger on `auth.users` insert.

**Database functions:**
- `save_attempt(p_attempt jsonb, p_answers jsonb)` — Inserts attempt + all answers in one RPC call
- `get_attempt_subject_metrics(p_attempt_id uuid)` — Computed subject-level accuracy/score/pacing

### Data Flow (Hybrid: localStorage + Supabase)

**Reads from Supabase (working):** Questions, year/subject/topic counts, search, import. All PYQ data served from DB via `src/lib/supabase/questions.ts` using the admin client.

**Writes to localStorage only (migration pending):** Attempts (`saveAttempt()`) and notebook entries (`saveNotebookEntry()`) in `src/lib/storage.ts`. The DB schema and RPC functions exist but aren't wired. `buildAttemptRecord()` in `src/lib/exam.ts` constructs the attempt client-side, then saves to localStorage.

**Legacy (deprecated):** `data/pyq-bank.json` + `src/lib/pyq-bank.ts` — replaced by Supabase `questions` table. Still in codebase but unused.

### Auth

- Supabase Auth with Google OAuth + email/password
- **Root middleware** (`src/middleware.ts`): www→apex redirect (308), delegates to Supabase middleware
- **Auth middleware** (`src/lib/supabase/middleware.ts`): Session refresh via `auth.getUser()`, protects `/app` routes (redirect to `/login?next=...`), exempts guest-accessible routes (`/app/pyq/run`, `/app/pyq/sectional`, `/app/exams/*`, `/app/attempts/*`)
- **Supabase clients** in `src/lib/supabase/`: `client.ts` (browser), `server.ts` (server components), `admin.ts` (service-role, bypasses RLS), `middleware.ts` (session logic)
- Auth callback at `/auth/callback` exchanges OAuth code for session
- Login page at `/login` with email/password form + Google button

### Routing

**Marketing pages** (public, server components):
- `/`, `/platform`, `/pricing`, `/flt`, `/subject-wise`, `/analytics`, `/pyq`
- `/pyq/analyse` — Year-wise PYQ analysis dashboard (Recharts, mock data)
- `/pyq/subject-analyse` — Subject-wise topic breakdown (Recharts, mock data + live API)
- `/pyq/sectional` — Sectional PYQ analysis

**Auth routes:**
- `/login`, `/auth/callback`

**App pages** (authenticated, under `/app`):
- `/app` — Dashboard (latest attempt, streak, strongest subject)
- `/app/exams/[slug]` — Timed exam from static data (`src/data/tests.ts`)
- `/app/attempts/[attemptId]` — Post-exam results with charts and review
- `/app/notebook` — Saved takeaways with subject filter
- `/app/pyq` — PYQ library: year/subject/topic drill launcher
- `/app/pyq/import` — Image upload form for PYQ extraction via Gemini
- `/app/pyq/run?year=&subject=&limit=` — Timed PYQ session (`force-dynamic`)
- `/app/pyq/sectional` — Sectional/topic-wise drills

**API routes** (`src/app/api/`):
- `pyq/import` (POST) — Image→question extraction via Gemini, upserts to Supabase
- `pyq/database` (GET) — Fetch PYQ database with optional pagination (`?page=&limit=`)
- `subject-blueprint` (GET) — Topic→year question count matrix for a subject
- `topic-questions` (GET) — Questions for a specific topic (3-tier lookup: enriched→keywords→text search)
- `subject-insights` (POST) — AI-generated subject analysis via Gemini

### Shell & Header Switching

`Shell` (`src/components/site/shell.tsx`) is a client component that reads pathname:
- No shell for `/login`
- `SiteHeader` for marketing pages
- `AppHeader` for `/app/*` routes
- `MinimalHeader` for exam routes (`/app/exams/*`, `/app/pyq/run`)
- Footer hidden during exams and login

### Exam Runner Flow

1. `/app/pyq/run` server component fetches questions from Supabase, constructs `ExamTest` object
2. `ExamRunner` (client component) manages all exam state: answers, timer, navigation, review marks
3. Timer runs via `setInterval` (250ms tick), auto-submits on expiry
4. `buildAttemptRecord()` computes scores, subject metrics, grading status, readiness band
5. `saveAttempt()` writes to localStorage
6. Redirects to `/app/attempts/[attemptId]` for results + review

### Key Types (`src/lib/types.ts`)

- `Subject` — Union: `"Polity" | "History" | "Economy" | "Geography" | "Environment" | "Science" | "Current Affairs" | "CSAT"`
- `ExamQuestion` / `ExamTest` — Question and test shape
- `PyqQuestion` — Extends `ExamQuestion` with `year`, `topics[]`, `sourceLabel`
- `AttemptRecord` — Full result with nullable score fields for ungraded tests
- `AttemptGrading` — `"graded" | "partial" | "ungraded"`
- `ReadinessBand` — `"Foundation Build" | "On Track" | "Cutoff Ready" | "Interview Zone"`
- `NotebookEntry` — Saved takeaway linked to a question

### Shared Utilities

- `src/lib/subject-map.ts` — Canonical `SUBJECT_MAP` mapping UI names to DB subject values
- `src/lib/env.ts` — Runtime env var validation with lazy getters (not yet wired into Supabase clients)
- `src/lib/supabase/fetch-all-pages.ts` — Generic pagination helper (500 rows/page, max 200 pages)

### Environment Variables

Copy `.env.example` to `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side admin operations
- `GEMINI_API_KEY` — PYQ image import + subject insights
- `GEMINI_MODEL` — Defaults to `gemini-3-flash-preview`
- `GOOGLE_VISION_API_KEY` — For `vision_ocr` import mode

### Error Handling & Loading

- Custom 404 page (`src/app/not-found.tsx`)
- Error boundaries: `/app/error.tsx`, `/app/exams/[slug]/error.tsx`, `/app/attempts/[attemptId]/error.tsx`
- Loading skeletons: `/app/loading.tsx`, `/app/exams/[slug]/loading.tsx`, `/app/attempts/[attemptId]/loading.tsx`, `/app/pyq/loading.tsx`, `/app/pyq/run/loading.tsx`
- API routes return `{ success: false, error: string }` on failure with appropriate HTTP status

### SEO

- `robots.ts` disallows `/app` routes from crawlers
- `sitemap.ts` lists marketing pages
- Per-page `metadata` exports on marketing pages
- Root middleware redirects `www.` to apex domain (308)

### Charts

Custom SVG charts (no library) in `src/components/charts/`: `RadarChart` (subject accuracy polygon), `PacingChart` (time-per-question scatter). Marketing analysis pages use Recharts.

## Design System

- Dark theme with warm earthy palette via CSS custom properties in `globals.css`
- Key colors: `--background: #0e0e0e`, `--accent: #A3E635` (lime), `--danger: #ef4444`, `--success: #10b981`
- Utility classes: `.card`, `.card-elevated`, `.panel`, `.heading`, `.label`, `.badge`, `.badge-accent`, `.fade-up`, `.bg-blueprint-grid`
- `.heading` uses Teko font, uppercase, 700 weight, letter-spacing
- Large border-radius (`rounded-[2rem]`, `rounded-[2.6rem]`) for premium feel
- Subject colors mapped in `subjectColorMap` in `src/lib/exam.ts`
- Tailwind v4 theme bridge in `globals.css` (`@theme inline` block maps CSS vars to Tailwind tokens)

## UI/UX Rules & Guidelines (Startup Founders Roadmap)

**The 80/20 of Product UI/UX**
Most startup UI/UX problems come from violating a small set of principles:
1. **Visual Hierarchy:** Users must instantly know what's most important on any screen.
2. **Consistent Spacing:** Creates professional polish and scannability. Use a 4px or 8px base unit.
3. **Limited Color Palette:** Builds trust, reduces cognitive load. 1 primary, 1 secondary, and neutrals.
4. **Clear CTAs:** Users must always know the next action to take. One primary CTA per screen.
5. **Predictable Navigation:** Users should never feel lost. Use familiar patterns.
6. **Whitespace:** Lets content breathe; signals premium quality.
7. **Typography Scale:** Creates rhythm and readability. 5-6 sizes maximum.
8. **Feedback & States:** Confirmation for actions (loading, success/error).
9. **Progressive Disclosure:** Show only what's needed now, reveal more on demand.
10. **Mobile-First Thinking:** Design mobile-first, then expand.

**Design System Requirements:**
- **Layout & Structure:** Single clear purpose per page, 8px grid, plenty of whitespace.
- **Typography:** Max 2 typefaces, clear scale (e.g. 14, 16, 20, 24, 32), 14-18px body, 1.5-1.7 line height.
- **Color:** Functional usage (green=success, red=error), WCAG contrast 4.5:1 minimum, light/dark mode support.
- **Interaction & Feedback:** Hover/active/disabled/loading states for all buttons. Inline form validation.
- **Navigation:** Core tasks reachable within 3 clicks. Always know where you are.
- **Polish:** Consistent iconography (Lucide/Phosphor/Heroicons), helpful microcopy.

**Essential UX Laws:**
- **Hick's Law:** Limit options per screen.
- **Fitts's Law:** Make primary buttons large and accessible.
- **Jakob's Law:** Use familiar patterns (e.g., standard tabs, standard search).
- **Miller's Law:** Chunk information into groups of 5-7.
- **Law of Proximity / Similarity:** Group related controls.
- **Von Restorff Effect:** Primary CTA must stand out visually.
- **Doherty Threshold:** Optimistic UI, skeletons, response <400ms.

**Common Anti-Patterns to Avoid:**
- Feature soup on home screen.
- Random gaps between elements.
- Too many font sizes.
- Walls of text instead of scannable content.
- Equal-weight buttons everywhere.
- No loading states (frozen UI).
- Unpredictable/clever naming over clear labels.
- Ignoring mobile constraints.
- Form overload upfront.
- Missing feedback on actions.
- Poor color contrast (light gray on white).
