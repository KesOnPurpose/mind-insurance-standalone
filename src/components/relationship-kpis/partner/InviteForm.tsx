/**
 * RKPI Partner: InviteForm
 * Email (required) + phone + name form for inviting a partner.
 * Validates email, shows loading/error states, triggers invite.
 */

import { useState } from 'react';
import { Mail, Phone, User, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InviteFormProps {
  onSubmit: (email: string, phone?: string, name?: string) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  onCancel?: () => void;
}

export function InviteForm({ onSubmit, isSubmitting, error, onCancel }: InviteFormProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    await onSubmit(
      trimmedEmail,
      phone.trim() || undefined,
      name.trim() || undefined
    );
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name (optional) */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 flex items-center gap-1.5">
          <User className="h-3 w-3" />
          Partner&apos;s Name
          <span className="text-white/30">(optional)</span>
        </label>
        <Input
          placeholder="e.g., Alex"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
      </div>

      {/* Email (required) */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 flex items-center gap-1.5">
          <Mail className="h-3 w-3" />
          Partner&apos;s Email
          <span className="text-rose-400">*</span>
        </label>
        <Input
          type="email"
          placeholder="partner@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setValidationError(null);
          }}
          disabled={isSubmitting}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          required
        />
      </div>

      {/* Phone (optional) */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 flex items-center gap-1.5">
          <Phone className="h-3 w-3" />
          Phone Number
          <span className="text-white/30">(optional)</span>
        </label>
        <Input
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isSubmitting}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
      </div>

      {/* Error display */}
      {displayError && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {displayError}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={isSubmitting || !email.trim()}
          className="bg-rose-500 hover:bg-rose-600 text-white flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending Invite...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Invitation
            </>
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-white/40 hover:text-white/60"
          >
            Cancel
          </Button>
        )}
      </div>

      <p className="text-[10px] text-white/30 leading-relaxed">
        Your partner will receive an email with a link to join your relationship check-ins.
        The invitation expires in 7 days.
      </p>
    </form>
  );
}
