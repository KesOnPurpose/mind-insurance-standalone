// ============================================================================
// COMPLIANCE HUB PAGE
// ============================================================================
// Main entry point for the Compliance Hub feature.
// Provides tabs for Search, Binder, Assessment, and Compare.
// ============================================================================

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  FolderOpen,
  ClipboardCheck,
  GitCompare,
  BookOpen,
  Shield,
  ArrowRight,
  ExternalLink,
  MapPin,
  Plus,
  Loader2,
  Library,
} from 'lucide-react';
import { ComplianceSearch } from '@/components/compliance/search';
import { ComplianceBinder } from '@/components/compliance/binder';
import { StateComparison } from '@/components/compliance/compare';
import { ComplianceLibrary } from '@/components/compliance/library';
import { ComplianceResearch } from '@/components/compliance/research/ComplianceResearch';
import { useBinderList } from '@/hooks/useComplianceBinder';
import { type StateCode, STATE_NAMES } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

// FEAT-GH-015: Consolidated from 6 tabs to 5 tabs
// - 'search' merged into 'research'
// - 'library' merged into 'research'
// - 'binder' renamed to 'my-binder'
type HubTab = 'overview' | 'research' | 'my-binder' | 'assessment' | 'compare';

// URL redirect mapping for backwards compatibility
const TAB_REDIRECTS: Record<string, HubTab> = {
  'search': 'research',
  'library': 'research',
  'binder': 'my-binder',
};

// ============================================================================
// QUICK ACTION CARD
// ============================================================================

interface QuickActionProps {
  icon: typeof Search;
  title: string;
  description: string;
  onClick: () => void;
  badge?: string;
}

