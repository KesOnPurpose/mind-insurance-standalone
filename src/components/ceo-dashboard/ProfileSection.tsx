// Profile & Family Section Component
// Personal info, wife/kids with inline editing

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { InlineEdit } from './InlineEdit';
import { cn } from '@/lib/utils';
import type { CEOPreferences, CEOChild, CEOFamily, CEOCommunication, CEOLocation } from '@/types/ceoDashboard';
import { generateId, formatDate } from '@/services/ceoPreferencesService';
import {
  User,
  Heart,
  Baby,
  MapPin,
  Plus,
  Trash2,
  Cake,
  Globe,
  MessageSquare,
  Save,
  Loader2,
} from 'lucide-react';

interface ProfileSectionProps {
  preferences: CEOPreferences | null;
  onSave: (preferences: Partial<CEOPreferences>) => Promise<void>;
  onMarkUnsaved: () => void;
  isSaving: boolean;
}

export function ProfileSection({
  preferences,
  onSave,
  onMarkUnsaved,
  isSaving,
}: ProfileSectionProps) {
  // Local state for form data
  const [localData, setLocalData] = useState({
    communication: {
      name: preferences?.communication?.name || '',
      preferred_name: (preferences?.communication as any)?.preferred_name || '',
      timezone: preferences?.communication?.timezone || 'America/New_York',
      style_preference: preferences?.communication?.style_preference || 'Direct & Brief',
      response_format: preferences?.communication?.response_format || 'Bullet Points',
    },
    family: preferences?.family || {
      wife: { name: '', birthday: '' },
      children: [],
    },
    locations: preferences?.locations || {
      home_city: '',
      home_state: '',
      office_city: '',
      office_state: '',
    },
  });

  // Track if there are local changes
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  // Update local state and mark unsaved
  const updateLocalData = useCallback(
    <K extends keyof typeof localData>(
      section: K,
      data: Partial<(typeof localData)[K]>
    ) => {
      setLocalData((prev) => ({
        ...prev,
        [section]: { ...prev[section], ...data },
      }));
      setHasLocalChanges(true);
      onMarkUnsaved();
    },
    [onMarkUnsaved]
  );

  // Save all changes
  const handleSaveAll = useCallback(async () => {
    await onSave({
      communication: localData.communication,
      family: localData.family,
      locations: localData.locations,
    });
    setHasLocalChanges(false);
  }, [localData, onSave]);

  // Add a new child
  const addChild = useCallback(() => {
    const newChild: CEOChild = {
      name: '',
      age: 0,
      birthday: '',
    };
    setLocalData((prev) => ({
      ...prev,
      family: {
        ...prev.family,
        children: [...prev.family.children, newChild],
      },
    }));
    setHasLocalChanges(true);
    onMarkUnsaved();
  }, [onMarkUnsaved]);

  // Remove a child
  const removeChild = useCallback(
    (index: number) => {
      setLocalData((prev) => ({
        ...prev,
        family: {
          ...prev.family,
          children: prev.family.children.filter((_, i) => i !== index),
        },
      }));
      setHasLocalChanges(true);
      onMarkUnsaved();
    },
    [onMarkUnsaved]
  );

  // Update child data
  const updateChild = useCallback(
    (index: number, data: Partial<CEOChild>) => {
      setLocalData((prev) => ({
        ...prev,
        family: {
          ...prev.family,
          children: prev.family.children.map((child, i) =>
            i === index ? { ...child, ...data } : child
          ),
        },
      }));
      setHasLocalChanges(true);
      onMarkUnsaved();
    },
    [onMarkUnsaved]
  );

  // Timezone options
  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona (No DST)' },
    { value: 'UTC', label: 'UTC' },
  ];

  // Communication style options
  const styleOptions = [
    { value: 'Direct & Brief', label: 'Direct & Brief' },
    { value: 'Detailed', label: 'Detailed' },
    { value: 'Formal', label: 'Formal' },
    { value: 'Casual', label: 'Casual' },
  ];

  return (
    <div className="space-y-6">
      {/* Save Button - Sticky at top when changes exist */}
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

      {/* Personal Information Card */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-mi-cyan/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-lg bg-mi-cyan/10">
              <User className="h-5 w-5 text-mi-cyan" />
            </div>
            Personal Information
          </CardTitle>
          <CardDescription className="text-white/60">
            Your name and communication preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label className="text-white/70">Full Name</Label>
              <Input
                value={localData.communication.name}
                onChange={(e) =>
                  updateLocalData('communication', { name: e.target.value })
                }
                placeholder="Your full name"
                className="bg-mi-navy border-mi-cyan/30 text-white placeholder:text-white/40"
              />
            </div>

            {/* Preferred Name */}
            <div className="space-y-2">
              <Label className="text-white/70">Preferred Name (Optional)</Label>
              <Input
                value={localData.communication.preferred_name || ''}
                onChange={(e) =>
                  updateLocalData('communication', { preferred_name: e.target.value })
                }
                placeholder="What should MIO call you?"
                className="bg-mi-navy border-mi-cyan/30 text-white placeholder:text-white/40"
              />
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label className="text-white/70 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Timezone
              </Label>
              <InlineEdit
                value={localData.communication.timezone}
                onSave={async (value) => {
                  updateLocalData('communication', { timezone: value });
                }}
                type="select"
                options={timezoneOptions}
              />
            </div>

            {/* Communication Style */}
            <div className="space-y-2">
              <Label className="text-white/70 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Communication Style
              </Label>
              <InlineEdit
                value={localData.communication.style_preference}
                onSave={async (value) => {
                  updateLocalData('communication', { style_preference: value });
                }}
                type="select"
                options={styleOptions}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Card */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-mi-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-lg bg-mi-gold/10">
              <Heart className="h-5 w-5 text-mi-gold" />
            </div>
            Family
          </CardTitle>
          <CardDescription className="text-white/60">
            Help MIO remember important family details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative">
          {/* Wife/Partner Section */}
          <div className="p-4 rounded-xl bg-mi-navy/50 border border-mi-cyan/10">
            <h4 className="text-sm font-medium text-mi-gold mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Spouse/Partner
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">Name</Label>
                <Input
                  value={localData.family.wife.name}
                  onChange={(e) =>
                    updateLocalData('family', {
                      wife: { ...localData.family.wife, name: e.target.value },
                    })
                  }
                  placeholder="Partner's name"
                  className="bg-mi-navy border-mi-cyan/30 text-white placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 flex items-center gap-2">
                  <Cake className="h-4 w-4" />
                  Birthday
                </Label>
                <Input
                  type="date"
                  value={localData.family.wife.birthday}
                  onChange={(e) =>
                    updateLocalData('family', {
                      wife: { ...localData.family.wife, birthday: e.target.value },
                    })
                  }
                  className="bg-mi-navy border-mi-cyan/30 text-white [color-scheme:dark]"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
          </div>

          {/* Children Section */}
          <div className="p-4 rounded-xl bg-mi-navy/50 border border-mi-cyan/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-mi-cyan flex items-center gap-2">
                <Baby className="h-4 w-4" />
                Children
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={addChild}
                className="border-mi-cyan/30 text-mi-cyan hover:bg-mi-cyan/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Child
              </Button>
            </div>

            {localData.family.children.length === 0 ? (
              <div className="text-center py-6 text-white/40">
                <Baby className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No children added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {localData.family.children.map((child, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-mi-navy border border-mi-cyan/20"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        value={child.name}
                        onChange={(e) => updateChild(index, { name: e.target.value })}
                        placeholder="Child's name"
                        className="bg-mi-navy-light border-mi-cyan/30 text-white placeholder:text-white/40"
                      />
                      <Input
                        type="number"
                        value={child.age || ''}
                        onChange={(e) => updateChild(index, { age: parseInt(e.target.value) || 0 })}
                        placeholder="Age"
                        min={0}
                        max={50}
                        className="bg-mi-navy-light border-mi-cyan/30 text-white placeholder:text-white/40"
                      />
                      <Input
                        type="date"
                        value={child.birthday}
                        onChange={(e) => updateChild(index, { birthday: e.target.value })}
                        className="bg-mi-navy-light border-mi-cyan/30 text-white [color-scheme:dark]"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeChild(index)}
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Locations Card */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-lg bg-green-500/10">
              <MapPin className="h-5 w-5 text-green-400" />
            </div>
            Locations
          </CardTitle>
          <CardDescription className="text-white/60">
            Where you live and work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {/* Home Location */}
          <div className="p-4 rounded-xl bg-mi-navy/50 border border-mi-cyan/10">
            <h4 className="text-sm font-medium text-green-400 mb-3">Home</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">City</Label>
                <Input
                  value={localData.locations.home_city}
                  onChange={(e) =>
                    updateLocalData('locations', { home_city: e.target.value })
                  }
                  placeholder="City"
                  className="bg-mi-navy border-mi-cyan/30 text-white placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">State/Province</Label>
                <Input
                  value={localData.locations.home_state}
                  onChange={(e) =>
                    updateLocalData('locations', { home_state: e.target.value })
                  }
                  placeholder="State or Province"
                  className="bg-mi-navy border-mi-cyan/30 text-white placeholder:text-white/40"
                />
              </div>
            </div>
          </div>

          {/* Office Location */}
          <div className="p-4 rounded-xl bg-mi-navy/50 border border-mi-cyan/10">
            <h4 className="text-sm font-medium text-white/70 mb-3">Office (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">City</Label>
                <Input
                  value={localData.locations.office_city || ''}
                  onChange={(e) =>
                    updateLocalData('locations', { office_city: e.target.value })
                  }
                  placeholder="Office city"
                  className="bg-mi-navy border-mi-cyan/30 text-white placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">State/Province</Label>
                <Input
                  value={localData.locations.office_state || ''}
                  onChange={(e) =>
                    updateLocalData('locations', { office_state: e.target.value })
                  }
                  placeholder="State or Province"
                  className="bg-mi-navy border-mi-cyan/30 text-white placeholder:text-white/40"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfileSection;
