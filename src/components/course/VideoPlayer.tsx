/**
 * FEAT-GH-005-D: VideoPlayer Component
 *
 * Unified video player supporting multiple providers with:
 * - Progress tracking integration via useVideoProgress hook
 * - Mobile-first responsive design
 * - Auto-resume from last position
 * - Completion threshold visualization
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Maximize,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVideoProgress, formatPosition } from '@/hooks/useVideoProgress';
import type { VideoProvider, VideoPlayerProps, VideoPlayerState } from '@/types/video';

// =============================================================================
// CONSTANTS
// =============================================================================

const PROVIDER_CONFIGS: Record<VideoProvider, { embedPattern: RegExp; embedUrl: (id: string) => string }> = {
  vimeo: {
    embedPattern: /vimeo\.com\/(?:video\/)?(\d+)/,
    embedUrl: (id) => `https://player.vimeo.com/video/${id}?autoplay=0&dnt=1`,
  },
  youtube: {
    embedPattern: /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    embedUrl: (id) => `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0`,
  },
  wistia: {
    embedPattern: /wistia\.com\/(?:medias|embed)\/([a-zA-Z0-9]+)/,
    embedUrl: (id) => `https://fast.wistia.net/embed/iframe/${id}`,
  },
  custom: {
    embedPattern: /.*/,
    embedUrl: (url) => url,
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Detect video provider from URL
 */
function detectProvider(url: string): VideoProvider {
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('wistia.com')) return 'wistia';
  return 'custom';
}

/**
 * Extract video ID from URL based on provider
 */
function extractVideoId(url: string, provider: VideoProvider): string | null {
  const config = PROVIDER_CONFIGS[provider];
  const match = url.match(config.embedPattern);
  return match ? match[1] : null;
}

/**
 * Generate embed URL for provider
 */
function getEmbedUrl(url: string, provider: VideoProvider): string {
  if (provider === 'custom') {
    return url;
  }
  const videoId = extractVideoId(url, provider);
  if (!videoId) return url;
  return PROVIDER_CONFIGS[provider].embedUrl(videoId);
}

// =============================================================================
// COMPONENT
// =============================================================================

