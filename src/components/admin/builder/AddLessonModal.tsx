// ============================================================================
// FEAT-GH-015: Add Lesson Modal Component
// ============================================================================
// Create new lesson dialog
// ============================================================================

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Plus,
  Video,
  FileText,
  Headphones,
  ClipboardCheck,
} from 'lucide-react';
import { useCreateLesson } from '@/hooks/useAdminPrograms';
import type { LessonFormData } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface AddLessonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseId: string;
  onSuccess?: (lessonId: string) => void;
}

type LessonType = 'video' | 'text' | 'audio' | 'assessment';

// ============================================================================
// Lesson Type Options
// ============================================================================

const lessonTypeOptions: {
  value: LessonType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: 'video',
    label: 'Video',
    icon: <Video className="h-4 w-4" />,
    description: 'Video lesson with progress tracking',
  },
  {
    value: 'text',
    label: 'Text/Article',
    icon: <FileText className="h-4 w-4" />,
    description: 'Written content and resources',
  },
  {
    value: 'audio',
    label: 'Audio',
    icon: <Headphones className="h-4 w-4" />,
    description: 'Podcast or audio lesson',
  },
  {
    value: 'assessment',
    label: 'Assessment',
    icon: <ClipboardCheck className="h-4 w-4" />,
    description: 'Quiz or test',
  },
];

// ============================================================================
// Main Component
// ============================================================================

export const AddLessonModal = ({
  open,
  onOpenChange,
  phaseId,
  onSuccess,
}: AddLessonModalProps) => {
  const { createLesson, isCreating } = useCreateLesson();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lessonType, setLessonType] = useState<LessonType>('video');
  const [isRequired, setIsRequired] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [requiredWatchPercent, setRequiredWatchPercent] = useState('80');
  const [hasAssessment, setHasAssessment] = useState(false);
  const [requiresAssessmentPass, setRequiresAssessmentPass] = useState(false);

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLessonType('video');
    setIsRequired(true);
    setVideoUrl('');
    setRequiredWatchPercent('80');
    setHasAssessment(false);
    setRequiresAssessmentPass(false);
  };

  // Handle close
  const handleClose = () => {
    if (!isCreating) {
      resetForm();
      onOpenChange(false);
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    const data: LessonFormData = {
      title: title.trim(),
      description: description.trim() || undefined,
      lesson_type: lessonType,
      is_required: isRequired,
      video_url: videoUrl.trim() || undefined,
      required_watch_percent: requiredWatchPercent
        ? parseInt(requiredWatchPercent, 10)
        : 80,
      has_assessment: hasAssessment,
      requires_assessment_pass: requiresAssessmentPass,
      status: 'draft',
    };

    const lessonId = await createLesson(phaseId, data);

    if (lessonId) {
      resetForm();
      onOpenChange(false);
      onSuccess?.(lessonId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Lesson</DialogTitle>
            <DialogDescription>
              Create a new lesson for this phase. You can add content and
              tactics after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="lesson-title">
                Lesson Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lesson-title"
                placeholder="e.g., Introduction to Group Home Licensing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isCreating}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="lesson-desc">Description</Label>
              <Textarea
                id="lesson-desc"
                placeholder="Brief overview of what this lesson covers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isCreating}
                rows={2}
              />
            </div>

            {/* Lesson Type */}
            <div className="space-y-2">
              <Label htmlFor="lesson-type">Lesson Type</Label>
              <Select
                value={lessonType}
                onValueChange={(v) => setLessonType(v as LessonType)}
                disabled={isCreating}
              >
                <SelectTrigger id="lesson-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lessonTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {lessonTypeOptions.find((o) => o.value === lessonType)?.description}
              </p>
            </div>

            {/* Video URL (for video type) */}
            {lessonType === 'video' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="video-url">Video URL (Optional)</Label>
                  <Input
                    id="video-url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    disabled={isCreating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports YouTube, Vimeo, Wistia, Bunny CDN
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="watch-percent">
                    Required Watch Percentage
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="watch-percent"
                      type="number"
                      min="0"
                      max="100"
                      value={requiredWatchPercent}
                      onChange={(e) => setRequiredWatchPercent(e.target.value)}
                      disabled={isCreating}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Learners must watch this percentage to complete the lesson
                  </p>
                </div>
              </>
            )}

            {/* Required Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Required Lesson</Label>
                <p className="text-sm text-muted-foreground">
                  Learners must complete this to progress
                </p>
              </div>
              <Switch
                checked={isRequired}
                onCheckedChange={setIsRequired}
                disabled={isCreating}
              />
            </div>

            {/* Assessment Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Has Assessment</Label>
                <p className="text-sm text-muted-foreground">
                  Include a quiz or test with this lesson
                </p>
              </div>
              <Switch
                checked={hasAssessment}
                onCheckedChange={(checked) => {
                  setHasAssessment(checked);
                  if (!checked) setRequiresAssessmentPass(false);
                }}
                disabled={isCreating}
              />
            </div>

            {/* Require Assessment Pass */}
            {hasAssessment && (
              <div className="flex items-center justify-between rounded-lg border p-4 ml-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Require Passing Score</Label>
                  <p className="text-sm text-muted-foreground">
                    Learners must pass to complete the lesson
                  </p>
                </div>
                <Switch
                  checked={requiresAssessmentPass}
                  onCheckedChange={setRequiresAssessmentPass}
                  disabled={isCreating}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !title.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lesson
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLessonModal;
