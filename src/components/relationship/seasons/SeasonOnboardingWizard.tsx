/**
 * RIE Phase 2B: SeasonOnboardingWizard
 * 3-screen + pre-filter guided onboarding for selecting past and current seasons.
 *
 * Pre-Screen: Life stage questions (derives LifeStage from answers)
 * Screen 1: Past seasons (with healing slider for each)
 * Screen 2: Current seasons (max 3)
 * Screen 3: Review + submit
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useRelationshipSeason } from '@/contexts/RelationshipSeasonContext';
import { addUserSeasonBatch } from '@/services/relationshipSeasonService';
import type {
  LifeStage,
  RelationshipSeasonCatalog,
  UserSeasonInsert,
} from '@/types/relationship-seasons';
import { SeasonCategoryAccordion } from './SeasonCategoryAccordion';
import { SeasonImpactPreview, aggregateKPIImpacts } from './SeasonImpactPreview';
import { SeasonSummaryTimeline } from './SeasonSummaryTimeline';
import { MIOContextPreview } from './MIOContextPreview';

// ============================================================================
// Pre-filter: Life Stage Derivation
// ============================================================================

type AgeRange = 'under_30' | '30-39' | '40-55' | '55-59' | '60+';
type DurationRange = '0-3' | '4-10' | '11-20' | '20+';
type KidAges = 'under_12' | 'teens' | 'adult' | 'mixed';

function deriveLifeStage(
  age: AgeRange,
  duration: DurationRange,
  hasKids: boolean,
  kidAges: KidAges
): LifeStage {
  if (age === 'under_30' && duration === '0-3') return 'early_marriage';
  if (hasKids && kidAges === 'under_12') return 'young_family';
  if (hasKids && kidAges === 'teens') return 'established_family';
  if (hasKids && kidAges === 'adult' && age !== '60+') return 'midlife';
  if (age === '60+') return 'retirement';
  if (age === '55-59') return 'empty_nest';
  if (age === '40-55' && !hasKids) return 'midlife';
  if (duration === '0-3') return 'early_marriage';
  return 'any';
}

// ============================================================================
// Draft Persistence
// ============================================================================

interface WizardDraft {
  step: number;
  age: AgeRange | '';
  duration: DurationRange | '';
  hasKids: boolean;
  kidAges: KidAges | '';
  lifeStage: LifeStage | null;
  pastSeasonIds: string[];
  healingMap: Record<string, number>;
  currentSeasonIds: string[];
}

function getDraftKey(userId: string): string {
  return `rie-season-onboarding-draft-${userId}`;
}

function loadDraft(userId: string): WizardDraft | null {
  try {
    const raw = localStorage.getItem(getDraftKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as WizardDraft;
  } catch {
    return null;
  }
}

function saveDraft(userId: string, draft: WizardDraft): void {
  try {
    localStorage.setItem(getDraftKey(userId), JSON.stringify(draft));
  } catch {
    // localStorage full or unavailable
  }
}

function clearDraft(userId: string): void {
  try {
    localStorage.removeItem(getDraftKey(userId));
  } catch {
    // ignore
  }
}

// ============================================================================
// Props
// ============================================================================

interface SeasonOnboardingWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}

// ============================================================================
// Wizard Steps
// ============================================================================

const STEPS = ['Life Stage', 'Past Seasons', 'Current Seasons', 'Review'] as const;
const MAX_CURRENT_SEASONS = 3;

// ============================================================================
// Component
// ============================================================================

export function SeasonOnboardingWizard({ onComplete, onSkip }: SeasonOnboardingWizardProps) {
  const { catalog, refresh } = useRelationshipSeason();

  // Pre-filter state
  const [step, setStep] = useState(0);
  const [age, setAge] = useState<AgeRange | ''>('');
  const [duration, setDuration] = useState<DurationRange | ''>('');
  const [hasKids, setHasKids] = useState(false);
  const [kidAges, setKidAges] = useState<KidAges | ''>('');
  const [lifeStage, setLifeStage] = useState<LifeStage | null>(null);

  // Season selection state
  const [pastSeasonIds, setPastSeasonIds] = useState<Set<string>>(new Set());
  const [healingMap, setHealingMap] = useState<Map<string, number>>(new Map());
  const [currentSeasonIds, setCurrentSeasonIds] = useState<Set<string>>(new Set());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get userId for draft persistence
  useEffect(() => {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setUserId(user.id);
      });
    });
  }, []);

  // Load draft on mount
  useEffect(() => {
    if (!userId) return;
    const draft = loadDraft(userId);
    if (draft) {
      setStep(draft.step);
      setAge(draft.age);
      setDuration(draft.duration);
      setHasKids(draft.hasKids);
      setKidAges(draft.kidAges);
      setLifeStage(draft.lifeStage);
      setPastSeasonIds(new Set(draft.pastSeasonIds));
      setHealingMap(new Map(Object.entries(draft.healingMap).map(([k, v]) => [k, v])));
      setCurrentSeasonIds(new Set(draft.currentSeasonIds));
    }
  }, [userId]);

  // Auto-save draft every 5 seconds
  useEffect(() => {
    if (!userId) return;

    draftTimerRef.current = setInterval(() => {
      const draft: WizardDraft = {
        step,
        age,
        duration,
        hasKids,
        kidAges,
        lifeStage,
        pastSeasonIds: [...pastSeasonIds],
        healingMap: Object.fromEntries(healingMap),
        currentSeasonIds: [...currentSeasonIds],
      };
      saveDraft(userId, draft);
    }, 5000);

    return () => {
      if (draftTimerRef.current) clearInterval(draftTimerRef.current);
    };
  }, [userId, step, age, duration, hasKids, kidAges, lifeStage, pastSeasonIds, healingMap, currentSeasonIds]);

  // Filtered catalog based on life stage
  const filteredCatalog = useMemo(() => {
    if (!lifeStage) return catalog;
    const filtered = catalog.filter(
      (s) => s.life_stage === lifeStage || s.life_stage === 'any'
    );
    if (filtered.length > 25) {
      console.warn(`[RIE] Pre-filter returned ${filtered.length} seasons (expected 15-25)`);
    }
    return filtered;
  }, [catalog, lifeStage]);

  // Seasons available for "current" step (exclude already-selected past seasons)
  const currentStepCatalog = useMemo(
    () => filteredCatalog.filter((s) => !pastSeasonIds.has(s.id)),
    [filteredCatalog, pastSeasonIds]
  );

  // Lookup maps
  const catalogById = useMemo(() => {
    const map = new Map<string, RelationshipSeasonCatalog>();
    for (const s of catalog) map.set(s.id, s);
    return map;
  }, [catalog]);

  // Past season objects with healing
  const pastSeasonsWithHealing = useMemo(
    () =>
      [...pastSeasonIds]
        .map((id) => {
          const season = catalogById.get(id);
          if (!season) return null;
          return { season, healingProgress: healingMap.get(id) ?? 50 };
        })
        .filter(Boolean) as Array<{ season: RelationshipSeasonCatalog; healingProgress: number }>,
    [pastSeasonIds, catalogById, healingMap]
  );

  // Current season objects
  const currentSeasonObjects = useMemo(
    () =>
      [...currentSeasonIds]
        .map((id) => catalogById.get(id))
        .filter(Boolean) as RelationshipSeasonCatalog[],
    [currentSeasonIds, catalogById]
  );

  // All selected seasons for impact preview
  const allSelectedSeasons = useMemo(
    () => [...pastSeasonsWithHealing.map((p) => p.season), ...currentSeasonObjects],
    [pastSeasonsWithHealing, currentSeasonObjects]
  );

  const aggregatedImpacts = useMemo(
    () => aggregateKPIImpacts(allSelectedSeasons),
    [allSelectedSeasons]
  );

  // ---- Handlers ----

  const handlePreFilterNext = useCallback(() => {
    if (age && duration) {
      const derived = deriveLifeStage(
        age,
        duration,
        hasKids,
        (hasKids ? kidAges : '') as KidAges
      );
      setLifeStage(derived);
      setStep(1);
    }
  }, [age, duration, hasKids, kidAges]);

  const togglePastSeason = useCallback((seasonId: string) => {
    setPastSeasonIds((prev) => {
      const next = new Set(prev);
      if (next.has(seasonId)) {
        next.delete(seasonId);
      } else {
        next.add(seasonId);
      }
      return next;
    });
  }, []);

  const updateHealing = useCallback((seasonId: string, progress: number) => {
    setHealingMap((prev) => {
      const next = new Map(prev);
      next.set(seasonId, progress);
      return next;
    });
  }, []);

  const toggleCurrentSeason = useCallback((seasonId: string) => {
    setCurrentSeasonIds((prev) => {
      const next = new Set(prev);
      if (next.has(seasonId)) {
        next.delete(seasonId);
      } else if (next.size < MAX_CURRENT_SEASONS) {
        next.add(seasonId);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const inserts: UserSeasonInsert[] = [];

      // Past seasons
      for (const id of pastSeasonIds) {
        const healing = healingMap.get(id) ?? 50;
        inserts.push({
          season_id: id,
          status: healing >= 50 ? 'past_healed' : 'past_unhealed',
          healing_progress: healing,
          started_at: new Date().toISOString(),
        });
      }

      // Current seasons
      for (const id of currentSeasonIds) {
        inserts.push({
          season_id: id,
          status: 'current',
          healing_progress: 50,
          started_at: new Date().toISOString(),
        });
      }

      if (inserts.length > 0) {
        await addUserSeasonBatch(inserts);
      }

      if (userId) clearDraft(userId);
      await refresh();
      onComplete();
    } catch (err) {
      console.error('Failed to save season onboarding:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [pastSeasonIds, currentSeasonIds, healingMap, userId, refresh, onComplete]);

  // ---- Progress ----
  const progressPercent = ((step + 1) / STEPS.length) * 100;

  // ---- Render ----
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header + Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rose-400" />
            <h2 className="text-lg font-semibold text-white">Season Setup</h2>
          </div>
          {onSkip && step === 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-white/60"
              onClick={onSkip}
            >
              Skip for now
            </Button>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/40">
            <span>Step {step + 1} of {STEPS.length}: {STEPS[step]}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      </div>

      {/* Step 0: Pre-Filter */}
      {step === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/80">
              Tell us about your relationship
            </CardTitle>
            <p className="text-xs text-white/40">
              This helps us show only the seasons relevant to your life stage.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Age Range */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/60 font-medium">Your age range</label>
              <div className="flex flex-wrap gap-2">
                {([
                  ['under_30', 'Under 30'],
                  ['30-39', '30-39'],
                  ['40-55', '40-55'],
                  ['55-59', '55-59'],
                  ['60+', '60+'],
                ] as [AgeRange, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAge(val)}
                    className={`px-3 py-2 min-h-[44px] rounded-lg text-sm transition-colors ${
                      age === val
                        ? 'bg-rose-500/20 border border-rose-400 text-rose-300'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Relationship Duration */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/60 font-medium">Relationship duration</label>
              <div className="flex flex-wrap gap-2">
                {([
                  ['0-3', '0-3 years'],
                  ['4-10', '4-10 years'],
                  ['11-20', '11-20 years'],
                  ['20+', '20+ years'],
                ] as [DurationRange, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDuration(val)}
                    className={`px-3 py-2 min-h-[44px] rounded-lg text-sm transition-colors ${
                      duration === val
                        ? 'bg-rose-500/20 border border-rose-400 text-rose-300'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Children */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/60 font-medium">Do you have children?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHasKids(true)}
                  className={`px-4 py-2 min-h-[44px] rounded-lg text-sm transition-colors ${
                    hasKids
                      ? 'bg-rose-500/20 border border-rose-400 text-rose-300'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => { setHasKids(false); setKidAges(''); }}
                  className={`px-4 py-2 min-h-[44px] rounded-lg text-sm transition-colors ${
                    !hasKids
                      ? 'bg-rose-500/20 border border-rose-400 text-rose-300'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Kid Ages (if has kids) */}
            {hasKids && (
              <div className="space-y-1.5">
                <label className="text-xs text-white/60 font-medium">Children's ages</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    ['under_12', 'Under 12'],
                    ['teens', 'Teenagers'],
                    ['adult', 'Adult (18+)'],
                    ['mixed', 'Mixed ages'],
                  ] as [KidAges, string][]).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setKidAges(val)}
                      className={`px-3 py-2 min-h-[44px] rounded-lg text-sm transition-colors ${
                        kidAges === val
                          ? 'bg-rose-500/20 border border-rose-400 text-rose-300'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handlePreFilterNext}
              disabled={!age || !duration || (hasKids && !kidAges)}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Past Seasons */}
      {step === 1 && (
        <div className="space-y-3">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/80">
                Which seasons have you been through?
              </CardTitle>
              <p className="text-xs text-white/40">
                Select past seasons and rate how healed you feel from each.
                {filteredCatalog.length > 0 && (
                  <span className="ml-1">({filteredCatalog.length} seasons shown for your life stage)</span>
                )}
              </p>
            </CardHeader>
            <CardContent>
              <SeasonCategoryAccordion
                seasons={filteredCatalog}
                selectedSeasonIds={pastSeasonIds}
                onToggleSeason={togglePastSeason}
                healingProgressMap={healingMap}
                onHealingProgressChange={updateHealing}
                showHealingSlider
              />
            </CardContent>
          </Card>

          {pastSeasonIds.size > 0 && (
            <SeasonImpactPreview
              selectedSeasons={pastSeasonsWithHealing.map((p) => p.season)}
            />
          )}

          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="text-white/40 hover:text-white/60"
              onClick={() => setStep(0)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={() => setStep(2)}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
            >
              Next: Current Seasons
              <ArrowRight className="h-4 w-4 ml-1" />
              {pastSeasonIds.size > 0 && (
                <span className="ml-2 text-xs opacity-70">
                  ({pastSeasonIds.size} past selected)
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Current Seasons */}
      {step === 2 && (
        <div className="space-y-3">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/80">
                What are you going through right now?
              </CardTitle>
              <p className="text-xs text-white/40">
                Select up to {MAX_CURRENT_SEASONS} current seasons.
                {currentSeasonIds.size >= MAX_CURRENT_SEASONS && (
                  <span className="text-amber-400 ml-1">(Maximum reached)</span>
                )}
              </p>
            </CardHeader>
            <CardContent>
              <SeasonCategoryAccordion
                seasons={currentStepCatalog}
                selectedSeasonIds={currentSeasonIds}
                onToggleSeason={toggleCurrentSeason}
              />
            </CardContent>
          </Card>

          {(pastSeasonIds.size > 0 || currentSeasonIds.size > 0) && (
            <SeasonImpactPreview selectedSeasons={allSelectedSeasons} />
          )}

          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="text-white/40 hover:text-white/60"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
            >
              Review
              <ArrowRight className="h-4 w-4 ml-1" />
              {currentSeasonIds.size > 0 && (
                <span className="ml-2 text-xs opacity-70">
                  ({currentSeasonIds.size} current selected)
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review + Submit */}
      {step === 3 && (
        <div className="space-y-3">
          <SeasonSummaryTimeline
            pastSeasons={pastSeasonsWithHealing}
            currentSeasons={currentSeasonObjects}
          />

          <MIOContextPreview
            pastSeasons={pastSeasonsWithHealing}
            currentSeasons={currentSeasonObjects}
            aggregatedImpacts={aggregatedImpacts}
          />

          <SeasonImpactPreview selectedSeasons={allSelectedSeasons} />

          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="text-white/40 hover:text-white/60"
              onClick={() => setStep(2)}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (pastSeasonIds.size === 0 && currentSeasonIds.size === 0)}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Complete Season Setup
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
