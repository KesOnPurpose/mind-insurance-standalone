import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Brain, CheckCircle2, ArrowRight, Loader2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  calculateCollisionResult,
  saveAssessmentResult,
  PATTERN_INFO,
  type AssessmentAnswer,
  type AssessmentResult,
  type CollisionPattern,
} from '@/services/identityCollisionService';

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

interface QuestionOption {
  id: string;
  text: string;
  score: number;
  patternIndicators?: Partial<Record<CollisionPattern, number>>;
}

interface Question {
  id: string;
  title: string;
  subtitle?: string;
  type: 'single' | 'slider';
  options?: QuestionOption[];
  sliderConfig?: {
    min: number;
    max: number;
    minLabel: string;
    maxLabel: string;
  };
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    title: 'How would you describe the gap between your effort and your results?',
    subtitle: 'Think about the last 6-12 months',
    type: 'single',
    options: [
      { id: 'a', text: 'Major gap — I work incredibly hard but results don\'t match', score: 10 },
      { id: 'b', text: 'Significant gap — There\'s a clear disconnect', score: 7 },
      { id: 'c', text: 'Moderate gap — Some inconsistency', score: 4 },
      { id: 'd', text: 'Minimal gap — Effort and results align well', score: 1 },
    ],
  },
  {
    id: 'q2',
    title: 'Which statement best describes your relationship with taking action?',
    subtitle: 'Select the one that resonates most',
    type: 'single',
    options: [
      {
        id: 'a',
        text: 'I often get stuck in analysis paralysis and overthinking',
        score: 10,
        patternIndicators: { past_prison: 8 },
      },
      {
        id: 'b',
        text: 'I take action in inconsistent bursts, then fade',
        score: 7,
        patternIndicators: { compass_crisis: 5 },
      },
      {
        id: 'c',
        text: 'I start strong but sabotage myself near success',
        score: 8,
        patternIndicators: { success_sabotage: 10 },
      },
      {
        id: 'd',
        text: 'I\'m generally consistent with execution',
        score: 2,
      },
    ],
  },
  {
    id: 'q3',
    title: 'How often do you think "I should be further along by now"?',
    subtitle: 'Be honest with yourself',
    type: 'single',
    options: [
      { id: 'a', text: 'Daily — It\'s a constant thought', score: 10, patternIndicators: { compass_crisis: 5, past_prison: 3 } },
      { id: 'b', text: 'Weekly — Comes up regularly', score: 7, patternIndicators: { compass_crisis: 3, past_prison: 2 } },
      { id: 'c', text: 'Monthly — Occasional thought', score: 4, patternIndicators: { compass_crisis: 1 } },
      { id: 'd', text: 'Rarely — I\'m at peace with my progress', score: 1 },
    ],
  },
  {
    id: 'q4',
    title: 'Which internal conflict resonates MOST with your experience?',
    subtitle: 'This is the key pattern detector — choose carefully',
    type: 'single',
    options: [
      {
        id: 'a',
        text: 'I feel held back by my past, upbringing, or background. There\'s guilt or limiting beliefs from where I came from.',
        score: 10,
        patternIndicators: { past_prison: 15 },
      },
      {
        id: 'b',
        text: 'I lack clear direction or feel pulled in multiple directions. I struggle with decision paralysis and comparison.',
        score: 10,
        patternIndicators: { compass_crisis: 15 },
      },
      {
        id: 'c',
        text: 'I pull back right when breakthrough is near. I unconsciously sabotage progress at critical moments.',
        score: 10,
        patternIndicators: { success_sabotage: 15 },
      },
      {
        id: 'd',
        text: 'I feel generally aligned and don\'t strongly identify with any of these patterns.',
        score: 2,
      },
    ],
  },
  {
    id: 'q5',
    title: 'What happens when you try to implement new strategies or habits?',
    subtitle: 'Think about your typical pattern',
    type: 'single',
    options: [
      {
        id: 'a',
        text: 'Initial excitement fades fast, and I return to old patterns',
        score: 8,
        patternIndicators: { past_prison: 5, compass_crisis: 3 },
      },
      {
        id: 'b',
        text: 'Stop-start cycle — I can\'t maintain consistency',
        score: 6,
        patternIndicators: { compass_crisis: 5 },
      },
      {
        id: 'c',
        text: 'I execute well but unconsciously sabotage the results',
        score: 9,
        patternIndicators: { success_sabotage: 8 },
      },
      {
        id: 'd',
        text: 'Generally consistent with implementation',
        score: 2,
      },
    ],
  },
  {
    id: 'q6',
    title: 'How do you feel about your decision-making?',
    type: 'single',
    options: [
      {
        id: 'a',
        text: 'I second-guess myself constantly after decisions',
        score: 8,
        patternIndicators: { past_prison: 5, compass_crisis: 3 },
      },
      {
        id: 'b',
        text: 'I often feel like an impostor who doesn\'t deserve success',
        score: 7,
        patternIndicators: { past_prison: 5, success_sabotage: 3 },
      },
      {
        id: 'c',
        text: 'It depends heavily on context and who\'s around',
        score: 5,
        patternIndicators: { compass_crisis: 3 },
      },
      {
        id: 'd',
        text: 'I\'m generally confident in my decisions',
        score: 2,
      },
    ],
  },
  {
    id: 'q7',
    title: 'What area of life is this pattern most affecting?',
    subtitle: 'Where do you feel the impact most strongly?',
    type: 'single',
    options: [
      { id: 'career', text: 'Career / Business', score: 0 },
      { id: 'relationships', text: 'Relationships', score: 0 },
      { id: 'health', text: 'Health / Wellness', score: 0 },
      { id: 'growth', text: 'Personal Growth', score: 0 },
      { id: 'financial', text: 'Financial', score: 0 },
    ],
  },
  {
    id: 'q8',
    title: 'How much is this pattern impacting your life?',
    subtitle: 'Drag the slider to indicate impact intensity',
    type: 'slider',
    sliderConfig: {
      min: 1,
      max: 10,
      minLabel: 'Minor frustration',
      maxLabel: 'Critical — needs urgent attention',
    },
  },
];

