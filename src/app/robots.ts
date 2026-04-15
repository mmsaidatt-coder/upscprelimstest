import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: allow all public pages, block app routes
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app", "/api/account", "/api/attempts"],
      },
      // AI search bots — explicitly welcome, point to public APIs and content
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
        disallow: ["/app", "/api/account", "/api/attempts", "/api/pyq/import"],
      })),
    ],
    sitemap: "https://upscprelimstest.com/sitemap.xml",
    host: "https://upscprelimstest.com",
  };
}
