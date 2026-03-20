// scripts/extract-2025-full.ts
// Re-extracts all 100 questions from Prelims_2025_Set_A.pdf using Gemini File API.
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ GEMINI_API_KEY not found in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-3.1-pro-preview",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0,
    maxOutputTokens: 65536,
  },
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,        threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT,         threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,  threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,  threshold: HarmBlockThreshold.BLOCK_NONE },
  ],
});

async function main() {
  const pdfPath = path.join("/Users/mani/Desktop/upscpyq", "Prelims_2025_Set_A.pdf");
  if (!fs.existsSync(pdfPath)) {
    console.error("❌ PDF not found:", pdfPath);
    process.exit(1);
  }

  console.log("📤 Uploading 2025 PDF to Gemini File API...");
  const uploadResult = await fileManager.uploadFile(pdfPath, {
    mimeType: "application/pdf",
    displayName: "UPSC CSE 2025 Prelims Paper I Set A",
  });
  console.log("✅ Uploaded:", uploadResult.file.name);

  const prompt = `Extract ALL 100 questions from this UPSC 2025 Prelims Paper I PDF.

For each of the 100 questions (numbered 1-100) return:
- "questionText": the full question text (strip leading "N. " number prefix)
- "options": exactly 4 strings like "(a) text", "(b) text", "(c) text", "(d) text"
- "correctOption": null
- "subject": one of History, Geography, Economy, Environment, Polity, Science, Current Affairs, CSAT
- "year": 2025

Return JSON: { "questions": [ ... 100 objects ... ] }`;

  let result: any;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🤖 Gemini extraction attempt ${attempt}/3...`);
      result = await model.generateContent([
        { fileData: { mimeType: "application/pdf", fileUri: uploadResult.file.uri } },
        { text: prompt },
      ]);
      break;
    } catch (err: any) {
      console.warn(`  attempt ${attempt} failed:`, err.message ?? err);
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  const raw = result.response.text();
  console.log("📝 Response length:", raw.length, "chars");

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("❌ JSON parse failed:", e);
    fs.writeFileSync("data/2025-raw-response.txt", raw);
    console.log("   Raw response saved to data/2025-raw-response.txt");
    process.exit(1);
  }

  const questions: any[] = parsed.questions ?? (Array.isArray(parsed) ? parsed : []);
  console.log(`✅ Extracted ${questions.length} questions`);

  // Fix year — all should be 2025
  const fixed = questions.map((q: any) => ({ ...q, year: 2025 }));

  const outPath = path.join(process.cwd(), "data", "Prelims_2025_Set_A-extracted.json");
  fs.writeFileSync(outPath, JSON.stringify({ questions: fixed }, null, 2));
  console.log(`💾 Saved to ${outPath}`);

  // Quick summary
  const bySubject: Record<string, number> = {};
  for (const q of fixed) {
    bySubject[q.subject] = (bySubject[q.subject] ?? 0) + 1;
  }
  console.log("\n📊 Subject breakdown:");
  for (const [s, c] of Object.entries(bySubject)) {
    console.log(`   ${s}: ${c}`);
  }
}

main().catch(console.error);
