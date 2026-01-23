import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

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

import type {
  GHDocument,
  DocumentCategory,
  OwnershipModel,
  ApplicablePopulation,
  DifficultyLevel,
} from '@/types/documents';

export function DocumentManagement() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'bulk-upload'>('library');
  const [selectedDocument, setSelectedDocument] = useState<GHDocument | null>(null);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [isTacticLinkerOpen, setIsTacticLinkerOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  const { uploadDocument } = useDocumentUpload();
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

    const document = await uploadDocument({ file: currentFile, metadata });

    if (!document) return;

    if (currentFileIndex < uploadedFiles.length - 1) {
      setCurrentFileIndex((prev) => prev + 1);
    } else {
      toast.success(`Successfully uploaded ${uploadedFiles.length} document(s)`);
      setUploadedFiles([]);
      setCurrentFileIndex(0);
      setActiveTab('library');
      refetchDocuments();
      refetchAnalytics();
    }
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
      refetchAnalytics();
    } catch (err) {
      toast.error('Failed to update document');
      console.error(err);
    }
  };

  const currentFile = uploadedFiles[currentFileIndex];
  const showMetadataForm = uploadedFiles.length > 0 && currentFile;

  return (
    <SidebarLayout
      mode="admin"
      showHeader
      headerTitle="Document Management"
      headerSubtitle="Upload and manage training materials for tactics"
      headerGradient="linear-gradient(135deg, hsl(270 70% 45%), hsl(240 70% 50%))"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-wrap gap-2 justify-end">
          <DocumentLinkExporter />
          <button
            onClick={() => setIsImporterOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            Import Links
          </button>
          <DocumentLinkImporter
            open={isImporterOpen}
            onClose={() => setIsImporterOpen(false)}
            onSuccess={() => {
              refetchDocuments();
              setIsImporterOpen(false);
            }}
          />
        </div>

      <DocumentAnalyticsSummary />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'upload' | 'bulk-upload')}>
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="library">Document Library</TabsTrigger>
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="bulk-upload">Bulk Upload (AI)</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-6">
          <DocumentLibraryTable
            onEdit={(doc) => {
              setSelectedDocument(doc);
              setIsEditingDocument(true);
            }}
            onLinkTactics={(doc) => {
              setSelectedDocument(doc);
              setIsTacticLinkerOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="upload" className="mt-6 space-y-6">
          {showMetadataForm ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                        {currentFileIndex + 1}
                      </div>
                      Queue Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        File {currentFileIndex + 1} of {uploadedFiles.length}
                      </p>
                      <div className="flex flex-col gap-2">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs border transition-all ${index === currentFileIndex
                              ? 'bg-background border-primary text-primary font-bold shadow-sm'
                              : index < currentFileIndex
                                ? 'bg-green-50/50 border-green-100 text-green-700 opacity-70'
                                : 'bg-muted/30 border-transparent text-muted-foreground'
                              }`}
                          >
                            <span className="shrink-0 w-4">
                              {index < currentFileIndex ? '✓' : index === currentFileIndex ? '●' : index + 1}
                            </span>
                            <span className="truncate flex-1">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <DocumentMetadataForm
                  file={currentFile}
                  onSave={handleMetadataSave}
                  onCancel={() => {
                    setUploadedFiles([]);
                    setCurrentFileIndex(0);
                  }}
                />
              </div>
            </div>
          ) : (
            <DocumentUploadZone onUploadSuccess={handleFilesUploaded} />
          )}
        </TabsContent>

        <TabsContent value="bulk-upload" className="mt-6">
          <BulkDocumentUploader
            onComplete={() => {
              refetchDocuments();
              refetchAnalytics();
              setActiveTab('library');
            }}
          />
        </TabsContent>
      </Tabs>

      {isEditingDocument && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border bg-card">
            <div className="p-1">
              <DocumentMetadataForm
                file={new File([], selectedDocument.document_name)}
                onSave={handleEditSave}
                onCancel={() => {
                  setIsEditingDocument(false);
                  setSelectedDocument(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <DocumentTacticLinker
        document={selectedDocument}
        isOpen={isTacticLinkerOpen}
        onClose={() => {
          setIsTacticLinkerOpen(false);
          setSelectedDocument(null);
        }}
        onLinksUpdated={refetchDocuments}
      />
      </div>
    </SidebarLayout>
  );
}

