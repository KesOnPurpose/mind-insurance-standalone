/**
 * FirstSessionPage - DEPRECATED
 *
 * This page has been replaced by the new MIO Insights Thread first engagement flow.
 * After Identity Collision Assessment, users are now redirected directly to
 * /mind-insurance/mio-insights where MIO delivers the first session experience.
 *
 * This file exists to handle any legacy bookmarks or cached routes.
 * All traffic is redirected to the MIO Insights thread.
 *
 * @deprecated Use /mind-insurance/mio-insights for first engagement flow
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function FirstSessionPage() {
  const navigate = useNavigate();

  // Redirect to new MIO thread experience
  useEffect(() => {
    console.log('[FirstSessionPage] Deprecated route - redirecting to MIO Insights');
    navigate('/mind-insurance/mio-insights', {
      state: { showFirstEngagement: true },
      replace: true, // Replace history entry to prevent back-button loops
    });
  }, [navigate]);

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-muted-foreground">
          Redirecting to MIO Insights...
        </p>
      </div>
    </div>
  );
}
