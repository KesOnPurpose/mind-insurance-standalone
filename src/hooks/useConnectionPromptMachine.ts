/**
 * useConnectionPromptMachine
 * State machine for the Connection Prompts slot-machine reveal UX.
 *
 * States: idle → spinning (1.2s) → revealing (spring animation) → revealed
 * The fetch fires during the spinning phase so the prompt is ready by reveal time.
 */

import { useState, useCallback, useRef } from 'react';
import type {
  RelationshipConnectionPrompt,
  PromptAudience,
  PromptCategory,
  IntimacyLevel,
  KidAgeRange,
} from '@/types/relationship-kpis';
import { getFilteredRandomPrompt } from '@/services/relationshipConnectionPromptService';

export type MachineState = 'idle' | 'spinning' | 'revealing' | 'revealed';

export interface PromptFilters {
  audience: PromptAudience;
  category?: PromptCategory;
  intimacyLevel?: IntimacyLevel;
  kidAgeRange?: KidAgeRange;
}

const SPIN_DURATION = 1200; // ms
const REVEAL_DELAY = 300; // ms pause between spin end and reveal start

export function useConnectionPromptMachine() {
  const [state, setState] = useState<MachineState>('idle');
  const [currentPrompt, setCurrentPrompt] = useState<RelationshipConnectionPrompt | null>(null);
  const [filters, setFilters] = useState<PromptFilters>({ audience: 'partner' });
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const spin = useCallback(async () => {
    // Clear any pending timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);

    setState('spinning');
    setError(null);

    // Fire fetch in parallel with spin animation
    const fetchPromise = getFilteredRandomPrompt(filters);

    // Wait for spin animation to finish
    timeoutRef.current = setTimeout(async () => {
      try {
        const prompt = await fetchPromise;
        if (!prompt) {
          setError('No prompts match your filters. Try adjusting them.');
          setState('idle');
          return;
        }
        setCurrentPrompt(prompt);

        // Brief pause before reveal for dramatic effect
        revealTimeoutRef.current = setTimeout(() => {
          setState('revealing');
          // After reveal animation settles, mark as fully revealed
          revealTimeoutRef.current = setTimeout(() => {
            setState('revealed');
          }, 600);
        }, REVEAL_DELAY);
      } catch (err) {
        console.error('[RKPI] Failed to fetch prompt:', err);
        setError('Failed to load prompt. Please try again.');
        setState('idle');
      }
    }, SPIN_DURATION);
  }, [filters]);

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    setState('idle');
    setCurrentPrompt(null);
    setError(null);
  }, []);

  return {
    state,
    currentPrompt,
    filters,
    setFilters,
    spin,
    reset,
    error,
  };
}
