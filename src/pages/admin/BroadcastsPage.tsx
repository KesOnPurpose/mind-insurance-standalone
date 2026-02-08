// =============================================================================
// ADMIN BROADCASTS PAGE
// Dashboard for managing notification broadcasts to users
// =============================================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Plus,
  Send,
  Clock,
  CheckCircle,
  Users,
  Eye,
  Trash2,
  Edit,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  getBroadcasts,
  deleteBroadcast,
} from '@/services/broadcastService';
import {
  NotificationBroadcast,
  BroadcastStatus,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  getNotificationPermissions,
} from '@/types/broadcast';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { BroadcastComposer } from '@/components/admin/broadcasts/BroadcastComposer';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface BroadcastWithStats extends NotificationBroadcast {
  delivery_rate?: number;
  read_rate?: number;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function BroadcastsPage() {
  const { userRole } = useAuth();
  const [broadcasts, setBroadcasts] = useState<BroadcastWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BroadcastStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<NotificationBroadcast | undefined>(undefined);

  // Get user permissions
  const permissions = getNotificationPermissions(userRole);

  // Fetch broadcasts
  const fetchBroadcasts = async () => {
    setIsLoading(true);
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const { data, error } = await getBroadcasts({ status });

      if (error) {
        throw error;
      }

      setBroadcasts(data || []);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      toast.error('Failed to load broadcasts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, [statusFilter]);

  // Filter broadcasts by search query
  const filteredBroadcasts = broadcasts.filter((broadcast) => {
    const matchesSearch =
      broadcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broadcast.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'drafts' && broadcast.status === 'draft') ||
      (activeTab === 'pending' && broadcast.status === 'pending_approval') ||
      (activeTab === 'scheduled' && broadcast.status === 'scheduled') ||
      (activeTab === 'sent' && broadcast.status === 'sent');

    return matchesSearch && matchesTab;
  });

  // Stats calculations
  const stats = {
    total: broadcasts.length,
    drafts: broadcasts.filter((b) => b.status === 'draft').length,
    pending: broadcasts.filter((b) => b.status === 'pending_approval').length,
    scheduled: broadcasts.filter((b) => b.status === 'scheduled').length,
    sent: broadcasts.filter((b) => b.status === 'sent').length,
  };

  // Handle broadcast saved (new or updated)
  const handleBroadcastSaved = (broadcast: NotificationBroadcast) => {
    setIsComposerOpen(false);
    setSelectedBroadcast(undefined);
    fetchBroadcasts();
  };

  // Handle edit broadcast
  const handleEditBroadcast = (broadcast: NotificationBroadcast) => {
    setSelectedBroadcast(broadcast);
    setIsComposerOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this broadcast?')) return;

    try {
      const { success, error } = await deleteBroadcast(id);

      if (error || !success) {
        throw error || new Error('Failed to delete broadcast');
      }

      toast.success('Broadcast deleted');
      fetchBroadcasts();
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      toast.error('Failed to delete broadcast');
    }
  };

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <SidebarLayout mode="admin" showHeader headerTitle="Broadcasts" headerSubtitle="Send notifications to users">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Broadcasts</h1>
            <p className="text-gray-500 mt-1">
              Send notifications to users across the platform
            </p>
          </div>

          {permissions.create && (
            <Button
              className="bg-mi-cyan hover:bg-mi-cyan-dark text-white"
              onClick={() => {
                setSelectedBroadcast(undefined);
                setIsComposerOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Broadcast
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatsCard
            title="Total"
            value={stats.total}
            icon={<Bell className="h-5 w-5 text-mi-cyan" />}
            color="cyan"
          />
          <StatsCard
            title="Drafts"
            value={stats.drafts}
            icon={<Edit className="h-5 w-5 text-gray-500" />}
            color="gray"
          />
          <StatsCard
            title="Pending Approval"
            value={stats.pending}
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            color="amber"
          />
          <StatsCard
            title="Scheduled"
            value={stats.scheduled}
            icon={<Clock className="h-5 w-5 text-blue-500" />}
            color="blue"
          />
          <StatsCard
            title="Sent"
            value={stats.sent}
            icon={<CheckCircle className="h-5 w-5 text-green-500" />}
            color="green"
          />
        </div>

        {/* Filters & Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search broadcasts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as BroadcastStatus | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="sending">Sending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={fetchBroadcasts} disabled={isLoading}>
                <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({stats.drafts})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({stats.scheduled})</TabsTrigger>
            <TabsTrigger value="sent">Sent ({stats.sent})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Broadcasts List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 text-mi-cyan animate-spin" />
            </div>
          ) : filteredBroadcasts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No broadcasts found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Create your first broadcast to notify users'}
                </p>
                {permissions.create && !searchQuery && (
                  <Button
                    onClick={() => {
                      setSelectedBroadcast(undefined);
                      setIsComposerOpen(true);
                    }}
                    className="bg-mi-cyan hover:bg-mi-cyan-dark"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Broadcast
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredBroadcasts.map((broadcast) => (
              <BroadcastCard
                key={broadcast.id}
                broadcast={broadcast}
                permissions={permissions}
                onDelete={() => handleDelete(broadcast.id)}
                onEdit={() => handleEditBroadcast(broadcast)}
                formatDate={formatDate}
              />
            ))
          )}
        </div>

        {/* Broadcast Composer Dialog */}
        <BroadcastComposer
          broadcast={selectedBroadcast}
          isOpen={isComposerOpen}
          onOpenChange={setIsComposerOpen}
          onSave={handleBroadcastSaved}
          onCancel={() => {
            setIsComposerOpen(false);
            setSelectedBroadcast(undefined);
          }}
        />
      </div>
    </SidebarLayout>
  );
}

// -----------------------------------------------------------------------------
// Stats Card Component
// -----------------------------------------------------------------------------

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'cyan' | 'gray' | 'amber' | 'blue' | 'green';
}

function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const bgColors = {
    cyan: 'bg-cyan-50',
    gray: 'bg-gray-50',
    amber: 'bg-amber-50',
    blue: 'bg-blue-50',
    green: 'bg-green-50',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={cn('p-3 rounded-full', bgColors[color])}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Broadcast Card Component
// -----------------------------------------------------------------------------

interface BroadcastCardProps {
  broadcast: BroadcastWithStats;
  permissions: ReturnType<typeof getNotificationPermissions>;
  onDelete: () => void;
  onEdit: () => void;
  formatDate: (date: string | null) => string;
}

function BroadcastCard({ broadcast, permissions, onDelete, onEdit, formatDate }: BroadcastCardProps) {
  const statusConfig = STATUS_CONFIG[broadcast.status];
  const priorityConfig = PRIORITY_CONFIG[broadcast.priority];

  // Calculate rates
  const deliveryRate =
    broadcast.total_recipients > 0
      ? ((broadcast.delivered_count / broadcast.total_recipients) * 100).toFixed(1)
      : '0';
  const readRate =
    broadcast.delivered_count > 0
      ? ((broadcast.read_count / broadcast.delivered_count) * 100).toFixed(1)
      : '0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title & Badges */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{broadcast.title}</h3>
                <Badge className={cn(statusConfig.bgColor, statusConfig.color)}>
                  {statusConfig.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(priorityConfig.borderColor, priorityConfig.color)}
                >
                  {priorityConfig.label}
                </Badge>
              </div>

              {/* Message preview */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{broadcast.message}</p>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {broadcast.target_type === 'global'
                    ? 'All Users'
                    : broadcast.target_type === 'tier'
                      ? `Tier: ${broadcast.target_tier}`
                      : broadcast.target_type === 'group'
                        ? 'Custom Group'
                        : `${broadcast.target_user_ids?.length || 0} Users`}
                </span>

                {broadcast.scheduled_for && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Scheduled: {formatDate(broadcast.scheduled_for)}
                  </span>
                )}

                {broadcast.sent_at && (
                  <span className="flex items-center gap-1">
                    <Send className="h-4 w-4" />
                    Sent: {formatDate(broadcast.sent_at)}
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Created: {formatDate(broadcast.created_at)}
                </span>
              </div>

              {/* Stats for sent broadcasts */}
              {broadcast.status === 'sent' && (
                <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {broadcast.total_recipients}
                    </p>
                    <p className="text-xs text-gray-500">Recipients</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-mi-cyan">{deliveryRate}%</p>
                    <p className="text-xs text-gray-500">Delivered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{readRate}%</p>
                    <p className="text-xs text-gray-500">Read</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              <Button variant="ghost" size="sm" title="View details">
                <Eye className="h-4 w-4" />
              </Button>

              {broadcast.status === 'draft' && permissions.create && (
                <Button variant="ghost" size="sm" title="Edit" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}

              {(broadcast.status === 'draft' || broadcast.status === 'cancelled') &&
                permissions.create && (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Delete"
                    onClick={onDelete}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
