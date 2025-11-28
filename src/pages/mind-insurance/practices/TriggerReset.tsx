import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { X, Trophy, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Constants
const PRACTICE_TYPE = 'TRIGGER_RESET';
const BASE_POINTS = 2;

const RESET_METHODS = [
  { value: '4-7-8 Breathing', label: '4-7-8 Breathing', description: 'Inhale 4, hold 7, exhale 8 - instant nervous system reset' },
  { value: 'Body Reset', label: 'Body Reset', description: 'Physical movement to discharge trigger energy' },
  { value: 'Reframe Question', label: 'Reframe Question', description: '"What would my best self do in this moment?"' }
];

export default function TriggerReset() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [triggerDescription, setTriggerDescription] = useState('');
  const [intensityLevel, setIntensityLevel] = useState<number[]>([5]);
  const [oldResponse, setOldResponse] = useState('');
  const [resetMethod, setResetMethod] = useState('');
  const [newResponse, setNewResponse] = useState('');

  // User data
  const [userTimezone, setUserTimezone] = useState('America/New_York');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('timezone')
          .eq('id', user.id)
          .single();

        if (profile?.timezone) {
          setUserTimezone(profile.timezone);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  function getTodayDate(): string {
    return new Date().toLocaleDateString('en-CA', {
      timeZone: userTimezone
    });
  }

  async function handleComplete() {
    // Validate all fields
    if (!triggerDescription || !oldResponse || !resetMethod || !newResponse) {
      setError('Please complete all fields');
      return;
    }

    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const practiceDate = getTodayDate();

      // Check for existing practice today
      const { data: existingPractices } = await supabase
        .from('practice_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('practice_date', practiceDate)
        .eq('practice_type', PRACTICE_TYPE);

      const existingPractice = existingPractices?.[0];

      const practiceData = {
        trigger_description: triggerDescription,
        intensity_level: intensityLevel[0],
        old_response: oldResponse,
        reset_method: resetMethod,
        new_response: newResponse
      };

      if (existingPractice) {
        // Update existing practice
        const oldPoints = existingPractice.points_earned || 0;

        await supabase
          .from('practice_entries')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            points_earned: BASE_POINTS,
            is_late: false,
            data: practiceData
          })
          .eq('id', existingPractice.id);

        // Update user points (add difference)
        const pointsDifference = BASE_POINTS - oldPoints;
        if (pointsDifference > 0) {
          await supabase.rpc('increment_user_points', {
            user_id: userId,
            points_to_add: pointsDifference
          });
        }

        toast.success('Practice updated successfully!');
      } else {
        // Create new practice
        await supabase
          .from('practice_entries')
          .insert({
            user_id: userId,
            practice_date: practiceDate,
            practice_type: PRACTICE_TYPE,
            completed: true,
            completed_at: new Date().toISOString(),
            points_earned: BASE_POINTS,
            is_late: false,
            data: practiceData
          });

        // Update user points
        await supabase.rpc('increment_user_points', {
          user_id: userId,
          points_to_add: BASE_POINTS
        });

        toast.success('Practice completed successfully!');
      }

      // Navigate back to practice list
      navigate('/mind-insurance/practice');
    } catch (err: any) {
      console.error('Error saving practice:', err);
      setError(err.message || 'An error occurred while saving the practice');
      setLoading(false);
    }
  }

  const canComplete = triggerDescription && oldResponse && resetMethod && newResponse;

  return (
    <div className="min-h-screen bg-mi-navy">
      {/* Header */}
      <div className="px-6 py-4 border-b border-mi-cyan/20 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">
            Trigger Reset
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

      <div className="container max-w-2xl mx-auto p-6 space-y-6">
        {/* Title Card */}
        <Card className="bg-mi-cyan/10 border-mi-cyan/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-bold text-white mb-1">
                NASCAR Pit Stop - Trigger Reset
              </h2>
              <p className="text-sm text-gray-400">
                Interrupt old patterns with championship-level responses
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trigger Description */}
        <div className="space-y-2">
          <Label htmlFor="trigger-description" className="text-base font-semibold text-white">
            What triggered you right now?
          </Label>
          <Textarea
            id="trigger-description"
            placeholder="Describe what triggered you..."
            value={triggerDescription}
            onChange={(e) => setTriggerDescription(e.target.value)}
            className="mi-textarea min-h-[100px] resize-none"
          />
        </div>

        {/* Intensity Level */}
        <div className="space-y-3">
          <Label htmlFor="intensity-slider" className="text-base font-semibold text-white">
            Intensity Level: <span className="text-mi-cyan">{intensityLevel[0]}</span>
          </Label>
          <div className="px-2">
            <Slider
              id="intensity-slider"
              min={1}
              max={10}
              step={1}
              value={intensityLevel}
              onValueChange={setIntensityLevel}
              className="w-full [&_[role=slider]]:bg-mi-cyan [&_[role=slider]]:border-mi-cyan [&_.bg-primary]:bg-mi-cyan"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 (Low)</span>
              <span>10 (High)</span>
            </div>
          </div>
        </div>

        {/* Old Response Pattern */}
        <div className="space-y-2">
          <Label htmlFor="old-response" className="text-base font-semibold text-white">
            Your Old Response Pattern
          </Label>
          <p className="text-sm text-gray-400">
            How would you normally react to this trigger?
          </p>
          <Textarea
            id="old-response"
            placeholder="Describe your typical response..."
            value={oldResponse}
            onChange={(e) => setOldResponse(e.target.value)}
            className="mi-textarea min-h-[100px] resize-none"
          />
        </div>

        {/* Reset Method */}
        <div className="space-y-2">
          <Label htmlFor="reset-method" className="text-base font-semibold text-white">
            Choose Your Reset Method
          </Label>
          <Select value={resetMethod} onValueChange={setResetMethod}>
            <SelectTrigger id="reset-method" className="mi-select">
              <SelectValue placeholder="Select a reset method..." />
            </SelectTrigger>
            <SelectContent className="bg-mi-navy-light border-mi-cyan/20">
              {RESET_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value} className="text-gray-300 focus:bg-mi-cyan/20 focus:text-white">
                  <div className="flex flex-col">
                    <span className="font-medium">{method.label}</span>
                    <span className="text-xs text-gray-400">
                      {method.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Additional Techniques */}
        <Card className="bg-mi-navy-light border-mi-cyan/20">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white mb-1">
                Physical Anchor
              </h3>
              <p className="text-sm text-gray-400">
                Touch thumb to finger while saying "Reset"
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">
                Champion Visualization
              </h3>
              <p className="text-sm text-gray-400">
                See yourself handling this like a champion
              </p>
            </div>
          </CardContent>
        </Card>

        {/* New Championship Response */}
        <Card className="bg-mi-gold/10 border-mi-gold/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-mi-gold" />
              <CardTitle className="text-lg text-white">
                Your NEW Championship Response
              </CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              How will you respond like a champion moving forward?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="new-response"
              placeholder="Describe your new championship response..."
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              className="mi-textarea min-h-[120px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          className="w-full mi-btn-primary"
          size="lg"
          onClick={handleComplete}
          disabled={!canComplete || loading}
        >
          {loading ? (
            'Saving...'
          ) : canComplete ? (
            'Complete Practice'
          ) : (
            'Complete All Fields to Finish'
          )}
        </Button>
      </div>
    </div>
  );
}