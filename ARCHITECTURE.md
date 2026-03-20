# ARCHITECTURE.md

Current architecture of upscprelimstest.com — a UPSC Prelims practice platform.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, App Router, React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4 via @tailwindcss/postcss |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Database | PostgreSQL via Supabase (RLS enabled) |
| Hosting | Vercel |
| Fonts | Manrope (sans), Fraunces (serif), JetBrains Mono (mono) |
| Charts | Hand-rolled SVG (no chart library) |

---

## Routes

### Marketing (public, server components)

| Route | Purpose |
|-------|---------|
| `/` | Landing page with features and CTA |
| `/platform` | Three-mode architecture overview |
| `/pricing` | Free / Pro / Institute tiers |
| `/pyq` | PYQ practice landing |
| `/flt` | FLT series landing |
| `/subject-wise` | Subject practice landing |
| `/analytics` | Analytics landing |

### Auth

| Route | Purpose |
|-------|---------|
| `/login` | Email/password + Google OAuth form |
| `/auth/callback` | OAuth code → session exchange |

### App (protected, requires auth)

| Route | Purpose | Data source |
|-------|---------|-------------|
| `/app` | Dashboard with stats, charts, test library | localStorage + static tests |
| `/app/exams/[slug]` | Timed exam runner | `src/data/tests.ts` (static) |
| `/app/pyq` | PYQ library — year/subject/custom sessions | Supabase `questions` table |
| `/app/pyq/run?year=&subject=&limit=` | Dynamic PYQ drill | Supabase `questions` table |
| `/app/pyq/import` | Image upload → question extraction | Gemini Vision API |
| `/app/attempts/[attemptId]` | Post-exam results with charts and review | localStorage |
| `/app/notebook` | Saved takeaways with subject filter | localStorage |

