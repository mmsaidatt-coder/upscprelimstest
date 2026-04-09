import * as fs from 'fs';
import * as path from 'path';

const TARGET_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Desktop', 'testpapers');
const OUT_WITH_SOLUTIONS = path.join(TARGET_DIR, 'with_solutions');
const OUT_NO_SOLUTIONS = path.join(TARGET_DIR, 'no_solutions');

// Helper to normalize the file base name heavily
function normalizeFileName(filename: string): string {
    let lowered = filename.toLowerCase().replace(/\.pdf$/, '');
    
    // Strip common prefixes like '001. '
    lowered = lowered.replace(/^\d{3}\.\s*/, '');

    // Strip garbage tags and copycenter watermarks
    const tagsToRemove = [
        '@ramramjii21', '@ramramjii', '@ramramji', '@ramramj', '@lok', 
        '(upsccopycenter.com)', '-eng', '-hin', 'enghindi', 'hindi', 'english',
        'qp', 'question paper', 'questionpaper', 'question', 'q',
        'sol', 'solution', 'explanation', 'model answer', 'answers',
        'recall sheet', 
        '\\(1\\)', '\\(2\\)', '1_'
    ];

    tagsToRemove.forEach(tag => {
        lowered = lowered.replace(new RegExp(tag, 'g'), '');
    });

    // Strip ALL non-alphanumeric chars
    return lowered.replace(/[^a-z0-9]/g, '');
}

function isSolution(filename: string): boolean {
    const lowered = filename.toLowerCase();
    // Identifiers for solution files
    return lowered.includes('sol') || 
           lowered.includes('explanation') || 
           lowered.includes('answer');
}

function isRecallSheet(filename: string): boolean {
    return filename.toLowerCase().includes('recall sheet');
}

function main() {
    if (!fs.existsSync(TARGET_DIR)) {
        console.error(`❌ Target directory not found: ${TARGET_DIR}`);
        process.exit(1);
    }

    if (!fs.existsSync(OUT_WITH_SOLUTIONS)) fs.mkdirSync(OUT_WITH_SOLUTIONS, { recursive: true });
    if (!fs.existsSync(OUT_NO_SOLUTIONS)) fs.mkdirSync(OUT_NO_SOLUTIONS, { recursive: true });

    const files = fs.readdirSync(TARGET_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));

    const groups: Record<string, { qps: string[], sols: string[], recalls: string[] }> = {};

    // Grouping
    for (const file of files) {
        // Exclude 5_62083... raw numeric files if they are not standard, wait, let's group them anyways.
        const key = normalizeFileName(file);
        
        if (!groups[key]) groups[key] = { qps: [], sols: [], recalls: [] };
        
        if (isRecallSheet(file)) {
            groups[key].recalls.push(file);
        } else if (isSolution(file)) {
            groups[key].sols.push(file);
        } else {
            groups[key].qps.push(file);
        }
    }

    let movedWithSol = 0;
    let movedNoSol = 0;

    const report: any = {
        withSolutions: [],
        noSolutions: [],
        errors: []
    };

    const runSafetyRename = (oldName: string, newBasePath: string, renameAs: string) => {
        if (!fs.existsSync(newBasePath)) fs.mkdirSync(newBasePath, { recursive: true });
        const oldP = path.join(TARGET_DIR, oldName);
        const newP = path.join(newBasePath, renameAs);
        fs.renameSync(oldP, newP);
    };

    // Moving Logic
    for (const [key, group] of Object.entries(groups)) {
        // If a group has NO qps whatsoever, maybe it's just a raw solution file without a QP?
        if (group.qps.length === 0 && group.sols.length > 0) {
            report.errors.push(`Found Solution without QP for key: ${key}`);
            continue;
        }

        // Handle standalone Raw IDs
        if (group.qps.length === 0) continue;

        const primaryQp = group.qps[0];

        // Scenario 1: Solved Pair
        if (group.sols.length > 0) {
             const primarySol = group.sols[0];
             const folderName = primaryQp.replace(/\.pdf$/i, '').trim();
             
             runSafetyRename(primaryQp, path.join(OUT_WITH_SOLUTIONS, folderName), 'question_paper.pdf');
             runSafetyRename(primarySol, path.join(OUT_WITH_SOLUTIONS, folderName), 'solution_paper.pdf');
             
             // Move extra variations to same folder if they exist
             group.qps.slice(1).forEach((qp, idx) => runSafetyRename(qp, path.join(OUT_WITH_SOLUTIONS, folderName), `question_paper_alt_${idx}.pdf`));
             group.sols.slice(1).forEach((sol, idx) => runSafetyRename(sol, path.join(OUT_WITH_SOLUTIONS, folderName), `solution_paper_alt_${idx}.pdf`));
             group.recalls.forEach((rc, idx) => runSafetyRename(rc, path.join(OUT_WITH_SOLUTIONS, folderName), `recall_sheet_${idx}.pdf`));

             report.withSolutions.push(folderName);
             movedWithSol++;
        } 
        // Scenario 2: No Sol
        else {
             // Keep filename as-is in no_solution folder
             const folderName = primaryQp.replace(/\.pdf$/i, '').trim();
             runSafetyRename(primaryQp, path.join(OUT_NO_SOLUTIONS, folderName), 'question_paper.pdf');
             
             group.qps.slice(1).forEach((qp, idx) => runSafetyRename(qp, path.join(OUT_NO_SOLUTIONS, folderName), `question_paper_alt_${idx}.pdf`));
             group.recalls.forEach((rc, idx) => runSafetyRename(rc, path.join(OUT_NO_SOLUTIONS, folderName), `recall_sheet_${idx}.pdf`));

             report.noSolutions.push(primaryQp);
             movedNoSol++;
        }
    }

    const reportPath = path.join(TARGET_DIR, 'organization_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    console.log(`✅ Test papers organized successfully!`);
    console.log(`📊 Paired Tests (With Solutions): ${movedWithSol}`);
    console.log(`📊 Standalone Tests (No Solutions): ${movedNoSol}`);
    console.log(`📄 Full output written to: ${reportPath}`);
}

main();
