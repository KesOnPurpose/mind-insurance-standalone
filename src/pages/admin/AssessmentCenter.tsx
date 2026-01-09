// Assessment Center - Admin Page
// Manage assessment invitations for Mind Insurance users
// Follows the same pattern as ReportManagement.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import {
  ClipboardCheck,
  Brain,
  Zap,
  Target,
  Users,
  User,
  Send,
  Search,
  Filter,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  PlayCircle,
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  BarChart3,
  Compass,
  Edit3,
  CheckSquare,
  Square,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  useAllInvitations,
  useCreateInvitation,
  ASSESSMENT_INFO,
  type AssessmentType,
  type InvitationStatus,
  type AssessmentInvitation,
} from '@/hooks/useAssessmentInvitations';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  user_id: string;
  tier: string;
}

interface MIOUserGroup {
  id: string;
  name: string;
  description: string | null;
  group_type: 'auto' | 'custom';
}

type AdminTab = 'assignments' | 'results' | 'stats';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<InvitationStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Pending', icon: <Clock className="w-4 h-4" />, color: 'bg-amber-500/20 text-amber-400' },
  started: { label: 'Started', icon: <PlayCircle className="w-4 h-4" />, color: 'bg-blue-500/20 text-blue-400' },
  completed: { label: 'Completed', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-green-500/20 text-green-400' },
  declined: { label: 'Declined', icon: <XCircle className="w-4 h-4" />, color: 'bg-red-500/20 text-red-400' },
};

const ASSESSMENT_TYPE_CONFIG: Record<AssessmentType, { label: string; icon: React.ReactNode; color: string; week: number }> = {
  identity_collision: { label: 'Identity Collision', icon: <Target className="w-4 h-4" />, color: 'text-orange-400', week: 1 },
  temperament: { label: 'Internal Wiring', icon: <Zap className="w-4 h-4" />, color: 'text-mi-cyan', week: 2 },
  mental_pillar: { label: 'Mental Pillar Baseline', icon: <Compass className="w-4 h-4" />, color: 'text-purple-400', week: 2 },
  sub_pattern: { label: 'Sub-Pattern Deep Dive', icon: <Target className="w-4 h-4" />, color: 'text-red-400', week: 3 },
  avatar_deep: { label: 'Avatar Deep Dive', icon: <Brain className="w-4 h-4" />, color: 'text-amber-400', week: 4 },
  inner_wiring_discovery: { label: 'Inner Wiring (Legacy)', icon: <Zap className="w-4 h-4" />, color: 'text-gray-400', week: 2 },
};

