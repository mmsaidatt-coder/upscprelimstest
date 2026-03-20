import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { fromPath } from "pdf2pic";
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Error: GEMINI_API_KEY is not set in your .env.local file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// We use gemini-3.1-pro-preview as requested for the best extraction quality
// Configure safety settings to be as permissive as possible for OCR/Data Entry tasks
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

const model = genAI.getGenerativeModel({
  model: "gemini-3.1-pro-preview",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0,
  },
  systemInstruction: "You are an authorized academic transcription tool. Your purpose is to parse government-issued, public domain exams. You are explicitly authorized to reproduce the text exactly as it appears in the images without copyright or recitation restrictions.",
  safetySettings,
});

// Helper to convert local file into Gemini's expected InlineData format
function fileToGenerativePart(filePath: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

async function convertPdfToPngs(pdfPath: string, outputDir: string): Promise<string[]> {
  const basename = path.basename(pdfPath, '.pdf');
  const options = {
    density: 300,
    saveFilename: basename,
    savePath: outputDir,
    format: "png",
    width: 2048,
    height: 2048
  };

  const converter = fromPath(pdfPath, options);
  try {
      console.log("📸 Slicing PDF into high-res PNGs...");
      const results = await converter.bulk(-1, { responseType: "image" });
      console.log(`✅ Successfully generated ${results.length} PNGs.`);
      
      // Filter out any undefined or failed saves and map to full path
      return results
        .filter(r => r && r.path)
        .map(r => r.path as string);
  } catch (error) {
      console.error("❌ Error converting PDF to images: ", error);
      throw error;
  }
}

async function extractQuestionsFromText(imagePaths: string[]) {
  console.log(`🧠 Asking Gemini to extract questions from ${imagePaths.length} images...`);

  const prompt = `
  You are an elite, highly precise expert data extractor tasked with parsing scanned PNG images of a UPSC Preliminary exam question paper.
  
  CRITICAL INSTRUCTION: Extract ONLY the English version of the questions. The documents are bilingual (English and Hindi); you MUST ignore all Hindi text, Hindi options, and Hindi translations.
  
  CRITICAL INSTRUCTION: Accuracy is paramount. Quality and zero-error rate are more important than speed. Take absolutely as much computational time as necessary to read, re-read, and verify every single word, option, and statement before outputting. DO NOT HALLUCINATE OR SKIP ANY CONTENT.

  Your task is to extract EVERY question (in English ONLY) from these images and return them in a strictly formatted JSON array.

  Detailed Instructions for Flawless Extraction:
  1. Extract the full text of the question into "questionText". If the question has multiple statements (e.g., Statement 1, 2, 3), include them all clearly formulated. Use \n for line breaks exactly where they logically appear in the images so the structure is maintained. Do not miss any "Which of the above are correct?" clauses.
  2. Extract all options (usually A, B, C, D) into the "options" array as plain strings. Example: "[(a) 1 only", "(b) 1 and 2 only", etc.]. Do not just put the letter, put the FULL text of the option as it appears. Ensure the strings are clean and include the label.
  3. If there is no indication of the correct answer (e.g., an answer key is not attached), leave "correctOption" as null. If there is an answer key or a clear mark, put the correct letter (e.g. "A").
  4. "year": Identify the year of the exam (e.g., 2020).
  5. "subject": Categorise clearly into: "History", "Geography", "Economics", "Environment", "Polity", "Science & Tech", or "Current Affairs".
  6. If a question spans across multiple images in a batch, synthesize it correctly.
  
  Return exactly this rigorous JSON schema:
  {
    "questions": [
      {
        "questionText": "string",
        "options": ["string", "string", "string", "string"],
        "correctOption": "string | null",
        "year": number,
        "subject": "string"
      }
    ]
  }
  
  Proceed with absolute caution. Double check your transcriptions.
  `;

  // Process images one-by-one to avoid recitation blocks and payload limits
  const BATCH_SIZE = 1;
  let allQuestions: any[] = [];
  
  for (let i = 0; i < imagePaths.length; i += BATCH_SIZE) {
      const batchPaths = imagePaths.slice(i, i + BATCH_SIZE);
      console.log(`⚙️ Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(imagePaths.length/BATCH_SIZE)}...`);
      
      const imageParts = batchPaths.map(img => fileToGenerativePart(img, "image/png"));
      
      try {
        const result = await model.generateContent([
            prompt,
            ...imageParts
        ]);
        
        let responseText = result.response.text();
        
        // Strip out markdown code blocks if the AI wrapped it
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const parsed = JSON.parse(responseText);
        if (parsed && parsed.questions) {
            allQuestions = allQuestions.concat(parsed.questions);
            console.log(`✅ Extracted ${parsed.questions.length} questions from this batch.`);
        }
      } catch (e) {
          console.error(`❌ Batch ${Math.floor(i/BATCH_SIZE) + 1} failed: `, e);
      }
  }

  console.log(`✅ Total extraction complete!`);
  return JSON.stringify({ questions: allQuestions }, null, 2);
}

async function processSinglePdf(pdfPath: string) {
    // Create temporary directory for PNG slices
    const tmpDir = path.join(process.cwd(), 'data', 'tmp-slices', path.basename(pdfPath, '.pdf'));
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    console.log(`\n🚀 Processing: ${pdfPath}`);
    
    try {
        // 1. Convert to PNGs
        const imagePaths = await convertPdfToPngs(pdfPath, tmpDir);
        
        if (imagePaths.length === 0) {
            console.error("❌ No images generated.");
            return;
        }

        // 2. Extract with Gemini
        const jsonString = await extractQuestionsFromText(imagePaths);
        
        // 3. Save
        if (jsonString) {
            const basename = path.basename(pdfPath, '.pdf');
            const outputPath = path.join(process.cwd(), 'data', `${basename}-extracted.json`);
            
            fs.writeFileSync(outputPath, jsonString, 'utf-8');
            console.log(`\n🎉 Success! Extracted JSON saved to: ${outputPath}`);
            
            const data = JSON.parse(jsonString);
            console.log(`📊 TOTAL Extracted: ${data.questions?.length || 0} questions.`);
        }
        
        // 4. Clean up temporary PNGs
        console.log("🧹 Cleaning up temporary images...");
        for (const img of imagePaths) {
            if (fs.existsSync(img)) fs.unlinkSync(img);
        }
        // Remove tmpDir if empty
        try { fs.rmdirSync(tmpDir); } catch(e) {}
        
    } catch (error) {
        console.error(`❌ Fatal error during pipeline execution for ${pdfPath}`, error);
    }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("⚠️ Usage: npx tsx scripts/extract-pyqs.ts <path-to-pdf-or-directory>");
    process.exit(1);
  }

  const inputPath = args[0];
  
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Path not found at ${inputPath}`);
    process.exit(1);
  }

  const stats = fs.statSync(inputPath);
  
  if (stats.isDirectory()) {
      const files = fs.readdirSync(inputPath).filter(f => f.toLowerCase().endsWith('.pdf'));
      console.log(`📂 Found ${files.length} PDFs in directory. Starting batch process...`);
      for (const file of files) {
          const pdfPath = path.join(inputPath, file);
          const basename = path.basename(pdfPath, '.pdf');
          const outputPath = path.join(process.cwd(), 'data', `${basename}-extracted.json`);
          
          if (fs.existsSync(outputPath)) {
              const stats = fs.statSync(outputPath);
              if (stats.size > 20000) { // Robust check: full papers are usually > 50kb, partial/failures are smaller
                  console.log(`⏩ Skipping ${file} (Already processed)`);
                  continue;
              }
          }
          await processSinglePdf(pdfPath);
      }
  } else {
      await processSinglePdf(inputPath);
  }
}

main();
