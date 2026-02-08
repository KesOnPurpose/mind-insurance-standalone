// 12 Week Domination Section (Active Policy)
// Implements 12 Week Year methodology with Mind Insurance branding

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Shield,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  Calendar,
  BarChart3,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';
import type {
  CEOActivePolicy,
  CEOCoverageTarget,
  CEOPremiumPayment,
  QuarterPeriod,
} from '@/types/ceoDashboard';
import {
  DEFAULT_ACTIVE_POLICY,
  createEmptyCoverageTarget,
  createEmptyPremiumPayment,
  calculateCurrentWeek,
  calculateDaysRemaining,
  calculatePolicyHealthScore,
  determineTargetStatus,
} from '@/types/ceoDashboard';

interface DominationSectionProps {
  policy: CEOActivePolicy | null;
  onSave: (policy: CEOActivePolicy) => Promise<void>;
  onUpdatePaymentCount: (targetId: string, paymentId: string, count: number) => Promise<void>;
  isSaving: boolean;
}

export function DominationSection({
  policy,
  onSave,
  onUpdatePaymentCount,
  isSaving,
}: DominationSectionProps) {
  const [localPolicy, setLocalPolicy] = useState<CEOActivePolicy>(
    policy || DEFAULT_ACTIVE_POLICY
  );
  const [expandedTargets, setExpandedTargets] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with props when they change
  useMemo(() => {
    if (policy) {
      setLocalPolicy(policy);
    }
  }, [policy]);

  // Calculate current week and days remaining
  const currentWeek = useMemo(
    () => calculateCurrentWeek(localPolicy.start_date),
    [localPolicy.start_date]
  );
  const daysRemaining = useMemo(
    () => calculateDaysRemaining(localPolicy.end_date),
    [localPolicy.end_date]
  );

  // Calculate policy health score
  const healthScore = useMemo(
    () => calculatePolicyHealthScore(localPolicy.coverage_targets),
    [localPolicy.coverage_targets]
  );

  // Progress percentage (week-based)
  const progressPercentage = Math.round((currentWeek / 12) * 100);

  // Handle policy field updates
  const updatePolicyField = (field: keyof CEOActivePolicy, value: any) => {
    setLocalPolicy((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Handle adding a new coverage target
  const handleAddTarget = () => {
    if (localPolicy.coverage_targets.length >= 3) {
      return;
    }
    const newTarget = createEmptyCoverageTarget(localPolicy.coverage_targets.length + 1);
    setLocalPolicy((prev) => ({
      ...prev,
      coverage_targets: [...prev.coverage_targets, newTarget],
    }));
    setExpandedTargets((prev) => ({ ...prev, [newTarget.id]: true }));
    setHasChanges(true);
    setIsEditing(true);
  };

  // Handle removing a coverage target
  const handleRemoveTarget = (targetId: string) => {
    setLocalPolicy((prev) => ({
      ...prev,
      coverage_targets: prev.coverage_targets
        .filter((t) => t.id !== targetId)
        .map((t, i) => ({ ...t, order: i + 1 })),
    }));
    setHasChanges(true);
  };

  // Handle updating a coverage target
  const updateTarget = (targetId: string, updates: Partial<CEOCoverageTarget>) => {
    setLocalPolicy((prev) => ({
      ...prev,
      coverage_targets: prev.coverage_targets.map((t) =>
        t.id === targetId ? { ...t, ...updates } : t
      ),
    }));
    setHasChanges(true);
  };

  // Handle adding a premium payment to a target
  const handleAddPayment = (targetId: string) => {
    const newPayment = createEmptyPremiumPayment();
    setLocalPolicy((prev) => ({
      ...prev,
      coverage_targets: prev.coverage_targets.map((t) =>
        t.id === targetId
          ? { ...t, premium_payments: [...t.premium_payments, newPayment] }
          : t
      ),
    }));
    setHasChanges(true);
  };

  // Handle removing a premium payment
  const handleRemovePayment = (targetId: string, paymentId: string) => {
    setLocalPolicy((prev) => ({
      ...prev,
      coverage_targets: prev.coverage_targets.map((t) =>
        t.id === targetId
          ? { ...t, premium_payments: t.premium_payments.filter((p) => p.id !== paymentId) }
          : t
      ),
    }));
    setHasChanges(true);
  };

  // Handle updating a premium payment
  const updatePayment = (
    targetId: string,
    paymentId: string,
    updates: Partial<CEOPremiumPayment>
  ) => {
    setLocalPolicy((prev) => ({
      ...prev,
      coverage_targets: prev.coverage_targets.map((t) =>
        t.id === targetId
          ? {
              ...t,
              premium_payments: t.premium_payments.map((p) =>
                p.id === paymentId ? { ...p, ...updates } : p
              ),
            }
          : t
      ),
    }));
    setHasChanges(true);
  };

  // Handle payment checkbox toggle (quick update without full save)
  const handlePaymentToggle = async (
    targetId: string,
    paymentId: string,
    currentCount: number,
    targetCount: number
  ) => {
    const newCount = currentCount >= targetCount ? 0 : currentCount + 1;
    // Optimistic update
    updatePayment(targetId, paymentId, { current_week_count: newCount });
    // Persist to server
    try {
      await onUpdatePaymentCount(targetId, paymentId, newCount);
    } catch (error) {
      // Revert on error
      updatePayment(targetId, paymentId, { current_week_count: currentCount });
    }
  };

  // Handle save
  const handleSave = async () => {
    // Update statuses before saving
    const updatedTargets = localPolicy.coverage_targets.map((t) => ({
      ...t,
      status: determineTargetStatus(t),
    }));

    const updatedPolicy = {
      ...localPolicy,
      coverage_targets: updatedTargets,
      current_week: currentWeek,
    };

    await onSave(updatedPolicy);
    setHasChanges(false);
    setIsEditing(false);
  };

  // Toggle target expansion
  const toggleTargetExpanded = (targetId: string) => {
    setExpandedTargets((prev) => ({ ...prev, [targetId]: !prev[targetId] }));
  };

  // Status badge renderer
  const renderStatusBadge = (status: CEOCoverageTarget['status']) => {
    switch (status) {
      case 'on-track':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            On Track
          </Badge>
        );
      case 'at-risk':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            At Risk
          </Badge>
        );
      case 'behind':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <TrendingDown className="h-3 w-3 mr-1" />
            Behind
          </Badge>
        );
    }
  };

  // Health score indicator
  const getHealthScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Acceptable';
    return 'Needs Attention';
  };

  return (
    <div className="space-y-6">
      {/* Policy Overview Card */}
      <Card className="bg-mi-navy-light border-mi-cyan/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-mi-gold/20 to-mi-gold/5 border border-mi-gold/30">
                <Shield className="h-6 w-6 text-mi-gold" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Active Policy</CardTitle>
                <CardDescription className="text-white/50">
                  {localPolicy.quarter} {localPolicy.year} - 12 Week Term
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge className="bg-mi-gold/20 text-mi-gold border-mi-gold/30">
                  Unsaved Changes
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="border-mi-cyan/30 text-white/70 hover:text-white hover:bg-mi-cyan/10"
              >
                {isEditing ? 'Done Editing' : 'Edit Policy'}
              </Button>
              {hasChanges && (
                <Button
                  size="sm"
                  onClick={handleSave}
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Policy Period Settings (when editing) */}
          {isEditing && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-mi-navy border border-mi-cyan/10">
              <div className="space-y-2">
                <Label className="text-white/70 text-xs">Quarter</Label>
                <select
                  value={localPolicy.quarter}
                  onChange={(e) => updatePolicyField('quarter', e.target.value as QuarterPeriod)}
                  className="w-full h-9 rounded-md border border-mi-cyan/30 bg-mi-navy text-white px-3 text-sm"
                >
                  <option value="Q1">Q1 (Jan-Mar)</option>
                  <option value="Q2">Q2 (Apr-Jun)</option>
                  <option value="Q3">Q3 (Jul-Sep)</option>
                  <option value="Q4">Q4 (Oct-Dec)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-xs">Year</Label>
                <Input
                  type="number"
                  value={localPolicy.year}
                  onChange={(e) => updatePolicyField('year', parseInt(e.target.value))}
                  className="bg-mi-navy border-mi-cyan/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={localPolicy.start_date}
                  onChange={(e) => updatePolicyField('start_date', e.target.value)}
                  className="bg-mi-navy border-mi-cyan/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-xs">End Date</Label>
                <Input
                  type="date"
                  value={localPolicy.end_date}
                  onChange={(e) => updatePolicyField('end_date', e.target.value)}
                  className="bg-mi-navy border-mi-cyan/30 text-white"
                />
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">
                Week {currentWeek} of 12 • {daysRemaining} days remaining
              </span>
              <span className="text-white font-medium">{progressPercentage}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-mi-navy" />
          </div>

          {/* Policy Health Score */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-mi-navy border border-mi-cyan/10">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-mi-cyan" />
              <div>
                <p className="text-sm text-white/70">Policy Health Score</p>
                <p className={cn('text-2xl font-bold', getHealthScoreColor(healthScore.score))}>
                  {healthScore.score}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn('text-sm font-medium', getHealthScoreColor(healthScore.score))}>
                {getHealthScoreLabel(healthScore.score)}
              </p>
              <p className="text-xs text-white/50">
                {healthScore.paid}/{healthScore.due} premiums paid this week
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Targets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-mi-cyan" />
            Coverage Targets
          </h3>
          {isEditing && localPolicy.coverage_targets.length < 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddTarget}
              className="border-mi-cyan/30 text-mi-cyan hover:bg-mi-cyan/10"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Target
            </Button>
          )}
        </div>

        {localPolicy.coverage_targets.length === 0 ? (
          <Card className="bg-mi-navy-light border-mi-cyan/20">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-mi-cyan/30 mb-4" />
              <p className="text-white/60 mb-2">No coverage targets defined</p>
              <p className="text-sm text-white/40 mb-4">
                Add up to 3 goals for this 12-week policy term
              </p>
              <Button
                variant="outline"
                onClick={handleAddTarget}
                className="border-mi-cyan/30 text-mi-cyan hover:bg-mi-cyan/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add First Target
              </Button>
            </CardContent>
          </Card>
        ) : (
          localPolicy.coverage_targets.map((target) => (
            <Card key={target.id} className="bg-mi-navy-light border-mi-cyan/20 overflow-hidden">
              {/* Target Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-mi-cyan/5"
                onClick={() => toggleTargetExpanded(target.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-mi-cyan/20 flex items-center justify-center text-mi-cyan font-bold">
                    {target.order}
                  </div>
                  <div>
                    {isEditing ? (
                      <Input
                        value={target.title}
                        onChange={(e) =>
                          updateTarget(target.id, { title: e.target.value })
                        }
                        placeholder="Coverage target title..."
                        className="bg-mi-navy border-mi-cyan/30 text-white font-medium"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <p className="text-white font-medium">
                        {target.title || 'Untitled Target'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {renderStatusBadge(target.status)}
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTarget(target.id);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {expandedTargets[target.id] ? (
                    <ChevronUp className="h-5 w-5 text-white/50" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-white/50" />
                  )}
                </div>
              </div>

              {/* Target Details (Expanded) */}
              {expandedTargets[target.id] && (
                <CardContent className="pt-0 space-y-4">
                  {/* Description */}
                  {isEditing && (
                    <div className="space-y-2">
                      <Label className="text-white/70 text-xs">Description (optional)</Label>
                      <Input
                        value={target.description || ''}
                        onChange={(e) =>
                          updateTarget(target.id, { description: e.target.value })
                        }
                        placeholder="Brief description of this target..."
                        className="bg-mi-navy border-mi-cyan/30 text-white"
                      />
                    </div>
                  )}

                  {/* Indicators Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Claim Payout (Lag Indicator) */}
                    <div className="p-4 rounded-lg bg-mi-navy border border-mi-cyan/10">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium text-white/70">
                          Claim Payout (Result)
                        </span>
                      </div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={target.claim_payout.name}
                            onChange={(e) =>
                              updateTarget(target.id, {
                                claim_payout: { ...target.claim_payout, name: e.target.value },
                              })
                            }
                            placeholder="e.g., New users"
                            className="bg-mi-navy-light border-mi-cyan/30 text-white text-sm"
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={target.claim_payout.current_value || ''}
                              onChange={(e) =>
                                updateTarget(target.id, {
                                  claim_payout: {
                                    ...target.claim_payout,
                                    current_value: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              placeholder="Current"
                              className="bg-mi-navy-light border-mi-cyan/30 text-white text-sm w-24"
                            />
                            <span className="text-white/50 self-center">/</span>
                            <Input
                              type="number"
                              value={target.claim_payout.target_value || ''}
                              onChange={(e) =>
                                updateTarget(target.id, {
                                  claim_payout: {
                                    ...target.claim_payout,
                                    target_value: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              placeholder="Target"
                              className="bg-mi-navy-light border-mi-cyan/30 text-white text-sm w-24"
                            />
                            <Input
                              value={target.claim_payout.unit}
                              onChange={(e) =>
                                updateTarget(target.id, {
                                  claim_payout: { ...target.claim_payout, unit: e.target.value },
                                })
                              }
                              placeholder="unit"
                              className="bg-mi-navy-light border-mi-cyan/30 text-white text-sm w-20"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-white font-medium">{target.claim_payout.name || '-'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress
                              value={
                                target.claim_payout.target_value > 0
                                  ? (target.claim_payout.current_value /
                                      target.claim_payout.target_value) *
                                    100
                                  : 0
                              }
                              className="h-2 flex-1 bg-mi-navy-light"
                            />
                            <span className="text-sm text-white/70">
                              {target.claim_payout.current_value}/{target.claim_payout.target_value}{' '}
                              {target.claim_payout.unit}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Coverage Activity (Lead Indicator) */}
                    <div className="p-4 rounded-lg bg-mi-navy border border-mi-cyan/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-mi-cyan" />
                        <span className="text-sm font-medium text-white/70">
                          Coverage Activity (Weekly)
                        </span>
                      </div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={target.coverage_activity.name}
                            onChange={(e) =>
                              updateTarget(target.id, {
                                coverage_activity: {
                                  ...target.coverage_activity,
                                  name: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., Outreach calls"
                            className="bg-mi-navy-light border-mi-cyan/30 text-white text-sm"
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={target.coverage_activity.current_week_value || ''}
                              onChange={(e) =>
                                updateTarget(target.id, {
                                  coverage_activity: {
                                    ...target.coverage_activity,
                                    current_week_value: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              placeholder="This week"
                              className="bg-mi-navy-light border-mi-cyan/30 text-white text-sm w-24"
                            />
                            <span className="text-white/50 self-center">/</span>
                            <Input
                              type="number"
                              value={target.coverage_activity.target_per_week || ''}
                              onChange={(e) =>
                                updateTarget(target.id, {
                                  coverage_activity: {
                                    ...target.coverage_activity,
                                    target_per_week: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              placeholder="Target"
                              className="bg-mi-navy-light border-mi-cyan/30 text-white text-sm w-24"
                            />
                            <Input
                              value={target.coverage_activity.unit}
                              onChange={(e) =>
                                updateTarget(target.id, {
                                  coverage_activity: {
                                    ...target.coverage_activity,
                                    unit: e.target.value,
                                  },
                                })
                              }
                              placeholder="unit"
                              className="bg-mi-navy-light border-mi-cyan/30 text-white text-sm w-20"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-white font-medium">
                            {target.coverage_activity.name || '-'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress
                              value={
                                target.coverage_activity.target_per_week > 0
                                  ? (target.coverage_activity.current_week_value /
                                      target.coverage_activity.target_per_week) *
                                    100
                                  : 0
                              }
                              className="h-2 flex-1 bg-mi-navy-light"
                            />
                            <span className="text-sm text-white/70">
                              {target.coverage_activity.current_week_value}/
                              {target.coverage_activity.target_per_week}{' '}
                              {target.coverage_activity.unit}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Premium Payments (Tactics) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/70">
                        Premium Payments (Weekly Actions)
                      </span>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddPayment(target.id)}
                          className="text-mi-cyan hover:text-mi-cyan/80 hover:bg-mi-cyan/10 h-7"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>

                    {target.premium_payments.length === 0 ? (
                      <p className="text-sm text-white/40 italic">
                        No premium payments defined. Add weekly actions to track.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {target.premium_payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-mi-navy border border-mi-cyan/10"
                          >
                            {/* Checkbox for completion */}
                            {!isEditing && (
                              <button
                                onClick={() =>
                                  handlePaymentToggle(
                                    target.id,
                                    payment.id,
                                    payment.current_week_count,
                                    payment.target_count
                                  )
                                }
                                className="flex-shrink-0"
                              >
                                {payment.current_week_count >= payment.target_count ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                                ) : payment.current_week_count > 0 ? (
                                  <div className="relative">
                                    <Circle className="h-5 w-5 text-yellow-400" />
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-yellow-400">
                                      {payment.current_week_count}
                                    </span>
                                  </div>
                                ) : (
                                  <Circle className="h-5 w-5 text-white/30" />
                                )}
                              </button>
                            )}

                            {isEditing ? (
                              <>
                                <Input
                                  value={payment.name}
                                  onChange={(e) =>
                                    updatePayment(target.id, payment.id, { name: e.target.value })
                                  }
                                  placeholder="Payment name..."
                                  className="flex-1 bg-mi-navy-light border-mi-cyan/30 text-white text-sm"
                                />
                                <select
                                  value={payment.frequency}
                                  onChange={(e) =>
                                    updatePayment(target.id, payment.id, {
                                      frequency: e.target.value as CEOPremiumPayment['frequency'],
                                    })
                                  }
                                  className="h-9 rounded-md border border-mi-cyan/30 bg-mi-navy text-white px-2 text-sm"
                                >
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="specific_days">Specific Days</option>
                                </select>
                                <Input
                                  type="number"
                                  value={payment.target_count}
                                  onChange={(e) =>
                                    updatePayment(target.id, payment.id, {
                                      target_count: parseInt(e.target.value) || 1,
                                    })
                                  }
                                  className="w-16 bg-mi-navy-light border-mi-cyan/30 text-white text-sm text-center"
                                  min={1}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemovePayment(target.id, payment.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span
                                  className={cn(
                                    'flex-1 text-sm',
                                    payment.current_week_count >= payment.target_count
                                      ? 'text-white/50 line-through'
                                      : 'text-white'
                                  )}
                                >
                                  {payment.name || 'Unnamed payment'}
                                </span>
                                <span className="text-xs text-white/50">
                                  {payment.current_week_count}/{payment.target_count}{' '}
                                  {payment.frequency === 'daily' ? 'daily' : 'this week'}
                                </span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Policy Health History */}
      {localPolicy.policy_health_history.length > 0 && (
        <Card className="bg-mi-navy-light border-mi-cyan/20">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-mi-cyan" />
              Policy Health History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {localPolicy.policy_health_history
                .slice(-4)
                .reverse()
                .map((score) => (
                  <div
                    key={score.week_number}
                    className="flex items-center gap-4 p-3 rounded-lg bg-mi-navy"
                  >
                    <span className="text-sm text-white/70 w-20">Week {score.week_number}</span>
                    <Progress
                      value={score.score_percentage}
                      className="flex-1 h-2 bg-mi-navy-light"
                    />
                    <span
                      className={cn('text-sm font-medium w-12 text-right', {
                        'text-green-400': score.score_percentage >= 85,
                        'text-yellow-400':
                          score.score_percentage >= 70 && score.score_percentage < 85,
                        'text-red-400': score.score_percentage < 70,
                      })}
                    >
                      {score.score_percentage}%
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DominationSection;
