/**
 * ProtocolJournalInput Component
 * Phase 28: Reusable journal textarea for protocol task completions
 *
 * Features:
 * - Adaptive placeholder based on task type
 * - Word count indicator
 * - Character limit
 * - Optional guided prompts from success criteria
 */

import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PenLine, Sparkles } from 'lucide-react';

interface ProtocolJournalInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  successCriteria?: string[];
  maxWords?: number;
  minRows?: number;
  onFocus?: () => void;
  disabled?: boolean;
}

// Adaptive placeholders based on common protocol task patterns
function getDefaultPlaceholder(successCriteria?: string[]): string {
  if (!successCriteria || successCriteria.length === 0) {
    return "What did you notice? How did it feel? Any insights?";
  }

  // Check for specific patterns in success criteria
  const criteriaText = successCriteria.join(' ').toLowerCase();

  if (criteriaText.includes('moment') || criteriaText.includes('caught')) {
    return "Describe the moments you caught yourself. What was happening? What triggered it?";
  }

  if (criteriaText.includes('trigger') || criteriaText.includes('pattern')) {
    return "What patterns did you notice? What triggers came up?";
  }

  if (criteriaText.includes('practice') || criteriaText.includes('exercise')) {
    return "How did the practice go? What was easy? What was challenging?";
  }

  if (criteriaText.includes('reflect') || criteriaText.includes('journal')) {
    return "Take a moment to reflect. What's coming up for you?";
  }

  return "Capture your thoughts, observations, and insights from today's task...";
}

export function ProtocolJournalInput({
  value,
  onChange,
  placeholder,
  successCriteria,
  maxWords = 500,
  minRows = 4,
  onFocus,
  disabled = false,
}: ProtocolJournalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [startTime] = useState<number>(Date.now());

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const isNearLimit = wordCount > maxWords * 0.8;
  const isOverLimit = wordCount > maxWords;

  const effectivePlaceholder = placeholder || getDefaultPlaceholder(successCriteria);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // Allow typing even if over limit (just show warning)
    onChange(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-cyan-400">
          <PenLine className="w-4 h-4" />
          Your Reflection
          <Badge
            variant="outline"
            className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
          >
            Optional
          </Badge>
        </div>
        <span
          className={`text-xs ${
            isOverLimit
              ? 'text-red-400'
              : isNearLimit
              ? 'text-amber-400'
              : 'text-slate-500'
          }`}
        >
          {wordCount}/{maxWords} words
        </span>
      </div>

      {/* Textarea */}
      <div
        className={`relative rounded-lg transition-all ${
          isFocused
            ? 'ring-2 ring-cyan-500/50'
            : 'ring-1 ring-slate-700'
        }`}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={effectivePlaceholder}
          disabled={disabled}
          rows={minRows}
          className={`
            bg-slate-800/50 border-0 resize-none
            text-slate-200 placeholder:text-slate-500
            focus:ring-0 focus-visible:ring-0
            ${isOverLimit ? 'text-red-300' : ''}
          `}
        />

        {/* Sparkle hint when empty */}
        {!value && !isFocused && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-slate-500">
            <Sparkles className="w-3 h-3" />
            MIO learns from your reflections
          </div>
        )}
      </div>

      {/* Guided prompts from success criteria */}
      {successCriteria && successCriteria.length > 0 && !value && (
        <div className="pt-2">
          <p className="text-xs text-slate-500 mb-2">Consider reflecting on:</p>
          <div className="flex flex-wrap gap-2">
            {successCriteria.slice(0, 3).map((criterion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onChange(criterion + '\n\n')}
                className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-400
                         hover:bg-cyan-500/10 hover:text-cyan-400
                         transition-colors cursor-pointer"
              >
                {criterion.length > 40 ? criterion.slice(0, 40) + '...' : criterion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Over limit warning */}
      {isOverLimit && (
        <p className="text-xs text-red-400">
          Your reflection is a bit long. Consider keeping it concise for better insights.
        </p>
      )}
    </div>
  );
}

export default ProtocolJournalInput;
