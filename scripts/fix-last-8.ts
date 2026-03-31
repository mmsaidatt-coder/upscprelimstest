/**
 * fix-last-8.ts — Targeted fix for the remaining 8 questions from 2018
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const GEMINI_MODEL = 'gemini-3.1-pro-preview';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const MISSING_IDS = [
    '389b13bc-84df-4243-9b66-dc06814b60ed',
    'c8ed646c-87d9-4a2f-8f0e-e33acfa9b5d2',
    'c43b0fa1-f2f7-42dd-82c2-270e1470cec3',
    '74253735-32ef-4cb2-9ab9-2b9cc362e7f7',
    'c2590923-abc7-4b8f-988d-256477674f5b',
    '8ef47916-1b04-4df6-8dde-bb4b2862d704',
    '697aab13-207b-46ec-9aa4-2d4e7b4e8be5',
    '6898005b-a23b-4d0e-b7fd-085ae0d89aaf'
];

async function fixBatch(batch: any[]) {
    const questionsText = batch.map((q, i) => `=== Q${i + 1} (ID: ${q.id} | Year: ${q.year} | Subject: ${q.subject}) ===\nCorrupted Prompt: ${q.prompt}`).join('\n\n');

    const prompt = `Identify the exact original UPSC Prelims question for these corrupted 2018 Current Affairs snippets. Return a JSON array of objects with "prompt", "options" (4 objects with "id" and "text"), and "correct_option_id".\n\n${questionsText}`;

    const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    };

    const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await res.json() as any;
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

async function start() {
    const { data: questions } = await supabase.from('questions').select('*').in('id', MISSING_IDS);
    if (!questions) return;

    console.log(`Fixing ${questions.length} questions...`);
    const fixed = await fixBatch(questions);

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const f = fixed[i];
        await supabase.from('questions').update({
            prompt: f.prompt,
            options: f.options,
            correct_option_id: f.correct_option_id.toUpperCase()
        }).eq('id', q.id);
        console.log(`✅ Fixed: ${q.id}`);
    }
}

start();
