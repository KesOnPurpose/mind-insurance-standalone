// Protocol Management Page - Admin
// Phase 27: Coach Protocol Builder + V2 Multi-Week Protocols

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Archive,
  Send,
  Calendar,
  Users,
  Clock,
  ChevronRight,
  ArrowLeft,
  Upload,
  BarChart3,
  UserPlus,
  BookOpen,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllCoachProtocols,
  deleteCoachProtocol,
  updateCoachProtocolStatus,
  duplicateCoachProtocol,
} from '@/services/adminProtocolService';
import type { CoachProtocol, CoachProtocolStatus } from '@/types/protocol';

// V2 Imports
import {
  getAllProtocols as getAllProtocolsV2,
  updateProtocol as updateProtocolV2,
  updateProtocolStatus as updateProtocolStatusV2,
  deleteProtocol as deleteProtocolV2,
  createProtocol as createProtocolV2,
  bulkCreateTasks,
  deleteAllTasks,
  assignToUsers,
} from '@/services/coachProtocolV2Service';
import type {
  CoachProtocolV2,
  CoachProtocolStatus as CoachProtocolStatusV2,
  CreateCoachProtocolForm,
  CreateCoachProtocolTaskForm,
} from '@/types/coach-protocol';

// V2 Components
import { MultiWeekProtocolEditor } from '@/components/admin/protocols/MultiWeekProtocolEditor';
import { ProtocolImporter } from '@/components/admin/protocols/ProtocolImporter';
import { ProtocolAssigner } from '@/components/admin/protocols/ProtocolAssigner';
import { CoachProtocolDashboard } from '@/components/admin/protocols/CoachProtocolDashboard';
import { AssignedUsersList } from '@/components/admin/protocols/AssignedUsersList';

// Legacy Editor
import { ProtocolEditor } from '@/components/admin/protocols/ProtocolEditor';

type ViewMode = 'list' | 'create' | 'edit' | 'import' | 'assign' | 'dashboard' | 'assigned_users';
type ProtocolTab = 'mio' | 'coach';

