/**
 * Bulk PYQ CSV importer.
 *
 * Usage:
 *   npx tsx scripts/import-pyq-csv.ts data/pyq-csv/2025-gs1.csv
 *   npx tsx scripts/import-pyq-csv.ts data/pyq-csv/    # all CSVs in folder
 *
 * CSV format (header required):
 *   year,exam,question_number,question,option_a,option_b,option_c,option_d[,correct_option,subject,explanation,takeaway]
 *
 * - correct_option: A/B/C/D (optional — leave blank if no answer key)
 * - subject: one of the 8 UPSC subjects (optional — auto-assigned if blank)
 * - explanation, takeaway: optional text
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, extname, basename } from "node:path";
import { config } from "dotenv";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Subject auto-assignment ────────────────────────────────────

const SUBJECTS = [
  "Polity",
  "History",
  "Economy",
  "Geography",
  "Environment",
  "Science",
  "Current Affairs",
  "CSAT",
] as const;

type Subject = (typeof SUBJECTS)[number];

const SUBJECT_KEYWORDS: Record<Subject, string[]> = {
  Polity: [
    "constitution", "article", "fundamental right", "directive principle",
    "parliament", "lok sabha", "rajya sabha", "governor", "president",
    "supreme court", "high court", "amendment", "schedule", "panchayat",
    "municipality", "election commission", "cag", "upsc", "finance commission",
    "anti defection", "tenth schedule", "judicial review", "ordinance",
    "parliamentary privilege", "legislative", "federal", "lokpal",
    "money bill", "speaker", "attorney general",
  ],
  History: [
    "mughal", "british", "independence", "movement", "revolt", "gandhi",
    "nehru", "ashoka", "gupta", "maurya", "chola", "pallava", "vijayanagara",
    "delhi sultanate", "non cooperation", "civil disobedience", "quit india",
    "ancient india", "medieval", "raja ram mohan", "stupa", "pillar",
    "inscription", "fa hien", "hiuen tsang", "araghatta", "gandharva",
    "srivijaya", "rajendra", "mahendravarman", "permanent settlement",
  ],
  Economy: [
    "gdp", "inflation", "rbi", "reserve bank", "fiscal", "monetary",
    "budget", "tax", "gst", "investment", "capital receipt", "revenue",
    "bond", "stock", "market", "neft", "rtgs", "repo rate", "hedge fund",
    "venture capital", "alternative investment", "brsr", "circular economy",
    "capital account", "current account", "logistics", "niti aayog",
  ],
  Geography: [
    "river", "mountain", "plateau", "climate", "monsoon", "earthquake",
    "volcano", "ocean", "continent", "latitude", "longitude", "tropic",
    "equator", "isotherm", "atmosphere", "cyclone", "soil", "mineral",
    "andes", "nato", "lake", "lagoon", "continental drift", "dust particle",
    "permeability", "chalk", "clay", "offshore wind",
  ],
  Environment: [
    "biodiversity", "ecosystem", "forest", "wildlife", "conservation",
    "pollution", "climate change", "global warming", "carbon", "emission",
    "paris agreement", "cop", "renewable", "solar", "green hydrogen",
    "mangrove", "wetland", "national park", "sanctuary", "species",
    "tarantula", "direct air capture", "cement", "pm surya ghar",
    "nature solutions", "marine", "restoration",
  ],
  Science: [
    "dna", "gene", "cell", "protein", "enzyme", "vaccine", "antibody",
    "virus", "bacteria", "physics", "chemistry", "biology", "quantum",
    "semiconductor", "ai ", "artificial intelligence", "biotechnology",
    "space", "isro", "satellite", "gagan", "monoclonal", "gene editing",
    "lithium", "battery", "electric vehicle", "kavach", "rail",
    "oxygen", "photosynthesis",
  ],
  "Current Affairs": [
    "brics", "bimstec", "g20", "summit", "agreement", "treaty",
    "international year", "gandhi peace prize", "kho kho", "chess",
    "world cup", "rashtriya gokul", "mission", "policy", "act 2023",
    "act 2024", "ai action summit",
  ],
  CSAT: [
    "comprehension", "passage", "reasoning", "logical", "aptitude",
    "data interpretation", "arithmetic", "percentage", "ratio",
  ],
};

function autoAssignSubject(prompt: string): Subject {
  const lower = prompt.toLowerCase();
  const scores: [Subject, number][] = SUBJECTS.map((subject) => {
    const keywords = SUBJECT_KEYWORDS[subject];
    const matchCount = keywords.filter((kw) => lower.includes(kw)).length;
    return [subject, matchCount];
  });
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] > 0 ? scores[0][0] : "Current Affairs";
}

// ── CSV parser (handles quoted fields with commas) ─────────────

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

// ── Main import logic ──────────────────────────────────────────

type CSVRow = {
  year: number;
  exam: string;
  question_number: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option?: string;
  subject?: string;
  explanation?: string;
  takeaway?: string;
};

/** Join raw lines into logical CSV rows (handles multi-line quoted fields). */
function splitCSVRows(content: string): string[] {
  const rawLines = content.split("\n");
  const logicalRows: string[] = [];
  let current = "";

  for (const rawLine of rawLines) {
    if (!current) {
      current = rawLine;
    } else {
      current += "\n" + rawLine;
    }

    // A logical row is complete when the number of unescaped quotes is even
    const quoteCount = (current.match(/"/g) || []).length;
    if (quoteCount % 2 === 0) {
      if (current.trim()) logicalRows.push(current);
      current = "";
    }
  }

  if (current.trim()) logicalRows.push(current);
  return logicalRows;
}

function parseCSVFile(filePath: string): CSVRow[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = splitCSVRows(content);

  if (lines.length < 2) {
    console.warn(`  Skipping ${basename(filePath)}: no data rows`);
    return [];
  }

  const header = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_"),
  );

  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 8) continue;

    const get = (name: string) => {
      const idx = header.indexOf(name);
      return idx >= 0 && idx < fields.length ? fields[idx] : "";
    };

    const year = parseInt(get("year"), 10);
    const questionNumber = parseInt(get("question_number"), 10);

    if (!year || !questionNumber) continue;

    rows.push({
      year,
      exam: get("exam") || `UPSC Prelims GS1`,
      question_number: questionNumber,
      question: get("question"),
      option_a: get("option_a"),
      option_b: get("option_b"),
      option_c: get("option_c"),
      option_d: get("option_d"),
      correct_option: get("correct_option") || get("answer") || undefined,
      subject: get("subject") || undefined,
      explanation: get("explanation") || undefined,
      takeaway: get("takeaway") || undefined,
    });
  }

  return rows;
}

