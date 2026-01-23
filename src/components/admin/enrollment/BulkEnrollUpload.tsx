// ============================================================================
// FEAT-GH-019: Bulk Enroll Upload Component
// ============================================================================
// CSV import with preview and validation for bulk enrollment
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Loader2,
  X,
  FileWarning,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBulkEnrollLearners } from '@/hooks/useAdminPrograms';
import type { BulkEnrollRow, BulkEnrollPreview, BulkEnrollResult } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface BulkEnrollUploadProps {
  programId: string;
  programTitle?: string;
  onComplete?: () => void;
}

type UploadState = 'idle' | 'parsing' | 'preview' | 'uploading' | 'complete' | 'error';

// ============================================================================
// CSV Parser
// ============================================================================

const parseCSV = (content: string): BulkEnrollPreview => {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    return { valid_rows: [], invalid_rows: [], total_rows: 0 };
  }

  // Detect header row
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('email') || firstLine.includes('name');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const valid_rows: BulkEnrollRow[] = [];
  const invalid_rows: { row: number; email: string; error: string }[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const seenEmails = new Set<string>();

  dataLines.forEach((line, index) => {
    const rowNum = hasHeader ? index + 2 : index + 1;

    // Parse CSV line (handle quoted values)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const email = values[0]?.toLowerCase().trim();
    const name = values[1]?.trim();

    if (!email) {
      invalid_rows.push({ row: rowNum, email: '', error: 'Empty email' });
      return;
    }

    if (!emailRegex.test(email)) {
      invalid_rows.push({ row: rowNum, email, error: 'Invalid email format' });
      return;
    }

    if (seenEmails.has(email)) {
      invalid_rows.push({ row: rowNum, email, error: 'Duplicate email' });
      return;
    }

    seenEmails.add(email);
    valid_rows.push({ email, name: name || undefined });
  });

  return {
    valid_rows,
    invalid_rows,
    total_rows: dataLines.length,
  };
};

// ============================================================================
// Download Template
// ============================================================================

const downloadTemplate = () => {
  const template = 'email,name\njohn@example.com,John Doe\njane@example.com,Jane Smith';
  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'enrollment-template.csv';
  a.click();
  URL.revokeObjectURL(url);
};

// ============================================================================
// Main Component
// ============================================================================

export const BulkEnrollUpload = ({
  programId,
  programTitle,
  onComplete,
}: BulkEnrollUploadProps) => {
  const { bulkEnroll, isEnrolling, progress } = useBulkEnrollLearners();

  const [state, setState] = useState<UploadState>('idle');
  const [preview, setPreview] = useState<BulkEnrollPreview | null>(null);
  const [result, setResult] = useState<BulkEnrollResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      setState('error');
      return;
    }

    setState('parsing');
    setError(null);

    try {
      const content = await file.text();
      const parsed = parseCSV(content);

      if (parsed.valid_rows.length === 0 && parsed.invalid_rows.length === 0) {
        setError('The CSV file appears to be empty');
        setState('error');
        return;
      }

      setPreview(parsed);
      setState('preview');
    } catch (err) {
      console.error('Error parsing CSV:', err);
      setError('Failed to parse the CSV file');
      setState('error');
    }
  }, []);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // Reset input value so same file can be selected again
      e.target.value = '';
    },
    [handleFile]
  );

  // Handle upload
  const handleUpload = async () => {
    if (!preview || preview.valid_rows.length === 0) return;

    setState('uploading');

    const uploadResult = await bulkEnroll(programId, preview.valid_rows);

    setResult(uploadResult);
    setState('complete');
    onComplete?.();
  };

  // Reset to start over
  const handleReset = () => {
    setState('idle');
    setPreview(null);
    setResult(null);
    setError(null);
  };

  // Display count for preview
  const previewRows = useMemo(() => {
    return preview?.valid_rows.slice(0, 10) || [];
  }, [preview]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Bulk Enrollment
            </CardTitle>
            <CardDescription>
              Import learners from a CSV file
              {programTitle && ` for "${programTitle}"`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Idle State - Dropzone */}
        {(state === 'idle' || state === 'error') && (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div
              className={cn(
                'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">
                Drop your CSV file here, or click to browse
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                CSV should have columns: email (required), name (optional)
              </p>
            </div>
          </>
        )}

        {/* Parsing State */}
        {state === 'parsing' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Parsing CSV file...</p>
          </div>
        )}

        {/* Preview State */}
        {state === 'preview' && preview && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4">
              <Badge variant="default" className="text-sm">
                <CheckCircle className="mr-1 h-3 w-3" />
                {preview.valid_rows.length} valid
              </Badge>
              {preview.invalid_rows.length > 0 && (
                <Badge variant="destructive" className="text-sm">
                  <XCircle className="mr-1 h-3 w-3" />
                  {preview.invalid_rows.length} invalid
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Total: {preview.total_rows} rows
              </span>
            </div>

            {/* Invalid Rows Alert */}
            {preview.invalid_rows.length > 0 && (
              <Alert variant="destructive">
                <FileWarning className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">
                    {preview.invalid_rows.length} rows will be skipped:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 max-h-24 overflow-y-auto">
                    {preview.invalid_rows.slice(0, 5).map((row, i) => (
                      <li key={i}>
                        Row {row.row}: {row.email || '(empty)'} - {row.error}
                      </li>
                    ))}
                    {preview.invalid_rows.length > 5 && (
                      <li>...and {preview.invalid_rows.length - 5} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview Table */}
            {preview.valid_rows.length > 0 && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">
                          {row.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.name || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {preview.valid_rows.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center py-2 border-t">
                    Showing first 10 of {preview.valid_rows.length} rows
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={preview.valid_rows.length === 0}
              >
                <Upload className="mr-2 h-4 w-4" />
                Enroll {preview.valid_rows.length} Learners
              </Button>
            </div>
          </div>
        )}

        {/* Uploading State */}
        {state === 'uploading' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span>Enrolling learners...</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              Please do not close this page while enrolling
            </p>
          </div>
        )}

        {/* Complete State */}
        {state === 'complete' && result && (
          <div className="space-y-4">
            {/* Success Summary */}
            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Enrollment Complete
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Successfully enrolled {result.success_count} learners
                </p>
              </div>
            </div>

            {/* Failures */}
            {result.failed_count > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">
                    {result.failed_count} enrollments failed:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 max-h-32 overflow-y-auto">
                    {result.failures.map((failure, i) => (
                      <li key={i}>
                        {failure.email}: {failure.reason}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-end">
              <Button onClick={handleReset}>
                Upload Another CSV
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkEnrollUpload;
