// ============================================================================
// COMPLIANCE BINDER COMPONENT
// ============================================================================
// "$100M Apple-Simple" My Binder redesign with 3-tab layout:
// 1. Full Binder - Complete state compliance binder (read-only)
// 2. Documents - Document vault for uploaded files
// 3. My Notes - Personal annotations and interpretations
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  BookOpen,
  Download,
  Printer,
  Share2,
  MapPin,
  Calendar,
  FileText,
  FolderArchive,
  StickyNote,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FullBinderReader } from '../library/FullBinderReader';
import { DocumentVault } from '../documents/DocumentVault';
import { BinderNotesEditor } from './BinderNotesEditor';
import { ShareBinderDialog } from './ShareBinderDialog';
import { ExportBinderDialog } from './ExportBinderDialog';
import { useBinder } from '@/hooks/useComplianceBinder';
import { useStateBinder } from '@/hooks/useStateBinder';
import type { DocumentType, BinderDocument } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

export interface ComplianceBinderProps {
  binderId: string;
  onExportPDF?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  className?: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function BinderSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
      </Card>
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ComplianceBinder({
  binderId,
  onExportPDF,
  onPrint,
  className = '',
}: ComplianceBinderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('full-binder');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch user's binder data
  const {
    binder,
    documents,
    isLoading: binderLoading,
    error: binderError,
    updateBinder,
    exportPDF,
    printBinder,
    uploadDocument,
    deleteDocument,
    deleteBinder,
  } = useBinder({ binderId });

  // Fetch state compliance binder based on user's state_code
  const {
    binder: stateBinder,
    binderLoading: stateBinderLoading,
    binderError: stateBinderError,
    setSelectedState,
  } = useStateBinder({
    autoLoadStates: false,
  });

  // Update state binder when user's binder state_code becomes available
  useEffect(() => {
    if (binder?.state_code) {
      setSelectedState(binder.state_code);
    }
  }, [binder?.state_code, setSelectedState]);

  // Handle export
  const handleExport = async () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      const result = await exportPDF();
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Handle print
  const handlePrint = async () => {
    if (onPrint) {
      onPrint();
    } else {
      await printBinder();
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (
    file: File,
    type: DocumentType,
    expiresAt?: Date
  ) => {
    await uploadDocument({
      file,
      document_type: type,
      expires_at: expiresAt?.toISOString(),
    });
  };

  // Handle document download
  const handleDocumentDownload = (document: BinderDocument) => {
    if (document.file_url) {
      const a = window.document.createElement('a');
      a.href = document.file_url;
      a.download = document.file_name;
      a.click();
    }
  };

  // Handle notes update
  const handleNotesUpdate = async (notes: string) => {
    await updateBinder({ model_definition: notes });
  };

  // Handle delete binder
  const handleDeleteBinder = async () => {
    setIsDeleting(true);
    try {
      await deleteBinder();
      toast({
        title: 'Binder Deleted',
        description: 'Your compliance binder has been removed.',
      });
      // Navigate back to compliance hub
      navigate('/compliance');
    } catch (error) {
      console.error('Failed to delete binder:', error);
      toast({
        title: 'Delete Failed',
        description: 'Could not delete the binder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  // Loading state
  if (binderLoading) {
    return <BinderSkeleton />;
  }

  // Error state
  if (binderError || !binder) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-12 text-center">
          <p className="text-destructive">
            {binderError?.message || 'Failed to load binder'}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Binder Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5 text-primary" />
                {binder.name}
              </CardTitle>

              {/* Binder Metadata */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                {binder.state_code && (
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {binder.state_code}
                  </Badge>
                )}
                {binder.city && (
                  <span className="flex items-center gap-1">{binder.city}</span>
                )}
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {documents.length} documents
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Updated{' '}
                  {new Date(binder.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsExportOpen(true)}>
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1.5" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsShareOpen(true)}>
                <Share2 className="h-4 w-4 mr-1.5" />
                Share
              </Button>

              {/* Delete Binder Button */}
              <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Binder</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Compliance Binder?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your <strong>{binder.name}</strong> binder,
                      including all uploaded documents and personal notes. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteBinder}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Delete Binder
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 3-Tab Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="full-binder" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Full Binder</span>
            <span className="sm:hidden">Binder</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FolderArchive className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
            <span className="sm:hidden">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <StickyNote className="h-4 w-4" />
            <span className="hidden sm:inline">My Notes</span>
            <span className="sm:hidden">Notes</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Full State Binder */}
        <TabsContent value="full-binder" className="mt-6">
          <FullBinderReader
            binder={stateBinder}
            isLoading={stateBinderLoading}
            error={stateBinderError}
          />
        </TabsContent>

        {/* Tab 2: Document Vault */}
        <TabsContent value="documents" className="mt-6">
          <DocumentVault
            binderId={binderId}
            documents={documents}
            onUpload={handleDocumentUpload}
            onDelete={deleteDocument}
            onDownload={handleDocumentDownload}
          />
        </TabsContent>

        {/* Tab 3: My Notes */}
        <TabsContent value="notes" className="mt-6">
          <BinderNotesEditor
            notes={binder.model_definition || ''}
            onSave={handleNotesUpdate}
            stateCode={binder.state_code}
          />
        </TabsContent>
      </Tabs>

      {/* Share Binder Dialog */}
      <ShareBinderDialog
        binderId={binderId}
        binderName={binder.name}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      {/* Export Binder Dialog */}
      <ExportBinderDialog
        binderId={binderId}
        binderName={binder.name}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ComplianceBinder;
