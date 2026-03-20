/**
 * fix-audit-issues.ts
 *
 * Reads the audit report, re-classifies all NEEDS_FIX and MINOR_ISSUES
 * questions using Gemini 3.1 Pro Preview, and applies corrections to DB.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const GEMINI_MODEL = 'gemini-3.1-pro-preview';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const BATCH_SIZE = 10;
const DELAY_MS = 2000;

type AuditResult = {
    id: string;
    year: number | null;
    subject: string;
    verdict: 'GOOD' | 'MINOR_ISSUES' | 'NEEDS_FIX';
    suggested_topic?: string;
    suggested_sub_topic?: string;
    suggested_keywords?: string[];
    suggested_importance?: string;
    suggested_question_type?: string;
    issues: string[];
};

type DbQuestion = {
    id: string;
    year: number | null;
    subject: string;
    prompt: string;
    options: any;
    correct_option_id: string | null;
    topic: string | null;
    sub_topic: string | null;
    keywords: string[] | null;
    question_type: string | null;
    importance: string | null;
};

type FixedData = {
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

async function callGemini(promptText: string): Promise<string> {
    const body = {
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 16384,
            responseMimeType: 'application/json',
        },
    };
    const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini ${res.status}: ${err.substring(0, 200)}`);
    }
    const data = await res.json() as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function formatOptions(opts: any): string {
    if (!Array.isArray(opts)) return '';
    return opts.map((o: any, i: number) => {
        if (typeof o === 'string') return `  (${String.fromCharCode(97+i)}) ${o.replace(/^\(?[a-dA-D]\)?[\s.]*/, '')}`;
        return `  (${(o.id ?? String.fromCharCode(65+i)).toLowerCase()}) ${o.text ?? o}`;
    }).join('\n');
}

async function fixBatch(batch: DbQuestion[], auditIssues: Record<string, string[]>): Promise<FixedData[]> {
    const questionsText = batch.map((q, i) => {
        const issues = auditIssues[q.id] ?? [];
        return `=== Q${i+1} (ID: ${q.id} | Year: ${q.year} | Current Subject: ${q.subject}) ===
Question: ${q.prompt.replace(/^\d+\.\s*/, '').trim()}
Options:
${formatOptions(q.options)}
Correct Answer: ${q.correct_option_id ?? 'Unknown'}
Current Classification: Topic="${q.topic}" | Sub-topic="${q.sub_topic}" | Type="${q.question_type}" | Importance="${q.importance}"
Audit Issues Found: ${issues.join('; ')}`;
    }).join('\n\n');

    const prompt = `You are the world's top UPSC exam expert. The following UPSC PYQ questions were flagged as having classification issues during an audit. 

For each question, provide a CORRECTED and PRECISE classification. Fix all the issues mentioned.

KEY RULES:
- "Current Affairs" subject should ONLY be used for questions that are purely about recent events, schemes launched after 2010, or specific government reports/rankings. Static geography, history, polity fundamentals should NOT be "Current Affairs".
- Topics must be SPECIFIC (e.g., "Emergency Provisions" not "Indian Polity"; "Mughal Architecture" not "Medieval India"; "Balance of Payments" not "Economy").
- Keywords must include SPECIFIC testable terms: article numbers, species names, treaty names, place names, act names — not generic words.
- Importance: "Very High" = topic tested 3+ times in UPSC history; "High" = frequently tested NCERT concept; "Medium" = occasionally tested; "Low" = obscure one-off.

Return a JSON array with ${batch.length} objects. Each object must have EXACTLY these fields:
{
  "topic": "specific topic name",
  "sub_topic": "more specific sub-topic",
  "keywords": ["specific", "testable", "terms", "articles", "names"],
  "question_type": "Factual|Conceptual|Analytical|Statement-Based|Match-the-Following|Chronological/Sequence|Identify|Negative (EXCEPT/NOT)",
  "concepts": ["broad concept 1", "broader concept 2", "concept 3"],
  "difficulty_rationale": "one sentence why easy/moderate/hard",
  "importance": "Very High|High|Medium|Low",
  "ncert_class": "e.g. XI Polity Ch.2 or empty string",
  "mnemonic_hint": "clever memory trick or empty string"
}

