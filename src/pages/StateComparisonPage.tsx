// ============================================================================
// STATE COMPARISON PAGE
// ============================================================================
// Dedicated page for comparing compliance requirements across states.
// Helps users evaluating multiple markets make informed decisions.
// ============================================================================

import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowLeft,
  GitCompare,
  Info,
  Bookmark,
  Download,
} from 'lucide-react';
import { StateComparison } from '@/components/compliance/compare';
import { useComplianceBinder } from '@/hooks/useComplianceBinder';
import { type StateCode, type ComparisonSection, STATE_NAMES } from '@/types/compliance';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StateComparisonPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addItem } = useComplianceBinder();

  // Get pre-selected states from URL if provided
  const statesParam = searchParams.get('states');
  const initialStates: StateCode[] = statesParam
    ? (statesParam.split(',').filter((s) => s in STATE_NAMES) as StateCode[])
    : [];

  // Handle saving comparison to binder
  const handleSaveComparison = async (name: string, states: StateCode[]) => {
    // TODO: Implement save comparison functionality
    console.log('Saving comparison:', name, states);
  };

  // Handle adding state section to binder
  const handleAddToBinder = async (stateCode: StateCode, section: ComparisonSection) => {
    await addItem({
      section_type: section.section_type,
      chunk_content: section.content_summary,
      user_notes: `Comparison note for ${STATE_NAMES[stateCode]}`,
      source_url: undefined,
      regulation_code: undefined,
    });
  };

  // Handle PDF export
  const handleExportPDF = () => {
    // TODO: Implement PDF export for comparison
    console.log('Exporting comparison PDF...');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/compliance')}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Hub
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Page Title */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-lg bg-primary/10 text-primary">
          <GitCompare className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">State Comparison</h1>
          <p className="text-muted-foreground">
            Compare compliance requirements side-by-side to evaluate different markets.
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>How to Use</AlertTitle>
        <AlertDescription>
          Select 2-3 states to compare their compliance requirements. Look for key
          differences in licensure triggers, zoning rules, and fair housing protections.
          Save relevant sections directly to your binder.
        </AlertDescription>
      </Alert>

      {/* Main Comparison Component */}
      <StateComparison
        initialStates={initialStates}
        onSaveComparison={handleSaveComparison}
        onAddToBinder={handleAddToBinder}
        onExportPDF={handleExportPDF}
      />

      {/* Tips Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bookmark className="h-4 w-4" />
            Comparison Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary font-medium">1.</span>
              <span>
                <strong>Licensure thresholds</strong> vary significantly - some states
                trigger at 2 residents, others at 6+.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-medium">2.</span>
              <span>
                <strong>Fair Housing Act</strong> protections are federal and apply
                everywhere, but state-level protections may offer additional coverage.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-medium">3.</span>
              <span>
                <strong>Local rules</strong> (zoning, occupancy) can vary dramatically
                even within the same state - always verify with your specific municipality.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-medium">4.</span>
              <span>
                Use the <strong>"Add to Binder"</strong> button to save important
                requirements directly to your compliance portfolio.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
