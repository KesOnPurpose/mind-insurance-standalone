/**
 * RIE Phase 1A: Separation Assessment Types
 * Vertex Model — tracks the "angle" between partners (0°–180°).
 *
 * Maps to: relationship_separation_assessments
 */

import type { RelationshipKPIName } from './relationship-kpis';

// ============================================================================
// Enums & Literal Types
// ============================================================================

/** Separation stage derived from the vertex angle */
export type SeparationStage =
  | 'connected'    // 0°–36°
  | 'drifting'     // 37°–72°
  | 'distancing'   // 73°–108°
  | 'disconnected' // 109°–144°
  | 'crisis';      // 145°–180°

// ============================================================================
// Stage Metadata
// ============================================================================

export interface SeparationStageDefinition {
  stage: SeparationStage;
  label: string;
  angleMin: number;
  angleMax: number;
  color: string;
  description: string;
}

export const SEPARATION_STAGES: SeparationStageDefinition[] = [
  {
    stage: 'connected',
    label: 'Connected',
    angleMin: 0,
    angleMax: 36,
    color: 'emerald',
    description: 'Partners are well-aligned and emotionally close.',
  },
  {
    stage: 'drifting',
    label: 'Drifting',
    angleMin: 37,
    angleMax: 72,
    color: 'green',
    description: 'Slight misalignment — proactive attention recommended.',
  },
  {
    stage: 'distancing',
    label: 'Distancing',
    angleMin: 73,
    angleMax: 108,
    color: 'amber',
    description: 'Noticeable gap — intentional reconnection needed.',
  },
  {
    stage: 'disconnected',
    label: 'Disconnected',
    angleMin: 109,
    angleMax: 144,
    color: 'orange',
    description: 'Significant separation — urgent intervention recommended.',
  },
  {
    stage: 'crisis',
    label: 'Crisis',
    angleMin: 145,
    angleMax: 180,
    color: 'red',
    description: 'Relationship at critical risk — professional help advised.',
  },
];

// ============================================================================
// Risk Factor
// ============================================================================

export interface RiskFactor {
  kpi: RelationshipKPIName;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

// ============================================================================
// Intervention
// ============================================================================

export interface RecommendedIntervention {
  type: 'action' | 'conversation' | 'exercise' | 'professional';
  title: string;
  description: string;
  relatedKpis: RelationshipKPIName[];
  priority: number; // 1 = highest
}

// ============================================================================
// Table: relationship_separation_assessments
// ============================================================================

export interface RelationshipSeparationAssessment {
  id: string;
  user_id: string;
  partnership_id: string | null;
  separation_angle: number;
  separation_stage: SeparationStage;
  kpi_scores_snapshot: Record<string, number>;
  risk_factors: RiskFactor[];
  narrative_summary: string | null;
  recommended_interventions: RecommendedIntervention[];
  source_check_in_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeparationAssessmentInsert {
  partnership_id?: string | null;
  separation_angle: number;
  separation_stage: SeparationStage;
  kpi_scores_snapshot?: Record<string, number>;
  risk_factors?: RiskFactor[];
  narrative_summary?: string | null;
  recommended_interventions?: RecommendedIntervention[];
  source_check_in_id?: string | null;
}

export interface SeparationAssessmentUpdate {
  separation_angle?: number;
  separation_stage?: SeparationStage;
  kpi_scores_snapshot?: Record<string, number>;
  risk_factors?: RiskFactor[];
  narrative_summary?: string | null;
  recommended_interventions?: RecommendedIntervention[];
}

// ============================================================================
// Helpers
// ============================================================================

/** Derive separation stage from a numeric angle */
export function getSeparationStage(angle: number): SeparationStage {
  if (angle <= 36) return 'connected';
  if (angle <= 72) return 'drifting';
  if (angle <= 108) return 'distancing';
  if (angle <= 144) return 'disconnected';
  return 'crisis';
}

/** Get stage definition by stage name */
export function getStageDefinition(stage: SeparationStage): SeparationStageDefinition {
  return SEPARATION_STAGES.find((s) => s.stage === stage) ?? SEPARATION_STAGES[0];
}
