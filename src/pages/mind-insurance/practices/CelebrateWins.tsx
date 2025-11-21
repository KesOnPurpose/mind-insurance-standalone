import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Sparkles, Heart, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

// Victory celebration options with animations
const VICTORY_CELEBRATIONS = [
  {
    value: 'victory_pose',
    label: 'Victory Pose',
    icon: Trophy,
    emoji: '🏆',
    animation: { scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }
  },
  {
    value: 'champion_affirmation',
    label: 'Champion Affirmation',
    icon: Star,
    emoji: '⭐',
    animation: { y: [0, -10, 0], scale: [1, 1.1, 1] }
  },
  {
    value: 'victory_dance',
    label: 'Victory Dance',
    icon: Sparkles,
    emoji: '💃',
    animation: { rotate: [0, 360], scale: [1, 1.1, 1] }
  },
  {
    value: 'self_high_five',
    label: 'Self High-Five',
    icon: Heart,
    emoji: '🙌',
    animation: { scale: [1, 1.3, 0.9, 1], rotate: [0, -5, 5, 0] }
  },
  {
    value: 'champion_breath',
    label: 'Champion Breath',
    icon: Zap,
    emoji: '💨',
    animation: { scale: [1, 1.2, 1, 1.2, 1] }
  }
];

export default function CelebrateWins() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [championshipWin, setChampionshipWin] = useState('');
  const [microVictory, setMicroVictory] = useState('');
  const [futureSelfEvidence, setFutureSelfEvidence] = useState('');
  const [championshipGratitude, setChampionshipGratitude] = useState('');
  const [victoryCelebration, setVictoryCelebration] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  // Validate form
  const isFormValid = () => {
    return (
      championshipWin.trim() !== '' &&
      microVictory.trim() !== '' &&
      futureSelfEvidence.trim() !== '' &&
      championshipGratitude.trim() !== '' &&
      victoryCelebration !== ''
    );
  };

  // Handle celebration selection with animation
  const handleCelebrationSelect = (value: string) => {
    setVictoryCelebration(value);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);
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

      const points = 2;
      const practiceDate = new Date().toISOString().split('T')[0];

      // Check for existing practice today
      const { data: existingPractices, error: fetchError } = await supabase
        .from('practices')
        .select('*')
        .eq('user_id', user.id)
        .eq('practice_type', 'celebrate_wins')
        .eq('practice_date', practiceDate);

      if (fetchError) throw fetchError;

      const practiceData = {
        championship_win: championshipWin,
        micro_victory: microVictory,
        future_self_evidence: futureSelfEvidence,
        championship_gratitude: championshipGratitude,
        victory_celebration: victoryCelebration
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
            practice_type: 'celebrate_wins',
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

      // Show celebration animation before navigating
      setShowCelebration(true);

      toast({
        title: '🎉 Victory Lap Complete!',
        description: `You earned ${points} points. Keep celebrating those wins!`,
      });

      setTimeout(() => {
        navigate('/mind-insurance/practices');
      }, 1500);

    } catch (err: any) {
      console.error('Error saving practice:', err);
      setError(err.message || 'An error occurred while saving your practice');
    } finally {
      setLoading(false);
    }
  };

  const selectedCelebration = VICTORY_CELEBRATIONS.find(c => c.value === victoryCelebration);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
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
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                  Celebrate Wins
                </h1>
                <p className="text-sm text-gray-600">Victory lap for today's achievements</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              2 points
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Victory Banner */}
        <Card className="border-yellow-300 bg-gradient-to-r from-yellow-100 to-orange-100">
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="h-12 w-12 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Victory Lap Time!</h2>
            <p className="text-gray-700">
              Champions celebrate progress, not just perfection
            </p>
          </CardContent>
        </Card>

        {/* Championship Win */}
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="championship-win" className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Today's Championship Win
            </Label>
            <p className="text-sm text-gray-600 mb-4">
              What's your biggest victory today? Big or small - all progress counts!
            </p>
            <Textarea
              id="championship-win"
              value={championshipWin}
              onChange={(e) => setChampionshipWin(e.target.value)}
              placeholder="Today I accomplished..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Micro Victory */}
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="micro-victory" className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Micro Victory
            </Label>
            <p className="text-sm text-gray-600 mb-4">
              What small win made you smile today?
            </p>
            <Textarea
              id="micro-victory"
              value={microVictory}
              onChange={(e) => setMicroVictory(e.target.value)}
              placeholder="A small victory that matters..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Future Self Evidence */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <Label htmlFor="future-self-evidence" className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              Evidence of Identity Shift
            </Label>
            <p className="text-sm text-gray-600 mb-4">
              How does this victory prove your new identity?
            </p>
            <Textarea
              id="future-self-evidence"
              value={futureSelfEvidence}
              onChange={(e) => setFutureSelfEvidence(e.target.value)}
              placeholder="This proves I am someone who..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Championship Gratitude */}
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="championship-gratitude" className="text-lg font-semibold flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              Championship Gratitude
            </Label>
            <p className="text-sm text-gray-600 mb-4">
              What are you grateful for today?
            </p>
            <Textarea
              id="championship-gratitude"
              value={championshipGratitude}
              onChange={(e) => setChampionshipGratitude(e.target.value)}
              placeholder="I'm grateful for..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Victory Celebration */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <Label className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-purple-600" />
              How Will You Celebrate This Win?
            </Label>
            <RadioGroup value={victoryCelebration} onValueChange={handleCelebrationSelect}>
              <div className="space-y-3">
                {VICTORY_CELEBRATIONS.map((celebration) => {
                  const Icon = celebration.icon;
                  return (
                    <div key={celebration.value} className="relative">
                      <div className="flex items-center space-x-3 p-3 rounded-lg border-2 hover:border-purple-400 transition-colors cursor-pointer">
                        <RadioGroupItem value={celebration.value} id={celebration.value} />
                        <Label
                          htmlFor={celebration.value}
                          className="flex items-center gap-3 cursor-pointer flex-1"
                        >
                          <Icon className="h-5 w-5 text-purple-600" />
                          <span className="font-medium">{celebration.label}</span>
                          <span className="text-2xl ml-auto">{celebration.emoji}</span>
                        </Label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Motivational Quote */}
        <Card className="bg-gradient-to-r from-indigo-100 to-purple-100">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-700 italic text-lg">
              "Success is the sum of small efforts repeated day in and day out."
            </p>
            <p className="text-sm text-gray-600 mt-2">
              - Robert Collier
            </p>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pb-6">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!isFormValid() || loading}
            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
          >
            {loading ? (
              'Saving Victory...'
            ) : (
              <>
                <Trophy className="mr-2 h-5 w-5" />
                Celebrate This Victory!
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Celebration Animation Overlay */}
      <AnimatePresence>
        {showCelebration && selectedCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <motion.div
              animate={selectedCelebration.animation}
              transition={{ duration: 0.5 }}
              className="text-8xl"
            >
              {selectedCelebration.emoji}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}