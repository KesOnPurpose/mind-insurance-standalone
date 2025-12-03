import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.SUPABASE_URL || 'https://hpyodaugrkctagkrfofj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_KEY environment variable is required');
}

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
