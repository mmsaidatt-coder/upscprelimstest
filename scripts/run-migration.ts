import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runMigration() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const sqls = [
        `ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic TEXT`,
        `ALTER TABLE questions ADD COLUMN IF NOT EXISTS sub_topic TEXT`,
        `ALTER TABLE questions ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}'`,
        `ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type TEXT`,
        `ALTER TABLE questions ADD COLUMN IF NOT EXISTS concepts TEXT[] DEFAULT '{}'`,
        `ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty_rationale TEXT`,
        `ALTER TABLE questions ADD COLUMN IF NOT EXISTS importance TEXT`,
        `ALTER TABLE questions ADD COLUMN IF NOT EXISTS ncert_class TEXT`,
        `ALTER TABLE questions ADD COLUMN IF NOT EXISTS mnemonic_hint TEXT`,
    ];

    for (const sql of sqls) {
        const { error } = await supabase.rpc('exec_sql', { sql }).single();
        if (error) {
            // Try direct approach if RPC doesn't exist
            console.log('RPC not available, trying fetch approach for:', sql.substring(0, 50));
        } else {
            console.log('✅ Ran:', sql.substring(0, 50));
        }
    }
    
    // Verify columns were added
    const { data, error } = await supabase.from('questions').select('*').limit(1);
    if (data && data[0]) {
        console.log('Current columns:', Object.keys(data[0]).join(', '));
        const hasNewCols = 'topic' in data[0];
        console.log('New columns present:', hasNewCols ? '✅ YES' : '❌ NO — Run the SQL manually in Supabase Dashboard');
    }
}

runMigration();
