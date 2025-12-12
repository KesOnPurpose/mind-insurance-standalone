import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAccessControl, UserTier, TIER_HIERARCHY } from '@/hooks/useAccessControl';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Plus,
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  Upload,
  Download,
  RefreshCw,
  Mail,
  Send,
} from 'lucide-react';
import { sendUserInvite, sendBulkInvites } from '@/services/userInviteService';
import { parseCsvText, parseCsvFile } from '@/utils/csvParser';
import { downloadCsvTemplate } from '@/utils/csvTemplate';
import type { ParsedCsvData, CsvImportProgress } from '@/types/csvImport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ApprovedUser {
  id: string;
  email: string;
  user_id: string | null;
  tier: UserTier;
  is_active: boolean;
  full_name: string | null;
  phone: string | null;
  notes: string | null;
  payment_source: string | null;
  payment_reference: string | null;
  expires_at: string | null;
  approved_at: string;
  last_access_at: string | null;
  invited_at: string | null;
  created_at: string;
}

const TIER_OPTIONS: { value: NonNullable<UserTier>; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'coach', label: 'Coach' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'owner', label: 'Owner' },
];

const TIER_COLORS: Record<NonNullable<UserTier>, string> = {
  user: 'bg-slate-500',
  coach: 'bg-blue-500',
  admin: 'bg-purple-500',
  super_admin: 'bg-orange-500',
  owner: 'bg-red-500',
};

