// Nutrition Section Component
// Macros, Hydration, Supplements, Favorite Meals, Dietary Preferences, MIO Recommendations

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type {
  CEONutrition,
  CEOMacroGoals,
  CEOHydration,
  CEOSupplement,
  CEOFavoriteMeal,
  CEODietaryPreferences,
  CEOMIORecommendation,
  DEFAULT_CEO_NUTRITION,
} from '@/types/ceoDashboard';
import { generateId, fetchMIORecommendations, deleteMIORecommendation } from '@/services/ceoPreferencesService';
import {
  Target,
  Droplets,
  Pill,
  UtensilsCrossed,
  Salad,
  Save,
  Loader2,
  Plus,
  X,
  Edit2,
  Trash2,
  Clock,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Apple,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface NutritionSectionProps {
  nutrition: CEONutrition | null;
  onSave: (nutrition: CEONutrition) => Promise<void>;
  onMarkUnsaved: () => void;
  isSaving: boolean;
}

// Default nutrition state
const getDefaultNutrition = (): CEONutrition => ({
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
});

export function NutritionSection({
  nutrition,
  onSave,
  onMarkUnsaved,
  isSaving,
}: NutritionSectionProps) {
  // Local state for form data
  const [localData, setLocalData] = useState<CEONutrition>(
    nutrition || getDefaultNutrition()
  );
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  // Modal states for adding/editing items
  const [showSupplementForm, setShowSupplementForm] = useState(false);
  const [editingSupplement, setEditingSupplement] = useState<CEOSupplement | null>(null);
  const [showMealForm, setShowMealForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<CEOFavoriteMeal | null>(null);

  // New item inputs
  const [newAllergy, setNewAllergy] = useState('');
  const [newAvoidFood, setNewAvoidFood] = useState('');
  const [newPriorityFood, setNewPriorityFood] = useState('');

  // MIO Recommendations state
  const [mioRecommendations, setMioRecommendations] = useState<CEOMIORecommendation[]>([]);
  const [loadingMioRecs, setLoadingMioRecs] = useState(false);
  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(new Set());
  const [deletingRecId, setDeletingRecId] = useState<string | null>(null);

  // Fetch MIO recommendations on mount
  useEffect(() => {
    const loadMioRecommendations = async () => {
      setLoadingMioRecs(true);
      try {
        const recs = await fetchMIORecommendations();
        setMioRecommendations(recs);
      } catch (error) {
        console.error('[NutritionSection] Error fetching MIO recommendations:', error);
      } finally {
        setLoadingMioRecs(false);
      }
    };
    loadMioRecommendations();
  }, []);

  // Toggle expanded state for a recommendation
  const toggleRecExpanded = useCallback((id: string) => {
    setExpandedRecs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Delete a MIO recommendation
  const handleDeleteMioRec = useCallback(async (id: string) => {
    setDeletingRecId(id);
    try {
      await deleteMIORecommendation(id);
      setMioRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('[NutritionSection] Error deleting MIO recommendation:', error);
    } finally {
      setDeletingRecId(null);
    }
  }, []);

  // Update local state and mark unsaved
  const updateLocalData = useCallback(
    (updates: Partial<CEONutrition>) => {
      setLocalData((prev) => ({ ...prev, ...updates }));
      setHasLocalChanges(true);
      onMarkUnsaved();
    },
    [onMarkUnsaved]
  );

  // Save all changes
  const handleSaveAll = useCallback(async () => {
    await onSave(localData);
    setHasLocalChanges(false);
  }, [localData, onSave]);

  // Goal type options
  const goalTypeOptions = [
    { value: 'maintain', label: 'Maintain Weight' },
    { value: 'cut', label: 'Cut / Lose Fat' },
    { value: 'bulk', label: 'Bulk / Gain Muscle' },
    { value: 'recomp', label: 'Body Recomposition' },
  ];

  // Diet type options
  const dietTypeOptions = [
    { value: 'balanced', label: 'Balanced / Flexible' },
    { value: 'keto', label: 'Keto / Low Carb' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'mediterranean', label: 'Mediterranean' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'carnivore', label: 'Carnivore' },
  ];

  // Supplement timing options
  const timingOptions = [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
    { value: 'with_meals', label: 'With Meals' },
    { value: 'before_bed', label: 'Before Bed' },
  ];

  // Meal type options
  const mealTypeOptions = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
  ];

  // Day options
  const dayOptions: { value: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'; label: string }[] = [
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
    { value: 'sun', label: 'Sun' },
  ];

  // ============================================================================
  // SUPPLEMENT MANAGEMENT
  // ============================================================================

  const addOrUpdateSupplement = useCallback(
    (supplement: Omit<CEOSupplement, 'id'> & { id?: string }) => {
      const newSupplement: CEOSupplement = {
        id: supplement.id || generateId(),
        name: supplement.name,
        dosage: supplement.dosage,
        timing: supplement.timing,
        days: supplement.days,
        notes: supplement.notes,
        is_active: supplement.is_active,
      };

      if (supplement.id) {
        // Update existing
        updateLocalData({
          supplements: localData.supplements.map((s) =>
            s.id === supplement.id ? newSupplement : s
          ),
        });
      } else {
        // Add new
        updateLocalData({
          supplements: [...localData.supplements, newSupplement],
        });
      }

      setShowSupplementForm(false);
      setEditingSupplement(null);
    },
    [localData.supplements, updateLocalData]
  );

  const deleteSupplement = useCallback(
    (id: string) => {
      updateLocalData({
        supplements: localData.supplements.filter((s) => s.id !== id),
      });
    },
    [localData.supplements, updateLocalData]
  );

  const toggleSupplementActive = useCallback(
    (id: string) => {
      updateLocalData({
        supplements: localData.supplements.map((s) =>
          s.id === id ? { ...s, is_active: !s.is_active } : s
        ),
      });
    },
    [localData.supplements, updateLocalData]
  );

  // ============================================================================
  // FAVORITE MEAL MANAGEMENT
  // ============================================================================

  const addOrUpdateMeal = useCallback(
    (meal: Omit<CEOFavoriteMeal, 'id'> & { id?: string }) => {
      const newMeal: CEOFavoriteMeal = {
        id: meal.id || generateId(),
        name: meal.name,
        meal_type: meal.meal_type,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        ingredients: meal.ingredients || [],
        prep_time_mins: meal.prep_time_mins,
        notes: meal.notes,
      };

      if (meal.id) {
        // Update existing
        updateLocalData({
          favorite_meals: localData.favorite_meals.map((m) =>
            m.id === meal.id ? newMeal : m
          ),
        });
      } else {
        // Add new
        updateLocalData({
          favorite_meals: [...localData.favorite_meals, newMeal],
        });
      }

      setShowMealForm(false);
      setEditingMeal(null);
    },
    [localData.favorite_meals, updateLocalData]
  );

  const deleteMeal = useCallback(
    (id: string) => {
      updateLocalData({
        favorite_meals: localData.favorite_meals.filter((m) => m.id !== id),
      });
    },
    [localData.favorite_meals, updateLocalData]
  );

  // ============================================================================
  // LIST MANAGEMENT HELPERS
  // ============================================================================

  const addToList = useCallback(
    (
      key: 'allergies' | 'foods_to_avoid' | 'foods_to_prioritize',
      value: string,
      setter: (v: string) => void
    ) => {
      if (value && !localData.dietary_preferences[key].includes(value)) {
        updateLocalData({
          dietary_preferences: {
            ...localData.dietary_preferences,
            [key]: [...localData.dietary_preferences[key], value],
          },
        });
      }
      setter('');
    },
    [localData.dietary_preferences, updateLocalData]
  );

  const removeFromList = useCallback(
    (key: 'allergies' | 'foods_to_avoid' | 'foods_to_prioritize', value: string) => {
      updateLocalData({
        dietary_preferences: {
          ...localData.dietary_preferences,
          [key]: localData.dietary_preferences[key].filter((v) => v !== value),
        },
      });
    },
    [localData.dietary_preferences, updateLocalData]
  );

  // Group supplements by timing
  const supplementsByTiming = localData.supplements.reduce(
    (acc, s) => {
      if (!acc[s.timing]) acc[s.timing] = [];
      acc[s.timing].push(s);
      return acc;
    },
    {} as Record<string, CEOSupplement[]>
  );

  // Group meals by type
  const mealsByType = localData.favorite_meals.reduce(
    (acc, m) => {
      if (!acc[m.meal_type]) acc[m.meal_type] = [];
      acc[m.meal_type].push(m);
      return acc;
    },
    {} as Record<string, CEOFavoriteMeal[]>
  );

  return (
    <div className="space-y-6">
      {/* Save Button */}
      {hasLocalChanges && (
        <div className="sticky top-0 z-10 flex justify-end">
          <Button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="bg-mi-gold hover:bg-mi-gold/90 text-mi-navy font-semibold shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}

      {/* ======================================================================== */}
      {/* DAILY MACRO GOALS CARD */}
      {/* ======================================================================== */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Target className="h-5 w-5 text-orange-400" />
            </div>
            Daily Macro Goals
          </CardTitle>
          <CardDescription className="text-white/60">
            Set your daily calorie and macronutrient targets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {/* Goal Type */}
          <div className="space-y-2">
            <Label className="text-white/70">Goal Type</Label>
            <Select
              value={localData.macros.goal_type}
              onValueChange={(value) =>
                updateLocalData({
                  macros: {
                    ...localData.macros,
                    goal_type: value as CEOMacroGoals['goal_type'],
                  },
                })
              }
            >
              <SelectTrigger className="bg-mi-navy border-mi-cyan/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-mi-navy-light border-mi-cyan/30">
                {goalTypeOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-white hover:bg-mi-cyan/10 focus:bg-mi-cyan/10"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Macro Inputs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Calories */}
            <div className="p-3 rounded-xl bg-mi-navy/50 border border-orange-500/20">
              <Label className="text-white/70 flex items-center gap-2 mb-2 text-xs">
                <Flame className="h-3 w-3 text-orange-400" />
                Calories
              </Label>
              <Input
                type="number"
                placeholder="2200"
                value={localData.macros.daily_calories || ''}
                onChange={(e) =>
                  updateLocalData({
                    macros: {
                      ...localData.macros,
                      daily_calories: e.target.value ? parseInt(e.target.value) : null,
                    },
                  })
                }
                className="bg-mi-navy border-mi-cyan/30 text-white text-center"
              />
            </div>

            {/* Protein */}
            <div className="p-3 rounded-xl bg-mi-navy/50 border border-red-500/20">
              <Label className="text-white/70 flex items-center gap-2 mb-2 text-xs">
                <Beef className="h-3 w-3 text-red-400" />
                Protein (g)
              </Label>
              <Input
                type="number"
                placeholder="180"
                value={localData.macros.protein_grams || ''}
                onChange={(e) =>
                  updateLocalData({
                    macros: {
                      ...localData.macros,
                      protein_grams: e.target.value ? parseInt(e.target.value) : null,
                    },
                  })
                }
                className="bg-mi-navy border-mi-cyan/30 text-white text-center"
              />
            </div>

            {/* Carbs */}
            <div className="p-3 rounded-xl bg-mi-navy/50 border border-yellow-500/20">
              <Label className="text-white/70 flex items-center gap-2 mb-2 text-xs">
                <Wheat className="h-3 w-3 text-yellow-400" />
                Carbs (g)
              </Label>
              <Input
                type="number"
                placeholder="200"
                value={localData.macros.carbs_grams || ''}
                onChange={(e) =>
                  updateLocalData({
                    macros: {
                      ...localData.macros,
                      carbs_grams: e.target.value ? parseInt(e.target.value) : null,
                    },
                  })
                }
                className="bg-mi-navy border-mi-cyan/30 text-white text-center"
              />
            </div>

            {/* Fat */}
            <div className="p-3 rounded-xl bg-mi-navy/50 border border-blue-500/20">
              <Label className="text-white/70 flex items-center gap-2 mb-2 text-xs">
                <Droplet className="h-3 w-3 text-blue-400" />
                Fat (g)
              </Label>
              <Input
                type="number"
                placeholder="70"
                value={localData.macros.fat_grams || ''}
                onChange={(e) =>
                  updateLocalData({
                    macros: {
                      ...localData.macros,
                      fat_grams: e.target.value ? parseInt(e.target.value) : null,
                    },
                  })
                }
                className="bg-mi-navy border-mi-cyan/30 text-white text-center"
              />
            </div>
          </div>

          {/* Fiber */}
          <div className="p-3 rounded-xl bg-mi-navy/50 border border-green-500/20 max-w-xs">
            <Label className="text-white/70 flex items-center gap-2 mb-2 text-xs">
              <Apple className="h-3 w-3 text-green-400" />
              Fiber (g)
            </Label>
            <Input
              type="number"
              placeholder="30"
              value={localData.macros.fiber_grams || ''}
              onChange={(e) =>
                updateLocalData({
                  macros: {
                    ...localData.macros,
                    fiber_grams: e.target.value ? parseInt(e.target.value) : null,
                  },
                })
              }
              className="bg-mi-navy border-mi-cyan/30 text-white text-center"
            />
          </div>
        </CardContent>
      </Card>

      {/* ======================================================================== */}
      {/* HYDRATION CARD */}
      {/* ======================================================================== */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Droplets className="h-5 w-5 text-blue-400" />
            </div>
            Hydration
          </CardTitle>
          <CardDescription className="text-white/60">
            Track your daily water intake goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <div className="p-4 rounded-xl bg-mi-navy/50 border border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-white/70">Daily Water Goal</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={localData.hydration.daily_goal_oz || ''}
                  onChange={(e) =>
                    updateLocalData({
                      hydration: {
                        ...localData.hydration,
                        daily_goal_oz: e.target.value ? parseInt(e.target.value) : null,
                      },
                    })
                  }
                  className="bg-mi-navy border-mi-cyan/30 text-white w-20 text-center"
                />
                <span className="text-white/60">oz</span>
              </div>
            </div>

            {/* Reminder Settings */}
            <div className="flex items-center justify-between pt-4 border-t border-mi-cyan/10">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-white/70 text-sm">Enable Reminders</span>
              </div>
              <Switch
                checked={localData.hydration.reminder_enabled}
                onCheckedChange={(checked) =>
                  updateLocalData({
                    hydration: {
                      ...localData.hydration,
                      reminder_enabled: checked,
                    },
                  })
                }
              />
            </div>

            {localData.hydration.reminder_enabled && (
              <div className="flex items-center gap-2 mt-3 pl-6">
                <span className="text-white/50 text-sm">Every</span>
                <Select
                  value={String(localData.hydration.reminder_interval_hours)}
                  onValueChange={(value) =>
                    updateLocalData({
                      hydration: {
                        ...localData.hydration,
                        reminder_interval_hours: parseInt(value),
                      },
                    })
                  }
                >
                  <SelectTrigger className="bg-mi-navy border-mi-cyan/30 text-white w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-mi-navy-light border-mi-cyan/30">
                    {[1, 2, 3, 4].map((h) => (
                      <SelectItem
                        key={h}
                        value={String(h)}
                        className="text-white hover:bg-mi-cyan/10 focus:bg-mi-cyan/10"
                      >
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-white/50 text-sm">hours</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ======================================================================== */}
      {/* SUPPLEMENT STACK CARD */}
      {/* ======================================================================== */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Pill className="h-5 w-5 text-purple-400" />
              </div>
              Supplement Stack
            </CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditingSupplement(null);
                setShowSupplementForm(true);
              }}
              className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border-0"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          <CardDescription className="text-white/60">
            Your daily supplements and vitamins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {localData.supplements.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No supplements added yet</p>
              <p className="text-sm">Click Add to track your supplement stack</p>
            </div>
          ) : (
            Object.entries(supplementsByTiming).map(([timing, supplements]) => (
              <div key={timing} className="space-y-2">
                <h4 className="text-sm font-medium text-purple-400 uppercase tracking-wide">
                  {timingOptions.find((t) => t.value === timing)?.label || timing}
                </h4>
                {supplements.map((supp) => (
                  <div
                    key={supp.id}
                    className={cn(
                      'p-3 rounded-lg border flex items-center justify-between',
                      supp.is_active
                        ? 'bg-mi-navy/50 border-purple-500/30'
                        : 'bg-mi-navy/20 border-mi-cyan/10 opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={supp.is_active}
                        onCheckedChange={() => toggleSupplementActive(supp.id)}
                        className="data-[state=checked]:bg-purple-500"
                      />
                      <div>
                        <p className="text-white font-medium">{supp.name}</p>
                        <p className="text-white/50 text-sm">{supp.dosage}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingSupplement(supp);
                          setShowSupplementForm(true);
                        }}
                        className="h-8 w-8 text-white/50 hover:text-white hover:bg-mi-cyan/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteSupplement(supp.id)}
                        className="h-8 w-8 text-white/50 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}

          {/* Supplement Form */}
          {showSupplementForm && (
            <SupplementForm
              supplement={editingSupplement}
              timingOptions={timingOptions}
              dayOptions={dayOptions}
              onSave={addOrUpdateSupplement}
              onCancel={() => {
                setShowSupplementForm(false);
                setEditingSupplement(null);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* ======================================================================== */}
      {/* FAVORITE MEALS CARD */}
      {/* ======================================================================== */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="p-2 rounded-lg bg-green-500/10">
                <UtensilsCrossed className="h-5 w-5 text-green-400" />
              </div>
              Favorite Meals
            </CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditingMeal(null);
                setShowMealForm(true);
              }}
              className="bg-green-500/20 text-green-300 hover:bg-green-500/30 border-0"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          <CardDescription className="text-white/60">
            Quick-add your go-to meals with macros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {localData.favorite_meals.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No favorite meals saved</p>
              <p className="text-sm">Add meals you eat regularly for quick tracking</p>
            </div>
          ) : (
            Object.entries(mealsByType).map(([mealType, meals]) => (
              <div key={mealType} className="space-y-2">
                <h4 className="text-sm font-medium text-green-400 uppercase tracking-wide">
                  {mealTypeOptions.find((t) => t.value === mealType)?.label || mealType}
                </h4>
                {meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="p-3 rounded-lg bg-mi-navy/50 border border-green-500/30"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-medium">{meal.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {meal.calories && (
                            <Badge className="bg-orange-500/20 text-orange-300 border-0 text-xs">
                              {meal.calories} cal
                            </Badge>
                          )}
                          {meal.protein && (
                            <Badge className="bg-red-500/20 text-red-300 border-0 text-xs">
                              {meal.protein}g protein
                            </Badge>
                          )}
                          {meal.carbs && (
                            <Badge className="bg-yellow-500/20 text-yellow-300 border-0 text-xs">
                              {meal.carbs}g carbs
                            </Badge>
                          )}
                          {meal.fat && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-0 text-xs">
                              {meal.fat}g fat
                            </Badge>
                          )}
                        </div>
                        {meal.notes && (
                          <p className="text-white/40 text-sm mt-1">{meal.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingMeal(meal);
                            setShowMealForm(true);
                          }}
                          className="h-8 w-8 text-white/50 hover:text-white hover:bg-mi-cyan/10"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMeal(meal.id)}
                          className="h-8 w-8 text-white/50 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}

          {/* Meal Form */}
          {showMealForm && (
            <MealForm
              meal={editingMeal}
              mealTypeOptions={mealTypeOptions}
              onSave={addOrUpdateMeal}
              onCancel={() => {
                setShowMealForm(false);
                setEditingMeal(null);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* ======================================================================== */}
      {/* DIETARY PREFERENCES CARD */}
      {/* ======================================================================== */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Salad className="h-5 w-5 text-cyan-400" />
            </div>
            Dietary Preferences
          </CardTitle>
          <CardDescription className="text-white/60">
            Your diet type, restrictions, and eating schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {/* Diet Type & Meal Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70">Diet Type</Label>
              <Select
                value={localData.dietary_preferences.diet_type}
                onValueChange={(value) =>
                  updateLocalData({
                    dietary_preferences: {
                      ...localData.dietary_preferences,
                      diet_type: value as CEODietaryPreferences['diet_type'],
                    },
                  })
                }
              >
                <SelectTrigger className="bg-mi-navy border-mi-cyan/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-mi-navy-light border-mi-cyan/30">
                  {dietTypeOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-white hover:bg-mi-cyan/10 focus:bg-mi-cyan/10"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">Meals Per Day</Label>
              <Select
                value={String(localData.dietary_preferences.meal_frequency)}
                onValueChange={(value) =>
                  updateLocalData({
                    dietary_preferences: {
                      ...localData.dietary_preferences,
                      meal_frequency: parseInt(value),
                    },
                  })
                }
              >
                <SelectTrigger className="bg-mi-navy border-mi-cyan/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-mi-navy-light border-mi-cyan/30">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem
                      key={n}
                      value={String(n)}
                      className="text-white hover:bg-mi-cyan/10 focus:bg-mi-cyan/10"
                    >
                      {n} meal{n !== 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Eating Window */}
          <div className="p-4 rounded-xl bg-mi-navy/50 border border-cyan-500/20">
            <Label className="text-white/70 mb-3 block">Eating Window (links with fasting)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/50 text-xs">Start</Label>
                <Input
                  type="time"
                  value={localData.dietary_preferences.eating_window_start}
                  onChange={(e) =>
                    updateLocalData({
                      dietary_preferences: {
                        ...localData.dietary_preferences,
                        eating_window_start: e.target.value,
                      },
                    })
                  }
                  className="bg-mi-navy border-mi-cyan/30 text-white [color-scheme:dark]"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/50 text-xs">End</Label>
                <Input
                  type="time"
                  value={localData.dietary_preferences.eating_window_end}
                  onChange={(e) =>
                    updateLocalData({
                      dietary_preferences: {
                        ...localData.dietary_preferences,
                        eating_window_end: e.target.value,
                      },
                    })
                  }
                  className="bg-mi-navy border-mi-cyan/30 text-white [color-scheme:dark]"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
          </div>

          {/* Allergies */}
          <div className="p-4 rounded-xl bg-mi-navy/50 border border-red-500/20">
            <Label className="text-white/70 mb-3 block">Allergies</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {localData.dietary_preferences.allergies.length === 0 ? (
                <span className="text-white/40 italic text-sm">No allergies added</span>
              ) : (
                localData.dietary_preferences.allergies.map((allergy) => (
                  <Badge
                    key={allergy}
                    className="bg-red-500/20 text-red-300 border-0 pl-3 pr-2"
                  >
                    {allergy}
                    <button
                      onClick={() => removeFromList('allergies', allergy)}
                      className="ml-1 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addToList('allergies', newAllergy, setNewAllergy);
                  }
                }}
                placeholder="Add allergy..."
                className="bg-mi-navy border-mi-cyan/30 text-white placeholder:text-white/40"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => addToList('allergies', newAllergy, setNewAllergy)}
                disabled={!newAllergy}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Foods to Avoid */}
          <div className="p-4 rounded-xl bg-mi-navy/50 border border-yellow-500/20">
            <Label className="text-white/70 mb-3 block">Foods to Avoid</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {localData.dietary_preferences.foods_to_avoid.length === 0 ? (
                <span className="text-white/40 italic text-sm">No foods to avoid added</span>
              ) : (
                localData.dietary_preferences.foods_to_avoid.map((food) => (
                  <Badge
                    key={food}
                    className="bg-yellow-500/20 text-yellow-300 border-0 pl-3 pr-2"
                  >
                    {food}
                    <button
                      onClick={() => removeFromList('foods_to_avoid', food)}
                      className="ml-1 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAvoidFood}
                onChange={(e) => setNewAvoidFood(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addToList('foods_to_avoid', newAvoidFood, setNewAvoidFood);
                  }
                }}
                placeholder="Add food to avoid..."
                className="bg-mi-navy border-mi-cyan/30 text-white placeholder:text-white/40"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => addToList('foods_to_avoid', newAvoidFood, setNewAvoidFood)}
                disabled={!newAvoidFood}
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Foods to Prioritize */}
          <div className="p-4 rounded-xl bg-mi-navy/50 border border-green-500/20">
            <Label className="text-white/70 mb-3 block">Foods to Prioritize</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {localData.dietary_preferences.foods_to_prioritize.length === 0 ? (
                <span className="text-white/40 italic text-sm">No priority foods added</span>
              ) : (
                localData.dietary_preferences.foods_to_prioritize.map((food) => (
                  <Badge
                    key={food}
                    className="bg-green-500/20 text-green-300 border-0 pl-3 pr-2"
                  >
                    {food}
                    <button
                      onClick={() => removeFromList('foods_to_prioritize', food)}
                      className="ml-1 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newPriorityFood}
                onChange={(e) => setNewPriorityFood(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addToList('foods_to_prioritize', newPriorityFood, setNewPriorityFood);
                  }
                }}
                placeholder="Add priority food..."
                className="bg-mi-navy border-mi-cyan/30 text-white placeholder:text-white/40"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => addToList('foods_to_prioritize', newPriorityFood, setNewPriorityFood)}
                disabled={!newPriorityFood}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================================== */}
      {/* MIO RECOMMENDATIONS CARD */}
      {/* ======================================================================== */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="p-2 rounded-lg bg-teal-500/10">
                <Sparkles className="h-5 w-5 text-teal-400" />
              </div>
              MIO Recommendations
            </CardTitle>
            {mioRecommendations.length > 0 && (
              <Badge variant="outline" className="text-teal-400 border-teal-400/40">
                {mioRecommendations.length} saved
              </Badge>
            )}
          </div>
          <CardDescription className="text-white/60">
            Nutrition advice saved from your MIO conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 relative">
          {loadingMioRecs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-teal-400 animate-spin" />
            </div>
          ) : mioRecommendations.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No MIO recommendations yet</p>
              <p className="text-sm">Ask MIO for nutrition advice and save it here!</p>
            </div>
          ) : (
            mioRecommendations.map((rec) => (
              <Collapsible
                key={rec.id}
                open={expandedRecs.has(rec.id)}
                onOpenChange={() => toggleRecExpanded(rec.id)}
              >
                <div className="rounded-lg bg-mi-navy/50 border border-teal-500/30 overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-3 hover:bg-teal-500/5 transition-colors">
                      <div className="flex items-center gap-2">
                        {expandedRecs.has(rec.id) ? (
                          <ChevronDown className="h-4 w-4 text-teal-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-teal-400" />
                        )}
                        <span className="text-white font-medium">{rec.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-xs">
                          {new Date(rec.updated_at).toLocaleDateString()}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMioRec(rec.id);
                          }}
                          disabled={deletingRecId === rec.id}
                          className="h-7 w-7 text-white/50 hover:text-red-400 hover:bg-red-500/10"
                        >
                          {deletingRecId === rec.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 pt-1 border-t border-teal-500/20">
                      <MIORecommendationContent content={rec.content} />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// MIO RECOMMENDATION CONTENT RENDERER
// Handles various content structures saved by MIO
// ============================================================================

interface MIORecommendationContentProps {
  content: Record<string, unknown>;
}

function MIORecommendationContent({ content }: MIORecommendationContentProps) {
  // Render content recursively based on type
  const renderValue = (value: unknown, key?: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return null;
    }

    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside space-y-1 ml-2">
          {value.map((item, i) => (
            <li key={i} className="text-white/80 text-sm">
              {typeof item === 'object' ? renderValue(item) : String(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'object') {
      return (
        <div className="space-y-2">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <div key={k}>
              <span className="text-teal-400 text-sm font-medium capitalize">
                {k.replace(/_/g, ' ')}:
              </span>
              <div className="ml-2">{renderValue(v, k)}</div>
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-white/80 text-sm">{String(value)}</span>;
  };

  return <div className="mt-2">{renderValue(content)}</div>;
}

// ============================================================================
// SUPPLEMENT FORM COMPONENT
// ============================================================================

interface SupplementFormProps {
  supplement: CEOSupplement | null;
  timingOptions: { value: string; label: string }[];
  dayOptions: { value: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'; label: string }[];
  onSave: (supplement: Omit<CEOSupplement, 'id'> & { id?: string }) => void;
  onCancel: () => void;
}

function SupplementForm({
  supplement,
  timingOptions,
  dayOptions,
  onSave,
  onCancel,
}: SupplementFormProps) {
  const [form, setForm] = useState({
    id: supplement?.id,
    name: supplement?.name || '',
    dosage: supplement?.dosage || '',
    timing: supplement?.timing || 'morning',
    days: supplement?.days || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[],
    notes: supplement?.notes || '',
    is_active: supplement?.is_active ?? true,
  });

  const toggleDay = (day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun') => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  return (
    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-4">
      <h4 className="text-white font-medium">
        {supplement ? 'Edit Supplement' : 'Add New Supplement'}
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white/70">Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Vitamin D3"
            className="bg-mi-navy border-mi-cyan/30 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/70">Dosage</Label>
          <Input
            value={form.dosage}
            onChange={(e) => setForm((prev) => ({ ...prev, dosage: e.target.value }))}
            placeholder="5000 IU"
            className="bg-mi-navy border-mi-cyan/30 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white/70">Timing</Label>
        <Select
          value={form.timing}
          onValueChange={(value) =>
            setForm((prev) => ({ ...prev, timing: value as CEOSupplement['timing'] }))
          }
        >
          <SelectTrigger className="bg-mi-navy border-mi-cyan/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-mi-navy-light border-mi-cyan/30">
            {timingOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-white hover:bg-mi-cyan/10 focus:bg-mi-cyan/10"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-white/70">Days</Label>
        <div className="flex flex-wrap gap-2">
          {dayOptions.map((day) => (
            <Button
              key={day.value}
              size="sm"
              variant={form.days.includes(day.value) ? 'default' : 'outline'}
              onClick={() => toggleDay(day.value)}
              className={cn(
                'min-w-[40px]',
                form.days.includes(day.value)
                  ? 'bg-purple-500 hover:bg-purple-600 text-white border-purple-500'
                  : 'bg-mi-navy-light border-mi-cyan/30 text-white/60 hover:text-white'
              )}
            >
              {day.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white/70">Notes (optional)</Label>
        <Input
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Take with food..."
          className="bg-mi-navy border-mi-cyan/30 text-white"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} className="border-mi-cyan/30 text-white">
          Cancel
        </Button>
        <Button
          onClick={() => onSave(form)}
          disabled={!form.name || !form.dosage}
          className="bg-purple-500 hover:bg-purple-600 text-white"
        >
          {supplement ? 'Update' : 'Add'} Supplement
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MEAL FORM COMPONENT
// ============================================================================

interface MealFormProps {
  meal: CEOFavoriteMeal | null;
  mealTypeOptions: { value: string; label: string }[];
  onSave: (meal: Omit<CEOFavoriteMeal, 'id'> & { id?: string }) => void;
  onCancel: () => void;
}

function MealForm({ meal, mealTypeOptions, onSave, onCancel }: MealFormProps) {
  const [form, setForm] = useState({
    id: meal?.id,
    name: meal?.name || '',
    meal_type: meal?.meal_type || 'lunch',
    calories: meal?.calories,
    protein: meal?.protein,
    carbs: meal?.carbs,
    fat: meal?.fat,
    ingredients: meal?.ingredients || [],
    prep_time_mins: meal?.prep_time_mins,
    notes: meal?.notes || '',
  });

  return (
    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-4">
      <h4 className="text-white font-medium">{meal ? 'Edit Meal' : 'Add New Meal'}</h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white/70">Meal Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Greek Yogurt Bowl"
            className="bg-mi-navy border-mi-cyan/30 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/70">Meal Type</Label>
          <Select
            value={form.meal_type}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, meal_type: value as CEOFavoriteMeal['meal_type'] }))
            }
          >
            <SelectTrigger className="bg-mi-navy border-mi-cyan/30 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-mi-navy-light border-mi-cyan/30">
              {mealTypeOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-white hover:bg-mi-cyan/10 focus:bg-mi-cyan/10"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="space-y-2">
          <Label className="text-white/70 text-xs">Calories</Label>
          <Input
            type="number"
            value={form.calories || ''}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                calories: e.target.value ? parseInt(e.target.value) : null,
              }))
            }
            placeholder="450"
            className="bg-mi-navy border-mi-cyan/30 text-white text-center"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/70 text-xs">Protein (g)</Label>
          <Input
            type="number"
            value={form.protein || ''}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                protein: e.target.value ? parseInt(e.target.value) : null,
              }))
            }
            placeholder="35"
            className="bg-mi-navy border-mi-cyan/30 text-white text-center"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/70 text-xs">Carbs (g)</Label>
          <Input
            type="number"
            value={form.carbs || ''}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                carbs: e.target.value ? parseInt(e.target.value) : null,
              }))
            }
            placeholder="45"
            className="bg-mi-navy border-mi-cyan/30 text-white text-center"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/70 text-xs">Fat (g)</Label>
          <Input
            type="number"
            value={form.fat || ''}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                fat: e.target.value ? parseInt(e.target.value) : null,
              }))
            }
            placeholder="12"
            className="bg-mi-navy border-mi-cyan/30 text-white text-center"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white/70">Notes (optional)</Label>
        <Input
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Great post-workout meal..."
          className="bg-mi-navy border-mi-cyan/30 text-white"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} className="border-mi-cyan/30 text-white">
          Cancel
        </Button>
        <Button
          onClick={() => onSave(form)}
          disabled={!form.name}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          {meal ? 'Update' : 'Add'} Meal
        </Button>
      </div>
    </div>
  );
}

export default NutritionSection;
