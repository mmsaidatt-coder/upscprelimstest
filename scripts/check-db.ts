import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExisiting() {
    const { count, error } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('source', 'pyq');
    console.log(`Current existing PYQ questions: ${count}`);
}

checkExisiting();
