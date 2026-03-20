import * as fs from 'fs';
import * as path from 'path';

const missingMapPath = path.join(process.cwd(), 'data', 'missing-questions-map.json');
const keysPath = path.join(process.cwd(), 'data', 'official-keys.json');
const outputPath = path.join(process.cwd(), 'data', 'refined-pyq-bank.json');

const missingMap = JSON.parse(fs.readFileSync(missingMapPath, 'utf-8'));
const officialKeysArray = JSON.parse(fs.readFileSync(keysPath, 'utf-8'));
let refinedBank = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

console.log("🛠️ Generating Placeholders for missing questions...");
let placeholdersAdded = 0;

for (const yearStr of Object.keys(missingMap)) {
    const year = parseInt(yearStr);
    const { set, missing } = missingMap[yearStr];
    
    if (missing.length === 0) continue;

    console.log(`-> Processing Year ${year} (Missing: ${missing.length})`);
    
    const yearKeyData = officialKeysArray.find((k: any) => k.year === year);
    const answerKeyArray = yearKeyData?.sets?.[set] || [];

    for (const qNum of missing) {
        let cOpt = null;
        if (answerKeyArray.length >= qNum) {
            cOpt = answerKeyArray[qNum - 1]; // 1-indexed
        }

        const placeholder = {
            originalId: `placeholder-${year}-${qNum}`,
            questionNumber: qNum,
            questionText: `[Missing Question ${qNum}] This question text was unavailable due to OCR limitations. Please update manually in Supabase.`,
            options: [
                "(a) Placeholder Option A",
                "(b) Placeholder Option B",
                "(c) Placeholder Option C",
                "(d) Placeholder Option D"
            ],
            correctOption: cOpt,
            year: year,
            subject: "Current Affairs", // default fallback
            set: set
        };

        refinedBank.push(placeholder);
        placeholdersAdded++;
    }
}

// Ensure the bank array is perfectly sorted by year, then by questionNumber
refinedBank.sort((a: any, b: any) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.questionNumber - b.questionNumber;
});

fs.writeFileSync(outputPath, JSON.stringify(refinedBank, null, 2));
console.log(`\n🎉 Success! Added ${placeholdersAdded} placeholder questions.`);
console.log(`Total questions in bank is now exactly: ${refinedBank.length}`);
