/**
 * RKPI-009: Accept Partner Invite Page
 * Route: /accept-partner-invite?token={uuid}
 * Auth check → accept → redirect to partner page.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, XCircle, Loader2, Heart, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRelationship } from '@/contexts/RelationshipContext';

type AcceptState = 'loading' | 'accepting' | 'success' | 'error' | 'no-token' | 'needs-auth';

export default function AcceptPartnerInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, isLoading: authLoading } = useAuth();
  const { acceptPartnerInvite } = useRelationship();
  const [state, setState] = useState<AcceptState>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setState('no-token');
      return;
    }

    if (!user) {
      setState('needs-auth');
      return;
    }

    // Attempt to accept
    const accept = async () => {
      setState('accepting');
      try {
        await acceptPartnerInvite(token);
        setState('success');
        // Auto-redirect after a short delay
        setTimeout(() => navigate('/relationship-kpis/partner'), 2000);
      } catch (err: unknown) {
        setState('error');
        setErrorMsg(err instanceof Error ? err.message : 'Failed to accept invitation');
      }
    };

    accept();
  }, [token, user, authLoading, acceptPartnerInvite, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-mi-navy p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Logo / branding */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
            <Heart className="w-7 h-7 text-white" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-white">Partner Invitation</h1>

        {/* ── Loading ── */}
        {(state === 'loading' || state === 'accepting') && (
          <div className="rounded-xl border border-rose-500/20 bg-mi-navy-light p-8 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-rose-400 mx-auto" />
            <p className="text-sm text-white/50">
              {state === 'loading' ? 'Verifying invitation...' : 'Accepting invitation...'}
            </p>
          </div>
        )}

        {/* ── No token ── */}
        {state === 'no-token' && (
          <div className="rounded-xl border border-red-500/20 bg-mi-navy-light p-8 space-y-3">
            <XCircle className="h-8 w-8 text-red-400 mx-auto" />
            <p className="text-sm text-red-300">
              Invalid invitation link. No token found.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
              onClick={() => navigate('/')}
            >
              Go Home
            </Button>
          </div>
        )}

        {/* ── Needs auth ── */}
        {state === 'needs-auth' && (
          <div className="rounded-xl border border-amber-500/20 bg-mi-navy-light p-8 space-y-3">
            <LogIn className="h-8 w-8 text-amber-400 mx-auto" />
            <p className="text-sm text-amber-300">
              Please sign in to accept this invitation.
            </p>
            <Button
              size="sm"
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => navigate(`/login?redirect=/accept-partner-invite?token=${token}`)}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </div>
        )}

        {/* ── Success ── */}
        {state === 'success' && (
          <div className="rounded-xl border border-emerald-500/20 bg-mi-navy-light p-8 space-y-3">
            <Check className="h-8 w-8 text-emerald-400 mx-auto" />
            <p className="text-sm text-emerald-300">
              Invitation accepted! You&apos;re now paired.
            </p>
            <p className="text-[10px] text-white/30">Redirecting to partner dashboard...</p>
          </div>
        )}

        {/* ── Error ── */}
        {state === 'error' && (
          <div className="rounded-xl border border-red-500/20 bg-mi-navy-light p-8 space-y-3">
            <XCircle className="h-8 w-8 text-red-400 mx-auto" />
            <p className="text-sm text-red-300">
              {errorMsg || 'Something went wrong.'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                onClick={() => navigate('/relationship-kpis/partner')}
              >
                Go to Partner
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white/40 hover:text-white/60"
                onClick={() => navigate('/')}
              >
                Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
