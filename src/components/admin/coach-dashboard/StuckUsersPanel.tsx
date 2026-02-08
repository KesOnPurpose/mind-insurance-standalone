import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Clock,
  Send,
  User,
  Calendar,
  ChevronRight,
  Loader2,
  RefreshCw,
  Users
} from 'lucide-react';
import {
  useStuckUsers,
  useSendNudge,
  StuckUser,
  StuckThresholdFilter
} from '@/hooks/useCoachDashboard';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StuckUsersPanelProps {
  onViewUser: (userId: string) => void;
  onBookCall: (userId: string) => void;
}

const THRESHOLD_TABS: { value: StuckThresholdFilter; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'bg-muted' },
  { value: '3-day', label: '3+ Days', color: 'bg-yellow-500' },
  { value: '7-day', label: '7+ Days', color: 'bg-orange-500' },
  { value: '14-day', label: '14+ Days', color: 'bg-red-500' },
  { value: '30-day', label: '30+ Days', color: 'bg-red-700' },
];

const getStuckSeverityColor = (days: number): string => {
  if (days >= 30) return 'text-red-700 bg-red-100';
  if (days >= 14) return 'text-red-600 bg-red-50';
  if (days >= 7) return 'text-orange-600 bg-orange-50';
  if (days >= 3) return 'text-yellow-600 bg-yellow-50';
  return 'text-muted-foreground bg-muted';
};

const getStuckSeverityBorder = (days: number): string => {
  if (days >= 30) return 'border-l-red-700';
  if (days >= 14) return 'border-l-red-500';
  if (days >= 7) return 'border-l-orange-500';
  if (days >= 3) return 'border-l-yellow-500';
  return 'border-l-muted';
};

export const StuckUsersPanel = ({ onViewUser, onBookCall }: StuckUsersPanelProps) => {
  const [filter, setFilter] = useState<StuckThresholdFilter>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: stuckUsers, isLoading, refetch, isRefetching } = useStuckUsers(filter);
  const sendNudgeMutation = useSendNudge();

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && stuckUsers) {
      setSelectedUsers(new Set(stuckUsers.map(u => u.user_id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSendNudge = async (user: StuckUser) => {
    try {
      await sendNudgeMutation.mutateAsync({
        userId: user.user_id,
        method: user.phone ? 'sms' : 'email',
        message: `Hey ${user.full_name?.split(' ')[0] || 'there'}! It's been ${user.days_since_last_progress} days since your last progress. Ready to get back on track with your group home journey?`
      });
      toast({
        title: 'Nudge sent',
        description: `Successfully sent nudge to ${user.full_name || user.email}`,
      });
    } catch (error) {
      toast({
        title: 'Failed to send nudge',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkNudge = async () => {
    if (selectedUsers.size === 0 || !stuckUsers) return;

    const usersToNudge = stuckUsers.filter(u => selectedUsers.has(u.user_id));
    let successCount = 0;
    let failCount = 0;

    for (const user of usersToNudge) {
      try {
        await sendNudgeMutation.mutateAsync({
          userId: user.user_id,
          method: user.phone ? 'sms' : 'email',
          message: `Hey ${user.full_name?.split(' ')[0] || 'there'}! It's been ${user.days_since_last_progress} days since your last progress. Ready to get back on track with your group home journey?`
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setSelectedUsers(new Set());
    toast({
      title: 'Bulk nudge complete',
      description: `Sent ${successCount} nudges${failCount > 0 ? `, ${failCount} failed` : ''}`,
      variant: failCount > 0 ? 'destructive' : 'default',
    });
  };

  const allSelected = stuckUsers && stuckUsers.length > 0 && selectedUsers.size === stuckUsers.length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Stuck Users</CardTitle>
            {stuckUsers && (
              <Badge variant="secondary" className="ml-2">
                {stuckUsers.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
          </Button>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as StuckThresholdFilter)} className="mt-3">
          <TabsList className="w-full grid grid-cols-5 h-9">
            {THRESHOLD_TABS.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs px-2"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">
              {selectedUsers.size} selected
            </span>
            <Button
              size="sm"
              onClick={handleBulkNudge}
              disabled={sendNudgeMutation.isPending}
              className="ml-auto"
            >
              {sendNudgeMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Nudges
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !stuckUsers || stuckUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Users className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No stuck users found</p>
            <p className="text-xs mt-1">All users are making progress!</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-400px)]">
            {/* Select All */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
                Select all
              </label>
            </div>

            {/* User List */}
            {stuckUsers.map((user) => (
              <div
                key={user.user_id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border border-l-4 transition-colors hover:bg-muted/50",
                  getStuckSeverityBorder(user.days_since_last_progress)
                )}
              >
                <Checkbox
                  checked={selectedUsers.has(user.user_id)}
                  onCheckedChange={(checked) => handleSelectUser(user.user_id, checked as boolean)}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {user.full_name || 'Unknown User'}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getStuckSeverityColor(user.days_since_last_progress))}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {user.days_since_last_progress}d
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {user.email}
                  </p>

                  {user.current_tactic_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-foreground">Phase {user.current_phase}:</span>{' '}
                      {user.current_tactic_name}
                    </p>
                  )}

                  <div className="flex items-center gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleSendNudge(user)}
                      disabled={sendNudgeMutation.isPending}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Nudge
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => onViewUser(user.user_id)}
                    >
                      <User className="w-3 h-3 mr-1" />
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => onBookCall(user.user_id)}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Book
                    </Button>
                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StuckUsersPanel;
