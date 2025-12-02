// Target User Picker Component
// Phase 28: Select individual users, auto-groups, or custom groups for report targeting

import React, { useState, useEffect, useCallback } from 'react';
import { Users, User, Search, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface MIOUserGroup {
  id: string;
  name: string;
  description: string | null;
  group_type: 'auto' | 'custom';
  auto_criteria: Record<string, any> | null;
}

interface TargetUserPickerProps {
  targetType: 'individual' | 'auto_group' | 'custom_group' | 'all';
  targetConfig: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  onUserCountChange?: (count: number | null) => void;
}

const AUTO_GROUP_TYPES = [
  { value: 'by_pattern', label: 'By Collision Pattern', description: 'Target users by their primary pattern' },
  { value: 'by_temperament', label: 'By Temperament', description: 'Target users by their temperament' },
  { value: 'by_week', label: 'By Challenge Week', description: 'Target users in a specific week' },
  { value: 'by_streak_status', label: 'By Streak Status', description: 'Target users who broke their streak' },
];

const COLLISION_PATTERNS = [
  { value: 'past_prison', label: 'Past Prison' },
  { value: 'success_sabotage', label: 'Success Sabotage' },
  { value: 'compass_crisis', label: 'Compass Crisis' },
];

const TEMPERAMENTS = [
  { value: 'warrior', label: 'Warrior' },
  { value: 'sage', label: 'Sage' },
  { value: 'connector', label: 'Connector' },
  { value: 'builder', label: 'Builder' },
];

const WEEKS = [
  { value: '1', label: 'Week 1 (Days 1-7)' },
  { value: '2', label: 'Week 2 (Days 8-14)' },
  { value: '3', label: 'Week 3 (Days 15-21) - Danger Zone' },
  { value: '4', label: 'Week 4 (Days 22-28)' },
];

export function TargetUserPicker({
  targetType,
  targetConfig,
  onChange,
  onUserCountChange,
}: TargetUserPickerProps) {
  // State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<MIOUserGroup[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    targetConfig.user_ids || []
  );
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Fetch users for individual selection
  useEffect(() => {
    if (targetType === 'individual') {
      fetchUsers();
    }
  }, [targetType]);

  // Fetch custom groups
  useEffect(() => {
    if (targetType === 'custom_group') {
      fetchGroups();
    }
  }, [targetType]);

  // Estimate user count based on target config
  useEffect(() => {
    estimateUserCount();
  }, [targetType, targetConfig]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
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
      console.error('Error fetching groups:', error);
    }
  };

  const estimateUserCount = useCallback(async () => {
    if (!onUserCountChange) return;

    try {
      let count = 0;

      switch (targetType) {
        case 'individual':
          count = targetConfig.user_ids?.length || 0;
          break;

        case 'auto_group': {
          // Call Supabase function to estimate count
          const { data, error } = await supabase.rpc('get_automation_user_count', {
            p_target_type: 'auto_group',
            p_target_config: targetConfig,
          });
          if (!error && data !== null) count = data;
          break;
        }

        case 'custom_group':
          if (targetConfig.group_id) {
            const { count: memberCount } = await supabase
              .from('mio_user_group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', targetConfig.group_id);
            count = memberCount || 0;
          }
          break;

        case 'all': {
          const { count: allCount } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .is('deleted_at', null);
          count = allCount || 0;
          break;
        }
      }

      onUserCountChange(count);
    } catch (error) {
      console.error('Error estimating user count:', error);
      onUserCountChange(null);
    }
  }, [targetType, targetConfig, onUserCountChange]);

  const handleAddUser = (userId: string) => {
    const newIds = [...selectedUserIds, userId];
    setSelectedUserIds(newIds);
    onChange({ user_ids: newIds });
    setUserSearchOpen(false);
  };

  const handleRemoveUser = (userId: string) => {
    const newIds = selectedUserIds.filter((id) => id !== userId);
    setSelectedUserIds(newIds);
    onChange({ user_ids: newIds });
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
    (user) => !selectedUserIds.includes(user.id)
  );

  // Render based on target type
  if (targetType === 'individual') {
    return (
      <div className="space-y-3">
        <Label>Selected Users</Label>

        {/* User Search Picker */}
        <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Search className="mr-2 h-4 w-4" />
              <span className="text-muted-foreground">Add users...</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search users..."
                value={userSearchQuery}
                onValueChange={setUserSearchQuery}
              />
              <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  {availableUsers.slice(0, 10).map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => handleAddUser(user.id)}
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

        {/* Selected Users */}
        {selectedUserIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedUserIds.map((userId) => {
              const user = users.find((u) => u.id === userId);
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
    );
  }

  if (targetType === 'auto_group') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Auto-Group Type</Label>
          <Select
            value={targetConfig.auto_group_type || 'by_pattern'}
            onValueChange={(v) =>
              onChange({ auto_group_type: v, pattern: undefined, temperament: undefined, week: undefined })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUTO_GROUP_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col">
                    <span>{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pattern Filter */}
        {targetConfig.auto_group_type === 'by_pattern' && (
          <div className="space-y-2">
            <Label>Collision Pattern</Label>
            <Select
              value={targetConfig.pattern || ''}
              onValueChange={(v) => onChange({ ...targetConfig, pattern: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pattern" />
              </SelectTrigger>
              <SelectContent>
                {COLLISION_PATTERNS.map((pattern) => (
                  <SelectItem key={pattern.value} value={pattern.value}>
                    {pattern.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Temperament Filter */}
        {targetConfig.auto_group_type === 'by_temperament' && (
          <div className="space-y-2">
            <Label>Temperament</Label>
            <Select
              value={targetConfig.temperament || ''}
              onValueChange={(v) => onChange({ ...targetConfig, temperament: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select temperament" />
              </SelectTrigger>
              <SelectContent>
                {TEMPERAMENTS.map((temp) => (
                  <SelectItem key={temp.value} value={temp.value}>
                    {temp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Week Filter */}
        {targetConfig.auto_group_type === 'by_week' && (
          <div className="space-y-2">
            <Label>Challenge Week</Label>
            <Select
              value={String(targetConfig.week || '')}
              onValueChange={(v) => onChange({ ...targetConfig, week: parseInt(v, 10) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {WEEKS.map((week) => (
                  <SelectItem key={week.value} value={week.value}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Streak Status Filter */}
        {targetConfig.auto_group_type === 'by_streak_status' && (
          <div className="space-y-2">
            <Label>Days Since Last Practice</Label>
            <Select
              value={String(targetConfig.days_since_practice || '3')}
              onValueChange={(v) =>
                onChange({ ...targetConfig, days_since_practice: parseInt(v, 10) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2+ days</SelectItem>
                <SelectItem value="3">3+ days</SelectItem>
                <SelectItem value="5">5+ days</SelectItem>
                <SelectItem value="7">7+ days (1 week)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  }

  if (targetType === 'custom_group') {
    return (
      <div className="space-y-2">
        <Label>Custom User Group</Label>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No custom groups found. Create a group in the User Groups tab first.
          </p>
        ) : (
          <Select
            value={targetConfig.group_id || ''}
            onValueChange={(v) => onChange({ group_id: v })}
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
        )}
      </div>
    );
  }

  if (targetType === 'all') {
    return (
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-5 w-5" />
          <span>All active users will be included in this automation</span>
        </div>
      </div>
    );
  }

  return null;
}
