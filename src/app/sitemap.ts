import type { MetadataRoute } from "next";
import { fetchAllQuestionIds } from "@/lib/supabase/questions";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://upscprelimstest.com";
  const now = new Date().toISOString();

  // Array to hold static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/pyq`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/flt`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/subject-wise`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/current-affairs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/analytics`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/platform`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Fetch all 1200+ question IDs for programmatic SEO
  const questionIds = await fetchAllQuestionIds();
  
  const questionRoutes: MetadataRoute.Sitemap = questionIds.map((id) => ({
    url: `${baseUrl}/question/${id}`,
    lastModified: now,
    changeFrequency: "yearly", // Questions don't change often
    priority: 0.5,             // Lower priority than hub pages
  }));

  // Combine and return
  return [...staticRoutes, ...questionRoutes];
}
