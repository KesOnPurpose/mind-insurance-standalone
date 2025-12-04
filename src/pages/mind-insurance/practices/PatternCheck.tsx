import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/hooks/useSession';
import { useFeatureUsage } from '@/hooks/useFeatureUsage';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// Constants
const PRACTICE_TYPE = 'P'; // P for Pattern Check in PROTECT methodology
const BASE_POINTS = 4;

const COLLISION_TYPES = [
  { value: 'past_prison', label: 'Past Prison' },
  { value: 'compass_crisis', label: 'Compass Crisis' },
  { value: 'success_sabotage', label: 'Success Sabotage' },
];

export default function PatternCheck() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Analytics tracking
  const { trackTactic } = useSession('practice');
  const { trackFeature } = useFeatureUsage('tactic_practice', true);

  // Form state
  const [caughtPattern, setCaughtPattern] = useState<string>('');
  const [collisionType, setCollisionType] = useState<string>('');
  const [situation, setSituation] = useState('');
  const [reframe, setReframe] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [userTimezone, setUserTimezone] = useState('America/New_York');

  // Load user timezone
  useEffect(() => {
    loadUserTimezone();
  }, [user]);

  async function loadUserTimezone() {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('timezone')
        .eq('id', user.id)
        .single();

      if (profile?.timezone) {
        setUserTimezone(profile.timezone);
      }
    } catch (error) {
      console.error('Error loading user timezone:', error);
    }
  }

  // Check if already completed today
  useEffect(() => {
    checkCompletion();
  }, [user]);

  async function checkCompletion() {
    if (!user) return;

    try {
      const today = new Date().toLocaleDateString('en-CA', {
        timeZone: userTimezone
      });
      const { data: existingPractices } = await supabase
        .from('daily_practices')
        .select('*')
        .eq('user_id', user.id)
        .eq('practice_date', today)
        .eq('practice_type', PRACTICE_TYPE);

      if (existingPractices && existingPractices.length > 0) {
        const practice = existingPractices[0];
        if (practice.completed) {
          setAlreadyCompleted(true);
        }
      }
    } catch (err) {
      console.error('Error checking completion:', err);
    }
  }

  async function handleComplete() {
    if (!user) {
      setError('Please log in to complete this practice');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const today = new Date().toLocaleDateString('en-CA', {
        timeZone: userTimezone
      });

      // Check if practice already exists for today
      const { data: existingPractices } = await supabase
        .from('daily_practices')
        .select('*')
        .eq('user_id', user.id)
        .eq('practice_date', today)
        .eq('practice_type', PRACTICE_TYPE);

      const existingPractice = existingPractices && existingPractices.length > 0 ? existingPractices[0] : null;

      // Prepare practice data
      const practiceData = {
        caught_pattern: caughtPattern === 'yes',
        collision_type: collisionType,
        situation_description: situation,
        reframe_description: reframe,
      };

      // Always use base points - no late penalties
      const points = BASE_POINTS;

      const practiceRecord = {
        user_id: user.id,
        practice_date: today,
        practice_type: PRACTICE_TYPE,
        completed: true,
        completed_at: new Date().toISOString(),
        points_earned: points,
        is_late: false, // No late penalties
        data: practiceData,
      };

      if (existingPractice) {
        // Update existing practice
        await supabase
          .from('daily_practices')
          .update(practiceRecord)
          .eq('id', existingPractice.id);

        // Update user's total points (add difference)
        const pointsDifference = points - (existingPractice.points_earned || 0);
        if (pointsDifference > 0) {
          await supabase.rpc('increment_user_points', {
            user_id_input: user.id,
            points_to_add: pointsDifference,
          });
        }
      } else {
        // Create new practice
        await supabase
          .from('daily_practices')
          .insert(practiceRecord);

        // Update user's total points
        await supabase.rpc('increment_user_points', {
          user_id_input: user.id,
          points_to_add: points,
        });
      }

      // Track tactic completion for analytics
      await trackTactic();

      // Success! Navigate back to practice screen
      navigate('/mind-insurance/practice');
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your practice');
      setLoading(false);
    }
  }

  // Check if form can be completed
  const canComplete = caughtPattern === 'no' || (
    caughtPattern === 'yes' &&
    collisionType &&
    situation &&
    reframe
  );

  return (
    <div className="flex flex-col h-screen bg-mi-navy">
      {/* Header */}
      <div className="px-6 py-4 border-b border-mi-cyan/20 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">
            Pattern Check
          </h1>
          <p className="text-sm text-mi-cyan">
            {BASE_POINTS} points
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/mind-insurance/practice')}
          aria-label="Close"
          className="text-gray-400 hover:text-white hover:bg-mi-navy-light"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-2xl mx-auto">
          {alreadyCompleted && (
            <Alert className="mb-6 bg-mi-cyan/20 border-mi-cyan">
              <AlertDescription className="text-center text-white">
                <span className="font-semibold">✓ Already Completed Today</span>
                <br />
                You've already completed this practice today. Come back tomorrow!
              </AlertDescription>
            </Alert>
          )}

          <Card className="bg-mi-navy-light border-mi-cyan/20">
            <CardHeader>
              <CardTitle className="text-white">Daily Pattern Recognition</CardTitle>
              <CardDescription className="text-gray-400">
                Identify and reframe negative thought patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question 1: Caught Pattern */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-white">
                  Did you catch yourself in a negative thought pattern today?
                </Label>
                <RadioGroup value={caughtPattern} onValueChange={setCaughtPattern}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no" className="border-mi-cyan/50 text-mi-cyan" />
                    <Label htmlFor="no" className="font-normal cursor-pointer text-gray-300">
                      No patterns today
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes" className="border-mi-cyan/50 text-mi-cyan" />
                    <Label htmlFor="yes" className="font-normal cursor-pointer text-gray-300">
                      Yes, I caught one!
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {caughtPattern === 'yes' && (
                <>
                  {/* Collision Type */}
                  <div className="space-y-3">
                    <Label htmlFor="collision-type" className="text-base font-semibold text-white">
                      Which type of collision?
                    </Label>
                    <Select value={collisionType} onValueChange={setCollisionType}>
                      <SelectTrigger id="collision-type" className="mi-select">
                        <SelectValue placeholder="Select collision type" />
                      </SelectTrigger>
                      <SelectContent className="bg-mi-navy-light border-mi-cyan/20">
                        {COLLISION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="text-gray-300 focus:bg-mi-cyan/20 focus:text-white">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Situation */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="situation" className="text-base font-semibold text-white">
                        Describe the situation:
                      </Label>
                      <p className="text-sm text-gray-400 mt-1">
                        What triggered this pattern?
                      </p>
                    </div>
                    <Textarea
                      id="situation"
                      placeholder="What was happening when you noticed this pattern?"
                      value={situation}
                      onChange={(e) => setSituation(e.target.value)}
                      rows={4}
                      className="mi-textarea resize-none"
                    />
                  </div>

                  {/* Reframe */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="reframe" className="text-base font-semibold text-white">
                        How did you reframe it?
                      </Label>
                      <p className="text-sm text-gray-400 mt-1">
                        How did you switch perspectives?
                      </p>
                    </div>
                    <Textarea
                      id="reframe"
                      placeholder="Describe how you reframed this pattern..."
                      value={reframe}
                      onChange={(e) => setReframe(e.target.value)}
                      rows={4}
                      className="mi-textarea resize-none"
                    />
                  </div>
                </>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-mi-cyan/20">
        <Button
          className="w-full mi-btn-primary"
          size="lg"
          onClick={handleComplete}
          disabled={!canComplete || loading || alreadyCompleted}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : alreadyCompleted ? (
            'Already Completed Today'
          ) : (
            'Complete Practice'
          )}
        </Button>
      </div>
    </div>
  );
}