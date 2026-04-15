import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE URL OR KEY MISSING!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

const API_KEY = process.env.GEMINI_API_KEY_4 || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-flash-lite-latest",
    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
});

const AUDIT_STATE_FILE = path.join(process.cwd(), 'data', 'audit-state.json');
const AUDIT_FAILURES_FILE = path.join(process.cwd(), 'data', 'audit-failures.json');
const CONCURRENCY_LIMIT = 5; 

async function main() {
    console.log("🚀 BOOTING HYPER-AUDIT AI CLUSTER...\n");

    let state: Record<string, boolean> = {};
    let failures: any[] = [];

    if (fs.existsSync(AUDIT_STATE_FILE)) state = JSON.parse(fs.readFileSync(AUDIT_STATE_FILE, 'utf-8'));
    if (fs.existsSync(AUDIT_FAILURES_FILE)) failures = JSON.parse(fs.readFileSync(AUDIT_FAILURES_FILE, 'utf-8'));

    // Fetch all question IDs and minimal payload needed for audit
    console.log(`📖 Querying bulk database payload...`);
    
    // We must paginate internally to gather all 10k rows safely
    const allQuestions: any[] = [];
    let page = 0;
    while(true) {
        const { data, error } = await supabase.from('questions').select('id, prompt, options, correct_option_id, explanation, subject').range(page * 1000, (page + 1) * 1000 - 1);
        if (error) { console.error("Fetch Err:", error); break; }
        if (!data || data.length === 0) break;
        allQuestions.push(...data);
        page++;
    }

    console.log(`✅ Loaded ${allQuestions.length} production questions securely.`);

    const pendingQuestions = allQuestions.filter(q => state[q.id] === undefined);

    console.log(`🔍 Discovered ${pendingQuestions.length} unaudited items. Engaging Gemini Flash-Lite Matrix...\n`);

    for (let i = 0; i < pendingQuestions.length; i += CONCURRENCY_LIMIT) {
        const batch = pendingQuestions.slice(i, i + CONCURRENCY_LIMIT);
        
        await Promise.all(batch.map(async (q) => {
            const promptStr = `
            You are an ultra-strict UPSC Quality Assurance Evaluator.
            You must evaluate a single Multiple Choice Question strictly.

            DATA:
            ID: ${q.id}
            Subject: ${q.subject}
            Prompt: ${q.prompt}
            Options JSON: ${JSON.stringify(q.options)}
            Claimed Correct Option: ${q.correct_option_id}
            Detailed Explanation: ${q.explanation}

            RULES FOR VALIDATION:
            1. Structural: Ensure there are exactly 4 options correctly aligned (A, B, C, D). Ensure 'Claimed Correct Option' maps logically to one of the specific IDs.
            2. Logical: Does the 'Detailed Explanation' scientifically and natively prove that the 'Claimed Correct Option' is absolutely true without contradictions?
            
            OUTPUT STRICTLY AS JSON:
            {
              "passed_audit": boolean (true if flawless, false if ANY minor defect exists structurally or logically),
              "defect_reason": "String explaining the exact flaw (or null if perfectly passed)",
              "severity": "CRITICAL" | "MINOR" | null
            }
            `;

            try {
                const result = await model.generateContent(promptStr);
                const payload = JSON.parse(result.response.text().trim());

                if (!payload.passed_audit) {
                    console.log(`❌ DEFECT [${q.id}]: ${payload.defect_reason}`);
                    failures.push({
                        q_id: q.id,
                        defect: payload.defect_reason,
                        severity: payload.severity,
                        snapshot: q
                    });
                } else {
                    console.log(`✅ PASS [${q.id.split('-')[0]}]`);
                }
                
                // Keep local state perfectly consistent
                state[q.id] = payload.passed_audit;

            } catch (err: any) {
                console.log(`⚠️ API Timeout for ${q.id.split('-')[0]}, will retry next pass.`);
            }
        }));

        // Stateful commit to disk synchronously to avoid corruption on crash
        fs.writeFileSync(AUDIT_STATE_FILE, JSON.stringify(state, null, 2));
        fs.writeFileSync(AUDIT_FAILURES_FILE, JSON.stringify(failures, null, 2));
        
        // Cooldown
        await new Promise(r => setTimeout(r, 600));
    }

    console.log(`\n🏁 HYPER-AUDIT BATCH COMPLETE! Discovered currently ${failures.length} AI defects locally logged.`);
}

main();
