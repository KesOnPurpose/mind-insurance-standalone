import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VapiCallButton, VapiCallHistory } from '@/components/voice';
import { InterruptibilityIndicator } from '@/components/voice/InterruptibilityIndicator';
import { syncVoiceContext } from '@/services/voiceContextService';
import { createVoiceSession, expireOldSessions } from '@/services/voiceSessionService';
import { cn } from '@/lib/utils';
import { Brain, Sparkles, CheckCircle } from 'lucide-react';

interface VoiceTabContentProps {
  userId: string;
  ghlContactId: string | null;
  verifiedPhone?: string | null;
  userName?: string | null;  // User's first name for name correction in transcripts/summaries
  className?: string;
}

export function VoiceTabContent({
  userId,
  ghlContactId,
  verifiedPhone,
  userName,
  className,
}: VoiceTabContentProps) {
  const [contextSynced, setContextSynced] = useState(false);
  const syncAttemptedRef = useRef(false);
  const [vapiHistoryKey, setVapiHistoryKey] = useState(0); // Key to force refresh
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sync voice context AND create voice session when Voice tab loads
  // This ensures Nette has user context BEFORE any call starts
  useEffect(() => {
    if (!userId || syncAttemptedRef.current) return;

    syncAttemptedRef.current = true;

    const prepareForVoiceCall = async () => {
      try {
        // Expire any old pending sessions first
        await expireOldSessions();

        // Sync voice context to GHL contact (if we have a contact ID)
        if (ghlContactId) {
          console.log('[VoiceTabContent] Syncing voice context to GHL...');
          const syncResult = await syncVoiceContext(userId, ghlContactId);
          if (syncResult.success) {
            console.log('[VoiceTabContent] Voice context synced successfully');
            setContextSynced(true);
          } else {
            console.warn('[VoiceTabContent] Voice context sync failed:', syncResult.error);
          }
        }

        // Create a voice session for caller identification (if phone verified)
        if (verifiedPhone) {
          console.log('[VoiceTabContent] Creating voice session for user identification...');
          const sessionResult = await createVoiceSession({
            userId,
            phone: verifiedPhone,
            ghlContactId: ghlContactId || undefined
          });

          if (sessionResult.success) {
            console.log('[VoiceTabContent] Voice session created:', sessionResult.session?.id);
            setContextSynced(true);
          } else {
            console.warn('[VoiceTabContent] Voice session creation failed:', sessionResult.error);
          }
        } else {
          // No verified phone but context might be synced
          setContextSynced(!!ghlContactId);
        }
      } catch (err) {
        console.error('[VoiceTabContent] Error preparing for voice call:', err);
      }
    };

    prepareForVoiceCall();
  }, [userId, ghlContactId, verifiedPhone]);

  return (
    <div
      className={cn(
        'voice-tab-content',
        'flex flex-col gap-4 p-4',
        'max-w-2xl mx-auto w-full',
        'overflow-x-hidden', // Prevent horizontal overflow from voice visualization effects on mobile
        className
      )}
    >
      {/* Header */}
      <div className="text-center space-y-2 mb-4">
        <h3 className="text-lg font-semibold">Talk with Nette</h3>
        <p className="text-sm text-muted-foreground">
          Start a voice conversation directly from your browser
        </p>
      </div>

      {/* Vapi Call Button - generous padding for waveform/glow overflow */}
      <div className="flex justify-center items-center py-8 px-10 sm:px-12 mx-auto overflow-visible">
        <VapiCallButton
          userId={userId}
          userName={userName || undefined}
          size="lg"
          onCallStart={(session) => {
            console.log('[VoiceTabContent] Vapi call started:', session.callId);
            setIsCallActive(true);
            setIsSpeaking(true); // Nette typically speaks first
          }}
          onCallEnd={(callId) => {
            console.log('[VoiceTabContent] Vapi call ended:', callId);
            setIsCallActive(false);
            setIsSpeaking(false);
            // Multi-stage refresh strategy:
            // 1. Quick refresh at 2s - get duration and transcript (client-captured)
            // 2. Second refresh at 5s - get summary (edge function may still be processing)
            // 3. Final refresh at 10s - catch late AI summary generation
            setTimeout(() => {
              console.log('[VoiceTabContent] First refresh (duration/transcript)');
              setVapiHistoryKey(prev => prev + 1);
            }, 2000);
            setTimeout(() => {
              console.log('[VoiceTabContent] Second refresh (summary)');
              setVapiHistoryKey(prev => prev + 1);
            }, 5000);
            setTimeout(() => {
              console.log('[VoiceTabContent] Final refresh (late summary)');
              setVapiHistoryKey(prev => prev + 1);
            }, 10000);
          }}
          onError={(error) => {
            console.error('[VoiceTabContent] Vapi call error:', error);
            setIsCallActive(false);
            setIsSpeaking(false);
          }}
        />
      </div>

      {/* Interruptibility Indicator - Shows during active calls */}
      <div className="flex justify-center">
        <InterruptibilityIndicator
          isVisible={isCallActive}
          isSpeaking={isSpeaking}
        />
      </div>

      {/* Enhanced "Nette Remembers" Context Indicator */}
      <AnimatePresence>
        {contextSynced && !isCallActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-sm"
          >
            <div className="glass rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Nette Remembers</h4>
                  <p className="text-xs text-muted-foreground">Your context is ready</p>
                </div>
                <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" />
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Your journey progress and past conversations
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Goals, challenges, and breakthroughs you've shared
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Personalized insights tailored to your situation
                  </p>
                </div>
              </div>

              <p className="mt-3 pt-3 border-t border-border/50 text-xs text-center text-muted-foreground/80">
                Just start talking naturally — no need to re-explain
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vapi Call History */}
      <div className="mt-4 border-t pt-6">
        <VapiCallHistory
          key={vapiHistoryKey}
          userId={userId}
          userName={userName}
          pageSize={5}
          title="Recent Conversations"
          showHeader={true}
        />
      </div>
    </div>
  );
}