export function VideoPlayer({
  tacticId,
  videoUrl,
  videoProvider,
  duration = 0,
  thumbnailUrl,
  completionThreshold = 90,
  autoplay = false,
  startPosition = 0,
  onProgress,
  onComplete,
  onError,
  className,
}: VideoPlayerProps) {
  // Detect provider if not specified
  const provider = videoProvider || detectProvider(videoUrl);

  // Video progress hook
  const {
    progress,
    currentState,
    isLoading,
    isSaving,
    error,
    updateProgress,
    recordEvent,
    markComplete,
    getResumePosition,
    isGateMet,
    isAlmostComplete,
    remainingPercentage,
  } = useVideoProgress({
    tacticId,
    videoUrl,
    duration,
    completionThreshold,
    onComplete,
  });

  // Local player state
  const [playerState, setPlayerState] = useState<VideoPlayerState>({
    isPlaying: false,
    isPaused: true,
    isBuffering: false,
    isEnded: false,
    isMuted: false,
    isFullscreen: false,
    currentTime: startPosition,
    duration: duration,
    playbackRate: 1,
    volume: 1,
    quality: 'auto',
  });

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // =============================================================================
  // PLAYER COMMUNICATION
  // =============================================================================

  /**
   * Send postMessage to iframe player
   */
  const sendPlayerMessage = useCallback((action: string, value?: unknown) => {
    if (!iframeRef.current?.contentWindow) return;

    let message: unknown;

    switch (provider) {
      case 'vimeo':
        message = { method: action, value };
        break;
      case 'youtube':
        message = JSON.stringify({ event: 'command', func: action, args: value ? [value] : [] });
        break;
      case 'wistia':
        // Wistia uses a different API pattern
        message = { method: action, value };
        break;
      default:
        message = { action, value };
    }

    iframeRef.current.contentWindow.postMessage(message, '*');
  }, [provider]);

  /**
   * Handle messages from iframe player
   */
  const handlePlayerMessage = useCallback((event: MessageEvent) => {
    // Validate origin based on provider
    const validOrigins = ['https://player.vimeo.com', 'https://www.youtube.com', 'https://fast.wistia.net'];
    if (!validOrigins.some((origin) => event.origin.startsWith(origin))) return;

    let data = event.data;

    // Parse YouTube's stringified JSON
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return;
      }
    }

    // Handle Vimeo events
    if (data.event === 'ready') {
      setIsPlayerReady(true);
    } else if (data.event === 'playProgress' || data.event === 'timeupdate') {
      const seconds = data.data?.seconds || data.data?.currentTime || 0;
      const totalDuration = data.data?.duration || duration;

      setPlayerState((prev) => ({
        ...prev,
        currentTime: seconds,
        duration: totalDuration,
        isPlaying: true,
        isPaused: false,
      }));

      updateProgress(seconds, totalDuration);
      onProgress?.({
        currentTime: seconds,
        duration: totalDuration,
        watchPercentage: currentState.watchPercentage,
        isComplete: currentState.isComplete,
        thresholdMet: currentState.thresholdMet,
      });
    } else if (data.event === 'play') {
      setPlayerState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
      recordEvent('play', playerState.currentTime);
      if (!hasStarted) setHasStarted(true);
    } else if (data.event === 'pause') {
      setPlayerState((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
      recordEvent('pause', playerState.currentTime);
    } else if (data.event === 'ended' || data.event === 'finish') {
      setPlayerState((prev) => ({ ...prev, isPlaying: false, isEnded: true }));
      recordEvent('ended', playerState.currentTime);
    } else if (data.event === 'seek' || data.event === 'seeked') {
      const seconds = data.data?.seconds || 0;
      recordEvent('seek', seconds);
    }

    // Handle YouTube state changes
    if (data.event === 'onStateChange') {
      const state = data.info;
      if (state === 1) {
        // playing
        setPlayerState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
        if (!hasStarted) setHasStarted(true);
      } else if (state === 2) {
        // paused
        setPlayerState((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
      } else if (state === 0) {
        // ended
        setPlayerState((prev) => ({ ...prev, isPlaying: false, isEnded: true }));
      }
    }
  }, [duration, updateProgress, recordEvent, onProgress, currentState, playerState.currentTime, hasStarted]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Listen for player messages
  useEffect(() => {
    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [handlePlayerMessage]);

  // Auto-resume from last position
  useEffect(() => {
    if (isPlayerReady && progress?.last_position_seconds && !hasStarted) {
      const resumePosition = getResumePosition();
      if (resumePosition > 0) {
        sendPlayerMessage('seekTo', resumePosition);
      }
    }
  }, [isPlayerReady, progress, hasStarted, getResumePosition, sendPlayerMessage]);

  // Auto-hide controls
  useEffect(() => {
    if (playerState.isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [playerState.isPlaying]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handlePlay = () => {
    sendPlayerMessage('play');
  };

  const handlePause = () => {
    sendPlayerMessage('pause');
  };

  const handleRestart = () => {
    sendPlayerMessage('seekTo', 0);
    sendPlayerMessage('play');
  };

  const handleContainerClick = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (playerState.isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
      setPlayerState((prev) => ({ ...prev, isFullscreen: false }));
    } else {
      containerRef.current.requestFullscreen();
      setPlayerState((prev) => ({ ...prev, isFullscreen: true }));
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  if (error) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load video: {error}</span>
          </div>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const embedUrl = getEmbedUrl(videoUrl, provider);
  const watchPercentage = currentState.watchPercentage;
  const isComplete = currentState.thresholdMet || isGateMet;

  return (
    <div
      ref={containerRef}
      className={cn('relative group', className)}
      onClick={handleContainerClick}
    >
      {/* Video Container */}
      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-black">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Skeleton className="h-full w-full" />
            </div>
          )}

          {/* Thumbnail Overlay (before play) */}
          {!hasStarted && thumbnailUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center cursor-pointer z-10"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
            >
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Button
                  size="lg"
                  className="rounded-full h-16 w-16 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlay();
                  }}
                >
                  <Play className="h-8 w-8 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Video iframe */}
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Video player"
          />

          {/* Completion Badge */}
          {isComplete && (
            <div className="absolute top-4 right-4 z-20">
              <Badge className="bg-green-600 text-white gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </Badge>
            </div>
          )}

          {/* Almost Complete Badge */}
          {isAlmostComplete && !isComplete && (
            <div className="absolute top-4 right-4 z-20">
              <Badge variant="secondary" className="gap-1">
                {remainingPercentage.toFixed(0)}% to go
              </Badge>
            </div>
          )}

          {/* Saving Indicator */}
          {isSaving && (
            <div className="absolute top-4 left-4 z-20">
              <Badge variant="outline" className="bg-background/80 text-xs">
                Saving...
              </Badge>
            </div>
          )}

          {/* Custom Controls Overlay */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 z-20',
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            {/* Progress Bar */}
            <div className="mb-3">
              <Progress
                value={watchPercentage}
                className="h-1.5"
              />
              <div className="flex justify-between text-xs text-white/80 mt-1">
                <span>{formatPosition(playerState.currentTime)}</span>
                <span>{formatPosition(playerState.duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {playerState.isPlaying ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePause();
                    }}
                  >
                    <Pause className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay();
                    }}
                  >
                    <Play className="h-5 w-5" />
                  </Button>
                )}

                {playerState.isEnded && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestart();
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}

                <span className="text-white text-sm ml-2">
                  {watchPercentage.toFixed(0)}% watched
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFullscreen();
                  }}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Summary Below Video */}
        {progress && (
          <CardContent className="p-3 bg-muted/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">Lesson Complete</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    Watch {completionThreshold}% to complete
                  </span>
                )}
              </div>

              {progress.formattedWatchTime && (
                <span className="text-muted-foreground text-xs">
                  Total: {progress.formattedWatchTime}
                </span>
              )}
            </div>

            {/* Completion threshold indicator */}
            {!isComplete && (
              <div className="mt-2">
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-primary/30 rounded-full"
                    style={{ width: `${completionThreshold}%` }}
                  />
                  <div
                    className={cn(
                      'absolute h-full rounded-full transition-all duration-300',
                      isAlmostComplete ? 'bg-amber-500' : 'bg-primary'
                    )}
                    style={{ width: `${watchPercentage}%` }}
                  />
                  {/* Threshold marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
                    style={{ left: `${completionThreshold}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default VideoPlayer;
