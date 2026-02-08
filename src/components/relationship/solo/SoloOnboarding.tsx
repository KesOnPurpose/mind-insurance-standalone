/**
 * Phase 1B: SoloOnboarding Component
 * 3-step wizard for solo users: select resistance type → set goals → confirm.
 * Stores draft in localStorage for persistence.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, Check, User, Shield, Target } from 'lucide-react';
import {
  RESISTANCE_TYPES,
  type PartnerResistanceType,
} from '@/types/relationship-user-profile';
import { useRelationshipSolo } from '@/contexts/RelationshipSoloContext';

interface SoloOnboardingProps {
  onComplete?: () => void;
  className?: string;
}

const STEPS = [
  { icon: Shield, title: "Partner's Situation", description: 'Why are you doing this alone?' },
  { icon: Target, title: 'Your Goals', description: 'What do you want to achieve?' },
  { icon: Check, title: 'Confirm', description: "Let's get started" },
];

const SOLO_GOALS = [
  'Improve communication skills',
  'Build emotional awareness',
  'Reduce conflict triggers',
  'Strengthen trust',
  'Become a better listener',
  'Model healthy relationship habits',
  'Create a more positive home',
  'Develop patience',
];

const STORAGE_KEY = 'rie_solo_onboarding_draft';

function loadDraft(): { resistanceType?: PartnerResistanceType; goals?: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDraft(data: { resistanceType?: PartnerResistanceType; goals?: string[] }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function SoloOnboarding({ onComplete, className = '' }: SoloOnboardingProps) {
  const { enableSoloMode, completeOnboarding } = useRelationshipSolo();
  const draft = loadDraft();

  const [step, setStep] = useState(0);
  const [resistanceType, setResistanceType] = useState<PartnerResistanceType | null>(
    draft.resistanceType ?? null
  );
  const [selectedGoals, setSelectedGoals] = useState<string[]>(draft.goals ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectResistance = useCallback(
    (type: PartnerResistanceType) => {
      setResistanceType(type);
      saveDraft({ resistanceType: type, goals: selectedGoals });
    },
    [selectedGoals]
  );

  const handleToggleGoal = useCallback(
    (goal: string) => {
      setSelectedGoals((prev) => {
        const next = prev.includes(goal)
          ? prev.filter((g) => g !== goal)
          : [...prev, goal];
        saveDraft({ resistanceType: resistanceType ?? undefined, goals: next });
        return next;
      });
    },
    [resistanceType]
  );

  const handleSubmit = useCallback(async () => {
    if (!resistanceType) return;
    setIsSubmitting(true);
    try {
      await enableSoloMode(resistanceType);
      await completeOnboarding();
      localStorage.removeItem(STORAGE_KEY);
      onComplete?.();
    } catch (err) {
      console.error('Solo onboarding failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [resistanceType, enableSoloMode, completeOnboarding, onComplete]);

  const canAdvance =
    (step === 0 && resistanceType != null) ||
    (step === 1 && selectedGoals.length > 0) ||
    step === 2;

  return (
    <Card className={`border-rose-500/20 bg-mi-navy-light shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-white flex items-center gap-2">
          <User className="h-5 w-5 text-rose-400" />
          Solo User Setup
        </CardTitle>
        {/* Step indicator */}
        <div className="flex gap-2 mt-3">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div
                className={`h-1.5 rounded-full flex-1 transition-colors ${
                  i <= step ? 'bg-rose-400' : 'bg-white/10'
                }`}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-white/40 mt-2">
          Step {step + 1}: {STEPS[step].description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Step 0: Resistance Type */}
        {step === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-white/60 mb-3">
              Why is your partner not joining? This helps us tailor your experience.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RESISTANCE_TYPES.map((rt) => (
                <button
                  key={rt.type}
                  onClick={() => handleSelectResistance(rt.type)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    resistanceType === rt.type
                      ? 'border-rose-400 bg-rose-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <p className="text-sm font-medium text-white">{rt.label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{rt.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Goals */}
        {step === 1 && (
          <div className="space-y-2">
            <p className="text-sm text-white/60 mb-3">
              Select the areas you want to focus on (pick at least one):
            </p>
            <div className="flex flex-wrap gap-2">
              {SOLO_GOALS.map((goal) => (
                <Badge
                  key={goal}
                  variant="outline"
                  className={`cursor-pointer transition-all ${
                    selectedGoals.includes(goal)
                      ? 'border-rose-400 bg-rose-500/10 text-rose-300'
                      : 'border-white/10 text-white/50 hover:border-white/20'
                  }`}
                  onClick={() => handleToggleGoal(goal)}
                >
                  {selectedGoals.includes(goal) && (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider">
                  Partner Situation
                </p>
                <p className="text-sm text-white mt-0.5">
                  {RESISTANCE_TYPES.find((r) => r.type === resistanceType)?.label ??
                    '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider">
                  Focus Areas
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedGoals.map((g) => (
                    <Badge
                      key={g}
                      variant="outline"
                      className="border-rose-400/30 text-rose-300 text-[10px]"
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              You will start at Stage 1: Self-Awareness. Your weekly check-ins
              will be self-focused, and we will guide you through the "Become
              the Change" framework.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {step < 2 ? (
            <Button
              size="sm"
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Setting up...' : 'Start Solo Journey'}
              <Check className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
