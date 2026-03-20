import * as fs from 'fs';
import * as path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'pyq-bank.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const questions = JSON.parse(rawData);

const byYear = new Map<number, any[]>();
for (const q of questions) {
  const yStr = String(q.year).trim();
  let y = parseInt(yStr);
  if (isNaN(y) || y < 1990 || y > 2100) y = 0; // mark invalid years
  
  if (!byYear.has(y)) byYear.set(y, []);
  byYear.get(y)!.push(q);
}

console.log(`\n📊 PYQ Bank Analysis (${questions.length} total questions)`);
console.log("--------------------------------------------------");

let totalGaps = 0;
const years = Array.from(byYear.keys()).sort((a,b) => a - b);

for (const year of years) {
  const count = byYear.get(year)!.length;
  let status = "✅ Complete";
  if (count < 100) {
    status = `⚠️ Missing ~${100 - count} questions`;
    totalGaps += (100 - count);
  } else if (count > 100) {
    status = `⚠️ ${count - 100} extra questions (Possible duplicates)`;
  }
  
  console.log(`Year ${year === 0 ? 'Unknown' : year}: ${count.toString().padStart(3, ' ')} questions | ${status}`);
}

console.log("--------------------------------------------------");
if (totalGaps > 0) {
    console.log(`You are missing approximately ${totalGaps} questions across all sets.`);
} else {
    console.log("No missing questions detected! However, there might be duplicates to prune.");
}
