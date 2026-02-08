// ============================================================================
// FEAT-GH-010: Programs Hook
// ============================================================================
// Hook for fetching user's enrolled programs with progress data
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  ProgramWithProgress,
  ProgramsFilterStatus,
  PhaseWithProgress,
  LessonWithProgress,
  UserPhaseProgress,
  UserLessonProgress,
  NetteConversation,
  NetteMessage,
  UserInsight,
  SupportEscalation,
  NetteChatContext,
  QuickReply,
} from '@/types/programs';

interface UseProgramsOptions {
  filterStatus?: ProgramsFilterStatus;
  searchQuery?: string;
}

/**
 * Helper to check if a string is a valid UUID v4
 * Used to differentiate between slugs and UUIDs in URL parameters
 */
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Helper to resolve a program identifier (UUID or slug) to its UUID
 * Returns the UUID if valid, or looks up by slug if not
 */
const resolveProgramId = async (programIdOrSlug: string): Promise<string | null> => {
  // If it's already a valid UUID, return it directly
  if (isValidUUID(programIdOrSlug)) {
    return programIdOrSlug;
  }

  // Otherwise, look up by slug
  const { data, error } = await supabase
    .from('gh_programs')
    .select('id')
    .eq('slug', programIdOrSlug)
    .single();

  if (error || !data) {
    console.error('Error resolving program slug:', error);
    return null;
  }

  return data.id;
};

