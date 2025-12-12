import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, X, Play, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { PracticeData } from '@/types/practices';
import { createPractice, updatePractice, getTodayPractices, isWithinTimeWindow, calculatePracticePoints } from '@/services/practiceService';
import { useSectionCompletion } from '@/hooks/useSectionCompletion';
import { toast } from 'sonner';
import { BACKGROUND_AUDIO_OPTIONS } from '@/constants/protect';
import { getSafeTodayDate, sanitizeErrorMessage } from '@/utils/safeDateUtils';

const MEDITATION_DURATION = 60; // 60 seconds meditation

export default function OutcomeVisualization() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { checkCompletion: checkSectionCompletion } = useSectionCompletion();

  // Form states
  const [outcomeDescription, setOutcomeDescription] = useState('');
  const [backgroundAudio, setBackgroundAudio] = useState('');
  const [meditationStarted, setMeditationStarted] = useState(false);
  const [meditationComplete, setMeditationComplete] = useState(false);
  const [countdown, setCountdown] = useState(MEDITATION_DURATION);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Use browser's detected timezone as default (more accurate than hardcoded value)
  const [userTimezone, setUserTimezone] = useState(() =>
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  );
  const [existingPracticeId, setExistingPracticeId] = useState<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load user timezone and check for existing practice
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        // Get user profile for timezone
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('timezone')
          .eq('id', user.id)
          .single();

        if (profile?.timezone) {
          setUserTimezone(profile.timezone);
        }

        // Check for existing practice today
        const today = getSafeTodayDate(userTimezone);

        const practices = await getTodayPractices(user.id, userTimezone);
        const existingPractice = practices.find(p => p.practice_type === 'O');

        if (existingPractice) {
          setExistingPracticeId(existingPractice.id);
          // Pre-fill form if practice exists but not completed
          if (!existingPractice.completed && existingPractice.data) {
            setOutcomeDescription(existingPractice.data.outcome_description || '');
            setBackgroundAudio(existingPractice.data.background_audio || '');
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user, userTimezone]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Countdown timer for meditation
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (meditationStarted && !meditationComplete && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setMeditationComplete(true);
            if (audioRef.current) {
              audioRef.current.pause();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [meditationStarted, meditationComplete, countdown]);

  const startMeditation = async () => {
    if (!outcomeDescription || !backgroundAudio) {
      setError('Please describe your outcome and select background audio');
      return;
    }

    setMeditationStarted(true);
    setError('');

    // Play background audio if not silence
    if (backgroundAudio !== 'silence') {
      try {
        const selectedAudio = BACKGROUND_AUDIO_OPTIONS.find(opt => opt.value === backgroundAudio);

        if (selectedAudio?.url) {
          audioRef.current = new Audio(selectedAudio.url);
          audioRef.current.loop = true;
          audioRef.current.volume = 0.5;
          await audioRef.current.play();
        }
      } catch (err) {
        console.error('Error playing audio:', err);
        // Don't block meditation if audio fails
      }
    }
  };

  const handleComplete = async () => {
    if (!meditationComplete) {
      setError('Please complete the full meditation');
      return;
    }

    if (!user) {
      setError('You must be logged in to save your practice');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const practiceData: Partial<PracticeData> = {
        outcome_description: outcomeDescription,
        background_audio: backgroundAudio,
        meditation_completed: meditationComplete,
      };

      const today = getSafeTodayDate(userTimezone);

      const points = 3;

      if (existingPracticeId) {
        // Update existing practice
        await updatePractice(existingPracticeId, {
          completed: true,
          completed_at: new Date().toISOString(),
          points_earned: points,
          is_late: false,
          data: practiceData,
        });

        toast.success(`Practice updated! You earned ${points} points`);
      } else {
        // Create new practice
        await createPractice({
          user_id: user.id,
          practice_date: today,
          practice_type: 'O',
          data: practiceData,
          completed: true,
          completed_at: new Date().toISOString(),
        });

        toast.success(`Practice completed! You earned ${points} points`);
      }

      // Check if this completes a section and trigger MIO feedback
      await checkSectionCompletion('O', today);

      // Navigate back to practice page
      navigate('/mind-insurance/practice?section=CHAMPIONSHIP_SETUP');
    } catch (err: unknown) {
      console.error('Error saving practice:', err);
      // Use centralized error sanitization
      setError(sanitizeErrorMessage(err));
      toast.error('Failed to save practice');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 min-h-screen bg-mi-navy">
      <Card className="w-full bg-mi-navy-light border-mi-cyan/20">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                Outcome Visualization
              </CardTitle>
              <CardDescription className="text-mi-cyan">
                Visualize your champion future • 3 points
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/mind-insurance/practice')}
              aria-label="Close"
              className="text-gray-400 hover:text-white hover:bg-mi-navy"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!meditationStarted ? (
            <>
              {/* Outcome Description */}
              <div className="space-y-2">
                <Label htmlFor="outcome-description" className="text-white">
                  Describe your desired outcome in detail
                </Label>
                <p className="text-sm text-gray-400">
                  Be specific and write in present tense as if it has already happened
                </p>
                <Textarea
                  id="outcome-description"
                  placeholder="I see myself achieving..."
                  value={outcomeDescription}
                  onChange={(e) => setOutcomeDescription(e.target.value)}
                  rows={5}
                  className="mi-textarea resize-none"
                />
              </div>

              {/* Background Audio Selection */}
              <div className="space-y-2">
                <Label htmlFor="background-audio" className="text-white">
                  Choose your background audio
                </Label>
                <Select value={backgroundAudio} onValueChange={setBackgroundAudio}>
                  <SelectTrigger id="background-audio" className="mi-select">
                    <SelectValue placeholder="Select background audio" />
                  </SelectTrigger>
                  <SelectContent className="bg-mi-navy-light border-mi-cyan/20">
                    {BACKGROUND_AUDIO_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-gray-300 focus:bg-mi-cyan/20 focus:text-white">
                        <span className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ready to start card */}
              <Card className="border-mi-cyan/30 bg-mi-navy">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2 text-white">
                    Ready for your guided visualization?
                  </h3>
                  <p className="text-sm text-gray-400">
                    This {MEDITATION_DURATION}-second guided experience will help you visualize
                    your desired outcome with clarity and conviction.
                  </p>
                </CardContent>
              </Card>

              {/* Start Button */}
              <Button
                onClick={startMeditation}
                disabled={!outcomeDescription || !backgroundAudio}
                size="lg"
                className="w-full mi-btn-primary"
              >
                <Play className="mr-2 h-4 w-4" />
                Begin Visualization
              </Button>
            </>
          ) : (
            <>
              {/* Meditation Screen */}
              <div className="text-center py-12 space-y-6">
                <div className="text-6xl">🧘</div>

                {!meditationComplete ? (
                  <>
                    <div className="space-y-4">
                      <div className="text-4xl font-bold text-mi-cyan">
                        {formatTime(countdown)}
                      </div>
                      <Progress value={(1 - countdown / MEDITATION_DURATION) * 100} className="bg-mi-navy [&>div]:bg-mi-cyan" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xl font-medium text-white">
                        Close your eyes
                      </p>
                      <p className="text-gray-400 max-w-md mx-auto">
                        See yourself in a peaceful place. Visualize your desired outcome as if
                        it has already happened. Feel the emotions. Notice the details.
                      </p>
                    </div>

                    {backgroundAudio !== 'silence' && (
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <Volume2 className="h-4 w-4" />
                        <span className="text-sm">Playing background audio</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="text-2xl font-bold text-mi-cyan">
                        Visualization Complete! ✓
                      </div>
                      <p className="text-gray-400 max-w-md mx-auto">
                        You've successfully visualized your desired outcome.
                        Carry this feeling with you throughout your day.
                      </p>
                    </div>

                    {/* Meditation completed checkbox (auto-checked) */}
                    <div className="flex items-center justify-center space-x-2">
                      <Checkbox
                        id="meditation-completed"
                        checked={meditationComplete}
                        disabled
                        className="border-mi-cyan data-[state=checked]:bg-mi-cyan"
                      />
                      <Label
                        htmlFor="meditation-completed"
                        className="text-sm font-medium leading-none text-gray-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Meditation completed
                      </Label>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Complete Button */}
          {meditationComplete && (
            <Button
              onClick={handleComplete}
              disabled={loading}
              size="lg"
              className="w-full mi-btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                '○ Complete Outcome Visualization'
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}