### API

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/pyq/import` | POST | Multipart image upload → Gemini extraction |

---

## Database Schema (Supabase)

### Core Tables

**questions** — Unified question bank
- `source`: pyq / flt / subject / custom
- `subject`: one of 8 UPSC subjects
- `prompt`, `context_lines`, `options` (JSONB array of {id, text})
- `correct_option_id`: A/B/C/D (nullable — ungraded if null)
- `year`, `source_label`: PYQ-specific, nullable
- `marks`, `negative_marks`

**topics** + **question_topics** — Normalized many-to-many tagging

**test_templates** + **test_template_questions** — Predefined FLTs only (PYQ drills are dynamic)

**attempts** — Test session results
- Linked to user via `user_id`
- `grading`: graded / partial / ungraded
- Score, accuracy, percentile, readiness band

**attempt_answers** — Per-question detail (selected option, time spent, marked, eliminated)

**notebook_entries** — User's saved takeaways, one per question per user

**profiles** — Auto-created on signup via trigger

### RLS Rules
- Questions/topics/templates: read-only for authenticated users
- Attempts, answers, notebook: user-scoped via `auth.uid()`

### Database Functions
- `save_attempt(p_attempt, p_answers)` — Atomic insert of attempt + answers
- `get_attempt_subject_metrics(p_attempt_id)` — Computed subject stats

---

## Key Components

### Shell (`src/components/site/shell.tsx`)
Client component that switches header/footer based on pathname:
- `/login` → bare layout
- `/app/exams/*`, `/app/pyq/run` → MinimalHeader (no footer)
- `/app/*` → AppHeader + Footer
- Marketing → SiteHeader + Footer

### ExamRunner (`src/components/exam/exam-runner.tsx`)
Core exam interface. Features:
- Countdown timer with auto-submit
- Question palette (answered / marked / visited states)
- Option selection with elimination (strikethrough)
- Line-level highlighting for the question prompt
- Mark for review toggle
- On submit: `buildAttemptRecord()` → localStorage → redirect to results

### ResultClient (`src/components/exam/result-client.tsx`)
Post-exam review. Shows:
- Score box, stats row (correct/incorrect/skipped/duration)
- Radar chart (subject accuracy), Pacing chart (time per question)
- Subject breakdown with progress bars
- Question-by-question accordion with explanation + notebook save

### DashboardOverview (`src/components/dashboard/dashboard-overview.tsx`)
Three states: empty (no attempts), ungraded (attempts but no answer keys), scored (full analytics).

---

## Data Flow

### Questions
```
CSV files → import-pyq-csv.ts → Supabase `questions` table
                                      ↓
                              supabase/questions.ts (fetchQuestions)
                                      ↓
                              /app/pyq/run (server component builds ExamTest)
                                      ↓
                              ExamRunner (client component)
```

Static FLT tests live in `src/data/tests.ts` and bypass Supabase entirely.

### Attempts (current — localStorage)
```
ExamRunner → buildAttemptRecord() → saveAttempt() [localStorage]
                                          ↓
                                    ResultClient reads from localStorage
                                    DashboardOverview reads from localStorage
```

### Attempts (target — Supabase, not yet wired)
```
ExamRunner → buildAttemptRecord() → save_attempt RPC [Supabase]
                                          ↓
                                    Server queries from attempts + attempt_answers tables
```

### Notebook (current — localStorage)
```
ResultClient → saveNotebookEntry() [localStorage]
                      ↓
              NotebookClient reads from localStorage
```

---

## Auth Flow

1. User visits `/login` → email/password form or Google OAuth button
2. **Email signup**: confirmation email links to `/auth/callback?next=/app`
3. **Google OAuth**: redirects to Google → back to `/auth/callback?code=...`
4. `/auth/callback` exchanges code for session cookie
5. `middleware.ts` runs on every request:
   - Refreshes Supabase session
   - Redirects unauthenticated `/app` requests to `/login`
   - Redirects `www.` to apex domain

---

## What's Working

- Full marketing site (7 pages)
- Auth: signup, login, Google OAuth, session management
- 100 real UPSC 2025 PYQs with answer keys in Supabase
- PYQ library: year-wise, subject-wise, custom session builder
- Timed exam runner with palette, elimination, marking, highlighting
- Post-exam results with radar + pacing charts
- Notebook with subject filter
- Dashboard with streak, stats, weak area heatmap
- CSV import pipeline (scripts/import-pyq-csv.ts)
- Image extraction via Gemini Vision (scripts/extract-pyq-images.ts)

## What's Incomplete / Placeholder

- **Attempts stored in localStorage** — not yet wired to Supabase `save_attempt` RPC
- **Notebook stored in localStorage** — not yet wired to Supabase `notebook_entries`
- **Only 2025 PYQs loaded** — years 2012-2024 not yet imported
- **No explanations** — questions have answer keys but no rationale text
- **Static FLTs only** — one demo GS Mini Mock; no real FLTs in Supabase
- **No mobile optimization** — exam runner designed for desktop
- **PYQ image importer UI** — exists but workflow is CLI-based in practice
- **Pro/Institute pricing** — placeholder, no payment integration
- **Benchmarking** — no cross-user percentile data
- **Daily digest quizzes** — not built

---

## Environment Variables

```
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Required for server admin operations
SUPABASE_SERVICE_ROLE_KEY=

# Optional — PYQ image import
GEMINI_API_KEY=
GEMINI_MODEL=                   # defaults to gemini-3-flash-preview
GOOGLE_VISION_API_KEY=
```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/import-pyq-csv.ts` | Bulk import questions from CSV → Supabase |
| `scripts/extract-pyq-images.ts` | Gemini Vision: scanned paper images → CSV |
| `scripts/update-answer-keys.ts` | Update correct_option_id for existing questions |

Usage: `npx tsx scripts/<script>.ts [args]`

---

## File Tree

```
src/
├── app/
│   ├── layout.tsx                    # Root layout, fonts
│   ├── page.tsx                      # Home
│   ├── globals.css                   # Design tokens
│   ├── login/                        # Auth pages
│   ├── auth/callback/route.ts        # OAuth callback
│   ├── platform/page.tsx             # Marketing
│   ├── pricing/page.tsx
│   ├── pyq/page.tsx
│   ├── flt/page.tsx
│   ├── subject-wise/page.tsx
│   ├── analytics/page.tsx
│   ├── app/                          # Protected app
│   │   ├── page.tsx                  # Dashboard
│   │   ├── exams/[slug]/page.tsx     # Exam runner
│   │   ├── attempts/[attemptId]/     # Results
│   │   ├── notebook/page.tsx
│   │   └── pyq/                      # PYQ workspace
│   │       ├── page.tsx              # Library
│   │       ├── run/page.tsx          # Drill session
│   │       └── import/page.tsx
│   ├── api/pyq/import/route.ts
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── site/                         # Shell, headers, footer
│   ├── exam/                         # ExamRunner, ResultClient, NotebookClient
│   ├── dashboard/                    # DashboardOverview
│   ├── charts/                       # RadarChart, PacingChart
│   └── pyq/                          # PyqImportClient
├── lib/
│   ├── types.ts                      # All TypeScript types
│   ├── exam.ts                       # Metrics, formatting
│   ├── storage.ts                    # localStorage API
│   ├── pyq-bank.ts                   # File-based PYQ storage (legacy)
│   └── supabase/
│       ├── client.ts                 # Browser client
│       ├── server.ts                 # Server component client
│       ├── middleware.ts             # Auth guard
│       ├── admin.ts                  # Service role client
│       └── questions.ts             # Question queries
└── data/
    └── tests.ts                      # Static FLT tests

middleware.ts                         # www redirect + auth
supabase/migrations/                  # SQL schema
scripts/                              # CLI import tools
```
