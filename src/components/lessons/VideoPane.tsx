// ============================================================================
// FEAT-GH-013: Video Pane Component
// ============================================================================
// Video player with progress tracking supporting multiple providers
// Tracks watch progress and resumes from last position
// NOW INCLUDES: Iframe-based player tracking (YouTube, Vimeo, Loom)
// ============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  SkipForward,
  SkipBack,
  CheckCircle2,
  Clock,
} from 'lucide-react';

// Extend Window interface for YouTube API
declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

type VideoProvider = 'youtube' | 'vimeo' | 'wistia' | 'bunny' | 'loom' | 'custom' | null;

interface VideoPaneProps {
  videoUrl: string | null;
  videoProvider: VideoProvider;
  videoDurationSeconds: number | null;
  lastPositionMs: number;
  watchedPercent: number;
  requiredWatchPercent: number;
  onProgressUpdate: (percent: number, positionMs: number) => void;
  isCompleted?: boolean;
  className?: string;
}

/**
 * VideoPane - Video player with progress tracking
 * Supports YouTube, Vimeo, and direct video URLs
 */
export const VideoPane = ({
  videoUrl,
  videoProvider,
  videoDurationSeconds,
  lastPositionMs,
  watchedPercent,
  requiredWatchPercent,
  onProgressUpdate,
  isCompleted = false,
  className,
}: VideoPaneProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(lastPositionMs / 1000);
  const [duration, setDuration] = useState(videoDurationSeconds || 0);
  const [localWatchedPercent, setLocalWatchedPercent] = useState(watchedPercent);
  const [showControls, setShowControls] = useState(true);
  const [hlsError, setHlsError] = useState<string | null>(null);

  const gateMet = localWatchedPercent >= requiredWatchPercent;

  // Check if URL is HLS format
  const isHlsUrl = (url: string) => {
    return url.includes('.m3u8') || url.includes('manifest') || url.includes('/playlist');
  };

  // Determine if the URL actually needs HLS.js (check URL content, not just provider)
  const urlNeedsHls = videoUrl ? isHlsUrl(videoUrl) : false;

  // Initialize HLS.js for streaming videos (Bunny CDN HLS streams, etc.)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    // Only use HLS.js for actual HLS streams (must have .m3u8, manifest, or playlist in URL)
    // Don't rely solely on videoProvider='bunny' since Bunny can serve direct MP4 files too
    const needsHls = isHlsUrl(videoUrl);

    console.log('[VideoPane] Video setup:', { videoUrl, videoProvider, needsHls, urlNeedsHls });

    if (!needsHls) {
      // Direct video URL (MP4, WebM, etc.) - use native video element
      video.src = videoUrl;
      return;
    }

    // Check if browser natively supports HLS (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      return;
    }

    // Use HLS.js for browsers that don't support HLS natively
    if (Hls.isSupported()) {
      // Clean up existing instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hlsRef.current = hls;

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setHlsError(null);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('HLS network error, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('HLS media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal HLS error:', data);
              setHlsError('Video playback error. Please try again.');
              hls.destroy();
              break;
          }
        }
      });
    } else {
      setHlsError('Your browser does not support video streaming.');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl, videoProvider]);

  // Format time as mm:ss or hh:mm:ss
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress tracking - save every 5 seconds
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) return;

    progressIntervalRef.current = setInterval(() => {
      if (videoRef.current && duration > 0) {
        const currentSeconds = videoRef.current.currentTime;
        const percent = Math.round((currentSeconds / duration) * 100);

        // Only update if increased (prevent rewind gaming)
        if (percent > localWatchedPercent) {
          setLocalWatchedPercent(percent);
          onProgressUpdate(percent, currentSeconds * 1000);
        }
      }
    }, 5000);
  }, [duration, localWatchedPercent, onProgressUpdate]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTracking();
    };
  }, [stopProgressTracking]);

  // Handle video events
  const handlePlay = () => {
    setIsPlaying(true);
    startProgressTracking();
  };

  const handlePause = () => {
    setIsPlaying(false);
    stopProgressTracking();

    // Save progress on pause
    if (videoRef.current && duration > 0) {
      const currentSeconds = videoRef.current.currentTime;
      const percent = Math.round((currentSeconds / duration) * 100);
      if (percent > localWatchedPercent) {
        onProgressUpdate(percent, currentSeconds * 1000);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);

      // Resume from last position
      if (lastPositionMs > 0) {
        const resumeSeconds = lastPositionMs / 1000;
        // Don't resume if within 5 seconds of the end
        if (resumeSeconds < videoRef.current.duration - 5) {
          videoRef.current.currentTime = resumeSeconds;
        }
      }
    }
  };

  // Control functions
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.currentTime + 10,
        duration
      );
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        videoRef.current.currentTime - 10,
        0
      );
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = x / rect.width;
      videoRef.current.currentTime = percent * duration;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  // Get embed URL for iframe-based players
  const getEmbedUrl = () => {
    if (!videoUrl) return null;

    switch (videoProvider) {
      case 'youtube': {
        // Extract video ID from various YouTube URL formats
        const match = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (match) {
          return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&rel=0`;
        }
        return null;
      }
      case 'vimeo': {
        const match = videoUrl.match(/vimeo\.com\/(\d+)/);
        if (match) {
          return `https://player.vimeo.com/video/${match[1]}`;
        }
        return null;
      }
      case 'wistia': {
        const match = videoUrl.match(/wistia\.com\/medias\/(\w+)/);
        if (match) {
          return `https://fast.wistia.net/embed/iframe/${match[1]}`;
        }
        return null;
      }
      case 'loom': {
        // Extract video ID from loom.com/share/VIDEO_ID or loom.com/embed/VIDEO_ID
        const match = videoUrl.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
        if (match) {
          // Add parameters to hide UI elements that could lead users away from platform
          // hide_owner - hides owner avatar/name
          // hide_share - hides share button
          // hide_title - hides video title
          // hideEmbedTopBar - hides top bar with link/copy icons
          return `https://www.loom.com/embed/${match[1]}?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true`;
        }
        return null;
      }
      default: {
        // Auto-detect known embed platforms from URL (when video_provider not set correctly)
        // Loom detection
        const loomMatch = videoUrl.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
        if (loomMatch) {
          console.log('[VideoPane] Auto-detected Loom URL, converting to embed');
          // Add parameters to hide UI elements that could lead users away from platform
          return `https://www.loom.com/embed/${loomMatch[1]}?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true`;
        }
        // YouTube detection
        const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (ytMatch) {
          console.log('[VideoPane] Auto-detected YouTube URL, converting to embed');
          return `https://www.youtube.com/embed/${ytMatch[1]}?enablejsapi=1&rel=0`;
        }
        // Vimeo detection
        const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
          console.log('[VideoPane] Auto-detected Vimeo URL, converting to embed');
          return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }
        return null;
      }
    }
  };

  // Render nothing if no video
  if (!videoUrl) {
    return (
      <Card className={cn('bg-muted/50', className)}>
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No video for this lesson</p>
          </div>
        </div>
      </Card>
    );
  }

  // Iframe-based players (YouTube, Vimeo, Wistia, Loom)
  const embedUrl = getEmbedUrl();
  if (embedUrl) {
    return (
      <IframeVideoPlayer
        embedUrl={embedUrl}
        videoProvider={videoProvider}
        videoUrl={videoUrl}
        watchedPercent={watchedPercent}
        requiredWatchPercent={requiredWatchPercent}
        lastPositionMs={lastPositionMs}
        videoDurationSeconds={videoDurationSeconds}
        onProgressUpdate={onProgressUpdate}
        isCompleted={isCompleted}
        className={className}
      />
    );
  }

  // Native HTML5 video player
  return (
    <div className={cn('space-y-3', className)}>
      <Card
        className="overflow-hidden relative group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !isPlaying && setShowControls(true)}
      >
        <div className="aspect-video bg-black relative">
          {hlsError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white text-center p-4">
              <div>
                <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{hlsError}</p>
              </div>
            </div>
          ) : null}
          <video
            ref={videoRef}
            // src is handled by useEffect: either HLS.js sets it or we set it directly
            // Don't set src here to avoid conflicts with HLS.js attachment
            className="w-full h-full object-contain"
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={(e) => {
              console.error('[VideoPane] Video error:', e.currentTarget.error);
              setHlsError('Video failed to load. Please check the video URL.');
            }}
            playsInline
          />

          {/* Play/Pause overlay */}
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity cursor-pointer',
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
            )}
            onClick={togglePlay}
          >
            <Button
              variant="secondary"
              size="icon"
              className="h-16 w-16 rounded-full bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
          </div>

          {/* Custom controls bar */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity',
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
            )}
          >
            {/* Progress bar */}
            <div
              className="relative h-1.5 bg-white/30 rounded-full cursor-pointer mb-3"
              onClick={handleSeek}
            >
              <div
                className="absolute h-full bg-white/50 rounded-full"
                style={{ width: `${localWatchedPercent}%` }}
              />
              <div
                className="absolute h-full bg-primary rounded-full"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
              <div
                className="absolute h-3 w-3 bg-primary rounded-full -top-[3px] transform -translate-x-1/2"
                style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={skipBackward}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={skipForward}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                <span className="text-sm tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={restartVideo}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress summary */}
      <VideoProgressSummary
        watchedPercent={localWatchedPercent}
        requiredPercent={requiredWatchPercent}
        gateMet={gateMet}
      />
    </div>
  );
};

