import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  Circle,
  Play,
  DollarSign,
  Users,
  Lightbulb,
  AlertTriangle,
  Star,
  Lock as LockIcon,
  Unlock,
  Quote,
  Link2,
  ListChecks,
  Save
} from 'lucide-react';
import { TacticWithProgress, TacticWithPrerequisites } from '@/types/tactic';
import { getCategoryColor } from '@/config/categories';
import { TacticCompletionForm } from './TacticCompletionForm';
import { TacticDetailModal } from './TacticDetailModal';
// TacticResourcePanel kept for potential future use
// import { TacticResourcePanel } from './TacticResourcePanel';
import { BusinessProfile } from '@/types/assessment';
import { formatCostRange } from '@/services/tacticFilterService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTacticDocuments } from '@/hooks/useTacticDocuments';
import { useTacticKnowledge } from '@/hooks/useTacticKnowledge';

interface TacticCardProps {
  tactic: TacticWithProgress | TacticWithPrerequisites;
  onStart: (tacticId: string) => void;
  onComplete: (tacticId: string, notes?: string, profileUpdates?: Partial<BusinessProfile>) => void;
  onSaveNotes?: (tacticId: string, notes: string) => void;
  showEnrichedFields?: boolean; // Toggle for new enriched field display
  tacticNameMap?: Record<string, string>; // Map of tactic IDs to names for prerequisite display
}

export function TacticCard({ tactic, onStart, onComplete, onSaveNotes, showEnrichedFields = true, tacticNameMap = {} }: TacticCardProps) {
  const [notes, setNotes] = useState(tactic.notes || '');
  const [showNotes, setShowNotes] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Fetch resource data (hooks kept for potential future use)
  const { documents: _documents } = useTacticDocuments(tactic.tactic_id);
  const { knowledge: _knowledge } = useTacticKnowledge(tactic.tactic_id);
  // const totalResources = _documents.length + _knowledge.length;

  // Track if notes have changed from original
  const notesChanged = notes !== (tactic.notes || '');

  const handleSaveNotes = async () => {
    if (!onSaveNotes || !notesChanged) return;
    setIsSavingNotes(true);
    try {
      await onSaveNotes(tactic.tactic_id, notes);
    } finally {
      setIsSavingNotes(false);
    }
  };

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
    <>
    <Card
      onClick={() => setShowDetailModal(true)}
      className={`cursor-pointer hover:shadow-lg transition-shadow ${!canStart ? 'opacity-75 border-muted' : ''}`}
    >
        {/* Card header */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1">
              <StatusIcon className={`w-5 h-5 ${statusColors[tactic.status]}`} />
              {!canStart && blockingPrereqs.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <LockIcon className="w-4 h-4 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Complete first: {blockingPrereqs.map(id => tacticNameMap[id] || id).join(', ')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
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
            <Badge className={`${getCategoryColor(tactic.category)} whitespace-nowrap flex-shrink-0`}>
              {tactic.category}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
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
            </div>
          </div>
        </div>
    </Card>

    <TacticCompletionForm
      isOpen={showCompletionForm}
      onClose={() => setShowCompletionForm(false)}
      tacticName={tactic.tactic_name}
      tacticCategory={tactic.category}
      tacticSteps={tactic.step_by_step}
      onComplete={(profileUpdates, formNotes) => {
        onComplete(tactic.tactic_id, formNotes || notes, profileUpdates);
        setShowCompletionForm(false);
      }}
    />

    <TacticDetailModal
      tactic={tactic}
      isOpen={showDetailModal}
      onClose={() => setShowDetailModal(false)}
      onStartTactic={onStart}
      onCompleteTactic={(tacticId) => onComplete(tacticId)}
    />
    </>
  );
}
