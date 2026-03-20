import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    // Test with anon key (simulating browser behavior)
    const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const r = await anonClient.from('questions').select('id, prompt, subject').eq('subject', 'Polity').ilike('prompt', '%article%').limit(3);
    console.log('ANON KEY - count:', r.data?.length, 'error:', r.error?.message);
    
    // Test .or() filter format
    const r2 = await anonClient.from('questions').select('id, prompt, subject').eq('subject', 'Polity').or('prompt.ilike.%article%,prompt.ilike.%parliament%').limit(5);
    console.log('ANON KEY .or() - count:', r2.data?.length, 'error:', r2.error?.message);
}
main();
