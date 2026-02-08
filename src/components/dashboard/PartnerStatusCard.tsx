/**
 * RKPI Dashboard: PartnerStatusCard
 * Shows "Solo Mode" or "Paired with {name}".
 * Invite button when solo, partner info when paired.
 */

import { useState } from 'react';
import { Users, UserPlus, Mail, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePartnerPairing } from '@/hooks/usePartnerPairing';

export function PartnerStatusCard() {
  const {
    pairingStatus,
    partnerName,
    partnerEmail,
    isInviting,
    inviteError,
    sendInvite,
  } = usePartnerPairing();

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleInvite = async () => {
    if (!email.trim()) return;
    try {
      await sendInvite(email.trim(), undefined, name.trim() || undefined);
      setShowInviteForm(false);
      setEmail('');
      setName('');
    } catch {
      // Error is displayed via inviteError
    }
  };

  return (
    <Card className="border-rose-500/20 bg-mi-navy-light shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-white flex items-center gap-2">
          <Users className="h-4 w-4 text-rose-400" />
          Partner Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pairingStatus === 'paired' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Paired with {partnerName || partnerEmail}
                </p>
                {partnerName && partnerEmail && (
                  <p className="text-xs text-white/40">{partnerEmail}</p>
                )}
              </div>
            </div>
          </div>
        ) : pairingStatus === 'invited' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Mail className="h-4 w-4 text-amber-400" />
              <div>
                <p className="text-sm text-white/80">
                  Invitation sent to {partnerEmail}
                </p>
                <p className="text-xs text-white/40">Waiting for acceptance</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {!showInviteForm ? (
              <>
                <p className="text-sm text-white/50">
                  Solo mode — invite your partner to compare scores
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                  onClick={() => setShowInviteForm(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Partner
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Partner's name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                <Input
                  type="email"
                  placeholder="Partner's email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                {inviteError && (
                  <p className="text-xs text-red-400">{inviteError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-rose-500 hover:bg-rose-600 text-white"
                    onClick={handleInvite}
                    disabled={isInviting || !email.trim()}
                  >
                    {isInviting ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Invite'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/40 hover:text-white/60"
                    onClick={() => {
                      setShowInviteForm(false);
                      setEmail('');
                      setName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
