// Protocol Management Page - Admin
// Phase 27: Coach Protocol Builder

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Archive,
  Send,
  Calendar,
  Users,
  Clock,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllCoachProtocols,
  deleteCoachProtocol,
  updateCoachProtocolStatus,
  duplicateCoachProtocol,
} from '@/services/adminProtocolService';
import type { CoachProtocol, CoachProtocolStatus } from '@/types/protocol';
import { ProtocolEditor } from '@/components/admin/protocols/ProtocolEditor';

type ViewMode = 'list' | 'create' | 'edit';

export default function ProtocolManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [protocols, setProtocols] = useState<CoachProtocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<CoachProtocol | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch protocols on mount
  useEffect(() => {
    fetchProtocols();
  }, []);

  const fetchProtocols = async () => {
    try {
      setIsLoading(true);
      const data = await getAllCoachProtocols();
      setProtocols(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load protocols',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedProtocol(null);
    setViewMode('create');
  };

  const handleEdit = (protocol: CoachProtocol) => {
    setSelectedProtocol(protocol);
    setViewMode('edit');
  };

  const handleDelete = async (protocolId: string) => {
    if (!confirm('Are you sure you want to delete this protocol? This action cannot be undone.')) {
      return;
    }

    try {
      setIsProcessing(true);
      await deleteCoachProtocol(protocolId);
      toast({
        title: 'Success',
        description: 'Protocol deleted successfully',
      });
      fetchProtocols();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete protocol',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (protocolId: string, status: CoachProtocolStatus) => {
    try {
      setIsProcessing(true);
      await updateCoachProtocolStatus(protocolId, status);
      toast({
        title: 'Success',
        description: `Protocol ${status === 'published' ? 'published' : status === 'archived' ? 'archived' : 'updated'}`,
      });
      fetchProtocols();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update protocol status',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicate = async (protocolId: string) => {
    if (!user?.id) return;

    try {
      setIsProcessing(true);
      await duplicateCoachProtocol(protocolId, user.id);
      toast({
        title: 'Success',
        description: 'Protocol duplicated successfully',
      });
      fetchProtocols();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate protocol',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveComplete = () => {
    setViewMode('list');
    setSelectedProtocol(null);
    fetchProtocols();
  };

  const getStatusBadge = (status: CoachProtocolStatus) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
    }
  };

  const getScheduleLabel = (protocol: CoachProtocol) => {
    switch (protocol.schedule_type) {
      case 'weekly_cycle':
        return `Week ${protocol.cycle_week_number} of cycle`;
      case 'evergreen':
        return 'Evergreen (always available)';
      case 'date_specific':
        return `Starting ${protocol.start_date}`;
    }
  };

  // If in create/edit mode, show the editor
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <SidebarLayout
        mode="admin"
        showHeader
        headerTitle={viewMode === 'create' ? 'Create Protocol' : 'Edit Protocol'}
        headerSubtitle="Design 7-day protocols for Mind Insurance users"
        headerGradient="linear-gradient(135deg, hsl(270 70% 45%), hsl(240 70% 50%))"
      >
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setViewMode('list')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Protocols
          </Button>
          <ProtocolEditor
            protocol={selectedProtocol}
            onSave={handleSaveComplete}
            onCancel={() => setViewMode('list')}
          />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout
      mode="admin"
      showHeader
      headerTitle="Coach Protocols"
      headerSubtitle="Create and manage 7-day protocols for Mind Insurance users"
      headerGradient="linear-gradient(135deg, hsl(270 70% 45%), hsl(240 70% 50%))"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-end">
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Protocol
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Protocols</p>
                  <p className="text-2xl font-bold">{protocols.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold text-green-600">
                    {protocols.filter(p => p.status === 'published').length}
                  </p>
                </div>
                <Send className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {protocols.filter(p => p.status === 'draft').length}
                  </p>
                </div>
                <Edit className="h-8 w-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Protocols List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : protocols.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No protocols yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first 7-day protocol to get started
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create Protocol
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {protocols.map((protocol) => (
              <Card key={protocol.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold truncate">
                          {protocol.title}
                        </h3>
                        {getStatusBadge(protocol.status)}
                        {protocol.theme_color && (
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: protocol.theme_color }}
                          />
                        )}
                      </div>
                      {protocol.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {protocol.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {getScheduleLabel(protocol)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {protocol.visibility === 'all_users'
                            ? 'All Users'
                            : protocol.visibility === 'tier_based'
                            ? `Tiers: ${protocol.target_tiers.join(', ')}`
                            : 'Individual'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(protocol)}
                        disabled={isProcessing}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicate(protocol.id)}
                        disabled={isProcessing}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {protocol.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(protocol.id, 'published')}
                          disabled={isProcessing}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {protocol.status === 'published' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(protocol.id, 'archived')}
                          disabled={isProcessing}
                          className="text-amber-600 hover:text-amber-700"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(protocol.id)}
                        disabled={isProcessing}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
