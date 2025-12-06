// MIO Report Management Page - Admin
// Phase 27: View, generate, and download AI-generated reports
// Phase 28: Report automation with user groups and scheduling

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  PartyPopper,
  Shield,
  FileText,
  Trash2,
  Eye,
  Pin,
  PinOff,
  Archive,
  ArrowLeft,
  RefreshCw,
  User,
  Clock,
  Filter,
  Plus,
  Download,
  Search,
  Sparkles,
  Loader2,
  Calendar,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  getAllMIOReports,
  deleteMIOReport,
  updateMIOReportStatus,
  toggleMIOReportPin,
  createMIOReport,
} from '@/services/adminProtocolService';
import type {
  MIOUserReport,
  MIOReportType,
  MIOReportDisplayStatus,
  MIOReportContent,
  MIOInsightProtocol,
  MIOInsightProtocolWithProgress,
  MIOInsightDayTask,
} from '@/types/protocol';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportAutomationConfig, UserGroupManager } from '@/components/admin/reports';
import { Progress } from '@/components/ui/progress';
import { getProtocolById, muteProtocol, unmuteProtocol } from '@/services/mioInsightProtocolService';
import { CheckCircle2, PauseCircle, PlayCircle } from 'lucide-react';

interface UserProfile {
  id: string;              // gh_approved_users.id (for React key)
  full_name: string | null;
  email: string | null;
  user_id: string;         // user_profiles.id (for report generation)
  tier: string;
}

interface MIOUserGroup {
  id: string;
  name: string;
  description: string | null;
  group_type: 'auto' | 'custom';
}

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

const REPORT_TYPE_CONFIG: Record<
  MIOReportType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  weekly_insight: { label: 'Weekly Insight', icon: <Brain />, color: 'text-cyan-500' },
  pattern_analysis: { label: 'Pattern Analysis', icon: <TrendingUp />, color: 'text-purple-500' },
  breakthrough_detection: { label: 'Breakthrough', icon: <PartyPopper />, color: 'text-green-500' },
  dropout_risk: { label: 'Dropout Risk', icon: <AlertTriangle />, color: 'text-red-500' },
  celebration: { label: 'Celebration', icon: <PartyPopper />, color: 'text-amber-500' },
  intervention: { label: 'Intervention', icon: <Shield />, color: 'text-orange-500' },
  custom: { label: 'Custom', icon: <FileText />, color: 'text-gray-500' },
};

type AdminTab = 'reports' | 'automations' | 'groups' | 'protocols';

// Extended protocol type for admin view with user info
interface AdminProtocolView extends MIOInsightProtocol {
  user_profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

export default function ReportManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<AdminTab>('reports');

