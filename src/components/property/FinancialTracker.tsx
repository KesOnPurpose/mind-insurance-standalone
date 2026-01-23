// ============================================================================
// FINANCIAL TRACKER COMPONENT
// ============================================================================
// Tracks projected vs actual financials for a property with month-over-month
// comparison, trend analysis, and variance indicators.
// ============================================================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit2,
  Save,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  BarChart3,
  Home,
  Zap,
  Droplet,
  Flame,
  Wifi,
  Shield,
  UtensilsCrossed,
  Package,
  Wrench,
  Settings,
  Users,
  MoreHorizontal,
  Plus,
  X,
} from 'lucide-react';
import type { PropertyFinancial, CustomExpense } from '@/types/property';

// ============================================================================
// TYPES
// ============================================================================

export interface FinancialTrackerProps {
  propertyId: string;
  financials: PropertyFinancial[];
  projectedRevenue: number;
  projectedExpenses: {
    rent: number;
    utilities: number;
    insurance: number;
    food: number;
    staffing?: number;
    maintenance: number;
    misc: number;
  };
  onSaveFinancials: (data: Omit<PropertyFinancial, 'id' | 'property_id' | 'created_at'>) => Promise<void>;
  onUpdateFinancials: (id: string, data: Partial<PropertyFinancial>) => Promise<void>;
  isLoading?: boolean;
  isReadOnly?: boolean;
  className?: string;
}

