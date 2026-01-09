// CEO Preferences Service
// CRUD operations for ceo_preferences table (key-value structure)
// Table columns: id, category, key, value (JSONB), notes, created_at, updated_at

import { supabase } from '@/integrations/supabase/client';
import type {
  CEOPreferences,
  CEOContextCompleteness,
  CEOContextSection,
  CEONutrition,
  CEOMIORecommendation,
  CEOActivePolicy,
  CEOPremiumSchedule,
  CEOCoverageTarget,
  CEOPremiumPayment,
  CEOPremiumBlock,
  CEOVisionBlueprint,
  VisionSynthesizedOutput,
} from '@/types/ceoDashboard';
import {
  DEFAULT_ACTIVE_POLICY,
  DEFAULT_PREMIUM_SCHEDULE,
  DEFAULT_VISION_BLUEPRINT,
} from '@/types/ceoDashboard';

// CEO email for access control
const CEO_EMAIL = 'kes@purposewaze.com';

// ============================================================================
// TYPE DEFINITIONS FOR KEY-VALUE TABLE
// ============================================================================

interface PreferenceRow {
  id: string;
  category: string;
  key: string;
  value: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ACCESS CONTROL
// ============================================================================

/**
 * Check if the current user is the CEO
 */
export const isCEOUser = async (): Promise<boolean> => {
  console.log('[isCEOUser] Checking auth...');
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('[isCEOUser] User email:', user?.email);
  console.log('[isCEOUser] Auth error:', error?.message || 'none');
  console.log('[isCEOUser] CEO_EMAIL:', CEO_EMAIL);
  const result = user?.email?.toLowerCase() === CEO_EMAIL.toLowerCase();
  console.log('[isCEOUser] Match result:', result);
  return result;
};

/**
 * Get current user ID if they are the CEO
 */
export const getCEOUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email?.toLowerCase() === CEO_EMAIL.toLowerCase()) {
    return user.id;
  }
  return null;
};

// ============================================================================
// FETCH OPERATIONS - KEY-VALUE TABLE
// ============================================================================

/**
 * Fetch all CEO preferences from key-value table and transform to object
 */
export const fetchCEOPreferences = async (): Promise<CEOPreferences | null> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      console.warn('[CEOPreferences] User is not authorized');
      return null;
    }

    // Fetch all rows from ceo_preferences (no user_id filter - single-user table)
    const { data, error } = await supabase
      .from('ceo_preferences')
      .select('*');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('[CEOPreferences] No preferences found');
      return null;
    }

    // Transform key-value rows into nested object
    const preferences = transformRowsToPreferences(data as PreferenceRow[]);
    return preferences;
  } catch (error) {
    console.error('[CEOPreferences] Error fetching:', error);
    throw error;
  }
};

/**
 * Transform key-value rows into CEOPreferences object
 */
function transformRowsToPreferences(rows: PreferenceRow[]): CEOPreferences {
  const prefs: CEOPreferences = {
    id: 'ceo-prefs',
    family: {
      wife: { name: '', birthday: '', preferences: [], gift_ideas: [] },
      children: [],
    },
    business: {
      companies: [],
      priorities: [],
      projects: [],
    },
    health: {
      fasting: { type: '', window_start: '', window_end: '', current_day: null, start_date: '', end_date: '' },
      sleep_goal_hours: null,
      wake_time: '',
      bedtime: '',
      workout_types: [],
      workout_schedule: [],
      workout_days: [],
      workout_notes: '',
    },
    communication: {
      name: '',
      timezone: '',
      style_preference: '',
      response_format: '',
    },
    locations: {
      home_address: '',
      home_city: '',
      home_state: '',
      home_zip: '',
      office_address: '',
      office_city: '',
      office_state: '',
      office_zip: '',
    },
    created_at: rows[0]?.created_at || new Date().toISOString(),
    updated_at: rows[0]?.updated_at || new Date().toISOString(),
  };

  for (const row of rows) {
    const { category, key, value } = row;

    switch (category) {
      case 'family':
        if (key === 'wife' && value) {
          prefs.family.wife = {
            name: value.name || '',
            birthday: value.birthday || '',
            preferences: value.preferences || [],
            gift_ideas: value.gift_ideas || [],
          };
        } else if (key === 'children' && Array.isArray(value)) {
          prefs.family.children = value.map((c: any) => ({
            id: c.id || generateId(),
            name: c.name || '',
            birthday: c.birthday || '',
            age: c.age || null,
            preferences: c.preferences || [],
            school: c.school || '',
          }));
        }
        break;

      case 'business':
        if (key === 'companies' && Array.isArray(value)) {
          prefs.business.companies = value.map((c: any) => ({
            id: c.id || generateId(),
            name: c.name || '',
            role: c.role || 'CEO',
            industry: c.industry || '',
            status: c.status || 'active',
            website: c.website || '',
            notes: c.notes || '',
          }));
        } else if (key === 'priorities' && Array.isArray(value)) {
          prefs.business.priorities = value;
        } else if (key === 'projects' && Array.isArray(value)) {
          prefs.business.projects = value.map((p: any) => ({
            id: p.id || generateId(),
            name: p.name || '',
            deadline: p.deadline || '',
            status: p.status || 'active',
            company_id: p.company_id || '',
          }));
        }
        break;

      case 'health':
        if (key === 'fasting' && value) {
          prefs.health.fasting = {
            type: value.type || '',
            window_start: value.window_start || '',
            window_end: value.window_end || '',
            current_day: value.current_day || null,
            start_date: value.start_date || '',
            end_date: value.end_date || '',
          };
        } else if (key === 'sleep' && value) {
          prefs.health.sleep_goal_hours = value.goal_hours || null;
          prefs.health.wake_time = value.wake_time || '';
          prefs.health.bedtime = value.bedtime || '';
        } else if (key === 'workout' && value) {
          prefs.health.workout_types = value.types || [];
          prefs.health.workout_schedule = value.schedule || [];
          prefs.health.workout_days = value.days || [];
          prefs.health.workout_notes = value.notes || '';
        }
        break;

      case 'communication':
        if (key === 'name' && value) {
          if (typeof value === 'string') {
            prefs.communication.name = value;
          } else {
            prefs.communication.name = value.name || '';
            (prefs.communication as any).preferred_name = value.preferred_name || '';
          }
        } else if (key === 'timezone' && value) {
          prefs.communication.timezone = typeof value === 'string' ? value : (value.timezone || '');
        } else if (key === 'style' && value) {
          prefs.communication.style_preference = value.preference || '';
          prefs.communication.response_format = value.response_format || '';
        }
        break;

      case 'locations':
        if (key === 'home' && value) {
          prefs.locations.home_address = value.address || '';
          prefs.locations.home_city = value.city || '';
          prefs.locations.home_state = value.state || '';
          prefs.locations.home_zip = value.zip || '';
        } else if (key === 'office' && value) {
          prefs.locations.office_address = value.address || '';
          prefs.locations.office_city = value.city || '';
          prefs.locations.office_state = value.state || '';
          prefs.locations.office_zip = value.zip || '';
        }
        break;
    }
  }

  return prefs;
}

