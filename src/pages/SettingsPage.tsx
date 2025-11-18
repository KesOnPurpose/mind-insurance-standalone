import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
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
  ArrowLeft
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
    ownershipModel: '',
    targetState: '',
    propertyStatus: '',
    immediatePriority: '',
  });

  const [originalData, setOriginalData] = useState({
    ownershipModel: '',
    targetState: '',
    propertyStatus: '',
    immediatePriority: '',
  });

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('user_onboarding')
        .select('ownership_model, target_state, property_status, immediate_priority')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        const settings = {
          ownershipModel: data.ownership_model || '',
          targetState: data.target_state || '',
          propertyStatus: data.property_status || '',
          immediatePriority: data.immediate_priority || '',
        };
        setFormData(settings);
        setOriginalData(settings);
      }
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
      const { error } = await supabase
        .from('user_onboarding')
        .update({
          ownership_model: formData.ownershipModel,
          target_state: formData.targetState,
          property_status: formData.propertyStatus,
          immediate_priority: formData.immediatePriority,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setOriginalData(formData);
      toast({
        title: 'Settings Saved',
        description: 'Your strategy preferences have been updated. Refresh to see changes in your roadmap.',
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
