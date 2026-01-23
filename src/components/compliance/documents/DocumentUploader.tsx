// ============================================================================
// DOCUMENT UPLOADER COMPONENT
// ============================================================================
// Drag-and-drop file uploader for compliance documents with file type
// validation, size limits, and upload progress indicators.
// ============================================================================

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
} from 'lucide-react';
import type { DocumentType } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

export interface DocumentUploaderProps {
  binderId: string;
  onUpload: (file: File, type: DocumentType, expiresAt?: Date) => Promise<void>;
  onCancel?: () => void;
  acceptedTypes?: string[];
  maxSizeBytes?: number;
  className?: string;
}

interface FilePreview {
  file: File;
  preview: string;
  type: DocumentType;
  expiresAt?: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DOCUMENT_TYPES: { value: DocumentType; label: string; icon: string }[] = [
  { value: 'license', label: 'Business License', icon: '📋' },
  { value: 'permit', label: 'Permit', icon: '📄' },
  { value: 'insurance', label: 'Insurance Certificate', icon: '🛡️' },
  { value: 'inspection', label: 'Inspection Report', icon: '🔍' },
  { value: 'lease', label: 'Lease Agreement', icon: '🏠' },
  { value: 'certification', label: 'Certification', icon: '✅' },
  { value: 'other', label: 'Other Document', icon: '📁' },
];

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <Image className="h-8 w-8 text-blue-500" />;
  }
  if (mimeType === 'application/pdf') {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  return <File className="h-8 w-8 text-gray-500" />;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentUploader({
  binderId,
  onUpload,
  onCancel,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  className = '',
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `File type ${file.type} is not supported. Please upload PDF, images, or Word documents.`;
      }
      if (file.size > maxSizeBytes) {
        return `File is too large. Maximum size is ${formatFileSize(maxSizeBytes)}.`;
      }
      return null;
    },
    [acceptedTypes, maxSizeBytes]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setUploadComplete(false);

      // Create preview URL for images
      let preview = '';
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      setSelectedFile({
        file,
        preview,
        type: 'other',
        expiresAt: undefined,
      });
    },
    [validateFile]
  );

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(
        selectedFile.file,
        selectedFile.type,
        selectedFile.expiresAt
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadComplete(true);

      // Reset after success
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadComplete(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle cancel/clear
  const handleClear = () => {
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview);
    }
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
    setUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle document type change
  const handleTypeChange = (type: DocumentType) => {
    if (selectedFile) {
      setSelectedFile({ ...selectedFile, type });
    }
  };

  // Handle expiration date change
  const handleExpirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedFile) {
      const date = e.target.value ? new Date(e.target.value) : undefined;
      setSelectedFile({ ...selectedFile, expiresAt: date });
    }
  };

  return (
    <div className={className}>
      {/* Drop Zone */}
      {!selectedFile && (
        <Card
          className={`
            border-2 border-dashed transition-colors cursor-pointer
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <CloudUpload className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {isDragging ? 'Drop file here' : 'Upload a Document'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop a file, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, images, or Word documents up to {formatFileSize(maxSizeBytes)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* File Preview */}
      {selectedFile && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              {/* File Icon/Preview */}
              <div className="shrink-0">
                {selectedFile.preview ? (
                  <img
                    src={selectedFile.preview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  getFileIcon(selectedFile.file.type)
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium truncate">
                      {selectedFile.file.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.file.size)}
                    </p>
                  </div>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={handleClear}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Document Type Selection */}
                <div className="grid gap-4 mt-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="doc-type">Document Type</Label>
                    <Select
                      value={selectedFile.type}
                      onValueChange={(v) => handleTypeChange(v as DocumentType)}
                      disabled={isUploading}
                    >
                      <SelectTrigger id="doc-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              <span>{type.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiration">Expiration Date (Optional)</Label>
                    <Input
                      id="expiration"
                      type="date"
                      value={
                        selectedFile.expiresAt
                          ? selectedFile.expiresAt.toISOString().split('T')[0]
                          : ''
                      }
                      onChange={handleExpirationChange}
                      disabled={isUploading}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Progress Bar */}
                {isUploading && (
                  <div className="mt-4 space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {uploadComplete && (
                  <div className="mt-4 flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Upload complete!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {!uploadComplete && (
              <div className="flex items-center gap-2 mt-6">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile.type}
                >
                  <Upload className="h-4 w-4 mr-1.5" />
                  {isUploading ? 'Uploading...' : 'Upload Document'}
                </Button>
                {onCancel && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleClear();
                      onCancel();
                    }}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DocumentUploader;
