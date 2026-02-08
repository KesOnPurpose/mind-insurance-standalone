// ============================================================================
// FEAT-GH-019: Enhanced Enroll Learner Modal Component
// ============================================================================
// World-class enrollment form with bulk enrollment, multi-select, and CSV import
// Follows LMS best practices (Teachable, Thinkific, Kajabi patterns)
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  UserPlus,
  Users,
  Check,
  Search,
  Mail,
  User,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEnrollLearner, useBulkEnrollLearners } from '@/hooks/useAdminPrograms';
import { supabase } from '@/integrations/supabase/client';
import type { EnrollableUser } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface EnrollLearnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  programTitle?: string;
  onSuccess?: () => void;
}

interface ApprovedUser {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  tier: string;
  is_active: boolean;
}

// ============================================================================
// User Search Hook - Uses RPC function to bypass RLS
// ============================================================================

const useUserSearch = () => {
  const [users, setUsers] = useState<ApprovedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use the same RPC function as UserManagement to bypass RLS
        const { data, error: rpcError } = await supabase.rpc('gh_admin_get_all_users');

        if (rpcError) throw rpcError;

        // Filter to only include users with user_id (can be enrolled)
        // and is_active = true
        const enrollableUsers = (data || []).filter(
          (u: ApprovedUser) => u.is_active && u.user_id
        );

        setUsers(enrollableUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, isLoading, error };
};

// ============================================================================
// Email Validation
// ============================================================================

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Parse emails from text (supports comma, newline, or semicolon separated)
const parseEmails = (text: string): { valid: string[]; invalid: string[] } => {
  const emails = text
    .split(/[,;\n\r]+/)
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  const valid: string[] = [];
  const invalid: string[] = [];

  emails.forEach(email => {
    if (isValidEmail(email)) {
      if (!valid.includes(email)) valid.push(email);
    } else {
      invalid.push(email);
    }
  });

  return { valid, invalid };
};

// ============================================================================
// Main Component
// ============================================================================

