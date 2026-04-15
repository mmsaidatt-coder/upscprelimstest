import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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
    "constitution",
    "article",
    "fundamental right",
    "directive principle",
    "parliament",
    "lok sabha",
    "rajya sabha",
    "governor",
    "president",
    "supreme court",
    "high court",
    "amendment",
    "schedule",
    "panchayat",
    "ordinance",
    "lokpal",
    "finance commission",
    "inter-state council",
    "zonal council",
    "jury",
    "gandhi peace prize",
  ],
  History: [
    "raja ram mohan",
    "non-cooperation",
    "araghatta",
    "mattavilasa",
    "gunabhara",
    "fa-hien",
    "faxian",
    "srivijaya",
    "gandharva mahavidyalaya",
    "ashokan",
    "self-respect movement",
    "chauri chaura",
    "dancing girl",
    "portuguese",
    "ancient india",
    "gandhiji",
    "sedition",
    "civilization",
  ],
  Economy: [
    "investment",
    "bondholders",
    "stockholders",
    "rtgs",
    "neft",
    "reserve bank",
    "rbi",
    "fiscal deficit",
    "capital receipts",
    "revenue expenditure",
    "finance commission",
    "treasury bonds",
    "budget",
    "alternative investment funds",
    "borrowings",
    "crude oil",
    "petroleum",
    "minor minerals",
    "ibrd",
  ],
  Geography: [
    "weathering",
    "earth's rotation",
    "mallorca",
    "normandy",
    "sardinia",
    "time zones",
    "sumed pipeline",
    "botswana",
    "chile",
    "indonesia",
    "anadyr",
    "nome",
    "resource-rich",
    "instc",
    "rainfall",
  ],
  Environment: [
    "paris agreement",
    "climate change",
    "circular economy",
    "nature solutions finance hub",
    "direct air capture",
    "peacock tarantula",
    "wet-bulb",
    "cement",
    "cop28",
    "carbon dioxide emissions",
    "article 6",
    "planet earth",
    "plastic",
    "cassava",
    "ginger",
    "mint",
    "ecology",
  ],
  Science: [
    "electric vehicle batteries",
    "battery cathodes",
    "alternative powertrain vehicles",
    "uav",
    "unmanned aerial vehicles",
    "majorana 1",
    "monoclonal antibodies",
    "cl-20",
    "hmx",
    "llm-105",
    "gagan",
    "coal gasification",
    "virus",
    "chemical substances",
  ],
  "Current Affairs": [
    "brics",
    "bimstec",
    "pm surya ghar",
    "defence",
    "dornier-228",
    "il-76",
    "chess olympiad",
    "kho kho world cup",
    "ai action summit",
    "international year",
    "space missions",
    "gukesh",
    "gandhi peace prize",
  ],
  CSAT: [
    "comprehension",
    "logical reasoning",
    "data interpretation",
  ],
};

