// ============================================================================
// FEAT-GH-013: Lesson Page
// ============================================================================
// Core lesson execution environment with video + tactics + completion gates
// Two-column layout on desktop, single column with bottom sheet on mobile
// ============================================================================

import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { NetteSlideover } from '@/components/nette/NetteSlideover';
import type { NetteChatContext } from '@/types/programs';
import {
  VideoPane,
  VideoPaneSkeleton,
  TacticsChecklist,
  TacticsChecklistSkeleton,
  TacticsSummaryInline,
  CompletionRulesCard,
  CompletionRulesCardSkeleton,
  CompletionButton,
  CompletionButtonSkeleton,
  LessonBreadcrumb,
  LessonBreadcrumbSkeleton,
  LessonBackButton,
} from '@/components/lessons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AlertCircle, Lock, ChevronUp, FileText, ExternalLink } from 'lucide-react';
import {
  useLesson,
  useLessonTactics,
  useUpdateVideoProgress,
  useToggleTactic,
  useCompleteLesson,
  useNextLesson,
  type TacticWithStatus,
} from '@/hooks/usePrograms';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * LessonPage - The core lesson execution environment
 * Supports video, tactics (THE KEY DIFFERENTIATOR!), and assessment gates
 */
const LessonPage = () => {
  const { programId, lessonId } = useParams<{ programId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [togglingTacticId, setTogglingTacticId] = useState<string | null>(null);

  // Nette slide-over state for contextual help
  const [netteSlideoverOpen, setNetteSlideoverOpen] = useState(false);
  const [netteContext, setNetteContext] = useState<NetteChatContext | undefined>(undefined);
  const [netteInitialMessage, setNetteInitialMessage] = useState<string | undefined>(undefined);

  // Fetch lesson data
  const {
    lesson,
    isLoading: lessonLoading,
    error: lessonError,
    refetch: refetchLesson,
  } = useLesson(lessonId);

  // Fetch tactics for the lesson
  const {
    tactics,
    isLoading: tacticsLoading,
    completedRequired,
    totalRequired,
    allRequiredComplete,
    refetch: refetchTactics,
  } = useLessonTactics(lessonId);

  // Mutations
  const { updateProgress } = useUpdateVideoProgress();
  const { toggleTactic, isToggling } = useToggleTactic();
  const { completeLesson, isCompleting } = useCompleteLesson();

  // Next lesson navigation
  const {
    nextLesson,
    isLoading: nextLessonLoading,
  } = useNextLesson(lessonId, lesson?.phase_id);

  // Handle video progress update
  const handleVideoProgress = useCallback(
    async (percent: number, positionMs: number) => {
      if (!lessonId) return;
      try {
        await updateProgress(lessonId, percent, positionMs);
        // Refetch lesson to update gates
        refetchLesson();
      } catch {
        // Silent fail for progress updates
      }
    },
    [lessonId, updateProgress, refetchLesson]
  );

  // Handle tactic toggle - signature matches TacticsChecklist prop: (tacticId: string, completed: boolean)
  const handleTacticToggle = useCallback(
    async (tacticId: string, completed: boolean) => {
      if (!lessonId) return;

      setTogglingTacticId(tacticId);
      try {
        await toggleTactic(tacticId, lessonId, completed);
        // Refetch both tactics and lesson (for gates)
        await Promise.all([refetchTactics(), refetchLesson()]);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to update tactic. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setTogglingTacticId(null);
      }
    },
    [lessonId, toggleTactic, refetchTactics, refetchLesson, toast]
  );

  // Handle tactic help click - Opens Nette slide-over with context
  // Signature matches TacticsChecklist prop: (tacticId: string) => void
  const handleTacticHelp = useCallback((tacticId: string) => {
    // Find the tactic by ID to get its label for context
    const tactic = tactics.find(t => t.id === tacticId);

    // Build context for Nette
    const context: NetteChatContext = {
      tacticId: tacticId,
      tacticLabel: tactic?.label,
      lessonId: lessonId,
      lessonTitle: lesson?.title,
      phaseId: lesson?.phase_id,
      phaseTitle: lesson?.phase_title,
      programId: programId,
      programTitle: lesson?.program_title,
    };

    // Set context and initial message
    setNetteContext(context);
    setNetteInitialMessage(
      tactic?.label
        ? `Help me with this action item: "${tactic.label}"`
        : 'Help me with this action item'
    );

    // Open the slide-over
    setNetteSlideoverOpen(true);
  }, [tactics, lessonId, lesson, programId]);

  // Handle lesson completion
  const handleComplete = useCallback(async () => {
    if (!lessonId) return;

    try {
      const result = await completeLesson(lessonId);
      if (result.success) {
        toast({
          title: 'Lesson Complete!',
          description: 'Great work! Continue to the next lesson.',
        });
        // Refetch lesson to update status
        refetchLesson();
      } else {
        toast({
          title: 'Cannot Complete',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to complete lesson. Please try again.',
        variant: 'destructive',
      });
    }
  }, [lessonId, completeLesson, refetchLesson, toast]);

  // Handle back navigation
  const handleBack = () => {
    if (lesson) {
      navigate(`/programs/${programId}/phases/${lesson.phase_id}`);
    } else {
      navigate(`/programs/${programId}`);
    }
  };

  // Handle continue to next lesson
  const handleContinue = useCallback(() => {
    if (nextLesson && programId) {
      navigate(`/programs/${programId}/lessons/${nextLesson.id}`);
    }
  }, [nextLesson, programId, navigate]);

  // Error state
  if (lessonError) {
    return (
      <SidebarLayout>
        <div className="container max-w-6xl py-8 px-4 md:px-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {lessonError.message || 'Unable to load lesson'}
            </AlertDescription>
          </Alert>
          <Button variant="outline" onClick={handleBack} className="mt-4">
            Back to Phase
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  // Locked state
  if (lesson && !lesson.is_unlocked) {
    return (
      <SidebarLayout>
        <div className="container max-w-6xl py-8 px-4 md:px-6">
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Lesson Locked</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              {lesson.unlock_reason || 'Complete the previous lessons to unlock this one.'}
            </p>
            <Button onClick={handleBack} className="mt-4">
              Back to Phase
            </Button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const isLoading = lessonLoading || tacticsLoading;
  const isCompleted = lesson?.status === 'completed';
  const hasVideo = !!lesson?.video_url;
  const hasTactics = tactics.length > 0;
  const hasAssessment = lesson?.has_assessment ?? false;
  const assessmentRequired = lesson?.requires_assessment_pass ?? false;

  // Build gates object for completion components
  const gates = {
    video_gate_met: lesson?.video_gate_met ?? false,
    tactics_gate_met: lesson?.tactics_gate_met ?? true,
    assessment_gate_met: lesson?.assessment_gate_met ?? true,
    all_gates_met: lesson?.all_gates_met ?? false,
  };

  return (
    <SidebarLayout>
      <div className="container max-w-6xl py-4 md:py-8 px-4 md:px-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          {isLoading ? (
            <LessonBreadcrumbSkeleton />
          ) : (
            <>
              {/* Mobile: Back button */}
              <div className="md:hidden">
                <LessonBackButton
                  programId={programId || ''}
                  phaseId={lesson?.phase_id || ''}
                  phaseTitle={lesson?.phase_title}
                />
              </div>
              {/* Desktop: Full breadcrumb */}
              <div className="hidden md:block">
                <LessonBreadcrumb
                  programId={programId || ''}
                  programTitle={lesson?.program_title}
                  phaseId={lesson?.phase_id || ''}
                  phaseTitle={lesson?.phase_title}
                  lessonTitle={lesson?.title}
                />
              </div>
            </>
          )}
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Video + Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            {isLoading ? (
              <VideoPaneSkeleton />
            ) : hasVideo ? (
              <VideoPane
                videoUrl={lesson?.video_url || null}
                videoProvider={lesson?.video_provider || null}
                videoDurationSeconds={lesson?.video_duration_seconds || null}
                lastPositionMs={lesson?.video_last_position_ms || 0}
                watchedPercent={lesson?.video_watched_percent || 0}
                requiredWatchPercent={lesson?.required_watch_percent || 90}
                onProgressUpdate={handleVideoProgress}
                isCompleted={isCompleted}
              />
            ) : lesson?.content_html ? (
              // Text content if no video
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Lesson Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: lesson.content_html }}
                  />
                </CardContent>
              </Card>
            ) : null}

            {/* Lesson Title & Description (Desktop) */}
            <div className="hidden lg:block space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold">{lesson?.title}</h1>
                  {lesson?.description && (
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: lesson.description }}
                    />
                  )}
                </>
              )}
            </div>

            {/* Mobile: Title, Description, and Tactics Summary */}
            <div className="lg:hidden space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-7 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold">{lesson?.title}</h1>
                  {lesson?.description && (
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: lesson.description }}
                    />
                  )}
                </>
              )}

              {/* Tactics Summary Card (Mobile) - Opens Bottom Sheet */}
              {hasTactics && (
                <Sheet open={bottomSheetOpen} onOpenChange={setBottomSheetOpen}>
                  <SheetTrigger asChild>
                    <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          {isLoading ? (
                            <Skeleton className="h-5 w-40" />
                          ) : (
                            <TacticsSummaryInline
                              completedRequired={completedRequired}
                              totalRequired={totalRequired}
                              allRequiredComplete={allRequiredComplete}
                            />
                          )}
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh]">
                    <SheetHeader className="pb-4">
                      <SheetTitle>Tactics</SheetTitle>
                    </SheetHeader>
                    <div className="overflow-y-auto max-h-[calc(85vh-120px)]">
                      <TacticsChecklist
                        tactics={tactics}
                        onToggle={handleTacticToggle}
                        onHelpClick={handleTacticHelp}
                        togglingTacticId={togglingTacticId}
                        disabled={isToggling}
                        isLoading={tacticsLoading}
                      />
                    </div>
                    {/* Completion Button in Sheet */}
                    <div className="pt-4 border-t mt-4">
                      {isLoading ? (
                        <CompletionButtonSkeleton />
                      ) : (
                        <CompletionButton
                          gates={gates}
                          isCompleted={isCompleted}
                          isCompleting={isCompleting}
                          onComplete={handleComplete}
                          onContinue={handleContinue}
                          nextLesson={nextLesson}
                          isLoadingNextLesson={nextLessonLoading}
                          hasVideo={hasVideo}
                          hasTactics={hasTactics}
                          hasAssessment={hasAssessment}
                          assessmentRequired={assessmentRequired}
                        />
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>

            {/* Mobile: Completion Rules & Button (when no tactics) */}
            {!hasTactics && (
              <div className="lg:hidden space-y-4">
                {isLoading ? (
                  <>
                    <CompletionRulesCardSkeleton />
                    <CompletionButtonSkeleton />
                  </>
                ) : (
                  <>
                    <CompletionRulesCard
                      gates={gates}
                      hasVideo={hasVideo}
                      videoWatchedPercent={lesson?.video_watched_percent || 0}
                      requiredWatchPercent={lesson?.required_watch_percent || 90}
                      hasTactics={false}
                      tacticsCompletedCount={0}
                      tacticsRequiredCount={0}
                      hasAssessment={hasAssessment}
                      assessmentRequired={assessmentRequired}
                      assessmentStatus={lesson?.assessment_status}
                      assessmentScore={lesson?.assessment_score}
                      passingScore={lesson?.assessment_passing_score}
                    />
                    <CompletionButton
                      gates={gates}
                      isCompleted={isCompleted}
                      isCompleting={isCompleting}
                      onComplete={handleComplete}
                      onContinue={handleContinue}
                      nextLesson={nextLesson}
                      isLoadingNextLesson={nextLessonLoading}
                      hasVideo={hasVideo}
                      hasTactics={false}
                      hasAssessment={hasAssessment}
                      assessmentRequired={assessmentRequired}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Execution Pane (Desktop Only) */}
          <div className="hidden lg:block space-y-6">
            {/* Tactics Checklist */}
            {hasTactics && (
              isLoading ? (
                <TacticsChecklistSkeleton />
              ) : (
                <TacticsChecklist
                  tactics={tactics}
                  onToggle={handleTacticToggle}
                  onHelpClick={handleTacticHelp}
                  togglingTacticId={togglingTacticId}
                  disabled={isToggling}
                />
              )
            )}

            {/* Completion Rules Card */}
            {isLoading ? (
              <CompletionRulesCardSkeleton />
            ) : (
              <CompletionRulesCard
                gates={gates}
                hasVideo={hasVideo}
                videoWatchedPercent={lesson?.video_watched_percent || 0}
                requiredWatchPercent={lesson?.required_watch_percent || 90}
                hasTactics={hasTactics}
                tacticsCompletedCount={completedRequired}
                tacticsRequiredCount={totalRequired}
                hasAssessment={hasAssessment}
                assessmentRequired={assessmentRequired}
                assessmentStatus={lesson?.assessment_status}
                assessmentScore={lesson?.assessment_score}
                passingScore={lesson?.assessment_passing_score}
              />
            )}

            {/* Completion Button */}
            {isLoading ? (
              <CompletionButtonSkeleton />
            ) : (
              <CompletionButton
                gates={gates}
                isCompleted={isCompleted}
                isCompleting={isCompleting}
                onComplete={handleComplete}
                onContinue={handleContinue}
                nextLesson={nextLesson}
                isLoadingNextLesson={nextLessonLoading}
                hasVideo={hasVideo}
                hasTactics={hasTactics}
                hasAssessment={hasAssessment}
                assessmentRequired={assessmentRequired}
              />
            )}

            {/* Resources Section (if any) */}
            {lesson?.content_html && hasVideo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Additional Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: lesson.content_html }}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Nette AI Slide-over for contextual help */}
      <NetteSlideover
        open={netteSlideoverOpen}
        onOpenChange={setNetteSlideoverOpen}
        context={netteContext}
        lessonId={lessonId}
        initialMessage={netteInitialMessage}
      />
    </SidebarLayout>
  );
};

export default LessonPage;
