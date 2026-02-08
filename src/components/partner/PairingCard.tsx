/**
 * RKPI Partner: PairingCard
 * Timeline-style card showing invitation/pairing progression.
 * States: Sent → Account Created → Accepted → Active
 * Includes resend and cancel buttons.
 */

import { Check, Clock, Mail, UserPlus, Users, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RelationshipPartnership } from '@/types/relationship-kpis';

interface PairingCardProps {
  partnership: RelationshipPartnership;
  onResend?: () => Promise<void>;
  onCancel?: () => Promise<void>;
  isLoading?: boolean;
}

type TimelineStep = {
  label: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'upcoming';
  detail?: string;
};

function getTimelineSteps(partnership: RelationshipPartnership): TimelineStep[] {
  const invitationStatus = partnership.invitation_status;
  const partnershipStatus = partnership.status;

  const steps: TimelineStep[] = [
    {
      label: 'Invitation Sent',
      icon: <Mail className="h-4 w-4" />,
      status: 'completed',
      detail: partnership.invitation_sent_at
        ? new Date(partnership.invitation_sent_at).toLocaleDateString()
        : undefined,
    },
    {
      label: 'Partner Account',
      icon: <UserPlus className="h-4 w-4" />,
      status: invitationStatus === 'pending' ? 'upcoming' : 'completed',
    },
    {
      label: 'Accepted',
      icon: <Check className="h-4 w-4" />,
      status:
        invitationStatus === 'accepted'
          ? 'completed'
          : invitationStatus === 'pending'
          ? 'upcoming'
          : 'upcoming',
    },
    {
      label: 'Active',
      icon: <Users className="h-4 w-4" />,
      status:
        invitationStatus === 'accepted' && partnershipStatus === 'active'
          ? 'completed'
          : 'upcoming',
    },
  ];

  // Mark the first upcoming step as 'current'
  const firstUpcoming = steps.findIndex((s) => s.status === 'upcoming');
  if (firstUpcoming !== -1) {
    steps[firstUpcoming].status = 'current';
  }

  return steps;
}

const STATUS_COLORS = {
  completed: {
    dot: 'bg-emerald-400',
    line: 'bg-emerald-400/50',
    text: 'text-white',
    icon: 'text-emerald-400',
  },
  current: {
    dot: 'bg-rose-400 animate-pulse',
    line: 'bg-white/10',
    text: 'text-white',
    icon: 'text-rose-400',
  },
  upcoming: {
    dot: 'bg-white/20',
    line: 'bg-white/10',
    text: 'text-white/30',
    icon: 'text-white/30',
  },
};

export function PairingCard({ partnership, onResend, onCancel, isLoading }: PairingCardProps) {
  const steps = getTimelineSteps(partnership);
  const isPending = partnership.invitation_status === 'pending';
  const isExpired = partnership.invitation_status === 'expired';
  const isDeclined = partnership.invitation_status === 'declined';

  return (
    <div className="rounded-xl border border-rose-500/20 bg-mi-navy-light p-4 space-y-4">
      {/* Partner info header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">
            {partnership.partner_name || 'Your Partner'}
          </p>
          <p className="text-xs text-white/40">{partnership.partner_email}</p>
        </div>
        {isPending && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/20">
            Pending
          </span>
        )}
        {isExpired && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
            Expired
          </span>
        )}
        {isDeclined && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
            Declined
          </span>
        )}
        {partnership.invitation_status === 'accepted' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
            Active
          </span>
        )}
      </div>

      {/* Timeline */}
      {!isExpired && !isDeclined && (
        <div className="space-y-0">
          {steps.map((step, idx) => {
            const colors = STATUS_COLORS[step.status];
            return (
              <div key={step.label} className="flex items-start gap-3">
                {/* Dot + Line */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${colors.dot} flex-shrink-0 mt-0.5`} />
                  {idx < steps.length - 1 && (
                    <div className={`w-0.5 h-6 ${colors.line}`} />
                  )}
                </div>
                {/* Content */}
                <div className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className={colors.icon}>{step.icon}</span>
                    <span className={`text-xs font-medium ${colors.text}`}>{step.label}</span>
                  </div>
                  {step.detail && (
                    <p className="text-[10px] text-white/30 ml-6">{step.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expired / Declined message */}
      {isExpired && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <Clock className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">
            This invitation has expired. Send a new invitation to try again.
          </p>
        </div>
      )}
      {isDeclined && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">
            Your partner declined the invitation. You can send a new one.
          </p>
        </div>
      )}

      {/* Actions */}
      {(isPending || isExpired || isDeclined) && (
        <div className="flex gap-2">
          {onResend && (
            <Button
              size="sm"
              variant="outline"
              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              onClick={onResend}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              {isExpired || isDeclined ? 'Send New Invite' : 'Resend'}
            </Button>
          )}
          {onCancel && isPending && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white/40 hover:text-white/60"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel Invite
            </Button>
          )}
        </div>
      )}

      {/* Expiration notice */}
      {isPending && partnership.invitation_expires_at && (
        <p className="text-[10px] text-white/25">
          Expires {new Date(partnership.invitation_expires_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