type CsvRow = {
  year: number;
  exam: string;
  questionNumber: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === "\"") {
        if (i + 1 < line.length && line[i + 1] === "\"") {
          current += "\"";
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === "\"") {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

function splitCSVRows(content: string): string[] {
  const rawLines = content.split("\n");
  const logicalRows: string[] = [];
  let current = "";

  for (const rawLine of rawLines) {
    current = current ? `${current}\n${rawLine}` : rawLine;

    const quoteCount = (current.match(/"/g) || []).length;
    if (quoteCount % 2 === 0) {
      if (current.trim()) logicalRows.push(current);
      current = "";
    }
  }

  if (current.trim()) {
    logicalRows.push(current);
  }

  return logicalRows;
}

function normalizePrompt(prompt: string): string {
  return prompt.replace(/^\d+\.\s*/, "").replace(/\s+/g, " ").trim();
}

function autoAssignSubject(prompt: string): Subject {
  const lower = prompt.toLowerCase();
  const scores: [Subject, number][] = SUBJECTS.map((subject) => {
    const keywords = SUBJECT_KEYWORDS[subject];
    const score = keywords.filter((keyword) => lower.includes(keyword)).length;
    return [subject, score];
  });

  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] > 0 ? scores[0][0] : "Current Affairs";
}

function parseCsv(filePath: string): CsvRow[] {
  const content = readFileSync(filePath, "utf8");
  const rows = splitCSVRows(content);
  const header = parseCSVLine(rows[0]).map((column) =>
    column.toLowerCase().replace(/\s+/g, "_"),
  );

  const getIndex = (name: string) => {
    const index = header.indexOf(name);
    if (index === -1) {
      throw new Error(`Missing required CSV column: ${name}`);
    }
    return index;
  };

  const yearIdx = getIndex("year");
  const examIdx = getIndex("exam");
  const questionNumberIdx = getIndex("question_number");
  const questionIdx = getIndex("question");
  const optionAIdx = getIndex("option_a");
  const optionBIdx = getIndex("option_b");
  const optionCIdx = getIndex("option_c");
  const optionDIdx = getIndex("option_d");

  return rows.slice(1).map((row) => {
    const fields = parseCSVLine(row);
    return {
      year: Number(fields[yearIdx]),
      exam: fields[examIdx],
      questionNumber: Number(fields[questionNumberIdx]),
      question: fields[questionIdx],
      optionA: fields[optionAIdx],
      optionB: fields[optionBIdx],
      optionC: fields[optionCIdx],
      optionD: fields[optionDIdx],
    };
  });
}

function validateRows(rows: CsvRow[]) {
  if (rows.length !== 100) {
    throw new Error(`Expected 100 rows in 2025 CSV, found ${rows.length}`);
  }

  const prompts = new Set<string>();
  const questionNumbers = new Set<number>();

  for (const row of rows) {
    if (row.year !== 2025) {
      throw new Error(`Unexpected year ${row.year} in 2025 CSV`);
    }
    if (!row.questionNumber || row.questionNumber < 1 || row.questionNumber > 100) {
      throw new Error(`Invalid question number ${row.questionNumber}`);
    }
    if (questionNumbers.has(row.questionNumber)) {
      throw new Error(`Duplicate question number ${row.questionNumber} in CSV`);
    }

    const normalizedPrompt = normalizePrompt(row.question);
    if (!normalizedPrompt) {
      throw new Error(`Question ${row.questionNumber} has an empty prompt`);
    }
    if (prompts.has(normalizedPrompt)) {
      throw new Error(`Duplicate prompt detected in CSV at Q${row.questionNumber}`);
    }

    questionNumbers.add(row.questionNumber);
    prompts.add(normalizedPrompt);
  }

  for (let questionNumber = 1; questionNumber <= 100; questionNumber++) {
    if (!questionNumbers.has(questionNumber)) {
      throw new Error(`Missing question number Q${questionNumber} in CSV`);
    }
  }
}

async function main() {
  const year = 2025;
  const slug = `upsc-cse-prelims-${year}-paper-1`;
  const title = `UPSC CSE Prelims ${year} (Paper 1)`;
  const csvPath = resolve(process.cwd(), "data", "pyq-csv", "2025-gs1-complete.csv");

  const rawRows = parseCsv(csvPath).sort((a, b) => a.questionNumber - b.questionNumber);
  validateRows(rawRows);

  console.log(`Loaded ${rawRows.length} canonical CSV rows for ${year}`);

  const { data: existingTemplate } = await supabase
    .from("test_templates")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingTemplate?.id) {
    await supabase.from("test_template_questions").delete().eq("template_id", existingTemplate.id);
    await supabase.from("test_templates").delete().eq("id", existingTemplate.id);
    console.log(`Removed existing template ${slug}`);
  }

  await supabase.from("questions").delete().eq("year", year).eq("source", "pyq");
  console.log("Removed existing 2025 PYQ rows");

  const { data: template, error: templateError } = await supabase
    .from("test_templates")
    .insert({
      slug,
      title,
      tagline: `Official Previous Year Question Paper for ${year}.`,
      description: `Full length test for the year ${year} based on official UPSC questions.`,
      duration_minutes: 120,
      question_count: 100,
    })
    .select("id")
    .single();

  if (templateError || !template) {
    throw new Error(`Failed to create template: ${templateError?.message ?? "unknown error"}`);
  }

  for (const row of rawRows) {
    const prompt = normalizePrompt(row.question);
    const subject = autoAssignSubject(prompt);

    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({
        source: "pyq",
        subject,
        difficulty: "Moderate",
        prompt,
        context_lines: [],
        options: [
          { id: "A", text: row.optionA.trim() },
          { id: "B", text: row.optionB.trim() },
          { id: "C", text: row.optionC.trim() },
          { id: "D", text: row.optionD.trim() },
        ],
        correct_option_id: null,
        explanation: null,
        takeaway: null,
        marks: 2,
        negative_marks: 0.67,
        year,
        source_label: `${row.exam} ${year} Q${row.questionNumber}`,
      })
      .select("id")
      .single();

    if (questionError || !question) {
      throw new Error(
        `Failed to insert Q${row.questionNumber}: ${questionError?.message ?? "unknown error"}`,
      );
    }

    const { error: mappingError } = await supabase.from("test_template_questions").insert({
      template_id: template.id,
      question_id: question.id,
      ordinal: row.questionNumber,
    });

    if (mappingError) {
      throw new Error(
        `Failed to map Q${row.questionNumber} into template: ${mappingError.message}`,
      );
    }
  }

  console.log(`Rebuilt ${slug} from canonical CSV`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
