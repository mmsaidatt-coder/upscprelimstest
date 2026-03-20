import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function updateDatabase() {
    const keyData = JSON.parse(fs.readFileSync('data/visionias-parsed-key-with-text.json', 'utf8'));
    console.log("Loaded", keyData.length, "answers from VisionIAS key.");

    const templateQuery = await supabase.from('test_templates').select('id').eq('slug', 'upsc-cse-prelims-2025-paper-1').single();
    const tId = templateQuery.data!.id;

    const tpqQuery = await supabase.from('test_template_questions').select('question_id, ordinal').eq('template_id', tId).order('ordinal', { ascending: true });
    const tpqs = tpqQuery.data!;
    
    const qIds = tpqs.map(t => t.question_id);
    const qQuery = await supabase.from('questions').select('id, prompt').in('id', qIds);
    if (qQuery.error) {
        console.error("Error fetching questions:", qQuery.error);
        return;
    }
    const questions = qQuery.data!;
    
    // Normalize string for fuzzy matching
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    let matchCount = 0;
    
    for (const q of questions) {
        let promptText = "";
        if (typeof q.prompt === 'string') {
            promptText = q.prompt;
        } else if (q.prompt && typeof q.prompt === 'object') {
            promptText = (q.prompt as any).prompt || String(q.prompt);
        }
        
        const normDb = normalize(promptText);
        
        // Find best match in keyData
        let bestMatch = null;
        let maxOverlap = 0;
        
        for (const kd of keyData) {
            const normKey = normalize(kd.snippet);
            // We'll check if the 20-30 characters of key snippet appears in the DB prompt
            // Or just check prefix matching
            let overlap = 0;
            const minLen = Math.min(normDb.length, normKey.length);
            for (let i = 0; i < minLen; i++) {
                if (normDb[i] === normKey[i]) overlap++;
                else break;
            }
            
            // If prefix doesn't match perfectly, let's just see if the normKey is a substring of normDb
            let score = overlap;
            if (normDb.includes(normKey)) {
                score = normKey.length;
            }
            
            if (score > maxOverlap) {
                maxOverlap = score;
                bestMatch = kd;
            }
        }
        
        if (bestMatch && maxOverlap > 10) {
            // Find option id matching A, B, C, D
            let correctOptionId = bestMatch.answer; // "A", "B", "C", "D"
            
            // Update the question
            const updateRes = await supabase.from('questions').update({ correct_option_id: correctOptionId }).eq('id', q.id);
            if (updateRes.error) {
                console.error("Failed to update question", q.id, updateRes.error);
            } else {
                matchCount++;
            }
        } else {
            console.log("No confident match found for DB Question prompt:", promptText.substring(0, 50));
        }
    }
    
    console.log(`Successfully mapped and updated ${matchCount} out of ${questions.length} questions.`);
}

updateDatabase();
