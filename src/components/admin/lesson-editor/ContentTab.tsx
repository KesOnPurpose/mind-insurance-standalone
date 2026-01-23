// ============================================================================
// FEAT-GH-016: Content Tab Component
// ============================================================================
// Video upload/embed, rich text editor, file attachments
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { VideoUploader, VideoProvider } from './VideoUploader';
import { RichTextEditor } from './RichTextEditor';
import {
  FileText,
  Video,
  Headphones,
  ClipboardCheck,
  Star,
} from 'lucide-react';
import type { AdminLessonFull, LessonContentUpdate } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface ContentTabProps {
  lesson: AdminLessonFull;
  onUpdate: (data: LessonContentUpdate) => void;
  isSaving?: boolean;
}

// ============================================================================
// Lesson Type Icons
// ============================================================================

const LessonTypeIcons: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  audio: <Headphones className="h-4 w-4" />,
  assessment: <ClipboardCheck className="h-4 w-4" />,
};

// ============================================================================
// Main Component
// ============================================================================

export const ContentTab = ({ lesson, onUpdate, isSaving }: ContentTabProps) => {
  // Local state for form fields
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description || '');
  const [lessonType, setLessonType] = useState(lesson.lesson_type);
  const [isRequired, setIsRequired] = useState(lesson.is_required);
  const [videoUrl, setVideoUrl] = useState(lesson.video_url || '');
  const [videoProvider, setVideoProvider] = useState<VideoProvider>(lesson.video_provider);
  const [videoDuration, setVideoDuration] = useState<number | null>(lesson.video_duration_seconds);
  const [contentHtml, setContentHtml] = useState(lesson.content_html || '');

  // Update local state when lesson changes
  useEffect(() => {
    setTitle(lesson.title);
    setDescription(lesson.description || '');
    setLessonType(lesson.lesson_type);
    setIsRequired(lesson.is_required);
    setVideoUrl(lesson.video_url || '');
    setVideoProvider(lesson.video_provider);
    setVideoDuration(lesson.video_duration_seconds);
    setContentHtml(lesson.content_html || '');
  }, [lesson]);

  // Handle field changes with debounce for auto-save
  const handleTitleChange = (value: string) => {
    setTitle(value);
    onUpdate({ title: value });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    onUpdate({ description: value });
  };

  const handleLessonTypeChange = (value: string) => {
    const type = value as AdminLessonFull['lesson_type'];
    setLessonType(type);
    onUpdate({ lesson_type: type });
  };

  const handleIsRequiredChange = (checked: boolean) => {
    setIsRequired(checked);
    onUpdate({ is_required: checked });
  };

  const handleVideoChange = (url: string, provider: VideoProvider, duration: number | null) => {
    setVideoUrl(url);
    setVideoProvider(provider);
    setVideoDuration(duration);
    onUpdate({
      video_url: url || undefined,
      video_provider: provider,
      video_duration_seconds: duration,
    });
  };

  const handleContentHtmlChange = (value: string) => {
    setContentHtml(value);
    onUpdate({ content_html: value });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
          <CardDescription>
            Lesson title, description, and type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter lesson title"
              disabled={isSaving}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              content={description}
              onChange={handleDescriptionChange}
              placeholder="Brief description of the lesson content..."
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Use the toolbar to format text with bold, lists, links, and more.
            </p>
          </div>

          {/* Lesson Type */}
          <div className="space-y-2">
            <Label htmlFor="lesson-type">Lesson Type</Label>
            <Select
              value={lessonType}
              onValueChange={handleLessonTypeChange}
              disabled={isSaving}
            >
              <SelectTrigger id="lesson-type">
                <SelectValue placeholder="Select lesson type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">
                  <div className="flex items-center gap-2">
                    {LessonTypeIcons.video}
                    Video Lesson
                  </div>
                </SelectItem>
                <SelectItem value="text">
                  <div className="flex items-center gap-2">
                    {LessonTypeIcons.text}
                    Text/Article
                  </div>
                </SelectItem>
                <SelectItem value="audio">
                  <div className="flex items-center gap-2">
                    {LessonTypeIcons.audio}
                    Audio Lesson
                  </div>
                </SelectItem>
                <SelectItem value="assessment">
                  <div className="flex items-center gap-2">
                    {LessonTypeIcons.assessment}
                    Assessment Only
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Required Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <Label htmlFor="is-required" className="font-medium">
                  Required Lesson
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Learners must complete this lesson to progress
              </p>
            </div>
            <Switch
              id="is-required"
              checked={isRequired}
              onCheckedChange={handleIsRequiredChange}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Video Content - Show if lesson type is video or audio */}
      {(lessonType === 'video' || lessonType === 'audio') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {lessonType === 'video' ? (
                <Video className="h-5 w-5" />
              ) : (
                <Headphones className="h-5 w-5" />
              )}
              {lessonType === 'video' ? 'Video Content' : 'Audio Content'}
            </CardTitle>
            <CardDescription>
              Add a {lessonType} URL from YouTube, Vimeo, Wistia, Bunny, or direct link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoUploader
              videoUrl={videoUrl}
              videoProvider={videoProvider}
              videoDuration={videoDuration}
              onVideoChange={handleVideoChange}
              disabled={isSaving}
            />
          </CardContent>
        </Card>
      )}

      {/* Text Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Text Content
          </CardTitle>
          <CardDescription>
            Add additional text content, notes, or transcript below the video
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="content-html">Content (HTML)</Label>
            <Textarea
              id="content-html"
              value={contentHtml}
              onChange={(e) => handleContentHtmlChange(e.target.value)}
              placeholder="Enter lesson content in HTML format. Basic HTML tags are supported."
              rows={10}
              disabled={isSaving}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Supports HTML formatting. For a rich text editor, consider upgrading in a future iteration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentTab;
