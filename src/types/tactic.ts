import type { VideoProvider, CompletionGateConfig } from './video';

// Tactic source type for 3-tier organization
export type TacticSource = 'mentorship' | 'cashflow_course' | 'general';

export interface Tactic {
  tactic_id: string;
  tactic_name: string;
  category: string;
  parent_category?: string | null;           // NEW: High-level category grouping (8 parents)
  estimated_time: string | null;
  capital_required: string | null;
  target_populations: string[] | null;
  experience_level: string | null;
  priority_tier: number | null;
  week_assignment: number | null;
  why_it_matters: string | null;
  step_by_step: any;
  lynettes_tip: string | null;
  common_mistakes: any;

  // NEW: Tactic source for organizing by program origin
  tactic_source?: TacticSource | null;       // 'mentorship' | 'cashflow_course' | 'general'
  is_mentorship_tactic?: boolean | null;     // Legacy field - prefer tactic_source

  // Enriched RAG fields (from migrations 016-029)
  ownership_model?: string[] | null;           // ['rental_arbitrage', 'ownership', 'creative_financing', 'house_hack', 'hybrid']
  applicable_populations?: string[] | null;    // ['ssi', 'veterans', 'elderly', 'disabled', 'mental_health', 'returning_citizens']
  cost_min_usd?: number | null;                // Exact minimum cost in dollars
  cost_max_usd?: number | null;                // Exact maximum cost in dollars
  cost_category?: string | null;               // 'upfront_capital', 'recurring_monthly', 'one_time_fee', 'variable'
  duration_minutes_optimistic?: number | null; // Best case time estimate
  duration_minutes_realistic?: number | null;  // Average case time estimate
  duration_minutes_pessimistic?: number | null;// Worst case time estimate
  is_critical_path?: boolean | null;           // Must-complete tactic for success
  prerequisite_tactics?: string[] | null;      // Tactic IDs that must be completed first
  blocker_tactics?: string[] | null;           // Mutually exclusive tactics
  unlocks_tactics?: string[] | null;           // Tactics enabled after completion
  official_lynette_quote?: string | null;      // Verbatim quote from Lynette Wheaton
  expert_frameworks?: Record<string, boolean> | null; // Methodology tagging
  course_lesson_reference?: string | null;     // 'Module X, Lesson Y' format
  contingency_paths?: any | null;              // Alternative routes when blocked
  success_criteria_schema?: any | null;        // Machine-readable completion checklist
  state_variations?: Record<string, any> | null; // State-specific differences
  completion_rate?: number | null;             // % of users completing (auto-updated)
  avg_completion_minutes?: number | null;      // Actual average completion time
  dropout_rate?: number | null;                // % of users abandoning

  // FEAT-GH-005: Video and Completion Gate Fields (from gh_tactic_instructions)
  video_url?: string | null;                   // Video URL (Vimeo, YouTube, Wistia, etc.)
  video_provider?: VideoProvider | null;       // Detected/specified video provider
  video_duration_seconds?: number | null;      // Video length in seconds
  video_completion_threshold?: number | null;  // % required to mark as complete (default 90)
  video_thumbnail_url?: string | null;         // Video thumbnail for preview

  // Assessment fields
  has_assessment?: boolean | null;             // Whether tactic has an assessment
  assessment_required_for_completion?: boolean | null; // Assessment must pass to complete
  primary_assessment_id?: string | null;       // FK to assessment table

  // Completion gates (FEAT-GH-004)
  completion_gate_enabled?: boolean | null;    // Whether gates are enforced
  completion_gate_config?: CompletionGateConfig | null; // Full gate configuration

  // Display settings
  display_order?: number | null;               // Order within category/week
  show_estimated_time?: boolean | null;        // Show time estimate in UI
}

export interface ProgressRow {
  user_id: string;
  tactic_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

export interface TacticWithProgress extends Tactic {
  progress?: ProgressRow;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: string;
  notes?: string;

  // FEAT-GH-005: Video progress status
  videoWatchPercentage?: number;               // Current video watch progress (0-100)
  videoGateMet?: boolean;                      // Has video completion threshold been met
  assessmentGateMet?: boolean;                 // Has assessment been passed (if required)
  allGatesMet?: boolean;                       // All completion gates met
}

export interface WeekSummary {
  weekNumber: number;
  weekTitle: string;
  phase: JourneyPhase;
  totalTactics: number;
  completedTactics: number;
  inProgressTactics: number;
  estimatedHours: number;
  progressPercentage: number;
  isUnlocked: boolean;
  isRecommendedStart: boolean;
}

export type JourneyPhase = 
  | 'foundation' 
  | 'market_entry' 
  | 'acquisition' 
  | 'operations' 
  | 'growth';

export interface CategoryGroup {
  phase: JourneyPhase;
  name: string;
  description: string;
  categories: string[];
  weeks: number[];
  icon: string;
  color: string;
}

// Enhanced assessment with ownership model and budget precision
export interface EnhancedUserAssessment {
  capital_available: string;              // Categorical: 'less-5k', '5k-15k', etc.
  target_populations: string[];           // ['elderly', 'mental_health', etc.]
  timeline: string;                       // 'within-3-months', 'within-6-months', etc.
  caregiving_experience: string;          // 'no-experience', 'some-experience', etc.
  licensing_familiarity: string;          // 'not-familiar', 'very-familiar', etc.
  overall_score: number;                  // 0-100 readiness score
  readiness_level: string;                // 'foundation_building', 'fast_track', etc.

  // NEW: Enriched personalization fields
  ownership_model?: string;               // 'rental_arbitrage' | 'ownership' | 'undecided'
  target_state?: string;                  // US state abbreviation (e.g., 'TX', 'NY')
  budget_min_usd?: number;                // Exact minimum budget in USD
  budget_max_usd?: number;                // Exact maximum budget in USD
  prioritized_populations?: string[];     // Ordered list of most important populations
}

// User roadmap state for personalized filtering
export interface UserRoadmapState {
  user_id: string;
  ownership_model: string;                // Selected business model
  target_populations: string[];           // Selected target demographics
  target_state: string;                   // Selected state
  budget_min_usd: number;                 // Budget minimum
  budget_max_usd: number;                 // Budget maximum
  timeline_weeks: number;                 // Personalized week count
  prioritized_categories: string[];       // Categories to boost in sorting
  excluded_tactic_ids: string[];          // Tactics user wants to skip
  last_recalculated_at: string;           // Timestamp of last filter recalculation
}

// Tactic with prerequisite validation status
export interface TacticWithPrerequisites extends TacticWithProgress {
  can_start: boolean;                     // All prerequisites completed
  blocking_prerequisites: string[];       // Tactic IDs that need to be completed first
  cost_status?: 'within_budget' | 'exceeds_budget' | 'unknown';
}
