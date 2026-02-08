// ============================================================================
// PORTFOLIO REPORT MODAL COMPONENT
// ============================================================================
// Export options for portfolio reports (monthly, quarterly, annual)
// ============================================================================

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  TrendingUp,
  PieChart,
  BarChart3,
  Shield,
} from 'lucide-react';
import type { Property } from '@/types/property';
import { cn } from '@/lib/utils';

// ============================================================================
// INTERFACES
// ============================================================================

export interface PortfolioReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
  onGenerateReport: (options: ReportOptions) => Promise<void>;
  isLoading?: boolean;
}

export interface ReportOptions {
  reportType: 'monthly' | 'quarterly' | 'annual' | 'property_detail';
  period: string; // '2026-01' for monthly, '2026-Q1' for quarterly, '2026' for annual
  selectedPropertyIds: string[]; // Empty means all properties
  includeSections: {
    summary: boolean;
    financials: boolean;
    occupancy: boolean;
    goals: boolean;
    compliance: boolean;
    diversification: boolean;
    projections: boolean;
  };
  format: 'pdf' | 'excel';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const REPORT_TYPES = [
  {
    id: 'monthly',
    label: 'Monthly Performance',
    description: 'Detailed monthly metrics and trends',
    icon: Calendar,
  },
  {
    id: 'quarterly',
    label: 'Quarterly Summary',
    description: '3-month overview with comparisons',
    icon: BarChart3,
  },
  {
    id: 'annual',
    label: 'Annual Review',
    description: 'Full year performance analysis',
    icon: TrendingUp,
  },
  {
    id: 'property_detail',
    label: 'Property Detail',
    description: 'Deep dive on specific properties',
    icon: Building2,
  },
] as const;

const SECTIONS = [
  { id: 'summary', label: 'Executive Summary', icon: FileText, default: true },
  { id: 'financials', label: 'Financial Analysis', icon: TrendingUp, default: true },
  { id: 'occupancy', label: 'Occupancy Metrics', icon: Building2, default: true },
  { id: 'goals', label: 'Goal Progress', icon: BarChart3, default: false },
  { id: 'compliance', label: 'Compliance Status', icon: Shield, default: false },
  { id: 'diversification', label: 'Risk & Diversification', icon: PieChart, default: false },
  { id: 'projections', label: 'Projections', icon: Calendar, default: false },
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generatePeriodOptions(reportType: string): { value: string; label: string }[] {
  const now = new Date();
  const options: { value: string; label: string }[] = [];

  if (reportType === 'monthly') {
    // Last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
  } else if (reportType === 'quarterly') {
    // Last 8 quarters
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    let year = now.getFullYear();
    let quarter = currentQuarter;

    for (let i = 0; i < 8; i++) {
      const value = `${year}-Q${quarter}`;
      const label = `Q${quarter} ${year}`;
      options.push({ value, label });

      quarter--;
      if (quarter === 0) {
        quarter = 4;
        year--;
      }
    }
  } else if (reportType === 'annual') {
    // Last 5 years
    for (let i = 0; i < 5; i++) {
      const year = now.getFullYear() - i;
      options.push({ value: String(year), label: String(year) });
    }
  }

  return options;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PortfolioReportModal({
  open,
  onOpenChange,
  properties,
  onGenerateReport,
  isLoading = false,
}: PortfolioReportModalProps) {
  const [reportType, setReportType] = useState<ReportOptions['reportType']>('monthly');
  const [period, setPeriod] = useState<string>('');
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [includeSections, setIncludeSections] = useState<ReportOptions['includeSections']>({
    summary: true,
    financials: true,
    occupancy: true,
    goals: false,
    compliance: false,
    diversification: false,
    projections: false,
  });
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');

  const periodOptions = generatePeriodOptions(reportType);

  // Set default period when report type changes
  const handleReportTypeChange = (type: ReportOptions['reportType']) => {
    setReportType(type);
    const newPeriodOptions = generatePeriodOptions(type);
    if (newPeriodOptions.length > 0) {
      setPeriod(newPeriodOptions[0].value);
    }
  };

  const toggleSection = (sectionId: keyof ReportOptions['includeSections']) => {
    setIncludeSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleProperty = (propertyId: string) => {
    if (selectedPropertyIds.includes(propertyId)) {
      setSelectedPropertyIds(prev => prev.filter(id => id !== propertyId));
    } else {
      setSelectedPropertyIds(prev => [...prev, propertyId]);
    }
  };

  const selectAllProperties = () => {
    if (selectedPropertyIds.length === properties.length) {
      setSelectedPropertyIds([]);
    } else {
      setSelectedPropertyIds(properties.map(p => p.id));
    }
  };

  const handleGenerate = async () => {
    await onGenerateReport({
      reportType,
      period: period || periodOptions[0]?.value || '',
      selectedPropertyIds,
      includeSections,
      format,
    });
  };

  const selectedSectionsCount = Object.values(includeSections).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Portfolio Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Type */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Report Type</Label>
            <RadioGroup
              value={reportType}
              onValueChange={(value) => handleReportTypeChange(value as ReportOptions['reportType'])}
              className="grid grid-cols-2 gap-3"
            >
              {REPORT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.id}
                    className={cn(
                      'relative flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                      reportType === type.id ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                    )}
                    onClick={() => handleReportTypeChange(type.id)}
                  >
                    <RadioGroupItem
                      value={type.id}
                      id={type.id}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor={type.id} className="font-medium cursor-pointer">
                          {type.label}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Period Selection */}
          {reportType !== 'property_detail' && periodOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Period</Label>
              <Select
                value={period || periodOptions[0]?.value}
                onValueChange={setPeriod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Property Selection */}
          {reportType === 'property_detail' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Select Properties</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllProperties}
                >
                  {selectedPropertyIds.length === properties.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded-lg p-2">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded cursor-pointer transition-colors',
                      selectedPropertyIds.includes(property.id) ? 'bg-primary/10' : 'hover:bg-accent/50'
                    )}
                    onClick={() => toggleProperty(property.id)}
                  >
                    <Checkbox
                      checked={selectedPropertyIds.includes(property.id)}
                      onCheckedChange={() => toggleProperty(property.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{property.nickname}</p>
                      <p className="text-xs text-muted-foreground">
                        {property.city}, {property.state_code}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedPropertyIds.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedPropertyIds.length} {selectedPropertyIds.length === 1 ? 'property' : 'properties'} selected
                </p>
              )}
            </div>
          )}

          {/* Include Sections */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Include Sections</Label>
              <Badge variant="secondary">{selectedSectionsCount} selected</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <div
                    key={section.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors',
                      includeSections[section.id] ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                    )}
                    onClick={() => toggleSection(section.id)}
                  >
                    <Checkbox
                      checked={includeSections[section.id]}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{section.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as 'pdf' | 'excel')}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="cursor-pointer">PDF Document</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="cursor-pointer">Excel Spreadsheet</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isLoading || (reportType === 'property_detail' && selectedPropertyIds.length === 0)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PortfolioReportModal;
