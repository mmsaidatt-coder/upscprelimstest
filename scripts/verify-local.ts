import * as fs from 'fs';

function verifyLocalMapping() {
    const keyData = JSON.parse(fs.readFileSync('data/visionias-parsed-key.json', 'utf8'));
    
    // First 97 questions from our main extraction script
    const qsData = JSON.parse(fs.readFileSync('data/Prelims_2025_Set_A-extracted.json', 'utf8'));
    
    console.log("Found", qsData.questions.length, "local questions");
    
    let offset = 0;
    
    console.log("\n--- First 5 questions local vs Key ---");
    for (let i = 0; i < 5; i++) {
        const qNum = i + 1;
        const q = qsData.questions[i];
        let p = q.prompt ? q.prompt.substring(0, 100) : "";
        console.log(`Local Q${qNum} / Key Q${qNum}: ${keyData[qNum]} | Text: ${p.replace(/\n/g, ' ')}...`);
    }

    console.log("\n--- Expected Missing Q5,6,7 from PDF vs VisionIAS Key Q5,6,7 ---");
    const missingKeys = [5, 6, 7];
    for (const key of missingKeys) {
        console.log(`VisionIAS Key Q${key}: ${keyData[key]}`);
    }
}

verifyLocalMapping();
