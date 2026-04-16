import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages";
import { SUBJECT_MAP } from "@/lib/subject-map";

// ── Types ────────────────────────────────────────────────────────────────────

type PyqRow = {
  id: string;
  prompt: string;
  options: unknown;
  correct_option_id: string | null;
  year: number | null;
  subject: string;
  topic: string | null;
  sub_topic: string | null;
  keywords: string[] | null;
  question_type: string | null;
  concepts: string[] | null;
  importance: string | null;
  difficulty_rationale: string | null;
  mnemonic_hint: string | null;
  ncert_class: string | null;
};

const PYQ_SELECT = `
  id, prompt, options, correct_option_id, year, subject,
  topic, sub_topic, keywords, question_type, concepts,
  importance, difficulty_rationale, mnemonic_hint, ncert_class
`;

// ── MCP Server Factory ──────────────────────────────────────────────────────

function createMcpServer() {
  const mcp = new McpServer({
    name: "upsc-prelims-test",
    version: "1.0.0",
  });

  // ── Tool: search_questions ──────────────────────────────────────────────

  mcp.tool(
    "search_questions",
    "Search and filter the UPSC Prelims previous year question bank (1,200+ questions from 2014–2025). " +
      "Returns questions with full metadata: prompt, options, correct answer, subject, topic, keywords, concepts, " +
      "difficulty rationale, mnemonic hints, and NCERT class references. " +
      "Use this to find specific questions, analyze patterns, or build practice sessions. " +
      "All parameters are optional — omit all for the full database.",
    {
      subject: z.string().optional().describe(
        "Filter by subject. Accepted: Polity, History, Economy, Geography, Environment, Science, Current Affairs",
      ),
      year: z.number().optional().describe(
        "Filter by UPSC exam year (2014–2025)",
      ),
      keyword: z.string().optional().describe(
        "Free-text keyword to search in question prompts (e.g., 'fundamental rights', 'monsoon', 'GDP')",
      ),
      limit: z.number().optional().describe(
        "Maximum number of questions to return (default 20, max 100)",
      ),
    },
    async ({ subject, year, keyword, limit: rawLimit }) => {
      const supabase = createAdminClient();
      const maxResults = Math.min(rawLimit ?? 20, 100);
      const dbSubject = subject ? SUBJECT_MAP[subject] : undefined;

      const questions = await fetchAllPages<PyqRow>({
        runPage: async (from, to) => {
          let query = supabase
            .from("questions")
            .select(PYQ_SELECT)
            .eq("source", "pyq");

          if (dbSubject) query = query.eq("subject", dbSubject);
          if (year) query = query.eq("year", year);

          return await query
            .order("year", { ascending: false })
            .order("id", { ascending: true })
            .range(from, to);
        },
      });

      let filtered = questions;

      if (keyword) {
        const kw = keyword.toLowerCase();
        filtered = questions.filter(
          (q) =>
            q.prompt.toLowerCase().includes(kw) ||
            (q.keywords ?? []).some((k) => k.toLowerCase().includes(kw)) ||
            (q.topic ?? "").toLowerCase().includes(kw) ||
            (q.sub_topic ?? "").toLowerCase().includes(kw),
        );
      }

      const results = filtered.slice(0, maxResults);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                total_matched: filtered.length,
                returned: results.length,
                questions: results,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── Tool: get_subject_blueprint ─────────────────────────────────────────

  mcp.tool(
    "get_subject_blueprint",
    "Get a topic-by-year question count matrix for a UPSC Prelims subject. " +
      "Shows which topics appeared in which years and how frequently — essential for identifying " +
      "high-yield topics, detecting trends, and building focused study plans. " +
      "Returns topics sorted by total frequency (descending).",
    {
      subject: z.string().describe(
        "Subject name (required). Accepted: Polity, History, Economy, Geography, Environment, Science, Current Affairs",
      ),
    },
    async ({ subject }) => {
      const dbSubject = SUBJECT_MAP[subject];
      if (!dbSubject) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Invalid subject "${subject}". Accepted: Polity, History, Economy, Geography, Environment, Science, Current Affairs`,
            },
          ],
          isError: true,
        };
      }

      const supabase = createAdminClient();
      const data = await fetchAllPages<{
        id: string;
        year: number | null;
        topic: string | null;
      }>({
        runPage: async (from, to) =>
          await supabase
            .from("questions")
            .select("id, year, topic")
            .eq("source", "pyq")
            .eq("subject", dbSubject)
            .order("id", { ascending: true })
            .range(from, to),
      });

      const topicMap: Record<string, Record<number, number>> = {};
      for (const q of data) {
        const t = q.topic || "Uncategorized";
        if (!q.year) continue;
        if (!topicMap[t]) topicMap[t] = {};
        topicMap[t]![q.year] = (topicMap[t]![q.year] ?? 0) + 1;
      }

      const topics = Object.entries(topicMap)
        .map(([topic, years]) => ({
          topic,
          years,
          total: Object.values(years).reduce((s, n) => s + n, 0),
        }))
        .sort((a, b) => b.total - a.total);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { subject: dbSubject, total_questions: data.length, topics },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── Tool: get_year_analysis ─────────────────────────────────────────────

  mcp.tool(
    "get_year_analysis",
    "Get a breakdown of a specific UPSC Prelims exam year — how many questions per subject, " +
      "which topics appeared, and the overall composition. Useful for understanding a year's paper " +
      "pattern before attempting it.",
    {
      year: z.number().describe(
        "UPSC Prelims exam year (required, 2014–2025)",
      ),
    },
    async ({ year }) => {
      if (year < 2014 || year > 2025) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Invalid year ${year}. Available: 2014–2025.`,
            },
          ],
          isError: true,
        };
      }

      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("questions")
        .select("subject, topic")
        .eq("source", "pyq")
        .eq("year", year);

      if (error) {
        return {
          content: [
            { type: "text" as const, text: `Database error: ${error.message}` },
          ],
          isError: true,
        };
      }

      const subjectCounts: Record<string, number> = {};
      const topicsBySubject: Record<string, Record<string, number>> = {};

      for (const q of data ?? []) {
        const s = q.subject as string;
        subjectCounts[s] = (subjectCounts[s] ?? 0) + 1;
        if (!topicsBySubject[s]) topicsBySubject[s] = {};
        const t = (q.topic as string) || "Uncategorized";
        topicsBySubject[s]![t] = (topicsBySubject[s]![t] ?? 0) + 1;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                year,
                total_questions: (data ?? []).length,
                subject_distribution: subjectCounts,
                topics_by_subject: topicsBySubject,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── Tool: get_platform_info ─────────────────────────────────────────────

  mcp.tool(
    "get_platform_info",
    "Get information about the UPSC Prelims Test platform — what data is available, " +
      "which subjects and years are covered, how to start a practice session, and links " +
      "to specific features. Use this as a starting point to understand platform capabilities.",
    async () => {
      const supabase = createAdminClient();
      const [{ count: pyqCount }, { count: practiceBankCount }] = await Promise.all([
        supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("source", "pyq"),
        supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .in("source", ["pyq", "custom", "flt"]),
      ]);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                name: "UPSC Prelims Test",
                url: "https://upscprelimstest.com",
                description:
                  "Free UPSC Civil Services Preliminary Examination practice platform",
                total_questions: practiceBankCount ?? pyqCount ?? null,
                pyq_questions: pyqCount ?? null,
                practice_bank_questions: practiceBankCount ?? null,
                years_covered: "2014–2025",
                subjects: [
                  "Polity",
                  "History",
                  "Economy",
                  "Geography",
                  "Environment",
                  "Science",
                  "Current Affairs",
                ],
                features: [
                  "Timed exam simulations with negative marking",
                  "Subject-wise and topic-wise drills",
                  "Dynamic mock generator using UPSC blueprint ratios",
                  "AI-enriched question metadata (topics, keywords, concepts)",
                  "Performance analytics with subject breakdown",
                  "Question palette, mark-for-review, option eliminator",
                  "Personal notebook for takeaways",
                ],
                practice_links: {
                  mixed_25:
                    "https://upscprelimstest.com/app/pyq/run?limit=25",
                  mixed_50:
                    "https://upscprelimstest.com/app/pyq/run?limit=50",
                  full_100:
                    "https://upscprelimstest.com/app/pyq/run?limit=100",
                  by_year:
                    "https://upscprelimstest.com/app/pyq/run?year={YEAR}&limit=100",
                  by_subject:
                    "https://upscprelimstest.com/app/pyq/run?subject={SUBJECT}&limit=50",
                },
                api_docs: "https://upscprelimstest.com/api/openapi.json",
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RESOURCES — browsable data agents can read without tool calls
  // ══════════════════════════════════════════════════════════════════════════

  mcp.resource(
    "UPSC Prelims Syllabus & Subject Index",
    "upsc://syllabus",
    {
      description:
        "Complete UPSC Prelims GS Paper I syllabus taxonomy with all 7 subjects, their scope, and key topic areas. " +
        "Read this first to understand what the platform covers before querying specific data.",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "upsc://syllabus",
          mimeType: "text/markdown",
          text: `# UPSC Prelims GS Paper I — Syllabus & Subject Index

## Subjects Covered (1,200+ PYQs from 2014–2025)

The web app also contains a larger 10,000+ question practice bank built from custom FLTs and current-affairs questions. The MCP PYQ tools below query the previous-year-question subset unless a tool explicitly says otherwise.

### 1. Polity
Constitutional framework, Parliament & Legislature, Judiciary & Courts, Fundamental Rights & Duties, DPSPs, Constitutional Bodies (Election Commission, CAG, UPSC), Federalism, Governance & Policy, Elections & Representation, Constitutional Amendments.

### 2. History
Ancient India (Vedic, Maurya, Gupta), Medieval India (Delhi Sultanate, Mughals, Vijayanagar), Modern India (British colonial era, reforms, acts), Freedom Struggle (Gandhi, Congress movements, revolts), World History (French Revolution, World Wars, Industrial Revolution), Art & Culture (temples, paintings, dance, music), Bhakti & Sufi movements.

### 3. Economy
Macro Economics (GDP, inflation, national income), Banking & Monetary Policy (RBI, repo rate, SLR/CRR), Fiscal Policy & Budget (taxes, GST, deficit), International Trade (WTO, BoP, forex), Agriculture Economy (MSP, crop insurance), Government Schemes, Capital Markets (SEBI, stocks, bonds), Infrastructure & Industry.

### 4. Geography
Physical Geography (geomorphology, rocks, landforms), Indian Rivers & Water Resources, Climate & Monsoon, Agriculture & Soil, World Geography, Resources & Energy (minerals, coal, petroleum), Maps & Location, Oceanography.

### 5. Environment
Ecology & Ecosystems, Biodiversity & Species (IUCN Red List, endemic species), Protected Areas (national parks, tiger reserves, biosphere reserves), Climate Change (Paris Agreement, IPCC), Environmental Laws, Pollution & Waste, International Conventions (Ramsar, CITES, CBD), Government schemes & reports.

### 6. Science & Technology
Space Technology (ISRO, satellites, missions), Biotechnology (GMO, gene editing, vaccines), Defence & Military Tech (DRDO, missiles), Nuclear & Energy, IT & Computers (AI, blockchain, cybersecurity), Health & Diseases, Chemistry & Physics fundamentals, Nanotechnology.

### 7. Current Affairs
International Relations, Government Schemes & Missions, Awards & Institutions, Sports & Events, Social Issues, UN & Global Bodies (G20, IMF, World Bank).

## Practice Links

- Mixed 25Q session: https://upscprelimstest.com/app/pyq/run?limit=25
- Full 100Q paper: https://upscprelimstest.com/app/pyq/run?limit=100
- By year: https://upscprelimstest.com/app/pyq/run?year={YEAR}&limit=100
- By subject: https://upscprelimstest.com/app/pyq/run?subject={SUBJECT}&limit=50

## Available Years
2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025
`,
        },
      ],
    }),
  );

  mcp.resource(
    "Available Years & Question Counts",
    "upsc://years",
    {
      description:
        "List of all UPSC Prelims exam years available on the platform with question counts per year. " +
        "Use this to know which years have data before querying specific year analyses.",
      mimeType: "application/json",
    },
    async () => {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("questions")
        .select("year")
        .eq("source", "pyq")
        .not("year", "is", null);

      const yearCounts: Record<number, number> = {};
      for (const q of data ?? []) {
        if (q.year) yearCounts[q.year] = (yearCounts[q.year] ?? 0) + 1;
      }

      const years = Object.entries(yearCounts)
        .map(([year, count]) => ({ year: Number(year), questions: count }))
        .sort((a, b) => b.year - a.year);

      return {
        contents: [
          {
            uri: "upsc://years",
            mimeType: "application/json",
            text: JSON.stringify({ total_questions: data?.length ?? 0, years }, null, 2),
          },
        ],
      };
    },
  );

  mcp.resource(
    "Subject-wise Question Distribution",
    "upsc://subjects",
    {
      description:
        "Breakdown of how many PYQ questions exist per subject across all years. " +
        "Useful for understanding which subjects are most heavily tested.",
      mimeType: "application/json",
    },
    async () => {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("questions")
        .select("subject")
        .eq("source", "pyq");

      const subjectCounts: Record<string, number> = {};
      for (const q of data ?? []) {
        const s = q.subject as string;
        subjectCounts[s] = (subjectCounts[s] ?? 0) + 1;
      }

      const subjects = Object.entries(subjectCounts)
        .map(([subject, count]) => ({ subject, questions: count }))
        .sort((a, b) => b.questions - a.questions);

      return {
        contents: [
          {
            uri: "upsc://subjects",
            mimeType: "application/json",
            text: JSON.stringify({ total_questions: data?.length ?? 0, subjects }, null, 2),
          },
        ],
      };
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PROMPTS — pre-built templates agents can offer to users
  // ══════════════════════════════════════════════════════════════════════════

  mcp.prompt(
    "study-plan",
    "Generate a focused UPSC Prelims study plan for a specific subject based on PYQ frequency analysis. " +
      "Identifies high-yield topics, weak areas to prioritize, and recommended practice sessions.",
    {
      subject: z.string().describe(
        "Subject to create a study plan for (e.g., Polity, History, Economy, Geography, Environment, Science, Current Affairs)",
      ),
    },
    async ({ subject }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `I'm preparing for UPSC Prelims and need a focused study plan for ${subject}.

Please use the get_subject_blueprint tool to fetch the topic-by-year frequency data for "${subject}", then:

1. Identify the top 5 most frequently asked topics (highest question count across years)
2. Flag any topics with rising trends (more questions in recent years 2023-2025 vs earlier)
3. Flag any declining topics (fewer questions recently)
4. Create a prioritized 4-week study plan with:
   - Week 1-2: High-frequency foundational topics
   - Week 3: Rising-trend and current-affairs-linked topics
   - Week 4: Revision + practice tests on weak areas
5. For each topic, suggest a practice session link using this format:
   https://upscprelimstest.com/app/pyq/run?subject=${encodeURIComponent(subject)}&limit=25

Keep the plan actionable and specific to UPSC Prelims patterns.`,
          },
        },
      ],
    }),
  );

  mcp.prompt(
    "year-comparison",
    "Compare question patterns across two UPSC Prelims exam years. " +
      "Reveals how the exam has evolved — which subjects gained/lost weight, new topics introduced.",
    {
      year1: z.string().describe("First year to compare (e.g., 2020)"),
      year2: z.string().describe("Second year to compare (e.g., 2025)"),
    },
    async ({ year1, year2 }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Compare the UPSC Prelims papers from ${year1} and ${year2}.

Use the get_year_analysis tool for both years, then analyze:

1. How did the subject distribution change? (e.g., did Polity questions increase?)
2. Which topics appeared in ${year2} that didn't exist in ${year1}?
3. Which topics from ${year1} were dropped by ${year2}?
4. What does this suggest about the direction UPSC is moving?
5. Based on this trend, what should aspirants preparing for the next exam focus on?

Present the comparison in a clear table format where possible.`,
          },
        },
      ],
    }),
  );

  mcp.prompt(
    "topic-deep-dive",
    "Deep-dive into a specific topic — fetch all questions, analyze patterns, and generate targeted practice advice.",
    {
      subject: z.string().describe("Subject (e.g., Polity, History)"),
      topic: z.string().describe("Specific topic (e.g., Fundamental Rights, Monetary Policy, Climate Change)"),
    },
    async ({ subject, topic }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `I want a deep dive into "${topic}" within ${subject} for UPSC Prelims.

Use the search_questions tool with subject="${subject}" and keyword="${topic}" to fetch relevant questions, then:

1. How many questions has UPSC asked on this topic? In which years?
2. What question types are common? (factual recall, analytical, match-the-following, assertion-reason)
3. Are there recurring sub-themes or concepts within this topic?
4. What is the difficulty trend — are recent questions harder?
5. List 3-5 specific concepts a student MUST know based on the question patterns
6. If mnemonic hints are available, share them

End with a link to practice this topic:
https://upscprelimstest.com/app/pyq/run?subject=${encodeURIComponent(subject)}&limit=25`,
          },
        },
      ],
    }),
  );

  mcp.prompt(
    "mock-test-strategy",
    "Get a pre-test strategy briefing before attempting a specific year's UPSC Prelims paper.",
    {
      year: z.string().describe("The year's paper you're about to attempt (e.g., 2024)"),
    },
    async ({ year }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `I'm about to attempt the UPSC Prelims ${year} paper as a mock test.

Use get_year_analysis for ${year} to understand the paper composition, then give me:

1. Subject distribution — how many questions per subject, so I know where to expect clusters
2. Time allocation strategy — based on the mix, how should I split my 120 minutes?
3. Expected difficulty areas — which subjects/topics in this year tend to be tricky?
4. Negative marking strategy — at what confidence level should I attempt vs skip?
5. Any "gotcha" patterns from this year (e.g., unusually heavy on Current Affairs, tricky Environment questions)

Keep it concise — I want to read this in 2 minutes before starting the test.

Test link: https://upscprelimstest.com/app/pyq/run?year=${year}&limit=100`,
          },
        },
      ],
    }),
  );

  return mcp;
}

// ── Route Handler ────────────────────────────────────────────────────────────

async function handleMcpRequest(req: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
    enableJsonResponse: true,
  });

  const mcp = createMcpServer();
  await mcp.connect(transport);

  try {
    return await transport.handleRequest(req);
  } finally {
    await transport.close();
    await mcp.close();
  }
}

export async function GET(req: Request) {
  return handleMcpRequest(req);
}

export async function POST(req: Request) {
  return handleMcpRequest(req);
}

export async function DELETE(req: Request) {
  return handleMcpRequest(req);
}
