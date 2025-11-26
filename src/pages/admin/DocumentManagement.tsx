// DocumentManagement Page - Temporarily Disabled
// Components and services need to be created

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
import type {
  GHDocument,
  DocumentCategory,
  OwnershipModel,
  ApplicablePopulation,
  DifficultyLevel,
} from '@/types/documents';

export const DocumentManagement = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'bulk-upload'>('library');
  const [selectedDocument, setSelectedDocument] = useState<GHDocument | null>(null);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [isTacticLinkerOpen, setIsTacticLinkerOpen] = useState(false);

  const { uploadDocument: performUpload } = useDocumentUpload();
  const { refetch: refetchDocuments } = useDocuments();
  const { refetch: refetchAnalytics } = useDocumentAnalytics();

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
    setCurrentFileIndex(0);
  };

  const handleMetadataSave = async (metadata: {
    document_name: string;
    category: DocumentCategory;
    description: string;
    applicable_states: string[];
    ownership_model: OwnershipModel[];
    applicable_populations: ApplicablePopulation[];
    difficulty: DifficultyLevel | null;
  }) => {
    const currentFile = uploadedFiles[currentFileIndex];
    if (!currentFile) return;

    const document = await performUpload({
      file: currentFile,
      metadata,
    });

    if (document) {
      // Move to next file or finish
      if (currentFileIndex < uploadedFiles.length - 1) {
        setCurrentFileIndex((prev) => prev + 1);
      } else {
        // All files uploaded
        toast.success(`Successfully uploaded ${uploadedFiles.length} document(s)`);
        setUploadedFiles([]);
        setCurrentFileIndex(0);
        setActiveTab('library');
        refetchDocuments();
        refetchAnalytics(); // Refresh analytics to show updated counts
      }
    }
  };

  const handleMetadataCancel = () => {
    setUploadedFiles([]);
    setCurrentFileIndex(0);
  };

  const handleEditDocument = (document: GHDocument) => {
    setSelectedDocument(document);
    setIsEditingDocument(true);
  };

  const handleEditSave = async (metadata: {
    document_name: string;
    category: DocumentCategory;
    description: string;
    applicable_states: string[];
    ownership_model: OwnershipModel[];
    applicable_populations: ApplicablePopulation[];
    difficulty: DifficultyLevel | null;
  }) => {
    if (!selectedDocument) return;

    try {
      await updateDocument(selectedDocument.id, metadata);
      toast.success('Document updated successfully');
      setIsEditingDocument(false);
      setSelectedDocument(null);
      refetchDocuments();
      refetchAnalytics(); // Refresh analytics after edit
    } catch (error) {
      toast.error('Failed to update document');
      console.error('Update error:', error);
    }
  };

  const handleLinkTactics = (document: GHDocument) => {
    setSelectedDocument(document);
    setIsTacticLinkerOpen(true);
  };

  const handleLinksUpdated = () => {
    refetchDocuments();
  };

  const currentFile = uploadedFiles[currentFileIndex];
  const showMetadataForm = uploadedFiles.length > 0 && currentFile;

export function DocumentManagement() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Document Management</h1>
            <p className="text-sm text-muted-foreground">
              Upload and manage training materials for tactics
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <DocumentLinkExporter />
          <DocumentLinkImporter />
        </div>
      </div>

      {/* Analytics Summary */}
      <DocumentAnalyticsSummary />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'upload' | 'bulk-upload')}>
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="library">Document Library</TabsTrigger>
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="bulk-upload">Bulk Upload (AI)</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4 mt-6">
          <DocumentLibraryTable
            onEdit={handleEditDocument}
            onLinkTactics={handleLinkTactics}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6 mt-6">
          {showMetadataForm ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Document {currentFileIndex + 1} of {uploadedFiles.length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className={`px-3 py-1 rounded-md text-xs ${
                          index === currentFileIndex
                            ? 'bg-primary text-primary-foreground'
                            : index < currentFileIndex
                            ? 'bg-green-100 text-green-800'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {index < currentFileIndex ? '✓ ' : ''}
                        {file.name}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <DocumentMetadataForm
                file={currentFile}
                onSave={handleMetadataSave}
                onCancel={handleMetadataCancel}
              />
            </div>
          ) : (
            <DocumentUploadZone onUploadSuccess={handleFilesUploaded} />
          )}
        </TabsContent>

        <TabsContent value="bulk-upload" className="space-y-6 mt-6">
          <BulkDocumentUploader
            onComplete={() => {
              refetchDocuments();
              refetchAnalytics();
              setActiveTab('library');
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Document Modal (reuse metadata form) */}
      {isEditingDocument && selectedDocument && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <DocumentMetadataForm
              file={new File([], selectedDocument.document_name)} // Dummy file for editing
              onSave={handleEditSave}
              onCancel={() => {
                setIsEditingDocument(false);
                setSelectedDocument(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Tactic Linker Modal */}
      <DocumentTacticLinker
        document={selectedDocument}
        isOpen={isTacticLinkerOpen}
        onClose={() => {
          setIsTacticLinkerOpen(false);
          setSelectedDocument(null);
        }}
        onLinksUpdated={handleLinksUpdated}
      />
    </div>
  );
}
