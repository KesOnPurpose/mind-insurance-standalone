import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Shield,
  Trophy,
  Target,
  Flame,
  Calendar,
  Brain,
  ArrowLeft,
  Loader2,
  ChevronRight,
  Award,
  Zap,
  Clock,
  Mail,
  Settings,
  Archive
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityCollisionStatus } from '@/hooks/useIdentityCollisionStatus';
import { useMindInsuranceProgress } from '@/hooks/useMindInsuranceProgress';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

// Pattern display helpers
const getPatternDisplayName = (pattern: string): string => {
  const patterns: Record<string, string> = {
    'past_prison': 'Past Prison',
    'success_sabotage': 'Success Sabotage',
    'compass_crisis': 'Compass Crisis'
  };
  return patterns[pattern] || pattern;
};

const getPatternIcon = (pattern: string): string => {
  const icons: Record<string, string> = {
    'past_prison': '⛓️',
    'success_sabotage': '🎯',
    'compass_crisis': '🧭'
  };
  return icons[pattern] || '🧠';
};

const getPatternDescription = (pattern: string): string => {
  const descriptions: Record<string, string> = {
    'past_prison': 'Your past experiences may be holding you back from your full potential. The PROTECT practices will help you break free.',
    'success_sabotage': 'You may unconsciously undermine your own success when things are going well. PROTECT helps you recognize and overcome this pattern.',
    'compass_crisis': 'You may struggle with direction and purpose, making it hard to stay committed. PROTECT helps you find your true north.'
  };
  return descriptions[pattern] || 'Your unique pattern has been identified through the Identity Collision Assessment.';
};

const getChampionshipColor = (level: string): string => {
  const colors: Record<string, string> = {
    'bronze': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'silver': 'bg-gray-400/20 text-gray-300 border-gray-400/30',
    'gold': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'platinum': 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30'
  };
  return colors[level.toLowerCase()] || 'bg-mi-cyan/20 text-mi-cyan border-mi-cyan/30';
};

// Intro category display helpers
const getCategoryDisplayName = (category: string): string => {
  const categories: Record<string, string> = {
    'career': 'Career',
    'relationships': 'Relationships',
    'health': 'Health',
    'wealth': 'Wealth',
    'purpose': 'Purpose'
  };
  return categories[category] || category;
};

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'career': '💼',
    'relationships': '❤️',
    'health': '💚',
    'wealth': '💰',
    'purpose': '🧭'
  };
  return icons[category] || '🎯';
};

