/**
 * RKPI Hook: usePartnerPairing
 * Partner invitation, acceptance, and pairing status.
 */

import { useState, useCallback } from 'react';
import { useRelationship } from '@/contexts/RelationshipContext';

interface UsePartnerPairingReturn {
  pairingStatus: 'solo' | 'invited' | 'paired';
  partnerName: string | null;
  partnerEmail: string | null;
  isInviting: boolean;
  inviteError: string | null;
  sendInvite: (email: string, phone?: string, name?: string) => Promise<void>;
  acceptInvite: (token: string) => Promise<void>;
}

export function usePartnerPairing(): UsePartnerPairingReturn {
  const { partnership, pairingStatus, invitePartner, acceptPartnerInvite } = useRelationship();
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const sendInvite = useCallback(
    async (email: string, phone?: string, name?: string) => {
      try {
        setIsInviting(true);
        setInviteError(null);
        await invitePartner(email, phone, name);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send invitation';
        setInviteError(message);
        throw err;
      } finally {
        setIsInviting(false);
      }
    },
    [invitePartner]
  );

  const acceptInvite = useCallback(
    async (token: string) => {
      try {
        setIsInviting(true);
        setInviteError(null);
        await acceptPartnerInvite(token);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to accept invitation';
        setInviteError(message);
        throw err;
      } finally {
        setIsInviting(false);
      }
    },
    [acceptPartnerInvite]
  );

  return {
    pairingStatus,
    partnerName: partnership?.partner_name ?? null,
    partnerEmail: partnership?.partner_email ?? null,
    isInviting,
    inviteError,
    sendInvite,
    acceptInvite,
  };
}
