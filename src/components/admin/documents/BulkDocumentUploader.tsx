// BulkDocumentUploader Component
// Multi-file upload with AI-powered metadata extraction

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useBulkUpload } from '@/hooks/useBulkUpload';
import { MetadataSuggestionPanel } from './MetadataSuggestionPanel';
import { BulkActionToolbar } from './BulkActionToolbar';

interface Props {
  onComplete?: () => void;
}

export const BulkDocumentUploader = ({ onComplete }: Props) => {
  const {
    state,
    isProcessing,
    initializeUpload,
    analyzeFiles,
    applyBatchAction,
    uploadAll,
    reset,
    selectFile,
    removeFile,
  } = useBulkUpload();

  const [showPanel, setShowPanel] = useState(false);

  /**
   * Handle file drop
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      await initializeUpload(acceptedFiles);
    },
    [initializeUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        '.docx',
      ],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    multiple: true,
    maxSize: 100 * 1024 * 1024, // 100MB max
  });

  /**
   * Start AI analysis
   */
  const handleAnalyze = async () => {
    await analyzeFiles();
    setShowPanel(true);
  };

  /**
   * Handle file selection for detailed view
   */
  const handleFileClick = (index: number) => {
    selectFile(index);
    setShowPanel(true);
  };

  /**
   * Handle upload completion
   */
  const handleUpload = async () => {
    await uploadAll();
    if (state.currentStep === 'complete') {
      setTimeout(() => {
        reset();
        onComplete?.();
      }, 2000);
    }
  };

  /**
   * Calculate progress percentage
   */
  const getProgressPercentage = () => {
    if (state.currentStep === 'analyzing') {
      return (state.progress.analyzed / state.progress.total) * 100;
    }
    if (state.currentStep === 'uploading') {
      return (state.progress.uploaded / state.progress.total) * 100;
    }
    return 0;
  };

  /**
   * Get status badge for file
   */
  const getStatusBadge = (
    status: string,
    needsReview?: boolean,
    error?: string | null
  ) => {
    if (error) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Duplicate
        </Badge>
      );
    }

    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'analyzing':
        return (
          <Badge variant="secondary" className="gap-1 animate-pulse">
            <Sparkles className="h-3 w-3" />
            Analyzing
          </Badge>
        );
      case 'analyzed':
        return needsReview ? (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Review
          </Badge>
        ) : (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Ready
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Render different states
  if (state.currentStep === 'upload' && state.files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Document Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {isDragActive
                ? 'Drop files here'
                : 'Drag & drop documents or click to browse'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supports PDF, DOCX, PNG, JPG (up to 100MB each, 50+ files)
            </p>
            <Button type="button">Select Files</Button>
          </div>

          <Alert className="mt-4">
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              AI will automatically analyze documents and suggest metadata
              (category, description, states, etc.)
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Card */}
      {(state.currentStep === 'analyzing' ||
        state.currentStep === 'uploading') && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {state.currentStep === 'analyzing'
                    ? 'Analyzing documents...'
                    : 'Uploading documents...'}
                </span>
                <span>
                  {state.currentStep === 'analyzing'
                    ? `${state.progress.analyzed} / ${state.progress.total}`
                    : `${state.progress.uploaded} / ${state.progress.total}`}
                </span>
              </div>
              <Progress value={getProgressPercentage()} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* File List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Files ({state.files.length})
            </CardTitle>
            <div className="flex gap-2">
              {state.currentStep === 'upload' && (
                <Button
                  onClick={handleAnalyze}
                  disabled={isProcessing || state.files.length === 0}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Analyze with AI
                </Button>
              )}
              {state.currentStep === 'reviewing' && (
                <Button
                  onClick={handleUpload}
                  disabled={
                    isProcessing ||
                    state.files.filter((f) => f.status === 'approved')
                      .length === 0
                  }
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload All (
                  {state.files.filter((f) => f.status === 'approved').length})
                </Button>
              )}
              {state.currentStep === 'complete' && (
                <Button onClick={reset} variant="outline">
                  Upload More
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Batch Actions Toolbar */}
          {state.currentStep === 'reviewing' && (
            <div className="mb-4">
              <BulkActionToolbar onApplyBatchAction={applyBatchAction} />
            </div>
          )}

          {/* File List */}
          <div className="space-y-2">
            {state.files.map((fileState, index) => (
              <div
                key={index}
                onClick={() =>
                  fileState.status === 'analyzed' && handleFileClick(index)
                }
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  fileState.status === 'analyzed'
                    ? 'cursor-pointer hover:bg-accent'
                    : ''
                } ${
                  state.selectedFileIndex === index ? 'border-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileState.file.name}
                    </p>
                    {fileState.cleanedFilename &&
                      fileState.cleanedFilename !== fileState.file.name && (
                        <p className="text-xs text-muted-foreground">
                          → {fileState.cleanedFilename}
                        </p>
                      )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(
                    fileState.status,
                    fileState.suggestion?.needsReview,
                    fileState.error
                  )}
                  {state.currentStep === 'upload' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Errors Summary */}
          {state.errors.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {state.errors.length} error(s) occurred. Check individual files
                for details.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Metadata Review Panel */}
      {showPanel && state.selectedFileIndex !== null && (
        <MetadataSuggestionPanel
          fileState={state.files[state.selectedFileIndex]}
          fileIndex={state.selectedFileIndex}
          onClose={() => {
            setShowPanel(false);
            selectFile(null);
          }}
        />
      )}
    </div>
  );
};