// ============================================================================
// UPDATE OPERATIONS - KEY-VALUE TABLE
// ============================================================================

/**
 * Update a specific preference in the key-value table (UPSERT)
 * Uses upsert to create the row if it doesn't exist
 */
export const updatePreference = async (
  category: string,
  key: string,
  value: any
): Promise<void> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized: Only CEO can update preferences');
    }

    // Use upsert to create row if it doesn't exist
    const { error } = await supabase
      .from('ceo_preferences')
      .upsert(
        {
          category: category,
          key: key,
          value: value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'category,key',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error(`[CEOPreferences] Upsert error for ${category}/${key}:`, error);
      throw error;
    }

    console.log(`[CEOPreferences] Successfully saved ${category}/${key}`);
  } catch (error) {
    console.error(`[CEOPreferences] Error updating ${category}/${key}:`, error);
    throw error;
  }
};

/**
 * Save CEO preferences by updating multiple key-value rows
 */
export const saveCEOPreferences = async (
  preferences: Partial<CEOPreferences>
): Promise<CEOPreferences> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized: Only CEO can save preferences');
    }

    const updates: Array<{ category: string; key: string; value: any }> = [];

    // Family updates
    if (preferences.family?.wife) {
      updates.push({
        category: 'family',
        key: 'wife',
        value: preferences.family.wife,
      });
    }
    if (preferences.family?.children) {
      updates.push({
        category: 'family',
        key: 'children',
        value: preferences.family.children,
      });
    }

    // Business updates
    if (preferences.business?.companies !== undefined) {
      updates.push({
        category: 'business',
        key: 'companies',
        value: preferences.business.companies,
      });
    }
    if (preferences.business?.priorities) {
      updates.push({
        category: 'business',
        key: 'priorities',
        value: preferences.business.priorities,
      });
    }
    if (preferences.business?.projects) {
      updates.push({
        category: 'business',
        key: 'projects',
        value: preferences.business.projects,
      });
    }

    // Health updates
    if (preferences.health?.fasting) {
      updates.push({
        category: 'health',
        key: 'fasting',
        value: preferences.health.fasting,
      });
    }
    if (preferences.health?.sleep_goal_hours !== undefined ||
        preferences.health?.wake_time !== undefined ||
        preferences.health?.bedtime !== undefined) {
      updates.push({
        category: 'health',
        key: 'sleep',
        value: {
          goal_hours: preferences.health.sleep_goal_hours,
          wake_time: preferences.health.wake_time,
          bedtime: preferences.health.bedtime,
        },
      });
    }
    if (preferences.health?.workout_types !== undefined ||
        preferences.health?.workout_schedule !== undefined ||
        preferences.health?.workout_days !== undefined ||
        preferences.health?.workout_notes !== undefined) {
      updates.push({
        category: 'health',
        key: 'workout',
        value: {
          types: preferences.health.workout_types || [],
          schedule: preferences.health.workout_schedule || [],
          days: preferences.health.workout_days || [],
          notes: preferences.health.workout_notes || '',
        },
      });
    }

    // Communication updates - save all communication data together
    if (preferences.communication) {
      const comm = preferences.communication as any;
      // Save name
      if (comm.name !== undefined) {
        updates.push({
          category: 'communication',
          key: 'name',
          value: { name: comm.name, preferred_name: comm.preferred_name || '' },
        });
      }
      // Save timezone
      if (comm.timezone !== undefined) {
        updates.push({
          category: 'communication',
          key: 'timezone',
          value: comm.timezone,
        });
      }
      // Save style
      if (comm.style_preference !== undefined || comm.response_format !== undefined) {
        updates.push({
          category: 'communication',
          key: 'style',
          value: {
            preference: comm.style_preference || '',
            response_format: comm.response_format || '',
          },
        });
      }
    }

    // Location updates
    if (preferences.locations?.home_address !== undefined ||
        preferences.locations?.home_city !== undefined ||
        preferences.locations?.home_state !== undefined ||
        preferences.locations?.home_zip !== undefined) {
      updates.push({
        category: 'locations',
        key: 'home',
        value: {
          address: preferences.locations.home_address,
          city: preferences.locations.home_city,
          state: preferences.locations.home_state,
          zip: preferences.locations.home_zip,
        },
      });
    }
    if (preferences.locations?.office_address !== undefined ||
        preferences.locations?.office_city !== undefined ||
        preferences.locations?.office_state !== undefined ||
        preferences.locations?.office_zip !== undefined) {
      updates.push({
        category: 'locations',
        key: 'office',
        value: {
          address: preferences.locations.office_address,
          city: preferences.locations.office_city,
          state: preferences.locations.office_state,
          zip: preferences.locations.office_zip,
        },
      });
    }

    // Execute all updates
    for (const update of updates) {
      await updatePreference(update.category, update.key, update.value);
    }

    // Fetch and return updated preferences
    const updated = await fetchCEOPreferences();
    if (!updated) {
      throw new Error('Failed to fetch updated preferences');
    }
    return updated;
  } catch (error) {
    console.error('[CEOPreferences] Error saving:', error);
    throw error;
  }
};

