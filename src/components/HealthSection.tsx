// Health & Wellness Section Component
// Fasting schedule, sleep goals, workout types

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CEOPreferences, CEOHealth, CEOFasting } from '@/types/ceoDashboard';
import { formatTime } from '@/services/ceoPreferencesService';
import {
  Activity,
  Moon,
  Sun,
  Utensils,
  Dumbbell,
  Save,
  Loader2,
  Clock,
  Plus,
  X,
} from 'lucide-react';

interface HealthSectionProps {
  preferences: CEOPreferences | null;
  onSave: (preferences: Partial<CEOPreferences>) => Promise<void>;
  onMarkUnsaved: () => void;
  isSaving: boolean;
}

export function HealthSection({
  preferences,
  onSave,
  onMarkUnsaved,
  isSaving,
}: HealthSectionProps) {
  // Local state for form data
  const [localData, setLocalData] = useState<CEOHealth>({
    fasting: preferences?.health?.fasting || {
      type: 'intermittent',
      window_start: '12:00',
      window_end: '20:00',
    },
    sleep_goal_hours: preferences?.health?.sleep_goal_hours || 7,
    wake_time: preferences?.health?.wake_time || '06:00',
    workout_types: preferences?.health?.workout_types || [],
    workout_days: preferences?.health?.workout_days || [],
  });

  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [newWorkoutType, setNewWorkoutType] = useState('');

  // Update local state and mark unsaved
  const updateLocalData = useCallback(
    (updates: Partial<CEOHealth>) => {
      setLocalData((prev) => ({ ...prev, ...updates }));
      setHasLocalChanges(true);
      onMarkUnsaved();
    },
    [onMarkUnsaved]
  );

  // Save all changes
  const handleSaveAll = useCallback(async () => {
    await onSave({ health: localData });
    setHasLocalChanges(false);
  }, [localData, onSave]);

  // Fasting type options
  const fastingOptions = [
    { value: 'none', label: 'No Fasting' },
    { value: 'intermittent', label: 'Intermittent Fasting (daily eating window)' },
    { value: 'extended', label: 'Extended Fasting (multi-day)' },
  ];

  // Calculate days into extended fast
  const getExtendedFastDays = () => {
    if (!localData.fasting.start_date) return null;
    const start = new Date(localData.fasting.start_date);
    const today = new Date();
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : null;
  };

  // Calculate total planned fast days
  const getTotalFastDays = () => {
    if (!localData.fasting.start_date || !localData.fasting.end_date) return null;
    const start = new Date(localData.fasting.start_date);
    const end = new Date(localData.fasting.end_date);
    const diffTime = end.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Workout type suggestions
  const workoutSuggestions = [
    'Weight Training',
    'Cardio',
    'HIIT',
    'Yoga',
    'Running',
    'Cycling',
    'Swimming',
    'Boxing',
    'Pilates',
    'CrossFit',
    'Walking',
    'Stretching',
  ];

  // Day options
  const dayOptions = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' },
  ];

  // Add workout type
  const addWorkoutType = useCallback(
    (type: string) => {
      if (type && !localData.workout_types.includes(type)) {
        updateLocalData({
          workout_types: [...localData.workout_types, type],
        });
      }
      setNewWorkoutType('');
    },
    [localData.workout_types, updateLocalData]
  );

  // Remove workout type
  const removeWorkoutType = useCallback(
    (type: string) => {
      updateLocalData({
        workout_types: localData.workout_types.filter((t) => t !== type),
      });
    },
    [localData.workout_types, updateLocalData]
  );

  // Toggle workout day
  const toggleWorkoutDay = useCallback(
    (day: string) => {
      const days = localData.workout_days.includes(day)
        ? localData.workout_days.filter((d) => d !== day)
        : [...localData.workout_days, day];
      updateLocalData({ workout_days: days });
    },
    [localData.workout_days, updateLocalData]
  );

  // Calculate fasting window duration
  const getFastingDuration = () => {
    if (localData.fasting.type === 'none') return null;
    const [startH, startM] = localData.fasting.window_start.split(':').map(Number);
    const [endH, endM] = localData.fasting.window_end.split(':').map(Number);
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60;
    const hours = Math.floor(diff / 60);
    return `${hours}h eating window`;
  };

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

      {/* Fasting Card */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Utensils className="h-5 w-5 text-orange-400" />
            </div>
            Fasting Schedule
          </CardTitle>
          <CardDescription className="text-white/60">
            Your eating window and fasting protocol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {/* Fasting Type */}
          <div className="space-y-2">
            <Label className="text-white/70">Fasting Type</Label>
            <Select
              value={localData.fasting.type}
              onValueChange={(value) =>
                updateLocalData({
                  fasting: {
                    ...localData.fasting,
                    type: value as CEOFasting['type'],
                  },
                })
              }
            >
              <SelectTrigger className="bg-mi-navy border-mi-cyan/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-mi-navy-light border-mi-cyan/30">
                {fastingOptions.map((option) => (
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

          {/* Intermittent Fasting - Eating Window */}
          {localData.fasting.type === 'intermittent' && (
            <div className="p-4 rounded-xl bg-mi-navy/50 border border-orange-500/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-orange-400">Daily Eating Window</h4>
                {getFastingDuration() && (
                  <Badge className="bg-orange-500/20 text-orange-300 border-0">
                    {getFastingDuration()}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70 flex items-center gap-2">
                    <Sun className="h-4 w-4 text-orange-400" />
                    Start Eating
                  </Label>
                  <Input
                    type="time"
                    value={localData.fasting.window_start}
                    onChange={(e) =>
                      updateLocalData({
                        fasting: {
                          ...localData.fasting,
                          window_start: e.target.value,
                        },
                      })
                    }
                    className="bg-mi-navy border-mi-cyan/30 text-white [color-scheme:dark]"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-400" />
                    Stop Eating
                  </Label>
                  <Input
                    type="time"
                    value={localData.fasting.window_end}
                    onChange={(e) =>
                      updateLocalData({
                        fasting: {
                          ...localData.fasting,
                          window_end: e.target.value,
                        },
                      })
                    }
                    className="bg-mi-navy border-mi-cyan/30 text-white [color-scheme:dark]"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Extended Fasting - Date Range */}
          {localData.fasting.type === 'extended' && (
            <div className="p-4 rounded-xl bg-mi-navy/50 border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-purple-400">Extended Fast Period</h4>
                {getExtendedFastDays() && getTotalFastDays() && (
                  <Badge className="bg-purple-500/20 text-purple-300 border-0">
                    Day {getExtendedFastDays()} of {getTotalFastDays()}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-400" />
                    Fast Start Date
                  </Label>
                  <Input
                    type="date"
                    value={localData.fasting.start_date || ''}
                    onChange={(e) =>
                      updateLocalData({
                        fasting: {
                          ...localData.fasting,
                          start_date: e.target.value,
                        },
                      })
                    }
                    className="bg-mi-navy border-mi-cyan/30 text-white [color-scheme:dark]"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-green-400" />
                    Fast End Date
                  </Label>
                  <Input
                    type="date"
                    value={localData.fasting.end_date || ''}
                    onChange={(e) =>
                      updateLocalData({
                        fasting: {
                          ...localData.fasting,
                          end_date: e.target.value,
                        },
                      })
                    }
                    className="bg-mi-navy border-mi-cyan/30 text-white [color-scheme:dark]"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              {getExtendedFastDays() && (
                <p className="text-white/50 text-sm mt-3">
                  You're on day {getExtendedFastDays()} of your extended fast. Stay strong!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sleep Card */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <Moon className="h-5 w-5 text-indigo-400" />
            </div>
            Sleep Schedule
          </CardTitle>
          <CardDescription className="text-white/60">
            Your sleep goals and wake time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sleep Goal */}
            <div className="p-4 rounded-xl bg-mi-navy/50 border border-indigo-500/20">
              <Label className="text-white/70 flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-indigo-400" />
                Sleep Goal
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={4}
                  max={12}
                  value={localData.sleep_goal_hours}
                  onChange={(e) =>
                    updateLocalData({ sleep_goal_hours: parseInt(e.target.value) || 7 })
                  }
                  className="bg-mi-navy border-mi-cyan/30 text-white w-20 text-center text-lg"
                />
                <span className="text-white/60">hours per night</span>
              </div>
            </div>

            {/* Wake Time */}
            <div className="p-4 rounded-xl bg-mi-navy/50 border border-indigo-500/20">
              <Label className="text-white/70 flex items-center gap-2 mb-3">
                <Sun className="h-4 w-4 text-yellow-400" />
                Wake Time
              </Label>
              <Input
                type="time"
                value={localData.wake_time}
                onChange={(e) => updateLocalData({ wake_time: e.target.value })}
                className="bg-mi-navy border-mi-cyan/30 text-white [color-scheme:dark]"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workout Card */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Dumbbell className="h-5 w-5 text-green-400" />
            </div>
            Workout Routine
          </CardTitle>
          <CardDescription className="text-white/60">
            Your preferred workout types and schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative">
          {/* Workout Types */}
          <div className="p-4 rounded-xl bg-mi-navy/50 border border-green-500/20">
            <Label className="text-white/70 mb-3 block">Workout Types</Label>

            {/* Current workout types */}
            <div className="flex flex-wrap gap-2 mb-4">
              {localData.workout_types.length === 0 ? (
                <span className="text-white/40 italic">No workout types selected</span>
              ) : (
                localData.workout_types.map((type) => (
                  <Badge
                    key={type}
                    className="bg-green-500/20 text-green-300 border-0 pl-3 pr-2 py-1 flex items-center gap-1"
                  >
                    {type}
                    <button
                      onClick={() => removeWorkoutType(type)}
                      className="ml-1 hover:text-red-300 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>

            {/* Add new workout type */}
            <div className="flex gap-2 mb-3">
              <Input
                value={newWorkoutType}
                onChange={(e) => setNewWorkoutType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addWorkoutType(newWorkoutType);
                  }
                }}
                placeholder="Add custom workout type..."
                className="bg-mi-navy border-mi-cyan/30 text-white placeholder:text-white/40"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => addWorkoutType(newWorkoutType)}
                disabled={!newWorkoutType}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick add suggestions */}
            <div className="flex flex-wrap gap-2">
              {workoutSuggestions
                .filter((s) => !localData.workout_types.includes(s))
                .slice(0, 6)
                .map((suggestion) => (
                  <Button
                    key={suggestion}
                    size="sm"
                    variant="ghost"
                    onClick={() => addWorkoutType(suggestion)}
                    className="text-white/50 hover:text-green-300 hover:bg-green-500/10 text-xs"
                  >
                    + {suggestion}
                  </Button>
                ))}
            </div>
          </div>

          {/* Workout Days */}
          <div className="p-4 rounded-xl bg-mi-navy/50 border border-green-500/20">
            <Label className="text-white/70 mb-3 block">Workout Days</Label>
            <div className="flex flex-wrap gap-2">
              {dayOptions.map((day) => (
                <Button
                  key={day.value}
                  size="sm"
                  variant={localData.workout_days.includes(day.value) ? 'default' : 'outline'}
                  onClick={() => toggleWorkoutDay(day.value)}
                  className={cn(
                    'min-w-[50px]',
                    localData.workout_days.includes(day.value)
                      ? 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                      : 'bg-mi-navy-light border-mi-cyan/30 text-white/60 hover:text-white hover:bg-mi-navy hover:border-green-500/50'
                  )}
                >
                  {day.label}
                </Button>
              ))}
            </div>
            {localData.workout_days.length > 0 && (
              <p className="text-white/40 text-sm mt-3">
                {localData.workout_days.length} day{localData.workout_days.length !== 1 ? 's' : ''} per week
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HealthSection;
