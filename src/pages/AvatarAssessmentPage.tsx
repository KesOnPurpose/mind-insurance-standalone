import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Answer {
  questionId: string;
  value: string;
  points: Record<string, number>;
}

export default function AvatarAssessmentPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Assessment questions from identity_collision_questions.txt
  const assessmentSteps = [
    {
      title: 'Pattern Confirmation',
      questions: [
        {
          id: 'q1',
          text: 'When a significant opportunity arrives—one that could truly change your trajectory—what typically happens?',
          options: [
            { value: 'A', label: 'I get excited and move forward with confidence', points: {} },
            { value: 'B', label: 'I feel anxious and start creating problems or finding reasons it won\'t work', points: { past_prison: 3 } },
            { value: 'C', label: 'I push hard initially but burn out before completion', points: { success_sabotage: 3 } },
            { value: 'D', label: 'I feel numb or disconnected, wondering why I\'m not more excited', points: { compass_crisis: 3 } }
          ]
        },
        {
          id: 'q2',
          text: 'The feeling that shows up MOST often when you\'re trying to level up is:',
          options: [
            { value: 'A', label: 'Guilt or fear that "people like me don\'t do that"', points: { past_prison: 3 } },
            { value: 'B', label: 'Exhaustion or overwhelm that makes execution impossible', points: { success_sabotage: 3 } },
            { value: 'C', label: 'Emptiness or dissatisfaction despite objective progress', points: { compass_crisis: 3 } },
            { value: 'D', label: 'Excitement and genuine motivation', points: {} }
          ]
        },
        {
          id: 'q3',
          text: 'The voice in your head most often says:',
          options: [
            { value: 'A', label: 'Remember who you really are" or "Don\'t get too big for your britches', points: { past_prison: 3 } },
            { value: 'B', label: 'You\'re too tired" or "This is too much', points: { success_sabotage: 3 } },
            { value: 'C', label: 'Everyone else is ahead" or "What\'s the point?', points: { compass_crisis: 3 } },
            { value: 'D', label: 'You\'ve got this" or "Let\'s go', points: {} }
          ]
        }
      ]
    },
    {
      title: 'Pattern History',
      questions: [
        {
          id: 'q4',
          text: 'If you\'re honest, you\'ve repeated this pattern before:',
          options: [
            { value: 'A', label: 'Building something good, then blowing it up or walking away right before breakthrough', points: { past_prison: 3 } },
            { value: 'B', label: 'Achieving success, then burning out and having to start over', points: { success_sabotage: 3 } },
            { value: 'C', label: 'Chasing a goal, achieving it, then feeling empty and chasing something new', points: { compass_crisis: 3 } },
            { value: 'D', label: 'Steadily progressing without major self-sabotage', points: {} }
          ]
        },
        {
          id: 'q5',
          text: 'When you hit a wall or crisis point, the real issue underneath is usually:',
          options: [
            { value: 'A', label: 'Fear of betraying my roots or becoming someone my past self wouldn\'t recognize', points: { past_prison: 3 } },
            { value: 'B', label: 'Complete depletion—I have no fuel left when it matters most', points: { success_sabotage: 3 } },
            { value: 'C', label: 'Realizing I\'m chasing something I don\'t actually want', points: { compass_crisis: 3 } },
            { value: 'D', label: 'An external circumstance, not an internal pattern', points: {} }
          ]
        }
      ]
    },
    {
      title: 'Temperament',
      questions: [
        {
          id: 'q6',
          text: 'When facing a challenge, you naturally:',
          options: [
            { value: 'A', label: 'Attack it head-on with intensity and determination', points: { warrior: 3 } },
            { value: 'B', label: 'Step back to analyze and understand the full picture', points: { sage: 3 } },
            { value: 'C', label: 'Create a detailed plan and system to solve it', points: { builder: 3 } },
            { value: 'D', label: 'Reach out to others and collaborate on solutions', points: { connector: 3 } }
          ]
        },
        {
          id: 'q7',
          text: 'Your greatest strength is:',
          options: [
            { value: 'A', label: 'Your ability to push through obstacles and compete', points: { warrior: 2 } },
            { value: 'B', label: 'Your wisdom and ability to see deeper meanings', points: { sage: 2 } },
            { value: 'C', label: 'Your ability to build systems and create structure', points: { builder: 2 } },
            { value: 'D', label: 'Your ability to connect with and inspire others', points: { connector: 2 } }
          ]
        }
      ]
    }
  ];

  const totalSteps = assessmentSteps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleAnswer = (questionId: string, value: string, points: Record<string, number>) => {
    setAnswers(prev => {
      const filtered = prev.filter(a => a.questionId !== questionId);
      return [...filtered, { questionId, value, points }];
    });
  };

  const isStepComplete = () => {
    const currentQuestions = assessmentSteps[currentStep].questions;
    return currentQuestions.every(q => 
      answers.some(a => a.questionId === q.id)
    );
  };

  const calculateScores = () => {
    const scores = {
      past_prison: 0,
      success_sabotage: 0,
      compass_crisis: 0,
      warrior: 0,
      sage: 0,
      builder: 0,
      connector: 0
    };

    answers.forEach(answer => {
      Object.entries(answer.points).forEach(([key, value]) => {
        scores[key as keyof typeof scores] += value;
      });
    });

    return scores;
  };

  const determineavatarType = (scores: ReturnType<typeof calculateScores>) => {
    // Determine primary pattern
    const patternScores = {
      past_prison: scores.past_prison,
      success_sabotage: scores.success_sabotage,
      compass_crisis: scores.compass_crisis
    };
    
    const primaryPattern = Object.entries(patternScores).reduce((a, b) => 
      b[1] > a[1] ? b : a
    )[0];

    // Determine temperament
    const temperamentScores = {
      warrior: scores.warrior,
      sage: scores.sage,
      builder: scores.builder,
      connector: scores.connector
    };
    
    const temperament = Object.entries(temperamentScores).reduce((a, b) => 
      b[1] > a[1] ? b : a
    )[0];

    return { primaryPattern, temperament, scores };
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const scores = calculateScores();
      const { primaryPattern, temperament } = determineavatarType(scores);
      
      // Save to database
      const { error } = await supabase
        .from('avatar_assessments')
        .insert({
          user_id: user.id,
          avatar_type: `${primaryPattern}_${temperament}`,
          primary_pattern: primaryPattern,
          temperament: temperament,
          past_prison_score: scores.past_prison,
          success_sabotage_score: scores.success_sabotage,
          compass_crisis_score: scores.compass_crisis,
          temperament_scores: {
            warrior: scores.warrior,
            sage: scores.sage,
            builder: scores.builder,
            connector: scores.connector
          },
          completed_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: 'Assessment Complete! 🎯',
        description: 'Your avatar profile has been created.',
      });
      
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save assessment. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepData = assessmentSteps[currentStep];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Avatar Assessment</h1>
          <p className="text-muted-foreground">
            Let's understand your unique pattern - {currentStepData.title}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {currentStepData.questions.map(question => {
            const currentAnswer = answers.find(a => a.questionId === question.id);
            
            return (
              <Card key={question.id} className="p-6">
                <h3 className="text-lg font-semibold mb-4">{question.text}</h3>
                <RadioGroup
                  value={currentAnswer?.value}
                  onValueChange={(value) => {
                    const option = question.options.find(o => o.value === value);
                    if (option) {
                      handleAnswer(question.id, value, option.points);
                    }
                  }}
                >
                  {question.options.map(option => (
                    <div key={option.value} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                      <Label htmlFor={`${question.id}-${option.value}`} className="flex-1 cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </Card>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          {currentStep === totalSteps - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!isStepComplete() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Complete Assessment'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!isStepComplete()}
              className="gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
