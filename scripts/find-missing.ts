import * as fs from 'fs';
import * as path from 'path';

const outputPath = path.join(process.cwd(), 'data', 'refined-pyq-bank.json');
const refinedBank = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

const yearsToCheck = [2017, 2018, 2019, 2020, 2021];

console.log("Missing Questions Tracker:");
console.log("==========================");

const missingMap: Record<number, { set: string, missing: number[] }> = {};

for (const year of yearsToCheck) {
    const qs = refinedBank.filter((q: any) => q.year === year);
    if (qs.length === 0) continue;
    
    const setUsed = qs[0].set;
    const presentNumbers = new Set(qs.map((q: any) => q.questionNumber));
    const missing = [];
    
    for (let i = 1; i <= 100; i++) {
        if (!presentNumbers.has(i)) {
            missing.push(i);
        }
    }
    
    missingMap[year] = { set: setUsed, missing };
    console.log(`Year: ${year} | Set: ${setUsed} | Missing Count: ${missing.length}`);
    console.log(`Missing Numbers: ${missing.join(', ')}\n`);
}

fs.writeFileSync(path.join(process.cwd(), 'data', 'missing-questions-map.json'), JSON.stringify(missingMap, null, 2));
