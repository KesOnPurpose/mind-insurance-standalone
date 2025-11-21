import { useState } from 'react';
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

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const practiceDate = new Date().toISOString().split('T')[0];

      // Check for existing practice today
      const { data: existingPractices, error: fetchError } = await supabase
        .from('practices')
        .select('*')
        .eq('user_id', user.id)
        .eq('practice_type', 'energy_audit')
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
          .from('practices')
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
          .from('practices')
          .insert({
            user_id: user.id,
            practice_date: practiceDate,
            practice_type: 'energy_audit',
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
        .eq('user_id', user.id)
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

      navigate('/mind-insurance/practices');
    } catch (err: any) {
      console.error('Error saving practice:', err);
      setError(err.message || 'An error occurred while saving your practice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/mind-insurance/practices')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Energy Audit</h1>
                <p className="text-sm text-gray-600">Optimize your energy management</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              4 points
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Energy Level */}
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="energy-level" className="text-lg font-semibold">
              Current Energy Level
            </Label>
            <p className="text-sm text-gray-600 mb-4">
              Rate your current energy on a scale from 1 (exhausted) to 10 (fully energized)
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">1</span>
              <Slider
                id="energy-level"
                value={energyLevel}
                onValueChange={setEnergyLevel}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium">10</span>
              <Badge variant="outline" className="min-w-[3rem] justify-center">
                {energyLevel[0]}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Energy Drains */}
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold mb-2">⚡ Energy Drains</h3>
            <p className="text-sm text-gray-600 mb-4">
              What's draining your energy right now? Select all that apply or add your own.
            </p>

            {/* Quick picks */}
            <div className="flex flex-wrap gap-2 mb-4">
              {ENERGY_DRAINS_QUICK_PICKS.map((drain) => (
                <Badge
                  key={drain}
                  variant={energyDrains.includes(drain) ? 'destructive' : 'outline'}
                  className="cursor-pointer"
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
              />
              <Button onClick={addCustomDrain} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected drains */}
            {energyDrains.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 mb-2">Selected drains:</p>
                <div className="flex flex-wrap gap-2">
                  {energyDrains.map((drain) => (
                    <Badge key={drain} variant="destructive" className="pr-1">
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
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold mb-2">⚡ Energy Boosters</h3>
            <p className="text-sm text-gray-600 mb-4">
              What gives you energy? Select all that apply or add your own.
            </p>

            {/* Quick picks */}
            <div className="flex flex-wrap gap-2 mb-4">
              {ENERGY_BOOSTERS_QUICK_PICKS.map((booster) => (
                <Badge
                  key={booster}
                  variant={energyBoosters.includes(booster) ? 'default' : 'outline'}
                  className={`cursor-pointer ${
                    energyBoosters.includes(booster) ? 'bg-green-600 hover:bg-green-700' : ''
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
              />
              <Button onClick={addCustomBooster} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected boosters */}
            {energyBoosters.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 mb-2">Selected boosters:</p>
                <div className="flex flex-wrap gap-2">
                  {energyBoosters.map((booster) => (
                    <Badge
                      key={booster}
                      className="pr-1 bg-green-600 hover:bg-green-700"
                    >
                      {booster}
                      <button
                        onClick={() => removeBooster(booster)}
                        className="ml-2 hover:bg-green-800 rounded-full p-0.5"
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
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <Label htmlFor="eliminate" className="text-base font-semibold">
                What will you ELIMINATE? 🗑️
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                Choose one energy drain to remove from your life this week
              </p>
              <Textarea
                id="eliminate"
                placeholder="I will eliminate..."
                value={eliminateCommitment}
                onChange={(e) => setEliminateCommitment(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="add" className="text-base font-semibold">
                What will you ADD? ✨
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                Choose one energy booster to incorporate this week
              </p>
              <Textarea
                id="add"
                placeholder="I will add..."
                value={addCommitment}
                onChange={(e) => setAddCommitment(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="optimize" className="text-base font-semibold">
                What will you OPTIMIZE? ⚙️
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                Choose one existing routine or habit to improve
              </p>
              <Textarea
                id="optimize"
                placeholder="I will optimize..."
                value={optimizeCommitment}
                onChange={(e) => setOptimizeCommitment(e.target.value)}
                rows={3}
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
            className="w-full"
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