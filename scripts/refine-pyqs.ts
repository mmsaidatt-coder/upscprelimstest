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

const questions = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
const officialKeysArray = JSON.parse(fs.readFileSync(keysPath, 'utf-8'));

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log(`🚀 Starting refinement of ${questions.length} questions...`);

    const byYear = new Map<number, any[]>();
    for (const q of questions) {
        const yStr = String(q.year).trim();
        let y = parseInt(yStr);
        if (isNaN(y) || y < 1990 || y > 2100) continue;
        if (!byYear.has(y)) byYear.set(y, []);
        byYear.get(y)!.push(q);
    }

    const finalRefinedQuestions: any[] = [];
    const years = Array.from(byYear.keys()).sort((a,b) => a - b);

    for (const year of years) {
        let qs = byYear.get(year)!;
        console.log(`\n==================================================`);
        console.log(`📘 Processing Year ${year} (${qs.length} extracted questions)`);
        
        // Find official keys for this year mappings
        const yearKeyData = officialKeysArray.find((k: any) => k.year === year);
        if (!yearKeyData) {
            console.log(`⚠️ Warning: No official keys found for year ${year}. Will leave correctOption as null.`);
        }

        const questionsToMap = qs.map(q => ({
            id: q.id,
            questionText: q.questionText,
            options: q.options
        }));

        const prompt = `
You are an expert UPSC CSE tutor and data analyst.
I have an array of extracted questions from UPSC CSE Prelims General Studies Paper 1 for the year ${year}.
Because it was extracted via OCR, there may be missing questions, duplicate questions, or garbled text.

Your tasks:
1. Determine which Set (A, B, C, or D) these questions belong to. You can easily do this by checking the typical first question of each set for ${year}.
2. Map each provided question to its official Question Number (1 to 100) in that specific Set. 
   - Some questions may be duplicates. Map only the best version and ignore the rest.
   - You MUST ensure every question you map gets a unique questionNumber.
3. Identify all missing Question Numbers (the ones from 1 to 100 that were NOT successfully mapped from the provided list).
4. For the missing Question Numbers, retrieve the authentic question text and options from your internal memory of the ${year} UPSC Prelims GS Paper 1 for that identified Set.

Extracted Questions (JSON):
${JSON.stringify(questionsToMap, null, 2)}

Return EXACTLY the following JSON structure:
{
  "identifiedSet": "A",
  "mappedQuestions": [
    { "originalId": "pyq-...", "questionNumber": 12 }
  ],
  "missingQuestions": [
    {
      "questionNumber": 14,
      "questionText": "...",
      "options": ["(a) ...", "(b) ...", "(c) ...", "(d) ..."],
      "subject": "Polity"
    }
  ]
}
`;

        console.log(`-> Asking Gemini to map questions and fill gaps...`);
        let jsonRes: any;
        try {
            const result = await model.generateContent(prompt);
            jsonRes = JSON.parse(result.response.text());
        } catch (e: any) {
             console.error(`❌ Failed to process year ${year}`, e.message);
             continue;
        }

        const identifiedSet = jsonRes.identifiedSet || "A";
        console.log(`✅ Gemini identified Set: ${identifiedSet}`);
        console.log(`✅ Mapped ${jsonRes.mappedQuestions?.length || 0} questions.`);
        console.log(`✅ Internally generated ${jsonRes.missingQuestions?.length || 0} missing questions.`);

        const answerKeyArray = yearKeyData?.sets?.[identifiedSet] || [];

        // Compile perfectly ordered 100 questions array
        let currentYearQuestions = [];

        // 1. Process mapped questions
        for (const mapping of (jsonRes.mappedQuestions || [])) {
            const originalQ = qs.find(q => q.id === mapping.originalId);
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

        // 2. Process missing questions
        for (const missingQ of (jsonRes.missingQuestions || [])) {
            const qNumStr = missingQ.questionNumber;
            let cOpt = null;
            if (answerKeyArray.length >= qNumStr) {
                 cOpt = answerKeyArray[qNumStr - 1];
            }

            currentYearQuestions.push({
                originalId: `generated-${year}-${qNumStr}`,
                questionNumber: qNumStr,
                questionText: missingQ.questionText,
                options: missingQ.options,
                correctOption: cOpt,
                year: year,
                subject: missingQ.subject || "Current Affairs",
                set: identifiedSet
            });
        }

        // Sort them by question number
        currentYearQuestions.sort((a, b) => a.questionNumber - b.questionNumber);
        
        console.log(`📌 Year ${year} finalized with ${currentYearQuestions.length} valid questions!`);
        finalRefinedQuestions.push(...currentYearQuestions);
        
        await delay(5000); // Wait between years
    }

    fs.writeFileSync(outputPath, JSON.stringify(finalRefinedQuestions, null, 2));
    console.log(`\n🎉 Success! Refined pyq bank saved to ${outputPath}`);
    console.log(`Total perfect questions: ${finalRefinedQuestions.length}`);
}

main().catch(console.error);