export default function UserManagement() {
  const { tier: currentUserTier, isAdmin, isSuperAdmin, isOwner } = useAccessControl();
  const { user } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<ApprovedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApprovedUser | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    tier: 'user' as NonNullable<UserTier>,
    notes: '',
    payment_source: 'manual',
    payment_reference: '',
  });
  const [sendInviteOnAdd, setSendInviteOnAdd] = useState(true);
  const [isInviting, setIsInviting] = useState(false);

  // CSV Import states
  const [csvData, setCsvData] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCsv, setParsedCsv] = useState<ParsedCsvData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<CsvImportProgress | null>(null);
  const [csvInputMethod, setCsvInputMethod] = useState<'paste' | 'upload'>('paste');
  const [sendInvitesAfterImport, setSendInvitesAfterImport] = useState(true);

  // Bulk selection states
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Status sync state
  const [isSyncingUserIds, setIsSyncingUserIds] = useState(false);

  // Fetch users using RPC function (bypasses RLS)
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('gh_admin_get_all_users');

      if (error) throw error;
      setUsers(data as ApprovedUser[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = filterTier === 'all' || user.tier === filterTier;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && user.is_active) ||
        (filterStatus === 'inactive' && !user.is_active);

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [users, searchQuery, filterTier, filterStatus]);

  // Check if current user can modify target tier
  const canModifyTier = (targetTier: UserTier, targetUserEmail?: string): boolean => {
    if (!currentUserTier || !targetTier) return false;

    // Owners can modify anyone (including themselves)
    if (isOwner) return true;

    // Check if trying to edit themselves
    const isEditingSelf = targetUserEmail && user?.email &&
                          targetUserEmail.toLowerCase() === user.email.toLowerCase();

    // Admins (non-super admins) cannot edit themselves
    if (isAdmin && !isSuperAdmin && isEditingSelf) return false;

    // Admins cannot modify super_admin or owner tiers
    if (isAdmin && !isSuperAdmin && (targetTier === 'super_admin' || targetTier === 'owner')) {
      return false;
    }

    // Cannot modify owner tier unless you are owner
    if (targetTier === 'owner') return false;

    // Must be higher tier to modify
    return TIER_HIERARCHY[currentUserTier] > TIER_HIERARCHY[targetTier];
  };

  // Bulk selection helpers
  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0) {
      // Deselect all
      setSelectedUserIds(new Set());
    } else {
      // Select all filtered users
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const isAllSelected = filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length;
  const isSomeSelected = selectedUserIds.size > 0 && selectedUserIds.size < filteredUsers.length;

  // Add single user using RPC function (bypasses RLS)
  const handleAddUser = async () => {
    if (!formData.email) {
      toast({ title: 'Error', description: 'Email is required', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.rpc('gh_admin_add_user', {
        p_email: formData.email.toLowerCase().trim(),
        p_full_name: formData.full_name || null,
        p_phone: formData.phone || null,
        p_tier: formData.tier,
        p_notes: formData.notes || null,
        p_payment_source: formData.payment_source,
        p_payment_reference: formData.payment_reference || null,
      });

      if (error) {
        if (error.message?.includes('duplicate') || error.code === '23505') {
          toast({ title: 'Error', description: 'This email is already approved', variant: 'destructive' });
        } else {
          throw error;
        }
        return;
      }

      // Send invite email if toggled on
      if (sendInviteOnAdd) {
        try {
          setIsInviting(true);
          await sendUserInvite({
            email: formData.email.toLowerCase().trim(),
            full_name: formData.full_name || undefined,
          });
          toast({ title: 'Success', description: 'User added and invite sent!' });
        } catch (inviteError) {
          console.error('Error sending invite:', inviteError);
          toast({
            title: 'Partial Success',
            description: 'User added but invite email failed. You can resend from the user menu.',
            variant: 'default',
          });
        } finally {
          setIsInviting(false);
        }
      } else {
        toast({ title: 'Success', description: 'User added successfully' });
      }

      setIsAddDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({ title: 'Error', description: 'Failed to add user', variant: 'destructive' });
    }
  };

  // Send invite to existing user
  const handleSendInvite = async (user: ApprovedUser) => {
    try {
      setIsInviting(true);
      await sendUserInvite({
        email: user.email,
        full_name: user.full_name || undefined,
      });
      toast({ title: 'Success', description: `Invite sent to ${user.email}` });
      fetchUsers(); // Refresh to show updated invited_at
    } catch (error) {
      console.error('Error sending invite:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invite';

      // Check for rate limit error
      if (errorMessage.includes('59 seconds') || errorMessage.includes('rate_limit')) {
        toast({
          title: 'Rate Limited',
          description: 'Please wait 60 seconds before sending another invite to this email. This is a security feature.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsInviting(false);
    }
  };

  // Update user using RPC function (bypasses RLS)
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase.rpc('gh_admin_update_user', {
        p_user_id: selectedUser.id,
        p_full_name: formData.full_name || null,
        p_phone: formData.phone || null,
        p_tier: formData.tier,
        p_notes: formData.notes || null,
        p_payment_source: formData.payment_source,
        p_payment_reference: formData.payment_reference || null,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'User updated successfully' });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' });
    }
  };

  // Toggle user active status using RPC function (bypasses RLS)
  const handleToggleStatus = async (user: ApprovedUser) => {
    try {
      const { error } = await supabase.rpc('gh_admin_update_user', {
        p_user_id: user.id,
        p_is_active: !user.is_active,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${user.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({ title: 'Error', description: 'Failed to update user status', variant: 'destructive' });
    }
  };

  // Delete user using RPC function (bypasses RLS)
  const handleDeleteUser = async (user: ApprovedUser) => {
    if (!confirm(`Are you sure you want to remove ${user.email} from the approved list?`)) {
      return;
    }

    try {
      const { error } = await supabase.rpc('gh_admin_delete_user', {
        p_user_id: user.id,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'User removed successfully' });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ title: 'Error', description: 'Failed to remove user', variant: 'destructive' });
    }
  };

  // Bulk delete users
  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    const selectedUsers = users.filter(u => selectedUserIds.has(u.id));
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const user of selectedUsers) {
        try {
          const { error } = await supabase.rpc('gh_admin_delete_user', {
            p_user_id: user.id,
          });

          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error(`Error deleting user ${user.email}:`, error);
          errorCount++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast({
        title: 'Bulk Delete Complete',
        description: `${successCount} users removed${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });

      // Clear selection and refresh
      setSelectedUserIds(new Set());
      setShowBulkDeleteDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete bulk delete',
        variant: 'destructive',
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Bulk send invites
  const handleBulkSendInvites = async () => {
    const selectedUsers = users.filter(u => selectedUserIds.has(u.id));
    const selectedEmails = selectedUsers.map(u => u.email);

    try {
      setIsInviting(true);

      toast({
        title: 'Sending Invites',
        description: `Sending magic link invites to ${selectedEmails.length} users...`,
      });

      const { success, failed } = await sendBulkInvites(selectedEmails);

      toast({
        title: 'Invites Sent',
        description: `${success.length} invites sent successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
        variant: failed.length > 0 ? 'destructive' : 'default',
      });

      // Clear selection and refresh
      setSelectedUserIds(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Bulk invite error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send bulk invites',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  // Bulk activate users
  const handleBulkActivate = async () => {
    const selectedUsers = users.filter(u => selectedUserIds.has(u.id));
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const user of selectedUsers) {
        try {
          const { error } = await supabase
            .from('gh_approved_users')
            .update({ is_active: true })
            .eq('id', user.id);

          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error(`Error activating user ${user.email}:`, error);
          errorCount++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast({
        title: 'Bulk Activate Complete',
        description: `${successCount} users activated${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });

      // Clear selection and refresh
      setSelectedUserIds(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Bulk activate error:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete bulk activate',
        variant: 'destructive',
      });
    }
  };

  // Bulk deactivate users
  const handleBulkDeactivate = async () => {
    const selectedUsers = users.filter(u => selectedUserIds.has(u.id));
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const user of selectedUsers) {
        try {
          const { error } = await supabase
            .from('gh_approved_users')
            .update({ is_active: false })
            .eq('id', user.id);

          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error(`Error deactivating user ${user.email}:`, error);
          errorCount++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast({
        title: 'Bulk Deactivate Complete',
        description: `${successCount} users deactivated${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });

      // Clear selection and refresh
      setSelectedUserIds(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Bulk deactivate error:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete bulk deactivate',
        variant: 'destructive',
      });
    }
  };

  // Manual sync all user_ids (fixes stale status badges)
  const handleSyncAllUserIds = async () => {
    setIsSyncingUserIds(true);
    try {
      const { data, error } = await supabase.rpc('gh_admin_sync_all_user_ids');

      if (error) throw error;

      const syncCount = data?.length || 0;

      toast({
        title: 'Status Sync Complete',
        description: `${syncCount} user status${syncCount !== 1 ? 'es' : ''} updated`,
      });

      // Refresh table to show updated statuses
      fetchUsers();
    } catch (error) {
      console.error('Error syncing user IDs:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync user statuses',
        variant: 'destructive',
      });
    } finally {
      setIsSyncingUserIds(false);
    }
  };

  // Bulk add users using RPC function (bypasses RLS)
  // Parse CSV data (from paste or file upload)
  const handleParseCsv = () => {
    try {
      const parsed = parseCsvText(csvData);
      setParsedCsv(parsed);

      if (parsed.valid.length === 0 && parsed.invalid.length === 0) {
        toast({
          title: 'No Data',
          description: 'No valid data found in CSV',
          variant: 'destructive',
        });
      } else if (parsed.invalid.length > 0) {
        toast({
          title: 'Validation Warnings',
          description: `${parsed.valid.length} valid, ${parsed.invalid.length} invalid rows`,
        });
      } else {
        toast({
          title: 'CSV Parsed',
          description: `${parsed.valid.length} users ready to import`,
        });
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast({
        title: 'Parse Error',
        description: 'Failed to parse CSV data',
        variant: 'destructive',
      });
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseCsvFile(file);
      setCsvFile(file);
      setParsedCsv(parsed);

      if (parsed.valid.length === 0 && parsed.invalid.length === 0) {
        toast({
          title: 'No Data',
          description: 'No valid data found in CSV file',
          variant: 'destructive',
        });
      } else if (parsed.invalid.length > 0) {
        toast({
          title: 'Validation Warnings',
          description: `${parsed.valid.length} valid, ${parsed.invalid.length} invalid rows`,
        });
      } else {
        toast({
          title: 'File Uploaded',
          description: `${parsed.valid.length} users ready to import`,
        });
      }
    } catch (error) {
      console.error('Error reading CSV file:', error);
      toast({
        title: 'File Error',
        description: 'Failed to read CSV file',
        variant: 'destructive',
      });
    }
  };

  // Import users from CSV
  const handleCsvImport = async () => {
    if (!parsedCsv || parsedCsv.valid.length === 0) {
      toast({
        title: 'No Data',
        description: 'No valid users to import',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setImportProgress({
      total: parsedCsv.valid.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
    });

    const errors: Array<{ email: string; error: string }> = [];
    let successCount = 0;

    // Import users sequentially with rate limiting
    for (let i = 0; i < parsedCsv.valid.length; i++) {
      const user = parsedCsv.valid[i];

      try {
        const { error } = await supabase.rpc('gh_admin_add_user', {
          p_email: user.email,
          p_full_name: user.full_name || null,
          p_phone: user.phone || null,
          p_tier: user.tier,
          p_notes: user.notes || null,
          p_payment_source: user.payment_source || 'csv_import',
          p_payment_reference: null,
        });

        if (error) {
          // Check if user already exists
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            errors.push({ email: user.email, error: 'User already exists' });
          } else {
            throw error;
          }
        } else {
          successCount++;
        }
      } catch (error: any) {
        console.error(`Error adding user ${user.email}:`, error);
        errors.push({ email: user.email, error: error.message || 'Unknown error' });
      }

      // Update progress
      setImportProgress(prev => prev ? {
        ...prev,
        processed: i + 1,
        succeeded: successCount,
        failed: errors.length,
      } : null);

      // Rate limiting delay (200ms)
      if (i < parsedCsv.valid.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    setIsImporting(false);

    // Send invites if requested
    if (sendInvitesAfterImport && successCount > 0) {
      try {
        const successfulEmails = parsedCsv.valid
          .filter(user => !errors.find(e => e.email === user.email))
          .map(user => user.email);

        if (successfulEmails.length > 0) {
          toast({
            title: 'Sending Invites',
            description: `Sending magic link invites to ${successfulEmails.length} users...`,
          });

          const { success, failed } = await sendBulkInvites(successfulEmails);

          toast({
            title: 'Invites Sent',
            description: `${success.length} invites sent successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
            variant: failed.length > 0 ? 'destructive' : 'default',
          });
        }
      } catch (error) {
        console.error('Error sending bulk invites:', error);
        toast({
          title: 'Invite Error',
          description: 'Failed to send some invites. Users can still be invited manually.',
          variant: 'destructive',
        });
      }
    }

    // Show import summary
    const errorCount = errors.length;
    toast({
      title: 'Import Complete',
      description: `${successCount} users imported successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      variant: errorCount > 0 ? 'destructive' : 'default',
    });

    if (errorCount > 0) {
      console.error('[CSV Import] Failed rows:', errors);
    }

    // Reset and refresh
    setIsBulkDialogOpen(false);
    resetCsvImport();
    fetchUsers();
  };

  // Reset CSV import state
  const resetCsvImport = () => {
    setCsvData('');
    setCsvFile(null);
    setParsedCsv(null);
    setImportProgress(null);
    setCsvInputMethod('paste');
  };

  // Export users to CSV
  const handleExport = () => {
    const csv = [
      ['Email', 'Name', 'Tier', 'Status', 'Approved At', 'Last Access'].join(','),
      ...filteredUsers.map(u =>
        [
          u.email,
          u.full_name || '',
          u.tier,
          u.is_active ? 'Active' : 'Inactive',
          new Date(u.approved_at).toLocaleDateString(),
          u.last_access_at ? new Date(u.last_access_at).toLocaleDateString() : 'Never',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approved-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      phone: '',
      tier: 'user',
      notes: '',
      payment_source: 'manual',
      payment_reference: '',
    });
  };

  const openEditDialog = (user: ApprovedUser) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name || '',
      phone: user.phone || '',
      tier: user.tier || 'user',
      notes: user.notes || '',
      payment_source: user.payment_source || 'manual',
      payment_reference: user.payment_reference || '',
    });
    setIsEditDialogOpen(true);
  };

  if (!isAdmin) {
    return (
      <SidebarLayout mode="admin" showHeader headerTitle="User Management" headerSubtitle="Access denied">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout
      mode="admin"
      showHeader
      headerTitle="User Management"
      headerSubtitle="Manage approved users and their access tiers"
      headerGradient="linear-gradient(135deg, hsl(270 70% 45%), hsl(240 70% 50%))"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage approved users and their access tiers
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedUserIds.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4 mr-2" />
                      Bulk Actions ({selectedUserIds.size})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleBulkSendInvites} disabled={isInviting}>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invites
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBulkActivate}>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Activate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBulkDeactivate}>
                      <UserX className="w-4 h-4 mr-2" />
                      Deactivate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowBulkDeleteDialog(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncAllUserIds}
                disabled={isSyncingUserIds}
              >
                {isSyncingUserIds && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Statuses
              </Button>
              <Dialog open={isBulkDialogOpen} onOpenChange={(open) => {
                setIsBulkDialogOpen(open);
                if (!open) resetCsvImport();
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Import Users from CSV</DialogTitle>
                    <DialogDescription>
                      Upload a CSV file or paste CSV data. Download template for format reference.
                    </DialogDescription>
                  </DialogHeader>

                  {/* Tabs for Paste vs Upload */}
                  <Tabs value={csvInputMethod} onValueChange={(v) => setCsvInputMethod(v as 'paste' | 'upload')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="paste">Paste CSV</TabsTrigger>
                      <TabsTrigger value="upload">Upload File</TabsTrigger>
                    </TabsList>

                    <TabsContent value="paste" className="space-y-4">
                      <Textarea
                        placeholder="email,full_name,phone,tier,notes&#10;user@example.com,John Doe,+1234567890,user,Notes here"
                        value={csvData}
                        onChange={e => setCsvData(e.target.value)}
                        rows={8}
                        className="font-mono text-sm"
                      />
                      <Button onClick={handleParseCsv} disabled={!csvData}>
                        Parse CSV
                      </Button>
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4">
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        disabled={isImporting}
                      />
                      {csvFile && (
                        <p className="text-sm text-muted-foreground">
                          File: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Preview Table */}
                  {parsedCsv && (parsedCsv.valid.length > 0 || parsedCsv.invalid.length > 0) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Preview</h4>
                        <div className="text-sm text-muted-foreground">
                          {parsedCsv.valid.length} valid, {parsedCsv.invalid.length} invalid
                        </div>
                      </div>

                      <div className="border rounded-md max-h-64 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">Status</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Tier</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Valid Rows */}
                            {parsedCsv.valid.map((row, i) => (
                              <TableRow key={`valid-${i}`} className="bg-green-50">
                                <TableCell>
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                </TableCell>
                                <TableCell className="font-mono text-sm">{row.email}</TableCell>
                                <TableCell>{row.full_name || '-'}</TableCell>
                                <TableCell>
                                  <Badge className={TIER_COLORS[row.tier]}>{row.tier}</Badge>
                                </TableCell>
                                <TableCell className="text-sm truncate max-w-xs">
                                  {row.notes || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                            {/* Invalid Rows */}
                            {parsedCsv.invalid.map((row, i) => (
                              <TableRow key={`invalid-${i}`} className="bg-red-50">
                                <TableCell>
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                </TableCell>
                                <TableCell className="font-mono text-sm">{row.email || 'N/A'}</TableCell>
                                <TableCell colSpan={3} className="text-sm text-red-600">
                                  Row {row.row}: {row.message}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Import Progress */}
                      {importProgress && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Importing users...</span>
                            <span className="text-muted-foreground">
                              {importProgress.processed} / {importProgress.total}
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${(importProgress.processed / importProgress.total) * 100}%` }}
                            />
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span className="text-green-600">✓ {importProgress.succeeded} succeeded</span>
                            {importProgress.failed > 0 && (
                              <span className="text-red-600">✗ {importProgress.failed} failed</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Send Invites Option */}
                  {parsedCsv && parsedCsv.valid.length > 0 && (
                    <div className="flex items-center space-x-2 px-1">
                      <Switch
                        id="send-invites"
                        checked={sendInvitesAfterImport}
                        onCheckedChange={setSendInvitesAfterImport}
                        disabled={isImporting}
                      />
                      <Label
                        htmlFor="send-invites"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Send magic link invites to imported users
                      </Label>
                    </div>
                  )}

                  <DialogFooter className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={downloadCsvTemplate}
                      disabled={isImporting}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      onClick={() => setIsBulkDialogOpen(false)}
                      disabled={isImporting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCsvImport}
                      disabled={!parsedCsv || parsedCsv.valid.length === 0 || isImporting}
                    >
                      {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Import {parsedCsv?.valid.length || 0} Users
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Add a user to the approved list
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        value={formData.full_name}
                        onChange={e => setFormData(f => ({ ...f, full_name: e.target.value }))}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div>
                      <Label>Access Tier</Label>
                      <Select
                        value={formData.tier}
                        onValueChange={v => setFormData(f => ({ ...f, tier: v as NonNullable<UserTier> }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIER_OPTIONS.filter(t => canModifyTier(t.value, formData.email) || t.value === 'user').map(t => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Any notes about this user..."
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="send-invite" className="text-base">Send Invite Email</Label>
                        <p className="text-sm text-muted-foreground">
                          User will receive a magic link to sign in immediately
                        </p>
                      </div>
                      <Switch
                        id="send-invite"
                        checked={sendInviteOnAdd}
                        onCheckedChange={setSendInviteOnAdd}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddUser} disabled={isInviting}>
                      {isInviting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : sendInviteOnAdd ? (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Add & Invite
                        </>
                      ) : (
                        'Add User'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                {TIER_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={fetchUsers}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{users.filter(u => u.is_active).length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{users.filter(u => u.user_id).length}</p>
              <p className="text-sm text-muted-foreground">Signed Up</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{users.filter(u => u.last_access_at).length}</p>
              <p className="text-sm text-muted-foreground">Logged In</p>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all users"
                        className={isSomeSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Access</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUserIds.has(user.id)}
                            onCheckedChange={() => toggleSelectUser(user.id)}
                            aria-label={`Select ${user.email}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.email}</p>
                            {user.full_name && (
                              <p className="text-sm text-muted-foreground">{user.full_name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${TIER_COLORS[user.tier || 'user']} text-white`}>
                            {user.tier || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant={user.is_active ? 'default' : 'secondary'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {user.user_id ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Signed Up
                              </Badge>
                            ) : user.invited_at ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Invited
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                Not Invited
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.last_access_at
                            ? new Date(user.last_access_at).toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleSendInvite(user)}
                                disabled={isInviting || !user.is_active}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                {user.invited_at ? 'Resend Invite' : 'Send Invite'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                {user.is_active ? (
                                  <>
                                    <UserX className="w-4 h-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              {isAdmin && canModifyTier(user.tier, user.email) && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={e => setFormData(f => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            {canModifyTier(selectedUser?.tier || null, selectedUser?.email) && (
              <div>
                <Label>Access Tier</Label>
                <Select
                  value={formData.tier}
                  onValueChange={v => setFormData(f => ({ ...f, tier: v as NonNullable<UserTier> }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIER_OPTIONS.filter(t => canModifyTier(t.value, selectedUser?.email) || t.value === selectedUser?.tier).map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedUserIds.size} Users?</DialogTitle>
            <DialogDescription>
              This will permanently remove {selectedUserIds.size} user{selectedUserIds.size > 1 ? 's' : ''} from the approved list.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            <p className="text-sm font-medium">Users to be deleted:</p>
            <ul className="text-sm space-y-1">
              {Array.from(selectedUserIds).map(userId => {
                const user = users.find(u => u.id === userId);
                return user ? (
                  <li key={userId} className="text-muted-foreground">
                    • {user.email} {user.full_name ? `(${user.full_name})` : ''}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
              disabled={isBulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete {selectedUserIds.size} User{selectedUserIds.size > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
