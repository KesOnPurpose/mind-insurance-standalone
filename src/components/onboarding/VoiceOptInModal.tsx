/**
 * VoiceOptInModal
 *
 * Captures user's phone number and voice call preferences for MIO Voice AI.
 * Shown after pattern identification during onboarding.
 *
 * Features:
 * - Phone collection with validation
 * - Preferred call time selection
 * - TCPA-compliant consent
 * - GHL contact sync
 * - Premium glass-morphism styling
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneCall,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  Clock,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { createGhlContact } from '@/hooks/useGhlContactSync';
import {
  validatePhone,
  updateVoiceOptIn,
  CALL_TIME_OPTIONS
} from '@/services/voiceOptInService';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface VoiceOptInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSkip?: () => void;
  avatarName?: string;
  patternName?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VoiceOptInModal({
  isOpen,
  onClose,
  onSuccess,
  onSkip,
  avatarName,
  patternName,
}: VoiceOptInModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState('07:30');
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pre-fill phone if already captured
  useEffect(() => {
    if (profile?.phone) {
      // Format for display
      const digits = profile.phone.replace(/\D/g, '');
      if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        setPhone(`(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`);
      }
    }
  }, [profile?.phone]);

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '');

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
      setError('Please agree to receive voice calls and SMS');
      return;
    }

    if (!user?.id || !user?.email) {
      setError('Please sign in to continue');
      return;
    }

    setIsLoading(true);

    try {
      // Create/update GHL contact first
      const ghlResult = await createGhlContact(
        user.id,
        user.email,
        `+1${digits}`,
        profile?.full_name || undefined
      );

      if (!ghlResult?.success) {
        console.warn('[VoiceOptIn] GHL sync failed:', ghlResult?.message);
        // Continue anyway - voice opt-in can still work
      }

      // Update voice opt-in in user_profiles
      const voiceResult = await updateVoiceOptIn(user.id, {
        phone: `+1${digits}`,
        enabled: true,
        preferredTime
      });

      if (!voiceResult.success) {
        setError(voiceResult.error || 'Failed to enable voice calls');
        return;
      }

      setSuccess(true);

      // Refresh profile
      if (refreshProfile) {
        await refreshProfile();
      }

      // Brief celebration before closing
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2500);
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
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
          className="relative w-full max-w-md bg-mi-navy/90 backdrop-blur-xl border border-mi-cyan/30 rounded-2xl shadow-2xl shadow-mi-cyan/20 overflow-hidden"
        >
          {/* Gradient Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-mi-cyan/20 via-transparent to-mi-gold/20 pointer-events-none" />

          {/* Animated Background Glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-mi-cyan/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-mi-gold/10 rounded-full blur-3xl animate-pulse delay-1000" />

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
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-mi-cyan/30 to-mi-gold/30 flex items-center justify-center"
                >
                  <CheckCircle2 className="h-10 w-10 text-mi-cyan" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Voice Check-ins Enabled!
                </h3>
                <p className="text-gray-400 text-sm">
                  MIO will call you when you need a nudge.
                  <br />
                  <span className="text-mi-cyan">Max 2 calls per week</span>
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
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-mi-cyan via-mi-cyan-dark to-mi-gold mb-4 shadow-lg shadow-mi-cyan/30"
                  >
                    <PhoneCall className="h-8 w-8 text-mi-navy" />
                  </motion.div>

                  <h2 className="text-xl font-bold text-white mb-2">
                    Take MIO With You
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {avatarName ? (
                      <>
                        Your <span className="text-mi-cyan font-medium">{patternName || 'pattern'}</span> is identified.
                        <br />
                        Want MIO to call you when you need a nudge?
                      </>
                    ) : (
                      <>
                        Your patterns are identified.
                        <br />
                        Now let's make sure you stay on track.
                      </>
                    )}
                  </p>
                </div>

                {/* When MIO Calls */}
                <div className="mb-6 p-4 rounded-xl bg-mi-navy-light/50 border border-white/5 backdrop-blur-sm">
                  <p className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-mi-cyan" />
                    When MIO will call:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-mi-cyan" />
                      If you miss 2 days in a row
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-mi-cyan" />
                      Your final day of each protocol
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-mi-gold" />
                      When you're having a breakthrough
                    </li>
                  </ul>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Phone Input */}
                  <div className="space-y-2">
                    <Label htmlFor="voice-phone" className="text-gray-300 text-sm">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="voice-phone"
                        type="tel"
                        placeholder="(555) 555-5555"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="pl-10 bg-mi-navy-light/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-mi-cyan focus:ring-mi-cyan/20"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Preferred Time */}
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      Preferred Call Time
                    </Label>
                    <Select value={preferredTime} onValueChange={setPreferredTime}>
                      <SelectTrigger className="bg-mi-navy-light/50 border-gray-700 text-white focus:ring-mi-cyan/20">
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                      <SelectContent className="bg-mi-navy border-gray-700">
                        {CALL_TIME_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="text-white hover:bg-mi-cyan/20"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Consent */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                    <Checkbox
                      id="voice-consent"
                      checked={consent}
                      onCheckedChange={(checked) => setConsent(checked === true)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="voice-consent"
                      className="text-xs text-gray-400 leading-relaxed cursor-pointer"
                    >
                      I agree to receive voice calls and SMS from MIO about my progress.
                      Max 2 calls/week. Reply STOP to unsubscribe.
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
                      'text-mi-navy shadow-lg shadow-mi-cyan/30'
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enabling Voice Check-ins...
                      </>
                    ) : (
                      <>
                        <PhoneCall className="w-4 h-4 mr-2" />
                        Enable Voice Check-ins
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
                    Maybe later
                    <span className="text-xs block text-gray-600">
                      (You control this in Settings)
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

export default VoiceOptInModal;
