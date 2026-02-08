// ============================================================================
// GHL Voice AI Widget - Embeds GoHighLevel Voice widget for MIO calls
// ============================================================================
// Loads the GHL Voice widget script and provides a floating "Call MIO" button
// for users to initiate voice conversations with MIO.
// ============================================================================

import { useEffect, useRef } from 'react';

interface GHLVoiceWidgetProps {
  /** GHL Widget ID from the chat widget settings */
  widgetId?: string;
}

// Default widget ID for MIO Voice AI
const DEFAULT_WIDGET_ID = '69489006f258cf69ada66c29';

/**
 * GHLVoiceWidget - Loads and renders the GoHighLevel Voice AI widget
 *
 * The widget appears as a floating button (controlled by GHL) that users can click
 * to start a voice conversation with MIO.
 */
export function GHLVoiceWidget({ widgetId = DEFAULT_WIDGET_ID }: GHLVoiceWidgetProps) {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Prevent loading script multiple times
    if (scriptLoaded.current) return;

    // Check if script already exists in DOM
    const existingScript = document.querySelector(
      `script[data-widget-id="${widgetId}"]`
    );
    if (existingScript) {
      scriptLoaded.current = true;
      return;
    }

    // Create and inject the GHL widget script
    const script = document.createElement('script');
    script.src = 'https://widgets.leadconnectorhq.com/loader.js';
    script.async = true;
    script.setAttribute('data-resources-url', 'https://widgets.leadconnectorhq.com/chat-widget/loader.js');
    script.setAttribute('data-widget-id', widgetId);

    script.onerror = () => {
      console.error('[GHL Voice Widget] Failed to load widget script');
    };

    document.body.appendChild(script);
    scriptLoaded.current = true;

    // Cleanup on unmount
    return () => {
      // Note: We don't remove the script on unmount because:
      // 1. GHL widget manages its own state
      // 2. User might navigate back to this page
      // 3. Script removal could cause issues with widget state
    };
  }, [widgetId]);

  // The GHL script injects its own floating button widget
  // We don't need to render anything - just load the script
  return null;
}

export default GHLVoiceWidget;
