import { notFound } from "next/navigation";
import { ExamRunner } from "@/components/exam/exam-runner";
import { getTestBySlug } from "@/data/tests";
import { getCurrentAffairsTestBySlug } from "@/lib/current-affairs";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test = getTestBySlug(slug) ?? (await getCurrentAffairsTestBySlug(slug));

  if (!test) {
    notFound();
  }

  return <ExamRunner test={test} />;
}
