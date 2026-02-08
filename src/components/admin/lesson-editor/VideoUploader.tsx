// ============================================================================
// FEAT-GH-016: Video Uploader Component
// ============================================================================
// Video URL input with provider auto-detection (YouTube, Vimeo, Wistia, Bunny)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Video,
  Link2,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Play,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type VideoProvider = 'youtube' | 'vimeo' | 'wistia' | 'bunny' | 'loom' | 'custom' | null;

interface VideoUploaderProps {
  videoUrl: string | null;
  videoProvider: VideoProvider;
  videoDuration: number | null;
  onVideoChange: (url: string, provider: VideoProvider, duration: number | null) => void;
  disabled?: boolean;
}

interface VideoPreviewProps {
  url: string;
  provider: VideoProvider;
}

// ============================================================================
// Provider Detection
// ============================================================================

const detectVideoProvider = (url: string): VideoProvider => {
  if (!url) return null;

  const lowercaseUrl = url.toLowerCase();

  // YouTube patterns
  if (
    lowercaseUrl.includes('youtube.com') ||
    lowercaseUrl.includes('youtu.be')
  ) {
    return 'youtube';
  }

  // Vimeo patterns
  if (lowercaseUrl.includes('vimeo.com')) {
    return 'vimeo';
  }

  // Wistia patterns
  if (
    lowercaseUrl.includes('wistia.com') ||
    lowercaseUrl.includes('wistia.net') ||
    lowercaseUrl.includes('wi.st')
  ) {
    return 'wistia';
  }

  // Bunny.net patterns
  if (
    lowercaseUrl.includes('bunny.net') ||
    lowercaseUrl.includes('bunnycdn.com') ||
    lowercaseUrl.includes('b-cdn.net')
  ) {
    return 'bunny';
  }

  // Loom patterns
  if (lowercaseUrl.includes('loom.com')) {
    return 'loom';
  }

  // Has video extension - custom
  if (/\.(mp4|webm|mov|avi|mkv|m3u8)(\?|$)/i.test(url)) {
    return 'custom';
  }

  return 'custom';
};

