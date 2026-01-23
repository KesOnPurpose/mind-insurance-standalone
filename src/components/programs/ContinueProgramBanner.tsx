// ============================================================================
// FEAT-GH-010: Continue Program Banner
// ============================================================================
// "Continue where you left off" banner for Programs Hub
// Shows the most recent in-progress program
// ============================================================================

import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayCircle, BookOpen, Clock, ArrowRight } from 'lucide-react';
import type { ProgramWithProgress } from '@/types/programs';

interface ContinueProgramBannerProps {
  program: ProgramWithProgress | null;
  isLoading?: boolean;
  onContinue?: (programId: string) => void;
}

export const ContinueProgramBanner = ({
  program,
  isLoading = false,
  onContinue,
}: ContinueProgramBannerProps) => {
  const navigate = useNavigate();

  // Show skeleton when loading
  if (isLoading) {
    return (
      <Card className="overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            <Skeleton className="aspect-video md:aspect-auto md:w-64 md:h-auto" />
            <div className="p-4 md:p-6 flex-1 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't render if no program to continue
  if (!program) {
    return null;
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue(program.id);
    } else {
      navigate(`/programs/${program.id}`);
    }
  };

  // Get instructor initials
  const getInstructorInitials = (name: string | null) => {
    if (!name) return 'IN';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format last activity
  const formatLastActivity = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
  };

  return (
    <Card className="overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 hover:border-primary/40 transition-all duration-300">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Thumbnail */}
          <div className="relative aspect-video md:aspect-auto md:w-64 md:min-h-[160px] overflow-hidden bg-muted shrink-0">
            {program.thumbnail_url ? (
              <img
                src={program.thumbnail_url}
                alt={program.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <BookOpen className="h-10 w-10 text-primary/40" />
              </div>
            )}

            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={handleContinue}>
              <div className="bg-white/90 rounded-full p-3">
                <PlayCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 flex-1 flex flex-col justify-center gap-3">
            {/* Label */}
            <div className="flex items-center gap-2 text-xs text-primary font-medium">
              <PlayCircle className="h-3.5 w-3.5" />
              Continue where you left off
            </div>

            {/* Title */}
            <h3 className="font-bold text-xl md:text-2xl leading-tight">
              {program.title}
            </h3>

            {/* Progress info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {program.completed_lessons} of {program.total_required_lessons} lessons completed
                </span>
                <span className="font-medium text-primary">
                  {program.progress_percent}%
                </span>
              </div>
              <Progress value={program.progress_percent} className="h-2" />
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {/* Instructor */}
              {program.instructor_name && (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={program.instructor_avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInstructorInitials(program.instructor_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{program.instructor_name}</span>
                </div>
              )}

              {/* Last activity */}
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Last active {formatLastActivity(program.days_since_activity)}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3 mt-1">
              <Button onClick={handleContinue} className="gap-2">
                Continue Learning
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContinueProgramBanner;
