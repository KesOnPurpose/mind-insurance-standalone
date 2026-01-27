import { useEffect, useState, useRef } from 'react';
import { VoicePhoneStatus } from './VoicePhoneStatus';
import { VoiceCallHistory } from './VoiceCallHistory';
import { VapiCallButton, VapiCallHistory } from '@/components/voice';
import type { VoiceCallForChat } from '@/services/netteVoiceCallService';
import { syncVoiceContext } from '@/services/voiceContextService';
import { createVoiceSession, expireOldSessions } from '@/services/voiceSessionService';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Globe } from 'lucide-react';

interface VoiceTabContentProps {
  voiceCalls: VoiceCallForChat[];
  verifiedPhone: string | null;
  userId: string;
  ghlContactId: string | null;
  userTimezone?: string;
  onPhoneVerify: () => void;
  isLoading?: boolean;
  className?: string;
}

export function VoiceTabContent({
  voiceCalls,
  verifiedPhone,
  userId,
  ghlContactId,
  userTimezone,
  onPhoneVerify,
  isLoading = false,
  className,
}: VoiceTabContentProps) {
  const [contextSynced, setContextSynced] = useState(false);
  const syncAttemptedRef = useRef(false);
  const [vapiHistoryKey, setVapiHistoryKey] = useState(0); // Key to force refresh

  // Sync voice context AND create voice session when Voice tab loads
  // This ensures:
  // 1. Nette has user context BEFORE any call starts (GHL sync)
  // 2. Call completion workflow can identify the user (session matching)
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
          } else {
            console.warn('[VoiceTabContent] Voice context sync failed:', syncResult.error);
          }
        }

        // Create a voice session for caller identification
        // This session will be matched when the call completes
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
            // Still mark as ready - context sync might have worked
            setContextSynced(!!ghlContactId);
          }
        } else {
          // No verified phone, but context might be synced
          console.log('[VoiceTabContent] No verified phone - session not created');
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
        className
      )}
    >
      {/* Call Method Tabs: Web Call vs Phone Call */}
      <Tabs defaultValue="web" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="web" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>Web Call</span>
          </TabsTrigger>
          <TabsTrigger value="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>Phone Call</span>
          </TabsTrigger>
        </TabsList>

        {/* Web Call Tab - Vapi Integration */}
        <TabsContent value="web" className="space-y-4">
          <div className="text-center space-y-2 mb-6">
            <h3 className="text-lg font-semibold">Talk with Nette</h3>
            <p className="text-sm text-muted-foreground">
              Start a voice call directly from your browser
            </p>
          </div>

          {/* Vapi Call Button */}
          <div className="flex justify-center py-8">
            <VapiCallButton
              userId={userId}
              size="lg"
              onCallStart={(session) => {
                console.log('[VoiceTabContent] Vapi call started:', session.callId);
              }}
              onCallEnd={(callId) => {
                console.log('[VoiceTabContent] Vapi call ended:', callId);
                // Refresh call history after a delay to allow Edge Function processing
                setTimeout(() => {
                  setVapiHistoryKey(prev => prev + 1);
                }, 3000);
              }}
              onError={(error) => {
                console.error('[VoiceTabContent] Vapi call error:', error);
              }}
            />
          </div>

          {/* Context sync indicator */}
          {contextSynced && (
            <p className="text-xs text-center text-muted-foreground">
              ✓ Nette has your context ready
            </p>
          )}

          {/* Vapi Call History */}
          <div className="mt-6 border-t pt-6">
            <VapiCallHistory
              key={vapiHistoryKey}
              userId={userId}
              pageSize={5}
              title="Recent Conversations"
              showHeader={true}
            />
          </div>
        </TabsContent>

        {/* Phone Call Tab - Traditional GHL */}
        <TabsContent value="phone" className="space-y-4">
          {/* Compact phone verification status */}
          <VoicePhoneStatus
            verifiedPhone={verifiedPhone}
            onVerifyClick={onPhoneVerify}
            compact
          />

          {/* Context sync indicator */}
          {contextSynced && (
            <p className="text-xs text-center text-muted-foreground">
              ✓ Ready for voice calls
            </p>
          )}

          {/* Call history - the main content */}
          <VoiceCallHistory
            voiceCalls={voiceCalls}
            userTimezone={userTimezone}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
