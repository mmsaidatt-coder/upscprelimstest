import { NextResponse } from "next/server";

const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "UPSC Prelims Test API",
    version: "1.0.0",
    description:
      "Public API for the UPSC Prelims Test platform. Provides access to the 1,200+ previous year question bank (2014–2025) with AI-enriched metadata, subject blueprints, topic-level drills, and AI-generated strategic insights. The web app also includes a larger 10,000+ question practice bank for dynamic mock generation. Designed for both human clients and autonomous AI agents.",
    contact: {
      name: "UPSC Prelims Test",
      url: "https://upscprelimstest.com",
    },
  },
  servers: [
    {
      url: "https://upscprelimstest.com",
      description: "Production",
    },
  ],
  paths: {
    "/api/pyq/database": {
      get: {
        operationId: "getPyqDatabase",
        summary:
          "Fetch the full UPSC Prelims PYQ question bank or a paginated subset",
        description:
          "Returns previous year questions from the UPSC Civil Services Preliminary Examination (2014–2025). Without pagination parameters, returns all 1,200+ questions. With page and limit parameters, returns a paginated subset. Each question includes the prompt, options, correct answer, year, subject, and AI-enriched metadata (topic, keywords, concepts, difficulty rationale, mnemonic hint). Use this endpoint to build study plans, analyze question patterns, or power practice sessions.",
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            description:
              "Page number for paginated results. Must be used together with 'limit'. If omitted, all questions are returned.",
            schema: { type: "integer", minimum: 1, example: 1 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description:
              "Number of questions per page (max 200). Must be used together with 'page'.",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 200,
              example: 50,
            },
          },
        ],
        responses: {
          "200": {
            description: "Question bank retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    count: {
                      type: "integer",
                      description: "Number of questions in this response",
                    },
                    total: {
                      type: "integer",
                      description:
                        "Total questions available (only in paginated mode)",
                    },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    hasMore: { type: "boolean" },
                    questions: {
                      type: "array",
                      items: { $ref: "#/components/schemas/PyqQuestion" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/subject-blueprint": {
      get: {
        operationId: "getSubjectBlueprint",
        summary:
          "Get topic-by-year question count matrix for a UPSC Prelims subject",
        description:
          "Returns a structured breakdown of how many questions appeared for each topic within a subject, organized by year. Use this to identify high-frequency topics, detect trends across years, and build targeted study plans. For example, querying 'Polity' will show that 'Constitutional Articles' had 5 questions in 2024 but only 2 in 2020.",
        parameters: [
          {
            name: "subject",
            in: "query",
            required: true,
            description:
              "The canonical subject name. Accepted values: Polity, History, Economy, Economics, Geography, Environment, Science, Science & Tech, Current Affairs.",
            schema: {
              type: "string",
              enum: [
                "Polity",
                "History",
                "Economy",
                "Economics",
                "Geography",
                "Environment",
                "Science",
                "Science & Tech",
                "Current Affairs",
              ],
            },
          },
        ],
        responses: {
          "200": {
            description: "Topic blueprint retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    topics: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          topic: {
                            type: "string",
                            description: "Topic name",
                          },
                          years: {
                            type: "object",
                            description:
                              "Object with year as key and question count as value",
                            additionalProperties: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid subject parameter",
          },
        },
      },
    },
    "/api/topic-questions": {
      get: {
        operationId: "getTopicQuestions",
        summary:
          "Fetch UPSC Prelims questions for a specific topic within a subject",
        description:
          "Returns up to 40 questions matching a specific topic within a subject. Uses a 3-tier matching strategy: (1) AI-enriched topic/sub_topic fields, (2) keyword array matching, (3) full-text search fallback. Optionally filter by year. Use this for targeted topic drills — e.g., 'Fundamental Rights' within 'Polity', or 'Climate Change' within 'Environment'.",
        parameters: [
          {
            name: "subject",
            in: "query",
            required: true,
            description: "Canonical subject name",
            schema: { type: "string" },
          },
          {
            name: "topic",
            in: "query",
            required: true,
            description:
              "Topic name to search for. Matched against enriched topic, sub_topic, keywords, and prompt text.",
            schema: { type: "string" },
          },
          {
            name: "year",
            in: "query",
            required: false,
            description:
              "Filter to a specific exam year (2014–2025). Omit for all years.",
            schema: { type: "integer", minimum: 2014, maximum: 2025 },
          },
        ],
        responses: {
          "200": {
            description: "Topic questions retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    questions: {
                      type: "array",
                      items: { $ref: "#/components/schemas/PyqQuestion" },
                    },
                    total: { type: "integer" },
                    totalSubject: { type: "integer" },
                    filtered: { type: "boolean" },
                    enriched: { type: "boolean" },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid subject parameter" },
        },
      },
    },
    "/api/subject-insights": {
      post: {
        operationId: "getSubjectInsights",
        summary:
          "Generate AI-powered strategic analysis for a UPSC Prelims subject",
        description:
          "Uses Gemini AI to analyze question frequency data and generate strategic insights including focus topics, topics to deprioritize, study tips, trend analysis, difficulty rating, and predictions for the next exam. Requires topic frequency data as input. Best used after fetching data from /api/subject-blueprint.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["subject", "topicData", "totalQuestions"],
                properties: {
                  subject: {
                    type: "string",
                    description: "Subject name",
                  },
                  topicData: {
                    type: "array",
                    description:
                      "Array of { topic, total } sorted by frequency. Get this from /api/subject-blueprint.",
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string" },
                        total: { type: "integer" },
                      },
                    },
                  },
                  totalQuestions: {
                    type: "integer",
                    description:
                      "Total number of questions for this subject across all years",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "AI insights generated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    verdict: {
                      type: "string",
                      description:
                        "One-sentence summary of the subject's character in UPSC Prelims",
                    },
                    focusTopics: {
                      type: "array",
                      items: { type: "string" },
                      description: "Top 3 topics to focus on",
                    },
                    avoidTopics: {
                      type: "array",
                      items: { type: "string" },
                      description: "Topics that can be deprioritized",
                    },
                    studyTip: {
                      type: "string",
                      description: "Actionable study tip",
                    },
                    trendInsight: {
                      type: "string",
                      description: "Recent trend observation",
                    },
                    difficultyRating: {
                      type: "string",
                      enum: ["Easy", "Moderate", "Hard"],
                    },
                    predictedNextYear: {
                      type: "string",
                      description:
                        "Topic or theme most likely to appear in the next exam",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      PyqQuestion: {
        type: "object",
        description:
          "A UPSC Prelims previous year question with AI-enriched metadata",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "Unique question identifier",
          },
          prompt: {
            type: "string",
            description: "The question stem text",
          },
          options: {
            type: "array",
            description: "Four answer choices",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  enum: ["A", "B", "C", "D"],
                },
                text: { type: "string" },
              },
            },
          },
          correct_option_id: {
            type: "string",
            enum: ["A", "B", "C", "D"],
            nullable: true,
            description:
              "The correct answer. Null for questions without verified answers.",
          },
          year: {
            type: "integer",
            minimum: 2014,
            maximum: 2025,
            description: "UPSC Prelims exam year",
          },
          subject: {
            type: "string",
            enum: [
              "Polity",
              "History",
              "Economy",
              "Geography",
              "Environment",
              "Science",
              "Current Affairs",
            ],
            description: "Primary subject classification",
          },
          topic: {
            type: "string",
            nullable: true,
            description:
              "AI-enriched primary topic (e.g., 'Constitutional Articles', 'Monetary Policy')",
          },
          sub_topic: {
            type: "string",
            nullable: true,
            description: "More granular topic classification",
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            nullable: true,
            description:
              "AI-extracted keywords for semantic matching and search",
          },
          question_type: {
            type: "string",
            nullable: true,
            description:
              "Question format: factual, analytical, match-the-following, assertion-reason, etc.",
          },
          concepts: {
            type: "array",
            items: { type: "string" },
            nullable: true,
            description:
              "High-level conceptual tags spanning multiple topics",
          },
          importance: {
            type: "string",
            nullable: true,
            description: "AI-assessed importance level for exam preparation",
          },
          difficulty_rationale: {
            type: "string",
            nullable: true,
            description: "Explanation of why this question is easy/moderate/hard",
          },
          mnemonic_hint: {
            type: "string",
            nullable: true,
            description: "Memory aid for the underlying concept",
          },
          ncert_class: {
            type: "string",
            nullable: true,
            description:
              "Relevant NCERT textbook class reference (e.g., 'Class 11 Political Science')",
          },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(OPENAPI_SPEC, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
