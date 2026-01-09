import { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useSectionCompletion } from '@/hooks/useSectionCompletion';
import { supabase } from '@/integrations/supabase/client';
import { getSafeTodayDate, sanitizeErrorMessage } from '@/utils/safeDateUtils';

// Protocol-aware components
import { ProtocolCheckIn, ProtocolCheckInCompleted, type ProtocolCheckInData } from '@/components/protect';
import { getActiveInsightProtocol, completeProtocolDay } from '@/services/mioInsightProtocolService';
import type { MIOInsightProtocolWithProgress } from '@/types/protocol';
// import { motion, AnimatePresence } from 'framer-motion'; // Package not installed

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
  const { user, loading: authLoading } = useAuth();
  const { checkCompletion } = useSectionCompletion();

  // Form state
  const [championshipWin, setChampionshipWin] = useState('');
  const [microVictory, setMicroVictory] = useState('');
  const [futureSelfEvidence, setFutureSelfEvidence] = useState('');
  const [championshipGratitude, setChampionshipGratitude] = useState('');
  const [victoryCelebration, setVictoryCelebration] = useState('');
  // Use browser's detected timezone as default (more accurate than hardcoded value)
  const [userTimezone, setUserTimezone] = useState(() =>
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  );

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  // Protocol-aware state
  const [activeProtocol, setActiveProtocol] = useState<MIOInsightProtocolWithProgress | null>(null);
  const [protocolLoading, setProtocolLoading] = useState(true);
  const [protocolCheckInData, setProtocolCheckInData] = useState<ProtocolCheckInData | null>(null);

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

  // Load user timezone on mount
  useEffect(() => {
    loadUserTimezone();
  }, []);

  // Fetch active protocol on mount
  useEffect(() => {
    async function fetchProtocol() {
      if (!user?.id) {
        setProtocolLoading(false);
        return;
      }
      try {
        const protocol = await getActiveInsightProtocol(user.id);
        setActiveProtocol(protocol);
      } catch (err) {
        console.error('[CelebrateWins] Error fetching protocol:', err);
      } finally {
        setProtocolLoading(false);
      }
    }
    fetchProtocol();
  }, [user?.id]);

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

  // Validate form - includes protocol check-in validation if active protocol exists
  const isFormValid = () => {
    const baseFormValid = (
      championshipWin.trim() !== '' &&
      microVictory.trim() !== '' &&
      futureSelfEvidence.trim() !== '' &&
      championshipGratitude.trim() !== '' &&
      victoryCelebration !== ''
    );

    // If there's an active protocol that's not completed today, require protocol check-in
    if (activeProtocol && !activeProtocol.is_today_completed) {
      return baseFormValid && protocolCheckInData !== null;
    }

    return baseFormValid;
  };

  // Handler for protocol check-in data changes
  const handleProtocolCheckInChange = useCallback((data: ProtocolCheckInData | null) => {
    setProtocolCheckInData(data);
  }, []);

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
      const practiceDate = getSafeTodayDate(userTimezone);

      // Check for existing practice today
      const { data: existingPractices, error: fetchError } = await supabase
        .from('daily_practices')
        .select('*')
        .eq('user_id', user.id)
        .eq('practice_type', 'C')
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
            practice_type: 'C',
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
          .eq('id', user.id); // user_profiles.id matches auth user id
      }

      // If there's protocol check-in data, complete the protocol day
      if (protocolCheckInData) {
        try {
          await completeProtocolDay({
            protocol_id: protocolCheckInData.protocol_id,
            day_number: protocolCheckInData.day_number,
            response_data: {
              practice_response: protocolCheckInData.practice_response,
              moment_captured: protocolCheckInData.moment_captured,
              insight_captured: protocolCheckInData.insight_captured,
            },
            notes: protocolCheckInData.moment_captured,
          });
          console.log('[CelebrateWins] Protocol day completed successfully');
        } catch (protocolErr) {
          console.error('[CelebrateWins] Error completing protocol day:', protocolErr);
          // Don't fail the whole submission if protocol completion fails
        }
      }

      // Show celebration animation before navigating
      setShowCelebration(true);

      toast({
        title: '🎉 Victory Lap Complete!',
        description: protocolCheckInData
          ? `You earned ${points} points and completed your protocol check-in!`
          : `You earned ${points} points. Keep celebrating those wins!`,
      });

      // Check if this completes the CT section and trigger MIO feedback
      await checkCompletion('C', practiceDate);

      setTimeout(() => {
        navigate('/mind-insurance/practice?section=VICTORY_LAP');
      }, 1500);

    } catch (err: unknown) {
      console.error('Error saving practice:', err);
      // Use centralized error sanitization
      setError(sanitizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const selectedCelebration = VICTORY_CELEBRATIONS.find(c => c.value === victoryCelebration);

  return (
    <div className="min-h-screen bg-mi-navy">
      {/* Header */}
      <div className="bg-mi-navy-light border-b border-mi-gold/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/mind-insurance/practice?section=VICTORY_LAP')}
                className="text-gray-400 hover:text-white hover:bg-mi-navy"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                  <Trophy className="h-6 w-6 text-mi-gold" />
                  Celebrate Wins
                </h1>
                <p className="text-sm text-mi-gold">Victory lap for today's achievements</p>
              </div>
            </div>
            <Badge className="text-lg px-3 py-1 bg-mi-gold/20 text-mi-gold border border-mi-gold/30">
              2 points
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Victory Banner */}
        <Card className="border-mi-gold/30 bg-mi-gold/10">
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="h-12 w-12 text-mi-gold" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Victory Lap Time!</h2>
            <p className="text-gray-300">
              Champions celebrate progress, not just perfection
            </p>
          </CardContent>
        </Card>

        {/* Protocol Check-In Section - Only show if there's an active protocol */}
        {activeProtocol && !activeProtocol.is_today_completed && (
          <ProtocolCheckIn
            protocol={activeProtocol}
            isLoading={protocolLoading}
            onChange={handleProtocolCheckInChange}
          />
        )}

        {/* Protocol Already Completed Today */}
        {activeProtocol && activeProtocol.is_today_completed && (
          <ProtocolCheckInCompleted protocol={activeProtocol} />
        )}

        {/* Championship Win */}
        <Card className="bg-mi-navy-light border-mi-cyan/20">
          <CardContent className="pt-6">
            <Label htmlFor="championship-win" className="text-lg font-semibold flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-mi-gold" />
              Today's Championship Win
            </Label>
            <p className="text-sm text-gray-400 mb-4">
              What's your biggest victory today? Big or small - all progress counts!
            </p>
            <Textarea
              id="championship-win"
              value={championshipWin}
              onChange={(e) => setChampionshipWin(e.target.value)}
              placeholder="Today I accomplished..."
              className="mi-textarea min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Micro Victory */}
        <Card className="bg-mi-navy-light border-mi-cyan/20">
          <CardContent className="pt-6">
            <Label htmlFor="micro-victory" className="text-lg font-semibold flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-mi-cyan" />
              Micro Victory
            </Label>
            <p className="text-sm text-gray-400 mb-4">
              What small win made you smile today?
            </p>
            <Textarea
              id="micro-victory"
              value={microVictory}
              onChange={(e) => setMicroVictory(e.target.value)}
              placeholder="A small victory that matters..."
              className="mi-textarea min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Future Self Evidence */}
        <Card className="border-mi-cyan/30 bg-mi-cyan/10">
          <CardContent className="pt-6">
            <Label htmlFor="future-self-evidence" className="text-lg font-semibold flex items-center gap-2 text-white">
              <Star className="h-5 w-5 text-mi-cyan" />
              Evidence of Identity Shift
            </Label>
            <p className="text-sm text-gray-400 mb-4">
              How does this victory prove your new identity?
            </p>
            <Textarea
              id="future-self-evidence"
              value={futureSelfEvidence}
              onChange={(e) => setFutureSelfEvidence(e.target.value)}
              placeholder="This proves I am someone who..."
              className="mi-textarea min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Championship Gratitude */}
        <Card className="bg-mi-navy-light border-mi-cyan/20">
          <CardContent className="pt-6">
            <Label htmlFor="championship-gratitude" className="text-lg font-semibold flex items-center gap-2 text-white">
              <Heart className="h-5 w-5 text-pink-400" />
              Championship Gratitude
            </Label>
            <p className="text-sm text-gray-400 mb-4">
              What are you grateful for today?
            </p>
            <Textarea
              id="championship-gratitude"
              value={championshipGratitude}
              onChange={(e) => setChampionshipGratitude(e.target.value)}
              placeholder="I'm grateful for..."
              className="mi-textarea min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Victory Celebration */}
        <Card className="border-mi-gold/30 bg-mi-gold/10">
          <CardContent className="pt-6">
            <Label className="text-lg font-semibold flex items-center gap-2 mb-4 text-white">
              <Zap className="h-5 w-5 text-mi-gold" />
              How Will You Celebrate This Win?
            </Label>
            <RadioGroup value={victoryCelebration} onValueChange={handleCelebrationSelect}>
              <div className="space-y-3">
                {VICTORY_CELEBRATIONS.map((celebration) => {
                  const Icon = celebration.icon;
                  return (
                    <div key={celebration.value} className="relative">
                      <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-mi-gold/20 hover:border-mi-gold/50 transition-colors cursor-pointer bg-mi-navy">
                        <RadioGroupItem value={celebration.value} id={celebration.value} className="border-mi-gold/50 text-mi-gold" />
                        <Label
                          htmlFor={celebration.value}
                          className="flex items-center gap-3 cursor-pointer flex-1 text-gray-300"
                        >
                          <Icon className="h-5 w-5 text-mi-gold" />
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
        <Card className="bg-mi-navy-light border-mi-cyan/20">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-300 italic text-lg">
              "Success is the sum of small efforts repeated day in and day out."
            </p>
            <p className="text-sm text-gray-400 mt-2">
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
            className="mi-btn-gold"
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
      {showCelebration && selectedCelebration && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-8xl animate-bounce">
            {selectedCelebration.emoji}
          </div>
        </div>
      )}
    </div>
  );
}