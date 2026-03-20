import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAnswerKey() {
    const keyData = JSON.parse(fs.readFileSync('data/visionias-parsed-key.json', 'utf8'));
    console.log("Loaded answer key with", Object.keys(keyData).length, "answers");

    // Fetch the test template ID for 2025 paper
    const templateQuery = await supabase
        .from('test_templates')
        .select('id')
        .eq('slug', 'upsc-cse-prelims-2025-paper-1')
        .single();
        
    if (templateQuery.error || !templateQuery.data) {
        console.error("Failed to fetch template:", templateQuery.error);
        return;
    }
    const templateId = templateQuery.data.id;
    console.log("Template ID:", templateId);

    // Fetch all 100 questions linked to this template
    const tpqQuery = await supabase
        .from('test_template_questions')
        .select('question_id, ordinal')
        .eq('template_id', templateId)
        .order('ordinal', { ascending: true });
        
    if (tpqQuery.error || !tpqQuery.data) {
        console.error("Failed to fetch template questions:", tpqQuery.error);
        return;
    }
    
    const tpqData = tpqQuery.data;
    console.log("Found", tpqData.length, "questions in the test template.");
    
    // Check if the IDs 1-100 logic correctly maps to ordinals
    let updatedCount = 0;
    let errors = 0;
    
    // Notice that our ordinals might be 1-97 and then 98-100.
    // In our manual insertion script, we inserted the missing 3 as positions 98, 99, 100.
    // However, the original document's Q5, Q6, Q7 were missing. So the "ordinal 5" in our DB was actually Q8 from the PDF, which means the ordinals from 5 to 97 are shifted by 3 from the PDF's perspective?
    // Let's print out the first few questions to see if their ordinals match the VisionIAS key numbers.
    // Wait, the extracted JSON questions correspond to the numbering in the VisionIAS key! 
    // Wait, I inserted them in the order they appeared in the extracted list. If it's a 1-to-1 match to the VisionIAS GS Paper 1, then VisionIAS Q1 should be Ordinal 1, Q2 should be Ordinal 2...
    // Let's actually verify this by just printing out a few question texts from the DB.
    
    const sampleTpq = tpqData.slice(0, 10);
    const qIds = sampleTpq.map(t => t.question_id);
    
    const qQuery = await supabase.from('questions').select('id, content').in('id', qIds);
    if (!qQuery.error && qQuery.data) {
        const qMap = new Map(qQuery.data.map(q => [q.id, q]));
        console.log("Samples of first 10 questions:");
        for (const t of sampleTpq) {
            const q = qMap.get(t.question_id);
            if (q) {
                // Parse options to see the text
                let contentText = "";
                if (typeof q.content === 'object' && q.content !== null) {
                    contentText = (q.content as any).prompt ? (q.content as any).prompt.substring(0, 80) : JSON.stringify(q.content).substring(0, 80);
                } else {
                    contentText = String(q.content).substring(0, 80);
                }
                console.log(`Ordinal ${t.ordinal}: ${contentText.replace(/\n/g, ' ')}`);
            }
        }
    }
}

updateAnswerKey();
