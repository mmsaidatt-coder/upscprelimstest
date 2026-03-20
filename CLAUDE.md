# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (Next.js on localhost:3000)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (ESLint with next/core-web-vitals + next/typescript)
- **Start production:** `npm run start`

No test framework is configured.

## Tech Stack

- Next.js 16 with App Router, React 19, TypeScript (strict mode)
- Tailwind CSS v4 via `@tailwindcss/postcss`
- Supabase (PostgreSQL + Auth + RLS) — `@supabase/supabase-js` + `@supabase/ssr`
- Fonts: Manrope (sans), Fraunces (serif/display), JetBrains Mono (mono) via `next/font/google`
- Path alias: `@/*` maps to `./src/*`

## Architecture

A UPSC Prelims practice platform combining a marketing site and an authenticated exam application. Production domain: `upscprelimstest.com`. Deployed on Vercel.

### Database (Supabase)

Schema defined in `supabase/migrations/001_initial_schema.sql`. Key tables:

- `questions` — Unified question bank (PYQ, FLT, subject, custom). PYQ-specific fields (`year`, `source_label`) are nullable. Options stored as JSONB array.
- `topics` + `question_topics` — Normalized many-to-many for topic tagging. `topics.name_lower` is a generated column for case-insensitive lookups.
- `test_templates` + `test_template_questions` — Predefined FLTs only. PYQ/subject/topic drills are generated dynamically (no template row).
- `attempts` — Test session results. Has `grading` enum (`graded`/`partial`/`ungraded`), nullable score fields.
- `attempt_answers` — Per-question detail within an attempt. Subject metrics are computed from this table, not stored.
- `notebook_entries` — User's saved takeaways, one per question per user.
- `profiles` — Auto-created via trigger on `auth.users` insert.

RLS: Questions/topics/templates are read-only for authenticated users. Attempts, answers, and notebook are user-scoped via `auth.uid()`.

Database functions:
- `save_attempt(p_attempt jsonb, p_answers jsonb)` — Inserts attempt + all answers in one RPC call.
- `get_attempt_subject_metrics(p_attempt_id uuid)` — Returns computed subject-level accuracy/score/pacing.

### Auth

- Supabase Auth with Google OAuth + email/password
- `middleware.ts` (project root) handles: www redirect, session refresh, and `/app` route protection (redirects to `/login`)
- Supabase client setup in `src/lib/supabase/`: `client.ts` (browser), `server.ts` (server components/actions), `middleware.ts` (session logic)
- Auth callback: `/auth/callback` exchanges OAuth code for session
- Login page: `/login` with email/password form + Google button

### Routing

**Marketing pages** (public, server components):
- `/`, `/platform`, `/pricing`, `/flt`, `/subject-wise`, `/analytics`, `/pyq`

**Auth:**
- `/login` — Login/signup page (no header/footer)
- `/auth/callback` — OAuth callback route

**App pages** (authenticated, under `/app`):
- `/app` — Dashboard
- `/app/exams/[slug]` — Timed exam from static test data
- `/app/attempts/[attemptId]` — Post-exam results with charts and review
- `/app/notebook` — Saved takeaways with subject filter
- `/app/pyq` — PYQ library: year-wise/topic-wise drill launcher
- `/app/pyq/import` — Image upload form for PYQ extraction
- `/app/pyq/run?year=&topic=&limit=` — Timed PYQ session

### Shell & Header Switching

`Shell` (`src/components/site/shell.tsx`) reads the pathname and renders:
- Nothing (bare layout) for `/login`
- `SiteHeader` for marketing pages
- `AppHeader` for `/app/*` routes
- `MinimalHeader` for exam routes (`/app/exams/*`, `/app/pyq/run`)
- Footer hidden during exams and login

### Data Flow (Migration In Progress)

**Current (localStorage):** `src/lib/storage.ts` — attempts and notebook saved locally. Being replaced by Supabase.

**Target (Supabase):** All user data (attempts, answers, notebook) stored in Supabase with RLS. Questions served from the `questions` table. `buildAttemptRecord()` in `src/lib/exam.ts` computes the attempt data client-side before saving via `save_attempt` RPC.

**Legacy (filesystem):** `data/pyq-bank.json` + `src/lib/pyq-bank.ts` — being replaced by Supabase `questions` table.

### Key Types (`src/lib/types.ts`)

- `ExamQuestion` / `ExamTest` — question and test shape (used by both systems)
- `PyqQuestion` — extends `ExamQuestion` with `year`, `topics[]`, `sourceLabel`
- `AttemptRecord` — result with nullable score fields for ungraded tests
- `NotebookEntry` — saved takeaway linked to a question
- `Subject` — union of 8 subjects: Polity, History, Economy, Geography, Environment, Science, Current Affairs, CSAT

### Environment Variables

Copy `.env.example` to `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — For server-side admin operations
- `GEMINI_API_KEY` — For PYQ image import
- `GEMINI_MODEL` — Defaults to `gemini-3-flash-preview`
- `GOOGLE_VISION_API_KEY` — For `vision_ocr` import mode

### SEO

- `robots.ts` disallows `/app` routes from crawlers
- `sitemap.ts` lists marketing pages
- `middleware.ts` redirects `www.` to apex domain (308)

### Charts

SVG-only, no chart library. `RadarChart` (subject accuracy polygon) and `PacingChart` (time-per-question scatter) in `src/components/charts/`.

## Design System

- Warm earthy palette defined as CSS custom properties in `globals.css` (not Tailwind theme tokens)
- Utility classes: `.mesh-card`, `.grain`, `.glass-panel`, `.accent-ring`, `.display-title`, `.eyebrow`
- Large border-radius values (`rounded-[2rem]`, `rounded-[2.6rem]`) throughout
- Subject colors mapped in `subjectColorMap` in `src/lib/exam.ts`

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
- **Miller's Law:** Chunk information into groups of 5–7.
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
