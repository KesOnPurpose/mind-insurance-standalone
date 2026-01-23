// ============================================================================
// FEAT-GH-016 + FEAT-GH-021: Tactic Editor Component (with Library Browser)
// ============================================================================
// Edit individual tactic OR load from library via tabbed interface
// Tab 1: Create New - Manual tactic creation form
// Tab 2: Load from Library - Browse and copy from gh_tactic_instructions
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  CheckSquare,
  Type,
  Upload,
  Link2,
  MessageSquare,
  Star,
  ExternalLink,
  Loader2,
  PlusCircle,
  Library,
} from 'lucide-react';
import { TacticLibraryBrowser } from './TacticLibraryBrowser';
import type { AdminTactic, TacticFormData } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface TacticEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tactic: AdminTactic | null; // null for create mode
  onSave: (data: TacticFormData) => Promise<void>;
  isSaving?: boolean;
  // FEAT-GH-021: Additional props for library browser
  lessonId?: string;
  programId?: string;
  currentTacticsCount?: number;
  onLibraryTacticsAdded?: () => void;
}

// ============================================================================
// Tactic Type Options
// ============================================================================

const tacticTypes = [
  {
    value: 'checkbox',
    label: 'Checkbox',
    icon: <CheckSquare className="h-4 w-4" />,
    description: 'Simple check-off tactic',
  },
  {
    value: 'text_input',
    label: 'Text Input',
    icon: <Type className="h-4 w-4" />,
    description: 'Learner provides a text response',
  },
  {
    value: 'file_upload',
    label: 'File Upload',
    icon: <Upload className="h-4 w-4" />,
    description: 'Learner uploads a file',
  },
  {
    value: 'link_submit',
    label: 'Link Submit',
    icon: <Link2 className="h-4 w-4" />,
    description: 'Learner submits a URL',
  },
  {
    value: 'reflection',
    label: 'Reflection',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Long-form reflection or journal entry',
  },
];

// ============================================================================
// Create New Tab Content
// ============================================================================