/**
 * Update a specific section of preferences
 */
export const updatePreferencesSection = async <K extends keyof CEOPreferences>(
  section: K,
  data: CEOPreferences[K]
): Promise<CEOPreferences> => {
  return saveCEOPreferences({ [section]: data } as Partial<CEOPreferences>);
};

// ============================================================================
// CONTEXT COMPLETENESS CALCULATION
// ============================================================================

/**
 * Calculate completeness percentage for CEO context
 */
export const calculateContextCompleteness = (
  preferences: CEOPreferences | null,
  documentsCount: number = 0,
  factsCount: number = 0
): CEOContextCompleteness => {
  const sections: CEOContextSection[] = [];

  // Profile & Family Section
  if (preferences) {
    const familyFields = [
      preferences.communication?.name,
      preferences.communication?.timezone,
      preferences.family?.wife?.name,
      preferences.locations?.home_city,
      preferences.locations?.home_state,
    ];
    const familyCompleted = familyFields.filter(Boolean).length;
    const familyChildrenBonus = preferences.family?.children?.length > 0 ? 1 : 0;

    sections.push({
      name: 'Profile & Family',
      key: 'family',
      completed: familyCompleted + familyChildrenBonus,
      total: familyFields.length + 1, // +1 for children
      percentage: Math.round(((familyCompleted + familyChildrenBonus) / (familyFields.length + 1)) * 100),
    });

    // Business Section
    const companiesBonus = preferences.business?.companies?.length > 0 ? 1 : 0;
    const prioritiesBonus = preferences.business?.priorities?.length > 0 ? 1 : 0;
    const projectsBonus = preferences.business?.projects?.length > 0 ? 1 : 0;
    const businessCompleted = companiesBonus + prioritiesBonus + projectsBonus;

    sections.push({
      name: 'Business',
      key: 'business',
      completed: businessCompleted,
      total: 3, // companies, priorities, projects
      percentage: Math.round((businessCompleted / 3) * 100),
    });

    // Health Section
    const healthFields = [
      preferences.health?.fasting?.type,
      preferences.health?.fasting?.window_start,
      preferences.health?.fasting?.window_end,
      preferences.health?.sleep_goal_hours,
      preferences.health?.wake_time,
    ];
    const healthCompleted = healthFields.filter(Boolean).length;
    const workoutBonus = preferences.health?.workout_types?.length > 0 ? 1 : 0;

    sections.push({
      name: 'Health & Wellness',
      key: 'health',
      completed: healthCompleted + workoutBonus,
      total: healthFields.length + 1,
      percentage: Math.round(((healthCompleted + workoutBonus) / (healthFields.length + 1)) * 100),
    });
  } else {
    sections.push(
      { name: 'Profile & Family', key: 'family', completed: 0, total: 6, percentage: 0 },
      { name: 'Business', key: 'business', completed: 0, total: 3, percentage: 0 },
      { name: 'Health & Wellness', key: 'health', completed: 0, total: 6, percentage: 0 }
    );
  }

  // Documents Section
  const docsTarget = 3; // Target number of documents
  sections.push({
    name: 'Documents',
    key: 'documents',
    completed: Math.min(documentsCount, docsTarget),
    total: docsTarget,
    percentage: Math.min(Math.round((documentsCount / docsTarget) * 100), 100),
  });

  // Facts Section
  const factsTarget = 10; // Target number of verified facts
  sections.push({
    name: 'What MIO Knows',
    key: 'facts',
    completed: Math.min(factsCount, factsTarget),
    total: factsTarget,
    percentage: Math.min(Math.round((factsCount / factsTarget) * 100), 100),
  });

  // Calculate overall
  const totalCompleted = sections.reduce((sum, s) => sum + s.completed, 0);
  const totalFields = sections.reduce((sum, s) => sum + s.total, 0);
  const overallPercentage = Math.round((totalCompleted / totalFields) * 100);

  return {
    sections,
    overallPercentage,
    totalCompleted,
    totalFields,
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID for new items
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format time for display
 */
export const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// ============================================================================
// NUTRITION OPERATIONS
// ============================================================================

/**
 * Default nutrition data
 */
const DEFAULT_NUTRITION: CEONutrition = {
  macros: {
    daily_calories: null,
    protein_grams: null,
    carbs_grams: null,
    fat_grams: null,
    fiber_grams: null,
    auto_calculate: false,
    goal_type: 'maintain',
  },
  hydration: {
    daily_goal_oz: 100,
    reminder_enabled: false,
    reminder_interval_hours: 2,
  },
  supplements: [],
  favorite_meals: [],
  dietary_preferences: {
    diet_type: 'balanced',
    allergies: [],
    foods_to_avoid: [],
    foods_to_prioritize: [],
    eating_window_start: '',
    eating_window_end: '',
    meal_frequency: 3,
  },
};

/**
 * Fetch CEO nutrition data from key-value table
 */
export const fetchCEONutrition = async (): Promise<CEONutrition> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      console.warn('[CEONutrition] User is not authorized');
      return DEFAULT_NUTRITION;
    }

    // Fetch all nutrition rows
    const { data, error } = await supabase
      .from('ceo_preferences')
      .select('*')
      .eq('category', 'nutrition');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('[CEONutrition] No nutrition data found, returning defaults');
      return DEFAULT_NUTRITION;
    }

    // Transform rows into nutrition object
    const nutrition: CEONutrition = { ...DEFAULT_NUTRITION };

    for (const row of data as PreferenceRow[]) {
      const { key, value } = row;
      switch (key) {
        case 'macros':
          if (value) {
            nutrition.macros = {
              daily_calories: value.daily_calories ?? null,
              protein_grams: value.protein_grams ?? null,
              carbs_grams: value.carbs_grams ?? null,
              fat_grams: value.fat_grams ?? null,
              fiber_grams: value.fiber_grams ?? null,
              auto_calculate: value.auto_calculate ?? false,
              goal_type: value.goal_type ?? 'maintain',
            };
          }
          break;
        case 'hydration':
          if (value) {
            nutrition.hydration = {
              daily_goal_oz: value.daily_goal_oz ?? 100,
              reminder_enabled: value.reminder_enabled ?? false,
              reminder_interval_hours: value.reminder_interval_hours ?? 2,
            };
          }
          break;
        case 'supplements':
          if (Array.isArray(value)) {
            nutrition.supplements = value.map((s: any) => ({
              id: s.id || generateId(),
              name: s.name || '',
              dosage: s.dosage || '',
              timing: s.timing || 'morning',
              days: s.days || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
              notes: s.notes || '',
              is_active: s.is_active ?? true,
            }));
          }
          break;
        case 'favorite_meals':
          if (Array.isArray(value)) {
            nutrition.favorite_meals = value.map((m: any) => ({
              id: m.id || generateId(),
              name: m.name || '',
              meal_type: m.meal_type || 'lunch',
              calories: m.calories ?? null,
              protein: m.protein ?? null,
              carbs: m.carbs ?? null,
              fat: m.fat ?? null,
              ingredients: m.ingredients || [],
              prep_time_mins: m.prep_time_mins ?? null,
              notes: m.notes || '',
            }));
          }
          break;
        case 'dietary_preferences':
          if (value) {
            nutrition.dietary_preferences = {
              diet_type: value.diet_type || 'balanced',
              allergies: value.allergies || [],
              foods_to_avoid: value.foods_to_avoid || [],
              foods_to_prioritize: value.foods_to_prioritize || [],
              eating_window_start: value.eating_window_start || '',
              eating_window_end: value.eating_window_end || '',
              meal_frequency: value.meal_frequency ?? 3,
            };
          }
          break;
      }
    }

    return nutrition;
  } catch (error) {
    console.error('[CEONutrition] Error fetching:', error);
    return DEFAULT_NUTRITION;
  }
};

