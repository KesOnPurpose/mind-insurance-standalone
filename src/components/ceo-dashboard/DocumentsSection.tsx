// Documents Section Component
// Drag-drop upload zone, document list with summaries

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { cn } from '@/lib/utils';
import type { CEODocument, CEODocumentCategory, CEODocumentUpload } from '@/types/ceoDashboard';
import { formatFileSize, getCategoryDisplayName } from '@/services/ceoDocumentsService';
import {
  FileUp,
  File,
  FileText,
  Trash2,
  Download,
  Eye,
  Loader2,
  Upload,
  FolderOpen,
  Sparkles,
  X,
} from 'lucide-react';

interface DocumentsSectionProps {
  documents: CEODocument[];
  onUpload: (upload: CEODocumentUpload) => Promise<CEODocument>;
  onDelete: (documentId: string) => Promise<void>;
  isUploading: boolean;
}

export function DocumentsSection({
  documents,
  onUpload,
  onDelete,
  isUploading,
}: DocumentsSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CEODocumentCategory>('assessment');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category options
  const categoryOptions: { value: CEODocumentCategory; label: string; icon: React.ReactNode }[] = [
    { value: 'assessment', label: 'Assessment', icon: <FileText className="h-4 w-4" /> },
    { value: 'financial', label: 'Financial', icon: <File className="h-4 w-4" /> },
    { value: 'strategic', label: 'Strategic', icon: <File className="h-4 w-4" /> },
    { value: 'personal', label: 'Personal', icon: <File className="h-4 w-4" /> },
    { value: 'other', label: 'Other', icon: <File className="h-4 w-4" /> },
  ];

  // Handle file selection
  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        await onUpload({
          file,
          category: selectedCategory,
          document_name: file.name,
        });
      }
    },
    [onUpload, selectedCategory]
  );

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteConfirm);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, onDelete]);

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string | undefined) => {
    if (mimeType?.includes('pdf')) return <FileText className="h-8 w-8 text-red-400" />;
    if (mimeType?.includes('image')) return <FileText className="h-8 w-8 text-green-400" />;
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel'))
      return <FileText className="h-8 w-8 text-green-500" />;
    return <File className="h-8 w-8 text-mi-cyan" />;
  };

  // Get category badge color
  const getCategoryColor = (category: CEODocumentCategory) => {
    const colors: Record<CEODocumentCategory, string> = {
      assessment: 'bg-purple-500/20 text-purple-300',
      financial: 'bg-green-500/20 text-green-300',
      strategic: 'bg-blue-500/20 text-blue-300',
      personal: 'bg-pink-500/20 text-pink-300',
      other: 'bg-gray-500/20 text-gray-300',
    };
    return colors[category] || colors.other;
  };

  // Group documents by category
  const documentsByCategory = documents.reduce(
    (acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
    },
    {} as Record<CEODocumentCategory, CEODocument[]>
  );

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-mi-cyan/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-lg bg-mi-cyan/10">
              <FileUp className="h-5 w-5 text-mi-cyan" />
            </div>
            Upload Documents
          </CardTitle>
          <CardDescription className="text-white/60">
            Upload assessments, reports, or other documents for MIO to analyze
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-white/70">Document Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as CEODocumentCategory)}
            >
              <SelectTrigger className="bg-mi-navy border-mi-cyan/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-mi-navy-light border-mi-cyan/30">
                {categoryOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-white hover:bg-mi-cyan/10 focus:bg-mi-cyan/10"
                  >
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300',
              isDragging
                ? 'border-mi-cyan bg-mi-cyan/10 scale-[1.02]'
                : 'border-mi-cyan/30 hover:border-mi-cyan/50 hover:bg-mi-cyan/5'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg"
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 text-mi-cyan animate-spin" />
                <p className="text-white/70">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div
                  className={cn(
                    'p-4 rounded-full transition-colors',
                    isDragging ? 'bg-mi-cyan/20' : 'bg-mi-cyan/10'
                  )}
                >
                  <Upload className="h-8 w-8 text-mi-cyan" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                  </p>
                  <p className="text-white/50 text-sm mt-1">
                    or click to browse (max 50MB)
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-white/10 text-white/60 border-0">PDF</Badge>
                  <Badge className="bg-white/10 text-white/60 border-0">DOC</Badge>
                  <Badge className="bg-white/10 text-white/60 border-0">XLS</Badge>
                  <Badge className="bg-white/10 text-white/60 border-0">Images</Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-mi-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-lg bg-mi-gold/10">
              <FolderOpen className="h-5 w-5 text-mi-gold" />
            </div>
            Your Documents
            <Badge className="ml-2 bg-mi-cyan/20 text-mi-cyan border-0">
              {documents.length}
            </Badge>
          </CardTitle>
          <CardDescription className="text-white/60">
            Documents uploaded for MIO context
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {documents.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No documents uploaded yet</p>
              <p className="text-sm mt-1">
                Upload assessments, reports, or other files for MIO to learn from
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(documentsByCategory).map(([category, docs]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                    {getCategoryDisplayName(category as CEODocumentCategory)}
                    <Badge className="bg-white/10 text-white/50 border-0 text-xs">
                      {docs.length}
                    </Badge>
                  </h4>
                  <div className="space-y-2">
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-start gap-4 p-4 rounded-xl bg-mi-navy border border-mi-cyan/20 group hover:border-mi-cyan/40 transition-colors"
                      >
                        {/* File Icon */}
                        <div className="flex-shrink-0 p-2 rounded-lg bg-mi-navy-light">
                          {getFileIcon(doc.mime_type)}
                        </div>

                        {/* Document Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="text-white font-medium truncate">
                                {doc.document_name}
                              </h5>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={cn('border-0 text-xs', getCategoryColor(doc.category))}>
                                  {getCategoryDisplayName(doc.category)}
                                </Badge>
                                {doc.file_size_bytes && (
                                  <span className="text-white/40 text-xs">
                                    {formatFileSize(doc.file_size_bytes)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {doc.document_url && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-mi-cyan hover:text-mi-cyan hover:bg-mi-cyan/10"
                                  onClick={() => window.open(doc.document_url, '_blank')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => setDeleteConfirm(doc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Summary */}
                          {doc.extracted_summary && (
                            <div className="mt-3 p-3 rounded-lg bg-mi-navy-light/50 border border-mi-cyan/10">
                              <div className="flex items-center gap-1 text-mi-cyan text-xs mb-1">
                                <Sparkles className="h-3 w-3" />
                                AI Summary
                              </div>
                              <p className="text-white/70 text-sm line-clamp-2">
                                {doc.extracted_summary}
                              </p>
                            </div>
                          )}

                          {/* Key Points */}
                          {doc.extracted_key_points && doc.extracted_key_points.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {doc.extracted_key_points.slice(0, 3).map((point, i) => (
                                <Badge
                                  key={i}
                                  className="bg-mi-cyan/10 text-mi-cyan/80 border-0 text-xs"
                                >
                                  {point}
                                </Badge>
                              ))}
                              {doc.extracted_key_points.length > 3 && (
                                <Badge className="bg-white/10 text-white/50 border-0 text-xs">
                                  +{doc.extracted_key_points.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-mi-navy-light border-mi-cyan/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Document</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-transparent border-mi-cyan/30 text-white hover:bg-mi-cyan/10"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default DocumentsSection;
