// ============================================================================
// FEAT-GH-014: Program Settings Tab
// ============================================================================
// Edit form for program details and configuration
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Save, Archive, Trash2, ImagePlus, Eye, EyeOff } from 'lucide-react';
import { useUpdateProgram, useDeleteProgram } from '@/hooks/useAdminPrograms';
import { useNavigate } from 'react-router-dom';
import type { AdminProgram, ProgramFormData } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface ProgramSettingsTabProps {
  program: AdminProgram | null;
  isLoading: boolean;
  onRefresh: () => void;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

const SettingsSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const ProgramSettingsTab = ({
  program,
  isLoading,
  onRefresh,
}: ProgramSettingsTabProps) => {
  const navigate = useNavigate();
  const { updateProgram, isUpdating } = useUpdateProgram();
  const { deleteProgram, isDeleting } = useDeleteProgram();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [instructorBio, setInstructorBio] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [isPublic, setIsPublic] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState('');

  const [hasChanges, setHasChanges] = useState(false);

  // Populate form when program data loads
  useEffect(() => {
    if (program) {
      setTitle(program.title || '');
      setDescription(program.description || '');
      setShortDescription(''); // Not in AdminProgram, would need to fetch full program
      setThumbnailUrl(program.thumbnail_url || '');
      setInstructorName(program.instructor_name || '');
      setInstructorBio(''); // Not in AdminProgram
      setStatus(program.status);
      setIsPublic(program.is_public);
      setEstimatedHours(''); // Not in AdminProgram
      setHasChanges(false);
    }
  }, [program]);

  // Track changes
  const handleChange = () => {
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    if (!program) return;

    const data: Partial<ProgramFormData> = {
      title,
      description,
      short_description: shortDescription,
      thumbnail_url: thumbnailUrl,
      instructor_name: instructorName,
      instructor_bio: instructorBio,
      status,
      is_public: isPublic,
      estimated_duration_hours: estimatedHours ? parseInt(estimatedHours, 10) : null,
    };

    const success = await updateProgram(program.id, data);
    if (success) {
      setHasChanges(false);
      onRefresh();
    }
  };

  // Archive program
  const handleArchive = async () => {
    if (!program) return;

    const success = await updateProgram(program.id, { status: 'archived' });
    if (success) {
      setStatus('archived');
      setHasChanges(false);
      onRefresh();
    }
  };

  // Delete program
  const handleDelete = async () => {
    if (!program) return;

    const success = await deleteProgram(program.id);
    if (success) {
      navigate('/admin/programs');
    }
  };

  if (isLoading || !program) {
    return <SettingsSkeleton />;
  }

  const canDelete = program.status !== 'published' && program.enrolled_count === 0;

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
          <CardDescription>
            Basic information about your program
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Program Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                handleChange();
              }}
              placeholder="e.g., Group Home Mastery"
            />
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="short-description">Short Description</Label>
            <Input
              id="short-description"
              value={shortDescription}
              onChange={(e) => {
                setShortDescription(e.target.value);
                handleChange();
              }}
              placeholder="A brief tagline for the program"
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground">
              {shortDescription.length}/150 characters
            </p>
          </div>

          {/* Full Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                handleChange();
              }}
              placeholder="Detailed description of what learners will achieve..."
              rows={4}
            />
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail URL</Label>
            <div className="flex gap-2">
              <Input
                id="thumbnail"
                value={thumbnailUrl}
                onChange={(e) => {
                  setThumbnailUrl(e.target.value);
                  handleChange();
                }}
                placeholder="https://example.com/image.jpg"
              />
              {thumbnailUrl && (
                <div className="shrink-0 w-10 h-10 rounded border overflow-hidden">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Estimated Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Estimated Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="999"
              value={estimatedHours}
              onChange={(e) => {
                setEstimatedHours(e.target.value);
                handleChange();
              }}
              placeholder="e.g., 12"
            />
          </div>
        </CardContent>
      </Card>

      {/* Instructor Info */}
      <Card>
        <CardHeader>
          <CardTitle>Instructor</CardTitle>
          <CardDescription>
            Information about the course instructor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instructor Name */}
          <div className="space-y-2">
            <Label htmlFor="instructor-name">Instructor Name</Label>
            <Input
              id="instructor-name"
              value={instructorName}
              onChange={(e) => {
                setInstructorName(e.target.value);
                handleChange();
              }}
              placeholder="e.g., John Smith"
            />
          </div>

          {/* Instructor Bio */}
          <div className="space-y-2">
            <Label htmlFor="instructor-bio">Instructor Bio</Label>
            <Textarea
              id="instructor-bio"
              value={instructorBio}
              onChange={(e) => {
                setInstructorBio(e.target.value);
                handleChange();
              }}
              placeholder="Brief bio about the instructor..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Publishing */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing</CardTitle>
          <CardDescription>
            Control program visibility and access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as 'draft' | 'published' | 'archived');
                handleChange();
              }}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4" />
                    Draft
                  </div>
                </SelectItem>
                <SelectItem value="published">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Published
                  </div>
                </SelectItem>
                <SelectItem value="archived">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    Archived
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {status === 'draft' && 'Draft programs are only visible to admins'}
              {status === 'published' && 'Published programs are visible to learners'}
              {status === 'archived' && 'Archived programs are hidden but data is preserved'}
            </p>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Public Enrollment</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone to enroll without an invitation
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={(checked) => {
                setIsPublic(checked);
                handleChange();
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for this program
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Archive */}
          {status !== 'archived' && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Archive Program</p>
                <p className="text-sm text-muted-foreground">
                  Hide the program from learners but keep all data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archive Program?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will hide the program from learners. Existing enrollees
                      will retain their progress but won't be able to continue.
                      You can restore it later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleArchive}>
                      Archive Program
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Delete */}
          <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
            <div>
              <p className="font-medium text-destructive">Delete Program</p>
              <p className="text-sm text-muted-foreground">
                {canDelete
                  ? 'Permanently delete this program and all its content'
                  : 'Cannot delete programs with enrollments. Archive instead.'}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!canDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Program?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    program and all its phases, lessons, and tactics.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Forever'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
        <div>
          {hasChanges && (
            <p className="text-sm text-muted-foreground">
              You have unsaved changes
            </p>
          )}
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProgramSettingsTab;
