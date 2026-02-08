// ============================================================================
// VAPI VOICE CALL CARD
// Displays a single call log with expandable details
// Mobile-first, accessible design using ShadCN components
// Grouphomes4newbies - Nette Voice Interface
// "Gateway to Expert Guidance"
// ============================================================================

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Play, Pause, Clock, MessageSquare, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { VapiCallLog } from '@/services/vapiService';
import { correctTranscriptNames, correctTranscriptEntries } from '@/services/vapiService';

// ============================================================================
// TYPES
// ============================================================================

interface VapiVoiceCallCardProps {
  call: VapiCallLog;
  userName?: string | null;  // User's first name (takes precedence over context_snapshot)
  onLoadTranscript?: (vapiCallId: string) => Promise<VapiCallLog | null>;
  onHideCall?: (callId: string) => Promise<void>;  // Callback to hide/delete the call from view
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format duration in seconds to MM:SS format
 */
const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get relative time string from date
 */
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

/**
 * Get sentiment color classes
 */
const getSentimentClasses = (sentiment: string | null): string => {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'negative':
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'mixed':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'neutral':
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  }
};

/**
 * Get sentiment label
 */
const getSentimentLabel = (sentiment: string | null): string => {
  if (!sentiment) return 'Unknown';
  return sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase();
};

/**
 * Topic color mapping for call topics
 * Uses brand colors for visual categorization
 */
type TopicCategory = 'licensing' | 'residents' | 'business' | 'compliance' | 'training' | 'default';

const TOPIC_COLORS: Record<TopicCategory, { bg: string; text: string; border: string }> = {
  licensing: {
    bg: 'bg-[hsl(187_85%_35%/0.15)]',
    text: 'text-[hsl(187_85%_35%)]',
    border: 'border-[hsl(187_85%_35%/0.3)]'
  },
  residents: {
    bg: 'bg-[hsl(35_95%_55%/0.15)]',
    text: 'text-[hsl(35_95%_45%)]',
    border: 'border-[hsl(35_95%_55%/0.3)]'
  },
  business: {
    bg: 'bg-[hsl(142_70%_45%/0.15)]',
    text: 'text-[hsl(142_70%_40%)]',
    border: 'border-[hsl(142_70%_45%/0.3)]'
  },
  compliance: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600',
    border: 'border-purple-500/20'
  },
  training: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20'
  },
  default: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600',
    border: 'border-gray-500/20'
  }
};

/**
 * Keywords that map to each topic category
 */
const TOPIC_KEYWORDS: Record<TopicCategory, string[]> = {
  licensing: ['license', 'licensing', 'permit', 'certification', 'application', 'approval', 'state'],
  residents: ['resident', 'care', 'patient', 'intake', 'discharge', 'assessment', 'behavior', 'medication'],
  business: ['business', 'profit', 'revenue', 'marketing', 'referral', 'contract', 'insurance', 'billing'],
  compliance: ['compliance', 'regulation', 'inspection', 'audit', 'policy', 'procedure', 'documentation'],
  training: ['training', 'staff', 'onboarding', 'education', 'course', 'lesson', 'module'],
  default: []
};

/**
 * Get topic category based on topic text
 */
const getTopicCategory = (topic: string): TopicCategory => {
  const lowerTopic = topic.toLowerCase();

  for (const [category, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (category === 'default') continue;
    if (keywords.some(keyword => lowerTopic.includes(keyword))) {
      return category as TopicCategory;
    }
  }

  return 'default';
};

/**
 * Get topic color classes based on topic text
 */
const getTopicColorClasses = (topic: string): string => {
  const category = getTopicCategory(topic);
  const colors = TOPIC_COLORS[category];
  return `${colors.bg} ${colors.text} ${colors.border}`;
};

/**
 * Format summary text with proper structure
 * Handles markdown-like formatting (bullets, bold, etc.)
 */
const formatSummary = (summary: string, userName?: string): React.ReactNode[] => {
  // First, correct any name misspellings (ALWAYS run - corrects Nette + user name if provided)
  const corrected = correctTranscriptNames(summary, userName);

  // Split by newlines and process each line
  const lines = corrected.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      // Empty line - add spacing
      elements.push(<div key={index} className="h-2" />);
      return;
    }

    // Check for bullet points
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const bulletText = trimmed.replace(/^[•\-\*]\s*/, '');
      elements.push(
        <li key={index} className="ml-4 text-sm text-muted-foreground">
          {formatInlineText(bulletText)}
        </li>
      );
      return;
    }

    // Check for headers (** bold **)
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      const headerText = trimmed.replace(/^\*\*|\*\*$/g, '').replace(/:$/, '');
      elements.push(
        <h4 key={index} className="font-medium text-sm mt-3 mb-1">
          {headerText}
        </h4>
      );
      return;
    }

    // Regular paragraph - check for numbered lists
    // If the line contains multiple numbered items, format them as a list
    const hasNumberedList = /(?:^|\s)(\d+[,.]|\b(?:First|Second|Third|Fourth|Fifth)[,.]?)\s+/gi.test(trimmed);
    if (hasNumberedList) {
      elements.push(
        <div key={index} className="text-sm">
          {formatTranscriptContent(trimmed, `summary-${index}`)}
        </div>
      );
    } else {
      elements.push(
        <p key={index} className="text-sm text-muted-foreground">
          {formatInlineText(trimmed)}
        </p>
      );
    }
  });

  return elements;
};