  // State
  const [reports, setReports] = useState<MIOUserReport[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedReport, setSelectedReport] = useState<MIOUserReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Generate Report Dialog State
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedReportType, setSelectedReportType] = useState<MIOReportType>('weekly_insight');
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Group selection for report generation
  const [groups, setGroups] = useState<MIOUserGroup[]>([]);
  const [targetMode, setTargetMode] = useState<'user' | 'group'>('user');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // Protocols tab state
  const [protocols, setProtocols] = useState<AdminProtocolView[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<MIOInsightProtocolWithProgress | null>(null);
  const [isLoadingProtocols, setIsLoadingProtocols] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchReports();
    fetchUsers();
    fetchGroups();
    fetchProtocols();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const data = await getAllMIOReports({ limit: 100 });
      setReports(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Use Edge Function to bypass RLS on gh_approved_users
      // Returns all active users with user_id populated (signed up)
      const result = await callAdminGroupAPI('list_users');
      setUsers((result.data || []) as UserProfile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const result = await callAdminGroupAPI('list_groups');
      setGroups((result.data || []) as MIOUserGroup[]);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchProtocols = async () => {
    try {
      setIsLoadingProtocols(true);
      const { data, error } = await supabase
        .from('mio_weekly_protocols')
        .select('*, user_profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setProtocols((data || []) as AdminProtocolView[]);
    } catch (error) {
      console.error('Error fetching protocols:', error);
      toast({
        title: 'Error',
        description: 'Failed to load protocols',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProtocols(false);
    }
  };

  const loadProtocolDetail = async (protocolId: string) => {
    const protocol = await getProtocolById(protocolId);
    setSelectedProtocol(protocol);
  };

  const handleMuteProtocol = async (protocolId: string, reason: string) => {
    if (!user?.id) return;
    try {
      setIsProcessing(true);
      await muteProtocol(protocolId, user.id, reason);
      toast({ title: 'Success', description: 'Protocol muted' });
      fetchProtocols();
      setSelectedProtocol(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to mute protocol', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnmuteProtocol = async (protocolId: string) => {
    try {
      setIsProcessing(true);
      await unmuteProtocol(protocolId);
      toast({ title: 'Success', description: 'Protocol unmuted' });
      fetchProtocols();
      setSelectedProtocol(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to unmute protocol', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getProtocolStatusBadge = (status: string, muted?: boolean) => {
    if (muted) {
      return <Badge className="bg-amber-500">Muted</Badge>;
    }
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      case 'skipped':
        return <Badge variant="secondary">Skipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      setIsProcessing(true);
      await deleteMIOReport(reportId);
      toast({ title: 'Success', description: 'Report deleted successfully' });
      fetchReports();
      setSelectedReport(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete report', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePin = async (report: MIOUserReport) => {
    try {
      setIsProcessing(true);
      await toggleMIOReportPin(report.id, !report.pinned);
      toast({ title: 'Success', description: report.pinned ? 'Report unpinned' : 'Report pinned' });
      fetchReports();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update pin status', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async (reportId: string) => {
    try {
      setIsProcessing(true);
      await updateMIOReportStatus(reportId, 'archived');
      toast({ title: 'Success', description: 'Report archived' });
      fetchReports();
      setSelectedReport(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to archive report', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  // n8n webhook URL for MIO report generation
  const N8N_WEBHOOK_URL = 'https://n8n-n8n.vq00fr.easypanel.host/webhook/mio-report-v5';

  // Generate report for selected user or group via n8n workflow
  const handleGenerateReport = async () => {
    if (targetMode === 'user' && !selectedUserId) {
      toast({ title: 'Error', description: 'Please select a user', variant: 'destructive' });
      return;
    }
    if (targetMode === 'group' && !selectedGroupId) {
      toast({ title: 'Error', description: 'Please select a group', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      let webhookPayload: Record<string, any>;
      let targetDescription: string;

      if (targetMode === 'user') {
        const user = users.find(u => u.id === selectedUserId);
        const userName = user?.full_name || user?.email || 'User';
        targetDescription = userName;
        webhookPayload = {
          target_type: 'individual',
          target_config: {
            user_ids: [user?.user_id], // Use user_id which maps to user_profiles.id
          },
          report_type: selectedReportType,
          triggered_by: 'admin_manual',
          requester_id: user?.user_id,
          user_name: userName,
        };
      } else {
        const group = groups.find(g => g.id === selectedGroupId);
        targetDescription = group?.name || 'Group';
        webhookPayload = {
          target_type: 'custom_group',
          target_config: {
            group_id: selectedGroupId,
          },
          report_type: selectedReportType,
          triggered_by: 'admin_manual',
          group_name: targetDescription,
        };
      }

      // Trigger n8n workflow via webhook
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('n8n webhook error:', errorText);
        throw new Error(`Webhook failed: ${response.status}`);
      }

      toast({
        title: 'Report Generation Started',
        description: targetMode === 'user'
          ? `MIO is analyzing ${targetDescription}'s data. The report will appear shortly.`
          : `MIO is generating reports for all members of "${targetDescription}". Reports will appear shortly.`
      });
      setShowGenerateDialog(false);
      setSelectedUserId('');
      setSelectedGroupId('');
      setTargetMode('user');

      // Refresh reports after a delay to allow n8n to complete
      setTimeout(() => fetchReports(), 5000);
    } catch (error) {
      console.error('Error triggering report generation:', error);
      toast({
        title: 'Error',
        description: 'Failed to trigger report generation. Check n8n workflow status.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate report content based on type
  const generateReportContent = (
    type: MIOReportType,
    userName: string,
    completionRate: number,
    streak: number,
    practices: any[]
  ): MIOReportContent => {
    const now = new Date();

    switch (type) {
      case 'weekly_insight':
        return {
          sections: [
            {
              title: 'Weekly Overview',
              content: `${userName} has maintained a ${(completionRate * 100).toFixed(0)}% practice completion rate this week with a ${streak}-day streak. ${completionRate > 0.7 ? 'Excellent consistency!' : 'There is room for improvement in daily practice adherence.'}`,
              type: 'insight',
            },
            {
              title: 'Pattern Observations',
              content: `Based on recent practice data, ${userName} shows ${streak > 7 ? 'strong commitment to the PROTECT method' : 'emerging patterns in practice behavior'}. ${practices.length > 0 ? `Last practice was on ${new Date(practices[0]?.practice_date).toLocaleDateString()}.` : 'No recent practice data available.'}`,
              type: 'insight',
            },
            {
              title: 'Focus Area',
              content: completionRate < 0.5
                ? 'Consider establishing a more consistent practice routine. Morning practices tend to have higher completion rates.'
                : 'Maintain current momentum and consider deepening engagement with reflection components.',
              type: 'action',
            },
          ],
          metrics: {
            streak,
            completion_rate: completionRate,
            practices_completed: practices.filter(p => p.completed).length,
            total_practices: practices.length,
          },
          recommendations: [
            completionRate < 0.7 ? 'Set a daily reminder for practice time' : 'Consider mentoring other users',
            streak < 7 ? 'Focus on building a 7-day streak first' : 'Challenge yourself with deeper reflection exercises',
            'Review and update your identity statements weekly',
          ],
          action_items: [
            { title: 'Complete today\'s PROTECT practice', priority: 'high' },
            { title: 'Review weekly insights with accountability partner', priority: 'medium' },
            { title: 'Update goal visualizations', priority: 'low' },
          ],
        };

      case 'pattern_analysis':
        return {
          sections: [
            {
              title: 'Behavioral Pattern Analysis',
              content: `Analyzing ${userName}'s practice patterns over the past 30 days reveals ${streak > 14 ? 'strong identity shift indicators' : streak > 7 ? 'developing consistency patterns' : 'early-stage pattern formation'}. The data suggests ${completionRate > 0.8 ? 'high engagement with the transformation process' : 'opportunities for deeper engagement'}.`,
              type: 'insight',
            },
            {
              title: 'Identity Collision Indicators',
              content: `Current patterns suggest ${userName} is ${streak > 21 ? 'successfully navigating identity collision' : 'in the process of identity negotiation'}. Key indicators include practice timing consistency and reflection depth.`,
              type: 'insight',
            },
          ],
          metrics: {
            pattern_awareness_score: Math.min(0.95, (completionRate * 0.6) + (streak * 0.02)),
            consistency_index: completionRate,
            streak,
          },
          recommendations: [
            'Continue pattern awareness exercises',
            'Document trigger moments for analysis',
            'Share breakthrough moments with MIO',
          ],
        };

      case 'dropout_risk':
        const riskScore = Math.max(0, 1 - completionRate - (streak * 0.05));
        return {
          sections: [
            {
              title: 'Risk Assessment',
              content: `${userName} shows a ${(riskScore * 100).toFixed(0)}% dropout risk based on recent engagement patterns. ${riskScore > 0.5 ? 'Immediate intervention recommended.' : riskScore > 0.3 ? 'Proactive outreach suggested.' : 'Low risk, continue monitoring.'}`,
              type: 'warning',
            },
            {
              title: 'Contributing Factors',
              content: `Key factors: ${streak < 3 ? 'Broken streak pattern. ' : ''}${completionRate < 0.5 ? 'Low completion rate. ' : ''}${practices.length < 5 ? 'Limited practice history. ' : ''}`,
              type: 'insight',
            },
          ],
          metrics: {
            dropout_risk_score: riskScore,
            streak,
            completion_rate: completionRate,
          },
          action_items: [
            { title: 'Send personalized check-in message', priority: riskScore > 0.5 ? 'high' : 'medium' },
            { title: 'Schedule accountability call', priority: riskScore > 0.7 ? 'high' : 'low' },
          ],
        };

      case 'breakthrough_detection':
        return {
          sections: [
            {
              title: 'Breakthrough Detected!',
              content: `${userName} has achieved a significant milestone: ${streak}-day streak with ${(completionRate * 100).toFixed(0)}% completion rate. This indicates a successful transition in identity patterns.`,
              type: 'celebration',
            },
            {
              title: 'What This Means',
              content: 'The neural pathways supporting the new identity are strengthening. Continued practice will solidify these patterns and make them automatic.',
              type: 'insight',
            },
          ],
          metrics: {
            breakthrough_probability: Math.min(0.95, completionRate * 0.5 + streak * 0.03),
            streak,
            completion_rate: completionRate,
          },
          recommendations: [
            'Celebrate this achievement!',
            'Share your breakthrough with your accountability partner',
            'Set the next milestone goal',
          ],
        };

      case 'celebration':
        return {
          sections: [
            {
              title: 'Time to Celebrate!',
              content: `Congratulations ${userName}! Your dedication to the Mind Insurance process is paying off. ${streak}-day streak achieved!`,
              type: 'celebration',
            },
          ],
          metrics: { streak, completion_rate: completionRate },
          recommendations: ['Share your success', 'Reward yourself', 'Help others on their journey'],
        };

      case 'intervention':
        return {
          sections: [
            {
              title: 'Intervention Required',
              content: `${userName} needs support to get back on track. Recent patterns indicate disengagement from the practice routine.`,
              type: 'warning',
            },
            {
              title: 'Recommended Actions',
              content: 'Personalized outreach with empathy-first approach. Focus on understanding barriers rather than pushing compliance.',
              type: 'action',
            },
          ],
          metrics: { streak, completion_rate: completionRate },
          action_items: [
            { title: 'Personal phone call from coach', priority: 'high' },
            { title: 'Adjust practice schedule if needed', priority: 'medium' },
          ],
        };

      default:
        return {
          sections: [
            { title: 'Custom Report', content: `Report generated for ${userName}.`, type: 'insight' },
          ],
          metrics: { streak, completion_rate: completionRate },
        };
    }
  };

  // Convert report to markdown
  const reportToMarkdown = (report: MIOUserReport, user?: UserProfile): string => {
    const lines: string[] = [];
    const userName = user?.full_name || user?.email || report.user_id;

    lines.push(`# ${report.title}`);
    lines.push('');
    lines.push(`**Report Type:** ${REPORT_TYPE_CONFIG[report.report_type]?.label || report.report_type}`);
    lines.push(`**User:** ${userName}`);
    lines.push(`**Generated:** ${new Date(report.created_at).toLocaleString()}`);
    lines.push(`**Priority:** ${report.priority}`);
    if (report.confidence_score) {
      lines.push(`**Confidence:** ${(report.confidence_score * 100).toFixed(0)}%`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');

    if (report.summary) {
      lines.push('## Summary');
      lines.push('');
      lines.push(report.summary);
      lines.push('');
    }

    if (report.content.sections && report.content.sections.length > 0) {
      for (const section of report.content.sections) {
        lines.push(`## ${section.title}`);
        lines.push('');
        lines.push(section.content);
        lines.push('');
      }
    }

    if (report.content.metrics && Object.keys(report.content.metrics).length > 0) {
      lines.push('## Metrics');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      for (const [key, value] of Object.entries(report.content.metrics)) {
        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        let displayValue = value?.toString() || '-';
        if (typeof value === 'number' && value < 1 && value > 0) {
          displayValue = `${(value * 100).toFixed(0)}%`;
        }
        lines.push(`| ${displayKey} | ${displayValue} |`);
      }
      lines.push('');
    }

    if (report.content.recommendations && report.content.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      for (const rec of report.content.recommendations) {
        lines.push(`- ${rec}`);
      }
      lines.push('');
    }

    if (report.content.action_items && report.content.action_items.length > 0) {
      lines.push('## Action Items');
      lines.push('');
      for (const item of report.content.action_items) {
        const priorityBadge = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
        lines.push(`- ${priorityBadge} **[${item.priority.toUpperCase()}]** ${item.title}`);
        if (item.description) {
          lines.push(`  - ${item.description}`);
        }
      }
      lines.push('');
    }

    if (report.content.raw_analysis) {
      lines.push('## Detailed Analysis');
      lines.push('');
      lines.push(report.content.raw_analysis);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push(`*Generated by Mind Insurance Oracle (MIO) • Source: ${report.source}*`);
    if (report.source_workflow_id) {
      lines.push(`*Workflow ID: ${report.source_workflow_id}*`);
    }

    return lines.join('\n');
  };

  // Download report as markdown
  const handleDownloadMarkdown = (report: MIOUserReport) => {
    const user = users.find(u => u.id === report.user_id);
    const markdown = reportToMarkdown(report, user);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = `MIO-Report-${report.report_type}-${user?.full_name?.replace(/\s+/g, '-') || report.user_id.slice(0, 8)}-${new Date(report.created_at).toISOString().split('T')[0]}.md`;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: `Report saved as ${fileName}` });
  };

  const getTypeConfig = (type: MIOReportType) => {
    return REPORT_TYPE_CONFIG[type] || REPORT_TYPE_CONFIG.custom;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge className="bg-red-500">Urgent</Badge>;
      case 'high': return <Badge className="bg-orange-500">High</Badge>;
      case 'normal': return <Badge variant="secondary">Normal</Badge>;
      case 'low': return <Badge variant="outline">Low</Badge>;
      default: return null;
    }
  };

  const getStatusBadge = (status: MIOReportDisplayStatus) => {
    switch (status) {
      case 'unread': return <Badge className="bg-blue-500">Unread</Badge>;
      case 'read': return <Badge variant="secondary">Read</Badge>;
      case 'archived': return <Badge variant="outline">Archived</Badge>;
      case 'dismissed': return <Badge variant="outline" className="text-gray-400">Dismissed</Badge>;
    }
  };

  // Filter and sort reports
  const filteredReports = reports.filter((report) => {
    if (filterType !== 'all' && report.report_type !== filterType) return false;
    if (filterStatus !== 'all' && report.display_status !== filterStatus) return false;
    return true;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Filter users for search
  const filteredUsers = users.filter(user => {
    if (!userSearchQuery) return true;
    const query = userSearchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <SidebarLayout
      mode="admin"
      showHeader
      headerTitle="MIO Reports"
      headerSubtitle="Generate, view, and automate AI behavioral insights"
      headerGradient="linear-gradient(135deg, hsl(270 70% 45%), hsl(240 70% 50%))"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="protocols" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Protocols
            </TabsTrigger>
            <TabsTrigger value="automations" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Automations
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Groups
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Report Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={fetchReports} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setShowGenerateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold">{reports.length}</p>
                </div>
                <FileText className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unread</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {reports.filter((r) => r.display_status === 'unread').length}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {reports.filter((r) => r.priority === 'urgent' || r.priority === 'high').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Users</p>
                  <p className="text-2xl font-bold text-green-600">{users.length}</p>
                </div>
                <User className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(REPORT_TYPE_CONFIG).map(([type, config]) => (
                  <SelectItem key={type} value={type}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : sortedReports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No reports yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate a report by selecting a user above
              </p>
              <Button onClick={() => setShowGenerateDialog(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate First Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedReports.map((report) => {
              const typeConfig = getTypeConfig(report.report_type);
              const user = users.find(u => u.id === report.user_id);
              return (
                <Card
                  key={report.id}
                  className={`hover:shadow-md transition-shadow cursor-pointer ${
                    report.pinned ? 'border-amber-300 bg-amber-50/50' : ''
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={typeConfig.color}>
                            {React.cloneElement(typeConfig.icon as React.ReactElement, {
                              className: 'h-5 w-5',
                            })}
                          </span>
                          <h3 className="text-lg font-semibold truncate">{report.title}</h3>
                          {report.pinned && <Pin className="h-4 w-4 text-amber-500" />}
                          {getStatusBadge(report.display_status)}
                          {getPriorityBadge(report.priority)}
                        </div>
                        {report.summary && (
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {report.summary}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {user?.full_name || user?.email || report.user_id.slice(0, 8) + '...'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-400">Source: {report.source}</span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadMarkdown(report)}
                          title="Download as Markdown"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePin(report)}
                          disabled={isProcessing}
                        >
                          {report.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleArchive(report.id)}
                          disabled={isProcessing}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(report.id)}
                          disabled={isProcessing}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
          </TabsContent>

          {/* Automations Tab */}
          <TabsContent value="automations">
            <ReportAutomationConfig />
          </TabsContent>

          {/* User Groups Tab */}
          <TabsContent value="groups">
            <UserGroupManager />
          </TabsContent>

          {/* Protocols Tab */}
          <TabsContent value="protocols" className="space-y-6">
            {/* Refresh Button */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={fetchProtocols} disabled={isLoadingProtocols}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingProtocols ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Protocol Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Protocols</p>
                      <p className="text-2xl font-bold">{protocols.length}</p>
                    </div>
                    <Brain className="h-8 w-8 text-cyan-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold text-green-600">
                        {protocols.filter(p => p.status === 'active' && !p.muted_by_coach).length}
                      </p>
                    </div>
                    <PlayCircle className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {protocols.filter(p => p.status === 'completed').length}
                      </p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Completion</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {protocols.length > 0
                          ? `${Math.round(
                              (protocols.reduce((sum, p) => sum + (p.days_completed || 0), 0) /
                                (protocols.length * 7)) *
                                100
                            )}%`
                          : '0%'}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Protocols List */}
            {isLoadingProtocols ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : protocols.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No protocols yet</h3>
                  <p className="text-muted-foreground">
                    Protocols are generated automatically by MIO when reports are created
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {protocols.map((protocol) => (
                  <Card
                    key={protocol.id}
                    className={`hover:shadow-md transition-shadow cursor-pointer ${
                      protocol.muted_by_coach ? 'border-amber-300 bg-amber-50/50' : ''
                    }`}
                    onClick={() => loadProtocolDetail(protocol.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Brain className="h-5 w-5 text-cyan-500" />
                            <h3 className="text-lg font-semibold truncate">{protocol.title}</h3>
                            {getProtocolStatusBadge(protocol.status, protocol.muted_by_coach)}
                          </div>
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {protocol.insight_summary}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {protocol.user_profiles?.full_name ||
                                protocol.user_profiles?.email ||
                                protocol.user_id.slice(0, 8) + '...'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Week {protocol.week_number}, {protocol.year}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Day {protocol.current_day}/7 ({protocol.days_completed} done)
                            </span>
                          </div>
                        </div>
                        {/* Progress indicator */}
                        <div className="flex items-center gap-2">
                          <Progress
                            value={((protocol.days_completed || 0) / 7) * 100}
                            className="w-20 h-2"
                          />
                          <span className="text-sm text-muted-foreground w-10">
                            {Math.round(((protocol.days_completed || 0) / 7) * 100)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Generate Report Dialog */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-500" />
                Generate MIO Report
              </DialogTitle>
              <DialogDescription>
                Select a user or group and report type to generate behavioral analysis reports.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Target Mode Toggle */}
              <div className="space-y-2">
                <Label>Generate Report For</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={targetMode === 'user' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setTargetMode('user');
                      setSelectedGroupId('');
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Individual User
                  </Button>
                  <Button
                    type="button"
                    variant={targetMode === 'group' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setTargetMode('group');
                      setSelectedUserId('');
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    User Group
                  </Button>
                </div>
              </div>

              {/* User Picker - shown when targetMode is 'user' */}
              {targetMode === 'user' && (
                <div className="space-y-2">
                  <Label>Select User</Label>
                  <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedUser ? (
                          <span className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {selectedUser.full_name || selectedUser.email}
                            <Badge variant="outline" className="text-xs ml-1">{selectedUser.tier}</Badge>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Search for a user...</span>
                        )}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search by name or email..."
                          value={userSearchQuery}
                          onValueChange={setUserSearchQuery}
                        />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty>No users found.</CommandEmpty>
                          <CommandGroup heading={`${filteredUsers.length} users${userSearchQuery ? ' matching' : ' total'}`}>
                            {filteredUsers.slice(0, 50).map((user) => {
                              const hasName = user.full_name && user.full_name.trim().length > 0;
                              const searchValue = `${user.full_name || ''} ${user.email || ''}`.trim();
                              return (
                                <CommandItem
                                  key={user.id}
                                  value={searchValue}
                                  onSelect={() => {
                                    setSelectedUserId(user.id);
                                    setUserSearchOpen(false);
                                    setUserSearchQuery('');
                                  }}
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  <div className="flex flex-col">
                                    <span className="flex items-center gap-2">
                                      {hasName ? user.full_name : (user.email || 'Unknown user')}
                                      <Badge variant="outline" className="text-xs">{user.tier}</Badge>
                                    </span>
                                    {hasName && user.email && (
                                      <span className="text-xs text-muted-foreground">{user.email}</span>
                                    )}
                                  </div>
                                </CommandItem>
                              );
                            })}
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
                </div>
              )}

              {/* Group Picker - shown when targetMode is 'group' */}
              {targetMode === 'group' && (
                <div className="space-y-2">
                  <Label>Select Group</Label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user group..." />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          No groups available. Create one in the User Groups tab.
                        </div>
                      ) : (
                        groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {group.name}
                              <Badge variant="outline" className="text-xs">{group.group_type}</Badge>
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedGroupId && (
                    <p className="text-xs text-muted-foreground">
                      Reports will be generated for all members in this group.
                    </p>
                  )}
                </div>
              )}

              {/* Report Type */}
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select
                  value={selectedReportType}
                  onValueChange={(v) => setSelectedReportType(v as MIOReportType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REPORT_TYPE_CONFIG).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        <span className="flex items-center gap-2">
                          <span className={config.color}>
                            {React.cloneElement(config.icon as React.ReactElement, {
                              className: 'h-4 w-4',
                            })}
                          </span>
                          {config.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating || (targetMode === 'user' ? !selectedUserId : !selectedGroupId)}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Report{targetMode === 'group' ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report Detail Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedReport && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className={getTypeConfig(selectedReport.report_type).color}>
                      {React.cloneElement(
                        getTypeConfig(selectedReport.report_type).icon as React.ReactElement,
                        { className: 'h-5 w-5' }
                      )}
                    </span>
                    {selectedReport.title}
                  </DialogTitle>
                  <DialogDescription>
                    {getTypeConfig(selectedReport.report_type).label} •{' '}
                    {new Date(selectedReport.created_at).toLocaleString()}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Download Button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadMarkdown(selectedReport)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download .md
                    </Button>
                  </div>

                  {/* Summary */}
                  {selectedReport.summary && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm">{selectedReport.summary}</p>
                    </div>
                  )}

                  {/* Sections */}
                  {selectedReport.content.sections?.map((section, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">{section.title}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {section.content}
                      </p>
                    </div>
                  ))}

                  {/* Metrics */}
                  {selectedReport.content.metrics && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Metrics</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedReport.content.metrics).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-sm text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="font-medium">
                              {typeof value === 'number' && value < 1
                                ? `${(value * 100).toFixed(0)}%`
                                : value?.toString() || '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {selectedReport.content.recommendations && selectedReport.content.recommendations.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedReport.content.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-muted-foreground">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {selectedReport.content.action_items && selectedReport.content.action_items.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Action Items</h4>
                      <div className="space-y-2">
                        {selectedReport.content.action_items.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Badge
                              variant={
                                item.priority === 'high' ? 'destructive' :
                                item.priority === 'medium' ? 'default' : 'secondary'
                              }
                              className="mt-0.5 text-xs"
                            >
                              {item.priority}
                            </Badge>
                            <span className="text-sm">{item.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="text-xs text-muted-foreground border-t pt-4">
                    <p>User: {users.find(u => u.id === selectedReport.user_id)?.full_name || selectedReport.user_id}</p>
                    <p>Source: {selectedReport.source}</p>
                    {selectedReport.confidence_score && (
                      <p>Confidence: {(selectedReport.confidence_score * 100).toFixed(0)}%</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Protocol Detail Dialog */}
        <Dialog open={!!selectedProtocol} onOpenChange={() => setSelectedProtocol(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedProtocol && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-cyan-500" />
                    {selectedProtocol.title}
                  </DialogTitle>
                  <DialogDescription>
                    Week {selectedProtocol.week_number}, {selectedProtocol.year} •{' '}
                    Day {selectedProtocol.current_day}/7 • {selectedProtocol.days_completed} completed
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Status & Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getProtocolStatusBadge(selectedProtocol.status, selectedProtocol.muted_by_coach)}
                      <Progress
                        value={(selectedProtocol.days_completed / 7) * 100}
                        className="w-24 h-2"
                      />
                      <span className="text-sm text-muted-foreground">
                        {Math.round((selectedProtocol.days_completed / 7) * 100)}%
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {selectedProtocol.muted_by_coach ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnmuteProtocol(selectedProtocol.id)}
                          disabled={isProcessing}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Unmute
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const reason = prompt('Enter reason for muting this protocol:');
                            if (reason) handleMuteProtocol(selectedProtocol.id, reason);
                          }}
                          disabled={isProcessing}
                        >
                          <PauseCircle className="mr-2 h-4 w-4" />
                          Mute
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Muted Warning */}
                  {selectedProtocol.muted_by_coach && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-amber-800 text-sm">
                        This protocol has been muted by a coach.
                        {selectedProtocol.muted_reason && (
                          <span className="block mt-1 text-amber-700">
                            Reason: {selectedProtocol.muted_reason}
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Insight Summary */}
                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                    <h4 className="font-semibold text-cyan-900 mb-2">Insight Summary</h4>
                    <p className="text-sm text-cyan-800">{selectedProtocol.insight_summary}</p>
                  </div>

                  {/* Why It Matters */}
                  {selectedProtocol.why_it_matters && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Why It Matters</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedProtocol.why_it_matters}
                      </p>
                    </div>
                  )}

                  {/* Neural Principle */}
                  {selectedProtocol.neural_principle && (
                    <div className="border rounded-lg p-4 bg-purple-50/50">
                      <h4 className="font-semibold mb-2 text-purple-900">Neural Principle</h4>
                      <p className="text-sm text-purple-800 italic">
                        "{selectedProtocol.neural_principle}"
                      </p>
                    </div>
                  )}

                  {/* 7-Day Tasks */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">7-Day Protocol</h4>
                    <div className="space-y-3">
                      {selectedProtocol.day_tasks?.map((task: MIOInsightDayTask) => {
                        const completion = selectedProtocol.completions?.find(
                          (c) => c.day_number === task.day
                        );
                        const isCompleted = completion && !completion.was_skipped;
                        const wasSkipped = completion?.was_skipped;
                        const isCurrent = task.day === selectedProtocol.current_day;

                        return (
                          <div
                            key={task.day}
                            className={`p-3 rounded-lg border ${
                              isCompleted
                                ? 'bg-green-50 border-green-200'
                                : wasSkipped
                                ? 'bg-gray-50 border-gray-200 opacity-60'
                                : isCurrent
                                ? 'bg-cyan-50 border-cyan-300'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : wasSkipped ? (
                                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                ) : isCurrent ? (
                                  <div className="h-5 w-5 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold">
                                    {task.day}
                                  </div>
                                ) : (
                                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs text-gray-400">
                                    {task.day}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    Day {task.day}: {task.task_title}
                                  </span>
                                  {isCurrent && !isCompleted && (
                                    <Badge className="bg-cyan-500 text-xs">Current</Badge>
                                  )}
                                  {wasSkipped && (
                                    <Badge variant="secondary" className="text-xs">Skipped</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{task.theme}</p>
                                {completion?.completed_at && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Completed: {new Date(completion.completed_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="text-xs text-muted-foreground border-t pt-4">
                    <p>User ID: {selectedProtocol.user_id}</p>
                    <p>Source: {selectedProtocol.source}</p>
                    <p>Created: {new Date(selectedProtocol.created_at).toLocaleString()}</p>
                    {selectedProtocol.confidence_score && (
                      <p>Confidence: {(selectedProtocol.confidence_score * 100).toFixed(0)}%</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  );
}
