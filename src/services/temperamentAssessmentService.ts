/**
 * Temperament Assessment Service
 * Mind Insurance - Week 2 Feature
 *
 * Handles the standalone Temperament Assessment that determines user's
 * primary temperament type (warrior, sage, connector, builder).
 *
 * Data is saved to avatar_assessments.temperament + temperament_scores
 * and user_profiles.temperament_assessed_at timestamp.
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type TemperamentType = 'warrior' | 'sage' | 'connector' | 'builder';

export interface TemperamentScores {
  warrior: number;
  sage: number;
  connector: number;
  builder: number;
}

export interface TemperamentQuestion {
  id: string;
  question: string;
  options: {
    value: TemperamentType;
    label: string;
    description?: string;
  }[];
}

export interface TemperamentResult {
  primary: TemperamentType;
  secondary: TemperamentType | null;
  scores: TemperamentScores;
  isBalanced: boolean;
  isTied: boolean;
  description: string;
}

export interface SaveTemperamentResult {
  success: boolean;
  assessmentId?: string;
  error?: string;
}

// ============================================================================
// TEMPERAMENT QUESTIONS (8 Questions from identity_collision_questions.txt)
// ============================================================================

export const TEMPERAMENT_QUESTIONS: TemperamentQuestion[] = [
  {
    id: 'T1',
    question: "When you're stressed and need to reset your mental state, you naturally want to:",
    options: [
      { value: 'warrior', label: 'Move your body', description: 'Walk, workout, do something physical' },
      { value: 'sage', label: 'Get alone with your thoughts', description: 'Read, journal, contemplate' },
      { value: 'connector', label: 'Connect with someone', description: 'Call a friend, talk it out, be with people' },
      { value: 'builder', label: 'Organize or plan', description: 'Create structure, make lists, systematize' },
    ],
  },
  {
    id: 'T2',
    question: 'When learning something new and important, you prefer to:',
    options: [
      { value: 'warrior', label: 'Jump in and figure it out', description: 'Learn through action and mistakes' },
      { value: 'sage', label: 'Study thoroughly first', description: 'Read, research, understand deeply before attempting' },
      { value: 'connector', label: 'Learn alongside others', description: 'Discussion, collaboration, shared discovery' },
      { value: 'builder', label: 'Follow a proven system', description: 'Step-by-step process with clear milestones' },
    ],
  },
  {
    id: 'T3',
    question: 'Your ideal morning routine would include:',
    options: [
      { value: 'warrior', label: 'Physical movement', description: 'Workout, walk, dynamic activity that energizes you' },
      { value: 'sage', label: 'Quiet reflection', description: 'Meditation, reading, silent contemplation' },
      { value: 'connector', label: 'Connection time', description: 'Prayer for others, gratitude for relationships, meaningful conversation' },
      { value: 'builder', label: 'Planning and structure', description: 'Organizing your day, clear priorities, goal review' },
    ],
  },
  {
    id: 'T4',
    question: 'When facing a big decision, you naturally:',
    options: [
      { value: 'warrior', label: 'Trust your gut and act quickly', description: 'Figure it out as you go' },
      { value: 'sage', label: 'Analyze deeply', description: 'Seek wisdom, consider all angles, think it through thoroughly' },
      { value: 'connector', label: 'Talk it through with trusted people', description: 'Process verbally, seek counsel and input' },
      { value: 'builder', label: 'Create a framework', description: 'Pros/cons list, decision matrix, systematic evaluation' },
    ],
  },
  {
    id: 'T5',
    question: 'Your spiritual or reflective practices feel most genuine when they:',
    options: [
      { value: 'warrior', label: 'Involve your whole body', description: 'Embodied prayer, physical worship, movement' },
      { value: 'sage', label: 'Create space for deep contemplation', description: 'Silence, solitude, meditative depth' },
      { value: 'connector', label: 'Connect you with community', description: 'Shared experience, accountability, collective practice' },
      { value: 'builder', label: 'Follow a consistent structure', description: 'Routine, scheduled practice times, clear framework' },
    ],
  },
  {
    id: 'T6',
    question: 'You feel most alive and in your element when:',
    options: [
      { value: 'warrior', label: 'Accomplishing tangible goals', description: 'Checking boxes, seeing visible progress' },
      { value: 'sage', label: 'Having profound insights', description: '"Aha moments," deep understanding, breakthrough clarity' },
      { value: 'connector', label: 'Experiencing deep connection', description: 'Meaningful conversation, shared moments, felt belonging' },
      { value: 'builder', label: 'Optimizing systems', description: 'Improving efficiency, seeing measurable growth, refining processes' },
    ],
  },
  {
    id: 'T7',
    question: 'When you encounter a challenging problem, your first instinct is to:',
    options: [
      { value: 'warrior', label: 'Take immediate action', description: 'Try something, test solutions, move your body while thinking' },
      { value: 'sage', label: 'Withdraw to think', description: 'Give yourself space to process and understand deeply' },
      { value: 'connector', label: 'Reach out for perspective', description: 'Call someone, talk through it, crowdsource wisdom' },
      { value: 'builder', label: 'Break it down systematically', description: 'Analyze components, create an action plan' },
    ],
  },
  {
    id: 'T8',
    question: 'After a depleting day, you restore your energy by:',
    options: [
      { value: 'warrior', label: 'Physical activity', description: 'Even when tired, movement recharges you' },
      { value: 'sage', label: 'Solitude and quiet', description: 'You need alone time to recharge your battery' },
      { value: 'connector', label: 'Quality connection', description: 'Being with people you love fills your tank' },
      { value: 'builder', label: 'Restoring order', description: 'Tidying space, organizing, creating structure calms you' },
    ],
  },
];

// ============================================================================
// TEMPERAMENT DESCRIPTIONS
// ============================================================================

export const TEMPERAMENT_INFO: Record<TemperamentType, {
  name: string;
  title: string;
  coreDriver: string;
  energyPattern: string;
  learningStyle: string;
  bestPractices: string;
  strength: string;
  vulnerability: string;
  mindInsuranceNeeds: string;
  icon: string;
  color: string;
}> = {
  warrior: {
    name: 'Warrior',
    title: 'The Warrior',
    coreDriver: 'Doing, conquering, building through action',
    energyPattern: 'High kinetic energy, needs physical discharge',
    learningStyle: 'Through experience and doing',
    bestPractices: 'Movement-based, physical rituals, short intense bursts',
    strength: "You don't get stuck in analysis paralysis. When others are still planning, you're already three steps down the road learning from real experience. Your body is intelligent—you make decisions through felt sense, not just logic.",
    vulnerability: "You can burn out by constantly doing without reflecting. You may act before fully processing, leading to reactive patterns. Rest feels like weakness when it's actually your recovery fuel.",
    mindInsuranceNeeds: 'Practices that honor your need for movement while building in reflection. Physical rituals that discharge energy while rewiring patterns. Short, intense practices you can complete quickly and feel immediate results.',
    icon: '🗡️',
    color: '#fac832', // MI Gold - action energy
  },
  sage: {
    name: 'Sage',
    title: 'The Sage',
    coreDriver: 'Understanding, wisdom, deep insight',
    energyPattern: 'Steady, contemplative, internal processing',
    learningStyle: 'Through study, reading, and reflection',
    bestPractices: 'Contemplative, reading-based, extended quiet time',
    strength: "You see what others miss. Your capacity for deep reflection reveals insights that transform lives. You don't just consume information—you metabolize it into wisdom. Your contemplative nature creates breakthrough clarity.",
    vulnerability: "You can overthink and under-execute. Analysis becomes paralysis. You may withdraw so deeply that you lose connection with others and your body. Knowledge without action becomes mental hoarding.",
    mindInsuranceNeeds: 'Practices that honor your need for solitude while pushing you toward embodied action. Contemplative rituals that create space for insight while building momentum. Deep work balanced with physical grounding.',
    icon: '📚',
    color: '#05c3dd', // MI Cyan - wisdom/depth
  },
  connector: {
    name: 'Connector',
    title: 'The Connector',
    coreDriver: 'Belonging, community, shared experience',
    energyPattern: 'Fed by connection, drained by isolation',
    learningStyle: 'Through dialogue and relationship',
    bestPractices: 'Relational, verbal processing, community-based',
    strength: "You create the glue that holds communities together. Your relational intelligence reads rooms, bridges gaps, and fosters belonging. You naturally draw wisdom from collective experience. Your vulnerability in sharing gives others permission to be real.",
    vulnerability: "You can lose yourself trying to please others. External validation can become your drug. You may avoid necessary solitude and struggle to hear your own voice beneath others' opinions. People-pleasing can mask as connection.",
    mindInsuranceNeeds: 'Practices that honor your need for connection while building internal authority. Relational rituals that create accountability while strengthening your own voice. Community-based practices balanced with solo reflection.',
    icon: '🤝',
    color: '#05c3dd', // MI Cyan - connection/flow
  },
  builder: {
    name: 'Builder',
    title: 'The Builder',
    coreDriver: 'Structure, optimization, measurable progress',
    energyPattern: 'Sustained focus, needs clear frameworks',
    learningStyle: 'Through systems and organization',
    bestPractices: 'Structured, measurable, systematic protocols',
    strength: "You create systems that scale. Where others see mess, you see patterns. Your capacity to organize complexity creates sustainable growth. You don't just do things—you build frameworks that multiply impact. Tracking and measurement reveal what others miss.",
    vulnerability: "You can prioritize efficiency over presence. Control becomes a drug when uncertainty threatens. You may optimize the process while missing the point. Perfectionism can masquerade as excellence, creating paralysis.",
    mindInsuranceNeeds: 'Practices that honor your need for structure while embracing mystery. Systematic rituals that create consistency while leaving room for spontaneity. Clear frameworks balanced with surrender to what can\'t be controlled.',
    icon: '🏗️',
    color: '#fac832', // MI Gold - structure/creation
  },
};

// ============================================================================
// SCORING ALGORITHM
// ============================================================================

/**
 * Calculate temperament scores from answers
 */
