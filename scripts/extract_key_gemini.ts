import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
    const text = fs.readFileSync('data/visionias-key.txt', 'utf8');
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
    
    const prompt = `
    You are an expert data extractor. I am providing you with the text extracted from the VisionIAS UPSC General Studies Paper 1 2025 Answer Key document.
    Your task is to extract the correct answer option (a, b, c, or d) for all 100 questions.
    
    The document lists the question, the options, and then provides the correct answer and a detailed explanation.
    For example, you might see something like:
    "1. ... (a) ... (b) ... (c) ... (d) ... C" or "Answer: (c)"
    
    Please read carefully through the text and extract the answer for exactly 100 questions.
    Return the result strictly as a JSON object where the keys are the question numbers ("1", "2", ..., "100") and the values are uppercase strings "A", "B", "C", or "D".
    Do not include any other text besides the JSON.
    `;
    
    console.log("Sending text to Gemini (approx " + Math.round(text.length / 4) + " tokens)...");
    
    try {
        const result = await model.generateContent([
            { text: prompt },
            { text: text }
        ]);
        
        const responseText = result.response.text();
        // Extract JSON from markdown
        const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        let finalJson = responseText;
        if (jsonMatch) {
            finalJson = jsonMatch[1];
        }
        
        fs.writeFileSync('data/visionias-parsed-key.json', finalJson);
        console.log("Successfully parsed and saved to data/visionias-parsed-key.json");
        
        const parsed = JSON.parse(finalJson);
        console.log(`Found ${Object.keys(parsed).length} answers.`);
    } catch (e) {
        console.error("Error calling Gemini API:", e);
    }
}

main();
