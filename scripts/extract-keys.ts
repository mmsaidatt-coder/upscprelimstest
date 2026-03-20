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

const keysDir = path.join(process.cwd(), '../upscpyq/Keys');
const outputFilePath = path.join(process.cwd(), 'data/official-keys.json');

const prompt = `
You are an expert data extractor. I have uploaded the official UPSC Answer Key for General Studies Paper I for a specific year. 
This document contains the correct option (A, B, C, or D) for exactly 100 questions. Often, it contains the mapping for all four paper series/sets (Set A, Set B, Set C, Set D). sometimes it only has 1.

Your task is to determine the YEAR of this examination from the text, extract the answer keys for each set, and return them in the following STRICT JSON format:

\`\`\`json
{
  "year": YYYY,
  "sets": {
    "A": ["A", "B", "C", ... 100 answers],
    "B": ["C", "D", "A", ... 100 answers],
    "C": ["B", "A", "C", ... 100 answers],
    "D": ["D", "C", "B", ... 100 answers]
  }
}
\`\`\`

Rules:
1. ONLY return the JSON block, no markdown, no other text.
2. The "sets" object should contain keys "A", "B", "C", and/or "D" ONLY if that set's mapping is present in the document.
3. Every array must have exactly 100 items (the correct option string "A", "B", "C", "D" or null if dropped/invalid). The position in the array represents the question number (index 0 is Q1, index 99 is Q100).
4. Do NOT output explanations or the questions themselves. Only the correct option characters.
5. Accurately extract the year (e.g. 2018) from the title or text of the document.
`;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const files = fs.readdirSync(keysDir).filter(f => f.endsWith('.pdf'));
    const allKeysData: any[] = [];

    for (const file of files) {
        console.log(`\n📄 Processing Key: ${file}`);
        const filePath = path.join(keysDir, file);
        
        try {
            console.log("-> Uploading PDF to Gemini File API...");
            const uploadResponse = await fileManager.uploadFile(filePath, {
                mimeType: "application/pdf",
                displayName: file,
            });
            console.log(`-> Uploaded as ${uploadResponse.file.name}`);

            console.log("-> Generating Answer Key JSON...");
            const result = await model.generateContent([
                prompt,
                {
                    fileData: {
                        mimeType: uploadResponse.file.mimeType,
                        fileUri: uploadResponse.file.uri
                    }
                }
            ]);

            const responseText = result.response.text();
            
            // Clean markdown
            const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const keyJson = JSON.parse(jsonString);
            
            allKeysData.push(keyJson);
            console.log(`✅ Extracted data for Exam Year: ${keyJson.year}`);
            
            // Cleanup
            await fileManager.deleteFile(uploadResponse.file.name);

        } catch (e: any) {
            console.error(`❌ Failed to process ${file}:`, e.message || e);
        }

        // rate limiting
        await delay(3000);
    }

    fs.writeFileSync(outputFilePath, JSON.stringify(allKeysData, null, 2));
    console.log(`\n🎉 Success! Combined official keys saved to ${outputFilePath}`);
}

main().catch(console.error);