function QuickActionCard({ icon: Icon, title, description, onClick, badge }: QuickActionProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{title}</h3>
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// OVERVIEW TAB CONTENT
// ============================================================================

function OverviewContent({ onNavigate }: { onNavigate: (tab: HubTab) => void }) {
  const { binders, isLoading: binderLoading } = useBinderList();
  const primaryBinder = binders.length > 0 ? binders[0] : null;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary">
          <Shield className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold">Compliance Hub</h1>
        <p className="text-lg text-muted-foreground">
          Your digital compliance binder - everything you need to operate with
          confidence and peace of mind when officials come to your door.
        </p>
      </div>

      {/* Quick Actions - FEAT-GH-015: Updated for consolidated tabs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <QuickActionCard
          icon={Search}
          title="Research Compliance"
          description="Search regulations, browse state libraries, and find answers across all 50 states."
          onClick={() => onNavigate('research')}
          badge="Search + Library"
        />
        <QuickActionCard
          icon={FolderOpen}
          title="My Binder"
          description="Your personal compliance binder - saved research, documents, and notes."
          onClick={() => onNavigate('my-binder')}
          badge={primaryBinder ? `${primaryBinder.item_count || 0} items` : undefined}
        />
        <QuickActionCard
          icon={ClipboardCheck}
          title="Compliance Assessment"
          description="Complete the guided workbook to verify your model against state requirements."
          onClick={() => onNavigate('assessment')}
        />
        <QuickActionCard
          icon={GitCompare}
          title="Compare States"
          description="See side-by-side comparisons of compliance requirements across different states."
          onClick={() => onNavigate('compare')}
        />
      </div>

      {/* Educational Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Getting Started
          </CardTitle>
          <CardDescription>
            New to group home compliance? Start here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-medium">1. Define Your Model</h4>
              <p className="text-sm text-muted-foreground">
                Clearly articulate what housing service you provide and what you
                do NOT provide.
              </p>
            </div>
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-medium">2. Research Requirements</h4>
              <p className="text-sm text-muted-foreground">
                Use the search to find state licensure thresholds and local
                zoning rules.
              </p>
            </div>
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-medium">3. Build Your Binder</h4>
              <p className="text-sm text-muted-foreground">
                Save relevant regulations, upload documents, and add your
                interpretations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// BINDER TAB CONTENT (WITH STATE SELECTOR)
// ============================================================================

interface BinderTabContentProps {
  preselectedState?: StateCode | null;
  linkedPropertyId?: string | null;
}

function BinderTabContent({ preselectedState, linkedPropertyId }: BinderTabContentProps) {
  const [selectedState, setSelectedState] = useState<StateCode | null>(preselectedState || null);
  const [selectedBinderId, setSelectedBinderId] = useState<string | null>(null);

  const {
    binders,
    isLoading: bindersLoading,
    createBinder,
    isCreating,
  } = useBinderList();

  // If user has binders, show them with option to select or create new
  // If no binders, show create binder UI with state selector

  // Set the first binder as selected if available
  if (!selectedBinderId && binders.length > 0) {
    setSelectedBinderId(binders[0].id);
  }

  // Handle creating a new binder
  const handleCreateBinder = async () => {
    if (!selectedState) return;

    try {
      const newBinder = await createBinder({
        name: `${STATE_NAMES[selectedState]} Compliance Binder`,
        state_code: selectedState,
        is_primary: binders.length === 0,
        property_id: linkedPropertyId || undefined,
      });
      setSelectedBinderId(newBinder.id);
      setSelectedState(null);
    } catch (err) {
      console.error('Failed to create binder:', err);
    }
  };

  // Loading state
  if (bindersLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // If we have a selected binder, show it
  if (selectedBinderId) {
    return (
      <div className="space-y-4">
        {/* Binder Selector (if multiple binders) */}
        {binders.length > 1 && (
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="binder-select" className="text-sm font-medium whitespace-nowrap">
                  Current Binder:
                </Label>
                <Select
                  value={selectedBinderId}
                  onValueChange={setSelectedBinderId}
                >
                  <SelectTrigger id="binder-select" className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {binders.map((binder) => (
                      <SelectItem key={binder.id} value={binder.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {binder.name}
                          <Badge variant="outline" className="ml-1 text-xs">
                            {binder.state_code}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBinderId(null)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Render the actual binder */}
        <ComplianceBinder binderId={selectedBinderId} />
      </div>
    );
  }

  // Create new binder UI
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Create Your Compliance Binder
        </CardTitle>
        <CardDescription>
          Start by selecting your state. This will create a digital binder where you can
          save compliance research, upload documents, and track your progress.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing binders notice */}
        {binders.length > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              You have {binders.length} existing binder{binders.length > 1 ? 's' : ''}.{' '}
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto"
                onClick={() => setSelectedBinderId(binders[0].id)}
              >
                View existing binders
              </Button>
            </p>
          </div>
        )}

        {/* State Selector */}
        <div className="space-y-2">
          <Label htmlFor="state-select" className="text-sm font-medium">
            Select Your State
          </Label>
          <Select
            value={selectedState || ''}
            onValueChange={(value) => setSelectedState(value as StateCode)}
          >
            <SelectTrigger id="state-select" className="w-full max-w-sm">
              <SelectValue placeholder="Choose a state..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATE_NAMES).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {name} ({code})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Your binder will be pre-configured with compliance categories for your selected state.
          </p>
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreateBinder}
          disabled={!selectedState || isCreating}
          className="w-full sm:w-auto"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create {selectedState ? `${STATE_NAMES[selectedState]} ` : ''}Binder
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ComplianceHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // FEAT-GH-015: Handle URL redirects for old tab URLs
  const rawTab = searchParams.get('tab');
  const redirectedTab = rawTab && TAB_REDIRECTS[rawTab] ? TAB_REDIRECTS[rawTab] : rawTab;

  // Get active tab from URL or default to overview
  const activeTab = (redirectedTab as HubTab) || 'overview';

  // Read property context from URL params (passed from PropertyComplianceTab)
  const preselectedState = searchParams.get('state') as StateCode | null;
  const linkedPropertyId = searchParams.get('property_id');

  // Apply redirect if URL has old tab value
  if (rawTab && TAB_REDIRECTS[rawTab]) {
    setSearchParams({ tab: TAB_REDIRECTS[rawTab] }, { replace: true });
  }

  // Get user's binders for passing to Research tab
  const { binders, isLoading: bindersLoading } = useBinderList();
  const primaryBinderId = binders.length > 0 ? binders[0].id : undefined;
  // Calculate total saved items across all binders for badge display
  const totalBinderItems = binders.reduce((sum, b) => sum + (b.item_count || 0), 0);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  // Handle navigation from overview cards
  const handleNavigate = (tab: HubTab) => {
    handleTabChange(tab);
  };

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        {/* FEAT-GH-015: Consolidated from 6 tabs to 5 tabs */}
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <Shield className="h-4 w-4 mr-1.5 hidden sm:inline" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="research" className="text-xs sm:text-sm">
            <Search className="h-4 w-4 mr-1.5 hidden sm:inline" />
            Research
          </TabsTrigger>
          <TabsTrigger value="my-binder" className="text-xs sm:text-sm">
            <FolderOpen className="h-4 w-4 mr-1.5 hidden sm:inline" />
            My Binder
            {totalBinderItems > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-xs">
                {totalBinderItems}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assessment" className="text-xs sm:text-sm">
            <ClipboardCheck className="h-4 w-4 mr-1.5 hidden sm:inline" />
            Assessment
          </TabsTrigger>
          <TabsTrigger value="compare" className="text-xs sm:text-sm">
            <GitCompare className="h-4 w-4 mr-1.5 hidden sm:inline" />
            Compare
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <OverviewContent onNavigate={handleNavigate} />
        </TabsContent>

        {/* FEAT-GH-015: Research Tab (combines Search + Library) */}
        <TabsContent value="research" className="space-y-6">
          {/* Show create binder prompt if user has no binder */}
          {!bindersLoading && !primaryBinderId && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <FolderOpen className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Create a binder to save your research
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      You need a compliance binder before you can save search results.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => handleTabChange('my-binder')}
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Create My Binder
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* FEAT-GH-015-E: ComplianceResearch component combines Search + State Library */}
          <ComplianceResearch
            binderId={primaryBinderId}
            onNavigateToMyBinder={() => handleTabChange('my-binder')}
          />
        </TabsContent>

        {/* FEAT-GH-015: My Binder Tab (renamed from Binder) */}
        <TabsContent value="my-binder">
          <BinderTabContent
            preselectedState={preselectedState}
            linkedPropertyId={linkedPropertyId}
          />
        </TabsContent>

        {/* Assessment Tab */}
        <TabsContent value="assessment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Compliance Assessment
              </CardTitle>
              <CardDescription>
                Complete the guided workbook to verify your housing model against
                state and local requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Assessment Workbook</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Work through each section to document your research and
                  interpretations. Your findings will automatically be saved to
                  your binder.
                </p>
                <Button onClick={() => navigate('/compliance/assessment')}>
                  Start Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare">
          <StateComparison />
        </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
