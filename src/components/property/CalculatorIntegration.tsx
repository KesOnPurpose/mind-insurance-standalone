// ============================================================================
// CALCULATOR INTEGRATION COMPONENT
// ============================================================================
// Links property to existing UnderwritingCalculator with saved scenarios
// Features Nette-inspired scenario templates from curriculum
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Calculator,
  Plus,
  Star,
  Trash2,
  Copy,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Percent,
  Lightbulb,
  BookOpen,
  Users,
  CheckCircle,
} from 'lucide-react';
import type { Property, PropertyCalculatorScenario } from '@/types/property';
import type { CalculatorInputs, SimpleOutput } from '@/types/calculator';
import { calculateSimpleOutput } from '@/services/underwritingCalculatorService';
import { cn } from '@/lib/utils';
import {
  SCENARIO_TEMPLATES,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  getTemplatesByCategory,
  type ScenarioTemplate,
  type ScenarioTemplateCategory,
} from '@/constants/scenarioTemplates';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CalculatorIntegrationProps {
  property: Property;
  scenarios: PropertyCalculatorScenario[];
  onSaveScenario: (scenario: Omit<PropertyCalculatorScenario, 'id' | 'property_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateScenario: (scenarioId: string, data: Partial<PropertyCalculatorScenario>) => Promise<void>;
  onDeleteScenario: (scenarioId: string) => Promise<void>;
  onSetActiveScenario: (scenarioId: string) => Promise<void>;
  onOpenFullCalculator?: () => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
  className?: string;
}

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

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getPropertyDefaultInputs(property: Property): Partial<CalculatorInputs> {
  return {
    bedCount: property.configured_beds || 6,
    ratePerBed: property.default_rate_per_bed || 907,
    occupancyRate: property.target_occupancy_percent || 90,
    monthlyRent: property.monthly_rent_or_mortgage || 2000,
  };
}

// ============================================================================
// SCENARIO CARD COMPONENT
// ============================================================================

interface ScenarioCardProps {
  scenario: PropertyCalculatorScenario;
  onSetActive: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isReadOnly?: boolean;
}

function ScenarioCard({
  scenario,
  onSetActive,
  onDelete,
  onDuplicate,
  isReadOnly,
}: ScenarioCardProps) {
  // Calculate outputs from scenario inputs
  const output: SimpleOutput | null = scenario.calculator_inputs
    ? calculateSimpleOutput(scenario.calculator_inputs)
    : null;

  return (
    <Card className={cn(
      'transition-all',
      scenario.is_active && 'ring-2 ring-primary'
    )}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">{scenario.scenario_name}</span>
            {scenario.is_active && (
              <Badge variant="default" className="text-xs">Active</Badge>
            )}
          </div>
          {!isReadOnly && (
            <div className="flex items-center gap-1">
              {!scenario.is_active && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onSetActive}
                  title="Set as active scenario"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onDuplicate}
                title="Duplicate scenario"
              >
                <Copy className="h-4 w-4" />
              </Button>
              {!scenario.is_active && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      title="Delete scenario"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Scenario</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{scenario.scenario_name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>

        {output ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Monthly Revenue</span>
              <p className="font-medium">{formatCurrency(output.monthlyGrossRevenue)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Monthly Profit</span>
              <p className={cn(
                'font-medium',
                output.monthlyNetProfit >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(output.monthlyNetProfit)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Break-Even</span>
              <p className="font-medium">{formatPercent(output.breakEvenOccupancy)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Profit Margin</span>
              <p className="font-medium">{formatPercent(output.profitMargin)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No calculation data available</p>
        )}

        {scenario.notes && (
          <p className="mt-3 text-sm text-muted-foreground border-t pt-3">
            {scenario.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CalculatorIntegration({
  property,
  scenarios,
  onSaveScenario,
  onUpdateScenario,
  onDeleteScenario,
  onSetActiveScenario,
  onOpenFullCalculator,
  isLoading = false,
  isReadOnly = false,
  className,
}: CalculatorIntegrationProps) {
  const [showNewScenarioDialog, setShowNewScenarioDialog] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioNotes, setNewScenarioNotes] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ScenarioTemplate | null>(null);
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<ScenarioTemplateCategory>('income_based');

  // Get the active scenario
  const activeScenario = scenarios.find(s => s.is_active);
  const activeOutput = activeScenario?.calculator_inputs
    ? calculateSimpleOutput(activeScenario.calculator_inputs)
    : null;

  const handleCreateScenario = async () => {
    if (!newScenarioName.trim()) return;

    const defaultInputs = getPropertyDefaultInputs(property);
    const templateInputs = selectedTemplate?.inputs || {};

    // Merge: template inputs override defaults, property values override templates for bed/rent
    const mergedInputs: CalculatorInputs = {
      bedCount: defaultInputs.bedCount || templateInputs.bedCount || 6,
      ratePerBed: templateInputs.ratePerBed || defaultInputs.ratePerBed || 907,
      occupancyRate: templateInputs.occupancyRate || defaultInputs.occupancyRate || 90,
      monthlyRent: defaultInputs.monthlyRent || templateInputs.monthlyRent || 2000,
      monthlyUtilities: templateInputs.monthlyUtilities || 400,
      maintenanceReservePercent: templateInputs.maintenanceReservePercent || 15,
      staffingCosts: templateInputs.staffingCosts || 0,
      insuranceCost: templateInputs.insuranceCost || 200,
      foodCost: templateInputs.foodCost || 600,
      miscExpenses: templateInputs.miscExpenses || 200,
    };

    // Build notes with template context if applicable
    let finalNotes = newScenarioNotes.trim();
    if (selectedTemplate && !finalNotes) {
      finalNotes = `Based on: ${selectedTemplate.name}`;
      if (selectedTemplate.netteContext.keyInsight) {
        finalNotes += `\n${selectedTemplate.netteContext.keyInsight}`;
      }
    }

    await onSaveScenario({
      scenario_name: newScenarioName.trim(),
      calculator_inputs: mergedInputs,
      is_active: scenarios.length === 0, // First scenario is active by default
      notes: finalNotes || undefined,
    });

    // Reset dialog state
    setShowNewScenarioDialog(false);
    setNewScenarioName('');
    setNewScenarioNotes('');
    setSelectedTemplate(null);
  };

  const handleSelectTemplate = (template: ScenarioTemplate) => {
    setSelectedTemplate(template);
    // Pre-fill name if empty
    if (!newScenarioName.trim()) {
      setNewScenarioName(template.name);
    }
  };

  const handleClearTemplate = () => {
    setSelectedTemplate(null);
  };

  const handleDuplicateScenario = async (scenario: PropertyCalculatorScenario) => {
    await onSaveScenario({
      scenario_name: `${scenario.scenario_name} (Copy)`,
      calculator_inputs: { ...scenario.calculator_inputs },
      is_active: false,
      notes: scenario.notes,
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Calculator Scenarios</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {onOpenFullCalculator && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenFullCalculator}
                className="gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Full Calculator</span>
              </Button>
            )}
            {!isReadOnly && (
              <Dialog open={showNewScenarioDialog} onOpenChange={(open) => {
                setShowNewScenarioDialog(open);
                if (!open) {
                  setSelectedTemplate(null);
                  setNewScenarioName('');
                  setNewScenarioNotes('');
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Scenario</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Create New Scenario
                    </DialogTitle>
                    <DialogDescription>
                      Start from a template based on Nette's curriculum or create a blank scenario
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    {/* Left: Template Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-medium">Nette's Templates</Label>
                      </div>

                      <Tabs
                        value={activeTemplateCategory}
                        onValueChange={(v) => setActiveTemplateCategory(v as ScenarioTemplateCategory)}
                      >
                        <TabsList className="grid grid-cols-5 h-auto">
                          {CATEGORY_ORDER.map((cat) => (
                            <TabsTrigger
                              key={cat}
                              value={cat}
                              className="text-xs px-2 py-1.5"
                              title={CATEGORY_LABELS[cat]}
                            >
                              {cat === 'income_based' && '💰'}
                              {cat === 'demographic' && '👥'}
                              {cat === 'room_type' && '🚪'}
                              {cat === 'scaling' && '📈'}
                              {cat === 'analysis' && '📊'}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {CATEGORY_ORDER.map((cat) => (
                          <TabsContent key={cat} value={cat} className="mt-2">
                            <p className="text-xs text-muted-foreground mb-2">
                              {CATEGORY_DESCRIPTIONS[cat]}
                            </p>
                            <ScrollArea className="h-[280px] pr-2">
                              <div className="space-y-2">
                                {getTemplatesByCategory(cat).map((template) => (
                                  <Card
                                    key={template.id}
                                    className={cn(
                                      'cursor-pointer transition-all hover:border-primary/50',
                                      selectedTemplate?.id === template.id && 'border-primary ring-2 ring-primary/20'
                                    )}
                                    onClick={() => handleSelectTemplate(template)}
                                  >
                                    <CardContent className="p-3">
                                      <div className="flex items-start gap-2">
                                        <span className="text-lg">{template.icon}</span>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm truncate">{template.name}</p>
                                            {selectedTemplate?.id === template.id && (
                                              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground line-clamp-2">
                                            {template.description}
                                          </p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </ScrollArea>
                          </TabsContent>
                        ))}
                      </Tabs>

                      {selectedTemplate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={handleClearTemplate}
                        >
                          Clear selection (use blank scenario)
                        </Button>
                      )}
                    </div>

                    {/* Right: Configuration */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="scenario-name">Scenario Name *</Label>
                        <Input
                          id="scenario-name"
                          value={newScenarioName}
                          onChange={(e) => setNewScenarioName(e.target.value)}
                          placeholder="e.g., Conservative Estimate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="scenario-notes">Notes (optional)</Label>
                        <Input
                          id="scenario-notes"
                          value={newScenarioNotes}
                          onChange={(e) => setNewScenarioNotes(e.target.value)}
                          placeholder="e.g., Based on initial projections"
                        />
                      </div>

                      {/* Template Context */}
                      {selectedTemplate && (
                        <Card className="bg-amber-50 border-amber-200">
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-amber-600" />
                              <span className="text-sm font-medium text-amber-900">
                                Nette's Insight
                              </span>
                            </div>
                            <p className="text-xs text-amber-800">
                              {selectedTemplate.netteContext.keyInsight}
                            </p>
                            {selectedTemplate.netteContext.lesson && (
                              <p className="text-xs text-amber-600 italic">
                                From: {selectedTemplate.netteContext.lesson}
                              </p>
                            )}
                            {selectedTemplate.netteContext.targetDemographic && (
                              <div className="flex items-center gap-1 text-xs text-amber-700">
                                <Users className="h-3 w-3" />
                                <span>Target: {selectedTemplate.netteContext.targetDemographic}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Values Preview */}
                      <div className="text-sm space-y-2">
                        <p className="text-muted-foreground font-medium">
                          {selectedTemplate ? 'Template values (with property overrides):' : 'Default values from property:'}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-muted/50 p-2 rounded">
                            <span className="text-muted-foreground">Beds:</span>{' '}
                            <span className="font-medium">
                              {property.configured_beds || selectedTemplate?.inputs.bedCount || 6}
                            </span>
                          </div>
                          <div className="bg-muted/50 p-2 rounded">
                            <span className="text-muted-foreground">Rate:</span>{' '}
                            <span className="font-medium">
                              {formatCurrency(selectedTemplate?.inputs.ratePerBed || property.default_rate_per_bed || 907)}/bed
                            </span>
                          </div>
                          <div className="bg-muted/50 p-2 rounded">
                            <span className="text-muted-foreground">Occupancy:</span>{' '}
                            <span className="font-medium">
                              {selectedTemplate?.inputs.occupancyRate || property.target_occupancy_percent || 90}%
                            </span>
                          </div>
                          <div className="bg-muted/50 p-2 rounded">
                            <span className="text-muted-foreground">Rent:</span>{' '}
                            <span className="font-medium">
                              {formatCurrency(property.monthly_rent_or_mortgage || selectedTemplate?.inputs.monthlyRent || 2000)}
                            </span>
                          </div>
                        </div>
                        {selectedTemplate?.suggestedModifications && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <p className="font-medium">Tips:</p>
                            <ul className="list-disc pl-4 mt-1 space-y-0.5">
                              {selectedTemplate.suggestedModifications.slice(0, 2).map((tip, i) => (
                                <li key={i}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewScenarioDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateScenario} disabled={!newScenarioName.trim()}>
                      Create Scenario
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Active Scenario Summary */}
        {activeOutput && (
          <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-primary fill-primary" />
              <span className="font-medium text-sm">
                Active: {activeScenario?.scenario_name || 'Default'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="font-semibold">{formatCurrency(activeOutput.monthlyGrossRevenue)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  activeOutput.monthlyNetProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
                )}>
                  <TrendingUp className={cn(
                    'h-4 w-4',
                    activeOutput.monthlyNetProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  )} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Profit</p>
                  <p className={cn(
                    'font-semibold',
                    activeOutput.monthlyNetProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(activeOutput.monthlyNetProfit)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Percent className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Break-Even</p>
                  <p className="font-semibold">{formatPercent(activeOutput.breakEvenOccupancy)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calculator className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Margin</p>
                  <p className="font-semibold">{formatPercent(activeOutput.profitMargin)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scenarios List */}
        {scenarios.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              All Scenarios ({scenarios.length})
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {scenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  onSetActive={() => onSetActiveScenario(scenario.id)}
                  onDelete={() => onDeleteScenario(scenario.id)}
                  onDuplicate={() => handleDuplicateScenario(scenario)}
                  isReadOnly={isReadOnly}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-2">
              No calculator scenarios yet
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Start with one of Nette's proven templates or create a custom scenario
            </p>
            {!isReadOnly && (
              <Button onClick={() => setShowNewScenarioDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Scenario
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CalculatorIntegration;