/**
 * Save CEO nutrition data to key-value table
 */
export const saveCEONutrition = async (nutrition: CEONutrition): Promise<CEONutrition> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized: Only CEO can save nutrition data');
    }

    // Save each nutrition section as a separate row
    const updates = [
      { category: 'nutrition', key: 'macros', value: nutrition.macros },
      { category: 'nutrition', key: 'hydration', value: nutrition.hydration },
      { category: 'nutrition', key: 'supplements', value: nutrition.supplements },
      { category: 'nutrition', key: 'favorite_meals', value: nutrition.favorite_meals },
      { category: 'nutrition', key: 'dietary_preferences', value: nutrition.dietary_preferences },
    ];

    for (const update of updates) {
      await updatePreference(update.category, update.key, update.value);
    }

    console.log('[CEONutrition] Successfully saved all nutrition data');
    return nutrition;
  } catch (error) {
    console.error('[CEONutrition] Error saving:', error);
    throw error;
  }
};

// ============================================================================
// MIO RECOMMENDATIONS OPERATIONS
// Nutrition recommendations saved by MIO from conversations
// ============================================================================

/**
 * Format a key to a display title (e.g., "healthy_snacks" → "Healthy Snacks")
 */
function formatKeyToTitle(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Fetch MIO recommendations from ceo_preferences table
 * These are nutrition entries saved by MIO during conversations
 */
export const fetchMIORecommendations = async (): Promise<CEOMIORecommendation[]> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      console.warn('[MIORecommendations] User is not authorized');
      return [];
    }

    // Fetch all nutrition rows that are NOT the standard nutrition keys
    // Standard keys: macros, hydration, supplements, favorite_meals, dietary_preferences
    const standardKeys = ['macros', 'hydration', 'supplements', 'favorite_meals', 'dietary_preferences'];

    const { data, error } = await supabase
      .from('ceo_preferences')
      .select('*')
      .eq('category', 'nutrition')
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('[MIORecommendations] No MIO recommendations found');
      return [];
    }

    // Filter out standard nutrition keys and transform to MIO recommendations
    const mioRecommendations: CEOMIORecommendation[] = data
      .filter((row: PreferenceRow) => !standardKeys.includes(row.key))
      .map((row: PreferenceRow) => ({
        id: row.id,
        key: row.key,
        title: formatKeyToTitle(row.key),
        content: row.value || {},
        source: 'mio' as const,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

    console.log(`[MIORecommendations] Found ${mioRecommendations.length} MIO recommendations`);
    return mioRecommendations;
  } catch (error) {
    console.error('[MIORecommendations] Error fetching:', error);
    return [];
  }
};

/**
 * Delete a MIO recommendation by its ID
 */
export const deleteMIORecommendation = async (id: string): Promise<void> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized: Only CEO can delete MIO recommendations');
    }

    const { error } = await supabase
      .from('ceo_preferences')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    console.log(`[MIORecommendations] Successfully deleted recommendation ${id}`);
  } catch (error) {
    console.error('[MIORecommendations] Error deleting:', error);
    throw error;
  }
};

