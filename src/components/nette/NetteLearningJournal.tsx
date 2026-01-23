// ============================================================================
// FEAT-GH-020: Nette Learning Journal Component
// ============================================================================
// View captured insights organized by lesson
// ============================================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Lightbulb,
  HelpCircle,
  Link,
  Target,
  BookOpen,
  Calendar,
  Trash2,
  Sparkles,
} from 'lucide-react';
import type { UserInsight } from '@/types/programs';

interface NetteLearningJournalProps {
  insights: UserInsight[];
  isLoading?: boolean;
  onDeleteInsight?: (insightId: string) => void;
  className?: string;
}

const INSIGHT_TYPE_CONFIG: Record<
  UserInsight['insight_type'],
  { label: string; icon: typeof Lightbulb; color: string }
> = {
  breakthrough: {
    label: 'Breakthrough',
    icon: Lightbulb,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  question: {
    label: 'Question',
    icon: HelpCircle,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  connection: {
    label: 'Connection',
    icon: Link,
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  goal: {
    label: 'Goal',
    icon: Target,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
};

/**
 * NetteLearningJournal - View captured insights
 * Organized by lesson with filtering by type
 */
export const NetteLearningJournal = ({
  insights,
  isLoading = false,
  onDeleteInsight,
  className,
}: NetteLearningJournalProps) => {
  const [filterType, setFilterType] = useState<UserInsight['insight_type'] | 'all'>('all');

  // Filter insights
  const filteredInsights =
    filterType === 'all'
      ? insights
      : insights.filter((i) => i.insight_type === filterType);

  // Group by date
  const groupedInsights = filteredInsights.reduce((acc, insight) => {
    const date = new Date(insight.captured_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(insight);
    return acc;
  }, {} as Record<string, UserInsight[]>);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-600" />
          <h2 className="font-semibold">Learning Journal</h2>
          <Badge variant="secondary" className="text-xs">
            {insights.length} insights
          </Badge>
        </div>

        <Select
          value={filterType}
          onValueChange={(value) =>
            setFilterType(value as UserInsight['insight_type'] | 'all')
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(INSIGHT_TYPE_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  <config.icon className="h-3.5 w-3.5" />
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {filteredInsights.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="font-medium mb-1">No insights yet</h3>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              Save meaningful insights from your Nette conversations to build your learning journal.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Insights grouped by date */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          {Object.entries(groupedInsights).map(([date, dateInsights]) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {date}
                </span>
              </div>

              {/* Insights for this date */}
              <div className="space-y-3">
                {dateInsights.map((insight) => {
                  const config = INSIGHT_TYPE_CONFIG[insight.insight_type];
                  const Icon = config.icon;

                  return (
                    <Card key={insight.id} className="group">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Type icon */}
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                              config.color
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={cn('text-[10px]', config.color)}
                              >
                                {config.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {formatTime(insight.captured_at)}
                              </span>
                            </div>

                            <p className="text-sm leading-relaxed">
                              {insight.insight_text}
                            </p>
                          </div>

                          {/* Delete button (on hover) */}
                          {onDeleteInsight && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                              onClick={() => onDeleteInsight(insight.id)}
                              aria-label="Delete insight"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default NetteLearningJournal;
