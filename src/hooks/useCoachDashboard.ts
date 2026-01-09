// useCoachDashboard Hook
// Dashboard data for coaches to monitor protocol assignments

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getDashboardStats,
  getDashboardAssignments,
} from '@/services/coachProtocolV2Service';
import type {
  CoachProtocolDashboardStats,
  DashboardAssignmentWithProgress,
  DashboardFilters,
  AssignmentStatus,
} from '@/types/coach-protocol';

interface UseCoachDashboardReturn {
  stats: CoachProtocolDashboardStats | null;
  assignments: DashboardAssignmentWithProgress[];
  isLoading: boolean;
  isLoadingStats: boolean;
  error: Error | null;
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  refetch: () => Promise<void>;
  exportToCSV: () => void;
}

const DEFAULT_STATS: CoachProtocolDashboardStats = {
  total_assigned: 0,
  active: 0,
  completed: 0,
  abandoned: 0,
  expired: 0,
  avg_completion_rate: 0,
  avg_days_to_complete: 0,
};

export function useCoachDashboard(protocolId: string | null): UseCoachDashboardReturn {
  const { toast } = useToast();
  const [stats, setStats] = useState<CoachProtocolDashboardStats | null>(null);
  const [assignments, setAssignments] = useState<DashboardAssignmentWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({});

  const fetchStats = useCallback(async () => {
    if (!protocolId) {
      setStats(null);
      return;
    }

    try {
      setIsLoadingStats(true);
      const data = await getDashboardStats(protocolId);
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setStats(DEFAULT_STATS);
    } finally {
      setIsLoadingStats(false);
    }
  }, [protocolId]);

  const fetchAssignments = useCallback(async () => {
    if (!protocolId) {
      setAssignments([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let data = await getDashboardAssignments(protocolId, filters);

      // Client-side filtering for is_behind and search
      if (filters.is_behind !== undefined) {
        data = data.filter((a) => a.progress.is_behind === filters.is_behind);
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        data = data.filter(
          (a) =>
            a.user.full_name.toLowerCase().includes(search) ||
            a.user.email.toLowerCase().includes(search)
        );
      }

      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch assignments'));
      console.error('Error fetching dashboard assignments:', err);
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  }, [protocolId, filters]);

  const refetch = useCallback(async () => {
    await Promise.all([fetchStats(), fetchAssignments()]);
  }, [fetchStats, fetchAssignments]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const exportToCSV = useCallback(() => {
    if (assignments.length === 0) {
      toast({
        title: 'No Data',
        description: 'No assignments to export.',
        variant: 'default',
      });
      return;
    }

    const headers = [
      'User Name',
      'Email',
      'Status',
      'Current Week',
      'Current Day',
      'Progress %',
      'Days Completed',
      'Days Skipped',
      'Days Behind',
      'Assigned At',
      'Last Activity',
    ];

    const rows = assignments.map((a) => [
      a.user.full_name,
      a.user.email,
      a.assignment.status,
      a.assignment.current_week,
      a.assignment.current_day,
      `${Math.round(a.progress.completion_percentage)}%`,
      a.assignment.days_completed,
      a.assignment.days_skipped,
      a.progress.days_behind,
      new Date(a.assignment.assigned_at).toLocaleDateString(),
      a.last_activity ? new Date(a.last_activity).toLocaleDateString() : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `protocol-assignments-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `Exported ${assignments.length} assignment(s) to CSV.`,
    });
  }, [assignments, toast]);

  return {
    stats,
    assignments,
    isLoading,
    isLoadingStats,
    error,
    filters,
    setFilters,
    refetch,
    exportToCSV,
  };
}

// =============================================
// FILTER HELPERS
// =============================================

export const STATUS_OPTIONS: { value: AssignmentStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'abandoned', label: 'Abandoned' },
  { value: 'expired', label: 'Expired' },
];

export const BEHIND_OPTIONS = [
  { value: undefined, label: 'All' },
  { value: true, label: 'Behind Schedule' },
  { value: false, label: 'On Track' },
];

export function generateWeekOptions(totalWeeks: number) {
  return Array.from({ length: totalWeeks }, (_, i) => ({
    value: i + 1,
    label: `Week ${i + 1}`,
  }));
}
