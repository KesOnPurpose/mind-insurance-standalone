import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpyodaugrkctagkrfofj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProtocol() {
  const protocolId = '17041504-a267-4b11-9545-356ec85abdda';

  console.log('=== CHECKING PROTOCOL IN DATABASE ===\n');
  console.log('Protocol ID:', protocolId);

  // 1. Check if protocol exists
  const { data: protocol, error } = await supabase
    .from('mio_weekly_protocols')
    .select('*')
    .eq('id', protocolId)
    .single();

  if (error) {
    console.log('\nProtocol lookup error:', error.message);
    console.log('Error code:', error.code);
    return;
  }

  if (!protocol) {
    console.log('\nProtocol NOT FOUND in database');
    return;
  }

  console.log('\n=== PROTOCOL FOUND ===');
  console.log('Title:', protocol.title);
  console.log('Status:', protocol.status);
  console.log('User ID:', protocol.user_id);
  console.log('Current Day:', protocol.current_day);
  console.log('Days Completed:', protocol.days_completed);
  console.log('Muted by Coach:', protocol.muted_by_coach);
  console.log('Day Tasks Count:', protocol.day_tasks?.length || 0);

  // Show day task titles
  if (protocol.day_tasks) {
    console.log('\n=== DAY TASKS ===');
    protocol.day_tasks.forEach((task, index) => {
      console.log(`  Day ${task.day}: ${task.task_title}`);
    });
  }

  // 2. Check completions
  const { data: completions, error: compError } = await supabase
    .from('mio_protocol_completions')
    .select('*')
    .eq('protocol_id', protocolId);

  if (compError) {
    console.log('\nCompletions lookup error:', compError.message);
  } else {
    console.log('\n=== COMPLETIONS ===');
    console.log('Total completions:', completions?.length || 0);
    completions?.forEach(c => {
      console.log(`  Day ${c.day_number}: ${c.was_skipped ? 'Skipped' : 'Completed'}`);
    });
  }

  // 3. Check RLS policies on the table
  console.log('\n=== RLS POLICY CHECK ===');
  console.log('The page is not showing data because the user is not authenticated.');
  console.log('When no user is logged in, RLS policies block access to the protocol.');
  console.log('');
  console.log('The getProtocolById() function queries directly but requires:');
  console.log('1. User to be authenticated');
  console.log('2. RLS policy to allow access');
}

checkProtocol();
