/**
 * RKPI Page: CheckInHistory
 * Vertical list of completed check-ins with expandable details.
 * Shows: date, overall score badge, mini KPI grid, action items, insights.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Calendar,
  Loader2,
  ClipboardList,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRelationship } from '@/contexts/RelationshipContext';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import type { CheckInWithScores } from '@/types/relationship-kpis';
import {
  formatScore,
  getScoreStyle,
  getScoreCategory,
  getCategoryStyle,
  calculateOverallScore,
} from '@/utils/relationshipKpis';

export default function CheckInHistory() {
  const navigate = useNavigate();
  const { recentCheckIns } = useRelationship();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completedCheckIns = useMemo(
    () => recentCheckIns.filter((ci) => ci.status === 'completed'),
    [recentCheckIns]
  );

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/40 hover:text-white/60 h-8 w-8"
            onClick={() => navigate('/relationship-kpis')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-white">Check-In History</h1>
            <p className="text-xs text-white/40">
              {completedCheckIns.length} completed check-in{completedCheckIns.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Empty state */}
        {completedCheckIns.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">No check-ins yet.</p>
            <Button
              size="sm"
              className="mt-4 bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => navigate('/relationship-kpis/check-in')}
            >
              Start Your First Check-In
            </Button>
          </div>
        )}

        {/* Check-in list */}
        <div className="space-y-3">
          {completedCheckIns.map((checkIn) => (
            <CheckInCard
              key={checkIn.id}
              checkIn={checkIn}
              isExpanded={expandedId === checkIn.id}
              onToggle={() => toggleExpand(checkIn.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponent: CheckInCard
// ---------------------------------------------------------------------------

interface CheckInCardProps {
  checkIn: CheckInWithScores;
  isExpanded: boolean;
  onToggle: () => void;
}

function CheckInCard({ checkIn, isExpanded, onToggle }: CheckInCardProps) {
  const dateStr = checkIn.completed_at ?? checkIn.check_in_date;
  const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const overall =
    checkIn.overall_score ??
    calculateOverallScore(
      Object.fromEntries(
        (checkIn.scores ?? []).map((s) => [s.kpi_name, s.score])
      )
    );
  const overallStyle = overall !== null ? getScoreStyle(overall) : null;

  const actionItems = checkIn.action_items ?? [];
  const completedActions = actionItems.filter((a) => a.completed).length;

  return (
    <div className="rounded-lg bg-white/5 border border-white/10 overflow-hidden">
      {/* Summary row (always visible) */}
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 text-center">
            {overall !== null && overallStyle ? (
              <span className={`text-xl font-bold ${overallStyle.text}`}>
                {formatScore(overall)}
              </span>
            ) : (
              <span className="text-xl font-bold text-white/30">—</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {checkIn.check_in_week}
            </p>
            <p className="text-xs text-white/40">{formattedDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {actionItems.length > 0 && (
            <span className="text-xs text-white/30">
              {completedActions}/{actionItems.length} actions
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-white/30" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/30" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
          {/* KPI scores mini-grid */}
          {checkIn.scores && checkIn.scores.length > 0 && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                KPI Scores
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1">
                {KPI_DEFINITIONS.map((kpi) => {
                  const scoreData = checkIn.scores.find(
                    (s) => s.kpi_name === kpi.name
                  );
                  if (!scoreData) return null;
                  const style = getScoreStyle(scoreData.score);
                  return (
                    <div
                      key={kpi.name}
                      className="flex items-center justify-between p-1.5 rounded bg-white/5 text-xs"
                    >
                      <span className="text-white/50 truncate mr-1">
                        {kpi.label.split(' ')[0]}
                      </span>
                      <span className={`font-semibold ${style.text}`}>
                        {scoreData.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action items */}
          {actionItems.length > 0 && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                Action Items
              </p>
              <div className="space-y-1">
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 text-xs"
                  >
                    <CheckCircle2
                      className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${
                        item.completed
                          ? 'text-emerald-400'
                          : 'text-white/20'
                      }`}
                    />
                    <span
                      className={
                        item.completed
                          ? 'text-white/40 line-through'
                          : 'text-white/60'
                      }
                    >
                      {item.item_text}
                    </span>
                    <span className="text-white/20 ml-auto flex-shrink-0">
                      {item.assigned_to}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insight */}
          {checkIn.insight && (
            <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-rose-400" />
                <span className="text-xs font-medium text-rose-300">
                  AI Insight
                </span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                {checkIn.insight.insight_text}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
