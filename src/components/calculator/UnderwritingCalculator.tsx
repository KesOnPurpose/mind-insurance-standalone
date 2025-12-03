import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, RefreshCw, Download } from 'lucide-react';
import { CalculatorInputs } from './CalculatorInputs';
import { CalculatorOutputSimple } from './CalculatorOutputSimple';
import { CalculatorOutputModerate } from './CalculatorOutputModerate';
import { CalculatorOutputAdvanced } from './CalculatorOutputAdvanced';
import {
  CalculatorInputs as CalculatorInputsType,
  CalculatorMode,
  DEFAULT_INPUTS,
  DEFAULT_STARTUP_COSTS,
} from '@/types/calculator';
import {
  calculateSimpleOutput,
  calculateModerateOutput,
  calculateAdvancedOutput,
  calculateRiskAssessment,
} from '@/services/underwritingCalculatorService';
import { useCalculatorDefaults } from '@/hooks/useCalculatorDefaults';

export function UnderwritingCalculator() {
  const { defaultInputs, isLoading: isLoadingDefaults } = useCalculatorDefaults();
  const [mode, setMode] = useState<CalculatorMode>('simple');
  const [inputs, setInputs] = useState<CalculatorInputsType>(() => ({
    ...DEFAULT_INPUTS,
    startupCosts: DEFAULT_STARTUP_COSTS,
  }));

  // Update inputs when defaults load
  useMemo(() => {
    if (defaultInputs && !isLoadingDefaults) {
      setInputs(prev => ({
        ...prev,
        ...defaultInputs,
        startupCosts: defaultInputs.startupCosts || prev.startupCosts,
      }));
    }
  }, [defaultInputs, isLoadingDefaults]);

  // Ensure startupCosts are always initialized when switching to advanced mode
  useEffect(() => {
    if (mode === 'advanced') {
      setInputs(prev => ({
        ...prev,
        startupCosts: {
          ...DEFAULT_STARTUP_COSTS,
          ...prev.startupCosts,
        },
      }));
    }
  }, [mode]);

  // Calculate outputs based on mode
  const outputs = useMemo(() => {
    const simpleOutput = calculateSimpleOutput(inputs);
    const riskAssessment = calculateRiskAssessment(inputs, simpleOutput);

    if (mode === 'simple') {
      return { simpleOutput, riskAssessment };
    }

    if (mode === 'moderate') {
      const moderateOutput = calculateModerateOutput(inputs);
      return { simpleOutput, moderateOutput, riskAssessment };
    }

    // Advanced mode
    const advancedOutput = calculateAdvancedOutput(inputs);
    return { simpleOutput, advancedOutput, riskAssessment };
  }, [inputs, mode]);

  const handleReset = () => {
    setInputs({
      ...DEFAULT_INPUTS,
      ...(defaultInputs || {}),
      startupCosts: defaultInputs?.startupCosts || DEFAULT_STARTUP_COSTS,
    });
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Export PDF', outputs);
    alert('PDF export coming soon!');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Group Home Calculator</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Analyze your group home's financial viability
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
              {mode === 'advanced' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  className="gap-1"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export PDF</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={mode} onValueChange={(v) => setMode(v as CalculatorMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="simple">Simple</TabsTrigger>
              <TabsTrigger value="moderate">Moderate</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground mt-2">
            {mode === 'simple' && 'Quick profit/loss calculation with key metrics'}
            {mode === 'moderate' && '12-month cash flow projection with scenarios'}
            {mode === 'advanced' && 'Full analysis with ROI, sensitivity, and PDF export'}
          </p>
        </CardContent>
      </Card>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column - Inputs */}
        <div>
          <CalculatorInputs
            inputs={inputs}
            mode={mode}
            onChange={setInputs}
          />
        </div>

        {/* Right Column - Outputs */}
        <div className="space-y-4">
          {/* Always show simple output */}
          <CalculatorOutputSimple
            output={outputs.simpleOutput}
            riskAssessment={outputs.riskAssessment}
          />

          {/* Show moderate output for moderate and advanced modes */}
          {(mode === 'moderate' || mode === 'advanced') && outputs.moderateOutput && (
            <CalculatorOutputModerate output={outputs.moderateOutput} />
          )}

          {/* Show advanced output for advanced mode only */}
          {mode === 'advanced' && outputs.advancedOutput && (
            <CalculatorOutputAdvanced output={outputs.advancedOutput} />
          )}
        </div>
      </div>
    </div>
  );
}

export default UnderwritingCalculator;
