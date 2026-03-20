import * as dotenv from 'dotenv';
import * as https from 'https';
dotenv.config({ path: '.env.local' });

// Use Supabase's management API to run raw SQL
// The service role key can run raw SQL via the /rest/v1/rpc or direct REST API
// We will use the postgres connection string if available, or the management API

async function runSql(sql: string): Promise<void> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const body = JSON.stringify({ query: sql });

    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'apikey': key,
            },
        };

        const endpoint = `${url}/rest/v1/rpc/exec_sql`;
        const req = https.request(endpoint, options, (res) => {
            let data = '';
            res.on('data', (d) => { data += d; });
            res.on('end', () => {
                console.log('Result:', data.substring(0, 200));
                resolve();
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function checkColumns() {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase.from('questions').select('*').limit(1);
    if (data && data[0]) {
        const cols = Object.keys(data[0]);
        console.log('Columns:', cols.join(', '));
        return cols.includes('topic');
    }
    return false;
}

async function main() {
    const hasNewCols = await checkColumns();
    if (hasNewCols) {
        console.log('✅ New columns already exist. Migration not needed.');
        return;
    }
    
    console.log('❌ New columns missing. Please run the following SQL in Supabase Dashboard → SQL Editor:\n');
    const sql = `
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS sub_topic TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS question_type TEXT,
  ADD COLUMN IF NOT EXISTS concepts TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS difficulty_rationale TEXT,
  ADD COLUMN IF NOT EXISTS importance TEXT,
  ADD COLUMN IF NOT EXISTS ncert_class TEXT,
  ADD COLUMN IF NOT EXISTS mnemonic_hint TEXT;

CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions (topic) WHERE topic IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_keywords ON questions USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_questions_concepts ON questions USING GIN (concepts);
    `.trim();
    
    console.log(sql);
}

main();