// ============================================================================
// Extract Video ID (for embeds)
// ============================================================================

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&?/]+)/,
    /youtube\.com\/shorts\/([^&?/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const extractVimeoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

const extractLoomId = (url: string): string | null => {
  // Matches both /share/ and /embed/ URLs
  const match = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

// ============================================================================
// Video Preview Component
// ============================================================================

const VideoPreview = ({ url, provider }: VideoPreviewProps) => {
  if (!url) return null;

  // YouTube embed
  if (provider === 'youtube') {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video preview"
          />
        </div>
      );
    }
  }

  // Vimeo embed
  if (provider === 'vimeo') {
    const videoId = extractVimeoId(url);
    if (videoId) {
      return (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={`https://player.vimeo.com/video/${videoId}`}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Video preview"
          />
        </div>
      );
    }
  }

  // Wistia embed
  if (provider === 'wistia') {
    // Extract Wistia video ID
    const match = url.match(/(?:wistia\.com\/medias\/|wi\.st\/medias\/)([a-zA-Z0-9]+)/);
    if (match) {
      return (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={`https://fast.wistia.net/embed/iframe/${match[1]}`}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Video preview"
          />
        </div>
      );
    }
  }

  // Loom embed
  if (provider === 'loom') {
    const videoId = extractLoomId(url);
    if (videoId) {
      return (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={`https://www.loom.com/embed/${videoId}`}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Video preview"
          />
        </div>
      );
    }
  }

  // Bunny or custom video - use native player
  if (provider === 'bunny' || provider === 'custom') {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        <video
          src={url}
          className="w-full h-full"
          controls
          preload="metadata"
        >
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Fallback - just show link
  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Play className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground truncate max-w-md">
            {url}
          </span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" />
            Open
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Provider Badge
// ============================================================================

const ProviderBadge = ({ provider }: { provider: VideoProvider }) => {
  if (!provider) return null;

  const providerColors: Record<string, string> = {
    youtube: 'bg-red-500/10 text-red-700 border-red-200',
    vimeo: 'bg-blue-500/10 text-blue-700 border-blue-200',
    wistia: 'bg-purple-500/10 text-purple-700 border-purple-200',
    bunny: 'bg-orange-500/10 text-orange-700 border-orange-200',
    loom: 'bg-pink-500/10 text-pink-700 border-pink-200',
    custom: 'bg-gray-500/10 text-gray-700 border-gray-200',
  };

  const providerLabels: Record<string, string> = {
    youtube: 'YouTube',
    vimeo: 'Vimeo',
    wistia: 'Wistia',
    bunny: 'Bunny',
    loom: 'Loom',
    custom: 'Direct URL',
  };

  return (
    <Badge variant="outline" className={providerColors[provider]}>
      <Video className="h-3 w-3 mr-1" />
      {providerLabels[provider]}
    </Badge>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const VideoUploader = ({
  videoUrl,
  videoProvider,
  videoDuration,
  onVideoChange,
  disabled,
}: VideoUploaderProps) => {
  const [inputUrl, setInputUrl] = useState(videoUrl || '');
  const [detectedProvider, setDetectedProvider] = useState<VideoProvider>(videoProvider);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | null>(null);

  // Update input when prop changes
  useEffect(() => {
    setInputUrl(videoUrl || '');
    setDetectedProvider(videoProvider);
  }, [videoUrl, videoProvider]);

  // Validate URL and detect provider
  const handleUrlChange = useCallback((url: string) => {
    setInputUrl(url);
    setValidationStatus(null);

    if (!url.trim()) {
      setDetectedProvider(null);
      onVideoChange('', null, null);
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
      const provider = detectVideoProvider(url);
      setDetectedProvider(provider);
      setValidationStatus('valid');
      onVideoChange(url, provider, videoDuration);
    } catch {
      setValidationStatus('invalid');
    }
  }, [onVideoChange, videoDuration]);

  // Debounced URL validation
  useEffect(() => {
    if (!inputUrl) return;

    setIsValidating(true);
    const timer = setTimeout(() => {
      handleUrlChange(inputUrl);
      setIsValidating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputUrl, handleUrlChange]);

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="video-url" className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Video URL
        </Label>
        <div className="relative">
          <Input
            id="video-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=... or paste any video URL"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            disabled={disabled}
            className={`pr-24 ${
              validationStatus === 'invalid' ? 'border-red-500' : ''
            } ${validationStatus === 'valid' ? 'border-green-500' : ''}`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isValidating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {validationStatus === 'valid' && !isValidating && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {validationStatus === 'invalid' && !isValidating && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            {detectedProvider && <ProviderBadge provider={detectedProvider} />}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Supports YouTube, Vimeo, Wistia, Loom, Bunny CDN, or direct video URLs (.mp4, .webm)
        </p>
      </div>

      {/* Video Preview */}
      {inputUrl && validationStatus === 'valid' && detectedProvider && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <VideoPreview url={inputUrl} provider={detectedProvider} />
        </div>
      )}

      {/* Duration Input (manual for now) */}
      {inputUrl && validationStatus === 'valid' && (
        <div className="space-y-2">
          <Label htmlFor="video-duration">
            Video Duration (seconds)
          </Label>
          <Input
            id="video-duration"
            type="number"
            placeholder="Enter duration in seconds (e.g., 300 for 5 minutes)"
            value={videoDuration || ''}
            onChange={(e) => {
              const duration = e.target.value ? parseInt(e.target.value, 10) : null;
              onVideoChange(inputUrl, detectedProvider, duration);
            }}
            disabled={disabled}
            min={0}
          />
          <p className="text-xs text-muted-foreground">
            Optional: Used for progress tracking and estimated duration display
          </p>
        </div>
      )}

      {/* Validation Error */}
      {validationStatus === 'invalid' && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          Please enter a valid URL
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