/**
 * IframeVideoPlayer - Iframe video player with progress tracking
 * Supports YouTube, Vimeo, Loom with progress tracking via SDK/postMessage APIs
 */
interface IframeVideoPlayerProps {
  embedUrl: string;
  videoProvider: VideoProvider;
  videoUrl: string | null;
  watchedPercent: number;
  requiredWatchPercent: number;
  lastPositionMs: number;
  videoDurationSeconds: number | null;
  onProgressUpdate: (percent: number, positionMs: number) => void;
  isCompleted?: boolean;
  className?: string;
}

const IframeVideoPlayer = ({
  embedUrl,
  videoProvider,
  videoUrl,
  watchedPercent,
  requiredWatchPercent,
  lastPositionMs,
  videoDurationSeconds,
  onProgressUpdate,
  isCompleted = false,
  className,
}: IframeVideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [localWatchedPercent, setLocalWatchedPercent] = useState(watchedPercent);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(videoDurationSeconds || 0);
  const iframeId = useRef(`video-iframe-${Math.random().toString(36).substr(2, 9)}`);

  // Determine the actual provider from the embed URL if not set
  const detectProvider = useCallback((): 'youtube' | 'vimeo' | 'loom' | 'wistia' | 'unknown' => {
    if (videoProvider === 'youtube' || embedUrl.includes('youtube.com')) return 'youtube';
    if (videoProvider === 'vimeo' || embedUrl.includes('vimeo.com')) return 'vimeo';
    if (videoProvider === 'loom' || embedUrl.includes('loom.com')) return 'loom';
    if (videoProvider === 'wistia' || embedUrl.includes('wistia')) return 'wistia';
    return 'unknown';
  }, [videoProvider, embedUrl]);

  const actualProvider = detectProvider();

  // Load YouTube IFrame API
  useEffect(() => {
    if (actualProvider !== 'youtube') return;

    // Load the YouTube IFrame API script if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Initialize player when API is ready
    const initPlayer = () => {
      if (!window.YT || !iframeRef.current) return;

      try {
        ytPlayerRef.current = new window.YT.Player(iframeId.current, {
          events: {
            onReady: (event) => {
              console.log('[VideoPane] YouTube player ready');
              const duration = event.target.getDuration();
              if (duration > 0) {
                setCurrentDuration(duration);
              }
              // Seek to last position if applicable
              if (lastPositionMs > 0) {
                const seekTo = lastPositionMs / 1000;
                // Access seekTo through the event target
                (event.target as YTPlayer & { seekTo: (seconds: number, allowSeekAhead: boolean) => void }).seekTo(seekTo, true);
              }
            },
            onStateChange: (event) => {
              if (event.data === window.YT?.PlayerState.PLAYING) {
                console.log('[VideoPane] YouTube playing');
                setIsPlaying(true);
              } else if (event.data === window.YT?.PlayerState.PAUSED || event.data === window.YT?.PlayerState.ENDED) {
                console.log('[VideoPane] YouTube paused/ended');
                setIsPlaying(false);
              }
            },
          },
        });
      } catch (error) {
        console.error('[VideoPane] Error initializing YouTube player:', error);
      }
    };

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      // Small delay to ensure iframe is in DOM
      setTimeout(initPlayer, 100);
    } else {
      // Wait for API to load
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
        ytPlayerRef.current = null;
      }
    };
  }, [actualProvider, embedUrl, lastPositionMs]);

  // Vimeo postMessage listener
  useEffect(() => {
    if (actualProvider !== 'vimeo') return;

    const handleVimeoMessage = (event: MessageEvent) => {
      if (!event.origin.includes('vimeo.com')) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (data.event === 'ready') {
          console.log('[VideoPane] Vimeo player ready');
          // Request playback info
          const iframe = iframeRef.current;
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ method: 'getDuration' }, '*');
            iframe.contentWindow.postMessage({ method: 'addEventListener', value: 'playProgress' }, '*');
            iframe.contentWindow.postMessage({ method: 'addEventListener', value: 'play' }, '*');
            iframe.contentWindow.postMessage({ method: 'addEventListener', value: 'pause' }, '*');
          }
        } else if (data.event === 'playProgress' && data.data) {
          const { seconds, percent, duration: videoDuration } = data.data;
          if (videoDuration && videoDuration > 0) {
            setCurrentDuration(videoDuration);
          }
          const percentValue = Math.round(percent * 100);
          if (percentValue > localWatchedPercent) {
            setLocalWatchedPercent(percentValue);
            onProgressUpdate(percentValue, seconds * 1000);
          }
        } else if (data.event === 'play') {
          setIsPlaying(true);
        } else if (data.event === 'pause') {
          setIsPlaying(false);
        } else if (data.method === 'getDuration' && data.value) {
          setCurrentDuration(data.value);
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleVimeoMessage);

    // Initialize Vimeo player communication after iframe loads
    const initVimeo = () => {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ method: 'addEventListener', value: 'ready' }, '*');
      }
    };

    // Small delay to ensure iframe is loaded
    const timeoutId = setTimeout(initVimeo, 1000);

    return () => {
      window.removeEventListener('message', handleVimeoMessage);
      clearTimeout(timeoutId);
    };
  }, [actualProvider, localWatchedPercent, onProgressUpdate]);

  // Loom postMessage listener (Loom uses postMessage for events)
  // Note: Loom's public embed API is limited - they don't expose full playback events
  // We use a combination of postMessage detection and click-based fallback tracking
  useEffect(() => {
    if (actualProvider !== 'loom') return;

    console.log('[VideoPane] Setting up Loom message listener');

    const handleLoomMessage = (event: MessageEvent) => {
      // Log ALL messages from loom.com for debugging
      if (event.origin.includes('loom.com')) {
        console.log('[VideoPane] Loom message received:', {
          origin: event.origin,
          data: event.data,
          type: typeof event.data
        });
      }

      if (!event.origin.includes('loom.com')) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // Try multiple possible event formats Loom might use
        if (data.type === 'loom-player-event' || data.type === 'player-event' || data.event) {
          const eventName = data.event || data.name || data.type;
          console.log('[VideoPane] Loom event detected:', eventName, data);

          if (eventName === 'play' || eventName === 'playing' || eventName === 'start') {
            console.log('[VideoPane] Loom playing');
            setIsPlaying(true);
          } else if (eventName === 'pause' || eventName === 'paused' || eventName === 'ended' || eventName === 'end') {
            console.log('[VideoPane] Loom paused/ended');
            setIsPlaying(false);
          } else if ((eventName === 'timeupdate' || eventName === 'progress') && data.data) {
            const { currentTime, duration } = data.data;
            if (duration > 0) {
              setCurrentDuration(duration);
              const percent = Math.round((currentTime / duration) * 100);
              if (percent > localWatchedPercent) {
                setLocalWatchedPercent(percent);
                onProgressUpdate(percent, currentTime * 1000);
              }
            }
          }
        }

        // Loom might send duration info in various formats
        if (data.duration && data.duration > 0) {
          console.log('[VideoPane] Loom duration detected:', data.duration);
          setCurrentDuration(data.duration);
        }
      } catch (e) {
        // Non-JSON message - log it for debugging
        console.log('[VideoPane] Loom non-JSON message:', event.data);
      }
    };

    window.addEventListener('message', handleLoomMessage);

    return () => {
      window.removeEventListener('message', handleLoomMessage);
    };
  }, [actualProvider, localWatchedPercent, onProgressUpdate]);

  // YouTube progress tracking interval
  useEffect(() => {
    if (actualProvider !== 'youtube') return;
    if (!isPlaying) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    // Track progress every 5 seconds while playing
    progressIntervalRef.current = setInterval(() => {
      if (ytPlayerRef.current) {
        try {
          const currentTime = ytPlayerRef.current.getCurrentTime();
          const duration = ytPlayerRef.current.getDuration();
          if (duration > 0) {
            setCurrentDuration(duration);
            const percent = Math.round((currentTime / duration) * 100);
            if (percent > localWatchedPercent) {
              console.log('[VideoPane] YouTube progress update:', percent, '%');
              setLocalWatchedPercent(percent);
              onProgressUpdate(percent, currentTime * 1000);
            }
          }
        } catch (e) {
          console.error('[VideoPane] Error getting YouTube progress:', e);
        }
      }
    }, 5000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [actualProvider, isPlaying, localWatchedPercent, onProgressUpdate]);

  // Ref to track isPlaying inside intervals without causing re-runs
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Loom play detection using multiple strategies
  // Cross-origin iframes don't expose click events, so we use:
  // 1. SUSTAINED focus detection - user must keep focus on iframe for 3+ seconds
  // 2. Focus loss detection to pause tracking
  // NOTE: Requires sustained interaction to prevent false positives from momentary clicks
  useEffect(() => {
    if (actualProvider !== 'loom') return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    console.log('[VideoPane] Setting up Loom play detection (sustained focus)');

    let hasDetectedPlay = false;
    let pollInterval: NodeJS.Timeout | null = null;
    let focusStartTime: number | null = null;
    const REQUIRED_FOCUS_DURATION = 3000; // 3 seconds of sustained focus required

    const startTracking = (reason: string) => {
      if (!hasDetectedPlay) {
        console.log(`[VideoPane] Loom playback detected: ${reason}`);
        hasDetectedPlay = true;
        setIsPlaying(true);
      }
    };

    const stopTracking = (reason: string) => {
      if (hasDetectedPlay) {
        console.log(`[VideoPane] Loom playback paused: ${reason}`);
        setIsPlaying(false);
        // Reset focus tracking but keep hasDetectedPlay true
        // so we can resume without needing the sustained focus again
        focusStartTime = null;
      }
    };

    // Poll to detect SUSTAINED focus on iframe
    // Only start tracking after user maintains focus for REQUIRED_FOCUS_DURATION
    pollInterval = setInterval(() => {
      const activeEl = document.activeElement;
      const isIframeFocused = activeEl === iframe ||
        (activeEl?.tagName === 'IFRAME' && (activeEl.getAttribute('src') || '').includes('loom.com'));

      if (isIframeFocused) {
        if (focusStartTime === null) {
          // First time detecting focus - start the timer
          focusStartTime = Date.now();
          console.log('[VideoPane] Loom iframe focus detected, starting timer...');
        } else if (!hasDetectedPlay) {
          // Check if we've maintained focus long enough
          const focusDuration = Date.now() - focusStartTime;
          if (focusDuration >= REQUIRED_FOCUS_DURATION) {
            startTracking(`sustained focus for ${Math.round(focusDuration / 1000)}s`);
          }
        } else if (!isPlayingRef.current) {
          // User returned focus to iframe after previously watching - resume immediately
          console.log('[VideoPane] Loom iframe focus resumed');
          setIsPlaying(true);
        }
      } else {
        // Focus left the iframe
        if (focusStartTime !== null && !hasDetectedPlay) {
          console.log('[VideoPane] Loom focus lost before sustained duration reached');
          focusStartTime = null;
        }
        // If we were tracking, pause when focus leaves
        if (isPlayingRef.current && hasDetectedPlay) {
          stopTracking('focus left iframe');
        }
      }
    }, 500);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [actualProvider]);

  // Fallback progress tracking for providers without SDK support
  // Uses time-based estimation if we have duration info
  useEffect(() => {
    if (actualProvider === 'youtube' || actualProvider === 'vimeo') return; // These have proper tracking
    if (actualProvider !== 'loom' && actualProvider !== 'wistia' && actualProvider !== 'unknown') return;

    // For Loom: If postMessage doesn't work, use a time-based fallback
    // Note: This is less accurate but better than nothing
    if (!isPlaying) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    console.log('[VideoPane] Starting fallback time-based tracking for', actualProvider);

    // Fallback: increment progress based on estimated playback
    // Only if we have a known duration
    const duration = currentDuration || videoDurationSeconds || 0;

    if (duration > 0) {
      let estimatedSeconds = (localWatchedPercent / 100) * duration;

      progressIntervalRef.current = setInterval(() => {
        estimatedSeconds += 5; // Increment by 5 seconds
        const percent = Math.min(100, Math.round((estimatedSeconds / duration) * 100));
        if (percent > localWatchedPercent) {
          console.log('[VideoPane] Fallback progress update:', percent, '% (estimated', Math.round(estimatedSeconds), 's of', Math.round(duration), 's)');
          setLocalWatchedPercent(percent);
          onProgressUpdate(percent, estimatedSeconds * 1000);
        }
      }, 5000);
    } else {
      // No duration known - use a slower default estimation (assume 5 minute video)
      const assumedDuration = 300; // 5 minutes
      let estimatedSeconds = (localWatchedPercent / 100) * assumedDuration;

      console.log('[VideoPane] No duration known, using 5-minute estimate for tracking');

      progressIntervalRef.current = setInterval(() => {
        estimatedSeconds += 5; // Increment by 5 seconds
        const percent = Math.min(100, Math.round((estimatedSeconds / assumedDuration) * 100));
        if (percent > localWatchedPercent) {
          console.log('[VideoPane] Fallback progress (estimated):', percent, '%');
          setLocalWatchedPercent(percent);
          onProgressUpdate(percent, estimatedSeconds * 1000);
        }
      }, 5000);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [actualProvider, isPlaying, localWatchedPercent, currentDuration, videoDurationSeconds, onProgressUpdate]);

  // Update local watched percent when prop changes
  useEffect(() => {
    if (watchedPercent > localWatchedPercent) {
      setLocalWatchedPercent(watchedPercent);
    }
  }, [watchedPercent]);

  const gateMet = localWatchedPercent >= requiredWatchPercent;

  // Generate the correct embed URL with API parameters for tracking
  const getTrackingEnabledUrl = () => {
    let url = embedUrl;

    if (actualProvider === 'youtube') {
      // Ensure enablejsapi=1 is in the URL for YouTube API access
      if (!url.includes('enablejsapi=1')) {
        url += url.includes('?') ? '&enablejsapi=1' : '?enablejsapi=1';
      }
      // Add origin for security (allows postMessage)
      if (!url.includes('origin=')) {
        url += `&origin=${encodeURIComponent(window.location.origin)}`;
      }
    } else if (actualProvider === 'vimeo') {
      // Enable Vimeo API
      if (!url.includes('api=1')) {
        url += url.includes('?') ? '&api=1' : '?api=1';
      }
      // Add player_id for targeting
      if (!url.includes('player_id=')) {
        url += `&player_id=${iframeId.current}`;
      }
    }

    return url;
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Card className="overflow-hidden">
        <div className="aspect-video relative">
          <iframe
            ref={iframeRef}
            id={iframeId.current}
            src={getTrackingEnabledUrl()}
            title="Video player"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Card>

      {/* Progress summary for embedded videos */}
      <VideoProgressSummary
        watchedPercent={localWatchedPercent}
        requiredPercent={requiredWatchPercent}
        gateMet={isCompleted || gateMet}
      />
    </div>
  );
};

/**
 * VideoProgressSummary - Shows watch progress and gate status
 */
interface VideoProgressSummaryProps {
  watchedPercent: number;
  requiredPercent: number;
  gateMet: boolean;
}

const VideoProgressSummary = ({
  watchedPercent,
  requiredPercent,
  gateMet,
}: VideoProgressSummaryProps) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">
        {watchedPercent}% watched
      </span>
      {gateMet && (
        <span className="flex items-center gap-1 text-primary font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Complete
        </span>
      )}
    </div>
    <span className="text-xs text-muted-foreground">
      {requiredPercent}% required
    </span>
  </div>
);

/**
 * VideoPaneSkeleton - Loading state
 */
export const VideoPaneSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="aspect-video rounded-lg" />
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);
