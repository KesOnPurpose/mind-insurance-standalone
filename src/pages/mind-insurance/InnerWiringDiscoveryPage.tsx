import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Zap, CheckCircle2, ArrowRight, Loader2, Shield, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// INNER WIRING DISCOVERY ASSESSMENT
// ============================================================================
// Discovers user's natural wiring type for personalized protocols
// Wiring Types: Connector, Warrior, Sage, Builder
// ============================================================================

type WiringType = 'connector' | 'warrior' | 'sage' | 'builder';

interface WiringInfo {
  name: string;
  icon: string;
  color: string;
  description: string;
  strengths: string[];
  recoveryStyle: string;
  protocolHint: string;
}

const WIRING_INFO: Record<WiringType, WiringInfo> = {
  connector: {
    name: 'The Connector',
    icon: '🤝',
    color: '#ec4899', // pink
    description: 'You process challenges and restore energy through meaningful relationships. Connection is your superpower.',
    strengths: ['Building deep relationships', 'Empathy and emotional intelligence', 'Collaborative problem-solving'],
    recoveryStyle: 'through meaningful dialogue and shared experiences',
    protocolHint: 'Your protocols will leverage accountability partners and community.',
  },
  warrior: {
    name: 'The Warrior',
    icon: '⚔️',
    color: '#ef4444', // red
    description: 'You thrive on action and physical momentum. Challenges fuel your fire when channeled correctly.',
    strengths: ['Taking decisive action', 'Physical energy and drive', 'Competitive spirit'],
    recoveryStyle: 'through physical action and quick wins',
    protocolHint: 'Your protocols will include movement-based practices and progress tracking.',
  },
  sage: {
    name: 'The Sage',
    icon: '📚',
    color: '#3b82f6', // blue
    description: 'You gain clarity through reflection and deep thinking. Solitude is your sanctuary for breakthrough.',
    strengths: ['Deep contemplation', 'Pattern recognition', 'Wisdom through experience'],
    recoveryStyle: 'through solitude and contemplation',
    protocolHint: 'Your protocols will emphasize journaling and reflective practices.',
  },
  builder: {
    name: 'The Builder',
    icon: '🏗️',
    color: '#22c55e', // green
    description: 'You find satisfaction in creating systems and tangible output. Structure is your foundation for growth.',
    strengths: ['Creating systems', 'Tangible progress', 'Consistent routines'],
    recoveryStyle: 'through structured routine and tangible output',
    protocolHint: 'Your protocols will include habit stacking and measurable milestones.',
  },
};

interface QuestionOption {
  id: string;
  text: string;
  wiringIndicators: Partial<Record<WiringType, number>>;
}

