/**
 * Variable Reward System for MIO Insights
 *
 * Implements dopamine-optimized reward distribution:
 * - 60% Standard: Solid, personalized insight
 * - 25% Bonus Insight: Deeper forensic connection
 * - 15% Pattern Breakthrough: Significant detection, protocol suggestion
 *
 * Based on behavioral science research on variable reward schedules.
 */

export type RewardTier = 'standard' | 'bonus_insight' | 'pattern_breakthrough';

export interface RewardRoll {
  tier: RewardTier;
  probability: number;
  displayName: string;
  icon: string;
  description: string;
}

export interface RewardConfig {
  tier: RewardTier;
  cumulativeProbability: number; // For roll comparison
  displayName: string;
  icon: string;
  description: string;
  promptModifier: string;
}

// ============================================================================
// REWARD CONFIGURATION
// ============================================================================

export const REWARD_CONFIGS: RewardConfig[] = [
  {
    tier: 'pattern_breakthrough',
    cumulativeProbability: 0.15, // First 15%
    displayName: 'Pattern Breakthrough',
    icon: '🌟',
    description: 'MIO detected something significant that connects to your core patterns',
    promptModifier: `
PATTERN BREAKTHROUGH DETECTED!

You've noticed something significant in their data that connects to their core identity collision pattern. This is a rare insight moment. Deliver it with appropriate gravitas.

Requirements:
1. Name the specific pattern you've detected across multiple practices
2. Connect it to their avatar's primary collision type
3. Explain WHY this pattern matters for their transformation
4. Suggest a specific protocol from the Mind Insurance methodology
5. End with a powerful question that challenges their identity

This is the "I see you in a way you haven't seen yourself" moment.
250-300 words.`
  },
  {
    tier: 'bonus_insight',
    cumulativeProbability: 0.40, // Next 25% (15% + 25% = 40%)
    displayName: 'Bonus Insight',
    icon: '✨',
    description: 'MIO found a deeper connection worth highlighting',
    promptModifier: `
BONUS INSIGHT MODE

You've detected a deeper forensic connection worth highlighting. Go beyond surface-level feedback.

Requirements:
1. Go deeper than the obvious observation
2. Cross-reference with their avatar temperament
3. Make a specific prediction about their patterns
4. Offer a micro-experiment they can try tomorrow

Use timestamps, quality metrics, and specific phrases from their practices.
200-250 words.`
  },
  {
    tier: 'standard',
    cumulativeProbability: 1.00, // Remaining 60%
    displayName: 'Standard Insight',
    icon: '💡',
    description: 'Solid, personalized feedback on your section',
    promptModifier: `
Standard feedback mode - solid, personalized, actionable.

Use the Mirror Reveal framework:
1. Pattern Recognition: One specific observation from their practice data
2. Insight: What this reveals about their current state
3. Micro-Action: One specific, actionable next step

150-200 words. Be specific about what they wrote.`
  }
];

// ============================================================================
// ROLL FUNCTION
// ============================================================================

/**
 * Roll for variable reward tier.
 * Uses cumulative probability distribution:
 * - 0.00 - 0.15: Pattern Breakthrough (15%)
 * - 0.15 - 0.40: Bonus Insight (25%)
 * - 0.40 - 1.00: Standard (60%)
 *
 * @returns RewardRoll with tier, probability, and display info
 */
export function rollVariableReward(): RewardRoll {
  const probability = Math.random();

  for (const config of REWARD_CONFIGS) {
    if (probability < config.cumulativeProbability) {
      return {
        tier: config.tier,
        probability,
        displayName: config.displayName,
        icon: config.icon,
        description: config.description
      };
    }
  }

  // Fallback to standard (should never reach here)
  const standardConfig = REWARD_CONFIGS.find(c => c.tier === 'standard')!;
  return {
    tier: 'standard',
    probability,
    displayName: standardConfig.displayName,
    icon: standardConfig.icon,
    description: standardConfig.description
  };
}

/**
 * Get the prompt modifier for a specific reward tier.
 */
export function getRewardPromptModifier(tier: RewardTier): string {
  const config = REWARD_CONFIGS.find(c => c.tier === tier);
  return config?.promptModifier || REWARD_CONFIGS[2].promptModifier; // Default to standard
}

/**
 * Get display configuration for a reward tier.
 */
