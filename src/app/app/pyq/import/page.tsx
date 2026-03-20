import Link from "next/link";
import { PyqImportClient } from "@/components/pyq/pyq-import-client";

export const dynamic = "force-dynamic";

export default function PyqImportPage() {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  const hasVisionKey = Boolean(process.env.GOOGLE_VISION_API_KEY);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="card p-6">
        <p className="text-sm font-semibold text-[var(--accent)]">PYQ import</p>
        <h1 className="heading mt-2 text-2xl">
          Upload images, extract questions
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          This importer uses Gemini Vision to extract questions from scanned paper images.
        </p>

        {!hasGeminiKey ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">Missing GEMINI_API_KEY</p>
            <p className="mt-1 leading-6">
              Add it to .env.local and restart the dev server.
            </p>
            <Link
              href="/app/pyq"
              className="mt-3 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
            >
              Back to PYQ library
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <PyqImportClient envStatus={{ hasGeminiKey, hasVisionKey }} />
          </div>
        )}
      </div>
    </div>
  );
}
