// ============================================================================
// VAPI VOICE CALL CARD
// Displays a single call log with expandable details
// Mobile-first, accessible design using ShadCN components
// ============================================================================

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Play, Pause, Clock, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { VapiCallLog } from '@/services/vapiService';

// ============================================================================
// TYPES
// ============================================================================

interface VapiVoiceCallCardProps {
  call: VapiCallLog;
  onLoadTranscript?: (vapiCallId: string) => Promise<VapiCallLog | null>;
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

// ============================================================================
// COMPONENT
// ============================================================================

export const VapiVoiceCallCard = ({
  call,
  onLoadTranscript,
  className
}: VapiVoiceCallCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [transcriptData, setTranscriptData] = useState<VapiCallLog['transcript']>(call.transcript);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

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

  return (
    <Card className={cn('overflow-hidden transition-shadow hover:shadow-md', className)}>
      <CardContent className="p-4">
        {/* Header Row - Date, Duration, Sentiment */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium" title={fullDate}>
              {relativeTime}
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span>{formatDuration(call.duration_seconds)}</span>
              {call.assistant_variant && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {call.assistant_variant}
                </Badge>
              )}
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

        {/* Topics Badges */}
        {call.topics && call.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3" role="list" aria-label="Call topics">
            {call.topics.slice(0, 5).map((topic, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-2 py-0.5"
                role="listitem"
              >
                {topic}
              </Badge>
            ))}
            {call.topics.length > 5 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{call.topics.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Summary - Collapsible */}
        {call.summary && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <div className="mb-2">
              <p className={cn(
                'text-sm text-muted-foreground',
                !isExpanded && 'line-clamp-2'
              )}>
                {call.summary}
              </p>
            </div>
            {call.summary.length > 150 && (
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
            ) : transcriptData && transcriptData.length > 0 ? (
              <ScrollArea className="h-48 rounded-md border p-3">
                <div className="space-y-3">
                  {transcriptData.map((entry, index) => (
                    <div
                      key={index}
                      className={cn(
                        'text-sm',
                        entry.role === 'user' ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      <span className="font-medium">
                        {entry.role === 'user' ? 'You: ' : 'Nette: '}
                      </span>
                      {entry.text}
                    </div>
                  ))}
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
