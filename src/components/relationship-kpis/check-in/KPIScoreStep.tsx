/**
 * RKPI Check-In: KPIScoreStep
 * One KPI per step — slider (1-10), optional notes, privacy toggle.
 */

import { useState, useEffect } from 'react';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { KPISlider } from './KPISlider';
import type { KPIDefinition } from '@/types/relationship-kpis';

interface KPIScoreData {
  score: number;
  notes: string;
  isPrivate: boolean;
}

interface KPIScoreStepProps {
  kpi: KPIDefinition;
  stepIndex: number;
  totalKPIs: number;
  initialData?: KPIScoreData;
  onSave: (data: KPIScoreData) => void;
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
}

export function KPIScoreStep({
  kpi,
  stepIndex,
  totalKPIs,
  initialData,
  onSave,
  onBack,
  onNext,
  isLast,
}: KPIScoreStepProps) {
  const [score, setScore] = useState(initialData?.score ?? 5);
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate ?? false);
  const [showNotes, setShowNotes] = useState(!!initialData?.notes);

  // Reset state when KPI changes
  useEffect(() => {
    setScore(initialData?.score ?? 5);
    setNotes(initialData?.notes ?? '');
    setIsPrivate(initialData?.isPrivate ?? false);
    setShowNotes(!!initialData?.notes);
  }, [kpi.name, initialData]);

  const handleNext = () => {
    onSave({ score, notes, isPrivate });
    onNext();
  };

  const handleBack = () => {
    onSave({ score, notes, isPrivate });
    onBack();
  };

  const categoryColor = {
    emotional: 'text-purple-400',
    physical: 'text-blue-400',
    practical: 'text-amber-400',
    intellectual: 'text-emerald-400',
  }[kpi.category];

  return (
    <div className="space-y-6 py-4">
      {/* KPI Header */}
      <div className="text-center space-y-2">
        <p className={`text-xs uppercase tracking-wider ${categoryColor}`}>
          {kpi.category} &middot; {stepIndex + 1} of {totalKPIs}
        </p>
        <h2 className="text-lg font-semibold text-white">{kpi.label}</h2>
        <p className="text-sm text-white/50">{kpi.description}</p>
      </div>

      {/* Slider */}
      <KPISlider value={score} onChange={setScore} />

      {/* Notes toggle & area */}
      <div className="space-y-2">
        {!showNotes ? (
          <button
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
            onClick={() => setShowNotes(true)}
          >
            + Add notes (optional)
          </button>
        ) : (
          <Textarea
            placeholder="Any thoughts on this area..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm min-h-[80px] resize-none"
            maxLength={500}
          />
        )}
      </div>

      {/* Privacy toggle */}
      <button
        className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors"
        onClick={() => setIsPrivate(!isPrivate)}
      >
        {isPrivate ? (
          <>
            <EyeOff className="h-3.5 w-3.5" />
            <span>Private — partner won't see this score</span>
          </>
        ) : (
          <>
            <Eye className="h-3.5 w-3.5" />
            <span>Visible to partner (click to make private)</span>
          </>
        )}
      </button>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white/40 hover:text-white/60"
          onClick={handleBack}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          size="sm"
          className="bg-rose-500 hover:bg-rose-600 text-white"
          onClick={handleNext}
        >
          {isLast ? 'Action Items' : 'Next'}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
