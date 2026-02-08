// ============================================================================
// FEAT-GH-014: Admin Programs Hook
// ============================================================================
// Hooks for admin-level program management with CRUD operations
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  AdminProgram,
  AdminProgramLearner,
  ProgramFormData,
  Phase,
  AdminLesson,
  LessonFormData,
  AdminPhaseWithLessons,
  PhaseFormData,
  AdminLessonFull,
  AdminTactic,
  TacticFormData,
  LessonContentUpdate,
  DripModel,
  DripPreviewItem,
  CalendarDripSchedule,
  RelativeDripSchedule,
  ProgressPrerequisite,
  AdminLearnerDetail,
  AdminLearnerPhaseProgress,
  AdminLearnerLessonProgress,
  EnrollmentRequest,
  EnrollmentHistoryItem,
  BulkEnrollRow,
  BulkEnrollResult,
  EnrollmentStatistics,
  // FEAT-GH-021: Library Tactics Feature
  LibraryTactic,
  TacticLibraryGroup,
  UsedTactic,
  CopyLibraryTacticData,
  CopyTacticsResult,
} from '@/types/programs';
import { addDays, parseISO, isValid, startOfDay, isAfter } from 'date-fns';

// ============================================================================
// useAdminPrograms - List all programs with stats
// ============================================================================

interface UseAdminProgramsOptions {
  filterStatus?: 'all' | 'draft' | 'published' | 'archived';
  searchQuery?: string;
}

