import { notFound } from "next/navigation";
import { ExamRunner } from "@/components/exam/exam-runner";
import { getTestBySlug } from "@/data/tests";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test = getTestBySlug(slug);

  if (!test) {
    notFound();
  }

  return <ExamRunner test={test} />;
}