// ============================================================================
// LOCALSTORAGE HELPERS
// ============================================================================

const STORAGE_KEY = 'identity_collision_assessment_progress';

function saveProgress(answers: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch (e) {
    console.warn('Could not save progress to localStorage:', e);
  }
}

function loadProgress(): Record<string, string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Could not clear localStorage:', e);
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const IdentityCollisionAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Load saved progress on mount
  useEffect(() => {
    const saved = loadProgress();
    if (Object.keys(saved).length > 0) {
      setAnswers(saved);
    }
  }, []);

  // Save progress on change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      saveProgress(answers);
    }
  }, [answers]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (assessmentResult: AssessmentResult) => {
      if (!user?.id) throw new Error('User not authenticated');
      return saveAssessmentResult({ userId: user.id, result: assessmentResult });
    },
    onSuccess: () => {
      // Invalidate identity collision status query
      queryClient.invalidateQueries({ queryKey: ['identityCollisionStatus'] });
      clearProgress();
    },
  });

  // Calculate progress
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / QUESTIONS.length) * 100;
  const isComplete = answeredCount === QUESTIONS.length;

  // Handle answer change
  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!isComplete) return;

    // Convert answers to AssessmentAnswer format
    const formattedAnswers: AssessmentAnswer[] = QUESTIONS.map((question) => {
      const answerValue = answers[question.id];

      if (question.type === 'slider') {
        return {
          questionId: question.id,
          answer: answerValue,
          score: parseInt(answerValue, 10) || 5,
        };
      }

      const selectedOption = question.options?.find((opt) => opt.id === answerValue);
      return {
        questionId: question.id,
        answer: answerValue,
        score: selectedOption?.score || 0,
        patternIndicators: selectedOption?.patternIndicators,
      };
    });

    // Calculate result
    const assessmentResult = calculateCollisionResult(formattedAnswers);
    setResult(assessmentResult);

    // Save to database
    await saveMutation.mutateAsync(assessmentResult);

    // Show results
    setShowResults(true);
  };

  // Handle continue after results
  const handleContinue = () => {
    // Get the intended destination from location state, or default to hub
    const from = location.state?.from?.pathname || '/mind-insurance';
    navigate(from, { replace: true });
  };

  // Render results screen
  if (showResults && result) {
    const patternInfo = PATTERN_INFO[result.primaryPattern];

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3c3c3b] via-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <Card className="bg-white/[0.08] backdrop-blur-xl border-white/10 p-8 rounded-3xl">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{ backgroundColor: `${patternInfo.color}20` }}
              >
                {patternInfo.icon}
              </div>
            </div>

            {/* Pattern Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">
              Your Pattern: {patternInfo.name}
            </h1>

            {/* Confidence */}
            <div className="flex justify-center items-center gap-2 mb-6">
              <div
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: patternInfo.color, color: '#fff' }}
              >
                {result.confidence}% confidence
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-300 text-center mb-6 leading-relaxed">
              {patternInfo.shortDescription}
            </p>

            {/* Full Description */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-gray-400 text-sm leading-relaxed">
                {patternInfo.fullDescription}
              </p>
            </div>

            {/* Impact Area */}
            {result.impactArea && (
              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-6">
                <span>Most affected area:</span>
                <span className="text-mi-gold font-medium capitalize">
                  {result.impactArea.replace('_', ' ')}
                </span>
              </div>
            )}

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-mi-gold to-mi-gold/80 hover:from-mi-gold/90 hover:to-mi-gold/70 text-black"
            >
              <Shield className="w-5 h-5 mr-2" />
              Continue to Mind Insurance
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Render assessment questions
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3c3c3b] via-[#2a2a2a] to-[#1a1a1a]">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-mi-cyan/20 mb-4">
            <Brain className="w-8 h-8 text-mi-cyan" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Identity Collision Assessment
          </h1>
          <p className="text-gray-400">
            Discover which pattern is holding you back
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress</span>
            <span>{answeredCount} of {QUESTIONS.length}</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/10" />
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {QUESTIONS.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/[0.08] backdrop-blur-xl border-white/10 p-6 rounded-2xl">
                {/* Question Number */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      answers[question.id]
                        ? 'bg-mi-cyan text-white'
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {answers[question.id] ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{question.title}</h3>
                    {question.subtitle && (
                      <p className="text-gray-500 text-sm">{question.subtitle}</p>
                    )}
                  </div>
                </div>

                {/* Options or Slider */}
                {question.type === 'single' && question.options && (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswer(question.id, value)}
                    className="space-y-3"
                  >
                    {question.options.map((option) => (
                      <div
                        key={option.id}
                        className={`flex items-start space-x-3 p-3 rounded-xl transition-colors cursor-pointer ${
                          answers[question.id] === option.id
                            ? 'bg-mi-cyan/20 border border-mi-cyan/50'
                            : 'bg-white/5 hover:bg-white/10 border border-transparent'
                        }`}
                        onClick={() => handleAnswer(question.id, option.id)}
                      >
                        <RadioGroupItem
                          value={option.id}
                          id={`${question.id}-${option.id}`}
                          className="mt-0.5 border-gray-500 text-mi-cyan"
                        />
                        <Label
                          htmlFor={`${question.id}-${option.id}`}
                          className="text-gray-300 cursor-pointer leading-relaxed"
                        >
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.type === 'slider' && question.sliderConfig && (
                  <div className="space-y-4 pt-2">
                    <Slider
                      value={[parseInt(answers[question.id] || '5', 10)]}
                      onValueChange={(value) =>
                        handleAnswer(question.id, value[0].toString())
                      }
                      min={question.sliderConfig.min}
                      max={question.sliderConfig.max}
                      step={1}
                      className="[&_[role=slider]]:bg-mi-cyan [&_[role=slider]]:border-mi-cyan"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{question.sliderConfig.minLabel}</span>
                      <span className="text-mi-gold font-bold text-lg">
                        {answers[question.id] || 5}
                      </span>
                      <span>{question.sliderConfig.maxLabel}</span>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 pb-8">
          <Button
            onClick={handleSubmit}
            disabled={!isComplete || saveMutation.isPending}
            className={`w-full h-14 text-lg font-semibold rounded-xl transition-all ${
              isComplete
                ? 'bg-gradient-to-r from-mi-gold to-mi-gold/80 hover:from-mi-gold/90 hover:to-mi-gold/70 text-black'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Your Pattern...
              </>
            ) : isComplete ? (
              <>
                Reveal My Pattern
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              `Answer ${QUESTIONS.length - answeredCount} more question${
                QUESTIONS.length - answeredCount > 1 ? 's' : ''
              }`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IdentityCollisionAssessmentPage;