export default function ProtocolManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ProtocolTab>('coach');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Legacy MIO protocols (7-day)
  const [mioProtocols, setMioProtocols] = useState<CoachProtocol[]>([]);
  const [selectedMioProtocol, setSelectedMioProtocol] = useState<CoachProtocol | null>(null);

  // V2 Coach protocols (multi-week)
  const [coachProtocols, setCoachProtocols] = useState<CoachProtocolV2[]>([]);
  const [selectedCoachProtocol, setSelectedCoachProtocol] = useState<CoachProtocolV2 | null>(null);
  const [dashboardProtocolId, setDashboardProtocolId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch protocols on mount
  useEffect(() => {
    if (activeTab === 'mio') {
      fetchMioProtocols();
    } else {
      fetchCoachProtocols();
    }
  }, [activeTab]);

  const fetchMioProtocols = async () => {
    try {
      setIsLoading(true);
      const data = await getAllCoachProtocols();
      setMioProtocols(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load MIO protocols',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoachProtocols = async () => {
    try {
      setIsLoading(true);
      const data = await getAllProtocolsV2();
      setCoachProtocols(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load coach protocols',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ===== MIO Protocol Handlers (Legacy) =====
  const handleMioCreateNew = () => {
    setSelectedMioProtocol(null);
    setViewMode('create');
  };

  const handleMioEdit = (protocol: CoachProtocol) => {
    setSelectedMioProtocol(protocol);
    setViewMode('edit');
  };

  const handleMioDelete = async (protocolId: string) => {
    if (!confirm('Are you sure you want to delete this protocol?')) return;

    try {
      setIsProcessing(true);
      await deleteCoachProtocol(protocolId);
      toast({ title: 'Success', description: 'Protocol deleted' });
      fetchMioProtocols();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMioStatusChange = async (protocolId: string, status: CoachProtocolStatus) => {
    try {
      setIsProcessing(true);
      await updateCoachProtocolStatus(protocolId, status);
      toast({ title: 'Success', description: 'Status updated' });
      fetchMioProtocols();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMioDuplicate = async (protocolId: string) => {
    if (!user?.id) return;

    try {
      setIsProcessing(true);
      await duplicateCoachProtocol(protocolId, user.id);
      toast({ title: 'Success', description: 'Protocol duplicated' });
      fetchMioProtocols();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to duplicate', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  // ===== V2 Coach Protocol Handlers =====
  const handleCoachCreateNew = () => {
    setSelectedCoachProtocol(null);
    setViewMode('create');
  };

  const handleCoachEdit = (protocol: CoachProtocolV2) => {
    setSelectedCoachProtocol(protocol);
    setViewMode('edit');
  };

  const handleCoachDelete = async (protocolId: string) => {
    if (!confirm('Are you sure you want to delete this protocol? All assignments will be removed.')) return;

    try {
      setIsProcessing(true);
      await deleteProtocolV2(protocolId);
      toast({ title: 'Success', description: 'Protocol deleted' });
      fetchCoachProtocols();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCoachStatusChange = async (protocolId: string, status: CoachProtocolStatusV2) => {
    try {
      setIsProcessing(true);
      await updateProtocolStatusV2(protocolId, status);
      toast({ title: 'Success', description: 'Status updated' });
      fetchCoachProtocols();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCoachAssign = (protocol: CoachProtocolV2) => {
    setSelectedCoachProtocol(protocol);
    setViewMode('assign');
  };

  const handleViewAssignedUsers = (protocol: CoachProtocolV2) => {
    setSelectedCoachProtocol(protocol);
    setViewMode('assigned_users');
  };

  // Handler for saving coach protocols (V2) - transforms form data and saves to DB
  const handleCoachSave = async (form: {
    title: string;
    description: string;
    visibility: string;
    visibility_config?: Record<string, unknown>;
    schedule_type: string;
    start_date?: string;
    theme_color: string;
    weeks: Array<{
      week_number: number;
      theme: string;
      days: Array<{
        day_number: number;
        tasks: Array<{
          id?: string;
          task_order: number;
          title: string;
          instructions: string;
          task_type: string;
          time_of_day: string;
          estimated_minutes?: number;
          resource_url?: string;
        }>;
      }>;
    }>;
  }) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save protocols',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);

      // 1. Flatten tasks from weeks[].days[].tasks[] into single array
      const tasks: CreateCoachProtocolTaskForm[] = [];
      form.weeks.forEach((week) => {
        week.days.forEach((day) => {
          day.tasks.forEach((task) => {
            if (task.title.trim()) {
              tasks.push({
                week_number: week.week_number,
                day_number: day.day_number,
                task_order: task.task_order,
                title: task.title,
                instructions: task.instructions,
                task_type: task.task_type as CreateCoachProtocolTaskForm['task_type'],
                time_of_day: task.time_of_day as CreateCoachProtocolTaskForm['time_of_day'],
                estimated_minutes: task.estimated_minutes,
                resource_url: task.resource_url,
                week_theme: week.theme,
              });
            }
          });
        });
      });

      // 2. Build protocol data
      const protocolData: CreateCoachProtocolForm = {
        title: form.title,
        description: form.description,
        total_weeks: form.weeks.length,
        visibility: form.visibility as CreateCoachProtocolForm['visibility'],
        visibility_config: form.visibility_config,
        schedule_type: form.schedule_type as CreateCoachProtocolForm['schedule_type'],
        start_date: form.start_date,
        theme_color: form.theme_color,
        tasks: tasks,
      };

      // 3. Create or Update
      if (selectedCoachProtocol?.id) {
        // UPDATE existing protocol
        await updateProtocolV2(selectedCoachProtocol.id, {
          title: protocolData.title,
          description: protocolData.description,
          total_weeks: protocolData.total_weeks,
          visibility: protocolData.visibility,
          visibility_config: protocolData.visibility_config,
          schedule_type: protocolData.schedule_type,
          start_date: protocolData.start_date,
          theme_color: protocolData.theme_color,
        });

        // Delete old tasks and recreate
        await deleteAllTasks(selectedCoachProtocol.id);
        if (tasks.length > 0) {
          await bulkCreateTasks(selectedCoachProtocol.id, tasks);
        }

        // AUTO-ASSIGN on UPDATE: If visibility is 'individual', assign any users who aren't already assigned
        // This ensures re-saving a protocol with the same users still creates missing assignments
        if (form.visibility === 'individual' && form.visibility_config?.user_ids) {
          const userIds = form.visibility_config.user_ids as string[];
          if (userIds.length > 0) {
            const assignmentOptions = {
              slot: 'primary' as const,
              start_date: form.schedule_type === 'date_specific' ? form.start_date : undefined,
              override_existing: false, // Don't override existing assignments
            };

            const results = await assignToUsers(
              selectedCoachProtocol.id,
              userIds,
              assignmentOptions,
              user.id
            );
            const successCount = results.filter(r => r.success).length;
            const conflictCount = results.filter(r => r.conflict).length;

            if (successCount > 0) {
              toast({
                title: 'Protocol Updated & Users Assigned',
                description: `Updated protocol. ${successCount} user(s) enrolled${conflictCount > 0 ? ` (${conflictCount} already had assignments)` : ''}.`,
              });
            } else if (conflictCount > 0) {
              toast({
                title: 'Success',
                description: `Protocol updated. All ${conflictCount} user(s) already have active assignments.`,
              });
            } else {
              toast({
                title: 'Success',
                description: 'Protocol updated successfully',
              });
            }
          } else {
            toast({
              title: 'Success',
              description: 'Protocol updated successfully',
            });
          }
        } else {
          toast({
            title: 'Success',
            description: 'Protocol updated successfully',
          });
        }
      } else {
        // CREATE new protocol
        const createdProtocol = await createProtocolV2(user.id, protocolData);

        // AUTO-ASSIGN: If visibility is 'individual' with user_ids, create assignments automatically
        // This bridges the gap between visibility (who CAN see) and assignment (who IS enrolled)
        if (form.visibility === 'individual' && form.visibility_config?.user_ids) {
          const userIds = form.visibility_config.user_ids as string[];
          if (userIds.length > 0 && createdProtocol?.id) {
            const assignmentOptions = {
              slot: 'primary' as const,
              start_date: form.schedule_type === 'date_specific' ? form.start_date : undefined,
              override_existing: false,
            };

            const results = await assignToUsers(
              createdProtocol.id,
              userIds,
              assignmentOptions,
              user.id
            );
            const successCount = results.filter(r => r.success).length;
            const failedCount = results.filter(r => !r.success).length;

            toast({
              title: 'Protocol Created & Users Assigned',
              description: `${successCount} of ${userIds.length} users enrolled${failedCount > 0 ? ` (${failedCount} had conflicts)` : ''}`,
            });
          } else {
            toast({
              title: 'Success',
              description: 'Protocol created successfully',
            });
          }
        } else {
          toast({
            title: 'Success',
            description: 'Protocol created successfully',
          });
        }
      }

      // 4. Close editor and refresh list
      handleSaveComplete();

    } catch (error) {
      console.error('Error saving protocol:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save protocol',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveComplete = () => {
    setViewMode('list');
    setSelectedMioProtocol(null);
    setSelectedCoachProtocol(null);
    if (activeTab === 'mio') {
      fetchMioProtocols();
    } else {
      fetchCoachProtocols();
    }
  };

  const getStatusBadge = (status: CoachProtocolStatus | CoachProtocolStatusV2) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // ===== Render Editor Views =====

  // MIO Protocol Editor (Legacy 7-day)
  if (activeTab === 'mio' && (viewMode === 'create' || viewMode === 'edit')) {
    return (
      <SidebarLayout
        mode="admin"
        showHeader
        headerTitle={viewMode === 'create' ? 'Create MIO Protocol' : 'Edit MIO Protocol'}
        headerSubtitle="Design 7-day protocols for Mind Insurance users"
        headerGradient="linear-gradient(135deg, hsl(270 70% 45%), hsl(240 70% 50%))"
      >
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => setViewMode('list')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Protocols
          </Button>
          <ProtocolEditor
            protocol={selectedMioProtocol}
            onSave={handleSaveComplete}
            onCancel={() => setViewMode('list')}
          />
        </div>
      </SidebarLayout>
    );
  }

  // V2 Coach Protocol Editor (Multi-week)
  if (activeTab === 'coach' && (viewMode === 'create' || viewMode === 'edit')) {
    return (
      <SidebarLayout
        mode="admin"
        showHeader
        headerTitle={viewMode === 'create' ? 'Create Coach Protocol' : 'Edit Coach Protocol'}
        headerSubtitle="Design multi-week coaching protocols"
        headerGradient="linear-gradient(135deg, hsl(270 70% 45%), hsl(240 70% 50%))"
      >
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" onClick={() => setViewMode('list')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Protocols
          </Button>
          <MultiWeekProtocolEditor
            protocol={selectedCoachProtocol || undefined}
            onSave={handleCoachSave}
            onCancel={() => setViewMode('list')}
            isSaving={isProcessing}
          />
        </div>
      </SidebarLayout>
    );
  }

  // V2 Protocol Importer
  if (activeTab === 'coach' && viewMode === 'import') {
    return (
      <SidebarLayout
        mode="admin"
        showHeader
        headerTitle="Import Protocol"
        headerSubtitle="Import from CSV or Google Doc"
        headerGradient="linear-gradient(135deg, hsl(270 70% 45%), hsl(240 70% 50%))"
      >
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => setViewMode('list')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Protocols
          </Button>
          <ProtocolImporter
            onImportComplete={(protocol) => {
              toast({ title: 'Success', description: `Imported "${protocol.title}"` });
              handleSaveComplete();
            }}
            onCancel={() => setViewMode('list')}
          />
        </div>
      </SidebarLayout>
    );
  }

  // V2 Protocol Assigner Dialog
  const renderAssignDialog = () => (
    <Dialog open={viewMode === 'assign'} onOpenChange={() => setViewMode('list')}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Protocol</DialogTitle>
          <DialogDescription>
            Assign this protocol to users or groups
          </DialogDescription>
        </DialogHeader>
        {selectedCoachProtocol && (
          <ProtocolAssigner
            protocol={selectedCoachProtocol}
            onAssigned={() => {
              toast({ title: 'Success', description: 'Protocol assigned successfully' });
              setViewMode('list');
              fetchCoachProtocols();
            }}
            onCancel={() => setViewMode('list')}
          />
        )}
      </DialogContent>
    </Dialog>
  );

  // V2 Assigned Users View
  if (activeTab === 'coach' && viewMode === 'assigned_users' && selectedCoachProtocol) {
    return (
      <SidebarLayout
        mode="admin"
        showHeader
        headerTitle="Assigned Users"
        headerSubtitle={`Viewing assignments for ${selectedCoachProtocol.title}`}
        headerGradient="linear-gradient(135deg, hsl(270 70% 45%), hsl(240 70% 50%))"
      >
        <div className="max-w-6xl mx-auto p-4">
          <AssignedUsersList
            protocol={selectedCoachProtocol}
            onBack={() => {
              setViewMode('list');
              setSelectedCoachProtocol(null);
            }}
          />
        </div>
      </SidebarLayout>
    );
  }

  // V2 Dashboard View
  if (activeTab === 'coach' && viewMode === 'dashboard') {
    return (
      <SidebarLayout
        mode="admin"
        showHeader
        headerTitle="Protocol Dashboard"
        headerSubtitle="Monitor user progress and completion"
        headerGradient="linear-gradient(135deg, hsl(270 70% 45%), hsl(240 70% 50%))"
      >
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" onClick={() => setViewMode('list')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Protocols
          </Button>
          <CoachProtocolDashboard
            protocols={coachProtocols.filter((p) => p.status === 'published')}
            selectedProtocolId={dashboardProtocolId}
            onSelectProtocol={setDashboardProtocolId}
          />
        </div>
      </SidebarLayout>
    );
  }

  // ===== Main List View =====
  return (
    <SidebarLayout
      mode="admin"
      showHeader
      headerTitle="Protocol Management"
      headerSubtitle="Create and manage coaching protocols"
      headerGradient="linear-gradient(135deg, hsl(270 70% 45%), hsl(240 70% 50%))"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProtocolTab)}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="coach" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Coach Protocols (V2)
              </TabsTrigger>
              <TabsTrigger value="mio" className="gap-2">
                <FileText className="h-4 w-4" />
                MIO Protocols (Legacy)
              </TabsTrigger>
            </TabsList>

            {/* Actions */}
            <div className="flex gap-2">
              {activeTab === 'coach' && (
                <>
                  <Button variant="outline" onClick={() => setViewMode('dashboard')}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => setViewMode('import')}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                  <Button onClick={handleCoachCreateNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Protocol
                  </Button>
                </>
              )}
              {activeTab === 'mio' && (
                <Button onClick={handleMioCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  New MIO Protocol
                </Button>
              )}
            </div>
          </div>

          {/* Coach Protocols Tab (V2) */}
          <TabsContent value="coach" className="mt-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Protocols</p>
                      <p className="text-2xl font-bold">{coachProtocols.length}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Published</p>
                      <p className="text-2xl font-bold text-green-600">
                        {coachProtocols.filter((p) => p.status === 'published').length}
                      </p>
                    </div>
                    <Send className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Drafts</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {coachProtocols.filter((p) => p.status === 'draft').length}
                      </p>
                    </div>
                    <Edit className="h-8 w-8 text-amber-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Multi-Week</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {coachProtocols.filter((p) => p.total_weeks > 1).length}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Protocol List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : coachProtocols.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No coach protocols yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a multi-week coaching protocol or import from CSV
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => setViewMode('import')}>
                      <Upload className="mr-2 h-4 w-4" />
                      Import
                    </Button>
                    <Button onClick={handleCoachCreateNew}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Protocol
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {coachProtocols.map((protocol) => (
                  <Card key={protocol.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: protocol.theme_color }}
                            />
                            <h3 className="text-lg font-semibold truncate">{protocol.title}</h3>
                            {getStatusBadge(protocol.status)}
                            <Badge variant="outline">{protocol.total_weeks} week(s)</Badge>
                            {protocol.import_source !== 'manual' && (
                              <Badge variant="secondary" className="text-xs">
                                {protocol.import_source}
                              </Badge>
                            )}
                          </div>
                          {protocol.description && (
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                              {protocol.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {protocol.visibility === 'all_users'
                                ? 'All Users'
                                : protocol.visibility === 'tier_based'
                                ? 'Tier-based'
                                : protocol.visibility === 'custom_group'
                                ? 'Custom Groups'
                                : 'Individual'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {protocol.schedule_type === 'immediate'
                                ? 'Start Immediately'
                                : protocol.start_date
                                ? `Starts ${new Date(protocol.start_date).toLocaleDateString()}`
                                : protocol.schedule_type}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCoachEdit(protocol)}
                            disabled={isProcessing}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {protocol.status === 'published' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCoachAssign(protocol)}
                                disabled={isProcessing}
                                className="text-blue-600"
                                title="Assign to Users"
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewAssignedUsers(protocol)}
                                disabled={isProcessing}
                                className="text-cyan-600"
                                title="View Assigned Users"
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {protocol.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCoachStatusChange(protocol.id, 'published')}
                              disabled={isProcessing}
                              className="text-green-600"
                              title="Publish"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {protocol.status === 'published' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCoachStatusChange(protocol.id, 'archived')}
                              disabled={isProcessing}
                              className="text-amber-600"
                              title="Archive"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCoachDelete(protocol.id)}
                            disabled={isProcessing}
                            className="text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* MIO Protocols Tab (Legacy) */}
          <TabsContent value="mio" className="mt-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Protocols</p>
                      <p className="text-2xl font-bold">{mioProtocols.length}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Published</p>
                      <p className="text-2xl font-bold text-green-600">
                        {mioProtocols.filter((p) => p.status === 'published').length}
                      </p>
                    </div>
                    <Send className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Drafts</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {mioProtocols.filter((p) => p.status === 'draft').length}
                      </p>
                    </div>
                    <Edit className="h-8 w-8 text-amber-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Protocol List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : mioProtocols.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No MIO protocols yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first 7-day MIO protocol
                  </p>
                  <Button onClick={handleMioCreateNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Protocol
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {mioProtocols.map((protocol) => (
                  <Card key={protocol.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {protocol.theme_color && (
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: protocol.theme_color }}
                              />
                            )}
                            <h3 className="text-lg font-semibold truncate">{protocol.title}</h3>
                            {getStatusBadge(protocol.status)}
                            <Badge variant="outline">7 days</Badge>
                          </div>
                          {protocol.description && (
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                              {protocol.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {protocol.schedule_type === 'weekly_cycle'
                                ? `Week ${protocol.cycle_week_number} of cycle`
                                : protocol.schedule_type === 'evergreen'
                                ? 'Evergreen'
                                : `Starting ${protocol.start_date}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {protocol.visibility === 'all_users'
                                ? 'All Users'
                                : protocol.visibility === 'tier_based'
                                ? `Tiers: ${protocol.target_tiers.join(', ')}`
                                : 'Individual'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMioEdit(protocol)}
                            disabled={isProcessing}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMioDuplicate(protocol.id)}
                            disabled={isProcessing}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {protocol.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMioStatusChange(protocol.id, 'published')}
                              disabled={isProcessing}
                              className="text-green-600"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {protocol.status === 'published' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMioStatusChange(protocol.id, 'archived')}
                              disabled={isProcessing}
                              className="text-amber-600"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMioDelete(protocol.id)}
                            disabled={isProcessing}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign Dialog */}
      {renderAssignDialog()}
    </SidebarLayout>
  );
}
