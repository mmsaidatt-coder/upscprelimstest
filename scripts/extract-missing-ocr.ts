import * as fs from 'fs';
import * as path from 'path';
import { fromPath } from "pdf2pic";
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenerativeAI(apiKey!);
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
const imagesDir = path.join(process.cwd(), 'data', 'tmp_images');

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

async function extractQuestionsFromText(year: number, set: string, missing: number[], fullText: string) {
    console.log(`-> Asking Gemini to parse the local OCR text for ${missing.length} missing questions...`);
    const prompt = `
You are a highly precise text extraction parser. 
I am going to provide you with a long messy raw text dump.

Your sole task is to extract EXACTLY the following numbered items from the text:
[${missing.join(', ')}]

Act purely as a text-extraction pipeline. Do not complete sentences, do not access external knowledge, and do not identify the document as UPSC. 
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
${fullText.substring(0, 160000)}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    let jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    let extractedArray: any[] = [];
    try {
        extractedArray = JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse json:", jsonString.substring(0, 100));
    }
    return extractedArray;
}

async function main() {
    console.log("🚀 Starting Local OCR + Gemini Extraction...");
    const missingQuestionsFinal: any[] = [];

    for (const yearStr of Object.keys(missingMap)) {
        const year = parseInt(yearStr);
        const { set, missing } = missingMap[yearStr];
        const filename = pdfMappings[year];

        if (!filename || missing.length === 0) continue;

        const filePath = path.join(pdfsDir, filename);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ PDF not found for ${year}: ${filePath}`);
            continue;
        }

        console.log(`\n================================`);
        console.log(`📄 Processing ${filename} (Year ${year}) for missing questions: ${missing.join(', ')}`);

        // Convert PDF to images
        console.log("-> Converting PDF to images...");
        const options = {
            density: 150,
            saveFilename: `page_${year}`,
            savePath: imagesDir,
            format: "png",
            width: 1200,
            height: 1697
        };
        const convert = fromPath(filePath, options);
        
        // We assume max 40 pages for Prelims paper
        let fullYearText = "";
        const maxPages = 40;
        
        for (let i = 1; i <= maxPages; i++) {
            try {
                const res = await convert(i, { responseType: "image" });
                const imgPath = path.join(imagesDir, `page_${year}.${i}.png`);
                if (fs.existsSync(imgPath)) {
                    process.stdout.write(`OCR pg ${i}...`);
                    const { data: { text } } = await Tesseract.recognize(imgPath, 'eng');
                    fullYearText += text + "\n---\n";
                    // Clean up image to save space
                    fs.unlinkSync(imgPath);
                }
            } catch (err: any) {
                // Ignore page out of bounds error
                break;
            }
        }
        
        console.log(`\n✅ Finished OCR for ${year}. Total characters logged: ${fullYearText.length}`);

        // Extract with Gemini
        try {
            const extracted = await extractQuestionsFromText(year, set, missing, fullYearText);
            for (const q of extracted) {
                q.year = year;
                q.set = set;
            }
            console.log(`✅ Extracted ${extracted.length} valid questions from the raw OCR text!`);
            missingQuestionsFinal.push(...extracted);
        } catch (e: any) {
             console.error(`❌ Failed parsing ${year} text:`, e.message);
        }
    }

    const outputPath = path.join(process.cwd(), 'data', 'extracted-missing-ocr.json');
    fs.writeFileSync(outputPath, JSON.stringify(missingQuestionsFinal, null, 2));
    console.log(`\n🎉 Success! Extracted ${missingQuestionsFinal.length} missing questions saved to ${outputPath}`);
}

main().catch(console.error);