interface Question {
  id: string;
  title: string;
  subtitle?: string;
  options: QuestionOption[];
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    title: 'When you feel stressed or overwhelmed, what helps you reset?',
    subtitle: 'Choose what naturally draws you',
    options: [
      {
        id: 'a',
        text: 'Talking it through with someone I trust',
        wiringIndicators: { connector: 10 },
      },
      {
        id: 'b',
        text: 'Physical activity or taking action on something',
        wiringIndicators: { warrior: 10 },
      },
      {
        id: 'c',
        text: 'Quiet time alone to think and process',
        wiringIndicators: { sage: 10 },
      },
      {
        id: 'd',
        text: 'Organizing or working on a project',
        wiringIndicators: { builder: 10 },
      },
    ],
  },
  {
    id: 'q2',
    title: 'How do you prefer to solve a complex problem?',
    options: [
      {
        id: 'a',
        text: 'Brainstorm with others and get different perspectives',
        wiringIndicators: { connector: 10 },
      },
      {
        id: 'b',
        text: 'Jump in and figure it out through action',
        wiringIndicators: { warrior: 10 },
      },
      {
        id: 'c',
        text: 'Research and think it through deeply first',
        wiringIndicators: { sage: 10 },
      },
      {
        id: 'd',
        text: 'Create a systematic plan and execute step by step',
        wiringIndicators: { builder: 10 },
      },
    ],
  },
  {
    id: 'q3',
    title: 'What gives you the most energy?',
    options: [
      {
        id: 'a',
        text: 'Meaningful conversations and deep connections',
        wiringIndicators: { connector: 10 },
      },
      {
        id: 'b',
        text: 'Accomplishing goals and beating challenges',
        wiringIndicators: { warrior: 10 },
      },
      {
        id: 'c',
        text: 'Learning something new or gaining insight',
        wiringIndicators: { sage: 10 },
      },
      {
        id: 'd',
        text: 'Building something tangible or completing a project',
        wiringIndicators: { builder: 10 },
      },
    ],
  },
  {
    id: 'q4',
    title: 'When you achieve a big win, how do you prefer to celebrate?',
    options: [
      {
        id: 'a',
        text: 'Share it with people who matter to me',
        wiringIndicators: { connector: 10 },
      },
      {
        id: 'b',
        text: 'Move on quickly to the next challenge',
        wiringIndicators: { warrior: 10 },
      },
      {
        id: 'c',
        text: 'Reflect on what I learned from the journey',
        wiringIndicators: { sage: 10 },
      },
      {
        id: 'd',
        text: 'Document it and set up systems to repeat it',
        wiringIndicators: { builder: 10 },
      },
    ],
  },
  {
    id: 'q5',
    title: 'What drains your energy the most?',
    options: [
      {
        id: 'a',
        text: 'Working in isolation for too long',
        wiringIndicators: { connector: 10 },
      },
      {
        id: 'b',
        text: 'Being stuck in planning without action',
        wiringIndicators: { warrior: 10 },
      },
      {
        id: 'c',
        text: 'Constant noise and interruptions',
        wiringIndicators: { sage: 10 },
      },
      {
        id: 'd',
        text: 'Chaos without structure or process',
        wiringIndicators: { builder: 10 },
      },
    ],
  },
  {
    id: 'q6',
    title: 'How do you like to learn new skills?',
    options: [
      {
        id: 'a',
        text: 'Through mentorship or learning with others',
        wiringIndicators: { connector: 10 },
      },
      {
        id: 'b',
        text: 'By doing — trial and error in the real world',
        wiringIndicators: { warrior: 10 },
      },
      {
        id: 'c',
        text: 'Deep study and understanding the theory first',
        wiringIndicators: { sage: 10 },
      },
      {
        id: 'd',
        text: 'Following a structured curriculum or course',
        wiringIndicators: { builder: 10 },
      },
    ],
  },
  {
    id: 'q7',
    title: 'When facing a setback, what\'s your natural first response?',
    options: [
      {
        id: 'a',
        text: 'Reach out to my support network',
        wiringIndicators: { connector: 10 },
      },
      {
        id: 'b',
        text: 'Get back up and attack the problem differently',
        wiringIndicators: { warrior: 10 },
      },
      {
        id: 'c',
        text: 'Step back to understand what went wrong',
        wiringIndicators: { sage: 10 },
      },
      {
        id: 'd',
        text: 'Analyze the process and fix the system',
        wiringIndicators: { builder: 10 },
      },
    ],
  },
];

// Local storage helpers
const STORAGE_KEY = 'inner_wiring_assessment_progress';

function saveProgress(answers: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch (e) {
    console.warn('Could not save progress:', e);
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
    console.warn('Could not clear progress:', e);
  }
}

