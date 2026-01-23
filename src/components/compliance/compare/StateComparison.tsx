// ============================================================================
// STATE COMPARISON COMPONENT
// ============================================================================
// Main container component for comparing compliance requirements across states.
//
// FEATURE STATUS: TEMPORARILY DISABLED
// =====================================================================
// This feature is currently disabled because the state compliance binders
// contain placeholder/template data rather than real state-specific
// regulations. Until real compliance data is populated for each state,
// this feature cannot provide accurate comparisons.
//
// To re-enable: Remove the FEATURE_DISABLED flag once real state-specific
// data is populated in the state_compliance_binders table.
// ============================================================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  GitCompare,
  Construction,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { type StateCode, type ComparisonSection, type SavedComparison } from '@/types/compliance';

// ============================================================================
// FEATURE FLAG
// ============================================================================

const FEATURE_DISABLED = true; // Set to false when real state data is available

// ============================================================================
// TYPES
// ============================================================================

export interface StateComparisonProps {
  initialStates?: StateCode[];
  savedComparison?: SavedComparison;
  onSaveComparison?: (name: string, states: StateCode[]) => Promise<void>;
  onAddToBinder?: (stateCode: StateCode, section: ComparisonSection) => void;
  onExportPDF?: () => void;
  className?: string;
}

// ============================================================================
// FEATURE COMING SOON COMPONENT
// ============================================================================

function FeatureComingSoon() {
  return (
    <div className="space-y-6">
      {/* Main Coming Soon Alert */}
      <Alert className="border-primary/30 bg-primary/5">
        <Construction className="h-5 w-5 text-primary" />
        <AlertTitle className="text-lg font-semibold">
          State Comparison Coming Soon
        </AlertTitle>
        <AlertDescription className="mt-2 text-muted-foreground">
          We're building something powerful. The State Comparison feature will allow you
          to see side-by-side regulatory differences between states, helping you make
          informed decisions about where to operate.
        </AlertDescription>
      </Alert>

      {/* What's Coming */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">What's Being Built</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">State-Specific Regulations</p>
                <p className="text-sm text-muted-foreground">
                  Real licensure thresholds, bed limits, and training requirements
                  for each state's unlicensed housing rules.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Smart Similarity Scoring</p>
                <p className="text-sm text-muted-foreground">
                  See at a glance how similar or different two states' regulations are,
                  with specific differences highlighted.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Key Differences Summary</p>
                <p className="text-sm text-muted-foreground">
                  Instant insights like "Texas requires 4 beds before licensing,
                  while Georgia requires 6" — the exact information you need.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Add to Your Binder</p>
                <p className="text-sm text-muted-foreground">
                  Save relevant sections directly to your compliance binder for
                  quick reference.
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Current Status */}
      <div className="flex items-center justify-center gap-2 py-4">
        <Badge variant="outline" className="text-sm px-3 py-1">
          <Construction className="h-3.5 w-3.5 mr-1.5" />
          Researching State Regulations
        </Badge>
      </div>

      {/* Help Text */}
      <p className="text-center text-sm text-muted-foreground max-w-md mx-auto">
        In the meantime, use the <strong>Compliance Search</strong> and{' '}
        <strong>State Binders</strong> to research regulations for your target state.
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StateComparison({
  className = '',
}: StateComparisonProps) {
  // When feature is disabled, show coming soon message
  if (FEATURE_DISABLED) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <GitCompare className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>State Comparison</CardTitle>
                <CardDescription>
                  Compare compliance requirements across different states to make
                  informed decisions about your market.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <FeatureComingSoon />
          </CardContent>
        </Card>
      </div>
    );
  }

  // When feature is enabled (future - when real data is available)
  // This code path is currently unreachable but preserved for when
  // the feature is re-enabled with real state-specific data.
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <GitCompare className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>State Comparison</CardTitle>
              <CardDescription>
                Compare compliance requirements across different states to make
                informed decisions about your market.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FeatureComingSoon />
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default StateComparison;
