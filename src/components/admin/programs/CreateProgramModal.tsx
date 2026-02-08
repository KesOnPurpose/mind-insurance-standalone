// ============================================================================
// FEAT-GH-014: Create Program Modal
// ============================================================================
// Modal form for creating a new program
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus } from 'lucide-react';
import { useCreateProgram } from '@/hooks/useAdminPrograms';

// ============================================================================
// Types
// ============================================================================

interface CreateProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (programId: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const CreateProgramModal = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateProgramModalProps) => {
  const navigate = useNavigate();
  const { createProgram, isCreating } = useCreateProgram();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [isPublic, setIsPublic] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState('');

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setShortDescription('');
    setInstructorName('');
    setStatus('draft');
    setIsPublic(false);
    setEstimatedHours('');
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

    const programId = await createProgram({
      title: title.trim(),
      description: description.trim() || '',
      short_description: shortDescription.trim() || '',
      instructor_name: instructorName.trim() || '',
      instructor_bio: '',
      status,
      is_public: isPublic,
      estimated_duration_hours: estimatedHours
        ? parseInt(estimatedHours, 10)
        : null,
      thumbnail_url: '',
    });

    if (programId) {
      resetForm();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(programId);
      } else {
        // Navigate to the new program's dashboard
        navigate(`/admin/programs/${programId}`);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Program</DialogTitle>
            <DialogDescription>
              Create a new course program. You can add phases and lessons after
              creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Program Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Group Home Mastery"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isCreating}
                autoFocus
              />
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <Label htmlFor="short-description">Short Description</Label>
              <Input
                id="short-description"
                placeholder="A brief tagline for the program"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                disabled={isCreating}
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
                placeholder="Detailed description of what learners will achieve..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isCreating}
                rows={3}
              />
            </div>

            {/* Instructor Name */}
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor Name</Label>
              <Input
                id="instructor"
                placeholder="e.g., John Smith"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                disabled={isCreating}
              />
            </div>

            {/* Estimated Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="999"
                placeholder="e.g., 12"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                disabled={isCreating}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as 'draft' | 'published')}
                disabled={isCreating}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Draft programs are not visible to learners
              </p>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="public" className="text-base">
                  Public Program
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow anyone to enroll without invitation
                </p>
              </div>
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={isCreating}
              />
            </div>
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
                  Create Program
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProgramModal;
