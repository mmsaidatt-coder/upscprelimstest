import { NextResponse } from "next/server";

const AGENT_CARD = {
  schema_version: "1.0",
  name: "UPSC Prelims Test",
  description:
    "Free UPSC Civil Services Preliminary Examination practice platform with 1,200+ previous year questions (2014–2025) and a 10,000+ total AI-enriched practice bank. Provides timed exam simulations, subject-wise drills, topic-level analytics, dynamic mock generation, and question metadata across Polity, History, Economy, Geography, Environment, Science, and Current Affairs.",
  url: "https://upscprelimstest.com",
  provider: {
    organization: "UPSC Prelims Test",
    url: "https://upscprelimstest.com",
  },
  version: "1.0.0",
  capabilities: {
    streaming: false,
    pushNotifications: false,
  },
  defaultInputModes: ["application/json"],
  defaultOutputModes: ["application/json"],
  skills: [
    {
      id: "fetch-pyq-database",
      name: "Fetch PYQ Question Bank",
      description:
        "Retrieve the 1,200+ UPSC Prelims previous year questions with full metadata including topic, keywords, concepts, difficulty, and correct answers. Supports pagination.",
      tags: ["upsc", "pyq", "questions", "education", "exam"],
      examples: [
        "Get all UPSC Prelims previous year questions",
        "Fetch Polity questions from UPSC 2024",
        "How many Geography questions appeared in UPSC Prelims 2023?",
      ],
    },
    {
      id: "subject-blueprint",
      name: "Subject Topic Blueprint",
      description:
        "Get a topic-by-year question count matrix for any UPSC Prelims subject. Shows which topics appeared in which years and how frequently.",
      tags: ["upsc", "syllabus", "topics", "analysis", "trends"],
      examples: [
        "Show me the topic breakdown for History in UPSC Prelims",
        "Which Polity topics are most frequently asked?",
        "What is the year-wise distribution of Economy topics?",
      ],
    },
    {
      id: "topic-questions",
      name: "Topic-Specific Questions",
      description:
        "Fetch questions for a specific topic within a subject. Uses AI-enriched metadata for accurate topic matching across 3 tiers: enriched topic field, keyword array, and text search.",
      tags: ["upsc", "topic", "drill", "practice", "questions"],
      examples: [
        "Get questions on Fundamental Rights from Polity",
        "Find UPSC questions about Climate Change",
        "Show Banking & Monetary policy questions from Economy",
      ],
    },
    {
      id: "subject-insights",
      name: "AI Subject Analysis",
      description:
        "Generate strategic AI analysis for a UPSC subject including focus topics, trends, difficulty rating, and predictions. Powered by Gemini.",
      tags: ["upsc", "ai", "analysis", "strategy", "predictions"],
      examples: [
        "What are the most important topics for Geography in UPSC?",
        "Give me a strategic analysis of the Environment section",
        "Predict trending UPSC Prelims topics for next year",
      ],
    },
    {
      id: "dynamic-mock-practice",
      name: "Dynamic Mock Practice",
      description:
        "Start practice sessions from the larger AI-enriched custom bank, including UPSC-ratio full-length simulators, mixed drills, and single-subject drills.",
      tags: ["upsc", "mock-test", "practice", "custom-bank", "flt"],
      examples: [
        "Generate a UPSC-ratio 100 question simulator",
        "Start a 50 question Economy drill",
        "Create a mixed practice session from the full bank",
      ],
    },
  ],
  authentication: {
    schemes: [
      {
        scheme: "none",
        description:
          "Public APIs (question bank, blueprints, topic questions) require no authentication.",
      },
      {
        scheme: "cookie",
        description:
          "User-specific APIs (attempts, notebook) require Supabase session authentication via Google OAuth or email/password.",
      },
    ],
  },
  protocols: [
    {
      protocol: "mcp",
      transport: "streamable-http",
      endpoint: "https://upscprelimstest.com/api/mcp",
      description:
        "Model Context Protocol server exposing 4 tools (search_questions, get_subject_blueprint, get_year_analysis, get_platform_info), " +
        "3 resources (upsc://syllabus, upsc://years, upsc://subjects), and " +
        "4 prompts (study-plan, year-comparison, topic-deep-dive, mock-test-strategy). " +
        "Stateless, no auth required for public tools.",
    },
  ],
  documentationUrl: "https://upscprelimstest.com/api/openapi.json",
  llmsTxtUrl: "https://upscprelimstest.com/llms.txt",
};

export async function GET() {
  return NextResponse.json(AGENT_CARD, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
