import { ResultClient } from "@/components/exam/result-client";

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  return <ResultClient attemptId={attemptId} />;
}
