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

const CA_FILE = path.join(process.cwd(), 'data', 'generated', 'current-affairs-2025-pt365-sections-gemini-3', 'final-questions.json');

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

    const { data: existing, error: fetchErr } = await supabase.from('topics').select('id, name_lower');
    if (fetchErr) throw fetchErr;

    const existingNames = new Set(existing.map(t => t.name_lower));
    existing.forEach(t => topicMap[t.name_lower] = t.id);

    const missingTopics = uniqueTopics.filter(t => !existingNames.has(t.toLowerCase()));
    
    if (missingTopics.length > 0) {
        console.log(`➕ Found ${missingTopics.length} new topics. Pushing to Supabase...`);
        const insertPayload = missingTopics.map(t => ({ name: t }));
        const { error: insertErr } = await supabase.from('topics').upsert(insertPayload, { onConflict: 'name_lower' });
        if (insertErr) {
            console.error("TOPIC INSERT ERROR:", JSON.stringify(insertErr));
            process.exit(1);
        }
        
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

async function main() {
    console.log("🚀 BOOTING CURRENT AFFAIRS INGESTION...\n");

    if (!fs.existsSync(CA_FILE)) {
        console.error(`❌ CANNOT FIND CA FILE AT: ${CA_FILE}`);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(CA_FILE, 'utf-8'));
    
    const rawQuestionToTopic: { q: any, topicRaw: string }[] = [];
    let allExtractedTopics: string[] = [];

    console.log(`📖 Loading ${data.length} Current Affairs questions into RAM...`);
    
    data.forEach((q: any) => {
        // Enforce the subject as Current Affairs for global testing distribution
        // Keep the granular subject inside the topic hierarchy so analytics still looks beautiful!
        const generatedTopicStr = q.sourceTopic ? `${q.subject} - ${q.sourceTopic}` : (q.subject || 'Uncategorized');
        allExtractedTopics.push(generatedTopicStr);

        const qRow = {
            source: 'custom',
            subject: 'Current Affairs', // Hard map to canonical struct
            difficulty: parseDifficulty(q.difficulty),
            prompt: q.prompt,
            options: q.options || [],
            correct_option_id: q.correctOptionId || null,
            explanation: q.explanation || null,
            takeaway: q.takeaway || null,
            year: q.year || 2025,
            source_label: q.exam || 'PT365 Current Affairs 2025',
            
            topic: generatedTopicStr,
            sub_topic: q.sourceSubtopic || q.sub_topic || null,
            keywords: Array.isArray(q.keywords) ? q.keywords : [],
            concepts: Array.isArray(q.concepts) ? q.concepts : [],
            question_type: q.questionType || q.question_type || null,
            difficulty_rationale: q.difficulty_rationale || null,
            importance: q.importance || null,
            ncert_class: q.ncert_class || null,
            mnemonic_hint: q.mnemonic_hint || null
        };

        rawQuestionToTopic.push({ q: qRow, topicRaw: generatedTopicStr });
    });

    // 1. Sync Topics Relational DB
    const topicUUIDMap = await syncTopics(allExtractedTopics);

    // 2. Insert Questions in strict chunks
    console.log(`\n⏳ Pumping Questions to Supabase exactly 500 at a time...`);
    const qBatchSize = 500;
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

        inserted.forEach((row, rowIdx) => {
             insertedQuestions.push({ uuid: row.id, topicRaw: batch[rowIdx].topicRaw });
        });

        console.log(`➡️ Pushed ${(i + batch.length > rawQuestionToTopic.length ? rawQuestionToTopic.length : i + batch.length)} / ${rawQuestionToTopic.length} Questions`);
    }

    // 3. Connect normalized `question_topics` bridge table
    console.log(`\n⏳ Mapping M2M relationships in question_topics...`);
    const qTopicPayload = insertedQuestions.map(obj => {
        return {
             question_id: obj.uuid,
             topic_id: topicUUIDMap[obj.topicRaw.toLowerCase()]
        };
    }).filter(payload => payload.topic_id); 

    for (let i = 0; i < qTopicPayload.length; i += qBatchSize) {
        const batch = qTopicPayload.slice(i, i + qBatchSize);
        const { error: bridgeErr } = await supabase.from('question_topics').insert(batch);
        if (bridgeErr) console.warn(`⚠️ M2M Warning:`, bridgeErr.message);
    }

    console.log(`\n🏆 CURRENT AFFAIRS DATABASE MAPPED! OVER ${insertedQuestions.length} ROWS SECURELY MOVED TO PRODUCTION DB!`);
}

main();
