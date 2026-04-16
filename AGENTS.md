# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, Cursor, Windsurf, etc.) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (Next.js on localhost:3000)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (ESLint with next/core-web-vitals + next/typescript)
- **Import PYQs:** `npm run import-pyq` (runs `tsx scripts/import-pyq-csv.ts`)
- **Generate current affairs:** `npm run generate-current-affairs` (runs `tsx scripts/generate-current-affairs-bank.ts`)
- **Run any script:** `npx tsx scripts/<name>.ts` (scripts are excluded from tsconfig)
- **Deploy:** `vercel deploy --prod`

No test framework is configured. Node.js >= 20 required.

## Tech Stack

- Next.js 16 with App Router, React 19, TypeScript (strict mode + `noUncheckedIndexedAccess`)
- Tailwind CSS v4 via `@tailwindcss/postcss`
- Supabase (PostgreSQL + Auth + RLS) — `@supabase/supabase-js` + `@supabase/ssr`
- Recharts v3 for data visualizations on marketing/analysis pages
- `@modelcontextprotocol/sdk` — MCP server for AI agent interoperability
- `zod` v4 — Schema validation (used by MCP tools)
- Fonts: Manrope (sans), Fraunces (serif), JetBrains Mono (mono), Teko (display headings) via `next/font/google`
- Path alias: `@/*` maps to `./src/*`

### TypeScript Strictness

`noUncheckedIndexedAccess` is enabled — array indexing returns `T | undefined`. Use `!` non-null assertion only when the index is provably safe (e.g., parallel `.map()` with same-length array). Otherwise use `?? fallback` or guard with `if (!item) return`.

Scripts in `scripts/` are excluded from tsconfig and don't need to follow these rules.

## Architecture

UPSC Prelims practice platform combining a marketing site and an authenticated exam application. Production domain: `upscprelimstest.com`. Deployed on Vercel.

The platform has two audiences: **human students** (via the web UI) and **AI agents** (via APIs, MCP server, and discovery files). The agent layer is fully decoupled — changes to UI/styling never require agent updates. Agent files only need updating when data schemas, API contracts, or platform capabilities change.

### Database (Supabase)

Schema defined in `supabase/migrations/` (001: initial schema, 002: PYQ metadata enrichment, 003: custom exam sampling RPC).

**`questions`** — Unified question bank (1,200+ PYQs plus the larger custom/FLT/current-affairs practice bank). Source enum: `pyq | flt | subject | custom`. PYQ-specific fields (`year`, `source_label`) nullable. Options are JSONB array of `{id: "A"|"B"|"C"|"D", text}`. AI enrichment fields: `topic`, `sub_topic`, `keywords[]`, `concepts[]`, `question_type`, `importance`, `difficulty_rationale`, `ncert_class`, `mnemonic_hint`. GIN indexes on `keywords` and `concepts`.

**`topics` + `question_topics`** — Normalized many-to-many. `topics.name_lower` generated column for case-insensitive lookups.

**`test_templates` + `test_template_questions`** — Predefined FLTs only. PYQ/subject/topic drills generated dynamically.

**`attempts`** — Test session results. `grading` enum (`graded`/`partial`/`ungraded`), nullable score fields. Cloud sync wired via `/api/attempts` (POST to save, GET to fetch).

**`attempt_answers`** — Per-question detail. Subject metrics computed from this table, not stored.

**`notebook_entries`** — User's saved takeaways. One per user per question. Currently localStorage only (migration pending).

**`profiles`** — Auto-created via trigger on `auth.users` insert.

**Database functions:**
- `save_attempt(p_attempt jsonb, p_answers jsonb)` — Inserts attempt + all answers in one RPC call
- `get_attempt_subject_metrics(p_attempt_id uuid)` — Computed subject-level accuracy/score/pacing
- `get_custom_exam_question_ids(p_mode text, p_size integer, p_subject subject_enum)` — Samples custom exam UUIDs inside Postgres for dynamic mixed, subject-wise, and UPSC-ratio tests

### Data Flow (Hybrid: localStorage + Supabase)

**Reads from Supabase (working):** Questions, year/subject/topic counts, search, import. All PYQ data served from DB via `src/lib/supabase/questions.ts` using the admin client.

