/**
 * VoiceCallCard Component
 *
 * Displays a voice call with transcript-first experience.
 * Features chat-style message bubbles, prominent AI summary, and topics.
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Phone, Clock, ChevronDown, Play, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VoiceCallForChat, VoiceMessage } from '@/services/netteVoiceCallService';
import { formatCallDuration, formatCallDirection } from '@/services/netteVoiceCallService';

interface VoiceCallCardProps {
  call: VoiceCallForChat;
  userTimezone?: string;
  isRecent?: boolean;
}

export const VoiceCallCard = ({ call, userTimezone, isRecent = false }: VoiceCallCardProps) => {
  const [isExpanded, setIsExpanded] = useState(isRecent);
  const [copied, setCopied] = useState(false);

  // Format the call date
  const callDate = new Date(call.created_at);
  const formattedDate = callDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(userTimezone ? { timeZone: userTimezone } : {})
  });
  const formattedTime = callDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...(userTimezone ? { timeZone: userTimezone } : {})
  });

  // Parse transcript messages if available
  const parsedMessages = call.parsed_messages as VoiceMessage[] | null;

  // Copy transcript to clipboard
  const handleCopyTranscript = async () => {
    const text = parsedMessages
      ? parsedMessages.map(m => `${m.role === 'user' ? 'You' : 'Nette'}: ${m.content}`).join('\n\n')
      : call.full_transcript || '';

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden border-border/50">
      {/* Header: Date, duration, direction, play button */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Voice Call with Nette</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formattedDate} at {formattedTime}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatCallDuration(call.call_duration_seconds)}
              </span>
              <span>•</span>
              <span>{formatCallDirection(call.direction)}</span>
            </div>
          </div>
        </div>

        {call.recording_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(call.recording_url!, '_blank')}
            className="shrink-0"
          >
            <Play className="w-4 h-4 mr-1" />
            Play
          </Button>
        )}
      </div>

      {/* AI Summary - Prominent */}
      {call.ai_summary && (
        <div className="p-4 bg-muted/30 border-b border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Summary
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {call.ai_summary}
          </p>
        </div>
      )}

      {/* Topics */}
      {call.topics_discussed && call.topics_discussed.length > 0 && (
        <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b border-border/50">
          {call.topics_discussed.map((topic, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="text-xs bg-primary/10 text-primary hover:bg-primary/20"
            >
              {topic}
            </Badge>
          ))}
        </div>
      )}

      {/* Transcript - Chat-style bubbles */}
      {call.full_transcript && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <span className="text-sm font-medium text-foreground">
              Full Transcript
            </span>
            <ChevronDown className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              isExpanded && 'rotate-180'
            )} />
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t border-border/50">
              {/* Copy button */}
              <div className="flex justify-end px-4 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyTranscript}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy transcript
                    </>
                  )}
                </Button>
              </div>

              {/* Messages */}
              <div className="p-4 pt-2 space-y-3 max-h-96 overflow-y-auto">
                {parsedMessages && parsedMessages.length > 0 ? (
                  // Render as chat bubbles
                  parsedMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-4 py-2.5',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        )}
                      >
                        <p className={cn(
                          'text-[10px] font-semibold uppercase tracking-wide mb-1',
                          msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}>
                          {msg.role === 'user' ? 'You' : 'Nette'}
                        </p>
                        <p className="text-sm leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  // Render raw transcript as fallback
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {call.full_transcript}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* No transcript available */}
      {!call.full_transcript && !call.ai_summary && (
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Transcript not available for this call
          </p>
        </div>
      )}
    </Card>
  );
};

export default VoiceCallCard;
