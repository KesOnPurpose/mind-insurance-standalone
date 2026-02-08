/**
 * RKPI Page: ConnectionPrompts (Slot Machine Redesign)
 * Apple-minimal single-prompt reveal with spin mechanic.
 * Supports Partner prompts and Kids prompts with age-range filtering.
 */

import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, Check, Heart, RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import type {
  PromptCategory,
  IntimacyLevel,
  KidAgeRange,
  PromptAudience,
} from '@/types/relationship-kpis';
import { useConnectionPromptMachine } from '@/hooks/useConnectionPromptMachine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: { value: PromptCategory; label: string }[] = [
  { value: 'emotional', label: 'Emotional' },
  { value: 'physical', label: 'Physical' },
  { value: 'intellectual', label: 'Intellectual' },
  { value: 'spiritual', label: 'Spiritual' },
  { value: 'fun', label: 'Fun' },
];

const INTIMACY_LEVELS: { value: IntimacyLevel; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'deep', label: 'Deep' },
];

const KID_AGE_RANGES: { value: KidAgeRange; label: string }[] = [
  { value: 'toddler_0_4', label: '0-4' },
  { value: 'child_5_9', label: '5-9' },
  { value: 'tween_10_13', label: '10-13' },
  { value: 'teen_14_18', label: '14-18' },
];

