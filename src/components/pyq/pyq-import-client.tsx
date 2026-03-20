"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ImportMode = "gemini_vision" | "vision_ocr";

type ImportResult = {
  ok: boolean;
  extractedCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  bankSize: number;
  warnings: string[];
};

function formatModeLabel(mode: ImportMode) {
  if (mode === "gemini_vision") {
    return "Gemini reads the image (easy)";
  }
  return "Vision OCR + Gemini (best)";
}

export function PyqImportClient({
  envStatus,
}: {
  envStatus: { hasGeminiKey: boolean; hasVisionKey: boolean };
}) {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [topics, setTopics] = useState("");
  const [mode, setMode] = useState<ImportMode>("gemini_vision");
  const [overwrite, setOverwrite] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const yearNumber = Number(year);
    const yearOk = Number.isFinite(yearNumber) && yearNumber > 1900 && yearNumber < 2100;
    const filesOk = files.length > 0;
    const keysOk = envStatus.hasGeminiKey && (mode === "gemini_vision" || envStatus.hasVisionKey);
    return yearOk && filesOk && keysOk && !busy;
  }, [busy, envStatus.hasGeminiKey, envStatus.hasVisionKey, files.length, mode, year]);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.set("year", year);
      formData.set("topics", topics);
      formData.set("mode", mode);
      if (overwrite) {
        formData.set("overwrite", "1");
      }
      files.forEach((file) => formData.append("files", file, file.name));

      const response = await fetch("/api/pyq/import", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as ImportResult | { error?: string } | null;

      if (!response.ok) {
        const message =
          payload && "error" in payload && payload.error
            ? payload.error
            : `Import failed (${response.status}).`;
        throw new Error(message);
      }

      setResult(payload as ImportResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Year
          </span>
          <input
            value={year}
            onChange={(event) => setYear(event.target.value)}
            inputMode="numeric"
            className="w-full rounded-[1.2rem] border border-black/10 bg-white/75 px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
            placeholder="2023"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Topics (optional)
          </span>
          <input
            value={topics}
            onChange={(event) => setTopics(event.target.value)}
            className="w-full rounded-[1.2rem] border border-black/10 bg-white/75 px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
            placeholder="Polity, Fundamental Rights"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Mode
          </span>
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as ImportMode)}
            className="w-full rounded-[1.2rem] border border-black/10 bg-white/75 px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
          >
            <option value="gemini_vision">{formatModeLabel("gemini_vision")}</option>
            <option value="vision_ocr" disabled={!envStatus.hasVisionKey}>
              {formatModeLabel("vision_ocr")}
            </option>
          </select>
          {!envStatus.hasVisionKey ? (
            <p className="text-xs leading-6 text-[var(--muted)]">
              Set <span className="font-semibold">GOOGLE_VISION_API_KEY</span> to enable Vision OCR mode.
            </p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Upload images
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            className="block w-full rounded-[1.2rem] border border-black/10 bg-white/75 px-4 py-3 text-sm font-semibold text-[var(--foreground)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--foreground)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--background-soft)]"
          />
          <p className="text-xs leading-6 text-[var(--muted)]">
            Tip: upload clear, un-cropped pages. Works best with one paper per image.
          </p>
        </label>
      </div>

      <label className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-black/10 bg-white/75 p-5">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Overwrite duplicates</p>
          <p className="mt-1 text-sm leading-7 text-[var(--muted)]">
            If a question id already exists in the bank, replace it with the newly extracted version.
          </p>
        </div>
        <input
          type="checkbox"
          checked={overwrite}
          onChange={(event) => setOverwrite(event.target.checked)}
          className="h-5 w-5 accent-[var(--foreground)]"
        />
      </label>

      {error ? (
        <div className="rounded-[1.6rem] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <p className="font-semibold">Import complete</p>
          <p className="mt-2">
            Extracted {result.extractedCount}. Inserted {result.insertedCount}
            {result.updatedCount ? `, updated ${result.updatedCount}` : ""}, skipped{" "}
            {result.skippedCount}. Bank size: {result.bankSize}.
          </p>
          {result.warnings?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-emerald-900/90">
              {result.warnings.slice(0, 6).map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/app/pyq"
              className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--background-soft)]"
            >
              Open PYQ library
            </Link>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="rounded-full bg-[var(--foreground)] px-6 py-4 text-sm font-semibold text-[var(--background-soft)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Importing..." : "Import now"}
        </button>
        <Link
          href="/app/pyq"
          className="rounded-full border border-black/10 bg-white/70 px-6 py-4 text-sm font-semibold text-[var(--foreground)] hover:bg-white/80"
        >
          Back
        </Link>
      </div>
    </div>
  );
}

