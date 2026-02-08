// ============================================================================
// FEAT-GH-015: Lesson Quick Edit Component
// ============================================================================
// Inline popover for quick edits to lesson details
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Save,
  X,
  Video,
  FileText,
  Headphones,
  ClipboardCheck,
} from 'lucide-react';
import { useUpdateLesson } from '@/hooks/useAdminPrograms';
import type { AdminLesson, LessonFormData } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface LessonQuickEditProps {
  lesson: AdminLesson;
  trigger: React.ReactNode;
  onUpdate?: () => void;
}

type LessonType = 'video' | 'text' | 'audio' | 'assessment';

// ============================================================================
// Lesson Type Options
// ============================================================================

const lessonTypeOptions: {
  value: LessonType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'video', label: 'Video', icon: <Video className="h-4 w-4" /> },
  { value: 'text', label: 'Text', icon: <FileText className="h-4 w-4" /> },
  { value: 'audio', label: 'Audio', icon: <Headphones className="h-4 w-4" /> },
  {
    value: 'assessment',
    label: 'Assessment',
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
];

// ============================================================================
// Main Component
// ============================================================================

export const LessonQuickEdit = ({
  lesson,
  trigger,
  onUpdate,
}: LessonQuickEditProps) => {
  const { updateLesson, isUpdating } = useUpdateLesson();
  const [open, setOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState(lesson.title);
  const [lessonType, setLessonType] = useState<LessonType>(lesson.lesson_type);
  const [isRequired, setIsRequired] = useState(lesson.is_required);
  const [status, setStatus] = useState<'draft' | 'published'>(lesson.status);
  const [requiredWatchPercent, setRequiredWatchPercent] = useState(
    lesson.required_watch_percent?.toString() || '80'
  );

  // Track changes
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when lesson changes
  useEffect(() => {
    setTitle(lesson.title);
    setLessonType(lesson.lesson_type);
    setIsRequired(lesson.is_required);
    setStatus(lesson.status);
    setRequiredWatchPercent(lesson.required_watch_percent?.toString() || '80');
    setHasChanges(false);
  }, [lesson]);

  // Track changes
  useEffect(() => {
    const changed =
      title !== lesson.title ||
      lessonType !== lesson.lesson_type ||
      isRequired !== lesson.is_required ||
      status !== lesson.status ||
      requiredWatchPercent !== (lesson.required_watch_percent?.toString() || '80');
    setHasChanges(changed);
  }, [title, lessonType, isRequired, status, requiredWatchPercent, lesson]);

  // Handle save
  const handleSave = async () => {
    const data: Partial<LessonFormData> = {
      title,
      lesson_type: lessonType,
      is_required: isRequired,
      status,
      required_watch_percent: requiredWatchPercent
        ? parseInt(requiredWatchPercent, 10)
        : 80,
    };

    const success = await updateLesson(lesson.id, data);
    if (success) {
      setHasChanges(false);
      setOpen(false);
      onUpdate?.();
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setTitle(lesson.title);
    setLessonType(lesson.lesson_type);
    setIsRequired(lesson.is_required);
    setStatus(lesson.status);
    setRequiredWatchPercent(lesson.required_watch_percent?.toString() || '80');
    setHasChanges(false);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Quick Edit</h4>
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Unsaved
              </Badge>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="quick-title">Title</Label>
            <Input
              id="quick-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUpdating}
            />
          </div>

          {/* Lesson Type */}
          <div className="space-y-2">
            <Label htmlFor="quick-type">Type</Label>
            <Select
              value={lessonType}
              onValueChange={(v) => setLessonType(v as LessonType)}
              disabled={isUpdating}
            >
              <SelectTrigger id="quick-type">
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
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="quick-status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as 'draft' | 'published')}
              disabled={isUpdating}
            >
              <SelectTrigger id="quick-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Watch Percent (for video) */}
          {lessonType === 'video' && (
            <div className="space-y-2">
              <Label htmlFor="quick-watch">Required Watch %</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="quick-watch"
                  type="number"
                  min="0"
                  max="100"
                  value={requiredWatchPercent}
                  onChange={(e) => setRequiredWatchPercent(e.target.value)}
                  disabled={isUpdating}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          )}

          {/* Required Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="quick-required">Required</Label>
            <Switch
              id="quick-required"
              checked={isRequired}
              onCheckedChange={setIsRequired}
              disabled={isUpdating}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isUpdating || !hasChanges || !title.trim()}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-1 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LessonQuickEdit;
