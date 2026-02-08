// ============================================================================
// DOCUMENT VAULT COMPONENT
// ============================================================================
// "$100M Apple-Simple" document vault with progressive disclosure by type.
// Uses signed URLs for secure private bucket access, collapsible sections,
// and double-click to view functionality.
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FolderOpen,
  Plus,
  Search,
  Download,
  Trash2,
  ExternalLink,
  FileText,
  Image,
  File,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  Eye,
  Loader2,
  Shield,
  Home,
  ClipboardCheck,
  Award,
  FileCheck,
} from 'lucide-react';
import { DocumentUploader } from './DocumentUploader';
import { getSignedDownloadUrl } from '@/services/documentUploadService';
import { useToast } from '@/hooks/use-toast';
import type { BinderDocument, DocumentType } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

export interface DocumentVaultProps {
  binderId: string;
  documents: BinderDocument[];
  isLoading?: boolean;
  onUpload: (file: File, type: DocumentType, expiresAt?: Date) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  onDownload?: (document: BinderDocument) => void;
  isReadOnly?: boolean;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DOCUMENT_TYPE_CONFIG: Record<
  DocumentType,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  license: {
    label: 'Business Licenses',
    icon: <FileCheck className="h-4 w-4" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  permit: {
    label: 'Permits',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  insurance: {
    label: 'Insurance Documents',
    icon: <Shield className="h-4 w-4" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  inspection: {
    label: 'Inspections',
    icon: <ClipboardCheck className="h-4 w-4" />,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
  lease: {
    label: 'Lease Agreements',
    icon: <Home className="h-4 w-4" />,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  certification: {
    label: 'Certifications',
    icon: <Award className="h-4 w-4" />,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
  },
  other: {
    label: 'Other Documents',
    icon: <File className="h-4 w-4" />,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800/50',
  },
};

// Document type display order
const DOCUMENT_TYPE_ORDER: DocumentType[] = [
  'license',
  'permit',
  'insurance',
  'inspection',
  'lease',
  'certification',
  'other',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getExpirationStatus(expiresAt?: string | null): {
  status: 'expired' | 'expiring_soon' | 'valid' | 'no_expiration';
  message: string;
  color: string;
  badgeVariant: 'destructive' | 'warning' | 'success' | 'secondary';
} {
  if (!expiresAt) {
    return {
      status: 'no_expiration',
      message: 'No expiration',
      color: 'text-muted-foreground',
      badgeVariant: 'secondary',
    };
  }

  const expDate = new Date(expiresAt);
  const today = new Date();
  const daysUntilExpiration = Math.ceil(
    (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiration < 0) {
    return {
      status: 'expired',
      message: 'Expired',
      color: 'text-destructive',
      badgeVariant: 'destructive',
    };
  }

  if (daysUntilExpiration <= 30) {
    return {
      status: 'expiring_soon',
      message: `${daysUntilExpiration}d left`,
      color: 'text-amber-600',
      badgeVariant: 'warning',
    };
  }

  return {
    status: 'valid',
    message: expDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    color: 'text-green-600',
    badgeVariant: 'success',
  };
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getFileIcon(mimeType?: string | null, size: 'sm' | 'lg' = 'lg') {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-8 w-8';
  if (!mimeType) return <File className={`${sizeClass} text-gray-400`} />;
  if (mimeType.startsWith('image/')) {
    return <Image className={`${sizeClass} text-blue-500`} />;
  }
  if (mimeType === 'application/pdf') {
    return <FileText className={`${sizeClass} text-red-500`} />;
  }
  return <File className={`${sizeClass} text-gray-500`} />;
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface DocumentRowProps {
  document: BinderDocument;
  onView: () => void;
  onDelete: () => void;
  onDownload?: () => void;
  isReadOnly?: boolean;
  isViewing?: boolean;
}

function DocumentRow({
  document,
  onView,
  onDelete,
  onDownload,
  isReadOnly,
  isViewing,
}: DocumentRowProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const expirationStatus = getExpirationStatus(document.expires_at);

  return (
    <>
      <div
        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border"
        onDoubleClick={onView}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onView();
        }}
      >
        {/* File Icon */}
        <div className="shrink-0">
          {getFileIcon(document.mime_type, 'lg')}
        </div>

        {/* Document Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate pr-2">
            {document.file_name}
          </h4>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(document.created_at)}
            </span>
            {document.file_size && (
              <span className="text-muted-foreground/70">
                • {formatFileSize(document.file_size)}
              </span>
            )}
          </div>
        </div>

        {/* Expiration Badge */}
        {document.expires_at && (
          <Badge
            variant={
              expirationStatus.badgeVariant === 'warning'
                ? 'secondary'
                : expirationStatus.badgeVariant === 'success'
                ? 'secondary'
                : expirationStatus.badgeVariant
            }
            className={`shrink-0 text-xs ${
              expirationStatus.status === 'expired'
                ? 'bg-destructive/10 text-destructive border-destructive/20'
                : expirationStatus.status === 'expiring_soon'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
            }`}
          >
            {expirationStatus.status === 'expired' && (
              <AlertTriangle className="h-3 w-3 mr-1" />
            )}
            {expirationStatus.status === 'expiring_soon' && (
              <Clock className="h-3 w-3 mr-1" />
            )}
            {expirationStatus.status === 'valid' && (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            )}
            {expirationStatus.message}
          </Badge>
        )}

        {/* Action Buttons - Show on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            disabled={isViewing}
          >
            {isViewing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="sr-only">View</span>
          </Button>

          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
          )}

          {!isReadOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{document.file_name}" from your
              compliance binder. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface DocumentTypeSectionProps {
  type: DocumentType;
  documents: BinderDocument[];
  isExpanded: boolean;
  onToggle: () => void;
  onViewDocument: (doc: BinderDocument) => void;
  onDeleteDocument: (docId: string) => void;
  onDownloadDocument?: (doc: BinderDocument) => void;
  isReadOnly?: boolean;
  viewingDocId?: string | null;
}

function DocumentTypeSection({
  type,
  documents,
  isExpanded,
  onToggle,
  onViewDocument,
  onDeleteDocument,
  onDownloadDocument,
  isReadOnly,
  viewingDocId,
}: DocumentTypeSectionProps) {
  const config = DOCUMENT_TYPE_CONFIG[type] || DOCUMENT_TYPE_CONFIG.other;

  // Count expiring/expired in this section
  const expirationCounts = useMemo(() => {
    let expired = 0;
    let expiringSoon = 0;
    documents.forEach((doc) => {
      const status = getExpirationStatus(doc.expires_at);
      if (status.status === 'expired') expired++;
      if (status.status === 'expiring_soon') expiringSoon++;
    });
    return { expired, expiringSoon };
  }, [documents]);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button
          className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${config.bgColor} hover:opacity-90`}
        >
          <div className="flex items-center gap-3">
            <span className={config.color}>{config.icon}</span>
            <span className="font-medium">{config.label}</span>
            <Badge variant="secondary" className="ml-1">
              {documents.length}
            </Badge>
            {expirationCounts.expired > 0 && (
              <Badge variant="destructive" className="text-xs">
                {expirationCounts.expired} expired
              </Badge>
            )}
            {expirationCounts.expiringSoon > 0 && (
              <Badge
                variant="secondary"
                className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              >
                {expirationCounts.expiringSoon} expiring
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 ml-2 space-y-1">
          {documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              document={doc}
              onView={() => onViewDocument(doc)}
              onDelete={() => onDeleteDocument(doc.id)}
              onDownload={onDownloadDocument ? () => onDownloadDocument(doc) : undefined}
              isReadOnly={isReadOnly}
              isViewing={viewingDocId === doc.id}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function DocumentVaultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function EmptyVault({ onUpload }: { onUpload: () => void }) {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="py-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <FolderOpen className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Your Document Vault is Empty</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Store your compliance documents securely. Upload business licenses, permits,
          insurance certificates, inspection reports, and more.
        </p>
        <Button onClick={onUpload} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Upload Your First Document
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DocumentVault({
  binderId,
  documents,
  isLoading = false,
  onUpload,
  onDelete,
  onDownload,
  isReadOnly = false,
  className = '',
}: DocumentVaultProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<DocumentType>>(
    new Set(['license', 'permit', 'insurance']) // Default expanded
  );
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);

  // Group documents by type
  const documentsByType = useMemo(() => {
    const grouped: Record<DocumentType, BinderDocument[]> = {
      license: [],
      permit: [],
      insurance: [],
      inspection: [],
      lease: [],
      certification: [],
      other: [],
    };

    documents.forEach((doc) => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const typeLabel = DOCUMENT_TYPE_CONFIG[doc.document_type]?.label || '';
        if (
          !doc.file_name.toLowerCase().includes(query) &&
          !typeLabel.toLowerCase().includes(query)
        ) {
          return;
        }
      }

      // Apply type filter
      if (typeFilter !== 'all' && doc.document_type !== typeFilter) {
        return;
      }

      const type = doc.document_type as DocumentType;
      if (grouped[type]) {
        grouped[type].push(doc);
      } else {
        grouped.other.push(doc);
      }
    });

    return grouped;
  }, [documents, searchQuery, typeFilter]);

  // Count total filtered documents
  const filteredCount = useMemo(() => {
    return Object.values(documentsByType).reduce((sum, docs) => sum + docs.length, 0);
  }, [documentsByType]);

  // Count expiring/expired documents
  const expirationCounts = useMemo(() => {
    let expired = 0;
    let expiringSoon = 0;

    documents.forEach((doc) => {
      const status = getExpirationStatus(doc.expires_at);
      if (status.status === 'expired') expired++;
      if (status.status === 'expiring_soon') expiringSoon++;
    });

    return { expired, expiringSoon };
  }, [documents]);

  // Toggle section expansion
  const toggleSection = useCallback((type: DocumentType) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // Expand all sections
  const expandAll = useCallback(() => {
    setExpandedSections(new Set(DOCUMENT_TYPE_ORDER));
  }, []);

  // Collapse all sections
  const collapseAll = useCallback(() => {
    setExpandedSections(new Set());
  }, []);

  // Handle document view with signed URL
  const handleViewDocument = useCallback(async (doc: BinderDocument) => {
    setViewingDocId(doc.id);
    try {
      const signedUrl = await getSignedDownloadUrl(doc.id, 3600); // 1 hour expiry
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to get signed URL:', error);
      toast({
        title: 'Failed to open document',
        description: 'Could not generate a secure link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setViewingDocId(null);
    }
  }, [toast]);

  // Handle upload
  const handleUpload = async (
    file: File,
    type: DocumentType,
    expiresAt?: Date
  ) => {
    await onUpload(file, type, expiresAt);
    setShowUploadDialog(false);
    // Auto-expand the section for the uploaded document type
    setExpandedSections((prev) => new Set([...prev, type]));
  };

  // Loading state
  if (isLoading) {
    return <DocumentVaultSkeleton />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Document Vault
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {documents.length} document{documents.length !== 1 ? 's' : ''} stored
            {filteredCount !== documents.length && ` (${filteredCount} shown)`}
          </p>
        </div>

        {!isReadOnly && (
          <Button onClick={() => setShowUploadDialog(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Expiration Warnings */}
      {(expirationCounts.expired > 0 || expirationCounts.expiringSoon > 0) && (
        <div className="flex flex-wrap gap-3">
          {expirationCounts.expired > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-destructive/10 text-destructive rounded-lg text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              {expirationCounts.expired} document{expirationCounts.expired !== 1 ? 's' : ''} expired
            </div>
          )}
          {expirationCounts.expiringSoon > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-lg text-sm font-medium">
              <Clock className="h-4 w-4" />
              {expirationCounts.expiringSoon} document{expirationCounts.expiringSoon !== 1 ? 's' : ''} expiring soon
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 ? (
        <EmptyVault onUpload={() => setShowUploadDialog(true)} />
      ) : (
        <>
          {/* Filters & Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {DOCUMENT_TYPE_ORDER.map((type) => {
                  const config = DOCUMENT_TYPE_CONFIG[type];
                  return (
                    <SelectItem key={type} value={type}>
                      <span className="flex items-center gap-2">
                        <span className={config.color}>{config.icon}</span>
                        <span>{config.label}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Expand/Collapse All */}
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs">
                Expand All
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs">
                Collapse All
              </Button>
            </div>
          </div>

          {/* Document Type Sections */}
          {filteredCount === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No documents match your search
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {DOCUMENT_TYPE_ORDER.map((type) => {
                const docs = documentsByType[type];
                if (docs.length === 0) return null;

                return (
                  <DocumentTypeSection
                    key={type}
                    type={type}
                    documents={docs}
                    isExpanded={expandedSections.has(type)}
                    onToggle={() => toggleSection(type)}
                    onViewDocument={handleViewDocument}
                    onDeleteDocument={onDelete}
                    onDownloadDocument={onDownload}
                    isReadOnly={isReadOnly}
                    viewingDocId={viewingDocId}
                  />
                );
              })}
            </div>
          )}

          {/* Hint */}
          <p className="text-xs text-muted-foreground text-center">
            Double-click a document to view it, or use the action buttons on hover
          </p>
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <DocumentUploader
            binderId={binderId}
            onUpload={handleUpload}
            onCancel={() => setShowUploadDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DocumentVault;
