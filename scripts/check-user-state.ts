/**
 * Check user's onboarding state
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_KEY required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkUser(email: string) {
  console.log(`\nChecking onboarding state for: ${email}\n`);

  // Find user
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✓ User ID:', user.id);
  console.log('  Created:', user.created_at);

  // Check user_profiles
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('collision_patterns, championship_level, tier_level')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.log('\n❌ No user_profiles record found');
  } else {
    console.log('\n📋 user_profiles:');
    console.log('  collision_patterns:', JSON.stringify(profile?.collision_patterns));
    console.log('  championship_level:', profile?.championship_level);
    console.log('  tier_level:', profile?.tier_level);
  }

  // Check identity_collision_assessments
  const { data: icAssessments } = await supabase
    .from('identity_collision_assessments')
    .select('id, dominant_pattern, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('\n📋 identity_collision_assessments:', icAssessments?.length || 0, 'records');
  if (icAssessments && icAssessments.length > 0) {
    icAssessments.forEach(a => {
      console.log(`  - ${a.dominant_pattern} (${a.created_at})`);
    });
  }

  // Check avatar_assessments
  const { data: avatarAssessments } = await supabase
    .from('avatar_assessments')
    .select('id, primary_pattern, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('\n📋 avatar_assessments:', avatarAssessments?.length || 0, 'records');
  if (avatarAssessments && avatarAssessments.length > 0) {
    avatarAssessments.forEach(a => {
      console.log(`  - ${a.primary_pattern} (${a.created_at})`);
    });
  }

  // Check first_engagement in mio_insights_messages
  const { data: firstEngagement } = await supabase
    .from('mio_insights_messages')
    .select('id, section_type, role, created_at')
    .eq('user_id', user.id)
    .eq('section_type', 'first_engagement');

  console.log('\n📋 first_engagement messages:', firstEngagement?.length || 0, 'records');

  // Check mio_insights_threads
  const { data: thread } = await supabase
    .from('mio_insights_threads')
    .select('id, created_at, total_insights')
    .eq('user_id', user.id)
    .single();

  console.log('\n📋 mio_insights_thread:', thread ? 'exists' : 'none');
  if (thread) {
    console.log('  total_insights:', thread.total_insights);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('ONBOARDING STATUS:');

  const hasCollisionPattern = profile?.collision_patterns &&
    Object.keys(profile.collision_patterns).length > 0 &&
    (profile.collision_patterns as any).primary_pattern;

  const hasFirstEngagement = firstEngagement && firstEngagement.length > 0;

  console.log('  Has collision pattern:', hasCollisionPattern ? '✓ YES' : '❌ NO');
  console.log('  Has first engagement:', hasFirstEngagement ? '✓ YES' : '❌ NO');

  if (!hasCollisionPattern) {
    console.log('\n→ User should be redirected to: /mind-insurance/assessment');
  } else if (!hasFirstEngagement) {
    console.log('\n→ User should be redirected to: /mind-insurance/first-session');
  } else {
    console.log('\n→ User has completed onboarding, can access hub');
  }
}

const email = process.argv[2] || 'kesonpurpose@gmail.com';
checkUser(email);
