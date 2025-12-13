/**
 * AssessmentIntroScreens Component (v3 - Pre-Assessment Intro Flow)
 *
 * 5-screen intro flow designed for Mind Insurance $100M product:
 *
 * SCREEN FLOW:
 * 1. THE HOOK - Existential recognition ("You know EXACTLY what to do...")
 * 2. CATEGORY SELECTION - What brought you here (1-3 categories)
 * 3. IDENTITY COLLISION EXPLAINED - Educational content
 * 4. PATTERN CARDS - Interactive multi-select patterns
 * 5. POLICY PREVIEW - Insurance-themed preview of results
 *
 * BEHAVIORAL HOOKS:
 * - Curiosity Gap: Brain hates unfinished business (Zeigarnik Effect)
 * - Loss Aversion: Losses feel 2x as painful as equivalent gains
 * - Identity-Based Triggers: Pattern recognition creates instant credibility
 * - Dopamine Anticipation: Reward anticipation > actual reward
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  ChevronRight,
  CheckCircle,
  Briefcase,
  Heart,
  Activity,
  DollarSign,
  Compass,
  Link2,
  Zap,
  Battery,
  FileText,
  Target,
  Clock,
  Shield,
  Search,
  Mic,
  Eye,
  Trophy,
  Rocket,
} from 'lucide-react';

// ============================================================================
// LOCALSTORAGE KEYS - Export for parent component access
// ============================================================================

export const INTRO_CATEGORIES_KEY = 'identity_collision_intro_categories';
export const INTRO_PATTERNS_KEY = 'identity_collision_intro_patterns';

// ============================================================================
// INTERFACES
// ============================================================================

interface AssessmentIntroScreensProps {
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
}

interface Category {
  id: string;
  label: string;
  hook: string;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
}

interface Pattern {
  id: string;
  emoji: string;
  name: string;
  description: string;
  gradient: string;
  borderColor: string;
  textColor: string;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const screenVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

const policyItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

// ============================================================================
// DATA DEFINITIONS
// ============================================================================

const CATEGORIES: Category[] = [
  {
    id: 'career',
    label: 'CAREER',
    hook: 'I know I\'m capable of more',
    icon: Briefcase,
    gradient: 'from-blue-500/40 to-cyan-500/20',
    borderColor: 'border-blue-500/60',
  },
  {
    id: 'relationships',
    label: 'RELATIONSHIPS',
    hook: 'I keep repeating the same patterns',
    icon: Heart,
    gradient: 'from-pink-500/40 to-rose-500/20',
    borderColor: 'border-pink-500/60',
  },
  {
    id: 'health',
    label: 'HEALTH',
    hook: 'I start strong but can\'t maintain',
    icon: Activity,
    gradient: 'from-green-500/40 to-emerald-500/20',
    borderColor: 'border-green-500/60',
  },
  {
    id: 'wealth',
    label: 'WEALTH',
    hook: 'I earn it but can\'t keep it',
    icon: DollarSign,
    gradient: 'from-yellow-500/40 to-amber-500/20',
    borderColor: 'border-yellow-500/60',
  },
  {
    id: 'purpose',
    label: 'PURPOSE',
    hook: 'I feel like I\'m meant for more--but I don\'t know what',
    icon: Compass,
    gradient: 'from-purple-500/40 to-violet-500/20',
    borderColor: 'border-purple-500/60',
  },
];

const PATTERNS: Pattern[] = [
  {
    id: 'past_prison',
    emoji: '',
    name: 'PAST PRISON',
    description: 'Your history defines your limits',
    gradient: 'from-orange-500/40 to-red-600/20',
    borderColor: 'border-orange-500/60',
    textColor: 'text-orange-400',
  },
  {
    id: 'success_sabotage',
    emoji: '',
    name: 'SUCCESS SABOTAGE',
    description: 'You pull back right before breakthrough',
    gradient: 'from-yellow-500/40 to-amber-600/20',
    borderColor: 'border-yellow-500/60',
    textColor: 'text-yellow-400',
  },
  {
    id: 'compass_crisis',
    emoji: '',
    name: 'COMPASS CRISIS',
    description: 'You\'re moving fast but in circles',
    gradient: 'from-cyan-500/40 to-blue-600/20',
    borderColor: 'border-cyan-500/60',
    textColor: 'text-cyan-400',
  },
  {
    id: 'energy_dysregulation',
    emoji: '',
    name: 'ENERGY DYSREGULATION',
    description: 'Exhausted despite doing everything right',
    gradient: 'from-violet-500/40 to-purple-600/20',
    borderColor: 'border-violet-500/60',
    textColor: 'text-violet-400',
  },
];

// PROTECT Method practices for Screen 6
interface PROTECTPractice {
  letter: string;
  name: string;
  time: 'Morning' | 'Midday' | 'Evening';
  description: string;
  icon: React.ElementType;
}

const PROTECT_PRACTICES: PROTECTPractice[] = [
  { letter: 'P', name: 'Pattern Check', time: 'Morning', description: 'Catch your collision BEFORE it runs', icon: Search },
  { letter: 'R', name: 'Reinforce Identity', time: 'Morning', description: "Declare who you're becoming", icon: Mic },
  { letter: 'O', name: 'Outcome Visualization', time: 'Morning', description: 'See your future self winning', icon: Eye },
  { letter: 'T', name: 'Trigger Reset', time: 'Midday', description: 'Reprogram automatic responses', icon: Zap },
  { letter: 'E', name: 'Energy Audit', time: 'Midday', description: 'Check your fuel levels', icon: Battery },
  { letter: 'C', name: 'Celebrate Wins', time: 'Evening', description: 'Train your brain to register success', icon: Trophy },
  { letter: 'T', name: 'Tomorrow Setup', time: 'Evening', description: 'Prepare for championship performance', icon: Rocket },
];

// ============================================================================
// SCREEN 1: MIND INSURANCE INTRO (NEW)
// ============================================================================

function ScreenMIOIntro({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center">
      {/* Animated Shield Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="w-24 h-24 mb-6 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-mi-cyan to-mi-gold rounded-2xl blur-xl opacity-40 animate-pulse" />
        <div className="relative bg-mi-navy-light rounded-2xl p-5 border border-mi-cyan/40 shadow-lg shadow-mi-cyan/20">
          <Shield className="w-14 h-14 text-mi-cyan" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-2xl sm:text-3xl font-bold text-white mb-2"
      >
        Welcome to <span className="text-mi-cyan">Mind Insurance</span>
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="text-lg text-mi-gold font-medium mb-5"
      >
        AI-Powered Pattern Interruption Coach
      </motion.p>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="text-base text-gray-300 max-w-sm mb-5"
      >
        Built for entrepreneurs and high-achievers who keep getting in their own way.
      </motion.p>

      {/* Differentiator Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="mb-8"
      >
        <Card className="bg-white/5 border-white/20 p-4 max-w-sm">
          <p className="text-sm text-gray-300 leading-relaxed">
            Unlike apps that track habits{' '}
            <span className="text-red-400 font-semibold">AFTER</span> they fail,
            Mind Insurance catches your self-sabotage{' '}
            <span className="text-mi-cyan font-semibold">BEFORE</span> it costs you.
          </p>
        </Card>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.4 }}
      >
        <Button
          onClick={onNext}
          className="h-12 px-6 text-base font-semibold rounded-xl bg-gradient-to-r from-mi-gold to-mi-gold/80 hover:from-mi-gold/90 hover:to-mi-gold/70 text-black"
        >
          What's holding me back?
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}

// ============================================================================
// SCREEN 2: THE HOOK
// ============================================================================

function ScreenHook({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center">
      {/* Main Hook Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-relaxed mb-6">
          You know <span className="text-mi-gold">EXACTLY</span> what to do.
        </h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-2 text-base sm:text-lg text-gray-300 max-w-sm mx-auto"
        >
          <p>The courses. The coaches. The podcasts.</p>
          <p>You've done the work.</p>
        </motion.div>
      </motion.div>

      {/* Secondary Hook */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mb-8"
      >
        <p className="text-xl sm:text-2xl font-semibold text-white mb-4">
          So why are you still <span className="text-mi-cyan">HERE</span>?
        </p>
        <div className="space-y-1 text-base text-gray-400">
          <p>Reading another thing.</p>
          <p>Looking for another answer.</p>
        </div>
      </motion.div>

      {/* Key Insight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.0, duration: 0.4 }}
        className="bg-white/5 rounded-xl px-5 py-3 mb-8 border border-white/10 max-w-sm"
      >
        <p className="text-base text-gray-300 leading-relaxed">
          What if the problem was never{' '}
          <span className="text-mi-gold font-semibold">information</span>?
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.4 }}
      >
        <Button
          onClick={onNext}
          className="h-12 px-6 text-base font-semibold rounded-xl bg-gradient-to-r from-mi-gold to-mi-gold/80 hover:from-mi-gold/90 hover:to-mi-gold/70 text-black"
        >
          It wasn't.
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}

// ============================================================================
// SCREEN 2: CATEGORY SELECTION
// ============================================================================

function ScreenCategories({ onNext }: { onNext: () => void }) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(INTRO_CATEGORIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(INTRO_CATEGORIES_KEY, JSON.stringify(selectedCategories));
    } catch (e) {
      console.warn('Could not save categories to localStorage:', e);
    }
  }, [selectedCategories]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      // Max 3 selections
      if (prev.length >= 3) {
        return [...prev.slice(1), categoryId];
      }
      return [...prev, categoryId];
    });
  };

  const canProceed = selectedCategories.length >= 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center">
      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-xl sm:text-2xl font-bold text-white mb-2"
      >
        What brought you here?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-sm text-gray-500 mb-6"
      >
        Tap 1-3 categories that resonate
      </motion.p>

      {/* Category Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md space-y-2.5 mb-6"
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          const Icon = category.icon;

          return (
            <motion.div
              key={category.id}
              variants={fadeUpItem}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleCategory(category.id)}
              className="cursor-pointer"
            >
              <Card
                className={`
                  bg-gradient-to-r ${category.gradient} ${category.borderColor}
                  border backdrop-blur-xl p-3.5 rounded-xl
                  flex items-center gap-3 transition-all duration-150
                  ${isSelected
                    ? 'ring-2 ring-mi-gold scale-[1.02] border-mi-gold/50'
                    : 'hover:scale-[1.01] hover:border-white/30'}
                `}
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-white tracking-wide">
                    {category.label}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    "{category.hook}"
                  </p>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0"
                  >
                    <CheckCircle className="w-5 h-5 text-mi-gold" />
                  </motion.div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Selection Count */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs text-gray-600 mb-5"
      >
        {selectedCategories.length}/3 selected
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="h-12 px-6 text-base font-semibold rounded-xl bg-gradient-to-r from-mi-gold to-mi-gold/80 hover:from-mi-gold/90 hover:to-mi-gold/70 text-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}

// ============================================================================
// SCREEN 3: IDENTITY COLLISION EXPLAINED
// ============================================================================

function ScreenExplained({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center">
      {/* Title Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6"
      >
        <span className="px-4 py-1.5 rounded-full bg-mi-cyan/20 text-mi-cyan text-sm font-semibold tracking-wide">
          IDENTITY COLLISION
        </span>
      </motion.div>

      {/* Main Content Card */}
      <Card className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 border-white/20 border backdrop-blur-xl p-5 sm:p-6 rounded-2xl max-w-md mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-4"
        >
          <p className="text-lg text-white font-medium leading-relaxed">
            There's a name for this:{' '}
            <span className="text-mi-cyan font-bold">Identity Collision</span>.
          </p>

          <p className="text-base text-gray-300 leading-relaxed">
            It's what happens when your past programming, fears, and unconscious beliefs{' '}
            <span className="text-mi-gold font-semibold">COLLIDE</span> with your future goals.
          </p>

          {/* Analogy */}
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <p className="text-sm text-gray-200 leading-relaxed italic">
              Like driving with the parking brake on.
            </p>
            <p className="text-sm text-gray-300 leading-relaxed mt-2">
              The engine is fine. <span className="text-white font-medium">You're fine.</span>
              <br />
              But something invisible is holding you back.
            </p>
          </div>
        </motion.div>
      </Card>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <Button
          onClick={onNext}
          className="h-12 px-6 text-base font-semibold rounded-xl bg-gradient-to-r from-mi-gold to-mi-gold/80 hover:from-mi-gold/90 hover:to-mi-gold/70 text-black"
        >
          What does MY collision look like?
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}

// ============================================================================
// SCREEN 4: PATTERN CARDS (INTERACTIVE)
// ============================================================================

function ScreenPatterns({ onNext }: { onNext: () => void }) {
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(INTRO_PATTERNS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(INTRO_PATTERNS_KEY, JSON.stringify(selectedPatterns));
    } catch (e) {
      console.warn('Could not save patterns to localStorage:', e);
    }
  }, [selectedPatterns]);

  const togglePattern = (patternId: string) => {
    setSelectedPatterns((prev) => {
      if (prev.includes(patternId)) {
        return prev.filter((id) => id !== patternId);
      }
      return [...prev, patternId];
    });
  };

  const getPatternIcon = (patternId: string) => {
    switch (patternId) {
      case 'past_prison':
        return Link2;
      case 'success_sabotage':
        return Zap;
      case 'compass_crisis':
        return Compass;
      case 'energy_dysregulation':
        return Battery;
      default:
        return Link2;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center">
      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-xl sm:text-2xl font-bold text-white mb-2"
      >
        Which patterns feel familiar?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-sm text-gray-500 mb-6"
      >
        Tap all that apply
      </motion.p>

      {/* Pattern Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md grid grid-cols-2 gap-3 mb-6"
      >
        {PATTERNS.map((pattern) => {
          const isSelected = selectedPatterns.includes(pattern.id);
          const Icon = getPatternIcon(pattern.id);

          return (
            <motion.div
              key={pattern.id}
              variants={fadeUpItem}
              whileTap={{ scale: 0.96 }}
              onClick={() => togglePattern(pattern.id)}
              className="cursor-pointer"
            >
              <Card
                className={`
                  bg-gradient-to-br ${pattern.gradient} ${pattern.borderColor}
                  border backdrop-blur-xl p-4 rounded-xl
                  flex flex-col items-center gap-2 transition-all duration-150
                  min-h-[120px] justify-center
                  ${isSelected
                    ? 'ring-2 ring-mi-gold scale-[1.03] border-mi-gold/50'
                    : 'hover:scale-[1.02] hover:border-white/30'}
                `}
              >
                <div className="relative">
                  <Icon className={`w-7 h-7 ${pattern.textColor}`} />
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1"
                    >
                      <CheckCircle className="w-4 h-4 text-mi-gold fill-mi-gold" />
                    </motion.div>
                  )}
                </div>
                <h3 className={`font-bold text-xs ${pattern.textColor} tracking-wider text-center`}>
                  {pattern.name}
                </h3>
                <p className="text-[10px] text-gray-400 text-center leading-tight">
                  "{pattern.description}"
                </p>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Insight after selection */}
      <AnimatePresence>
        {selectedPatterns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <p className="text-sm text-mi-cyan">
              {selectedPatterns.length === 1
                ? 'That recognition? Your brain already knows.'
                : `${selectedPatterns.length} patterns identified. Let's find the primary one.`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <Button
          onClick={onNext}
          className="h-12 px-6 text-base font-semibold rounded-xl bg-gradient-to-r from-mi-gold to-mi-gold/80 hover:from-mi-gold/90 hover:to-mi-gold/70 text-black"
        >
          {selectedPatterns.length > 0 ? 'See my policy preview' : 'Continue'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}

// ============================================================================
// SCREEN 6: PROTECT METHOD (NEW - THE SOLUTION)
// ============================================================================

function ScreenPROTECTMethod({ onNext }: { onNext: () => void }) {
  const timeColors: Record<string, string> = {
    Morning: 'border-l-mi-cyan bg-mi-cyan/10',
    Midday: 'border-l-mi-gold bg-mi-gold/10',
    Evening: 'border-l-violet-400 bg-violet-400/10',
  };

  return (
    <div className="flex flex-col items-center min-h-[65vh] px-4 text-center py-4">
      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-xl sm:text-2xl font-bold text-white mb-2"
      >
        The Solution: 7 Daily Practices
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-sm text-gray-300 mb-5"
      >
        Your policy includes the{' '}
        <span className="text-mi-gold font-semibold">P.R.O.T.E.C.T. Method™</span>
      </motion.p>

      {/* PROTECT Practices List */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md space-y-2 mb-5"
      >
        {PROTECT_PRACTICES.map((practice, i) => {
          const Icon = practice.icon;
          return (
            <motion.div
              key={i}
              variants={fadeUpItem}
              className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${timeColors[practice.time]}`}
            >
              <span className="text-mi-gold font-bold text-lg w-6 flex-shrink-0">
                {practice.letter}
              </span>
              <Icon className="w-5 h-5 text-gray-300 flex-shrink-0" />
              <div className="text-left flex-1 min-w-0">
                <span className="text-white font-medium text-sm block">
                  {practice.name}
                </span>
                <p className="text-xs text-gray-300 truncate">
                  {practice.description}
                </p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {practice.time}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Summary */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="text-sm text-mi-cyan mb-6"
      >
        <span className="text-white font-medium">10 minutes a day.</span>{' '}
        7 practices. 3 time windows.{' '}
        <span className="text-mi-gold font-semibold">21 days to breakthrough.</span>
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4 }}
      >
        <Button
          onClick={onNext}
          className="h-12 px-6 text-base font-semibold rounded-xl bg-gradient-to-r from-mi-gold to-mi-gold/80 hover:from-mi-gold/90 hover:to-mi-gold/70 text-black"
        >
          See my coverage details
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}

// ============================================================================
// SCREEN 7: POLICY PREVIEW (INSURANCE THEME)
// ============================================================================

function ScreenPolicyPreview({ onNext }: { onNext: () => void }) {
  const coverageItems = [
    { icon: FileText, label: 'Primary Pattern Identified', color: 'text-mi-cyan' },
    { icon: Target, label: 'Pattern Intensity (1-100)', color: 'text-mi-gold' },
    { icon: Zap, label: 'Top 3 Trigger Categories', color: 'text-orange-400' },
    { icon: Shield, label: 'Daily Protection Protocol', color: 'text-green-400' },
    { icon: Clock, label: 'Est. Time to Breakthrough: 21 days', color: 'text-violet-400' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center">
      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-xl sm:text-2xl font-bold text-white mb-6"
      >
        Your Mind Insurance Policy Preview
      </motion.h2>

      {/* Policy Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="w-full max-w-md mb-6"
      >
        <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-2 border-mi-cyan/30 backdrop-blur-xl rounded-2xl overflow-hidden">
          {/* Policy Header */}
          <div className="bg-mi-cyan/10 border-b border-mi-cyan/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-mi-cyan font-bold text-sm tracking-wider">
                COVERAGE DETAILS
              </span>
              <Shield className="w-5 h-5 text-mi-cyan" />
            </div>
          </div>

          {/* Coverage Items */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="p-4 space-y-3"
          >
            {coverageItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  variants={policyItemVariants}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                >
                  <Icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                  <span className="text-sm text-gray-300 text-left">{item.label}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </Card>
      </motion.div>

      {/* Promise Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="mb-6 max-w-sm"
      >
        <p className="text-base text-gray-400 leading-relaxed">
          In <span className="text-mi-gold font-semibold">3 minutes</span>, you'll have your
          personalized policy to protect against identity collision.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4 }}
      >
        <Button
          onClick={onNext}
          className="h-14 px-8 text-lg font-semibold rounded-xl bg-gradient-to-r from-mi-gold to-mi-gold/80 hover:from-mi-gold/90 hover:to-mi-gold/70 text-black shadow-lg shadow-mi-gold/20"
        >
          Start Assessment (3 min)
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>

      {/* Time Indicator */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-4 text-xs text-gray-600"
      >
        8 questions - Your answers are private
      </motion.p>
    </div>
  );
}

// ============================================================================
// PROGRESS DOTS COMPONENT
// ============================================================================

function ProgressDots({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex justify-center gap-2 mb-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <motion.div
          key={index}
          className={`h-2 rounded-full transition-all duration-300 ${
            index === currentStep
              ? 'bg-mi-cyan w-6'
              : index < currentStep
                ? 'bg-mi-cyan/50 w-2'
                : 'bg-white/20 w-2'
          }`}
          animate={index === currentStep ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5 }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AssessmentIntroScreens({
  currentStep,
  onNext,
  onSkip,
}: AssessmentIntroScreensProps) {
  const screens = [
    ScreenMIOIntro,        // Screen 1: Mind Insurance Intro (NEW)
    ScreenHook,            // Screen 2: The Hook
    ScreenCategories,      // Screen 3: Category Selection
    ScreenExplained,       // Screen 4: Identity Collision Explained
    ScreenPatterns,        // Screen 5: Pattern Cards
    ScreenPROTECTMethod,   // Screen 6: PROTECT Method (NEW)
    ScreenPolicyPreview,   // Screen 7: Policy Preview
  ];
  const totalSteps = screens.length;
  const CurrentScreen = screens[currentStep];

  return (
    <div className="min-h-screen bg-mi-navy flex flex-col">
      {/* Skip Link - Top Right */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.3 }}
        className="absolute top-4 right-4 z-10"
      >
        <button
          onClick={onSkip}
          className="text-sm text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1"
        >
          Skip
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8">
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={currentStep}
            custom={1}
            variants={screenVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <CurrentScreen onNext={onNext} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div className="pb-8">
        <ProgressDots currentStep={currentStep} totalSteps={totalSteps} />
      </div>
    </div>
  );
}

export default AssessmentIntroScreens;
