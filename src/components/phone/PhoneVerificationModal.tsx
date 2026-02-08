import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (phone: string) => void;
  userId: string;
}

type Step = 'phone_input' | 'otp_input' | 'success';

const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
];

/**
 * PhoneVerificationModal - Collects and verifies user phone via SMS OTP
 *
 * Flow:
 * 1. User enters phone number with country code
 * 2. SMS OTP sent via GHL (through edge function)
 * 3. User enters 6-digit code
 * 4. Verification completes, phone stored in user_profiles.verified_phone
 */
export const PhoneVerificationModal = ({
  isOpen,
  onClose,
  onVerified,
  userId,
}: PhoneVerificationModalProps) => {
  const [step, setStep] = useState<Step>('phone_input');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep('phone_input');
      setPhoneNumber('');
      setOtpCode('');
      setError(null);
      setCooldown(0);
    }
  }, [isOpen]);

  const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-phone', {
        body: {
          action: 'send',
          phone: fullPhoneNumber,
          userId,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setStep('otp_input');
      setCooldown(60); // 60 second cooldown for resend
      toast({
        title: 'Code Sent',
        description: `Verification code sent to ${fullPhoneNumber}`,
      });
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send verification code. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-phone', {
        body: {
          action: 'verify',
          phone: fullPhoneNumber,
          code: otpCode,
          userId,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setStep('success');
      toast({
        title: 'Phone Verified',
        description: 'Your phone number has been verified successfully.',
      });

      // Wait a moment to show success state, then close
      setTimeout(() => {
        onVerified(fullPhoneNumber);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(err instanceof Error ? err.message : 'Invalid verification code');
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'Invalid code. Please check and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0) return;
    await handleSendOTP();
  };

  const formatPhoneForDisplay = (value: string) => {
    // Basic US phone formatting: (XXX) XXX-XXXX
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
              {step === 'success' ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <DialogTitle className="text-xl">
              {step === 'success' ? 'Phone Verified!' : 'Verify Your Phone'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base pt-1">
            {step === 'phone_input' && (
              <>
                Add your phone number for voice call identification.
                When you call Nette, she'll instantly recognize you.
              </>
            )}
            {step === 'otp_input' && (
              <>
                Enter the 6-digit code we sent to{' '}
                <span className="font-semibold">{fullPhoneNumber}</span>
              </>
            )}
            {step === 'success' && (
              <>
                Your phone is now linked to your account.
                Nette will recognize you on future voice calls.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'phone_input' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formatPhoneForDisplay(phoneNumber)}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="flex-1"
                    maxLength={14}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  We'll send a verification code via SMS. Standard messaging rates may apply.
                </p>
              </div>
            </div>
          )}

          {step === 'otp_input' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={cooldown > 0 || isLoading}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : "Didn't receive code? Resend"}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Phone: {fullPhoneNumber}
              </p>
            </div>
          )}
        </div>

        {step !== 'success' && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={step === 'otp_input' ? () => setStep('phone_input') : onClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {step === 'otp_input' ? 'Change Number' : 'Skip for Now'}
            </Button>
            <Button
              onClick={step === 'phone_input' ? handleSendOTP : handleVerifyOTP}
              disabled={isLoading}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {step === 'phone_input' ? 'Sending...' : 'Verifying...'}
                </>
              ) : step === 'phone_input' ? (
                'Send Code'
              ) : (
                'Verify'
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
