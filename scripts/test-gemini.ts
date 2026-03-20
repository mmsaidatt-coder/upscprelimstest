import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testGemini() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    // Test various model names
    const models = ['gemini-2.0-flash', 'gemini-pro', 'gemini-1.0-pro', 'gemini-2.0-flash-exp'];
    
    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Say hello in one word');
            console.log(`✅ ${modelName}: ${result.response.text().trim()}`);
        } catch (err: any) {
            console.log(`❌ ${modelName}: ${err.message?.substring(0, 120)}`);
        }
    }
}

testGemini();
