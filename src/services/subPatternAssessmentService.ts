/**
 * Sub-Pattern Assessment Service
 *
 * Week 3 Assessment - Deepens primary collision pattern to identify specific sub-patterns.
 * Uses questions from Part 2 of identity_collision_questions.txt
 *
 * Sub-Patterns by Primary Pattern:
 * - Past Prison: identity_ceiling, impostor_syndrome, self_sabotage, relationship_erosion
 * - Success Sabotage: burnout_depletion, decision_fatigue, execution_breakdown
 * - Compass Crisis: comparison_catastrophe, motivation_collapse, performance_liability
 *
 * Saves results to avatar_assessments.sub_pattern_scores (JSONB)
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type PrimaryPattern = 'past_prison' | 'success_sabotage' | 'compass_crisis';

export type PastPrisonSubPattern = 'identity_ceiling' | 'impostor_syndrome' | 'self_sabotage' | 'relationship_erosion';
export type SuccessSabotageSubPattern = 'burnout_depletion' | 'decision_fatigue' | 'execution_breakdown';
export type CompassCrisisSubPattern = 'comparison_catastrophe' | 'motivation_collapse' | 'performance_liability';

export type SubPatternType = PastPrisonSubPattern | SuccessSabotageSubPattern | CompassCrisisSubPattern;

export interface SubPatternOption {
  value: SubPatternType | 'none';
  label: string;
  description: string;
  points: number;
}

export interface SubPatternQuestion {
  id: string;
  question: string;
  options: SubPatternOption[];
  targetSubPattern: SubPatternType;
  primaryPattern: PrimaryPattern;
}

export interface SubPatternScores {
  // Past Prison sub-patterns
  identity_ceiling?: number;
  impostor_syndrome?: number;
  self_sabotage?: number;
  relationship_erosion?: number;
  // Success Sabotage sub-patterns
  burnout_depletion?: number;
  decision_fatigue?: number;
  execution_breakdown?: number;
  // Compass Crisis sub-patterns
  comparison_catastrophe?: number;
  motivation_collapse?: number;
  performance_liability?: number;
}

export interface SubPatternResult {
  primaryPattern: PrimaryPattern;
  primarySubPattern: SubPatternType;
  secondarySubPattern: SubPatternType | null;
  scores: SubPatternScores;
  maxScores: SubPatternScores;
  assessedAt: string;
}

export interface SaveSubPatternResult {
  success: boolean;
  assessmentId?: string;
  error?: string;
}

// ============================================================================
// QUESTIONS BY PATTERN
// ============================================================================

/**
 * Past Prison Sub-Pattern Questions (4 sub-patterns, 3 questions each)
 */
