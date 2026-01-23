import { VoicePhoneStatus } from './VoicePhoneStatus';
import { GHLWidgetWrapper, type GHLUserContext } from './GHLWidgetWrapper';
import { VoiceCallHistory } from './VoiceCallHistory';
import type { VoiceCallForChat } from '@/services/netteVoiceCallService';
import { cn } from '@/lib/utils';

// Extended user profile with all fields needed for voice caller identification
interface VoiceUserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  verified_phone: string | null;
  ghl_contact_id: string | null;
  full_name: string | null;
}

interface VoiceTabContentProps {
  voiceCalls: VoiceCallForChat[];
  userProfile: VoiceUserProfile | null;
  userTimezone?: string;
  onPhoneVerify: () => void;
  isWidgetVisible: boolean;
  isLoading?: boolean;
  className?: string;
}

export function VoiceTabContent({
  voiceCalls,
  userProfile,
  userTimezone,
  onPhoneVerify,
  isWidgetVisible,
  isLoading = false,
  className,
}: VoiceTabContentProps) {
  return (
    <div
      className={cn(
        'voice-tab-content',
        'flex flex-col gap-8 py-6 px-4 md:px-6',
        'max-w-2xl mx-auto w-full',
        className
      )}
    >
      {/* Phone verification status - Premium compact badge at top */}
      <VoicePhoneStatus
        verifiedPhone={userProfile?.verified_phone ?? null}
        onVerifyClick={onPhoneVerify}
      />

      {/* GHL Voice Widget - Centered and prominent */}
      {/* Pass user context for caller identification */}
      <GHLWidgetWrapper
        isVisible={isWidgetVisible}
        userContext={userProfile ? {
          user_id: userProfile.id,
          email: userProfile.email,
          phone: userProfile.phone,
          verified_phone: userProfile.verified_phone,
          ghl_contact_id: userProfile.ghl_contact_id,
          full_name: userProfile.full_name
        } : null}
      />

      {/* Call History section with premium divider */}
      <div className="space-y-4">
        {/* Premium divider */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/50 to-border/50" />
          <span className="text-xs text-muted-foreground/80 uppercase tracking-widest font-medium">
            Call History
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border/50 to-border/50" />
        </div>

        {/* Voice call history */}
        <VoiceCallHistory
          voiceCalls={voiceCalls}
          userTimezone={userTimezone}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
