import { useState } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  BarChart3,
  Settings,
  Users,
  RefreshCw,
} from 'lucide-react';
import {
  StuckUsersPanel,
  FunnelAnalytics,
  AutomationConfigPanel,
  UserDetailModal,
} from '@/components/admin/coach-dashboard';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

type DashboardView = 'stuck' | 'funnel' | 'automation';

export const CoachDashboard = () => {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<DashboardView>('stuck');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setIsUserModalOpen(true);
  };

  const handleBookCall = (userId: string) => {
    // Open Calendly with pre-filled user info if available
    window.open('https://calendly.com/grouphome4newbies/coaching', '_blank');
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['coach-dashboard'] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const viewTabs: { value: DashboardView; label: string; icon: React.ReactNode }[] = [
    { value: 'stuck', label: 'Stuck Users', icon: <AlertTriangle className="w-4 h-4" /> },
    { value: 'funnel', label: 'Funnel Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { value: 'automation', label: 'Automation', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <SidebarLayout mode="admin">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Coach Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Monitor user progress and manage automated nudges
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh All
          </Button>
        </div>

        {/* View Tabs - Mobile: Full width, Desktop: Inline */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as DashboardView)}>
          <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex">
            {viewTabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Stuck Users View */}
          <TabsContent value="stuck" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Panel - Stuck Users List */}
              <div className="lg:col-span-2">
                <StuckUsersPanel
                  onViewUser={handleViewUser}
                  onBookCall={handleBookCall}
                />
              </div>

              {/* Side Panel - Quick Stats & Actions */}
              <div className="space-y-6">
                <FunnelAnalytics />
              </div>
            </div>
          </TabsContent>

          {/* Funnel Analytics View */}
          <TabsContent value="funnel" className="mt-6">
            <FunnelAnalytics />
          </TabsContent>

          {/* Automation Settings View */}
          <TabsContent value="automation" className="mt-6">
            <AutomationConfigPanel />
          </TabsContent>
        </Tabs>

        {/* User Detail Modal */}
        <UserDetailModal
          userId={selectedUserId}
          isOpen={isUserModalOpen}
          onClose={() => {
            setIsUserModalOpen(false);
            setSelectedUserId(null);
          }}
          onBookCall={handleBookCall}
        />
      </div>
    </SidebarLayout>
  );
};

export default CoachDashboard;
