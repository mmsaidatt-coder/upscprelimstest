import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars. Check your .env.local file.");
  process.exit(1);
}

// Bypass RLS using service role key
const supabase = createClient(supabaseUrl, supabaseKey);

const subjectMap: Record<string, string> = {
  'polity': 'Polity',
  'history': 'History',
  'economics': 'Economy',
  'economy': 'Economy',
  'geography': 'Geography',
  'environment': 'Environment',
  'science & tech': 'Science',
  'science and tech': 'Science',
  'science': 'Science',
  'current affairs': 'Current Affairs',
  'csat': 'CSAT'
};

function normalizeSubject(s: string): string {
  const norm = (s || '').toLowerCase().trim();
  return subjectMap[norm] || 'Current Affairs';
}

function normalizeOptionId(val: any): string | null {
  if (!val || typeof val !== 'string') return null;
  const match = val.match(/^[a-d]/i);
  if (match) return match[0].toUpperCase();
  return null;
}

async function main() {
  console.log("🚀 Starting database import...");

  // 1. Flush old test templates and PYQ questions to ensure clean slate
  console.log("🧹 Flushing existing PYQ data to prevent duplicates...");
  await supabase.from('test_templates').delete().like('slug', 'upsc-cse-prelims-%');
  await supabase.from('questions').delete().eq('source', 'pyq');

  const dataPath = path.join(process.cwd(), 'data', 'refined-pyq-bank.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const questions = JSON.parse(rawData);

  // Group by year
  const byYear = new Map<number, any[]>();
  for (const q of questions) {
    const yStr = String(q.year).trim();
    // Default to 2011 if undefined or unparseable to avoid crashing
    let y = parseInt(yStr);
    if (isNaN(y) || y < 1990 || y > 2100) y = 2024;
    
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(q);
  }

  // Iterate over each year in chronological order
  for (const [year, qs] of Array.from(byYear.entries()).sort((a,b) => a[0] - b[0])) {
    console.log(`\n📦 Building Test Template for Year ${year} (${qs.length} questions)...`);

    const title = `UPSC CSE Prelims ${year} (Paper 1)`;
    const slug = `upsc-cse-prelims-${year}-paper-1`;

    // Insert the test template
    const tmplRes = await supabase.from('test_templates').insert({
      slug,
      title,
      tagline: `Official Previous Year Question Paper for ${year}.`,
      description: `Full length test for the year ${year} based on the official UPSC questions.`,
      duration_minutes: 120,
      difficulty_label: 'Moderate',
      question_count: qs.length,
      is_published: true
    }).select('id').single();

    if (tmplRes.error) {
      console.error(`❌ Error creating template for ${year}:`, tmplRes.error);
      continue;
    }
    const templateId = tmplRes.data.id;

    // Insert all questions sequentially (or batch them if preferred, but doing sequential to get IDs)
    let ordinal = 1;
    let successCount = 0;

    for (const q of qs) {
       let opts = Array.isArray(q.options) ? [...q.options] : [];
       while (opts.length < 4) opts.push("-");
       opts = opts.slice(0, 4); // Exact 4 due to postgres constraint

       const dbQ = {
         source: 'pyq',
         subject: normalizeSubject(q.subject),
         difficulty: 'Moderate',
         prompt: q.questionText || 'Missing question text',
         options: opts,
         correct_option_id: normalizeOptionId(q.correctOption),
         year: year,
         marks: 2.0,
         negative_marks: 0.67
       };

       const { data: insertedQ, error: qErr } = await supabase.from('questions').insert(dbQ).select('id').single();
       if (qErr) {
          console.error(`❌ Error inserting question ${ordinal} in ${year}:`, dbQ.prompt.substring(0, 40), qErr);
          continue;
       }

       // Map to template
       const { error: mapErr } = await supabase.from('test_template_questions').insert({
          template_id: templateId,
          question_id: insertedQ.id,
          ordinal: ordinal
       });

       if (mapErr) {
         console.error(`❌ Error mapping question ordinal ${ordinal} in ${year}:`, mapErr);
       } else {
         successCount++;
       }
       ordinal++;
    }
    console.log(`✅ Successfully mapped ${successCount} questions for ${year} test.`);
  }

  console.log("\n🎉 ALL DONE! Import completed successfully.");
}

main().catch(console.error);
