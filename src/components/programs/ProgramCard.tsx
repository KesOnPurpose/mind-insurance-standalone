// ============================================================================
// FEAT-GH-010: Program Card Component
// ============================================================================
// Displays a program with thumbnail, progress, and CTA
// Netflix-style card for Programs Hub
// ============================================================================

import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Clock, PlayCircle, CheckCircle2, Sparkles } from 'lucide-react';
import type { ProgramWithProgress } from '@/types/programs';

interface ProgramCardProps {
  program: ProgramWithProgress;
  onContinue?: (programId: string) => void;
}

export const ProgramCard = ({ program, onContinue }: ProgramCardProps) => {
  const navigate = useNavigate();

  const handleContinue = () => {
    if (onContinue) {
      onContinue(program.id);
    } else {
      navigate(`/programs/${program.id}`);
    }
  };

  // Get status badge config
  const getStatusBadge = () => {
    switch (program.computed_status) {
      case 'completed':
        return {
          label: 'Completed',
          variant: 'default' as const,
          className: 'bg-green-500/10 text-green-500 border-green-500/20',
          icon: CheckCircle2,
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          variant: 'secondary' as const,
          className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          icon: PlayCircle,
        };
      default:
        return {
          label: 'Not Started',
          variant: 'outline' as const,
          className: 'bg-muted/50 text-muted-foreground border-muted',
          icon: BookOpen,
        };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  // Format duration
  const formatDuration = (hours: number | null) => {
    if (!hours) return null;
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    return `${hours} hr${hours !== 1 ? 's' : ''}`;
  };

  // Get CTA text
  const getCtaText = () => {
    switch (program.computed_status) {
      case 'completed':
        return 'Review';
      case 'in_progress':
        return 'Continue';
      default:
        return 'Start';
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

  return (
    <Card
      className="group overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg cursor-pointer bg-card"
      onClick={handleContinue}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {program.thumbnail_url ? (
          <img
            src={program.thumbnail_url}
            alt={program.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <BookOpen className="h-12 w-12 text-primary/40" />
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {/* Status badge */}
          <Badge variant={statusBadge.variant} className={`${statusBadge.className} gap-1`}>
            <StatusIcon className="h-3 w-3" />
            {statusBadge.label}
          </Badge>

          {/* New badge */}
          {program.is_new && (
            <Badge className="bg-amber-500/90 text-white border-0 gap-1">
              <Sparkles className="h-3 w-3" />
              New
            </Badge>
          )}
        </div>

        {/* Progress overlay at bottom */}
        {program.computed_status !== 'not_started' && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-8 pb-2 px-3">
            <div className="flex items-center gap-2 text-white text-xs mb-1">
              <span>{program.progress_percent}% complete</span>
              <span className="text-white/60">•</span>
              <span className="text-white/80">
                {program.completed_lessons} of {program.total_required_lessons} lessons
              </span>
            </div>
            <Progress value={program.progress_percent} className="h-1.5 bg-white/20" />
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {program.title}
        </h3>

        {/* Description */}
        {program.short_description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {program.short_description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {/* Instructor */}
          {program.instructor_name && (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={program.instructor_avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {getInstructorInitials(program.instructor_name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[100px]">{program.instructor_name}</span>
            </div>
          )}

          {/* Duration */}
          {program.estimated_duration_hours && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDuration(program.estimated_duration_hours)}</span>
            </div>
          )}

          {/* Lessons count */}
          <div className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{program.total_lessons} lessons</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          className="w-full mt-2"
          variant={program.computed_status === 'completed' ? 'outline' : 'default'}
          onClick={(e) => {
            e.stopPropagation();
            handleContinue();
          }}
        >
          {program.computed_status === 'in_progress' && (
            <PlayCircle className="h-4 w-4 mr-2" />
          )}
          {getCtaText()}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProgramCard;