**Writes — dual path:** Attempts save to localStorage first, then sync to Supabase via `/api/attempts` POST for authenticated users. `buildAttemptRecord()` in `src/lib/exam.ts` constructs the attempt client-side. Notebook entries still localStorage-only (migration pending).

**Legacy (deprecated):** `data/pyq-bank.json` + `src/lib/pyq-bank.ts` — replaced by Supabase `questions` table. Still in codebase but unused.

### Auth

- Supabase Auth with Google OAuth + email/password
- **Root middleware** (`middleware.ts`): www→apex redirect (308), delegates to Supabase middleware
- **Auth middleware** (`src/lib/supabase/middleware.ts`): Session refresh via `auth.getUser()`, redirects logged-in users away from `/login`, and protects account/admin app routes such as `/app/settings` and `/app/pyq/import`. Practice and result routes stay guest-accessible and sync to cloud only when the user is authenticated.
- **Supabase clients** in `src/lib/supabase/`: `client.ts` (browser), `server.ts` (server components), `admin.ts` (service-role, bypasses RLS), `middleware.ts` (session logic)
- Auth callback at `/auth/callback` exchanges OAuth code for session
- Login page at `/login` with email/password form + Google button

### Routing

**Marketing pages** (public, server components):
- `/`, `/platform`, `/flt`, `/subject-wise`, `/analytics`, `/pyq`
- `/pyq/analyse` — Year-wise PYQ analysis dashboard (Recharts, mock data)
- `/pyq/subject-analyse` — Subject-wise topic breakdown (Recharts, mock data + live API)
- `/pyq/sectional` — Sectional PYQ analysis

**Auth routes:**
- `/login`, `/auth/callback`

**App pages** (guest-friendly practice under `/app`; account/import routes require auth):
- `/app` — Dashboard (latest attempt, streak, strongest subject)
- `/app/exams/[slug]` — Timed exam from static data (`src/data/tests.ts`)
- `/app/attempts/[attemptId]` — Post-exam results with charts and review
- `/app/notebook` — Saved takeaways with subject filter
- `/app/pyq` — PYQ library with tabbed UI (Year Wise, Subject Wise, Custom Session, Search Bank)
- `/app/pyq/import` — Image upload form for PYQ extraction via Gemini
- `/app/pyq/run?year=&subject=&limit=` — Timed PYQ session (`force-dynamic`)
- `/app/pyq/sectional` — Sectional/topic-wise drills
- `/app/settings` — User profile and account settings

**API routes** (`src/app/api/`):
- `account` (GET) — Fetch current authenticated user's display name and email
- `attempts` (GET/POST) — Fetch user's attempt history / save a new attempt to Supabase
- `pyq/import` (POST) — Authenticated Image→question extraction via Gemini, upserts to Supabase
- `pyq/database` (GET) — Fetch PYQ database with optional pagination (`?page=&limit=`)
- `subject-blueprint` (GET) — Topic→year question count matrix for a subject
- `topic-questions` (GET) — Questions for a specific topic (3-tier lookup: enriched→keywords→text search)
- `subject-insights` (POST) — AI-generated subject analysis via Gemini
- `openapi.json` (GET) — OpenAPI 3.1 specification for all public APIs
- `mcp` (GET/POST/DELETE) — Model Context Protocol server endpoint

**Agent discovery routes** (machine-facing, no UI):
- `/llms.txt` — Markdown discovery file for AI agents
- `/.well-known/agent.json` — A2A agent discovery card
- `/api/openapi.json` — OpenAPI 3.1 spec
- `/api/mcp` — MCP server (Streamable HTTP, stateless)

### Shell & Header Switching

`Shell` (`src/components/site/shell.tsx`) is a client component that reads pathname:
- No shell for `/login`
- `AppSidebar` + `AppTopBar` for `/` and `/app/*` routes (desktop sidebar + mobile hamburger drawer)
- `MinimalHeader` for exam routes (`/app/exams/*`, `/app/pyq/run`) — compact header with logo mark + "Exam mode" badge
- `SiteHeader` for other marketing pages
- Footer hidden during exams and login

### Exam Runner Flow

1. `/app/pyq/run` server component fetches questions from Supabase, constructs `ExamTest` object
2. `ExamRunner` (client component) manages all exam state: answers, timer, navigation, review marks
3. Timer runs via `setInterval` (250ms tick), auto-submits on expiry
4. `buildAttemptRecord()` computes scores, subject metrics, grading status, readiness band
5. `saveAttempt()` writes to localStorage (and syncs to Supabase for authenticated users)
6. Redirects to `/app/attempts/[attemptId]` for results + review

