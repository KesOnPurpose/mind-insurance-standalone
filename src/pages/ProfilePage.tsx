import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User,
  Building2,
  MapPin,
  Target,
  Home,
  DollarSign,
  FileCheck,
  Loader2,
  CheckCircle,
  Save,
  Lightbulb,
  Edit3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePersonalizedTactics } from '@/hooks/usePersonalizedTactics';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

interface ProfileData {
  // Strategy fields
  ownership_model: string;
  target_state: string;
  immediate_priority: string;
  property_status: string;
  // Business profile fields
  business_name: string;
  entity_type: string;
  bed_count: number | null;
  funding_source: string;
  license_status: string;
  service_model: string;
  monthly_revenue_target: number | null;
  startup_capital_actual: number | null;
  // Computed
  profile_completeness: number;
}

export function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { assessment } = usePersonalizedTactics();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    ownership_model: '',
    target_state: '',
    immediate_priority: '',
    property_status: '',
    business_name: '',
    entity_type: '',
    bed_count: null,
    funding_source: '',
    license_status: '',
    service_model: '',
    monthly_revenue_target: null,
    startup_capital_actual: null,
    profile_completeness: 0,
  });

  const [originalData, setOriginalData] = useState<ProfileData>(profileData);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        const profile: ProfileData = {
          ownership_model: data.ownership_model || '',
          target_state: data.target_state || '',
          immediate_priority: data.immediate_priority || '',
          property_status: data.property_status || '',
          business_name: data.business_name || '',
          entity_type: data.entity_type || '',
          bed_count: data.bed_count || null,
          funding_source: data.funding_source || '',
          license_status: data.license_status || '',
          service_model: data.service_model || '',
          monthly_revenue_target: data.monthly_revenue_target || null,
          startup_capital_actual: data.startup_capital_actual || null,
          profile_completeness: data.profile_completeness || 0,
        };
        setProfileData(profile);
        setOriginalData(profile);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [user?.id]);

  // Check for changes
  useEffect(() => {
    const changed = Object.keys(profileData).some(
      key => profileData[key as keyof ProfileData] !== originalData[key as keyof ProfileData]
    );
    setHasChanges(changed);
  }, [profileData, originalData]);

  // Calculate profile completeness locally
  const calculateCompleteness = (data: ProfileData): number => {
    const fields = [
      data.target_state,
      data.business_name,
      data.entity_type,
      data.bed_count,
      data.property_status,
      data.funding_source,
      data.license_status,
      data.service_model,
      data.monthly_revenue_target,
    ];
    const filled = fields.filter(f => f !== null && f !== '' && f !== undefined).length;
    return Math.round((filled / 9) * 100);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const completeness = calculateCompleteness(profileData);

      const { error } = await supabase
        .from('user_onboarding')
        .update({
          ownership_model: profileData.ownership_model || null,
          target_state: profileData.target_state || null,
          immediate_priority: profileData.immediate_priority || null,
          property_status: profileData.property_status || null,
          business_name: profileData.business_name || null,
          entity_type: profileData.entity_type || null,
          bed_count: profileData.bed_count,
          funding_source: profileData.funding_source || null,
          license_status: profileData.license_status || null,
          service_model: profileData.service_model || null,
          monthly_revenue_target: profileData.monthly_revenue_target,
          startup_capital_actual: profileData.startup_capital_actual,
          profile_completeness: completeness,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfileData(prev => ({ ...prev, profile_completeness: completeness }));
      setOriginalData({ ...profileData, profile_completeness: completeness });
      setEditMode(false);
      toast({
        title: 'Profile Saved',
        description: `Your profile is now ${completeness}% complete!`,
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setProfileData(originalData);
    setEditMode(false);
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  const currentCompleteness = calculateCompleteness(profileData);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              My Profile
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage your business profile to get personalized recommendations
            </p>
          </div>
          <div className="flex items-center gap-3">
            {editMode ? (
              <>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving}>
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
              </>
            ) : (
              <Button size="sm" onClick={() => setEditMode(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

      {/* Profile Completeness Card */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Profile Completeness
          </h3>
          <Badge variant={currentCompleteness >= 80 ? 'default' : currentCompleteness >= 50 ? 'secondary' : 'outline'}>
            {currentCompleteness}% Complete
          </Badge>
        </div>
        <Progress value={currentCompleteness} className="h-3 mb-3" />
        <p className="text-sm text-muted-foreground">
          {currentCompleteness < 50
            ? 'Complete your profile to unlock personalized recommendations'
            : currentCompleteness < 80
            ? 'Great progress! A few more fields will maximize personalization'
            : 'Excellent! Your profile is well-filled for maximum personalization'}
        </p>
      </Card>

      <Accordion type="multiple" defaultValue={['business']} className="space-y-3">
        {/* Business Profile Section */}
        <AccordionItem value="business" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="font-semibold">Business Profile</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {!editMode && (
              <p className="text-xs text-muted-foreground mb-4">(Click "Edit Profile" to make changes)</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="business_name" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Business Name
                </Label>
                {editMode ? (
                  <Input
                    id="business_name"
                    value={profileData.business_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="Enter your business name"
                  />
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md min-h-[40px] flex items-center">
                    {profileData.business_name || <span className="text-muted-foreground italic">Not set</span>}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Your group home business name (LLC, DBA, etc.)
                </p>
              </div>

              {/* Entity Type */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  Entity Type
                </Label>
                {editMode ? (
                  <Select
                    value={profileData.entity_type}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, entity_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llc">LLC</SelectItem>
                      <SelectItem value="s-corp">S-Corporation</SelectItem>
                      <SelectItem value="c-corp">C-Corporation</SelectItem>
                      <SelectItem value="sole-proprietor">Sole Proprietorship</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="nonprofit">Nonprofit</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md min-h-[40px] flex items-center">
                    {profileData.entity_type ? (
                      <Badge variant="outline" className="capitalize">{profileData.entity_type.replace(/-/g, ' ')}</Badge>
                    ) : (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </div>
                )}
              </div>

              {/* Bed Count */}
              <div className="space-y-2">
                <Label htmlFor="bed_count" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Planned Bed Count
                </Label>
                {editMode ? (
                  <Input
                    id="bed_count"
                    type="number"
                    min={1}
                    max={100}
                    value={profileData.bed_count || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bed_count: e.target.value ? parseInt(e.target.value) : null }))}
                    placeholder="Number of beds"
                  />
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md min-h-[40px] flex items-center">
                    {profileData.bed_count ? `${profileData.bed_count} beds` : <span className="text-muted-foreground italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Property Status */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Property Status
                </Label>
                {editMode ? (
                  <Select
                    value={profileData.property_status}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, property_status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Haven't started looking</SelectItem>
                      <SelectItem value="researching">Researching areas</SelectItem>
                      <SelectItem value="searching">Actively searching</SelectItem>
                      <SelectItem value="offer-pending">Made an offer</SelectItem>
                      <SelectItem value="under-contract">Under contract</SelectItem>
                      <SelectItem value="owned">I own a property</SelectItem>
                      <SelectItem value="leasing">I'm leasing</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md min-h-[40px] flex items-center">
                    {profileData.property_status ? (
                      <Badge variant="secondary" className="capitalize">{profileData.property_status.replace(/-/g, ' ')}</Badge>
                    ) : (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </div>
                )}
              </div>

              {/* Funding Source */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Funding Source
                </Label>
                {editMode ? (
                  <Select
                    value={profileData.funding_source}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, funding_source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select funding source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal-savings">Personal Savings</SelectItem>
                      <SelectItem value="bank-loan">Bank Loan</SelectItem>
                      <SelectItem value="sba-loan">SBA Loan</SelectItem>
                      <SelectItem value="private-investor">Private Investor</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="creative-financing">Creative Financing</SelectItem>
                      <SelectItem value="combination">Combination</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md min-h-[40px] flex items-center">
                    {profileData.funding_source ? (
                      <Badge variant="outline" className="capitalize">{profileData.funding_source.replace(/-/g, ' ')}</Badge>
                    ) : (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </div>
                )}
              </div>

              {/* License Status */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  License Status
                </Label>
                {editMode ? (
                  <Select
                    value={profileData.license_status}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, license_status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select license status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="researching">Researching Requirements</SelectItem>
                      <SelectItem value="preparing">Preparing Application</SelectItem>
                      <SelectItem value="submitted">Application Submitted</SelectItem>
                      <SelectItem value="under-review">Under Review</SelectItem>
                      <SelectItem value="licensed">Licensed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md min-h-[40px] flex items-center">
                    {profileData.license_status ? (
                      <Badge variant="outline" className="capitalize">{profileData.license_status.replace(/-/g, ' ')}</Badge>
                    ) : (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </div>
                )}
              </div>

              {/* Service Model */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Service Model
                </Label>
                {editMode ? (
                  <Select
                    value={profileData.service_model}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, service_model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner-operator">Owner-Operator</SelectItem>
                      <SelectItem value="semi-absentee">Semi-Absentee</SelectItem>
                      <SelectItem value="absentee">Absentee Owner</SelectItem>
                      <SelectItem value="management-company">With Management Company</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md min-h-[40px] flex items-center">
                    {profileData.service_model ? (
                      <Badge variant="outline" className="capitalize">{profileData.service_model.replace(/-/g, ' ')}</Badge>
                    ) : (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </div>
                )}
              </div>

              {/* Monthly Revenue Target */}
              <div className="space-y-2">
                <Label htmlFor="monthly_revenue" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Monthly Revenue Target
                </Label>
                {editMode ? (
                  <Input
                    id="monthly_revenue"
                    type="number"
                    min={0}
                    step={1000}
                    value={profileData.monthly_revenue_target || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, monthly_revenue_target: e.target.value ? parseInt(e.target.value) : null }))}
                    placeholder="Target monthly revenue"
                  />
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md min-h-[40px] flex items-center">
                    {profileData.monthly_revenue_target ? (
                      <span className="text-emerald-600 font-semibold">${profileData.monthly_revenue_target.toLocaleString()}/mo</span>
                    ) : (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!editMode && (
              <Card className="mt-4 p-3 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 text-sm">Pro Tip</p>
                    <p className="text-xs text-blue-700">
                      Complete relevant tactics in your roadmap to fill these fields, or edit directly here.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Strategy & Goals Section */}
        <AccordionItem value="strategy" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-semibold">Strategy & Goals</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {/* Ownership Model */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Ownership Model
                </Label>
                {editMode ? (
                  <Select
                    value={profileData.ownership_model}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, ownership_model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ownership model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rental_arbitrage">Rental Arbitrage</SelectItem>
                      <SelectItem value="ownership">Property Ownership</SelectItem>
                      <SelectItem value="creative_financing">Creative Financing</SelectItem>
                      <SelectItem value="house_hack">House Hacking</SelectItem>
                      <SelectItem value="hybrid">Hybrid Approach</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md min-h-[40px] flex items-center">
                    {profileData.ownership_model ? (
                      <Badge className="capitalize">{profileData.ownership_model.replace(/_/g, ' ')}</Badge>
                    ) : (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </div>
                )}
              </div>

              {/* Target State */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Target State
                </Label>
                {editMode ? (
                  <Select
                    value={profileData.target_state}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, target_state: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target state" />
                    </SelectTrigger>
                    <SelectContent>
                      {['CA', 'TX', 'FL', 'NY', 'GA', 'AZ', 'NC', 'PA', 'OH', 'OTHER'].map(state => (
                        <SelectItem key={state} value={state}>
                          {state === 'OTHER' ? 'Other State' : state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md min-h-[40px] flex items-center">
                    {profileData.target_state ? (
                      <Badge variant="secondary">
                        <MapPin className="w-3 h-3 mr-1" />
                        {profileData.target_state}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </div>
                )}
              </div>

              {/* Immediate Priority */}
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Immediate Priority
                </Label>
                {editMode ? (
                  <Select
                    value={profileData.immediate_priority}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, immediate_priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your focus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="property_acquisition">Finding & Acquiring Property</SelectItem>
                      <SelectItem value="operations">Operating My Property</SelectItem>
                      <SelectItem value="comprehensive">Learning All Strategies</SelectItem>
                      <SelectItem value="scaling">Scaling My Operation</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md min-h-[40px] flex items-center">
                    {profileData.immediate_priority ? (
                      <Badge variant="outline" className="capitalize">
                        {profileData.immediate_priority.replace(/_/g, ' ')}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  This determines how tactics are prioritized in your roadmap
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Assessment Results Section */}
        <AccordionItem value="assessment" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              <span className="font-semibold">Assessment Results</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {assessment ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Overall Score</span>
                    <Badge variant="default">{assessment.overall_score}%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Readiness Level</span>
                    <Badge variant="outline" className="capitalize">
                      {assessment.readiness_level?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Financial Score</span>
                    <span className="font-medium">{assessment.financial_score}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Market Score</span>
                    <span className="font-medium">{assessment.market_score}%</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Operational Score</span>
                    <span className="font-medium">{assessment.operational_score}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Mindset Score</span>
                    <span className="font-medium">{assessment.mindset_score}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Capital Available</span>
                    <span className="font-medium">{assessment.capital_available}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Timeline</span>
                    <Badge variant="secondary" className="capitalize">
                      {assessment.timeline?.replace(/-/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No assessment data available</p>
                <Button asChild variant="link" className="mt-2">
                  <Link to="/assessment">Take Assessment</Link>
                </Button>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      </div>
    </SidebarLayout>
  );
}

export default ProfilePage;
