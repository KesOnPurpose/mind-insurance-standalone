/**
 * ProtocolCheckIn Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Protocol-aware check-in section for PROTECT CT (Celebrate Wins).
 * Appears at the top of Celebrate Wins when user has an active protocol.
 *
 * Features:
 * - Practice response options (yes_multiple, yes_once, tried, forgot)
 * - Moment capture journal
 * - Optional insights field
 * - Triggers protocol day completion when CT is submitted
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  CheckCircle2,
  Circle,
  Sparkles,
  Calendar,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { MIOInsightProtocolWithProgress } from '@/types/protocol';

// ============================================================================
// TYPES
// ============================================================================

export type PracticeResponse = 'yes_multiple' | 'yes_once' | 'tried' | 'forgot';

export interface ProtocolCheckInData {
  protocol_id: string;
  day_number: number;
  practice_response: PracticeResponse;
  moment_captured: string;
  insight_captured?: string;
}

interface ProtocolCheckInProps {
  protocol: MIOInsightProtocolWithProgress | null;
  isLoading?: boolean;
  onChange?: (data: ProtocolCheckInData | null) => void;
  className?: string;
}

// ============================================================================
// PRACTICE RESPONSE OPTIONS
// ============================================================================

const PRACTICE_RESPONSES = [
  {
    value: 'yes_multiple' as const,
    label: 'Yes, multiple times',
    description: 'I caught the pattern several times today',
    icon: CheckCircle2,
    color: 'text-emerald-500',
  },
  {
    value: 'yes_once' as const,
    label: 'Yes, at least once',
    description: 'I noticed and responded at least once',
    icon: CheckCircle2,
    color: 'text-emerald-400',
  },
  {
    value: 'tried' as const,
    label: 'I tried but didn\'t notice any',
    description: 'I was aware but didn\'t catch any moments',
    icon: Circle,
    color: 'text-amber-500',
  },
  {
    value: 'forgot' as const,
    label: 'I forgot to practice today',
    description: 'The day got away from me',
    icon: Circle,
    color: 'text-gray-400',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ProtocolCheckIn({
  protocol,
  isLoading = false,
  onChange,
  className,
}: ProtocolCheckInProps) {
  const [practiceResponse, setPracticeResponse] = useState<PracticeResponse | null>(null);
  const [momentCaptured, setMomentCaptured] = useState('');
  const [insightCaptured, setInsightCaptured] = useState('');
  const [showInsight, setShowInsight] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Get today's task info
  const currentDay = protocol?.current_day || 1;
  const totalDays = protocol?.total_days || 7;
  const todayTask = protocol?.days?.find((d) => d.day_number === currentDay);
  const taskTitle = todayTask?.title || `Day ${currentDay}`;
  const taskTheme = todayTask?.theme || 'Today\'s Practice';

  // Notify parent of changes
  useEffect(() => {
    if (!protocol) {
      onChange?.(null);
      return;
    }

    if (practiceResponse && momentCaptured.trim()) {
      onChange?.({
        protocol_id: protocol.id,
        day_number: currentDay,
        practice_response: practiceResponse,
        moment_captured: momentCaptured.trim(),
        insight_captured: insightCaptured.trim() || undefined,
      });
    } else {
      onChange?.(null);
    }
  }, [protocol, practiceResponse, momentCaptured, insightCaptured, currentDay, onChange]);

  // No active protocol or already completed today
  if (!protocol || protocol.is_today_completed) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return <ProtocolCheckInSkeleton className={className} />;
  }

  return (
    <Card className={cn('border-purple-500/30 bg-purple-500/5', className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-start justify-between w-full text-left">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className="text-xs border-purple-500/50 text-purple-400 bg-purple-500/10"
                  >
                    <Brain className="h-3 w-3 mr-1" />
                    Protocol Check-In
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Day {currentDay}/{totalDays}
                  </Badge>
                </div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  {taskTitle}
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </CardTitle>
                {taskTheme && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {taskTheme}
                  </p>
                )}
              </div>
              <div className="ml-4 mt-1">
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-5">
            {/* Practice Response */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-300">
                Did you practice today's task?
              </Label>
              <RadioGroup
                value={practiceResponse || ''}
                onValueChange={(value) => setPracticeResponse(value as PracticeResponse)}
              >
                <div className="space-y-2">
                  {PRACTICE_RESPONSES.map((option) => {
                    const Icon = option.icon;
                    const isSelected = practiceResponse === option.value;

                    return (
                      <div
                        key={option.value}
                        className={cn(
                          'flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer',
                          isSelected
                            ? 'border-purple-500/50 bg-purple-500/10'
                            : 'border-gray-700 hover:border-gray-600 bg-mi-navy'
                        )}
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={option.value}
                          className="border-purple-500/50 text-purple-400"
                        />
                        <Label
                          htmlFor={option.value}
                          className="flex items-center gap-3 cursor-pointer flex-1"
                        >
                          <Icon className={cn('h-4 w-4', option.color)} />
                          <div>
                            <span className="text-sm font-medium text-gray-200">
                              {option.label}
                            </span>
                            <p className="text-xs text-gray-400">
                              {option.description}
                            </p>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>

            {/* Moment Capture */}
            <div className="space-y-2">
              <Label htmlFor="moment-captured" className="text-sm font-medium text-gray-300">
                Capture one moment (even imperfect):
              </Label>
              <Textarea
                id="moment-captured"
                value={momentCaptured}
                onChange={(e) => setMomentCaptured(e.target.value)}
                placeholder="What did you notice? What happened? Be specific..."
                className="min-h-[100px] resize-none bg-mi-navy border-gray-700 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">
                Even if you forgot or struggled, describe what your day looked like
              </p>
            </div>

            {/* Optional Insight */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowInsight(!showInsight)}
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 -ml-2"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                {showInsight ? 'Hide' : 'Add'} insight or realization
                {showInsight ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>

              {showInsight && (
                <Textarea
                  value={insightCaptured}
                  onChange={(e) => setInsightCaptured(e.target.value)}
                  placeholder="Any insights, patterns noticed, or realizations? (Optional)"
                  className="min-h-[80px] resize-none bg-mi-navy border-gray-700 text-white placeholder:text-gray-500"
                />
              )}
            </div>

            {/* Validation hint */}
            {practiceResponse && !momentCaptured.trim() && (
              <p className="text-xs text-amber-400">
                Please capture at least one moment to complete your protocol check-in
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function ProtocolCheckInSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('border-purple-500/30 bg-purple-500/5', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-24 bg-gray-700 rounded animate-pulse" />
          <div className="h-5 w-16 bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-5 w-3/4 bg-gray-700 rounded animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="h-24 bg-gray-800 rounded-lg animate-pulse" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPLETED STATE
// ============================================================================

/**
 * Shows when protocol check-in is already completed for today
 */
export function ProtocolCheckInCompleted({
  protocol,
  className,
}: {
  protocol: MIOInsightProtocolWithProgress | null;
  className?: string;
}) {
  if (!protocol || !protocol.is_today_completed) return null;

  const currentDay = protocol.current_day || 1;
  const totalDays = protocol.total_days || 7;

  return (
    <Card className={cn('border-emerald-500/30 bg-emerald-500/5', className)}>
      <CardContent className="py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              Protocol Check-In Complete
            </p>
            <p className="text-xs text-gray-400">
              Day {currentDay} of {totalDays} • Great work today!
            </p>
          </div>
          <Badge variant="secondary" className="text-emerald-400 bg-emerald-500/10">
            <Calendar className="h-3 w-3 mr-1" />
            Done
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProtocolCheckIn;
