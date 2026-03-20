import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  // The SDK doesn't have a direct listModels, we usually use the REST API for that
  // But let's try to just test a few model names
  const models = ["gemini-3.1-pro-preview", "gemini-1.5-flash", "gemini-1.5-flash-latest"];
  
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      await model.generateContent("test");
      console.log(`✅ ${m} is available`);
    } catch (e: any) {
      console.log(`❌ ${m} failed: ${e.message}`);
    }
  }
}

listModels();