interface MonthlyData {
  monthYear: string;
  label: string;
  projected: {
    revenue: number;
    expenses: number;
    profit: number;
  };
  actual?: {
    revenue: number;
    expenses: number;
    profit: number;
  };
  variance?: {
    revenue: number;
    expenses: number;
    profit: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Grouped expense categories with icons
const EXPENSE_CATEGORY_GROUPS = {
  housing: {
    label: 'Housing',
    icon: Home,
    categories: [
      { key: 'actual_rent', label: 'Rent/Mortgage', projected: 'rent', icon: Home },
    ],
  },
  utilities: {
    label: 'Utilities',
    icon: Zap,
    categories: [
      { key: 'actual_utilities', label: 'Electric', projected: 'utilities', icon: Zap },
      { key: 'actual_water', label: 'Water', projected: 'water', icon: Droplet },
      { key: 'actual_gas', label: 'Gas', projected: 'gas', icon: Flame },
      { key: 'actual_internet', label: 'Internet', projected: 'internet', icon: Wifi },
    ],
  },
  operations: {
    label: 'Operations',
    icon: Settings,
    categories: [
      { key: 'actual_insurance', label: 'Insurance', projected: 'insurance', icon: Shield },
      { key: 'actual_food', label: 'Food/Groceries', projected: 'food', icon: UtensilsCrossed },
      { key: 'actual_supplies', label: 'Supplies', projected: 'supplies', icon: Package },
      { key: 'actual_repairs', label: 'Repairs', projected: 'repairs', icon: Wrench },
      { key: 'actual_maintenance', label: 'Maintenance', projected: 'maintenance', icon: Settings },
      { key: 'actual_staffing', label: 'Staffing', projected: 'staffing', icon: Users },
    ],
  },
  other: {
    label: 'Other',
    icon: MoreHorizontal,
    categories: [
      { key: 'actual_misc', label: 'Other/Misc', projected: 'misc', icon: MoreHorizontal },
    ],
  },
} as const;

// Flat list of all expense categories for backward compatibility
const ALL_EXPENSE_CATEGORIES = Object.values(EXPENSE_CATEGORY_GROUPS).flatMap(
  (group) => group.categories
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(amount: number | undefined): string {
  if (amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(0)}%`;
}

function getMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FinancialTracker({
  propertyId,
  financials,
  projectedRevenue,
  projectedExpenses,
  onSaveFinancials,
  onUpdateFinancials,
  isLoading = false,
  isReadOnly = false,
  className = '',
}: FinancialTrackerProps) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    actual_revenue: 0,
    // Housing
    actual_rent: 0,
    // Utilities (expanded)
    actual_utilities: 0,  // Electric
    actual_water: 0,
    actual_gas: 0,
    actual_internet: 0,
    // Operations
    actual_insurance: 0,
    actual_food: 0,
    actual_supplies: 0,
    actual_repairs: 0,
    actual_maintenance: 0,
    actual_staffing: 0,
    // Other
    actual_misc: 0,
    notes: '',
  });

  // Custom expenses state
  const [customExpenses, setCustomExpenses] = useState<CustomExpense[]>([]);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomAmount, setNewCustomAmount] = useState(0);

  // Calculate projected expenses total
  const projectedExpensesTotal = useMemo(() => {
    return Object.values(projectedExpenses).reduce((sum, val) => sum + (val || 0), 0);
  }, [projectedExpenses]);

  // Calculate projected profit
  const projectedProfit = projectedRevenue - projectedExpensesTotal;

  // Build monthly data with projections and actuals
  const monthlyData = useMemo((): MonthlyData[] => {
    const months = getLastNMonths(6);
    return months.map((monthYear) => {
      const actual = financials.find((f) => f.month_year === monthYear);
      const data: MonthlyData = {
        monthYear,
        label: getMonthLabel(monthYear),
        projected: {
          revenue: projectedRevenue,
          expenses: projectedExpensesTotal,
          profit: projectedProfit,
        },
      };

      if (actual) {
        // Calculate base expenses from all categories
        const baseExpenses =
          (actual.actual_rent || 0) +
          (actual.actual_utilities || 0) +
          ((actual as Record<string, unknown>).actual_water as number || 0) +
          ((actual as Record<string, unknown>).actual_gas as number || 0) +
          ((actual as Record<string, unknown>).actual_internet as number || 0) +
          (actual.actual_insurance || 0) +
          (actual.actual_food || 0) +
          ((actual as Record<string, unknown>).actual_supplies as number || 0) +
          ((actual as Record<string, unknown>).actual_repairs as number || 0) +
          (actual.actual_maintenance || 0) +
          (actual.actual_staffing || 0) +
          (actual.actual_misc || 0);

        // Add custom expenses total
        const customTotal = (actual.custom_expenses || []).reduce(
          (sum, exp) => sum + (exp.amount || 0),
          0
        );
        const actualExpenses = baseExpenses + customTotal;
        const actualProfit = (actual.actual_revenue || 0) - actualExpenses;

        data.actual = {
          revenue: actual.actual_revenue || 0,
          expenses: actualExpenses,
          profit: actualProfit,
        };

        data.variance = {
          revenue:
            projectedRevenue > 0
              ? (((actual.actual_revenue || 0) - projectedRevenue) /
                  projectedRevenue) *
                100
              : 0,
          expenses:
            projectedExpensesTotal > 0
              ? ((actualExpenses - projectedExpensesTotal) /
                  projectedExpensesTotal) *
                100
              : 0,
          profit:
            projectedProfit !== 0
              ? ((actualProfit - projectedProfit) / Math.abs(projectedProfit)) *
                100
              : 0,
        };
      }

      return data;
    });
  }, [financials, projectedRevenue, projectedExpensesTotal, projectedProfit]);

  // Get selected month data
  const selectedMonthData = useMemo(() => {
    return monthlyData.find((m) => m.monthYear === selectedMonth);
  }, [monthlyData, selectedMonth]);

  // Get existing financial record for selected month
  const existingRecord = useMemo(() => {
    return financials.find((f) => f.month_year === selectedMonth);
  }, [financials, selectedMonth]);

  // Open add/edit dialog
  const handleOpenDialog = (monthYear?: string) => {
    const month = monthYear || selectedMonth;
    const existing = financials.find((f) => f.month_year === month);
    const existingAny = existing as Record<string, unknown> | undefined;

    if (existing) {
      setFormData({
        actual_revenue: existing.actual_revenue || 0,
        // Housing
        actual_rent: existing.actual_rent || 0,
        // Utilities
        actual_utilities: existing.actual_utilities || 0,
        actual_water: (existingAny?.actual_water as number) || 0,
        actual_gas: (existingAny?.actual_gas as number) || 0,
        actual_internet: (existingAny?.actual_internet as number) || 0,
        // Operations
        actual_insurance: existing.actual_insurance || 0,
        actual_food: existing.actual_food || 0,
        actual_supplies: (existingAny?.actual_supplies as number) || 0,
        actual_repairs: (existingAny?.actual_repairs as number) || 0,
        actual_maintenance: existing.actual_maintenance || 0,
        actual_staffing: existing.actual_staffing || 0,
        // Other
        actual_misc: existing.actual_misc || 0,
        notes: existing.notes || '',
      });
      setCustomExpenses(existing.custom_expenses || []);
      setEditingMonth(month);
    } else {
      setFormData({
        actual_revenue: projectedRevenue,
        // Housing
        actual_rent: projectedExpenses.rent,
        // Utilities
        actual_utilities: projectedExpenses.utilities,
        actual_water: 0,
        actual_gas: 0,
        actual_internet: 0,
        // Operations
        actual_insurance: projectedExpenses.insurance,
        actual_food: projectedExpenses.food,
        actual_supplies: 0,
        actual_repairs: 0,
        actual_maintenance: projectedExpenses.maintenance,
        actual_staffing: projectedExpenses.staffing || 0,
        // Other
        actual_misc: projectedExpenses.misc,
        notes: '',
      });
      setCustomExpenses([]);
      setEditingMonth(null);
    }

    // Reset custom expense form
    setNewCustomName('');
    setNewCustomAmount(0);

    setSelectedMonth(month);
    setShowAddDialog(true);
  };

  // Save financials
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        custom_expenses: customExpenses,
      };

      if (editingMonth && existingRecord) {
        await onUpdateFinancials(existingRecord.id, dataToSave);
      } else {
        await onSaveFinancials({
          month_year: selectedMonth,
          ...dataToSave,
        });
      }
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to save financials:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Add a custom expense
  const handleAddCustomExpense = () => {
    if (newCustomName.trim() && newCustomAmount > 0) {
      setCustomExpenses([
        ...customExpenses,
        { name: newCustomName.trim(), amount: newCustomAmount },
      ]);
      setNewCustomName('');
      setNewCustomAmount(0);
    }
  };

  // Remove a custom expense
  const handleRemoveCustomExpense = (index: number) => {
    setCustomExpenses(customExpenses.filter((_, i) => i !== index));
  };

  // Calculate total expenses including custom
  const calculateTotalExpenses = () => {
    const baseTotal =
      formData.actual_rent +
      formData.actual_utilities +
      formData.actual_water +
      formData.actual_gas +
      formData.actual_internet +
      formData.actual_insurance +
      formData.actual_food +
      formData.actual_supplies +
      formData.actual_repairs +
      formData.actual_maintenance +
      formData.actual_staffing +
      formData.actual_misc;

    const customTotal = customExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    return baseTotal + customTotal;
  };

  // Render variance indicator
  const renderVariance = (value: number | undefined, isExpense = false) => {
    if (value === undefined) return null;

    // For expenses, negative variance (under budget) is good
    const isGood = isExpense ? value < 0 : value > 0;
    const isBad = isExpense ? value > 5 : value < -5;

    if (Math.abs(value) < 1) {
      return (
        <Badge variant="secondary" className="ml-2">
          <Minus className="h-3 w-3 mr-1" />
          On track
        </Badge>
      );
    }

    return (
      <Badge
        variant={isBad ? 'destructive' : 'secondary'}
        className={`ml-2 ${
          isGood && !isBad
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : ''
        }`}
      >
        {value > 0 ? (
          <TrendingUp className="h-3 w-3 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 mr-1" />
        )}
        {formatPercentage(value)}
      </Badge>
    );
  };

  return (
    <div className={className}>
      {/* Header */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Financial Tracker
            </CardTitle>

            <div className="flex items-center gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getLastNMonths(12).map((month) => (
                    <SelectItem key={month} value={month}>
                      {getMonthLabel(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!isReadOnly && (
                <Button size="sm" onClick={() => handleOpenDialog()}>
                  {existingRecord ? (
                    <>
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add Actuals
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Revenue</p>
              <p className="text-xl font-bold">
                {selectedMonthData?.actual
                  ? formatCurrency(selectedMonthData.actual.revenue)
                  : formatCurrency(projectedRevenue)}
              </p>
              {selectedMonthData?.variance &&
                renderVariance(selectedMonthData.variance.revenue)}
              {!selectedMonthData?.actual && (
                <Badge variant="outline" className="mt-1">
                  Projected
                </Badge>
              )}
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Expenses</p>
              <p className="text-xl font-bold">
                {selectedMonthData?.actual
                  ? formatCurrency(selectedMonthData.actual.expenses)
                  : formatCurrency(projectedExpensesTotal)}
              </p>
              {selectedMonthData?.variance &&
                renderVariance(selectedMonthData.variance.expenses, true)}
              {!selectedMonthData?.actual && (
                <Badge variant="outline" className="mt-1">
                  Projected
                </Badge>
              )}
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
              <p
                className={`text-xl font-bold ${
                  (selectedMonthData?.actual?.profit ?? projectedProfit) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {selectedMonthData?.actual
                  ? formatCurrency(selectedMonthData.actual.profit)
                  : formatCurrency(projectedProfit)}
              </p>
              {selectedMonthData?.variance &&
                renderVariance(selectedMonthData.variance.profit)}
              {!selectedMonthData?.actual && (
                <Badge variant="outline" className="mt-1">
                  Projected
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {getMonthLabel(selectedMonth)} Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Revenue Row */}
            <div className="flex items-center justify-between py-2 border-b">
              <span className="font-medium text-green-600">Revenue</span>
              <div className="text-right">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground text-sm">
                    Projected: {formatCurrency(projectedRevenue)}
                  </span>
                  <span className="font-medium">
                    Actual:{' '}
                    {selectedMonthData?.actual
                      ? formatCurrency(selectedMonthData.actual.revenue)
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Expense Rows by Group */}
            {Object.entries(EXPENSE_CATEGORY_GROUPS).map(([groupKey, group]) => (
              <div key={groupKey} className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">
                  <group.icon className="h-3 w-3" />
                  {group.label}
                </div>
                {group.categories.map((category) => {
                  const projectedValue =
                    projectedExpenses[
                      category.projected as keyof typeof projectedExpenses
                    ] || 0;
                  const existingAny = existingRecord as Record<string, unknown> | undefined;
                  const actualValue = existingRecord
                    ? (existingAny?.[category.key] as number) || 0
                    : undefined;

                  return (
                    <div
                      key={category.key}
                      className="flex items-center justify-between py-1.5 pl-5 border-b last:border-0"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <category.icon className="h-3.5 w-3.5" />
                        <span className="text-sm">{category.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground text-xs">
                            {formatCurrency(projectedValue)}
                          </span>
                          <span
                            className={`font-medium text-sm ${
                              actualValue !== undefined &&
                              actualValue > projectedValue * 1.1
                                ? 'text-red-600'
                                : ''
                            }`}
                          >
                            {actualValue !== undefined
                              ? formatCurrency(actualValue)
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Custom Expenses Display */}
            {existingRecord?.custom_expenses && existingRecord.custom_expenses.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">
                  <Plus className="h-3 w-3" />
                  Custom Expenses
                </div>
                {existingRecord.custom_expenses.map((expense, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 pl-5 border-b last:border-0"
                  >
                    <span className="text-muted-foreground text-sm">{expense.name}</span>
                    <span className="font-medium text-sm">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="flex items-center justify-between py-3 bg-muted/50 rounded-lg px-3 mt-4">
              <span className="font-semibold">Net Profit</span>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {formatCurrency(projectedProfit)}
                </span>
                <span
                  className={`font-bold ${
                    (selectedMonthData?.actual?.profit ?? 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {selectedMonthData?.actual
                    ? formatCurrency(selectedMonthData.actual.profit)
                    : '-'}
                </span>
              </div>
            </div>

            {/* Notes */}
            {existingRecord?.notes && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Notes:</p>
                <p className="text-sm mt-1">{existingRecord.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMonth ? 'Edit' : 'Add'} Actuals for{' '}
              {getMonthLabel(selectedMonth)}
            </DialogTitle>
            <DialogDescription>
              Enter actual financial data for this month.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-green-600">Revenue ($)</Label>
              <Input
                type="number"
                value={formData.actual_revenue}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    actual_revenue: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Projected: {formatCurrency(projectedRevenue)}
              </p>
            </div>

            <div className="border-t pt-4 space-y-4">
              <Label className="text-muted-foreground mb-3 block">
                Expenses
              </Label>

              {/* Grouped expense categories */}
              {Object.entries(EXPENSE_CATEGORY_GROUPS).map(([groupKey, group]) => (
                <div key={groupKey} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <group.icon className="h-4 w-4" />
                    {group.label}
                  </div>
                  <div className="grid gap-2 pl-6">
                    {group.categories.map((category) => (
                      <div
                        key={category.key}
                        className="grid grid-cols-2 gap-2 items-center"
                      >
                        <div className="flex items-center gap-2">
                          <category.icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <Label className="text-sm">{category.label}</Label>
                        </div>
                        <Input
                          type="number"
                          value={
                            formData[category.key as keyof typeof formData] as number
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [category.key]: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Custom Expenses Section */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Plus className="h-4 w-4" />
                  Custom Expenses
                </div>

                {/* Existing custom expenses */}
                {customExpenses.length > 0 && (
                  <div className="space-y-2 pl-6">
                    {customExpenses.map((expense, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-sm flex-1">{expense.name}</span>
                        <span className="text-sm font-medium w-24 text-right">
                          {formatCurrency(expense.amount)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                          onClick={() => handleRemoveCustomExpense(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new custom expense */}
                <div className="grid grid-cols-[1fr,100px,auto] gap-2 pl-6 items-center">
                  <Input
                    placeholder="Expense name"
                    value={newCustomName}
                    onChange={(e) => setNewCustomName(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={newCustomAmount || ''}
                    onChange={(e) => setNewCustomAmount(parseInt(e.target.value) || 0)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomExpense}
                    disabled={!newCustomName.trim() || newCustomAmount <= 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label>Notes (optional)</Label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any notes about this month..."
              />
            </div>

            {/* Calculated Totals */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Expenses:</span>
                <span className="font-medium">
                  {formatCurrency(calculateTotalExpenses())}
                </span>
              </div>
              {customExpenses.length > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>({customExpenses.length} custom expense{customExpenses.length !== 1 ? 's' : ''})</span>
                  <span>
                    {formatCurrency(
                      customExpenses.reduce((sum, exp) => sum + exp.amount, 0)
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold">
                <span>Net Profit:</span>
                <span
                  className={
                    formData.actual_revenue - calculateTotalExpenses() >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {formatCurrency(formData.actual_revenue - calculateTotalExpenses())}
                </span>
              </div>
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
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FinancialTracker;