function normalizeOptionId(
  raw: string | undefined,
): "A" | "B" | "C" | "D" | undefined {
  if (!raw) return undefined;
  const upper = raw.trim().toUpperCase();
  if (["A", "B", "C", "D"].includes(upper))
    return upper as "A" | "B" | "C" | "D";
  // Handle "1"→"A", "2"→"B" etc.
  const map: Record<string, "A" | "B" | "C" | "D"> = {
    "1": "A", "2": "B", "3": "C", "4": "D",
  };
  return map[upper] ?? undefined;
}

async function importRows(rows: CSVRow[]) {
  let inserted = 0;
  const skipped = 0;
  let errors = 0;

  // Process in batches
  const BATCH_SIZE = 50;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const records = batch.map((row) => {
      const subject: Subject =
        (SUBJECTS.includes(row.subject as Subject)
          ? (row.subject as Subject)
          : undefined) ?? autoAssignSubject(row.question);

      const correctOption = normalizeOptionId(row.correct_option);
      const marks = subject === "CSAT" ? 2.5 : 2;
      const negativeMarks = subject === "CSAT" ? 0.83 : 0.67;

      return {
        source: "pyq" as const,
        subject,
        difficulty: "Moderate" as const,
        prompt: row.question,
        context_lines: [] as string[],
        options: [
          { id: "A", text: row.option_a },
          { id: "B", text: row.option_b },
          { id: "C", text: row.option_c },
          { id: "D", text: row.option_d },
        ],
        correct_option_id: correctOption ?? null,
        explanation: row.explanation ?? null,
        takeaway: row.takeaway ?? null,
        marks,
        negative_marks: negativeMarks,
        year: row.year,
        source_label: `${row.exam} ${row.year} Q${row.question_number}`,
      };
    });

    const { data, error } = await supabase
      .from("questions")
      .upsert(records, { onConflict: "source_label" })
      .select("id");

    if (error) {
      // If upsert fails (no unique constraint on source_label yet), try insert
      const { data: insertData, error: insertError } = await supabase
        .from("questions")
        .insert(records)
        .select("id");

      if (insertError) {
        console.error(`  Batch error: ${insertError.message}`);
        errors += batch.length;
      } else {
        inserted += insertData?.length ?? 0;
      }
    } else {
      inserted += data?.length ?? 0;
    }
  }

  return { inserted, skipped, errors };
}

// ── Entry point ────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.log("Usage: npx tsx scripts/import-pyq-csv.ts <file-or-directory>");
    console.log("Example: npx tsx scripts/import-pyq-csv.ts data/pyq-csv/2025-gs1.csv");
    console.log("Example: npx tsx scripts/import-pyq-csv.ts data/pyq-csv/");
    process.exit(0);
  }

  const target = resolve(process.cwd(), args[0]);
  let files: string[] = [];

  const stat = statSync(target);
  if (stat.isDirectory()) {
    files = readdirSync(target)
      .filter((f) => extname(f).toLowerCase() === ".csv")
      .map((f) => resolve(target, f))
      .sort();
  } else {
    files = [target];
  }

  if (!files.length) {
    console.log("No CSV files found.");
    process.exit(0);
  }

  console.log(`Found ${files.length} CSV file(s)\n`);

  let totalInserted = 0;
  let totalErrors = 0;

  for (const file of files) {
    console.log(`Processing: ${basename(file)}`);
    const rows = parseCSVFile(file);
    console.log(`  Parsed ${rows.length} questions`);

    if (!rows.length) continue;

    const result = await importRows(rows);
    console.log(
      `  Inserted: ${result.inserted}, Errors: ${result.errors}`,
    );
    totalInserted += result.inserted;
    totalErrors += result.errors;
  }

  console.log(`\nDone. Total inserted: ${totalInserted}, Total errors: ${totalErrors}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
