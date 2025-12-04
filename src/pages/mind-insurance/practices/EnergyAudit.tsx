import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Quick pick options for energy drains
const ENERGY_DRAINS_QUICK_PICKS = [
  'Social media',
  'Negative self-talk',
  'Poor sleep',
  'Toxic relationships',
  'Overcommitments',
  'Clutter',
  'News/media',
  'Procrastination',
  'Lack of boundaries',
  'Perfectionism',
  'Comparison',
  'Financial stress'
];

// Quick pick options for energy boosters
const ENERGY_BOOSTERS_QUICK_PICKS = [
  'Morning sunlight',
  'Exercise',
  'Meditation',
  'Good sleep',
  'Healthy eating',
  'Nature walks',
  'Music',
  'Creative activities',
  'Quality time with loved ones',
  'Learning new skills',
  'Gratitude practice',
  'Deep breathing'
];

export default function EnergyAudit() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [energyLevel, setEnergyLevel] = useState([5]);
  const [energyDrains, setEnergyDrains] = useState<string[]>([]);
  const [customDrain, setCustomDrain] = useState('');
  const [energyBoosters, setEnergyBoosters] = useState<string[]>([]);
  const [customBooster, setCustomBooster] = useState('');
  const [eliminateCommitment, setEliminateCommitment] = useState('');
  const [addCommitment, setAddCommitment] = useState('');
  const [optimizeCommitment, setOptimizeCommitment] = useState('');
  const [userTimezone, setUserTimezone] = useState('America/New_York');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load user timezone on mount
  useEffect(() => {
    loadUserTimezone();
  }, []);

  async function loadUserTimezone() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

  // Toggle energy drain selection
  const toggleDrain = (drain: string) => {
    setEnergyDrains(prev =>
      prev.includes(drain)
        ? prev.filter(d => d !== drain)
        : [...prev, drain]
    );
  };

  // Toggle energy booster selection
  const toggleBooster = (booster: string) => {
    setEnergyBoosters(prev =>
      prev.includes(booster)
        ? prev.filter(b => b !== booster)
        : [...prev, booster]
    );
  };

  // Add custom energy drain
  const addCustomDrain = () => {
    if (customDrain.trim() && !energyDrains.includes(customDrain.trim())) {
      setEnergyDrains(prev => [...prev, customDrain.trim()]);
      setCustomDrain('');
    }
  };

  // Add custom energy booster
  const addCustomBooster = () => {
    if (customBooster.trim() && !energyBoosters.includes(customBooster.trim())) {
      setEnergyBoosters(prev => [...prev, customBooster.trim()]);
      setCustomBooster('');
    }
  };

  // Remove a selected drain
  const removeDrain = (drain: string) => {
    setEnergyDrains(prev => prev.filter(d => d !== drain));
  };

  // Remove a selected booster
  const removeBooster = (booster: string) => {
    setEnergyBoosters(prev => prev.filter(b => b !== booster));
  };

  // Validate form
  const isFormValid = () => {
    return (
      energyDrains.length > 0 &&
      energyBoosters.length > 0 &&
      eliminateCommitment.trim() !== '' &&
      addCommitment.trim() !== '' &&
      optimizeCommitment.trim() !== ''
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid()) {
      setError('Please complete all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not found');
      }

      const points = 4;
      const practiceDate = new Date().toLocaleDateString('en-CA', {
        timeZone: userTimezone
      });

      // Check for existing practice today
      const { data: existingPractices, error: fetchError } = await supabase
        .from('daily_practices')
        .select('*')
        .eq('user_id', user.id)
        .eq('practice_type', 'E')
        .eq('practice_date', practiceDate);

      if (fetchError) throw fetchError;

      const practiceData = {
        energy_level: energyLevel[0],
        energy_drains: energyDrains,
        energy_boosters: energyBoosters,
        eliminate_commitment: eliminateCommitment,
        add_commitment: addCommitment,
        optimize_commitment: optimizeCommitment
      };

      if (existingPractices && existingPractices.length > 0) {
        // Update existing practice
        const { error: updateError } = await supabase
          .from('daily_practices')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            points_earned: points,
            is_late: false,
            data: practiceData
          })
          .eq('id', existingPractices[0].id);

        if (updateError) throw updateError;
      } else {
        // Create new practice
        const { error: insertError } = await supabase
          .from('daily_practices')
          .insert({
            user_id: user.id,
            practice_date: practiceDate,
            practice_type: 'E',
            completed: true,
            completed_at: new Date().toISOString(),
            points_earned: points,
            is_late: false,
            data: practiceData
          });

        if (insertError) throw insertError;
      }

      // Update user points
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('total_points')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('user_profiles')
          .update({
            total_points: (profile.total_points || 0) + points
          })
          .eq('user_id', user.id);
      }

      toast({
        title: 'Energy Audit Complete!',
        description: `You earned ${points} points.`,
      });

      navigate('/mind-insurance/practice');
    } catch (err: any) {
      console.error('Error saving practice:', err);
      setError(err.message || 'An error occurred while saving your practice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mi-navy">
      {/* Header */}
      <div className="bg-mi-navy-light border-b border-mi-cyan/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/mind-insurance/practice')}
                className="text-gray-400 hover:text-white hover:bg-mi-navy"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Energy Audit</h1>
                <p className="text-sm text-mi-cyan">Optimize your energy management</p>
              </div>
            </div>
            <Badge className="text-lg px-3 py-1 bg-mi-cyan/20 text-mi-cyan border border-mi-cyan/30">
              4 points
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Energy Level */}
        <Card className="bg-mi-navy-light border-mi-cyan/20">
          <CardContent className="pt-6">
            <Label htmlFor="energy-level" className="text-lg font-semibold text-white">
              Current Energy Level
            </Label>
            <p className="text-sm text-gray-400 mb-4">
              Rate your current energy on a scale from 1 (exhausted) to 10 (fully energized)
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-400">1</span>
              <Slider
                id="energy-level"
                value={energyLevel}
                onValueChange={setEnergyLevel}
                min={1}
                max={10}
                step={1}
                className="flex-1 [&_[role=slider]]:bg-mi-cyan [&_[role=slider]]:border-mi-cyan [&_.bg-primary]:bg-mi-cyan"
              />
              <span className="text-sm font-medium text-gray-400">10</span>
              <Badge className="min-w-[3rem] justify-center bg-mi-cyan/20 text-mi-cyan border border-mi-cyan/30">
                {energyLevel[0]}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Energy Drains */}
        <Card className="border-red-500/30 bg-red-950/30">
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold mb-2 text-white">⚡ Energy Drains</h3>
            <p className="text-sm text-gray-400 mb-4">
              What's draining your energy right now? Select all that apply or add your own.
            </p>

            {/* Quick picks */}
            <div className="flex flex-wrap gap-2 mb-4">
              {ENERGY_DRAINS_QUICK_PICKS.map((drain) => (
                <Badge
                  key={drain}
                  variant={energyDrains.includes(drain) ? 'destructive' : 'outline'}
                  className={`cursor-pointer ${
                    energyDrains.includes(drain)
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'border-red-500/30 text-gray-300 hover:bg-red-500/20'
                  }`}
                  onClick={() => toggleDrain(drain)}
                >
                  {drain}
                </Badge>
              ))}
            </div>

            {/* Add custom */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Add custom drain..."
                value={customDrain}
                onChange={(e) => setCustomDrain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomDrain()}
                className="mi-input"
              />
              <Button onClick={addCustomDrain} size="icon" className="bg-mi-navy border border-mi-cyan/30 hover:bg-mi-cyan/20 text-gray-300">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected drains */}
            {energyDrains.length > 0 && (
              <div className="border-t border-red-500/20 pt-3">
                <p className="text-sm text-gray-400 mb-2">Selected drains:</p>
                <div className="flex flex-wrap gap-2">
                  {energyDrains.map((drain) => (
                    <Badge key={drain} variant="destructive" className="pr-1 bg-red-600">
                      {drain}
                      <button
                        onClick={() => removeDrain(drain)}
                        className="ml-2 hover:bg-red-700 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Energy Boosters */}
        <Card className="border-mi-cyan/30 bg-mi-cyan/10">
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold mb-2 text-white">⚡ Energy Boosters</h3>
            <p className="text-sm text-gray-400 mb-4">
              What gives you energy? Select all that apply or add your own.
            </p>

            {/* Quick picks */}
            <div className="flex flex-wrap gap-2 mb-4">
              {ENERGY_BOOSTERS_QUICK_PICKS.map((booster) => (
                <Badge
                  key={booster}
                  className={`cursor-pointer ${
                    energyBoosters.includes(booster)
                      ? 'bg-mi-cyan hover:bg-mi-cyan/80 text-mi-navy'
                      : 'bg-transparent border border-mi-cyan/30 text-gray-300 hover:bg-mi-cyan/20'
                  }`}
                  onClick={() => toggleBooster(booster)}
                >
                  {booster}
                </Badge>
              ))}
            </div>

            {/* Add custom */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Add custom booster..."
                value={customBooster}
                onChange={(e) => setCustomBooster(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomBooster()}
                className="mi-input"
              />
              <Button onClick={addCustomBooster} size="icon" className="bg-mi-navy border border-mi-cyan/30 hover:bg-mi-cyan/20 text-gray-300">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected boosters */}
            {energyBoosters.length > 0 && (
              <div className="border-t border-mi-cyan/20 pt-3">
                <p className="text-sm text-gray-400 mb-2">Selected boosters:</p>
                <div className="flex flex-wrap gap-2">
                  {energyBoosters.map((booster) => (
                    <Badge
                      key={booster}
                      className="pr-1 bg-mi-cyan hover:bg-mi-cyan/80 text-mi-navy"
                    >
                      {booster}
                      <button
                        onClick={() => removeBooster(booster)}
                        className="ml-2 hover:bg-mi-cyan/60 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commitments */}
        <Card className="bg-mi-navy-light border-mi-cyan/20">
          <CardContent className="pt-6 space-y-6">
            <div>
              <Label htmlFor="eliminate" className="text-base font-semibold text-white">
                What will you ELIMINATE? 🗑️
              </Label>
              <p className="text-sm text-gray-400 mb-2">
                Choose one energy drain to remove from your life this week
              </p>
              <Textarea
                id="eliminate"
                placeholder="I will eliminate..."
                value={eliminateCommitment}
                onChange={(e) => setEliminateCommitment(e.target.value)}
                rows={3}
                className="mi-textarea resize-none"
              />
            </div>

            <div>
              <Label htmlFor="add" className="text-base font-semibold text-white">
                What will you ADD? ✨
              </Label>
              <p className="text-sm text-gray-400 mb-2">
                Choose one energy booster to incorporate this week
              </p>
              <Textarea
                id="add"
                placeholder="I will add..."
                value={addCommitment}
                onChange={(e) => setAddCommitment(e.target.value)}
                rows={3}
                className="mi-textarea resize-none"
              />
            </div>

            <div>
              <Label htmlFor="optimize" className="text-base font-semibold text-white">
                What will you OPTIMIZE? ⚙️
              </Label>
              <p className="text-sm text-gray-400 mb-2">
                Choose one existing routine or habit to improve
              </p>
              <Textarea
                id="optimize"
                placeholder="I will optimize..."
                value={optimizeCommitment}
                onChange={(e) => setOptimizeCommitment(e.target.value)}
                rows={3}
                className="mi-textarea resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit button */}
        <div className="pb-8">
          <Button
            className="w-full mi-btn-primary"
            size="lg"
            onClick={handleSubmit}
            disabled={loading || !isFormValid()}
          >
            {loading ? 'Saving...' : 'Complete Energy Audit'}
          </Button>
        </div>
      </div>
    </div>
  );
}