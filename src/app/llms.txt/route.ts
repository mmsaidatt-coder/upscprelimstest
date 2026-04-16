import { NextResponse } from "next/server";

const LLMS_TXT = `# UPSC Prelims Test

> Free UPSC Civil Services Preliminary Examination practice platform with 1,200+ previous year questions (2014–2025), 10,000+ total AI-enriched practice questions, timed exam simulations, subject-wise drills, and performance analytics.

## Platform

- URL: https://upscprelimstest.com
- Type: Educational technology platform for Indian civil services exam preparation
- Coverage: UPSC CSE Prelims GS Paper I (2014–2025)
- Questions: 1,200+ PYQs with AI-enriched metadata plus a 10,000+ question practice bank from custom FLTs and current affairs
- Subjects: Polity, History, Economy, Geography, Environment, Science, Current Affairs
- Features: Timed exam mode, negative marking (⅓), question palette, mark-for-review, analytics
- Auth: Google OAuth and email/password via Supabase
- Stack: Next.js, Supabase (PostgreSQL), Vercel

## Public APIs

All APIs return JSON. Base URL: https://upscprelimstest.com

### GET /api/pyq/database
Fetch the full PYQ question bank or paginate through it.
- No params: returns all 1,200+ questions
- ?page=1&limit=50: paginated response with \`hasMore\` flag
- Response fields per question: id, prompt, options, correct_option_id, year, subject, topic, sub_topic, keywords, question_type, concepts, importance, difficulty_rationale, mnemonic_hint, ncert_class
- No authentication required

### GET /api/subject-blueprint?subject={subject}
Get topic-by-year question count matrix for a subject.
- subject: Polity | History | Economy | Geography | Environment | Science | Current Affairs
- Returns: array of { topic, years: { 2024: count, 2025: count, ... } }
- No authentication required

### GET /api/topic-questions?subject={subject}&topic={topic}&year={year}
Fetch questions for a specific topic within a subject.
- subject (required): canonical subject name
- topic (required): topic name (matched against enriched topic/sub_topic/keywords)
- year (optional): filter to a specific year
- Returns: up to 40 questions with full metadata
- No authentication required

### POST /api/subject-insights
AI-generated strategic analysis for a subject using Gemini.
- Body: { subject, topicData, totalQuestions }
- Returns: { verdict, focusTopics, avoidTopics, studyTip, trendInsight, difficultyRating, predictedNextYear }
- No authentication required

### GET /api/attempts
Fetch authenticated user's test attempt history (last 30).
- Requires authentication (Supabase session cookie)
- Returns: array of attempt records with question reviews and subject metrics

### POST /api/attempts
Save a test attempt for the authenticated user.
- Requires authentication (Supabase session cookie)
- Body: { attempt: AttemptRecord }

## API Documentation

Machine-readable OpenAPI 3.1 specification: https://upscprelimstest.com/api/openapi.json

## Question Schema

Each question in the database follows this structure:
- id: UUID
- prompt: The question stem text
- options: Array of { id: "A"|"B"|"C"|"D", text: string }
- correct_option_id: "A"|"B"|"C"|"D" (may be null for ungraded questions)
- year: 2014–2025
- subject: One of the 7 canonical subjects
- topic: AI-enriched primary topic classification
- sub_topic: More granular classification
- keywords: Array of relevant terms
- concepts: Array of conceptual tags
- question_type: e.g., "factual", "analytical", "match-the-following"
- importance: AI-assessed importance level
- difficulty_rationale: Explanation of difficulty assessment
- mnemonic_hint: Memory aid for the concept
- ncert_class: Relevant NCERT class reference

## Subjects Covered

1. Polity — Constitutional framework, Parliament, Judiciary, Governance, Elections
2. History — Ancient, Medieval, Modern India, Freedom Struggle, World History, Art & Culture
3. Economy — Macro economics, Banking, Fiscal policy, Trade, Agriculture, Capital markets
4. Geography — Physical, Indian, World geography, Climate, Resources, Oceanography
5. Environment — Ecology, Biodiversity, Protected areas, Climate change, Pollution, International conventions
6. Science — Space tech, Biotech, Defence, Nuclear, IT, Health, Chemistry, Physics
7. Current Affairs — International relations, Government schemes, Awards, Social issues

## Practice Modes

- Year-wise: Full 100-question paper from a specific year (2014–2025)
- Subject-wise: Questions filtered by subject across all years
- Topic drill: Targeted practice on specific topics within a subject
- Custom session: User-configured mix of subjects, years, and question count
- Full-length test: 100 questions, 120 minutes, ⅓ negative marking
- Dynamic mock generator: UPSC-ratio, mixed, and single-subject sessions sampled from the larger custom question bank

## Exam Simulation Features

- Countdown timer with auto-submit
- Question palette with color-coded states (visited, answered, marked, current)
- Mark for review functionality
- Option strike-out eliminator
- Line-level text highlighting
- Negative marking calculation (⅓ deduction per wrong answer)
- Post-test review with explanations and notebook capture

## Analytics

- Subject-wise accuracy breakdown
- Topic-level performance heatmap
- Pacing analysis (time per question)
- Readiness band classification: Foundation Build → On Track → Cutoff Ready → Interview Zone
- Session history with score tracking

## MCP Server (Model Context Protocol)

Endpoint: https://upscprelimstest.com/api/mcp
Transport: Streamable HTTP (stateless)
Protocol: MCP 2025-03-26

Connect any MCP-compatible client (Claude Desktop, Cursor, etc.) to this endpoint to interact with the platform programmatically.

### Available Tools

1. **search_questions** — Search and filter the full PYQ bank. Optional params: subject, year, keyword, limit.
2. **get_subject_blueprint** — Topic-by-year question count matrix for any subject.
3. **get_year_analysis** — Subject and topic breakdown for a specific exam year.
4. **get_platform_info** — Platform overview, capabilities, and practice session links.

### Resources (browsable data, no tool call needed)

1. **upsc://syllabus** — Full UPSC Prelims GS Paper I syllabus taxonomy (markdown)
2. **upsc://years** — Year-by-year question counts from the database (JSON)
3. **upsc://subjects** — Subject-wise question distribution across all years (JSON)

### Prompts (pre-built templates agents can offer to users)

1. **study-plan** — Generate a 4-week study plan for a subject based on PYQ frequency. Params: subject.
2. **year-comparison** — Compare question patterns across two exam years. Params: year1, year2.
3. **topic-deep-dive** — Deep analysis of a specific topic with patterns and practice advice. Params: subject, topic.
4. **mock-test-strategy** — Pre-test strategy briefing before attempting a year's paper. Params: year.

### Claude Desktop Configuration

Add to your claude_desktop_config.json:
\`\`\`json
{
  "mcpServers": {
    "upsc-prelims-test": {
      "url": "https://upscprelimstest.com/api/mcp"
    }
  }
}
\`\`\`

### Smithery.ai

Registry listing: https://smithery.ai (search "upsc-prelims-test")
Config file: smithery.yaml in repository root
`;

export async function GET() {
  return new NextResponse(LLMS_TXT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
