import { createClient } from '@supabase/supabase-js';
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

async function main() {
  const year = 2025; // The template uses 2025 for this paper internally based on the user's uploaded name
  const slug = `upsc-cse-prelims-${year}-paper-1`;

  console.log(`🔍 Looking for test template: ${slug}`);
  const { data: template, error: tmplErr } = await supabase
    .from('test_templates')
    .select('id')
    .eq('slug', slug)
    .single();

  if (tmplErr || !template) {
    console.error('❌ Template not found:', tmplErr);
    process.exit(1);
  }

  const newQuestions = [
    {
      prompt: `Consider the following statements :
Statement-I : Sumed pipeline is a strategic route for Persian Gulf oil and natural gas shipments to Europe.
Statement-II : Sumed pipeline connects the Red Sea with the Mediterranean Sea.
Which one of the following is correct in respect of the above statements?`,
      options: [
        { id: 'A', text: 'Both Statement-I and Statement-II are correct and Statement-II explains Statement-I' },
        { id: 'B', text: 'Both Statement-I and Statement-II are correct and Statement-I explains Statement-II' },
        { id: 'C', text: 'Only one of the Statements II and III is correct and that explains Statement I' },
        { id: 'D', text: 'Neither Statement I nor Statement II is correct' }
      ],
      subject: 'Geography',
      position: 98
    },
    {
      prompt: `Consider the following statements :
Statement-I : Rainfall is one of the reasons for weathering of rocks.
Statement-II : Rainwater contains carbon dioxide in solution.
Statement-III : Rainwater contains atmospheric oxygen.
Which one of the following is correct in respect of the above statements?`,
      options: [
        { id: 'A', text: 'Both Statement-II and Statement-III are correct and both of them explain Statement-I' },
        { id: 'B', text: 'Both Statement-II and Statement-III are correct but only one of them explains Statement-I' },
        { id: 'C', text: 'Only one of the Statements II and III is correct and that explains Statement-I' },
        { id: 'D', text: 'Neither Statement-II nor Statement-III is correct' }
      ],
      subject: 'Geography',
      position: 99
    },
    {
      prompt: `Consider the following statements :
Statement-I : If the United States of America (USA) were to default on its debt, holders of US Treasury Bonds will not be able to exercise their claims to receive payment.
Statement-II : The USA Government debt is not backed by any hard assets, but only by the faith of the Government.
Which one of the following is correct in respect of the above statements?`,
      options: [
        { id: 'A', text: 'Both Statement-I and Statement-II are correct and Statement-II explains Statement-I' },
        { id: 'B', text: 'Both Statement-I and Statement-II are correct and Statement-I explains Statement-II' },
        { id: 'C', text: 'Statement-I is correct but Statement-II is incorrect' },
        { id: 'D', text: 'Statement-I is incorrect but Statement-II is correct' }
      ],
      subject: 'Economy',
      position: 100
    }
  ];

  for (const q of newQuestions) {
    // Determine the options format expected
    // Actually our earlier import script generated options as:
    // [{ "id": "A", "text": "..." }, { "id": "B", "text": "..." }]
    // It seems some options array just holds strings, wait, no, our options are typed jsonb
    
    // Check the questions table to see what it wants
    const { data: qRow, error: qErr } = await supabase
      .from('questions')
      .insert({
        prompt: q.prompt,
        options: q.options,
        correct_option_id: null,
        subject: q.subject,
        year: year,
        source: 'pyq',
        source_label: `UPSC CSE Prelims ${year}`,
        difficulty: 'Moderate',
      })
      .select('id')
      .single();

    if (qErr || !qRow) {
      console.error(`❌ Failed to insert question ${q.position}:`, qErr);
      continue;
    }

    const { error: linkErr } = await supabase.from('test_template_questions').insert({
      template_id: template.id,
      question_id: qRow.id,
      ordinal: q.position,
    });

    if (linkErr) {
      console.error(`❌ Failed to link question ${q.position} with ordinal ${q.position}:`, linkErr);
    } else {
      console.log(`✅ Inserted and linked question ${q.position}`);
    }
  }

  // Update question_count in template
  await supabase
    .from('test_templates')
    .update({ question_count: 100 })
    .eq('id', template.id);
    
  console.log(`✅ Updated template question_count to 100.`);
}

main().catch(console.error);
