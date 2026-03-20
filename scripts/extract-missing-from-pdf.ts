import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import * as fs from 'fs';
import * as path from 'path';

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    process.exit(1);
}

const ai = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);
const model = ai.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

const missingMapPath = path.join(process.cwd(), 'data', 'missing-questions-map.json');
const missingMap = JSON.parse(fs.readFileSync(missingMapPath, 'utf-8'));

const pdfMappings: Record<number, string> = {
    2017: 'CSP-17-GS_PAPER-1-C.pdf',
    2018: 'QP-CSP-18-GS-I-C.pdf',
    2019: 'csp-p1.pdf',
    2020: 'CSP_2020_GS_Paper-1.pdf',
    2021: 'QP-CSP-21-GeneralStudiesPaper-I-121021.pdf'
};

const pdfsDir = "/Users/mani/Desktop/upscpyq/misssingyears'spapers";

async function main() {
    console.log("🚀 Starting Targeted Extractor for Missing Questions from ALternate Source...");

    const missingQuestionsFinal: any[] = [];

    for (const yearStr of Object.keys(missingMap)) {
        const year = parseInt(yearStr);
        const { set, missing } = missingMap[yearStr];
        const filename = pdfMappings[year];

        if (!filename) continue;

        const textFilename = filename.replace('.pdf', '.txt');
        const filePath = path.join(process.cwd(), 'data', 'raw_text', textFilename);
        
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Text not found for ${year}: ${filePath}`);
            continue;
        }

        console.log(`\n================================`);
        console.log(`📄 Scanning ${textFilename} (Year ${year}) for ${missing.length} missing questions: ${missing.join(', ')}`);

        try {
            const rawTextContent = fs.readFileSync(filePath, 'utf-8');

            console.log("-> Asking Gemini to extract EXACTLY these questions...");
            const prompt = `
You are a highly precise text extraction parser. 
I am going to provide you with a long messy raw text dump.

Your sole task is to extract EXACTLY the following numbered items from the text:
[${missing.join(', ')}]

Act purely as a text-extraction pipeline. Do not complete sentences, do not access external knowledge, and do not identify the document. 
Just transcribe the text for the requested numbers and their 4 options exactly as they appear in the provided text.

Output strictly in this JSON format:
\`\`\`json
[
  {
    "questionNumber": 32,
    "questionText": "Transcribed text here...",
    "options": ["(a) ...", "(b) ...", "(c) ...", "(d) ..."],
    "subject": "General"
  }
]
\`\`\`
Return only the JSON array.

RAW TEXT DUMP:
${rawTextContent.substring(0, 150000)} // Ensure we don't blow token limits, but 150k chars is plenty for a paper
`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            
            let jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            let extractedArray = [];
            try {
               extractedArray = JSON.parse(jsonString);
            } catch (e) {
                console.error("Failed to parse json:", jsonString.substring(0, 100));
                continue;
            }

            // Stamp metadata
            for (const q of extractedArray) {
                q.year = year;
                q.set = set;
            }

            console.log(`✅ Extracted ${extractedArray.length} missing questions for ${year}!`);
            missingQuestionsFinal.push(...extractedArray);

        } catch (e: any) {
             if (e.message && e.message.includes('RECITATION')) {
                  console.error(`❌ Failed processing ${year} due to RECITATION filters. We must use a direct text copy paste for this year.`);
             } else {
                  console.error(`❌ Failed processing ${year}:`, e.message || e);
             }
        }

        // wait 5 seconds for rate limit
        await new Promise(r => setTimeout(r, 5000));
    }

    const outputPath = path.join(process.cwd(), 'data', 'extracted-missing-questions.json');
    fs.writeFileSync(outputPath, JSON.stringify(missingQuestionsFinal, null, 2));
    console.log(`\n🎉 Success! Extracted ${missingQuestionsFinal.length} missing questions saved to ${outputPath}`);
}

main().catch(console.error);
