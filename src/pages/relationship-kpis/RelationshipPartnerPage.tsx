/**
 * RKPI-009: Partner Management Page
 * Solo mode (invite CTA) or paired mode (shared dashboard, partner stats).
 * This replaces the placeholder — serves as the main partner hub.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Heart,
  UserPlus,
  BarChart3,
  List,
  RefreshCw,
  Loader2,
  PauseCircle,
  PlayCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRelationship } from '@/contexts/RelationshipContext';
import { usePartnerPairing } from '@/hooks/usePartnerPairing';
import { SharedDashboard } from '@/components/relationship-kpis/partner/SharedDashboard';
import { CompareScores } from '@/components/relationship-kpis/partner/CompareScores';
import { PairingCard } from '@/components/relationship-kpis/partner/PairingCard';
import { InviteForm } from '@/components/relationship-kpis/partner/InviteForm';
import {
  pausePartnership,
  resumePartnership,
  endPartnership,
} from '@/services/relationshipPartnershipService';
import type { RelationshipKPIScore } from '@/types/relationship-kpis';
import { toast } from 'sonner';

type CompareViewMode = 'dashboard' | 'compare';

export default function RelationshipPartnerPage() {
  const navigate = useNavigate();
  const {
    partnership,
    pairingStatus,
    latestCheckIn,
    refreshData,
    isLoading,
  } = useRelationship();

  const {
    isInviting,
    inviteError,
    sendInvite,
  } = usePartnerPairing();

  const [compareView, setCompareView] = useState<CompareViewMode>('dashboard');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleInvite = async (email: string, phone?: string, name?: string) => {
    await sendInvite(email, phone, name);
    setShowInviteForm(false);
  };

  const handleResend = async () => {
    if (!partnership) return;
    // For resend, we re-invite with the same email
    await sendInvite(partnership.partner_email, partnership.partner_phone ?? undefined, partnership.partner_name ?? undefined);
  };

  const handlePause = async () => {
    if (!partnership) return;
    setActionLoading(true);
    try {
      await pausePartnership(partnership.id);
      await refreshData();
      toast.success('Partnership paused');
    } catch {
      toast.error('Failed to pause partnership');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!partnership) return;
    setActionLoading(true);
    try {
      await resumePartnership(partnership.id);
      await refreshData();
      toast.success('Partnership resumed');
    } catch {
      toast.error('Failed to resume partnership');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!partnership) return;
    setActionLoading(true);
    try {
      await endPartnership(partnership.id);
      await refreshData();
      toast.success('Partnership ended');
    } catch {
      toast.error('Failed to end partnership');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Derived data ────────────────────────────────────────────────────────
  const userScores: RelationshipKPIScore[] = latestCheckIn?.scores ?? [];
  // TODO: fetch partner's latest scores when paired (requires partner check-in query)
  const partnerScores: RelationshipKPIScore[] = [];

  const isPaired = pairingStatus === 'paired';
  const isInvited = pairingStatus === 'invited';
  const isSolo = pairingStatus === 'solo';
  const isPaused = partnership?.status === 'paused';

  // ── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Partner</h1>
            <p className="text-gray-400 text-sm">
              {isPaired
                ? `Paired with ${partnership?.partner_name || 'your partner'}`
                : 'Invite your partner and compare perspectives'}
            </p>
          </div>
        </div>

        {isPaired && (
          <Button
            size="sm"
            variant="ghost"
            className="text-white/40 hover:text-white/60"
            onClick={() => refreshData()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* ═══ SOLO MODE ═══ */}
      {isSolo && !showInviteForm && (
        <div className="rounded-xl border border-rose-500/20 bg-mi-navy-light p-8 text-center space-y-4">
          <Heart className="w-12 h-12 text-rose-400 mx-auto" />
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Invite Your Partner
            </h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Relationship check-ins are more powerful together. Invite your partner
              to compare perspectives and identify perception gaps.
            </p>
          </div>
          <Button
            className="bg-rose-500 hover:bg-rose-600 text-white"
            onClick={() => setShowInviteForm(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Partner
          </Button>
        </div>
      )}

      {/* Invite form (solo, toggled) */}
      {isSolo && showInviteForm && (
        <div className="rounded-xl border border-rose-500/20 bg-mi-navy-light p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Send Invitation</h2>
          <InviteForm
            onSubmit={handleInvite}
            isSubmitting={isInviting}
            error={inviteError}
            onCancel={() => setShowInviteForm(false)}
          />
        </div>
      )}

      {/* ═══ INVITED MODE ═══ */}
      {isInvited && partnership && (
        <PairingCard
          partnership={partnership}
          onResend={handleResend}
          isLoading={isInviting}
        />
      )}

      {/* ═══ PAIRED MODE ═══ */}
      {isPaired && (
        <>
          {/* Paused banner */}
          {isPaused && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <PauseCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-300 flex-1">
                Partnership is paused. Score sharing is disabled.
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="text-amber-400 hover:text-amber-300 text-xs"
                onClick={handleResume}
                disabled={actionLoading}
              >
                <PlayCircle className="h-3 w-3 mr-1" />
                Resume
              </Button>
            </div>
          )}

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={compareView === 'dashboard' ? 'default' : 'ghost'}
              className={
                compareView === 'dashboard'
                  ? 'bg-rose-500 text-white'
                  : 'text-white/40 hover:text-white/60'
              }
              onClick={() => setCompareView('dashboard')}
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Dashboard
            </Button>
            <Button
              size="sm"
              variant={compareView === 'compare' ? 'default' : 'ghost'}
              className={
                compareView === 'compare'
                  ? 'bg-rose-500 text-white'
                  : 'text-white/40 hover:text-white/60'
              }
              onClick={() => setCompareView('compare')}
            >
              <List className="h-3 w-3 mr-1" />
              Compare
            </Button>
          </div>

          {/* Comparison views */}
          <div className="rounded-xl border border-white/10 bg-mi-navy-light p-4">
            {compareView === 'dashboard' ? (
              <SharedDashboard
                userScores={userScores}
                partnerScores={partnerScores}
                userName="You"
                partnerName={partnership?.partner_name || 'Partner'}
              />
            ) : (
              <CompareScores
                userScores={userScores}
                partnerScores={partnerScores}
                userName="You"
                partnerName={partnership?.partner_name || 'Partner'}
                viewMode="bars"
              />
            )}
          </div>

          {/* Partnership actions */}
          <div className="rounded-xl border border-white/5 bg-mi-navy-light p-4 space-y-3">
            <p className="text-xs text-white/40 uppercase tracking-wider">Partnership</p>
            <div className="flex gap-2">
              {!isPaused && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                  onClick={handlePause}
                  disabled={actionLoading}
                >
                  <PauseCircle className="h-3 w-3 mr-1" />
                  Pause
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                onClick={handleEnd}
                disabled={actionLoading}
              >
                <XCircle className="h-3 w-3 mr-1" />
                End Partnership
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
