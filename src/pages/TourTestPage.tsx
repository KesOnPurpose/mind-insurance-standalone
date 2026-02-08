/**
 * FEAT-GH-TOUR: Tour Test Page
 *
 * Test page for the Nette Onboarding Tour using the REAL sidebar.
 * Uses actual SidebarLayout to properly test tour with real navigation.
 */

import { TourProvider } from '@/contexts/TourContext';
import { TourController } from '@/components/tour';
import { useTour } from '@/hooks/useTour';
import { GROUPHOME_DASHBOARD_TOUR } from '@/config/GrouphomeTourSteps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Play, RotateCcw } from 'lucide-react';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';

/**
 * Tour test content with mock tour targets for dashboard elements
 * Uses REAL sidebar via SidebarProvider
 */
function TourTestContent() {
  const { startTour, isActive, resetTour } = useTour();
  const { user } = useAuth();

  return (
    <SidebarInset>
      {/* Sticky header with real sidebar toggle */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Nette Tour Test Page</h1>
        </div>
      </header>

      <div className="min-h-[calc(100vh-3.5rem)] bg-background p-4 md:p-8">
        {/* Tour Controls */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Tour Controls</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button
                onClick={() => startTour(GROUPHOME_DASHBOARD_TOUR)}
                disabled={isActive}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                {isActive ? 'Tour Running...' : 'Start Tour'}
              </Button>

              <Button
                variant="outline"
                onClick={() => resetTour()}
                disabled={isActive}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Tour State
              </Button>

              <div className="ml-auto text-sm text-muted-foreground">
                User ID: {user?.id?.slice(0, 8) || 'Not logged in'}...
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mock Dashboard Elements for Tour Targeting */}
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Dashboard Elements (Tour Targets)
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            The sidebar on the left is the <strong>REAL</strong> AppSidebar with actual navigation.
            Use the hamburger menu (☰) on mobile to open it.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Program Progress Mock */}
            <Card
              data-tour-target="program-progress"
              className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors"
            >
              <CardHeader>
                <CardTitle className="text-lg">Program Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <code className="text-xs bg-muted px-1 rounded">data-tour-target="program-progress"</code>
                </p>
                <div className="mt-4 h-4 bg-primary/20 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-primary rounded-full" />
                </div>
                <p className="text-sm mt-2">33% Complete</p>
              </CardContent>
            </Card>

            {/* Financial Projections Mock */}
            <Card
              data-tour-target="financial-projections"
              className="border-2 border-dashed border-green-500/30 hover:border-green-500/50 transition-colors"
            >
              <CardHeader>
                <CardTitle className="text-lg">Financial Projections</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <code className="text-xs bg-muted px-1 rounded">data-tour-target="financial-projections"</code>
                </p>
                <div className="mt-4 text-2xl font-bold text-green-600">$8,500/mo</div>
                <p className="text-sm text-muted-foreground">Projected net income</p>
              </CardContent>
            </Card>

            {/* Compliance Status Mock */}
            <Card
              data-tour-target="compliance-status"
              className="border-2 border-dashed border-blue-500/30 hover:border-blue-500/50 transition-colors"
            >
              <CardHeader>
                <CardTitle className="text-lg">Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <code className="text-xs bg-muted px-1 rounded">data-tour-target="compliance-status"</code>
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">5 of 12 requirements met</span>
                </div>
              </CardContent>
            </Card>

            {/* Chat Nette Mock - Note: Real chat-nette target is in AppSidebar */}
            <Card className="border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">Ask Nette</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  The real "Ask Nette" target is in the sidebar navigation.<br />
                  <code className="text-xs bg-muted px-1 rounded">data-tour-target="chat-nette"</code>
                </p>
                <Button variant="secondary" className="w-full" disabled>
                  See Sidebar → Ask Nette
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Debug Info */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="text-xs font-mono space-y-1">
              <p>Tour Active: {isActive ? 'Yes' : 'No'}</p>
              <p>Tour Steps: {GROUPHOME_DASHBOARD_TOUR.steps.length}</p>
              <p>Tour ID: {GROUPHOME_DASHBOARD_TOUR.id}</p>
              <p className="text-green-600 font-semibold mt-2">
                ✓ Using REAL sidebar (AppSidebar) - not a mock!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  );
}

/**
 * TourTestPage - Wrapped with SidebarProvider, TourProvider, and TourController
 * Uses the REAL AppSidebar for authentic tour testing
 */
export default function TourTestPage() {
  const { user } = useAuth();

  return (
    <SidebarProvider defaultOpen={true}>
      {/* Real AppSidebar with data-tour-target="sidebar-navigation" */}
      <AppSidebar mode="dashboard" />

      <TourProvider>
        <TourTestContent />
        <TourController
          userId={user?.id}
          userState="texas"
          targetIncome={10000}
          ownershipModel="ownership"
        />
      </TourProvider>
    </SidebarProvider>
  );
}