const CATEGORY_COLORS: Record<PromptCategory, string> = {
  emotional: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  physical: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  intellectual: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  spiritual: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  fun: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

const INTIMACY_COLORS: Record<IntimacyLevel, string> = {
  light: 'bg-sky-500/15 text-sky-300',
  medium: 'bg-orange-500/15 text-orange-300',
  deep: 'bg-rose-500/15 text-rose-300',
};

// Placeholder prompts that scroll during spin animation
const SPIN_PLACEHOLDERS = [
  'What makes you feel most alive?',
  'Tell me about a dream you have...',
  'When do you feel closest to me?',
  'What would your perfect day look like?',
  'What are you most grateful for right now?',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ConnectionPrompts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, currentPrompt, filters, setFilters, spin, error } = useConnectionPromptMachine();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!currentPrompt) return;
    try {
      await navigator.clipboard.writeText(currentPrompt.prompt_text);
      setCopied(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleAudienceChange = (audience: PromptAudience) => {
    setFilters({ audience }); // Reset all sub-filters on audience switch
  };

  const handleCategoryToggle = (cat: PromptCategory) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === cat ? undefined : cat,
    }));
  };

  const handleIntimacyToggle = (level: IntimacyLevel) => {
    setFilters((prev) => ({
      ...prev,
      intimacyLevel: prev.intimacyLevel === level ? undefined : level,
    }));
  };

  const handleAgeRangeToggle = (range: KidAgeRange) => {
    setFilters((prev) => ({
      ...prev,
      kidAgeRange: prev.kidAgeRange === range ? undefined : range,
    }));
  };

  const kpiLabel = currentPrompt?.focus_kpi
    ? KPI_DEFINITIONS.find((k) => k.name === currentPrompt.focus_kpi)?.label ?? null
    : null;

  const isSpinning = state === 'spinning';
  const showPrompt = state === 'revealing' || state === 'revealed';

  return (
    <div className="min-h-screen bg-mi-navy flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/40 hover:text-white/60 h-8 w-8 shrink-0"
            onClick={() => navigate('/relationship-kpis')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-white">Connection Prompts</h1>
            <p className="text-xs text-white/40">One question. One moment. Real connection.</p>
          </div>
        </div>
      </div>

      {/* Main content - centered vertically */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md space-y-8">
          {/* Audience Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-full bg-white/5 border border-white/10 p-1">
              <button
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  filters.audience === 'partner'
                    ? 'bg-rose-500/20 text-rose-300 shadow-sm'
                    : 'text-white/40 hover:text-white/60'
                }`}
                onClick={() => handleAudienceChange('partner')}
              >
                Partner
              </button>
              <button
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  filters.audience === 'child'
                    ? 'bg-rose-500/20 text-rose-300 shadow-sm'
                    : 'text-white/40 hover:text-white/60'
                }`}
                onClick={() => handleAudienceChange('child')}
              >
                Kids
              </button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="space-y-3">
            {filters.audience === 'partner' ? (
              <>
                {/* Category pills */}
                <div className="flex justify-center gap-1.5 flex-wrap">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        filters.category === cat.value
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-white/5 border-white/10 text-white/30 hover:text-white/50 hover:border-white/20'
                      }`}
                      onClick={() => handleCategoryToggle(cat.value)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Intimacy level */}
                <div className="flex justify-center gap-1.5">
                  {INTIMACY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        filters.intimacyLevel === level.value
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-white/5 border-white/10 text-white/30 hover:text-white/50 hover:border-white/20'
                      }`}
                      onClick={() => handleIntimacyToggle(level.value)}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* Age range for kids */
              <div className="flex justify-center gap-1.5 flex-wrap">
                {KID_AGE_RANGES.map((range) => (
                  <button
                    key={range.value}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      filters.kidAgeRange === range.value
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-white/5 border-white/10 text-white/30 hover:text-white/50 hover:border-white/20'
                    }`}
                    onClick={() => handleAgeRangeToggle(range.value)}
                  >
                    {range.label} yrs
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Spin Area */}
          <div className="flex flex-col items-center gap-6 min-h-[320px] justify-center">
            <AnimatePresence mode="wait">
              {/* IDLE / SPIN BUTTON */}
              {state === 'idle' && (
                <motion.div
                  key="spin-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center gap-4"
                >
                  <button
                    onClick={spin}
                    className="relative group w-28 h-28 rounded-full bg-gradient-to-br from-rose-500/30 to-purple-600/30 border border-rose-500/30 flex items-center justify-center transition-all hover:from-rose-500/40 hover:to-purple-600/40 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/10"
                  >
                    {/* Pulse ring */}
                    <span className="absolute inset-0 rounded-full animate-ping bg-rose-500/10" />
                    <Sparkles className="h-8 w-8 text-rose-300 group-hover:text-rose-200 transition-colors" />
                  </button>
                  <p className="text-sm text-white/40 font-medium">Reveal a Prompt</p>

                  {error && (
                    <p className="text-xs text-rose-400/80 text-center max-w-xs">{error}</p>
                  )}
                </motion.div>
              )}

              {/* SPINNING */}
              {isSpinning && (
                <motion.div
                  key="spinning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  {/* Slot reel */}
                  <div className="w-full max-w-sm h-48 relative overflow-hidden rounded-xl bg-white/[0.03] border border-white/10">
                    {/* Gradient masks */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0A1628] to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0A1628] to-transparent z-10 pointer-events-none" />

                    {/* Scrolling text */}
                    <div className="animate-slot-scroll">
                      {[...SPIN_PLACEHOLDERS, ...SPIN_PLACEHOLDERS, ...SPIN_PLACEHOLDERS].map(
                        (text, i) => (
                          <div
                            key={i}
                            className="h-16 flex items-center justify-center px-6 text-center"
                          >
                            <p className="text-white/20 text-lg font-light">{text}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-white/30 animate-pulse">Finding your moment...</p>
                </motion.div>
              )}

              {/* REVEALING / REVEALED */}
              {showPrompt && currentPrompt && (
                <motion.div
                  key="prompt-card"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="w-full"
                >
                  {/* Prompt Card */}
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 sm:p-8">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full border ${
                          CATEGORY_COLORS[currentPrompt.prompt_category]
                        }`}
                      >
                        {currentPrompt.prompt_category}
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full ${
                          INTIMACY_COLORS[currentPrompt.intimacy_level]
                        }`}
                      >
                        {currentPrompt.intimacy_level}
                      </span>
                      {kpiLabel && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 text-white/30">
                          {kpiLabel}
                        </span>
                      )}
                    </div>

                    {/* Prompt Text */}
                    <p className="text-xl sm:text-2xl text-white/90 leading-relaxed font-light tracking-tight">
                      {currentPrompt.prompt_text}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button className="flex items-center gap-1.5 text-xs text-white/30 hover:text-rose-400/80 transition-colors">
                        <Heart className="h-3.5 w-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>

                  {/* Try Another button */}
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/40 hover:text-white/70 gap-2"
                      onClick={spin}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Try Another
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Keyframe styles for slot scroll */}
      <style>{`
        @keyframes slot-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-66.666%); }
        }
        .animate-slot-scroll {
          animation: slot-scroll 1.2s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        }
      `}</style>
    </div>
  );
}