// ============================================================================
// ACTIVE POLICY OPERATIONS (12 Week Domination)
// ============================================================================

/**
 * Fetch the current active policy
 */
export const fetchActivePolicy = async (): Promise<CEOActivePolicy> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      console.warn('[ActivePolicy] User is not authorized');
      return DEFAULT_ACTIVE_POLICY;
    }

    // Fetch active policy from ceo_preferences
    const { data, error } = await supabase
      .from('ceo_preferences')
      .select('*')
      .eq('category', 'policy')
      .eq('key', 'active_policy')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - return default
        console.log('[ActivePolicy] No active policy found, returning default');
        return DEFAULT_ACTIVE_POLICY;
      }
      throw error;
    }

    if (!data || !data.value) {
      return DEFAULT_ACTIVE_POLICY;
    }

    // Transform value to typed object
    const value = data.value as any;
    const policy: CEOActivePolicy = {
      id: data.id,
      quarter: value.quarter || 'Q1',
      year: value.year || new Date().getFullYear(),
      start_date: value.start_date || '',
      end_date: value.end_date || '',
      current_week: value.current_week || 1,
      coverage_targets: (value.coverage_targets || []).map((t: any) => ({
        id: t.id || generateId(),
        title: t.title || '',
        description: t.description || '',
        order: t.order || 1,
        claim_payout: {
          name: t.claim_payout?.name || '',
          target_value: t.claim_payout?.target_value || 0,
          current_value: t.claim_payout?.current_value || 0,
          unit: t.claim_payout?.unit || '',
        },
        coverage_activity: {
          name: t.coverage_activity?.name || '',
          target_per_week: t.coverage_activity?.target_per_week || 0,
          current_week_value: t.coverage_activity?.current_week_value || 0,
          unit: t.coverage_activity?.unit || '',
        },
        premium_payments: (t.premium_payments || []).map((p: any) => ({
          id: p.id || generateId(),
          name: p.name || '',
          frequency: p.frequency || 'weekly',
          specific_days: p.specific_days || [],
          target_count: p.target_count || 1,
          current_week_count: p.current_week_count || 0,
          notes: p.notes || '',
        })),
        status: t.status || 'on-track',
      })),
      policy_health_history: (value.policy_health_history || []).map((h: any) => ({
        week_number: h.week_number || 1,
        score_percentage: h.score_percentage || 0,
        premiums_paid: h.premiums_paid || 0,
        premiums_due: h.premiums_due || 0,
        date: h.date || '',
      })),
      policy_review_day: value.policy_review_day || 'monday',
      policy_review_time: value.policy_review_time || '08:00',
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return policy;
  } catch (error) {
    console.error('[ActivePolicy] Error fetching:', error);
    return DEFAULT_ACTIVE_POLICY;
  }
};

/**
 * Save the active policy
 */
export const saveActivePolicy = async (policy: CEOActivePolicy): Promise<CEOActivePolicy> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized: Only CEO can save active policy');
    }

    await updatePreference('policy', 'active_policy', policy);
    console.log('[ActivePolicy] Successfully saved active policy');
    return policy;
  } catch (error) {
    console.error('[ActivePolicy] Error saving:', error);
    throw error;
  }
};

/**
 * Update a specific coverage target within the active policy
 */
export const updateCoverageTarget = async (
  targetId: string,
  updates: Partial<CEOCoverageTarget>
): Promise<CEOActivePolicy> => {
  try {
    const policy = await fetchActivePolicy();
    const targetIndex = policy.coverage_targets.findIndex((t) => t.id === targetId);

    if (targetIndex === -1) {
      throw new Error(`Coverage target ${targetId} not found`);
    }

    policy.coverage_targets[targetIndex] = {
      ...policy.coverage_targets[targetIndex],
      ...updates,
    };

    return saveActivePolicy(policy);
  } catch (error) {
    console.error('[ActivePolicy] Error updating coverage target:', error);
    throw error;
  }
};

/**
 * Add a new coverage target to the active policy
 */
export const addCoverageTarget = async (
  target: CEOCoverageTarget
): Promise<CEOActivePolicy> => {
  try {
    const policy = await fetchActivePolicy();

    if (policy.coverage_targets.length >= 3) {
      throw new Error('Maximum of 3 coverage targets allowed per policy');
    }

    policy.coverage_targets.push(target);
    return saveActivePolicy(policy);
  } catch (error) {
    console.error('[ActivePolicy] Error adding coverage target:', error);
    throw error;
  }
};

/**
 * Remove a coverage target from the active policy
 */
export const removeCoverageTarget = async (targetId: string): Promise<CEOActivePolicy> => {
  try {
    const policy = await fetchActivePolicy();
    policy.coverage_targets = policy.coverage_targets.filter((t) => t.id !== targetId);
    return saveActivePolicy(policy);
  } catch (error) {
    console.error('[ActivePolicy] Error removing coverage target:', error);
    throw error;
  }
};

/**
 * Update premium payment completion count
 */
