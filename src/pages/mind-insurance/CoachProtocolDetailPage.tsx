/**
 * CoachProtocolDetailPage
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Dedicated page for viewing and working on coach protocols.
 * Reuses existing CoachProtocolTabs component which handles:
 * - Primary/Secondary protocol tabs
 * - Auto-expansion to day view for single protocols
 * - Task completion with notes
 * - Progress tracking
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoachProtocolTabs } from '@/components/mind-insurance/CoachProtocolTabs';

export default function CoachProtocolDetailPage() {
  const navigate = useNavigate();

  const handleProtocolComplete = () => {
    // After completing a protocol, navigate back to Coverage Center
    navigate('/mind-insurance/coverage?tab=coach');
  };

  return (
    <div className="min-h-screen bg-mi-navy">
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/mind-insurance/coverage')}
            className="text-gray-400 hover:text-white hover:bg-mi-navy-light"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-mi-gold" />
            <h1 className="text-xl font-semibold text-white">Coach Protocol</h1>
          </div>
        </div>

        {/* Reuse existing CoachProtocolTabs - handles all protocol logic internally */}
        <CoachProtocolTabs onProtocolComplete={handleProtocolComplete} />
      </div>
    </div>
  );
}
