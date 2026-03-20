
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const CHECKPOINT_FILE = path.join(process.cwd(), 'data', 'pyq-fix-checkpoint.json');

async function findMissing() {
    if (!fs.existsSync(CHECKPOINT_FILE)) {
        console.error('Checkpoint file not found');
        return;
    }

    const checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    const fixedIds = new Set(checkpoint.fixed || []);

    const { data: allQuestions, error } = await supabase
        .from('questions')
        .select('id, year, subject, prompt')
        .eq('source', 'pyq');

    if (error) {
        console.error('Error fetching questions:', error);
        return;
    }

    const missing = allQuestions.filter(q => !fixedIds.has(q.id));
    console.log(`Found ${missing.length} missing questions:`);
    missing.forEach(q => {
        console.log(`- [${q.year}] [${q.subject}] ID: ${q.id} | Prompt snippet: ${q.prompt.substring(0, 50)}...`);
    });
}

findMissing();