export const updatePremiumPaymentCount = async (
  targetId: string,
  paymentId: string,
  newCount: number
): Promise<CEOActivePolicy> => {
  try {
    const policy = await fetchActivePolicy();
    const target = policy.coverage_targets.find((t) => t.id === targetId);

    if (!target) {
      throw new Error(`Coverage target ${targetId} not found`);
    }

    const payment = target.premium_payments.find((p) => p.id === paymentId);
    if (!payment) {
      throw new Error(`Premium payment ${paymentId} not found`);
    }

    payment.current_week_count = newCount;
    return saveActivePolicy(policy);
  } catch (error) {
    console.error('[ActivePolicy] Error updating premium payment count:', error);
    throw error;
  }
};

/**
 * Record weekly policy health score
 */
export const recordPolicyHealthScore = async (
  score: { score_percentage: number; premiums_paid: number; premiums_due: number }
): Promise<CEOActivePolicy> => {
  try {
    const policy = await fetchActivePolicy();
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday

    const newScore = {
      week_number: policy.current_week,
      score_percentage: score.score_percentage,
      premiums_paid: score.premiums_paid,
      premiums_due: score.premiums_due,
      date: weekStart.toISOString().split('T')[0],
    };

    // Check if we already have a score for this week
    const existingIndex = policy.policy_health_history.findIndex(
      (h) => h.week_number === policy.current_week
    );

    if (existingIndex >= 0) {
      policy.policy_health_history[existingIndex] = newScore;
    } else {
      policy.policy_health_history.push(newScore);
    }

    return saveActivePolicy(policy);
  } catch (error) {
    console.error('[ActivePolicy] Error recording policy health score:', error);
    throw error;
  }
};

// ============================================================================
// PREMIUM SCHEDULE OPERATIONS (Model Week)
// ============================================================================

/**
 * Fetch the premium schedule (model week)
 */
export const fetchPremiumSchedule = async (): Promise<CEOPremiumSchedule> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      console.warn('[PremiumSchedule] User is not authorized');
      return DEFAULT_PREMIUM_SCHEDULE;
    }

    // Fetch schedule from ceo_preferences
    const { data, error } = await supabase
      .from('ceo_preferences')
      .select('*')
      .eq('category', 'schedule')
      .eq('key', 'premium_schedule')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[PremiumSchedule] No schedule found, returning default');
        return DEFAULT_PREMIUM_SCHEDULE;
      }
      throw error;
    }

    if (!data || !data.value) {
      return DEFAULT_PREMIUM_SCHEDULE;
    }

    const value = data.value as any;
    const schedule: CEOPremiumSchedule = {
      id: data.id,
      monday: transformTimeBlocks(value.monday),
      tuesday: transformTimeBlocks(value.tuesday),
      wednesday: transformTimeBlocks(value.wednesday),
      thursday: transformTimeBlocks(value.thursday),
      friday: transformTimeBlocks(value.friday),
      saturday: transformTimeBlocks(value.saturday),
      sunday: transformTimeBlocks(value.sunday),
      preferences: {
        strategic_blocks_per_day: value.preferences?.strategic_blocks_per_day ?? 2,
        buffer_blocks_per_day: value.preferences?.buffer_blocks_per_day ?? 2,
        buffer_time_minutes: value.preferences?.buffer_time_minutes ?? 15,
        work_start_time: value.preferences?.work_start_time || '08:00',
        work_end_time: value.preferences?.work_end_time || '18:00',
      },
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return schedule;
  } catch (error) {
    console.error('[PremiumSchedule] Error fetching:', error);
    return DEFAULT_PREMIUM_SCHEDULE;
  }
};

/**
 * Transform raw time blocks from database
 */
function transformTimeBlocks(blocks: any[]): CEOPremiumBlock[] {
  if (!Array.isArray(blocks)) return [];

  return blocks.map((b: any) => ({
    id: b.id || generateId(),
    start_time: b.start_time || '09:00',
    end_time: b.end_time || '12:00',
    block_type: b.block_type || 'strategic',
    title: b.title || '',
    linked_target_id: b.linked_target_id || undefined,
    linked_payment_ids: b.linked_payment_ids || [],
    notes: b.notes || '',
    is_recurring: b.is_recurring ?? true,
  }));
}

/**
 * Save the premium schedule
 */
export const savePremiumSchedule = async (
  schedule: CEOPremiumSchedule
): Promise<CEOPremiumSchedule> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized: Only CEO can save premium schedule');
    }

    await updatePreference('schedule', 'premium_schedule', schedule);
    console.log('[PremiumSchedule] Successfully saved premium schedule');
    return schedule;
  } catch (error) {
    console.error('[PremiumSchedule] Error saving:', error);
    throw error;
  }
};

/**
 * Add a time block to a specific day
 */
export const addTimeBlock = async (
  day: keyof CEOPremiumSchedule,
  block: CEOPremiumBlock
): Promise<CEOPremiumSchedule> => {
  try {
    const schedule = await fetchPremiumSchedule();

    if (day === 'preferences' || day === 'id' || day === 'created_at' || day === 'updated_at') {
      throw new Error(`Invalid day: ${day}`);
    }

    (schedule[day] as CEOPremiumBlock[]).push(block);

    // Sort blocks by start time
    (schedule[day] as CEOPremiumBlock[]).sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );

    return savePremiumSchedule(schedule);
  } catch (error) {
    console.error('[PremiumSchedule] Error adding time block:', error);
    throw error;
  }
};

/**
 * Update a time block
 */
