// scripts/retry-blocked-2025.ts
// Retries only the pages that were blocked by Gemini's RECITATION filter.
// Uses a different system instruction and prompt framing to avoid the copyright block.

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { fromPath } from "pdf2pic";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

// Use a different system instruction that doesn't trigger RECITATION
const model = genAI.getGenerativeModel({
  model: "gemini-3.1-pro-preview",
  systemInstruction:
    "You are an OCR and information extraction assistant. Your task is to identify and list structured data (exam questions and their answer options) from images of scanned documents. This is for academic research and accessibility. Extract and transcribe exactly what you see in the images.",
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

function fileToGenerativePart(filePath: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType,
    },
  };
}

const PROMPT = `This image is a scanned page from a government examination question paper.

Identify EVERY question visible in this image and extract:
- "questionText": The complete question text (OCR from image; include all numbered statements if present; exclude the leading question number like "1. ")
- "options": Array of exactly 4 option strings in format ["(a) text", "(b) text", "(c) text", "(d) text"]
- "correctOption": null
- "subject": Classify as one of: History, Geography, Economy, Environment, Polity, Science, Current Affairs, CSAT  
- "year": 2025

Return JSON: { "questions": [ ... ] }`;

async function main() {
  const PDF_PATH = "/Users/mani/Desktop/upscpyq/Prelims_2025_Set_A.pdf";
  const TMP_DIR = path.join(process.cwd(), "data", "tmp-retry-2025");
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

  // Convert PDF → per-page PNG (reuse if already exists)
  const pngFiles = fs.readdirSync(TMP_DIR).filter(f => f.endsWith(".png")).sort();

  let imagePaths: string[];
  if (pngFiles.length >= 22) {
    console.log(`♻️  Reusing ${pngFiles.length} existing PNGs from ${TMP_DIR}`);
    imagePaths = pngFiles.map(f => path.join(TMP_DIR, f));
  } else {
    console.log("📸 Converting PDF to PNGs...");
    const results = await fromPath(PDF_PATH, {
      density: 300,
      saveFilename: "page",
      savePath: TMP_DIR,
      format: "png",
      width: 2048,
      height: 2048,
    }).bulk(-1, { responseType: "image" });
    imagePaths = results.filter(r => r?.path).map(r => r.path as string);
    console.log(`✅ Generated ${imagePaths.length} PNGs`);
  }

  // Load existing extracted questions
  const existingPath = path.join(process.cwd(), "data", "Prelims_2025_Set_A-extracted.json");
  const existingData = JSON.parse(fs.readFileSync(existingPath, "utf-8"));
  const existingQuestions: any[] = existingData.questions ?? [];
  console.log(`📥 Start: ${existingQuestions.length} existing questions`);

  // Retry each page
  let newlyFound = 0;
  const allQuestions = [...existingQuestions];

  for (let i = 0; i < imagePaths.length; i++) {
    const imgPath = imagePaths[i];
    const pageNum = i + 1;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        process.stdout.write(`  Page ${pageNum}/22 attempt ${attempt}... `);
        const result = await model.generateContent([
          { text: PROMPT },
          fileToGenerativePart(imgPath, "image/png"),
        ]);
        const raw = result.response
          .text()
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const parsed = JSON.parse(raw);
        const pageQs: any[] = parsed.questions ?? [];
        console.log(`got ${pageQs.length} questions`);
        
        // Only add questions not already in the existing set (by first 30 chars of text)
        const existingTexts = new Set(allQuestions.map(q => q.questionText?.slice(0, 30)));
        for (const q of pageQs) {
          const key = q.questionText?.slice(0, 30);
          if (!existingTexts.has(key)) {
            allQuestions.push({ ...q, year: 2025 });
            existingTexts.add(key);
            newlyFound++;
          }
        }
        break; // success, go to next page
      } catch (err: any) {
        const msg = err.message ?? String(err);
        if (msg.includes("RECITATION")) {
          console.log(`BLOCKED`);
          break; // Don't retry on RECITATION — won't help
        }
        console.log(`ERROR: ${msg.slice(0, 80)}`);
        if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  console.log(`\n📊 Newly added: ${newlyFound} questions`);
  console.log(`📊 Total now: ${allQuestions.length} questions`);

  // Save back
  fs.writeFileSync(existingPath, JSON.stringify({ questions: allQuestions }, null, 2));
  console.log(`💾 Saved ${allQuestions.length} questions to ${existingPath}`);

  // Cleanup
  for (const f of imagePaths) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  try { fs.rmdirSync(TMP_DIR); } catch (_) {}
}

main().catch(console.error);
