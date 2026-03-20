const fs = require('fs');
const pdfParse = require('pdf-parse');

async function main() {
    const dataBuffer = fs.readFileSync('/Users/mani/Desktop/upscpyq/Prelims_2025_Set_A.pdf');
    try {
        const data = await pdfParse(dataBuffer);
        const text = data.text;
        
        const lines = text.split('\n');
        let questionNums = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const m = line.match(/^(\d+)\.\s/);
            if (m) {
                const num = parseInt(m[1], 10);
                if (num >= 1 && num <= 100) {
                    questionNums.push(num);
                }
            }
        }
        
        const uniqueNums = [...new Set(questionNums)].sort((a,b)=>a-b);
        
        const missing = [];
        for (let i=1; i<=100; i++) {
            if (!uniqueNums.includes(i)) missing.push(i);
        }
        
        console.log("Missing numbers in PDF text parse:", missing.join(', '));
        
    } catch (e) {
        console.error(e);
    }
}

main();