export const PAST_PRISON_QUESTIONS: SubPatternQuestion[] = [
  // Identity Ceiling (PP1-PP3)
  {
    id: 'PP1',
    question: "When you imagine making 3x your current income, what shows up first?",
    targetSubPattern: 'identity_ceiling',
    primaryPattern: 'past_prison',
    options: [
      { value: 'none', label: 'Excitement and belief', description: "It's possible for me", points: 0 },
      { value: 'identity_ceiling', label: 'Discomfort and disbelief', description: 'Feels unrealistic for someone like me', points: 2 },
      { value: 'identity_ceiling', label: 'Guilt or shame', description: "That's greedy, or people like me don't make that", points: 3 },
      { value: 'identity_ceiling', label: 'Complete disconnection', description: "I literally can't imagine it", points: 3 },
    ],
  },
  {
    id: 'PP2',
    question: "You've noticed that you tend to hit the same ceiling repeatedly in:",
    targetSubPattern: 'identity_ceiling',
    primaryPattern: 'past_prison',
    options: [
      { value: 'none', label: 'None of these', description: 'I break through ceilings consistently', points: 0 },
      { value: 'identity_ceiling', label: 'Income level', description: 'Always cap at approximately the same number', points: 2 },
      { value: 'identity_ceiling', label: 'Visibility/platform', description: 'Staying small feels safer', points: 2 },
      { value: 'identity_ceiling', label: 'All of the above', description: 'Income, relationships, and visibility', points: 3 },
    ],
  },
  {
    id: 'PP3',
    question: 'How often do you catch yourself thinking "people like me don\'t do that"?',
    targetSubPattern: 'identity_ceiling',
    primaryPattern: 'past_prison',
    options: [
      { value: 'none', label: 'Never', description: "I don't limit myself this way", points: 0 },
      { value: 'identity_ceiling', label: 'Occasionally', description: 'When facing very big opportunities', points: 1 },
      { value: 'identity_ceiling', label: 'Regularly', description: 'When considering next-level moves', points: 2 },
      { value: 'identity_ceiling', label: 'Constantly', description: 'This is my default thought pattern', points: 3 },
    ],
  },
  // Impostor Syndrome (PP4-PP6)
  {
    id: 'PP4',
    question: "After a major win or accomplishment, your first thought is typically:",
    targetSubPattern: 'impostor_syndrome',
    primaryPattern: 'past_prison',
    options: [
      { value: 'none', label: '"I earned this"', description: 'Through hard work and skill', points: 0 },
      { value: 'impostor_syndrome', label: '"I got lucky this time"', description: 'This was a fluke', points: 2 },
      { value: 'impostor_syndrome', label: '"They\'re going to realize..."', description: "I don't actually belong here", points: 3 },
      { value: 'impostor_syndrome', label: '"This doesn\'t really count"', description: 'Because of some reason', points: 3 },
    ],
  },
  {
    id: 'PP5',
    question: "Despite objective evidence of your competence, you:",
    targetSubPattern: 'impostor_syndrome',
    primaryPattern: 'past_prison',
    options: [
      { value: 'none', label: 'Feel confident', description: 'In your abilities', points: 0 },
      { value: 'impostor_syndrome', label: 'Sometimes doubt', description: 'In new situations', points: 1 },
      { value: 'impostor_syndrome', label: 'Over-prepare constantly', description: 'To compensate for feeling "less than"', points: 2 },
      { value: 'impostor_syndrome', label: 'Live in fear of exposure', description: 'As a fraud', points: 3 },
    ],
  },
  {
    id: 'PP6',
    question: "When someone compliments your work or success:",
    targetSubPattern: 'impostor_syndrome',
    primaryPattern: 'past_prison',
    options: [
      { value: 'none', label: 'Receive it graciously', description: 'And genuinely', points: 0 },
      { value: 'impostor_syndrome', label: 'Deflect slightly', description: 'But can accept it', points: 1 },
      { value: 'impostor_syndrome', label: 'Immediately minimize', description: '"It wasn\'t that impressive"', points: 2 },
      { value: 'impostor_syndrome', label: 'List reasons they\'re wrong', description: 'About you', points: 3 },
    ],
  },
  // Self-Sabotage (PP7-PP9)
  {
    id: 'PP7',
    question: "When you get close to a real breakthrough, you typically:",
    targetSubPattern: 'self_sabotage',
    primaryPattern: 'past_prison',
    options: [
      { value: 'none', label: 'Push through', description: 'With excitement', points: 0 },
      { value: 'self_sabotage', label: 'Get nervous but stay', description: 'On course', points: 1 },
      { value: 'self_sabotage', label: 'Find reasons it won\'t work', description: 'Start looking for problems', points: 2 },
      { value: 'self_sabotage', label: 'Blow it up or walk away', description: 'Unconsciously sabotage', points: 3 },
    ],
  },
  {
    id: 'PP8',
    question: "In relationships (romantic or professional), when things get really good:",
    targetSubPattern: 'self_sabotage',
    primaryPattern: 'past_prison',
    options: [
      { value: 'none', label: 'Deepen commitment', description: 'And connection', points: 0 },
      { value: 'self_sabotage', label: 'Feel slight anxiety', description: 'But work through it', points: 1 },
      { value: 'self_sabotage', label: 'Create problems', description: 'Or find fatal flaws', points: 2 },
      { value: 'self_sabotage', label: 'Sabotage or end it', description: 'Right when it gets good', points: 3 },
    ],
  },
  {
    id: 'PP9',
    question: "Looking at your history, you've walked away from how many things that were actually working?",
    targetSubPattern: 'self_sabotage',
    primaryPattern: 'past_prison',
    options: [
      { value: 'none', label: 'Zero', description: 'I stick with what works', points: 0 },
      { value: 'self_sabotage', label: 'One or two', description: 'Rare but it happened', points: 1 },
      { value: 'self_sabotage', label: 'Three to five', description: 'I see the pattern', points: 2 },
      { value: 'self_sabotage', label: 'Too many to count', description: 'This is my signature move', points: 3 },
    ],
  },
  // Relationship Erosion (PP10-PP11)
  {
    id: 'PP10',
    question: "As you've grown and evolved, your relationships with old friends/family:",
    targetSubPattern: 'relationship_erosion',
    primaryPattern: 'past_prison',
    options: [
      { value: 'none', label: 'Have deepened', description: 'And grown with you', points: 0 },
      { value: 'relationship_erosion', label: 'Stayed the same', description: 'Mostly unchanged', points: 1 },
      { value: 'relationship_erosion', label: 'Become strained', description: 'They comment about you "changing"', points: 2 },
      { value: 'relationship_erosion', label: 'Eroded significantly', description: "You feel like you're outgrowing everyone", points: 3 },
    ],
  },
  {
    id: 'PP11',
    question: 'How often do people from your past remind you to "stay humble" or "remember where you came from"?',
    targetSubPattern: 'relationship_erosion',
    primaryPattern: 'past_prison',
    options: [
      { value: 'none', label: 'Never', description: 'They celebrate my growth', points: 0 },
      { value: 'relationship_erosion', label: 'Occasionally', description: 'But it feels supportive', points: 1 },
      { value: 'relationship_erosion', label: 'Regularly', description: 'And it feels like a guilt trip', points: 2 },
      { value: 'relationship_erosion', label: 'Constantly', description: "They're threatened by my evolution", points: 3 },
    ],
  },
];

