/**
 * fix-pyq-text.ts — AI data correction pipeline
 *
 * Scans all 1,203 PYQ questions to identify and fix severe OCR errors
 * (e.g. garbled text, empty options). Uses Gemini 3.1 Pro's world knowledge
 * of historical UPSC papers to precisely reconstruct the original questions.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BATCH_SIZE = 8; // Stable batch for 3.1 Pro
const DELAY_MS = 5000; // Higher delay for Pro
const CHECKPOINT_FILE = 'data/pyq-fix-checkpoint.json';
const GEMINI_MODEL = 'gemini-3.1-pro-preview';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ── Types ────────────────────────────────────────────────────────────────────
type QRow = {
    id: string;
    subject: string;
    year: number | null;
    prompt: string;
    options: any;
};

type FixedData = {
    prompt: string;
    options: { id: string; text: string }[];
    correct_option_id: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatOptions(opts: any): string {
    if (!Array.isArray(opts)) return JSON.stringify(opts);
    return opts.map((o, i) => {
        if (typeof o === 'string') return `  (${String.fromCharCode(97 + i)}) ${o}`;
        return `  (${(o.id ?? String.fromCharCode(97 + i)).toLowerCase()}) ${o.text ?? ''}`;
    }).join('\n');
}

function formatQuestion(q: QRow, idx: number): string {
    return `=== Q${idx + 1} (ID: ${q.id} | Year: ${q.year} | Subject: ${q.subject}) ===
Corrupted Prompt:
${q.prompt}
Corrupted Options:
${formatOptions(q.options)}`;
}

async function callGemini(promptText: string): Promise<string> {
    const body = {
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: {
            temperature: 0.1, // low temperature for precise factual recall
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
        },
    };

    const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API ${res.status}: ${errText.substring(0, 200)}`);
    }

    const data = await res.json() as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function fixBatch(batch: QRow[]): Promise<(FixedData | null)[]> {
    const questionsText = batch.map((q, i) => formatQuestion(q, i)).join('\n\n');

    const prompt = `You are an expert UPSC Civil Services Prelims Exam data reconstructor.
I have a batch of ${batch.length} corrupted questions from historical UPSC Prelims exams. 
Due to severe OCR errors, many prompts have garbled text (like "lil dy ? gan Ey 24") and some options are completely missing (e.g. "()").

Your task is to use your extensive knowledge of historical UPSC papers to identify the EXACT original question from that specific year and subject that correlates to the corrupted snippet.

Return a JSON array of ${batch.length} objects. Each object must have EXACTLY these fields:
- "prompt": The perfectly reconstructed original question text as it appeared in the actual UPSC paper. Fix all typos. If the question has statements (1, 2, 3), format them clearly. Do not prefix with Q1., Q2., etc.
- "options": An array of exactly 4 objects representing the original valid options. Format: [{"id": "a", "text": "Option A text"}, {"id": "b", "text": "Option B text"}, {"id": "c", "text": "Option C text"}, {"id": "d", "text": "Option D text"}]
- "correct_option_id": The correct answer ID ("a", "b", "c", or "d").

If a question appears perfectly fine and not corrupted, simply reformat its components into this clean structure and standardise option IDs to a,b,c,d.

Corrupted Data:
${questionsText}`;

    const responseText = await callGemini(prompt);

    try {
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed)) return parsed as FixedData[];
        const vals = Object.values(parsed);
        if (Array.isArray(vals[0])) return vals[0] as FixedData[];
    } catch {
        const match = responseText.match(/\[[\s\S]*\]/);
        if (match) {
            try { return JSON.parse(match[0]) as FixedData[]; } catch { }
        }
    }
    console.log("Raw Response Text:", responseText);
    throw new Error('Could not parse response as JSON array');
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function loadCheckpoint(): Set<string> {
    if (fs.existsSync(CHECKPOINT_FILE)) {
        const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
        return new Set(data.fixed ?? []);
    }
    return new Set();
}

function saveCheckpoint(fixedIds: Set<string>) {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ fixed: [...fixedIds] }));
}

async function main() {
    console.log('🚀 Starting PYQ Data Correction Pipeline');
    console.log(`📡 Model: ${GEMINI_MODEL}\n`);

    const fixedIds = loadCheckpoint();
    console.log(`📌 Already fixed: ${fixedIds.size} questions`);

    const allQuestions: QRow[] = [];
    let from = 0;
    const CHUNK_SIZE = 1000;

    // Fetch all questions
    while (true) {
        const { data, error } = await supabase
            .from('questions')
            .select('id, subject, year, prompt, options')
            .eq('source', 'pyq')
            .order('year', { ascending: false }) // Start with newer years
            .order('subject', { ascending: true })
            .range(from, from + CHUNK_SIZE - 1);

        if (error) {
            console.error('Failed to fetch questions:', error);
            return;
        }

        if (!data || data.length === 0) break;
        allQuestions.push(...(data as QRow[]));
        if (data.length < CHUNK_SIZE) break;
        from += CHUNK_SIZE;
    }

    if (allQuestions.length === 0) {
        console.warn('No questions found in database.');
        return;
    }

    const remaining = (allQuestions as QRow[]).filter(q => !fixedIds.has(q.id));
    const total = allQuestions.length;
    console.log(`📋 To process: ${remaining.length} / ${total} total\n`);

    let processed = 0;
    let errored = 0;
    const startTime = Date.now();

    for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
        const batch = remaining.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(remaining.length / BATCH_SIZE);

        const etaStr = processed > 0 ? (() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const eta = Math.round((remaining.length - processed) / (processed / elapsed) / 60);
            return ` | ETA ~${eta}m`;
        })() : '';

        process.stdout.write(`\r🔄 [${batchNum}/${totalBatches}] ${batch[0].subject} (${batch[0].year ?? '—'}) | ✅ ${processed} | ❌ ${errored}${etaStr}    `);

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const fixed = await fixBatch(batch);

                for (let j = 0; j < batch.length; j++) {
                    const q = batch[j];
                    const f = fixed[j];
                    if (!f) continue;

                    const { error: upErr } = await supabase.from('questions').update({
                        prompt: f.prompt,
                        options: f.options,
                        correct_option_id: f.correct_option_id.toUpperCase()
                    }).eq('id', q.id);

                    if (!upErr) {
                        fixedIds.add(q.id);
                        processed++;
                    } else {
                        console.error(`\nFailed to update DB for ${q.id}:`, upErr);
                    }
                }

                saveCheckpoint(fixedIds);
                break; // success
            } catch (err: any) {
                if (attempt < 3) {
                    await sleep(attempt * 4000);
                } else {
                    console.error(`\n⚠️  Batch ${batchNum} failed: ${err.message?.substring(0, 120)}`);
                    errored += batch.length;
                }
            }
        }

        if (i + BATCH_SIZE < remaining.length) await sleep(DELAY_MS);
    }

    console.log(`\n\n🎉 Data Correction complete!`);
    console.log(`   ✅ Processed: ${processed} questions`);
    console.log(`   ❌ Errors:    ${errored} questions`);
    console.log(`   📌 Total fixed in DB: ${fixedIds.size}`);
}

main().catch(console.error);
