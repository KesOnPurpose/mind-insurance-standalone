// Business Section Component
// Companies, 12 Week Domination (replaces priorities), and Premium Schedule (replaces projects)

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CEOPreferences, CEOBusiness, CEOCompany, CEOActivePolicy, CEOPremiumSchedule, CEOPremiumBlock, DayOfWeek } from '@/types/ceoDashboard';
import { generateId } from '@/services/ceoPreferencesService';
import { DominationSection } from './DominationSection';
import { BlueprintWeekSection } from './BlueprintWeekSection';
import { VisionBlueprintSection } from './VisionBlueprintSection';
import {
  useActivePolicy,
  useSaveActivePolicy,
  useUpdatePremiumPaymentCount,
  usePremiumSchedule,
  useSavePremiumSchedule,
  useAddTimeBlock,
  useUpdateTimeBlock,
  useRemoveTimeBlock,
} from '@/hooks/useCEODashboard';
import {
  Building2,
  Shield,
  Calendar,
  Plus,
  Trash2,
  Save,
  Loader2,
  Globe,
  Briefcase,
  Eye,
} from 'lucide-react';

interface BusinessSectionProps {
  preferences: CEOPreferences | null;
  onSave: (preferences: Partial<CEOPreferences>) => Promise<void>;
  onMarkUnsaved: () => void;
  isSaving: boolean;
}

type BusinessSubTab = 'companies' | 'domination' | 'schedule' | 'vision';