export function ProfilePage() {
  const { user } = useAuth();
  const { data: collisionStatus, isLoading: isLoadingCollision } = useIdentityCollisionStatus(user?.id);
  const { data: progress, isLoading: isLoadingProgress } = useMindInsuranceProgress(user?.id);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from('user_profiles')
        .select('created_at, timezone')
        .eq('id', user.id)
        .single();

      if (data) {
        setMemberSince(data.created_at);
        setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [user?.id]);

  if (isLoading || isLoadingCollision || isLoadingProgress) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[400px] bg-mi-navy">
          <Loader2 className="w-8 h-8 animate-spin text-mi-cyan" />
        </div>
      </SidebarLayout>
    );
  }

  // Extract data from hooks
  const primaryPattern = collisionStatus?.primaryPattern || null;
  const introSelections = collisionStatus?.introSelections;
  const hasIntroSelections = introSelections &&
    (introSelections.categories.length > 0 || introSelections.patterns.length > 0);

  const currentStreak = progress?.currentStreak || 0;
  const longestStreak = progress?.longestStreak || 0;
  const weeklyPractices = progress?.weeklyPractices || 0;
  const weeklyGoal = progress?.weeklyGoal || 7;
  const patternAwareness = progress?.patternAwareness || 0;
  const totalPoints = progress?.totalPoints || 0;
  const championshipLevel = progress?.championshipLevel || 'Bronze';
  const recentWin = progress?.recentWin || null;

  const weeklyProgress = Math.min((weeklyPractices / weeklyGoal) * 100, 100);

  return (
    <SidebarLayout>
      <div className="space-y-6 p-6 bg-mi-navy min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/mind-insurance">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-mi-navy-light">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Hub
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
              <User className="w-8 h-8 text-mi-cyan" />
              My Profile
            </h1>
            <p className="text-white/60 mt-1">
              Your Mind Insurance identity and practice journey
            </p>
          </div>
        </div>

        {/* Identity Pattern Section */}
        <Card className="mi-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Brain className="h-5 w-5 text-mi-cyan" />
              Identity Pattern
            </CardTitle>
            <CardDescription className="text-white/60">
              Your primary collision pattern from the Identity Collision Assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {primaryPattern ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-mi-cyan/20 flex items-center justify-center text-3xl">
                    {getPatternIcon(primaryPattern)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white">
                        {getPatternDisplayName(primaryPattern)}
                      </h3>
                      <Badge className="bg-mi-cyan/20 text-mi-cyan border-mi-cyan/30">
                        Primary
                      </Badge>
                    </div>
                    <p className="text-white/60 text-sm">
                      {getPatternDescription(primaryPattern)}
                    </p>
                  </div>
                </div>

                {/* Intro Selections - Areas of Focus & Self-Identified Patterns */}
                {hasIntroSelections && (
                  <div className="pt-4 border-t border-mi-cyan/10 space-y-4">
                    {/* Focus Areas */}
                    {introSelections.categories.length > 0 && (
                      <div>
                        <p className="text-xs text-white/40 mb-2">Areas of Focus</p>
                        <div className="flex flex-wrap gap-2">
                          {introSelections.categories.map((category: string) => (
                            <Badge
                              key={category}
                              variant="outline"
                              className="gap-1.5 border-mi-cyan/20 text-white/70"
                            >
                              <span>{getCategoryIcon(category)}</span>
                              {getCategoryDisplayName(category)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Self-Identified Patterns */}
                    {introSelections.patterns.length > 0 && (
                      <div>
                        <p className="text-xs text-white/40 mb-2">Self-Identified Patterns</p>
                        <div className="flex flex-wrap gap-2">
                          {introSelections.patterns.map((pattern: string) => (
                            <Badge
                              key={pattern}
                              variant="outline"
                              className="gap-1.5 border-mi-gold/30 text-mi-gold/80"
                            >
                              <span>{getPatternIcon(pattern)}</span>
                              {getPatternDisplayName(pattern)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <Shield className="h-12 w-12 text-mi-cyan/30 mx-auto mb-3" />
                <p className="text-white/60">No pattern detected yet</p>
                <p className="text-white/40 text-sm mt-2">Complete the assessment in Coverage Center to see your pattern</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Practice Journey Section */}
        <Card className="mi-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-mi-gold" />
              Practice Journey
            </CardTitle>
            <CardDescription className="text-white/60">
              Track your Mind Insurance practice progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Championship Level */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-mi-navy border border-mi-cyan/20">
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-mi-gold" />
                <div>
                  <p className="text-sm text-white/60">Championship Level</p>
                  <p className="text-lg font-bold text-white">{championshipLevel}</p>
                </div>
              </div>
              <Badge className={`text-sm px-3 py-1 ${getChampionshipColor(championshipLevel)}`}>
                {totalPoints.toLocaleString()} pts
              </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Current Streak */}
              <div className="p-4 rounded-lg bg-mi-navy border border-mi-cyan/20">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="text-xs text-white/60">Current Streak</span>
                </div>
                <p className="text-2xl font-bold text-white">{currentStreak}</p>
                <p className="text-xs text-white/40">days</p>
              </div>

              {/* Longest Streak */}
              <div className="p-4 rounded-lg bg-mi-navy border border-mi-cyan/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-mi-gold" />
                  <span className="text-xs text-white/60">Longest Streak</span>
                </div>
                <p className="text-2xl font-bold text-white">{longestStreak}</p>
                <p className="text-xs text-white/40">days</p>
              </div>

              {/* Weekly Practices */}
              <div className="p-4 rounded-lg bg-mi-navy border border-mi-cyan/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-mi-cyan" />
                  <span className="text-xs text-white/60">This Week</span>
                </div>
                <p className="text-2xl font-bold text-white">{weeklyPractices}/{weeklyGoal}</p>
                <Progress value={weeklyProgress} className="h-1 mt-2" />
              </div>

              {/* Pattern Awareness */}
              <div className="p-4 rounded-lg bg-mi-navy border border-mi-cyan/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-white/60">Pattern Awareness</span>
                </div>
                <p className="text-2xl font-bold text-white">{patternAwareness}%</p>
                <Progress value={patternAwareness} className="h-1 mt-2" />
              </div>
            </div>

            {/* Recent Win */}
            {recentWin && (
              <div className="p-4 rounded-lg bg-mi-gold/10 border border-mi-gold/30">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-4 w-4 text-mi-gold" />
                  <span className="text-sm font-medium text-mi-gold">Recent Victory</span>
                </div>
                <p className="text-white/80 text-sm">{recentWin}</p>
              </div>
            )}

            {/* View Championship Link */}
            <Link to="/mind-insurance/championship">
              <Button
                variant="outline"
                className="w-full bg-transparent border-mi-cyan/30 text-mi-cyan hover:bg-mi-cyan/10 hover:text-mi-cyan"
              >
                View Full Championship Stats
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Account Information Section */}
        <Card className="mi-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5 text-mi-cyan" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-mi-navy border border-mi-cyan/20">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-white/40" />
                <div>
                  <p className="text-xs text-white/40">Email</p>
                  <p className="text-white">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-mi-navy border border-mi-cyan/20">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-white/40" />
                <div>
                  <p className="text-xs text-white/40">Member Since</p>
                  <p className="text-white">
                    {memberSince
                      ? new Date(memberSince).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timezone */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-mi-navy border border-mi-cyan/20">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-white/40" />
                <div>
                  <p className="text-xs text-white/40">Timezone</p>
                  <p className="text-white">{timezone.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <Link to="/settings">
                <Button variant="ghost" size="sm" className="text-mi-cyan hover:bg-mi-cyan/10">
                  Change
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mi-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="h-5 w-5 text-mi-cyan" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/mind-insurance/coverage">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2 bg-mi-navy border-mi-cyan/30 text-white hover:bg-mi-cyan/10 hover:text-white"
                >
                  <Shield className="h-5 w-5 text-mi-cyan" />
                  <span className="text-sm">Coverage Center</span>
                </Button>
              </Link>
              <Link to="/mind-insurance/vault">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2 bg-mi-navy border-mi-cyan/30 text-white hover:bg-mi-cyan/10 hover:text-white"
                >
                  <Archive className="h-5 w-5 text-mi-cyan" />
                  <span className="text-sm">My Evidence</span>
                </Button>
              </Link>
              <Link to="/settings">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2 bg-mi-navy border-mi-cyan/30 text-white hover:bg-mi-cyan/10 hover:text-white"
                >
                  <Settings className="h-5 w-5 text-white/60" />
                  <span className="text-sm">Settings</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}

export default ProfilePage;
