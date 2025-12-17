import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Settings as SettingsIcon,
  Loader2,
  CheckCircle,
  ArrowLeft,
  Clock,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    timezone: '',
  });

  const [originalData, setOriginalData] = useState({
    timezone: '',
  });

  // Common US timezones for Mind Insurance practice scheduling
  const TIMEZONE_OPTIONS = [
    { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5/4' },
    { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6/5' },
    { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7/6' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8/7' },
    { value: 'America/Phoenix', label: 'Arizona (No DST)', offset: 'UTC-7' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: 'UTC-9/8' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)', offset: 'UTC-10' },
  ];

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) return;

      // Fetch timezone from user_profiles
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('timezone')
        .eq('id', user.id)
        .single();

      const settings = {
        timezone: profileData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
      };
      setFormData(settings);
      setOriginalData(settings);
      setIsLoading(false);
    };

    fetchSettings();
  }, [user?.id]);

  // Check for changes
  useEffect(() => {
    const changed = Object.keys(formData).some(
      key => formData[key as keyof typeof formData] !== originalData[key as keyof typeof originalData]
    );
    setHasChanges(changed);
  }, [formData, originalData]);

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Update timezone in user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          timezone: formData.timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setOriginalData(formData);
      toast({
        title: 'Settings Saved',
        description: 'Your timezone has been updated. Practice windows will adjust accordingly.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(originalData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-mi-navy">
        <Loader2 className="w-8 h-8 animate-spin text-mi-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-mi-navy min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/mind-insurance">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-mi-navy-light">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Hub
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
            <SettingsIcon className="w-8 h-8 text-mi-cyan" />
            Settings
          </h1>
          <p className="text-white/60 mt-1">
            Configure your Mind Insurance preferences
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset} className="border-mi-cyan/30 text-white hover:bg-mi-navy-light">
              Reset
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-mi-cyan hover:bg-mi-cyan/80 text-mi-navy font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Card className="p-4 bg-mi-gold/10 border-mi-gold/30">
          <p className="text-sm text-mi-gold">
            You have unsaved changes. Click "Save Changes" to update your preferences.
          </p>
        </Card>
      )}

      {/* Timezone Settings */}
      <Card className="bg-mi-navy-light border-mi-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Globe className="h-5 w-5 text-mi-cyan" />
            Timezone Settings
          </CardTitle>
          <CardDescription className="text-white/60">
            Your timezone determines when Mind Insurance practice windows are available
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-mi-navy rounded-lg p-4 border border-mi-cyan/20">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-mi-cyan mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-white">Practice Time Windows</p>
                <ul className="text-white/60 mt-1 space-y-1">
                  <li>🌅 Championship Setup: 3am - 10am</li>
                  <li>🏎️ NASCAR Pit Stop: 10am - 3pm</li>
                  <li>🏆 Victory Lap: 3pm - 10pm</li>
                </ul>
              </div>
            </div>
          </div>

          <RadioGroup
            value={formData.timezone}
            onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
          >
            <div className="space-y-2">
              {TIMEZONE_OPTIONS.map((tz) => (
                <div
                  key={tz.value}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    formData.timezone === tz.value
                      ? 'border-mi-cyan/50 bg-mi-cyan/10'
                      : 'border-mi-cyan/10 hover:bg-mi-navy'
                  }`}
                >
                  <RadioGroupItem
                    value={tz.value}
                    id={`tz-${tz.value}`}
                    className="border-mi-cyan/50 text-mi-cyan"
                  />
                  <div className="flex-1">
                    <Label htmlFor={`tz-${tz.value}`} className="font-medium cursor-pointer text-white">
                      {tz.label}
                    </Label>
                    <p className="text-xs text-white/40">{tz.offset}</p>
                  </div>
                  {formData.timezone === tz.value && (
                    <Badge className="text-xs bg-mi-cyan/20 text-mi-cyan border-0">Current</Badge>
                  )}
                </div>
              ))}
            </div>
          </RadioGroup>

          {/* Auto-detect button */}
          <Button
            variant="default"
            size="sm"
            className="bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-medium shadow-md shadow-mi-cyan/20"
            onClick={() => {
              const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
              const match = TIMEZONE_OPTIONS.find(tz => tz.value === detected);
              if (match) {
                setFormData(prev => ({ ...prev, timezone: detected }));
                toast({
                  title: 'Timezone Detected',
                  description: `Set to ${match.label}`,
                });
              } else {
                toast({
                  title: 'Timezone Not Found',
                  description: `Your timezone (${detected}) is not in our list. Please select manually.`,
                  variant: 'destructive',
                });
              }
            }}
          >
            <Globe className="h-4 w-4 mr-2" />
            Auto-detect My Timezone
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
