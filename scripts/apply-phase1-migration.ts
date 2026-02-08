// Apply Billion Dollar RAG Phase 1 migration via Supabase Management API
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hpyodaugrkctagkrfofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ'
);

async function main() {
  console.log('=== Billion Dollar RAG Phase 1 Migration ===\n');

  // Step 1: Create tables that don't exist yet
  // Check which tables already exist
  const tables = [
    'mio_relational_profiles',
    'mio_conversation_memories',
    'mio_session_summaries',
    'mio_technique_outcomes',
    'mio_cross_pillar_triggers',
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id', { count: 'exact', head: true });
    if (error && error.message.includes('does not exist')) {
      console.log(`Table ${table}: MISSING - needs creation via SQL Editor`);
    } else if (error) {
      console.log(`Table ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`Table ${table}: EXISTS`);
    }
  }

  // Step 2: Check and add new columns to mio_knowledge_chunks
  const newColumns = [
    'granularity', 'parent_chunk_id', 'effectiveness_score', 'times_retrieved',
    'times_helpful', 'voice', 'target_readiness', 'time_commitment_category',
    'cross_pillar_tags', 'cultural_contexts', 'age_range', 'relationship_type',
  ];

  console.log('\nChecking mio_knowledge_chunks columns...');
  for (const col of newColumns) {
    const { error } = await supabase
      .from('mio_knowledge_chunks')
      .select(col)
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log(`  Column ${col}: MISSING`);
    } else if (error) {
      console.log(`  Column ${col}: ERROR - ${error.message}`);
    } else {
      console.log(`  Column ${col}: EXISTS`);
    }
  }

  // Step 3: Seed cross-pillar triggers (if table exists but is empty)
  console.log('\nSeeding cross-pillar triggers...');
  const { count } = await supabase
    .from('mio_cross_pillar_triggers')
    .select('id', { count: 'exact', head: true });

  if (count === null) {
    console.log('Table mio_cross_pillar_triggers not accessible. Run the SQL migration first.');
    console.log('\nACTION REQUIRED:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy and paste the contents of:');
    console.log('   supabase/migrations/20260207100000_billion_dollar_rag_phase1.sql');
    console.log('3. Execute the SQL');
    console.log('4. Re-run this script to seed trigger data');
    return;
  }

  if (count && count > 0) {
    console.log(`Already populated: ${count} triggers exist.`);
  } else {
    // Insert triggers
    const triggers = [
      { trigger_event: 'job_loss', trigger_keywords: ['lost my job', 'laid off', 'fired', 'unemployed', 'no work', 'between jobs'], affected_pillars: ['financial', 'mental', 'relational'], cascade_pattern: { financial_stress: 'immediate', shame_withdrawal: '1-2 weeks', relationship_conflict: '2-4 weeks' }, common_presenting_symptom: 'We keep fighting about everything', actual_root_cause: 'Financial shame causing emotional withdrawal and irritability', recommended_domains: ['financial_mens', 'communication_conflict'] },
      { trigger_event: 'new_baby', trigger_keywords: ['baby', 'newborn', 'pregnant', 'just had a baby', 'postpartum', 'infant'], affected_pillars: ['physical', 'relational', 'mental'], cascade_pattern: { sleep_deprivation: 'immediate', identity_shift: '1-3 months' }, common_presenting_symptom: 'We never have time for each other anymore', actual_root_cause: 'Sleep deprivation destroying emotional regulation capacity', recommended_domains: ['foundation_attachment', 'communication_conflict'] },
      { trigger_event: 'health_diagnosis', trigger_keywords: ['diagnosed', 'cancer', 'chronic', 'disease', 'disability', 'surgery', 'illness'], affected_pillars: ['physical', 'mental', 'relational', 'spiritual'], cascade_pattern: { fear_grief: 'immediate', role_shift: 'weeks' }, common_presenting_symptom: 'My partner does not understand what I am going through', actual_root_cause: 'Grief and fear manifesting as emotional distance', recommended_domains: ['trauma_nervous_system', 'foundation_attachment'] },
      { trigger_event: 'infidelity_discovery', trigger_keywords: ['found out', 'cheating', 'affair', 'other woman', 'other man', 'messages', 'caught'], affected_pillars: ['relational', 'mental', 'physical'], cascade_pattern: { trust_shattered: 'immediate', hypervigilance: 'weeks' }, common_presenting_symptom: 'I cannot trust anything anymore', actual_root_cause: 'Betrayal trauma activating nervous system hypervigilance', recommended_domains: ['addiction_codependency', 'trauma_nervous_system'] },
      { trigger_event: 'death_of_parent', trigger_keywords: ['parent died', 'mom passed', 'dad passed', 'lost my father', 'lost my mother', 'funeral', 'grief'], affected_pillars: ['mental', 'spiritual', 'relational'], cascade_pattern: { acute_grief: 'immediate', family_role_shift: 'weeks' }, common_presenting_symptom: 'I do not know why I am so angry at my partner', actual_root_cause: 'Unresolved childhood attachment wounds surfacing through grief', recommended_domains: ['trauma_nervous_system', 'foundation_attachment'] },
      { trigger_event: 'financial_crisis', trigger_keywords: ['debt', 'bankruptcy', 'foreclosure', 'collections', 'broke', 'overdue'], affected_pillars: ['financial', 'mental', 'relational'], cascade_pattern: { survival_mode: 'immediate', shame_secrecy: 'days' }, common_presenting_symptom: 'They are so controlling about money', actual_root_cause: 'Financial anxiety creating controlling behavior as coping mechanism', recommended_domains: ['financial_mens', 'communication_conflict'] },
      { trigger_event: 'empty_nest', trigger_keywords: ['kids left', 'empty nest', 'last child', 'kids moved out', 'alone together'], affected_pillars: ['relational', 'spiritual', 'mental'], cascade_pattern: { identity_shift: 'immediate', rediscovery_or_crisis: 'months' }, common_presenting_symptom: 'I do not even know this person anymore', actual_root_cause: 'Parenting identity dissolving reveals neglected partnership', recommended_domains: ['foundation_attachment', 'communication_conflict'] },
      { trigger_event: 'addiction_relapse', trigger_keywords: ['relapsed', 'started drinking again', 'using again', 'fell off the wagon', 'slipped'], affected_pillars: ['mental', 'relational', 'physical'], cascade_pattern: { trust_collapse: 'immediate', safety_concern: 'immediate' }, common_presenting_symptom: 'I do not know if I can go through this again', actual_root_cause: 'Addiction cycle re-traumatizing partner betrayal wounds', recommended_domains: ['addiction_codependency', 'trauma_nervous_system'] },
      { trigger_event: 'sleep_deprivation', trigger_keywords: ['cannot sleep', 'insomnia', 'exhausted', 'no sleep', 'up all night', 'sleep deprived'], affected_pillars: ['physical', 'mental', 'relational'], cascade_pattern: { irritability: 'immediate', cognitive_impairment: 'days' }, common_presenting_symptom: 'Everything turns into a fight', actual_root_cause: 'Sleep deprivation reducing prefrontal cortex function needed for emotional regulation', recommended_domains: ['communication_conflict', 'trauma_nervous_system'] },
      { trigger_event: 'social_media_conflict', trigger_keywords: ['instagram', 'social media', 'following', 'likes', 'DMs', 'online', 'her phone', 'his phone'], affected_pillars: ['relational', 'mental'], cascade_pattern: { jealousy_trigger: 'immediate', trust_erosion: 'weeks' }, common_presenting_symptom: 'I saw something on their phone that bothers me', actual_root_cause: 'Digital boundary violations activating attachment insecurity', recommended_domains: ['modern_threats', 'foundation_attachment'] },
      { trigger_event: 'work_stress_chronic', trigger_keywords: ['work stress', 'burnout', 'overworked', 'hate my job', 'work all the time', 'never home'], affected_pillars: ['physical', 'mental', 'relational'], cascade_pattern: { emotional_depletion: 'ongoing', presence_deficit: 'ongoing' }, common_presenting_symptom: 'I feel like a single parent', actual_root_cause: 'Work addiction or burnout leaving no emotional energy for partnership', recommended_domains: ['modern_threats', 'communication_conflict'] },
      { trigger_event: 'in_law_conflict', trigger_keywords: ['mother-in-law', 'in-laws', 'his mother', 'her mother', 'family interference', 'boundaries with family'], affected_pillars: ['relational', 'cultural'], cascade_pattern: { loyalty_conflict: 'immediate', boundary_testing: 'ongoing' }, common_presenting_symptom: 'His/her family is destroying our marriage', actual_root_cause: 'Enmeshment with family of origin preventing healthy couple boundary', recommended_domains: ['foundation_attachment', 'cultural_context'] },
    ];

    const { error: insertError } = await supabase
      .from('mio_cross_pillar_triggers')
      .insert(triggers);

    if (insertError) {
      console.log('Seed error:', insertError.message);
    } else {
      console.log(`Seeded ${triggers.length} cross-pillar triggers`);
    }
  }

  // Verify final state
  console.log('\n=== FINAL STATE ===');
  for (const table of tables) {
    const { count: c } = await supabase.from(table).select('id', { count: 'exact', head: true });
    console.log(`${table}: ${c ?? 'N/A'} rows`);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
