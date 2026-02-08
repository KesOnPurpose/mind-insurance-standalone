/**
 * FEAT-GH-TOUR: Nette Avatar Component
 *
 * Animated avatar for Nette (AI expert) that appears during
 * the tour and in proactive messages. Features glass-morphism
 * styling and subtle animation.
 */

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Volume2, VolumeX } from 'lucide-react';

interface NetteAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isPlaying?: boolean;
  showSoundIndicator?: boolean;
  onToggleSound?: () => void;
  className?: string;
  animate?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

const borderClasses = {
  sm: 'border-2',
  md: 'border-2',
  lg: 'border-3',
  xl: 'border-4',
};

/**
 * NetteAvatar - Animated avatar for the AI expert guide
 *
 * Features:
 * - Glass-morphism glow effect
 * - Speaking animation when audio is playing
 * - Sound toggle indicator
 * - Multiple size variants
 */
export function NetteAvatar({
  size = 'md',
  isPlaying = false,
  showSoundIndicator = false,
  onToggleSound,
  className,
  animate = true,
}: NetteAvatarProps) {
  return (
    <div className={cn('relative inline-flex', className)}>
      {/* Glow effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-r from-primary/60 to-primary/30',
          'blur-md opacity-70',
          animate && isPlaying && 'animate-pulse',
          sizeClasses[size]
        )}
      />

      {/* Avatar */}
      <Avatar
        className={cn(
          'relative z-10',
          borderClasses[size],
          'border-primary/50',
          'ring-2 ring-primary/20 ring-offset-2 ring-offset-background',
          sizeClasses[size],
          animate && isPlaying && 'animate-[subtle-bounce_1s_ease-in-out_infinite]'
        )}
      >
        <AvatarImage
          src="/nette-avatar.png"
          alt="Nette - Your Group Home Expert"
          className="object-cover"
        />
        <AvatarFallback
          className={cn(
            'bg-gradient-to-br from-primary to-primary/60',
            'text-white font-bold',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
            size === 'xl' && 'text-lg'
          )}
        >
          N
        </AvatarFallback>
      </Avatar>

      {/* Sound indicator */}
      {showSoundIndicator && (
        <button
          onClick={onToggleSound}
          className={cn(
            'absolute -bottom-1 -right-1 z-20',
            'p-1 rounded-full',
            'bg-background/80 backdrop-blur-sm',
            'border border-border/50',
            'hover:bg-accent transition-colors',
            size === 'sm' && 'scale-75',
            size === 'xl' && 'scale-125'
          )}
          aria-label={isPlaying ? 'Mute' : 'Unmute'}
        >
          {isPlaying ? (
            <Volume2 className="h-3 w-3 text-primary" />
          ) : (
            <VolumeX className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      )}

      {/* Speaking waves animation */}
      {animate && isPlaying && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 z-20 flex gap-0.5">
          <div
            className="w-0.5 h-2 bg-primary rounded-full animate-[wave_0.5s_ease-in-out_infinite]"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="w-0.5 h-3 bg-primary rounded-full animate-[wave_0.5s_ease-in-out_infinite]"
            style={{ animationDelay: '100ms' }}
          />
          <div
            className="w-0.5 h-2 bg-primary rounded-full animate-[wave_0.5s_ease-in-out_infinite]"
            style={{ animationDelay: '200ms' }}
          />
        </div>
      )}
    </div>
  );
}

export default NetteAvatar;
