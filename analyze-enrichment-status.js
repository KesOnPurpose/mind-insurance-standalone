#!/usr/bin/env node

/**
 * Analyze Tactic Enrichment Status
 * Query production database to identify enriched vs generic tactics
 */

const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SERVICE_KEY = '$SUPABASE_SERVICE_ROLE_KEY';

async function analyzeTactics() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/gh_tactic_instructions?select=tactic_id,tactic_name,step_by_step`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const tactics = await response.json();

    // Classify tactics by step count
    const enriched = tactics.filter(t => t.step_by_step && t.step_by_step.length >= 7);
    const generic = tactics.filter(t => t.step_by_step && t.step_by_step.length <= 6);

    // Sort generic by tactic_id for easy reference
    generic.sort((a, b) => {
      const numA = parseInt(a.tactic_id.replace('T', ''));
      const numB = parseInt(b.tactic_id.replace('T', ''));
      return numA - numB;
    });

    console.log('='.repeat(70));
    console.log('TACTIC ENRICHMENT STATUS ANALYSIS');
    console.log('='.repeat(70));
    console.log('');
    console.log(`Total tactics in database: ${tactics.length}`);
    console.log(`✅ Enriched (7+ steps):    ${enriched.length} (${((enriched.length / tactics.length) * 100).toFixed(1)}%)`);
    console.log(`❌ Generic (5-6 steps):    ${generic.length} (${((generic.length / tactics.length) * 100).toFixed(1)}%)`);
    console.log('');

    // Show step count distribution
    const stepCounts = {};
    tactics.forEach(t => {
      const count = t.step_by_step ? t.step_by_step.length : 0;
      stepCounts[count] = (stepCounts[count] || 0) + 1;
    });

    console.log('Step Count Distribution:');
    Object.keys(stepCounts).sort((a, b) => parseInt(a) - parseInt(b)).forEach(count => {
      const bar = '█'.repeat(Math.ceil(stepCounts[count] / 5));
      console.log(`  ${count.padStart(2)} steps: ${stepCounts[count].toString().padStart(3)} tactics ${bar}`);
    });
    console.log('');

    // Sample enriched tactics
    console.log('Sample Enriched Tactics (7+ steps):');
    enriched.slice(0, 5).forEach(t => {
      console.log(`  ${t.tactic_id}: ${t.tactic_name} (${t.step_by_step.length} steps)`);
    });
    console.log('');

    // List all generic tactics for Batch 4
    console.log('Generic Tactics Needing Enrichment (Batch 4):');
    console.log(`Total: ${generic.length} tactics`);
    console.log('');

    // Group by step count
    const by5Steps = generic.filter(t => t.step_by_step && t.step_by_step.length === 5);
    const by6Steps = generic.filter(t => t.step_by_step && t.step_by_step.length === 6);

    if (by5Steps.length > 0) {
      console.log(`5-Step Tactics (${by5Steps.length}):`);
      console.log(by5Steps.map(t => t.tactic_id).join(', '));
      console.log('');
    }

    if (by6Steps.length > 0) {
      console.log(`6-Step Tactics (${by6Steps.length}):`);
      console.log(by6Steps.map(t => t.tactic_id).join(', '));
      console.log('');
    }

    // Save generic tactic IDs to JSON for Batch 4 processing
    const batch4Config = {
      tacticIds: generic.map(t => t.tactic_id),
      totalCount: generic.length,
      generatedAt: new Date().toISOString(),
      purpose: 'Batch 4 Enrichment - Remaining Generic Tactics'
    };

    const fs = require('fs');
    fs.writeFileSync(
      'TACTICS-TO-ENRICH-BATCH4.json',
      JSON.stringify(batch4Config, null, 2)
    );

    console.log('✅ Generic tactic IDs saved to: TACTICS-TO-ENRICH-BATCH4.json');
    console.log('');
    console.log('='.repeat(70));
    console.log('NEXT STEPS:');
    console.log('='.repeat(70));
    console.log('');
    console.log('1. Review TACTICS-TO-ENRICH-BATCH4.json');
    console.log('2. Run enrichment script on Batch 4 tactics');
    console.log('3. Estimated time: ~2.4 hours');
    console.log('4. Estimated cost: $35-50');
    console.log('5. Target: 96%+ enrichment rate');
    console.log('');

  } catch (error) {
    console.error('Error analyzing tactics:', error.message);
    process.exit(1);
  }
}

analyzeTactics();