interface UseProgramsResult {
  programs: ProgramWithProgress[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  continueProgram: ProgramWithProgress | null;
}

/**
 * Hook to fetch user's enrolled programs with progress data
 * Supports filtering by status and search
 */
export const usePrograms = (options: UseProgramsOptions = {}): UseProgramsResult => {
  const { filterStatus = 'all', searchQuery = '' } = options;
  const { user } = useAuth();

  const [programs, setPrograms] = useState<ProgramWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrograms = useCallback(async () => {
    if (!user?.id) {
      setPrograms([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Query enrollments with program data
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('gh_user_program_enrollments')
        .select(`
          id,
          enrolled_at,
          status,
          progress_percent,
          completed_phases,
          completed_lessons,
          last_activity_at,
          gh_programs (
            id,
            title,
            slug,
            description,
            short_description,
            thumbnail_url,
            instructor_name,
            instructor_avatar_url,
            total_phases,
            total_lessons,
            estimated_duration_hours
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'completed', 'paused'])
        .order('last_activity_at', { ascending: false });

      if (enrollmentError) throw enrollmentError;

      // Get total required lessons count for each program
      const programIds = enrollments?.map(e => (e.gh_programs as any)?.id).filter(Boolean) || [];

      let requiredLessonsCounts: Record<string, number> = {};

      if (programIds.length > 0) {
        const { data: lessonCounts, error: countError } = await supabase
          .rpc('get_program_required_lesson_counts', { program_ids: programIds });

        if (!countError && lessonCounts) {
          requiredLessonsCounts = lessonCounts.reduce((acc: Record<string, number>, item: { program_id: string; count: number }) => {
            acc[item.program_id] = item.count;
            return acc;
          }, {});
        }
      }

      // Transform to ProgramWithProgress
      const programsWithProgress: ProgramWithProgress[] = (enrollments || [])
        .filter(e => e.gh_programs)
        .map(enrollment => {
          const program = enrollment.gh_programs as any;
          const enrolledDate = new Date(enrollment.enrolled_at);
          const now = new Date();
          const daysSinceEnrollment = Math.floor((now.getTime() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24));
          const lastActivityDate = new Date(enrollment.last_activity_at);
          const daysSinceActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

          // Compute status based on progress
          let computedStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
          if (enrollment.status === 'completed' || enrollment.progress_percent >= 100) {
            computedStatus = 'completed';
          } else if (enrollment.progress_percent > 0 || enrollment.completed_lessons > 0) {
            computedStatus = 'in_progress';
          }

          return {
            id: program.id,
            title: program.title,
            slug: program.slug,
            description: program.description,
            short_description: program.short_description,
            thumbnail_url: program.thumbnail_url,
            instructor_name: program.instructor_name,
            instructor_avatar_url: program.instructor_avatar_url,
            total_phases: program.total_phases,
            total_lessons: program.total_lessons,
            estimated_duration_hours: program.estimated_duration_hours,
            enrollment_id: enrollment.id,
            enrolled_at: enrollment.enrolled_at,
            enrollment_status: enrollment.status as any,
            progress_percent: enrollment.progress_percent,
            completed_phases: enrollment.completed_phases,
            completed_lessons: enrollment.completed_lessons,
            total_required_lessons: requiredLessonsCounts[program.id] || program.total_lessons,
            last_activity_at: enrollment.last_activity_at,
            computed_status: computedStatus,
            is_new: daysSinceEnrollment <= 7,
            days_since_activity: daysSinceActivity,
          };
        });

      // Apply filters
      let filteredPrograms = programsWithProgress;

      // Status filter
      if (filterStatus !== 'all') {
        filteredPrograms = filteredPrograms.filter(p => p.computed_status === filterStatus);
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredPrograms = filteredPrograms.filter(p =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.instructor_name?.toLowerCase().includes(query)
        );
      }

      setPrograms(filteredPrograms);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch programs'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, filterStatus, searchQuery]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // Find the best "continue" program (most recent activity, in progress)
  const continueProgram = programs.find(p =>
    p.computed_status === 'in_progress'
  ) || programs.find(p =>
    p.computed_status === 'not_started'
  ) || null;

  return {
    programs,
    isLoading,
    error,
    refetch: fetchPrograms,
    continueProgram,
  };
};

/**
 * Hook to fetch a single program by ID with full details
 */
export const useProgram = (programId: string | undefined) => {
  const { user } = useAuth();
  const [program, setProgram] = useState<ProgramWithProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProgram = useCallback(async () => {
    if (!user?.id || !programId) {
      setProgram(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Resolve programId (could be slug or UUID) to actual UUID
      const resolvedProgramId = await resolveProgramId(programId);
      if (!resolvedProgramId) {
        throw new Error(`Program not found: ${programId}`);
      }

      // Fetch program with enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('gh_user_program_enrollments')
        .select(`
          id,
          enrolled_at,
          status,
          progress_percent,
          completed_phases,
          completed_lessons,
          last_activity_at,
          gh_programs (
            id,
            title,
            slug,
            description,
            short_description,
            thumbnail_url,
            instructor_name,
            instructor_avatar_url,
            instructor_bio,
            total_phases,
            total_lessons,
            total_tactics,
            estimated_duration_hours,
            settings
          )
        `)
        .eq('user_id', user.id)
        .eq('program_id', resolvedProgramId)
        .single();

      if (enrollmentError) {
        if (enrollmentError.code === 'PGRST116') {
          // Not enrolled - fetch program anyway for preview
          const { data: programData, error: programError } = await supabase
            .from('gh_programs')
            .select('*')
            .eq('id', resolvedProgramId)
            .eq('status', 'published')
            .single();

          if (programError) throw programError;

          // Return program without enrollment data
          setProgram({
            ...programData,
            enrollment_id: '',
            enrolled_at: '',
            enrollment_status: 'cancelled' as const,
            progress_percent: 0,
            completed_phases: 0,
            completed_lessons: 0,
            total_required_lessons: programData.total_lessons,
            last_activity_at: '',
            computed_status: 'not_started',
            is_new: false,
            days_since_activity: 0,
          });
          return;
        }
        throw enrollmentError;
      }

      const programData = enrollment.gh_programs as any;
      const enrolledDate = new Date(enrollment.enrolled_at);
      const now = new Date();
      const daysSinceEnrollment = Math.floor((now.getTime() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24));
      const lastActivityDate = new Date(enrollment.last_activity_at);
      const daysSinceActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

      let computedStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
      if (enrollment.status === 'completed' || enrollment.progress_percent >= 100) {
        computedStatus = 'completed';
      } else if (enrollment.progress_percent > 0 || enrollment.completed_lessons > 0) {
        computedStatus = 'in_progress';
      }

      setProgram({
        id: programData.id,
        title: programData.title,
        slug: programData.slug,
        description: programData.description,
        short_description: programData.short_description,
        thumbnail_url: programData.thumbnail_url,
        instructor_name: programData.instructor_name,
        instructor_avatar_url: programData.instructor_avatar_url,
        total_phases: programData.total_phases,
        total_lessons: programData.total_lessons,
        estimated_duration_hours: programData.estimated_duration_hours,
        enrollment_id: enrollment.id,
        enrolled_at: enrollment.enrolled_at,
        enrollment_status: enrollment.status as any,
        progress_percent: enrollment.progress_percent,
        completed_phases: enrollment.completed_phases,
        completed_lessons: enrollment.completed_lessons,
        total_required_lessons: programData.total_lessons,
        last_activity_at: enrollment.last_activity_at,
        computed_status: computedStatus,
        is_new: daysSinceEnrollment <= 7,
        days_since_activity: daysSinceActivity,
      });
    } catch (err) {
      console.error('Error fetching program:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch program'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, programId]);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  return {
    program,
    isLoading,
    error,
    refetch: fetchProgram,
  };
};

/**
 * Hook to fetch phases for a program with progress data
 * Used in Program Dashboard (FEAT-GH-011)
 */
export const useProgramPhases = (programId: string | undefined) => {
  const { user } = useAuth();
  const [phases, setPhases] = useState<PhaseWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPhases = useCallback(async () => {
    if (!user?.id || !programId) {
      setPhases([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Resolve programId (could be slug or UUID) to actual UUID
      const resolvedProgramId = await resolveProgramId(programId);
      if (!resolvedProgramId) {
        console.error('Error fetching phases: Program not found for', programId);
        setPhases([]);
        setIsLoading(false);
        return;
      }

      // Fetch phases for the program
      // NOTE: total_lessons/total_tactics are on gh_programs, not gh_program_phases
      // prerequisite_phase_id is the correct column name (not unlock_after_phase_id)
      const { data: phasesData, error: phasesError } = await supabase
        .from('gh_program_phases')
        .select(`
          id,
          program_id,
          title,
          description,
          short_description,
          thumbnail_url,
          order_index,
          is_required,
          estimated_duration_minutes,
          drip_model,
          unlock_at,
          unlock_offset_days,
          prerequisite_phase_id
        `)
        .eq('program_id', resolvedProgramId)
        .eq('status', 'published')
        .order('order_index', { ascending: true });

      if (phasesError) throw phasesError;

      // Fetch user's progress for these phases
      const phaseIds = phasesData?.map(p => p.id) || [];

      let progressMap: Record<string, {
        status: string;
        progress_percent: number;
        completed_lessons: number;
        total_required_lessons: number;
        unlocked_at: string | null;
      }> = {};

      if (phaseIds.length > 0) {
        const { data: progressData, error: progressError } = await supabase
          .from('gh_user_phase_progress')
          .select(`
            phase_id,
            status,
            progress_percent,
            completed_lessons,
            total_required_lessons,
            unlocked_at
          `)
          .eq('user_id', user.id)
          .in('phase_id', phaseIds);

        if (!progressError && progressData) {
          progressMap = progressData.reduce((acc, item) => {
            acc[item.phase_id] = item;
            return acc;
          }, {} as typeof progressMap);
        }
      }

      // Fetch lesson counts per phase (for ALL phases, including locked ones)
      // This ensures overall progress calculation includes all lessons in the program
      let lessonCountMap: Record<string, { total: number; required: number }> = {};

      if (phaseIds.length > 0) {
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('gh_program_lessons')
          .select('phase_id, is_required')
          .in('phase_id', phaseIds)
          .eq('status', 'published');

        if (!lessonsError && lessonsData) {
          // Count lessons per phase
          lessonsData.forEach(lesson => {
            if (!lessonCountMap[lesson.phase_id]) {
              lessonCountMap[lesson.phase_id] = { total: 0, required: 0 };
            }
            lessonCountMap[lesson.phase_id].total++;
            if (lesson.is_required) {
              lessonCountMap[lesson.phase_id].required++;
            }
          });
        }
      }

      // Get enrollment to check drip unlock dates
      const { data: enrollment } = await supabase
        .from('gh_user_program_enrollments')
        .select('enrolled_at')
        .eq('user_id', user.id)
        .eq('program_id', programId)
        .single();

      const enrolledAt = enrollment?.enrolled_at ? new Date(enrollment.enrolled_at) : new Date();

      // Build phase ID to completion status map for progress-based unlocks
      const phaseCompletionMap: Record<string, boolean> = {};
      (phasesData || []).forEach(phase => {
        const progress = progressMap[phase.id];
        phaseCompletionMap[phase.id] = progress?.status === 'completed';
      });

      // Transform to PhaseWithProgress
      const phasesWithProgress: PhaseWithProgress[] = (phasesData || []).map((phase, index) => {
        const progress = progressMap[phase.id];

        // Determine unlock status based on drip model
        let isUnlocked = false;
        let unlockReason: string | null = null;
        let unlockDate: string | null = null;

        const dripModel = phase.drip_model || 'progress';

        if (index === 0) {
          // First phase is always unlocked
          isUnlocked = true;
        } else if (progress?.status && progress.status !== 'locked') {
          // Already unlocked
          isUnlocked = true;
        } else {
          // Check drip model
          switch (dripModel) {
            case 'calendar':
              if (phase.unlock_at) {
                const unlockAtDate = new Date(phase.unlock_at);
                isUnlocked = new Date() >= unlockAtDate;
                if (!isUnlocked) {
                  unlockDate = phase.unlock_at;
                  unlockReason = `Unlocks on ${unlockAtDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                }
              } else {
                isUnlocked = true;
              }
              break;

            case 'relative':
              if (phase.unlock_offset_days !== null) {
                const unlockAtDate = new Date(enrolledAt);
                unlockAtDate.setDate(unlockAtDate.getDate() + phase.unlock_offset_days);
                isUnlocked = new Date() >= unlockAtDate;
                if (!isUnlocked) {
                  const daysUntil = Math.ceil((unlockAtDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  unlockDate = unlockAtDate.toISOString();
                  unlockReason = daysUntil === 1 ? 'Unlocks tomorrow' : `Unlocks in ${daysUntil} days`;
                }
              } else {
                isUnlocked = true;
              }
              break;

            case 'progress':
            case 'inherit':
            default:
              // Unlock when previous phase is complete
              if (index > 0) {
                const prevPhase = phasesData[index - 1];
                const prereqId = phase.prerequisite_phase_id || prevPhase.id;
                isUnlocked = phaseCompletionMap[prereqId] === true;
                if (!isUnlocked) {
                  const prereqPhase = phasesData.find(p => p.id === prereqId);
                  unlockReason = `Complete ${prereqPhase?.title || 'previous phase'} first`;
                }
              } else {
                isUnlocked = true;
              }
              break;
          }
        }

        // Compute status
        let status: PhaseWithProgress['status'] = 'locked';
        if (!isUnlocked) {
          status = 'locked';
        } else if (progress?.status === 'completed') {
          status = 'completed';
        } else if (progress?.status === 'in_progress' || (progress?.progress_percent ?? 0) > 0) {
          status = 'in_progress';
        } else {
          status = 'not_started';
        }

        return {
          id: phase.id,
          program_id: phase.program_id,
          title: phase.title,
          description: phase.description,
          short_description: phase.short_description,
          thumbnail_url: phase.thumbnail_url,
          order_index: phase.order_index,
          is_required: phase.is_required,
          // Use actual lesson counts from database query (not undefined phase properties)
          total_lessons: lessonCountMap[phase.id]?.total ?? 0,
          total_tactics: 0, // TODO: Count tactics if needed
          estimated_duration_minutes: phase.estimated_duration_minutes,
          // Progress
          status,
          progress_percent: progress?.progress_percent ?? 0,
          completed_lessons: progress?.completed_lessons ?? 0,
          // CRITICAL: Use actual lesson count from DB for overall progress calculation
          // This ensures locked phases contribute to the total lesson count
          total_required_lessons: lessonCountMap[phase.id]?.required ?? lessonCountMap[phase.id]?.total ?? 0,
          // Unlock
          is_unlocked: isUnlocked,
          unlock_reason: unlockReason,
          unlock_date: unlockDate,
        };
      });

      setPhases(phasesWithProgress);
    } catch (err) {
      console.error('Error fetching phases:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch phases'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, programId]);

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

  // Find the current/next phase to continue
  const currentPhase = phases.find(p =>
    p.status === 'in_progress'
  ) || phases.find(p =>
    p.status === 'not_started' && p.is_unlocked
  ) || null;

  return {
    phases,
    isLoading,
    error,
    refetch: fetchPhases,
    currentPhase,
  };
};

// ============================================================================
// FEAT-GH-012: usePhase Hook
// ============================================================================
// Fetches a single phase with progress data
// ============================================================================

export const usePhase = (phaseId: string | undefined) => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<PhaseWithProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPhase = useCallback(async () => {
    if (!phaseId) {
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
        .eq('status', 'published')
        .single();

      if (phaseError) throw phaseError;
      if (!phaseData) throw new Error('Phase not found');

      // Fetch user progress if logged in
      let progress: UserPhaseProgress | null = null;
      if (user?.id) {
        const { data: progressData } = await supabase
          .from('gh_user_phase_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('phase_id', phaseId)
          .maybeSingle();
        progress = progressData;
      }

      // Determine unlock status
      let isUnlocked = true;
      let unlockReason: string | null = null;
      let unlockDate: string | null = null;

      if (progress?.status === 'locked') {
        isUnlocked = false;
        unlockReason = 'This phase is currently locked';
      }

      // Determine status
      let status: PhaseWithProgress['status'] = 'locked';
      if (isUnlocked) {
        if (progress?.status === 'completed') {
          status = 'completed';
        } else if (progress?.status === 'in_progress' || (progress?.progress_percent ?? 0) > 0) {
          status = 'in_progress';
        } else {
          status = 'not_started';
        }
      }

      setPhase({
        id: phaseData.id,
        program_id: phaseData.program_id,
        title: phaseData.title,
        description: phaseData.description,
        short_description: phaseData.short_description,
        thumbnail_url: phaseData.thumbnail_url,
        order_index: phaseData.order_index,
        is_required: phaseData.is_required,
        total_lessons: phaseData.total_lessons,
        total_tactics: phaseData.total_tactics,
        estimated_duration_minutes: phaseData.estimated_duration_minutes,
        status,
        progress_percent: progress?.progress_percent ?? 0,
        completed_lessons: progress?.completed_lessons ?? 0,
        total_required_lessons: progress?.total_required_lessons ?? phaseData.total_lessons,
        is_unlocked: isUnlocked,
        unlock_reason: unlockReason,
        unlock_date: unlockDate,
      });
    } catch (err) {
      console.error('Error fetching phase:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch phase'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, phaseId]);

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
// FEAT-GH-012: usePhaseLessons Hook
// ============================================================================
// Fetches all lessons for a phase with user progress data
// Returns lessons with TWO GAUGES: video % and tactics %
// ============================================================================

export const usePhaseLessons = (phaseId: string | undefined) => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLessons = useCallback(async () => {
    if (!phaseId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all lessons for the phase
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('gh_program_lessons')
        .select('*')
        .eq('phase_id', phaseId)
        .eq('status', 'published')
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;
      if (!lessonsData || lessonsData.length === 0) {
        setLessons([]);
        setIsLoading(false);
        return;
      }

      // Fetch user progress for all lessons if logged in
      let progressMap: Record<string, UserLessonProgress> = {};
      if (user?.id) {
        const lessonIds = lessonsData.map(l => l.id);
        const { data: progressData } = await supabase
          .from('gh_user_lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);

        if (progressData) {
          progressMap = progressData.reduce((acc, p) => {
            acc[p.lesson_id] = p;
            return acc;
          }, {} as Record<string, UserLessonProgress>);
        }
      }

      // Build lessons with progress
      const lessonsWithProgress: LessonWithProgress[] = lessonsData.map((lesson, index) => {
        const progress = progressMap[lesson.id];

        // Determine unlock status based on sequence
        // First lesson is always unlocked, others depend on previous lesson completion
        let isUnlocked = index === 0; // First lesson always unlocked
        let unlockReason: string | null = null;
        let unlockDate: string | null = null;

        if (!isUnlocked && index > 0) {
          const prevLesson = lessonsData[index - 1];
          const prevProgress = progressMap[prevLesson.id];

          // Check if previous lesson is completed
          if (prevProgress?.status === 'completed' || prevProgress?.all_gates_met) {
            isUnlocked = true;
          } else {
            unlockReason = `Complete "${prevLesson.title}" first`;
          }

          // Check for drip override
          if (lesson.drip_override) {
            const override = lesson.drip_override as {
              model?: string;
              unlock_at?: string;
              offset_days?: number;
            };

            if (override.model === 'calendar' && override.unlock_at) {
              const unlockAt = new Date(override.unlock_at);
              const now = new Date();
              if (unlockAt > now) {
                isUnlocked = false;
                unlockDate = override.unlock_at;
                unlockReason = `Unlocks on ${unlockAt.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}`;
              } else {
                isUnlocked = true;
                unlockReason = null;
              }
            }
          }
        }

        // Determine status
        let status: LessonWithProgress['status'] = 'locked';
        if (isUnlocked) {
          if (progress?.status === 'completed') {
            status = 'completed';
          } else if (progress?.status === 'stuck') {
            status = 'stuck';
          } else if (progress?.status === 'in_progress' ||
                     (progress?.video_watched_percent ?? 0) > 0 ||
                     (progress?.tactics_completed_count ?? 0) > 0) {
            status = 'in_progress';
          } else {
            status = 'not_started';
          }
        }

        return {
          id: lesson.id,
          phase_id: lesson.phase_id,
          title: lesson.title,
          description: lesson.description,
          short_description: lesson.short_description,
          thumbnail_url: lesson.thumbnail_url,
          order_index: lesson.order_index,
          lesson_type: lesson.lesson_type,
          is_required: lesson.is_required,
          video_duration_seconds: lesson.video_duration_seconds,
          total_tactics: lesson.total_tactics,
          total_required_tactics: lesson.total_required_tactics,
          estimated_duration_minutes: lesson.estimated_duration_minutes,
          // Progress - THE TWO GAUGES!
          status,
          video_watched_percent: progress?.video_watched_percent ?? 0,
          tactics_completed_count: progress?.tactics_completed_count ?? 0,
          tactics_completion_percent: progress?.tactics_completion_percent ?? 0,
          // Completion gates
          video_gate_met: progress?.video_gate_met ?? false,
          tactics_gate_met: progress?.tactics_gate_met ?? false,
          assessment_gate_met: progress?.assessment_gate_met ?? true, // Default to true if no assessment
          all_gates_met: progress?.all_gates_met ?? false,
          // Unlock
          is_unlocked: isUnlocked,
          unlock_reason: unlockReason,
          unlock_date: unlockDate,
        };
      });

      setLessons(lessonsWithProgress);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch lessons'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, phaseId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Find the current/next lesson to continue
  const currentLesson = lessons.find(l =>
    l.status === 'in_progress'
  ) || lessons.find(l =>
    l.status === 'not_started' && l.is_unlocked
  ) || null;

  return {
    lessons,
    isLoading,
    error,
    refetch: fetchLessons,
    currentLesson,
  };
};

// ============================================================================
// FEAT-GH-013: Lesson Experience Hooks
// ============================================================================

/**
 * Full lesson data including content, video, and completion rules
 */
export interface LessonFull extends LessonWithProgress {
  video_url: string | null;
  video_provider: 'youtube' | 'vimeo' | 'wistia' | 'bunny' | 'custom' | null;
  content_html: string | null;
  required_watch_percent: number;
  requires_tactics_complete: boolean;
  has_assessment: boolean;
  requires_assessment_pass: boolean;
  assessment_passing_score: number | null;
  // Progress details
  video_last_position_ms: number;
  assessment_status: 'not_started' | 'in_progress' | 'passed' | 'failed' | null;
  assessment_score: number | null;
  assessment_attempts: number;
  // Stuck info
  stuck_detected_at: string | null;
  stuck_reason: string | null;
  // Phase info for breadcrumb
  phase_title: string;
  program_title: string;
}

/**
 * Fetch single lesson with full details and progress
 */
export const useLesson = (lessonId: string | undefined) => {
  const { user } = useAuth();
  const [lesson, setLesson] = useState<LessonFull | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLesson = useCallback(async () => {
    if (!lessonId || !user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch lesson with phase and program info
      const { data: lessonData, error: lessonError } = await supabase
        .from('gh_program_lessons')
        .select(`
          *,
          phase:gh_program_phases!inner (
            id,
            title,
            program:gh_programs!inner (
              id,
              title
            )
          )
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      if (!lessonData) throw new Error('Lesson not found');

      // Fetch user's progress for this lesson
      const { data: progress } = await supabase
        .from('gh_user_lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      // Determine status
      let status: LessonWithProgress['status'] = 'not_started';
      if (progress) {
        status = progress.status;
      }

      const lessonFull: LessonFull = {
        id: lessonData.id,
        phase_id: lessonData.phase_id,
        title: lessonData.title,
        description: lessonData.description,
        short_description: lessonData.short_description,
        thumbnail_url: lessonData.thumbnail_url,
        order_index: lessonData.order_index,
        lesson_type: lessonData.lesson_type,
        is_required: lessonData.is_required,
        video_duration_seconds: lessonData.video_duration_seconds,
        total_tactics: lessonData.total_tactics,
        total_required_tactics: lessonData.total_required_tactics,
        estimated_duration_minutes: lessonData.estimated_duration_minutes,
        // Content
        video_url: lessonData.video_url,
        video_provider: lessonData.video_provider,
        content_html: lessonData.content_html,
        // Completion rules
        required_watch_percent: lessonData.required_watch_percent,
        requires_tactics_complete: lessonData.requires_tactics_complete,
        has_assessment: lessonData.has_assessment,
        requires_assessment_pass: lessonData.requires_assessment_pass,
        assessment_passing_score: lessonData.assessment_passing_score,
        // Progress
        status,
        video_watched_percent: progress?.video_watched_percent ?? 0,
        video_last_position_ms: progress?.video_last_position_ms ?? 0,
        tactics_completed_count: progress?.tactics_completed_count ?? 0,
        tactics_completion_percent: progress?.tactics_completion_percent ?? 0,
        // Gates
        video_gate_met: progress?.video_gate_met ?? false,
        tactics_gate_met: progress?.tactics_gate_met ?? (lessonData.total_required_tactics === 0),
        assessment_gate_met: progress?.assessment_gate_met ?? !lessonData.requires_assessment_pass,
        all_gates_met: progress?.all_gates_met ?? false,
        // Assessment
        assessment_status: progress?.assessment_status ?? null,
        assessment_score: progress?.assessment_score ?? null,
        assessment_attempts: progress?.assessment_attempts ?? 0,
        // Stuck
        stuck_detected_at: progress?.stuck_detected_at ?? null,
        stuck_reason: progress?.stuck_reason ?? null,
        // Unlock - assume unlocked if we can fetch it
        is_unlocked: true,
        unlock_reason: null,
        unlock_date: null,
        // Phase/Program info
        phase_title: lessonData.phase?.title ?? '',
        program_title: lessonData.phase?.program?.title ?? '',
      };

      setLesson(lessonFull);
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch lesson'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, lessonId]);

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

/**
 * Hook to get the next lesson in sequence after the current one
 * Used for "Continue to Next Lesson" navigation
 */
export interface NextLessonInfo {
  id: string;
  title: string;
  phase_id: string;
  phase_title: string;
  is_new_phase: boolean;
  is_last_lesson: boolean;
}

export const useNextLesson = (lessonId: string | undefined, phaseId: string | undefined) => {
  const { user } = useAuth();
  const [nextLesson, setNextLesson] = useState<NextLessonInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNextLesson = useCallback(async () => {
    if (!lessonId || !phaseId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get current lesson's order_index
      const { data: currentLesson, error: currentError } = await supabase
        .from('gh_program_lessons')
        .select('order_index, phase_id')
        .eq('id', lessonId)
        .single();

      if (currentError) throw currentError;
      if (!currentLesson) throw new Error('Current lesson not found');

      // Try to find the next lesson in the same phase
      const { data: nextInPhase, error: nextError } = await supabase
        .from('gh_program_lessons')
        .select(`
          id,
          title,
          phase_id,
          order_index
        `)
        .eq('phase_id', phaseId)
        .eq('status', 'published')
        .gt('order_index', currentLesson.order_index)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextError) throw nextError;

      if (nextInPhase) {
        // Found next lesson in the same phase
        // Get phase title
        const { data: phaseData } = await supabase
          .from('gh_program_phases')
          .select('title')
          .eq('id', phaseId)
          .single();

        setNextLesson({
          id: nextInPhase.id,
          title: nextInPhase.title,
          phase_id: phaseId,
          phase_title: phaseData?.title || '',
          is_new_phase: false,
          is_last_lesson: false,
        });
        return;
      }

      // No more lessons in current phase - check for next phase
      const { data: currentPhase } = await supabase
        .from('gh_program_phases')
        .select('order_index, program_id')
        .eq('id', phaseId)
        .single();

      if (!currentPhase) {
        setNextLesson(null);
        return;
      }

      // Find next phase
      const { data: nextPhase } = await supabase
        .from('gh_program_phases')
        .select('id, title')
        .eq('program_id', currentPhase.program_id)
        .eq('status', 'published')
        .gt('order_index', currentPhase.order_index)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!nextPhase) {
        // This is the last lesson of the last phase
        setNextLesson({
          id: '',
          title: '',
          phase_id: '',
          phase_title: '',
          is_new_phase: false,
          is_last_lesson: true,
        });
        return;
      }

      // Get first lesson of the next phase
      const { data: firstLessonOfNextPhase } = await supabase
        .from('gh_program_lessons')
        .select('id, title')
        .eq('phase_id', nextPhase.id)
        .eq('status', 'published')
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstLessonOfNextPhase) {
        setNextLesson({
          id: firstLessonOfNextPhase.id,
          title: firstLessonOfNextPhase.title,
          phase_id: nextPhase.id,
          phase_title: nextPhase.title,
          is_new_phase: true,
          is_last_lesson: false,
        });
      } else {
        // Next phase exists but has no lessons - treat as last
        setNextLesson({
          id: '',
          title: '',
          phase_id: '',
          phase_title: '',
          is_new_phase: false,
          is_last_lesson: true,
        });
      }
    } catch (err) {
      console.error('Error fetching next lesson:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch next lesson'));
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, phaseId]);

  useEffect(() => {
    fetchNextLesson();
  }, [fetchNextLesson]);

  return {
    nextLesson,
    isLoading,
    error,
    refetch: fetchNextLesson,
  };
};

/**
 * Tactic with completion status for UI
 */
export interface TacticWithStatus {
  id: string;
  lesson_id: string;
  label: string;
  description: string | null;
  is_required: boolean;
  order_index: number;
  tactic_type: 'checkbox' | 'text_input' | 'file_upload' | 'link_submit' | 'reflection';
  reference_url: string | null;
  placeholder_text: string | null;
  is_completed: boolean;
  completed_at: string | null;
  response_data: Record<string, unknown> | null;
  nette_helped: boolean;
}

/**
 * Fetch tactics for a lesson with completion status
 */
export const useLessonTactics = (lessonId: string | undefined) => {
  const { user } = useAuth();
  const [tactics, setTactics] = useState<TacticWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTactics = useCallback(async () => {
    if (!lessonId || !user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all tactics for the lesson
      const { data: tacticsData, error: tacticsError } = await supabase
        .from('gh_lesson_tactics')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });

      if (tacticsError) throw tacticsError;

      // Fetch user's completions
      const { data: completions } = await supabase
        .from('gh_user_tactic_completions')
        .select('*')
        .eq('user_id', user.id)
        .in('tactic_id', tacticsData?.map(t => t.id) || []);

      const completionMap = new Map(completions?.map(c => [c.tactic_id, c]) || []);

      const tacticsWithStatus: TacticWithStatus[] = (tacticsData || []).map(tactic => {
        const completion = completionMap.get(tactic.id);
        return {
          id: tactic.id,
          lesson_id: tactic.lesson_id,
          label: tactic.label,
          description: tactic.description,
          is_required: tactic.is_required,
          order_index: tactic.order_index,
          tactic_type: tactic.tactic_type,
          reference_url: tactic.reference_url,
          placeholder_text: tactic.placeholder_text,
          is_completed: !!completion,
          completed_at: completion?.completed_at ?? null,
          response_data: completion?.response_data ?? null,
          nette_helped: completion?.nette_helped ?? false,
        };
      });

      setTactics(tacticsWithStatus);
    } catch (err) {
      console.error('Error fetching tactics:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch tactics'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, lessonId]);

  useEffect(() => {
    fetchTactics();
  }, [fetchTactics]);

  // Calculate completion stats
  const requiredTactics = tactics.filter(t => t.is_required);
  const completedRequired = requiredTactics.filter(t => t.is_completed).length;
  const totalRequired = requiredTactics.length;
  const allRequiredComplete = totalRequired === 0 || completedRequired === totalRequired;

  const optionalTactics = tactics.filter(t => !t.is_required);
  const completedOptional = optionalTactics.filter(t => t.is_completed).length;
  const totalOptional = optionalTactics.length;

  return {
    tactics,
    isLoading,
    error,
    refetch: fetchTactics,
    // Stats
    completedRequired,
    totalRequired,
    allRequiredComplete,
    completedOptional,
    totalOptional,
  };
};

/**
 * Update video progress for a lesson
 */
export const useUpdateVideoProgress = () => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProgress = useCallback(async (
    lessonId: string,
    watchedPercent: number,
    lastPositionMs: number
  ) => {
    if (!user?.id) return;

    setIsUpdating(true);
    try {
      // Get lesson's required watch percent
      const { data: lesson } = await supabase
        .from('gh_program_lessons')
        .select('required_watch_percent')
        .eq('id', lessonId)
        .single();

      const videoGateMet = watchedPercent >= (lesson?.required_watch_percent ?? 90);

      // First, get the current progress row to check other gate values
      const { data: existingProgress } = await supabase
        .from('gh_user_lesson_progress')
        .select('tactics_gate_met, assessment_gate_met, started_at')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single();

      // Recalculate all_gates_met based on all individual gates
      const tacticsGateMet = existingProgress?.tactics_gate_met ?? true; // Default true if no tactics
      const assessmentGateMet = existingProgress?.assessment_gate_met ?? true; // Default true if no assessment
      const allGatesMet = videoGateMet && tacticsGateMet && assessmentGateMet;

      // Upsert progress with recalculated all_gates_met
      const { error } = await supabase
        .from('gh_user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          video_watched_percent: Math.round(watchedPercent),
          video_last_position_ms: lastPositionMs,
          video_gate_met: videoGateMet,
          all_gates_met: allGatesMet,
          status: 'in_progress',
          last_activity_at: new Date().toISOString(),
          started_at: existingProgress?.started_at || new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id',
          ignoreDuplicates: false,
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error updating video progress:', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id]);

  return {
    updateProgress,
    isUpdating,
  };
};

/**
 * Toggle tactic completion
 */
export const useToggleTactic = () => {
  const { user } = useAuth();
  const [isToggling, setIsToggling] = useState(false);

  const toggleTactic = useCallback(async (
    tacticId: string,
    lessonId: string,
    isCompleting: boolean,
    responseData?: Record<string, unknown>
  ) => {
    if (!user?.id) return;

    setIsToggling(true);
    try {
      // Debug logging
      console.log('[toggleTactic] Attempting to toggle:', {
        userId: user.id,
        tacticId,
        lessonId,
        isCompleting,
      });

      // Pre-flight check #0: Verify Supabase auth session is valid
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      console.log('[toggleTactic] Auth session check:', {
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        matchesContextUser: session?.user?.id === user.id,
        tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A',
      });

      if (!session || session.user?.id !== user.id) {
        console.error('[toggleTactic] AUTH MISMATCH - session user does not match context user');
        throw new Error('Auth session invalid or expired. Please refresh the page.');
      }

      // Pre-flight check #1: Verify the table is accessible
      const { error: tableCheckError } = await supabase
        .from('gh_user_tactic_completions')
        .select('id')
        .limit(0);

      if (tableCheckError) {
        console.error('[toggleTactic] TABLE CHECK FAILED:', tableCheckError);
        console.error('[toggleTactic] The gh_user_tactic_completions table may not exist or RLS is blocking.');
        console.error('[toggleTactic] Run migration: 20260120_014_enrollment_tables.sql');
        throw new Error(`Table access error: ${tableCheckError.message}. Migration may need to be applied.`);
      }
      console.log('[toggleTactic] Table check passed - table is accessible');

      // Pre-flight check #2: Verify the tactic exists in gh_lesson_tactics (FK target)
      const { data: tacticExists, error: tacticCheckError } = await supabase
        .from('gh_lesson_tactics')
        .select('id, label')
        .eq('id', tacticId)
        .single();

      if (tacticCheckError || !tacticExists) {
        console.error('[toggleTactic] TACTIC NOT FOUND in gh_lesson_tactics:', {
          tacticId,
          error: tacticCheckError,
          message: 'FK constraint will fail - tactic_id must exist in gh_lesson_tactics'
        });
        throw new Error(`Tactic ${tacticId} not found in gh_lesson_tactics. FK constraint would fail.`);
      }
      console.log('[toggleTactic] Tactic verified:', { id: tacticExists.id, label: tacticExists.label });

      if (isCompleting) {
        // Insert completion
        const insertData = {
          user_id: user.id,
          tactic_id: tacticId,
          completed_at: new Date().toISOString(),
          response_data: responseData || {},
          nette_helped: false,
        };
        console.log('[toggleTactic] Insert data:', JSON.stringify(insertData, null, 2));

        const { error } = await supabase
          .from('gh_user_tactic_completions')
          .insert(insertData);

        console.log('[toggleTactic] Insert result - error:', error);
        if (error) {
          console.log('[toggleTactic] ERROR DETAILS:', JSON.stringify(error, null, 2));
        }

        if (error && error.code !== '23505') throw error; // Ignore duplicate key
      } else {
        // Delete completion
        const { error } = await supabase
          .from('gh_user_tactic_completions')
          .delete()
          .eq('user_id', user.id)
          .eq('tactic_id', tacticId);

        if (error) throw error;
      }

      // Update lesson progress tactics count
      await updateLessonTacticsProgress(user.id, lessonId);
    } catch (err) {
      // Log full error details for debugging
      const supabaseError = err as { message?: string; code?: string; details?: string; hint?: string; status?: number };

      // Diagnose specific error types
      let diagnosis = 'Unknown error';
      const errMsg = supabaseError.message?.toLowerCase() || '';
      const errCode = supabaseError.code || '';

      if (errMsg.includes('does not exist') || errMsg.includes('relation')) {
        diagnosis = 'TABLE_NOT_FOUND: The gh_user_tactic_completions table may not exist. Run the migration: 20260120_014_enrollment_tables.sql';
      } else if (errCode === '23503' || errMsg.includes('foreign key')) {
        diagnosis = 'FK_VIOLATION: The tactic_id does not exist in gh_lesson_tactics. Verify the tactic exists.';
      } else if (errCode === '42501' || errMsg.includes('permission') || errMsg.includes('policy')) {
        diagnosis = 'RLS_POLICY: Row Level Security is blocking the insert. Check RLS policies on gh_user_tactic_completions.';
      } else if (errCode === '23505') {
        diagnosis = 'DUPLICATE: This tactic completion already exists (should be handled).';
      } else if (errCode === '42P01') {
        diagnosis = 'TABLE_UNDEFINED: Table does not exist in database schema.';
      } else if (errCode === 'PGRST204') {
        diagnosis = 'SCHEMA_CACHE: PostgREST schema cache may be stale. Table may not exist or schema needs refresh.';
      }

      console.error('[toggleTactic] Error diagnosis:', diagnosis);
      console.error('[toggleTactic] Full error details:', {
        message: supabaseError.message,
        code: supabaseError.code,
        details: supabaseError.details,
        hint: supabaseError.hint,
        status: supabaseError.status,
        fullError: err,
      });
      throw err;
    } finally {
      setIsToggling(false);
    }
  }, [user?.id]);

  return {
    toggleTactic,
    isToggling,
  };
};

/**
 * Helper to update lesson progress after tactic change
 */
async function updateLessonTacticsProgress(userId: string, lessonId: string) {
  // Get lesson's tactic counts AND assessment requirement
  const { data: lesson } = await supabase
    .from('gh_program_lessons')
    .select('total_tactics, total_required_tactics, requires_tactics_complete, requires_assessment_pass')
    .eq('id', lessonId)
    .single();

  // Get all tactics for this lesson
  const { data: tactics } = await supabase
    .from('gh_lesson_tactics')
    .select('id, is_required')
    .eq('lesson_id', lessonId);

  // Get completions
  const { data: completions } = await supabase
    .from('gh_user_tactic_completions')
    .select('tactic_id')
    .eq('user_id', userId)
    .in('tactic_id', tactics?.map(t => t.id) || []);

  const completedIds = new Set(completions?.map(c => c.tactic_id) || []);

  const requiredTactics = tactics?.filter(t => t.is_required) || [];
  const completedRequired = requiredTactics.filter(t => completedIds.has(t.id)).length;

  const totalRequired = lesson?.total_required_tactics ?? 0;
  const tacticsGateMet = totalRequired === 0 || completedRequired >= totalRequired;
  const tacticsPercent = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 100;

  // Fetch current progress to get other gate values for recalculating all_gates_met
  const { data: existingProgress } = await supabase
    .from('gh_user_lesson_progress')
    .select('video_gate_met, assessment_gate_met, started_at')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();

  // Recalculate all_gates_met based on all individual gates
  const videoGateMet = existingProgress?.video_gate_met ?? false; // Default false - video must be watched
  // If lesson doesn't require assessment to pass, gate is always met
  // Otherwise use existing progress value (or true as fallback if no progress exists)
  const assessmentGateMet = !lesson?.requires_assessment_pass
    ? true
    : (existingProgress?.assessment_gate_met ?? true);
  const allGatesMet = videoGateMet && tacticsGateMet && assessmentGateMet;

  // Update lesson progress with recalculated all_gates_met
  const upsertData = {
    user_id: userId,
    lesson_id: lessonId,
    tactics_completed_count: completedRequired,
    tactics_required_count: totalRequired,
    tactics_completion_percent: tacticsPercent,
    tactics_gate_met: tacticsGateMet,
    all_gates_met: allGatesMet,
    status: 'in_progress',
    last_activity_at: new Date().toISOString(),
    started_at: existingProgress?.started_at || new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from('gh_user_lesson_progress')
    .upsert(upsertData, {
      onConflict: 'user_id,lesson_id',
      ignoreDuplicates: false,
    });

  if (upsertError) {
    console.error('[updateLessonTacticsProgress] Upsert ERROR:', {
      message: upsertError.message,
      code: upsertError.code,
      details: upsertError.details,
      hint: upsertError.hint,
    });
  } else {
    console.log('[updateLessonTacticsProgress] Upsert SUCCESS - all_gates_met set to:', allGatesMet);
  }
}

/**
 * Mark lesson as complete (validates all gates)
 */
export const useCompleteLesson = () => {
  const { user } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);

  const completeLesson = useCallback(async (lessonId: string): Promise<{ success: boolean; message: string }> => {
    if (!user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    setIsCompleting(true);
    try {
      // Get current lesson progress
      const { data: progress } = await supabase
        .from('gh_user_lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single();

      if (!progress) {
        return { success: false, message: 'Lesson not started' };
      }

      // Get lesson to check if assessment is required
      const { data: lessonConfig } = await supabase
        .from('gh_program_lessons')
        .select('requires_assessment_pass')
        .eq('id', lessonId)
        .single();

      // Check all gates
      if (!progress.video_gate_met) {
        return { success: false, message: 'Watch more of the video to complete this lesson' };
      }
      if (!progress.tactics_gate_met) {
        return { success: false, message: 'Complete all required tactics first' };
      }
      // Only check assessment gate if the lesson requires it
      if (lessonConfig?.requires_assessment_pass && !progress.assessment_gate_met) {
        return { success: false, message: 'Pass the assessment to complete this lesson' };
      }

      // All gates met - mark as complete
      const { error } = await supabase
        .from('gh_user_lesson_progress')
        .update({
          status: 'completed',
          all_gates_met: true,
          completed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId);

      if (error) throw error;

      // Update phase progress
      const { data: lesson } = await supabase
        .from('gh_program_lessons')
        .select('phase_id')
        .eq('id', lessonId)
        .single();

      if (lesson?.phase_id) {
        await updatePhaseProgress(user.id, lesson.phase_id);
      }

      return { success: true, message: 'Lesson completed!' };
    } catch (err) {
      console.error('Error completing lesson:', err);
      return { success: false, message: 'Failed to complete lesson' };
    } finally {
      setIsCompleting(false);
    }
  }, [user?.id]);

  return {
    completeLesson,
    isCompleting,
  };
};

/**
 * Helper to update phase progress after lesson completion
 */
async function updatePhaseProgress(userId: string, phaseId: string) {
  // Get all required lessons in phase
  const { data: lessons } = await supabase
    .from('gh_program_lessons')
    .select('id')
    .eq('phase_id', phaseId)
    .eq('is_required', true);

  // Get completed lessons
  const { data: completedProgress } = await supabase
    .from('gh_user_lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .in('lesson_id', lessons?.map(l => l.id) || []);

  const completedCount = completedProgress?.length ?? 0;
  const totalRequired = lessons?.length ?? 0;
  const phaseComplete = totalRequired > 0 && completedCount >= totalRequired;

  await supabase
    .from('gh_user_phase_progress')
    .upsert({
      user_id: userId,
      phase_id: phaseId,
      completed_lessons: completedCount,
      total_required_lessons: totalRequired,
      progress_percent: totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0,
      status: phaseComplete ? 'completed' : 'in_progress',
      completed_at: phaseComplete ? new Date().toISOString() : null,
      last_activity_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,phase_id',
      ignoreDuplicates: false,
    });
}

export default usePrograms;

// ============================================================================
// FEAT-GH-020: Nette AI Learning Companion Hooks
// ============================================================================
// Hooks for the context-aware AI assistant
// THE KEY DIFFERENTIATOR from Teachable/Thinkific/Kajabi
// ============================================================================

/**
 * Default quick replies that update based on context
 */
const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  { id: 'explain', label: 'Explain that again', prompt: 'Can you explain that in a different way?' },
  { id: 'example', label: 'Give me an example', prompt: 'Can you give me a practical example?' },
  { id: 'help-tactic', label: 'Help with current tactic', prompt: 'I need help completing the current tactic.' },
];

/**
 * Generate context-aware quick replies based on current lesson/tactic
 */
function generateQuickReplies(context: NetteChatContext): QuickReply[] {
  const replies: QuickReply[] = [...DEFAULT_QUICK_REPLIES];

  if (context.tacticLabel) {
    replies[2] = {
      id: 'help-tactic',
      label: `Help with: ${context.tacticLabel.slice(0, 25)}${context.tacticLabel.length > 25 ? '...' : ''}`,
      prompt: `I need help with this tactic: "${context.tacticLabel}"`,
    };
  }

  if (context.videoTimestamp && context.videoTimestamp > 0) {
    const minutes = Math.floor(context.videoTimestamp / 60);
    const seconds = context.videoTimestamp % 60;
    replies.unshift({
      id: 'video-moment',
      label: `About ${minutes}:${seconds.toString().padStart(2, '0')}`,
      prompt: `I have a question about what was discussed at ${minutes}:${seconds.toString().padStart(2, '0')} in the video.`,
    });
  }

  return replies.slice(0, 4); // Max 4 quick replies
}

/**
 * Simulated AI response (will be replaced with actual N8n webhook later)
 */
async function simulateAIResponse(
  message: string,
  context: NetteChatContext
): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  // Generate context-aware response
  const contextInfo = [];
  if (context.lessonTitle) contextInfo.push(`lesson "${context.lessonTitle}"`);
  if (context.tacticLabel) contextInfo.push(`tactic "${context.tacticLabel}"`);
  if (context.phaseTitle) contextInfo.push(`phase "${context.phaseTitle}"`);

  const contextStr = contextInfo.length > 0
    ? `I can see you're working on ${contextInfo.join(' in ')}.`
    : '';

  // Simulated responses based on common queries
  if (message.toLowerCase().includes('help') || message.toLowerCase().includes('stuck')) {
    return `${contextStr} I'm here to help! Let's break this down step by step. What specific part are you finding challenging? I can explain concepts differently, provide examples, or walk you through the process.`;
  }

  if (message.toLowerCase().includes('explain')) {
    return `${contextStr} Of course! Think of it this way: the key concept here is about taking consistent action. Just like building a muscle, progress comes from repeated small efforts. Would you like me to give you a specific example from your industry?`;
  }

  if (message.toLowerCase().includes('example')) {
    return `${contextStr} Here's a real-world example: Imagine you're a real estate investor looking at a property. Instead of getting overwhelmed by the entire deal, break it down: First, analyze the numbers. Then, assess the location. Finally, evaluate the exit strategy. Each step builds on the last. Does that help clarify things?`;
  }

  if (message.toLowerCase().includes('tactic')) {
    return `${contextStr} For this tactic, focus on the ACTION part first. Don't overthink it - just start. Remember, completion beats perfection. What's the ONE thing you could do right now to make progress on this?`;
  }

  // Default helpful response
  return `${contextStr} That's a great question! Based on what you're learning, I'd suggest focusing on practical application. The concepts in this lesson are designed to be immediately actionable. Would you like me to help you create a simple action plan?`;
}

/**
 * Hook to manage Nette conversation state
 * Simulates conversation storage (will use Supabase later)
 */
export const useNetteConversation = (lessonId?: string) => {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<NetteConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createConversation = useCallback(async (context: NetteChatContext): Promise<NetteConversation> => {
    const newConversation: NetteConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user?.id || 'anonymous',
      lesson_id: context.lessonId,
      started_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      message_count: 0,
      context: {
        current_lesson_id: context.lessonId,
        video_timestamp: context.videoTimestamp,
        tactic_id: context.tacticId,
        phase_id: context.phaseId,
      },
    };

    setConversation(newConversation);
    return newConversation;
  }, [user?.id]);

  const updateContext = useCallback((updates: Partial<NetteChatContext>) => {
    if (conversation) {
      setConversation({
        ...conversation,
        context: {
          ...conversation.context,
          current_lesson_id: updates.lessonId || conversation.context.current_lesson_id,
          video_timestamp: updates.videoTimestamp ?? conversation.context.video_timestamp,
          tactic_id: updates.tacticId || conversation.context.tactic_id,
          phase_id: updates.phaseId || conversation.context.phase_id,
        },
      });
    }
  }, [conversation]);

  return {
    conversation,
    isLoading,
    createConversation,
    updateContext,
  };
};

/**
 * Hook to manage Nette messages
 * Simulates message storage and AI responses
 */
export const useNetteMessages = (conversationId: string | undefined) => {
  const [messages, setMessages] = useState<NetteMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with welcome message
  useEffect(() => {
    if (conversationId && messages.length === 0) {
      const welcomeMessage: NetteMessage = {
        id: `msg_welcome_${conversationId}`,
        conversation_id: conversationId,
        role: 'assistant',
        content: "Hi! I'm Nette, your learning companion. I'm here to help you understand concepts, complete tactics, and make the most of your learning journey. What can I help you with?",
        metadata: {},
        created_at: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, [conversationId, messages.length]);

  return {
    messages,
    setMessages,
    isLoading,
  };
};

/**
 * Hook to send messages to Nette AI
 * Returns simulated AI responses (will connect to N8n webhook later)
 */
export const useSendNetteMessage = () => {
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    context: NetteChatContext,
    currentMessages: NetteMessage[],
    setMessages: React.Dispatch<React.SetStateAction<NetteMessage[]>>
  ): Promise<NetteMessage | null> => {
    setIsSending(true);

    try {
      // Add user message immediately
      const userMessage: NetteMessage = {
        id: `msg_${Date.now()}_user`,
        conversation_id: conversationId,
        role: 'user',
        content,
        metadata: {
          video_timestamp: context.videoTimestamp,
          tactic_id: context.tacticId,
          lesson_reference: context.lessonId,
        },
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Get AI response (simulated for now)
      const aiResponseContent = await simulateAIResponse(content, context);

      const aiMessage: NetteMessage = {
        id: `msg_${Date.now()}_assistant`,
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponseContent,
        metadata: {
          video_timestamp: context.videoTimestamp,
          lesson_reference: context.lessonId,
        },
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);

      return aiMessage;
    } catch (error) {
      console.error('Error sending Nette message:', error);
      return null;
    } finally {
      setIsSending(false);
    }
  }, []);

  return {
    sendMessage,
    isSending,
  };
};

/**
 * Hook to manage quick replies
 */
export const useNetteQuickReplies = (context: NetteChatContext) => {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);

  useEffect(() => {
    setQuickReplies(generateQuickReplies(context));
  }, [context.lessonId, context.tacticId, context.tacticLabel, context.videoTimestamp]);

  return { quickReplies };
};

/**
 * Hook to manage user insights
 * Simulates storage (will use Supabase later)
 */
export const useUserInsights = (lessonId?: string) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<UserInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simulated fetch - would query Supabase
  useEffect(() => {
    if (user?.id) {
      // In real implementation, fetch from Supabase
      setInsights([]);
    }
  }, [user?.id, lessonId]);

  return {
    insights,
    isLoading,
  };
};

/**
 * Hook to capture user insights
 */
export const useCaptureInsight = () => {
  const { user } = useAuth();
  const [isCapturing, setIsCapturing] = useState(false);

  const captureInsight = useCallback(async (
    insightText: string,
    insightType: UserInsight['insight_type'],
    lessonId?: string,
    conversationId?: string
  ): Promise<UserInsight | null> => {
    if (!user?.id) return null;

    setIsCapturing(true);
    try {
      // Simulated - would insert into Supabase
      const insight: UserInsight = {
        id: `insight_${Date.now()}`,
        user_id: user.id,
        lesson_id: lessonId,
        conversation_id: conversationId,
        insight_text: insightText,
        insight_type: insightType,
        captured_at: new Date().toISOString(),
      };

      // In real implementation, would insert to Supabase
      console.log('Insight captured:', insight);

      return insight;
    } catch (error) {
      console.error('Error capturing insight:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [user?.id]);

  return {
    captureInsight,
    isCapturing,
  };
};

/**
 * Hook to manage support escalations (for coaches)
 */
export const usePendingEscalations = (programId?: string) => {
  const { user } = useAuth();
  const [escalations, setEscalations] = useState<SupportEscalation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simulated fetch - would query Supabase with admin check
  useEffect(() => {
    if (user?.id) {
      // In real implementation, fetch from Supabase
      setEscalations([]);
    }
  }, [user?.id, programId]);

  return {
    escalations,
    isLoading,
    count: escalations.filter(e => e.status === 'open').length,
  };
};

/**
 * Hook to create support escalation
 */
export const useCreateEscalation = () => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const createEscalation = useCallback(async (
    conversationId: string,
    lessonId: string | undefined,
    aiSummary: string,
    contextSnapshot: Record<string, unknown>,
    priority: SupportEscalation['priority'] = 'normal'
  ): Promise<SupportEscalation | null> => {
    if (!user?.id) return null;

    setIsCreating(true);
    try {
      const escalation: SupportEscalation = {
        id: `esc_${Date.now()}`,
        user_id: user.id,
        conversation_id: conversationId,
        lesson_id: lessonId,
        status: 'open',
        priority,
        ai_summary: aiSummary,
        context_snapshot: contextSnapshot,
        created_at: new Date().toISOString(),
      };

      // In real implementation, would insert to Supabase
      console.log('Escalation created:', escalation);

      return escalation;
    } catch (error) {
      console.error('Error creating escalation:', error);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [user?.id]);

  return {
    createEscalation,
    isCreating,
  };
};

/**
 * Hook to resolve escalation
 */
export const useResolveEscalation = () => {
  const [isResolving, setIsResolving] = useState(false);

  const resolveEscalation = useCallback(async (
    escalationId: string,
    status: 'resolved' | 'closed' = 'resolved'
  ): Promise<boolean> => {
    setIsResolving(true);
    try {
      // In real implementation, would update in Supabase
      console.log('Escalation resolved:', escalationId, status);
      return true;
    } catch (error) {
      console.error('Error resolving escalation:', error);
      return false;
    } finally {
      setIsResolving(false);
    }
  }, []);

  return {
    resolveEscalation,
    isResolving,
  };
};

/**
 * Hook to track proactive triggers
 */
export const useProactiveTriggers = (userId: string | undefined, lessonId?: string) => {
  const [trigger, setTrigger] = useState<{
    type: string;
    message: string;
  } | null>(null);

  // Simulated trigger detection - would be based on real behavior analysis
  useEffect(() => {
    // In real implementation, this would analyze:
    // - Video rewind patterns
    // - Tactic stagnation (stuck on same tactic for too long)
    // - Lesson return patterns (coming back to same lesson multiple times)
    // - Stuck detection from progress data
    setTrigger(null);
  }, [userId, lessonId]);

  const clearTrigger = useCallback(() => {
    setTrigger(null);
  }, []);

  return {
    trigger,
    clearTrigger,
  };
};
