// ============================================================================
// FEAT-GH-014: Admin Program Dashboard Page
// ============================================================================
// Single program management dashboard with tabbed interface
// Route: /admin/programs/:programId
// ============================================================================

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  BarChart3,
  Layers,
  Users,
  Clock,
  Settings,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAdminProgram, useAdminProgramLearners } from '@/hooks/useAdminPrograms';
import {
  ProgramOverviewTab,
  ProgramPhasesTab,
  ProgramLearnersTab,
  ProgramDripTab,
  ProgramSettingsTab,
} from '@/components/admin/programs';

// ============================================================================
// Types
// ============================================================================

type TabValue = 'overview' | 'phases' | 'learners' | 'drip' | 'settings';

// ============================================================================
// Status Badge
// ============================================================================

const StatusBadge = ({ status }: { status: 'draft' | 'published' | 'archived' }) => {
  const variants: Record<
    'draft' | 'published' | 'archived',
    { variant: 'default' | 'secondary' | 'outline'; icon: React.ReactNode; label: string }
  > = {
    draft: { variant: 'secondary', icon: <EyeOff className="h-3 w-3" />, label: 'Draft' },
    published: { variant: 'default', icon: <Eye className="h-3 w-3" />, label: 'Published' },
    archived: { variant: 'outline', icon: null, label: 'Archived' },
  };

  const { variant, icon, label } = variants[status];

  return (
    <Badge variant={variant} className="gap-1">
      {icon}
      {label}
    </Badge>
  );
};

// ============================================================================
// Header Skeleton
// ============================================================================

const HeaderSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-48" />
    <div className="flex items-center gap-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-5 w-20" />
    </div>
    <Skeleton className="h-4 w-96" />
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const AdminProgramDashboardPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Determine active tab from URL
  const tabFromUrl = searchParams.get('tab') as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(tabFromUrl || 'overview');

  // Fetch data
  const { program, phases, isLoading: isProgramLoading, refetch: refetchProgram } = useAdminProgram(programId);
  const { learners, isLoading: isLearnersLoading, refetch: refetchLearners } = useAdminProgramLearners(programId);

  // Sync tab to URL
  useEffect(() => {
    if (activeTab === 'overview') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', activeTab);
    }
    setSearchParams(searchParams, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
  };

  // Not found state
  if (!isProgramLoading && !program && programId) {
    return (
      <SidebarLayout mode="admin">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-xl font-semibold mb-2">Program Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The program you're looking for doesn't exist or you don't have access.
          </p>
          <Button variant="outline" onClick={() => navigate('/admin/programs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Programs
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout mode="admin">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/admin/programs">Programs</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isProgramLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <BreadcrumbPage>{program?.title || 'Program'}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        {isProgramLoading ? (
          <HeaderSkeleton />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{program?.title}</h1>
                {program && <StatusBadge status={program.status} />}
                {program?.is_public && (
                  <Badge variant="outline" className="text-xs">
                    Public
                  </Badge>
                )}
              </div>
              {program?.description && (
                <p className="text-muted-foreground max-w-xl line-clamp-2">
                  {program.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                <span>{program?.phase_count || 0} phases</span>
                <span>{program?.lesson_count || 0} lessons</span>
                <span>{program?.enrolled_count || 0} enrolled</span>
              </div>
            </div>
            {program?.status === 'published' && (
              <Button
                variant="outline"
                asChild
              >
                <Link to={`/programs/${programId}`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Live
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4 hidden sm:block" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="phases" className="gap-2">
              <Layers className="h-4 w-4 hidden sm:block" />
              Phases
            </TabsTrigger>
            <TabsTrigger value="learners" className="gap-2">
              <Users className="h-4 w-4 hidden sm:block" />
              Learners
            </TabsTrigger>
            <TabsTrigger value="drip" className="gap-2">
              <Clock className="h-4 w-4 hidden sm:block" />
              Drip
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4 hidden sm:block" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ProgramOverviewTab
              program={program}
              learners={learners}
              isLoading={isProgramLoading || isLearnersLoading}
            />
          </TabsContent>

          <TabsContent value="phases">
            <ProgramPhasesTab
              programId={programId || ''}
              phases={phases}
              isLoading={isProgramLoading}
              onRefresh={refetchProgram}
            />
          </TabsContent>

          <TabsContent value="learners">
            <ProgramLearnersTab
              programId={programId || ''}
              learners={learners}
              isLoading={isLearnersLoading}
              onRefresh={refetchLearners}
            />
          </TabsContent>

          <TabsContent value="drip">
            <ProgramDripTab
              programId={programId || ''}
              phases={phases}
              currentSettings={null} // Would need to fetch from program.settings
              isLoading={isProgramLoading}
              onRefresh={refetchProgram}
            />
          </TabsContent>

          <TabsContent value="settings">
            <ProgramSettingsTab
              program={program}
              isLoading={isProgramLoading}
              onRefresh={refetchProgram}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
};

export default AdminProgramDashboardPage;
