import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTopUsers } from '@/services/adminAnalyticsService';
import type { TimeRange, TopUserData } from '@/types/adminAnalytics';
import { Trophy, Medal, Award, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// TOP USERS LEADERBOARD COMPONENT
// ============================================================================
// Displays the top 10 most active users by conversation count
// Shows user info, total chats, favorite agent, and engagement level
// Mobile-first responsive design with loading skeletons
// ============================================================================

interface TopUsersLeaderboardProps {
  timeRange: TimeRange;
  limit?: number;
}

// Get rank icon based on position
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-muted-foreground">{rank}</span>;
  }
};

// Get engagement level badge color
const getEngagementColor = (level: TopUserData['engagement_level']) => {
  switch (level) {
    case 'high':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'low':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

// Get initials from name or email or user_id
const getInitials = (name: string | null, email: string | null, userId?: string): string => {
  if (name) {
    const parts = name.split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  // Use first 2 chars of user_id for anonymous users
  if (userId) {
    return userId.substring(0, 2).toUpperCase();
  }
  return '??';
};

// Get display name with fallback
const getDisplayName = (user: TopUserData): string => {
  if (user.full_name) return user.full_name;
  if (user.email) return user.email.split('@')[0]; // Show username part of email
  return `User ${user.user_id.substring(0, 8)}`; // Show truncated user ID
};

export const TopUsersLeaderboard: React.FC<TopUsersLeaderboardProps> = ({
  timeRange,
  limit = 10
}) => {
  const { data: users, isLoading, error, refetch } = useTopUsers(timeRange, limit);

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Top Users Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              Failed to load leaderboard: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="shrink-0"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !users) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Users Leaderboard</CardTitle>
          <CardDescription>Loading user data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Users Leaderboard</CardTitle>
          <CardDescription>Most active users by conversation count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No user data available for this time period.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try selecting a longer time range or run an analytics sync.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Users Leaderboard
        </CardTitle>
        <CardDescription>
          Most active users by conversation count ({users.length} users)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Mobile View - Card Layout */}
        <div className="md:hidden space-y-3">
          {users.map((user, index) => (
            <div
              key={user.user_id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-2">
                {getRankIcon(index + 1)}
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs">
                    {getInitials(user.full_name, user.email, user.user_id)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {getDisplayName(user)}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>{user.total_conversations.toLocaleString()} chats</span>
                  <span>|</span>
                  <span className="capitalize">{user.favorite_agent}</span>
                </div>
              </div>
              <Badge className={getEngagementColor(user.engagement_level)}>
                {user.engagement_level}
              </Badge>
            </div>
          ))}
        </div>

        {/* Desktop View - Table Layout */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Total Chats</TableHead>
                <TableHead>Favorite Agent</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Engagement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div className="flex justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.full_name, user.email, user.user_id)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate max-w-[200px]">
                          {getDisplayName(user)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {user.email || `ID: ${user.user_id.substring(0, 12)}...`}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {user.total_conversations.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.favorite_agent}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(user.last_active), { addSuffix: true })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className={getEngagementColor(user.engagement_level)}>
                      {user.engagement_level}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
