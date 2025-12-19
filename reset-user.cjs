const { createClient } = require('./node_modules/@supabase/supabase-js');

const supabaseUrl = 'https://hpyodaugrkctagkrfofj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODY2MjIsImV4cCI6MjA3NDM2MjYyMn0.COFyvu_J-FnwTjbPCzi2v7yVR9cLWcg_sodKRV_Wlvs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const email = 'kesonpurpose@gmail.com';

async function resetUser() {
  console.log(`Finding user ${email}...`);
  
  // First, get the user ID from user_profiles
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, email')
    .eq('email', email)
    .single();
  
  if (profileError || !profile) {
    console.error('User not found:', profileError?.message);
    return;
  }
  
  const userId = profile.id;
  console.log(`Found user ID: ${userId}`);
  
  console.log('\nTo reset this user, run these SQL commands in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new');
  console.log('='.repeat(80));
  console.log(`
-- Reset user: ${email} (ID: ${userId})

-- Delete protocol data
DELETE FROM mio_insight_protocol_days WHERE protocol_id IN (SELECT id FROM mio_insight_protocols WHERE user_id = '${userId}');
DELETE FROM mio_insight_protocols WHERE user_id = '${userId}';

-- Delete other MI data  
DELETE FROM mio_insights_thread WHERE user_id = '${userId}';
DELETE FROM daily_practices WHERE user_id = '${userId}';
DELETE FROM identity_collision_assessments WHERE user_id = '${userId}';
DELETE FROM mental_pillar_assessments WHERE user_id = '${userId}';
DELETE FROM agent_conversations WHERE user_id = '${userId}';

-- Note: Also clear localStorage in browser console:
-- localStorage.removeItem('mi_hub_tour_completed');
-- localStorage.removeItem('mi_hub_tour_completed_at');
-- Object.keys(localStorage).filter(k => k.startsWith('protocol_unlock_modal')).forEach(k => localStorage.removeItem(k));
`);
  console.log('='.repeat(80));
}

resetUser().catch(console.error);
