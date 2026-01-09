/**
 * Sub-Pattern Assessment Page
 *
 * Week 3 Assessment - Deepens the primary collision pattern to identify
 * specific sub-patterns that are actively attacking the user's foundation.
 *
 * Flow:
 * 1. Intro explaining the purpose
 * 2. Pattern-specific questions (9-11 based on primary pattern)
 * 3. Calculating animation
 * 4. Results showing primary and secondary sub-patterns
 * 5. Redirect to Coverage Center
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Target,
  Shield,
  AlertTriangle,
  Check,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useIdentityCollisionStatus } from '@/hooks/useIdentityCollisionStatus';
import { useToast } from '@/hooks/use-toast';
import {
  getQuestionsForPattern,
  calculateSubPatternScores,
  determineSubPatterns,
  getMaxScoresForPattern,
  saveSubPatternAssessment,
  SUB_PATTERN_INFO,
  type PrimaryPattern,
  type SubPatternType,
  type SubPatternQuestion,
  type SubPatternResult,
} from '@/services/subPatternAssessmentService';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type AssessmentStage = 'intro' | 'questions' | 'calculating' | 'results';

// ============================================================================
// PATTERN INFO
// ============================================================================

const PATTERN_DISPLAY: Record<
  PrimaryPattern,
  { name: string; icon: typeof Target; color: string; gradient: string }
> = {
  past_prison: {
    name: 'Past Prison',
    icon: Shield,
    color: 'text-red-400',
    gradient: 'from-red-500 to-orange-500',
  },
  success_sabotage: {
    name: 'Success Sabotage',
    icon: Zap,
    color: 'text-yellow-400',
    gradient: 'from-yellow-500 to-amber-500',
  },
  compass_crisis: {
    name: 'Compass Crisis',
    icon: Target,
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function SubPatternAssessmentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: collisionStatus, isLoading: collisionLoading } = useIdentityCollisionStatus(user?.id);

  // Assessment state
  const [stage, setStage] = useState<AssessmentStage>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: SubPatternType | 'none'; points: number }>>({});
  const [result, setResult] = useState<SubPatternResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get questions based on user's primary pattern
  const primaryPattern = collisionStatus?.primaryPattern as PrimaryPattern | undefined;
  const questions = primaryPattern ? getQuestionsForPattern(primaryPattern) : [];
  const patternDisplay = primaryPattern ? PATTERN_DISPLAY[primaryPattern] : null;

  // Redirect if no collision pattern
  useEffect(() => {
    if (!collisionLoading && !collisionStatus?.hasPattern) {
      toast({
        title: 'Assessment Required',
        description: 'Please complete the Identity Collision Assessment first.',
        variant: 'destructive',
      });
      navigate('/mind-insurance/assessment');
    }
  }, [collisionLoading, collisionStatus, navigate, toast]);

  // Calculate progress
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  // Handle answer selection
  const handleAnswer = useCallback(
    (value: SubPatternType | 'none', points: number) => {
      const question = questions[currentQuestion];
      if (!question) return;

      setAnswers((prev) => ({
        ...prev,
        [question.id]: { value, points },
      }));

      // Auto-advance after brief delay
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion((prev) => prev + 1);
        } else {
          // All questions answered - calculate results
          handleCalculate();
        }
      }, 400);
    },
    [currentQuestion, questions]
  );

  // Calculate results
  const handleCalculate = useCallback(async () => {
    if (!primaryPattern || !user?.id) return;

    setStage('calculating');

    // Simulate calculation time for UX
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const scores = calculateSubPatternScores(answers, primaryPattern);
    const maxScores = getMaxScoresForPattern(primaryPattern);
    const { primary, secondary } = determineSubPatterns(scores, maxScores);

    const assessmentResult: SubPatternResult = {
      primaryPattern,
      primarySubPattern: primary,
      secondarySubPattern: secondary,
      scores,
      maxScores,
      assessedAt: new Date().toISOString(),
    };

    // Save to database
    setIsSaving(true);
    const saveResult = await saveSubPatternAssessment(user.id, assessmentResult);
    setIsSaving(false);

    if (!saveResult.success) {
      toast({
        title: 'Error Saving Results',
        description: saveResult.error || 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setResult(assessmentResult);
    setStage('results');
  }, [answers, primaryPattern, user?.id, toast]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage !== 'questions') return;

      const question = questions[currentQuestion];
      if (!question) return;

      // Number keys to select options
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        const option = question.options[index];
        if (option) {
          handleAnswer(option.value, option.points);
        }
      }

      // Arrow keys to navigate
      if (e.key === 'ArrowLeft' && currentQuestion > 0) {
        setCurrentQuestion((prev) => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, currentQuestion, questions, handleAnswer]);

  // Loading state
  if (collisionLoading) {
    return (
      <div className="min-h-screen bg-mi-navy flex items-center justify-center">
        <div className="text-mi-cyan">Loading...</div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: INTRO STAGE
  // ============================================================================

  if (stage === 'intro') {
    return (
      <div className="min-h-screen bg-mi-navy flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-mi-cyan/20 to-purple-500/20 border-b border-mi-cyan/30">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/mind-insurance/coverage')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl w-full"
          >
            <Card className="bg-mi-navy-light border-mi-cyan/30">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500">
                  <Target className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">
                  Deep Dive: Your Pattern's Root
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Let's identify the specific sub-patterns attacking your foundation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pattern identified */}
                {patternDisplay && (
                  <div className="p-4 bg-mi-navy rounded-lg border border-mi-cyan/20">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-full bg-gradient-to-br', patternDisplay.gradient)}>
                        <patternDisplay.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Your Primary Pattern</p>
                        <p className={cn('font-semibold', patternDisplay.color)}>
                          {patternDisplay.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* What to expect */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-white">What We'll Discover:</h3>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span>Which specific sub-patterns are actively attacking you</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>Your vulnerability zones that emerge under stress</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Your protected areas showing strength</span>
                    </li>
                  </ul>
                </div>

                {/* Assessment info */}
                <div className="text-center text-sm text-gray-500">
                  <p>{questions.length} questions • 5-7 minutes • Precision protocol targeting</p>
                </div>

                {/* Start button */}
                <Button
                  onClick={() => setStage('questions')}
                  className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white"
                  size="lg"
                >
                  Begin Deep Dive
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: QUESTIONS STAGE
  // ============================================================================

  if (stage === 'questions') {
    const question = questions[currentQuestion];
    if (!question) return null;

    const currentAnswer = answers[question.id];

    return (
      <div className="min-h-screen bg-mi-navy flex flex-col">
        {/* Header with progress */}
        <div className="bg-mi-navy-light border-b border-mi-cyan/20 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentQuestion > 0) {
                    setCurrentQuestion((prev) => prev - 1);
                  } else {
                    setStage('intro');
                  }
                }}
                className="text-gray-400 hover:text-white -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <span className="text-sm text-gray-400">
                {currentQuestion + 1} of {questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-1.5 bg-gray-700" />
          </div>
        </div>

        {/* Question content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-xl w-full"
            >
              <div className="text-center mb-8">
                <Badge
                  variant="outline"
                  className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/30"
                >
                  {SUB_PATTERN_INFO[question.targetSubPattern]?.name || 'Pattern Detection'}
                </Badge>
                <h2 className="text-xl md:text-2xl font-semibold text-white leading-relaxed">
                  {question.question}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((option, index) => {
                  const isSelected = currentAnswer?.value === option.value && currentAnswer?.points === option.points;
                  return (
                    <motion.button
                      key={`${option.value}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleAnswer(option.value, option.points)}
                      className={cn(
                        'w-full p-4 rounded-lg border-2 text-left transition-all',
                        'hover:border-mi-cyan/50 hover:bg-mi-cyan/5',
                        isSelected
                          ? 'border-mi-cyan bg-mi-cyan/10'
                          : 'border-gray-700 bg-mi-navy-light'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-gray-500 font-mono mt-1">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-white">{option.label}</p>
                          <p className="text-sm text-gray-400 mt-0.5">{option.description}</p>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-mi-cyan flex-shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Keyboard hint */}
              <p className="text-center text-xs text-gray-600 mt-6">
                Press 1-4 to select • Arrow keys to navigate
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: CALCULATING STAGE
  // ============================================================================

  if (stage === 'calculating') {
    return (
      <div className="min-h-screen bg-mi-navy flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mx-auto mb-6 p-4 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 w-fit"
          >
            <Target className="h-10 w-10 text-white" />
          </motion.div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Analyzing Your Sub-Patterns
          </h2>
          <p className="text-gray-400 mb-4">
            Identifying what's actively attacking your foundation...
          </p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 bg-mi-cyan rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: RESULTS STAGE
  // ============================================================================

  if (stage === 'results' && result) {
    const primaryInfo = SUB_PATTERN_INFO[result.primarySubPattern];
    const secondaryInfo = result.secondarySubPattern
      ? SUB_PATTERN_INFO[result.secondarySubPattern]
      : null;

    // Calculate percentages for all sub-patterns
    const subPatternPercentages = Object.entries(result.scores)
      .filter(([key]) => result.maxScores[key as SubPatternType] !== undefined)
      .map(([key, score]) => ({
        subPattern: key as SubPatternType,
        score: score || 0,
        maxScore: result.maxScores[key as SubPatternType] || 1,
        percentage: Math.round(((score || 0) / (result.maxScores[key as SubPatternType] || 1)) * 100),
        info: SUB_PATTERN_INFO[key as SubPatternType],
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return (
      <div className="min-h-screen bg-mi-navy">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-b border-purple-500/30">
          <div className="max-w-2xl mx-auto px-4 py-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 mb-4"
            >
              <Sparkles className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">Your Sub-Pattern Profile</h1>
            <p className="text-gray-400 mt-1">
              We've identified what's actively attacking your {patternDisplay?.name}
            </p>
          </div>
        </div>

        {/* Results content */}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Primary Sub-Pattern */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-red-900/30 to-mi-navy-light border-red-500/30">
              <CardHeader>
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  PRIMARY RISK - Actively Attacking
                </div>
                <CardTitle className="text-xl text-white">{primaryInfo.name}</CardTitle>
                <CardDescription className="text-gray-300">
                  {primaryInfo.shortDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">{primaryInfo.fullDescription}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Secondary Sub-Pattern */}
          {secondaryInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-yellow-900/20 to-mi-navy-light border-yellow-500/30">
                <CardHeader>
                  <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-2">
                    <Shield className="h-4 w-4" />
                    VULNERABILITY ZONE - Emerging Under Stress
                  </div>
                  <CardTitle className="text-lg text-white">{secondaryInfo.name}</CardTitle>
                  <CardDescription className="text-gray-300">
                    {secondaryInfo.shortDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400">{secondaryInfo.fullDescription}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* All Sub-Pattern Scores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-mi-navy-light border-mi-cyan/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">Sub-Pattern Breakdown</CardTitle>
                <CardDescription>
                  Risk levels across all {patternDisplay?.name} sub-patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subPatternPercentages.map(({ subPattern, percentage, info }) => (
                  <div key={subPattern} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white">{info.name}</span>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          percentage >= 60
                            ? 'text-red-400'
                            : percentage >= 40
                            ? 'text-yellow-400'
                            : 'text-green-400'
                        )}
                      >
                        {percentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className={cn(
                          'h-full rounded-full',
                          percentage >= 60
                            ? 'bg-gradient-to-r from-red-500 to-orange-500'
                            : percentage >= 40
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500'
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Next steps CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="pt-4"
          >
            <Card className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex-shrink-0">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">Your Protocol Is Being Updated</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      MIO will now target your {primaryInfo.name} pattern with precision protocols.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/mind-insurance/coverage')}
                  className="w-full mt-4 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                >
                  Return to Coverage Center
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
