import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Circle,
  Play,
  Shield,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { TacticWithProgress } from '@/types/tactic';
import { useState } from 'react';
import { getCategoryColor } from '@/config/categories';
import { TacticDetailModal } from './TacticDetailModal';
import { M026AggregatorCard } from './M026AggregatorCard';

interface Week3ChecklistProps {
  tactics: TacticWithProgress[];
  progressData: any[];
  onTacticClick?: (tacticId: string) => void;
  onStartTactic?: (tacticId: string) => void;
  onCompleteTactic?: (tacticId: string) => void;
  onSchedule?: (tacticId: string, tacticName: string, durationMinutes: number | null, category: string) => void;
  isExpanded?: boolean;
}

/**
 * Week3Checklist - Nette's Mentorship Lesson 3 Progress Tracker
 *
 * Displays all 6 Lesson 3 mentorship tactics (M021-M026) with:
 * - Overall progress bar showing X/5 completed (excluding M026 aggregator)
 * - Visual distinction between critical path and regular tactics
 * - Grouped by mentorship category (Leadership Development)
 * - Quick status icons (completed, in_progress, not_started)
 * - Estimated time and cost for each tactic
 *
 * Purpose: Give users a focused view of Nette's Lesson 3 curriculum - Leadership Identity & Boundaries
 */
