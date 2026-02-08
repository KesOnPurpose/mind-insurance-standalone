// ============================================================================
// FEAT-GH-015: Phase Editor Component
// ============================================================================
// Edit phase details (title, description, drip override)
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Loader2, Save, ChevronDown, Settings2, Eye, EyeOff } from 'lucide-react';
import { useUpdatePhase } from '@/hooks/useAdminPrograms';
import type { AdminPhaseWithLessons, PhaseFormData } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface PhaseEditorProps {
  phase: AdminPhaseWithLessons;
  onUpdate?: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const PhaseEditor = ({ phase, onUpdate }: PhaseEditorProps) => {
  const { updatePhase, isUpdating } = useUpdatePhase();
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState(phase.title);
  const [description, setDescription] = useState(phase.description || '');
  const [shortDescription, setShortDescription] = useState(phase.short_description || '');
  const [isRequired, setIsRequired] = useState(phase.is_required);
  const [status, setStatus] = useState<'draft' | 'published'>(phase.status);
  const [dripModel, setDripModel] = useState(phase.drip_model);
  const [unlockOffsetDays, setUnlockOffsetDays] = useState(
    phase.unlock_offset_days?.toString() || ''
  );

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when phase changes
  useEffect(() => {
    setTitle(phase.title);
    setDescription(phase.description || '');
    setShortDescription(phase.short_description || '');
    setIsRequired(phase.is_required);
    setStatus(phase.status);
    setDripModel(phase.drip_model);
    setUnlockOffsetDays(phase.unlock_offset_days?.toString() || '');
    setHasChanges(false);
  }, [phase]);

  // Mark as changed when form values differ from original
  useEffect(() => {
    const changed =
      title !== phase.title ||
      description !== (phase.description || '') ||
      shortDescription !== (phase.short_description || '') ||
      isRequired !== phase.is_required ||
      status !== phase.status ||
      dripModel !== phase.drip_model ||
      unlockOffsetDays !== (phase.unlock_offset_days?.toString() || '');
    setHasChanges(changed);
  }, [
    title,
    description,
    shortDescription,
    isRequired,
    status,
    dripModel,
    unlockOffsetDays,
    phase,
  ]);

  // Handle save
  const handleSave = async () => {
    const data: Partial<PhaseFormData> = {
      title,
      description: description || undefined,
      short_description: shortDescription || undefined,
      is_required: isRequired,
      status,
      drip_model: dripModel,
      unlock_offset_days: unlockOffsetDays ? parseInt(unlockOffsetDays, 10) : undefined,
    };

    const success = await updatePhase(phase.id, data);
    if (success) {
      setHasChanges(false);
      onUpdate?.();
    }
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Settings2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Phase Settings</CardTitle>
                {hasChanges && (
                  <Badge variant="secondary" className="text-xs">
                    Unsaved changes
                  </Badge>
                )}
              </div>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Title */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phase-title">Phase Title</Label>
                <Input
                  id="phase-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Foundation & Setup"
                  disabled={isUpdating}
                />
              </div>

              {/* Short Description */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phase-short-desc">Short Description</Label>
                <Input
                  id="phase-short-desc"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief tagline for this phase"
                  maxLength={150}
                  disabled={isUpdating}
                />
                <p className="text-xs text-muted-foreground">
                  {shortDescription.length}/150 characters
                </p>
              </div>

              {/* Full Description */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phase-desc">Full Description</Label>
                <Textarea
                  id="phase-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What learners will accomplish in this phase..."
                  rows={3}
                  disabled={isUpdating}
                />
              </div>
            </div>

            {/* Status & Required */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="phase-status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as 'draft' | 'published')}
                  disabled={isUpdating}
                >
                  <SelectTrigger id="phase-status">
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
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Draft phases are hidden from learners
                </p>
              </div>

              {/* Required Toggle */}
              <div className="space-y-2">
                <Label>Required Phase</Label>
                <div className="flex items-center justify-between rounded-lg border p-3 h-10">
                  <span className="text-sm">
                    {isRequired ? 'Required for completion' : 'Optional'}
                  </span>
                  <Switch
                    checked={isRequired}
                    onCheckedChange={setIsRequired}
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>

            {/* Drip Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Unlock Settings</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Drip Model */}
                <div className="space-y-2">
                  <Label htmlFor="drip-model">Unlock Model</Label>
                  <Select
                    value={dripModel}
                    onValueChange={(v) =>
                      setDripModel(v as AdminPhaseWithLessons['drip_model'])
                    }
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="drip-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inherit">Inherit from Program</SelectItem>
                      <SelectItem value="progress">Progress Based</SelectItem>
                      <SelectItem value="relative">Days After Enrollment</SelectItem>
                      <SelectItem value="calendar">Calendar Date</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Unlock Offset Days (for relative model) */}
                {(dripModel === 'relative' || dripModel === 'hybrid') && (
                  <div className="space-y-2">
                    <Label htmlFor="unlock-days">Days After Enrollment</Label>
                    <Input
                      id="unlock-days"
                      type="number"
                      min="0"
                      max="365"
                      value={unlockOffsetDays}
                      onChange={(e) => setUnlockOffsetDays(e.target.value)}
                      placeholder="0"
                      disabled={isUpdating}
                    />
                    <p className="text-xs text-muted-foreground">
                      Phase unlocks this many days after enrollment
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={isUpdating || !hasChanges || !title.trim()}
              >
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
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default PhaseEditor;
