// AssignedUsersList Component
// Shows all users currently assigned to a coach protocol with progress info

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  User,
  Search,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CoachProtocolV2, AssignmentStatus } from '@/types/coach-protocol';

interface AssignedUser {
  id: string; // assignment id
  user_id: string;
  full_name: string | null;
  email: string | null;
  assignment_slot: 'primary' | 'secondary';
  status: AssignmentStatus;
  current_week: number;
  current_day: number;
  started_at: string | null;
  completed_at: string | null;
  days_completed: number;
  days_skipped: number;
}

interface AssignedUsersListProps {
  protocol: CoachProtocolV2;
  onBack: () => void;
}

export function AssignedUsersList({ protocol, onBack }: AssignedUsersListProps) {
  const { toast } = useToast();
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [userToRemove, setUserToRemove] = useState<AssignedUser | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const totalDays = protocol.total_weeks * 7;

  const fetchAssignedUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('user_coach_protocol_assignments')
        .select(`
          id,
          user_id,
          assignment_slot,
          status,
          current_week,
          current_day,
          started_at,
          completed_at,
          days_completed,
          days_skipped,
          user:user_profiles!user_coach_protocol_assignments_user_id_fkey(
            full_name,
            email
          )
        `)
        .eq('protocol_id', protocol.id)
        .order('started_at', { ascending: false });

      if (error) throw error;

      // Transform data to include user profile info
      const users: AssignedUser[] = (data || []).map((assignment: Record<string, unknown>) => {
        const profile = assignment.user as Record<string, unknown>;
        return {
          id: assignment.id as string,
          user_id: assignment.user_id as string,
          full_name: profile?.full_name as string | null,
          email: profile?.email as string | null,
          assignment_slot: assignment.assignment_slot as 'primary' | 'secondary',
          status: assignment.status as AssignmentStatus,
          current_week: assignment.current_week as number,
          current_day: assignment.current_day as number,
          started_at: assignment.started_at as string | null,
          completed_at: assignment.completed_at as string | null,
          days_completed: assignment.days_completed as number,
          days_skipped: assignment.days_skipped as number,
        };
      });

      setAssignedUsers(users);
    } catch (error) {
      console.error('Error fetching assigned users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assigned users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [protocol.id, toast]);

  useEffect(() => {
    fetchAssignedUsers();
  }, [fetchAssignedUsers]);

  const handleRemoveUser = async () => {
    if (!userToRemove) return;

    try {
      setIsRemoving(true);

      const { error } = await supabase
        .from('user_coach_protocol_assignments')
        .update({ status: 'abandoned' })
        .eq('id', userToRemove.id);

      if (error) throw error;

      toast({
        title: 'User Removed',
        description: `${userToRemove.full_name || userToRemove.email} has been removed from this protocol.`,
      });

      setShowRemoveDialog(false);
      setUserToRemove(null);
      fetchAssignedUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove user from protocol',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const getStatusBadge = (status: AssignmentStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Play className="h-3 w-3 mr-1" />Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Pause className="h-3 w-3 mr-1" />Paused</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'abandoned':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30"><XCircle className="h-3 w-3 mr-1" />Removed</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const calculateProgress = (user: AssignedUser) => {
    const currentAbsoluteDay = (user.current_week - 1) * 7 + user.current_day;
    return Math.round((currentAbsoluteDay / totalDays) * 100);
  };

  const filteredUsers = assignedUsers.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  // Stats
  const activeCount = assignedUsers.filter(u => u.status === 'active').length;
  const completedCount = assignedUsers.filter(u => u.status === 'completed').length;
  const pausedCount = assignedUsers.filter(u => u.status === 'paused').length;
  const abandonedCount = assignedUsers.filter(u => u.status === 'abandoned').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-mi-gold" />
            Assigned Users
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {protocol.title} - {assignedUsers.length} total assignment(s)
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Protocols
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-mi-navy-light border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-400">{activeCount}</p>
              </div>
              <Play className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-mi-navy-light border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-blue-400">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-mi-navy-light border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Paused</p>
                <p className="text-2xl font-bold text-yellow-400">{pausedCount}</p>
              </div>
              <Pause className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-mi-navy-light border-gray-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Removed</p>
                <p className="text-2xl font-bold text-gray-400">{abandonedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-mi-navy-light border-mi-gold/30 text-white"
        />
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-mi-gold" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Alert className="bg-mi-navy-light border-mi-gold/30">
          <Users className="h-4 w-4" />
          <AlertTitle className="text-white">No Users Assigned</AlertTitle>
          <AlertDescription className="text-gray-400">
            {searchQuery
              ? 'No users match your search query.'
              : 'No users have been assigned to this protocol yet. Use the Individual visibility setting when saving the protocol to auto-assign users.'}
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="bg-mi-navy-light border-mi-gold/30">
          <Table>
            <TableHeader>
              <TableRow className="border-mi-gold/20 hover:bg-transparent">
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Slot</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Progress</TableHead>
                <TableHead className="text-gray-400">Started</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-mi-gold/10 hover:bg-mi-gold/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-mi-gold/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-mi-gold" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {user.full_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {user.assignment_slot}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="space-y-1 min-w-[120px]">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">
                          W{user.current_week} D{user.current_day}
                        </span>
                        <span className="text-mi-gold">{calculateProgress(user)}%</span>
                      </div>
                      <Progress value={calculateProgress(user)} className="h-1.5 bg-mi-gold/20" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {user.started_at
                        ? new Date(user.started_at).toLocaleDateString()
                        : 'Not started'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.status !== 'abandoned' && user.status !== 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUserToRemove(user);
                          setShowRemoveDialog(true);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Remove Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="bg-mi-navy-light border-mi-gold/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Remove User from Protocol?
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This will remove{' '}
              <span className="text-white font-medium">
                {userToRemove?.full_name || userToRemove?.email}
              </span>{' '}
              from "{protocol.title}". Their progress will be marked as abandoned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveDialog(false);
                setUserToRemove(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveUser}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AssignedUsersList;