export function calculateTemperamentScores(
  answers: Record<string, TemperamentType>
): TemperamentScores {
  const scores: TemperamentScores = {
    warrior: 0,
    sage: 0,
    connector: 0,
    builder: 0,
  };

  // Count answers for each temperament
  Object.values(answers).forEach((temperament) => {
    scores[temperament]++;
  });

  return scores;
}

/**
 * Determine primary and secondary temperament from scores
 */
export function calculateTemperamentResult(
  scores: TemperamentScores
): TemperamentResult {
  const entries = Object.entries(scores) as [TemperamentType, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);

  const [primary, primaryScore] = sorted[0];
  const [secondary, secondaryScore] = sorted[1];

  // Check for tie at top
  const isTied = primaryScore === secondaryScore && primaryScore >= 3;

  // Check for balanced (no dominant - no one with 4+)
  const isBalanced = primaryScore < 4;

  // Determine if there's a meaningful secondary
  const hasSecondary = secondaryScore >= 3;

  // Build description based on pattern
  let description: string;

  if (isTied) {
    description = `You have a DUAL temperament: THE ${TEMPERAMENT_INFO[primary].name.toUpperCase()} + ${TEMPERAMENT_INFO[secondary].name.toUpperCase()}. You're equally wired for ${TEMPERAMENT_INFO[primary].coreDriver.toLowerCase()} AND ${TEMPERAMENT_INFO[secondary].coreDriver.toLowerCase()}. Your protocol will intentionally blend practices from both temperaments for maximum effectiveness.`;
  } else if (isBalanced) {
    const topThree = sorted.slice(0, 3).map(([t]) => TEMPERAMENT_INFO[t].name);
    description = `You have a BALANCED temperament profile. You can effectively draw from multiple approaches: ${topThree.join(', ')}. This is actually a strength—you're multi-modal and adaptable. Your protocol will offer variety across different practice styles so you can choose what resonates in different seasons.`;
  } else if (hasSecondary) {
    description = `You are ${TEMPERAMENT_INFO[primary].title.toUpperCase()} with ${TEMPERAMENT_INFO[secondary].name} tendencies. You lead with ${TEMPERAMENT_INFO[primary].coreDriver.toLowerCase()} but also draw energy from ${TEMPERAMENT_INFO[secondary].coreDriver.toLowerCase()}. Your protocol will blend practices from both temperaments.`;
  } else {
    description = `You are strongly ${TEMPERAMENT_INFO[primary].title.toUpperCase()}. ${TEMPERAMENT_INFO[primary].strength} Your practices should be heavily weighted toward ${TEMPERAMENT_INFO[primary].bestPractices.toLowerCase()}.`;
  }

  return {
    primary,
    secondary: hasSecondary || isTied ? secondary : null,
    scores,
    isBalanced,
    isTied,
    description,
  };
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Save temperament assessment results
 * - First checks if avatar_assessments record exists (from Identity Collision)
 * - If exists: UPDATE the temperament fields only
 * - If not exists: INSERT with all required fields
 * - Updates user_profiles.temperament and temperament_assessed_at
 */
export async function saveTemperamentAssessment(
  userId: string,
  result: TemperamentResult
): Promise<SaveTemperamentResult> {
  try {
    // 1. Check if user already has an avatar_assessments record (from Identity Collision)
    const { data: existing, error: checkError } = await supabase
      .from('avatar_assessments')
      .select('id, primary_pattern, avatar_type')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('[TemperamentAssessment] Error checking existing record:', checkError);
    }

    let assessmentId: string | undefined;

    if (existing) {
      // User has existing record - UPDATE only temperament fields
      const { data: updated, error: updateError } = await supabase
        .from('avatar_assessments')
        .update({
          temperament: result.primary,
          temperament_scores: result.scores,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select('id')
        .single();

      if (updateError) {
        console.error('[TemperamentAssessment] Error updating avatar_assessments:', updateError);
        return { success: false, error: updateError.message };
      }

      assessmentId = updated?.id;
      console.log('[TemperamentAssessment] Updated existing record:', assessmentId);
    } else {
      // No existing record - INSERT with all required fields
      // This case is unusual (user should have Identity Collision first) but handle it
      const { data: inserted, error: insertError } = await supabase
        .from('avatar_assessments')
        .insert({
          user_id: userId,
          temperament: result.primary,
          temperament_scores: result.scores,
          // Required fields with defaults for temperament-only save
          avatar_type: 'partial', // Indicates incomplete avatar (no primary pattern yet)
          primary_pattern: 'pending', // Will be set when Identity Collision is completed
          past_prison_score: 0,
          success_sabotage_score: 0,
          compass_crisis_score: 0,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[TemperamentAssessment] Error inserting avatar_assessments:', insertError);
        return { success: false, error: insertError.message };
      }

      assessmentId = inserted?.id;
      console.log('[TemperamentAssessment] Created new record:', assessmentId);
    }

    // 2. Update user_profiles with timestamp
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        temperament: result.primary,
        temperament_assessed_at: new Date().toISOString(),
        assigned_avatar_assessment_id: assessmentId,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('[TemperamentAssessment] Error updating user_profiles:', profileError);
      // Non-blocking - assessment is saved
    }

    return { success: true, assessmentId };
  } catch (error) {
    console.error('[TemperamentAssessment] Unexpected error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get user's existing temperament assessment
 */
export async function getTemperamentAssessment(
  userId: string
): Promise<TemperamentResult | null> {
  try {
    console.log('[getTemperamentAssessment] Querying for user:', userId);
    const { data, error } = await supabase
      .from('avatar_assessments')
      .select('temperament, temperament_scores')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('[getTemperamentAssessment] Query result:', {
      hasData: !!data,
      temperament: data?.temperament,
      hasScores: !!data?.temperament_scores,
      error: error?.message,
    });

    if (error || !data?.temperament || !data?.temperament_scores) {
      console.log('[getTemperamentAssessment] Returning null due to missing data');
      return null;
    }

    const scores = data.temperament_scores as TemperamentScores;
    return calculateTemperamentResult(scores);
  } catch (error) {
    console.error('[TemperamentAssessment] Error fetching assessment:', error);
    return null;
  }
}

/**
 * Check if user has completed temperament assessment
 */
export async function hasCompletedTemperamentAssessment(
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('temperament_assessed_at')
      .eq('id', userId)
      .maybeSingle();

    return !!data?.temperament_assessed_at;
  } catch (error) {
    console.error('[TemperamentAssessment] Error checking completion:', error);
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  TEMPERAMENT_QUESTIONS,
  TEMPERAMENT_INFO,
  calculateTemperamentScores,
  calculateTemperamentResult,
  saveTemperamentAssessment,
  getTemperamentAssessment,
  hasCompletedTemperamentAssessment,
};