/**
 * Success Sabotage Sub-Pattern Questions (3 sub-patterns, 3 questions each)
 */
export const SUCCESS_SABOTAGE_QUESTIONS: SubPatternQuestion[] = [
  // Burnout & Depletion (SS1-SS3)
  {
    id: 'SS1',
    question: "Your relationship with rest is:",
    targetSubPattern: 'burnout_depletion',
    primaryPattern: 'success_sabotage',
    options: [
      { value: 'none', label: 'Rest is fuel', description: 'For peak performance - I prioritize it', points: 0 },
      { value: 'burnout_depletion', label: 'Rest is earned', description: "After achievement - I'll rest when it's done", points: 2 },
      { value: 'burnout_depletion', label: 'Rest feels impossible', description: "My mind won't stop", points: 3 },
      { value: 'burnout_depletion', label: "I've forgotten rest", description: "I don't know what genuine rest feels like", points: 3 },
    ],
  },
  {
    id: 'SS2',
    question: "Honestly assess: What percentage of your energy tank is currently full?",
    targetSubPattern: 'burnout_depletion',
    primaryPattern: 'success_sabotage',
    options: [
      { value: 'none', label: '80-100%', description: "I'm operating well-resourced", points: 0 },
      { value: 'burnout_depletion', label: '60-80%', description: "I'm functional but not optimal", points: 1 },
      { value: 'burnout_depletion', label: '30-60%', description: "I'm running on fumes most days", points: 2 },
      { value: 'burnout_depletion', label: 'Below 30%', description: "I'm completely depleted", points: 3 },
    ],
  },
  {
    id: 'SS3',
    question: "Your body has been sending warning signals (health issues, chronic fatigue, stress symptoms). You:",
    targetSubPattern: 'burnout_depletion',
    primaryPattern: 'success_sabotage',
    options: [
      { value: 'none', label: 'Listen and adjust', description: 'Immediately', points: 0 },
      { value: 'burnout_depletion', label: 'Notice but delay', description: 'Plan to address "after this project"', points: 2 },
      { value: 'burnout_depletion', label: 'Ignore and push harder', description: "I'll rest when I'm dead", points: 3 },
      { value: 'burnout_depletion', label: 'Normalized them', description: '"Just how life is"', points: 3 },
    ],
  },
  // Decision Fatigue (SS4-SS6)
  {
    id: 'SS4',
    question: "Your decision quality when tired vs. rested is:",
    targetSubPattern: 'decision_fatigue',
    primaryPattern: 'success_sabotage',
    options: [
      { value: 'none', label: 'Consistent', description: 'Regardless of my state', points: 0 },
      { value: 'decision_fatigue', label: 'Some difference', description: "But it's manageable", points: 1 },
      { value: 'decision_fatigue', label: 'Worst when depleted', description: 'My worst decisions ALWAYS happen tired', points: 3 },
      { value: 'decision_fatigue', label: 'Avoid entirely', description: 'When overwhelmed I make no decisions', points: 3 },
    ],
  },
  {
    id: 'SS5',
    question: "How often do you experience decision paralysis from too many options?",
    targetSubPattern: 'decision_fatigue',
    primaryPattern: 'success_sabotage',
    options: [
      { value: 'none', label: 'Rarely', description: 'I decide and move', points: 0 },
      { value: 'decision_fatigue', label: 'Occasionally', description: 'In complex situations', points: 1 },
      { value: 'decision_fatigue', label: 'Regularly', description: 'I get stuck weighing options', points: 2 },
      { value: 'decision_fatigue', label: 'Constantly', description: 'Even simple decisions feel overwhelming', points: 3 },
    ],
  },
  {
    id: 'SS6',
    question: "You would describe your decision-making as:",
    targetSubPattern: 'decision_fatigue',
    primaryPattern: 'success_sabotage',
    options: [
      { value: 'none', label: 'Strategic and proactive', description: 'I think ahead', points: 0 },
      { value: 'decision_fatigue', label: 'Mixed', description: 'Strategic when not overwhelmed', points: 1 },
      { value: 'decision_fatigue', label: 'Reactive', description: 'I decide when forced to', points: 2 },
      { value: 'decision_fatigue', label: 'Crisis-driven', description: 'I only decide under pressure', points: 3 },
    ],
  },
  // Execution Breakdown (SS7-SS9)
  {
    id: 'SS7',
    question: "You know what you should do, but you're not doing it. How wide is this gap?",
    targetSubPattern: 'execution_breakdown',
    primaryPattern: 'success_sabotage',
    options: [
      { value: 'none', label: 'No gap', description: 'I execute on what I know', points: 0 },
      { value: 'execution_breakdown', label: 'Small gap', description: 'Occasional delay between knowing and doing', points: 1 },
      { value: 'execution_breakdown', label: 'Significant gap', description: 'I know a lot but execute little', points: 2 },
      { value: 'execution_breakdown', label: 'Massive gap', description: 'Knowledge is useless without execution', points: 3 },
    ],
  },
  {
    id: 'SS8',
    question: "When major opportunities arrive, you:",
    targetSubPattern: 'execution_breakdown',
    primaryPattern: 'success_sabotage',
    options: [
      { value: 'none', label: 'Have energy to execute', description: 'And capacity to perform', points: 0 },
      { value: 'execution_breakdown', label: 'Dig deep but perform', description: 'Have to push but can do it', points: 1 },
      { value: 'execution_breakdown', label: 'Depleted, underperform', description: 'Perform below your capability', points: 2 },
      { value: 'execution_breakdown', label: 'Freeze or fail', description: 'Completely fail to execute', points: 3 },
    ],
  },
  {
    id: 'SS9',
    question: "Your follow-through on commitments to yourself is:",
    targetSubPattern: 'execution_breakdown',
    primaryPattern: 'success_sabotage',
    options: [
      { value: 'none', label: 'Strong', description: "I do what I say I'll do", points: 0 },
      { value: 'execution_breakdown', label: 'Good', description: 'I follow through most of the time', points: 1 },
      { value: 'execution_breakdown', label: 'Inconsistent', description: 'I start strong but fade', points: 2 },
      { value: 'execution_breakdown', label: 'Poor', description: 'I rarely finish what I start', points: 3 },
    ],
  },
];

