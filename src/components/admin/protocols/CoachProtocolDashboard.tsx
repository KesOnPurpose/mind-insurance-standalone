// CoachProtocolDashboard Component
// Real-time dashboard for coaches to monitor protocol assignments

import React, { useState, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Mail,
  User,
  Calendar,
  BarChart3,
  Pause,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useCoachDashboard,
  STATUS_OPTIONS,
  BEHIND_OPTIONS,
  generateWeekOptions,
} from '@/hooks/useCoachDashboard';
import type {
  CoachProtocolV2,
  AssignmentStatus,
  DashboardAssignmentWithProgress,
} from '@/types/coach-protocol';

interface CoachProtocolDashboardProps {
  protocols: CoachProtocolV2[];
  selectedProtocolId: string | null;
  onSelectProtocol: (protocolId: string | null) => void;
}

// Status badge colors
const STATUS_COLORS: Record<AssignmentStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  abandoned: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

// Status icons
const STATUS_ICONS: Record<AssignmentStatus, React.ReactNode> = {
  active: <CheckCircle className="h-3 w-3" />,
  paused: <Pause className="h-3 w-3" />,
  completed: <CheckCircle className="h-3 w-3" />,
  abandoned: <XCircle className="h-3 w-3" />,
  expired: <Clock className="h-3 w-3" />,
};

export function CoachProtocolDashboard({
  protocols,
  selectedProtocolId,
  onSelectProtocol,
}: CoachProtocolDashboardProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find selected protocol
  const selectedProtocol = protocols.find((p) => p.id === selectedProtocolId);

  // Use the dashboard hook
  const {
    stats,
    assignments,
    isLoading,
    isLoadingStats,
    filters,
    setFilters,
    refetch,
    exportToCSV,
  } = useCoachDashboard(selectedProtocolId);

  // Filter assignments by search query locally
  const filteredAssignments = useMemo(() => {
    if (!searchQuery) return assignments;
    const query = searchQuery.toLowerCase();
    return assignments.filter(
      (a) =>
        a.user.full_name.toLowerCase().includes(query) ||
        a.user.email.toLowerCase().includes(query)
    );
  }, [assignments, searchQuery]);

  // Generate week options based on selected protocol
  const weekOptions = selectedProtocol
    ? generateWeekOptions(selectedProtocol.total_weeks)
    : [];

  return (
    <div className="space-y-6">
      {/* Protocol Selector */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select
            value={selectedProtocolId || ''}
            onValueChange={(v) => onSelectProtocol(v || null)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a protocol to view dashboard" />
            </SelectTrigger>
            <SelectContent>
              {protocols.map((protocol) => (
                <SelectItem key={protocol.id} value={protocol.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: protocol.theme_color }}
                    />
                    <span>{protocol.title}</span>
                    <Badge variant="outline" className="ml-2">
                      {protocol.total_weeks}w
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={!selectedProtocolId || isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={!selectedProtocolId || assignments.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* No Protocol Selected */}
      {!selectedProtocolId && (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">Select a Protocol</h3>
          <p className="text-muted-foreground">
            Choose a protocol above to view its dashboard
          </p>
        </div>
      )}

      {/* Dashboard Content */}
      {selectedProtocolId && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatsCard
              title="Total Assigned"
              value={stats?.total_assigned ?? 0}
              icon={<Users className="h-4 w-4" />}
              isLoading={isLoadingStats}
            />
            <StatsCard
              title="Active"
              value={stats?.active ?? 0}
              icon={<CheckCircle className="h-4 w-4 text-green-500" />}
              isLoading={isLoadingStats}
            />
            <StatsCard
              title="Completed"
              value={stats?.completed ?? 0}
              icon={<CheckCircle className="h-4 w-4 text-blue-500" />}
              isLoading={isLoadingStats}
            />
            <StatsCard
              title="Avg Completion"
              value={`${Math.round(stats?.avg_completion_rate ?? 0)}%`}
              icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
              isLoading={isLoadingStats}
            />
            <StatsCard
              title="Abandoned/Expired"
              value={(stats?.abandoned ?? 0) + (stats?.expired ?? 0)}
              icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
              isLoading={isLoadingStats}
            />
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {showFilters ? (
                    <ChevronUp className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </div>

              {/* Filter Panel */}
              <Collapsible open={showFilters}>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={filters.status || 'all'}
                        onValueChange={(v) =>
                          setFilters({
                            ...filters,
                            status: v === 'all' ? undefined : (v as AssignmentStatus),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Week</label>
                      <Select
                        value={filters.current_week?.toString() || 'all'}
                        onValueChange={(v) =>
                          setFilters({
                            ...filters,
                            current_week: v === 'all' ? undefined : parseInt(v, 10),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Weeks</SelectItem>
                          {weekOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value.toString()}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Progress</label>
                      <Select
                        value={
                          filters.is_behind === undefined
                            ? 'all'
                            : filters.is_behind
                            ? 'behind'
                            : 'on_track'
                        }
                        onValueChange={(v) =>
                          setFilters({
                            ...filters,
                            is_behind:
                              v === 'all'
                                ? undefined
                                : v === 'behind'
                                ? true
                                : false,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Progress</SelectItem>
                          <SelectItem value="behind">Behind Schedule</SelectItem>
                          <SelectItem value="on_track">On Track</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardHeader>

            <CardContent>
              {/* Loading State */}
              {isLoading && (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                      </div>
                      <Skeleton className="h-4 w-[60px]" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && filteredAssignments.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold">No Assignments Found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? 'No users match your search'
                      : 'No users have been assigned to this protocol yet'}
                  </p>
                </div>
              )}

              {/* Assignment Table */}
              {!isLoading && filteredAssignments.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Week / Day</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead className="text-right">Last Activity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssignments.map((item) => (
                        <AssignmentRow key={item.assignment.id} item={item} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  icon,
  isLoading,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Assignment Row Component
function AssignmentRow({ item }: { item: DashboardAssignmentWithProgress }) {
  const { user, assignment, progress, last_activity } = item;

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <TableRow>
      {/* User */}
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium">{user.full_name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge className={cn('gap-1', STATUS_COLORS[assignment.status])}>
          {STATUS_ICONS[assignment.status]}
          {assignment.status}
        </Badge>
        {progress.is_behind && assignment.status === 'active' && (
          <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {progress.days_behind}d behind
          </Badge>
        )}
      </TableCell>

      {/* Week / Day */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            Week {assignment.current_week}, Day {assignment.current_day}
          </span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {assignment.days_completed} days completed
          {assignment.days_skipped > 0 && (
            <span className="text-orange-500"> · {assignment.days_skipped} skipped</span>
          )}
        </div>
      </TableCell>

      {/* Progress */}
      <TableCell>
        <div className="space-y-1 w-32">
          <div className="flex justify-between text-sm">
            <span>{Math.round(progress.completion_percentage)}%</span>
          </div>
          <Progress
            value={progress.completion_percentage}
            className="h-2"
          />
        </div>
      </TableCell>

      {/* Last Activity */}
      <TableCell className="text-right">
        <div className="text-sm text-muted-foreground">
          {formatDate(last_activity)}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default CoachProtocolDashboard;
