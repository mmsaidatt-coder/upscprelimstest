import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TARGET_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Desktop', 'testpapers');
const OUT_WITH_SOLUTIONS = path.join(TARGET_DIR, 'with_solutions');
const OUT_NO_SOLUTIONS = path.join(TARGET_DIR, 'no_solutions');
const PIPELINE_OUT_DIR = path.join(process.cwd(), 'data', 'pipeline-output');

// Collect all API keys to determine our parallel bandwidth
const rawKeys = process.env.GEMINI_API_KEYS?.split(',') || [];
if (process.env.GEMINI_API_KEY) rawKeys.push(process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY_2) rawKeys.push(process.env.GEMINI_API_KEY_2);
if (process.env.GEMINI_API_KEY_3) rawKeys.push(process.env.GEMINI_API_KEY_3);
if (process.env.GEMINI_API_KEY_4) rawKeys.push(process.env.GEMINI_API_KEY_4);

const activeKeys = [...new Set(rawKeys.map(k => k.trim()).filter(Boolean))];
const CONCURRENCY = activeKeys.length || 1;

interface ExtractTask {
    testName: string;
    qpPath: string;
    solPath?: string;
    idealOutPath: string;
}

async function runPipeline(task: ExtractTask, apiKeyForTask: string): Promise<boolean> {
    return new Promise((resolve) => {
        const args = [task.qpPath];
        if (task.solPath) args.push(task.solPath);
        args.push('--source', task.testName, '--year', '2024');

        console.log(`[Worker ${apiKeyForTask.slice(-4)}] 🚀 Spawned: ${task.testName}`);

        const env = Object.assign({}, process.env, { FORCED_SINGLE_KEY: apiKeyForTask });

        const child = spawn('/opt/homebrew/bin/npx', ['tsx', 'scripts/extract-qna-pipeline.ts', ...args], {
            stdio: 'pipe', // don't clutter terminal with nested verbose unless error
            cwd: process.cwd(),
            env
        });
        
        let errStr = "";
        child.stderr?.on('data', data => errStr += data.toString());

        child.on('close', (code) => {
            if (code === 0) {
                 const genericOut = path.join(PIPELINE_OUT_DIR, 'question_paper-mapped.json');
                 if (fs.existsSync(genericOut)) {
                     fs.renameSync(genericOut, task.idealOutPath);
                     console.log(`✅ [Worker ${apiKeyForTask.slice(-4)}] SUCCESS: ${task.testName}`);
                     resolve(true);
                 } else {
                     console.log(`❌ [Worker ${apiKeyForTask.slice(-4)}] FAILED: ${task.testName} (No output found)`);
                     resolve(false);
                 }
            } else {
                 console.log(`❌ [Worker ${apiKeyForTask.slice(-4)}] CRASHED: ${task.testName}\\n${errStr}`);
                 resolve(false);
            }
        });
        
        child.on('error', (err) => {
             console.log(`❌ [Worker ${apiKeyForTask.slice(-4)}] ERROR: ${err.message}`);
             resolve(false);
        });
    });
}

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

async function main() {
    if (!fs.existsSync(PIPELINE_OUT_DIR)) fs.mkdirSync(PIPELINE_OUT_DIR, { recursive: true });

    console.log(`\\n🔥 PARALLEL EXTRACTOR INITIATED🔥`);
    console.log(`Bandwidth: ${CONCURRENCY} concurrent workers based on active API keys.\\n`);

    const allTasks: ExtractTask[] = [];
    let skipCount = 0;

    // 1. Gather With Solutions
    if (fs.existsSync(OUT_WITH_SOLUTIONS)) {
        for (const test of fs.readdirSync(OUT_WITH_SOLUTIONS)) {
            const testDir = path.join(OUT_WITH_SOLUTIONS, test);
            if (!fs.statSync(testDir).isDirectory()) continue;

            const idealOutPath = path.join(PIPELINE_OUT_DIR, `${test}-mapped.json`);
            if (fs.existsSync(idealOutPath) && fs.statSync(idealOutPath).size > 1000) { skipCount++; continue; }

            const qpPath = path.join(testDir, 'question_paper.pdf');
            const solPath = path.join(testDir, 'solution_paper.pdf');
            if (fs.existsSync(qpPath) && fs.existsSync(solPath)) {
                allTasks.push({ testName: test, qpPath, solPath, idealOutPath });
            }
        }
    }

    // 2. Gather No Solutions
    if (fs.existsSync(OUT_NO_SOLUTIONS)) {
        for (const test of fs.readdirSync(OUT_NO_SOLUTIONS)) {
            const testDir = path.join(OUT_NO_SOLUTIONS, test);
            if (!fs.statSync(testDir).isDirectory()) continue;

            const idealOutPath = path.join(PIPELINE_OUT_DIR, `${test}-mapped.json`);
            if (fs.existsSync(idealOutPath) && fs.statSync(idealOutPath).size > 1000) { skipCount++; continue; }

            const qpPath = path.join(testDir, 'question_paper.pdf');
            if (fs.existsSync(qpPath)) {
                allTasks.push({ testName: test, qpPath, idealOutPath });
            }
        }
    }

    console.log(`Gathered ${allTasks.length} pending exams. Skipped ${skipCount} previously completed.\\n`);

    let successCount = 0;
    let failCount = 0;

    const batches = chunkArray(allTasks, CONCURRENCY);

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`\\n=======================================================`);
        console.log(`⚡ FIRING BATCH ${i + 1}/${batches.length} (${batch.length} concurrent extractions) ⚡`);
        console.log(`=======================================================\\n`);
        
        const batchPromises = batch.map((task, idx) => {
            const assignedKey = activeKeys[idx]; // Guarantees 1-to-1 unique mapping per active job
            return runPipeline(task, assignedKey);
        });

        const results = await Promise.all(batchPromises);
        
        results.forEach(res => res ? successCount++ : failCount++);

        // Wait completely for the whole batch before launching next one to keep API perfectly rested
        if (i < batches.length - 1) {
            console.log(`\\n⏳ Cooling down for 10 seconds before next batch...`);
            await new Promise(r => setTimeout(r, 10000));
        }
    }

    console.log(`\\n=======================================================`);
    console.log(`🏁 BULK RUN COMPLETE!`);
    console.log(`✅ Success: ${successCount} | ⏩ Skipped: ${skipCount} | ❌ Failed: ${failCount}`);
    console.log(`=======================================================\\n`);
}

main();
