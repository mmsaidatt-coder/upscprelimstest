import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const r = await s.from('questions').select('id, prompt, subject').eq('subject', 'Polity').limit(3);
    const qs = r.data as { subject: string; prompt: string }[];
    console.log(JSON.stringify(qs?.map(q => ({ subject: q.subject, prompt: q.prompt.substring(0, 120) }))));
    
    // also test ilike
    const r2 = await s.from('questions').select('id, prompt, subject').eq('subject', 'Polity').ilike('prompt', '%article%').limit(3);
    console.log('ilike article count:', r2.data?.length, 'error:', r2.error);
}
main();
