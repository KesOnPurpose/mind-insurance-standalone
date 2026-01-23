// ============================================================================
// PROCESSING QUEUE COMPONENT
// ============================================================================
// Displays and manages the knowledge processing queue for Nette AI
// GROUPHOME STANDALONE: Only Nette AI (MIO/ME columns removed)
// Shows status of pending, processing, completed, and failed items
// ============================================================================

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  ProcessingQueueItem,
  QueueStats,
  ProcessingStatus,
  SOURCE_TYPE_CONFIGS,
} from '@/types/knowledgeManagement';
import {
  getProcessingQueue,
  getQueueStats,
  retryQueueItem,
} from '@/services/knowledgeIngestionService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Status badge colors and icons
const STATUS_CONFIG: Record<ProcessingStatus, { color: string; icon: React.ReactNode }> = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="h-3 w-3" />,
  },
  processing: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  completed: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  failed: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="h-3 w-3" />,
  },
};

interface ProcessingQueueProps {
  agentFilter?: string;
  maxItems?: number;
  onRefresh?: () => void;
  showStats?: boolean;
  compact?: boolean;
}

export function ProcessingQueue({
  agentFilter,
  maxItems = 20,
  onRefresh,
  showStats = true,
  compact = false,
}: ProcessingQueueProps) {
  const [items, setItems] = useState<ProcessingQueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const [queueItems, queueStats] = await Promise.all([
        getProcessingQueue(agentFilter, maxItems),
        getQueueStats(agentFilter),
      ]);
      setItems(queueItems);
      setStats(queueStats);
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    // Poll for updates every 10 seconds
    const interval = setInterval(loadQueue, 10000);
    return () => clearInterval(interval);
  }, [agentFilter, maxItems]);

  const handleRetry = async (itemId: string) => {
    setRetrying(itemId);
    try {
      await retryQueueItem(itemId);
      await loadQueue();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to retry item:', error);
    } finally {
      setRetrying(null);
    }
  };

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Pending"
            value={stats.pending}
            color="bg-yellow-50 border-yellow-200"
            icon={<Clock className="h-4 w-4 text-yellow-600" />}
          />
          <StatCard
            label="Processing"
            value={stats.processing}
            color="bg-blue-50 border-blue-200"
            icon={<Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            color="bg-green-50 border-green-200"
            icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
          />
          <StatCard
            label="Failed"
            value={stats.failed}
            color="bg-red-50 border-red-200"
            icon={<XCircle className="h-4 w-4 text-red-600" />}
          />
        </div>
      )}

      {/* Queue Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Processing Queue</CardTitle>
              <CardDescription>
                {items.length} items in queue
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadQueue}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No items in queue</p>
            </div>
          ) : compact ? (
            <CompactQueueList
              items={items}
              onRetry={handleRetry}
              retrying={retrying}
              formatTime={formatTime}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Chunks</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate">
                            {item.source_title || 'Untitled'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {SOURCE_TYPE_CONFIGS[item.source_type]?.label}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {item.category.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>{item.chunks_created}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTime(item.submitted_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.source_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a
                                href={item.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {item.status === 'failed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetry(item.id)}
                              disabled={retrying === item.id}
                            >
                              {retrying === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Failed Items Alert */}
          {stats && stats.failed > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {stats.failed} item{stats.failed !== 1 ? 's' : ''} failed to process
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: ProcessingStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn('gap-1', config.color)}>
      {config.icon}
      <span className="capitalize">{status}</span>
    </Badge>
  );
}

// Stat Card Component
interface StatCardProps {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <div className={cn('p-4 rounded-lg border', color)}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

// Compact Queue List (for sidebar or minimal views)
interface CompactQueueListProps {
  items: ProcessingQueueItem[];
  onRetry: (id: string) => void;
  retrying: string | null;
  formatTime: (timestamp: string) => string;
}

function CompactQueueList({
  items,
  onRetry,
  retrying,
  formatTime,
}: CompactQueueListProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <StatusBadge status={item.status} />
              <span className="text-sm font-medium truncate">
                {item.source_title || 'Untitled'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {item.category.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatTime(item.submitted_at)}
          </div>
          {item.status === 'failed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry(item.id)}
              disabled={retrying === item.id}
              className="h-8 w-8 p-0"
            >
              {retrying === item.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

// Mini Queue Widget (for dashboard)
interface QueueWidgetProps {
  className?: string;
}

export function QueueWidget({ className }: QueueWidgetProps) {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const queueStats = await getQueueStats();
        setStats(queueStats);
      } catch (error) {
        console.error('Failed to load queue stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {stats.processing > 0 && (
        <div className="flex items-center gap-1 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{stats.processing} processing</span>
        </div>
      )}
      {stats.pending > 0 && (
        <div className="flex items-center gap-1 text-yellow-600">
          <Clock className="h-4 w-4" />
          <span className="text-sm">{stats.pending} pending</span>
        </div>
      )}
      {stats.failed > 0 && (
        <div className="flex items-center gap-1 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-sm">{stats.failed} failed</span>
        </div>
      )}
      {stats.pending === 0 && stats.processing === 0 && stats.failed === 0 && (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm">Queue empty</span>
        </div>
      )}
    </div>
  );
}
