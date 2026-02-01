import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play, Pause, Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// MIO v3.0 - VOICE METADATA TYPES (Capability 29)
// ============================================================================

/**
 * Prosodic metadata captured during voice recording
 * Used by MIO to detect confidence, hesitation, and emotional patterns
 *
 * WHAT THIS REVEALS:
 * - Restart count: Self-doubt or perfectionism patterns
 * - Pause timestamps: Resistance before certain phrases
 * - Speech rate: Confidence levels (fast = nervous or confident)
 * - Hesitation ratio: Overall uncertainty in identity statements
 */
export interface VoiceMetadata {
  /** Total recording duration in seconds */
  durationSeconds: number;
  /** Number of times user deleted and restarted recording */
  restartCount: number;
  /** Timestamps (in seconds) where pauses were detected during recording */
  pauseTimestamps: number[];
  /** Number of significant pauses (>1s) detected */
  pauseCount: number;
  /** Device type for context (mobile often = more casual/honest) */
  deviceType: 'mobile' | 'desktop' | 'tablet';
  /** Recording start time for circadian analysis */
  recordingStartTime: string;
  /** Recording end time */
  recordingEndTime: string;
  /** Total session time including restarts (ms) */
  totalSessionTimeMs: number;
  /** Audio format used */
  audioFormat: string;
  /** User's estimated speech rate based on duration vs text length (if available) */
  estimatedSpeechRate?: 'slow' | 'normal' | 'fast';
  /** Confidence indicators derived from recording behavior */
  confidenceIndicators: string[];
  /** Hesitation ratio: time spent paused / total duration */
  hesitationRatio: number;
}

interface VoiceRecorderProps {
  onComplete: (audioUrl: string, duration: number, metadata?: VoiceMetadata) => void;
  minDuration?: number;
  /** Optional: estimated word count for speech rate calculation */
  estimatedWordCount?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua);
  const isTablet = /ipad|android(?!.*mobile)|tablet/.test(ua);
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

function calculateSpeechRate(
  durationSeconds: number,
  estimatedWordCount?: number
): 'slow' | 'normal' | 'fast' | undefined {
  if (!estimatedWordCount || durationSeconds < 10) return undefined;

  const wordsPerMinute = (estimatedWordCount / durationSeconds) * 60;

  // Average speaking rate is 120-150 WPM
  if (wordsPerMinute < 100) return 'slow';
  if (wordsPerMinute > 160) return 'fast';
  return 'normal';
}

