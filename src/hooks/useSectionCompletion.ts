/**
 * useSectionCompletion Hook
 *
 * Hook to check and trigger MIO feedback when a practice section is completed.
 * Use this after saving a practice to check if the section is now complete.
 *
 * Also saves pending insight data for the sticky banner notification.
 */

import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  checkAndTriggerSectionFeedback,
  getCurrentPracticeDate,
  getSectionName
} from '@/services/sectionCompletionService';
import { getSectionFromPracticeType, SectionType } from '@/types/mio-insights';
import { PendingInsight } from '@/components/mind-insurance/MIOInsightBanner';

// localStorage key for pending insight
const PENDING_INSIGHT_KEY = 'mio_pending_insight';

interface UseSectionCompletionReturn {
  checkCompletion: (practiceType: string, practiceDate?: string) => Promise<void>;
  isChecking: boolean;
  feedbackTriggered: boolean;
  lastSection: string | null;
}

/**
 * Save pending insight to localStorage for banner display
 */
function savePendingInsight(
  section: SectionType,
  insightPreview: string,
  rewardTier: 'standard' | 'bonus_insight' | 'pattern_breakthrough'
): void {
  const pendingInsight: PendingInsight = {
    preview: insightPreview,
    sectionName: getSectionName(section),
    rewardTier,
    timestamp: Date.now()
  };

  try {
    localStorage.setItem(PENDING_INSIGHT_KEY, JSON.stringify(pendingInsight));
    console.log('[useSectionCompletion] Saved pending insight for banner:', pendingInsight);
  } catch (error) {
    console.error('[useSectionCompletion] Error saving pending insight:', error);
  }
}

export function useSectionCompletion(): UseSectionCompletionReturn {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isChecking, setIsChecking] = useState(false);
  const [feedbackTriggered, setFeedbackTriggered] = useState(false);
  const [lastSection, setLastSection] = useState<string | null>(null);

  /**
   * Check if completing this practice completes a section
   * and trigger MIO feedback if so.
   *
   * Call this after successfully saving a practice.
   */
  const checkCompletion = useCallback(async (
    practiceType: string,
    practiceDate?: string
  ) => {
    if (!user?.id) {
      console.log('[useSectionCompletion] No user, skipping check');
      return;
    }

    const date = practiceDate || getCurrentPracticeDate();

    setIsChecking(true);
    setFeedbackTriggered(false);

    try {
      const result = await checkAndTriggerSectionFeedback(
        user.id,
        practiceType,
        date
      );

      if (result.success && result.feedbackTriggered && result.section) {
        setFeedbackTriggered(true);
        setLastSection(result.section);

        // Save pending insight for sticky banner
        savePendingInsight(
          result.section,
          result.insightPreview || 'MIO has analyzed your practices...',
          result.rewardTier || 'standard'
        );

        // Show toast notification (keep for immediate feedback)
        const sectionName = getSectionName(result.section);
        toast({
          title: `${getEnergyEmoji(result.section)} ${sectionName} Complete!`,
          description: 'MIO is analyzing your practices and preparing personalized feedback...',
          duration: 5000
        });

        console.log('[useSectionCompletion] Feedback triggered for section:', result.section);
      }

    } catch (error) {
      console.error('[useSectionCompletion] Error:', error);
    } finally {
      setIsChecking(false);
    }
  }, [user?.id, toast]);

  return {
    checkCompletion,
    isChecking,
    feedbackTriggered,
    lastSection
  };
}

/**
 * Get the energy emoji for a section
 */
function getEnergyEmoji(section: string): string {
  const emojis: Record<string, string> = {
    PRO: '👑', // Commander
    TE: '🎯',  // Strategist
    CT: '🏆'   // Celebration
  };
  return emojis[section] || '✨';
}
