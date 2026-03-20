import * as fs from 'fs';
import * as path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const outputFile = path.join(dataDir, 'pyq-bank.json');

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('-extracted.json'));
let allQuestions: any[] = [];

for (const file of files) {
    const rawData = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    try {
        const parsed = JSON.parse(rawData);
        if (parsed.questions && Array.isArray(parsed.questions)) {
            allQuestions = allQuestions.concat(parsed.questions);
        }
    } catch (e) {
        console.error(`Error parsing ${file}:`, e);
    }
}

// Add unique IDs to each question if they don't have one
allQuestions = allQuestions.map((q, index) => ({
    id: `pyq-${q.year || 'unknown'}-${index}`,
    ...q
}));

fs.writeFileSync(outputFile, JSON.stringify(allQuestions, null, 2));
console.log(`Successfully compiled ${files.length} files into ${outputFile}`);
console.log(`Total questions in bank: ${allQuestions.length}`);
