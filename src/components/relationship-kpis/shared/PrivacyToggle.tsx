/**
 * RKPI Shared: PrivacyToggle
 * Toggle button for score/note privacy (visible vs. private from partner).
 * Reusable across check-in wizard and score editing views.
 */

import { Eye, EyeOff } from 'lucide-react';

interface PrivacyToggleProps {
  isPrivate: boolean;
  onChange: (isPrivate: boolean) => void;
  disabled?: boolean;
}

export function PrivacyToggle({ isPrivate, onChange, disabled }: PrivacyToggleProps) {
  return (
    <button
      type="button"
      className={`flex items-center gap-2 text-xs transition-colors ${
        disabled
          ? 'opacity-50 cursor-not-allowed text-white/30'
          : 'text-white/40 hover:text-white/60'
      }`}
      onClick={() => !disabled && onChange(!isPrivate)}
      disabled={disabled}
      aria-pressed={isPrivate}
      aria-label={isPrivate ? 'Score is private' : 'Score is visible to partner'}
    >
      {isPrivate ? (
        <>
          <EyeOff className="h-3.5 w-3.5" />
          <span>Private — partner won&apos;t see this score</span>
        </>
      ) : (
        <>
          <Eye className="h-3.5 w-3.5" />
          <span>Visible to partner (click to make private)</span>
        </>
      )}
    </button>
  );
}
