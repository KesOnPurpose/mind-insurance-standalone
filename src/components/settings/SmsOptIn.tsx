/**
 * SMS Opt-In Component
 *
 * Allows users to opt-in for SMS notifications by entering their phone number.
 * Creates a GHL contact if not already linked.
 * TCPA-compliant with explicit consent checkbox.
 */

import { useState, useEffect } from 'react';
import { MessageSquare, Check, Phone, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { createGhlContact } from '@/hooks/useGhlContactSync';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface SmsOptInProps {
  onSuccess?: (contactId: string) => void;
  compact?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SmsOptIn({ onSuccess, compact = false }: SmsOptInProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pre-fill phone if available
  useEffect(() => {
    if (profile?.phone) {
      setPhone(profile.phone);
    }
  }, [profile]);

  // Already has GHL contact
  const isLinked = !!profile?.ghl_contact_id;

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      setPhone(digits);
    } else if (digits.length <= 6) {
      setPhone(`(${digits.slice(0, 3)}) ${digits.slice(3)}`);
    } else {
      setPhone(`(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`);
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!consent) {
      setError('Please agree to receive SMS messages');
      return;
    }

    if (!user?.id || !user?.email) {
      setError('Please sign in to continue');
      return;
    }

    setIsLoading(true);

    try {
      const result = await createGhlContact(
        user.id,
        user.email,
        `+1${digits}`, // Format as E.164
        profile?.full_name || undefined
      );

      if (!result?.success) {
        setError(result?.message || 'Failed to enable SMS notifications');
        return;
      }

      setSuccess(true);

      // Refresh profile to get updated ghl_contact_id
      if (refreshProfile) {
        await refreshProfile();
      }

      if (onSuccess && result.ghl_contact_id) {
        onSuccess(result.ghl_contact_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Already linked state
  if (isLinked || success) {
    return (
      <Card className={cn(
        "bg-emerald-500/10 border-emerald-500/30",
        compact && "p-4"
      )}>
        <CardContent className={cn("flex items-center gap-3", compact ? "p-0" : "pt-6")}>
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-emerald-400">SMS Notifications Enabled</p>
            <p className="text-sm text-gray-400">
              You'll receive important protocol reminders via SMS
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact version for inline use
  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="tel"
              placeholder="(555) 555-5555"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="bg-mi-navy/50 border-gray-700"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !consent || phone.replace(/\D/g, '').length !== 10}
            className="bg-mi-cyan hover:bg-mi-cyan/80"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="sms-consent-compact"
            checked={consent}
            onCheckedChange={(checked) => setConsent(checked === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="sms-consent-compact"
            className="text-xs text-gray-400 leading-tight cursor-pointer"
          >
            I agree to receive SMS notifications. Msg & data rates may apply.
          </Label>
        </div>

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </form>
    );
  }

  // Full card version
  return (
    <Card className="bg-mi-navy/50 border-gray-700/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-mi-cyan/20 flex items-center justify-center">
            <Phone className="w-5 h-5 text-mi-cyan" />
          </div>
          <div>
            <CardTitle className="text-white">Enable SMS Notifications</CardTitle>
            <CardDescription>
              Get protocol reminders delivered to your phone
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-300">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 555-5555"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="bg-mi-navy border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
            <Checkbox
              id="sms-consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="sms-consent"
              className="text-sm text-gray-300 leading-relaxed cursor-pointer"
            >
              I agree to receive SMS messages from Mind Insurance about my protocol
              progress. Message and data rates may apply. Reply STOP to unsubscribe
              at any time.
            </Label>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !consent || phone.replace(/\D/g, '').length !== 10}
            className="w-full bg-mi-cyan hover:bg-mi-cyan/80 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enabling...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 mr-2" />
                Enable SMS Notifications
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            We'll only send you important reminders about your protocols.
            Usually 1-2 messages per week maximum.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default SmsOptIn;
