import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Loader2, Sunrise, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSectionCompletion } from '@/hooks/useSectionCompletion';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getSafeTodayDate, sanitizeErrorMessage } from '@/utils/safeDateUtils';

// Constants
const PRACTICE_TYPE = 'T2'; // T2 for Tomorrow Setup in PROTECT methodology
const BASE_POINTS = 2;

export default function TomorrowSetup() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { checkCompletion: checkSectionCompletion } = useSectionCompletion();

  // Form state
  const [tomorrowGoal, setTomorrowGoal] = useState('');
  const [morningRoutine, setMorningRoutine] = useState('');
  const [triggerPrevention, setTriggerPrevention] = useState('');
  const [successVisualization, setSuccessVisualization] = useState('');
  const [mindsetDeclaration, setMindsetDeclaration] = useState('');

  // Optional checklist state (UI only, not saved)
  const [clothesLaidOut, setClothesLaidOut] = useState(false);
  const [workspacePrepared, setWorkspacePrepared] = useState(false);
  const [alarmSet, setAlarmSet] = useState(false);
  const [calendarReviewed, setCalendarReviewed] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  // Use browser's detected timezone as default (more accurate than hardcoded value)
  const [userTimezone, setUserTimezone] = useState(() =>
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  );

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
      const today = getSafeTodayDate(userTimezone);
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
    // Validate all fields are filled
    if (!tomorrowGoal || !morningRoutine || !triggerPrevention || !successVisualization || !mindsetDeclaration) {
      setError('Please complete all fields before submitting');
      return;
    }

    if (!user) {
      setError('Please log in to complete this practice');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const today = getSafeTodayDate(userTimezone);

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
        tomorrow_goal: tomorrowGoal,
        morning_routine: morningRoutine,
        trigger_prevention: triggerPrevention,
        success_visualization: successVisualization,
        mindset_declaration: mindsetDeclaration,
      };

      const practiceRecord = {
        user_id: user.id,
        practice_date: today,
        practice_type: PRACTICE_TYPE,
        completed: true,
        completed_at: new Date().toISOString(),
        points_earned: BASE_POINTS,
        is_late: false,
        data: practiceData,
      };

      if (existingPractice) {
        // Update existing practice
        await supabase
          .from('daily_practices')
          .update(practiceRecord)
          .eq('id', existingPractice.id);

        // Update user's total points (add difference)
        const pointsDifference = BASE_POINTS - (existingPractice.points_earned || 0);
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
          points_to_add: BASE_POINTS,
        });
      }

      // Check if this completes the CT section and trigger MIO feedback
      await checkSectionCompletion('T2', today);

      // Success! Navigate back to practice screen
      navigate('/mind-insurance/practice?section=VICTORY_LAP');
    } catch (err: unknown) {
      console.error('Error saving practice:', err);
      // Use centralized error sanitization
      setError(sanitizeErrorMessage(err));
      setLoading(false);
    }
  }

  // Check if form can be completed
  const canComplete = tomorrowGoal && morningRoutine && triggerPrevention && successVisualization && mindsetDeclaration;

  return (
    <div className="flex flex-col h-screen bg-mi-navy">
      {/* Header */}
      <div className="px-6 py-4 border-b border-mi-cyan/20 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">
            Tomorrow Setup
          </h1>
          <p className="text-sm text-mi-cyan">
            {BASE_POINTS} points
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/mind-insurance/practice?section=VICTORY_LAP')}
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
              <AlertDescription className="text-center text-gray-300">
                <span className="font-semibold text-mi-cyan">✓ Already Completed Today</span>
                <br />
                You've already completed this practice today. Come back tomorrow!
              </AlertDescription>
            </Alert>
          )}

          {/* Title Card */}
          <Card className="mb-6 bg-mi-cyan/10 border-mi-cyan/30">
            <CardHeader className="text-center">
              <div className="flex justify-center items-center gap-2 mb-2">
                <Sunrise className="h-8 w-8 text-mi-cyan" />
                <CardTitle className="text-xl text-white">Championship Preparation</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Champions prepare the night before
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Form Card */}
          <Card className="bg-mi-navy-light border-mi-cyan/20">
            <CardHeader>
              <CardTitle className="text-white">Set Up Tomorrow for Success</CardTitle>
              <CardDescription className="text-gray-400">
                Design your victory before it happens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tomorrow Goal */}
              <div>
                <Label htmlFor="tomorrow-goal" className="text-white">
                  What's your #1 priority for tomorrow?
                </Label>
                <p className="text-sm text-gray-400 mb-2">
                  The ONE thing that would make tomorrow a win
                </p>
                <Textarea
                  id="tomorrow-goal"
                  placeholder="Tomorrow's top priority is..."
                  value={tomorrowGoal}
                  onChange={(e) => setTomorrowGoal(e.target.value)}
                  className="mi-textarea min-h-[80px] resize-none"
                  disabled={loading || alreadyCompleted}
                />
              </div>

              {/* Morning Routine */}
              <div>
                <Label htmlFor="morning-routine" className="text-white">
                  What obstacles might you face?
                </Label>
                <p className="text-sm text-gray-400 mb-2">
                  Anticipate challenges before they happen
                </p>
                <Textarea
                  id="morning-routine"
                  placeholder="Potential obstacles include..."
                  value={morningRoutine}
                  onChange={(e) => setMorningRoutine(e.target.value)}
                  className="mi-textarea min-h-[80px] resize-none"
                  disabled={loading || alreadyCompleted}
                />
              </div>

              {/* Trigger Prevention */}
              <div>
                <Label htmlFor="trigger-prevention" className="text-white">
                  How will you prevent or handle triggers?
                </Label>
                <p className="text-sm text-gray-400 mb-2">
                  Your plan to stay on track when challenges arise
                </p>
                <Textarea
                  id="trigger-prevention"
                  placeholder="When triggers arise, I will..."
                  value={triggerPrevention}
                  onChange={(e) => setTriggerPrevention(e.target.value)}
                  className="mi-textarea min-h-[80px] resize-none"
                  disabled={loading || alreadyCompleted}
                />
              </div>

              {/* Success Visualization */}
              <div>
                <Label htmlFor="success-visualization" className="text-white">
                  Visualize tomorrow's success
                </Label>
                <p className="text-sm text-gray-400 mb-2">
                  See yourself winning before it happens
                </p>
                <Textarea
                  id="success-visualization"
                  placeholder="I see myself tomorrow..."
                  value={successVisualization}
                  onChange={(e) => setSuccessVisualization(e.target.value)}
                  className="mi-textarea min-h-[80px] resize-none"
                  disabled={loading || alreadyCompleted}
                />
              </div>

              {/* Mindset Declaration */}
              <div className="bg-mi-gold/10 border border-mi-gold/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-mi-gold" />
                  <Label htmlFor="mindset-declaration" className="text-base font-semibold text-white">
                    Your Championship Mindset
                  </Label>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  How will you show up as a champion tomorrow?
                </p>
                <Textarea
                  id="mindset-declaration"
                  placeholder="Tomorrow I will show up as a champion by..."
                  value={mindsetDeclaration}
                  onChange={(e) => setMindsetDeclaration(e.target.value)}
                  className="mi-textarea min-h-[100px] resize-none"
                  disabled={loading || alreadyCompleted}
                />
              </div>

              {/* Evening Routine Checklist (Optional, UI only) */}
              <Card className="bg-mi-navy border-mi-cyan/20">
                <CardHeader>
                  <CardTitle className="text-base text-white">Evening Routine Checklist</CardTitle>
                  <CardDescription className="text-sm text-gray-400">
                    Optional preparation steps (not tracked)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="clothes"
                      checked={clothesLaidOut}
                      onCheckedChange={(checked) => setClothesLaidOut(checked as boolean)}
                      disabled={loading || alreadyCompleted}
                      className="border-mi-cyan/50 data-[state=checked]:bg-mi-cyan data-[state=checked]:border-mi-cyan"
                    />
                    <Label htmlFor="clothes" className="text-sm font-normal cursor-pointer text-gray-300">
                      Lay out tomorrow's clothes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="workspace"
                      checked={workspacePrepared}
                      onCheckedChange={(checked) => setWorkspacePrepared(checked as boolean)}
                      disabled={loading || alreadyCompleted}
                      className="border-mi-cyan/50 data-[state=checked]:bg-mi-cyan data-[state=checked]:border-mi-cyan"
                    />
                    <Label htmlFor="workspace" className="text-sm font-normal cursor-pointer text-gray-300">
                      Prepare workspace/materials
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="alarm"
                      checked={alarmSet}
                      onCheckedChange={(checked) => setAlarmSet(checked as boolean)}
                      disabled={loading || alreadyCompleted}
                      className="border-mi-cyan/50 data-[state=checked]:bg-mi-cyan data-[state=checked]:border-mi-cyan"
                    />
                    <Label htmlFor="alarm" className="text-sm font-normal cursor-pointer text-gray-300">
                      Set alarm for morning practice
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="calendar"
                      checked={calendarReviewed}
                      onCheckedChange={(checked) => setCalendarReviewed(checked as boolean)}
                      disabled={loading || alreadyCompleted}
                      className="border-mi-cyan/50 data-[state=checked]:bg-mi-cyan data-[state=checked]:border-mi-cyan"
                    />
                    <Label htmlFor="calendar" className="text-sm font-normal cursor-pointer text-gray-300">
                      Review tomorrow's calendar
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Motivational Quote */}
              <Card className="bg-mi-navy border-mi-cyan/10">
                <CardContent className="pt-6">
                  <blockquote className="text-center space-y-2">
                    <p className="text-sm italic text-gray-400">
                      "Give me six hours to chop down a tree and I will spend the first four sharpening the axe."
                    </p>
                    <footer className="text-xs text-gray-500">
                      — Abraham Lincoln
                    </footer>
                  </blockquote>
                </CardContent>
              </Card>

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
      <div className="px-6 py-4 border-t border-mi-cyan/20 bg-mi-navy-light">
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
          ) : (
            <>
              <Sunrise className="mr-2 h-4 w-4" />
              Set Up Tomorrow for Success
            </>
          )}
        </Button>
      </div>
    </div>
  );
}