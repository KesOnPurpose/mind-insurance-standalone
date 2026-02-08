// ============================================================================
// PROPERTY PORTFOLIO PAGE
// ============================================================================
// Main portfolio view with all properties, dashboard, and diversification
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePropertyPortfolio } from '@/hooks/usePropertyPortfolio';
import {
  PortfolioDashboard,
  DiversificationView,
  AddPropertyModal,
  PortfolioReportModal,
} from '@/components/property';
import { generateReport } from '@/services/portfolioReportService';
import type { ReportOptions } from '@/components/property/PortfolioReportModal';
import { toast } from 'sonner';
import {
  Building2,
  LayoutDashboard,
  PieChart,
  Plus,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PropertyPortfolioPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'diversification'>('dashboard');
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const {
    properties,
    summary,
    healthScores,
    isLoading,
    error,
    createProperty,
    isCreating,
    refetch,
  } = usePropertyPortfolio();

  // Handle property click - navigate to detail page
  const handlePropertyClick = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  // Handle add property
  const handleAddProperty = async (data: Parameters<typeof createProperty>[0]) => {
    try {
      const newProperty = await createProperty(data);
      setShowAddPropertyModal(false);
      toast.success('Property created successfully');

      // Navigate to the new property's detail page
      if (newProperty?.id) {
        navigate(`/property/${newProperty.id}`);
      }
    } catch (err) {
      toast.error('Failed to create property');
    }
  };

  // Handle report generation
  const handleGenerateReport = async (options: ReportOptions) => {
    if (!summary) return;

    setIsGeneratingReport(true);
    try {
      const result = await generateReport(
        options,
        properties,
        summary,
        Object.values(healthScores)
      );

      if (result.success) {
        toast.success(`Report generated: ${result.filename}`);
        setShowReportModal(false);
      } else {
        toast.error(result.error || 'Failed to generate report');
      }
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-medium">Failed to load portfolio</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Property Portfolio
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your properties in one place
            </p>
          </div>
          <div className="flex items-center gap-2">
            {properties.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
              </Badge>
            )}
            <Button onClick={() => setShowAddPropertyModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Content */}
        {properties.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center min-h-[400px] border rounded-lg bg-muted/30">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Properties Yet</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Start building your portfolio by adding your first property.
              Track financials, occupancy, and compliance all in one place.
            </p>
            <Button onClick={() => setShowAddPropertyModal(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Add Your First Property
            </Button>
          </div>
        ) : (
          // Portfolio tabs
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="diversification" className="gap-2">
                <PieChart className="h-4 w-4" />
                Diversification
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              {summary && (
                <PortfolioDashboard
                  properties={properties}
                  summary={summary}
                  healthScores={Object.values(healthScores)}
                  onPropertyClick={handlePropertyClick}
                  onGenerateReport={() => setShowReportModal(true)}
                />
              )}
            </TabsContent>

            <TabsContent value="diversification" className="mt-6">
              {summary && (
                <DiversificationView
                  properties={properties}
                  summary={summary}
                  healthScores={Object.values(healthScores)}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Modals */}
      <AddPropertyModal
        open={showAddPropertyModal}
        onOpenChange={setShowAddPropertyModal}
        onSubmit={handleAddProperty}
        isLoading={isCreating}
        defaultState={user?.user_metadata?.state_code}
      />

      {summary && (
        <PortfolioReportModal
          open={showReportModal}
          onOpenChange={setShowReportModal}
          properties={properties}
          onGenerateReport={handleGenerateReport}
          isLoading={isGeneratingReport}
        />
      )}
    </SidebarLayout>
  );
};

export default PropertyPortfolioPage;
