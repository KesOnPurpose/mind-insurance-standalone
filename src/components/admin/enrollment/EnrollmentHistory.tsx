// ============================================================================
// FEAT-GH-019: Enrollment History Component
// ============================================================================
// Log of enrollments with filtering and export capabilities
// ============================================================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Search,
  Download,
  RefreshCw,
  History,
  CalendarIcon,
  UserPlus,
  CreditCard,
  FileSpreadsheet,
  User,
} from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEnrollmentHistory } from '@/hooks/useAdminPrograms';
import type { EnrollmentHistoryItem, EnrollmentSource } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface EnrollmentHistoryProps {
  programId: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// ============================================================================
// Source Badge Component
// ============================================================================

const SourceBadge = ({ source }: { source: EnrollmentSource }) => {
  const config: Record<
    EnrollmentSource,
    { variant: 'default' | 'secondary' | 'outline'; icon: React.ReactNode; label: string }
  > = {
    manual: {
      variant: 'secondary',
      icon: <UserPlus className="mr-1 h-3 w-3" />,
      label: 'Manual',
    },
    purchase: {
      variant: 'default',
      icon: <CreditCard className="mr-1 h-3 w-3" />,
      label: 'Purchase',
    },
    import: {
      variant: 'outline',
      icon: <FileSpreadsheet className="mr-1 h-3 w-3" />,
      label: 'Import',
    },
  };

  const { variant, icon, label } = config[source];

  return (
    <Badge variant={variant} className="font-normal">
      {icon}
      {label}
    </Badge>
  );
};

// ============================================================================
// Status Badge Component
// ============================================================================

const StatusBadge = ({ status }: { status: EnrollmentHistoryItem['status'] }) => {
  const variants: Record<
    EnrollmentHistoryItem['status'],
    { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }
  > = {
    active: { variant: 'default', label: 'Active' },
    completed: { variant: 'outline', label: 'Completed' },
    paused: { variant: 'secondary', label: 'Paused' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
  };

  const { variant, label } = variants[status];

  return <Badge variant={variant}>{label}</Badge>;
};

// ============================================================================
// Table Skeleton
// ============================================================================

const TableSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

// ============================================================================
// Empty State
// ============================================================================

const EmptyState = ({ hasFilters }: { hasFilters: boolean }) => (
  <TableRow>
    <TableCell colSpan={5} className="h-32 text-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <History className="h-8 w-8" />
        <p>
          {hasFilters
            ? 'No enrollments match your filters'
            : 'No enrollment history yet'}
        </p>
      </div>
    </TableCell>
  </TableRow>
);

// ============================================================================
// Main Component
// ============================================================================

export const EnrollmentHistory = ({ programId }: EnrollmentHistoryProps) => {
  const { history, isLoading, refetch } = useEnrollmentHistory(programId);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<EnrollmentSource | 'all'>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  // Filtered data
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        item.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user_name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Source filter
      const matchesSource =
        sourceFilter === 'all' || item.enrollment_source === sourceFilter;

      // Date range filter
      const enrolledDate = parseISO(item.enrolled_at);
      const matchesDateRange =
        (!dateRange.from || isAfter(enrolledDate, startOfDay(dateRange.from))) &&
        (!dateRange.to || isBefore(enrolledDate, endOfDay(dateRange.to)));

      return matchesSearch && matchesSource && matchesDateRange;
    });
  }, [history, searchQuery, sourceFilter, dateRange]);

  // Export to CSV
  const handleExport = () => {
    const csv = [
      ['Email', 'Name', 'Source', 'Enrolled At', 'Enrolled By', 'Status', 'Notes'].join(','),
      ...filteredHistory.map((item) =>
        [
          item.user_email,
          item.user_name || '',
          item.enrollment_source,
          format(parseISO(item.enrolled_at), 'yyyy-MM-dd HH:mm:ss'),
          item.enrolled_by_name || 'System',
          item.status,
          item.notes ? `"${item.notes.replace(/"/g, '""')}"` : '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollment-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear date range
  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  const hasFilters =
    searchQuery !== '' || sourceFilter !== 'all' || dateRange.from || dateRange.to;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Enrollment History
            </CardTitle>
            <CardDescription>
              Track all enrollments for this program
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="ghost" size="icon" onClick={refetch}>
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Source Filter */}
          <Select
            value={sourceFilter}
            onValueChange={(v) => setSourceFilter(v as EnrollmentSource | 'all')}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="import">Import</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[200px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                    </>
                  ) : (
                    format(dateRange.from, 'MMM d, yyyy')
                  )
                ) : (
                  <span className="text-muted-foreground">Date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
              {(dateRange.from || dateRange.to) && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateRange}
                    className="w-full"
                  >
                    Clear dates
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Enrolled At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrolled By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : filteredHistory.length === 0 ? (
                <EmptyState hasFilters={hasFilters} />
              ) : (
                filteredHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.user_name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{item.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <SourceBadge source={item.enrollment_source} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(parseISO(item.enrolled_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.enrollment_source === 'purchase' ? (
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          Auto (Purchase)
                        </span>
                      ) : item.enrolled_by_name ? (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.enrolled_by_name}
                        </span>
                      ) : (
                        <span>System</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        {!isLoading && filteredHistory.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredHistory.length} of {history.length} enrollments
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EnrollmentHistory;
