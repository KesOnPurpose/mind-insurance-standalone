/**
 * Reset Onboarding Script for Mind Insurance
 *
 * Clears all onboarding-related data for a specific user so they can
 * experience the first-time user flow again.
 *
 * Usage: npx tsx scripts/reset-onboarding.ts <email>
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
  console.log('Get your service role key from: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/settings/api');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function listUsers() {
  console.log('\n📋 Listing users in auth.users:\n');
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  users.users.forEach(u => {
    console.log(`  - ${u.email} (${u.id})`);
  });
  console.log(`\nTotal: ${users.users.length} users`);
}

async function resetOnboarding(email: string) {
  console.log(`\n🔄 Resetting onboarding for: ${email}\n`);

  // 1. Find the user by email in auth.users
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('❌ Error fetching users:', userError.message);
    return;
  }

  // List all users for debugging
  console.log('Available users:');
  users.users.forEach(u => console.log(`  - ${u.email}`));
  console.log('');

  const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    return;
  }

  const userId = user.id;
  console.log(`✓ Found user: ${userId}`);

  // 2. Clear collision_patterns from user_profiles
  console.log('\n📝 Clearing user_profiles.collision_patterns...');
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      collision_patterns: null,
      // Also reset any other onboarding fields if needed
    })
    .eq('id', userId);

  if (profileError) {
    console.error('  ❌ Error:', profileError.message);
  } else {
    console.log('  ✓ Cleared collision_patterns');
  }

  // 3. Delete identity_collision_assessments
  console.log('\n📝 Deleting identity_collision_assessments...');
  const { data: icDeleted, error: icError } = await supabase
    .from('identity_collision_assessments')
    .delete()
    .eq('user_id', userId)
    .select('id');

  if (icError) {
    console.error('  ❌ Error:', icError.message);
  } else {
    console.log(`  ✓ Deleted ${icDeleted?.length || 0} records`);
  }

  // 4. Delete avatar_assessments
  console.log('\n📝 Deleting avatar_assessments...');
  const { data: aaDeleted, error: aaError } = await supabase
    .from('avatar_assessments')
    .delete()
    .eq('user_id', userId)
    .select('id');

  if (aaError) {
    console.error('  ❌ Error:', aaError.message);
  } else {
    console.log(`  ✓ Deleted ${aaDeleted?.length || 0} records`);
  }

  // 5. Delete first_engagement messages from mio_insights_messages
  console.log('\n📝 Deleting first_engagement messages...');
  const { data: feDeleted, error: feError } = await supabase
    .from('mio_insights_messages')
    .delete()
    .eq('user_id', userId)
    .eq('section_type', 'first_engagement')
    .select('id');

  if (feError) {
    console.error('  ❌ Error:', feError.message);
  } else {
    console.log(`  ✓ Deleted ${feDeleted?.length || 0} first engagement messages`);
  }

  // 6. Optionally delete the entire MIO insights thread (for complete reset)
  console.log('\n📝 Deleting MIO insights thread...');

  // First get the thread
  const { data: thread } = await supabase
    .from('mio_insights_threads')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (thread) {
    // Delete all messages in the thread first
    const { data: msgDeleted, error: msgError } = await supabase
      .from('mio_insights_messages')
      .delete()
      .eq('thread_id', thread.id)
      .select('id');

    if (msgError) {
      console.error('  ❌ Error deleting messages:', msgError.message);
    } else {
      console.log(`  ✓ Deleted ${msgDeleted?.length || 0} messages from thread`);
    }

    // Then delete the thread
    const { error: threadError } = await supabase
      .from('mio_insights_threads')
      .delete()
      .eq('id', thread.id);

    if (threadError) {
      console.error('  ❌ Error deleting thread:', threadError.message);
    } else {
      console.log('  ✓ Deleted MIO insights thread');
    }
  } else {
    console.log('  ℹ No MIO insights thread found');
  }

  // 7. Delete championship stats (optional - for complete fresh start)
  console.log('\n📝 Resetting championship stats...');
  const { error: champError } = await supabase
    .from('championship_stats')
    .delete()
    .eq('user_id', userId);

  if (champError && champError.code !== 'PGRST116') {
    console.error('  ❌ Error:', champError.message);
  } else {
    console.log('  ✓ Reset championship stats');
  }

  // 8. Delete user practices (optional - for complete fresh start)
  console.log('\n📝 Deleting user practices...');
  const { data: pracDeleted, error: pracError } = await supabase
    .from('user_practices')
    .delete()
    .eq('user_id', userId)
    .select('id');

  if (pracError) {
    console.error('  ❌ Error:', pracError.message);
  } else {
    console.log(`  ✓ Deleted ${pracDeleted?.length || 0} practice records`);
  }

  console.log('\n✅ Database reset complete!');
  console.log('\n⚠️  IMPORTANT: The user must also clear localStorage in their browser!');
  console.log('   Open browser DevTools (F12) → Application → Local Storage → Clear');
  console.log('   OR run this in browser console:');
  console.log('');
  console.log('   localStorage.removeItem("identity_collision_intro_completed");');
  console.log('   localStorage.removeItem("identity_collision_intro_categories");');
  console.log('   localStorage.removeItem("identity_collision_intro_patterns");');
  console.log('   localStorage.removeItem("identity_collision_assessment_progress");');
  console.log('   localStorage.removeItem("identity_collision_assessment_step");');
  console.log('');
  console.log('The user will then experience the first-time flow:');
  console.log('  1. 7 Intro Screens (Welcome, Hook, Categories, Explained, Patterns, PROTECT, Policy)');
  console.log('  2. Identity Collision Assessment (8 questions)');
  console.log('  3. Avatar Reveal');
  console.log('  4. First Session with MIO');
  console.log('  5. Mind Insurance Hub\n');
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log('Usage: SUPABASE_SERVICE_KEY=xxx npx tsx scripts/reset-onboarding.ts <email>');
  process.exit(1);
}

resetOnboarding(email);
