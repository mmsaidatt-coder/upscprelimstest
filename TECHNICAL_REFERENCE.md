# Technical Reference: UPSC Prelims Test

This document provides a comprehensive overview of the architecture, logic, and data flow of the UPSC Prelims Test platform. It serves as the primary technical guide for developers and stakeholders.

---

## 1. Overview
**UPSC Prelims Test** is a high-performance practice platform designed to simulate the UPSC Civil Services Preliminary Examination. It combines a marketing frontend with a sophisticated, authenticated exam application that provides deep analytics and a searchable database of 1,203+ enriched Previous Year Questions (PYQs) from 2014 to 2025.

---

## 2. Architecture & Tech Stack
The application is built using a modern, serverless architecture that prioritizes speed, developer experience, and scalability.

| Layer | Technology | Description |
|-------|-----------|-------------|
| **Frontend Framework** | [Next.js 16+](https://nextjs.org) | App Router, React 19, TypeScript (Strict). |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) | Modern utility-first CSS with CSS variable tokens. |
| **Authentication** | [Supabase Auth](https://supabase.com/auth) | Google OAuth and Email/Password sessions. |
| **Database** | [PostgreSQL (Supabase)](https://supabase.com/database) | Relational storage with Row-Level Security (RLS). |
| **Hosting & CI/CD** | [Vercel](https://vercel.com) | Automated deployments and serverless edge functions. |
| **Analytics/Charts** | [Recharts](https://recharts.org) | Declarative SVG-based charting for subject analysis. |
| **AI Integration** | [Gemini API](https://ai.google.dev) | Used for OCR correction and academic metadata enrichment. |

---

## 3. Core Logic & Features

### 3.1. PYQ Enrichment & Restoration
One of the platform's unique selling points is its **100% restored PYQ database**.
- **Problem**: Original OCR of scanned UPSC papers often resulted in garbled text, merged options, and missing academic context.
- **Solution**: An automated pipeline using the **Gemini 3.1 Pro Preview** and **Gemini 1.5 Flash** models was developed to reconstruct all 1,203 questions to 100% accuracy.
- **Metadata Enriched**: Each question now includes the following structured data:
  - `subject`, `topic`, `sub_topic`
  - `keywords` & `concepts`
  - `importance` & `question_type`
  - `ncert_class` reference & `mnemonic_hint`
  - `difficulty_rationale`

### 3.2. Exam Runner (`src/components/exam/`)
The `ExamRunner` is a client-side engine that handles the high-pressure test environment.
- **State Management**: Uses React state to track current question, selected options, time spent per question, and elimination states.
- **Features**:
  - **Elimination Mode**: Users can strike through options they've ruled out.
  - **Question Palette**: Instant navigation between 100 questions with visual indicators for answered, marked for review, and visited.
  - **Auto-Submission**: Integrated countdown timer with automatic session freezing on expiry.

### 3.3. Subject Analysis Dashboard
Located at `/pyq/subject-analyse`, this feature provides a top-down view of UPSC trends.
- **Heatmap**: A "Topic × Year" matrix that highlights which subjects and topics are gaining prominence. Brighter colors indicate higher question frequency.
- **Interactive Charts**: Responsive bar charts show subject weightage and year-on-year trends. Clicking any bar opens a **Topic Drawer** that fetches real questions from that specific niche.

### 3.4. Searchable PYQ Database
The "PYQ Data Base" toggle provides a high-speed, client-side searchable interface for the entire question bank. It uses keyword-based filtering to narrow down questions instantaneously as users type terms like "River", "Constitution", or "Economy".

---

## 4. Data Model (Supabase)

### Key Tables
- **`questions`**: The central repository. Stores prompts, JSONB options, answer keys, and the full suite of enriched metadata.
- **`attempts`**: Records user test results. Currently supports `graded`, `partial`, and `ungraded` states.
- **`attempt_answers`**: Stores the granular data of every question answered in a session (timing, elimination, correctness).
- **`notebook_entries`**: Personal "takeaways" or notes saved by users during post-exam review.

### Row-Level Security (RLS)
The database is secured so that:
- **Questions**: Are read-only for all authenticated users.
- **User Data**: Attempts, answers, and notebooks are protected via `auth.uid()`, ensuring users only see their own progress.

---

## 5. Development Workflow

### Local Development
1.  **Clone & Install**: `npm install`
2.  **Env Setup**: Copy `.env.example` to `.env.local` with Supabase/Gemini keys.
3.  **Run Server**: `npm run dev`

### Deployment
The project is linked to Vercel. Pushing to the `main` branch of the [GitHub repository](https://github.com/mmsaidatt-coder/upscprelimstest) triggers an automatic production build.

### Maintenance Scripts
Several utility scripts are available in the `scripts/` directory:
- `import-pyq-csv.ts`: Bulk uploads questions.
- `fix-pyq-text.ts`: AI-driven text correction and restoration.
- `apply_2025_answers.ts`: Batch updates for answer keys.

---

## 6. Design Principles
The UI follows a "Blueprint" aesthetic:
- **Colors**: Rich, earthy tones (Accent: `#a3e635`).
- **Typography**: Display titles in **Fraunces**, body text in **Manrope**.
- **UX**: Minimum clicks to start a test, zero-latency search, and "vibe-consistent" animations.

---

*Last Updated: March 20, 2026*
