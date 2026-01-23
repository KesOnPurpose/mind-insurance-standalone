// ============================================================================
// LIBRARY ITEM DETAIL COMPONENT
// ============================================================================
// Modal component for viewing full library item content.
// Allows bookmarking, saving to binder, and viewing source.
// ============================================================================

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Star,
  FileText,
  Calendar,
  MapPin,
} from 'lucide-react';
import { LIBRARY_CATEGORIES, type LibraryItem, type LibraryCategoryType } from '@/types/compliance';
import type { ComplianceBinder } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

export interface LibraryItemDetailProps {
  item: LibraryItem | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked?: boolean;
  onBookmark: (itemId: string, notes?: string) => Promise<void>;
  onRemoveBookmark?: (itemId: string) => Promise<void>;
  onSaveToBinder?: (itemId: string, binderId: string, notes?: string) => Promise<void>;
  availableBinders?: ComplianceBinder[];
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getCategoryInfo(categoryType: LibraryCategoryType | string) {
  const category = LIBRARY_CATEGORIES.find((c) => c.type === categoryType);
  return category || { name: 'General', icon: '📄', type: 'general' as LibraryCategoryType };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LibraryItemDetail({
  item,
  isOpen,
  onClose,
  isBookmarked = false,
  onBookmark,
  onRemoveBookmark,
  onSaveToBinder,
  availableBinders = [],
  className = '',
}: LibraryItemDetailProps) {
  const [notes, setNotes] = useState('');
  const [selectedBinderId, setSelectedBinderId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const categoryInfo = getCategoryInfo(item.category_id);

  const handleBookmark = async () => {
    try {
      if (isBookmarked && onRemoveBookmark) {
        await onRemoveBookmark(item.id);
      } else {
        await onBookmark(item.id, notes || undefined);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleSaveToBinder = async () => {
    if (!selectedBinderId || !onSaveToBinder) return;

    setIsSaving(true);
    try {
      await onSaveToBinder(item.id, selectedBinderId, notes || undefined);
      setSelectedBinderId('');
      setNotes('');
    } catch (error) {
      console.error('Error saving to binder:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(item.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-3xl h-[85vh] flex flex-col overflow-hidden ${className}`}>
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="secondary">
                  <span className="mr-1">{categoryInfo.icon}</span>
                  {categoryInfo.name}
                </Badge>
                <Badge variant="outline">
                  <MapPin className="h-3 w-3 mr-1" />
                  {item.state_code}
                </Badge>
                {item.is_critical && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Critical
                  </Badge>
                )}
                {item.is_featured && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                    <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                    Featured
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-lg leading-tight">{item.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {item.regulation_code && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {item.regulation_code}
                  </span>
                )}
              </DialogDescription>
            </div>
            <Button
              variant={isBookmarked ? 'default' : 'outline'}
              size="icon"
              onClick={handleBookmark}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 mt-4">
          {/* Content */}
          <div className="pr-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-h2:text-base prose-h3:text-sm prose-p:my-2 prose-li:my-0.5 prose-ul:my-2 prose-strong:text-foreground">
                <ReactMarkdown>{item.content}</ReactMarkdown>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              {item.effective_date && (
                <div>
                  <span className="text-muted-foreground">Effective Date:</span>
                  <span className="ml-2">{formatDate(item.effective_date)}</span>
                </div>
              )}
              {item.last_updated && (
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="ml-2">{formatDate(item.last_updated)}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-4">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator className="my-4" />

            {/* Save to Binder Section */}
            {onSaveToBinder && availableBinders.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Save to Compliance Binder</Label>
                <div className="flex gap-2">
                  <Select value={selectedBinderId} onValueChange={setSelectedBinderId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a binder..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBinders.map((binder) => (
                        <SelectItem key={binder.id} value={binder.id}>
                          {binder.name} ({binder.state_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleSaveToBinder}
                    disabled={!selectedBinderId || isSaving}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Add'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Notes (optional)</Label>
                  <Textarea
                    placeholder="Add notes about this regulation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t mt-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyContent}>
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy Content'}
            </Button>
            {item.source_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(item.source_url!, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Source
              </Button>
            )}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LibraryItemDetail;
