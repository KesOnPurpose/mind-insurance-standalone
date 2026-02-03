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
  Globe,
  Lock,
  Eye,
  EyeOff,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthWidth } from '@/utils/passwordValidator';
import { isMindInsuranceDomain } from '@/services/domainDetectionService';
import { SmsOptIn } from '@/components/settings/SmsOptIn';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { SubscriptionSection } from '@/components/subscription/SubscriptionSection';

export function SettingsPage() {
  const { user, updatePassword } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  // Password validation
  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  // Domain-based theming
  const isMI = isMindInsuranceDomain();

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
        description: 'Your timezone has been updated.',
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

  const handleSetPassword = async () => {
    if (!passwordValidation.isValid || !passwordsMatch) return;

    setIsSettingPassword(true);
    const { error } = await updatePassword(newPassword);
    setIsSettingPassword(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password Set!',
        description: 'You can now sign in with your email and password.',
      });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${isMI ? 'bg-mi-navy' : ''}`}>
        <Loader2 className={`w-8 h-8 animate-spin ${isMI ? 'text-mi-cyan' : 'text-primary'}`} />
      </div>
    );
  }

  // MI Dark Theme
  if (isMI) {
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

        {/* Subscription Management - MI Theme */}
        <SubscriptionSection isMI={true} />

        {/* Timezone Settings - MI Theme */}
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
                    <li>Championship Setup: 3am - 10am</li>
                    <li>NASCAR Pit Stop: 10am - 3pm</li>
                    <li>Victory Lap: 3pm - 10pm</li>
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

            <Button
              variant="default"
              size="sm"
              className="bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-medium"
              onClick={() => {
                const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const match = TIMEZONE_OPTIONS.find(tz => tz.value === detected);
                if (match) {
                  setFormData(prev => ({ ...prev, timezone: detected }));
                  toast({ title: 'Timezone Detected', description: `Set to ${match.label}` });
                } else {
                  toast({ title: 'Timezone Not Found', description: `Your timezone (${detected}) is not in our list.`, variant: 'destructive' });
                }
              }}
            >
              <Globe className="h-4 w-4 mr-2" />
              Auto-detect My Timezone
            </Button>
          </CardContent>
        </Card>

        {/* Account Security - MI Theme */}
        <Card className="bg-mi-navy-light border-mi-cyan/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Lock className="h-5 w-5 text-mi-cyan" />
              Account Security
            </CardTitle>
            <CardDescription className="text-white/60">
              Set a password to sign in with email and password instead of magic links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-mi-navy rounded-lg p-4 border border-mi-cyan/20">
              <p className="text-sm text-white/70">
                Setting a password allows you to sign in directly without waiting for a magic link email.
                This is faster and more reliable.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-white">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10 bg-mi-navy border-mi-cyan/30 text-white placeholder:text-white/40"
                    disabled={isSettingPassword}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-white/60 hover:text-white hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSettingPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-mi-navy rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            passwordValidation.strength === 'weak' ? 'bg-red-500' :
                            passwordValidation.strength === 'fair' ? 'bg-orange-500' :
                            passwordValidation.strength === 'good' ? 'bg-yellow-500' :
                            passwordValidation.strength === 'strong' ? 'bg-green-500' : 'bg-green-600'
                          }`}
                          style={{ width: getPasswordStrengthWidth(passwordValidation.score) }}
                        />
                      </div>
                      <span className={`text-sm capitalize ${getPasswordStrengthColor(passwordValidation.strength)}`}>
                        {passwordValidation.strength}
                      </span>
                    </div>
                    {passwordValidation.feedback.length > 0 && (
                      <ul className="text-xs text-white/50 space-y-1">
                        {passwordValidation.feedback.map((feedback, index) => (
                          <li key={index}>• {feedback}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-white">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-mi-navy border-mi-cyan/30 text-white placeholder:text-white/40"
                  disabled={isSettingPassword}
                />
                {confirmPassword && !passwordsMatch && <p className="text-xs text-red-400">Passwords do not match</p>}
                {confirmPassword && passwordsMatch && <p className="text-xs text-green-400">Passwords match</p>}
              </div>

              <Button
                onClick={handleSetPassword}
                disabled={isSettingPassword || !passwordValidation.isValid || !passwordsMatch}
                className="w-full bg-mi-cyan hover:bg-mi-cyan/80 text-mi-navy font-semibold"
              >
                {isSettingPassword ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting Password...</>
                ) : (
                  <><Lock className="w-4 h-4 mr-2" />Set Password</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SMS Notifications - MI Theme */}
        <Card className="bg-mi-navy-light border-mi-cyan/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageSquare className="h-5 w-5 text-mi-cyan" />
              SMS Notifications
            </CardTitle>
            <CardDescription className="text-white/60">
              Receive protocol reminders via text message
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SmsOptIn />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Grouphome Light Theme (Default)
  return (
    <SidebarLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/chat">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><CheckCircle className="w-4 h-4 mr-2" />Save Changes</>
            )}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">
            You have unsaved changes. Click "Save Changes" to update your preferences.
          </p>
        </Card>
      )}

      {/* Subscription Management - Light Theme */}
      <SubscriptionSection isMI={false} />

      {/* Account Security - Light Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Account Security
          </CardTitle>
          <CardDescription>
            Set a password to sign in with email and password instead of magic links
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              Setting a password allows you to sign in directly without waiting for a magic link email.
              This is faster and more reliable.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  disabled={isSettingPassword}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSettingPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          passwordValidation.strength === 'weak' ? 'bg-red-500' :
                          passwordValidation.strength === 'fair' ? 'bg-orange-500' :
                          passwordValidation.strength === 'good' ? 'bg-yellow-500' :
                          passwordValidation.strength === 'strong' ? 'bg-green-500' : 'bg-green-600'
                        }`}
                        style={{ width: getPasswordStrengthWidth(passwordValidation.score) }}
                      />
                    </div>
                    <span className={`text-sm capitalize ${getPasswordStrengthColor(passwordValidation.strength)}`}>
                      {passwordValidation.strength}
                    </span>
                  </div>
                  {passwordValidation.feedback.length > 0 && (
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {passwordValidation.feedback.map((feedback, index) => (
                        <li key={index}>• {feedback}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSettingPassword}
              />
              {confirmPassword && !passwordsMatch && <p className="text-xs text-red-500">Passwords do not match</p>}
              {confirmPassword && passwordsMatch && <p className="text-xs text-green-500">Passwords match</p>}
            </div>

            <Button
              onClick={handleSetPassword}
              disabled={isSettingPassword || !passwordValidation.isValid || !passwordsMatch}
              className="w-full"
            >
              {isSettingPassword ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting Password...</>
              ) : (
                <><Lock className="w-4 h-4 mr-2" />Set Password</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timezone Settings - Light Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Timezone Settings
          </CardTitle>
          <CardDescription>
            Your timezone affects how times are displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value={tz.value} id={`tz-${tz.value}`} />
                  <div className="flex-1">
                    <Label htmlFor={`tz-${tz.value}`} className="font-medium cursor-pointer">
                      {tz.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{tz.offset}</p>
                  </div>
                  {formData.timezone === tz.value && (
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  )}
                </div>
              ))}
            </div>
          </RadioGroup>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
              const match = TIMEZONE_OPTIONS.find(tz => tz.value === detected);
              if (match) {
                setFormData(prev => ({ ...prev, timezone: detected }));
                toast({ title: 'Timezone Detected', description: `Set to ${match.label}` });
              } else {
                toast({ title: 'Timezone Not Found', description: `Your timezone (${detected}) is not in our list.`, variant: 'destructive' });
              }
            }}
          >
            <Globe className="h-4 w-4 mr-2" />
            Auto-detect My Timezone
          </Button>
        </CardContent>
      </Card>
    </div>
    </SidebarLayout>
  );
}

export default SettingsPage;
