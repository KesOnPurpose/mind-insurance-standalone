// ============================================================================
// FEAT-GH-014: Create Phase Modal
// ============================================================================
// Modal form for creating a new phase within a program
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus } from 'lucide-react';
import { useCreatePhase } from '@/hooks/useAdminPrograms';

// ============================================================================
// Types
// ============================================================================

interface CreatePhaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  onSuccess?: (phaseId: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const CreatePhaseModal = ({
  open,
  onOpenChange,
  programId,
  onSuccess,
}: CreatePhaseModalProps) => {
  const { createPhase, isCreating } = useCreatePhase();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [isRequired, setIsRequired] = useState(true);
  const [estimatedMinutes, setEstimatedMinutes] = useState('');

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setShortDescription('');
    setStatus('draft');
    setIsRequired(true);
    setEstimatedMinutes('');
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

    const phaseId = await createPhase(programId, {
      title: title.trim(),
      description: description.trim() || undefined,
      short_description: shortDescription.trim() || undefined,
      status,
      is_required: isRequired,
      estimated_duration_minutes: estimatedMinutes
        ? parseInt(estimatedMinutes, 10)
        : undefined,
    });

    if (phaseId) {
      resetForm();
      onOpenChange(false);
      onSuccess?.(phaseId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Phase</DialogTitle>
            <DialogDescription>
              Create a new phase (module) for this program. You can add lessons
              after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="phase-title">
                Phase Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phase-title"
                placeholder="e.g., Getting Started"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isCreating}
                autoFocus
              />
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <Label htmlFor="phase-short-desc">Short Description</Label>
              <Input
                id="phase-short-desc"
                placeholder="Brief tagline for the roadmap"
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
              <Label htmlFor="phase-desc">Full Description</Label>
              <Textarea
                id="phase-desc"
                placeholder="Detailed description of what this phase covers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isCreating}
                rows={3}
              />
            </div>

            {/* Estimated Duration */}
            <div className="space-y-2">
              <Label htmlFor="phase-duration">
                Estimated Duration (minutes)
              </Label>
              <Input
                id="phase-duration"
                type="number"
                min="1"
                max="9999"
                placeholder="e.g., 60"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                disabled={isCreating}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="phase-status">Initial Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as 'draft' | 'published')}
                disabled={isCreating}
              >
                <SelectTrigger id="phase-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Draft phases are not visible to learners
              </p>
            </div>

            {/* Required Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="phase-required" className="text-base">
                  Required Phase
                </Label>
                <p className="text-sm text-muted-foreground">
                  Learners must complete this phase to finish the program
                </p>
              </div>
              <Switch
                id="phase-required"
                checked={isRequired}
                onCheckedChange={setIsRequired}
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
                  Create Phase
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePhaseModal;
