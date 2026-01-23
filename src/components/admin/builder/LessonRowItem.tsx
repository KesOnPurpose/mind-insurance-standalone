// ============================================================================
// FEAT-GH-015: Lesson Row Item Component
// ============================================================================
// Individual lesson row with status, type, actions
// ============================================================================

import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GripVertical,
  MoreHorizontal,
  Edit,
  Trash2,
  Video,
  FileText,
  Headphones,
  ClipboardCheck,
  Eye,
  EyeOff,
  Target,
  Star,
  ExternalLink,
  Settings2,
} from 'lucide-react';
import type { AdminLesson } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface LessonRowItemProps {
  lesson: AdminLesson;
  index: number;
  programId: string;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onQuickEdit?: (lesson: AdminLesson) => void;
  onDelete?: (lesson: AdminLesson) => void;
  isDragging: boolean;
  dragOverIndex: number | null;
}

// ============================================================================
// Lesson Type Icon
// ============================================================================

const LessonTypeIcon = ({
  type,
}: {
  type: 'video' | 'text' | 'audio' | 'assessment';
}) => {
  const icons = {
    video: <Video className="h-4 w-4" />,
    text: <FileText className="h-4 w-4" />,
    audio: <Headphones className="h-4 w-4" />,
    assessment: <ClipboardCheck className="h-4 w-4" />,
  };
  return icons[type] || <FileText className="h-4 w-4" />;
};

// ============================================================================
// Format Duration
// ============================================================================

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

// ============================================================================
// Main Component
// ============================================================================

export const LessonRowItem = ({
  lesson,
  index,
  programId,
  onDragStart,
  onDragOver,
  onDragEnd,
  onQuickEdit,
  onDelete,
  isDragging,
  dragOverIndex,
}: LessonRowItemProps) => {
  const navigate = useNavigate();

  // Navigate to lesson editor (FEAT-GH-016 route)
  const handleClick = () => {
    navigate(`/admin/programs/${programId}/lessons/${lesson.id}`);
  };

  // Open lesson in learner view
  const handleViewAsLearner = () => {
    navigate(`/programs/${programId}/lessons/${lesson.id}`);
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className={`
        group flex items-center gap-3 p-3 rounded-lg border bg-card transition-all
        ${isDragging ? 'opacity-50' : ''}
        ${dragOverIndex === index ? 'border-primary border-dashed' : 'border-border'}
        hover:shadow-sm cursor-grab active:cursor-grabbing
      `}
    >
      {/* Drag Handle */}
      <div className="text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Order Index */}
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
        {index + 1}
      </div>

      {/* Lesson Type Icon */}
      <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center text-muted-foreground flex-shrink-0">
        <LessonTypeIcon type={lesson.lesson_type} />
      </div>

      {/* Lesson Info */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{lesson.title}</span>
          {lesson.video_duration_seconds && (
            <span className="text-xs text-muted-foreground">
              {formatDuration(lesson.video_duration_seconds)}
            </span>
          )}
        </div>
        {lesson.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {lesson.description}
          </p>
        )}
      </div>

      {/* Badges - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        {/* Required Badge */}
        {lesson.is_required && (
          <Badge variant="secondary" className="text-xs gap-1">
            <Star className="h-3 w-3" />
            Required
          </Badge>
        )}

        {/* Has Assessment Badge */}
        {lesson.has_assessment && (
          <Badge variant="outline" className="text-xs gap-1">
            <ClipboardCheck className="h-3 w-3" />
            Quiz
          </Badge>
        )}

        {/* Tactics Count */}
        {lesson.tactics_count > 0 && (
          <Badge variant="outline" className="text-xs gap-1">
            <Target className="h-3 w-3" />
            {lesson.tactics_count}
          </Badge>
        )}

        {/* Status Badge */}
        <Badge
          variant={lesson.status === 'published' ? 'default' : 'secondary'}
          className="text-xs gap-1"
        >
          {lesson.status === 'published' ? (
            <Eye className="h-3 w-3" />
          ) : (
            <EyeOff className="h-3 w-3" />
          )}
          {lesson.status === 'published' ? 'Live' : 'Draft'}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:flex"
          onClick={handleClick}
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit lesson</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Lesson actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleClick}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Lesson
            </DropdownMenuItem>
            {onQuickEdit && (
              <DropdownMenuItem onClick={() => onQuickEdit(lesson)}>
                <Settings2 className="mr-2 h-4 w-4" />
                Quick Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleViewAsLearner}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View as Learner
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {lesson.tactics_count === 0 && onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(lesson)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Lesson
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

// ============================================================================
// Mobile Card Variant
// ============================================================================

export const LessonCardItem = ({
  lesson,
  index,
  programId,
  onDragStart,
  onDragOver,
  onDragEnd,
  onQuickEdit,
  onDelete,
  isDragging,
  dragOverIndex,
}: LessonRowItemProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/admin/programs/${programId}/lessons/${lesson.id}`);
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className={`
        group border rounded-lg p-4 bg-card transition-all
        ${isDragging ? 'opacity-50' : ''}
        ${dragOverIndex === index ? 'border-primary border-dashed' : 'border-border'}
        hover:shadow-md active:cursor-grabbing
      `}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div className="text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity mt-1">
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={handleClick}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-muted-foreground">
              Lesson {index + 1}
            </span>
            <Badge
              variant={lesson.status === 'published' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {lesson.status === 'published' ? 'Live' : 'Draft'}
            </Badge>
          </div>

          <h4 className="font-semibold truncate">{lesson.title}</h4>

          {lesson.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {lesson.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs gap-1">
              <LessonTypeIcon type={lesson.lesson_type} />
              {lesson.lesson_type}
            </Badge>

            {lesson.is_required && (
              <Badge variant="secondary" className="text-xs">
                Required
              </Badge>
            )}

            {lesson.tactics_count > 0 && (
              <Badge variant="outline" className="text-xs gap-1">
                <Target className="h-3 w-3" />
                {lesson.tactics_count} tactics
              </Badge>
            )}

            {lesson.video_duration_seconds && (
              <span className="text-xs text-muted-foreground">
                {formatDuration(lesson.video_duration_seconds)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleClick}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {lesson.tactics_count === 0 && onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(lesson)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default LessonRowItem;
