import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings as SettingsIcon,
  Home,
  Search,
  BookOpen,
  TrendingUp,
  Loader2,
  CheckCircle,
  MapPin,
  Building2,
  Target,
  ArrowLeft,
  RefreshCw,
  DollarSign,
  Handshake,
  Clock,
  Globe
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePersonalizedTactics } from '@/hooks/usePersonalizedTactics';

// Helper functions for formatting assessment data
const formatStrategy = (strategy?: string) => {
  if (!strategy) return 'Not Set';
  return strategy.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const formatPopulation = (pop: string) => {
  const mapping: Record<string, string> = {
    'seniors': 'Seniors',
    'developmental-disabilities': 'Developmental Disabilities',
    'mental-health': 'Mental Health',
    'at-risk-youth': 'At-Risk Youth',
    'substance-abuse': 'Substance Abuse',
    'not-sure': 'Exploring Options'
  };
  return mapping[pop] || pop;
};

const formatBudget = (budget?: string) => {
  const mapping: Record<string, string> = {
    'less-5k': '$0 - $5,000',
    '5k-15k': '$5,000 - $15,000',
    '15k-30k': '$15,000 - $30,000',
    '30k-50k': '$30,000 - $50,000',
    'more-50k': '$50,000+'
  };
  return mapping[budget || ''] || 'Not Set';
};

const formatPriority = (priority?: string) => {
  const mapping: Record<string, string> = {
    'property_acquisition': 'Property Acquisition',
    'operations': 'Operations Setup',
    'comprehensive': 'Comprehensive Learning',
    'scaling': 'Scaling & Growth'
  };
  return mapping[priority || ''] || 'Not Set';
};

const getStrategyIcon = (strategy?: string) => {
  switch(strategy) {
    case 'rental_arbitrage': return <Handshake className="h-3 w-3" />;
    case 'ownership': return <Home className="h-3 w-3" />;
    case 'hybrid': return <Building2 className="h-3 w-3" />;
    default: return <Target className="h-3 w-3" />;
  }
};

const getPopulationIcon = (pop: string) => {
  switch(pop) {
    case 'seniors': return '👴';
    case 'developmental-disabilities': return '❤️';
    case 'mental-health': return '🧠';
    case 'at-risk-youth': return '👶';
    case 'substance-abuse': return '💊';
    case 'not-sure': return '🤔';
    default: return '👥';
  }
};

export function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { assessment, totalTacticsCount } = usePersonalizedTactics();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    ownershipModel: '',
    targetState: '',
    propertyStatus: '',
    immediatePriority: '',
    timezone: '',
  });

  const [originalData, setOriginalData] = useState({
    ownershipModel: '',
    targetState: '',
    propertyStatus: '',
    immediatePriority: '',
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

      // Fetch from user_onboarding
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('user_onboarding')
        .select('ownership_model, target_state, property_status, immediate_priority')
        .eq('user_id', user.id)
        .single();

      // Fetch timezone from user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('timezone')
        .eq('id', user.id)
        .single();

      const settings = {
        ownershipModel: onboardingData?.ownership_model || '',
        targetState: onboardingData?.target_state || '',
        propertyStatus: onboardingData?.property_status || '',
        immediatePriority: onboardingData?.immediate_priority || '',
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
      // Update user_onboarding
      const { error: onboardingError } = await supabase
        .from('user_onboarding')
        .update({
          ownership_model: formData.ownershipModel,
          target_state: formData.targetState,
          property_status: formData.propertyStatus,
          immediate_priority: formData.immediatePriority,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (onboardingError) throw onboardingError;

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
        description: 'Your preferences have been updated. Timezone affects Mind Insurance practice windows.',
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/roadmap">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Roadmap
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Update your strategy preferences to personalize your journey
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
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">
            You have unsaved changes. Click "Save Changes" to update your preferences.
          </p>
        </Card>
      )}

      {/* Roadmap Personalization Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Roadmap Personalization
          </CardTitle>
          <CardDescription>
            Your roadmap is tailored based on your assessment answers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strategy */}
          {assessment?.ownership_model && (
            <div>
              <Label className="text-sm font-medium text-slate-700">Strategy</Label>
              <div className="mt-2">
                <Badge variant="secondary" className="gap-1.5">
                  {getStrategyIcon(assessment.ownership_model)}
                  {formatStrategy(assessment.ownership_model)}
                </Badge>
              </div>
            </div>
          )}

          {/* Target Populations */}
          {assessment?.target_populations && assessment.target_populations.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-slate-700">Target Populations</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {assessment.target_populations.map((pop: string) => (
                  <Badge key={pop} variant="outline" className="gap-1.5">
                    <span>{getPopulationIcon(pop)}</span>
                    {formatPopulation(pop)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Budget Range */}
          {assessment?.capital_available && (
            <div>
              <Label className="text-sm font-medium text-slate-700">Budget Range</Label>
              <div className="mt-2">
                <Badge variant="secondary" className="gap-1.5">
                  <DollarSign className="h-3 w-3" />
                  {formatBudget(assessment.capital_available)}
                </Badge>
              </div>
            </div>
          )}

          {/* Immediate Priority */}
          {assessment?.immediate_priority && (
            <div>
              <Label className="text-sm font-medium text-slate-700">Immediate Priority</Label>
              <div className="mt-2">
                <Badge variant="secondary" className="gap-1.5">
                  <Target className="h-3 w-3" />
                  {formatPriority(assessment.immediate_priority)}
                </Badge>
              </div>
            </div>
          )}

          {/* Tactic Count Summary */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Tactics in your roadmap:</span>
              <span className="font-semibold text-teal-600">
                {totalTacticsCount} of 343
              </span>
            </div>
          </div>

          {/* Retake Assessment Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/assessment')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retake Assessment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timezone Settings - For Mind Insurance Practice Windows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-mi-cyan" />
            Timezone Settings
          </CardTitle>
          <CardDescription>
            Your timezone determines when Mind Insurance practice windows are available
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-mi-navy-light/10 rounded-lg p-4 border border-mi-cyan/20">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-mi-cyan mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-slate-700">Practice Time Windows</p>
                <ul className="text-slate-600 mt-1 space-y-1">
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
                <div key={tz.value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
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

          {/* Auto-detect button */}
          <Button
            variant="outline"
            size="sm"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ownership Strategy */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Ownership Strategy
          </h3>
          <RadioGroup
            value={formData.ownershipModel}
            onValueChange={(value) => setFormData(prev => ({ ...prev, ownershipModel: value }))}
          >
            <div className="space-y-3">
              {[
                { value: 'rental_arbitrage', label: 'Rental Arbitrage', desc: 'Lease & sublease properties' },
                { value: 'ownership', label: 'Property Ownership', desc: 'Purchase properties outright' },
                { value: 'creative_financing', label: 'Creative Financing', desc: 'Subject-to, seller financing' },
                { value: 'house_hack', label: 'House Hacking', desc: 'Live in property while operating' },
                { value: 'hybrid', label: 'Hybrid Approach', desc: 'Combination of strategies' },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value={option.value} id={`own-${option.value}`} />
                  <div className="flex-1">
                    <Label htmlFor={`own-${option.value}`} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{option.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </Card>

        {/* Target State */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Target State
          </h3>
          <RadioGroup
            value={formData.targetState}
            onValueChange={(value) => setFormData(prev => ({ ...prev, targetState: value }))}
          >
            <div className="grid grid-cols-2 gap-2">
              {['CA', 'TX', 'FL', 'NY', 'GA', 'AZ', 'NC', 'PA', 'OH', 'OTHER'].map((state) => (
                <div key={state} className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50">
                  <RadioGroupItem value={state} id={`state-${state}`} />
                  <Label htmlFor={`state-${state}`} className="font-normal cursor-pointer">
                    {state === 'OTHER' ? 'Other State' : state}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </Card>

        {/* Property Status */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            Current Property Status
          </h3>
          <RadioGroup
            value={formData.propertyStatus}
            onValueChange={(value) => setFormData(prev => ({ ...prev, propertyStatus: value }))}
          >
            <div className="space-y-2">
              {[
                { value: 'not-started', label: "Haven't started looking" },
                { value: 'researching', label: 'Researching areas/options' },
                { value: 'searching', label: 'Actively searching' },
                { value: 'offer-pending', label: 'Made an offer / Negotiating' },
                { value: 'under-contract', label: 'Under contract' },
                { value: 'owned', label: 'I own a property' },
                { value: 'leasing', label: "I'm leasing a property" },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-2 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value={option.value} id={`prop-${option.value}`} />
                  <Label htmlFor={`prop-${option.value}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </Card>

        {/* Immediate Priority */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Immediate Priority
            <Badge variant="secondary" className="text-xs">Affects tactic order</Badge>
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            This determines which tactics are shown first in your roadmap
          </p>
          <RadioGroup
            value={formData.immediatePriority}
            onValueChange={(value) => setFormData(prev => ({ ...prev, immediatePriority: value }))}
          >
            <div className="space-y-3">
              {[
                {
                  value: 'property_acquisition',
                  label: 'Finding & Acquiring Property',
                  desc: 'Property search, negotiations, landlord outreach',
                  icon: Search,
                  color: 'text-amber-500'
                },
                {
                  value: 'operations',
                  label: 'Operating My Property',
                  desc: 'Licensing, setup, staffing, first residents',
                  icon: Home,
                  color: 'text-green-600'
                },
                {
                  value: 'comprehensive',
                  label: 'Learning All Strategies',
                  desc: 'See all tactics in order - thorough preparation',
                  icon: BookOpen,
                  color: 'text-blue-500'
                },
                {
                  value: 'scaling',
                  label: 'Scaling My Operation',
                  desc: 'Adding properties, optimizing revenue, building systems',
                  icon: TrendingUp,
                  color: 'text-purple-600'
                },
              ].map((option) => (
                <div key={option.value} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value={option.value} id={`priority-${option.value}`} className="mt-1" />
                  <option.icon className={`w-6 h-6 ${option.color} mt-0.5`} />
                  <div className="flex-1">
                    <Label htmlFor={`priority-${option.value}`} className="font-semibold cursor-pointer block">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">{option.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </Card>
      </div>
    </div>
  );
}

export default SettingsPage;