export const updateTimeBlock = async (
  day: keyof CEOPremiumSchedule,
  blockId: string,
  updates: Partial<CEOPremiumBlock>
): Promise<CEOPremiumSchedule> => {
  try {
    const schedule = await fetchPremiumSchedule();

    if (day === 'preferences' || day === 'id' || day === 'created_at' || day === 'updated_at') {
      throw new Error(`Invalid day: ${day}`);
    }

    const blocks = schedule[day] as CEOPremiumBlock[];
    const blockIndex = blocks.findIndex((b) => b.id === blockId);

    if (blockIndex === -1) {
      throw new Error(`Time block ${blockId} not found on ${day}`);
    }

    blocks[blockIndex] = { ...blocks[blockIndex], ...updates };

    // Re-sort blocks by start time
    blocks.sort((a, b) => a.start_time.localeCompare(b.start_time));

    return savePremiumSchedule(schedule);
  } catch (error) {
    console.error('[PremiumSchedule] Error updating time block:', error);
    throw error;
  }
};

/**
 * Remove a time block
 */
export const removeTimeBlock = async (
  day: keyof CEOPremiumSchedule,
  blockId: string
): Promise<CEOPremiumSchedule> => {
  try {
    const schedule = await fetchPremiumSchedule();

    if (day === 'preferences' || day === 'id' || day === 'created_at' || day === 'updated_at') {
      throw new Error(`Invalid day: ${day}`);
    }

    (schedule[day] as CEOPremiumBlock[]) = (schedule[day] as CEOPremiumBlock[]).filter(
      (b) => b.id !== blockId
    );

    return savePremiumSchedule(schedule);
  } catch (error) {
    console.error('[PremiumSchedule] Error removing time block:', error);
    throw error;
  }
};

/**
 * Calculate weekly schedule statistics
 */
export const calculateScheduleStats = (
  schedule: CEOPremiumSchedule
): { strategic: number; buffer: number; breakout: number; total: number } => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  let strategic = 0;
  let buffer = 0;
  let breakout = 0;

  for (const day of days) {
    const blocks = schedule[day] as CEOPremiumBlock[];
    for (const block of blocks) {
      const startParts = block.start_time.split(':').map(Number);
      const endParts = block.end_time.split(':').map(Number);
      const hours = (endParts[0] + endParts[1] / 60) - (startParts[0] + startParts[1] / 60);

      switch (block.block_type) {
        case 'strategic':
          strategic += hours;
          break;
        case 'buffer':
          buffer += hours;
          break;
        case 'breakout':
          breakout += hours;
          break;
      }
    }
  }

  return {
    strategic: Math.round(strategic * 10) / 10,
    buffer: Math.round(buffer * 10) / 10,
    breakout: Math.round(breakout * 10) / 10,
    total: Math.round((strategic + buffer + breakout) * 10) / 10,
  };
};

// ============================================================================
// V.I.S.I.O.N. BLUEPRINT OPERATIONS
// Based on Vivid Vision methodology (Cameron Herold) + Mind Insurance framework
// ============================================================================

// N8n webhook URL for AI synthesis
const VISION_SYNTHESIS_WEBHOOK = 'https://n8n-n8n.vq00fr.easypanel.host/webhook/ceo-vision-synthesize';

/**
 * Fetch the V.I.S.I.O.N. Blueprint
 */
export const fetchVisionBlueprint = async (): Promise<CEOVisionBlueprint> => {
  console.log('#'.repeat(50));
  console.log('[fetchVisionBlueprint] FUNCTION CALLED - BUILD JAN1-v3');
  console.log('#'.repeat(50));

  try {
    // DEBUG: Log auth state for troubleshooting RLS issues
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[VisionBlueprint] Auth user:', user?.email, 'ID:', user?.id);
    console.log('[VisionBlueprint] Auth error:', authError?.message || 'none');
    console.log('[VisionBlueprint] Session exists:', !!user);

    const isCEO = await isCEOUser();
    console.log('[VisionBlueprint] isCEOUser result:', isCEO);

    // TEMPORARY BYPASS: Skip CEO check to debug RLS issue
    // TODO: Remove this after fixing the issue
    if (!isCEO) {
      console.warn('[VisionBlueprint] CEO check failed, but BYPASSING for debug...');
      // return DEFAULT_VISION_BLUEPRINT; // Commented out for debugging
    }

    // DEBUG v4: Query WITHOUT filters first to see if RLS blocks ALL rows
    console.log('[VisionBlueprint] DEBUG v4: Testing RLS with unfiltered query...');
    const { data: allRows, error: allError } = await supabase
      .from('ceo_preferences')
      .select('id, category, key')
      .limit(10);

    console.log('[VisionBlueprint] RLS TEST - All rows query:', {
      rowCount: allRows?.length ?? 'null',
      rows: allRows,
      errorCode: allError?.code || 'none',
      errorMsg: allError?.message || 'none',
      errorDetails: allError?.details || 'none',
      errorHint: allError?.hint || 'none'
    });

    // DEBUG: Log before query
    console.log('[VisionBlueprint] Executing Supabase query for vision blueprint...');

    // Fetch vision blueprint from ceo_preferences
    const { data, error } = await supabase
      .from('ceo_preferences')
      .select('*')
      .eq('category', 'vision')
      .eq('key', 'blueprint')
      .single();

    // DEBUG: Log query results
    console.log('[VisionBlueprint] Query result - data:', data ? 'exists' : 'null', 'error:', error?.code || 'none');

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - return default
        console.log('[VisionBlueprint] No blueprint found (PGRST116), returning default');
        return DEFAULT_VISION_BLUEPRINT;
      }
      console.error('[VisionBlueprint] Query error:', error.code, error.message);
      throw error;
    }

    if (!data || !data.value) {
      console.log('[VisionBlueprint] Data or value is null, returning default');
      return DEFAULT_VISION_BLUEPRINT;
    }

    // DEBUG: Log sections presence
    const value = data.value as any;
    if (value.sections) {
      const sectionKeys = Object.keys(value.sections);
      console.log('[VisionBlueprint] Sections found:', sectionKeys);
      console.log('[VisionBlueprint] V content length:', value.sections.V?.content?.length || 0);
    } else {
      console.log('[VisionBlueprint] NO SECTIONS in data.value');
    }

    // Transform value to typed object
    const blueprint: CEOVisionBlueprint = {
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
      synthesizedOutputs: (value.synthesizedOutputs || []).map((o: any) => ({
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

    return blueprint;
  } catch (error) {
    console.error('[VisionBlueprint] Error fetching:', error);
    return DEFAULT_VISION_BLUEPRINT;
  }
};

/**
 * Transform a vision section from database
 */
function transformVisionSection(section: any, letter: string): any {
  const { VISION_SECTIONS_CONFIG } = require('@/types/ceoDashboard');
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
 * Save the V.I.S.I.O.N. Blueprint
 */
export const saveVisionBlueprint = async (
  blueprint: CEOVisionBlueprint
): Promise<CEOVisionBlueprint> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized: Only CEO can save vision blueprint');
    }

    // Increment version
    const updatedBlueprint = {
      ...blueprint,
      version: (blueprint.version || 0) + 1,
    };

    await updatePreference('vision', 'blueprint', updatedBlueprint);
    console.log('[VisionBlueprint] Successfully saved vision blueprint');
    return updatedBlueprint;
  } catch (error) {
    console.error('[VisionBlueprint] Error saving:', error);
    throw error;
  }
};

