import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TacticWithProgress, WeekSummary, JourneyPhase } from '@/types/tactic';

export function useUserProgress(userId: string) {
  return useQuery({
    queryKey: ['userProgress', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gh_user_tactic_progress')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data;
    },
    staleTime: 30000, // 30 seconds
  });
}

export function useStartTactic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, tacticId }: { userId: string; tacticId: string }) => {
      const { data, error } = await supabase
        .from('gh_user_tactic_progress')
        .upsert({
          user_id: userId,
          tactic_id: tacticId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,tactic_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      toast.success('Tactic started! 🚀');
    },
    onError: (error) => {
      console.error('Failed to start tactic:', error);
      toast.error('Failed to start tactic');
    }
  });
}

export function useCompleteTactic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      tacticId, 
      notes 
    }: { 
      userId: string; 
      tacticId: string; 
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('gh_user_tactic_progress')
        .upsert({
          user_id: userId,
          tactic_id: tacticId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes,
        }, {
          onConflict: 'user_id,tactic_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      toast.success('🎉 Tactic completed! +1 to your journey', {
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Failed to complete tactic:', error);
      toast.error('Failed to complete tactic');
    }
  });
}

export function calculateWeekProgress(
  tactics: TacticWithProgress[], 
  weekNumber: number
): WeekSummary {
  const weekTactics = tactics.filter(t => t.week_assignment === weekNumber);
  const completed = weekTactics.filter(t => t.status === 'completed').length;
  const estimatedHours = weekTactics.reduce((sum, t) => {
    const hours = parseEstimatedTime(t.estimated_time);
    return sum + hours;
  }, 0);
  
  return {
    weekNumber,
    weekTitle: getWeekTitle(weekNumber),
    phase: getPhaseForWeek(weekNumber),
    totalTactics: weekTactics.length,
    completedTactics: completed,
    estimatedHours,
    progressPercentage: weekTactics.length > 0 ? (completed / weekTactics.length) * 100 : 0,
    isUnlocked: true,
    isRecommendedStart: false,
  };
}

function parseEstimatedTime(timeStr: string | null): number {
  if (!timeStr) return 0.5; // default 30 min
  
  const match = timeStr.match(/(\d+)/);
  if (!match) return 0.5;
  
  const num = parseInt(match[1]);
  if (timeStr.includes('hour')) return num;
  if (timeStr.includes('min')) return num / 60;
  return num;
}

function getWeekTitle(weekNumber: number): string {
  const titles: Record<number, string> = {
    1: 'Foundation & Vision',
    2: 'Market Research',
    3: 'Financial Planning',
    4: 'Legal Setup',
    5: 'Licensing Process',
    6: 'Business Formation',
    7: 'Property Search',
    8: 'Creative Financing',
    9: 'Property Acquisition',
    10: 'Operations Setup',
    11: 'Marketing Launch',
    12: 'First Residents',
    13: 'Optimization',
    14: 'Scaling Preparation',
    15: 'Growth & Expansion',
  };
  return titles[weekNumber] || `Week ${weekNumber}`;
}

function getPhaseForWeek(weekNumber: number): JourneyPhase {
  if (weekNumber <= 3) return 'foundation';
  if (weekNumber <= 6) return 'market_entry';
  if (weekNumber <= 9) return 'acquisition';
  if (weekNumber <= 12) return 'operations';
  return 'growth';
}
