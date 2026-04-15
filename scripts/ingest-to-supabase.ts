import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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

const PIPELINE_OUT_DIR = path.join(process.cwd(), 'data', 'pipeline-output');

const SUBJECT_MAP: Record<string, string> = {
    'polity': 'Polity', 'history': 'History', 'economy': 'Economy', 'geography': 'Geography',
    'environment': 'Environment', 'science': 'Science', 'current affairs': 'Current Affairs', 'csat': 'CSAT'
};

async function syncTopics(allExtractedTopics: string[]): Promise<Record<string, string>> {
    const normalizedTopicMap = new Map<string, string>();
    allExtractedTopics.filter(Boolean).forEach(t => {
        const clean = t.trim();
        const lower = clean.toLowerCase();
        if (!normalizedTopicMap.has(lower)) normalizedTopicMap.set(lower, clean);
    });
    const uniqueTopics = Array.from(normalizedTopicMap.values());
    const topicMap: Record<string, string> = {};

    console.log(`\n⏳ Syncing ${uniqueTopics.length} mathematically unique topics structurally to DB...`);

    // Fetch existing
    const { data: existing, error: fetchErr } = await supabase.from('topics').select('id, name_lower');
    if (fetchErr) throw fetchErr;

    const existingNames = new Set(existing.map(t => t.name_lower));
    existing.forEach(t => topicMap[t.name_lower] = t.id);

    // Identify missing
    const missingTopics = uniqueTopics.filter(t => !existingNames.has(t.toLowerCase()));
    
    if (missingTopics.length > 0) {
        console.log(`➕ Found ${missingTopics.length} entirely new topics. Pushing to Supabase...`);
        const insertPayload = missingTopics.map(t => ({ name: t }));
        const { error: insertErr } = await supabase.from('topics').upsert(insertPayload, { onConflict: 'name_lower' });
        if (insertErr) {
            console.error("TOPIC INSERT ERROR:", JSON.stringify(insertErr));
            process.exit(1);
        }
        
        // Re-pull to seamlessly map absolutely all new UUIDs natively
        const { data: finalFetch } = await supabase.from('topics').select('id, name_lower');
        finalFetch?.forEach(t => topicMap[t.name_lower] = t.id);
    }
    
    return topicMap;
}

function parseDifficulty(diff: string): string {
    if (!diff) return 'Moderate';
    const clean = diff.toUpperCase();
    if (clean.includes('EASY')) return 'Easy';
    if (clean.includes('HARD')) return 'Hard';
    return 'Moderate';
}

function parseOptions(opts: string[]) {
    const defaultIds = ['A', 'B', 'C', 'D'];
    return opts.map((optLine, i) => {
        const text = optLine.replace(/^\([A-Da-d]\)\s*/, '').trim();
        return { id: defaultIds[i], text };
    });
}

function parseCorrectOption(val: string): string | null {
    if (!val || val === 'null') return null;
    const clean = val.replace(/[^A-Za-z]/g, '').toUpperCase();
    return ['A','B','C','D'].includes(clean) ? clean : null;
}

async function main() {
    console.log("🚀 BOOTING MASS SUPABASE INGESTION...\n");

    const files = fs.readdirSync(PIPELINE_OUT_DIR).filter(f => f.endsWith('.json'));
    
    const allQuestionsToInsert: any[] = [];
    const rawQuestionToTopic: { q: any, topicRaw: string }[] = [];
    let allExtractedTopics: string[] = [];

    // Parse all files locally first safely into RAM
    console.log(`📖 Loading ${files.length} mapping files securely into RAM...`);
    
    files.forEach(f => {
        if (fs.statSync(path.join(PIPELINE_OUT_DIR, f)).size < 1000) return;
        const data = JSON.parse(fs.readFileSync(path.join(PIPELINE_OUT_DIR, f), 'utf-8'));
        
        const sourceLabel = f.replace('-mapped.json', '').substring(0, 150); // limit string len safely

        data.forEach((q: any) => {
            const topicStr = q.topic ? q.topic.trim() : 'Uncategorized';
            allExtractedTopics.push(topicStr);

            const qRow = {
                source: 'custom',
                subject: SUBJECT_MAP[q.subject?.toLowerCase()] || 'Polity', // Fallback cleanly
                difficulty: parseDifficulty(q.difficulty),
                prompt: q.questionText,
                options: parseOptions(q.options || []),
                correct_option_id: parseCorrectOption(q.correctOption),
                explanation: q.explanation || null,
                year: q.year || null,
                source_label: sourceLabel,
                
                topic: topicStr, // direct text AI column 
                sub_topic: q.sub_topic || null,
                keywords: Array.isArray(q.keywords) ? q.keywords : [],
                concepts: Array.isArray(q.concepts) ? q.concepts : [],
                question_type: q.question_type || null,
                difficulty_rationale: q.difficulty_rationale || null,
                importance: q.importance || null,
                ncert_class: q.ncert_class || null,
                mnemonic_hint: q.mnemonic_hint || null
            };

            rawQuestionToTopic.push({ q: qRow, topicRaw: topicStr });
        });
    });

    console.log(`✅ Fully loaded ${rawQuestionToTopic.length} perfectly mapped question lines.`);

    // 1. Sync Topics Relational DB
    const topicUUIDMap = await syncTopics(allExtractedTopics);

    // 2. Insert Questions in strict 500-sized Blocks to respect limits
    console.log(`\n⏳ Pumping Questions to Supabase exactly 500 at a time...`);
    const qBatchSize = 500;
    
    // We will track the newly inserted UUIDs to link them directly to question_topics
    const insertedQuestions: { uuid: string, topicRaw: string }[] = [];

    for (let i = 0; i < rawQuestionToTopic.length; i += qBatchSize) {
        const batch = rawQuestionToTopic.slice(i, i + qBatchSize);
        const uploadPayload = batch.map(m => m.q);
        
        const { data: inserted, error: insertErr } = await supabase
            .from('questions')
            .insert(uploadPayload)
            .select('id');
            
        if (insertErr) {
            console.error(`❌ DB Insert Crash!`, insertErr.message);
            console.error(JSON.stringify(insertErr.details));
            process.exit(1);
        }

        // Keep mapping structure parallel
        inserted.forEach((row, rowIdx) => {
             insertedQuestions.push({ uuid: row.id, topicRaw: batch[rowIdx].topicRaw });
        });

        console.log(`➡️ Pushed ${(i + batch.length)} / ${rawQuestionToTopic.length} Questions`);
    }

    // 3. Connect normalized `question_topics` bridge table
    console.log(`\n⏳ Mapping many-to-many relationship rows in question_topics...`);
    const qTopicPayload = insertedQuestions.map(obj => {
        return {
             question_id: obj.uuid,
             topic_id: topicUUIDMap[obj.topicRaw.toLowerCase()]
        };
    }).filter(payload => payload.topic_id); // Filter safety net 

    for (let i = 0; i < qTopicPayload.length; i += qBatchSize) {
        const batch = qTopicPayload.slice(i, i + qBatchSize);
        const { error: bridgeErr } = await supabase.from('question_topics').insert(batch);
        if (bridgeErr) {
            console.warn(`⚠️ M2M Warning:`, bridgeErr.message);
        }
    }

    console.log(`\n🏆 MASSIVE SUCCESS! OVER ${insertedQuestions.length} ROWS SECURELY MOVED TO PRODUCTION DB!`);
}

main();