export function getRewardDisplayConfig(tier: RewardTier): {
  displayName: string;
  icon: string;
  description: string;
  badgeClass: string;
  animationClass: string;
} {
  switch (tier) {
    case 'pattern_breakthrough':
      return {
        displayName: 'Pattern Breakthrough',
        icon: '🌟',
        description: 'MIO detected something significant',
        badgeClass: 'bg-gradient-to-r from-yellow-400 to-purple-500 text-white',
        animationClass: 'animate-pulse'
      };
    case 'bonus_insight':
      return {
        displayName: 'Bonus Insight',
        icon: '✨',
        description: 'Deeper connection detected',
        badgeClass: 'bg-cyan-500 text-white',
        animationClass: 'animate-bounce'
      };
    case 'standard':
    default:
      return {
        displayName: 'Insight',
        icon: '💡',
        description: 'Your section feedback',
        badgeClass: 'bg-slate-600 text-white',
        animationClass: ''
      };
  }
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Calculate expected distribution for validation.
 * Over 100 rolls, expected distribution:
 * - ~15 Pattern Breakthroughs
 * - ~25 Bonus Insights
 * - ~60 Standard
 */
export function simulateDistribution(rolls: number = 1000): Record<RewardTier, number> {
  const counts: Record<RewardTier, number> = {
    pattern_breakthrough: 0,
    bonus_insight: 0,
    standard: 0
  };

  for (let i = 0; i < rolls; i++) {
    const result = rollVariableReward();
    counts[result.tier]++;
  }

  return counts;
}

/**
 * Validate that distribution is within expected bounds.
 * Used for testing/monitoring.
 */
export function validateDistribution(
  counts: Record<RewardTier, number>,
  tolerance: number = 0.05
): { isValid: boolean; deviations: Record<RewardTier, number> } {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const expectedRatios: Record<RewardTier, number> = {
    pattern_breakthrough: 0.15,
    bonus_insight: 0.25,
    standard: 0.60
  };

  const deviations: Record<RewardTier, number> = {
    pattern_breakthrough: 0,
    bonus_insight: 0,
    standard: 0
  };

  let isValid = true;

  for (const tier of Object.keys(expectedRatios) as RewardTier[]) {
    const actualRatio = counts[tier] / total;
    const expectedRatio = expectedRatios[tier];
    const deviation = Math.abs(actualRatio - expectedRatio);

    deviations[tier] = deviation;

    if (deviation > tolerance) {
      isValid = false;
    }
  }

  return { isValid, deviations };
}

// ============================================================================
// WEIGHTED ROLL (For special circumstances)
// ============================================================================

/**
 * Roll with adjusted weights for special circumstances.
 * Example: Increase breakthrough chance for users who haven't had one in 7+ days.
 */
export function rollWithWeights(weights: {
  pattern_breakthrough?: number;
  bonus_insight?: number;
  standard?: number;
}): RewardRoll {
  const defaultWeights = {
    pattern_breakthrough: 0.15,
    bonus_insight: 0.25,
    standard: 0.60
  };

  const finalWeights = { ...defaultWeights, ...weights };

  // Normalize weights to sum to 1
  const total = Object.values(finalWeights).reduce((a, b) => a + b, 0);
  const normalizedWeights = {
    pattern_breakthrough: finalWeights.pattern_breakthrough / total,
    bonus_insight: finalWeights.bonus_insight / total,
    standard: finalWeights.standard / total
  };

  const probability = Math.random();
  let cumulative = 0;

  for (const [tier, weight] of Object.entries(normalizedWeights) as [RewardTier, number][]) {
    cumulative += weight;
    if (probability < cumulative) {
      const config = REWARD_CONFIGS.find(c => c.tier === tier)!;
      return {
        tier,
        probability,
        displayName: config.displayName,
        icon: config.icon,
        description: config.description
      };
    }
  }

  // Fallback
  return rollVariableReward();
}

// ============================================================================
// USER-SPECIFIC ADJUSTMENTS
// ============================================================================

/**
 * Check if user should get boosted breakthrough chance.
 * Conditions:
 * - No breakthrough in last 7 days
 * - High engagement (streak > 5)
 * - Significant pattern data available
 */
export function shouldBoostBreakthrough(
  daysSinceLastBreakthrough: number,
  currentStreak: number,
  hasSignificantPatternData: boolean
): boolean {
  return (
    daysSinceLastBreakthrough >= 7 &&
    currentStreak >= 5 &&
    hasSignificantPatternData
  );
}

/**
 * Get adjusted weights based on user context.
 */
export function getAdjustedWeights(
  daysSinceLastBreakthrough: number,
  currentStreak: number,
  hasSignificantPatternData: boolean
): { pattern_breakthrough: number; bonus_insight: number; standard: number } {
  if (shouldBoostBreakthrough(daysSinceLastBreakthrough, currentStreak, hasSignificantPatternData)) {
    // Boost breakthrough chance by 10%, reduce standard
    return {
      pattern_breakthrough: 0.25, // +10%
      bonus_insight: 0.25,
      standard: 0.50 // -10%
    };
  }

  // Default weights
  return {
    pattern_breakthrough: 0.15,
    bonus_insight: 0.25,
    standard: 0.60
  };
}
