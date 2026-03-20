
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const GEMINI_MODEL = 'gemini-1.5-flash'; // Use the stable flash model

const MISSING_IDS = [
    '389b13bc-84df-4243-9b66-dc06814b60ed',
    'c8ed646c-87d9-4a2f-8f0e-e33acfa9b5d2',
    'c2590923-abc7-4b8f-988d-256477674f5b',
    '74253735-32ef-4cb2-9ab9-2b9cc362e7f7',
    'c43b0fa1-f2f7-42dd-82c2-270e1470cec3',
    '697aab13-207b-46ec-9aa4-2d4e7b4e8be5',
    '8ef47916-1b04-4df6-8dde-bb4b2862d704',
    '6898005b-a23b-4d0e-b7fd-085ae0d89aaf'
];

async function callGemini(prompt: string) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
    const GEMINI_MODEL = 'gemini-3.1-pro-preview';
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, response_mime_type: "application/json" }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

async function fixThese8() {
    console.log(`🔧 Fixing final 8 questions using fetch-based Gemini...`);

    const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', MISSING_IDS);

    if (error) throw error;

    for (const q of questions) {
        console.log(`Processing: [${q.year}] ${q.subject} - ${q.id}`);
        const promptText = `
Identify the ORIGINAL and CORRECT text for this UPSC Prelims question from the year ${q.year} (Subject: ${q.subject}).
Reconstruction must be 100% accurate to the original UPSC paper.

Corrupted Prompt: ${q.prompt}
Corrupted Options: ${JSON.stringify(q.options)}

Return a JSON object:
{
  "prompt": "Full clean question text",
  "options": [
    {"id": "a", "text": "Clean option text"},
    {"id": "b", "text": "Clean option text"},
    {"id": "c", "text": "Clean option text"},
    {"id": "d", "text": "Clean option text"}
  ],
  "correct_option_id": "a/b/c/d"
}
`;

        try {
            const responseText = await callGemini(promptText);
            const fixed = JSON.parse(responseText.match(/\{[\s\S]*\}/)![0]);
            
            const { error: updateError } = await supabase
                .from('questions')
                .update({
                    prompt: fixed.prompt,
                    options: fixed.options.map((o: any) => ({ ...o, id: o.id.toUpperCase() })),
                    correct_option_id: fixed.correct_option_id.toUpperCase()
                })
                .eq('id', q.id);

            if (updateError) throw updateError;
            console.log(`✅ Fixed: ${q.id}`);
        } catch (err) {
            console.error(`❌ Failed: ${q.id}`, err);
        }
    }
}

fixThese8();
