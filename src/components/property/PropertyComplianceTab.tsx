// ============================================================================
// PROPERTY COMPLIANCE TAB COMPONENT
// ============================================================================
// Displays property-specific compliance status, state requirements summary,
// and links to the Compliance Hub for detailed information.
// ============================================================================

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  BookOpen,
  MapPin,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { STATE_NAMES, type StateCode } from '@/types/compliance';
import type { Property } from '@/types/property';

// ============================================================================
// TYPES
// ============================================================================

export interface PropertyComplianceTabProps {
  property: Property;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const getComplianceScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const getComplianceScoreBadge = (score: number): { variant: 'default' | 'secondary' | 'destructive'; label: string } => {
  if (score >= 80) return { variant: 'default', label: 'Excellent' };
  if (score >= 60) return { variant: 'secondary', label: 'Good' };
  return { variant: 'destructive', label: 'Needs Attention' };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PropertyComplianceTab = ({ property }: PropertyComplianceTabProps) => {
  const stateName = STATE_NAMES[property.state_code as StateCode] || property.state_code;
  const complianceScore = property.compliance_score ?? 0;
  const scoreBadge = getComplianceScoreBadge(complianceScore);
  const hasBinder = !!property.binder_id;

  return (
    <div className="space-y-6">
      {/* Compliance Score Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Compliance Overview
              </CardTitle>
              <CardDescription className="mt-1">
                Track your property's compliance status for {stateName}
              </CardDescription>
            </div>
            <Badge variant={scoreBadge.variant}>{scoreBadge.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Score Display */}
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Compliance Score</span>
                <span className={`font-semibold ${getComplianceScoreColor(complianceScore)}`}>
                  {complianceScore}%
                </span>
              </div>
              <Progress value={complianceScore} className="h-2" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold tracking-tight">
                {complianceScore}<span className="text-lg text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          <div className="pt-2 border-t">
            {complianceScore >= 80 ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Your property meets compliance standards</span>
              </div>
            ) : complianceScore >= 60 ? (
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Good progress - review remaining items to improve</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Action needed - review compliance requirements</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* State Requirements Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              {stateName} Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              View the complete compliance framework and requirements for operating a group home in {stateName}.
            </p>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link to={`/compliance?state=${property.state_code}`}>
                View State Requirements
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* My Binder Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" />
              My Compliance Binder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasBinder ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Access your personalized compliance binder with documents, checklists, and notes.
                </p>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link to={`/compliance?tab=my-binder&state=${property.state_code}&property_id=${property.id}`}>
                    Open My Binder
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Create a compliance binder to track your documents and progress.
                </p>
                <Button variant="default" className="w-full justify-between" asChild>
                  <Link to={`/compliance?tab=my-binder&state=${property.state_code}&property_id=${property.id}`}>
                    Create My Binder
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Research & Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-green-500" />
            Compliance Resources
          </CardTitle>
          <CardDescription>
            Access research tools and documentation to help maintain compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button variant="ghost" className="justify-start h-auto py-3" asChild>
              <Link to="/compliance?tab=research" className="flex flex-col items-start gap-1">
                <span className="font-medium">Research Hub</span>
                <span className="text-xs text-muted-foreground">Search state regulations</span>
              </Link>
            </Button>
            <Button variant="ghost" className="justify-start h-auto py-3" asChild>
              <Link to="/resources/documents" className="flex flex-col items-start gap-1">
                <span className="font-medium">Document Library</span>
                <span className="text-xs text-muted-foreground">Templates & guides</span>
              </Link>
            </Button>
            <Button variant="ghost" className="justify-start h-auto py-3" asChild>
              <Link to="/compliance" className="flex flex-col items-start gap-1">
                <span className="font-medium">Compliance Hub</span>
                <span className="text-xs text-muted-foreground">All compliance tools</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* External Resources Note */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Stay Updated</p>
              <p className="text-xs text-muted-foreground">
                State regulations change periodically. Use the Research Hub to verify current requirements
                and keep your compliance binder up to date.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyComplianceTab;
