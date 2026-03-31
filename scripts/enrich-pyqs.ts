/**
 * enrich-pyqs.ts — AI enrichment pipeline using direct Gemini REST API calls
 *
 * Processes 1,203 UPSC PYQ questions in batches of 15,
 * classifying each with topic, sub_topic, keywords, concepts,
 * question_type, difficulty_rationale, importance, ncert_class, mnemonic_hint.
 *
 * Features: checkpoint/resume, rate limiting, retry w/ backoff, ETA tracking.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BATCH_SIZE = 12;
const DELAY_MS = 1500;
const CHECKPOINT_FILE = 'data/enrichment-checkpoint.json';
const GEMINI_MODEL = 'gemini-3.1-pro-preview';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ── Types ────────────────────────────────────────────────────────────────────
type QRow = {
    id: string;
    subject: string;
    year: number | null;
    prompt: string;
    options: any;
    correct_option_id: string | null;
};

type EnrichedData = {
    topic: string;
    sub_topic: string;
    keywords: string[];
    question_type: string;
    concepts: string[];
    difficulty_rationale: string;
    importance: string;
    ncert_class: string;
    mnemonic_hint: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatOptions(opts: any): string {
    if (!Array.isArray(opts)) return '';
    return opts.map((o, i) => {
        if (typeof o === 'string') return `  (${String.fromCharCode(97 + i)}) ${o.replace(/^\(?[a-dA-D]\)?[\s.]*/, '')}`;
        return `  (${(o.id ?? String.fromCharCode(65 + i)).toLowerCase()}) ${o.text ?? o}`;
    }).join('\n');
}

function formatQuestion(q: QRow, idx: number): string {
    return `=== Q${idx + 1} (ID: ${q.id} | Year: ${q.year} | Subject: ${q.subject}) ===
${q.prompt.replace(/^\d+\.\s*/, '').trim()}
Options:
${formatOptions(q.options)}
Correct Answer: ${q.correct_option_id ?? 'Unknown'}`;
}

async function callGemini(promptText: string): Promise<string> {
    const body = {
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: {
            temperature: 0.1,
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

async function enrichBatch(batch: QRow[]): Promise<(EnrichedData | null)[]> {
    const questionsText = batch.map((q, i) => formatQuestion(q, i)).join('\n\n');

    const prompt = `You are an expert UPSC Prelims question analyst. Analyze these ${batch.length} questions and return a JSON array of ${batch.length} objects.

Each object must have EXACTLY these fields:
- "topic": Primary topic (e.g., "Fundamental Rights", "Medieval Architecture", "Monetary Policy", "Western Disturbances")
- "sub_topic": Specific sub-topic (e.g., "Right to Equality Art.14-18", "Mughal Tomb Architecture", "Repo Rate & Reverse Repo", "Jet Stream & Cyclones")
- "keywords": Array of 5-8 key terms/names directly testable (specific article numbers, species names, place names, acts, concepts)
- "question_type": One of: "Factual" | "Conceptual" | "Analytical" | "Statement-Based" | "Match-the-Following" | "Chronological/Sequence" | "Identify" | "Negative (EXCEPT/NOT)"
- "concepts": Array of 3-6 broader academic concepts this question tests (not just synonyms of topic)
- "difficulty_rationale": One sentence: why easy/moderate/hard
- "importance": "Very High" | "High" | "Medium" | "Low" (based on UPSC repetition frequency of this topic)
- "ncert_class": NCERT textbook reference e.g. "XI Polity Ch.2", "X Science Ch.5", "XII Economy Ch.1". Empty string "" if not from standard NCERT
- "mnemonic_hint": A clever 1-sentence memory trick to remember the correct answer, or "" if not applicable

RULES:
- Be accurate and specific. UPSC-level precision.
- keywords must be actual testable terms (not vague like "economy" or "India")
- importance should reflect how often UPSC tests this EXACT topic
- Return ONLY the JSON array, no other text

Questions:
${questionsText}`;

    const responseText = await callGemini(prompt);

    // Parse — response should be raw JSON since we set responseMimeType
    try {
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed)) return parsed;
        // Sometimes wrapped in object
        const vals = Object.values(parsed);
        if (Array.isArray(vals[0])) return vals[0] as EnrichedData[];
    } catch {
        // Try to extract JSON array from text
        const match = responseText.match(/\[[\s\S]*\]/);
        if (match) {
            try { return JSON.parse(match[0]); } catch { /* fall through */ }
        }
    }
    throw new Error('Could not parse response as JSON array');
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function loadCheckpoint(): Set<string> {
    if (fs.existsSync(CHECKPOINT_FILE)) {
        const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
        return new Set(data.enriched ?? []);
    }
    return new Set();
}

function saveCheckpoint(enrichedIds: Set<string>) {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ enriched: [...enrichedIds] }));
}

async function main() {
    console.log('🚀 Starting PYQ Enrichment Pipeline');
    console.log(`📡 Model: ${GEMINI_MODEL}\n`);

    const enrichedIds = loadCheckpoint();
    console.log(`📌 Already enriched: ${enrichedIds.size} questions`);

    const allQuestions: QRow[] = [];
    let from = 0;
    const CHUNK_SIZE = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('questions')
            .select('id, subject, year, prompt, options, correct_option_id')
            .eq('source', 'pyq')
            .order('year', { ascending: true })
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

    const remaining = (allQuestions as QRow[]).filter(q => !enrichedIds.has(q.id));
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

        const first = batch[0];
        process.stdout.write(`\r🔄 [${batchNum}/${totalBatches}] ${first?.subject ?? '?'} (${first?.year ?? '—'}) | ✅ ${processed} | ❌ ${errored}${etaStr}    `);

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const enriched = await enrichBatch(batch);

                for (let j = 0; j < batch.length; j++) {
                    const q = batch[j];
                    const e = enriched[j];
                    if (!q || !e) continue;

                    const { error: upErr } = await supabase.from('questions').update({
                        topic: e.topic ?? null,
                        sub_topic: e.sub_topic ?? null,
                        keywords: Array.isArray(e.keywords) ? e.keywords : [],
                        question_type: e.question_type ?? null,
                        concepts: Array.isArray(e.concepts) ? e.concepts : [],
                        difficulty_rationale: e.difficulty_rationale ?? null,
                        importance: e.importance ?? null,
                        ncert_class: e.ncert_class || null,
                        mnemonic_hint: e.mnemonic_hint || null,
                    }).eq('id', q.id);

                    if (!upErr) {
                        enrichedIds.add(q.id);
                        processed++;
                    }
                }

                saveCheckpoint(enrichedIds);
                break; // success
            } catch (err: any) {
                if (attempt < 3) {
                    await sleep(attempt * 6000);
                } else {
                    console.error(`\n⚠️  Batch ${batchNum} failed: ${err.message?.substring(0, 120)}`);
                    errored += batch.length;
                }
            }
        }

        if (i + BATCH_SIZE < remaining.length) await sleep(DELAY_MS);
    }

    console.log(`\n\n🎉 Enrichment complete!`);
    console.log(`   ✅ Processed: ${processed} questions`);
    console.log(`   ❌ Errors:    ${errored} questions`);
    console.log(`   📌 Total enriched in DB: ${enrichedIds.size}`);
}

main().catch(console.error);
