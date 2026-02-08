// CEO Dashboard Page
// Main dashboard for Keston to manage MIO-EA context

import { useCEODashboard } from '@/hooks/useCEODashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ContextProgressBar } from '@/components/ceo-dashboard/ContextProgressBar';
import { ProfileSection } from '@/components/ceo-dashboard/ProfileSection';
import { BusinessSection } from '@/components/ceo-dashboard/BusinessSection';
import { HealthSection } from '@/components/ceo-dashboard/HealthSection';
import { NutritionSection } from '@/components/ceo-dashboard/NutritionSection';
import { DocumentsSection } from '@/components/ceo-dashboard/DocumentsSection';
import { FactsSection } from '@/components/ceo-dashboard/FactsSection';
import { RelationalSection } from '@/components/ceo-dashboard/RelationalSection';
import type { CEODashboardTab } from '@/types/ceoDashboard';
import {
  Crown,
  User,
  Building2,
  Activity,
  Apple,
  FileText,
  Brain,
  Heart,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Tab configuration
const TABS: { id: CEODashboardTab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'profile',
    label: 'Profile & Family',
    icon: <User className="h-4 w-4" />,
    description: 'Personal info, spouse, and children',
  },
  {
    id: 'business',
    label: 'Business',
    icon: <Building2 className="h-4 w-4" />,
    description: 'Company, priorities, and projects',
  },
  {
    id: 'health',
    label: 'Health',
    icon: <Activity className="h-4 w-4" />,
    description: 'Fasting, sleep, and workouts',
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    icon: <Apple className="h-4 w-4" />,
    description: 'Macros, hydration, supplements, and meals',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: <FileText className="h-4 w-4" />,
    description: 'Upload files for MIO',
  },
  {
    id: 'facts',
    label: 'What MIO Knows',
    icon: <Brain className="h-4 w-4" />,
    description: 'Review learned facts',
  },
  {
    id: 'relational',
    label: 'Relational',
    icon: <Heart className="h-4 w-4" />,
    description: 'Relationship health and partner check-ins',
  },
];

export function CEODashboardPage() {
  const {
    // Access
    isCEO,
    isCheckingAccess,

    // Tab state
    activeTab,
    setActiveTab,

    // Data
    preferences,
    documents,
    facts,
    nutrition,
    contextCompleteness,

    // Loading states
    isLoading,
    isMutating,

    // Unsaved changes
    hasUnsavedChanges,
    markUnsaved,
    markSaved,

    // Mutations
    savePreferences,
    saveNutrition,
    uploadDocument,
    deleteDocument,
    verifyFact,
    markFactIncorrect,
    deleteFact,

    // Refetch
    refetchPreferences,
    refetchDocuments,
    refetchFacts,
    refetchNutrition,
  } = useCEODashboard();

  // Loading state
  if (isCheckingAccess || isLoading) {
    return (
      <div className="min-h-screen bg-mi-navy flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-mi-cyan animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading CEO Dashboard...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isCEO) {
    return (
      <div className="min-h-screen bg-mi-navy flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="p-4 rounded-full bg-red-500/10 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
          <p className="text-white/60 mb-6">
            This dashboard is only available to the CEO. If you believe you should have access,
            please contact support.
          </p>
          <Link to="/mind-insurance">
            <Button className="bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Hub
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mi-navy">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-mi-navy/95 backdrop-blur border-b border-mi-cyan/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/mind-insurance">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-mi-navy-light"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-mi-gold/20 to-mi-gold/5 border border-mi-gold/30">
                  <Crown className="h-6 w-6 text-mi-gold" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">CEO Dashboard</h1>
                  <p className="text-sm text-white/50">MIO-EA Context Management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <Badge className="bg-mi-gold/20 text-mi-gold border-mi-gold/30">
                  Unsaved Changes
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchPreferences();
                  refetchDocuments();
                  refetchFacts();
                  refetchNutrition();
                }}
                disabled={isMutating}
                className="border-mi-cyan/30 text-white/70 hover:text-white hover:bg-mi-cyan/10"
              >
                <RefreshCw className={cn('h-4 w-4', isMutating && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Context Progress Bar */}
        <ContextProgressBar completeness={contextCompleteness} />

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as CEODashboardTab)}
          className="space-y-6"
        >
          {/* Tab List - Scrollable on mobile */}
          <TabsList className="bg-mi-navy-light border border-mi-cyan/20 p-1 h-auto flex-wrap justify-start md:justify-center gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all',
                  'data-[state=active]:bg-mi-cyan data-[state=active]:text-mi-navy data-[state=active]:shadow-lg',
                  'data-[state=inactive]:text-white/60 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-mi-cyan/10'
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Description */}
          <div className="text-center">
            <p className="text-white/50 text-sm">
              {TABS.find((t) => t.id === activeTab)?.description}
            </p>
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
            <ProfileSection
              preferences={preferences}
              onSave={async (data) => {
                await savePreferences(data);
                markSaved();
              }}
              onMarkUnsaved={markUnsaved}
              isSaving={isMutating}
            />
          </TabsContent>

          {/* Business Tab */}
          <TabsContent value="business" className="mt-0 focus-visible:outline-none">
            <BusinessSection
              preferences={preferences}
              onSave={async (data) => {
                await savePreferences(data);
                markSaved();
              }}
              onMarkUnsaved={markUnsaved}
              isSaving={isMutating}
            />
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="mt-0 focus-visible:outline-none">
            <HealthSection
              preferences={preferences}
              onSave={async (data) => {
                await savePreferences(data);
                markSaved();
              }}
              onMarkUnsaved={markUnsaved}
              isSaving={isMutating}
            />
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="mt-0 focus-visible:outline-none">
            <NutritionSection
              nutrition={nutrition}
              onSave={async (data) => {
                await saveNutrition(data);
                markSaved();
              }}
              onMarkUnsaved={markUnsaved}
              isSaving={isMutating}
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-0 focus-visible:outline-none">
            <DocumentsSection
              documents={documents}
              onUpload={uploadDocument}
              onDelete={deleteDocument}
              isUploading={isMutating}
            />
          </TabsContent>

          {/* Facts Tab */}
          <TabsContent value="facts" className="mt-0 focus-visible:outline-none">
            <FactsSection
              facts={facts}
              onVerify={verifyFact}
              onMarkIncorrect={markFactIncorrect}
              onDelete={deleteFact}
              isLoading={isMutating}
              onRefresh={refetchFacts}
            />
          </TabsContent>

          {/* Relational Tab */}
          <TabsContent value="relational" className="mt-0 focus-visible:outline-none">
            <RelationalSection />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-mi-cyan/10 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              MIO-EA uses this information to provide personalized insights and proactive support.
            </p>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-mi-cyan/50" />
              <span className="text-white/40 text-sm">
                Context Score: {contextCompleteness.overallPercentage}%
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CEODashboardPage;
