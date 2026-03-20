import * as fs from 'fs';
import * as path from 'path';

const refinedBankPath = path.join(process.cwd(), 'data', 'refined-pyq-bank.json');
const extractedOcrPath = path.join(process.cwd(), 'data', 'extracted-missing-ocr.json');

const refinedBank = JSON.parse(fs.readFileSync(refinedBankPath, 'utf-8'));
const extractedOcr = JSON.parse(fs.readFileSync(extractedOcrPath, 'utf-8'));

console.log("🛠️ Patching placeholders with real extracted OCR text...");
let patchedCount = 0;

for (const ocrQ of extractedOcr) {
    const targetQ = refinedBank.find((q: any) => q.year === ocrQ.year && q.questionNumber === ocrQ.questionNumber);
    if (targetQ) {
        targetQ.questionText = ocrQ.questionText;
        targetQ.options = ocrQ.options;
        // Keep the targetQ.correctOption which was already parsed correctly previously
        patchedCount++;
    } else {
        console.warn(`⚠️ Warning: Could not find placeholder in bank for year ${ocrQ.year} Q${ocrQ.questionNumber}`);
    }
}

fs.writeFileSync(refinedBankPath, JSON.stringify(refinedBank, null, 2));
console.log(`\n🎉 Success! Patched ${patchedCount} questions with real text.`);
