import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  Circle,
  Play,
  Clock,
  DollarSign,
  Users,
  Lightbulb,
  AlertTriangle,
  Star,
  Lock,
  Unlock,
  Quote,
  Link2
} from 'lucide-react';
import { TacticWithProgress, TacticWithPrerequisites } from '@/types/tactic';
import { getCategoryColor } from '@/config/categories';
import { TacticCompletionForm } from './TacticCompletionForm';
import { BusinessProfile } from '@/types/assessment';
import { formatCostRange } from '@/services/tacticFilterService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TacticCardProps {
  tactic: TacticWithProgress | TacticWithPrerequisites;
  onStart: (tacticId: string) => void;
  onComplete: (tacticId: string, notes?: string, profileUpdates?: Partial<BusinessProfile>) => void;
  showEnrichedFields?: boolean; // Toggle for new enriched field display
}

export function TacticCard({ tactic, onStart, onComplete, showEnrichedFields = true }: TacticCardProps) {
  const [notes, setNotes] = useState(tactic.notes || '');
  const [showNotes, setShowNotes] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState(false);

  const StatusIcon = tactic.status === 'completed' ? CheckCircle :
                     tactic.status === 'in_progress' ? Play : Circle;

  const statusColors = {
    completed: 'text-success',
    in_progress: 'text-primary',
    not_started: 'text-muted-foreground',
    skipped: 'text-muted-foreground'
  };

  // Check if tactic has prerequisite information (TacticWithPrerequisites)
  const hasPrerequisiteInfo = 'can_start' in tactic;
  const canStart = hasPrerequisiteInfo ? (tactic as TacticWithPrerequisites).can_start : true;
  const blockingPrereqs = hasPrerequisiteInfo ? (tactic as TacticWithPrerequisites).blocking_prerequisites : [];

  return (
    <Card className={`p-4 hover:shadow-md transition-shadow ${!canStart ? 'opacity-75 border-muted' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1">
          <StatusIcon className={`w-5 h-5 ${statusColors[tactic.status]}`} />
          {!canStart && blockingPrereqs.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Lock className="w-4 h-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Complete first: {blockingPrereqs.join(', ')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base leading-tight">
                {tactic.tactic_name}
              </h3>
              {showEnrichedFields && tactic.is_critical_path && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700 text-xs">
                        <Star className="w-3 h-3 mr-1 fill-amber-400" />
                        Critical
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">This is a critical path tactic - essential for your strategy</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <Badge className={getCategoryColor(tactic.category)}>
              {tactic.category}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
            {tactic.estimated_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {tactic.estimated_time}
              </span>
            )}
            {/* Show enriched cost range if available, fallback to legacy */}
            {showEnrichedFields && (tactic.cost_min_usd !== null || tactic.cost_max_usd !== null) ? (
              <span className="flex items-center gap-1 font-medium text-emerald-600">
                <DollarSign className="w-3 h-3" />
                {formatCostRange(tactic.cost_min_usd ?? null, tactic.cost_max_usd ?? null)}
              </span>
            ) : tactic.capital_required && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {tactic.capital_required} capital
              </span>
            )}
            {tactic.target_populations && tactic.target_populations.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {tactic.target_populations.join(', ')}
              </span>
            )}
            {showEnrichedFields && tactic.ownership_model && tactic.ownership_model.length > 0 && (
              <span className="flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                {tactic.ownership_model.slice(0, 2).join(', ')}
                {tactic.ownership_model.length > 2 && ` +${tactic.ownership_model.length - 2}`}
              </span>
            )}
          </div>

          {/* Official Lynette Quote - NEW ENRICHED FIELD */}
          {showEnrichedFields && tactic.official_lynette_quote && (
            <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <div className="flex items-start gap-2">
                <Quote className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-purple-700 mb-1">Lynette's Official Guidance</p>
                  <p className="text-xs text-purple-900 italic">"{tactic.official_lynette_quote}"</p>
                  {tactic.course_lesson_reference && (
                    <p className="text-xs text-purple-600 mt-1">- {tactic.course_lesson_reference}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {tactic.why_it_matters && (
            <div className="mb-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">Why It Matters</p>
                  <p className="text-xs text-muted-foreground">{tactic.why_it_matters}</p>
                </div>
              </div>
            </div>
          )}
          
          {tactic.lynettes_tip && (
            <div className="mb-3 p-3 bg-secondary/5 rounded-lg border border-secondary/10">
              <div className="flex items-start gap-2">
                <span className="text-lg">💡</span>
                <div>
                  <p className="text-xs font-semibold text-secondary-foreground mb-1">Lynette's Tip</p>
                  <p className="text-xs text-muted-foreground italic">{tactic.lynettes_tip}</p>
                </div>
              </div>
            </div>
          )}
          
          {tactic.common_mistakes && Array.isArray(tactic.common_mistakes) && tactic.common_mistakes.length > 0 && (
            <div className="mb-3 p-3 bg-destructive/5 rounded-lg border border-destructive/10">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-destructive mb-1">Common Mistakes</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {tactic.common_mistakes.slice(0, 3).map((mistake: string, i: number) => (
                      <li key={i}>• {mistake}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 mt-3">
            {tactic.status === 'not_started' && (
              <>
                {canStart ? (
                  <Button
                    size="sm"
                    onClick={() => onStart(tactic.tactic_id)}
                    className="flex items-center gap-1"
                  >
                    <Unlock className="w-3 h-3" />
                    Start
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="flex items-center gap-1 opacity-50"
                        >
                          <Lock className="w-3 h-3" />
                          Locked
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">
                          Complete these prerequisites first: {blockingPrereqs.join(', ')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            )}
            
            {tactic.status === 'in_progress' && (
              <>
                <Button
                  size="sm"
                  onClick={() => setShowCompletionForm(true)}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNotes(!showNotes)}
                >
                  {showNotes ? 'Hide' : 'Add'} Notes
                </Button>
              </>
            )}

            {tactic.status === 'completed' && tactic.completedAt && (
              <span className="text-xs text-muted-foreground">
                Completed {new Date(tactic.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {showNotes && tactic.status === 'in_progress' && (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this tactic..."
              className="mt-3"
              rows={3}
            />
          )}
        </div>
      </div>

      <TacticCompletionForm
        isOpen={showCompletionForm}
        onClose={() => setShowCompletionForm(false)}
        tacticName={tactic.tactic_name}
        tacticCategory={tactic.category}
        onComplete={(profileUpdates, formNotes) => {
          onComplete(tactic.tactic_id, formNotes || notes, profileUpdates);
          setShowCompletionForm(false);
        }}
      />
    </Card>
  );
}
