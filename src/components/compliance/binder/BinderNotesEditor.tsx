// ============================================================================
// BINDER NOTES EDITOR COMPONENT
// ============================================================================
// Rich text editor for personal annotations and interpretations.
// Uses TipTap WYSIWYG editor with auto-save functionality.
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  StickyNote,
  Save,
  Check,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import { RichTextEditor } from '@/components/admin/lesson-editor/RichTextEditor';
import type { StateCode } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

export interface BinderNotesEditorProps {
  notes: string;
  onSave: (notes: string) => Promise<void>;
  stateCode?: StateCode | null;
  className?: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function EmptyNotesState({ onClick }: { onClick: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <StickyNote className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No notes yet</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        Add your personal interpretations, reminders, and annotations about your
        compliance requirements here.
      </p>
      <Button onClick={onClick} size="lg" className="gap-2">
        <Lightbulb className="h-4 w-4" />
        Start Writing Notes
      </Button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BinderNotesEditor({
  notes,
  onSave,
  stateCode,
  className = '',
}: BinderNotesEditorProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(notes);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with prop changes
  useEffect(() => {
    setContent(notes);
    setHasChanges(false);
  }, [notes]);

  // Handle content change with auto-save
  const handleChange = useCallback((value: string) => {
    setContent(value);
    setHasChanges(true);

    // Clear existing auto-save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new auto-save timeout (3 seconds)
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSave(value);
    }, 3000);
  }, []);

  // Handle save
  const handleSave = useCallback(async (valueToSave?: string) => {
    const saveContent = valueToSave ?? content;
    if (!hasChanges && !valueToSave) return;

    setIsSaving(true);
    try {
      await onSave(saveContent);
      setHasChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save your notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [content, hasChanges, onSave, toast]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Check if content is empty (accounting for empty HTML tags)
  const isContentEmpty = !content || content === '' || content === '<p></p>' || content === '<p><br></p>';

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <StickyNote className="h-5 w-5 text-primary" />
              My Notes & Interpretations
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Personal annotations for your {stateCode || 'state'} compliance binder
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Status indicators */}
            {hasChanges && !isSaving && (
              <Badge variant="outline" className="text-xs">
                Unsaved changes
              </Badge>
            )}
            {isSaving && (
              <Badge variant="outline" className="text-xs">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </Badge>
            )}
            {!hasChanges && lastSaved && (
              <Badge variant="secondary" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Saved
              </Badge>
            )}

            {/* Save button */}
            <Button
              variant="default"
              size="sm"
              onClick={() => handleSave()}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Show empty state or editor */}
        {isContentEmpty && !isEditing ? (
          <EmptyNotesState onClick={() => setIsEditing(true)} />
        ) : (
          <>
            {/* Rich Text Editor with built-in formatting toolbar */}
            <div className="min-h-[400px] border rounded-lg overflow-hidden">
              <RichTextEditor
                content={content}
                onChange={handleChange}
                placeholder="Start writing your notes here...

Use the toolbar above to format your text:
• Bold for emphasis
• Headings for sections
• Bullet lists for items
• Quotes for important notes"
              />
            </div>

            {/* Help text */}
            <p className="text-xs text-muted-foreground mt-3">
              <Lightbulb className="h-3 w-3 inline mr-1" />
              Auto-saves after 3 seconds of inactivity. Use the toolbar for formatting.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default BinderNotesEditor;
