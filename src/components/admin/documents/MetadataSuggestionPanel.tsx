// MetadataSuggestionPanel Component
// Review and edit AI-generated metadata suggestions

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, XCircle, Sparkles, Edit3 } from 'lucide-react';
import { useBulkUpload } from '@/hooks/useBulkUpload';
import type { FileAnalysisState } from '@/types/bulkUpload';
import {
  DOCUMENT_CATEGORIES,
  OWNERSHIP_MODELS,
  APPLICABLE_POPULATIONS,
  DIFFICULTY_LEVELS,
  US_STATES,
  type DocumentCategory,
  type OwnershipModel,
  type ApplicablePopulation,
  type DifficultyLevel,
} from '@/types/documents';

interface Props {
  fileState: FileAnalysisState;
  fileIndex: number;
  onClose: () => void;
}

export const MetadataSuggestionPanel = ({
  fileState,
  fileIndex,
  onClose,
}: Props) => {
  const { updateSuggestion, approveSuggestion } = useBulkUpload();
  const [isEditing, setIsEditing] = useState(false);

  const suggestion = fileState.suggestion;
  if (!suggestion) return null;

  const metadata = suggestion.suggestedMetadata;
  const scores = suggestion.confidenceScores;

  // Local state for editing
  const [editedMetadata, setEditedMetadata] = useState(metadata);

  /**
   * Get confidence color
   */
  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * Save edits
   */
  const handleSave = () => {
    updateSuggestion(fileIndex, editedMetadata);
    setIsEditing(false);
  };

  /**
   * Approve suggestion
   */
  const handleApprove = () => {
    if (isEditing) {
      handleSave();
    }
    approveSuggestion(fileIndex);
    onClose();
  };

  /**
   * Toggle multi-select arrays
   */
  const toggleArrayValue = <T extends string>(
    field: 'ownership_model' | 'applicable_populations' | 'applicable_states',
    value: T
  ) => {
    const currentArray = editedMetadata[field] as T[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];

    setEditedMetadata({
      ...editedMetadata,
      [field]: newArray,
    });
  };

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Metadata Suggestion
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              {isEditing ? 'Cancel Edit' : 'Edit'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filename */}
        <div>
          <p className="text-sm font-medium mb-1">Original Filename</p>
          <p className="text-sm text-muted-foreground">{fileState.file.name}</p>
        </div>

        {/* Document Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="document_name">Document Name</Label>
            <Badge
              variant="outline"
              className={getConfidenceColor(scores.category)}
            >
              {scores.category}% confident
            </Badge>
          </div>
          {isEditing ? (
            <Input
              id="document_name"
              value={editedMetadata.document_name}
              onChange={(e) =>
                setEditedMetadata({
                  ...editedMetadata,
                  document_name: e.target.value,
                })
              }
            />
          ) : (
            <p className="text-sm p-2 bg-muted rounded">
              {metadata.document_name}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="category">Category</Label>
            <Progress value={scores.category} className="w-24 h-2" />
          </div>
          {isEditing ? (
            <Select
              value={editedMetadata.category}
              onValueChange={(value) =>
                setEditedMetadata({
                  ...editedMetadata,
                  category: value as DocumentCategory,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="secondary">
              {metadata.category.charAt(0).toUpperCase() +
                metadata.category.slice(1)}
            </Badge>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Description</Label>
            <Badge
              variant="outline"
              className={getConfidenceColor(scores.description)}
            >
              {scores.description}% confident
            </Badge>
          </div>
          {isEditing ? (
            <Textarea
              id="description"
              value={editedMetadata.description}
              onChange={(e) =>
                setEditedMetadata({
                  ...editedMetadata,
                  description: e.target.value,
                })
              }
              rows={3}
            />
          ) : (
            <p className="text-sm p-2 bg-muted rounded">
              {metadata.description}
            </p>
          )}
        </div>

        {/* Applicable States */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Applicable States</Label>
            <Badge
              variant="outline"
              className={getConfidenceColor(scores.applicable_states)}
            >
              {scores.applicable_states}% confident
            </Badge>
          </div>
          {isEditing ? (
            <div className="grid grid-cols-6 gap-2">
              {US_STATES.map((state) => (
                <Button
                  key={state}
                  type="button"
                  variant={
                    editedMetadata.applicable_states.includes(state)
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => toggleArrayValue('applicable_states', state)}
                  className="h-8"
                >
                  {state}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {metadata.applicable_states.length > 0 ? (
                metadata.applicable_states.map((state) => (
                  <Badge key={state} variant="secondary">
                    {state}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          )}
        </div>

        {/* Ownership Model */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Ownership Model</Label>
            <Badge
              variant="outline"
              className={getConfidenceColor(scores.ownership_model)}
            >
              {scores.ownership_model}% confident
            </Badge>
          </div>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {OWNERSHIP_MODELS.map((model) => (
                <Button
                  key={model}
                  type="button"
                  variant={
                    editedMetadata.ownership_model.includes(model)
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => toggleArrayValue('ownership_model', model)}
                >
                  {model === 'llc'
                    ? 'LLC'
                    : model.charAt(0).toUpperCase() + model.slice(1)}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {metadata.ownership_model.length > 0 ? (
                metadata.ownership_model.map((model) => (
                  <Badge key={model} variant="secondary">
                    {model === 'llc'
                      ? 'LLC'
                      : model.charAt(0).toUpperCase() + model.slice(1)}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          )}
        </div>

        {/* Applicable Populations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Applicable Populations</Label>
            <Badge
              variant="outline"
              className={getConfidenceColor(scores.applicable_populations)}
            >
              {scores.applicable_populations}% confident
            </Badge>
          </div>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {APPLICABLE_POPULATIONS.map((pop) => (
                <Button
                  key={pop}
                  type="button"
                  variant={
                    editedMetadata.applicable_populations.includes(pop)
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    toggleArrayValue('applicable_populations', pop)
                  }
                >
                  {pop
                    .split('_')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {metadata.applicable_populations.length > 0 ? (
                metadata.applicable_populations.map((pop) => (
                  <Badge key={pop} variant="secondary">
                    {pop
                      .split('_')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          )}
        </div>

        {/* Difficulty */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Badge
              variant="outline"
              className={getConfidenceColor(scores.difficulty)}
            >
              {scores.difficulty}% confident
            </Badge>
          </div>
          {isEditing ? (
            <Select
              value={editedMetadata.difficulty || 'none'}
              onValueChange={(value) =>
                setEditedMetadata({
                  ...editedMetadata,
                  difficulty:
                    value === 'none'
                      ? null
                      : (value as DifficultyLevel),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {DIFFICULTY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="secondary">
              {metadata.difficulty
                ? metadata.difficulty.charAt(0).toUpperCase() +
                  metadata.difficulty.slice(1)
                : 'Not specified'}
            </Badge>
          )}
        </div>

        {/* AI Analysis Notes */}
        <div className="space-y-2 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">AI Analysis Notes</p>
          <p className="text-xs text-muted-foreground">
            {suggestion.analysisNotes}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleApprove} className="flex-1 gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {isEditing ? 'Save & Approve' : 'Approve'}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
