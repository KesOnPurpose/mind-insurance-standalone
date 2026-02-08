/**
 * RKPI Page: WeeklyCheckInFlow
 * Page wrapper for the check-in wizard.
 * Auto-starts check-in if none active, provides cancel option.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRelationship } from '@/contexts/RelationshipContext';
import { CheckInWizard } from '@/components/relationship-kpis/check-in/CheckInWizard';

export default function WeeklyCheckInFlow() {
  const navigate = useNavigate();
  const { wizardState, startCheckIn, clearCurrentCheckIn } = useRelationship();
  const [isStarting, setIsStarting] = useState(false);

  // Auto-start check-in if none active
  useEffect(() => {
    if (!wizardState && !isStarting) {
      setIsStarting(true);
      startCheckIn()
        .catch((err) => {
          console.error('[RKPI] Failed to start check-in:', err);
          navigate('/relationship-kpis');
        })
        .finally(() => setIsStarting(false));
    }
  }, [wizardState, isStarting, startCheckIn, navigate]);

  const handleCancel = () => {
    clearCurrentCheckIn();
    navigate('/relationship-kpis');
  };

  if (isStarting || !wizardState) {
    return (
      <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
        <div className="max-w-lg mx-auto flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-400" />
            <h1 className="text-lg font-medium text-white">Weekly Check-In</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/30 hover:text-white/60 h-8 w-8"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Wizard */}
        <CheckInWizard />
      </div>
    </div>
  );
}
