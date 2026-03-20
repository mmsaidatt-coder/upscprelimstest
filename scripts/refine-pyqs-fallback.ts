import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from 'fs';
import * as path from 'path';

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    process.exit(1);
}

const ai = new GoogleGenerativeAI(apiKey);
const model = ai.getGenerativeModel({
    model: "gemini-3.1-pro-preview",
    generationConfig: {
        responseMimeType: "application/json",
    }
});

const bankPath = path.join(process.cwd(), 'data', 'pyq-bank.json');
const keysPath = path.join(process.cwd(), 'data', 'official-keys.json');
const outputPath = path.join(process.cwd(), 'data', 'refined-pyq-bank.json');

const rawQuestions = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
const officialKeysArray = JSON.parse(fs.readFileSync(keysPath, 'utf-8'));
let refinedBank = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const yearsToFallback = [2017, 2018, 2019, 2020, 2021];
    console.log(`🚀 Starting Fallback Refinement for years: ${yearsToFallback.join(', ')}`);

    for (const year of yearsToFallback) {
        let qs = rawQuestions.filter((q: any) => parseInt(q.year) === year);
        if (qs.length === 0) continue;

        console.log(`\n==================================================`);
        console.log(`📘 Processing Year ${year} (${qs.length} extracted questions)`);
        
        const yearKeyData = officialKeysArray.find((k: any) => k.year === year);
        const questionsToMap = qs.map((q: any) => ({
            id: q.id,
            questionText: q.questionText,
            options: q.options
        }));

        const prompt = `
You are an expert UPSC CSE tutor and data analyst.
I have an array of extracted questions from UPSC CSE Prelims General Studies Paper 1 for the year ${year}.
Because it was extracted via OCR, there may be missing questions or duplicate questions.

Your strictly limited tasks:
1. Determine which Set (A, B, C, or D) these questions belong to. You can easily do this by checking the typical first question of each set for ${year}.
2. Map each provided question to its official Question Number (1 to 100) in that specific Set. 
   - Some questions may be duplicates. Map only the best version and ignore the rest.
   - You MUST ensure every question you map gets a unique questionNumber.
3. DO NOT output or attempt to generate the missing questions to avoid copyright/recitation issues. ONLY map what is provided.

Extracted Questions (JSON):
${JSON.stringify(questionsToMap, null, 2)}

Return EXACTLY the following JSON structure:
{
  "identifiedSet": "A",
  "mappedQuestions": [
    { "originalId": "pyq-...", "questionNumber": 12 }
  ]
}
`;

        console.log(`-> Asking Gemini to map questions safely...`);
        let jsonRes: any;
        try {
            const result = await model.generateContent(prompt);
            jsonRes = JSON.parse(result.response.text());
        } catch (e: any) {
             console.error(`❌ Failed to process year ${year}`, e.message || e);
             continue;
        }

        const identifiedSet = jsonRes.identifiedSet || "A";
        console.log(`✅ Gemini identified Set: ${identifiedSet}`);
        console.log(`✅ Safely mapped ${jsonRes.mappedQuestions?.length || 0} questions.`);

        const answerKeyArray = yearKeyData?.sets?.[identifiedSet] || [];
        let currentYearQuestions = [];

        for (const mapping of (jsonRes.mappedQuestions || [])) {
            const originalQ = qs.find((q: any) => q.id === mapping.originalId);
            if (originalQ) {
                const qNumStr = mapping.questionNumber;
                let cOpt = null;
                if (answerKeyArray.length >= qNumStr) {
                     cOpt = answerKeyArray[qNumStr - 1]; // 1-indexed
                }

                currentYearQuestions.push({
                    originalId: originalQ.id, // reference
                    questionNumber: qNumStr,
                    questionText: originalQ.questionText,
                    options: originalQ.options,
                    correctOption: cOpt,
                    year: year,
                    subject: originalQ.subject,
                    set: identifiedSet
                });
            }
        }

        currentYearQuestions.sort((a, b) => a.questionNumber - b.questionNumber);
        console.log(`📌 Year ${year} fallback completed with ${currentYearQuestions.length} mapped questions!`);
        refinedBank.push(...currentYearQuestions);
        
        await delay(3000); 
    }

    fs.writeFileSync(outputPath, JSON.stringify(refinedBank, null, 2));
    console.log(`\n🎉 Success! Added fallback years. Refined pyq bank now has ${refinedBank.length} total questions.`);
}

main().catch(console.error);
