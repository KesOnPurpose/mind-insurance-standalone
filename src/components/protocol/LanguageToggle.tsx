import React, { useEffect, useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface LanguageToggleProps {
  currentVariant: 'clinical' | 'simplified';
  onVariantChange: (variant: 'clinical' | 'simplified') => void;
  tooltipCount?: number; // Show badge with count
  userId?: string; // Optional user ID for persistence
  className?: string;
}

export function LanguageToggle({
  currentVariant,
  onVariantChange,
  tooltipCount = 0,
  userId,
  className
}: LanguageToggleProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load user preference on mount
  useEffect(() => {
    if (!userId) return;

    const loadPreference = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('preferred_language_variant')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error loading language preference:', error);
          return;
        }

        if (data?.preferred_language_variant) {
          onVariantChange(data.preferred_language_variant as 'clinical' | 'simplified');
        }
      } catch (error) {
        console.error('Failed to load language preference:', error);
      }
    };

    loadPreference();
  }, [userId, onVariantChange]);

  // Save language preference when it changes
  const handleVariantChange = async (value: string) => {
    if (!value) return;

    const newVariant = value as 'clinical' | 'simplified';
    onVariantChange(newVariant);

    // Save to database if user is logged in
    if (userId) {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({ preferred_language_variant: newVariant })
          .eq('id', userId);

        if (error) {
          throw error;
        }

        // Show success feedback
        toast({
          title: 'Preference saved',
          description: `Language set to ${newVariant === 'clinical' ? 'Clinical' : 'Simplified'}`,
          duration: 2000,
        });
      } catch (error) {
        console.error('Failed to save language preference:', error);
        toast({
          title: 'Failed to save preference',
          description: 'Your preference will apply for this session only',
          variant: 'destructive',
          duration: 3000,
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Label
        htmlFor="language-toggle"
        className="text-sm font-medium whitespace-nowrap"
      >
        Language
      </Label>
      <ToggleGroup
        id="language-toggle"
        type="single"
        value={currentVariant}
        onValueChange={handleVariantChange}
        disabled={isSaving}
        className="border rounded-lg p-1 bg-muted/30"
      >
        <ToggleGroupItem
          value="clinical"
          aria-label="Clinical language"
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-all",
            "data-[state=on]:bg-background data-[state=on]:shadow-sm",
            "hover:bg-background/60",
          )}
        >
          Clinical
        </ToggleGroupItem>
        <ToggleGroupItem
          value="simplified"
          aria-label="Simplified language with tooltips"
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-all",
            "data-[state=on]:bg-background data-[state=on]:shadow-sm",
            "hover:bg-background/60",
            "flex items-center gap-1.5",
          )}
        >
          <span>Simplified</span>
          {tooltipCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 px-1.5 py-0 h-5 text-xs font-normal"
            >
              {tooltipCount}
            </Badge>
          )}
        </ToggleGroupItem>
      </ToggleGroup>
      {isSaving && (
        <span className="text-xs text-muted-foreground animate-pulse">
          Saving...
        </span>
      )}
    </div>
  );
}