// DocumentMetadataForm Component
// Form for editing document metadata after upload

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import {
  DOCUMENT_CATEGORIES,
  OWNERSHIP_MODELS,
  APPLICABLE_POPULATIONS,
  DIFFICULTY_LEVELS,
  US_STATES,
  formatCategory,
  formatOwnershipModel,
  formatPopulation,
  type DocumentCategory,
  type OwnershipModel,
  type ApplicablePopulation,
  type DifficultyLevel,
} from '@/types/documents';

interface DocumentMetadataFormProps {
  file: File;
  onSave: (metadata: {
    document_name: string;
    category: DocumentCategory;
    description: string;
    applicable_states: string[];
    ownership_model: OwnershipModel[];
    applicable_populations: ApplicablePopulation[];
    difficulty: DifficultyLevel | null;
  }) => void;
  onCancel: () => void;
}

export const DocumentMetadataForm = ({
  file,
  onSave,
  onCancel,
}: DocumentMetadataFormProps) => {
  const [formData, setFormData] = useState({
    document_name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
    category: 'operations' as DocumentCategory,
    description: '',
    applicable_states: [] as string[],
    ownership_model: [] as OwnershipModel[],
    applicable_populations: [] as ApplicablePopulation[],
    difficulty: null as DifficultyLevel | null,
  });

  const [stateSearch, setStateSearch] = useState('');
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  const filteredStates = US_STATES.filter((state) =>
    state.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const addState = (state: string) => {
    if (!formData.applicable_states.includes(state)) {
      setFormData((prev) => ({
        ...prev,
        applicable_states: [...prev.applicable_states, state],
      }));
    }
    setStateSearch('');
    setShowStateDropdown(false);
  };

  const removeState = (state: string) => {
    setFormData((prev) => ({
      ...prev,
      applicable_states: prev.applicable_states.filter((s) => s !== state),
    }));
  };

  const toggleOwnershipModel = (model: OwnershipModel) => {
    setFormData((prev) => ({
      ...prev,
      ownership_model: prev.ownership_model.includes(model)
        ? prev.ownership_model.filter((m) => m !== model)
        : [...prev.ownership_model, model],
    }));
  };

  const togglePopulation = (population: ApplicablePopulation) => {
    setFormData((prev) => ({
      ...prev,
      applicable_populations: prev.applicable_populations.includes(population)
        ? prev.applicable_populations.filter((p) => p !== population)
        : [...prev.applicable_populations, population],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Document Metadata</CardTitle>
        <p className="text-sm text-muted-foreground">
          Add details for: {file.name}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="document_name">Document Name *</Label>
            <Input
              id="document_name"
              value={formData.document_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, document_name: e.target.value }))
              }
              required
              placeholder="Enter document name"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value as DocumentCategory }))
              }
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {formatCategory(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe the document content..."
              rows={3}
            />
          </div>

          {/* Applicable States */}
          <div className="space-y-2">
            <Label>Applicable States</Label>
            <div className="relative">
              <Input
                value={stateSearch}
                onChange={(e) => {
                  setStateSearch(e.target.value);
                  setShowStateDropdown(true);
                }}
                onFocus={() => setShowStateDropdown(true)}
                placeholder="Search and select states..."
              />
              {showStateDropdown && filteredStates.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredStates.slice(0, 10).map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => addState(state)}
                      className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
                    >
                      {state}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.applicable_states.map((state) => (
                <Badge key={state} variant="secondary">
                  {state}
                  <button
                    type="button"
                    onClick={() => removeState(state)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Ownership Model */}
          <div className="space-y-2">
            <Label>Ownership Model</Label>
            <div className="flex flex-wrap gap-2">
              {OWNERSHIP_MODELS.map((model) => (
                <Badge
                  key={model}
                  variant={formData.ownership_model.includes(model) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleOwnershipModel(model)}
                >
                  {formatOwnershipModel(model)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Applicable Populations */}
          <div className="space-y-2">
            <Label>Applicable Populations</Label>
            <div className="flex flex-wrap gap-2">
              {APPLICABLE_POPULATIONS.map((population) => (
                <Badge
                  key={population}
                  variant={
                    formData.applicable_populations.includes(population)
                      ? 'default'
                      : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => togglePopulation(population)}
                >
                  {formatPopulation(population)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              value={formData.difficulty || 'none'}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  difficulty: value === 'none' ? null : (value as DifficultyLevel),
                }))
              }
            >
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {DIFFICULTY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Save Document</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