**Mobile exam UX (dedicated design):**
- Sticky progress bar + info row below MinimalHeader (`top-14`)
- Radio-circle option selection pattern (familiar from native mobile)
- 2-row bottom bar: Row 1 = secondary actions (Mark, Clear, Palette), Row 2 = primary navigation (Prev/Next/Submit)
- Bottom sheet palette with drag handle, summary stats, and submit button
- `active:scale-[0.97]` for tactile button feedback
- Safe area bottom padding for notch devices

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

### SEO & AI Discoverability

- `robots.ts` — Disallows `/app` from crawlers; explicitly whitelists 10 AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) and points them to `/llms.txt`, `/.well-known/agent.json`, `/api/openapi.json`, and public API endpoints
- `sitemap.ts` — Lists marketing pages + all indexed PYQ question pages
- Per-page `metadata` exports on marketing pages
- Root middleware redirects `www.` to apex domain (308)
- Schema.org structured data in `src/components/seo/json-ld.tsx`: `WebSite`, `Organization`, `EducationalOrganization`, `FAQPage`, `Course`, `Quiz`, `LearningResource`

### Charts

Custom SVG charts (no library) in `src/components/charts/`: `RadarChart` (subject accuracy polygon), `PacingChart` (time-per-question scatter). Marketing analysis pages use Recharts.

## Agent Infrastructure

The platform exposes a complete agent-facing layer alongside the human UI. These endpoints are machine-only and do not affect the human interface.

### Discovery Files

| Endpoint | File | Purpose |
|---|---|---|
| `/llms.txt` | `src/app/llms.txt/route.ts` | Markdown discovery file — describes platform, all APIs, question schema, MCP server config, practice modes |
| `/.well-known/agent.json` | `src/app/.well-known/agent.json/route.ts` | A2A agent card — skills, auth requirements, MCP protocol endpoint, example prompts |
| `/api/openapi.json` | `src/app/api/openapi.json/route.ts` | OpenAPI 3.1 spec — machine-readable docs for all 4 public API endpoints with full `PyqQuestion` schema |

### MCP Server

**File:** `src/app/api/mcp/route.ts`
**Transport:** Streamable HTTP (stateless, `WebStandardStreamableHTTPServerTransport`)
**SDK:** `@modelcontextprotocol/sdk` with Zod v4 schemas

**Tools** (4):
1. **`search_questions`** — Search/filter PYQ bank by subject, year, keyword. Returns full metadata.
2. **`get_subject_blueprint`** — Topic-by-year frequency matrix for any subject.
3. **`get_year_analysis`** — Subject + topic breakdown for a specific exam year.
4. **`get_platform_info`** — Platform overview, capabilities, practice session links.

**Resources** (3 — browsable data, no tool call needed):
1. `upsc://syllabus` — Full syllabus taxonomy (markdown)
2. `upsc://years` — Year-by-year question counts (JSON, live from DB)
3. `upsc://subjects` — Subject-wise question distribution (JSON, live from DB)

**Prompts** (4 — pre-built templates agents can offer to users):
1. `study-plan` — 4-week study plan based on PYQ frequency. Params: subject.
2. `year-comparison` — Compare two years' paper patterns. Params: year1, year2.
3. `topic-deep-dive` — Deep analysis of a specific topic. Params: subject, topic.
4. `mock-test-strategy` — Pre-test strategy briefing. Params: year.

**Smithery.ai config:** `smithery.yaml` (project root) — registry listing for MCP server discovery.

**Claude Desktop config:**
```json
{
  "mcpServers": {
    "upsc-prelims-test": {
      "url": "https://upscprelimstest.com/api/mcp"
    }
  }
}
```

### When to Update Agent Files

Only update agent files when the **data layer or API contracts** change:
- Add/rename an API endpoint → update `openapi.json`, `llms.txt`, MCP route
- Change API response shape → update `openapi.json`, MCP tool if affected
- Add new subject or rename subjects → update `llms.txt`, MCP tools, `agent.json`
- Change question schema fields → update `openapi.json`, `llms.txt`
- Add major new capability (e.g., FLT tests) → update `llms.txt`, `agent.json` skills, potentially new MCP tool

