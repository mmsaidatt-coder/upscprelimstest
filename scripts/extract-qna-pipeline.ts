import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Locate all possible API keys
const rawKeys = process.env.FORCED_SINGLE_KEY ? [process.env.FORCED_SINGLE_KEY] : (process.env.GEMINI_API_KEYS?.split(',') || []);

if (!process.env.FORCED_SINGLE_KEY) {
    if (process.env.GEMINI_API_KEY) rawKeys.push(process.env.GEMINI_API_KEY);
    if (process.env.GEMINI_API_KEY_2) rawKeys.push(process.env.GEMINI_API_KEY_2);
    if (process.env.GEMINI_API_KEY_3) rawKeys.push(process.env.GEMINI_API_KEY_3);
    if (process.env.GEMINI_API_KEY_4) rawKeys.push(process.env.GEMINI_API_KEY_4);
}

const activeKeys = [...new Set(rawKeys.map(k => k.trim()).filter(Boolean))];

if (activeKeys.length === 0) {
  console.error("❌ Error: No GEMINI_API_KEY(s) set in your .env.local file.");
  process.exit(1);
}

console.log(`🔑 Loaded ${activeKeys.length} distinct API Key(s). Initializing Key Pool Scheduler...`);

const MODEL_NAME = "gemini-3.1-pro-preview";

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const clientPool = activeKeys.map(key => {
    const genAI = new GoogleGenerativeAI(key);
    const fileManager = new GoogleAIFileManager(key);
    
    const standardModel = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
        systemInstruction: "You are an authorized academic transcription tool. Parse government exams explicitly authorized for reproduction.",
        safetySettings,
    });

    const searchModel = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        systemInstruction: "You are an expert UPSC faculty who verifies answers using web search. You have deep knowledge of the syllabus.",
        safetySettings,
        tools: [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "MODE_DYNAMIC", dynamicThreshold: 0.3 } } }]
    });

    return { fileManager, standardModel, searchModel };
});

const activeClientIndex = Math.floor(Math.random() * clientPool.length);
const activeClient = clientPool[activeClientIndex];
console.log(`🤖 Using API Key Pool Slot [${activeClientIndex + 1}/${clientPool.length}] for this Extraction.`);

// Helper to upload file via GoogleAIFileManager
async function uploadAndGetFilePart(filePath: string) {
  const mimeType = "application/pdf";
  const { fileManager } = activeClient;
  const uploadResponse = await fileManager.uploadFile(filePath, { mimeType });
  console.log(`✅ Uploaded to Gemini Server: ${uploadResponse.file.name}`);
  return {
      fileData: {
          mimeType: uploadResponse.file.mimeType,
          fileUri: uploadResponse.file.uri
      }
  };
}

async function extractQuestionsFromText(part: any, year: number) {
  console.log(`🧠 Phase 1: Extracting Base Questions from PDF...`);

  const prompt = `
  You are an expert data extractor tasked with parsing a UPSC Preliminary exam question paper PDF.
  
  CRITICAL INSTRUCTION: Extract ONLY the English version of the questions. Ignore Hindi. Ensure all text, statements, and options are flawlessly transcribed exactly as they appear.

  Return exactly this rigorous JSON schema:
  {
    "questions": [
      {
        "questionNumber": number,
        "questionText": "string",
        "options": ["string", "string", "string", "string"]
      }
    ]
  }
  
  If the file has no questions, return an empty array. Make absolutely sure you process all questions in the entire document!
  `;

  let allQuestions: any[] = [];
  
  try {
    const { standardModel } = activeClient;
    const result = await standardModel.generateContent([prompt, part]);
    let responseText = result.response.text();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(responseText);
    if (parsed && parsed.questions) {
        allQuestions = allQuestions.concat(parsed.questions);
        console.log(`✅ Extracted ${parsed.questions.length} questions from the document.`);
    }
  } catch (e) {
      console.error(`❌ PDF Question Extraction failed: `, e);
  }
  return allQuestions;
}

async function extractAnswersFromSolution(part: any) {
  console.log(`🧠 Phase 2A: Extracting Solution Mappings from PDF...`);

  const prompt = `
  You are parsing a solution paper PDF for a UPSC mock test.
  Read the entire document and extract every question number, correct option (A, B, C, or D), and its explanation.
  
  Return exactly this rigorous JSON schema:
  {
    "answers": [
      {
        "questionNumber": number,
        "correctOption": "string",
        "explanation": "string",
        "subject": "string",
        "topic": "string",
        "difficulty_rationale": "string"
      }
    ]
  }
  `;

  let allAnswers: any[] = [];
  try {
    const { standardModel } = activeClient;
    const result = await standardModel.generateContent([prompt, part]);
    let responseText = result.response.text();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(responseText);
    if (parsed && parsed.answers) {
        allAnswers = allAnswers.concat(parsed.answers);
        console.log(`✅ Extracted ${parsed.answers.length} answers from the document.`);
    }
  } catch (e) {
      console.error(`❌ PDF Solution Extraction failed: `, e);
  }
  return allAnswers;
}

