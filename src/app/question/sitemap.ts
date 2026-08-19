import type { MetadataRoute } from "next";
import { fetchIndexableQuestionSitemapEntries } from "@/lib/supabase/questions";

const baseUrl = "https://upscprelimstest.com";

// Served at /question/sitemap.xml — submit it in Search Console alongside
// /sitemap.xml. Keeping the long tail in its own file lets GSC report an index
// rate for question pages separately from the hub pages that can actually rank.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const questions = await fetchIndexableQuestionSitemapEntries();

  return questions.map((question) => ({
    url: `${baseUrl}/question/${question.id}`,
    lastModified: new Date(question.updated_at),
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));
}
