import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowRight,
  Clock,
  Star,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  FileText,
  DollarSign,
  Home,
  Users,
  Target,
  Clipboard
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TacticInfo {
  tactic_id: string;
  tactic_name: string;
  category?: string;
  why_it_matters?: string;
  estimated_time?: string;
  is_critical_path?: boolean;
  can_start?: boolean;
}

interface NextActionCardProps {
  tactic: TacticInfo | null;
  isInProgress?: boolean;
  daysSinceStarted?: number;
  isLoading?: boolean;
  onStart?: () => void;
  onContinue?: () => void;
}

/**
 * Get icon component based on category
 */
function getCategoryIcon(category: string) {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('business') || categoryLower.includes('planning')) return Briefcase;
  if (categoryLower.includes('legal') || categoryLower.includes('compliance')) return FileText;
  if (categoryLower.includes('financial') || categoryLower.includes('finance')) return DollarSign;
  if (categoryLower.includes('property') || categoryLower.includes('location')) return Home;
  if (categoryLower.includes('operations') || categoryLower.includes('staffing')) return Users;
  if (categoryLower.includes('marketing')) return Target;
  return Clipboard;
}

/**
 * Get urgency message based on days since started
 */
function getUrgencyMessage(days: number): { message: string; variant: 'info' | 'warning' | 'urgent' } {
  if (days === 0) {
    return { message: "Started today - Great momentum!", variant: 'info' };
  }
  if (days === 1) {
    return { message: "Started yesterday - Keep going!", variant: 'info' };
  }
  if (days <= 3) {
    return { message: `Started ${days} days ago - Stay on track!`, variant: 'warning' };
  }
  return { message: `Started ${days} days ago - Time to finish this!`, variant: 'urgent' };
}

/**
 * NextActionCard - Enhanced tactic card showing the next action to take
 *
 * Features:
 * - Category-based icon
 * - Critical path indicator
 * - In-progress urgency indicator
 * - Quick action buttons
 */
export function NextActionCard({
  tactic,
  isInProgress = false,
  daysSinceStarted = 0,
  isLoading = false,
  onStart,
  onContinue
}: NextActionCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
        <div className="flex items-start gap-4">
          <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </Card>
    );
  }

  // All tactics completed state
  if (!tactic) {
    return (
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-2">All Tactics Completed!</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Congratulations! You've completed all your personalized tactics. You're ready to launch your group home business!
            </p>
            <Link to="/roadmap">
              <Button variant="outline">
                Review Your Roadmap
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const IconComponent = getCategoryIcon(tactic.category || '');
  const urgency = isInProgress ? getUrgencyMessage(daysSinceStarted) : null;

  const urgencyColors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300',
    urgent: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300'
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border border-primary/20">
      <div className="flex items-start gap-4">
        {/* Category Icon */}
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <IconComponent className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Badges Row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {tactic.category && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300">
                {tactic.category}
              </Badge>
            )}
            {tactic.is_critical_path && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300">
                <Star className="w-3 h-3 mr-1 fill-amber-400" />
                Critical Path
              </Badge>
            )}
            {isInProgress && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300">
                <Clock className="w-3 h-3 mr-1" />
                In Progress
              </Badge>
            )}
          </div>

          {/* Tactic Name */}
          <h2 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
            {tactic.tactic_name}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
            {tactic.why_it_matters ||
              `This tactic is part of your personalized ${tactic.category?.toLowerCase() || 'group home'} journey.`}
          </p>

          {/* Urgency Indicator */}
          {urgency && (
            <div className={`mb-4 p-3 rounded-lg border ${urgencyColors[urgency.variant]}`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{urgency.message}</span>
              </div>
            </div>
          )}

          {/* Actions Row */}
          <div className="flex items-center gap-4 flex-wrap">
            <Link to={`/roadmap?tactic=${tactic.tactic_id}`}>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={isInProgress ? onContinue : onStart}
              >
                {isInProgress ? 'Continue This Tactic' : 'Start This Tactic'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            {tactic.estimated_time && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {tactic.estimated_time}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default NextActionCard;
