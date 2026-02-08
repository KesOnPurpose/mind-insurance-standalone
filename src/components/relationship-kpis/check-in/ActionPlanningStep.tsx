/**
 * RKPI Check-In: ActionPlanningStep
 * Add 1-3 action items with assignment and related KPI.
 */

import { useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import type { ActionItemAssignee, RelationshipKPIName } from '@/types/relationship-kpis';

interface ActionItemDraft {
  text: string;
  assignedTo: ActionItemAssignee;
  relatedKpi: RelationshipKPIName | null;
}

interface ActionPlanningStepProps {
  initialItems: ActionItemDraft[];
  onSave: (items: ActionItemDraft[]) => void;
  onBack: () => void;
  onNext: () => void;
}

const ASSIGNEE_OPTIONS: { value: ActionItemAssignee; label: string }[] = [
  { value: 'self', label: 'Me' },
  { value: 'partner', label: 'Partner' },
  { value: 'both', label: 'Both' },
];

export function ActionPlanningStep({
  initialItems,
  onSave,
  onBack,
  onNext,
}: ActionPlanningStepProps) {
  const [items, setItems] = useState<ActionItemDraft[]>(
    initialItems.length > 0
      ? initialItems
      : [{ text: '', assignedTo: 'self', relatedKpi: null }]
  );

  const addItem = () => {
    if (items.length >= 3) return;
    setItems([...items, { text: '', assignedTo: 'self', relatedKpi: null }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updates: Partial<ActionItemDraft>) => {
    setItems(items.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  const handleNext = () => {
    const validItems = items.filter((item) => item.text.trim().length > 0);
    onSave(validItems);
    onNext();
  };

  const handleBack = () => {
    const validItems = items.filter((item) => item.text.trim().length > 0);
    onSave(validItems);
    onBack();
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-white">Action Items</h2>
        <p className="text-sm text-white/50">
          What's one thing you can do this week to strengthen your relationship?
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-2">
              <Input
                placeholder={`Action item ${index + 1}...`}
                value={item.text}
                onChange={(e) => updateItem(index, { text: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
                maxLength={200}
              />
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/30 hover:text-red-400 flex-shrink-0 h-9 w-9"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Assigned to */}
              <div className="flex gap-1">
                {ASSIGNEE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      item.assignedTo === opt.value
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                    }`}
                    onClick={() => updateItem(index, { assignedTo: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Related KPI (optional) */}
              <select
                value={item.relatedKpi ?? ''}
                onChange={(e) =>
                  updateItem(index, {
                    relatedKpi: (e.target.value || null) as RelationshipKPIName | null,
                  })
                }
                className="text-xs bg-white/5 border border-white/10 text-white/60 rounded-full px-2.5 py-1 appearance-none cursor-pointer"
              >
                <option value="">Related KPI...</option>
                {KPI_DEFINITIONS.map((kpi) => (
                  <option key={kpi.name} value={kpi.name}>
                    {kpi.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        {items.length < 3 && (
          <button
            className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
            onClick={addItem}
          >
            <Plus className="h-3.5 w-3.5" />
            Add another action item
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white/40 hover:text-white/60"
          onClick={handleBack}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          size="sm"
          className="bg-rose-500 hover:bg-rose-600 text-white"
          onClick={handleNext}
        >
          Review & Submit
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