interface UseAdminProgramsResult {
  programs: AdminProgram[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch all programs with admin stats (enrollment count, completion rate, etc.)
 */
export const useAdminPrograms = (
  options: UseAdminProgramsOptions = {}
): UseAdminProgramsResult => {
  const { filterStatus = 'all', searchQuery = '' } = options;
  const [programs, setPrograms] = useState<AdminProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrograms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query for programs
      let query = supabase
        .from('gh_programs')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          instructor_name,
          status,
          is_public,
          created_at,
          updated_at,
          total_phases,
          total_lessons
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery.trim()}%`);
      }

      const { data: programsData, error: programsError } = await query;

      if (programsError) throw programsError;

      // Fetch enrollment stats for each program
      const programIds = programsData?.map((p) => p.id) || [];

      let enrollmentStats: Record<
        string,
        { enrolled_count: number; avg_completion_percent: number }
      > = {};

      if (programIds.length > 0) {
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('gh_user_program_enrollments')
          .select('program_id, progress_percent')
          .in('program_id', programIds)
          .in('status', ['active', 'completed', 'paused']);

        if (!enrollmentsError && enrollments) {
          // Aggregate stats per program
          const statsMap: Record<
            string,
            { count: number; totalProgress: number }
          > = {};

          enrollments.forEach((e) => {
            if (!statsMap[e.program_id]) {
              statsMap[e.program_id] = { count: 0, totalProgress: 0 };
            }
            statsMap[e.program_id].count++;
            statsMap[e.program_id].totalProgress += e.progress_percent || 0;
          });

          Object.entries(statsMap).forEach(([programId, stats]) => {
            enrollmentStats[programId] = {
              enrolled_count: stats.count,
              avg_completion_percent:
                stats.count > 0
                  ? Math.round(stats.totalProgress / stats.count)
                  : 0,
            };
          });
        }
      }

      // Transform to AdminProgram
      const adminPrograms: AdminProgram[] = (programsData || []).map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        thumbnail_url: p.thumbnail_url,
        instructor_name: p.instructor_name,
        status: p.status as 'draft' | 'published' | 'archived',
        is_public: p.is_public,
        created_at: p.created_at,
        updated_at: p.updated_at,
        enrolled_count: enrollmentStats[p.id]?.enrolled_count || 0,
        avg_completion_percent:
          enrollmentStats[p.id]?.avg_completion_percent || 0,
        phase_count: p.total_phases || 0,
        lesson_count: p.total_lessons || 0,
      }));

      setPrograms(adminPrograms);
    } catch (err) {
      console.error('Error fetching admin programs:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch programs')
      );
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  return {
    programs,
    isLoading,
    error,
    refetch: fetchPrograms,
  };
};

// ============================================================================
// useAdminProgram - Single program with full details
// ============================================================================

interface UseAdminProgramResult {
  program: AdminProgram | null;
  phases: Phase[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch a single program with full details for admin dashboard
 */
export const useAdminProgram = (
  programId: string | undefined
): UseAdminProgramResult => {
  const [program, setProgram] = useState<AdminProgram | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProgram = useCallback(async () => {
    if (!programId) {
      setProgram(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch program data
      const { data: programData, error: programError } = await supabase
        .from('gh_programs')
        .select('*')
        .eq('id', programId)
        .single();

      if (programError) throw programError;

      // Fetch phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('gh_program_phases')
        .select('*')
        .eq('program_id', programId)
        .order('order_index', { ascending: true });

      if (phasesError) throw phasesError;

      // Fetch enrollment stats
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('gh_user_program_enrollments')
        .select('progress_percent')
        .eq('program_id', programId)
        .in('status', ['active', 'completed', 'paused']);

      let enrolledCount = 0;
      let avgCompletion = 0;

      if (!enrollmentsError && enrollments) {
        enrolledCount = enrollments.length;
        if (enrolledCount > 0) {
          const totalProgress = enrollments.reduce(
            (sum, e) => sum + (e.progress_percent || 0),
            0
          );
          avgCompletion = Math.round(totalProgress / enrolledCount);
        }
      }

      setProgram({
        id: programData.id,
        title: programData.title,
        description: programData.description,
        thumbnail_url: programData.thumbnail_url,
        instructor_name: programData.instructor_name,
        status: programData.status as 'draft' | 'published' | 'archived',
        is_public: programData.is_public,
        created_at: programData.created_at,
        updated_at: programData.updated_at,
        enrolled_count: enrolledCount,
        avg_completion_percent: avgCompletion,
        phase_count: programData.total_phases || phasesData?.length || 0,
        lesson_count: programData.total_lessons || 0,
      });

      setPhases(phasesData || []);
    } catch (err) {
      console.error('Error fetching admin program:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch program')
      );
    } finally {
      setIsLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  return {
    program,
    phases,
    isLoading,
    error,
    refetch: fetchProgram,
  };
};

// ============================================================================
// useCreateProgram - Create new program
// ============================================================================

interface UseCreateProgramResult {
  createProgram: (data: Partial<ProgramFormData>) => Promise<string | null>;
  isCreating: boolean;
  error: Error | null;
}

/**
 * Hook to create a new program
 */
export const useCreateProgram = (): UseCreateProgramResult => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createProgram = useCallback(
    async (data: Partial<ProgramFormData>): Promise<string | null> => {
      setIsCreating(true);
      setError(null);

      try {
        const { data: newProgram, error: createError } = await supabase
          .from('gh_programs')
          .insert({
            title: data.title || 'New Program',
            description: data.description || null,
            short_description: data.short_description || null,
            thumbnail_url: data.thumbnail_url || null,
            instructor_name: data.instructor_name || null,
            instructor_bio: data.instructor_bio || null,
            status: data.status || 'draft',
            is_public: data.is_public ?? false,
            estimated_duration_hours: data.estimated_duration_hours || null,
            total_phases: 0,
            total_lessons: 0,
            total_tactics: 0,
          })
          .select('id')
          .single();

        if (createError) throw createError;

        toast({
          title: 'Program Created',
          description: 'Your new program has been created successfully.',
        });

        return newProgram?.id || null;
      } catch (err) {
        console.error('Error creating program:', err);
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to create program';
        setError(new Error(errorMsg));
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [toast]
  );

  return {
    createProgram,
    isCreating,
    error,
  };
};

// ============================================================================
// useUpdateProgram - Update program
// ============================================================================

interface UseUpdateProgramResult {
  updateProgram: (
    programId: string,
    data: Partial<ProgramFormData>
  ) => Promise<boolean>;
  isUpdating: boolean;
  error: Error | null;
}

/**
 * Hook to update an existing program
 */
export const useUpdateProgram = (): UseUpdateProgramResult => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateProgram = useCallback(
    async (
      programId: string,
      data: Partial<ProgramFormData>
    ): Promise<boolean> => {
      setIsUpdating(true);
      setError(null);

      try {
        const updateData: Record<string, unknown> = {};

        // Only include fields that are provided
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined)
          updateData.description = data.description;
        if (data.short_description !== undefined)
          updateData.short_description = data.short_description;
        if (data.thumbnail_url !== undefined)
          updateData.thumbnail_url = data.thumbnail_url;
        if (data.instructor_name !== undefined)
          updateData.instructor_name = data.instructor_name;
        if (data.instructor_bio !== undefined)
          updateData.instructor_bio = data.instructor_bio;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.is_public !== undefined) updateData.is_public = data.is_public;
        if (data.estimated_duration_hours !== undefined)
          updateData.estimated_duration_hours = data.estimated_duration_hours;

        updateData.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('gh_programs')
          .update(updateData)
          .eq('id', programId);

        if (updateError) throw updateError;

        toast({
          title: 'Program Updated',
          description: 'Program settings have been saved.',
        });

        return true;
      } catch (err) {
        console.error('Error updating program:', err);
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to update program';
        setError(new Error(errorMsg));
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [toast]
  );

  return {
    updateProgram,
    isUpdating,
    error,
  };
};

// ============================================================================
// useDeleteProgram - Delete program
// ============================================================================

interface UseDeleteProgramResult {
  deleteProgram: (programId: string) => Promise<boolean>;
  isDeleting: boolean;
  error: Error | null;
}

/**
 * Hook to delete a program
 */
export const useDeleteProgram = (): UseDeleteProgramResult => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteProgram = useCallback(
    async (programId: string): Promise<boolean> => {
      setIsDeleting(true);
      setError(null);

      try {
        // First check if there are any enrollments
        const { data: enrollments } = await supabase
          .from('gh_user_program_enrollments')
          .select('id')
          .eq('program_id', programId)
          .limit(1);

        if (enrollments && enrollments.length > 0) {
          throw new Error(
            'Cannot delete program with active enrollments. Archive it instead.'
          );
        }

        const { error: deleteError } = await supabase
          .from('gh_programs')
          .delete()
          .eq('id', programId);

        if (deleteError) throw deleteError;

        toast({
          title: 'Program Deleted',
          description: 'The program has been permanently deleted.',
        });

        return true;
      } catch (err) {
        console.error('Error deleting program:', err);
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to delete program';
        setError(new Error(errorMsg));
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [toast]
  );

  return {
    deleteProgram,
    isDeleting,
    error,
  };
};

// ============================================================================
// useAdminProgramLearners - Fetch learners for a program
// ============================================================================

interface UseAdminProgramLearnersResult {
  learners: AdminProgramLearner[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch enrolled learners for a program with progress data
 */
export const useAdminProgramLearners = (
  programId: string | undefined
): UseAdminProgramLearnersResult => {
  const [learners, setLearners] = useState<AdminProgramLearner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLearners = useCallback(async () => {
    if (!programId) {
      setLearners([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch enrollments with user info from gh_approved_users
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('gh_user_program_enrollments')
        .select(
          `
          id,
          user_id,
          enrolled_at,
          status,
          progress_percent,
          completed_lessons,
          completed_at,
          last_activity_at
        `
        )
        .eq('program_id', programId)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      // Get user info for each enrollment
      const userIds = [...new Set(enrollments?.map((e) => e.user_id) || [])];

      let userInfoMap: Record<
        string,
        { email: string; full_name: string | null }
      > = {};

      if (userIds.length > 0) {
        // Use RPC function to bypass RLS and get user info
        const { data: allUsers, error: usersError } = await supabase.rpc(
          'gh_admin_get_all_users'
        );

        if (usersError) {
          console.warn('Failed to get user info via RPC:', usersError);
        }

        if (allUsers) {
          // Filter to only the user IDs we need and build the map
          const userIdSet = new Set(userIds);
          allUsers.forEach((u: { user_id: string; email: string; full_name: string | null }) => {
            if (u.user_id && userIdSet.has(u.user_id)) {
              userInfoMap[u.user_id] = {
                email: u.email || 'Unknown',
                full_name: u.full_name,
              };
            }
          });
        }
      }

      // Get total required lessons for the program
      const { data: programData } = await supabase
        .from('gh_programs')
        .select('total_lessons')
        .eq('id', programId)
        .single();

      const totalRequiredLessons = programData?.total_lessons || 0;

      // Transform to AdminProgramLearner
      const programLearners: AdminProgramLearner[] = (enrollments || []).map(
        (e) => ({
          user_id: e.user_id,
          email: userInfoMap[e.user_id]?.email || 'Unknown',
          full_name: userInfoMap[e.user_id]?.full_name || null,
          enrolled_at: e.enrolled_at,
          status: e.status as 'active' | 'completed' | 'paused' | 'cancelled',
          completed_at: e.completed_at,
          completed_lessons: e.completed_lessons || 0,
          total_required_lessons: totalRequiredLessons,
          completion_percent: e.progress_percent || 0,
          last_activity_at: e.last_activity_at,
        })
      );

      setLearners(programLearners);
    } catch (err) {
      console.error('Error fetching program learners:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch learners')
      );
    } finally {
      setIsLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchLearners();
  }, [fetchLearners]);

  return {
    learners,
    isLoading,
    error,
    refetch: fetchLearners,
  };
};

// ============================================================================
// useCreatePhase - Create a new phase within a program
// ============================================================================

interface UseCreatePhaseResult {
  createPhase: (
    programId: string,
    data: Partial<PhaseFormData>
  ) => Promise<string | null>;
  isCreating: boolean;
  error: Error | null;
}

/**
 * Hook to create a new phase within a program
 */
export const useCreatePhase = (): UseCreatePhaseResult => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPhase = useCallback(
    async (
      programId: string,
      data: Partial<PhaseFormData>
    ): Promise<string | null> => {
      setIsCreating(true);
      setError(null);

      try {
        // Get current max order_index for this program's phases
        const { data: existingPhases } = await supabase
          .from('gh_program_phases')
          .select('order_index')
          .eq('program_id', programId)
          .order('order_index', { ascending: false })
          .limit(1);

        const nextOrderIndex =
          existingPhases && existingPhases.length > 0
            ? existingPhases[0].order_index + 1
            : 0;

        const { data: newPhase, error: createError } = await supabase
          .from('gh_program_phases')
          .insert({
            program_id: programId,
            title: data.title || 'New Phase',
            description: data.description || null,
            short_description: data.short_description || null,
            order_index: nextOrderIndex,
            status: data.status || 'draft',
            drip_model: data.drip_model || 'inherit',
            is_required: data.is_required ?? true,
            estimated_duration_minutes: data.estimated_duration_minutes || null,
            icon_name: data.icon_name || null,
            color_class: data.color_class || null,
          })
          .select('id')
          .single();

        if (createError) throw createError;

        toast({
          title: 'Phase Created',
          description: 'Your new phase has been added to this program.',
        });

        return newPhase?.id || null;
      } catch (err) {
        console.error('Error creating phase:', err);
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to create phase';
        setError(new Error(errorMsg));
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [toast]
  );

  return {
    createPhase,
    isCreating,
    error,
  };
};

// ============================================================================
// useReorderPhases - Reorder phases within a program
// ============================================================================

interface UseReorderPhasesResult {
  reorderPhases: (
    programId: string,
    orderedPhaseIds: string[]
  ) => Promise<boolean>;
  isReordering: boolean;
}

/**
 * Hook to reorder phases within a program
 */
export const useReorderPhases = (): UseReorderPhasesResult => {
  const { toast } = useToast();
  const [isReordering, setIsReordering] = useState(false);

  const reorderPhases = useCallback(
    async (programId: string, orderedPhaseIds: string[]): Promise<boolean> => {
      setIsReordering(true);

      try {
        // Update order_index for each phase
        const updates = orderedPhaseIds.map((phaseId, index) =>
          supabase
            .from('gh_program_phases')
            .update({ order_index: index })
            .eq('id', phaseId)
            .eq('program_id', programId)
        );

        const results = await Promise.all(updates);

        // Check for errors
        const errors = results.filter((r) => r.error);
        if (errors.length > 0) {
          throw new Error('Failed to update some phases');
        }

        toast({
          title: 'Phases Reordered',
          description: 'Phase order has been updated.',
        });

        return true;
      } catch (err) {
        console.error('Error reordering phases:', err);
        toast({
          title: 'Error',
          description: 'Failed to reorder phases',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsReordering(false);
      }
    },
    [toast]
  );

  return {
    reorderPhases,
    isReordering,
  };
};

// ============================================================================
// useUpdateProgramDrip - Update drip configuration
// ============================================================================

interface UseUpdateProgramDripResult {
  updateDrip: (
    programId: string,
    dripConfig: Record<string, unknown>
  ) => Promise<boolean>;
  isUpdating: boolean;
}

/**
 * Hook to update program drip configuration
 */
export const useUpdateProgramDrip = (): UseUpdateProgramDripResult => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateDrip = useCallback(
    async (
      programId: string,
      dripConfig: Record<string, unknown>
    ): Promise<boolean> => {
      setIsUpdating(true);

      try {
        const { error } = await supabase
          .from('gh_programs')
          .update({
            settings: dripConfig,
            updated_at: new Date().toISOString(),
          })
          .eq('id', programId);

        if (error) throw error;

        toast({
          title: 'Drip Settings Updated',
          description: 'Access control settings have been saved.',
        });

        return true;
      } catch (err) {
        console.error('Error updating drip settings:', err);
        toast({
          title: 'Error',
          description: 'Failed to update drip settings',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [toast]
  );

  return {
    updateDrip,
    isUpdating,
  };
};

// ============================================================================
// FEAT-GH-015: Phase & Lesson Builder Hooks
// ============================================================================
// Hooks for phase and lesson management in the admin builder
// ============================================================================

// ============================================================================
// useAdminPhase - Single phase with lessons
// ============================================================================

interface UseAdminPhaseResult {
  phase: AdminPhaseWithLessons | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch a single phase with all its lessons
 */
export const useAdminPhase = (phaseId: string | undefined): UseAdminPhaseResult => {
  const [phase, setPhase] = useState<AdminPhaseWithLessons | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPhase = useCallback(async () => {
    if (!phaseId) {
      setPhase(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch phase data
      const { data: phaseData, error: phaseError } = await supabase
        .from('gh_program_phases')
        .select('*')
        .eq('id', phaseId)
        .single();

      if (phaseError) throw phaseError;

      // Fetch lessons for this phase
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('gh_program_lessons')
        .select('*')
        .eq('phase_id', phaseId)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Fetch tactics counts for each lesson
      const lessonIds = lessonsData?.map((l) => l.id) || [];
      let tacticsCounts: Record<string, number> = {};

      if (lessonIds.length > 0) {
        const { data: tacticsData } = await supabase
          .from('gh_lesson_tactics')
          .select('lesson_id')
          .in('lesson_id', lessonIds);

        if (tacticsData) {
          tacticsData.forEach((t) => {
            tacticsCounts[t.lesson_id] = (tacticsCounts[t.lesson_id] || 0) + 1;
          });
        }
      }

      // Transform lessons to AdminLesson format
      const lessons: AdminLesson[] = (lessonsData || []).map((l) => ({
        id: l.id,
        phase_id: l.phase_id,
        title: l.title,
        description: l.description,
        order_index: l.order_index,
        lesson_type: l.lesson_type as 'video' | 'text' | 'audio' | 'assessment',
        is_required: l.is_required,
        video_url: l.video_url,
        video_duration_seconds: l.video_duration_seconds,
        required_watch_percent: l.required_watch_percent || 80,
        has_assessment: l.has_assessment || false,
        requires_assessment_pass: l.requires_assessment_pass || false,
        status: l.status as 'draft' | 'published',
        created_at: l.created_at,
        tactics_count: tacticsCounts[l.id] || 0,
      }));

      setPhase({
        id: phaseData.id,
        program_id: phaseData.program_id,
        title: phaseData.title,
        description: phaseData.description,
        short_description: phaseData.short_description,
        order_index: phaseData.order_index,
        is_required: phaseData.is_required,
        status: phaseData.status as 'draft' | 'published',
        drip_model: phaseData.drip_model as AdminPhaseWithLessons['drip_model'],
        unlock_at: phaseData.unlock_at,
        unlock_offset_days: phaseData.unlock_offset_days,
        total_lessons: phaseData.total_lessons || lessons.length,
        total_tactics: phaseData.total_tactics || 0,
        estimated_duration_minutes: phaseData.estimated_duration_minutes,
        created_at: phaseData.created_at,
        updated_at: phaseData.updated_at,
        lessons,
      });
    } catch (err) {
      console.error('Error fetching admin phase:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch phase'));
    } finally {
      setIsLoading(false);
    }
  }, [phaseId]);

  useEffect(() => {
    fetchPhase();
  }, [fetchPhase]);

  return {
    phase,
    isLoading,
    error,
    refetch: fetchPhase,
  };
};

// ============================================================================
// useUpdatePhase - Update phase details
// ============================================================================

interface UseUpdatePhaseResult {
  updatePhase: (phaseId: string, data: Partial<PhaseFormData>) => Promise<boolean>;
  isUpdating: boolean;
  error: Error | null;
}

/**
 * Hook to update phase details
 */
export const useUpdatePhase = (): UseUpdatePhaseResult => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updatePhase = useCallback(
    async (phaseId: string, data: Partial<PhaseFormData>): Promise<boolean> => {
      setIsUpdating(true);
      setError(null);

      try {
        const updateData: Record<string, unknown> = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.short_description !== undefined) updateData.short_description = data.short_description;
        if (data.is_required !== undefined) updateData.is_required = data.is_required;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.drip_model !== undefined) updateData.drip_model = data.drip_model;
        if (data.unlock_at !== undefined) updateData.unlock_at = data.unlock_at;
        if (data.unlock_offset_days !== undefined) updateData.unlock_offset_days = data.unlock_offset_days;

        updateData.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('gh_program_phases')
          .update(updateData)
          .eq('id', phaseId);

        if (updateError) throw updateError;

        toast({
          title: 'Phase Updated',
          description: 'Phase details have been saved.',
        });

        return true;
      } catch (err) {
        console.error('Error updating phase:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to update phase';
        setError(new Error(errorMsg));
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [toast]
  );

  return {
    updatePhase,
    isUpdating,
    error,
  };
};

// ============================================================================
// useCreateLesson - Create new lesson
// ============================================================================

interface UseCreateLessonResult {
  createLesson: (phaseId: string, data: LessonFormData) => Promise<string | null>;
  isCreating: boolean;
  error: Error | null;
}

/**
 * Hook to create a new lesson within a phase
 */
export const useCreateLesson = (): UseCreateLessonResult => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createLesson = useCallback(
    async (phaseId: string, data: LessonFormData): Promise<string | null> => {
      setIsCreating(true);
      setError(null);

      try {
        // Get current max order_index for this phase
        const { data: existingLessons } = await supabase
          .from('gh_program_lessons')
          .select('order_index')
          .eq('phase_id', phaseId)
          .order('order_index', { ascending: false })
          .limit(1);

        const nextOrderIndex = existingLessons && existingLessons.length > 0
          ? existingLessons[0].order_index + 1
          : 0;

        const { data: newLesson, error: createError } = await supabase
          .from('gh_program_lessons')
          .insert({
            phase_id: phaseId,
            title: data.title,
            description: data.description || null,
            lesson_type: data.lesson_type,
            is_required: data.is_required,
            video_url: data.video_url || null,
            required_watch_percent: data.required_watch_percent ?? 80,
            has_assessment: data.has_assessment ?? false,
            requires_assessment_pass: data.requires_assessment_pass ?? false,
            status: data.status || 'draft',
            order_index: nextOrderIndex,
          })
          .select('id')
          .single();

        if (createError) throw createError;

        // Update phase total_lessons count
        await supabase.rpc('increment_phase_lesson_count', { phase_id_param: phaseId });

        toast({
          title: 'Lesson Created',
          description: 'Your new lesson has been added to this phase.',
        });

        return newLesson?.id || null;
      } catch (err) {
        console.error('Error creating lesson:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to create lesson';
        setError(new Error(errorMsg));
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [toast]
  );

  return {
    createLesson,
    isCreating,
    error,
  };
};

// ============================================================================
// useUpdateLesson - Update lesson details
// ============================================================================

interface UseUpdateLessonResult {
  updateLesson: (lessonId: string, data: Partial<LessonFormData>) => Promise<boolean>;
  isUpdating: boolean;
  error: Error | null;
}

/**
 * Hook to update an existing lesson
 */
export const useUpdateLesson = (): UseUpdateLessonResult => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateLesson = useCallback(
    async (lessonId: string, data: Partial<LessonFormData>): Promise<boolean> => {
      setIsUpdating(true);
      setError(null);

      try {
        const updateData: Record<string, unknown> = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.lesson_type !== undefined) updateData.lesson_type = data.lesson_type;
        if (data.is_required !== undefined) updateData.is_required = data.is_required;
        if (data.video_url !== undefined) updateData.video_url = data.video_url;
        if (data.required_watch_percent !== undefined) updateData.required_watch_percent = data.required_watch_percent;
        if (data.has_assessment !== undefined) updateData.has_assessment = data.has_assessment;
        if (data.requires_assessment_pass !== undefined) updateData.requires_assessment_pass = data.requires_assessment_pass;
        if (data.status !== undefined) updateData.status = data.status;

        updateData.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('gh_program_lessons')
          .update(updateData)
          .eq('id', lessonId);

        if (updateError) throw updateError;

        toast({
          title: 'Lesson Updated',
          description: 'Lesson details have been saved.',
        });

        return true;
      } catch (err) {
        console.error('Error updating lesson:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to update lesson';
        setError(new Error(errorMsg));
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [toast]
  );

  return {
    updateLesson,
    isUpdating,
    error,
  };
};

// ============================================================================
// useDeleteLesson - Delete lesson
// ============================================================================

interface UseDeleteLessonResult {
  deleteLesson: (lessonId: string, phaseId: string) => Promise<boolean>;
  isDeleting: boolean;
  error: Error | null;
}

/**
 * Hook to delete a lesson
 */
export const useDeleteLesson = (): UseDeleteLessonResult => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteLesson = useCallback(
    async (lessonId: string, phaseId: string): Promise<boolean> => {
      setIsDeleting(true);
      setError(null);

      try {
        // Check if lesson has any user progress
        const { data: progressData } = await supabase
          .from('gh_user_lesson_progress')
          .select('id')
          .eq('lesson_id', lessonId)
          .limit(1);

        if (progressData && progressData.length > 0) {
          throw new Error(
            'Cannot delete lesson with learner progress. Consider archiving instead.'
          );
        }

        // Delete related tactics first
        await supabase
          .from('gh_lesson_tactics')
          .delete()
          .eq('lesson_id', lessonId);

        // Delete the lesson
        const { error: deleteError } = await supabase
          .from('gh_program_lessons')
          .delete()
          .eq('id', lessonId);

        if (deleteError) throw deleteError;

        // Update phase total_lessons count
        await supabase.rpc('decrement_phase_lesson_count', { phase_id_param: phaseId });

        toast({
          title: 'Lesson Deleted',
          description: 'The lesson has been permanently deleted.',
        });

        return true;
      } catch (err) {
        console.error('Error deleting lesson:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete lesson';
        setError(new Error(errorMsg));
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [toast]
  );

  return {
    deleteLesson,
    isDeleting,
    error,
  };
};

// ============================================================================
// useReorderLessons - Reorder lessons within a phase
// ============================================================================

interface UseReorderLessonsResult {
  reorderLessons: (phaseId: string, orderedLessonIds: string[]) => Promise<boolean>;
  isReordering: boolean;
}

/**
 * Hook to reorder lessons within a phase
 */
export const useReorderLessons = (): UseReorderLessonsResult => {
  const { toast } = useToast();
  const [isReordering, setIsReordering] = useState(false);

  const reorderLessons = useCallback(
    async (phaseId: string, orderedLessonIds: string[]): Promise<boolean> => {
      setIsReordering(true);

      try {
        // Update order_index for each lesson
        const updates = orderedLessonIds.map((lessonId, index) =>
          supabase
            .from('gh_program_lessons')
            .update({ order_index: index })
            .eq('id', lessonId)
            .eq('phase_id', phaseId)
        );

        const results = await Promise.all(updates);

        // Check for errors
        const errors = results.filter((r) => r.error);
        if (errors.length > 0) {
          throw new Error('Failed to update some lessons');
        }

        toast({
          title: 'Lessons Reordered',
          description: 'Lesson order has been updated.',
        });

        return true;
      } catch (err) {
        console.error('Error reordering lessons:', err);
        toast({
          title: 'Error',
          description: 'Failed to reorder lessons',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsReordering(false);
      }
    },
    [toast]
  );

  return {
    reorderLessons,
    isReordering,
  };
};

// ============================================================================
// FEAT-GH-016: Lesson Editor Hooks
// ============================================================================
// Hooks for the full lesson editor with tactics management
// ============================================================================

// ============================================================================
// useAdminLesson - Single lesson with full details and tactics
// ============================================================================

interface UseAdminLessonResult {
  lesson: AdminLessonFull | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch a single lesson with all details including tactics
 */
export const useAdminLesson = (lessonId: string | undefined): UseAdminLessonResult => {
  const [lesson, setLesson] = useState<AdminLessonFull | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLesson = useCallback(async () => {
    if (!lessonId) {
      setLesson(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch lesson data
      const { data: lessonData, error: lessonError } = await supabase
        .from('gh_program_lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;

      // Fetch phase info
      const { data: phaseData, error: phaseError } = await supabase
        .from('gh_program_phases')
        .select('id, title, program_id')
        .eq('id', lessonData.phase_id)
        .single();

      if (phaseError) throw phaseError;

      // Fetch program info
      const { data: programData, error: programError } = await supabase
        .from('gh_programs')
        .select('id, title')
        .eq('id', phaseData.program_id)
        .single();

      if (programError) throw programError;

      // Fetch tactics for this lesson
      const { data: tacticsData, error: tacticsError } = await supabase
        .from('gh_lesson_tactics')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });

      if (tacticsError) throw tacticsError;

      // Transform to AdminLessonFull
      const fullLesson: AdminLessonFull = {
        id: lessonData.id,
        phase_id: lessonData.phase_id,
        title: lessonData.title,
        description: lessonData.description,
        order_index: lessonData.order_index,
        lesson_type: lessonData.lesson_type as AdminLessonFull['lesson_type'],
        is_required: lessonData.is_required,
        video_url: lessonData.video_url,
        video_provider: lessonData.video_provider as AdminLessonFull['video_provider'],
        video_duration_seconds: lessonData.video_duration_seconds,
        content_html: lessonData.content_html,
        required_watch_percent: lessonData.required_watch_percent || 80,
        has_assessment: lessonData.has_assessment || false,
        requires_assessment_pass: lessonData.requires_assessment_pass || false,
        status: lessonData.status as 'draft' | 'published',
        created_at: lessonData.created_at,
        updated_at: lessonData.updated_at,
        // Relations
        phase_title: phaseData.title,
        program_id: programData.id,
        program_title: programData.title,
        tactics: (tacticsData || []).map((t) => ({
          id: t.id,
          lesson_id: t.lesson_id,
          label: t.label,
          description: t.description,
          is_required: t.is_required,
          order_index: t.order_index,
          reference_url: t.reference_url,
          tactic_type: t.tactic_type as AdminTactic['tactic_type'],
          placeholder_text: t.placeholder_text,
          created_at: t.created_at,
          updated_at: t.updated_at,
        })),
      };

      setLesson(fullLesson);
    } catch (err) {
      console.error('Error fetching admin lesson:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch lesson'));
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  return {
    lesson,
    isLoading,
    error,
    refetch: fetchLesson,
  };
};

// ============================================================================
// useUpdateLessonContent - Update lesson content fields
// ============================================================================

interface UseUpdateLessonContentResult {
  updateLessonContent: (lessonId: string, data: LessonContentUpdate) => Promise<boolean>;
  isUpdating: boolean;
  error: Error | null;
}

/**
 * Hook to update lesson content (video, text, settings)
 */
export const useUpdateLessonContent = (): UseUpdateLessonContentResult => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateLessonContent = useCallback(
    async (lessonId: string, data: LessonContentUpdate): Promise<boolean> => {
      setIsUpdating(true);
      setError(null);

      try {
        const updateData: Record<string, unknown> = {};

        // Build update object with only provided fields
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.lesson_type !== undefined) updateData.lesson_type = data.lesson_type;
        if (data.is_required !== undefined) updateData.is_required = data.is_required;
        if (data.video_url !== undefined) updateData.video_url = data.video_url;
        if (data.video_provider !== undefined) updateData.video_provider = data.video_provider;
        if (data.video_duration_seconds !== undefined) updateData.video_duration_seconds = data.video_duration_seconds;
        if (data.content_html !== undefined) updateData.content_html = data.content_html;
        if (data.required_watch_percent !== undefined) updateData.required_watch_percent = data.required_watch_percent;
        if (data.has_assessment !== undefined) updateData.has_assessment = data.has_assessment;
        if (data.requires_assessment_pass !== undefined) updateData.requires_assessment_pass = data.requires_assessment_pass;
        if (data.status !== undefined) updateData.status = data.status;

        updateData.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('gh_program_lessons')
          .update(updateData)
          .eq('id', lessonId);

        if (updateError) throw updateError;

        return true;
      } catch (err) {
        console.error('Error updating lesson content:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to update lesson';
        setError(new Error(errorMsg));
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [toast]
  );

  return {
    updateLessonContent,
    isUpdating,
    error,
  };
};

// ============================================================================
// useLessonTacticsAdmin - Get tactics for a lesson (admin view)
// ============================================================================

interface UseLessonTacticsAdminResult {
  tactics: AdminTactic[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch all tactics for a lesson
 */
export const useLessonTacticsAdmin = (lessonId: string | undefined): UseLessonTacticsAdminResult => {
  const [tactics, setTactics] = useState<AdminTactic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTactics = useCallback(async () => {
    if (!lessonId) {
      setTactics([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: tacticsData, error: tacticsError } = await supabase
        .from('gh_lesson_tactics')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });

      if (tacticsError) throw tacticsError;

      const formattedTactics: AdminTactic[] = (tacticsData || []).map((t) => ({
        id: t.id,
        lesson_id: t.lesson_id,
        label: t.label,
        description: t.description,
        is_required: t.is_required,
        order_index: t.order_index,
        reference_url: t.reference_url,
        tactic_type: t.tactic_type as AdminTactic['tactic_type'],
        placeholder_text: t.placeholder_text,
        created_at: t.created_at,
        updated_at: t.updated_at,
      }));

      setTactics(formattedTactics);
    } catch (err) {
      console.error('Error fetching tactics:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch tactics'));
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchTactics();
  }, [fetchTactics]);

  return {
    tactics,
    isLoading,
    error,
    refetch: fetchTactics,
  };
};

// ============================================================================
// useCreateTactic - Create a new tactic
// ============================================================================

interface UseCreateTacticResult {
  createTactic: (lessonId: string, data: TacticFormData) => Promise<string | null>;
  isCreating: boolean;
  error: Error | null;
}

/**
 * Hook to create a new tactic for a lesson
 */
export const useCreateTactic = (): UseCreateTacticResult => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createTactic = useCallback(
    async (lessonId: string, data: TacticFormData): Promise<string | null> => {
      setIsCreating(true);
      setError(null);

      try {
        // Get current max order_index for this lesson
        const { data: existingTactics } = await supabase
          .from('gh_lesson_tactics')
          .select('order_index')
          .eq('lesson_id', lessonId)
          .order('order_index', { ascending: false })
          .limit(1);

        const nextOrderIndex = existingTactics && existingTactics.length > 0
          ? existingTactics[0].order_index + 1
          : 0;

        const { data: newTactic, error: createError } = await supabase
          .from('gh_lesson_tactics')
          .insert({
            lesson_id: lessonId,
            label: data.label,
            description: data.description || null,
            is_required: data.is_required,
            order_index: nextOrderIndex,
            reference_url: data.reference_url || null,
            tactic_type: data.tactic_type || 'checkbox',
            placeholder_text: data.placeholder_text || null,
          })
          .select('id')
          .single();

        if (createError) throw createError;

        // Update lesson tactics count
        await supabase.rpc('increment_lesson_tactics_count', { lesson_id_param: lessonId });

        toast({
          title: 'Tactic Created',
          description: 'New tactic has been added to this lesson.',
        });

        return newTactic?.id || null;
      } catch (err) {
        console.error('Error creating tactic:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to create tactic';
        setError(new Error(errorMsg));
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [toast]
  );

  return {
    createTactic,
    isCreating,
    error,
  };
};

// ============================================================================
// useUpdateTactic - Update an existing tactic
// ============================================================================

interface UseUpdateTacticResult {
  updateTactic: (tacticId: string, data: Partial<TacticFormData>) => Promise<boolean>;
  isUpdating: boolean;
  error: Error | null;
}

/**
 * Hook to update an existing tactic
 */
export const useUpdateTactic = (): UseUpdateTacticResult => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateTactic = useCallback(
    async (tacticId: string, data: Partial<TacticFormData>): Promise<boolean> => {
      setIsUpdating(true);
      setError(null);

      try {
        const updateData: Record<string, unknown> = {};

        if (data.label !== undefined) updateData.label = data.label;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.is_required !== undefined) updateData.is_required = data.is_required;
        if (data.reference_url !== undefined) updateData.reference_url = data.reference_url;
        if (data.tactic_type !== undefined) updateData.tactic_type = data.tactic_type;
        if (data.placeholder_text !== undefined) updateData.placeholder_text = data.placeholder_text;

        updateData.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('gh_lesson_tactics')
          .update(updateData)
          .eq('id', tacticId);

        if (updateError) throw updateError;

        toast({
          title: 'Tactic Updated',
          description: 'Tactic has been saved.',
        });

        return true;
      } catch (err) {
        console.error('Error updating tactic:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to update tactic';
        setError(new Error(errorMsg));
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [toast]
  );

  return {
    updateTactic,
    isUpdating,
    error,
  };
};

// ============================================================================
// useDeleteTactic - Delete a tactic
// ============================================================================

interface UseDeleteTacticResult {
  deleteTactic: (tacticId: string, lessonId: string) => Promise<boolean>;
  isDeleting: boolean;
  error: Error | null;
}

/**
 * Hook to delete a tactic
 */
export const useDeleteTactic = (): UseDeleteTacticResult => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteTactic = useCallback(
    async (tacticId: string, lessonId: string): Promise<boolean> => {
      setIsDeleting(true);
      setError(null);

      try {
        // Check if tactic has any completions
        const { data: completions } = await supabase
          .from('gh_user_tactic_completions')
          .select('id')
          .eq('tactic_id', tacticId)
          .limit(1);

        if (completions && completions.length > 0) {
          throw new Error('Cannot delete tactic with learner completions.');
        }

        const { error: deleteError } = await supabase
          .from('gh_lesson_tactics')
          .delete()
          .eq('id', tacticId);

        if (deleteError) throw deleteError;

        // Update lesson tactics count
        await supabase.rpc('decrement_lesson_tactics_count', { lesson_id_param: lessonId });

        toast({
          title: 'Tactic Deleted',
          description: 'The tactic has been removed.',
        });

        return true;
      } catch (err) {
        console.error('Error deleting tactic:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete tactic';
        setError(new Error(errorMsg));
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [toast]
  );

  return {
    deleteTactic,
    isDeleting,
    error,
  };
};

// ============================================================================
// useReorderTactics - Reorder tactics within a lesson
// ============================================================================

interface UseReorderTacticsResult {
  reorderTactics: (lessonId: string, orderedTacticIds: string[]) => Promise<boolean>;
  isReordering: boolean;
}

/**
 * Hook to reorder tactics within a lesson
 */
export const useReorderTactics = (): UseReorderTacticsResult => {
  const { toast } = useToast();
  const [isReordering, setIsReordering] = useState(false);

  const reorderTactics = useCallback(
    async (lessonId: string, orderedTacticIds: string[]): Promise<boolean> => {
      setIsReordering(true);

      try {
        // Update order_index for each tactic
        const updates = orderedTacticIds.map((tacticId, index) =>
          supabase
            .from('gh_lesson_tactics')
            .update({ order_index: index })
            .eq('id', tacticId)
            .eq('lesson_id', lessonId)
        );

        const results = await Promise.all(updates);

        // Check for errors
        const errors = results.filter((r) => r.error);
        if (errors.length > 0) {
          throw new Error('Failed to update some tactics');
        }

        toast({
          title: 'Tactics Reordered',
          description: 'Tactic order has been updated.',
        });

        return true;
      } catch (err) {
        console.error('Error reordering tactics:', err);
        toast({
          title: 'Error',
          description: 'Failed to reorder tactics',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsReordering(false);
      }
    },
    [toast]
  );

  return {
    reorderTactics,
    isReordering,
  };
};

// ============================================================================
// FEAT-GH-017: Drip Configuration Hooks
// ============================================================================
// Hooks for managing phase and lesson drip settings
// ============================================================================

// ============================================================================
// useUpdatePhaseDrip - Update individual phase drip settings
// ============================================================================

interface UseUpdatePhaseDripResult {
  updatePhaseDrip: (
    phaseId: string,
    dripSettings: {
      drip_model?: 'inherit' | 'calendar' | 'relative' | 'progress' | 'hybrid';
      unlock_at?: string | null;
      unlock_offset_days?: number | null;
      prerequisite_phase_id?: string | null;
    }
  ) => Promise<boolean>;
  isUpdating: boolean;
}

/**
 * Hook to update individual phase drip settings
 */
export const useUpdatePhaseDrip = (): UseUpdatePhaseDripResult => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePhaseDrip = useCallback(
    async (
      phaseId: string,
      dripSettings: {
        drip_model?: 'inherit' | 'calendar' | 'relative' | 'progress' | 'hybrid';
        unlock_at?: string | null;
        unlock_offset_days?: number | null;
        prerequisite_phase_id?: string | null;
      }
    ): Promise<boolean> => {
      setIsUpdating(true);

      try {
        const updateData: Record<string, unknown> = {};

        if (dripSettings.drip_model !== undefined) {
          updateData.drip_model = dripSettings.drip_model;
        }
        if (dripSettings.unlock_at !== undefined) {
          updateData.unlock_at = dripSettings.unlock_at;
        }
        if (dripSettings.unlock_offset_days !== undefined) {
          updateData.unlock_offset_days = dripSettings.unlock_offset_days;
        }
        if (dripSettings.prerequisite_phase_id !== undefined) {
          updateData.prerequisite_phase_id = dripSettings.prerequisite_phase_id;
        }

        updateData.updated_at = new Date().toISOString();

        const { error } = await supabase
          .from('gh_program_phases')
          .update(updateData)
          .eq('id', phaseId);

        if (error) throw error;

        return true;
      } catch (err) {
        console.error('Error updating phase drip settings:', err);
        toast({
          title: 'Error',
          description: 'Failed to update phase drip settings',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [toast]
  );

  return {
    updatePhaseDrip,
    isUpdating,
  };
};

// ============================================================================
// useBatchUpdatePhaseDrip - Update multiple phases drip settings at once
// ============================================================================

interface UseBatchUpdatePhaseDripResult {
  batchUpdatePhaseDrip: (
    updates: Array<{
      phase_id: string;
      drip_model?: 'inherit' | 'calendar' | 'relative' | 'progress' | 'hybrid';
      unlock_at?: string | null;
      unlock_offset_days?: number | null;
      prerequisite_phase_id?: string | null;
    }>
  ) => Promise<boolean>;
  isUpdating: boolean;
}

/**
 * Hook to batch update multiple phases drip settings
 */
export const useBatchUpdatePhaseDrip = (): UseBatchUpdatePhaseDripResult => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const batchUpdatePhaseDrip = useCallback(
    async (
      updates: Array<{
        phase_id: string;
        drip_model?: 'inherit' | 'calendar' | 'relative' | 'progress' | 'hybrid';
        unlock_at?: string | null;
        unlock_offset_days?: number | null;
        prerequisite_phase_id?: string | null;
      }>
    ): Promise<boolean> => {
      setIsUpdating(true);

      try {
        const updatePromises = updates.map((update) => {
          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };

          if (update.drip_model !== undefined) {
            updateData.drip_model = update.drip_model;
          }
          if (update.unlock_at !== undefined) {
            updateData.unlock_at = update.unlock_at;
          }
          if (update.unlock_offset_days !== undefined) {
            updateData.unlock_offset_days = update.unlock_offset_days;
          }
          if (update.prerequisite_phase_id !== undefined) {
            updateData.prerequisite_phase_id = update.prerequisite_phase_id;
          }

          return supabase
            .from('gh_program_phases')
            .update(updateData)
            .eq('id', update.phase_id);
        });

        const results = await Promise.all(updatePromises);
        const errors = results.filter((r) => r.error);

        if (errors.length > 0) {
          throw new Error(`Failed to update ${errors.length} phase(s)`);
        }

        return true;
      } catch (err) {
        console.error('Error batch updating phase drip settings:', err);
        toast({
          title: 'Error',
          description: 'Failed to update phase drip settings',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [toast]
  );

  return {
    batchUpdatePhaseDrip,
    isUpdating,
  };
};

// ============================================================================
// useDripPreview - Get preview of unlock schedule for a program
// ============================================================================

interface UseDripPreviewResult {
  previewItems: DripPreviewItem[];
  isLoading: boolean;
  error: Error | null;
  generatePreview: (enrollmentDate: Date) => DripPreviewItem[];
}

/**
 * Hook to generate drip preview for a program
 */
export const useDripPreview = (
  phases: Phase[],
  dripModel: DripModel,
  calendarSchedule: CalendarDripSchedule[],
  relativeSchedule: RelativeDripSchedule[],
  prerequisites: ProgressPrerequisite[],
  requirePreviousCompletion: boolean
): UseDripPreviewResult => {
  const [previewItems, setPreviewItems] = useState<DripPreviewItem[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  const generatePreview = useCallback(
    (enrollmentDate: Date): DripPreviewItem[] => {
      const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index);
      const today = startOfDay(new Date());

      const items: DripPreviewItem[] = sortedPhases.map((phase, index) => {
        const isFirstPhase = index === 0;

        // First phase is always unlocked
        if (isFirstPhase) {
          return {
            phase_id: phase.id,
            phase_title: phase.title,
            phase_order: index + 1,
            unlock_date: enrollmentDate,
            unlock_reason: 'Available immediately upon enrollment',
            is_unlocked: true,
          };
        }

        let unlockDate: Date | null = null;
        let unlockReason = '';
        let dependsOn: string | undefined;

        switch (dripModel) {
          case 'calendar': {
            const scheduleItem = calendarSchedule.find((s) => s.phase_id === phase.id);
            if (scheduleItem?.unlock_at) {
              const parsedDate = parseISO(scheduleItem.unlock_at);
              if (isValid(parsedDate)) {
                unlockDate = parsedDate;
                unlockReason = `Unlocks on specific date`;
              }
            }
            if (!unlockDate) {
              unlockReason = 'No unlock date set';
            }
            break;
          }

          case 'relative': {
            const scheduleItem = relativeSchedule.find((s) => s.phase_id === phase.id);
            const offsetDays = scheduleItem?.offset_days ?? 0;
            unlockDate = addDays(startOfDay(enrollmentDate), offsetDays);
            unlockReason = offsetDays === 0
              ? 'Unlocks immediately'
              : `Unlocks ${offsetDays} day${offsetDays !== 1 ? 's' : ''} after enrollment`;
            break;
          }

          case 'progress': {
            if (requirePreviousCompletion) {
              const previousPhase = sortedPhases[index - 1];
              dependsOn = previousPhase?.title;
              unlockReason = `Requires completion of previous phase`;
            } else {
              const prereq = prerequisites.find((p) => p.phase_id === phase.id);
              if (prereq) {
                const prereqPhase = phases.find((p) => p.id === prereq.prerequisite_phase_id);
                dependsOn = prereqPhase?.title;
                unlockReason = `Requires completion of prerequisite`;
              } else {
                unlockReason = 'No prerequisite set';
              }
            }
            break;
          }

          case 'hybrid': {
            const relativeItem = relativeSchedule.find((s) => s.phase_id === phase.id);
            const offsetDays = relativeItem?.offset_days ?? 0;
            unlockDate = addDays(startOfDay(enrollmentDate), offsetDays);

            if (requirePreviousCompletion) {
              const previousPhase = sortedPhases[index - 1];
              dependsOn = previousPhase?.title;
              unlockReason = `Time delay + requires previous phase`;
            } else {
              unlockReason = `Unlocks ${offsetDays} day${offsetDays !== 1 ? 's' : ''} after enrollment`;
            }
            break;
          }

          default:
            unlockReason = 'Inherits program settings';
        }

        const isUnlocked = unlockDate ? !isAfter(startOfDay(unlockDate), today) : false;

        return {
          phase_id: phase.id,
          phase_title: phase.title,
          phase_order: index + 1,
          unlock_date: unlockDate,
          unlock_reason: unlockReason,
          is_unlocked: isUnlocked,
          depends_on: dependsOn,
        };
      });

      setPreviewItems(items);
      return items;
    },
    [phases, dripModel, calendarSchedule, relativeSchedule, prerequisites, requirePreviousCompletion]
  );

  return {
    previewItems,
    isLoading,
    error,
    generatePreview,
  };
};

// ============================================================================
// FEAT-GH-018: Admin Learner Progress Drill-down Hooks
// ============================================================================
// Hooks for individual learner progress views
// ============================================================================

// ============================================================================
// useAdminLearnerDetail - Full learner progress for a program
// ============================================================================

interface UseAdminLearnerDetailResult {
  learner: AdminLearnerDetail | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch detailed learner progress including all phases
 */
export const useAdminLearnerDetail = (
  programId: string | undefined,
  userId: string | undefined
): UseAdminLearnerDetailResult => {
  const [learner, setLearner] = useState<AdminLearnerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLearnerDetail = useCallback(async () => {
    if (!programId || !userId) {
      setLearner(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch enrollment data
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('gh_user_program_enrollments')
        .select(`
          id,
          user_id,
          enrolled_at,
          status,
          progress_percent,
          completed_lessons,
          completed_at,
          last_activity_at
        `)
        .eq('program_id', programId)
        .eq('user_id', userId)
        .single();

      if (enrollmentError) throw enrollmentError;

      // Fetch user info
      const { data: userInfo } = await supabase
        .from('gh_approved_users')
        .select('email, full_name, avatar_url')
        .eq('user_id', userId)
        .single();

      // Fetch program total lessons
      const { data: programData } = await supabase
        .from('gh_programs')
        .select('total_lessons')
        .eq('id', programId)
        .single();

      // Fetch all phases for the program
      const { data: phases, error: phasesError } = await supabase
        .from('gh_program_phases')
        .select('id, title, order_index, total_lessons')
        .eq('program_id', programId)
        .order('order_index', { ascending: true });

      if (phasesError) throw phasesError;

      // Fetch phase progress for this user
      const phaseIds = phases?.map(p => p.id) || [];
      let phaseProgress: Record<string, {
        status: string;
        completed_lessons: number;
        started_at: string | null;
        completed_at: string | null;
      }> = {};

      if (phaseIds.length > 0) {
        const { data: progressData } = await supabase
          .from('gh_user_phase_progress')
          .select('phase_id, status, completed_lessons, started_at, completed_at')
          .eq('user_id', userId)
          .in('phase_id', phaseIds);

        if (progressData) {
          progressData.forEach(p => {
            phaseProgress[p.phase_id] = {
              status: p.status,
              completed_lessons: p.completed_lessons || 0,
              started_at: p.started_at,
              completed_at: p.completed_at,
            };
          });
        }
      }

      // Check for stuck lessons
      const { data: stuckLessons } = await supabase
        .from('gh_user_lesson_progress')
        .select('lesson_id, stuck_detected_at')
        .eq('user_id', userId)
        .eq('status', 'stuck')
        .not('stuck_detected_at', 'is', null)
        .order('stuck_detected_at', { ascending: true })
        .limit(1);

      const isStuck = stuckLessons && stuckLessons.length > 0;
      const stuckLesson = stuckLessons?.[0];

      // Build phase progress array
      const phasesWithProgress: AdminLearnerPhaseProgress[] = (phases || []).map(phase => {
        const progress = phaseProgress[phase.id];
        return {
          phase_id: phase.id,
          phase_title: phase.title,
          order_index: phase.order_index,
          status: (progress?.status || 'locked') as AdminLearnerPhaseProgress['status'],
          completed_lessons: progress?.completed_lessons || 0,
          total_lessons: phase.total_lessons || 0,
          started_at: progress?.started_at || null,
          completed_at: progress?.completed_at || null,
        };
      });

      const learnerDetail: AdminLearnerDetail = {
        user_id: enrollment.user_id,
        email: userInfo?.email || 'Unknown',
        full_name: userInfo?.full_name || null,
        avatar_url: userInfo?.avatar_url || null,
        enrolled_at: enrollment.enrolled_at,
        status: enrollment.status as AdminLearnerDetail['status'],
        completed_at: enrollment.completed_at,
        last_activity_at: enrollment.last_activity_at,
        completed_lessons: enrollment.completed_lessons || 0,
        total_required_lessons: programData?.total_lessons || 0,
        completion_percent: enrollment.progress_percent || 0,
        phases: phasesWithProgress,
        is_stuck: isStuck,
        stuck_since: stuckLesson?.stuck_detected_at || null,
        stuck_lesson_id: stuckLesson?.lesson_id || null,
      };

      setLearner(learnerDetail);
    } catch (err) {
      console.error('Error fetching learner detail:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch learner detail'));
    } finally {
      setIsLoading(false);
    }
  }, [programId, userId]);

  useEffect(() => {
    fetchLearnerDetail();
  }, [fetchLearnerDetail]);

  return {
    learner,
    isLoading,
    error,
    refetch: fetchLearnerDetail,
  };
};

// ============================================================================
// useLearnerLessonProgress - Per-lesson breakdown for a learner
// ============================================================================

interface UseLearnerLessonProgressResult {
  lessons: AdminLearnerLessonProgress[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch per-lesson progress for a learner in a program
 */
export const useLearnerLessonProgress = (
  programId: string | undefined,
  userId: string | undefined
): UseLearnerLessonProgressResult => {
  const [lessons, setLessons] = useState<AdminLearnerLessonProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLessonProgress = useCallback(async () => {
    if (!programId || !userId) {
      setLessons([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all phases and lessons for the program
      const { data: phases, error: phasesError } = await supabase
        .from('gh_program_phases')
        .select('id, title, order_index')
        .eq('program_id', programId)
        .order('order_index', { ascending: true });

      if (phasesError) throw phasesError;

      const phaseIds = phases?.map(p => p.id) || [];
      if (phaseIds.length === 0) {
        setLessons([]);
        setIsLoading(false);
        return;
      }

      // Fetch all lessons for these phases
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('gh_program_lessons')
        .select('id, phase_id, title, order_index, total_required_tactics')
        .in('phase_id', phaseIds)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;

      const lessonIds = lessonsData?.map(l => l.id) || [];
      if (lessonIds.length === 0) {
        setLessons([]);
        setIsLoading(false);
        return;
      }

      // Fetch user progress for all lessons
      const { data: progressData, error: progressError } = await supabase
        .from('gh_user_lesson_progress')
        .select(`
          lesson_id,
          status,
          video_watched_percent,
          tactics_completed_count,
          tactics_required_count,
          assessment_status,
          assessment_score,
          started_at,
          completed_at,
          last_activity_at
        `)
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);

      if (progressError) throw progressError;

      // Build a map of progress by lesson_id
      const progressMap: Record<string, typeof progressData[0]> = {};
      (progressData || []).forEach(p => {
        progressMap[p.lesson_id] = p;
      });

      // Build phase title map
      const phaseTitleMap: Record<string, string> = {};
      (phases || []).forEach(p => {
        phaseTitleMap[p.id] = p.title;
      });

      // Transform to AdminLearnerLessonProgress
      const lessonProgressList: AdminLearnerLessonProgress[] = (lessonsData || []).map(lesson => {
        const progress = progressMap[lesson.id];
        return {
          lesson_id: lesson.id,
          lesson_title: lesson.title,
          phase_id: lesson.phase_id,
          phase_title: phaseTitleMap[lesson.phase_id] || 'Unknown Phase',
          order_index: lesson.order_index,
          status: (progress?.status || 'locked') as AdminLearnerLessonProgress['status'],
          video_watched_percent: progress?.video_watched_percent || 0,
          tactics_completed: progress?.tactics_completed_count || 0,
          tactics_required: progress?.tactics_required_count || lesson.total_required_tactics || 0,
          assessment_status: progress?.assessment_status || null,
          assessment_score: progress?.assessment_score || null,
          started_at: progress?.started_at || null,
          completed_at: progress?.completed_at || null,
          last_activity_at: progress?.last_activity_at || null,
        };
      });

      setLessons(lessonProgressList);
    } catch (err) {
      console.error('Error fetching lesson progress:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch lesson progress'));
    } finally {
      setIsLoading(false);
    }
  }, [programId, userId]);

  useEffect(() => {
    fetchLessonProgress();
  }, [fetchLessonProgress]);

  return {
    lessons,
    isLoading,
    error,
    refetch: fetchLessonProgress,
  };
};

// ============================================================================
// useSendLearnerNudge - Send a nudge to a learner
// ============================================================================

interface UseSendLearnerNudgeResult {
  sendNudge: (userId: string, lessonId?: string, message?: string) => Promise<boolean>;
  isSending: boolean;
  error: Error | null;
}

/**
 * Hook to send a nudge notification to a learner
 */
export const useSendLearnerNudge = (): UseSendLearnerNudgeResult => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendNudge = useCallback(
    async (userId: string, lessonId?: string, message?: string): Promise<boolean> => {
      setIsSending(true);
      setError(null);

      try {
        // Update nudge count and timestamp if lesson is specified
        if (lessonId) {
          const { error: updateError } = await supabase
            .from('gh_user_lesson_progress')
            .update({
              stuck_nudge_count: supabase.rpc('increment_stuck_nudge_count'),
              stuck_last_nudge_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('lesson_id', lessonId);

          if (updateError) {
            console.warn('Could not update nudge count:', updateError);
          }
        }

        // TODO: Integrate with notification system (N8n/GoHighLevel)
        // For now, just log and show success toast
        console.log('Nudge sent to user:', userId, 'lesson:', lessonId, 'message:', message);

        toast({
          title: 'Nudge Sent',
          description: 'The learner has been notified.',
        });

        return true;
      } catch (err) {
        console.error('Error sending nudge:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to send nudge';
        setError(new Error(errorMsg));
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [toast]
  );

  return {
    sendNudge,
    isSending,
    error,
  };
};

// ============================================================================
// useClearStuckStatus - Clear stuck flag for a learner
// ============================================================================

interface UseClearStuckStatusResult {
  clearStuck: (userId: string, lessonId: string) => Promise<boolean>;
  isClearing: boolean;
  error: Error | null;
}

/**
 * Hook to clear the stuck status for a learner on a specific lesson
 */
export const useClearStuckStatus = (): UseClearStuckStatusResult => {
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clearStuck = useCallback(
    async (userId: string, lessonId: string): Promise<boolean> => {
      setIsClearing(true);
      setError(null);

      try {
        const { error: updateError } = await supabase
          .from('gh_user_lesson_progress')
          .update({
            status: 'in_progress',
            stuck_detected_at: null,
            stuck_reason: null,
          })
          .eq('user_id', userId)
          .eq('lesson_id', lessonId);

        if (updateError) throw updateError;

        toast({
          title: 'Stuck Status Cleared',
          description: 'The learner has been marked as in progress.',
        });

        return true;
      } catch (err) {
        console.error('Error clearing stuck status:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to clear stuck status';
        setError(new Error(errorMsg));
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsClearing(false);
      }
    },
    [toast]
  );

  return {
    clearStuck,
    isClearing,
    error,
  };
};

// ============================================================================
// FEAT-GH-019: Enrollment System Hooks
// ============================================================================
// Hooks for enrolling learners manually, via bulk import, and tracking history
// ============================================================================

// ============================================================================
// useEnrollLearner - Enroll single learner
// ============================================================================

interface UseEnrollLearnerResult {
  enrollLearner: (request: EnrollmentRequest) => Promise<boolean>;
  isEnrolling: boolean;
}

/**
 * Hook to enroll a single learner in a program
 */
export const useEnrollLearner = (): UseEnrollLearnerResult => {
  const { toast } = useToast();
  const [isEnrolling, setIsEnrolling] = useState(false);

  const enrollLearner = useCallback(
    async (request: EnrollmentRequest): Promise<boolean> => {
      setIsEnrolling(true);

      try {
        // Get current user for enrolled_by
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        let targetUserId = request.user_id;

        // If enrolling by email, find or create user
        if (!targetUserId && request.email) {
          // First try to find existing user by email
          const { data: existingUser, error: lookupError } = await supabase
            .from('gh_approved_users')
            .select('user_id')
            .eq('email', request.email.toLowerCase())
            .eq('is_active', true)
            .maybeSingle();

          if (lookupError) {
            console.error('Error looking up user:', lookupError);
          }

          if (existingUser?.user_id) {
            targetUserId = existingUser.user_id;
          } else {
            // User doesn't exist - for now, we'll create a pending enrollment
            // In a real implementation, you'd send an invitation
            toast({
              title: 'User Not Found',
              description: `No user found with email "${request.email}". They will need to create an account first.`,
              variant: 'destructive',
            });
            return false;
          }
        }

        if (!targetUserId) {
          toast({
            title: 'Error',
            description: 'No user specified for enrollment',
            variant: 'destructive',
          });
          return false;
        }

        // Check if already enrolled
        const { data: existingEnrollment, error: checkError } = await supabase
          .from('gh_user_program_enrollments')
          .select('id, status')
          .eq('user_id', targetUserId)
          .eq('program_id', request.program_id)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingEnrollment) {
          if (existingEnrollment.status === 'cancelled') {
            // Reactivate cancelled enrollment
            const { error: updateError } = await supabase
              .from('gh_user_program_enrollments')
              .update({
                status: 'active',
                enrolled_by: user.id,
                notes: request.notes,
              })
              .eq('id', existingEnrollment.id);

            if (updateError) throw updateError;

            toast({
              title: 'Enrollment Reactivated',
              description: 'The learner has been re-enrolled in the program.',
            });
            return true;
          }

          toast({
            title: 'Already Enrolled',
            description: 'This learner is already enrolled in the program.',
            variant: 'destructive',
          });
          return false;
        }

        // Create new enrollment
        const { error: insertError } = await supabase
          .from('gh_user_program_enrollments')
          .insert({
            user_id: targetUserId,
            program_id: request.program_id,
            enrollment_source: request.enrollment_source,
            enrolled_by: user.id,
            notes: request.notes,
            status: 'active',
          });

        if (insertError) throw insertError;

        toast({
          title: 'Learner Enrolled',
          description: 'The learner has been successfully enrolled in the program.',
        });

        return true;
      } catch (err) {
        console.error('Error enrolling learner:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to enroll learner';
        toast({
          title: 'Enrollment Failed',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsEnrolling(false);
      }
    },
    [toast]
  );

  return {
    enrollLearner,
    isEnrolling,
  };
};

// ============================================================================
// useBulkEnrollLearners - Bulk enrollment from CSV
// ============================================================================

interface UseBulkEnrollLearnersResult {
  bulkEnroll: (programId: string, rows: BulkEnrollRow[]) => Promise<BulkEnrollResult>;
  isEnrolling: boolean;
  progress: number;
}

/**
 * Hook to bulk enroll learners from CSV data
 */
export const useBulkEnrollLearners = (): UseBulkEnrollLearnersResult => {
  const { toast } = useToast();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [progress, setProgress] = useState(0);

  const bulkEnroll = useCallback(
    async (programId: string, rows: BulkEnrollRow[]): Promise<BulkEnrollResult> => {
      setIsEnrolling(true);
      setProgress(0);

      const result: BulkEnrollResult = {
        success_count: 0,
        failed_count: 0,
        failures: [],
      };

      try {
        // Get current user for enrolled_by
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Process in batches of 10 for progress tracking
        const batchSize = 10;
        const totalBatches = Math.ceil(rows.length / batchSize);

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const batch = rows.slice(
            batchIndex * batchSize,
            (batchIndex + 1) * batchSize
          );

          // Process each row in the batch
          await Promise.all(
            batch.map(async (row) => {
              try {
                // Find user by email
                const { data: existingUser, error: lookupError } = await supabase
                  .from('gh_approved_users')
                  .select('user_id')
                  .eq('email', row.email.toLowerCase())
                  .eq('is_active', true)
                  .maybeSingle();

                if (lookupError) {
                  throw new Error('User lookup failed');
                }

                if (!existingUser?.user_id) {
                  result.failures.push({
                    email: row.email,
                    reason: 'User not found',
                  });
                  result.failed_count++;
                  return;
                }

                // Check if already enrolled
                const { data: existingEnrollment } = await supabase
                  .from('gh_user_program_enrollments')
                  .select('id, status')
                  .eq('user_id', existingUser.user_id)
                  .eq('program_id', programId)
                  .maybeSingle();

                if (existingEnrollment && existingEnrollment.status !== 'cancelled') {
                  result.failures.push({
                    email: row.email,
                    reason: 'Already enrolled',
                  });
                  result.failed_count++;
                  return;
                }

                if (existingEnrollment?.status === 'cancelled') {
                  // Reactivate
                  await supabase
                    .from('gh_user_program_enrollments')
                    .update({
                      status: 'active',
                      enrolled_by: user.id,
                    })
                    .eq('id', existingEnrollment.id);
                } else {
                  // Create new enrollment
                  await supabase.from('gh_user_program_enrollments').insert({
                    user_id: existingUser.user_id,
                    program_id: programId,
                    enrollment_source: 'import',
                    enrolled_by: user.id,
                    status: 'active',
                  });
                }

                result.success_count++;
              } catch (err) {
                result.failures.push({
                  email: row.email,
                  reason: err instanceof Error ? err.message : 'Unknown error',
                });
                result.failed_count++;
              }
            })
          );

          // Update progress
          const newProgress = Math.round(((batchIndex + 1) / totalBatches) * 100);
          setProgress(newProgress);
        }

        toast({
          title: 'Bulk Enrollment Complete',
          description: `Successfully enrolled ${result.success_count} learners. ${result.failed_count} failed.`,
        });

        return result;
      } catch (err) {
        console.error('Error during bulk enrollment:', err);
        toast({
          title: 'Bulk Enrollment Failed',
          description: err instanceof Error ? err.message : 'An error occurred',
          variant: 'destructive',
        });
        return result;
      } finally {
        setIsEnrolling(false);
      }
    },
    [toast]
  );

  return {
    bulkEnroll,
    isEnrolling,
    progress,
  };
};

// ============================================================================
// useEnrollmentHistory - Get enrollment history for a program
// ============================================================================

interface UseEnrollmentHistoryResult {
  history: EnrollmentHistoryItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch enrollment history for a program
 */
export const useEnrollmentHistory = (
  programId: string
): UseEnrollmentHistoryResult => {
  const [history, setHistory] = useState<EnrollmentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!programId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch enrollments with user and program data
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('gh_user_program_enrollments')
        .select(`
          id,
          program_id,
          user_id,
          enrolled_at,
          enrollment_source,
          enrolled_by,
          purchase_id,
          status,
          notes
        `)
        .eq('program_id', programId)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      if (!enrollments || enrollments.length === 0) {
        setHistory([]);
        return;
      }

      // Get user IDs to fetch user details
      const userIds = enrollments.map((e) => e.user_id);
      const enrollerIds = enrollments
        .map((e) => e.enrolled_by)
        .filter((id): id is string => id !== null);

      // Fetch user details
      const { data: users, error: usersError } = await supabase
        .from('gh_approved_users')
        .select('user_id, email, full_name')
        .in('user_id', [...new Set([...userIds, ...enrollerIds])]);

      if (usersError) throw usersError;

      // Fetch program title
      const { data: program, error: programError } = await supabase
        .from('gh_programs')
        .select('title')
        .eq('id', programId)
        .single();

      if (programError) throw programError;

      // Create user lookup map
      const userMap = new Map(
        (users || []).map((u) => [u.user_id, u])
      );

      // Transform to EnrollmentHistoryItem
      const historyItems: EnrollmentHistoryItem[] = enrollments.map((e) => {
        const user = userMap.get(e.user_id);
        const enroller = e.enrolled_by ? userMap.get(e.enrolled_by) : null;

        return {
          id: e.id,
          program_id: e.program_id,
          program_title: program?.title || 'Unknown Program',
          user_id: e.user_id,
          user_email: user?.email || 'Unknown',
          user_name: user?.full_name || null,
          enrolled_at: e.enrolled_at,
          enrollment_source: e.enrollment_source as 'manual' | 'purchase' | 'import',
          enrolled_by: e.enrolled_by,
          enrolled_by_name: enroller?.full_name || null,
          purchase_id: e.purchase_id,
          status: e.status as 'active' | 'completed' | 'paused' | 'cancelled',
          notes: e.notes,
        };
      });

      setHistory(historyItems);
    } catch (err) {
      console.error('Error fetching enrollment history:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch enrollment history')
      );
    } finally {
      setIsLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
};

// ============================================================================
// useUnenrollLearner - Remove learner from program
// ============================================================================

interface UseUnenrollLearnerResult {
  unenroll: (userId: string, programId: string) => Promise<boolean>;
  isUnenrolling: boolean;
}

/**
 * Hook to unenroll (cancel) a learner from a program
 */
export const useUnenrollLearner = (): UseUnenrollLearnerResult => {
  const { toast } = useToast();
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  const unenroll = useCallback(
    async (userId: string, programId: string): Promise<boolean> => {
      setIsUnenrolling(true);

      try {
        const { error: updateError } = await supabase
          .from('gh_user_program_enrollments')
          .update({ status: 'cancelled' })
          .eq('user_id', userId)
          .eq('program_id', programId);

        if (updateError) throw updateError;

        toast({
          title: 'Learner Unenrolled',
          description: 'The learner has been removed from the program.',
        });

        return true;
      } catch (err) {
        console.error('Error unenrolling learner:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to unenroll learner';
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsUnenrolling(false);
      }
    },
    [toast]
  );

  return {
    unenroll,
    isUnenrolling,
  };
};

// ============================================================================
// useEnrollmentStats - Get enrollment statistics for a program
// ============================================================================

interface UseEnrollmentStatsResult {
  stats: EnrollmentStatistics | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch enrollment statistics for a program
 */
export const useEnrollmentStats = (
  programId: string
): UseEnrollmentStatsResult => {
  const [stats, setStats] = useState<EnrollmentStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    if (!programId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get all enrollments for this program
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('gh_user_program_enrollments')
        .select('id, enrollment_source, enrolled_at, status')
        .eq('program_id', programId);

      if (enrollmentsError) throw enrollmentsError;

      if (!enrollments) {
        setStats({
          total_enrolled: 0,
          enrolled_this_month: 0,
          by_source: { manual: 0, purchase: 0, import: 0 },
        });
        return;
      }

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const activeEnrollments = enrollments.filter(
        (e) => e.status !== 'cancelled'
      );

      const thisMonthEnrollments = activeEnrollments.filter((e) => {
        const enrolledDate = parseISO(e.enrolled_at);
        return isAfter(enrolledDate, startOfMonth);
      });

      const bySource = {
        manual: activeEnrollments.filter((e) => e.enrollment_source === 'manual').length,
        purchase: activeEnrollments.filter((e) => e.enrollment_source === 'purchase').length,
        import: activeEnrollments.filter((e) => e.enrollment_source === 'import').length,
      };

      setStats({
        total_enrolled: activeEnrollments.length,
        enrolled_this_month: thisMonthEnrollments.length,
        by_source: bySource,
      });
    } catch (err) {
      console.error('Error fetching enrollment stats:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch enrollment stats')
      );
    } finally {
      setIsLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
};

// ============================================================================
// FEAT-GH-021: useLibraryTactics - Fetch tactics from gh_tactic_instructions
// ============================================================================
// Fetches tactics from the master library, grouped by week_assignment
// Used in the "Load from Library" tab of TacticEditor
// ============================================================================

interface UseLibraryTacticsOptions {
  tacticSource?: 'mentorship' | 'cashflow_course' | 'general';
  programId?: string; // To check for duplicates across program lessons
}

interface UseLibraryTacticsResult {
  tactics: LibraryTactic[];
  groupedTactics: TacticLibraryGroup[];
  usedTactics: UsedTactic[]; // Tactics already used in this program's lessons
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useLibraryTactics = (
  options: UseLibraryTacticsOptions = {}
): UseLibraryTacticsResult => {
  const { tacticSource = 'mentorship', programId } = options;
  const [tactics, setTactics] = useState<LibraryTactic[]>([]);
  const [groupedTactics, setGroupedTactics] = useState<TacticLibraryGroup[]>([]);
  const [usedTactics, setUsedTactics] = useState<UsedTactic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLibraryTactics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch tactics from gh_tactic_instructions
      // NOTE: Only selecting columns that actually exist in the database
      const { data: libraryData, error: libraryError } = await supabase
        .from('gh_tactic_instructions')
        .select(`
          id,
          tactic_id,
          tactic_name,
          category,
          week_assignment,
          tactic_source,
          estimated_time,
          why_it_matters,
          video_url
        `)
        .eq('tactic_source', tacticSource)
        .order('week_assignment', { ascending: true, nullsFirst: false })
        .order('tactic_id', { ascending: true });

      if (libraryError) throw libraryError;

      const libraryTactics = (libraryData || []) as LibraryTactic[];
      setTactics(libraryTactics);

      // Group tactics by week_assignment
      const weekMap = new Map<number, LibraryTactic[]>();

      for (const tactic of libraryTactics) {
        const week = tactic.week_assignment ?? 0; // 0 for unassigned
        if (!weekMap.has(week)) {
          weekMap.set(week, []);
        }
        weekMap.get(week)!.push(tactic);
      }

      // Convert to array of groups, sorted by week number
      const groups: TacticLibraryGroup[] = [];
      const sortedWeeks = Array.from(weekMap.keys()).sort((a, b) => a - b);

      for (const weekNum of sortedWeeks) {
        const weekTactics = weekMap.get(weekNum) || [];
        groups.push({
          week_number: weekNum,
          week_title: weekNum === 0 ? 'Unassigned' : `Week ${weekNum}`,
          tactics: weekTactics,
        });
      }

      setGroupedTactics(groups);

      // If programId provided, fetch tactics already used in this program's lessons
      if (programId) {
        // Get all lessons in this program
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('gh_program_lessons')
          .select(`
            id,
            title,
            phase:gh_program_phases!inner(
              program_id
            )
          `)
          .eq('phase.program_id', programId);

        if (lessonsError) throw lessonsError;

        const lessonIds = (lessonsData || []).map(l => l.id);
        const lessonTitleMap = new Map<string, string>();
        for (const lesson of lessonsData || []) {
          lessonTitleMap.set(lesson.id, lesson.title);
        }

        if (lessonIds.length > 0) {
          // Get tactics already in these lessons that have source_tactic_id
          // Note: We check settings->source_tactic_id since it may be stored there
          const { data: usedData, error: usedError } = await supabase
            .from('gh_lesson_tactics')
            .select('id, lesson_id, settings')
            .in('lesson_id', lessonIds);

          if (usedError) throw usedError;

          const used: UsedTactic[] = [];
          for (const tactic of usedData || []) {
            // Check if settings has source_tactic_id
            const settings = tactic.settings as Record<string, unknown> | null;
            const sourceTacticId = settings?.source_tactic_id as string | undefined;

            if (sourceTacticId) {
              used.push({
                source_tactic_id: sourceTacticId,
                lesson_id: tactic.lesson_id,
                lesson_title: lessonTitleMap.get(tactic.lesson_id) || 'Unknown Lesson',
              });
            }
          }

          setUsedTactics(used);
        }
      }
    } catch (err) {
      console.error('Error fetching library tactics:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch library tactics'));
    } finally {
      setIsLoading(false);
    }
  }, [tacticSource, programId]);

  useEffect(() => {
    fetchLibraryTactics();
  }, [fetchLibraryTactics]);

  return {
    tactics,
    groupedTactics,
    usedTactics,
    isLoading,
    error,
    refetch: fetchLibraryTactics,
  };
};

// ============================================================================
// FEAT-GH-021: useCopyLibraryTactic - Copy tactics to gh_lesson_tactics
// ============================================================================
// Copies one or more tactics from gh_tactic_instructions to gh_lesson_tactics
// Maps fields according to the plan: tactic_name → label, etc.
// ============================================================================

interface UseCopyLibraryTacticResult {
  copyTactics: (data: CopyLibraryTacticData[]) => Promise<CopyTacticsResult>;
  isCopying: boolean;
}

export const useCopyLibraryTactic = (): UseCopyLibraryTacticResult => {
  const [isCopying, setIsCopying] = useState(false);
  const { toast } = useToast();

  const copyTactics = useCallback(
    async (tacticsData: CopyLibraryTacticData[]): Promise<CopyTacticsResult> => {
      setIsCopying(true);

      const result: CopyTacticsResult = {
        success_count: 0,
        failed_count: 0,
        created_tactic_ids: [],
      };

      try {
        // Fetch full details for all source tactics
        const sourceIds = tacticsData.map(t => t.library_tactic.id);

        const { data: fullTactics, error: fetchError } = await supabase
          .from('gh_tactic_instructions')
          .select('*')
          .in('id', sourceIds);

        if (fetchError) throw fetchError;

        const tacticMap = new Map(fullTactics?.map(t => [t.id, t]) || []);

        // Prepare insert records
        const insertRecords = tacticsData.map((data, index) => {
          const sourceTactic = tacticMap.get(data.library_tactic.id);

          // Field mapping per the plan:
          // tactic_name → label
          // instructions → description (need to fetch this field)
          // short_description → short_description
          // category → stored in settings JSONB
          // video_url → reference_url (for now, until we add video_url to gh_lesson_tactics)
          return {
            lesson_id: data.lesson_id,
            label: data.library_tactic.tactic_name,
            description: sourceTactic?.instructions || data.library_tactic.why_it_matters || null,
            short_description: data.library_tactic.short_description,
            order_index: data.order_index + index, // Offset by index if adding multiple
            is_required: true, // Default per plan
            tactic_type: 'checkbox' as const, // Default per plan
            reference_url: data.library_tactic.video_url || data.library_tactic.reference_url || null,
            reference_label: data.library_tactic.video_url ? 'Watch Video' : null,
            estimated_minutes: parseEstimatedTime(data.library_tactic.estimated_time),
            ai_help_enabled: true, // Enable Nette AI by default
            ai_context: `Original tactic: ${data.library_tactic.tactic_name}. Category: ${data.library_tactic.category}`,
            settings: {
              source_tactic_id: data.library_tactic.id,
              source_tactic_code: data.library_tactic.tactic_id, // Internal code like M001
              original_category: data.library_tactic.category,
              original_parent_category: data.library_tactic.parent_category,
              copied_at: new Date().toISOString(),
            },
          };
        });

        // Insert all tactics
        const { data: insertedData, error: insertError } = await supabase
          .from('gh_lesson_tactics')
          .insert(insertRecords)
          .select('id');

        if (insertError) {
          // If bulk insert fails, try one by one
          console.error('Bulk insert failed, trying individually:', insertError);

          for (const record of insertRecords) {
            try {
              const { data: singleInsert, error: singleError } = await supabase
                .from('gh_lesson_tactics')
                .insert(record)
                .select('id')
                .single();

              if (singleError) {
                console.error('Failed to insert tactic:', singleError);
                result.failed_count++;
              } else if (singleInsert) {
                result.success_count++;
                result.created_tactic_ids.push(singleInsert.id);
              }
            } catch (e) {
              console.error('Exception inserting tactic:', e);
              result.failed_count++;
            }
          }
        } else {
          // Bulk insert succeeded
          result.success_count = insertedData?.length || 0;
          result.created_tactic_ids = insertedData?.map(t => t.id) || [];
        }

        // Show success/failure toast
        if (result.success_count > 0) {
          toast({
            title: 'Tactics copied',
            description: `Successfully added ${result.success_count} tactic${result.success_count > 1 ? 's' : ''} to the lesson.`,
          });
        }

        if (result.failed_count > 0) {
          toast({
            title: 'Some tactics failed',
            description: `Failed to copy ${result.failed_count} tactic${result.failed_count > 1 ? 's' : ''}. They may already exist or have conflicts.`,
            variant: 'destructive',
          });
        }

        return result;
      } catch (err) {
        console.error('Error copying tactics:', err);
        toast({
          title: 'Error copying tactics',
          description: err instanceof Error ? err.message : 'Failed to copy tactics',
          variant: 'destructive',
        });

        result.failed_count = tacticsData.length;
        return result;
      } finally {
        setIsCopying(false);
      }
    },
    [toast]
  );

  return {
    copyTactics,
    isCopying,
  };
};

// Helper function to parse estimated_time string to minutes
function parseEstimatedTime(timeStr: string | null): number | null {
  if (!timeStr) return null;

  // Handle formats like "15 mins", "1 hour", "30 minutes", etc.
  const lower = timeStr.toLowerCase();

  // Check for hours
  const hourMatch = lower.match(/(\d+)\s*(?:hour|hr)/);
  if (hourMatch) {
    return parseInt(hourMatch[1], 10) * 60;
  }

  // Check for minutes
  const minMatch = lower.match(/(\d+)\s*(?:min|minute)/);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }

  // Try to parse as raw number
  const num = parseInt(timeStr, 10);
  return isNaN(num) ? null : num;
}
