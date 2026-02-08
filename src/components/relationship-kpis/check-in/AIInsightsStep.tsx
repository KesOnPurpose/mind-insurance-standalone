/**
 * RKPI Check-In: AIInsightsStep
 * Final step — shows summary of scores, action items, and submit button.
 * AI insights would be generated post-submission (placeholder for now).
 */

import { Loader2, CheckCircle2, Sparkles, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import type { RelationshipKPIName, ActionItemAssignee } from '@/types/relationship-kpis';
import { formatScore, getScoreStyle, calculateOverallScore } from '@/utils/relationshipKpis';

interface ScoreData {
  score: number;
  notes: string;
  isPrivate: boolean;
}

interface ActionItemDraft {
  text: string;
  assignedTo: ActionItemAssignee;
  relatedKpi: RelationshipKPIName | null;
}

interface AIInsightsStepProps {
  scores: Partial<Record<RelationshipKPIName, ScoreData>>;
  actionItems: ActionItemDraft[];
  isSubmitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

export function AIInsightsStep({
  scores,
  actionItems,
  isSubmitting,
  onSubmit,
  onBack,
}: AIInsightsStepProps) {
  const overall = calculateOverallScore(
    Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, v.score])
    ) as Partial<Record<RelationshipKPIName, number>>
  );
  const overallStyle = overall !== null ? getScoreStyle(overall) : null;

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-white">Review & Submit</h2>
        <p className="text-sm text-white/50">
          Here's your weekly snapshot. Ready to submit?
        </p>
      </div>

      {/* Overall score preview */}
      {overall !== null && overallStyle && (
        <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-white/40 mb-1">Estimated Overall Score</p>
          <span className={`text-3xl font-bold ${overallStyle.text}`}>
            {formatScore(overall)}
          </span>
          <span className="text-white/30 text-lg">/10</span>
          <p className={`text-sm mt-1 ${overallStyle.text}`}>{overallStyle.label}</p>
        </div>
      )}

      {/* Scores summary */}
      <div className="space-y-1">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Your Scores</p>
        <div className="grid grid-cols-2 gap-1">
          {KPI_DEFINITIONS.map((kpi) => {
            const data = scores[kpi.name];
            if (!data) return null;
            const style = getScoreStyle(data.score);
            return (
              <div
                key={kpi.name}
                className="flex items-center justify-between p-2 rounded bg-white/5 text-xs"
              >
                <span className="text-white/60 truncate mr-2">{kpi.label}</span>
                <span className={`font-semibold ${style.text}`}>{data.score}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action items summary */}
      {actionItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/40 uppercase tracking-wider">Action Items</p>
          {actionItems.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded bg-white/5 text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-white/70">{item.text}</span>
                <span className="text-white/30 ml-1">({item.assignedTo})</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Insights placeholder */}
      <div className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-rose-400" />
          <p className="text-xs font-medium text-rose-300">AI Insights</p>
        </div>
        <p className="text-xs text-white/40">
          After submitting, AI will analyze your scores and provide personalized
          insights about your relationship patterns.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white/40 hover:text-white/60"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          className="bg-rose-500 hover:bg-rose-600 text-white"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Submit Check-In
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
