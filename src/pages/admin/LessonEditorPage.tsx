// ============================================================================
// FEAT-GH-016: Admin Lesson Editor Page
// ============================================================================
// Full lesson editor with tabbed interface for content, tactics, assessment, and settings
// Route: /admin/programs/:programId/lessons/:lessonId/edit
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TabsContent } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  useAdminLesson,
  useUpdateLessonContent,
} from '@/hooks/useAdminPrograms';
import {
  LessonEditorTabs,
  ContentTab,
  TacticsTab,
  AssessmentTab,
  CompletionRulesTab,
  PreviewButton,
} from '@/components/admin/lesson-editor';
import type { LessonEditorTab } from '@/components/admin/lesson-editor';
import type { LessonContentUpdate } from '@/types/programs';

// ============================================================================
// Status Badge Component
// ============================================================================

const StatusBadge = ({ status }: { status: 'draft' | 'published' }) => {
  if (status === 'draft') {
    return (
      <Badge variant="secondary" className="gap-1">
        <EyeOff className="h-3 w-3" />
        Draft
      </Badge>
    );
  }
  return (
    <Badge variant="default" className="gap-1">
      <Eye className="h-3 w-3" />
      Published
    </Badge>
  );
};

// ============================================================================
// Save Status Component
// ============================================================================

interface SaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
}

const SaveStatus = ({ status, lastSaved }: SaveStatusProps) => {
  if (status === 'saving') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Saving...
      </div>
    );
  }

  if (status === 'saved') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        All changes saved
        {lastSaved && (
          <span className="text-muted-foreground">
            {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <AlertCircle className="h-4 w-4" />
        Error saving changes
      </div>
    );
  }

  return null;
};

// ============================================================================
// Header Skeleton
// ============================================================================

const HeaderSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-64" />
    <div className="flex items-center gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-5 w-20" />
    </div>
    <Skeleton className="h-4 w-96" />
  </div>
);

// ============================================================================
// Preview Tab Content
// ============================================================================

interface PreviewTabContentProps {
  programId: string;
  lessonId: string;
  status: 'draft' | 'published';
}

