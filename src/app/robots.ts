import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Let crawlers read page-level noindex directives. Blocking /app here
      // would prevent those directives from being seen and can leave bare URLs
      // in search results.
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/account",
          "/api/attempts",
          "/api/bookmarks",
          "/api/feedback",
          "/api/pyq/import",
          "/auth/",
        ],
      },
      // AI search/retrieval crawlers may access public pages and the public
      // machine-readable question APIs. Sensitive/user-specific APIs stay out.
      ...[
        "GPTBot",
        "ChatGPT-User",
        "OAI-SearchBot",
        "Claude-Web",
        "ClaudeBot",
        "Applebot-Extended",
        "PerplexityBot",
        "Google-Extended",
        "Bytespider",
        "CCBot",
      ].map((bot) => ({
        userAgent: bot,
        allow: [
          "/",
          "/llms.txt",
          "/.well-known/agent.json",
          "/api/openapi.json",
          "/api/pyq/database",
          "/api/subject-blueprint",
          "/api/topic-questions",
        ],
        disallow: [
          "/api/account",
          "/api/attempts",
          "/api/bookmarks",
          "/api/feedback",
          "/api/pyq/import",
          "/auth/",
        ],
      })),
    ],
    sitemap: [
      "https://upscprelimstest.com/sitemap.xml",
      "https://upscprelimstest.com/question/sitemap.xml",
    ],
    host: "upscprelimstest.com",
  };
}
