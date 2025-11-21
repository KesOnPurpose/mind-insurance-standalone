import React from 'react';
import { ChevronDown, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export interface TimeWindow {
  id: string;
  name: string;
  startTime: string; // "03:00" format
  endTime: string;   // "10:00" format
  description?: string;
}

export interface PracticeType {
  id: string;
  name: string;
  category: string;
  duration?: number;
  completed?: boolean;
}

interface TimeWindowSectionProps {
  window: TimeWindow;
  practices: PracticeType[];
  currentTime: Date;
  children: React.ReactNode;
}

export function TimeWindowSection({
  window,
  practices,
  currentTime,
  children,
}: TimeWindowSectionProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Parse time strings to compare with current time
  const parseTime = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(currentTime);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const startTime = parseTime(window.startTime);
  const endTime = parseTime(window.endTime);

  // Calculate warning threshold (30 minutes before end)
  const warningTime = new Date(endTime);
  warningTime.setMinutes(warningTime.getMinutes() - 30);

  // Determine status based on current time
  const getStatus = () => {
    if (currentTime < startTime) {
      return 'upcoming';
    } else if (currentTime >= startTime && currentTime < warningTime) {
      return 'available';
    } else if (currentTime >= warningTime && currentTime < endTime) {
      return 'ending';
    } else {
      return 'closed';
    }
  };

  const status = getStatus();

  // Status configurations
  const statusConfig = {
    upcoming: {
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: Clock,
      iconColor: 'text-gray-400',
      message: 'Opens soon',
    },
    available: {
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      message: 'Available now',
    },
    ending: {
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: AlertCircle,
      iconColor: 'text-yellow-600',
      message: 'Ending soon',
    },
    closed: {
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      message: 'Closed',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  // Format time for display
  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Calculate completed practices count
  const completedCount = practices.filter(p => p.completed).length;
  const totalCount = practices.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        'group rounded-lg border transition-all duration-200',
        config.borderColor,
        config.bgColor,
        'hover:shadow-md'
      )}
    >
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4 sm:p-5">
          {/* Left section - Window info */}
          <div className="flex items-start gap-3 text-left">
            <div className={cn('mt-0.5', config.iconColor)}>
              <StatusIcon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg text-gray-900">
                {window.name}
              </h3>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                <span className={cn('text-sm font-medium', config.color)}>
                  {formatTime(window.startTime)} - {formatTime(window.endTime)}
                </span>

                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit',
                  status === 'available' && 'bg-green-100 text-green-700',
                  status === 'ending' && 'bg-yellow-100 text-yellow-700',
                  status === 'closed' && 'bg-red-100 text-red-700',
                  status === 'upcoming' && 'bg-gray-100 text-gray-600'
                )}>
                  {config.message}
                </span>
              </div>

              {window.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {window.description}
                </p>
              )}

              {/* Progress indicator for practices */}
              {totalCount > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>{completedCount} of {totalCount} practices</span>
                    <span>{Math.round(completionPercentage)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right section - Expand indicator */}
          <div className="flex items-center ml-2">
            <ChevronDown
              className={cn(
                'h-5 w-5 text-gray-400 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
        <div className="border-t border-gray-200">
          <div className="p-4 sm:p-5 space-y-3">
            {/* Practice cards container */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {children}
            </div>

            {/* Empty state if no practices */}
            {totalCount === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No practices scheduled for this window</p>
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Export type definitions for use in other components
export type { TimeWindowSectionProps };