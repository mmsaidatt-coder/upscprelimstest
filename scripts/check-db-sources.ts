import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function run() {
  const { count } = await supabase.from('questions').select('source', {count: 'exact', head: true});
  console.log("Total Count:", count);
  
  const allMeta = await supabase.from('questions').select('source, source_label');
  const groups: Record<string, number> = {};
  allMeta.data?.forEach(d => {
      const key = `${d.source} | ${d.source_label || 'Null'}`;
      groups[key] = (groups[key] || 0) + 1;
  });
  console.table(groups);
}
run();