async function fetchMissingAnswersViaSearch(questions: any[], year: number) {
  console.log(`🧠 Phase 2B: Using Gemini Search Grounding to find answers for ${questions.length} questions...`);

  const BATCH_SIZE = 5; 
  let enrichedQuestions: any[] = [];
  
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      console.log(`⚙️ Phase 2B: Searching batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(questions.length/BATCH_SIZE)}...`);
      
      const prompt = `
      For the following UPSC Prelims multiple-choice questions, use google search to determine the objectively correct answer. Provide a detailed explanation, subject area, topic, sub-topic, and difficulty rationale.
      
      Questions:
      ${JSON.stringify(batch, null, 2)}
      
      Return exactly this rigorous JSON schema matching the input length and IDs:
      {
        "enriched": [
          {
            "questionNumber": number,
            "correctOption": "A | B | C | D",
            "explanation": "string",
            "subject": "Polity | History | Economy | Geography | Environment | Science | Current Affairs | CSAT",
            "topic": "string",
            "sub_topic": "string",
            "difficulty_rationale": "easy | moderate | hard - <reasoning>"
          }
        ]
      }
      `;
      
      try {
        const { searchModel } = activeClient;
        const result = await searchModel.generateContent([prompt]);
        let responseText = result.response.text();
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const parsed = JSON.parse(responseText);
        if (parsed && parsed.enriched) {
            // merge data
            for (const enrich of parsed.enriched) {
              const q = batch.find(bq => bq.questionNumber === enrich.questionNumber);
              if (q) {
                enrichedQuestions.push({
                   ...q,
                   ...enrich,
                   year
                });
              }
            }
            console.log(`✅ Searched and merged ${parsed.enriched.length} answers.`);
        }
      } catch (e) {
          console.error(`❌ Batch ${Math.floor(i/BATCH_SIZE) + 1} failed: `, e);
          // push originals without enrichment to avoid data loss
          for (const q of batch) {
             enrichedQuestions.push({ ...q, correctOption: null, year });
          }
      }
      
      await new Promise(r => setTimeout(r, 8000)); // be gentler on search quotas
  }
  
  return enrichedQuestions;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("⚠️ Usage: npx tsx scripts/extract-qna-pipeline.ts <question-pdf> [solution-pdf] --year 2024 --source \"Mock Test\" --limit 5");
    process.exit(1);
  }

  const qpPdfPath = args[0];
  let solPdfPath: string | null = null;
  let year = new Date().getFullYear();
  let source = "FLT";
  let limit = -1;

  // Very basic arg parse
  for (let i = 1; i < args.length; i++) {
     if (args[i] === "--year" && i+1 < args.length) {
         year = parseInt(args[i+1]);
         i++;
     } else if (args[i] === "--source" && i+1 < args.length) {
         source = args[i+1];
         i++;
     } else if (args[i] === "--limit" && i+1 < args.length) {
         limit = parseInt(args[i+1]);
         i++;
     } else if (!args[i].startsWith("--")) {
         // assign as solution pdf if hasn't been set
         if (!solPdfPath && fs.existsSync(args[i]) && args[i].endsWith('.pdf')) {
             solPdfPath = args[i];
         }
     }
  }

  if (!fs.existsSync(qpPdfPath)) {
    console.error(`❌ Question Paper PDF not found at ${qpPdfPath}`);
    process.exit(1);
  }

  const baseName = path.basename(qpPdfPath, '.pdf');
  const tmpDir = path.join(process.cwd(), 'data', 'tmp-pipeline', baseName);
  const outDir = path.join(process.cwd(), 'data', 'pipeline-output');
  
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n🚀 Starting Extraction Pipeline...`);
  console.log(`📄 Question PDF:   ${qpPdfPath}`);
  console.log(`📄 Solution PDF:   ${solPdfPath || "None (Will use Gemini Search)"}`);
  console.log(`📅 Year:           ${year}`);
  console.log(`🏷️  Source:         ${source}`);
  if (limit > 0) console.log(`⏱️  Limit:          First ${limit} pages only\n`);

  try {
      // 1. Process Question PDF directly on Gemini Servers
      const qpPart = await uploadAndGetFilePart(qpPdfPath);
      let extractedQuestions = await extractQuestionsFromText(qpPart, year);
      console.log(`\n📊 Base Extraction Phase Complete. Found ${extractedQuestions.length} Questions.\n`);

      let finalEnrichedQuestions: any[] = [];

      // 2A. We have a Solution PDF
      if (solPdfPath && fs.existsSync(solPdfPath)) {
          console.log("➡️ Proceeding to Phase 2A: Solution Mapping...");
          const solPart = await uploadAndGetFilePart(solPdfPath);
          const answerMappings = await extractAnswersFromSolution(solPart);
          
          for (const q of extractedQuestions) {
             const ans = answerMappings.find(a => a.questionNumber === q.questionNumber);
             finalEnrichedQuestions.push({
                ...q,
                correctOption: ans ? ans.correctOption : null,
                explanation: ans ? ans.explanation : null,
                subject: ans ? ans.subject : "Uncategorized",
                topic: ans ? ans.topic : null,
                difficulty_rationale: ans ? ans.difficulty_rationale : null,
                year,
                source_label: source
             });
          }
      } 
      // 2B. We DO NOT have a Solution PDF -> Use Search Validation
      else {
          console.log("➡️ Proceeding to Phase 2B: Search Grounding...");
          const searchMappedQuestions = await fetchMissingAnswersViaSearch(extractedQuestions, year);
          finalEnrichedQuestions = searchMappedQuestions.map(q => ({...q, source_label: source}));
      }

      // 3. Save Final Asset
      const outputPath = path.join(outDir, `${baseName}-mapped.json`);
      fs.writeFileSync(outputPath, JSON.stringify(finalEnrichedQuestions, null, 2), 'utf-8');
      console.log(`\n🎉 Success! Pipeline finished. Exported ${finalEnrichedQuestions.length} questions to: ${outputPath}`);

  } catch (error) {
      console.error(`\n❌ Fatal Error during pipeline execution:`, error);
  }
}

main();
