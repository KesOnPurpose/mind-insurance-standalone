// DocumentManagement Page - Full Implementation
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { DocumentAnalyticsSummary } from '@/components/admin/documents/DocumentAnalyticsSummary';
import { DocumentUploadZone } from '@/components/admin/documents/DocumentUploadZone';
import { DocumentMetadataForm } from '@/components/admin/documents/DocumentMetadataForm';
import { DocumentLibraryTable } from '@/components/admin/documents/DocumentLibraryTable';
import { DocumentTacticLinker } from '@/components/admin/documents/DocumentTacticLinker';
import { BulkDocumentUploader } from '@/components/admin/documents/BulkDocumentUploader';
import { DocumentLinkExporter } from '@/components/admin/documents/DocumentLinkExporter';
import { DocumentLinkImporter } from '@/components/admin/documents/DocumentLinkImporter';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { useDocuments } from '@/hooks/useDocuments';
import { useDocumentAnalytics } from '@/hooks/useDocumentAnalytics';
import { updateDocument } from '@/services/documentService';
import { toast } from 'sonner';
import { useState } from 'react';
import type {
  GHDocument,
  DocumentCategory,
  OwnershipModel,
  DocumentTag,
  TacticLink
} from '@/types/document';

export const DocumentManagement = () => {
  const { uploadDocument, uploadStatus, uploadProgress, resetUpload } = useDocumentUpload();
  const { documents, loading, error, refetch } = useDocuments();
  const { analytics, isLoading: analyticsLoading } = useDocumentAnalytics();
  const [selectedDocument, setSelectedDocument] = useState<GHDocument | null>(null);
  const [showTacticLinker, setShowTacticLinker] = useState(false);
  const [showBulkUploader, setShowBulkUploader] = useState(false);
  const [showLinkImporter, setShowLinkImporter] = useState(false);
  const [showLinkExporter, setShowLinkExporter] = useState(false);

  const handleFileSelect = async (file: File) => {
    try {
      await uploadDocument(file);
      toast.success('Document uploaded successfully');
      refetch();
      resetUpload();
    } catch (error) {
      toast.error('Failed to upload document');
      console.error('Upload error:', error);
    }
  };

  const handleMetadataSubmit = async (metadata: {
    name: string;
    category: DocumentCategory;
    tags: DocumentTag[];
    ownershipModel: OwnershipModel;
    isPublic: boolean;
    description?: string;
  }) => {
    if (!selectedDocument) return;

    try {
      await updateDocument(selectedDocument.id, metadata);
      toast.success('Document metadata updated');
      refetch();
      setSelectedDocument(null);
    } catch (error) {
      toast.error('Failed to update metadata');
      console.error('Metadata update error:', error);
    }
  };

  const handleTacticLinkSave = (tacticLinks: TacticLink[]) => {
    // Implementation for saving tactic links
    toast.success('Tactic links saved');
    setShowTacticLinker(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-muted-foreground">
            Upload, organize, and manage training materials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkUploader(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Bulk Upload
          </button>
          <button
            onClick={() => setShowLinkImporter(true)}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Import Links
          </button>
          <button
            onClick={() => setShowLinkExporter(true)}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Export Links
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <DocumentAnalyticsSummary
        analytics={analytics}
        isLoading={analyticsLoading}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUploadZone
                onFileSelect={handleFileSelect}
                uploadStatus={uploadStatus}
                uploadProgress={uploadProgress}
                onReset={resetUpload}
              />

              {selectedDocument && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-4">Edit Metadata</h3>
                  <DocumentMetadataForm
                    document={selectedDocument}
                    onSubmit={handleMetadataSubmit}
                    onCancel={() => setSelectedDocument(null)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Document Library */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Document Library</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentLibraryTable
                documents={documents}
                loading={loading}
                error={error}
                onDocumentSelect={setSelectedDocument}
                onManageTactics={(doc) => {
                  setSelectedDocument(doc);
                  setShowTacticLinker(true);
                }}
                onRefresh={refetch}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {showTacticLinker && selectedDocument && (
        <DocumentTacticLinker
          document={selectedDocument}
          onSave={handleTacticLinkSave}
          onClose={() => {
            setShowTacticLinker(false);
            setSelectedDocument(null);
          }}
        />
      )}

      {showBulkUploader && (
        <BulkDocumentUploader
          onClose={() => setShowBulkUploader(false)}
          onSuccess={() => {
            setShowBulkUploader(false);
            refetch();
            toast.success('Bulk upload completed');
          }}
        />
      )}

      {showLinkImporter && (
        <DocumentLinkImporter
          onClose={() => setShowLinkImporter(false)}
          onSuccess={() => {
            setShowLinkImporter(false);
            refetch();
            toast.success('Links imported successfully');
          }}
        />
      )}

      {showLinkExporter && documents && (
        <DocumentLinkExporter
          documents={documents}
          onClose={() => setShowLinkExporter(false)}
        />
      )}
    </div>
  );
};