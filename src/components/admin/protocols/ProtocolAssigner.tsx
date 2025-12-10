// ProtocolAssigner Component
// Assigns coach protocols to individuals or groups with slot management

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  User,
  Search,
  X,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { assignToUsers, assignToGroup } from '@/services/coachProtocolV2Service';
import type { AssignmentSlot, CoachProtocolV2 } from '@/types/coach-protocol';

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

interface ExistingAssignment {
  user_id: string;
  protocol_id: string;
  protocol_title: string;
  assignment_slot: AssignmentSlot;
  status: string;
}

interface ProtocolAssignerProps {
  protocol: CoachProtocolV2;
  onAssigned?: () => void;
  onCancel?: () => void;
}

type TargetType = 'individual' | 'custom_group' | 'multiple_groups';
type StartOption = 'immediate' | 'specific_date' | 'next_monday';

export function ProtocolAssigner({
  protocol,
  onAssigned,
  onCancel,
}: ProtocolAssignerProps) {
  const { toast } = useToast();

  // State
  const [targetType, setTargetType] = useState<TargetType>('individual');
  const [slot, setSlot] = useState<AssignmentSlot>('primary');
  const [startOption, setStartOption] = useState<StartOption>('immediate');
  const [startDate, setStartDate] = useState<string>('');
  const [overrideConflicts, setOverrideConflicts] = useState(false);

  // User selection state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Group selection state
  const [groups, setGroups] = useState<MIOUserGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // Conflict detection
  const [conflicts, setConflicts] = useState<ExistingAssignment[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  // Assignment progress
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentProgress, setAssignmentProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch users for individual selection
  useEffect(() => {
    if (targetType === 'individual') {
      fetchUsers();
    }
  }, [targetType]);

  // Fetch groups for group selection
  useEffect(() => {
    if (targetType === 'custom_group' || targetType === 'multiple_groups') {
      fetchGroups();
    }
  }, [targetType]);

  // Check for conflicts when selection changes
  useEffect(() => {
    if (selectedUserIds.length > 0 || selectedGroupIds.length > 0) {
      checkConflicts();
    } else {
      setConflicts([]);
    }
  }, [selectedUserIds, selectedGroupIds, slot]);

  const fetchUsers = async () => {
    try {
      const result = await callAdminGroupAPI('list_users');
      setUsers((result.data || []) as UserProfile[]);
    } catch (error) {
      console.error('[ProtocolAssigner] Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('mio_user_groups')
        .select('*')
        .eq('group_type', 'custom')
        .order('name', { ascending: true });

      if (error) throw error;
      setGroups((data as MIOUserGroup[]) || []);
    } catch (error) {
      console.error('[ProtocolAssigner] Error fetching groups:', error);
    }
  };

  const checkConflicts = useCallback(async () => {
    setIsCheckingConflicts(true);
    try {
      let userIdsToCheck: string[] = [];

      if (targetType === 'individual') {
        userIdsToCheck = selectedUserIds;
      } else if (targetType === 'custom_group' || targetType === 'multiple_groups') {
        // Get users from selected groups
        const { data } = await supabase
          .from('mio_user_group_members')
          .select('user_id')
          .in('group_id', selectedGroupIds);
        userIdsToCheck = (data || []).map((m) => m.user_id);
      }

      if (userIdsToCheck.length === 0) {
        setConflicts([]);
        return;
      }

      // Check for existing assignments in the same slot
      const { data: existingAssignments } = await supabase
        .from('user_coach_protocol_assignments')
        .select(`
          user_id,
          protocol_id,
          assignment_slot,
          status,
          coach_protocols_v2!inner(title)
        `)
        .in('user_id', userIdsToCheck)
        .eq('assignment_slot', slot)
        .eq('status', 'active');

      const conflictList: ExistingAssignment[] = (existingAssignments || []).map((a: any) => ({
        user_id: a.user_id,
        protocol_id: a.protocol_id,
        protocol_title: a.coach_protocols_v2?.title || 'Unknown Protocol',
        assignment_slot: a.assignment_slot,
        status: a.status,
      }));

      setConflicts(conflictList);
    } catch (error) {
      console.error('[ProtocolAssigner] Error checking conflicts:', error);
    } finally {
      setIsCheckingConflicts(false);
    }
  }, [selectedUserIds, selectedGroupIds, slot, targetType]);

  const handleAddUser = (user: UserProfile) => {
    setSelectedUserIds((prev) => [...prev, user.user_id]);
    setUserSearchOpen(false);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const getStartDate = (): Date | undefined => {
    if (startOption === 'immediate') {
      return undefined; // Will use current date
    }
    if (startOption === 'specific_date' && startDate) {
      return new Date(startDate);
    }
    if (startOption === 'next_monday') {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      return nextMonday;
    }
    return undefined;
  };

  const handleAssign = async () => {
    setIsAssigning(true);
    setAssignmentProgress(0);

    try {
      const calculatedStartDate = getStartDate();
      let totalAssigned = 0;
      let totalFailed = 0;

      if (targetType === 'individual') {
        // Assign to individual users
        const results = await assignToUsers(
          protocol.id,
          selectedUserIds,
          slot,
          {
            startDate: calculatedStartDate,
            overrideExisting: overrideConflicts,
            onProgress: (progress) => setAssignmentProgress(progress),
          }
        );

        totalAssigned = results.filter((r) => r.success).length;
        totalFailed = results.filter((r) => !r.success).length;
      } else if (targetType === 'custom_group' || targetType === 'multiple_groups') {
        // Assign to each selected group
        for (let i = 0; i < selectedGroupIds.length; i++) {
          const groupId = selectedGroupIds[i];
          const results = await assignToGroup(protocol.id, groupId, slot, {
            startDate: calculatedStartDate,
            overrideExisting: overrideConflicts,
          });

          totalAssigned += results.filter((r) => r.success).length;
          totalFailed += results.filter((r) => !r.success).length;
          setAssignmentProgress(((i + 1) / selectedGroupIds.length) * 100);
        }
      }

      toast({
        title: 'Assignment Complete',
        description: `Successfully assigned to ${totalAssigned} user(s)${
          totalFailed > 0 ? `. ${totalFailed} failed.` : ''
        }`,
      });

      setShowConfirmDialog(false);
      onAssigned?.();
    } catch (error) {
      console.error('[ProtocolAssigner] Assignment error:', error);
      toast({
        title: 'Assignment Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
      setAssignmentProgress(0);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!userSearchQuery) return true;
    const query = userSearchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const availableUsers = filteredUsers.filter(
    (user) => !selectedUserIds.includes(user.user_id)
  );

  const totalSelectedCount =
    targetType === 'individual'
      ? selectedUserIds.length
      : selectedGroupIds.length;

  const canAssign = totalSelectedCount > 0 && (conflicts.length === 0 || overrideConflicts);

  return (
    <div className="space-y-6">
      {/* Protocol Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: protocol.theme_color }}
            />
            {protocol.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{protocol.total_weeks} week(s)</span>
            <span>•</span>
            <span>{protocol.status}</span>
          </div>
        </CardContent>
      </Card>

      {/* Target Type Selection */}
      <div className="space-y-3">
        <Label>Assign To</Label>
        <RadioGroup
          value={targetType}
          onValueChange={(v) => {
            setTargetType(v as TargetType);
            setSelectedUserIds([]);
            setSelectedGroupIds([]);
          }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="individual" id="individual" />
            <Label htmlFor="individual" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Individuals</span>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom_group" id="custom_group" />
            <Label htmlFor="custom_group" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Single Group</span>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="multiple_groups" id="multiple_groups" />
            <Label htmlFor="multiple_groups" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Multiple Groups</span>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* User Selection (Individual) */}
      {targetType === 'individual' && (
        <div className="space-y-3">
          <Label>Select Users</Label>

          <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Search className="mr-2 h-4 w-4" />
                <span className="text-muted-foreground">Search users...</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search by name or email..."
                  value={userSearchQuery}
                  onValueChange={setUserSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {availableUsers.slice(0, 15).map((user) => (
                      <CommandItem
                        key={user.id}
                        value={`${user.full_name || ''} ${user.email || ''}`}
                        onSelect={() => handleAddUser(user)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{user.full_name || 'No name'}</span>
                          {user.email && (
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedUserIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUserIds.map((userId) => {
                const user = users.find((u) => u.user_id === userId);
                return (
                  <Badge
                    key={userId}
                    variant="secondary"
                    className="flex items-center gap-1 py-1"
                  >
                    <User className="h-3 w-3" />
                    {user?.full_name || user?.email || userId.slice(0, 8)}
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(userId)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}

          {selectedUserIds.length === 0 && (
            <p className="text-sm text-muted-foreground">No users selected</p>
          )}
        </div>
      )}

      {/* Group Selection (Single or Multiple) */}
      {(targetType === 'custom_group' || targetType === 'multiple_groups') && (
        <div className="space-y-3">
          <Label>
            {targetType === 'custom_group' ? 'Select Group' : 'Select Groups'}
          </Label>

          {groups.length === 0 ? (
            <Alert>
              <AlertDescription>
                No custom groups found. Create a group in the User Groups tab first.
              </AlertDescription>
            </Alert>
          ) : targetType === 'custom_group' ? (
            <Select
              value={selectedGroupIds[0] || ''}
              onValueChange={(v) => setSelectedGroupIds([v])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex flex-col">
                      <span>{group.name}</span>
                      {group.description && (
                        <span className="text-xs text-muted-foreground">
                          {group.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded"
                >
                  <Checkbox
                    id={`group-${group.id}`}
                    checked={selectedGroupIds.includes(group.id)}
                    onCheckedChange={() => handleGroupToggle(group.id)}
                  />
                  <label
                    htmlFor={`group-${group.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">{group.name}</div>
                    {group.description && (
                      <div className="text-xs text-muted-foreground">
                        {group.description}
                      </div>
                    )}
                  </label>
                </div>
              ))}
            </div>
          )}

          {selectedGroupIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedGroupIds.length} group(s) selected
            </p>
          )}
        </div>
      )}

      {/* Assignment Slot */}
      <div className="space-y-3">
        <Label>Protocol Slot</Label>
        <RadioGroup
          value={slot}
          onValueChange={(v) => setSlot(v as AssignmentSlot)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="primary" id="slot-primary" />
            <Label htmlFor="slot-primary" className="cursor-pointer">
              Primary (Tab 1)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="secondary" id="slot-secondary" />
            <Label htmlFor="slot-secondary" className="cursor-pointer">
              Secondary (Tab 2)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Start Date Options */}
      <div className="space-y-3">
        <Label>Start Date</Label>
        <RadioGroup
          value={startOption}
          onValueChange={(v) => setStartOption(v as StartOption)}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="immediate" id="start-immediate" />
            <Label htmlFor="start-immediate" className="cursor-pointer">
              Start Immediately
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="next_monday" id="start-monday" />
            <Label htmlFor="start-monday" className="cursor-pointer flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Start Next Monday
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="specific_date" id="start-specific" />
            <Label htmlFor="start-specific" className="cursor-pointer">
              Specific Date
            </Label>
          </div>
        </RadioGroup>

        {startOption === 'specific_date' && (
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        )}
      </div>

      {/* Conflict Warning */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Slot Conflicts Detected</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">
              {conflicts.length} user(s) already have an active protocol in the{' '}
              {slot} slot:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {conflicts.slice(0, 5).map((c) => (
                <li key={c.user_id}>
                  User has "{c.protocol_title}" active
                </li>
              ))}
              {conflicts.length > 5 && (
                <li>...and {conflicts.length - 5} more</li>
              )}
            </ul>
            <div className="flex items-center space-x-2 mt-3">
              <Checkbox
                id="override"
                checked={overrideConflicts}
                onCheckedChange={(checked) =>
                  setOverrideConflicts(checked as boolean)
                }
              />
              <label htmlFor="override" className="text-sm cursor-pointer">
                Override existing assignments (will replace current protocols)
              </label>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isCheckingConflicts && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking for conflicts...
        </div>
      )}

      {/* Assignment Preview */}
      {totalSelectedCount > 0 && !isCheckingConflicts && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <span className="font-medium">Assignment Preview</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {targetType === 'individual'
                    ? `${selectedUserIds.length} user(s)`
                    : `${selectedGroupIds.length} group(s)`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {slot === 'primary' ? 'Primary Slot' : 'Secondary Slot'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!canAssign}
          className="flex-1"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Protocol
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Assignment</DialogTitle>
            <DialogDescription>
              You are about to assign "{protocol.title}" to{' '}
              {targetType === 'individual'
                ? `${selectedUserIds.length} user(s)`
                : `users in ${selectedGroupIds.length} group(s)`}
              .
              {conflicts.length > 0 && overrideConflicts && (
                <span className="block mt-2 text-destructive">
                  This will override {conflicts.length} existing assignment(s).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {isAssigning && (
            <div className="space-y-2 py-4">
              <Progress value={assignmentProgress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Assigning... {Math.round(assignmentProgress)}%
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={isAssigning}>
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Assignment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProtocolAssigner;
