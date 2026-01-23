/**
 * ShareBinderDialog.tsx
 * FEAT-GH-015-G: Share Binder Dialog Component
 *
 * Modal dialog for generating shareable links to compliance binders.
 * Allows setting expiration and permissions for shared access.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  Copy,
  Check,
  Share2,
  Link2,
  Clock,
  Eye,
  Download,
  FileText,
  MessageSquare,
  Loader2,
  AlertCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  createShareLink,
  getShareUrl,
  getActiveShareLinks,
  deleteShareLink,
  type CreateShareLinkInput,
} from '@/services/shareLinksService';
import type { BinderShareLink, SharePermissions } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

interface ShareBinderDialogProps {
  binderId: string;
  binderName: string;
  isOpen: boolean;
  onClose: () => void;
}

type ExpirationOption = '7' | '30' | '90' | 'never';

// ============================================================================
// CONSTANTS
// ============================================================================

const EXPIRATION_OPTIONS: { value: ExpirationOption; label: string }[] = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: 'never', label: 'Never expires' },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ExistingLinkCard({
  link,
  onDelete,
  isDeleting,
}: {
  link: BinderShareLink;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = getShareUrl(link.share_token);
  const permissions = link.permissions as SharePermissions;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = link.expires_at && new Date(link.expires_at) < new Date();

  return (
    <Card className={`${isExpired ? 'opacity-60 border-dashed' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-mono truncate max-w-[200px]">
                ...{link.share_token.slice(-8)}
              </span>
              {isExpired ? (
                <Badge variant="destructive" className="text-xs">Expired</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Active</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {link.expires_at
                  ? `Expires ${new Date(link.expires_at).toLocaleDateString()}`
                  : 'Never expires'}
              </span>
              {link.access_count > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {link.access_count} views
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {permissions.view_sections && (
                <Badge variant="outline" className="text-xs">Sections</Badge>
              )}
              {permissions.view_documents && (
                <Badge variant="outline" className="text-xs">Documents</Badge>
              )}
              {permissions.download_documents && (
                <Badge variant="outline" className="text-xs">Download</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={isExpired}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(link.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ShareBinderDialog({
  binderId,
  binderName,
  isOpen,
  onClose,
}: ShareBinderDialogProps) {
  const { toast } = useToast();

  // Form state
  const [expiration, setExpiration] = useState<ExpirationOption>('7');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [permissions, setPermissions] = useState<Partial<SharePermissions>>({
    view_sections: true,
    view_documents: true,
    view_notes: true,
    download_documents: false,
    add_comments: false,
  });

  // Generated link state
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);

  // Existing links
  const [existingLinks, setExistingLinks] = useState<BinderShareLink[]>([]);

  // Load existing links when dialog opens
  useEffect(() => {
    if (isOpen && binderId) {
      loadExistingLinks();
    }
  }, [isOpen, binderId]);

  const loadExistingLinks = async () => {
    setIsLoadingLinks(true);
    try {
      const links = await getActiveShareLinks(binderId);
      setExistingLinks(links);
    } catch (err) {
      console.error('Failed to load existing links:', err);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setGeneratedLink(null);
      setCopied(false);
      setRecipientEmail('');
      setRecipientName('');
      setNotes('');
      setExpiration('7');
      setPermissions({
        view_sections: true,
        view_documents: true,
        view_notes: true,
        download_documents: false,
        add_comments: false,
      });
    }
  }, [isOpen]);

  // Handle permission toggle
  const togglePermission = (key: keyof SharePermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle create share link
  const handleCreateLink = async () => {
    setIsCreating(true);
    try {
      const input: CreateShareLinkInput = {
        binder_id: binderId,
        permissions,
        expires_in_days: expiration === 'never' ? null : parseInt(expiration),
        recipient_email: recipientEmail || undefined,
        recipient_name: recipientName || undefined,
        notes: notes || undefined,
      };

      const link = await createShareLink(input);
      const shareUrl = getShareUrl(link.share_token);
      setGeneratedLink(shareUrl);

      // Refresh existing links
      await loadExistingLinks();

      toast({
        title: 'Share link created',
        description: 'Your binder can now be shared with this link.',
      });
    } catch (err) {
      console.error('Failed to create share link:', err);
      toast({
        title: 'Failed to create link',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle copy link
  const handleCopyLink = async () => {
    if (!generatedLink) return;

    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: 'Link copied',
      description: 'Share link copied to clipboard.',
    });
  };

  // Handle delete link
  const handleDeleteLink = async (linkId: string) => {
    setDeletingLinkId(linkId);
    try {
      await deleteShareLink(linkId);
      setExistingLinks((prev) => prev.filter((l) => l.id !== linkId));
      toast({
        title: 'Link deleted',
        description: 'The share link has been removed.',
      });
    } catch (err) {
      console.error('Failed to delete link:', err);
      toast({
        title: 'Failed to delete link',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingLinkId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Binder
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for "{binderName}" to share with attorneys,
            consultants, or other professionals.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Generated Link Display */}
          {generatedLink && (
            <Card className="border-primary bg-primary/5">
              <CardContent className="p-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Your share link is ready
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="font-mono text-sm bg-background"
                  />
                  <Button onClick={handleCopyLink}>
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create New Link Form */}
          {!generatedLink && (
            <>
              {/* Expiration */}
              <div className="space-y-2">
                <Label htmlFor="expiration" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Link Expiration
                </Label>
                <Select value={expiration} onValueChange={(v) => setExpiration(v as ExpirationOption)}>
                  <SelectTrigger id="expiration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Permissions
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="view_sections"
                      checked={permissions.view_sections}
                      onCheckedChange={() => togglePermission('view_sections')}
                    />
                    <label htmlFor="view_sections" className="text-sm flex items-center gap-2 cursor-pointer">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      View binder sections
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="view_documents"
                      checked={permissions.view_documents}
                      onCheckedChange={() => togglePermission('view_documents')}
                    />
                    <label htmlFor="view_documents" className="text-sm flex items-center gap-2 cursor-pointer">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      View uploaded documents
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="view_notes"
                      checked={permissions.view_notes}
                      onCheckedChange={() => togglePermission('view_notes')}
                    />
                    <label htmlFor="view_notes" className="text-sm flex items-center gap-2 cursor-pointer">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      View personal notes
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="download_documents"
                      checked={permissions.download_documents}
                      onCheckedChange={() => togglePermission('download_documents')}
                    />
                    <label htmlFor="download_documents" className="text-sm flex items-center gap-2 cursor-pointer">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      Allow document downloads
                    </label>
                  </div>
                </div>
              </div>

              {/* Optional: Recipient Info */}
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">
                  Optional: Recipient Information
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="recipientName" className="text-xs">Name</Label>
                    <Input
                      id="recipientName"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g., John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientEmail" className="text-xs">Email</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="e.g., attorney@firm.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes" className="text-xs">Notes (private)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about why you're sharing..."
                    rows={2}
                  />
                </div>
              </div>
            </>
          )}

          {/* Existing Links Section */}
          {existingLinks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">
                  Existing Share Links ({existingLinks.length})
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadExistingLinks}
                  disabled={isLoadingLinks}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingLinks ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {existingLinks.map((link) => (
                  <ExistingLinkCard
                    key={link.id}
                    link={link}
                    onDelete={handleDeleteLink}
                    isDeleting={deletingLinkId === link.id}
                  />
                ))}
              </div>
            </div>
          )}

          {isLoadingLinks && existingLinks.length === 0 && (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {generatedLink ? 'Done' : 'Cancel'}
          </Button>
          {!generatedLink && (
            <Button onClick={handleCreateLink} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Create Share Link
                </>
              )}
            </Button>
          )}
          {generatedLink && (
            <Button
              variant="secondary"
              onClick={() => setGeneratedLink(null)}
            >
              Create Another Link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShareBinderDialog;