UI/UX changes, styling, layout, new marketing pages, auth flow changes — **none** of these require agent updates.

## Recent Architectural Upgrades & Custom Exam Engine (April)

The platform recently underwent a massive ML-driven overhaul natively expanding the test-bank from 1,200 PYQs to over 10,847 fully AI-enriched Database questions!

### 1. Database Expansion
- Over **8,500 Full-Length Test questions** and **1,147 Current Affairs** questions were completely structurally modeled and pushed to the Supabase `questions` database table with the exact `source='custom'` tag.
- Over **5,872 of these questions** passed a rigorous background AI "Hyper-Audit" (located in `scripts/hyper-audit.ts`), guaranteeing pristine mathematical JSON structures, factual grounding, and aligned explanations natively.

### 2. Custom Test Generator Engine
- The file `src/lib/supabase/questions.ts` now exports a highly optimized `fetchCustomExamSession({ mode, size, subject })` API.
- **Why it's optimized:** Instead of fetching the entire 10,000 JSON payloads or all metadata rows into Vercel memory on every request, it calls the Postgres RPC `get_custom_exam_question_ids()` to sample 36-byte UUIDs inside the database, then fetches only the selected payloads in 200-row chunks. A 5-minute cached, paginated app-side metadata sampler remains as a fallback until every environment has migration 003 applied.
- **UPSC Blueprint Ratios (`mode='upsc_flt'`):** Supports automated dynamic simulation exams ensuring real mathematical UPSC composition (History 18%, Geography 15%, Polity 15%, Economy 15%, Environment 15%, Science 7%, Current Affairs 15%).

### 3. Practice UI Modules
- **/app/design-paper:** The main visual dashboard mapping heavily to the custom test API generator using basic NextJS Links routing directly to `/app/design-paper/run`.
- **/app/flt:** Automatically maps to `/app/design-paper/run?mode=upsc_flt&size=100`.
- **/app/subject-wise:** Replaced native dummy components with subject-level dynamic drill links pointing natively to the API (`mode='single_subject'`).

## Design System

- Warm earthy light theme via CSS custom properties in `globals.css`
- Key colors: `--background: #FAF7F2` (warm cream), `--foreground: #1A1A1A`, `--accent: #C4784A` (terracotta), `--border: #E5E0DA`, `--muted: #6B7280`, `--danger: #ef4444`, `--success: #10b981`
- Utility classes: `.card`, `.card-elevated`, `.panel`, `.heading`, `.label`, `.badge`, `.badge-accent`, `.fade-up`, `.bg-blueprint-grid`, `.bg-warm-grid`
- `.heading` uses Teko font, uppercase, 700 weight, letter-spacing
- Large border-radius (`rounded-2xl`, `rounded-3xl`, `rounded-[2rem]`) for premium feel
- Subject colors mapped in `subjectColorMap` in `src/lib/exam.ts`
- Tailwind v4 theme bridge in `globals.css` (`@theme inline` block maps CSS vars to Tailwind tokens)
- Icons: Lucide React (`lucide-react`)

### Mobile-First Responsive Design

All pages are optimized mobile-first. Base styles target mobile (< 640px), then scale up with responsive prefixes:
- `sm:` (640px+) — tablets
- `md:` (768px+) — small laptops
- `lg:` (1024px+) — desktop with sidebar
- `xl:` (1280px+) — wide desktop

Key mobile techniques used throughout:
- `min-h-dvh` (dynamic viewport height) for proper mobile Chrome address bar handling
- `viewportFit: "cover"` + `env(safe-area-inset-bottom)` for notch/home indicator safe areas
- Font-size 16px on inputs to prevent iOS zoom
- Touch target minimum 44px via `@media (pointer: coarse)`
- `-webkit-tap-highlight-color: transparent` for clean mobile taps
- Abbreviated logo "UPSCPT" on mobile, full "UPSC Prelims Test" on desktop
- AppSidebar: desktop sidebar (collapsible) + mobile hamburger drawer with slide-in animation

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
- **Color:** Functional usage (green=success, red=error), WCAG contrast 4.5:1 minimum.
- **Interaction & Feedback:** Hover/active/disabled/loading states for all buttons. Inline form validation.
- **Navigation:** Core tasks reachable within 3 clicks. Always know where you are.
- **Polish:** Consistent iconography (Lucide React), helpful microcopy.

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