// Calculate wiring result
function calculateWiringResult(answers: Record<string, string>): {
  primaryWiring: WiringType;
  secondaryWiring: WiringType | null;
  scores: Record<WiringType, number>;
  confidence: number;
} {
  const scores: Record<WiringType, number> = {
    connector: 0,
    warrior: 0,
    sage: 0,
    builder: 0,
  };

  // Calculate scores from answers
  QUESTIONS.forEach((question) => {
    const answerId = answers[question.id];
    const option = question.options.find((o) => o.id === answerId);
    if (option?.wiringIndicators) {
      Object.entries(option.wiringIndicators).forEach(([wiring, score]) => {
        scores[wiring as WiringType] += score;
      });
    }
  });

  // Find primary and secondary wiring
  const sortedWirings = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([wiring]) => wiring as WiringType);

  const primaryWiring = sortedWirings[0];
  const secondaryWiring = scores[sortedWirings[1]] > 0 ? sortedWirings[1] : null;

  // Calculate confidence
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = total > 0 ? Math.round((scores[primaryWiring] / total) * 100) : 0;

  return { primaryWiring, secondaryWiring, scores, confidence };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const InnerWiringDiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateWiringResult> | null>(null);

  // Load saved progress
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
    mutationFn: async (wiringResult: ReturnType<typeof calculateWiringResult>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Save to user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          inner_wiring: {
            primary: wiringResult.primaryWiring,
            secondary: wiringResult.secondaryWiring,
            scores: wiringResult.scores,
            confidence: wiringResult.confidence,
            assessed_at: new Date().toISOString(),
          },
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update any pending invitation to completed
      await supabase
        .from('assessment_invitations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('assessment_type', 'inner_wiring_discovery')
        .eq('status', 'pending');

      return wiringResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['assessmentInvitations'] });
      clearProgress();
    },
  });

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / QUESTIONS.length) * 100;
  const isComplete = answeredCount === QUESTIONS.length;

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!isComplete) return;

    const wiringResult = calculateWiringResult(answers);
    setResult(wiringResult);

    await saveMutation.mutateAsync(wiringResult);
    setShowResults(true);
  };

  const handleContinue = () => {
    const from = location.state?.from?.pathname || '/mind-insurance';
    navigate(from, { replace: true });
  };

  // Results screen
  if (showResults && result) {
    const wiringInfo = WIRING_INFO[result.primaryWiring];
    const secondaryInfo = result.secondaryWiring ? WIRING_INFO[result.secondaryWiring] : null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#1a2a4a] to-[#0a1628] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <Card className="bg-white/[0.08] backdrop-blur-xl border-white/10 p-8 rounded-3xl">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{ backgroundColor: `${wiringInfo.color}20` }}
              >
                {wiringInfo.icon}
              </div>
            </div>

            {/* Wiring Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">
              {wiringInfo.name}
            </h1>

            {/* Confidence */}
            <div className="flex justify-center items-center gap-2 mb-6">
              <div
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: wiringInfo.color, color: '#fff' }}
              >
                {result.confidence}% match
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-300 text-center mb-6 leading-relaxed">
              {wiringInfo.description}
            </p>

            {/* Strengths */}
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-medium text-mi-gold mb-2">Your Strengths</h3>
              <ul className="space-y-1">
                {wiringInfo.strengths.map((strength, i) => (
                  <li key={i} className="text-gray-400 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-mi-cyan" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recovery Style */}
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-medium text-mi-gold mb-2">You Recover Energy</h3>
              <p className="text-gray-400 text-sm capitalize">{wiringInfo.recoveryStyle}</p>
            </div>

            {/* Protocol Hint */}
            <div className="bg-mi-cyan/10 border border-mi-cyan/30 rounded-xl p-4 mb-6">
              <p className="text-mi-cyan text-sm">
                <Zap className="w-4 h-4 inline mr-1" />
                {wiringInfo.protocolHint}
              </p>
            </div>

            {/* Secondary Wiring */}
            {secondaryInfo && (
              <div className="text-center text-gray-500 text-sm mb-6">
                Secondary influence: <span style={{ color: secondaryInfo.color }}>{secondaryInfo.name}</span>
              </div>
            )}

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-mi-cyan to-mi-cyan/80 hover:from-mi-cyan/90 hover:to-mi-cyan/70 text-white"
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

  // Assessment questions
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#1a2a4a] to-[#0a1628]">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-mi-gold/20 mb-4">
            <Zap className="w-8 h-8 text-mi-gold" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Inner Wiring Discovery
          </h1>
          <p className="text-gray-400">
            Discover how you naturally process challenges and restore energy
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
                        ? 'bg-mi-gold text-black'
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

                {/* Options */}
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
                          ? 'bg-mi-gold/20 border border-mi-gold/50'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                      onClick={() => handleAnswer(question.id, option.id)}
                    >
                      <RadioGroupItem
                        value={option.id}
                        id={`${question.id}-${option.id}`}
                        className="mt-0.5 border-gray-500 text-mi-gold"
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
                Analyzing Your Wiring...
              </>
            ) : isComplete ? (
              <>
                Discover My Wiring
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

export default InnerWiringDiscoveryPage;
