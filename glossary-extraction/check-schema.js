import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = '$SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSchema() {
  // Get first row to see columns
  const { data, error } = await supabase
    .from('mio_knowledge_chunks')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Sample row:', JSON.stringify(data, null, 2));
  if (data && data.length > 0) {
    console.log('\nAvailable columns:', Object.keys(data[0]).join(', '));
  }

  // Get row count
  const { count, error: countError } = await supabase
    .from('mio_knowledge_chunks')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log(`\nTotal rows: ${count}`);
  }
}

checkSchema();
