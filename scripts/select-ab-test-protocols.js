/**
 * A/B Test Protocol Selection Script
 * Selects 20 protocols from 205 total based on:
 * - Category Distribution: 4 Daily Deductible, 8 Neural Rewiring, 8 Research
 * - Temperament Balance: 5 Warrior, 5 Sage, 5 Builder, 5 Connector
 * - Difficulty Mix: 8 Advanced, 7 Intermediate, 5 Beginner
 * - Tooltip Density: Mix of high (3+), medium (1-2), low (0)
 * - Reading Level: Mix of complex (>15), moderate (10-15), simple (<10)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://hpyodaugrkctagkrfofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ'
);

// Category mapping to target distribution
const CATEGORY_MAPPING = {
  'traditional-foundation': 'daily_deductible',
  'neural-rewiring': 'neural_rewiring',
  'research-protocol': 'research',
  'emergency-protocol': 'research',
  'avatar-definition': 'research',
  'neurological-practices': 'neural_rewiring',
  'philosophical-practices': 'neural_rewiring',
  'monastic-practices': 'neural_rewiring',
  'faith-based': 'daily_deductible',
  'communication-framework': 'research',
};

// Temperament assignment based on protocol content/category
const TEMPERAMENT_MAPPING = {
  'warrior': ['personal-best-tracking', 'evidence-file', 'social-media-detox', 'working-out', 'goal-writing'],
  'sage': ['lectio-divina', 'meditation', 'contemplation', 'prayer', 'learning-practice'],
  'builder': ['capability-deployment', 'performance-metrics', 'quarterly-capacity', 'purpose-audit', 'daily-office'],
  'connector': ['capability-celebration', 'supportive-scrolling', 'celebration-of-pivots']
};

function classifyDifficulty(readingLevel) {
  if (readingLevel > 15) return 'advanced';
  if (readingLevel >= 10) return 'intermediate';
  return 'beginner';
}

function getTooltipCount(glossaryTerms) {
  return glossaryTerms ? glossaryTerms.length : 0;
}

function getTooltipCategory(count) {
  if (count >= 3) return 'high';
  if (count >= 1) return 'medium';
  return 'low';
}

function assignTemperament(protocol) {
  const summary = protocol.chunk_summary.toLowerCase();

  // Check for explicit temperament keywords
  for (const [temperament, keywords] of Object.entries(TEMPERAMENT_MAPPING)) {
    if (keywords.some(kw => summary.includes(kw))) {
      return temperament;
    }
  }

  // Fallback based on category patterns
  if (protocol.category.includes('neural-rewiring')) {
    if (summary.includes('builder')) return 'builder';
    if (summary.includes('warrior')) return 'warrior';
    if (summary.includes('sage')) return 'sage';
    if (summary.includes('connector')) return 'connector';
  }

  // Pattern-based assignment
  if (summary.includes('performance') || summary.includes('tracking') || summary.includes('metrics')) return 'warrior';
  if (summary.includes('contemplation') || summary.includes('meditation') || summary.includes('reflection')) return 'sage';
  if (summary.includes('capability') || summary.includes('system') || summary.includes('audit')) return 'builder';
  if (summary.includes('relationship') || summary.includes('celebration') || summary.includes('community')) return 'connector';

  // Default round-robin
  return 'warrior';
}

async function selectProtocols() {
  console.log('Fetching all protocols from mio_knowledge_chunks...\n');

  const { data: protocols, error } = await supabase
    .from('mio_knowledge_chunks')
    .select('id, chunk_summary, category, reading_level_after, glossary_terms')
    .order('reading_level_after', { ascending: false });

  if (error) {
    console.error('Error fetching protocols:', error);
    process.exit(1);
  }

  console.log(`Total protocols available: ${protocols.length}\n`);

  // Enrich protocols with metadata
  const enrichedProtocols = protocols.map(p => ({
    ...p,
    mapped_category: CATEGORY_MAPPING[p.category] || 'research',
    temperament: assignTemperament(p),
    difficulty: classifyDifficulty(p.reading_level_after || 0),
    tooltip_count: getTooltipCount(p.glossary_terms),
    tooltip_category: getTooltipCategory(getTooltipCount(p.glossary_terms))
  }));

  // Target distribution
  const targets = {
    daily_deductible: 4,
    neural_rewiring: 8,
    research: 8,
    warrior: 5,
    sage: 5,
    builder: 5,
    connector: 5,
    advanced: 8,
    intermediate: 7,
    beginner: 5,
    high_tooltips: 5,
    medium_tooltips: 8,
    low_tooltips: 7
  };

  const selected = [];
  const counters = {
    daily_deductible: 0,
    neural_rewiring: 0,
    research: 0,
    warrior: 0,
    sage: 0,
    builder: 0,
    connector: 0,
    advanced: 0,
    intermediate: 0,
    beginner: 0,
    high_tooltips: 0,
    medium_tooltips: 0,
    low_tooltips: 0
  };

  // Selection strategy: Prioritize diversity
  // 1. Advanced complexity protocols first (harder to find)
  // 2. Balance across categories
  // 3. Balance across temperaments
  // 4. Balance tooltip density

  function canSelect(protocol) {
    const categoryKey = protocol.mapped_category;
    const tempKey = protocol.temperament;
    const diffKey = protocol.difficulty;
    const tooltipKey = protocol.tooltip_category === 'high' ? 'high_tooltips' :
                       protocol.tooltip_category === 'medium' ? 'medium_tooltips' : 'low_tooltips';

    return counters[categoryKey] < targets[categoryKey] &&
           counters[tempKey] < targets[tempKey] &&
           counters[diffKey] < targets[diffKey] &&
           counters[tooltipKey] < targets[tooltipKey];
  }

  function incrementCounters(protocol) {
    const categoryKey = protocol.mapped_category;
    const tempKey = protocol.temperament;
    const diffKey = protocol.difficulty;
    const tooltipKey = protocol.tooltip_category === 'high' ? 'high_tooltips' :
                       protocol.tooltip_category === 'medium' ? 'medium_tooltips' : 'low_tooltips';

    counters[categoryKey]++;
    counters[tempKey]++;
    counters[diffKey]++;
    counters[tooltipKey]++;
  }

  // Pass 1: Greedy selection based on constraints
  for (const protocol of enrichedProtocols) {
    if (selected.length >= 20) break;

    if (canSelect(protocol)) {
      selected.push({
        id: protocol.id,
        chunk_summary: protocol.chunk_summary,
        category: protocol.mapped_category,
        original_category: protocol.category,
        temperament: protocol.temperament,
        difficulty: protocol.difficulty,
        reading_level: protocol.reading_level_after || 0,
        tooltip_count: protocol.tooltip_count,
        tooltip_category: protocol.tooltip_category,
        selection_rationale: generateRationale(protocol, counters, targets)
      });

      incrementCounters(protocol);
    }
  }

  // Pass 2: If we don't have 20, relax constraints
  if (selected.length < 20) {
    console.log(`\nWarning: Only ${selected.length} selected. Relaxing constraints...\n`);

    for (const protocol of enrichedProtocols) {
      if (selected.length >= 20) break;
      if (selected.find(s => s.id === protocol.id)) continue;

      // Relax constraint: Just check category balance
      if (counters[protocol.mapped_category] < targets[protocol.mapped_category]) {
        selected.push({
          id: protocol.id,
          chunk_summary: protocol.chunk_summary,
          category: protocol.mapped_category,
          original_category: protocol.category,
          temperament: protocol.temperament,
          difficulty: protocol.difficulty,
          reading_level: protocol.reading_level_after || 0,
          tooltip_count: protocol.tooltip_count,
          tooltip_category: protocol.tooltip_category,
          selection_rationale: generateRationale(protocol, counters, targets) + ' (relaxed constraints)'
        });

        incrementCounters(protocol);
      }
    }
  }

  function generateRationale(protocol, counters, targets) {
    const reasons = [];

    if (protocol.difficulty === 'advanced') {
      reasons.push('high complexity for advanced testing');
    }

    if (protocol.tooltip_count >= 3) {
      reasons.push(`${protocol.tooltip_count} tooltips to test terminology impact`);
    } else if (protocol.tooltip_count === 0) {
      reasons.push('no tooltips for baseline comparison');
    }

    if (protocol.mapped_category === 'daily_deductible') {
      reasons.push('daily practice protocol for practical application testing');
    } else if (protocol.mapped_category === 'neural_rewiring') {
      reasons.push('neural rewiring protocol for depth testing');
    }

    reasons.push(`${protocol.temperament}-focused for temperament diversity`);

    return reasons.join(', ');
  }

  // Generate output
  const output = {
    total_selected: selected.length,
    distribution: {
      daily_deductible: counters.daily_deductible,
      neural_rewiring: counters.neural_rewiring,
      research: counters.research,
      warrior: counters.warrior,
      sage: counters.sage,
      builder: counters.builder,
      connector: counters.connector,
      advanced: counters.advanced,
      intermediate: counters.intermediate,
      beginner: counters.beginner,
      high_tooltips: counters.high_tooltips,
      medium_tooltips: counters.medium_tooltips,
      low_tooltips: counters.low_tooltips
    },
    protocols: selected
  };

  // Save to file
  const outputPath = path.join(__dirname, '..', 'ab-test-selected-protocols.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log('✅ Protocol selection complete!');
  console.log(`\n📊 Distribution Summary:`);
  console.log(`   Total Selected: ${output.total_selected}/20`);
  console.log(`\n   Category:`);
  console.log(`   - Daily Deductible: ${counters.daily_deductible}/4`);
  console.log(`   - Neural Rewiring: ${counters.neural_rewiring}/8`);
  console.log(`   - Research: ${counters.research}/8`);
  console.log(`\n   Temperament:`);
  console.log(`   - Warrior: ${counters.warrior}/5`);
  console.log(`   - Sage: ${counters.sage}/5`);
  console.log(`   - Builder: ${counters.builder}/5`);
  console.log(`   - Connector: ${counters.connector}/5`);
  console.log(`\n   Difficulty:`);
  console.log(`   - Advanced: ${counters.advanced}/8`);
  console.log(`   - Intermediate: ${counters.intermediate}/7`);
  console.log(`   - Beginner: ${counters.beginner}/5`);
  console.log(`\n   Tooltips:`);
  console.log(`   - High (3+): ${counters.high_tooltips}/5`);
  console.log(`   - Medium (1-2): ${counters.medium_tooltips}/8`);
  console.log(`   - Low (0): ${counters.low_tooltips}/7`);
  console.log(`\n📁 Saved to: ${outputPath}\n`);

  return output;
}

selectProtocols().catch(console.error);