export function Week3Checklist({
  tactics,
  progressData,
  onTacticClick,
  onStartTactic,
  onCompleteTactic,
  onSchedule,
  isExpanded: initialExpanded = true
}: Week3ChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [selectedTactic, setSelectedTactic] = useState<TacticWithProgress | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Separate M026 (aggregator) from M021-M025
  const m026Tactic = tactics.find(t => t.tactic_id === 'M026');
  const m021ToM025 = tactics.filter(t =>
    t.tactic_id.startsWith('M') &&
    t.mentorship_week === 3 &&
    t.tactic_id !== 'M026' // Exclude M026 from regular list
  ).sort((a, b) => a.tactic_id.localeCompare(b.tactic_id));

  // Calculate progress (excluding M026)
  const totalTactics = m021ToM025.length; // Should be 5
  const completedTactics = m021ToM025.filter(t => t.status === 'completed').length;
  const inProgressTactics = m021ToM025.filter(t => t.status === 'in_progress').length;
  const progressPercentage = totalTactics > 0 ? Math.round((completedTactics / totalTactics) * 100) : 0;

  // Calculate time and cost (M021-M025 only)
  const totalEstimatedTime = m021ToM025.reduce((sum, t) => {
    const hours = parseFloat(t.estimated_time?.replace(/[^\d.]/g, '') || '0');
    return sum + hours;
  }, 0);

  const totalCostRange = m021ToM025.reduce((acc, t) => {
    return {
      min: acc.min + (t.cost_min_usd || 0),
      max: acc.max + (t.cost_max_usd || 0)
    };
  }, { min: 0, max: 0 });

  // Group tactics by mentorship category (M021-M025 only)
  const tacticsByCategory = m021ToM025.reduce((acc, tactic) => {
    const category = tactic.mentorship_category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(tactic);
    return acc;
  }, {} as Record<string, TacticWithProgress[]>);

  const categoryOrder = ['Leadership Development'];
  const sortedCategories = Object.keys(tacticsByCategory).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const StatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'in_progress': return <Play className="w-4 h-4 text-primary" />;
      default: return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (totalTactics === 0) {
    return (
      <Card className="border-2 border-amber-200 bg-amber-50">
        <div className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h3 className="font-semibold text-amber-900 mb-2">No Lesson 3 Mentorship Tactics Found</h3>
          <p className="text-sm text-amber-700 mb-4">
            Lesson 3 mentorship tactics (M021-M026) are not currently available in your roadmap.
            This could be due to filtering or database issues.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="border-amber-300 hover:bg-amber-100"
          >
            Refresh Page
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
    <Card className="overflow-hidden border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-green-50">
      {/* Header */}
      <div
        className="p-4 bg-gradient-to-r from-teal-500 to-green-500 text-white cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            <div>
              <h3 className="font-semibold text-lg">Nette's Mentorship - Lesson 3</h3>
              <p className="text-sm text-teal-100">Establishing Leadership Identity and Boundaries for Success</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-white text-teal-700 font-semibold">
              {completedTactics}/{totalTactics} Complete
            </Badge>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress
            value={progressPercentage}
            className="h-3 bg-teal-200"
          />
          <div className="flex justify-between text-xs text-teal-100">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ${totalCostRange.min}-${totalCostRange.max} investment
            </span>
            {inProgressTactics > 0 && (
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                {inProgressTactics} in progress
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Checklist */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {sortedCategories.map(category => (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-semibold text-teal-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {category}
              </h4>
              <div className="space-y-1.5">
                {tacticsByCategory[category].map(tactic => {
                  const categoryColor = getCategoryColor(tactic.category);

                  return (
                    <button
                      key={tactic.tactic_id}
                      onClick={() => {
                        setSelectedTactic(tactic);
                        setShowDetailModal(true);
                      }}
                      className="w-full text-left p-3 rounded-lg border bg-white hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Status Icon */}
                        <div className="mt-0.5">
                          {StatusIcon(tactic.status)}
                        </div>

                        {/* Tactic Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <h5 className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                                {tactic.tactic_name}
                              </h5>
                            </div>
                            {tactic.is_critical_path && (
                              <Badge variant="destructive" className="text-xs shrink-0">
                                Critical
                              </Badge>
                            )}
                            {onSchedule && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSchedule(
                                    tactic.tactic_id,
                                    tactic.tactic_name,
                                    tactic.duration_minutes_realistic ?? null,
                                    tactic.category
                                  );
                                }}
                                className="h-6 px-2 text-xs border-teal-300 text-teal-600 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950/50 shrink-0"
                              >
                                <Calendar className="w-3 h-3 mr-1" />
                                Schedule
                              </Button>
                            )}
                          </div>

                          {/* Meta Info */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {(tactic.cost_min_usd || tactic.cost_max_usd) ? (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {tactic.cost_min_usd === 0 && tactic.cost_max_usd === 0
                                  ? 'Free'
                                  : `$${tactic.cost_min_usd}-${tactic.cost_max_usd}`
                                }
                              </span>
                            ) : null}
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: categoryColor,
                                color: categoryColor
                              }}
                            >
                              {tactic.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* M026 Master Checklist */}
          {m026Tactic && (
            <div className="mb-4">
              <M026AggregatorCard
                m026Tactic={m026Tactic}
                lesson3Tactics={m021ToM025}
                onStartTactic={onStartTactic}
                onCompleteTactic={onCompleteTactic}
              />
            </div>
          )}

          {/* Call to Action */}
          {completedTactics === 0 && (
            <div className="mt-4 p-3 bg-teal-100 rounded-lg border-2 border-teal-300">
              <p className="text-sm text-teal-900">
                <strong>Ready to lead?</strong> Begin with{' '}
                <button
                  onClick={() => {
                    const firstTactic = m021ToM025.find(t => t.is_critical_path && t.status === 'not_started');
                    if (firstTactic) {
                      setSelectedTactic(firstTactic);
                      setShowDetailModal(true);
                    }
                  }}
                  className="underline font-semibold hover:text-teal-700"
                >
                  M021: Leadership Identity Statement
                </button>
                {' '}to define who you are as an owner.
              </p>
            </div>
          )}

          {completedTactics > 0 && completedTactics < totalTactics && (
            <div className="mt-4 p-3 bg-green-100 rounded-lg border-2 border-green-300">
              <p className="text-sm text-green-900">
                <strong>Building your leadership!</strong> You've completed {completedTactics} of {totalTactics} tactics.{' '}
                {totalTactics - completedTactics} more to establish your boundaries.
              </p>
            </div>
          )}

          {completedTactics === totalTactics && (
            <div className="mt-4 p-3 bg-emerald-100 rounded-lg border-2 border-emerald-300">
              <p className="text-sm text-emerald-900">
                <strong>Lesson 3 Complete!</strong> You're ready to lead with calm, confident authority.
              </p>
            </div>
          )}
        </div>
      )}
    </Card>

    <TacticDetailModal
      tactic={selectedTactic}
      isOpen={showDetailModal}
      onClose={() => {
        setShowDetailModal(false);
        setSelectedTactic(null);
      }}
      onStartTactic={onStartTactic}
      onCompleteTactic={onCompleteTactic}
    />
    </>
  );
}
