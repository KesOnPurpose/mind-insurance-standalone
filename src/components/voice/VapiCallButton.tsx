// ============================================================================
// VAPI CALL BUTTON
// Web-based voice call component using Vapi Web SDK
// Replaces GHL Voice AI with sub-500ms latency
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceVisualization } from './VoiceVisualization';
import { ModernCallIcon } from './ModernCallIcon';
import { cn } from '@/lib/utils';
import type { VoiceCallState } from '@/types/voice-visualization';
import {
  getVapiPublicKey,
  buildLocalCallConfig,
  logCallStart,
  logCallEnd,
  formatCallStatus,
  type VapiCallStatus,
  type VapiCallSession,
  type TranscriptEntry
} from '@/services/vapiService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

interface VapiCallButtonProps {
  userId: string;
  userName?: string;
  forceVariant?: 'claude' | 'gpt4';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  onCallStart?: (session: VapiCallSession) => void;
  onCallEnd?: (callId: string) => void;
  onError?: (error: Error) => void;
}

// TranscriptEntry is imported from vapiService

// ============================================================================
// COMPONENT
// ============================================================================

export const VapiCallButton = ({
  userId,
  userName,
  forceVariant,
  size = 'default',
  className = '',
  onCallStart,
  onCallEnd,
  onError
}: VapiCallButtonProps) => {
  // State
  const [status, setStatus] = useState<VapiCallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentSession, setCurrentSession] = useState<VapiCallSession | null>(null);
  const [isEnding, setIsEnding] = useState(false); // Visual state for button disable

  // Refs
  const vapiRef = useRef<Vapi | null>(null);
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isEndingRef = useRef(false); // Prevent multiple end call attempts
  const currentSessionRef = useRef<VapiCallSession | null>(null); // Ref to avoid useEffect re-runs
  const callbacksRef = useRef({ onCallEnd, onError }); // Store callbacks in ref
  const transcriptRef = useRef<TranscriptEntry[]>([]); // Preserve transcript for call-end handler

  // Keep callbacks ref updated
  callbacksRef.current = { onCallEnd, onError };

  const { toast } = useToast();

  // ============================================================================
  // VAPI INITIALIZATION
  // ============================================================================

  useEffect(() => {
    // Initialize Vapi instance
    const publicKey = getVapiPublicKey();
    vapiRef.current = new Vapi(publicKey);

    const vapi = vapiRef.current;

    // Event handlers
    vapi.on('call-start', () => {
      console.log('[VapiCallButton] Call started');
      setStatus('connected');
    });

    vapi.on('call-end', async () => {
      console.log('[VapiCallButton] Call ended');
      setStatus('ended');
      setVolume(0);

      // Capture transcript and calculate duration BEFORE reset
      const session = currentSessionRef.current;
      const finalTranscript = transcriptRef.current;
      const durationSeconds = session?.startedAt
        ? Math.round((Date.now() - session.startedAt.getTime()) / 1000)
        : null;

      console.log('[VapiCallButton] Call end data:', {
        callId: session?.callId,
        transcriptEntries: finalTranscript.length,
        durationSeconds
      });

      // Log call end with transcript and duration
      if (session) {
        // CRITICAL: Await logCallEnd before enrichment to prevent race condition
        const logSuccess = await logCallEnd(session.callId, finalTranscript, durationSeconds);
        console.log('[VapiCallButton] Call logged to DB:', logSuccess ? 'success' : 'failed');

        callbacksRef.current.onCallEnd?.(session.callId);

        // Call Edge Function to enrich call log with recording URL and AI summary
        // This runs AFTER logCallEnd completes to ensure data is in DB
        supabase.functions.invoke('vapi-call-complete', {
          body: { vapi_call_id: session.callId }
        }).then(({ data, error }) => {
          if (error) {
            console.error('[VapiCallButton] vapi-call-complete error:', error);
          } else {
            console.log('[VapiCallButton] Call enrichment complete:', {
              recording: data?.recording_url ? 'yes' : 'no',
              summary: data?.has_summary ? 'yes' : 'no',
              topics: data?.topics?.length || 0
            });
          }
        }).catch(err => {
          console.error('[VapiCallButton] vapi-call-complete failed:', err);
        });
      }

      // Reset after delay
      setTimeout(() => {
        setStatus('idle');
        setCurrentSession(null);
        currentSessionRef.current = null;
        setTranscript([]);
        transcriptRef.current = []; // Also clear the ref
        isEndingRef.current = false; // Reset for next call
        setIsEnding(false);
      }, 2000);
    });

    vapi.on('speech-start', () => {
      setStatus('speaking');
    });

    vapi.on('speech-end', () => {
      setStatus('listening');
    });

    vapi.on('volume-level', (level: number) => {
      // Level is 0-1, use it directly
      setVolume(level);
    });

    vapi.on('message', (message: unknown) => {
      const msg = message as { type: string; role?: string; transcript?: string };
      if (msg.type === 'transcript' && msg.transcript) {
        const newEntry: TranscriptEntry = {
          role: (msg.role as 'user' | 'assistant') || 'assistant',
          text: msg.transcript!,
          timestamp: new Date()
        };
        setTranscript(prev => {
          const updated = [...prev, newEntry];
          transcriptRef.current = updated; // Keep ref in sync for call-end handler
          return updated;
        });
      }
    });

    vapi.on('error', (error: unknown) => {
      console.error('[VapiCallButton] Error:', error);
      setStatus('error');
      const err = error instanceof Error ? error : new Error(String(error));
      callbacksRef.current.onError?.(err);

      toast({
        variant: 'destructive',
        title: 'Call Error',
        description: err.message || 'An error occurred during the call'
      });

      // Reset after delay
      setTimeout(() => {
        setStatus('idle');
        setCurrentSession(null);
        currentSessionRef.current = null;
        setTranscript([]);
        transcriptRef.current = []; // Also clear the ref
        isEndingRef.current = false; // Reset for next call
        setIsEnding(false);
      }, 3000);
    });

    // Cleanup - only runs on unmount since deps are empty
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // Only toast - callbacks accessed via ref to prevent re-runs

  // ============================================================================
  // CALL HANDLERS
  // ============================================================================

  const startCall = useCallback(async () => {
    if (!vapiRef.current || status !== 'idle') return;

    try {
      setStatus('connecting');

      // Build call configuration
      const config = await buildLocalCallConfig(userId, forceVariant);

      if (!config.success) {
        throw new Error(config.error || 'Failed to build call config');
      }

      console.log('[VapiCallButton] Starting call with:', {
        assistantId: config.assistant.id,
        variant: config.metadata.variant,
        contextLength: config.user_context.length
      });

      // Build variable values from context snapshot for system prompt
      const snapshot = config.metadata.context_snapshot;
      const variableValues: Record<string, string> = {
        // Full context string
        user_context: config.user_context,

        // Individual fields for system prompt variables
        greeting_name: (snapshot.greeting_name as string) || userName || 'there',
        first_name: (snapshot.first_name as string) || userName || 'there',
        tier_level: (snapshot.tier_level as string) || 'Starter',

        // Journey progress
        journey_day: String(snapshot.journey_day || 1),
        journey_week: String(snapshot.journey_week || 1),
        journey_phase: (snapshot.journey_phase as string) || 'Foundation',

        // Assessment results
        readiness_level: (snapshot.readiness_level as string) || 'exploring',
        assessment_score: String(snapshot.assessment_score || 0),

        // Business context
        target_state: (snapshot.target_state as string) || 'Not specified',
        target_demographics: (snapshot.target_demographics as string) || 'Not specified',

        // Legacy field for backwards compatibility
        user_name: userName || (snapshot.first_name as string) || 'there',

        // Cross-channel memory: Recent chat conversations for unified context
        recentChats: (config.metadata.chat_context as string) || ''
      };

      // DEBUG: Log chat context specifically
      const chatContextValue = (config.metadata.chat_context as string) || '';
      console.log('[VapiCallButton] Chat context for cross-channel memory:', {
        hasContext: !!chatContextValue,
        contextLength: chatContextValue.length,
        contextPreview: chatContextValue.substring(0, 200) || '(empty)',
        fullVariableValues: variableValues
      });

      // Start the call with metadata for webhook identification
      const call = await vapiRef.current.start(config.assistant.id, {
        variableValues,
        // Pass metadata so webhooks can identify the user
        metadata: {
          user_id: userId,
          variant: config.metadata.variant,
          context_snapshot: config.metadata.context_snapshot
        }
      });

      // Create session
      const session: VapiCallSession = {
        callId: call?.id || `local-${Date.now()}`,
        assistantId: config.assistant.id,
        variant: config.metadata.variant,
        startedAt: new Date(),
        userId,
        contextSnapshot: config.metadata.context_snapshot
      };

      setCurrentSession(session);
      currentSessionRef.current = session; // Keep ref in sync

      // Log call start to Supabase
      await logCallStart(session);

      onCallStart?.(session);

      toast({
        title: 'Call Connected',
        description: 'Connected with Nette'
      });

    } catch (err) {
      console.error('[VapiCallButton] Failed to start call:', err);
      setStatus('error');
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);

      toast({
        variant: 'destructive',
        title: 'Failed to Start Call',
        description: error.message
      });

      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [userId, userName, forceVariant, status, onCallStart, onError, toast]);

  const endCall = useCallback(() => {
    // Prevent multiple end call attempts
    if (!vapiRef.current || isEndingRef.current) return;

    isEndingRef.current = true;
    setIsEnding(true); // Disable button visually immediately
    console.log('[VapiCallButton] Ending call');
    vapiRef.current.stop();
  }, []);

  const toggleMute = useCallback(() => {
    // Check both that vapi exists AND call is active (not ending/ended)
    if (!vapiRef.current || isEndingRef.current) return;

    // Additional check: only mute during active call states
    const activeStates: VapiCallStatus[] = ['connected', 'speaking', 'listening'];
    if (!activeStates.includes(status)) return;

    const newMuted = !isMuted;
    try {
      vapiRef.current.setMuted(newMuted);
      setIsMuted(newMuted);

      toast({
        title: newMuted ? 'Microphone Muted' : 'Microphone Unmuted',
        duration: 1500
      });
    } catch (err) {
      console.warn('[VapiCallButton] Failed to toggle mute:', err);
    }
  }, [isMuted, status, toast]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getButtonContent = () => {
    const iconSize = size === 'sm' ? 20 : size === 'lg' ? 28 : 24;

    switch (status) {
      case 'connecting':
        return (
          <>
            <ModernCallIcon isActive={false} isConnecting={true} size={iconSize} />
            <span className="sr-only">Connecting...</span>
          </>
        );
      case 'connected':
      case 'speaking':
      case 'listening':
        return (
          <>
            <PhoneOff className={cn(
              "text-white",
              size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-7 w-7' : 'h-6 w-6'
            )} />
            <span className="sr-only">End call</span>
          </>
        );
      case 'ended':
      case 'error':
      default:
        return (
          <>
            <ModernCallIcon isActive={false} size={iconSize} />
            <span className="sr-only">{status === 'ended' ? 'Call ended' : status === 'error' ? 'Error' : 'Start call'}</span>
          </>
        );
    }
  };

  // Get glassmorphic button classes based on state
  const getButtonClasses = () => {
    const baseClasses = cn(
      "rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      size === 'sm' ? 'h-14 w-14' : size === 'lg' ? 'h-24 w-24' : 'h-20 w-20'
    );

    if (isCallActive) {
      return cn(baseClasses, "modern-call-button modern-call-button--active");
    }

    if (status === 'connecting') {
      return cn(baseClasses, "modern-call-button modern-call-button--connecting");
    }

    return cn(baseClasses, "modern-call-button");
  };

  const isCallActive = ['connected', 'speaking', 'listening'].includes(status);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Map VapiCallStatus to VoiceCallState for visualization
  const getVisualizationState = (): VoiceCallState => {
    return status as VoiceCallState;
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Main Call Button with Voice Visualization */}
      <VoiceVisualization
        isActive={isCallActive}
        state={getVisualizationState()}
        volume={volume}
        className={size === 'sm' ? 'w-28 h-28' : size === 'lg' ? 'w-40 h-40' : 'w-36 h-36'}
      >
        <div className="relative">
          {/* Outer glow effect */}
          <div className="modern-call-glow" />

          {/* Main button */}
          <button
            onClick={isCallActive ? endCall : startCall}
            disabled={status === 'connecting' || status === 'ended' || isEnding}
            className={cn(
              getButtonClasses(),
              (status === 'connecting' || status === 'ended' || isEnding) && 'opacity-70 cursor-not-allowed'
            )}
            aria-label={isCallActive ? 'End call with Nette' : 'Start call with Nette'}
          >
            {getButtonContent()}
          </button>
        </div>
      </VoiceVisualization>

      {/* Animated Status Text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={status}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="text-sm text-muted-foreground text-center min-h-[20px]"
        >
          {formatCallStatus(status)}
        </motion.p>
      </AnimatePresence>

      {/* Mute Button (only during active call) */}
      {isCallActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMute}
            className={cn(
              "flex items-center gap-2 glass rounded-full px-4",
              isMuted && "border-destructive/30 text-destructive"
            )}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? (
              <>
                <MicOff className="h-4 w-4" />
                <span>Unmute</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>Mute</span>
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Live Transcript (optional, hidden by default) */}
      {isCallActive && transcript.length > 0 && (
        <div className="w-full max-w-md mt-4 p-3 bg-muted/30 rounded-lg max-h-32 overflow-y-auto">
          {transcript.slice(-3).map((entry, index) => (
            <p
              key={index}
              className={`text-xs ${entry.role === 'user' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <span className="font-medium">
                {entry.role === 'user' ? 'You: ' : 'Nette: '}
              </span>
              {entry.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default VapiCallButton;