const PreviewTabContent = ({ programId, lessonId, status }: PreviewTabContentProps) => {
  const previewUrl = `/programs/${programId}/lessons/${lessonId}`;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-6 text-center">
        <ExternalLink className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Preview Lesson</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          Open the lesson in a new tab to see how it will appear to learners.
          {status === 'draft' && (
            <span className="block mt-2 text-yellow-600">
              Note: This lesson is still in draft mode and not visible to learners.
            </span>
          )}
        </p>
        <Button asChild>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Preview
          </a>
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const LessonEditorPage = () => {
  const { programId, lessonId } = useParams<{
    programId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();

  // Fetch lesson data
  const {
    lesson,
    isLoading,
    error,
    refetch: refetchLesson,
  } = useAdminLesson(lessonId);

  // Update mutation
  const { updateLessonContent, isUpdating } = useUpdateLessonContent();

  // Local state
  const [activeTab, setActiveTab] = useState<LessonEditorTab>('content');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState<LessonContentUpdate>({});

  // Debounce timer ref
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save function
  const debouncedSave = useCallback(
    async (changes: LessonContentUpdate) => {
      if (!lessonId || Object.keys(changes).length === 0) return;

      setSaveStatus('saving');

      const success = await updateLessonContent(lessonId, changes);

      if (success) {
        setSaveStatus('saved');
        setLastSaved(new Date());
        setPendingChanges({});
        // Refetch to get updated data
        refetchLesson();
      } else {
        setSaveStatus('error');
      }

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
      }, 3000);
    },
    [lessonId, updateLessonContent, refetchLesson]
  );

  // Handle content update with debounce
  const handleContentUpdate = useCallback(
    (data: LessonContentUpdate) => {
      // Merge with pending changes
      setPendingChanges((prev) => ({ ...prev, ...data }));

      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Set new timer for debounced save
      saveTimerRef.current = setTimeout(() => {
        debouncedSave({ ...pendingChanges, ...data });
      }, 1000); // 1 second debounce
    },
    [debouncedSave, pendingChanges]
  );

  // Manual save
  const handleManualSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    if (Object.keys(pendingChanges).length > 0) {
      await debouncedSave(pendingChanges);
    }
  }, [debouncedSave, pendingChanges]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Publish/Unpublish handler
  const handleStatusToggle = async () => {
    if (!lesson || !lessonId) return;

    const newStatus = lesson.status === 'published' ? 'draft' : 'published';
    setSaveStatus('saving');

    const success = await updateLessonContent(lessonId, { status: newStatus });

    if (success) {
      setSaveStatus('saved');
      setLastSaved(new Date());
      refetchLesson();
    } else {
      setSaveStatus('error');
    }
  };

  // Not found state
  if (!isLoading && !lesson && lessonId) {
    return (
      <SidebarLayout mode="admin">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-xl font-semibold mb-2">Lesson Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The lesson you're looking for doesn't exist or you don't have access.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/programs/${programId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Program
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <SidebarLayout mode="admin">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Lesson</h2>
          <p className="text-muted-foreground mb-4">
            {error.message}
          </p>
          <Button variant="outline" onClick={() => refetchLesson()}>
            Try Again
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout mode="admin">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/admin/programs">Programs</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={`/admin/programs/${programId}`}>
                    {lesson?.program_title || 'Program'}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={`/admin/programs/${programId}/phases/${lesson?.phase_id}`}>
                    {lesson?.phase_title || 'Phase'}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <BreadcrumbPage>{lesson?.title || 'Lesson'}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() =>
            navigate(`/admin/programs/${programId}/phases/${lesson?.phase_id}`)
          }
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Phase
        </Button>

        {/* Page Header */}
        {isLoading ? (
          <HeaderSkeleton />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  Lesson {(lesson?.order_index || 0) + 1}
                </Badge>
                <h1 className="text-2xl font-bold tracking-tight">
                  {lesson?.title}
                </h1>
                {lesson && <StatusBadge status={lesson.status} />}
              </div>
              {lesson?.description && (
                <p className="text-muted-foreground max-w-xl line-clamp-2">
                  {lesson.description}
                </p>
              )}
              <SaveStatus status={saveStatus} lastSaved={lastSaved} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Manual Save Button */}
              {Object.keys(pendingChanges).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualSave}
                  disabled={isUpdating}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Now
                </Button>
              )}

              {/* Preview Button */}
              {lesson && programId && lessonId && (
                <PreviewButton
                  programId={programId}
                  lessonId={lessonId}
                  status={lesson.status}
                  variant="outline"
                />
              )}

              {/* Publish/Unpublish Button */}
              {lesson && (
                <Button
                  onClick={handleStatusToggle}
                  disabled={isUpdating}
                  variant={lesson.status === 'published' ? 'secondary' : 'default'}
                >
                  {lesson.status === 'published' ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Publish
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tabbed Content */}
        {!isLoading && lesson && (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <LessonEditorTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tacticsCount={lesson.tactics.length}
              hasUnsavedChanges={Object.keys(pendingChanges).length > 0}
            />

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'content' && (
                <ContentTab
                  lesson={lesson}
                  onUpdate={handleContentUpdate}
                  isSaving={isUpdating}
                />
              )}

              {activeTab === 'tactics' && programId && (
                <TacticsTab
                  lessonId={lesson.id}
                  programId={programId}
                  tactics={lesson.tactics}
                  onRefresh={refetchLesson}
                  isLoading={false}
                />
              )}

              {activeTab === 'assessment' && (
                <AssessmentTab
                  lesson={lesson}
                  onUpdate={handleContentUpdate}
                  isSaving={isUpdating}
                />
              )}

              {activeTab === 'completion' && (
                <CompletionRulesTab
                  lesson={lesson}
                  onUpdate={handleContentUpdate}
                  isSaving={isUpdating}
                />
              )}

              {activeTab === 'preview' && programId && lessonId && (
                <PreviewTabContent
                  programId={programId}
                  lessonId={lessonId}
                  status={lesson.status}
                />
              )}
            </div>
          </div>
        )}

        {/* Loading State for Content */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default LessonEditorPage;
