import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Count total PYQ questions
    const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('source', 'pyq');
    console.log('Total PYQ questions:', count);
    
    // Check existing columns
    const { data, error } = await supabase.from('questions').select('*').eq('source', 'pyq').limit(1);
    if (data && data[0]) {
        console.log('Current columns:', Object.keys(data[0]));
        console.log('Sample question:', JSON.stringify(data[0], null, 2));
    }
    
    // Check year distribution
    const { data: years } = await supabase.from('questions').select('year').eq('source', 'pyq');
    const yearCounts: Record<string, number> = {};
    years?.forEach((r: any) => { yearCounts[r.year] = (yearCounts[r.year] || 0) + 1; });
    console.log('\nYear distribution:', JSON.stringify(yearCounts, null, 2));
}
main();
