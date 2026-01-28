/**
 * FEAT-GH-TOUR: Nette Proactive Message Component
 *
 * Appears at the end of the tour to ask permission to share
 * personalized insights including the Income Replacement Roadmap.
 * Uses glass-morphism styling with the NetteAvatar.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NetteAvatar } from './NetteAvatar';
import { Sparkles, Clock, X } from 'lucide-react';
import type { ProactiveMessageConsent, NetteProactiveMessage as NetteProactiveMessageType } from '@/types/assessment';

interface NetteProactiveMessageProps {
  message: NetteProactiveMessageType;
  isAudioPlaying?: boolean;
  onConsent: (consent: ProactiveMessageConsent) => void;
  onToggleAudio?: () => void;
  className?: string;
}

/**
 * NetteProactiveMessage - Permission request for personalized insights
 *
 * Features:
 * - Glass-morphism card design
 * - Nette avatar with speaking animation
 * - Three-button consent options
 * - Hover states and animations
 */
export function NetteProactiveMessage({
  message,
  isAudioPlaying = false,
  onConsent,
  onToggleAudio,
  className,
}: NetteProactiveMessageProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleYes = () => {
    onConsent('yes_show_insights');
  };

  const handleLater = () => {
    onConsent('later');
  };

  const handleNo = () => {
    onConsent('no_thanks');
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        'bg-background/95 backdrop-blur-xl',
        'border border-primary/20',
        'shadow-xl',
        'transition-all duration-300',
        isHovered && 'shadow-2xl border-primary/40',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient border glow */}
      <div
        className={cn(
          'absolute inset-0 -z-10',
          'bg-gradient-to-br from-primary/20 via-transparent to-primary/10',
          'blur-xl opacity-50',
          'transition-opacity duration-300',
          isHovered && 'opacity-70'
        )}
      />

      <CardContent className="p-6">
        {/* Header with avatar */}
        <div className="flex items-start gap-4 mb-4">
          <NetteAvatar
            size="lg"
            isPlaying={isAudioPlaying}
            showSoundIndicator
            onToggleSound={onToggleAudio}
            animate
          />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-foreground">
                {message.title || 'A Quick Question...'}
              </h3>
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </div>

            <p className="text-sm text-muted-foreground">
              From Nette, your Group Home Expert
            </p>
          </div>
        </div>

        {/* Message content */}
        <div className="mb-6">
          <p className="text-foreground leading-relaxed">
            {message.content}
          </p>

          {/* Teaser of what they'll see */}
          {message.previewItems && message.previewItems.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm font-medium text-primary mb-2">
                What I'll share with you:
              </p>
              <ul className="space-y-1">
                {message.previewItems.map((item, index) => (
                  <li
                    key={index}
                    className="text-sm text-muted-foreground flex items-center gap-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Consent buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="default"
            className={cn(
              'flex-1 gap-2',
              'bg-gradient-to-r from-primary to-primary/80',
              'hover:from-primary/90 hover:to-primary/70',
              'transition-all duration-300'
            )}
            onClick={handleYes}
          >
            <Sparkles className="h-4 w-4" />
            Yes, show me!
          </Button>

          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleLater}
          >
            <Clock className="h-4 w-4" />
            Maybe later
          </Button>

          <Button
            variant="ghost"
            className="sm:w-auto text-muted-foreground hover:text-foreground"
            onClick={handleNo}
          >
            <X className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">No thanks</span>
          </Button>
        </div>

        {/* Privacy note */}
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Your data stays private. I use your assessment results only to give you personalized guidance.
        </p>
      </CardContent>
    </Card>
  );
}

export default NetteProactiveMessage;
