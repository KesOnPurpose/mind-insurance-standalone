// ============================================================================
// FEAT-GH-010: Empty Programs State
// ============================================================================
// Shown when user has no enrolled programs
// ============================================================================

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, GraduationCap, Sparkles } from 'lucide-react';

interface EmptyProgramsStateProps {
  filterStatus?: string;
  onBrowsePrograms?: () => void;
}

export const EmptyProgramsState = ({
  filterStatus = 'all',
  onBrowsePrograms,
}: EmptyProgramsStateProps) => {
  // Get message based on filter
  const getMessage = () => {
    switch (filterStatus) {
      case 'in_progress':
        return {
          title: 'No programs in progress',
          description: "You don't have any programs in progress. Start a new program or continue one you've already enrolled in.",
          icon: BookOpen,
        };
      case 'completed':
        return {
          title: 'No completed programs yet',
          description: "You haven't completed any programs yet. Keep learning and you'll see your achievements here!",
          icon: GraduationCap,
        };
      case 'not_started':
        return {
          title: 'All programs started',
          description: "Great job! You've started all your enrolled programs. Keep up the momentum!",
          icon: Sparkles,
        };
      default:
        return {
          title: "You're not enrolled in any programs yet",
          description: 'Browse available programs to start your learning journey.',
          icon: BookOpen,
        };
    }
  };

  const message = getMessage();
  const Icon = message.icon;

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>

        <h3 className="font-semibold text-lg mb-2">{message.title}</h3>

        <p className="text-muted-foreground text-sm max-w-md mb-6">
          {message.description}
        </p>

        {filterStatus === 'all' && onBrowsePrograms && (
          <Button onClick={onBrowsePrograms}>
            Browse Programs
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyProgramsState;