export const EnrollLearnerModal = ({
  open,
  onOpenChange,
  programId,
  programTitle,
  onSuccess,
}: EnrollLearnerModalProps) => {
  const { enrollLearner, isEnrolling } = useEnrollLearner();
  const { bulkEnroll, isBulkEnrolling } = useBulkEnrollLearners();
  const { users, isLoading: isLoadingUsers, error: usersError } = useUserSearch();

  // Tab state
  const [enrollmentMode, setEnrollmentMode] = useState<'select' | 'invite' | 'bulk'>('select');

  // Single select state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Multi-select state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');

  // Bulk email state
  const [bulkEmails, setBulkEmails] = useState('');
  const [parsedBulkEmails, setParsedBulkEmails] = useState<{ valid: string[]; invalid: string[] }>({ valid: [], invalid: [] });

  // Options state
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [notes, setNotes] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setEnrollmentMode('select');
      setSelectedUserId(null);
      setSelectedUserIds(new Set());
      setSearchQuery('');
      setInviteEmail('');
      setBulkEmails('');
      setParsedBulkEmails({ valid: [], invalid: [] });
      setSendWelcomeEmail(true);
      setNotes('');
    }
  }, [open]);

  // Parse bulk emails when text changes
  useEffect(() => {
    if (bulkEmails.trim()) {
      setParsedBulkEmails(parseEmails(bulkEmails));
    } else {
      setParsedBulkEmails({ valid: [], invalid: [] });
    }
  }, [bulkEmails]);

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      u =>
        u.email?.toLowerCase().includes(query) ||
        u.full_name?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Check if form is ready to submit
  const canSubmit = useMemo(() => {
    if (isEnrolling || isBulkEnrolling) return false;

    switch (enrollmentMode) {
      case 'select':
        return selectedUserIds.size > 0;
      case 'invite':
        return isValidEmail(inviteEmail);
      case 'bulk':
        return parsedBulkEmails.valid.length > 0;
      default:
        return false;
    }
  }, [enrollmentMode, selectedUserIds, inviteEmail, parsedBulkEmails, isEnrolling, isBulkEnrolling]);

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Select all visible users
  const selectAllVisible = () => {
    const newSet = new Set(selectedUserIds);
    filteredUsers.forEach(u => {
      if (u.user_id) newSet.add(u.user_id);
    });
    setSelectedUserIds(newSet);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedUserIds(new Set());
  };

  // Handle close
  const handleClose = () => {
    if (!isEnrolling && !isBulkEnrolling) {
      onOpenChange(false);
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    let success = false;

    switch (enrollmentMode) {
      case 'select':
        // Bulk enroll selected users
        const selectedUsers = users.filter(u => u.user_id && selectedUserIds.has(u.user_id));
        if (selectedUsers.length === 1) {
          // Single enrollment
          success = await enrollLearner({
            program_id: programId,
            user_id: selectedUsers[0].user_id!,
            enrollment_source: 'manual',
            send_welcome_email: sendWelcomeEmail,
            notes: notes.trim() || undefined,
          });
        } else {
          // Bulk enrollment
          const enrollments = selectedUsers.map(u => ({
            program_id: programId,
            user_id: u.user_id!,
            enrollment_source: 'manual' as const,
            send_welcome_email: sendWelcomeEmail,
            notes: notes.trim() || undefined,
          }));
          const result = await bulkEnroll(enrollments);
          success = result.succeeded > 0;
        }
        break;

      case 'invite':
        success = await enrollLearner({
          program_id: programId,
          email: inviteEmail.trim().toLowerCase(),
          enrollment_source: 'manual',
          send_welcome_email: sendWelcomeEmail,
          notes: notes.trim() || undefined,
        });
        break;

      case 'bulk':
        const emailEnrollments = parsedBulkEmails.valid.map(email => ({
          program_id: programId,
          email,
          enrollment_source: 'manual' as const,
          send_welcome_email: sendWelcomeEmail,
          notes: notes.trim() || undefined,
        }));
        const bulkResult = await bulkEnroll(emailEnrollments);
        success = bulkResult.succeeded > 0;
        break;
    }

    if (success) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  // Get selected user details for preview
  const selectedUserDetails = useMemo(() => {
    return users.filter(u => u.user_id && selectedUserIds.has(u.user_id));
  }, [users, selectedUserIds]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogHeader>
            <DialogTitle>Enroll Learners</DialogTitle>
            <DialogDescription>
              {programTitle
                ? `Add learners to "${programTitle}"`
                : 'Add learners to this program'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 py-4">
            {/* Enrollment Mode Tabs */}
            <Tabs
              value={enrollmentMode}
              onValueChange={(v) => setEnrollmentMode(v as typeof enrollmentMode)}
              className="flex flex-col h-full"
            >
              <TabsList className="grid w-full grid-cols-3 shrink-0">
                <TabsTrigger value="select" disabled={isEnrolling || isBulkEnrolling}>
                  <Users className="mr-2 h-4 w-4" />
                  Select Users
                </TabsTrigger>
                <TabsTrigger value="invite" disabled={isEnrolling || isBulkEnrolling}>
                  <Mail className="mr-2 h-4 w-4" />
                  Invite Email
                </TabsTrigger>
                <TabsTrigger value="bulk" disabled={isEnrolling || isBulkEnrolling}>
                  <FileText className="mr-2 h-4 w-4" />
                  Bulk Emails
                </TabsTrigger>
              </TabsList>

              {/* Select Users Tab */}
              <TabsContent value="select" className="flex-1 min-h-0 space-y-3 mt-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    disabled={isEnrolling || isBulkEnrolling}
                  />
                </div>

                {/* Selection controls */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={selectAllVisible}
                      disabled={isEnrolling || isBulkEnrolling || filteredUsers.length === 0}
                    >
                      Select All ({filteredUsers.length})
                    </Button>
                    {selectedUserIds.size > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={deselectAll}
                        disabled={isEnrolling || isBulkEnrolling}
                      >
                        Clear Selection
                      </Button>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {selectedUserIds.size} selected
                  </Badge>
                </div>

                {/* User list */}
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading users...</span>
                  </div>
                ) : usersError ? (
                  <div className="flex items-center justify-center py-8 text-destructive">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {usersError}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mb-2 opacity-50" />
                    {searchQuery ? (
                      <p>No users match your search</p>
                    ) : (
                      <>
                        <p className="font-medium">No enrollable users found</p>
                        <p className="text-sm mt-1">
                          Users must be in the approved list and have signed up to be enrolled.
                        </p>
                        <p className="text-sm">
                          Use the "Invite Email" tab to invite new users.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <ScrollArea className="h-[250px] border rounded-md">
                    <div className="p-2 space-y-1">
                      {filteredUsers.map((user) => {
                        const isSelected = user.user_id ? selectedUserIds.has(user.user_id) : false;
                        return (
                          <div
                            key={user.id}
                            onClick={() => user.user_id && toggleUserSelection(user.user_id)}
                            className={cn(
                              'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                              isSelected
                                ? 'bg-primary/10 border border-primary/30'
                                : 'hover:bg-muted/50'
                            )}
                          >
                            <div
                              className={cn(
                                'flex items-center justify-center w-5 h-5 rounded border',
                                isSelected
                                  ? 'bg-primary border-primary'
                                  : 'border-muted-foreground/30'
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {user.full_name || 'No name'}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0 text-xs">
                              {user.tier || 'user'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                {/* Selected preview */}
                {selectedUserDetails.length > 0 && selectedUserDetails.length <= 5 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {selectedUserDetails.map(u => (
                      <Badge key={u.id} variant="secondary" className="gap-1">
                        {u.full_name || u.email}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            u.user_id && toggleUserSelection(u.user_id);
                          }}
                          className="ml-1 hover:bg-muted rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Invite by Email Tab */}
              <TabsContent value="invite" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="learner@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={isEnrolling}
                    autoComplete="off"
                  />
                  {inviteEmail && !isValidEmail(inviteEmail) && (
                    <p className="text-sm text-destructive">
                      Please enter a valid email address
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    If this user does not exist, they will receive an invitation to
                    create an account.
                  </p>
                </div>
              </TabsContent>

              {/* Bulk Emails Tab */}
              <TabsContent value="bulk" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-emails">
                    Email Addresses <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="bulk-emails"
                    placeholder="Enter emails separated by commas, semicolons, or new lines:&#10;&#10;user1@example.com&#10;user2@example.com, user3@example.com"
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    disabled={isBulkEnrolling}
                    rows={5}
                    className="font-mono text-sm"
                  />

                  {/* Email validation feedback */}
                  {bulkEmails.trim() && (
                    <div className="flex flex-wrap gap-2 text-sm">
                      {parsedBulkEmails.valid.length > 0 && (
                        <Badge variant="default" className="gap-1 bg-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          {parsedBulkEmails.valid.length} valid
                        </Badge>
                      )}
                      {parsedBulkEmails.invalid.length > 0 && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {parsedBulkEmails.invalid.length} invalid
                        </Badge>
                      )}
                    </div>
                  )}

                  {parsedBulkEmails.invalid.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Invalid emails will be skipped: {parsedBulkEmails.invalid.slice(0, 3).join(', ')}
                      {parsedBulkEmails.invalid.length > 3 && ` +${parsedBulkEmails.invalid.length - 3} more`}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Options - Collapsed by default for clean UX */}
          <div className="space-y-4 border-t pt-4">
            {/* Welcome Email Checkbox */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="send-welcome"
                checked={sendWelcomeEmail}
                onCheckedChange={(checked) => setSendWelcomeEmail(checked as boolean)}
                disabled={isEnrolling || isBulkEnrolling}
              />
              <div className="space-y-0.5">
                <Label htmlFor="send-welcome" className="cursor-pointer text-sm">
                  Send welcome email
                </Label>
                <p className="text-xs text-muted-foreground">
                  Notify learners about their enrollment
                </p>
              </div>
            </div>

            {/* Notes - Optional, kept small */}
            <div className="space-y-2">
              <Label htmlFor="enrollment-notes" className="text-sm">
                Notes (Optional)
              </Label>
              <Textarea
                id="enrollment-notes"
                placeholder="Add any notes about this enrollment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isEnrolling || isBulkEnrolling}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isEnrolling || isBulkEnrolling}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isEnrolling || isBulkEnrolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enrolling...
                </>
              ) : enrollmentMode === 'select' && selectedUserIds.size > 1 ? (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enroll {selectedUserIds.size} Learners
                </>
              ) : enrollmentMode === 'bulk' && parsedBulkEmails.valid.length > 1 ? (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enroll {parsedBulkEmails.valid.length} Learners
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enroll Learner
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollLearnerModal;
