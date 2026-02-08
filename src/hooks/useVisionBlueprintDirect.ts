/**
 * Direct fetch hook for V.I.S.I.O.N. Blueprint
 *
 * This hook bypasses React Query caching issues by fetching directly from Supabase.
 * Created to resolve persistent data loading issues where React Query returned
 * cached empty data despite valid database records.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  CEOVisionBlueprint,
  VisionSectionInput,
  VisionSectionType,
  VisionSynthesizedOutput,
} from '@/types/ceoDashboard';
import {
  VISION_SECTIONS_CONFIG,
  createEmptyVisionBlueprint,
} from '@/types/ceoDashboard';

// Generate a unique ID
const generateId = () => crypto.randomUUID();

/**
 * Transform raw section data from Supabase to VisionSectionInput
 */
function transformVisionSection(
  section: any,
  letter: VisionSectionType
): VisionSectionInput {
  const config = VISION_SECTIONS_CONFIG[letter];

  return {
    id: section?.id || generateId(),
    letter: letter,
    title: config?.title || '',
    subtitle: config?.subtitle || '',
    content: section?.content || '',
    guidingQuestions: config?.guidingQuestions || [],
    lastUpdated: section?.lastUpdated,
  };
}

/**
 * Transform raw Supabase data to CEOVisionBlueprint
 */
function transformToBlueprint(data: any): CEOVisionBlueprint {
  const value = data.value;

  return {
    id: data.id,
    visionHorizon: value.visionHorizon || '3-year',
    targetDate: value.targetDate || '',
    sections: {
      V: transformVisionSection(value.sections?.V, 'V'),
      I: transformVisionSection(value.sections?.I, 'I'),
      S: transformVisionSection(value.sections?.S, 'S'),
      I2: transformVisionSection(value.sections?.I2, 'I2'),
      O: transformVisionSection(value.sections?.O, 'O'),
      N: transformVisionSection(value.sections?.N, 'N'),
    },
    synthesizedOutputs: (value.synthesizedOutputs || []).map((o: any): VisionSynthesizedOutput => ({
      id: o.id || generateId(),
      outputType: o.outputType || 'executive',
      title: o.title || '',
      content: o.content || '',
      generatedAt: o.generatedAt || '',
      version: o.version || 1,
    })),
    synthesisStatus: value.synthesisStatus || 'idle',
    synthesisError: value.synthesisError,
    version: value.version || 1,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

interface UseVisionBlueprintDirectReturn {
  blueprint: CEOVisionBlueprint;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isFetching: boolean;
}

/**
 * Direct Supabase fetch hook for V.I.S.I.O.N. Blueprint
 * Bypasses React Query caching - fetches fresh data on mount and refetch
 */
export function useVisionBlueprintDirect(): UseVisionBlueprintDirectReturn {
  const [blueprint, setBlueprint] = useState<CEOVisionBlueprint>(createEmptyVisionBlueprint());
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlueprint = useCallback(async () => {
    setIsFetching(true);
    setError(null);

    try {
      // Direct Supabase query - no caching layers
      const { data, error: queryError } = await supabase
        .from('ceo_preferences')
        .select('*')
        .eq('category', 'vision')
        .eq('key', 'blueprint')
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          // No rows found - use empty blueprint
          setBlueprint(createEmptyVisionBlueprint());
        } else {
          setError(queryError.message);
        }
      } else if (data && data.value) {
        // Transform and set the blueprint
        setBlueprint(transformToBlueprint(data));
      } else {
        setBlueprint(createEmptyVisionBlueprint());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchBlueprint();
  }, [fetchBlueprint]);

  return {
    blueprint,
    isLoading,
    error,
    refetch: fetchBlueprint,
    isFetching,
  };
}

export default useVisionBlueprintDirect;
