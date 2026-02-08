// ============================================================================
// GOAL TRACKER COMPONENT
// ============================================================================
// Tracks property-level goals including monthly profit targets, occupancy
// targets, and compliance scores. Shows progress and achievement status.
// ============================================================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Target,
  Plus,
  Trophy,
  TrendingUp,
  DollarSign,
  Users,
  Shield,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Star,
  CalendarIcon,
} from 'lucide-react';
import { format, parse, addMonths, addQuarters, startOfQuarter, endOfMonth } from 'date-fns';
import type { PropertyGoal, GoalType } from '@/types/property';

// ============================================================================
// TYPES
// ============================================================================

export interface GoalTrackerProps {
  propertyId: string;
  goals: PropertyGoal[];
  currentMetrics: {
    monthlyProfit: number;
    occupancyRate: number;
    complianceScore: number;
  };
  onAddGoal: (goal: Omit<PropertyGoal, 'id' | 'property_id' | 'created_at' | 'achieved_at'>) => Promise<void>;
  onUpdateGoal: (goalId: string, data: Partial<PropertyGoal>) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onMarkAchieved: (goalId: string) => Promise<void>;
  isLoading?: boolean;
  isReadOnly?: boolean;
  className?: string;
}

interface GoalFormData {
  goal_type: GoalType;
  target_value: number;
  target_period: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GOAL_TYPES: {
  value: GoalType;
  label: string;
  icon: React.ReactNode;
  unit: string;
  color: string;
}[] = [
  {
    value: 'monthly_profit',
    label: 'Monthly Profit',
    icon: <DollarSign className="h-4 w-4" />,
    unit: '$',
    color: 'text-green-600',
  },
  {
    value: 'occupancy',
    label: 'Occupancy Rate',
    icon: <Users className="h-4 w-4" />,
    unit: '%',
    color: 'text-blue-600',
  },
  {
    value: 'compliance_score',
    label: 'Compliance Score',
    icon: <Shield className="h-4 w-4" />,
    unit: '%',
    color: 'text-purple-600',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPeriod(period: string): string {
  if (!period) return 'Ongoing';
  // Year only format: YYYY
  if (period.length === 4) {
    return period;
  }
  // Month format: YYYY-MM
  if (period.length === 7) {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  // Full date format: YYYY-MM-DD
  if (period.length === 10) {
    const date = parse(period, 'yyyy-MM-dd', new Date());
    return format(date, 'MMMM d, yyyy');
  }
  return period;
}

function getCurrentMonthPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getCurrentYearPeriod(): string {
  return String(new Date().getFullYear());
}

function getGoalConfig(type: GoalType) {
  return GOAL_TYPES.find((t) => t.value === type) || GOAL_TYPES[0];
}

function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GoalTracker({
  propertyId,
  goals,
  currentMetrics,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onMarkAchieved,
  isLoading = false,
  isReadOnly = false,
  className = '',
}: GoalTrackerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PropertyGoal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>({
    goal_type: 'monthly_profit',
    target_value: 1500,
    target_period: getCurrentMonthPeriod(),
  });

  // Separate active and achieved goals
  const activeGoals = useMemo(() => {
    return goals.filter((g) => !g.is_achieved);
  }, [goals]);

  const achievedGoals = useMemo(() => {
    return goals.filter((g) => g.is_achieved);
  }, [goals]);

  // Get current value for a goal type
  const getCurrentValue = (type: GoalType): number => {
    switch (type) {
      case 'monthly_profit':
        return currentMetrics.monthlyProfit;
      case 'occupancy':
        return currentMetrics.occupancyRate;
      case 'compliance_score':
        return currentMetrics.complianceScore;
      default:
        return 0;
    }
  };

  // Format value based on goal type
  const formatValue = (type: GoalType, value: number): string => {
    if (type === 'monthly_profit') {
      return formatCurrency(value);
    }
    return `${value}%`;
  };

  // Open add dialog
  const handleOpenAdd = () => {
    setEditingGoal(null);
    setFormData({
      goal_type: 'monthly_profit',
      target_value: 1500,
      target_period: getCurrentMonthPeriod(),
    });
    setShowAddDialog(true);
  };

  // Open edit dialog
  const handleOpenEdit = (goal: PropertyGoal) => {
    setEditingGoal(goal);
    setFormData({
      goal_type: goal.goal_type,
      target_value: goal.target_value,
      target_period: goal.target_period,
    });
    setShowAddDialog(true);
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingGoal) {
        await onUpdateGoal(editingGoal.id, {
          goal_type: formData.goal_type,
          target_value: formData.target_value,
          target_period: formData.target_period,
        });
      } else {
        await onAddGoal({
          goal_type: formData.goal_type,
          target_value: formData.target_value,
          target_period: formData.target_period,
          is_achieved: false,
        });
      }
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to save goal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingGoalId) return;

    try {
      await onDeleteGoal(deletingGoalId);
    } catch (error) {
      console.error('Failed to delete goal:', error);
    } finally {
      setShowDeleteDialog(false);
      setDeletingGoalId(null);
    }
  };

  // Confirm delete
  const confirmDelete = (goalId: string) => {
    setDeletingGoalId(goalId);
    setShowDeleteDialog(true);
  };

  // Render goal card
  const renderGoalCard = (goal: PropertyGoal, showActions = true) => {
    const config = getGoalConfig(goal.goal_type);
    const currentValue = getCurrentValue(goal.goal_type);
    const progress = calculateProgress(currentValue, goal.target_value);
    const isComplete = progress >= 100;

    return (
      <div
        key={goal.id}
        className={`p-4 rounded-lg border ${
          goal.is_achieved
            ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
            : 'bg-muted/30'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={config.color}>{config.icon}</div>
            <div>
              <h4 className="font-medium">{config.label}</h4>
              <p className="text-xs text-muted-foreground">
                {formatPeriod(goal.target_period)}
              </p>
            </div>
          </div>

          {goal.is_achieved ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <Trophy className="h-3 w-3 mr-1" />
              Achieved
            </Badge>
          ) : showActions && !isReadOnly ? (
            <div className="flex items-center gap-1">
              {isComplete && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-green-600"
                  onClick={() => onMarkAchieved(goal.id)}
                  title="Mark as achieved"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => handleOpenEdit(goal)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => confirmDelete(goal.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>

        {!goal.is_achieved && (
          <>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {formatValue(goal.goal_type, currentValue)} /{' '}
                {formatValue(goal.goal_type, goal.target_value)}
              </span>
            </div>

            <Progress
              value={progress}
              className={`h-2 ${isComplete ? '[&>div]:bg-green-500' : ''}`}
            />

            <p className="text-xs text-muted-foreground text-center mt-2">
              {progress}% complete
            </p>
          </>
        )}

        {goal.is_achieved && goal.achieved_at && (
          <p className="text-xs text-muted-foreground mt-2">
            Achieved on{' '}
            {new Date(goal.achieved_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goals
            </CardTitle>

            {!isReadOnly && (
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Set Goal
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading goals...
            </div>
          ) : goals.length === 0 ? (
            <div className="py-8 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Goals Set</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set goals to track your property's performance.
              </p>
              {!isReadOnly && (
                <Button variant="outline" onClick={handleOpenAdd}>
                  <Plus className="h-4 w-4 mr-1" />
                  Set First Goal
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Goals */}
              {activeGoals.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Active Goals ({activeGoals.length})
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeGoals.map((goal) => renderGoalCard(goal))}
                  </div>
                </div>
              )}

              {/* Achieved Goals */}
              {achievedGoals.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Achieved ({achievedGoals.length})
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {achievedGoals.slice(0, 4).map((goal) =>
                      renderGoalCard(goal, false)
                    )}
                  </div>
                  {achievedGoals.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      +{achievedGoals.length - 4} more achieved goals
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Stats */}
          {goals.length > 0 && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium mb-3">Current Performance</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Profit</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(currentMetrics.monthlyProfit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Occupancy</p>
                  <p className="text-lg font-bold text-blue-600">
                    {currentMetrics.occupancyRate}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Compliance</p>
                  <p className="text-lg font-bold text-purple-600">
                    {currentMetrics.complianceScore}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Edit Goal' : 'Set New Goal'}
            </DialogTitle>
            <DialogDescription>
              Define a target to track for this property.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Goal Type</Label>
              <Select
                value={formData.goal_type}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    goal_type: v as GoalType,
                    target_value:
                      v === 'monthly_profit' ? 1500 : v === 'occupancy' ? 90 : 95,
                  })
                }
                disabled={!!editingGoal}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        {type.icon}
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Target Value{' '}
                {formData.goal_type === 'monthly_profit' ? '($)' : '(%)'}
              </Label>
              <Input
                type="number"
                value={formData.target_value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_value: parseInt(e.target.value) || 0,
                  })
                }
                placeholder={
                  formData.goal_type === 'monthly_profit' ? '1500' : '90'
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Target Period</Label>

              {/* Quick Preset Options */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Quick options:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={formData.target_period === getCurrentMonthPeriod() ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, target_period: getCurrentMonthPeriod() })}
                  >
                    This Month
                  </Button>
                  <Button
                    type="button"
                    variant={formData.target_period === format(addMonths(new Date(), 1), 'yyyy-MM') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, target_period: format(addMonths(new Date(), 1), 'yyyy-MM') })}
                  >
                    Next Month
                  </Button>
                  <Button
                    type="button"
                    variant={formData.target_period === format(endOfMonth(addQuarters(startOfQuarter(new Date()), 1)), 'yyyy-MM') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, target_period: format(endOfMonth(addQuarters(startOfQuarter(new Date()), 1)), 'yyyy-MM') })}
                  >
                    End of Quarter
                  </Button>
                  <Button
                    type="button"
                    variant={formData.target_period === getCurrentYearPeriod() ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, target_period: getCurrentYearPeriod() })}
                  >
                    This Year
                  </Button>
                  <Button
                    type="button"
                    variant={formData.target_period === String(new Date().getFullYear() + 1) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, target_period: String(new Date().getFullYear() + 1) })}
                  >
                    Next Year
                  </Button>
                </div>
              </div>

              {/* Calendar Picker */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Or pick a specific date:</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.target_period.length === 10
                        ? formatPeriod(formData.target_period)
                        : 'Select specific date...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.target_period.length === 10
                        ? parse(formData.target_period, 'yyyy-MM-dd', new Date())
                        : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setFormData({ ...formData, target_period: format(date, 'yyyy-MM-dd') });
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Selected Period Display */}
              <div className="p-2 bg-muted/50 rounded text-sm">
                <span className="text-muted-foreground">Selected: </span>
                <span className="font-medium">{formatPeriod(formData.target_period)}</span>
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <span className="text-muted-foreground">Goal: </span>
                <span className="font-medium">
                  Achieve{' '}
                  {formatValue(formData.goal_type, formData.target_value)}{' '}
                  {getGoalConfig(formData.goal_type).label.toLowerCase()} by{' '}
                  {formatPeriod(formData.target_period)}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Current:{' '}
                {formatValue(
                  formData.goal_type,
                  getCurrentValue(formData.goal_type)
                )}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || formData.target_value <= 0}
            >
              {isSaving ? 'Saving...' : editingGoal ? 'Save Changes' : 'Set Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this goal. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default GoalTracker;
