// User Group Manager Component
// Phase 28: Create and manage custom user groups for report targeting
// Phase 29: Updated to use admin-group-management Edge Function for RLS bypass

import React, { useState, useEffect } from 'react';
import {
  Users,
  User,
  Search,
  X,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Loader2,
  Sparkles,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Helper to call the admin-group-management Edge Function
async function callAdminGroupAPI(action: string, data?: Record<string, any>) {
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
  id: string;              // gh_approved_users.id (for React key)
  full_name: string | null;
  email: string | null;
  user_id: string;         // user_profiles.id (for group membership FK)
  tier: string;
}

interface MIOUserGroup {
  id: string;
  name: string;
  description: string | null;
  group_type: 'auto' | 'custom';
  auto_criteria: Record<string, any> | null;
  created_at: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  added_at: string;
  user_profile?: UserProfile;
}

export function UserGroupManager() {
  const { toast } = useToast();

  // State
  const [groups, setGroups] = useState<MIOUserGroup[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [groupMembers, setGroupMembers] = useState<Record<string, GroupMember[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MIOUserGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  // Member management state
  const [addMemberGroupId, setAddMemberGroupId] = useState<string | null>(null);
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('mio_user_groups')
        .select('*')
        .order('group_type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setGroups((data as MIOUserGroup[]) || []);

      // Fetch members for custom groups
      const customGroups = (data || []).filter((g: MIOUserGroup) => g.group_type === 'custom');
      for (const group of customGroups) {
        await fetchGroupMembers(group.id);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load groups. Make sure to run the database migration first.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Use Edge Function to bypass RLS on gh_approved_users
      // Only returns users with user_id populated (they have signed up)
      const result = await callAdminGroupAPI('list_users');
      setUsers((result.data || []) as UserProfile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('mio_user_group_members')
        .select('id, user_id, added_at')
        .eq('group_id', groupId);

      if (error) throw error;

      // Enrich with user profiles (lookup by user_id field which maps to user_profiles.id)
      const enrichedMembers: GroupMember[] = (data || []).map((member) => ({
        ...member,
        user_profile: users.find((u) => u.user_id === member.user_id),
      }));

      setGroupMembers((prev) => ({ ...prev, [groupId]: enrichedMembers }));
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({ title: 'Error', description: 'Group name is required', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      // Use Edge Function to bypass RLS
      await callAdminGroupAPI('create_group', {
        name: groupName.trim(),
        description: groupDescription.trim() || null,
      });

      toast({ title: 'Success', description: 'Group created successfully' });
      setShowCreateDialog(false);
      setGroupName('');
      setGroupDescription('');
      fetchGroups();
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create group. Make sure you have admin access.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !groupName.trim()) return;

    setIsProcessing(true);
    try {
      // Use Edge Function to bypass RLS
      await callAdminGroupAPI('update_group', {
        id: editingGroup.id,
        name: groupName.trim(),
        description: groupDescription.trim() || null,
      });

      toast({ title: 'Success', description: 'Group updated successfully' });
      setEditingGroup(null);
      setGroupName('');
      setGroupDescription('');
      fetchGroups();
    } catch (error: any) {
      console.error('Error updating group:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update group',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? All members will be removed.')) return;

    try {
      // Use Edge Function to bypass RLS
      await callAdminGroupAPI('delete_group', { id: groupId });
      toast({ title: 'Success', description: 'Group deleted' });
      fetchGroups();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete group',
        variant: 'destructive',
      });
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!addMemberGroupId) return;

    try {
      // Use Edge Function to bypass RLS
      await callAdminGroupAPI('add_member', {
        group_id: addMemberGroupId,
        user_id: userId,
      });

      toast({ title: 'Success', description: 'Member added to group' });
      setMemberSearchOpen(false);
      fetchGroupMembers(addMemberGroupId);
    } catch (error: any) {
      console.error('Error adding member:', error);
      // Check for duplicate error
      if (error.message?.includes('duplicate') || error.message?.includes('23505')) {
        toast({ title: 'Info', description: 'User is already in this group' });
        return;
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to add member',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (groupId: string, memberId: string) => {
    try {
      // Use Edge Function to bypass RLS
      await callAdminGroupAPI('remove_member', { member_id: memberId });

      toast({ title: 'Success', description: 'Member removed from group' });
      fetchGroupMembers(groupId);
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (group: MIOUserGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || '');
  };

  const getAutoGroupDescription = (criteria: Record<string, any> | null): string => {
    if (!criteria) return 'Unknown criteria';

    switch (criteria.auto_group_type) {
      case 'by_pattern':
        return `Pattern: ${criteria.pattern?.replace('_', ' ') || 'any'}`;
      case 'by_temperament':
        return `Temperament: ${criteria.temperament || 'any'}`;
      case 'by_week':
        return `Week ${criteria.week || '?'}`;
      case 'by_streak_status':
        return `${criteria.days_since_practice || 3}+ days without practice`;
      case 'all':
        return 'All active users';
      default:
        return JSON.stringify(criteria);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!memberSearchQuery) return true;
    const query = memberSearchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const customGroups = groups.filter((g) => g.group_type === 'custom');
  const autoGroups = groups.filter((g) => g.group_type === 'auto');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">User Groups</h2>
          <p className="text-sm text-muted-foreground">
            Manage custom user groups for targeted report generation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchGroups} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Group
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Custom Groups */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Custom Groups ({customGroups.length})
            </h3>

            {customGroups.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No custom groups yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Group
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {customGroups.map((group) => {
                  const members = groupMembers[group.id] || [];
                  return (
                    <AccordionItem
                      key={group.id}
                      value={group.id}
                      className="border rounded-lg bg-card"
                    >
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center justify-between flex-1 pr-4">
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{group.name}</span>
                            <Badge variant="secondary">{members.length} members</Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        {group.description && (
                          <p className="text-sm text-muted-foreground mb-4">
                            {group.description}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mb-4">
                          <Popover
                            open={memberSearchOpen && addMemberGroupId === group.id}
                            onOpenChange={(open) => {
                              setMemberSearchOpen(open);
                              if (open) setAddMemberGroupId(group.id);
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Member
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[350px] p-0" align="start">
                              <Command>
                                <CommandInput
                                  placeholder="Search by name or email..."
                                  value={memberSearchQuery}
                                  onValueChange={setMemberSearchQuery}
                                />
                                <CommandList className="max-h-[300px]">
                                  <CommandEmpty>No users found.</CommandEmpty>
                                  <CommandGroup heading={`${filteredUsers.length} users${memberSearchQuery ? ' matching' : ' total'}`}>
                                    {filteredUsers.slice(0, 50).map((user) => (
                                      <CommandItem
                                        key={user.id}
                                        value={`${user.full_name || ''} ${user.email || ''}`}
                                        onSelect={() => handleAddMember(user.user_id)}
                                      >
                                        <User className="mr-2 h-4 w-4" />
                                        <div className="flex flex-col">
                                          <span className="flex items-center gap-2">
                                            {user.full_name || 'No name'}
                                            <Badge variant="outline" className="text-xs">{user.tier}</Badge>
                                          </span>
                                          {user.email && (
                                            <span className="text-xs text-muted-foreground">
                                              {user.email}
                                            </span>
                                          )}
                                        </div>
                                      </CommandItem>
                                    ))}
                                    {filteredUsers.length > 50 && (
                                      <div className="px-2 py-1.5 text-xs text-muted-foreground text-center border-t">
                                        Type to search {filteredUsers.length - 50} more users...
                                      </div>
                                    )}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(group)}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGroup(group.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>

                        {/* Members List */}
                        {members.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No members in this group</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {members.map((member) => {
                              // Look up user by user_id field (maps to user_profiles.id)
                              const user = users.find((u) => u.user_id === member.user_id);
                              return (
                                <Badge
                                  key={member.id}
                                  variant="outline"
                                  className="flex items-center gap-1 py-1"
                                >
                                  <User className="h-3 w-3" />
                                  {user?.full_name || user?.email || member.user_id.slice(0, 8)}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(group.id, member.id)}
                                    className="ml-1 hover:text-red-500"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>

          {/* Auto Groups (Read-only) */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Auto Groups ({autoGroups.length})
              <Badge variant="outline" className="ml-2">System-managed</Badge>
            </h3>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {autoGroups.map((group) => (
                <Card key={group.id} className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{group.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getAutoGroupDescription(group.auto_criteria)}
                        </p>
                      </div>
                      <Badge variant="secondary">Auto</Badge>
                    </div>
                    {group.description && (
                      <p className="text-xs text-muted-foreground mt-2">{group.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingGroup}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingGroup(null);
            setGroupName('');
            setGroupDescription('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Edit Group' : 'Create New Group'}
            </DialogTitle>
            <DialogDescription>
              {editingGroup
                ? 'Update the group name and description'
                : 'Create a custom user group for targeting reports'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Beta Testers, VIP Members"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="What is this group for?"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingGroup(null);
                setGroupName('');
                setGroupDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
              disabled={isProcessing || !groupName.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingGroup ? 'Saving...' : 'Creating...'}
                </>
              ) : editingGroup ? (
                'Save Changes'
              ) : (
                'Create Group'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
