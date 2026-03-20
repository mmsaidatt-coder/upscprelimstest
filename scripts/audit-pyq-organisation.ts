/**
 * audit-pyq-organisation.ts
 *
 * Sends the entire PYQ question database to Gemini in batches.
 * Asks Gemini to audit whether each question is:
 *   - Correctly classified under the right Subject
 *   - Correctly assigned a Topic and Sub-topic
 *   - Well tagged with Keywords and Concepts
 *   - Given the right Question Type and Importance level
 *
 * Output: a full audit report saved to data/pyq-audit-report.json
 *         and a human-readable summary to data/pyq-audit-summary.txt
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
const BATCH_SIZE = 20;
const DELAY_MS = 2000;

// ── Types ────────────────────────────────────────────────────────────────────
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
    concepts: string[] | null;
    importance: string | null;
    ncert_class: string | null;
    mnemonic_hint: string | null;
    difficulty_rationale: string | null;
};

type AuditResult = {
    id: string;
    year: number | null;
    subject: string;
    prompt_snippet: string;
    current_topic: string | null;
    current_sub_topic: string | null;
    is_subject_correct: boolean;
    is_topic_correct: boolean;
    is_sub_topic_correct: boolean;
    is_keywords_adequate: boolean;
    is_importance_correct: boolean;
    is_question_type_correct: boolean;
    suggested_topic?: string;
    suggested_sub_topic?: string;
    suggested_keywords?: string[];
    suggested_importance?: string;
    suggested_question_type?: string;
    issues: string[];
    verdict: 'GOOD' | 'MINOR_ISSUES' | 'NEEDS_FIX';
};

// ── Gemini call ───────────────────────────────────────────────────────────────
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

// ── Format one question for audit prompt ──────────────────────────────────────
function formatForAudit(q: DbQuestion, idx: number): string {
    const opts = Array.isArray(q.options)
        ? q.options.map((o: any, i: number) => {
            if (typeof o === 'string') return `  (${String.fromCharCode(97+i)}) ${o.replace(/^\(?[a-dA-D]\)?[\s.]*/, '')}`;
            return `  (${(o.id ?? String.fromCharCode(65+i)).toLowerCase()}) ${o.text ?? o}`;
        }).join('\n')
        : '';

    return `--- QUESTION ${idx + 1} ---
ID: ${q.id}
Year: ${q.year ?? 'Unknown'} | Subject: ${q.subject}
Question: ${q.prompt.replace(/^\d+\.\s*/, '').trim()}
Options:
${opts}
Correct Answer: ${q.correct_option_id ?? 'Unknown'}
--- Current Classification ---
Topic: ${q.topic ?? 'NOT SET'}
Sub-Topic: ${q.sub_topic ?? 'NOT SET'}
Keywords: ${(q.keywords ?? []).join(', ') || 'NONE'}
Question Type: ${q.question_type ?? 'NOT SET'}
Importance: ${q.importance ?? 'NOT SET'}
NCERT: ${q.ncert_class ?? 'NOT SET'}
Mnemonic: ${q.mnemonic_hint ?? 'NONE'}`;
}

// ── Audit one batch ───────────────────────────────────────────────────────────
async function auditBatch(batch: DbQuestion[]): Promise<AuditResult[]> {
    const questionsText = batch.map((q, i) => formatForAudit(q, i)).join('\n\n');

    const prompt = `You are the world's foremost expert on UPSC Civil Services Preliminary Examination question paper analysis. Your task is to AUDIT whether the metadata classification for each UPSC PYQ question is accurate, comprehensive, and well-organised.

For each question, examine:
1. Is the SUBJECT correct? (Polity/History/Geography/Economy/Environment/Science/Current Affairs)
2. Is the TOPIC correct and specific enough for UPSC preparation? (Not too broad like "History", not too narrow)
3. Is the SUB-TOPIC correct and precise?
4. Are KEYWORDS sufficient and accurate? (Must include specific terms, article numbers, species names, treaty names etc. that a student would need to memorise)
5. Is QUESTION TYPE correctly identified? ("Factual" / "Conceptual" / "Analytical" / "Statement-Based" / "Match-the-Following" / "Chronological/Sequence" / "Identify" / "Negative (EXCEPT/NOT)")
6. Is IMPORTANCE correctly rated? ("Very High" = appears 3+ times across years, "High" = important NCERT topic, "Medium" = occasionally tested, "Low" = obscure/one-off)

Return a JSON array with ${batch.length} objects, one per question, with these EXACT fields:
{
  "id": "the question UUID exactly as given",
  "is_subject_correct": true/false,
  "is_topic_correct": true/false,
  "is_sub_topic_correct": true/false,
  "is_keywords_adequate": true/false,
  "is_importance_correct": true/false,
  "is_question_type_correct": true/false,
  "suggested_topic": "better topic if current is wrong, else same as current",
  "suggested_sub_topic": "better sub-topic if current is wrong, else same",
  "suggested_keywords": ["list", "of", "better", "keywords", "if", "inadequate"],
  "suggested_importance": "corrected importance level if wrong, else same",
  "suggested_question_type": "corrected type if wrong, else same",
  "issues": ["List specific issues found, empty array if none"],
  "verdict": "GOOD" if all fields are correct, "MINOR_ISSUES" if 1-2 small problems, "NEEDS_FIX" if topic/subject/type is wrong
}

