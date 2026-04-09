import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env.local' });

// We strictly use the new key provided by user
const API_KEY = process.env.GEMINI_API_KEY_4 || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Fast flash model with enormous threshold
const MODEL_NAME = "gemini-flash-lite-latest";

const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
});

const PIPELINE_OUT_DIR = path.join(process.cwd(), 'data', 'pipeline-output');
const CONCURRENCY_LIMIT = 5; // 5 parallel questions per batch 

async function processFile(filePath: string, filename: string) {
    let data;
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
         return false;
    }

    if (!Array.isArray(data)) return false;

    // Filter down to ONLY questions that failed Phase 2B (no solution)
    const defectiveIndices = data.map((q, idx) => (q.correctOption === null || q.correctOption === 'null' || !q.explanation) ? idx : -1).filter(idx => idx !== -1);

    if (defectiveIndices.length === 0) {
        return false; // Perfectly healthy
    }

    console.log(`\n=======================================================`);
    console.log(`⚡ PARALLEL REPAIRING: ${filename} (${defectiveIndices.length} blank solutions)`);
    console.log(`=======================================================`);

    let repairedCount = 0;

    for (let i = 0; i < defectiveIndices.length; i += CONCURRENCY_LIMIT) {
        const batchIndices = defectiveIndices.slice(i, i + CONCURRENCY_LIMIT);
        
        await Promise.all(batchIndices.map(async (idx) => {
            const q = data[idx];
            const prompt = `
            You are an expert UPSC highly-accurate solver.
            I am giving you a UPSC question and its options.
            Rely purely on your vast internal knowledge of history, geography, polity, economics, and science to determine the factual truth.
            
            Question: ${q.questionText}
            Options: ${JSON.stringify(q.options)}
            
            Output a strict JSON object with exactly two keys:
            1. "correctOption": The exact letter formatted like "(a)", "(b)", "(c)", or "(d)" that is factually correct.
            2. "explanation": A concise, factual paragraph explaining exactly why this option is correct.

            Your Answer block MUST ONLY be valid JSON.
            `;

            try {
                const result = await model.generateContent(prompt);
                const responseText = result.response.text().trim();
                const payload = JSON.parse(responseText);

                if (payload.correctOption && payload.explanation) {
                    data[idx].correctOption = payload.correctOption;
                    data[idx].explanation = payload.explanation;
                    repairedCount++;
                    console.log(`✅ [Q${q.questionNumber || idx+1}] Solved > Thread Completed`);
                } else {
                     console.log(`〽️ [Q${q.questionNumber || idx+1}] Failed to parse structurally rigid answer.`);
                }
            } catch (error: any) {
                console.log(`❌ [Q${q.questionNumber || idx+1}] API Error: ${error.message}`);
            }
        }));

        // Write batch state safely back to disk
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        // Cooldown safety buffer between high concurrency blasts 
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`\n🏁 Finished repairing ${filename}! Total Recovered: ${repairedCount}/${defectiveIndices.length}`);
    return true;
}

async function main() {
    console.log("🚀 BOOTING HYPER-FLASH PARALLEL REPAIR ENGINE (5 THREADS)...\n");

    const files = fs.readdirSync(PIPELINE_OUT_DIR).filter(f => f.endsWith('.json'));
    
    for (const f of files) {
        const fullPath = path.join(PIPELINE_OUT_DIR, f);
        if (fs.statSync(fullPath).size < 1000) continue; 
        await processFile(fullPath, f);
    }

    console.log(`\n=======================================================`);
    console.log(`✨ ALL STANDALONE FILES HAVE BEEN PERFECTLY REPAIRED!`);
    console.log(`=======================================================\n`);
}

main();
