// Inline Edit Component
// Click-to-edit field with auto-save functionality

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Check, X, Pencil, Loader2 } from 'lucide-react';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  type?: 'text' | 'date' | 'number' | 'time' | 'select';
  options?: { value: string; label: string }[];
  className?: string;
  label?: string;
  emptyText?: string;
  disabled?: boolean;
}

export function InlineEdit({
  value,
  onSave,
  placeholder = 'Click to edit',
  type = 'text',
  options = [],
  className,
  label,
  emptyText = 'Not set',
  disabled = false,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      // Reset on error
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  // Display value formatting
  const displayValue = value || emptyText;
  const isValueSet = Boolean(value);

  // Get display label for select value
  const getSelectLabel = (val: string) => {
    const option = options.find((opt) => opt.value === val);
    return option?.label || val || placeholder;
  };

  // Render select dropdown
  if (type === 'select') {
    return (
      <div className={cn('group', className)}>
        {label && (
          <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">
            {label}
          </label>
        )}
        <Select
          value={value || undefined}
          onValueChange={async (newValue) => {
            setIsSaving(true);
            try {
              await onSave(newValue);
            } finally {
              setIsSaving(false);
            }
          }}
          disabled={disabled || isSaving}
        >
          <SelectTrigger className="bg-mi-navy border-mi-cyan/30 text-white hover:border-mi-cyan/50 transition-colors">
            {isSaving ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : value ? (
              <span>{getSelectLabel(value)}</span>
            ) : (
              <span className="text-white/40">{placeholder}</span>
            )}
          </SelectTrigger>
          <SelectContent className="bg-mi-navy-light border-mi-cyan/30">
            {options.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-white hover:bg-mi-cyan/10 focus:bg-mi-cyan/10"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Render inline edit field
  return (
    <div className={cn('group', className)}>
      {label && (
        <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">
          {label}
        </label>
      )}

      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // Small delay to allow button clicks
              setTimeout(() => {
                if (!isSaving) handleSave();
              }, 150);
            }}
            placeholder={placeholder}
            disabled={isSaving}
            className="bg-mi-navy border-mi-cyan/50 text-white focus:border-mi-cyan"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => !disabled && setIsEditing(true)}
          className={cn(
            'flex items-center justify-between p-2 rounded-lg border border-transparent transition-all cursor-pointer',
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-mi-cyan/30 hover:bg-mi-cyan/5 group'
          )}
        >
          <span
            className={cn(
              'transition-colors',
              isValueSet ? 'text-white' : 'text-white/40 italic'
            )}
          >
            {displayValue}
          </span>
          {!disabled && (
            <Pencil className="h-4 w-4 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      )}
    </div>
  );
}

// Number-specific inline edit
interface InlineNumberEditProps {
  value: number;
  onSave: (value: number) => Promise<void>;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  suffix?: string;
  className?: string;
  disabled?: boolean;
}

export function InlineNumberEdit({
  value,
  onSave,
  min,
  max,
  step = 1,
  label,
  suffix = '',
  className,
  disabled = false,
}: InlineNumberEditProps) {
  const handleSave = useCallback(
    async (stringValue: string) => {
      const numValue = parseFloat(stringValue);
      if (!isNaN(numValue)) {
        await onSave(numValue);
      }
    },
    [onSave]
  );

  return (
    <InlineEdit
      value={value?.toString() || ''}
      onSave={handleSave}
      type="number"
      label={label}
      className={className}
      disabled={disabled}
      emptyText="0"
    />
  );
}

export default InlineEdit;
