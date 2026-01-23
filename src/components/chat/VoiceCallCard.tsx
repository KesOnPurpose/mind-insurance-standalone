/**
 * VoiceCallCard Component
 *
 * Displays a voice call summary card in the chat interface.
 * Part of the Nette AI Voice ↔ Text Context Synchronization feature.
 *
 * Features:
 * - Summary card showing call date, duration, and topics
 * - Expandable to show full transcript
 * - Matches chat UI styling (supports both Grouphome and Mind Insurance themes)
 *
 * @module components/chat/VoiceCallCard
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Phone, Clock, ChevronDown, ChevronUp, MessageSquare, Play, ExternalLink } from 'lucide-react';
import { useProduct } from '@/contexts/ProductContext';
import { COACHES } from '@/types/coach';
import type { VoiceCallForChat, VoiceMessage } from '@/services/netteVoiceCallService';
import { formatCallDuration, formatCallDirection } from '@/services/netteVoiceCallService';

interface VoiceCallCardProps {
  call: VoiceCallForChat;
  userTimezone?: string;
}

export const VoiceCallCard = ({ call, userTimezone }: VoiceCallCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentProduct } = useProduct();
  const isMindInsurance = currentProduct === 'mind-insurance';
  const coach = COACHES['nette'];

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

  return (
    <div className="flex gap-3 flex-row">
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm"
        style={{ background: coach.gradient }}
      >
        <Phone className="w-5 h-5" />
      </div>

      {/* Card Content */}
      <Card
        className={`p-4 max-w-[80%] ${
          isMindInsurance
            ? 'bg-[#132337] border border-[#05c3dd]/20 text-white'
            : 'bg-card border-primary/20'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4" style={{ color: coach.color }} />
          <span className="text-xs font-semibold" style={{ color: coach.color }}>
            Voice Call with Nette
          </span>
          <span className={`text-xs ${isMindInsurance ? 'text-gray-400' : 'text-muted-foreground'}`}>
            • {formatCallDirection(call.direction)}
          </span>
        </div>

        {/* Call Info Row */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className={`flex items-center gap-1 text-sm ${isMindInsurance ? 'text-gray-300' : 'text-foreground'}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{formatCallDuration(call.call_duration_seconds)}</span>
          </div>
          <span className={`text-sm ${isMindInsurance ? 'text-gray-400' : 'text-muted-foreground'}`}>
            {formattedDate} at {formattedTime}
          </span>
        </div>

        {/* Topics */}
        {call.topics_discussed && call.topics_discussed.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {call.topics_discussed.slice(0, 4).map((topic, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className={`text-xs ${
                  isMindInsurance
                    ? 'bg-[#05c3dd]/10 text-[#05c3dd] border-[#05c3dd]/20'
                    : 'bg-primary/10 text-primary'
                }`}
              >
                {topic}
              </Badge>
            ))}
            {call.topics_discussed.length > 4 && (
              <Badge
                variant="secondary"
                className={`text-xs ${
                  isMindInsurance
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                +{call.topics_discussed.length - 4} more
              </Badge>
            )}
          </div>
        )}

        {/* AI Summary */}
        {call.ai_summary && (
          <div className={`text-sm leading-relaxed mb-3 ${isMindInsurance ? 'text-gray-200' : 'text-foreground'}`}>
            {call.ai_summary}
          </div>
        )}

        {/* Recording Link (if available) */}
        {call.recording_url && (
          <Button
            variant="ghost"
            size="sm"
            className={`mb-3 ${
              isMindInsurance
                ? 'text-[#05c3dd] hover:bg-[#05c3dd]/10'
                : 'text-primary hover:bg-primary/10'
            }`}
            onClick={() => window.open(call.recording_url!, '_blank')}
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Listen to recording
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        )}

        {/* Expandable Transcript */}
        {call.full_transcript && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-between ${
                  isMindInsurance
                    ? 'text-gray-400 hover:bg-[#05c3dd]/10 hover:text-[#05c3dd]'
                    : 'text-muted-foreground hover:bg-primary/10'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isExpanded ? 'Hide transcript' : 'View full transcript'}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3">
              <div
                className={`p-3 rounded-lg space-y-3 max-h-96 overflow-y-auto ${
                  isMindInsurance
                    ? 'bg-[#0a1628] border border-[#05c3dd]/10'
                    : 'bg-muted/50 border border-border'
                }`}
              >
                {parsedMessages && parsedMessages.length > 0 ? (
                  // Render parsed messages
                  parsedMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`text-sm ${
                        msg.role === 'user'
                          ? isMindInsurance
                            ? 'text-white'
                            : 'text-foreground'
                          : isMindInsurance
                            ? 'text-[#05c3dd]'
                            : 'text-primary'
                      }`}
                    >
                      <span className="font-semibold">
                        {msg.role === 'user' ? 'You: ' : 'Nette: '}
                      </span>
                      {msg.content}
                    </div>
                  ))
                ) : (
                  // Render raw transcript
                  <div
                    className={`text-sm whitespace-pre-wrap ${
                      isMindInsurance ? 'text-gray-300' : 'text-foreground'
                    }`}
                  >
                    {call.full_transcript}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Timestamp */}
        <span
          className={`text-xs mt-2 block ${
            isMindInsurance ? 'text-gray-400' : 'text-muted-foreground'
          }`}
        >
          Synced {call.synced_to_chat ? 'to conversation' : 'from voice'}
        </span>
      </Card>
    </div>
  );
};

export default VoiceCallCard;
