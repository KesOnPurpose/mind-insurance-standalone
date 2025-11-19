import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpyodaugrkctagkrfofj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateFinalReport() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  GROUPHOME ACCELERATOR - PERSONALIZATION VALIDATION TEST  ║');
  console.log('║  Stress Testing Enhanced Filtering System                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // STEP 1: Find all users
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 1: DATABASE USER INVENTORY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { data: userProfiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, tier_level, created_at')
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('❌ Error fetching user profiles:', profilesError);
    return;
  }

  console.log(`Found ${userProfiles.length} total users in database\n`);

  // Map user profiles to onboarding data
  const usersWithAssessments = [];
  const usersWithoutAssessments = [];

  for (const profile of userProfiles) {
    const { data: onboarding, error: onboardingError } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (onboardingError || !onboarding) {
      usersWithoutAssessments.push(profile);
    } else {
      usersWithAssessments.push({
        profile,
        onboarding
      });
    }
  }

  console.log(`✅ Users with assessment data: ${usersWithAssessments.length}`);
  console.log(`⚠️  Users without assessment data: ${usersWithoutAssessments.length}\n`);

  // STEP 2: Display detailed user profiles
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 2: USER ASSESSMENT PROFILES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (usersWithAssessments.length === 0) {
    console.log('❌ NO USERS WITH ASSESSMENT DATA FOUND');
    console.log('   This means no one has completed the onboarding assessment yet.\n');
  } else {
    usersWithAssessments.forEach((user, idx) => {
      console.log(`\n┌─ User ${idx + 1}: ${user.profile.full_name || 'No name'}`);
      console.log(`│  Email: ${user.profile.email || 'No email'}`);
      console.log(`│  ID: ${user.profile.id}`);
      console.log(`│  Tier: ${user.profile.tier_level || 'N/A'}`);
      console.log(`│  Created: ${new Date(user.profile.created_at).toLocaleDateString()}`);
      console.log(`│`);
      console.log(`│  📋 Assessment Profile:`);
      console.log(`│  ├─ Target Populations: ${JSON.stringify(user.onboarding.target_populations)}`);
      console.log(`│  ├─ Ownership Model: ${user.onboarding.ownership_model || 'NOT SET (legacy)'}`);
      console.log(`│  ├─ Capital Available: ${user.onboarding.capital_available || 'NOT SET'}`);
      console.log(`│  ├─ Timeline: ${user.onboarding.timeline || 'NOT SET'}`);
      console.log(`│  ├─ Property Type: ${user.onboarding.property_type || 'NOT SET'}`);
      console.log(`│  └─ Readiness Level: ${user.onboarding.readiness_level || 'N/A'}`);
      console.log(`└─`);
    });
  }

  // STEP 3: Map to test scenarios
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 3: TEST SCENARIO MAPPING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const scenarios = {
    notSure: usersWithAssessments.filter(u =>
      u.onboarding.target_populations?.includes('not-sure') ||
      u.onboarding.ownership_model === 'not-sure'
    ),
    specificStrategy: usersWithAssessments.filter(u =>
      u.onboarding.ownership_model &&
      u.onboarding.ownership_model !== 'not-sure' &&
      u.onboarding.ownership_model !== null
    ),
    lowBudget: usersWithAssessments.filter(u =>
      u.onboarding.capital_available === 'less-5k'
    ),
    legacy: usersWithAssessments.filter(u =>
      !u.onboarding.ownership_model || u.onboarding.ownership_model === null
    ),
    mixed: usersWithAssessments.filter(u =>
      u.onboarding.target_populations?.length > 0 &&
      u.onboarding.ownership_model &&
      u.onboarding.capital_available
    )
  };

  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ Test Scenario 1: "NOT SURE" Population (CRITICAL)      │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ Expected: User should see ALL 343 tactics (no filter)  │');
  console.log(`│ Status: ${scenarios.notSure.length > 0 ? '✅ TESTABLE' : '❌ NO TEST USER'                  }  │`);
  console.log('└─────────────────────────────────────────────────────────┘');
  if (scenarios.notSure.length > 0) {
    scenarios.notSure.forEach(u => {
      console.log(`   ✓ User ID: ${u.profile.id}`);
      console.log(`     Name: ${u.profile.full_name || 'No name'}`);
      console.log(`     Populations: ${JSON.stringify(u.onboarding.target_populations)}`);
      console.log(`     Ownership: ${u.onboarding.ownership_model}`);
    });
  } else {
    console.log('   ⚠️  Need to create or modify a user with "not-sure" selection');
  }
  console.log('');

  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ Test Scenario 2: Specific Ownership Strategy           │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ Expected: Tactics filtered by ownership_model field    │');
  console.log(`│ Status: ${scenarios.specificStrategy.length > 0 ? '✅ TESTABLE' : '❌ NO TEST USER'                  }  │`);
  console.log('└─────────────────────────────────────────────────────────┘');
  if (scenarios.specificStrategy.length > 0) {
    scenarios.specificStrategy.forEach(u => {
      console.log(`   ✓ User ID: ${u.profile.id}`);
      console.log(`     Name: ${u.profile.full_name || 'No name'}`);
      console.log(`     Strategy: ${u.onboarding.ownership_model}`);
      console.log(`     Populations: ${JSON.stringify(u.onboarding.target_populations)}`);
      console.log(`     Capital: ${u.onboarding.capital_available || 'N/A'}`);
    });
  }
  console.log('');

  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ Test Scenario 3: Low Budget (< $5K)                    │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ Expected: Only low/no-capital tactics shown            │');
  console.log(`│ Status: ${scenarios.lowBudget.length > 0 ? '✅ TESTABLE' : '❌ NO TEST USER'                  }  │`);
  console.log('└─────────────────────────────────────────────────────────┘');
  if (scenarios.lowBudget.length > 0) {
    scenarios.lowBudget.forEach(u => {
      console.log(`   ✓ User ID: ${u.profile.id}`);
      console.log(`     Name: ${u.profile.full_name || 'No name'}`);
      console.log(`     Capital: ${u.onboarding.capital_available}`);
      console.log(`     Strategy: ${u.onboarding.ownership_model || 'N/A'}`);
    });
  } else {
    console.log('   ⚠️  Need to create or modify user with capital_available = "less-5k"');
  }
  console.log('');

  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ Test Scenario 4: Legacy Assessment (No ownership)      │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ Expected: ALL 343 tactics (backward compatibility)     │');
  console.log(`│ Status: ${scenarios.legacy.length > 0 ? '✅ TESTABLE' : '❌ NO TEST USER'                  }  │`);
  console.log('└─────────────────────────────────────────────────────────┘');
  if (scenarios.legacy.length > 0) {
    scenarios.legacy.forEach(u => {
      console.log(`   ✓ User ID: ${u.profile.id}`);
      console.log(`     Name: ${u.profile.full_name || 'No name'}`);
      console.log(`     Ownership Model: NULL (legacy)`);
      console.log(`     Populations: ${JSON.stringify(u.onboarding.target_populations)}`);
    });
  } else {
    console.log('   ⚠️  Need to set ownership_model = NULL for a test user');
  }
  console.log('');

  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ Test Scenario 5: Mixed Filters (Cumulative)            │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ Expected: Tactics filtered by ALL criteria combined    │');
  console.log(`│ Status: ${scenarios.mixed.length > 0 ? '✅ TESTABLE' : '❌ NO TEST USER'                  }  │`);
  console.log('└─────────────────────────────────────────────────────────┘');
  if (scenarios.mixed.length > 0) {
    scenarios.mixed.forEach(u => {
      console.log(`   ✓ User ID: ${u.profile.id}`);
      console.log(`     Name: ${u.profile.full_name || 'No name'}`);
      console.log(`     Populations: ${JSON.stringify(u.onboarding.target_populations)}`);
      console.log(`     Strategy: ${u.onboarding.ownership_model}`);
      console.log(`     Capital: ${u.onboarding.capital_available}`);
    });
  }
  console.log('');

  // STEP 4: Action plan
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 4: RECOMMENDED ACTION PLAN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const testableScenarios = Object.entries(scenarios).filter(([_, users]) => users.length > 0).length;
  const totalScenarios = 5;

  console.log(`📊 Test Coverage: ${testableScenarios}/${totalScenarios} scenarios testable (${(testableScenarios/totalScenarios*100).toFixed(0)}%)\n`);

  if (testableScenarios === totalScenarios) {
    console.log('✅ ALL TEST SCENARIOS ARE READY FOR VALIDATION\n');
    console.log('Next Steps:');
    console.log('  1. Log into the app with each test user');
    console.log('  2. Navigate to content library');
    console.log('  3. Open browser console (F12)');
    console.log('  4. Verify tactic counts match expected behavior');
    console.log('  5. Take screenshots for documentation\n');
  } else {
    console.log('⚠️  MISSING TEST DATA - Action Required:\n');

    if (usersWithAssessments.length > 0) {
      const testUser = usersWithAssessments[0];
      console.log('🔧 SQL Commands to Create Missing Test Scenarios:');
      console.log('──────────────────────────────────────────────────\n');

      if (scenarios.notSure.length === 0) {
        console.log('-- Create "not-sure" test scenario:');
        console.log('UPDATE user_onboarding SET');
        console.log(`  target_populations = '["not-sure"]'::jsonb,`);
        console.log(`  ownership_model = 'not-sure'`);
        console.log(`WHERE user_id = '${testUser.profile.id}';`);
        console.log(`-- BACKUP: populations=${JSON.stringify(testUser.onboarding.target_populations)}, ownership='${testUser.onboarding.ownership_model}'\n`);
      }

      if (scenarios.lowBudget.length === 0) {
        console.log('-- Create low-budget test scenario:');
        console.log('UPDATE user_onboarding SET');
        console.log(`  capital_available = 'less-5k'`);
        console.log(`WHERE user_id = '${testUser.profile.id}';`);
        console.log(`-- BACKUP: capital_available='${testUser.onboarding.capital_available}'\n`);
      }

      if (scenarios.legacy.length === 0) {
        console.log('-- Create legacy assessment test scenario:');
        console.log('UPDATE user_onboarding SET');
        console.log(`  ownership_model = NULL`);
        console.log(`WHERE user_id = '${testUser.profile.id}';`);
        console.log(`-- BACKUP: ownership_model='${testUser.onboarding.ownership_model}'\n`);
      }

      console.log('⚠️  IMPORTANT: Test one scenario at a time, then restore!');
      console.log('    After each test, run the backup SQL to restore original values.\n');
    } else {
      console.log('⚠️  No users with assessment data found.');
      console.log('    Create test users by:');
      console.log('    1. Registering new accounts');
      console.log('    2. Completing onboarding assessment');
      console.log('    3. Selecting different options for each scenario\n');
    }
  }

  // STEP 5: Testing checklist
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 5: VALIDATION TESTING CHECKLIST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('For each test scenario:');
  console.log('  [ ] Log in as test user');
  console.log('  [ ] Navigate to Content Library');
  console.log('  [ ] Open browser console (F12 or Cmd+Option+I)');
  console.log('  [ ] Look for "Personalization Filter Applied" debug logs');
  console.log('  [ ] Count tactics displayed on page');
  console.log('  [ ] Verify count matches expected behavior');
  console.log('  [ ] Screenshot:');
  console.log('      - Content library with tactic count visible');
  console.log('      - Browser console showing filter logs');
  console.log('  [ ] Document any discrepancies\n');

  console.log('📏 Expected Tactic Counts:');
  console.log('  • "not-sure" users: 343 tactics (100% - no filtering)');
  console.log('  • Specific strategy users: < 343 tactics (strategy-filtered)');
  console.log('  • Low-budget users: < 343 tactics (capital-filtered)');
  console.log('  • Legacy users: 343 tactics (backward compatibility)');
  console.log('  • Mixed criteria: < 343 tactics (cumulative filtering)\n');

  console.log('🔍 What to Look For in Console:');
  console.log('  • "User assessment profile loaded" message');
  console.log('  • "Personalization Filter Applied" with filter details');
  console.log('  • Tactic count before/after filtering');
  console.log('  • Any filter criteria applied (populations, strategy, capital)\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('END OF VALIDATION TEST REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Summary export for easy reference
  console.log('📋 QUICK REFERENCE - TESTABLE USER IDs:\n');
  if (usersWithAssessments.length > 0) {
    usersWithAssessments.forEach((u, idx) => {
      console.log(`${idx + 1}. ${u.profile.full_name || 'No name'} (${u.profile.email || 'No email'})`);
      console.log(`   ID: ${u.profile.id}`);
      console.log(`   Profile: ${u.onboarding.ownership_model || 'legacy'} | ${JSON.stringify(u.onboarding.target_populations)} | ${u.onboarding.capital_available || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('   No users available for testing.\n');
  }
}

generateFinalReport().catch(console.error);
