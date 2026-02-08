// ============================================================================
// GHLWidgetWrapper - GoHighLevel Voice widget script injector
// ============================================================================
// The GHL Voice widget uses a floating button pattern (appears at bottom-right
// of the screen). This component handles script injection and visibility control.
// There is NO inline container - the widget floats.
// ============================================================================

import { useEffect, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface GHLWidgetWrapperProps {
  /** Whether the Voice tab is active and widget should be visible */
  isVisible: boolean;
  /** GHL Widget ID */
  widgetId?: string;
}

// Default widget ID for MIO Voice AI
const DEFAULT_WIDGET_ID = '69489006f258cf69ada66c29';

// ============================================================================
// COMPONENT
// ============================================================================

export function GHLWidgetWrapper({
  isVisible,
  widgetId = DEFAULT_WIDGET_ID,
}: GHLWidgetWrapperProps) {
  const scriptLoaded = useRef(false);

  // Load GHL widget script when component mounts
  useEffect(() => {
    if (scriptLoaded.current) return;

    // Check if script already exists
    const existingScript = document.querySelector(
      `script[data-widget-id="${widgetId}"]`
    );
    if (existingScript) {
      scriptLoaded.current = true;
      return;
    }

    // Create and inject the GHL widget script
    // Widget will appear as a floating button at bottom-right of screen
    const script = document.createElement('script');
    script.src = 'https://widgets.leadconnectorhq.com/loader.js';
    script.async = true;
    script.setAttribute(
      'data-resources-url',
      'https://widgets.leadconnectorhq.com/chat-widget/loader.js'
    );
    script.setAttribute('data-widget-id', widgetId);

    script.onerror = () => {
      console.error('[GHL Widget] Failed to load widget script');
    };

    document.body.appendChild(script);
    scriptLoaded.current = true;
  }, [widgetId]);

  // Control GHL widget visibility based on isVisible prop
  useEffect(() => {
    const controlWidgetVisibility = () => {
      // GHL widgets inject with class names containing 'ghl' or 'lc'
      const selectors = [
        '[class*="ghl"]',
        '[class*="lc-"]',
        '[id*="ghl"]',
        '[id*="lc-"]',
        '[class*="chat-widget"]',
        'iframe[src*="leadconnector"]',
        'iframe[src*="ghl"]',
      ];

      selectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          // Show the floating button when Voice tab is active
          htmlEl.style.display = isVisible ? '' : 'none';
        });
      });
    };

    // Run immediately
    controlWidgetVisibility();

    // Also run after short delays (widget might load asynchronously)
    const timers = [
      setTimeout(controlWidgetVisibility, 300),
      setTimeout(controlWidgetVisibility, 800),
      setTimeout(controlWidgetVisibility, 1500),
    ];

    // Set up mutation observer for dynamically added elements
    const observer = new MutationObserver(() => {
      controlWidgetVisibility();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
    };
  }, [isVisible]);

  // This component doesn't render anything visual
  // The GHL widget floats as a button at bottom-right of the screen
  return null;
}

export default GHLWidgetWrapper;
