/**
 * RKPI-009: Pairing Status Page
 * Timeline: Sent → Account Created → Accepted → Active.
 * Resend / cancel buttons. Shows partnership details.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRelationship } from '@/contexts/RelationshipContext';
import { usePartnerPairing } from '@/hooks/usePartnerPairing';
import { PairingCard } from '@/components/relationship-kpis/partner/PairingCard';

export default function PairingStatus() {
  const navigate = useNavigate();
  const { partnership, pairingStatus, isLoading } = useRelationship();
  const { isInviting, sendInvite } = usePartnerPairing();

  const handleResend = async () => {
    if (!partnership) return;
    await sendInvite(
      partnership.partner_email,
      partnership.partner_phone ?? undefined,
      partnership.partner_name ?? undefined
    );
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
      </div>
    );
  }

  // No partnership — redirect to partner page
  if (!partnership) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-mi-navy-light p-6 text-center space-y-3">
          <Users className="w-10 h-10 text-white/20 mx-auto" />
          <p className="text-sm text-white/50">No active pairing found.</p>
          <Button
            size="sm"
            variant="outline"
            className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
            onClick={() => navigate('/relationship-kpis/partner')}
          >
            Go to Partner
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
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Pairing Status</h1>
          <p className="text-gray-400 text-sm">
            {pairingStatus === 'paired'
              ? `Paired with ${partnership.partner_name || 'your partner'}`
              : 'Tracking your invitation progress'}
          </p>
        </div>
      </div>

      {/* Pairing timeline card */}
      <PairingCard
        partnership={partnership}
        onResend={handleResend}
        isLoading={isInviting}
      />

      {/* Additional info */}
      <div className="rounded-xl border border-white/5 bg-mi-navy-light p-4 space-y-3">
        <p className="text-xs text-white/40 uppercase tracking-wider">Details</p>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Email</span>
            <span className="text-white/70">{partnership.partner_email}</span>
          </div>
          {partnership.partner_phone && (
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Phone</span>
              <span className="text-white/70">{partnership.partner_phone}</span>
            </div>
          )}
          {partnership.invitation_sent_at && (
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Sent</span>
              <span className="text-white/70">
                {new Date(partnership.invitation_sent_at).toLocaleDateString()}
              </span>
            </div>
          )}
          {partnership.invitation_expires_at && (
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Expires</span>
              <span className="text-white/70">
                {new Date(partnership.invitation_expires_at).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Status</span>
            <span className="text-white/70 capitalize">{partnership.invitation_status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
