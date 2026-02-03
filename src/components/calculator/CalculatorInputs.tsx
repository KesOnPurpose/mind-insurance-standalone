import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Bed,
  DollarSign,
  Percent,
  Home,
  Zap,
  Users,
  Shield,
  Utensils,
  MoreHorizontal,
  Wrench,
  FileText,
  Paintbrush,
  Armchair,
  Megaphone,
  PiggyBank,
} from 'lucide-react';
import {
  CalculatorInputs as CalculatorInputsType,
  CalculatorMode,
  StartupCosts,
  CALCULATOR_CONSTANTS,
} from '@/types/calculator';

interface CalculatorInputsProps {
  inputs: CalculatorInputsType;
  mode: CalculatorMode;
  onChange: (inputs: CalculatorInputsType) => void;
}

export function CalculatorInputs({ inputs, mode, onChange }: CalculatorInputsProps) {
  const updateField = <K extends keyof CalculatorInputsType>(
    field: K,
    value: CalculatorInputsType[K]
  ) => {
    onChange({ ...inputs, [field]: value });
  };

  const updateStartupCost = <K extends keyof StartupCosts>(
    field: K,
    value: number
  ) => {
    const currentStartup = inputs.startupCosts || {
      licensingCosts: 2500,
      renovationCosts: 15000,
      furnitureCosts: 5000,
      marketingCosts: 1000,
      reserveFund: 10000,
    };
    onChange({
      ...inputs,
      startupCosts: { ...currentStartup, [field]: value },
    });
  };

  const parseNumber = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Calculator Inputs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <Accordion
          type="multiple"
          defaultValue={['property', 'expenses']}
          className="space-y-2"
        >
          {/* Property Details Section */}
          <AccordionItem value="property" className="border rounded-lg px-3">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Property Details</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-4">
                {/* Bed Count */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bedCount" className="text-sm">
                      Number of Beds
                    </Label>
                    <span className="text-sm font-medium">{inputs.bedCount}</span>
                  </div>
                  <Slider
                    id="bedCount"
                    min={1}
                    max={20}
                    step={1}
                    value={[inputs.bedCount]}
                    onValueChange={([value]) => updateField('bedCount', value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Typical range: 4-16 beds
                  </p>
                </div>

                {/* Rate Per Bed */}
                <div className="space-y-2">
                  <Label htmlFor="ratePerBed" className="text-sm">
                    Rate Per Bed (Monthly)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="ratePerBed"
                      type="number"
                      min={0}
                      value={inputs.ratePerBed}
                      onChange={(e) => updateField('ratePerBed', parseNumber(e.target.value))}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    SSI Max: ${CALCULATOR_CONSTANTS.SSI_MAX_RENT}/month
                  </p>
                </div>

                {/* Occupancy Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="occupancyRate" className="text-sm">
                      Target Occupancy
                    </Label>
                    <span className="text-sm font-medium">{inputs.occupancyRate}%</span>
                  </div>
                  <Slider
                    id="occupancyRate"
                    min={50}
                    max={100}
                    step={5}
                    value={[inputs.occupancyRate]}
                    onValueChange={([value]) => updateField('occupancyRate', value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Industry average: 85-90%
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Monthly Expenses Section */}
          <AccordionItem value="expenses" className="border rounded-lg px-3">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-orange-600" />
                <span className="font-medium">Monthly Expenses</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Monthly Rent */}
                <div className="space-y-1">
                  <Label htmlFor="monthlyRent" className="text-xs flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    Rent/Mortgage
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      id="monthlyRent"
                      type="number"
                      value={inputs.monthlyRent}
                      onChange={(e) => updateField('monthlyRent', parseNumber(e.target.value))}
                      className="pl-6 h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Utilities */}
                <div className="space-y-1">
                  <Label htmlFor="monthlyUtilities" className="text-xs flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Utilities
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      id="monthlyUtilities"
                      type="number"
                      value={inputs.monthlyUtilities}
                      onChange={(e) => updateField('monthlyUtilities', parseNumber(e.target.value))}
                      className="pl-6 h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Staffing */}
                <div className="space-y-1">
                  <Label htmlFor="staffingCosts" className="text-xs flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Staffing
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      id="staffingCosts"
                      type="number"
                      value={inputs.staffingCosts}
                      onChange={(e) => updateField('staffingCosts', parseNumber(e.target.value))}
                      className="pl-6 h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Insurance */}
                <div className="space-y-1">
                  <Label htmlFor="insuranceCost" className="text-xs flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Insurance
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      id="insuranceCost"
                      type="number"
                      value={inputs.insuranceCost}
                      onChange={(e) => updateField('insuranceCost', parseNumber(e.target.value))}
                      className="pl-6 h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Food */}
                <div className="space-y-1">
                  <Label htmlFor="foodCost" className="text-xs flex items-center gap-1">
                    <Utensils className="w-3 h-3" />
                    Food
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      id="foodCost"
                      type="number"
                      value={inputs.foodCost}
                      onChange={(e) => updateField('foodCost', parseNumber(e.target.value))}
                      className="pl-6 h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Misc */}
                <div className="space-y-1">
                  <Label htmlFor="miscExpenses" className="text-xs flex items-center gap-1">
                    <MoreHorizontal className="w-3 h-3" />
                    Other
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      id="miscExpenses"
                      type="number"
                      value={inputs.miscExpenses}
                      onChange={(e) => updateField('miscExpenses', parseNumber(e.target.value))}
                      className="pl-6 h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Maintenance Reserve */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenanceReserve" className="text-sm flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    Maintenance Reserve
                  </Label>
                  <span className="text-sm font-medium">{inputs.maintenanceReservePercent}%</span>
                </div>
                <Slider
                  id="maintenanceReserve"
                  min={5}
                  max={25}
                  step={1}
                  value={[inputs.maintenanceReservePercent]}
                  onValueChange={([value]) => updateField('maintenanceReservePercent', value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Industry standard: 15-20% of revenue
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Startup Costs Section (Advanced Mode Only) */}
          {mode === 'advanced' && (
            <AccordionItem value="startup" className="border rounded-lg px-3">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Startup Costs</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Licensing */}
                  <div className="space-y-1">
                    <Label htmlFor="licensingCosts" className="text-xs flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Licensing
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        id="licensingCosts"
                        type="number"
                        value={inputs.startupCosts?.licensingCosts ?? 2500}
                        onChange={(e) => updateStartupCost('licensingCosts', parseNumber(e.target.value))}
                        className="pl-6 h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Renovation */}
                  <div className="space-y-1">
                    <Label htmlFor="renovationCosts" className="text-xs flex items-center gap-1">
                      <Paintbrush className="w-3 h-3" />
                      Renovation
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        id="renovationCosts"
                        type="number"
                        value={inputs.startupCosts?.renovationCosts ?? 15000}
                        onChange={(e) => updateStartupCost('renovationCosts', parseNumber(e.target.value))}
                        className="pl-6 h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Furniture */}
                  <div className="space-y-1">
                    <Label htmlFor="furnitureCosts" className="text-xs flex items-center gap-1">
                      <Armchair className="w-3 h-3" />
                      Furniture
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        id="furnitureCosts"
                        type="number"
                        value={inputs.startupCosts?.furnitureCosts ?? 5000}
                        onChange={(e) => updateStartupCost('furnitureCosts', parseNumber(e.target.value))}
                        className="pl-6 h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Marketing */}
                  <div className="space-y-1">
                    <Label htmlFor="marketingCosts" className="text-xs flex items-center gap-1">
                      <Megaphone className="w-3 h-3" />
                      Marketing
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        id="marketingCosts"
                        type="number"
                        value={inputs.startupCosts?.marketingCosts ?? 1000}
                        onChange={(e) => updateStartupCost('marketingCosts', parseNumber(e.target.value))}
                        className="pl-6 h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Reserve Fund */}
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="reserveFund" className="text-xs flex items-center gap-1">
                      <PiggyBank className="w-3 h-3" />
                      Reserve Fund (3-6 months expenses)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        id="reserveFund"
                        type="number"
                        value={inputs.startupCosts?.reserveFund ?? 1}
                        onChange={(e) => updateStartupCost('reserveFund', parseNumber(e.target.value))}
                        className="pl-6 h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}

export default CalculatorInputs;
