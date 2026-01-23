import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Shield, Phone, CheckCircle, UserCheck } from 'lucide-react';
import { syncVoiceContext } from '@/services/voiceContextService';
import { createVoiceSession, expireOldSessions, type VoiceSession } from '@/services/voiceSessionService';

// NEW GHL Voice Widget Credentials (Updated)
const GHL_WIDGET_ID = '695ce0b5a64aad311d532414';
const GHL_LOCATION_ID = '3KJeKktlnhQab7T0zrpM';
const GHL_SCRIPT_URL = 'https://widgets.leadconnectorhq.com/loader.js';

// User context for GHL widget caller identification
export interface GHLUserContext {
  user_id: string;
  email: string | null;
  phone: string | null;
  verified_phone: string | null;
  ghl_contact_id: string | null;
  full_name: string | null;
}

interface GHLWidgetWrapperProps {
  isVisible: boolean;
  userContext?: GHLUserContext | null;
  className?: string;
}

export function GHLWidgetWrapper({ isVisible, userContext, className }: GHLWidgetWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [contextSynced, setContextSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncAttemptedRef = useRef(false);

  // Voice session state (for caller identification)
  const [voiceSession, setVoiceSession] = useState<VoiceSession | null>(null);
  const [sessionCreating, setSessionCreating] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const sessionAttemptedRef = useRef(false);

  // Inject user context into window for GHL widget caller identification
  useEffect(() => {
    if (!userContext) return;

    // Set window.ghlContact for GHL widget to identify the caller
    // This allows the voice agent to know who is calling
    const ghlContactData = {
      email: userContext.email,
      phone: userContext.verified_phone || userContext.phone,
      firstName: userContext.full_name?.split(' ')[0] || '',
      lastName: userContext.full_name?.split(' ').slice(1).join(' ') || '',
      name: userContext.full_name,
      contactId: userContext.ghl_contact_id,
      // Custom fields for N8n webhook context fetch
      customField: {
        user_id: userContext.user_id,
        ghl_contact_id: userContext.ghl_contact_id,
        app_source: 'mind-insurance'
      }
    };

    // Set on window for GHL widget access
    (window as Window & { ghlContact?: typeof ghlContactData }).ghlContact = ghlContactData;

    // Also set as lcContact which some GHL widgets use
    (window as Window & { lcContact?: typeof ghlContactData }).lcContact = ghlContactData;

    console.log('[GHL Widget] User context injected:', {
      email: userContext.email,
      phone: userContext.verified_phone || userContext.phone,
      ghl_contact_id: userContext.ghl_contact_id,
      name: userContext.full_name
    });

    return () => {
      // Clean up on unmount
      delete (window as Window & { ghlContact?: unknown }).ghlContact;
      delete (window as Window & { lcContact?: unknown }).lcContact;
    };
  }, [userContext]);

  // Sync voice context to GHL contact custom fields before widget loads
  // This populates the GHL contact with user data so Voice AI can use it
  useEffect(() => {
    // Only sync if we have required user context and haven't already synced
    if (!userContext?.user_id || !userContext?.ghl_contact_id) {
      console.log('[GHL Widget] Skipping voice context sync - missing user_id or ghl_contact_id');
      return;
    }

    if (syncAttemptedRef.current) {
      console.log('[GHL Widget] Voice context sync already attempted this session');
      return;
    }

    const performSync = async () => {
      syncAttemptedRef.current = true;
      console.log('[GHL Widget] Starting voice context sync for user:', userContext.user_id);

      try {
        const result = await syncVoiceContext(userContext.user_id, userContext.ghl_contact_id!);

        if (result.success) {
          setContextSynced(true);
          setSyncError(null);
          console.log('[GHL Widget] Voice context synced to GHL:', {
            greeting: result.context?.greeting_name,
            journey_day: result.context?.journey_day,
            tier: result.context?.tier_level,
            synced_at: result.context?.synced_at
          });
        } else {
          setSyncError(result.error || 'Unknown sync error');
          console.warn('[GHL Widget] Voice context sync failed:', result.error);
          // Don't block widget loading on sync failure - continue anyway
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setSyncError(errorMessage);
        console.error('[GHL Widget] Voice context sync exception:', error);
        // Don't block widget loading on sync failure
      }
    };

    performSync();
  }, [userContext?.user_id, userContext?.ghl_contact_id]);

  // Create voice session for caller identification
  // This session will be looked up by Voice AI at the start of each call
  useEffect(() => {
    // Only create session if we have required user context
    if (!userContext?.user_id) {
      console.log('[GHL Widget] Skipping voice session creation - missing user_id');
      return;
    }

    // Need phone number for caller identification
    const phone = userContext.verified_phone || userContext.phone;
    if (!phone) {
      console.log('[GHL Widget] Skipping voice session creation - no phone number');
      return;
    }

    if (sessionAttemptedRef.current) {
      console.log('[GHL Widget] Voice session already created this session');
      return;
    }

    const createSession = async () => {
      sessionAttemptedRef.current = true;
      setSessionCreating(true);
      console.log('[GHL Widget] Creating voice session for caller identification');

      try {
        // First, expire any old sessions
        await expireOldSessions();

        // Create new session
        const result = await createVoiceSession({
          userId: userContext.user_id,
          phone: phone,
          ghlContactId: userContext.ghl_contact_id
        });

        if (result.success && result.session) {
          setVoiceSession(result.session);
          setSessionError(null);
          console.log('[GHL Widget] Voice session created:', {
            id: result.session.id,
            greeting_hint: result.session.greeting_hint,
            expires_at: result.session.expires_at
          });
        } else {
          setSessionError(result.error || 'Failed to create session');
          console.warn('[GHL Widget] Voice session creation failed:', result.error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setSessionError(errorMessage);
        console.error('[GHL Widget] Voice session creation exception:', error);
      } finally {
        setSessionCreating(false);
      }
    };

    createSession();
  }, [userContext?.user_id, userContext?.verified_phone, userContext?.phone, userContext?.ghl_contact_id]);

  // Load GHL script when component becomes visible
  useEffect(() => {
    if (!isVisible) return;

    // Check if script already exists
    const existingScript = document.querySelector(`script[data-widget-id="${GHL_WIDGET_ID}"]`);
    if (existingScript) {
      setIsScriptReady(true);
      setIsLoaded(true);
      return;
    }

    // Create and inject the GHL loader script
    const script = document.createElement('script');
    script.src = GHL_SCRIPT_URL;
    script.setAttribute('data-resources-url', 'https://widgets.leadconnectorhq.com/chat-widget/loader.js');
    script.setAttribute('data-widget-id', GHL_WIDGET_ID);
    script.async = true;

    script.onload = () => {
      setIsScriptReady(true);
      // Give the widget time to initialize
      setTimeout(() => setIsLoaded(true), 1000);
    };

    script.onerror = () => {
      console.error('Failed to load GHL voice widget script');
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount - GHL widget persists
    };
  }, [isVisible]);

  // Handle visibility toggling for existing GHL elements
  useEffect(() => {
    if (!isScriptReady) return;

    const toggleGHLVisibility = () => {
      // Find GHL widget elements (they may be dynamically created)
      const ghlElements = document.querySelectorAll(
        '[class*="lc_"], [class*="chat-widget"], [id*="chat-widget"], .ghl-chat-widget'
      );

      ghlElements.forEach((el) => {
        const element = el as HTMLElement;
        if (isVisible) {
          element.style.display = '';
          element.style.visibility = 'visible';
          element.style.opacity = '1';
          element.style.pointerEvents = 'auto';
        } else {
          element.style.display = 'none';
          element.style.visibility = 'hidden';
          element.style.opacity = '0';
          element.style.pointerEvents = 'none';
        }
      });
    };

    toggleGHLVisibility();

    // Re-run after short delay for dynamically loaded elements
    const timer = setTimeout(toggleGHLVisibility, 500);
    const timer2 = setTimeout(toggleGHLVisibility, 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [isVisible, isScriptReady]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'ghl-embed-container',
        'relative flex flex-col items-center justify-center',
        'min-h-[400px] p-8 rounded-3xl',
        'bg-gradient-to-br from-card/80 via-card to-muted/30',
        'border border-primary/10',
        'shadow-[0_0_60px_rgba(5,195,221,0.08)]',
        'backdrop-blur-sm',
        'transition-all duration-500 ease-out',
        className
      )}
    >
      {/* Premium ambient glow effects */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* Decorative corner accents */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/20 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary/20 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary/20 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/20 rounded-br-lg" />

      {/* Loading state with sync status */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm rounded-3xl z-20">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-primary/20 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 animate-pulse" />
              <Phone className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm text-muted-foreground">Connecting to Nette...</p>
              {userContext?.ghl_contact_id && (
                <p className="text-xs text-muted-foreground/70">
                  {contextSynced ? '✓ Context synced' : 'Syncing your context...'}
                </p>
              )}
              {(userContext?.verified_phone || userContext?.phone) && (
                <p className="text-xs text-muted-foreground/70">
                  {voiceSession ? '✓ Ready to identify you' : sessionCreating ? 'Setting up caller ID...' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status indicators (shown when loaded) */}
      {isLoaded && (contextSynced || voiceSession) && (
        <div className="absolute top-6 right-6 flex flex-col items-end gap-1 z-30">
          {/* Context sync indicator */}
          {contextSynced && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500/80">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Personalized</span>
            </div>
          )}
          {/* Session created indicator */}
          {voiceSession && (
            <div className="flex items-center gap-1.5 text-xs text-primary/80">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Ready to identify</span>
            </div>
          )}
        </div>
      )}

      {/* GHL Widget Container - Embedded mode */}
      <div className="relative z-10 w-full flex flex-col items-center gap-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10">
            <Phone className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            Voice with Nette
          </h3>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            Have a real conversation about your grouphome journey
          </p>
        </div>

        {/* GHL Widget Mount Point - Uses data attributes for embedded mode */}
        <div
          data-chat-widget
          data-widget-id={GHL_WIDGET_ID}
          data-location-id={GHL_LOCATION_ID}
          // Pass user context as data attributes for GHL widget caller identification
          data-contact-email={userContext?.email || ''}
          data-contact-phone={userContext?.verified_phone || userContext?.phone || ''}
          data-contact-name={userContext?.full_name || ''}
          data-contact-id={userContext?.ghl_contact_id || ''}
          data-user-id={userContext?.user_id || ''}
          className="relative w-full max-w-[320px] min-h-[200px] flex items-center justify-center"
        />
      </div>

      {/* Privacy indicator */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
        <div className="relative flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-50" />
          </div>
          <Shield className="w-3.5 h-3.5" />
          <span>Voice calls are private and encrypted</span>
        </div>
      </div>
    </div>
  );
}