/**
 * Format inline text (bold, etc.)
 */
const formatInlineText = (text: string): React.ReactNode => {
  // Simple bold pattern: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

/**
 * Format transcript content to display numbered lists and steps properly
 * Detects patterns like "1,", "1.", "First,", etc. and formats them as list items
 */
const formatTranscriptContent = (text: string, baseKey: string): React.ReactNode => {
  // Patterns to detect numbered/ordered items in speech
  // Matches: "1,", "1.", "2,", "2.", "First,", "Second,", "Third,", etc.
  const listPattern = /(?:^|\s)(\d+[,.]|\b(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|One|Two|Three|Four|Five)[,.]?)\s+/gi;

  // Check if text contains list-like patterns
  const matches = text.match(listPattern);

  if (!matches || matches.length < 2) {
    // No list detected, return as regular text
    return <span className="text-muted-foreground">{text}</span>;
  }

  // Split text into segments at list markers
  const segments: Array<{ marker: string; content: string }> = [];
  let lastIndex = 0;
  let introText = '';

  // Reset regex for exec
  const splitPattern = /(?:^|\s)(\d+[,.]|\b(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|One|Two|Three|Four|Five)[,.]?)\s+/gi;
  let match;
  let firstMatchFound = false;

  while ((match = splitPattern.exec(text)) !== null) {
    if (!firstMatchFound) {
      // Capture any intro text before the first list item
      introText = text.slice(0, match.index).trim();
      firstMatchFound = true;
    } else if (segments.length > 0) {
      // Update the previous segment's content
      segments[segments.length - 1].content = text.slice(lastIndex, match.index).trim();
    }

    segments.push({
      marker: match[1].replace(/[,.]$/, ''), // Remove trailing comma/period
      content: '' // Will be filled in next iteration or at the end
    });

    lastIndex = match.index + match[0].length;
  }

  // Fill in the last segment's content
  if (segments.length > 0) {
    segments[segments.length - 1].content = text.slice(lastIndex).trim();
  }

  // If we couldn't properly parse segments, return original text
  if (segments.length < 2) {
    return <span className="text-muted-foreground">{text}</span>;
  }

  return (
    <div className="space-y-1">
      {introText && (
        <span className="text-muted-foreground">{introText}</span>
      )}
      <ol className="list-none space-y-2 mt-2 ml-1">
        {segments.map((segment, idx) => (
          <li key={`${baseKey}-item-${idx}`} className="flex gap-2 text-muted-foreground">
            <span className="font-medium text-foreground/70 shrink-0">
              {/^\d+$/.test(segment.marker) ? `${segment.marker}.` : segment.marker}
            </span>
            <span>{segment.content}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

/**
 * Format string transcript with styled speaker labels
 * Replaces "AI:" with "NETTE:" and "User:" with the user's name in caps
 */
const formatStringTranscript = (text: string, userName?: string): React.ReactNode[] => {
  const userLabel = userName?.toUpperCase() || 'YOU';
  const elements: React.ReactNode[] = [];

  // Split by lines and process each
  const lines = text.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={index} className="h-1" />);
      return;
    }

    // Check for AI/assistant speaker prefix
    const aiMatch = trimmed.match(/^(AI|Assistant|Nette|NETTE):\s*(.*)$/i);
    if (aiMatch) {
      elements.push(
        <div key={index} className="mb-2">
          <span className="font-semibold text-xs tracking-wide text-orange-600">NETTE:</span>
          <div className="ml-2">{formatTranscriptContent(aiMatch[2], `str-ai-${index}`)}</div>
        </div>
      );
      return;
    }

    // Check for User speaker prefix
    const userMatch = trimmed.match(/^(User|You|Human):\s*(.*)$/i);
    if (userMatch) {
      elements.push(
        <div key={index} className="mb-2">
          <span className="font-semibold text-xs tracking-wide text-primary">{userLabel}:</span>
          <div className="ml-2">{formatTranscriptContent(userMatch[2], `str-user-${index}`)}</div>
        </div>
      );
      return;
    }

    // Check if line starts with the user's name (case insensitive)
    if (userName) {
      const nameMatch = trimmed.match(new RegExp(`^${userName}:\\s*(.*)$`, 'i'));
      if (nameMatch) {
        elements.push(
          <div key={index} className="mb-2">
            <span className="font-semibold text-xs tracking-wide text-primary">{userLabel}:</span>
            <div className="ml-2">{formatTranscriptContent(nameMatch[1], `str-name-${index}`)}</div>
          </div>
        );
        return;
      }
    }

    // Regular line without speaker prefix
    elements.push(
      <p key={index} className="text-muted-foreground mb-1">{trimmed}</p>
    );
  });

  return elements;
};

/**
 * Get user name - prefers prop, falls back to context snapshot
 */
const getEffectiveUserName = (
  propUserName?: string | null,
  call?: VapiCallLog
): string | undefined => {
  // Prefer the prop (passed from parent with verified user profile data)
  if (propUserName) return propUserName;

  // Fall back to context_snapshot stored in the call log
  if (call) {
    const snapshot = (call as { context_snapshot?: Record<string, unknown> }).context_snapshot;
    if (snapshot) {
      return (snapshot.first_name as string) || (snapshot.greeting_name as string);
    }
  }
  return undefined;
};

// ============================================================================
// COMPONENT
// ============================================================================

export const VapiVoiceCallCard = ({
  call,
  userName,
  onLoadTranscript,
  onHideCall,
  className
}: VapiVoiceCallCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [transcriptData, setTranscriptData] = useState<VapiCallLog['transcript']>(call.transcript);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isHiding, setIsHiding] = useState(false);

  // Format the call date
  const callDate = call.started_at || call.created_at;
  const relativeTime = getRelativeTime(callDate);
  const fullDate = new Date(callDate).toLocaleString();

  // Handle transcript expansion with lazy loading
  const handleTranscriptToggle = useCallback(async () => {
    const newState = !isTranscriptOpen;
    setIsTranscriptOpen(newState);

    // Lazy load transcript if needed and available
    if (newState && !transcriptData && onLoadTranscript) {
      setIsLoadingTranscript(true);
      try {
        const detail = await onLoadTranscript(call.vapi_call_id);
        if (detail?.transcript) {
          setTranscriptData(detail.transcript);
        }
      } catch (err) {
        console.error('[VapiVoiceCallCard] Failed to load transcript:', err);
      } finally {
        setIsLoadingTranscript(false);
      }
    }
  }, [isTranscriptOpen, transcriptData, onLoadTranscript, call.vapi_call_id]);

  // Handle audio playback
  const handlePlayPause = useCallback(() => {
    if (!call.recording_url) return;

    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      const audio = new Audio(call.recording_url);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('play', () => setIsPlaying(true));
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    }
  }, [call.recording_url, audioElement, isPlaying]);

  // Handle hide/delete call
  const handleHideCall = useCallback(async () => {
    if (!onHideCall) return;
    setIsHiding(true);
    try {
      await onHideCall(call.id);
    } catch (err) {
      console.error('[VapiVoiceCallCard] Failed to hide call:', err);
    } finally {
      setIsHiding(false);
    }
  }, [onHideCall, call.id]);

  return (
    <Card className={cn(
      'overflow-hidden transition-shadow hover:shadow-md',
      'border-l-4 border-l-[hsl(187_85%_35%)]', // Primary teal left accent
      className
    )}>
      <CardContent className="p-4">
        {/* Header Row - Nette Avatar, Date, Duration, Sentiment */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-3">
            {/* Nette Avatar */}
            <img
              src="/nette-avatar.png"
              alt="Nette"
              className="flex-shrink-0 w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-[hsl(187_85%_35%/0.3)]"
            />

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[hsl(187_85%_35%)]">Nette</span>
                <span className="text-sm text-muted-foreground" title={fullDate}>
                  · {relativeTime}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span>{formatDuration(call.duration_seconds)}</span>
              </div>
            </div>
          </div>

          {/* Sentiment Badge */}
          {call.sentiment && (
            <Badge
              variant="outline"
              className={cn('text-xs', getSentimentClasses(call.sentiment))}
              aria-label={`Call sentiment: ${getSentimentLabel(call.sentiment)}`}
            >
              {getSentimentLabel(call.sentiment)}
            </Badge>
          )}
        </div>

        {/* Topics Badges with Color Coding */}
        {call.topics && call.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3" role="list" aria-label="Call topics">
            {call.topics.slice(0, 5).map((topic, index) => (
              <Badge
                key={index}
                variant="outline"
                className={cn(
                  'text-xs px-2 py-0.5 font-medium',
                  getTopicColorClasses(topic)
                )}
                role="listitem"
              >
                {topic}
              </Badge>
            ))}
            {call.topics.length > 5 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                +{call.topics.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Summary - Collapsible with formatted content */}
        {call.summary && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <div className={cn('mb-2', !isExpanded && 'max-h-12 overflow-hidden')}>
              <div className="space-y-1">
                {formatSummary(call.summary, getEffectiveUserName(userName, call))}
              </div>
            </div>
            {call.summary.length > 100 && (
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" aria-hidden="true" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" aria-hidden="true" />
                      Show more
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            )}
          </Collapsible>
        )}

        {/* Action Row - Recording & Transcript */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          {/* Recording Playback Button */}
          {call.recording_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
              className="h-8 gap-1.5"
              aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="text-xs">{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>
          )}

          {/* Transcript Toggle Button */}
          {(transcriptData || onLoadTranscript) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTranscriptToggle}
              className="h-8 gap-1.5"
              disabled={isLoadingTranscript}
              aria-expanded={isTranscriptOpen}
              aria-controls={`transcript-${call.id}`}
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs">
                {isLoadingTranscript ? 'Loading...' : 'Transcript'}
              </span>
              {isTranscriptOpen ? (
                <ChevronUp className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              )}
            </Button>
          )}

          {/* Delete/Hide Button */}
          {onHideCall && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 ml-auto text-muted-foreground hover:text-destructive"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the conversation from your history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleHideCall}
                    disabled={isHiding}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isHiding ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Expandable Transcript */}
        {isTranscriptOpen && (
          <div
            id={`transcript-${call.id}`}
            className="mt-3 pt-3 border-t"
            role="region"
            aria-label="Call transcript"
          >
            {isLoadingTranscript ? (
              <div className="flex items-center justify-center py-4">
                <span className="text-sm text-muted-foreground">Loading transcript...</span>
              </div>
            ) : transcriptData && Array.isArray(transcriptData) && transcriptData.length > 0 ? (
              <ScrollArea className="h-48 rounded-md border p-3">
                <div className="space-y-3">
                  {/* Apply name correction to transcript entries */}
                  {correctTranscriptEntries(
                    transcriptData as Array<{ role: string; text: string; timestamp?: string }>,
                    getEffectiveUserName(userName, call)
                  ).map((entry, index) => {
                    const effectiveName = getEffectiveUserName(userName, call);
                    const speakerLabel = entry.role === 'user'
                      ? (effectiveName?.toUpperCase() || 'YOU')
                      : 'NETTE';
                    return (
                      <div
                        key={index}
                        className="text-sm mb-2"
                      >
                        <span className={cn(
                          'font-semibold text-xs tracking-wide',
                          entry.role === 'user' ? 'text-primary' : 'text-orange-600'
                        )}>
                          {speakerLabel}:
                        </span>
                        <div className="ml-2">
                          {formatTranscriptContent(entry.text, `transcript-${call.id}-${index}`)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : typeof transcriptData === 'string' && transcriptData.length > 0 ? (
              <ScrollArea className="h-48 rounded-md border p-3">
                <div className="text-sm whitespace-pre-wrap">
                  {/* Apply name correction and format speaker labels */}
                  {formatStringTranscript(
                    correctTranscriptNames(transcriptData, getEffectiveUserName(userName, call)),
                    getEffectiveUserName(userName, call)
                  )}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No transcript available
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VapiVoiceCallCard;
