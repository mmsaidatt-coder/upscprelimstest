import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
    const templateQuery = await supabase.from('test_templates').select('id').eq('slug', 'upsc-cse-prelims-2025-paper-1').single();
    const tId = templateQuery.data!.id;

    const tpqQuery = await supabase.from('test_template_questions').select('question_id, ordinal').eq('template_id', tId).order('ordinal', { ascending: true });
    const tpqs = tpqQuery.data!;
    
    // get first 10, middle 10, last 10
    const sampleTpqs = [...tpqs.slice(0, 5), ...tpqs.slice(45, 50), ...tpqs.slice(95, 100)];
    const qIds = sampleTpqs.map(t => t.question_id);
    const qQuery = await supabase.from('questions').select('id, content').in('id', qIds);
    
    const keyData = JSON.parse(fs.readFileSync('data/visionias-parsed-key.json', 'utf8'));

    const qMap = new Map(qQuery.data!.map(q => [q.id, q]));
    
    for (const t of sampleTpqs) {
        const q = qMap.get(t.question_id);
        if (q) {
            let p = q.content as any;
            if (p.prompt) p = p.prompt;
            console.log(`\nOrdinal ${t.ordinal} (Key: ${keyData[t.ordinal]}): ${String(p).substring(0, 100).replace(/\n/g, ' ')}...`);
        }
    }
}

check();
