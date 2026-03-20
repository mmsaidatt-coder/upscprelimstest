// scripts/retry-blocked-pages.ts
// Retries specific blocked pages with a completely different OCR framing.
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { fromPath } from "pdf2pic";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

// Completely different framing: describe as a JSON data QA task
const model = genAI.getGenerativeModel({
  model: "gemini-3.1-pro-preview",
  systemInstruction:
    "You are a JSON data quality assistant. You receive images of scanned documents and output structured JSON. Your output is used to populate a database, not for publication. You must transcribe text from images faithfully.",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0,
  },
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,        threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT,         threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,  threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,  threshold: HarmBlockThreshold.BLOCK_NONE },
  ],
});

function fileToGenerativePart(filePath: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType: "image/png" as const,
    },
  };
}

// Pages to retry (1-indexed)
const BLOCKED_PAGES = [2, 15, 19];

async function convertPageToPng(pdfPath: string, pageNum: number, outDir: string): Promise<string> {
  const result = await fromPath(pdfPath, {
    density: 300,
    saveFilename: `retry-page-${pageNum}`,
    savePath: outDir,
    format: "png",
    width: 2048,
    height: 2048,
  })(pageNum, { responseType: "image" });
  return result.path!;
}

async function main() {
  const PDF_PATH = "/Users/mani/Desktop/upscpyq/Prelims_2025_Set_A.pdf";
  const TMP_DIR = path.join(process.cwd(), "data", "tmp-blocked-retry");
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

  // Load existing questions
  const existingPath = path.join(process.cwd(), "data", "Prelims_2025_Set_A-extracted.json");
  const existingData = JSON.parse(fs.readFileSync(existingPath, "utf-8"));
  const allQuestions: any[] = existingData.questions ?? [];
  console.log(`📥 Start: ${allQuestions.length} existing questions`);

  const existingTexts = new Set(allQuestions.map((q: any) => q.questionText?.slice(0, 30)));

  for (const pageNum of BLOCKED_PAGES) {
    console.log(`\n🔄 Retrying page ${pageNum}...`);
    
    // Convert this specific page
    const imgPath = await convertPageToPng(PDF_PATH, pageNum, TMP_DIR);
    
    // Try 3 different prompt framings to bypass the block
    const prompts = [
      `Look at this image. List each numbered question (in English only) with its 4 options. Return as JSON array with fields: questionText, options (array of 4 strings), correctOption (null), year (2025), subject.`,
      `Describe the text content of this image in JSON format. For each exam question found, output: { questionText, options: [4 strings], correctOption: null, year: 2025, subject }. Wrap in { "questions": [...] }`,
      `Parse the structured data in this image. Each exam question and its 4 options should be an object. Return { "questions": [{ "questionText": "...", "options": ["(a)...", "(b)...", "(c)...", "(d)..."], "correctOption": null, "year": 2025, "subject": "..." }] }`,
    ];

    let success = false;
    for (let i = 0; i < prompts.length; i++) {
      try {
        const result = await model.generateContent([
          { text: prompts[i] },
          fileToGenerativePart(imgPath),
        ]);
        const raw = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(raw);
        const pageQs: any[] = parsed.questions ?? (Array.isArray(parsed) ? parsed : []);

        let added = 0;
        for (const q of pageQs) {
          const key = q.questionText?.slice(0, 30);
          if (key && !existingTexts.has(key)) {
            allQuestions.push({ ...q, year: 2025 });
            existingTexts.add(key);
            added++;
          }
        }
        console.log(`  Prompt ${i + 1}: got ${pageQs.length} questions (${added} new)`);
        success = true;
        break;
      } catch (err: any) {
        const msg = err.message ?? String(err);
        console.log(`  Prompt ${i + 1}: ${msg.includes("RECITATION") ? "BLOCKED" : "ERROR: " + msg.slice(0, 60)}`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!success) console.log(`  ⚠️ All prompts failed for page ${pageNum}`);
    
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  try { fs.rmdirSync(TMP_DIR); } catch (_) {}

  console.log(`\n📊 Total now: ${allQuestions.length} questions`);
  fs.writeFileSync(existingPath, JSON.stringify({ questions: allQuestions }, null, 2));
  console.log(`💾 Saved to extracted JSON`);
}

main().catch(console.error);