// Helper to call the admin-group-management Edge Function
async function callAdminGroupAPI(action: string, data?: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await supabase.functions.invoke('admin-group-management', {
    body: { action, data },
  });

  if (response.error) {
    throw new Error(response.error.message || 'API call failed');
  }

  if (!response.data?.success) {
    throw new Error(response.data?.error || 'Operation failed');
  }

  return response.data;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AssessmentCenter() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<AdminTab>('assignments');

  // Data state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<MIOUserGroup[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Assignment dialog state
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [targetMode, setTargetMode] = useState<'user' | 'group'>('user');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<AssessmentType>('mental_pillar');
  const [customReason, setCustomReason] = useState<string>('');
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Multi-select state
  const [selectedInvitations, setSelectedInvitations] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Select All Users state
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [bulkAssignProgress, setBulkAssignProgress] = useState({ current: 0, total: 0 });

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingInvitation, setEditingInvitation] = useState<AssessmentInvitation | null>(null);
  const [editReason, setEditReason] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Hooks
  const { data: invitations = [], isLoading: isLoadingInvitations, refetch: refetchInvitations } = useAllInvitations({
    status: filterStatus !== 'all' ? filterStatus as InvitationStatus : undefined,
    assessmentType: filterType !== 'all' ? filterType as AssessmentType : undefined,
  });
  const createInvitation = useCreateInvitation();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const result = await callAdminGroupAPI('list_users');
      setUsers((result.data || []) as UserProfile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const result = await callAdminGroupAPI('list_groups');
      setGroups((result.data || []) as MIOUserGroup[]);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAssignAssessment = async () => {
    if (targetMode === 'user' && !selectedUserId) {
      toast({ title: 'Error', description: 'Please select a user', variant: 'destructive' });
      return;
    }
    if (targetMode === 'group' && !selectedGroupId) {
      toast({ title: 'Error', description: 'Please select a group', variant: 'destructive' });
      return;
    }

    setIsAssigning(true);

    try {
      if (targetMode === 'user') {
        // Single user assignment
        await createInvitation.mutateAsync({
          userId: selectedUserId,
          assessmentType: selectedAssessmentType,
          invitedBy: 'admin',
          invitedByUserId: user?.id,
          reason: customReason || ASSESSMENT_INFO[selectedAssessmentType].description,
        });

        toast({
          title: 'Success',
          description: 'Assessment invitation sent',
        });
      } else {
        // Group assignment - get group members first
        const result = await callAdminGroupAPI('get_group_members', { groupId: selectedGroupId });
        const members = result.data as Array<{ user_id: string }>;

        if (!members || members.length === 0) {
          toast({
            title: 'Warning',
            description: 'No users in this group',
            variant: 'destructive',
          });
          return;
        }

        // Create invitations for all group members
        for (const member of members) {
          if (member.user_id) {
            await createInvitation.mutateAsync({
              userId: member.user_id,
              assessmentType: selectedAssessmentType,
              invitedBy: 'admin',
              invitedByUserId: user?.id,
              reason: customReason || ASSESSMENT_INFO[selectedAssessmentType].description,
            });
          }
        }

        toast({
          title: 'Success',
          description: `Assessment invitations sent to ${members.length} users`,
        });
      }

      // Reset and close
      setShowAssignDialog(false);
      setSelectedUserId('');
      setSelectedGroupId('');
      setCustomReason('');
      refetchInvitations();
    } catch (error) {
      console.error('Error assigning assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('assessment_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Invitation deleted' });
      refetchInvitations();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invitation',
        variant: 'destructive',
      });
    }
  };

  // Toggle single invitation selection
  const handleToggleSelect = (invitationId: string) => {
    setSelectedInvitations(prev => {
      const next = new Set(prev);
      if (next.has(invitationId)) {
        next.delete(invitationId);
      } else {
        next.add(invitationId);
      }
      return next;
    });
  };

  // Toggle all invitations
  const handleToggleSelectAll = () => {
    if (selectedInvitations.size === invitations.length) {
      setSelectedInvitations(new Set());
    } else {
      setSelectedInvitations(new Set(invitations.map(i => i.id)));
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedInvitations.size === 0) return;

    setIsBulkDeleting(true);
    try {
      const { error } = await supabase
        .from('assessment_invitations')
        .delete()
        .in('id', Array.from(selectedInvitations));

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${selectedInvitations.size} invitation(s) deleted`
      });
      setSelectedInvitations(new Set());
      setShowBulkDeleteDialog(false);
      refetchInvitations();
    } catch (error) {
      console.error('Error bulk deleting invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invitations',
        variant: 'destructive',
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Open edit dialog
  const handleOpenEdit = (invitation: AssessmentInvitation) => {
    setEditingInvitation(invitation);
    setEditReason(invitation.reason || '');
    setShowEditDialog(true);
  };

  // Update invitation
  const handleUpdateInvitation = async () => {
    if (!editingInvitation) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('assessment_invitations')
        .update({
          reason: editReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingInvitation.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Invitation updated' });
      setShowEditDialog(false);
      setEditingInvitation(null);
      refetchInvitations();
    } catch (error) {
      console.error('Error updating invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invitation',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Add more users with pre-selected assessment type
  const handleAddMoreUsers = () => {
    // Pre-select the filtered assessment type if one is selected
    if (filterType !== 'all') {
      setSelectedAssessmentType(filterType as AssessmentType);
    }
    setShowAssignDialog(true);
  };

  // Assign assessment to ALL users in the system
  const handleAssignToAllUsers = async () => {
    if (users.length === 0) {
      toast({ title: 'No users', description: 'No users found in the system', variant: 'destructive' });
      return;
    }

    setSelectAllMode(true);
    setBulkAssignProgress({ current: 0, total: users.length });

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < users.length; i++) {
      try {
        await createInvitation.mutateAsync({
          userId: users[i].user_id,
          assessmentType: selectedAssessmentType,
          invitedBy: 'admin',
          invitedByUserId: user?.id,
          reason: customReason || ASSESSMENT_INFO[selectedAssessmentType].description,
        });
        successCount++;
      } catch {
        // Skip duplicates or errors silently
        skipCount++;
      }
      setBulkAssignProgress({ current: i + 1, total: users.length });
    }

    setSelectAllMode(false);
    setBulkAssignProgress({ current: 0, total: 0 });
    setShowAssignDialog(false);
    setCustomReason('');
    refetchInvitations();

    toast({
      title: 'Bulk Assignment Complete',
      description: `Sent ${successCount} invitation${successCount !== 1 ? 's' : ''}${skipCount > 0 ? ` (${skipCount} skipped - already assigned)` : ''}`,
    });
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const filteredUsers = users.filter(u =>
    userSearchQuery === '' ||
    u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const selectedUser = users.find(u => u.user_id === selectedUserId);

  // Stats
  const stats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    completed: invitations.filter(i => i.status === 'completed').length,
    completionRate: invitations.length > 0
      ? Math.round((invitations.filter(i => i.status === 'completed').length / invitations.length) * 100)
      : 0,
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-mi-navy p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <ClipboardCheck className="w-6 h-6 text-mi-cyan" />
                Assessment Center
              </h1>
              <p className="text-gray-400 text-sm">
                Manage assessment invitations for Mind Insurance users
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowAssignDialog(true)}
            className="bg-mi-cyan hover:bg-mi-cyan/80 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Assign Assessment
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-mi-navy-light border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Invitations</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <ClipboardCheck className="w-8 h-8 text-mi-cyan opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-mi-navy-light border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-mi-navy-light border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-mi-navy-light border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold text-mi-cyan">{stats.completionRate}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-mi-cyan opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)}>
          <TabsList className="bg-mi-navy-light border border-white/10 mb-6">
            <TabsTrigger value="assignments" className="data-[state=active]:bg-mi-cyan/20">
              <Send className="w-4 h-4 mr-2" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-mi-cyan/20">
              <Eye className="w-4 h-4 mr-2" />
              Results
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-mi-cyan/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            {/* Filters and Actions Bar */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 bg-mi-navy-light border-white/10 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="started">Started</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48 bg-mi-navy-light border-white/10 text-white">
                    <SelectValue placeholder="Assessment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="identity_collision">Identity Collision (Week 1)</SelectItem>
                    <SelectItem value="temperament">Internal Wiring (Week 2)</SelectItem>
                    <SelectItem value="mental_pillar">Mental Pillar Baseline (Week 2)</SelectItem>
                    <SelectItem value="sub_pattern">Sub-Pattern Deep Dive (Week 3)</SelectItem>
                    <SelectItem value="avatar_deep">Avatar Deep Dive (Week 4)</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => refetchInvitations()}
                  className="border-white/10 text-gray-400 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Add More Users Button */}
              <Button
                onClick={handleAddMoreUsers}
                variant="outline"
                className="border-mi-cyan/50 text-mi-cyan hover:bg-mi-cyan/10"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add More Users
              </Button>
            </div>

            {/* Bulk Action Bar - shows when items selected */}
            {selectedInvitations.size > 0 && (
              <div className="flex items-center justify-between bg-mi-cyan/10 border border-mi-cyan/30 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-5 h-5 text-mi-cyan" />
                  <span className="text-white font-medium">
                    {selectedInvitations.size} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedInvitations(new Set())}
                    className="text-gray-400 hover:text-white"
                  >
                    Clear Selection
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBulkDeleteDialog(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            )}

            {/* Invitations List */}
            {isLoadingInvitations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-mi-cyan" />
                <span className="ml-2 text-gray-400">Loading invitations...</span>
              </div>
            ) : invitations.length === 0 ? (
              <Card className="bg-mi-navy-light border-white/10 p-8 text-center">
                <ClipboardCheck className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Invitations</h3>
                <p className="text-gray-400 mb-4">
                  No assessment invitations found. Click "Assign Assessment" to get started.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Select All Header */}
                {invitations.length > 0 && (
                  <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400">
                    <Checkbox
                      checked={selectedInvitations.size === invitations.length && invitations.length > 0}
                      onCheckedChange={handleToggleSelectAll}
                      className="border-white/30 data-[state=checked]:bg-mi-cyan data-[state=checked]:border-mi-cyan"
                    />
                    <span>Select All ({invitations.length})</span>
                  </div>
                )}

                {invitations.map((invitation) => {
                  const typeConfig = ASSESSMENT_TYPE_CONFIG[invitation.assessment_type as AssessmentType];
                  const statusConfig = STATUS_CONFIG[invitation.status as InvitationStatus];
                  const invitedUser = users.find(u => u.user_id === invitation.user_id);
                  const isSelected = selectedInvitations.has(invitation.id);

                  return (
                    <Card
                      key={invitation.id}
                      className={`bg-mi-navy-light border-white/10 hover:border-mi-cyan/30 transition-colors ${
                        isSelected ? 'border-mi-cyan/50 bg-mi-cyan/5' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Checkbox */}
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelect(invitation.id)}
                              className="border-white/30 data-[state=checked]:bg-mi-cyan data-[state=checked]:border-mi-cyan"
                            />

                            {/* Assessment Type Icon */}
                            <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${typeConfig?.color}`}>
                              {typeConfig?.icon}
                            </div>

                            {/* Info */}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">
                                  {typeConfig?.label || invitation.assessment_type}
                                </span>
                                <Badge className={statusConfig?.color}>
                                  {statusConfig?.icon}
                                  <span className="ml-1">{statusConfig?.label}</span>
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                <User className="w-3 h-3" />
                                {invitedUser?.full_name || invitedUser?.email || invitation.user_id}
                                <span className="text-gray-600">•</span>
                                <Calendar className="w-3 h-3" />
                                {format(new Date(invitation.created_at), 'MMM d, yyyy')}
                              </div>
                              {invitation.reason && (
                                <p className="text-sm text-gray-500 mt-1 max-w-md truncate">{invitation.reason}</p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(invitation)}
                              className="text-gray-400 hover:text-mi-cyan"
                              title="Edit invitation"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteInvitation(invitation.id)}
                              className="text-gray-400 hover:text-red-400"
                              title="Delete invitation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card className="bg-mi-navy-light border-white/10 p-8 text-center">
              <Eye className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Assessment Results</h3>
              <p className="text-gray-400">
                View completed assessment results and user insights. Coming soon.
              </p>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="stats">
            <Card className="bg-mi-navy-light border-white/10 p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Assessment Analytics</h3>
              <p className="text-gray-400">
                View assessment completion trends and patterns. Coming soon.
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assign Assessment Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent className="bg-mi-navy border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-mi-cyan" />
                Assign Assessment
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Send an assessment invitation to a user or group
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Assessment Type - First so Select All knows what type */}
              <div className="space-y-2">
                <Label className="text-white/90">Assessment Type</Label>
                <Select
                  value={selectedAssessmentType}
                  onValueChange={(v) => setSelectedAssessmentType(v as AssessmentType)}
                  disabled={selectAllMode}
                >
                  <SelectTrigger className="bg-mi-navy-light border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-mi-navy border-white/10">
                    <SelectItem value="identity_collision" className="text-white hover:bg-white/10 focus:bg-white/10">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-orange-400" />
                        Identity Collision (Week 1)
                      </div>
                    </SelectItem>
                    <SelectItem value="temperament" className="text-white hover:bg-white/10 focus:bg-white/10">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-mi-cyan" />
                        Internal Wiring (Week 2)
                      </div>
                    </SelectItem>
                    <SelectItem value="mental_pillar" className="text-white hover:bg-white/10 focus:bg-white/10">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-purple-400" />
                        Mental Pillar Baseline (Week 2)
                      </div>
                    </SelectItem>
                    <SelectItem value="sub_pattern" className="text-white hover:bg-white/10 focus:bg-white/10">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-red-400" />
                        Sub-Pattern Deep Dive (Week 3)
                      </div>
                    </SelectItem>
                    <SelectItem value="avatar_deep" className="text-white hover:bg-white/10 focus:bg-white/10">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-amber-400" />
                        Avatar Deep Dive (Week 4)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {ASSESSMENT_INFO[selectedAssessmentType].description}
                </p>
              </div>

              {/* Select All Users Option */}
              <div className="border border-mi-cyan/30 rounded-lg p-4 bg-mi-cyan/5">
                <Button
                  variant="outline"
                  onClick={handleAssignToAllUsers}
                  disabled={selectAllMode || isAssigning || isLoadingUsers}
                  className="w-full border-mi-cyan/50 text-mi-cyan hover:bg-mi-cyan/10 hover:text-mi-cyan"
                >
                  {selectAllMode ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Assigning to {bulkAssignProgress.current}/{bulkAssignProgress.total} users...
                    </>
                  ) : isLoadingUsers ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading users...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Select All Users ({users.length})
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Assign this assessment to all {users.length} users in the system
                </p>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-mi-navy px-2 text-gray-500">Or select individually</span>
                </div>
              </div>

              {/* Target Mode */}
              <div className="space-y-2">
                <Label className="text-white/90">Send To</Label>
                <div className="flex gap-2">
                  <Button
                    variant={targetMode === 'user' ? 'default' : 'outline'}
                    onClick={() => setTargetMode('user')}
                    disabled={selectAllMode}
                    className={targetMode === 'user' ? 'bg-mi-cyan hover:bg-mi-cyan/80 text-white' : 'border-white/20 text-white/70 hover:text-white hover:bg-white/5'}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Individual User
                  </Button>
                  <Button
                    variant={targetMode === 'group' ? 'default' : 'outline'}
                    onClick={() => setTargetMode('group')}
                    disabled={selectAllMode}
                    className={targetMode === 'group' ? 'bg-mi-cyan hover:bg-mi-cyan/80 text-white' : 'border-white/20 text-white/70 hover:text-white hover:bg-white/5'}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    User Group
                  </Button>
                </div>
              </div>

              {/* User Selection */}
              {targetMode === 'user' && (
                <div className="space-y-2">
                  <Label className="text-white/90">Select User</Label>
                  <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={selectAllMode}
                        className="w-full justify-between bg-mi-navy-light border-white/10 text-white hover:bg-white/5"
                      >
                        {selectedUser ? (
                          <span>{selectedUser.full_name || selectedUser.email}</span>
                        ) : (
                          <span className="text-gray-400">Search users...</span>
                        )}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 bg-mi-navy border-white/10" align="start">
                      <Command className="bg-mi-navy">
                        <CommandInput
                          placeholder="Search by name or email..."
                          value={userSearchQuery}
                          onValueChange={setUserSearchQuery}
                          className="text-white border-white/10"
                        />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty className="text-gray-400 p-4 text-center">
                            No users found
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredUsers.slice(0, 10).map((u) => (
                              <CommandItem
                                key={u.id}
                                value={u.user_id}
                                onSelect={() => {
                                  setSelectedUserId(u.user_id);
                                  setUserSearchOpen(false);
                                }}
                                className="text-white hover:bg-white/10 cursor-pointer aria-selected:bg-mi-cyan/20"
                              >
                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                <div>
                                  <div className="font-medium">{u.full_name || 'Unnamed'}</div>
                                  <div className="text-xs text-gray-500">{u.email}</div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Group Selection */}
              {targetMode === 'group' && (
                <div className="space-y-2">
                  <Label className="text-white/90">Select Group</Label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={selectAllMode}>
                    <SelectTrigger className="bg-mi-navy-light border-white/10 text-white">
                      <SelectValue placeholder="Select a group..." />
                    </SelectTrigger>
                    <SelectContent className="bg-mi-navy border-white/10">
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id} className="text-white hover:bg-white/10 focus:bg-white/10">
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom Reason */}
              <div className="space-y-2">
                <Label className="text-white/90">Custom Message (Optional)</Label>
                <Textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Add a personalized message explaining why this assessment is recommended..."
                  className="bg-mi-navy-light border-white/10 text-white placeholder:text-gray-500 min-h-[80px]"
                  disabled={selectAllMode}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAssignDialog(false)}
                disabled={selectAllMode}
                className="border-white/20 text-white/70 hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignAssessment}
                disabled={isAssigning || selectAllMode || (targetMode === 'user' && !selectedUserId) || (targetMode === 'group' && !selectedGroupId)}
                className="bg-mi-cyan hover:bg-mi-cyan/80 text-white"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Invitation Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-mi-navy border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-mi-cyan" />
                Edit Invitation
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Update the invitation message for this assessment
              </DialogDescription>
            </DialogHeader>

            {editingInvitation && (
              <div className="space-y-4 py-4">
                {/* Display invitation info */}
                <div className="bg-white/5 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Assessment:</span>
                    <span className="text-white font-medium">
                      {ASSESSMENT_TYPE_CONFIG[editingInvitation.assessment_type as AssessmentType]?.label || editingInvitation.assessment_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">User:</span>
                    <span className="text-white">
                      {users.find(u => u.user_id === editingInvitation.user_id)?.full_name ||
                       users.find(u => u.user_id === editingInvitation.user_id)?.email ||
                       editingInvitation.user_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Status:</span>
                    <Badge className={STATUS_CONFIG[editingInvitation.status as InvitationStatus]?.color}>
                      {STATUS_CONFIG[editingInvitation.status as InvitationStatus]?.label}
                    </Badge>
                  </div>
                </div>

                {/* Edit Reason */}
                <div className="space-y-2">
                  <Label>Message / Reason</Label>
                  <Textarea
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="Add or update the invitation message..."
                    className="bg-mi-navy-light border-white/10 text-white min-h-[100px]"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingInvitation(null);
                }}
                className="border-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateInvitation}
                disabled={isUpdating}
                className="bg-mi-cyan hover:bg-mi-cyan/80"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <AlertDialogContent className="bg-mi-navy border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Delete {selectedInvitations.size} Invitation{selectedInvitations.size > 1 ? 's' : ''}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                This action cannot be undone. The selected assessment invitations will be permanently removed.
                Users will no longer see these pending assessments in their dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SidebarLayout>
  );
}