BE STRICT. A question about "Ramsar Convention" should have keywords like "Ramsar", "wetlands", "Iran 1971", "Montreux Record". If keywords are too generic (just "environment", "ecology"), mark is_keywords_adequate as false.

Questions to audit:

${questionsText}`;

    const text = await callGemini(prompt);
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
        const vals = Object.values(parsed);
        if (Array.isArray(vals[0])) return vals[0] as AuditResult[];
        return parsed as AuditResult[];
    } catch {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) return JSON.parse(match[0]);
        throw new Error('Could not parse audit response');
    }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('🔍 PYQ Database Quality Audit\n');
    console.log('Fetching all enriched questions from database...\n');

    const { data, error } = await supabase
        .from('questions')
        .select('id, year, subject, prompt, options, correct_option_id, topic, sub_topic, keywords, question_type, concepts, importance, ncert_class, mnemonic_hint, difficulty_rationale')
        .eq('source', 'pyq')
        .not('topic', 'is', null)
        .order('subject', { ascending: true })
        .order('year', { ascending: true });

    if (error || !data) { console.error('DB fetch failed:', error); return; }

    const questions = data as DbQuestion[];
    console.log(`📋 Questions to audit: ${questions.length}\n`);

    const allResults: AuditResult[] = [];
    let good = 0, minor = 0, needsFix = 0;
    const totalBatches = Math.ceil(questions.length / BATCH_SIZE);

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;

        process.stdout.write(`\r🔄 Auditing batch ${batchNum}/${totalBatches} | ✅ ${good} GOOD | ⚠️  ${minor} MINOR | ❌ ${needsFix} NEEDS FIX    `);

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const results = await auditBatch(batch);

                // Merge prompt snippet and subject for context
                results.forEach((r, j) => {
                    const q = batch[j];
                    r.prompt_snippet = q ? q.prompt.replace(/^\d+\.\s*/, '').trim().substring(0, 80) + '...' : '';
                    r.subject = q?.subject ?? '';
                    r.year = q?.year ?? null;
                    r.current_topic = q?.topic ?? null;
                    r.current_sub_topic = q?.sub_topic ?? null;
                    if (r.verdict === 'GOOD') good++;
                    else if (r.verdict === 'MINOR_ISSUES') minor++;
                    else needsFix++;
                });
                allResults.push(...results);
                break;
            } catch (err: any) {
                if (attempt < 3) await sleep(attempt * 5000);
                else console.error(`\n⚠️  Batch ${batchNum} failed: ${err.message?.substring(0, 100)}`);
            }
        }

        if (i + BATCH_SIZE < questions.length) await sleep(DELAY_MS);
    }

    // Save full JSON report
    fs.writeFileSync('data/pyq-audit-report.json', JSON.stringify(allResults, null, 2));

    // Build human-readable summary
    const needsFixList = allResults.filter(r => r.verdict === 'NEEDS_FIX');
    const minorList = allResults.filter(r => r.verdict === 'MINOR_ISSUES');

    const summary = `
╔══════════════════════════════════════════════════════════════════════╗
║           PYQ DATABASE QUALITY AUDIT — GEMINI 2.5 FLASH            ║
╚══════════════════════════════════════════════════════════════════════╝

Total Audited: ${allResults.length} questions
✅ GOOD (no issues):          ${good} (${Math.round(good/allResults.length*100)}%)
⚠️  MINOR ISSUES (1-2 small): ${minor} (${Math.round(minor/allResults.length*100)}%)
❌ NEEDS FIX (wrong topic/type): ${needsFix} (${Math.round(needsFix/allResults.length*100)}%)

═══ QUESTIONS NEEDING FIX ═══
${needsFixList.map(r => `
• [${r.subject}] ${r.year} | ${r.current_topic} → ${r.suggested_topic}
  Sub-topic: ${r.current_sub_topic} → ${r.suggested_sub_topic}
  Issues: ${r.issues.join('; ')}
  Q: ${r.prompt_snippet}`).join('\n')}

═══ QUESTIONS WITH MINOR ISSUES ═══
Total: ${minor}
${minorList.slice(0, 20).map(r => `• [${r.subject}] ${r.year} | ${r.current_topic}: ${r.issues.join('; ')}`).join('\n')}
${minor > 20 ? `\n...and ${minor - 20} more. See pyq-audit-report.json for full details.` : ''}
`;

    fs.writeFileSync('data/pyq-audit-summary.txt', summary);

    console.log(`\n\n${'═'.repeat(60)}`);
    console.log(`📊 AUDIT COMPLETE`);
    console.log(`${'═'.repeat(60)}`);
    console.log(`✅ GOOD:        ${good} (${Math.round(good/allResults.length*100)}%)`);
    console.log(`⚠️  MINOR:       ${minor} (${Math.round(minor/allResults.length*100)}%)`);
    console.log(`❌ NEEDS FIX:   ${needsFix} (${Math.round(needsFix/allResults.length*100)}%)`);
    console.log(`\n📄 Full report: data/pyq-audit-report.json`);
    console.log(`📝 Summary:     data/pyq-audit-summary.txt`);
}

main().catch(console.error);
