import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAccessControl, UserTier, TIER_HIERARCHY } from '@/hooks/useAccessControl';
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
import { sendUserInvite } from '@/services/userInviteService';

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
  const [bulkEmails, setBulkEmails] = useState('');
  const [sendInviteOnAdd, setSendInviteOnAdd] = useState(true);
  const [isInviting, setIsInviting] = useState(false);

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
  const canModifyTier = (targetTier: UserTier): boolean => {
    if (!currentUserTier || !targetTier) return false;
    if (isOwner) return true;
    if (targetTier === 'owner') return false;
    return TIER_HIERARCHY[currentUserTier] > TIER_HIERARCHY[targetTier];
  };

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

  // Bulk add users using RPC function (bypasses RLS)
  const handleBulkAdd = async () => {
    const emails = bulkEmails
      .split(/[\n,;]/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e && e.includes('@'));

    if (emails.length === 0) {
      toast({ title: 'Error', description: 'No valid emails found', variant: 'destructive' });
      return;
    }

    try {
      const { data: insertedCount, error } = await supabase.rpc('gh_admin_bulk_add_users', {
        p_emails: emails,
        p_tier: 'user',
        p_payment_source: 'bulk_import',
      });

      if (error) throw error;

      const addedCount = insertedCount || 0;
      const skippedCount = emails.length - addedCount;

      toast({
        title: 'Success',
        description: `Added ${addedCount} users${skippedCount > 0 ? ` (${skippedCount} already existed)` : ''}`,
      });
      setIsBulkDialogOpen(false);
      setBulkEmails('');
      fetchUsers();
    } catch (error) {
      console.error('Error bulk adding users:', error);
      toast({ title: 'Error', description: 'Failed to add users', variant: 'destructive' });
    }
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
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Add Users</DialogTitle>
                    <DialogDescription>
                      Paste email addresses (one per line, or comma/semicolon separated)
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                    value={bulkEmails}
                    onChange={e => setBulkEmails(e.target.value)}
                    rows={10}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkAdd}>Add Users</Button>
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
                          {TIER_OPTIONS.filter(t => canModifyTier(t.value) || t.value === 'user').map(t => (
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
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(user => (
                      <TableRow key={user.id}>
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
                              {isSuperAdmin && canModifyTier(user.tier) && (
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
            {canModifyTier(selectedUser?.tier || null) && (
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
                    {TIER_OPTIONS.filter(t => canModifyTier(t.value) || t.value === selectedUser?.tier).map(t => (
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
    </SidebarLayout>
  );
}
