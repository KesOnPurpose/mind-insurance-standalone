/**
 * useAvatarData Hook
 *
 * Fetches combined assessment data to reveal the user's Identity Avatar:
 * - Primary Pattern (from Identity Collision assessment)
 * - Sub-Pattern (from Sub-Pattern assessment)
 * - Internal Wiring / Temperament (from Temperament assessment)
 *
 * The Avatar is the unique combination of all three layers.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useIdentityCollisionStatus } from './useIdentityCollisionStatus';
import { useTemperamentStatus } from './useTemperamentStatus';
import { useSubPatternStatus } from './useSubPatternStatus';
import { findMatchingAvatar, type Avatar } from '@/services/avatarAssignmentService';

// ============================================================================
// TYPES
// ============================================================================

export interface AvatarData {
  isComplete: boolean;
  completionPercentage: number;
  missingAssessments: string[];

  // Layer 1: Identity Collision Pattern
  primaryPattern: {
    name: string;
    displayName: string;
    confidence?: number;
  } | null;

  // Layer 2: Sub-Pattern
  subPattern: {
    primary: string;
    secondary?: string;
  } | null;

  // Layer 3: Internal Wiring
  temperament: {
    primary: string;
    displayName: string;
    secondary?: string;
  } | null;

  // Combined Avatar name (generated when all 3 are complete)
  avatarName: string | null;
  avatarDescription: string | null;

  // Full Avatar object from library (when matched)
  fullAvatar: Avatar | null;
}

// ============================================================================
// PATTERN DISPLAY MAPPING
// ============================================================================

const PATTERN_DISPLAY: Record<string, string> = {
  past_prison: 'Past Prison',
  success_sabotage: 'Success Sabotage',
  compass_crisis: 'Compass Crisis',
};

const TEMPERAMENT_DISPLAY: Record<string, string> = {
  warrior: 'The Warrior',
  sage: 'The Sage',
  connector: 'The Connector',
  builder: 'The Builder',
};

const SUB_PATTERN_DISPLAY: Record<string, string> = {
  // Past Prison sub-patterns
  identity_ceiling: 'Identity Ceiling',
  impostor_syndrome: 'Impostor Syndrome',
  self_sabotage: 'Self-Sabotage',
  relationship_erosion: 'Relationship Erosion',
  // Success Sabotage sub-patterns
  burnout_depletion: 'Burnout Depletion',
  decision_fatigue: 'Decision Fatigue',
  execution_breakdown: 'Execution Breakdown',
  // Compass Crisis sub-patterns
  comparison_catastrophe: 'Comparison Catastrophe',
  motivation_collapse: 'Motivation Collapse',
  performance_liability: 'Performance Liability',
};

// Generate avatar name from components
function generateAvatarName(
  pattern: string | null,
  subPattern: string | null,
  temperament: string | null
): string | null {
  if (!pattern || !subPattern || !temperament) return null;

  // Create evocative avatar names based on combinations
  const patternPrefix: Record<string, Record<string, string>> = {
    past_prison: {
      warrior: 'The Unbound Warrior',
      sage: 'The Awakening Sage',
      connector: 'The Healing Bridge',
      builder: 'The Rising Architect',
    },
    success_sabotage: {
      warrior: 'The Fearless Champion',
      sage: 'The Breakthrough Mind',
      connector: 'The Empowered Ally',
      builder: 'The Unstoppable Creator',
    },
    compass_crisis: {
      warrior: 'The Directed Force',
      sage: 'The Clarity Seeker',
      connector: 'The Purposeful Heart',
      builder: 'The Focused Visionary',
    },
  };

  return patternPrefix[pattern]?.[temperament] || 'The Emerging Self';
}

function generateAvatarDescription(
  pattern: string | null,
  subPattern: string | null,
  temperament: string | null
): string | null {
  if (!pattern || !subPattern || !temperament) return null;

  const patternName = PATTERN_DISPLAY[pattern] || pattern;
  const tempName = TEMPERAMENT_DISPLAY[temperament] || temperament;
  const subPatternName = SUB_PATTERN_DISPLAY[subPattern] || subPattern;

  return `You operate as ${tempName.toLowerCase()}, driven to overcome ${patternName}. ` +
    `Your unique sub-pattern "${subPatternName}" reveals the specific way this collision manifests in your life. ` +
    `Understanding this avatar unlocks personalized strategies for breakthrough.`;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAvatarData() {
  const { user } = useAuth();

  // Fetch individual assessment statuses
  const { data: collisionStatus, isLoading: collisionLoading } = useIdentityCollisionStatus(user?.id);
  const { data: temperamentStatus, isLoading: temperamentLoading } = useTemperamentStatus();
  const { data: subPatternStatus, isLoading: subPatternLoading } = useSubPatternStatus();

  const isLoading = collisionLoading || temperamentLoading || subPatternLoading;

  // Build avatar data from individual assessments
  const avatarData: AvatarData = {
    isComplete: false,
    completionPercentage: 0,
    missingAssessments: [],
    primaryPattern: null,
    subPattern: null,
    temperament: null,
    avatarName: null,
    avatarDescription: null,
    fullAvatar: null,
  };

  // Check each layer
  const hasPattern = collisionStatus?.hasPattern || false;
  const hasTemperament = temperamentStatus?.hasCompleted || false;
  const hasSubPattern = subPatternStatus?.hasCompleted || false;

  // Calculate completion
  const completedCount = [hasPattern, hasTemperament, hasSubPattern].filter(Boolean).length;
  avatarData.completionPercentage = Math.round((completedCount / 3) * 100);
  avatarData.isComplete = completedCount === 3;

  // Track missing assessments
  if (!hasPattern) avatarData.missingAssessments.push('Identity Collision');
  if (!hasTemperament) avatarData.missingAssessments.push('Internal Wiring');
  if (!hasSubPattern) avatarData.missingAssessments.push('Sub-Pattern');

  // Layer 1: Primary Pattern
  if (hasPattern && collisionStatus?.primaryPattern) {
    avatarData.primaryPattern = {
      name: collisionStatus.primaryPattern,
      displayName: PATTERN_DISPLAY[collisionStatus.primaryPattern] || collisionStatus.primaryPattern,
      confidence: collisionStatus.confidence,
    };
  }

  // Layer 2: Sub-Pattern
  if (hasSubPattern && subPatternStatus?.result) {
    avatarData.subPattern = {
      primary: subPatternStatus.result.primarySubPattern,
      secondary: subPatternStatus.result.secondarySubPattern,
    };
  }

  // Layer 3: Temperament
  if (hasTemperament && temperamentStatus?.result) {
    const primary = temperamentStatus.result.primary;
    avatarData.temperament = {
      primary,
      displayName: TEMPERAMENT_DISPLAY[primary] || primary,
      secondary: temperamentStatus.result.secondary,
    };
  }

  // Find matching avatar from library and generate name if complete
  if (avatarData.isComplete && avatarData.primaryPattern && avatarData.subPattern && avatarData.temperament) {
    console.log('[useAvatarData] Looking up avatar with:', {
      pattern: avatarData.primaryPattern.name,
      subPattern: avatarData.subPattern.primary,
      temperament: avatarData.temperament.primary,
    });

    // Look up full avatar from library
    const matchedAvatar = findMatchingAvatar(
      avatarData.primaryPattern.name as 'past_prison' | 'success_sabotage' | 'compass_crisis',
      avatarData.subPattern.primary as any,
      avatarData.temperament.primary as 'warrior' | 'sage' | 'connector' | 'builder'
    );

    console.log('[useAvatarData] matchedAvatar result:', matchedAvatar?.name || 'NULL - using fallback');

    if (matchedAvatar) {
      avatarData.fullAvatar = matchedAvatar;
      avatarData.avatarName = matchedAvatar.name;
      avatarData.avatarDescription = matchedAvatar.fullDescription;
    } else {
      // Fallback to generated names if no exact match found
      avatarData.avatarName = generateAvatarName(
        avatarData.primaryPattern.name,
        avatarData.subPattern.primary,
        avatarData.temperament.primary
      );
      avatarData.avatarDescription = generateAvatarDescription(
        avatarData.primaryPattern.name,
        avatarData.subPattern.primary,
        avatarData.temperament.primary
      );
    }
  }

  return {
    avatarData,
    isLoading,
  };
}

export default useAvatarData;