/**
 * Update a specific section of the V.I.S.I.O.N. Blueprint
 */
export const updateVisionSection = async (
  sectionLetter: 'V' | 'I' | 'S' | 'I2' | 'O' | 'N',
  content: string
): Promise<CEOVisionBlueprint> => {
  try {
    const blueprint = await fetchVisionBlueprint();

    blueprint.sections[sectionLetter] = {
      ...blueprint.sections[sectionLetter],
      content,
      lastUpdated: new Date().toISOString(),
    };

    return saveVisionBlueprint(blueprint);
  } catch (error) {
    console.error('[VisionBlueprint] Error updating section:', error);
    throw error;
  }
};

/**
 * Trigger AI synthesis of the V.I.S.I.O.N. Blueprint via n8n webhook
 * Returns both Executive Shareable Doc and Inspirational Narrative formats
 */
export const synthesizeVision = async (
  blueprint: CEOVisionBlueprint
): Promise<{
  success: boolean;
  outputs?: VisionSynthesizedOutput[];
  error?: string;
}> => {
  try {
    const isCEO = await isCEOUser();
    if (!isCEO) {
      throw new Error('Unauthorized: Only CEO can synthesize vision');
    }

    // Update status to processing
    const processingBlueprint = {
      ...blueprint,
      synthesisStatus: 'processing' as const,
      synthesisError: undefined,
    };
    await saveVisionBlueprint(processingBlueprint);

    // Prepare payload for n8n webhook
    const payload = {
      visionHorizon: blueprint.visionHorizon,
      targetDate: blueprint.targetDate,
      sections: {
        V: blueprint.sections.V.content,
        I: blueprint.sections.I.content,
        S: blueprint.sections.S.content,
        I2: blueprint.sections.I2.content,
        O: blueprint.sections.O.content,
        N: blueprint.sections.N.content,
      },
      version: blueprint.version,
      timestamp: new Date().toISOString(),
    };

    // Call n8n webhook
    const response = await fetch(VISION_SYNTHESIS_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Synthesis failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // Transform response into VisionSynthesizedOutput format
    const outputs: VisionSynthesizedOutput[] = [];

    if (result.executive) {
      outputs.push({
        id: generateId(),
        outputType: 'executive',
        title: 'Executive Vision Document',
        content: result.executive,
        generatedAt: new Date().toISOString(),
        version: blueprint.version,
      });
    }

    if (result.narrative) {
      outputs.push({
        id: generateId(),
        outputType: 'narrative',
        title: 'Inspirational Vision Narrative',
        content: result.narrative,
        generatedAt: new Date().toISOString(),
        version: blueprint.version,
      });
    }

    // Update blueprint with synthesized outputs
    const completedBlueprint = {
      ...blueprint,
      synthesizedOutputs: outputs,
      synthesisStatus: 'completed' as const,
      synthesisError: undefined,
    };
    await saveVisionBlueprint(completedBlueprint);

    console.log('[VisionBlueprint] Synthesis completed successfully');
    return { success: true, outputs };
  } catch (error) {
    console.error('[VisionBlueprint] Synthesis error:', error);

    // Update blueprint with error status
    const errorBlueprint = {
      ...blueprint,
      synthesisStatus: 'failed' as const,
      synthesisError: error instanceof Error ? error.message : 'Unknown error',
    };
    await saveVisionBlueprint(errorBlueprint);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Reset synthesis status (e.g., to retry after failure)
 */
export const resetSynthesisStatus = async (): Promise<CEOVisionBlueprint> => {
  try {
    const blueprint = await fetchVisionBlueprint();
    const resetBlueprint = {
      ...blueprint,
      synthesisStatus: 'idle' as const,
      synthesisError: undefined,
    };
    return saveVisionBlueprint(resetBlueprint);
  } catch (error) {
    console.error('[VisionBlueprint] Error resetting synthesis status:', error);
    throw error;
  }
};
