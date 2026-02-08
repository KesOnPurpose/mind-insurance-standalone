/**
 * RKPI-009: Partner Invite Page
 * Dedicated invite page — email (required) + phone + name.
 * Triggers N8n webhook via context.
 */

import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePartnerPairing } from '@/hooks/usePartnerPairing';
import { InviteForm } from '@/components/relationship-kpis/partner/InviteForm';

export default function PartnerInvite() {
  const navigate = useNavigate();
  const { pairingStatus, isInviting, inviteError, sendInvite } = usePartnerPairing();

  const handleSubmit = async (email: string, phone?: string, name?: string) => {
    await sendInvite(email, phone, name);
    // Navigate to partner page after successful invite
    navigate('/relationship-kpis/partner');
  };

  // If already paired or invited, redirect back
  if (pairingStatus !== 'solo') {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-amber-500/20 bg-mi-navy-light p-6 text-center space-y-3">
          <p className="text-sm text-amber-300">
            {pairingStatus === 'paired'
              ? 'You already have an active partnership.'
              : 'You have a pending invitation.'}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
            onClick={() => navigate('/relationship-kpis/partner')}
          >
            View Partner Status
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="ghost"
          className="text-white/40 hover:text-white/60"
          onClick={() => navigate('/relationship-kpis/partner')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Invite Partner</h1>
          <p className="text-gray-400 text-sm">Send an invitation to start check-ins together</p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-rose-500/20 bg-mi-navy-light p-5">
        <InviteForm
          onSubmit={handleSubmit}
          isSubmitting={isInviting}
          error={inviteError}
          onCancel={() => navigate('/relationship-kpis/partner')}
        />
      </div>
    </div>
  );
}