Questions to fix:

${questionsText}`;

    const text = await callGemini(prompt);
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
        const vals = Object.values(parsed);
        if (Array.isArray(vals[0])) return vals[0] as FixedData[];
    } catch {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) return JSON.parse(match[0]);
    }
    throw new Error('Could not parse fix response as JSON array');
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
    console.log('🔧 Applying Audit Fixes with Gemini 3.1 Pro Preview\n');

    // Load audit report
    const auditData: AuditResult[] = JSON.parse(fs.readFileSync('data/pyq-audit-report.json', 'utf8'));
    
    // Get IDs of questions needing fix
    const toFix = auditData.filter(r => r.verdict === 'NEEDS_FIX' || r.verdict === 'MINOR_ISSUES');
    const fixIds = new Set(toFix.map(r => r.id));
    const issueMap: Record<string, string[]> = {};
    toFix.forEach(r => { issueMap[r.id] = r.issues; });

    console.log(`📋 Questions to re-classify: ${toFix.length}`);
    console.log(`   NEEDS_FIX: ${toFix.filter(r => r.verdict === 'NEEDS_FIX').length}`);
    console.log(`   MINOR_ISSUES: ${toFix.filter(r => r.verdict === 'MINOR_ISSUES').length}\n`);

    // Fetch full question data from DB
    const { data: questions, error } = await supabase
        .from('questions')
        .select('id, year, subject, prompt, options, correct_option_id, topic, sub_topic, keywords, question_type, importance')
        .in('id', [...fixIds]);

    if (error || !questions) { console.error('DB fetch failed:', error); return; }

    const qMap = new Map((questions as DbQuestion[]).map(q => [q.id, q]));
    const orderedQuestions = toFix.map(r => qMap.get(r.id)).filter(Boolean) as DbQuestion[];

    console.log(`📥 Fetched ${orderedQuestions.length} questions from DB\n`);

    let fixed = 0, errored = 0;
    const totalBatches = Math.ceil(orderedQuestions.length / BATCH_SIZE);

    for (let i = 0; i < orderedQuestions.length; i += BATCH_SIZE) {
        const batch = orderedQuestions.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;

        process.stdout.write(`\r🔄 [${batchNum}/${totalBatches}] | ✅ Fixed: ${fixed} | ❌ Errors: ${errored}    `);

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const fixes = await fixBatch(batch, issueMap);

                for (let j = 0; j < batch.length; j++) {
                    const q = batch[j];
                    const f = fixes[j];
                    if (!f) continue;

                    const { error: upErr } = await supabase
                        .from('questions')
                        .update({
                            topic: f.topic ?? null,
                            sub_topic: f.sub_topic ?? null,
                            keywords: Array.isArray(f.keywords) ? f.keywords : [],
                            question_type: f.question_type ?? null,
                            concepts: Array.isArray(f.concepts) ? f.concepts : [],
                            difficulty_rationale: f.difficulty_rationale ?? null,
                            importance: f.importance ?? null,
                            ncert_class: f.ncert_class || null,
                            mnemonic_hint: f.mnemonic_hint || null,
                        })
                        .eq('id', q.id);

                    if (!upErr) fixed++;
                    else console.error(`\n⚠️  Update failed for ${q.id}:`, upErr.message);
                }
                break;
            } catch (err: any) {
                if (attempt < 3) await sleep(attempt * 6000);
                else { console.error(`\n⚠️  Batch ${batchNum} failed: ${err.message?.substring(0, 120)}`); errored += batch.length; }
            }
        }

        if (i + BATCH_SIZE < orderedQuestions.length) await sleep(DELAY_MS);
    }

    console.log(`\n\n🎉 Fix complete!`);
    console.log(`   ✅ Fixed: ${fixed} questions`);
    console.log(`   ❌ Errors: ${errored}`);
}

main().catch(console.error);
