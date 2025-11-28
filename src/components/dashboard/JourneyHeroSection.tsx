import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Map, ChevronRight, Flame, Trophy, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useJourneyContext, JourneyPhase } from '@/hooks/useJourneyContext';

interface JourneyHeroSectionProps {
  protectStreak?: number;
  totalPoints?: number;
  userName?: string;
}

/**
 * Get gradient and accent color based on journey phase
 */
function getPhaseColors(phase: JourneyPhase): { gradient: string; badge: string } {
  switch (phase) {
    case 'foundation':
      return {
        gradient: 'from-primary/10 via-primary/5 to-transparent',
        badge: 'bg-primary/10 text-primary border-primary/20'
      };
    case 'building':
      return {
        gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
        badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      };
    case 'launching':
      return {
        gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
        badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      };
    case 'operating':
      return {
        gradient: 'from-green-500/10 via-green-500/5 to-transparent',
        badge: 'bg-green-500/10 text-green-600 border-green-500/20'
      };
  }
}

/**
 * JourneyHeroSection - Main hero card showing user's journey position
 *
 * Displays:
 * - Current week and phase
 * - Overall progress
 * - Primary CTAs for Nette AI and Roadmap
 * - Streak and points stats
 */
export function JourneyHeroSection({
  protectStreak = 0,
  totalPoints = 0,
  userName
}: JourneyHeroSectionProps) {
  const {
    phase,
    phaseName,
    heroMessage,
    currentWeek,
    totalWeeks,
    completedTactics,
    totalTactics,
    completionRate,
    isLoading
  } = useJourneyContext();

  const colors = getPhaseColors(phase);

  if (isLoading) {
    return (
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <Skeleton className="h-3 w-full mb-6" />
        <div className="flex gap-3">
          <Skeleton className="h-11 w-40" />
          <Skeleton className="h-11 w-40" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 md:p-8 bg-gradient-to-br ${colors.gradient} border shadow-sm`}>
      {/* Header: Week + Phase Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={colors.badge}>
              {phaseName} Phase
            </Badge>
            <span className="text-sm text-muted-foreground">
              Week {currentWeek} of {totalWeeks}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {heroMessage}
          </h1>
          {userName && (
            <p className="text-muted-foreground mt-1">
              Welcome back, {userName}
            </p>
          )}
        </div>

        {/* Stats Row - Hidden on very small screens */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {protectStreak > 0 && (
            <span className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              {protectStreak} day streak
            </span>
          )}
          <span className="flex items-center gap-1">
            <Target className="w-4 h-4 text-primary" />
            {completedTactics}/{totalTactics} tactics
          </span>
          {totalPoints > 0 && (
            <span className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              {totalPoints} pts
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-bold text-primary">{completionRate}%</span>
        </div>
        <Progress value={completionRate} className="h-3" />
        <p className="text-xs text-muted-foreground mt-1">
          {completedTactics} of {totalTactics} tactics completed
        </p>
      </div>

      {/* Primary CTA - View Roadmap only (Ask Nette available in mobile bottom bar) */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/roadmap" className="flex-1 sm:flex-initial">
          <Button size="lg" className="w-full sm:w-auto gap-2">
            <Map className="w-5 h-5" />
            View Roadmap
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Mobile Bottom Action Bar - Fixed position on mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t md:hidden z-40">
        <div className="flex gap-2 max-w-lg mx-auto">
          <Link to="/chat" className="flex-1">
            <Button className="w-full gap-2">
              <MessageSquare className="w-4 h-4" />
              Ask Nette
            </Button>
          </Link>
          <Link to="/roadmap" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <Map className="w-4 h-4" />
              Roadmap
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default JourneyHeroSection;