export function BusinessSection({
  preferences,
  onSave,
  onMarkUnsaved,
  isSaving,
}: BusinessSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<BusinessSubTab>('domination');

  // DIAGNOSTIC: Log sub-tab state
  console.log('[BusinessSection] Current activeSubTab:', activeSubTab);

  // Local state for companies
  const [localCompanies, setLocalCompanies] = useState<CEOCompany[]>(
    preferences?.business?.companies || []
  );
  const [hasCompanyChanges, setHasCompanyChanges] = useState(false);

  // Active Policy hooks
  const { data: activePolicy, isLoading: policyLoading } = useActivePolicy();
  const savePolicy = useSaveActivePolicy();
  const updatePaymentCount = useUpdatePremiumPaymentCount();

  // Premium Schedule hooks
  const { data: premiumSchedule, isLoading: scheduleLoading } = usePremiumSchedule();
  const saveSchedule = useSavePremiumSchedule();
  const addBlock = useAddTimeBlock();
  const updateBlock = useUpdateTimeBlock();
  const removeBlock = useRemoveTimeBlock();

  // Company management
  const addCompany = useCallback(() => {
    const newCompany: CEOCompany = {
      id: generateId(),
      name: '',
      role: 'CEO',
      industry: '',
      status: 'active',
      website: '',
      notes: '',
    };
    setLocalCompanies((prev) => [...prev, newCompany]);
    setHasCompanyChanges(true);
    onMarkUnsaved();
  }, [onMarkUnsaved]);

  const removeCompany = useCallback(
    (id: string) => {
      setLocalCompanies((prev) => prev.filter((c) => c.id !== id));
      setHasCompanyChanges(true);
      onMarkUnsaved();
    },
    [onMarkUnsaved]
  );

  const updateCompany = useCallback(
    (id: string, updates: Partial<CEOCompany>) => {
      setLocalCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
      setHasCompanyChanges(true);
      onMarkUnsaved();
    },
    [onMarkUnsaved]
  );

  // Save companies
  const handleSaveCompanies = useCallback(async () => {
    await onSave({
      business: {
        ...preferences?.business,
        companies: localCompanies,
        priorities: preferences?.business?.priorities || [],
        projects: preferences?.business?.projects || [],
      },
    });
    setHasCompanyChanges(false);
  }, [localCompanies, preferences?.business, onSave]);

  // Policy handlers
  const handleSavePolicy = async (policy: CEOActivePolicy) => {
    await savePolicy.mutateAsync(policy);
  };

  const handleUpdatePaymentCount = async (
    targetId: string,
    paymentId: string,
    count: number
  ) => {
    await updatePaymentCount.mutateAsync({ targetId, paymentId, newCount: count });
  };

  // Schedule handlers
  const handleSaveSchedule = async (schedule: CEOPremiumSchedule) => {
    await saveSchedule.mutateAsync(schedule);
  };

  const handleAddBlock = async (day: DayOfWeek, block: CEOPremiumBlock) => {
    await addBlock.mutateAsync({ day, block });
  };

  const handleUpdateBlock = async (
    day: DayOfWeek,
    blockId: string,
    updates: Partial<CEOPremiumBlock>
  ) => {
    await updateBlock.mutateAsync({ day, blockId, updates });
  };

  const handleRemoveBlock = async (day: DayOfWeek, blockId: string) => {
    await removeBlock.mutateAsync({ day, blockId });
  };

  // Role options for companies
  const roleOptions = [
    { value: 'CEO', label: 'CEO' },
    { value: 'Founder', label: 'Founder' },
    { value: 'Co-Founder', label: 'Co-Founder' },
    { value: 'Advisor', label: 'Advisor' },
    { value: 'Board Member', label: 'Board Member' },
    { value: 'Investor', label: 'Investor' },
    { value: 'Other', label: 'Other' },
  ];

  // Company status options
  const companyStatusOptions = [
    { value: 'active', label: 'Active', color: 'bg-green-500' },
    { value: 'exited', label: 'Exited', color: 'bg-purple-500' },
    { value: 'advisory', label: 'Advisory', color: 'bg-blue-500' },
    { value: 'paused', label: 'Paused', color: 'bg-yellow-500' },
  ];

  const getCompanyStatusColor = (status: string) => {
    const option = companyStatusOptions.find((o) => o.value === status);
    return option?.color || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs for Business Section */}
      <Tabs
        value={activeSubTab}
        onValueChange={(v) => setActiveSubTab(v as BusinessSubTab)}
        className="space-y-6"
      >
        <TabsList className="bg-mi-navy-light border border-mi-cyan/20 p-1 h-auto flex-wrap justify-start md:justify-center gap-1">
          <TabsTrigger
            value="domination"
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all',
              'data-[state=active]:bg-mi-gold data-[state=active]:text-mi-navy data-[state=active]:shadow-lg',
              'data-[state=inactive]:text-white/60 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-mi-cyan/10'
            )}
          >
            <Shield className="h-4 w-4" />
            <span>Active Policy</span>
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all',
              'data-[state=active]:bg-mi-cyan data-[state=active]:text-mi-navy data-[state=active]:shadow-lg',
              'data-[state=inactive]:text-white/60 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-mi-cyan/10'
            )}
          >
            <Calendar className="h-4 w-4" />
            <span>Premium Schedule</span>
          </TabsTrigger>
          <TabsTrigger
            value="companies"
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all',
              'data-[state=active]:bg-mi-cyan data-[state=active]:text-mi-navy data-[state=active]:shadow-lg',
              'data-[state=inactive]:text-white/60 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-mi-cyan/10'
            )}
          >
            <Building2 className="h-4 w-4" />
            <span>Companies</span>
          </TabsTrigger>
          <TabsTrigger
            value="vision"
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all',
              'data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg',
              'data-[state=inactive]:text-white/60 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-purple-500/10'
            )}
          >
            <Eye className="h-4 w-4" />
            <span>V.I.S.I.O.N.</span>
          </TabsTrigger>
        </TabsList>

        {/* Active Policy (12 Week Domination) */}
        <TabsContent value="domination" className="mt-0 focus-visible:outline-none">
          {policyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-mi-cyan animate-spin" />
            </div>
          ) : (
            <DominationSection
              policy={activePolicy || null}
              onSave={handleSavePolicy}
              onUpdatePaymentCount={handleUpdatePaymentCount}
              isSaving={
                savePolicy.isPending || updatePaymentCount.isPending
              }
            />
          )}
        </TabsContent>

        {/* Premium Schedule (Model Week) */}
        <TabsContent value="schedule" className="mt-0 focus-visible:outline-none">
          {scheduleLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-mi-cyan animate-spin" />
            </div>
          ) : (
            <BlueprintWeekSection
              schedule={premiumSchedule || null}
              activePolicy={activePolicy || null}
              onSave={handleSaveSchedule}
              onAddBlock={handleAddBlock}
              onUpdateBlock={handleUpdateBlock}
              onRemoveBlock={handleRemoveBlock}
              isSaving={
                saveSchedule.isPending ||
                addBlock.isPending ||
                updateBlock.isPending ||
                removeBlock.isPending
              }
            />
          )}
        </TabsContent>

        {/* Companies */}
        <TabsContent value="companies" className="mt-0 focus-visible:outline-none">
          <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-mi-cyan/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="p-2 rounded-lg bg-mi-cyan/10">
                      <Building2 className="h-5 w-5 text-mi-cyan" />
                    </div>
                    Your Companies
                  </CardTitle>
                  <CardDescription className="text-white/60 mt-1">
                    Companies you run or advise
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {hasCompanyChanges && (
                    <Button
                      size="sm"
                      onClick={handleSaveCompanies}
                      disabled={isSaving}
                      className="bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addCompany}
                    className="border-mi-cyan/30 text-mi-cyan hover:bg-mi-cyan/10"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Company
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              {localCompanies.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No companies added yet</p>
                  <p className="text-sm mt-1">Add the companies you run or advise</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {localCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="p-4 rounded-xl bg-mi-navy border border-mi-cyan/20 group hover:border-mi-cyan/40 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 mr-4">
                          <Input
                            value={company.name}
                            onChange={(e) =>
                              updateCompany(company.id, { name: e.target.value })
                            }
                            placeholder="Company name"
                            className="bg-transparent border-0 text-white placeholder:text-white/40 font-semibold text-lg p-0 h-auto focus-visible:ring-0"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeCompany(company.id)}
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Role */}
                        <div className="space-y-2">
                          <Label className="text-white/60 text-xs flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> Your Role
                          </Label>
                          <Select
                            value={company.role}
                            onValueChange={(value) =>
                              updateCompany(company.id, {
                                role: value as CEOCompany['role'],
                              })
                            }
                          >
                            <SelectTrigger className="bg-mi-navy-light border-mi-cyan/20 text-white h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-mi-navy-light border-mi-cyan/30">
                              {roleOptions.map((option) => (
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

                        {/* Status */}
                        <div className="space-y-2">
                          <Label className="text-white/60 text-xs">Status</Label>
                          <Select
                            value={company.status}
                            onValueChange={(value) =>
                              updateCompany(company.id, {
                                status: value as CEOCompany['status'],
                              })
                            }
                          >
                            <SelectTrigger className="bg-mi-navy-light border-mi-cyan/20 text-white h-9">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    'w-2 h-2 rounded-full',
                                    getCompanyStatusColor(company.status)
                                  )}
                                />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent className="bg-mi-navy-light border-mi-cyan/30">
                              {companyStatusOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  className="text-white hover:bg-mi-cyan/10 focus:bg-mi-cyan/10"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={cn('w-2 h-2 rounded-full', option.color)}
                                    />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Industry */}
                        <div className="space-y-2">
                          <Label className="text-white/60 text-xs">Industry</Label>
                          <Input
                            value={company.industry || ''}
                            onChange={(e) =>
                              updateCompany(company.id, { industry: e.target.value })
                            }
                            placeholder="e.g., Real Estate, Tech"
                            className="bg-mi-navy-light border-mi-cyan/20 text-white placeholder:text-white/30 h-9 text-sm"
                          />
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                          <Label className="text-white/60 text-xs flex items-center gap-1">
                            <Globe className="h-3 w-3" /> Website
                          </Label>
                          <Input
                            value={company.website || ''}
                            onChange={(e) =>
                              updateCompany(company.id, { website: e.target.value })
                            }
                            placeholder="https://..."
                            className="bg-mi-navy-light border-mi-cyan/20 text-white placeholder:text-white/30 h-9 text-sm"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="mt-3 space-y-2">
                        <Label className="text-white/60 text-xs">Notes</Label>
                        <Input
                          value={company.notes || ''}
                          onChange={(e) =>
                            updateCompany(company.id, { notes: e.target.value })
                          }
                          placeholder="Any context MIO should know..."
                          className="bg-mi-navy-light border-mi-cyan/20 text-white placeholder:text-white/30 h-9 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* V.I.S.I.O.N. Blueprint */}
        <TabsContent value="vision" className="mt-0 focus-visible:outline-none">
          <VisionBlueprintSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BusinessSection;
