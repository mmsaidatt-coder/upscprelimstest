import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const subjectMap: Record<string, string> = {
  polity: 'Polity',
  history: 'History',
  economics: 'Economy',
  economy: 'Economy',
  geography: 'Geography',
  environment: 'Environment',
  'science & tech': 'Science',
  'science and tech': 'Science',
  science: 'Science',
  'current affairs': 'Current Affairs',
  csat: 'CSAT',
};

function normalizeSubject(s: string): string {
  return subjectMap[(s || '').toLowerCase().trim()] || 'Current Affairs';
}

function optionLetter(text: string): string {
  const m = text.trim().match(/^\(?(a|b|c|d)\)?[.)]/i);
  return m ? m[1].toUpperCase() : '';
}

async function main() {
  const year = 2025;
  const slug = `upsc-cse-prelims-${year}-paper-1`;
  const title = `UPSC CSE Prelims ${year} (Paper 1)`;

  const dataPath = path.join(process.cwd(), 'data', 'Prelims_2025_Set_A-extracted.json');
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const rawQuestions: any[] = raw.questions ?? raw;

  console.log(`📥  Loaded ${rawQuestions.length} raw questions for ${year}`);

  // ── 1. Remove old 2025 data ──────────────────────────────────────────────
  console.log('🧹  Removing existing 2025 template & questions...');
  const { data: existing } = await supabase
    .from('test_templates')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from('test_template_questions').delete().eq('template_id', existing.id);
    await supabase.from('test_templates').delete().eq('id', existing.id);
    console.log('   Removed old template:', existing.id);
  }

  await supabase.from('questions').delete().eq('year', year).eq('source', 'pyq');
  console.log('   Removed old 2025 questions from questions table.');

  // ── 2. Insert test template ───────────────────────────────────────────────
  const { data: template, error: tmplErr } = await supabase
    .from('test_templates')
    .insert({
      slug,
      title,
      tagline: `Official Previous Year Question Paper for ${year}.`,
      description: `Full length test for the year ${year} based on official UPSC questions.`,
      duration_minutes: 120,
      question_count: rawQuestions.length,
    })
    .select('id')
    .single();

  if (tmplErr || !template) {
    console.error('❌  Failed to insert template:', tmplErr);
    process.exit(1);
  }
  console.log(`✅  Created template id=${template.id}`);

  // ── 3. Insert questions & link to template ───────────────────────────────
  let inserted = 0;
  let position = 1;

  for (const q of rawQuestions) {
    const text = (q.questionText || '').replace(/^\d+\.\s*/, '').trim();
    if (!text) continue;

    // Parse options: list of strings like "(a) Some text"
    const rawOptions: string[] = q.options ?? [];
    const options = rawOptions.map((opt: string) => {
      const letter = optionLetter(opt);
      // Strip the "(a) " prefix from the text
      const cleaned = opt.replace(/^\(?(a|b|c|d)\)?[.)]\s*/i, '').trim();
      return { id: letter || String(rawOptions.indexOf(opt) + 1), text: cleaned };
    });

    // Correct option is usually null for 2025 (paper just released)
    let correctOptionId: string | null = null;
    if (q.correctOption && typeof q.correctOption === 'string') {
      const m = q.correctOption.trim().match(/^[a-d]/i);
      if (m) correctOptionId = m[0].toUpperCase();
    }

    const subject = normalizeSubject(q.subject ?? '');

    const { data: qRow, error: qErr } = await supabase
      .from('questions')
      .insert({
        prompt: text,
        options,
        correct_option_id: correctOptionId,
        subject,
        year,
        source: 'pyq',
        source_label: `UPSC CSE Prelims ${year}`,
        difficulty: 'Moderate',
      })
      .select('id')
      .single();

    if (qErr || !qRow) {
      console.warn(`  ⚠️  Q${position} insert failed:`, qErr?.message);
      continue;
    }

    const { error: linkErr } = await supabase.from('test_template_questions').insert({
      template_id: template.id,
      question_id: qRow.id,
      ordinal: position,
    });

    if (linkErr) {
      console.warn(`  ⚠️  Q${position} link failed:`, linkErr.message);
    } else {
      inserted++;
      position++;
    }
  }

  console.log(`\n🎉  Done! Inserted ${inserted}/${rawQuestions.length} questions for ${year}`);
  console.log(`   Test template: "${title}" (${slug})`);
}

main().catch(console.error);
