/**
 * Deploy MIO Knowledge Chunks Migration
 *
 * Executes the mio_knowledge_chunks table creation migration
 * using Supabase service role key for admin access.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ';

async function deployMigration() {
  console.log('🚀 Starting MIO Knowledge Chunks migration deployment...\n');

  // Create Supabase admin client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Read the migration SQL file
    const migrationPath = join(
      process.cwd(),
      'supabase',
      'migrations',
      '20251122000000_create_mio_knowledge_chunks.sql'
    );

    console.log(`📄 Reading migration file: ${migrationPath}`);
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log(`📊 Migration size: ${sql.length} characters\n`);

    // Split SQL into individual statements (separated by semicolons)
    // This is necessary because some Supabase clients can't handle multi-statement queries
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement individually
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'; // Re-add semicolon
      const preview = statement.substring(0, 100).replace(/\s+/g, ' ');

      try {
        console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);

        // Use rpc to execute raw SQL (if available)
        // Otherwise we'll need to use direct PostgreSQL connection
        const { error } = await supabase.rpc('exec', {
          sql_string: statement
        });

        if (error) {
          console.error(`   ❌ Error: ${error.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (err: any) {
        console.error(`   ❌ Exception: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Migration Results:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${statements.length}`);
    console.log('='.repeat(60) + '\n');

    if (errorCount === 0) {
      console.log('🎉 Migration completed successfully!\n');

      // Verify table was created
      console.log('🔍 Verifying table creation...');
      const { data, error } = await supabase
        .from('mio_knowledge_chunks')
        .select('id')
        .limit(0);

      if (error) {
        console.error(`⚠️  Warning: Could not verify table: ${error.message}`);
        console.log('   This might be normal if RLS policies prevent direct access.');
        console.log('   Try accessing via SQL or Supabase dashboard.\n');
      } else {
        console.log('✅ Table verified! mio_knowledge_chunks is ready.\n');
      }
    } else {
      console.error('⚠️  Migration completed with errors. Please review above.\n');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n❌ Fatal error during migration:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
deployMigration().catch(console.error);