/**
 * Compass Crisis Sub-Pattern Questions (3 sub-patterns, 3 questions each)
 */
export const COMPASS_CRISIS_QUESTIONS: SubPatternQuestion[] = [
  // Comparison Catastrophe (CC1-CC3)
  {
    id: 'CC1',
    question: "When you experience a win, your first instinct is to:",
    targetSubPattern: 'comparison_catastrophe',
    primaryPattern: 'compass_crisis',
    options: [
      { value: 'none', label: 'Celebrate it fully', description: 'Take in the moment', points: 0 },
      { value: 'comparison_catastrophe', label: 'Appreciate briefly', description: 'Then get back to work', points: 1 },
      { value: 'comparison_catastrophe', label: 'Compare immediately', description: 'To what others have achieved', points: 2 },
      { value: 'comparison_catastrophe', label: 'Discount it', description: 'Because someone else has done better', points: 3 },
    ],
  },
  {
    id: 'CC2',
    question: "After scrolling social media or seeing others' success, you feel:",
    targetSubPattern: 'comparison_catastrophe',
    primaryPattern: 'compass_crisis',
    options: [
      { value: 'none', label: 'Inspired', description: 'And motivated', points: 0 },
      { value: 'none', label: 'Neutral', description: 'Their journey is separate from mine', points: 0 },
      { value: 'comparison_catastrophe', label: 'Behind and inadequate', description: "Everyone's ahead of me", points: 3 },
      { value: 'comparison_catastrophe', label: 'Frustrated and exhausted', description: 'From the comparison', points: 3 },
    ],
  },
  {
    id: 'CC3',
    question: "Even when you hit goals, you feel:",
    targetSubPattern: 'comparison_catastrophe',
    primaryPattern: 'compass_crisis',
    options: [
      { value: 'none', label: 'Genuinely satisfied', description: 'And fulfilled', points: 0 },
      { value: 'comparison_catastrophe', label: 'Satisfied but looking ahead', description: 'Already eyeing the next goal', points: 1 },
      { value: 'comparison_catastrophe', label: 'Never enough', description: "Someone's always ahead", points: 2 },
      { value: 'comparison_catastrophe', label: 'Empty', description: "Measuring against others' highlight reels", points: 3 },
    ],
  },
  // Motivation Collapse (CC4-CC6)
  {
    id: 'CC4',
    question: "The dream/goal that once excited you now:",
    targetSubPattern: 'motivation_collapse',
    primaryPattern: 'compass_crisis',
    options: [
      { value: 'none', label: 'Still fires me up', description: 'Every day', points: 0 },
      { value: 'motivation_collapse', label: 'Interests me less', description: 'With less intensity', points: 1 },
      { value: 'motivation_collapse', label: 'Feels like obligation', description: 'More than inspiration', points: 2 },
      { value: 'motivation_collapse', label: 'Completely drains me', description: "I've lost the fire", points: 3 },
    ],
  },
  {
    id: 'CC5',
    question: "Your relationship with your work/business is:",
    targetSubPattern: 'motivation_collapse',
    primaryPattern: 'compass_crisis',
    options: [
      { value: 'none', label: 'Energizing', description: 'I love what I do', points: 0 },
      { value: 'motivation_collapse', label: 'Positive overall', description: 'With some draining aspects', points: 1 },
      { value: 'motivation_collapse', label: 'Draining', description: "I don't want to open my laptop", points: 2 },
      { value: 'motivation_collapse', label: 'Soul-crushing', description: 'I fantasize about quitting', points: 3 },
    ],
  },
  {
    id: 'CC6',
    question: "Honestly: Are you building toward what YOU actually want, or what looks good/impressive?",
    targetSubPattern: 'motivation_collapse',
    primaryPattern: 'compass_crisis',
    options: [
      { value: 'none', label: 'Definitely authentic', description: 'My real goals', points: 0 },
      { value: 'motivation_collapse', label: 'Mostly authentic', description: 'Some external influence', points: 1 },
      { value: 'motivation_collapse', label: 'Mixed', description: "I'm not sure what I actually want", points: 2 },
      { value: 'motivation_collapse', label: 'Mostly external', description: 'Following what I "should" want', points: 3 },
    ],
  },
  // Performance Liability (CC7-CC9)
  {
    id: 'CC7',
    question: "The gap between your potential and your actual results is:",
    targetSubPattern: 'performance_liability',
    primaryPattern: 'compass_crisis',
    options: [
      { value: 'none', label: 'Small', description: "I'm performing near my capability", points: 0 },
      { value: 'performance_liability', label: 'Moderate', description: "I'm not quite there", points: 1 },
      { value: 'performance_liability', label: 'Significant', description: 'I should be much further along', points: 2 },
      { value: 'performance_liability', label: 'Massive', description: "I'm nowhere near what I'm capable of", points: 3 },
    ],
  },
  {
    id: 'CC8',
    question: 'How often do you think "I should be further along by now"?',
    targetSubPattern: 'performance_liability',
    primaryPattern: 'compass_crisis',
    options: [
      { value: 'none', label: 'Rarely', description: "I'm satisfied with my progress", points: 0 },
      { value: 'performance_liability', label: 'Occasionally', description: 'In moments of comparison', points: 1 },
      { value: 'performance_liability', label: 'Regularly', description: "It's a recurring thought", points: 2 },
      { value: 'performance_liability', label: 'Constantly', description: "It's my default mental state", points: 3 },
    ],
  },
  {
    id: 'CC9',
    question: "Others can see your potential, but you:",
    targetSubPattern: 'performance_liability',
    primaryPattern: 'compass_crisis',
    options: [
      { value: 'none', label: 'See it too', description: 'And actively building toward it', points: 0 },
      { value: 'performance_liability', label: 'See glimpses', description: 'But struggle to consistently access it', points: 1 },
      { value: 'performance_liability', label: 'Hear it but doubt', description: "Don't really believe it", points: 2 },
      { value: 'performance_liability', label: "Can't see it", description: "Can't see what they see at all", points: 2 },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get questions for a specific primary pattern
 */
export function getQuestionsForPattern(primaryPattern: PrimaryPattern): SubPatternQuestion[] {
  switch (primaryPattern) {
    case 'past_prison':
      return PAST_PRISON_QUESTIONS;
    case 'success_sabotage':
      return SUCCESS_SABOTAGE_QUESTIONS;
    case 'compass_crisis':
      return COMPASS_CRISIS_QUESTIONS;
    default:
      return [];
  }
}

/**
 * Get sub-patterns for a specific primary pattern
 */
export function getSubPatternsForPattern(primaryPattern: PrimaryPattern): SubPatternType[] {
  switch (primaryPattern) {
    case 'past_prison':
      return ['identity_ceiling', 'impostor_syndrome', 'self_sabotage', 'relationship_erosion'];
    case 'success_sabotage':
      return ['burnout_depletion', 'decision_fatigue', 'execution_breakdown'];
    case 'compass_crisis':
      return ['comparison_catastrophe', 'motivation_collapse', 'performance_liability'];
    default:
      return [];
  }
}

/**
 * Calculate max possible score for each sub-pattern
 */
export function getMaxScoresForPattern(primaryPattern: PrimaryPattern): SubPatternScores {
  const questions = getQuestionsForPattern(primaryPattern);
  const maxScores: SubPatternScores = {};

  questions.forEach((q) => {
    const maxPoints = Math.max(...q.options.map((o) => o.points));
    const currentMax = maxScores[q.targetSubPattern] || 0;
    maxScores[q.targetSubPattern] = currentMax + maxPoints;
  });

  return maxScores;
}

/**
 * Calculate sub-pattern scores from answers
 */
export function calculateSubPatternScores(
  answers: Record<string, { value: SubPatternType | 'none'; points: number }>,
  primaryPattern: PrimaryPattern
): SubPatternScores {
  const scores: SubPatternScores = {};
  const subPatterns = getSubPatternsForPattern(primaryPattern);

  // Initialize all sub-patterns to 0
  subPatterns.forEach((sp) => {
    scores[sp] = 0;
  });

  // Sum up points for each sub-pattern
  Object.values(answers).forEach(({ value, points }) => {
    if (value !== 'none' && scores[value] !== undefined) {
      scores[value] = (scores[value] || 0) + points;
    }
  });

  return scores;
}

/**
 * Determine primary and secondary sub-patterns from scores
 */
export function determineSubPatterns(
  scores: SubPatternScores,
  maxScores: SubPatternScores
): { primary: SubPatternType; secondary: SubPatternType | null } {
  const entries = Object.entries(scores)
    .filter(([key]) => maxScores[key as SubPatternType] !== undefined)
    .map(([key, score]) => ({
      subPattern: key as SubPatternType,
      score,
      maxScore: maxScores[key as SubPatternType] || 1,
      percentage: ((score || 0) / (maxScores[key as SubPatternType] || 1)) * 100,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const primary = entries[0]?.subPattern || 'identity_ceiling';
  const secondary = entries[1]?.percentage > 40 ? entries[1]?.subPattern : null;

  return { primary, secondary };
}

// ============================================================================
// SUB-PATTERN INFO
// ============================================================================

export interface SubPatternInfo {
  name: string;
  shortDescription: string;
  fullDescription: string;
  riskLevel: 'high' | 'moderate' | 'emerging';
}

export const SUB_PATTERN_INFO: Record<SubPatternType, SubPatternInfo> = {
  // Past Prison
  identity_ceiling: {
    name: 'Identity Ceiling',
    shortDescription: 'Invisible limits based on who you believe you can become',
    fullDescription: "Your past creates invisible limits on what you believe is possible for you. You hit the same ceilings repeatedly because your identity hasn't expanded to accommodate your next level.",
    riskLevel: 'high',
  },
  impostor_syndrome: {
    name: 'Impostor Syndrome',
    shortDescription: 'Persistent fear of being exposed as a fraud',
    fullDescription: "Despite objective evidence of your competence, you live in fear of being 'found out.' You attribute success to luck and over-prepare to compensate for feeling like you don't belong.",
    riskLevel: 'high',
  },
  self_sabotage: {
    name: 'Self-Sabotage Pattern',
    shortDescription: 'Unconsciously destroying what you build',
    fullDescription: "When things get good, you unconsciously create problems or walk away. You've repeated this pattern multiple times - blowing up relationships, opportunities, or progress right before breakthrough.",
    riskLevel: 'high',
  },
  relationship_erosion: {
    name: 'Relationship Erosion',
    shortDescription: 'Growing apart from those who knew you before',
    fullDescription: "As you evolve, your relationships with family and old friends become strained. They remind you to 'stay humble' and you feel guilty about outgrowing your origins.",
    riskLevel: 'moderate',
  },
  // Success Sabotage
  burnout_depletion: {
    name: 'Burnout & Depletion',
    shortDescription: 'Running on empty with no fuel for opportunities',
    fullDescription: "You've forgotten what genuine rest feels like. Your energy tank is chronically depleted, and you ignore body signals warning you to slow down. When opportunities arrive, you have nothing left.",
    riskLevel: 'high',
  },
  decision_fatigue: {
    name: 'Decision Fatigue',
    shortDescription: 'Paralysis from too many choices and depleted willpower',
    fullDescription: "Your worst decisions happen when you're tired. You experience paralysis from too many options and often make reactive, crisis-driven decisions instead of strategic ones.",
    riskLevel: 'moderate',
  },
  execution_breakdown: {
    name: 'Execution Breakdown',
    shortDescription: 'Knowing what to do but failing to do it',
    fullDescription: "You know exactly what you should do, but you're not doing it. The gap between knowledge and action is massive, and you rarely finish what you start.",
    riskLevel: 'high',
  },
  // Compass Crisis
  comparison_catastrophe: {
    name: 'Comparison Catastrophe',
    shortDescription: "Measuring yourself against others' highlight reels",
    fullDescription: "You immediately compare wins to others' achievements. Social media leaves you feeling behind and inadequate. Even when you hit goals, they feel empty because someone else has done more.",
    riskLevel: 'high',
  },
  motivation_collapse: {
    name: 'Motivation Collapse',
    shortDescription: 'Lost fire for goals that once excited you',
    fullDescription: "What once fired you up now feels like obligation. Your relationship with work has become draining, and you're not sure if you're building toward what you actually want.",
    riskLevel: 'high',
  },
  performance_liability: {
    name: 'Performance Liability',
    shortDescription: 'Massive gap between potential and actual results',
    fullDescription: "Others see your potential but you can't access it. You constantly think 'I should be further along' and feel nowhere near what you're capable of.",
    riskLevel: 'moderate',
  },
};

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Save sub-pattern assessment results
 */
export async function saveSubPatternAssessment(
  userId: string,
  result: SubPatternResult
): Promise<SaveSubPatternResult> {
  try {
    // First check if avatar_assessments record exists
    const { data: existing, error: fetchError } = await supabase
      .from('avatar_assessments')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[SubPatternAssessment] Error checking existing record:', fetchError);
      return { success: false, error: fetchError.message };
    }

    const assessmentData = {
      user_id: userId,
      primary_pattern: result.primaryPattern,
      sub_pattern_scores: result.scores,
      updated_at: new Date().toISOString(),
    };

    let assessmentId: string;

    if (existing?.id) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('avatar_assessments')
        .update(assessmentData)
        .eq('id', existing.id);

      if (updateError) {
        console.error('[SubPatternAssessment] Error updating assessment:', updateError);
        return { success: false, error: updateError.message };
      }
      assessmentId = existing.id;
    } else {
      // Insert new record with required fields
      const { data: inserted, error: insertError } = await supabase
        .from('avatar_assessments')
        .insert({
          ...assessmentData,
          temperament: 'warrior', // Default - will be updated by temperament assessment
          temperament_scores: { warrior: 0, sage: 0, connector: 0, builder: 0 },
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[SubPatternAssessment] Error inserting assessment:', insertError);
        return { success: false, error: insertError.message };
      }
      assessmentId = inserted.id;
    }

    // Update user_profiles.collision_patterns with sub_patterns data
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('collision_patterns')
      .eq('id', userId)
      .single();

    if (profile?.collision_patterns) {
      const updatedCollisionPatterns = {
        ...profile.collision_patterns,
        sub_patterns: {
          primary: result.primarySubPattern,
          secondary: result.secondarySubPattern,
          scores: result.scores,
          max_scores: result.maxScores,
          assessed_at: result.assessedAt,
        },
      };

      await supabase
        .from('user_profiles')
        .update({ collision_patterns: updatedCollisionPatterns })
        .eq('id', userId);
    }

    console.log('[SubPatternAssessment] Saved successfully:', assessmentId);
    return { success: true, assessmentId };
  } catch (error) {
    console.error('[SubPatternAssessment] Unexpected error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get existing sub-pattern assessment for user
 */
export async function getSubPatternAssessment(userId: string): Promise<SubPatternResult | null> {
  try {
    const { data, error } = await supabase
      .from('avatar_assessments')
      .select('sub_pattern_scores, primary_pattern, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data?.sub_pattern_scores || !data?.primary_pattern) {
      return null;
    }

    const scores = data.sub_pattern_scores as SubPatternScores;
    const primaryPattern = data.primary_pattern as PrimaryPattern;
    const maxScores = getMaxScoresForPattern(primaryPattern);
    const { primary, secondary } = determineSubPatterns(scores, maxScores);

    return {
      primaryPattern,
      primarySubPattern: primary,
      secondarySubPattern: secondary,
      scores,
      maxScores,
      assessedAt: data.updated_at,
    };
  } catch (error) {
    console.error('[SubPatternAssessment] Error fetching assessment:', error);
    return null;
  }
}

export default {
  getQuestionsForPattern,
  getSubPatternsForPattern,
  calculateSubPatternScores,
  determineSubPatterns,
  saveSubPatternAssessment,
  getSubPatternAssessment,
  SUB_PATTERN_INFO,
};
