export interface Tactic {
  tactic_id: string;
  tactic_name: string;
  category: string;
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
}

export interface WeekSummary {
  weekNumber: number;
  weekTitle: string;
  phase: JourneyPhase;
  totalTactics: number;
  completedTactics: number;
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