interface CreateNewTabProps {
  label: string;
  setLabel: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  isRequired: boolean;
  setIsRequired: (v: boolean) => void;
  referenceUrl: string;
  setReferenceUrl: (v: string) => void;
  tacticType: string;
  setTacticType: (v: string) => void;
  placeholderText: string;
  setPlaceholderText: (v: string) => void;
  isSaving?: boolean;
  isEditMode: boolean;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

const CreateNewTab = ({
  label,
  setLabel,
  description,
  setDescription,
  isRequired,
  setIsRequired,
  referenceUrl,
  setReferenceUrl,
  tacticType,
  setTacticType,
  placeholderText,
  setPlaceholderText,
  isSaving,
  isEditMode,
  onSave,
  onCancel,
}: CreateNewTabProps) => {
  // Check if tactic type needs placeholder
  const needsPlaceholder = ['text_input', 'link_submit', 'reflection'].includes(tacticType);

  return (
    <div className="space-y-4 py-4">
      {/* Label */}
      <div className="space-y-2">
        <Label htmlFor="tactic-label">Tactic Label *</Label>
        <Input
          id="tactic-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g., Complete the exercise worksheet"
          disabled={isSaving}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="tactic-description">Description</Label>
        <Textarea
          id="tactic-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional: Provide more details about this tactic"
          rows={2}
          disabled={isSaving}
        />
      </div>

      {/* Tactic Type */}
      <div className="space-y-2">
        <Label htmlFor="tactic-type">Tactic Type</Label>
        <Select
          value={tacticType}
          onValueChange={setTacticType}
          disabled={isSaving}
        >
          <SelectTrigger id="tactic-type">
            <SelectValue placeholder="Select tactic type" />
          </SelectTrigger>
          <SelectContent>
            {tacticTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  {type.icon}
                  <div>
                    <span>{type.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      - {type.description}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Placeholder Text (for text-based tactics) */}
      {needsPlaceholder && (
        <div className="space-y-2">
          <Label htmlFor="placeholder-text">Placeholder Text</Label>
          <Input
            id="placeholder-text"
            value={placeholderText}
            onChange={(e) => setPlaceholderText(e.target.value)}
            placeholder="e.g., Enter your reflection here..."
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground">
            Shown as placeholder in the input field
          </p>
        </div>
      )}

      {/* Reference URL */}
      <div className="space-y-2">
        <Label htmlFor="reference-url" className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Reference URL
        </Label>
        <Input
          id="reference-url"
          type="url"
          value={referenceUrl}
          onChange={(e) => setReferenceUrl(e.target.value)}
          placeholder="https://example.com/worksheet.pdf"
          disabled={isSaving}
        />
        <p className="text-xs text-muted-foreground">
          Optional: Link to a resource, worksheet, or external content
        </p>
      </div>

      {/* Required Toggle */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <Label htmlFor="tactic-required" className="font-medium">
              Required Tactic
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Learners must complete this to finish the lesson
          </p>
        </div>
        <Switch
          id="tactic-required"
          checked={isRequired}
          onCheckedChange={setIsRequired}
          disabled={isSaving}
        />
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          disabled={!label.trim() || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isEditMode ? (
            'Save Changes'
          ) : (
            'Add Tactic'
          )}
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const TacticEditor = ({
  open,
  onOpenChange,
  tactic,
  onSave,
  isSaving,
  lessonId,
  programId,
  currentTacticsCount = 0,
  onLibraryTacticsAdded,
}: TacticEditorProps) => {
  const isEditMode = !!tactic;
  const canShowLibrary = !isEditMode && !!lessonId && !!programId;

  // Tab state
  const [activeTab, setActiveTab] = useState<'create' | 'library'>('create');

  // Form state
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [tacticType, setTacticType] = useState<string>('checkbox');
  const [placeholderText, setPlaceholderText] = useState('');

  // Reset form when dialog opens/closes or tactic changes
  useEffect(() => {
    if (open) {
      // Reset to create tab when opening in create mode
      if (!tactic) {
        setActiveTab('create');
      }

      if (tactic) {
        setLabel(tactic.label);
        setDescription(tactic.description || '');
        setIsRequired(tactic.is_required);
        setReferenceUrl(tactic.reference_url || '');
        setTacticType(tactic.tactic_type);
        setPlaceholderText(tactic.placeholder_text || '');
      } else {
        // Reset to defaults for create mode
        setLabel('');
        setDescription('');
        setIsRequired(true);
        setReferenceUrl('');
        setTacticType('checkbox');
        setPlaceholderText('');
      }
    }
  }, [open, tactic]);

  // Handle save
  const handleSave = async () => {
    if (!label.trim()) return;

    const formData: TacticFormData = {
      label: label.trim(),
      description: description.trim() || undefined,
      is_required: isRequired,
      reference_url: referenceUrl.trim() || undefined,
      tactic_type: tacticType as TacticFormData['tactic_type'],
      placeholder_text: placeholderText.trim() || undefined,
    };

    await onSave(formData);
  };

  // Handle library tactics added
  const handleLibraryTacticsAdded = () => {
    onLibraryTacticsAdded?.();
  };

  // Handle close
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={canShowLibrary ? 'max-w-2xl h-[80vh] flex flex-col' : 'max-w-lg'}>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Tactic' : 'Add Tactic'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the tactic details below.'
              : 'Create a new tactic or load from the library.'}
          </DialogDescription>
        </DialogHeader>

        {/* Show tabs only in create mode when library is available */}
        {canShowLibrary ? (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'create' | 'library')}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Create New
              </TabsTrigger>
              <TabsTrigger value="library" className="gap-2">
                <Library className="h-4 w-4" />
                Load from Library
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="flex-1 overflow-y-auto mt-4">
              <CreateNewTab
                label={label}
                setLabel={setLabel}
                description={description}
                setDescription={setDescription}
                isRequired={isRequired}
                setIsRequired={setIsRequired}
                referenceUrl={referenceUrl}
                setReferenceUrl={setReferenceUrl}
                tacticType={tacticType}
                setTacticType={setTacticType}
                placeholderText={placeholderText}
                setPlaceholderText={setPlaceholderText}
                isSaving={isSaving}
                isEditMode={isEditMode}
                onSave={handleSave}
                onCancel={handleClose}
              />
            </TabsContent>

            <TabsContent value="library" className="flex-1 overflow-hidden mt-0 -mx-6 -mb-6">
              <TacticLibraryBrowser
                lessonId={lessonId!}
                programId={programId!}
                currentTacticsCount={currentTacticsCount}
                onTacticsAdded={handleLibraryTacticsAdded}
                onClose={handleClose}
              />
            </TabsContent>
          </Tabs>
        ) : (
          // Edit mode or library not available - show form only
          <>
            <CreateNewTab
              label={label}
              setLabel={setLabel}
              description={description}
              setDescription={setDescription}
              isRequired={isRequired}
              setIsRequired={setIsRequired}
              referenceUrl={referenceUrl}
              setReferenceUrl={setReferenceUrl}
              tacticType={tacticType}
              setTacticType={setTacticType}
              placeholderText={placeholderText}
              setPlaceholderText={setPlaceholderText}
              isSaving={isSaving}
              isEditMode={isEditMode}
              onSave={handleSave}
              onCancel={handleClose}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TacticEditor;