function deriveConfidenceIndicators(
  restartCount: number,
  pauseCount: number,
  durationSeconds: number,
  hesitationRatio: number
): string[] {
  const indicators: string[] = [];

  // Low restarts = committed, confident
  if (restartCount === 0) {
    indicators.push('no_restarts');
  } else if (restartCount >= 3) {
    indicators.push('multiple_restarts');
  }

  // Low pause ratio = steady delivery
  if (hesitationRatio < 0.1) {
    indicators.push('steady_pace');
  } else if (hesitationRatio > 0.3) {
    indicators.push('frequent_pauses');
  }

  // Long duration relative to minimum = thorough, committed
  if (durationSeconds > 60) {
    indicators.push('extended_recording');
  }

  // Few pauses = confident flow
  if (pauseCount === 0) {
    indicators.push('uninterrupted_flow');
  }

  return indicators;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VoiceRecorder({
  onComplete,
  minDuration = 30,
  estimatedWordCount
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // MIO v3.0 - Voice metadata tracking refs
  const restartCountRef = useRef(0);
  const sessionStartTimeRef = useRef<number>(0);
  const recordingStartTimeRef = useRef<string>('');
  const pauseTimestampsRef = useRef<number[]>([]);
  const lastAudioLevelCheckRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Helper to get supported mimeType for MediaRecorder
  // iOS Safari doesn't support webm, needs mp4
  const getSupportedMimeType = (): string => {
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
    return ''; // Let browser choose default
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = getSupportedMimeType();
      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // MIO v3.0 - Initialize session tracking on first recording
      if (sessionStartTimeRef.current === 0) {
        sessionStartTimeRef.current = Date.now();
      }

      // Track recording start time for circadian analysis
      recordingStartTimeRef.current = new Date().toISOString();
      pauseTimestampsRef.current = [];
      silenceStartRef.current = null;

      // Set up audio analysis for pause detection
      try {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
      } catch (audioError) {
        console.warn('[VoiceRecorder] Audio analysis setup failed:', audioError);
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Use the actual mimeType from the recorder
        const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: actualMimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        stream.getTracks().forEach(track => track.stop());

        // Clean up audio context
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start duration timer and pause detection
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;

          // MIO v3.0 - Detect pauses using audio level analysis
          if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const avgLevel = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

            // Silence threshold (adjust based on testing)
            const SILENCE_THRESHOLD = 10;
            const PAUSE_DURATION_THRESHOLD = 1; // 1 second

            if (avgLevel < SILENCE_THRESHOLD) {
              // Silence detected
              if (silenceStartRef.current === null) {
                silenceStartRef.current = newDuration;
              } else {
                const silenceDuration = newDuration - silenceStartRef.current;
                if (silenceDuration >= PAUSE_DURATION_THRESHOLD) {
                  // Only add if not already tracked at this timestamp
                  const lastPause = pauseTimestampsRef.current[pauseTimestampsRef.current.length - 1];
                  if (lastPause !== silenceStartRef.current) {
                    pauseTimestampsRef.current.push(silenceStartRef.current);
                  }
                }
              }
            } else {
              // Sound detected, reset silence tracking
              silenceStartRef.current = null;
            }
          }

          return newDuration;
        });
      }, 1000);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Microphone Access Required',
        description: 'Please allow microphone access to record your identity statement.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);

    // MIO v3.0 - Track restart count (indicates self-doubt or perfectionism)
    restartCountRef.current++;
    console.log('[VoiceRecorder] Recording reset. Restart count:', restartCountRef.current);
  };

  // MIO v3.0 - Build voice metadata for behavioral analysis
  const buildVoiceMetadata = useCallback((): VoiceMetadata => {
    const recordingEndTime = new Date().toISOString();
    const totalSessionTimeMs = Date.now() - sessionStartTimeRef.current;
    const pauseCount = pauseTimestampsRef.current.length;

    // Calculate hesitation ratio (time spent paused / total duration)
    // Estimate pause duration as 1.5s average per detected pause
    const estimatedPauseTime = pauseCount * 1.5;
    const hesitationRatio = duration > 0 ? Math.min(1, estimatedPauseTime / duration) : 0;

    const metadata: VoiceMetadata = {
      durationSeconds: duration,
      restartCount: restartCountRef.current,
      pauseTimestamps: pauseTimestampsRef.current,
      pauseCount,
      deviceType: getDeviceType(),
      recordingStartTime: recordingStartTimeRef.current,
      recordingEndTime,
      totalSessionTimeMs,
      audioFormat: audioBlob?.type || 'audio/webm',
      estimatedSpeechRate: calculateSpeechRate(duration, estimatedWordCount),
      confidenceIndicators: deriveConfidenceIndicators(
        restartCountRef.current,
        pauseCount,
        duration,
        hesitationRatio
      ),
      hesitationRatio
    };

    console.log('[VoiceRecorder] Voice metadata captured:', {
      duration: metadata.durationSeconds,
      restarts: metadata.restartCount,
      pauses: metadata.pauseCount,
      confidence: metadata.confidenceIndicators,
      hesitation: metadata.hesitationRatio.toFixed(2)
    });

    return metadata;
  }, [duration, audioBlob, estimatedWordCount]);

  const uploadRecording = async () => {
    if (!audioBlob) return;

    if (duration < minDuration) {
      toast({
        variant: 'destructive',
        title: 'Recording Too Short',
        description: `Please record at least ${minDuration} seconds.`,
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Determine file extension based on blob type
      const blobType = audioBlob.type || 'audio/webm';
      const extension = blobType.includes('mp4') ? 'mp4' : blobType.includes('webm') ? 'webm' : 'audio';

      const timestamp = Date.now();
      const fileName = `${user.id}/identity_statements/${timestamp}.${extension}`;

      const { data, error } = await supabase.storage
        .from('voice-recordings')
        .upload(fileName, audioBlob, {
          contentType: blobType,
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-recordings')
        .getPublicUrl(fileName);

      // MIO v3.0 - Build voice metadata before completing
      const voiceMetadata = buildVoiceMetadata();

      toast({
        title: 'Recording Saved!',
        description: 'Your identity statement has been captured.',
      });

      // Pass metadata to parent component for storage with practice data
      onComplete(publicUrl, duration, voiceMetadata);

      // MIO v3.0 - Trigger async voice pattern analysis (non-blocking)
      // This sends to n8n for prosodic feature extraction and storage
      const N8N_VOICE_WEBHOOK = 'https://n8n-n8n.vq00fr.easypanel.host/webhook/voice-pattern-analyze';
      fetch(N8N_VOICE_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          recording_url: publicUrl,
          voice_metadata: voiceMetadata,
          practice_type: 'R', // Reinforcement practice
          timestamp: new Date().toISOString()
        })
      }).catch(err => {
        // Non-blocking - log but don't fail the upload
        console.warn('[VoiceRecorder] Voice pattern analysis trigger failed:', err);
      });

      // Reset for next recording (don't increment restart count on successful upload)
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setAudioBlob(null);
      setAudioUrl(null);
      setDuration(0);
      setIsPlaying(false);

      // Reset metadata refs for next session
      restartCountRef.current = 0;
      sessionStartTimeRef.current = 0;
      pauseTimestampsRef.current = [];

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to save recording. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">
            {formatTime(duration)}
          </div>
          {minDuration && (
            <p className="text-sm text-muted-foreground">
              Minimum {minDuration} seconds required
            </p>
          )}
        </div>

        {/* Recording Controls */}
        {!audioBlob && (
          <div className="flex justify-center gap-2">
            {!isRecording ? (
              <Button
                size="lg"
                onClick={startRecording}
                className="gap-2"
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </Button>
            ) : (
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                className="gap-2"
              >
                <Square className="w-5 h-5" />
                Stop Recording
              </Button>
            )}
          </div>
        )}

        {/* Playback Controls */}
        {audioBlob && !isUploading && (
          <div className="space-y-3">
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={togglePlayback}
                className="gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Play Recording
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={resetRecording}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
            
            <Button
              size="lg"
              onClick={uploadRecording}
              disabled={duration < minDuration}
              className="w-full gap-2"
            >
              <Upload className="w-5 h-5" />
              Save Recording
            </Button>
            
            {duration < minDuration && (
              <p className="text-sm text-destructive text-center">
                Need {minDuration - duration} more seconds
              </p>
            )}
          </div>
        )}

        {isUploading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        )}
      </div>
    </Card>
  );
}
