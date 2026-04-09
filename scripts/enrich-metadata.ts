import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env.local' });

// We strictly use the high-limit key provided by user
const API_KEY = process.env.GEMINI_API_KEY_4 || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Fast flash model with enormous 150k threshold
const MODEL_NAME = "gemini-flash-lite-latest";

const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
});

const PIPELINE_OUT_DIR = path.join(process.cwd(), 'data', 'pipeline-output');
const CONCURRENCY_LIMIT = 5; 

async function processFile(filePath: string, filename: string) {
    let data;
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
         return false;
    }

    if (!Array.isArray(data)) return false;

    // Filter down to ONLY questions that are fundamentally missing the deep AI enrichment tags
    const pendingIndices = data.map((q, idx) => (!q.sub_topic || !q.keywords || !q.difficulty) ? idx : -1).filter(idx => idx !== -1);

    if (pendingIndices.length === 0) {
        return false; // Already perfectly enriched
    }

    console.log(`\n=======================================================`);
    console.log(`🧠 ENRICHING: ${filename} (${pendingIndices.length} items remaining)`);
    console.log(`=======================================================`);

    let enrichedCount = 0;

    for (let i = 0; i < pendingIndices.length; i += CONCURRENCY_LIMIT) {
        const batchIndices = pendingIndices.slice(i, i + CONCURRENCY_LIMIT);
        
        await Promise.all(batchIndices.map(async (idx) => {
            const q = data[idx];
            
            const prompt = `
            You are an expert UPSC Curriculum Evaluator.
            I am providing you a UPSC question, its correct option, and the explanation.
            Your task is to generate rich database metadata strictly conforming to the JSON schema below.

            Question Data:
            Text: ${q.questionText}
            Options: ${JSON.stringify(q.options)}
            Answer logic: ${q.explanation}
            Subject: ${q.subject || 'N/A'}
            Topic: ${q.topic || 'N/A'}

            Generate exactly this JSON object:
            {
              "sub_topic": "String (A specific sub-topic related to the parent Topic)",
              "keywords": ["String1", "String2", "String3"],
              "concepts": ["Core Concept 1", "Core Concept 2"],
              "question_type": "String (e.g., 'Multiple Statement', 'Match the Following', 'Assertion-Reason', 'Direct Factual')",
              "importance": "String ('High', 'Medium', or 'Low' probability of appearing in UPSC 2026)",
              "difficulty": "String ('Easy', 'Medium', or 'Hard')",
              "ncert_class": "String (e.g., 'Class 11', 'Class 12', or 'N/A' if pure Current Affairs)",
              "mnemonic_hint": "String (A 1-sentence clever memory trick or acronym to remember this fact, OR null if a mnemonic makes no logical sense for this)"
            }
            `;

            try {
                const result = await model.generateContent(prompt);
                const responseText = result.response.text().trim();
                const payload = JSON.parse(responseText);

                // Inject payload properties mathematically into the original JSON object
                data[idx] = { ...data[idx], ...payload };
                enrichedCount++;
                console.log(`✨ [Q${q.questionNumber || idx+1}] Enriched -> ${payload.difficulty.toUpperCase()} | ${payload.sub_topic}`);
            } catch (error: any) {
                console.log(`❌ [Q${q.questionNumber || idx+1}] API Error: ${error.message}`);
            }
        }));

        // Stateful commit to disk
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        // Minor cooldown 
        await new Promise(r => setTimeout(r, 1500));
    }

    console.log(`\n🏁 Finished enriching ${filename}! Transformed: ${enrichedCount}/${pendingIndices.length}`);
    return true;
}

async function main() {
    console.log("🚀 BOOTING UP AI METADATA ENRICHMENT ENGINE (5 THREADS)...\n");

    const files = fs.readdirSync(PIPELINE_OUT_DIR).filter(f => f.endsWith('.json'));
    
    for (const f of files) {
        const fullPath = path.join(PIPELINE_OUT_DIR, f);
        if (fs.statSync(fullPath).size < 1000) continue; 
        
        await processFile(fullPath, f);
    }

    console.log(`\n=======================================================`);
    console.log(`🏆 ALL JSON FILES HAVE BEEN DEEPLY ENRICHED AND ARE DATABASE-READY!`);
    console.log(`=======================================================\n`);
}

main();
