/**
 * PhoneCaptureModal
 *
 * Captures user's phone number at the "Celebration Moment" after Avatar Reveal.
 * Behavioral Science Principles Applied:
 * - Micro-commitments (BJ Fogg) - Small ask at high engagement moment
 * - Variable Rewards (Nir Eyal) - Promise personalized protocol reminders
 * - Implementation Intentions (Gollwitzer) - "When you see my text..."
 * - Completion Bias (Zeigarnik) - User is 80% done, wants to finish
 * - Reciprocity (Cialdini) - We gave them a detailed psychological profile
 *
 * TCPA-compliant with explicit consent checkbox.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { createGhlContact } from '@/hooks/useGhlContactSync';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface PhoneCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (contactId: string) => void;
  onSkip?: () => void;
  avatarName?: string;
  patternName?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PhoneCaptureModal({
  isOpen,
  onClose,
  onSuccess,
  onSkip,
  avatarName,
  patternName,
}: PhoneCaptureModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

      // Brief celebration before closing
      setTimeout(() => {
        if (onSuccess && result.ghl_contact_id) {
          onSuccess(result.ghl_contact_id);
        }
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle skip
  const handleSkip = () => {
    onSkip?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isLoading) {
            handleSkip();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-mi-navy border border-mi-cyan/30 rounded-2xl shadow-2xl shadow-mi-cyan/10 overflow-hidden"
        >
          {/* Gradient Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-mi-cyan/20 via-transparent to-mi-gold/20 pointer-events-none" />

          {/* Close Button */}
          {!isLoading && !success && (
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}

          {/* Content */}
          <div className="relative p-6">
            {success ? (
              // Success State
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">
                  You're All Set!
                </h3>
                <p className="text-gray-400 text-sm">
                  MIO will text you when your first protocol day is ready.
                </p>
              </motion.div>
            ) : (
              // Form State
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-mi-cyan to-mi-gold mb-4"
                  >
                    <Sparkles className="h-7 w-7 text-mi-navy" />
                  </motion.div>

                  <h2 className="text-xl font-bold text-white mb-2">
                    Your Protocol is Ready
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {avatarName ? (
                      <>
                        As a <span className="text-mi-cyan font-medium">{avatarName}</span>,
                        your 7-day transformation protocol starts at midnight.
                      </>
                    ) : (
                      <>Your 7-day transformation protocol starts at midnight.</>
                    )}
                  </p>
                </div>

                {/* Value Proposition */}
                <div className="mb-6 p-4 rounded-xl bg-mi-navy-light border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-mi-cyan/10">
                      <Bell className="h-5 w-5 text-mi-cyan" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm mb-1">
                        Want a gentle nudge each morning?
                      </p>
                      <p className="text-gray-500 text-xs">
                        MIO will text you when each day unlocks. Just 3 minutes to start rewiring.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-300 text-sm">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 555-5555"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="pl-10 bg-mi-navy-light border-gray-700 text-white placeholder:text-gray-500 focus:border-mi-cyan focus:ring-mi-cyan/20"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* TCPA Consent */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                    <Checkbox
                      id="sms-consent"
                      checked={consent}
                      onCheckedChange={(checked) => setConsent(checked === true)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="sms-consent"
                      className="text-xs text-gray-400 leading-relaxed cursor-pointer"
                    >
                      I agree to receive SMS messages from Mind Insurance about my protocol
                      progress. Max 2 messages/week. Reply STOP to unsubscribe.
                      Msg & data rates may apply.
                    </Label>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading || !consent || phone.replace(/\D/g, '').length !== 10}
                    className={cn(
                      'w-full font-semibold transition-all',
                      'bg-gradient-to-r from-mi-cyan to-mi-cyan-dark hover:from-mi-cyan-dark hover:to-mi-cyan',
                      'text-mi-navy shadow-lg shadow-mi-cyan/20'
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Setting Up...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Text Me My Daily Protocol
                      </>
                    )}
                  </Button>

                  {/* Skip Option */}
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={isLoading}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-400 transition-colors py-2"
                  >
                    Skip for now
                    <span className="text-xs block text-gray-600">
                      (you can add later in Settings)
                    </span>
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PhoneCaptureModal;
