import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env.local' });

// Using the strict fresh key provided by the user
const API_KEY = process.env.GEMINI_API_KEY_4 || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const MODEL_NAME = "gemini-3.1-pro-preview"; // High fidelity reasoning model

const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
});

const PIPELINE_OUT_DIR = path.join(process.cwd(), 'data', 'pipeline-output');

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

async function main() {
    console.log("🔍 INITIATING BATCHED AI AUDIT ON 500 RANDOM QUESTIONS...\n");

    const files = fs.readdirSync(PIPELINE_OUT_DIR)
        .filter(f => f.endsWith('.json') && fs.statSync(path.join(PIPELINE_OUT_DIR, f)).size > 50000); 
    
    if (files.length === 0) {
        console.log("❌ No substantial mapped JSON files found for auditing.");
        return;
    }

    let allQuestions: any[] = [];
    console.log(`Gathering data from ${files.length} exams...`);

    // Only sample from a few random heavy files to avoid 1GB memory spikes, 
    // we need 500 questions, meaning we can grab the first 10 random files.
    const shuffledFiles = files.sort(() => 0.5 - Math.random()).slice(0, 10);

    for (const f of shuffledFiles) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(PIPELINE_OUT_DIR, f), 'utf-8'));
            allQuestions.push(...data);
        } catch { } // skip corrupt
    }

    if (allQuestions.length < 500) {
         console.log(`Not enough valid questions collected. Found ${allQuestions.length}`);
         return;
    }

    // Shuffle pool and take front 500
    const finalSample = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 500);

    // Batch them into chunks of 25
    const batches = chunkArray(finalSample, 25);
    console.log(`🧠 Successfully formed ${batches.length} verification batches (25 questions each).\n`);

    let totalPerfect = 0;
    let totalFailed = 0;

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`\n========================================`);
        console.log(`🔎 AUDITING BATCH ${i + 1}/${batches.length}...`);
        console.log(`========================================`);

        const prompt = `
        You are a highly acclaimed UPSC Quality Assurance Verifier.
        I am going to provide you an array of 25 extracted UPSC questions in JSON format.
        Your job is to rigorously verify each question logically.
        For each question, check:
        1. Does the Question Text realistically make sense?
        2. Are there exactly 4 distinct options provided?
        3. Specifically, does the 'explanation' completely and accurately justify the 'correctOption' logically?
        
        You must return a JSON object containing exactly two keys:
        - "perfectCount": Integer representing how many questions out of 25 were absolutely perfect.
        - "failedList": Array of reasons for any questions that failed. If none failed, return an empty array.

        Here is the JSON batch:
        ${JSON.stringify(batch, null, 2)}
        `;

        try {
            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();
            const payload = JSON.parse(responseText);

            const perfect = payload.perfectCount || 0;
            const failed = 25 - perfect;

            totalPerfect += perfect;
            totalFailed += failed;

            console.log(`✅ Batch ${i + 1} Result --> Set Scored: ${perfect} Perfect | ${failed} Defective`);
            if (payload.failedList && payload.failedList.length > 0) {
                console.log(`   Defects reported:`, payload.failedList);
            }

            // Cool down heavily so we don't trip limits
            await new Promise(r => setTimeout(r, 6000));
        } catch (error: any) {
            console.log(`❌ API Error during batch audit: ${error.message}`);
        }
    }

    console.log(`\n========================================`);
    console.log(`🏁 MASS AUDIT COMPLETE!`);
    console.log(`Total Inspected: 500 Questions`);
    console.log(`FINAL QUALITY SCORE: ${((totalPerfect / 500) * 100).toFixed(2)}% (${totalPerfect} Perfect vs ${totalFailed} Defective)`);
    console.log(`========================================\n`);
}

main();
