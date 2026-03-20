/**
 * verify-enrichment.ts
 * Checks enrichment coverage and samples some enriched questions.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Total count
    const { count: total } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('source', 'pyq');
    const { count: withTopic } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('source', 'pyq').not('topic', 'is', null);
    const { count: withKeywords } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('source', 'pyq').neq('keywords', '{}');

    console.log('\n📊 Enrichment Coverage:');
    console.log(`  Total PYQ questions:   ${total}`);
    console.log(`  Has topic:             ${withTopic} (${Math.round((withTopic! / total!) * 100)}%)`);
    console.log(`  Has keywords:          ${withKeywords} (${Math.round((withKeywords! / total!) * 100)}%)`);

    // Sample enriched questions by subject
    const subjects = ['Polity', 'History', 'Geography', 'Economy', 'Environment', 'Science'];
    console.log('\n📚 Sample enriched questions per subject:\n');
    
    for (const subj of subjects) {
        const { data } = await supabase
            .from('questions')
            .select('year, prompt, topic, sub_topic, keywords, question_type, importance')
            .eq('source', 'pyq')
            .eq('subject', subj)
            .not('topic', 'is', null)
            .limit(1);

        if (data?.[0]) {
            const q = data[0];
            console.log(`[${subj}] ${q.year} — ${q.topic} > ${q.sub_topic}`);
            console.log(`  Type: ${q.question_type} | Importance: ${q.importance}`);
            console.log(`  Keywords: ${(q.keywords as string[]).join(', ')}`);
            console.log(`  Q: ${(q.prompt as string).replace(/^\d+\.\s*/, '').substring(0, 80)}...`);
            console.log();
        } else {
            console.log(`[${subj}] — not yet enriched\n`);
        }
    }

    // Importance distribution
    const { data: importanceDist } = await supabase
        .from('questions')
        .select('importance')
        .eq('source', 'pyq')
        .not('importance', 'is', null);
    
    if (importanceDist?.length) {
        const dist: Record<string, number> = {};
        importanceDist.forEach((r: any) => { dist[r.importance] = (dist[r.importance] || 0) + 1; });
        console.log('📈 Importance distribution:', JSON.stringify(dist));
    }

    // Question type distribution
    const { data: typeDist } = await supabase
        .from('questions')
        .select('question_type')
        .eq('source', 'pyq')
        .not('question_type', 'is', null);
    
    if (typeDist?.length) {
        const dist: Record<string, number> = {};
        typeDist.forEach((r: any) => { dist[r.question_type] = (dist[r.question_type] || 0) + 1; });
        console.log('📈 Question type distribution:', JSON.stringify(dist, null, 2));
    }
}

main().catch(console.error);
