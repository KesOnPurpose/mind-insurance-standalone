import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = 'https://hpyodaugrkctagkrfofj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running AI Suggestions Table Migration...\n');

  // Read the SQL migration file
  const migrationPath = join(process.cwd(), 'supabase/migrations/20251121000000_create_gh_document_tactic_suggestions_table.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  try {
    // Execute the SQL via Supabase RPC
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('\nManual Steps Required:');
      console.log('1. Go to https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new');
      console.log('2. Copy and paste the SQL from:');
      console.log('   supabase/migrations/20251121000000_create_gh_document_tactic_suggestions_table.sql');
      console.log('3. Click "Run" to execute the migration\n');
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('✅ Table gh_document_tactic_suggestions created');
    console.log('✅ Indexes created');
    console.log('✅ RLS policies configured\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('\nManual Steps Required:');
    console.log('1. Go to https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new');
    console.log('2. Copy and paste the SQL from:');
    console.log('   supabase/migrations/20251121000000_create_gh_document_tactic_suggestions_table.sql');
    console.log('3. Click "Run" to execute the migration\n');
    process.exit(1);
  }
}

runMigration().then(() => process.exit(0));
