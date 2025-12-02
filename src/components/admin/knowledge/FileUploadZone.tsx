// ============================================================================
// FILE UPLOAD ZONE COMPONENT
// ============================================================================
// Drag-and-drop file upload with preview and validation
// Supports: PDF, DOCX, DOC, TXT, MD, CSV
// ============================================================================

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileText,
  File,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// Supported file types
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'text/csv': ['.csv'],
};

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface FileUploadZoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  maxSize?: number;
  acceptedTypes?: string[];
}

export function FileUploadZone({
  file,
  onFileChange,
  disabled,
  maxSize = MAX_FILE_SIZE,
  acceptedTypes = ACCEPTED_EXTENSIONS,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'csv':
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
      case 'txt':
      case 'md':
        return <File className="h-8 w-8 text-gray-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxSize) {
        return `File too large. Maximum size is ${formatFileSize(maxSize)}`;
      }

      // Check file extension
      const ext = '.' + file.name.toLowerCase().split('.').pop();
      if (!acceptedTypes.includes(ext)) {
        return `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`;
      }

      return null;
    },
    [maxSize, acceptedTypes]
  );

  const handleFile = useCallback(
    (selectedFile: File) => {
      setError(null);

      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      onFileChange(selectedFile);
    },
    [validateFile, onFileChange]
  );

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

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleRemove = () => {
    onFileChange(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // File is selected - show preview
  if (file) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
          {getFileIcon(file.name)}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No file - show upload zone
  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer',
          isDragging && !disabled && 'border-primary bg-primary/5',
          !isDragging && !disabled && 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-destructive'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        <Upload
          className={cn(
            'h-10 w-10 mb-4',
            isDragging ? 'text-primary' : 'text-muted-foreground'
          )}
        />

        <p className="text-sm font-medium text-center">
          {isDragging ? (
            'Drop file here'
          ) : (
            <>
              <span className="text-primary">Click to upload</span> or drag and drop
            </>
          )}
        </p>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          PDF, DOCX, DOC, TXT, MD, CSV (max {formatFileSize(maxSize)})
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}

// Compact version for inline use
interface CompactFileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export function CompactFileUpload({
  file,
  onFileChange,
  disabled,
}: CompactFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileChange(files[0]);
    }
  };

  if (file) {
    return (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onFileChange(null)}
          disabled={disabled}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        <Upload className="h-4 w-4 mr-2" />
        Choose File
      </Button>
    </>
  );
}

// Multiple file upload zone
interface MultiFileUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSize?: number;
}

export function MultiFileUploadZone({
  files,
  onFilesChange,
  disabled,
  maxFiles = 10,
  maxSize = MAX_FILE_SIZE,
}: MultiFileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File "${file.name}" is too large`;
    }

    const ext = '.' + file.name.toLowerCase().split('.').pop();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return `File "${file.name}" has invalid type`;
    }

    return null;
  };

  const handleFiles = (newFiles: FileList) => {
    setError(null);

    const remainingSlots = maxFiles - files.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (let i = 0; i < Math.min(newFiles.length, remainingSlots); i++) {
      const validationError = validateFile(newFiles[i]);
      if (validationError) {
        errors.push(validationError);
      } else {
        validFiles.push(newFiles[i]);
      }
    }

    if (errors.length > 0) {
      setError(errors[0]);
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleRemove = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer',
          isDragging && !disabled && 'border-primary bg-primary/5',
          !isDragging && !disabled && 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-destructive'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        <Upload className={cn('h-8 w-8 mb-2', isDragging ? 'text-primary' : 'text-muted-foreground')} />
        <p className="text-sm text-center">
          <span className="text-primary">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {files.length}/{maxFiles} files
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-2 border rounded bg-muted/30"
            >
              {getFileIcon(file.name)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
